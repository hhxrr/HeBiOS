# ============================================================
# hebi-install-lib.sh — 合璧OS 安装核心共享库
# 供两个前端复用:
#   hebi-installer  — dialog 全屏 TUI 图形安装向导
#   hebi-webinst    — HTML 网页安装器 (busybox httpd + CGI)
# 核心函数 hebi_do_install 完成:
#   分区表(sfdisk GPT/MBR) → 格式化 → 挂载 → 拷贝系统 → fstab/用户
#   → GRUB 双链(BIOS+UEFI) → 驱动注册 → initramfs 重打包 → sync
#
# 调用方约定 (调用 hebi_do_install 前设置的环境变量/全局变量):
#   TARGET       目标磁盘名 (如 vda / sda / nvme0n1)
#   PART_MODE    auto | auto_uefi | manual | lvm
#   FS_TYPE      ext4 | btrfs | xfs | ext2
#   SWAP_SIZE    交换分区大小 (MB)
#   USERNAME     管理员用户名
#   HB_PASSWORD  用户密码 (可空; 非空时写入已安装系统 /etc/shadow)
#   HOSTNAME     计算机名
#   DRIVERS      空格分隔的驱动标识: gpu net audio usb print bt
# 可选配置:
#   HB_LOG            安装日志 (默认 /var/log/hebi-install.log)
#   HB_FAIL_FILE      失败标志文件 (默认 /tmp/hebi-inst-fail)
#   HB_RESULT_FILE    结果文件 (默认 /tmp/hebi-inst-result)
#   HB_PROGRESS_FILE  进度文件 (默认 /tmp/hebi-inst-progress)
#   HB_PROGRESS_FN    进度回调函数名 (默认 hb_progress_file)
#                     —— 函数签名为 fn(百分比, 消息)
#                     TUI 传 gauge 管道回显函数, Web 传文件写入函数
#
# 注意: busybox ash 对自身拥有的 applet 名 (fdisk/mkswap/chpasswd 等)
# 会绕过 PATH 直接内置执行 busybox 版 (不支持 GPT 的 g 命令 /
# chpasswd 的 -R), 因此本库凡调用 util-linux 工具一律用绝对路径
# /usr/sbin/xxx。
# ============================================================
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

HB_LOG=${HB_LOG:-/var/log/hebi-install.log}
HB_FAIL_FILE=${HB_FAIL_FILE:-/tmp/hebi-inst-fail}
HB_RESULT_FILE=${HB_RESULT_FILE:-/tmp/hebi-inst-result}
HB_PROGRESS_FILE=${HB_PROGRESS_FILE:-/tmp/hebi-inst-progress}
HB_MNT=/mnt/target

hb_log() { echo "[$(date '+%H:%M:%S')] $*" >> $HB_LOG 2>/dev/null; }

# 默认进度回调: 追加 "百分比|消息" 行到 $HB_PROGRESS_FILE
hb_progress_file() {
    echo "$1|$2" >> $HB_PROGRESS_FILE 2>/dev/null
}
HB_PROGRESS_FN=${HB_PROGRESS_FN:-hb_progress_file}
hb_pct() { "$HB_PROGRESS_FN" "$1" "$2"; }

# 失败传出: 写原因到标志文件并退出当前 (子)shell —— 子 shell 的 exit 1
# 不会传回父 shell, 故用标志文件机制 (曾出现分区表没写盘却报安装完成
# 的假成功 bug, 此后所有失败路径必须经此函数)
hb_fail() { echo "$*" > $HB_FAIL_FILE; hb_log "失败: $*"; exit 1; }

# ==================== 安装核心 (真实执行) ====================
# 在 (子)shell 中调用; 进度经 HB_PROGRESS_FN 回调输出,
# 结果写入 HB_RESULT_FILE (STATUS=OK 时):
#   ROOT_PART / ESP_PART / SWAP_PART / FS_TYPE / USERNAME /
#   HOSTNAME / BOOT_NOTE
hebi_do_install() {
    mkdir -p /var/log; : > $HB_LOG
    rm -f "$HB_FAIL_FILE" "$HB_RESULT_FILE" "$HB_PROGRESS_FILE"
    hb_log "==== hebi_do_install 启动: disk=$TARGET mode=$PART_MODE fs=$FS_TYPE swap=$SWAP_SIZE user=$USERNAME host=$HOSTNAME ===="

    [ -n "$TARGET" ] || hb_fail "未指定目标磁盘"
    case "$TARGET" in *[!a-z0-9]*) hb_fail "目标磁盘名非法: $TARGET" ;; esac
    [ -b "/dev/$TARGET" ] || hb_fail "目标磁盘 /dev/$TARGET 不存在"
    case "$FS_TYPE" in ext4|btrfs|xfs|ext2) ;; *) FS_TYPE=ext4 ;; esac
    case "$SWAP_SIZE" in ''|*[!0-9]*) SWAP_SIZE=2048 ;; esac
    [ "$SWAP_SIZE" -lt 128 ] 2>/dev/null && SWAP_SIZE=2048
    [ -n "$USERNAME" ] || USERNAME=hebios
    [ -n "$HOSTNAME" ] || HOSTNAME=hebios-pc

    # ---- swap 容量钳制 (磁盘容量感知) ----
    # 背景: sfdisk 脚本模式下, 请求的分区装不下时不会报错, 而是静默创建
    # 0 扇区分区 —— 该分区设备节点不出现, mkswap 报 "No such file or
    # directory", 安装中止于 12% (小磁盘 + 默认 swap 2048MB 必现:
    # 2GiB 磁盘扣除 1MiB 对齐后仅剩 2047MiB, 装不下 2048MiB 的 swap)。
    # 规则: swap ≤ 磁盘总量 25%, 且至少给根分区留 1GiB (GPT 方案另需
    # 512MiB ESP + 2MiB bios-boot); 下限 128MB。前端滑块同步收紧,
    # 此处为权威兜底 (TUI 与网页安装器共用)。
    DISK_SECTORS=$(awk -v d="$TARGET" '$4==d {print $3}' /proc/partitions 2>/dev/null)
    case "$DISK_SECTORS" in ''|*[!0-9]*) DISK_SECTORS=0 ;; esac
    if [ "$DISK_SECTORS" -gt 4096 ]; then
        DISK_MB=$((DISK_SECTORS / 2048))
        RESERVE_MB=1024
        [ "$PART_MODE" = "auto_uefi" ] && RESERVE_MB=1536
        [ "$PART_MODE" = "manual" ] && RESERVE_MB=1536
        MAX_SWAP=$((DISK_MB / 4))
        [ $((DISK_MB - RESERVE_MB)) -lt "$MAX_SWAP" ] && MAX_SWAP=$((DISK_MB - RESERVE_MB))
        [ "$MAX_SWAP" -lt 128 ] && MAX_SWAP=128
        if [ "$SWAP_SIZE" -gt "$MAX_SWAP" ] 2>/dev/null; then
            hb_log "swap 由 ${SWAP_SIZE}MB 钳制为 ${MAX_SWAP}MB (磁盘 ${DISK_MB}MB)"
            SWAP_SIZE=$MAX_SWAP
        fi
    fi

    # 分区名在子 shell 外预先算好 —— 子 shell ( ... ) 内的赋值不会传回
    # 父 shell, 否则完成对话框的"安装位置/ESP"会是空值
    PART_SUFFIX=""
    case "$TARGET" in nvme*|mmcblk*) PART_SUFFIX="p";; esac
    ESP_PART=""; SWAP_PART=""; ROOT_PART=""
    if [ "$PART_MODE" = "auto_uefi" ] || [ "$PART_MODE" = "manual" ]; then
        # GPT 布局: ESP(1) + BIOS引导(2) + swap(3) + root(4)
        # BIOS Boot 分区(2M, 类型 bios-boot) 是 GRUB BIOS 版嵌入 core.img
        # 的落脚点 —— 缺它时 grub-install --target=i386-pc 报
        # "no BIOS Boot Partition; embedding won't be possible" 而失败。
        # 有了它, 同一块 GPT 盘在 UEFI 与传统 BIOS 固件下均可启动(双模)。
        ESP_PART="${TARGET}${PART_SUFFIX}1"; SWAP_PART="${TARGET}${PART_SUFFIX}3"; ROOT_PART="${TARGET}${PART_SUFFIX}4"
    else
        SWAP_PART="${TARGET}${PART_SUFFIX}1"; ROOT_PART="${TARGET}${PART_SUFFIX}2"; ESP_PART=""
    fi

    hb_pct 3 "正在创建分区表 ..."
    /bin/busybox sleep 0.3
    if [ "$PART_MODE" = "auto_uefi" ] || [ "$PART_MODE" = "manual" ]; then
        # GPT + ESP(512M) + BIOS引导(2M) + swap + root —— sfdisk 脚本化分区
        # (旧方案 fdisk 交互序列会被 busybox applet 拦截, 且 util-linux
        #  fdisk 的 t 命令在单分区时默认选中不问分区号, 交互序列天然错位)
        printf "label: gpt\nsize=512MiB, type=uefi\nsize=2MiB, type=bios-boot\nsize=%sMiB, type=swap\ntype=linux\n" "$SWAP_SIZE" \
            | /usr/sbin/sfdisk -W always /dev/$TARGET >>$HB_LOG 2>&1 \
            || hb_fail "分区表创建失败 (sfdisk GPT)"
        /bin/busybox sleep 0.5
        [ -b /dev/$ROOT_PART ] || hb_fail "分区设备 /dev/$ROOT_PART 未出现 (分区表未生效)"
    else
        # MBR: swap + root
        printf "label: dos\nsize=%sMiB, type=82\ntype=83\n" "$SWAP_SIZE" \
            | /usr/sbin/sfdisk -W always /dev/$TARGET >>$HB_LOG 2>&1 \
            || hb_fail "MBR 分区表创建失败 (sfdisk dos)"
        /bin/busybox sleep 0.5
        [ -b /dev/$ROOT_PART ] || hb_fail "分区设备 /dev/$ROOT_PART 未出现 (分区表未生效)"
    fi
    /bin/busybox sleep 0.5

    hb_pct 12 "正在格式化文件系统 ($FS_TYPE) ..."
    # ESP 仅 GPT 方案存在 —— 必须用 if 而非 `[ -n ... ] && cmd || fail`:
    # 后者在 ESP 为空时 && 短路返回非0, 反而触发 || hb_fail,
    # 导致 MBR 自动模式永远报 "EFI 系统分区 (/dev/) 格式化失败" (已实证)
    if [ -n "$ESP_PART" ]; then
        /usr/sbin/mkfs.vfat -F 32 /dev/$ESP_PART >>$HB_LOG 2>&1 \
            || hb_fail "EFI 系统分区 (/dev/$ESP_PART) 格式化失败"
    fi
    /usr/sbin/mkfs.$FS_TYPE -F -q /dev/$ROOT_PART >>$HB_LOG 2>&1 \
        || /usr/sbin/mkfs.ext4 -F -q /dev/$ROOT_PART >>$HB_LOG 2>&1 \
        || hb_fail "根分区 (/dev/$ROOT_PART) 格式化失败 ($FS_TYPE)"
    if [ -n "$SWAP_PART" ]; then
        /usr/sbin/mkswap /dev/$SWAP_PART >>$HB_LOG 2>&1 \
            || hb_fail "交换分区 (/dev/$SWAP_PART) 创建失败"
    fi
    /bin/busybox sleep 0.5

    hb_pct 22 "正在挂载目标分区 ..."
    mkdir -p $HB_MNT
    mount /dev/$ROOT_PART $HB_MNT 2>>$HB_LOG || hb_fail "挂载根分区 /dev/$ROOT_PART 失败"
    mkdir -p $HB_MNT/boot/efi
    [ -n "$ESP_PART" ] && mount /dev/$ESP_PART $HB_MNT/boot/efi 2>>$HB_LOG
    /bin/busybox sleep 0.3

    hb_pct 30 "正在复制系统文件 ..."
    for d in bin sbin lib lib64 usr etc opt var root home srv; do
        [ -d /$d ] && cp -a /$d $HB_MNT/ 2>>$HB_LOG
    done
    # /init 必须单独拷贝 —— 它不在上面的目录清单里, 但它是生成 initramfs
    # 的入口: 缺了它, 安装后启动时内核在 initramfs 里找不到 /init, 只能
    # 回退"直接挂真实根", 仅当磁盘控制器驱动是内核 builtin (virtio) 时才
    # 碰巧能起; VMware SATA(ahci)/NVMe/LSI-SCSI(mptspi) 全是模块 →
    # 装好的系统在 VMware/真实硬件上直接 kernel panic (无法挂载根分区)
    cp -a /init $HB_MNT/ 2>>$HB_LOG
    mkdir -p $HB_MNT/proc $HB_MNT/sys $HB_MNT/dev $HB_MNT/run $HB_MNT/tmp $HB_MNT/mnt $HB_MNT/boot
    cp -a /boot/vmlinuz $HB_MNT/boot/ 2>>$HB_LOG
    cp -a /boot/splash-frames $HB_MNT/boot/ 2>>$HB_LOG
    /bin/busybox sleep 0.5

    hb_pct 52 "正在写入系统配置 ..."
    {
        echo "# /etc/fstab — 合璧OS (生成于安装向导)"
        echo "/dev/$ROOT_PART / $FS_TYPE defaults 0 1"
        [ -n "$ESP_PART" ] && echo "/dev/$ESP_PART /boot/efi vfat umask=0077 0 1"
        [ -n "$SWAP_PART" ] && echo "/dev/$SWAP_PART none swap sw 0 0"
    } > $HB_MNT/etc/fstab
    echo "$USERNAME" > $HB_MNT/etc/hebi-user
    echo "$HOSTNAME" > $HB_MNT/etc/hostname
    # ---- 中文本地化 (开箱即用中文环境, 效仿 Deepin 一键装机体验) ----
    # 语言环境: zh_CN.UTF-8 (locale.conf 供登录 shell 读取; default/locale
    # 与 environment 双保险, grep 防重复追加)
    echo "LANG=zh_CN.UTF-8" > $HB_MNT/etc/locale.conf
    mkdir -p $HB_MNT/etc/default
    echo "LANG=zh_CN.UTF-8" > $HB_MNT/etc/default/locale
    grep -q "^LANG=" $HB_MNT/etc/environment 2>/dev/null \
        || echo "LANG=zh_CN.UTF-8" >> $HB_MNT/etc/environment 2>/dev/null
    # 时区: 中国标准时间 (zoneinfo 由介质提供)
    echo "Asia/Shanghai" > $HB_MNT/etc/timezone
    [ -f /usr/share/zoneinfo/Asia/Shanghai ] \
        && cp /usr/share/zoneinfo/Asia/Shanghai $HB_MNT/etc/localtime 2>>$HB_LOG
    # 键盘/控制台: us 物理布局 + UTF-8; 中文输入由桌面输入法提供
    echo "KEYMAP=us" > $HB_MNT/etc/vconsole.conf
    hb_log "本地化配置: LANG=zh_CN.UTF-8 时区=Asia/Shanghai 键盘=us (中文包就绪)"
    # 用户账户: 介质模板已含 hebios (uid 1000), 自定义用户名才追加,
    # 避免 passwd 出现重复条目 (重复条目会让后续登录取错行)
    grep -q "^$USERNAME:" $HB_MNT/etc/passwd 2>/dev/null || \
        echo "$USERNAME:x:1000:1000:$USERNAME:/home/$USERNAME:/bin/sh" >> $HB_MNT/etc/passwd 2>/dev/null
    grep -q "^$USERNAME:" $HB_MNT/etc/group 2>/dev/null || \
        echo "$USERNAME:x:1000:" >> $HB_MNT/etc/group 2>/dev/null
    mkdir -p $HB_MNT/home/$USERNAME
    # 用户密码: busybox mkpasswd 生成 sha512 哈希, 直接改写 shadow 密码字段
    # (不用 chpasswd -R: Ubuntu 版 chpasswd 依赖 PAM, chroot 内无
    #  /etc/pam.d/chpasswd, pam_start 必败 —— 且失败信息被 2>/dev/null
    #  吞掉, 表现为"安装成功但用户永远无密码"的假成功, E2E 已实证)
    if [ -n "$HB_PASSWORD" ]; then
        HASH=$(/bin/busybox mkpasswd -m sha512 "$HB_PASSWORD" 2>/dev/null)
        if [ -n "$HASH" ]; then
            if grep -q "^$USERNAME:" $HB_MNT/etc/shadow 2>/dev/null; then
                awk -v u="$USERNAME" -v h="$HASH" 'BEGIN{FS=OFS=":"} $1==u{$2=h} {print}' \
                    $HB_MNT/etc/shadow > $HB_MNT/etc/shadow.hb \
                    && cat $HB_MNT/etc/shadow.hb > $HB_MNT/etc/shadow \
                    && rm -f $HB_MNT/etc/shadow.hb
            else
                echo "$USERNAME:$HASH:19000:0:99999:7:::" >> $HB_MNT/etc/shadow 2>/dev/null
            fi
            if grep "^$USERNAME:" $HB_MNT/etc/shadow 2>/dev/null | grep -q ':\$6\$'; then
                hb_log "用户 $USERNAME 密码已写入 /etc/shadow (sha512)"
            else
                hb_log "警告: 密码写入校验失败 ($USERNAME)"
            fi
        else
            hb_log "警告: mkpasswd 生成哈希失败, 用户将无密码登录"
        fi
    fi
    /bin/busybox sleep 0.3

    hb_pct 62 "正在安装引导程序 (GRUB BIOS+UEFI) ..."
    mkdir -p $HB_MNT/boot/grub
    cp -a /boot/grub/theme $HB_MNT/boot/grub/ 2>/dev/null
    # 已安装系统专用 grub.cfg (不再包含安装介质入口, root= 指向真实分区)
    if [ "$PART_MODE" = "auto_uefi" ] || [ "$PART_MODE" = "manual" ]; then
        GRUB_ROOT="(hd0,gpt4)"      # GPT: ESP(1) + bios_grub(2) + swap(3) + root(4)
    else
        GRUB_ROOT="(hd0,msdos2)"    # MBR: swap(1) + root(2)
    fi
    cat > $HB_MNT/boot/grub/grub.cfg <<GRUBCFG
# 合璧OS HeBi OS 5.0 — 已安装系统 GRUB 配置 (安装向导生成)
set default=0
set timeout=5

insmod all_video
insmod gfxterm
insmod png
insmod ext2
set root=$GRUB_ROOT
terminal_output gfxterm

loadfont (\$root)/boot/grub/theme/HeBiSans-Bold-44.pf2
loadfont (\$root)/boot/grub/theme/HeBiSans-24.pf2
loadfont (\$root)/boot/grub/theme/HeBiSans-18.pf2

menuentry "合璧OS 5.0 LTS (Jade) — $HOSTNAME" --class hebios --id hebios {
    linux /boot/vmlinuz root=/dev/$ROOT_PART rw console=tty0 console=ttyS0,115200 \\
        vga=791 vt.handoff=1 quiet nowatchdog
    initrd /boot/initrd.gz
}

menuentry "合璧OS 5.0 — 安全图形模式 (Safe Graphics)" --class hebios {
    linux /boot/vmlinuz root=/dev/$ROOT_PART rw console=tty0 console=ttyS0,115200 nomodeset nowatchdog
    initrd /boot/initrd.gz
}

menuentry "重新启动 (Reboot)" --class other {
    reboot
}

menuentry "关机 (Shutdown)" --class other {
    halt
}
GRUBCFG
    grub-install --root-directory=$HB_MNT --target=i386-pc /dev/$TARGET >>$HB_LOG 2>&1 \
        || hb_fail "GRUB (BIOS) 安装失败"
    hb_log "GRUB BIOS (i386-pc) 安装完成"
    # GPT 方案(ESP 存在)时同时安装 UEFI 引导链, 不依赖安装时的固件类型:
    # 从介质直接内核引导的安装环境 /sys/firmware/efi 不存在, 不能作为判据。
    # 双链安装后, 同一块盘在 UEFI 与传统 BIOS 固件下均可启动。
    if [ -n "$ESP_PART" ]; then
        grub-install --root-directory=$HB_MNT --target=x86_64-efi \
            --efi-directory=$HB_MNT/boot/efi --removable >>$HB_LOG 2>&1 \
            || hb_fail "GRUB (UEFI) 安装失败"
        hb_log "GRUB UEFI (x86_64-efi, --removable) 安装完成"
        # UEFI 启动链: BOOTX64.EFI 的嵌入 prefix 指向 ESP 的 /EFI/BOOT,
        # GRUB 只从该目录读 grub.cfg —— 根分区上的 /boot/grub/grub.cfg
        # 无法被固件启动链发现, 必须复制一份到 ESP (标准发行版同款做法)
        mkdir -p $HB_MNT/boot/efi/EFI/BOOT
        cp $HB_MNT/boot/grub/grub.cfg $HB_MNT/boot/efi/EFI/BOOT/grub.cfg 2>>$HB_LOG
        hb_log "grub.cfg 已复制到 ESP: /EFI/BOOT/grub.cfg"
        [ -f $HB_MNT/boot/efi/EFI/BOOT/BOOTX64.EFI ] || \
            hb_log "警告: 未找到 BOOTX64.EFI, UEFI 启动可能失败"
    fi
    /bin/busybox sleep 0.5

    hb_pct 74 "正在安装选定的通用驱动 ..."
    mkdir -p $HB_MNT/etc
    for d in $DRIVERS; do
        case $d in
            gpu)   echo "gpu virtio-drm" >> $HB_MNT/etc/hebios-drivers ;;
            net)   echo "net e1000" >> $HB_MNT/etc/hebios-drivers ;;
            audio) echo "audio snd-hda-intel" >> $HB_MNT/etc/hebios-drivers ;;
            usb)   echo "usb xhci" >> $HB_MNT/etc/hebios-drivers ;;
            print) echo "print cups" >> $HB_MNT/etc/hebios-drivers ;;
            bt)    echo "bt bluez" >> $HB_MNT/etc/hebios-drivers ;;
        esac
    done
    /bin/busybox sleep 0.4

    hb_pct 84 "正在注册自研应用与桌面集成 ..."
    mkdir -p $HB_MNT/var/lib/hebios $HB_MNT/opt/hebios
    cp -a /opt/hebios/packages $HB_MNT/opt/hebios/ 2>/dev/null
    /bin/busybox sleep 0.3

    hb_pct 88 "正在生成已安装系统的 initramfs ..."
    # 压缩级别: 用 -2 而非 -9。本发行版数据(内核模块/二进制)实测:
    #   -9: 9.53s / 18.35MB    -6: 1.73s / 18.46MB    -2: 0.66s / 19.53MB
    # -9 与 -6 压缩率几乎相同却慢 5.5 倍, -2 快 14 倍体积仅大 6%。
    # 曾用 -9: 安装最后一步单线程满跑 30-60s+(VMware 1-2 vCPU 下更久),
    # 进度条卡在 88%, 整机 CPU 飙满看似卡死 —— "点击安装 CPU 爆炸"根因。
    # 解压耗时各级别基本一致, 启动不受影响。
    # 排除项 (否则 initrd.gz 内嵌一个正在写入的自身快照 + 整个 ESP 内容):
    #   ./boot/initrd.gz  —— 本命令的输出目标, find 遍历到它时会打进半成品
    #   ./boot/efi/*      —— ESP 挂载点内容 (GRUB EFI 二进制等), 属于固件层,
    #                         initramfs 不需要; 混入还会让每轮重打包逐轮膨胀
    ( cd $HB_MNT && find . -path ./boot/initrd.gz -prune -o -path './boot/efi/*' -prune -o -print \
        | cpio -o -H newc -R root:root 2>/dev/null | gzip -2 > $HB_MNT/boot/initrd.gz ) 2>>$HB_LOG
    [ -s $HB_MNT/boot/initrd.gz ] || hb_fail "initramfs 生成失败 (initrd.gz 为空)"
    hb_log "initramfs 已生成: $(du -h $HB_MNT/boot/initrd.gz | cut -f1)"
    /bin/busybox sleep 0.3

    hb_pct 92 "正在同步磁盘缓存 ..."
    cp $HB_LOG $HB_MNT/var/log/hebi-install.log 2>/dev/null
    sync
    /bin/busybox sleep 0.3

    # 结果文件 (前端据此显示完成信息)
    BOOT_NOTE="传统 BIOS (MBR)"
    [ -n "$ESP_PART" ] && BOOT_NOTE="UEFI + BIOS 双链 (ESP: /dev/$ESP_PART)"
    {
        echo "STATUS=OK"
        echo "ROOT_PART=$ROOT_PART"
        echo "ESP_PART=$ESP_PART"
        echo "SWAP_PART=$SWAP_PART"
        echo "FS_TYPE=$FS_TYPE"
        echo "USERNAME=$USERNAME"
        echo "HOSTNAME=$HOSTNAME"
        echo "BOOT_NOTE=$BOOT_NOTE"
    } > $HB_RESULT_FILE
    hb_pct 100 "安装完成!"
    hb_log "==== 安装成功: root=/dev/$ROOT_PART ($FS_TYPE) boot=$BOOT_NOTE ===="
}
