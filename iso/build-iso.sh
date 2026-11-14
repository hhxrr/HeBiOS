#!/bin/bash
# ============================================================
# 合璧OS HeBi OS 5.0 — ISO 构建脚本
# 产出: /workspace/HeBiOS-3.0-amd64.iso (BIOS+UEFI 混合启动)
# 内容: Linux 6.8 内核 + initramfs(开机动画/通用驱动/hbpm/安装器)
#       + GRUB 图形主题 + Plymouth 主题 + 离线 .mdn 安装包
# ============================================================
set -e
ROOT=/workspace
WORK=$ROOT/.build
SRC=$ROOT/iso
OUT=${1:-$ROOT/HeBiOS-3.0-amd64.iso}
POOL=https://archive.ubuntu.com/ubuntu/pool/main/l/linux

echo "== [1/9] 准备工作目录 =="
rm -rf $WORK && mkdir -p $WORK/{dl,x,iso-root/boot,iso-root/boot/grub,rootfs}
KVER=6.8.0-147-generic

echo "== [2/9] 获取 Linux 内核 (自动选择 6.8 最新版) =="
if [ ! -f $WORK/dl/kernel.version ]; then
    KIMG=$(curl -s --max-time 60 $POOL/ | grep -oE 'linux-image-unsigned-6\.8\.0-[0-9]+-generic_6\.8\.0-[0-9.]+_amd64\.deb' | sort -u -V | tail -1)
    if [ -z "$KIMG" ]; then echo "错误: 无法解析内核包名"; exit 1; fi
    KVER=${KIMG#linux-image-unsigned-}     # 6.8.0-147-generic_6.8.0-147.147_amd64.deb
    KVER=${KVER%%_*}                       # 6.8.0-147-generic
    KREL=${KIMG##*-generic_}               # 6.8.0-147.147_amd64.deb
    KREL=${KREL%_amd64.deb}                # 6.8.0-147.147
    echo "  内核: $KVER ($KREL)"
    echo "$KVER" > $WORK/dl/kernel.version
else
    KVER=$(cat $WORK/dl/kernel.version)
fi

cd $WORK/dl
for pkg in "linux-image-unsigned-${KVER}_${KREL}_amd64.deb" \
           "linux-modules-${KVER}_${KREL}_amd64.deb"; do
    [ -f "$pkg" ] || curl -s --max-time 300 -O "$POOL/$pkg"
done
ls -la $WORK/dl/*.deb | awk '{print "  ", $9, $5}'

echo "== [3/9] 解包内核与模块 =="
mkdir -p $WORK/x/kernel
dpkg-deb -x $WORK/dl/linux-image-unsigned-${KVER}_${KREL}_amd64.deb $WORK/x/kernel
dpkg-deb -x $WORK/dl/linux-modules-${KVER}_${KREL}_amd64.deb $WORK/x/kernel
VMLINUZ=$(ls $WORK/x/kernel/boot/vmlinuz-* | head -1)
cp "$VMLINUZ" $WORK/iso-root/boot/vmlinuz
echo "  vmlinuz -> $VMLINUZ"

echo "== [4/9] 组装 rootfs (busybox + 通用驱动 + 系统工具) =="
RF=$WORK/rootfs
mkdir -p $RF/{bin,sbin,etc,proc,sys,dev,run,tmp,var,root,home,usr/bin,usr/sbin,usr/share,lib,lib64,mnt,opt,boot}
# busybox
cp /bin/busybox $RF/bin/busybox
chroot $RF /bin/busybox --install -s /bin 2>/dev/null || $RF/bin/busybox --install -s $RF/bin
# 内核模块
mkdir -p $RF/lib/modules
cp -a $WORK/x/kernel/lib/modules/$KVER $RF/lib/modules/
# 模块解压: 本发行版使用的 6.8.0-147-generic 内核未启用 MODULE_DECOMPRESS,
# finit_module 无法加载 .ko.zst 压缩模块(报 "Invalid ELF header magic:
# != ELF"), 会导致 nls_iso8859-1 等模块 modprobe 失败 → VFAT(ESP) 挂载
# 失败 → UEFI 引导装不上。故必须先全部解压为纯 .ko。
if command -v zstd >/dev/null 2>&1; then
    find $RF/lib/modules/$KVER -name "*.ko.zst" 2>/dev/null | while read -r f; do
        zstd -q -d -f "$f" -o "${f%.zst}" && rm -f "$f"
    done
fi
[ -f $RF/lib/modules/$KVER/modules.dep ] || depmod -b $RF $KVER
# 模块闭包裁剪: 只保留 rcS/安装器/switch_root 需要的模块及其依赖闭包,
# 其余删除(完整模块树解压后 131MB, 裁剪后约 11MB)。
# 注意: virtio_blk/virtio_pci/ext4/vfat/fat/loop/nls_cp437 等均为内核 builtin,
# 不在模块树中, 无需保留; 依赖闭包由 python 从 modules.dep 计算。
python3 - "$RF/lib/modules/$KVER" <<'PYMOD'
import os, sys
MODDIR = sys.argv[1]
ROOTS = set("""virtio virtio_pci virtio_blk virtio_net virtio_mmio virtio_console
ata_piix ahci libata sd_mod sr_mod ext4 ext2 ext3 btrfs xfs vfat fat
nls_iso8859-1 nls_cp437 nls_utf8 vga16fb efifb
xhci-hcd ehci-hcd uhci-hcd usb-storage
e1000 e1000e 8139too r8169 sky2
atkbd i8042 psmouse pcspkr
crc32c xor raid6_pq
zstd_decompress zstd_compress lzo lzo_compress xxhash libcrc32c
crc32c_intel crct10dif_common loop isofs udf zlib_deflate
squashfs overlay fuse
vmw_pvscsi mptspi BusLogic nvme vmxnet3""".split())
dep = {}
for line in open(os.path.join(MODDIR, "modules.dep")):
    if ":" not in line: continue
    left, _, right = line.partition(":")
    dep[os.path.basename(left.strip())[:-3]] = [
        os.path.basename(d.strip())[:-3] for d in right.split() if d.strip()]
keep, stack = set(), list(ROOTS)
while stack:
    m = stack.pop()
    if m in keep: continue
    keep.add(m)
    stack.extend(d for d in dep.get(m, []) if d not in keep)
on_disk = {f[:-3] for _, _, fs in os.walk(MODDIR) for f in fs if f.endswith(".ko")}
need = keep & on_disk
n = 0
for root, dirs, files in os.walk(MODDIR):
    for f in files:
        if f.endswith(".ko") and f[:-3] not in need:
            os.remove(os.path.join(root, f)); n += 1
print(f"  模块裁剪: {len(on_disk)} -> {len(need)} (删除 {n})")
PYMOD
depmod -b $RF $KVER
echo "  模块树: $(du -sh $RF/lib/modules/$KVER 2>/dev/null | cut -f1)"
# 系统账号文件
cat > $RF/etc/passwd <<'EOF'
root:x:0:0:root:/root:/bin/sh
hebios:x:1000:1000:HeBi User:/home/hebios:/bin/sh
EOF
cat > $RF/etc/group <<'EOF'
root:x:0:
hebios:x:1000:
EOF
cat > $RF/etc/shadow <<'EOF'
root::0:::::
hebios::0:::::
EOF
cat > $RF/etc/profile <<'EOF'
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export HOME=/root
export PS1='\[\e[1;34m\][合璧OS]\[\e[0m\] \[\e[1;32m\]\u@\h\[\e[0m\]:\w\$ '
alias ll='ls -l'
alias hb='hbpm'
EOF
cat > $RF/etc/issue <<'EOF'
 ╔════════════════════════════════════════════════════╗
 ║   合璧OS HeBi OS 5.0 LTS (Jade)  ·  amd64          ║
 ║   融 Linux 内核，承 Windows 体验                    ║
 ║   登录: root (无需密码)   |  包管理: hbpm           ║
 ╚════════════════════════════════════════════════════╝
EOF
# Plymouth 主题(供已安装系统使用)
mkdir -p $RF/usr/share/plymouth/themes
cp -a $SRC/boot/plymouth/themes/hebi-splash $RF/usr/share/plymouth/themes/
mkdir -p $RF/etc/plymouth
cat > $RF/etc/plymouth/plymouthd.conf <<'EOF'
[Daemon]
Theme=hebi-splash
ShowDelay=0
EOF
# 徽标图标
mkdir -p $RF/usr/share/icons/hebios $RF/usr/share/pixmaps
cp $ROOT/branding/logo-48.png $RF/usr/share/icons/hebios/hebios-logo.png
cp $ROOT/branding/logo-48.png $RF/usr/share/pixmaps/hebios-logo.png
# dpkg(支持 .deb/.mdn 安装)
mkdir -p $RF/var/lib/dpkg/{info,updates,triggers} $RF/var/log
touch $RF/var/lib/dpkg/status $RF/var/lib/dpkg/available $RF/var/lib/dpkg/triggers/File
cp /usr/bin/dpkg $RF/usr/bin/dpkg
for lib in $(ldd /usr/bin/dpkg | grep -oE '/lib[^ ]*'); do
    mkdir -p $RF$(dirname $lib); cp -L $lib $RF$lib
done
# dialog(图形安装器)
cp /usr/bin/dialog $RF/usr/bin/dialog
for lib in $(ldd /usr/bin/dialog | grep -oE '/lib[^ ]*'); do
    mkdir -p $RF$(dirname $lib); cp -L $lib $RF$lib
done
# ---------- 工具拷贝函数(二进制 + 依赖库) ----------
# 注意: busybox --install -s 会建立 applet 符号链接, 直接 cp 会顺着链接
# 覆写 busybox 本体, 故必须先 rm -f 移除链接再拷贝真实二进制
copy_tool() {
    local t="$1"
    local src=$(command -v "$t" 2>/dev/null)
    if [ -z "$src" ]; then echo "  [跳过] 未找到 $t"; return 0; fi
    local dst="$RF$src"
    [ -d "$(dirname "$dst")" ] || mkdir -p "$(dirname "$dst")"
    rm -f "$dst"
    cp -L "$src" "$dst"; chmod +x "$dst"
    for lib in $(ldd "$src" 2>/dev/null | grep -oE '/lib[^ ]*'); do
        mkdir -p "$RF$(dirname "$lib")"
        [ -e "$RF$lib" ] || cp -L "$lib" "$RF$lib"
    done
}
# ---------- 安装器/修复器依赖(磁盘分区/格式化/引导/密码) ----------
# sfdisk 打头: 它是脚本化分区主工具(无交互歧义, GPT 一步到位)。
# 注意: busybox ash 对自身拥有的 applet 名(fdisk/mkswap 等)会绕过 PATH
# 直接内置执行, 安装器内必须用绝对路径 /usr/sbin/xxx 调用 util-linux 版
for t in sfdisk fdisk mkswap mount umount mkfs.vfat mkfs.ext4 mkfs.btrfs mkfs.xfs \
         grub-install grub-mkimage grub-probe grub-mkdevicemap grub-editenv \
         grub-mkrelpath chpasswd fsck.ext4; do
    copy_tool "$t"
done
# grub 平台模块(BIOS i386-pc + UEFI x86_64-efi)
mkdir -p $RF/usr/lib/grub
cp -a /usr/lib/grub/i386-pc $RF/usr/lib/grub/ 2>/dev/null || true
cp -a /usr/lib/grub/x86_64-efi $RF/usr/lib/grub/ 2>/dev/null || true
echo "  grub 模块: $(du -sh $RF/usr/lib/grub 2>/dev/null | cut -f1)"
# C.UTF-8 locale 数据(供 dialog/ncursesw 进入 UTF-8 模式, 正确渲染中文与 Unicode 边框)
mkdir -p $RF/usr/lib/locale
cp -a /usr/lib/locale/C.utf8 $RF/usr/lib/locale/ 2>/dev/null || true
echo "  locale: $(du -sh $RF/usr/lib/locale 2>/dev/null | cut -f1)"
# 中文包: zoneinfo (中国标准时间 + 常用区域) — 安装核心写入目标系统 /etc/localtime
mkdir -p $RF/usr/share/zoneinfo/Asia $RF/usr/share/zoneinfo/Etc
for z in Asia/Shanghai Asia/Hong_Kong Asia/Taipei Asia/Tokyo Asia/Singapore Etc/UTC; do
    [ -f /usr/share/zoneinfo/$z ] && cp /usr/share/zoneinfo/$z $RF/usr/share/zoneinfo/$z
done
echo "  zoneinfo: $(ls $RF/usr/share/zoneinfo/Asia 2>/dev/null | wc -l) 个区域 + UTC"
# 中文包: 简体中文字体子集 (GB2312 一级 3755 字 + 符号, ≈1.8MB) —
# 供安装后系统/桌面渲染中文; 由 $SRC/rootfs 预置, 随下方 cp 清单入包
if [ -f $SRC/rootfs/usr/share/fonts/truetype/noto/NotoSansCJKsc-Subset.ttf ]; then
    echo "  中文字体子集: $(du -sh $SRC/rootfs/usr/share/fonts/truetype/noto/NotoSansCJKsc-Subset.ttf | cut -f1)"
fi
mkdir -p $RF/usr/share/terminfo/l $RF/usr/share/terminfo/x $RF/usr/share/terminfo/v $RF/usr/share/terminfo/a $RF/usr/share/terminfo/s
cp /usr/share/terminfo/l/linux $RF/usr/share/terminfo/l/ 2>/dev/null || true
cp /usr/share/terminfo/x/xterm* $RF/usr/share/terminfo/x/ 2>/dev/null || true
cp /usr/share/terminfo/v/vt10* $RF/usr/share/terminfo/v/ 2>/dev/null || true
cp /usr/share/terminfo/a/ansi $RF/usr/share/terminfo/a/ 2>/dev/null || true
cp /usr/share/terminfo/s/screen* $RF/usr/share/terminfo/s/ 2>/dev/null || true
# 合璧系统脚本
cp $SRC/rootfs/init $RF/init
cp $SRC/rootfs/etc/inittab $RF/etc/inittab
# 发行标识 (lsb_release / neofetch / hebi-shell 均读取; 缺了它
# hebi-shell 的 neofetch 回退分支形同虚设)。安装时随 etc/ 一并
# 复制到目标系统, 已安装系统同样获得正确版本标识
cp $SRC/rootfs/etc/os-release $RF/etc/os-release
mkdir -p $RF/etc/init.d
cp $SRC/rootfs/etc/init.d/rcS $RF/etc/init.d/rcS
cp $SRC/rootfs/etc/init.d/rc.shutdown $RF/etc/init.d/rc.shutdown
cp $SRC/rootfs/usr/bin/hbpm $RF/usr/bin/hbpm
cp $SRC/rootfs/usr/bin/hebi-installer $RF/usr/bin/hebi-installer
cp $SRC/rootfs/usr/bin/hebi-webinst $RF/usr/bin/hebi-webinst
cp $SRC/rootfs/usr/bin/hebi-repair $RF/usr/bin/hebi-repair
cp $SRC/rootfs/usr/bin/hebi-shell $RF/usr/bin/hebi-shell
cp $SRC/rootfs/usr/bin/hebi-app $RF/usr/bin/hebi-app
cp $SRC/rootfs/usr/bin/fbsplash $RF/usr/bin/fbsplash
# 安装核心共享库 (TUI 安装器与网页安装器共用)
mkdir -p $RF/usr/lib
cp $SRC/rootfs/usr/lib/hebi-install-lib.sh $RF/usr/lib/
# 中文包: 语言环境/时区/键盘模板 (装机时随 etc/ 整体拷入目标系统)
for f in locale.conf environment timezone localtime vconsole.conf; do
    [ -f $SRC/rootfs/etc/$f ] && cp $SRC/rootfs/etc/$f $RF/etc/
done
mkdir -p $RF/etc/default
[ -f $SRC/rootfs/etc/default/locale ] && cp $SRC/rootfs/etc/default/locale $RF/etc/default/
# 中文包: 简体中文字体子集 (GB2312 一级 3755 字 + 符号, ≈1.8MB)
mkdir -p $RF/usr/share/fonts/truetype/noto
[ -f $SRC/rootfs/usr/share/fonts/truetype/noto/NotoSansCJKsc-Subset.ttf ] && \
    cp $SRC/rootfs/usr/share/fonts/truetype/noto/NotoSansCJKsc-Subset.ttf $RF/usr/share/fonts/truetype/noto/
# 用户协议 (EULA)
mkdir -p $RF/usr/share/hebios
cp $SRC/rootfs/usr/share/hebios/eula.txt $RF/usr/share/hebios/eula.txt
# 网页安装器 (busybox httpd + CGI + HTML 向导)
mkdir -p $RF/usr/share/hebios/webinst/cgi-bin
cp $SRC/rootfs/usr/share/hebios/webinst/index.html $RF/usr/share/hebios/webinst/
cp $SRC/rootfs/usr/share/hebios/webinst/cgi-bin/api $RF/usr/share/hebios/webinst/cgi-bin/
# udhcpc 配置脚本 (接口 UP 后 DHCP 获取 IP 的实际配置者; 缺失则拿到租约
# 也无法配 IP)。注意: Ubuntu busybox 的 udhcpc 默认脚本路径是
# /etc/udhcpc/default.script (上游默认 /usr/share/udhcpc/), 两处都放)
mkdir -p $RF/etc/udhcpc $RF/usr/share/udhcpc
cp $SRC/rootfs/usr/share/udhcpc/default.script $RF/etc/udhcpc/
cp $SRC/rootfs/usr/share/udhcpc/default.script $RF/usr/share/udhcpc/
# busybox udhcpc 用 execve 直接执行该脚本, 无可执行位则静默失败
# (表现为: 拿到租约但接口始终无 IP, DHCP 形同虚设)
chmod +x $RF/etc/udhcpc/default.script $RF/usr/share/udhcpc/default.script
# /etc/hosts (本地主机名解析, 避免 DNS 查询阻塞)
cat > $RF/etc/hosts <<'EOF'
127.0.0.1 localhost
127.0.0.1 hebios
EOF
chmod +x $RF/init $RF/etc/init.d/* $RF/usr/bin/hbpm $RF/usr/bin/hebi-* $RF/usr/bin/fbsplash $RF/usr/bin/dpkg $RF/usr/bin/dialog \
         $RF/usr/share/hebios/webinst/cgi-bin/api
# 开机动画帧
mkdir -p $RF/boot
cp -a $SRC/boot/splash-frames $RF/boot/
# 安装器所需: 内核 + GRUB 配置与主题(供安装到目标系统)
cp "$VMLINUZ" $RF/boot/vmlinuz
mkdir -p $RF/boot/grub
cp $SRC/boot/grub/grub.cfg $RF/boot/grub/
# GRUB 主题字体(必须在主题拷入 initramfs 之前生成)
THEME=$SRC/boot/grub/theme
grub-mkfont -i 2 -n HeBiSans -s 24 -o $THEME/HeBiSans-24.pf2 /usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc
grub-mkfont -i 2 -n HeBiSans -b -s 44 -o $THEME/HeBiSans-Bold-44.pf2 /usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc
grub-mkfont -i 2 -n HeBiSans -s 18 -o $THEME/HeBiSans-18.pf2 /usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc
python3 - <<'PYEOF'
from PIL import Image, ImageDraw
import os
d = "/workspace/iso/boot/grub/theme"
tile = Image.new("RGBA", (640, 72), (12, 26, 54, 150))
ImageDraw.Draw(tile).rounded_rectangle([0,0,639,71], radius=12, outline=(70,130,220,120), width=2)
tile.save(os.path.join(d, "menu_c.png"))
PYEOF
cp -a $THEME $RF/boot/grub/theme
# 离线安装包 (.deb/.mdn)
if ls $SRC/packages/*.mdn >/dev/null 2>&1; then
    mkdir -p $RF/opt/hebios/packages
    cp $SRC/packages/*.deb $SRC/packages/*.mdn $RF/opt/hebios/packages/ 2>/dev/null || true
    echo "  已打包离线安装包: $(ls $RF/opt/hebios/packages | wc -l) 个"
fi

echo "== [5/9] 生成 initramfs =="
cd $RF
find . | cpio -o -H newc -R root:root 2>/dev/null | gzip -9 > $WORK/iso-root/boot/initrd.gz
ls -la $WORK/iso-root/boot/initrd.gz | awk '{print "  initrd.gz:", $5, "bytes"}'

echo "== [6/9] 生成 GRUB PF2 字体 =="
THEME=$SRC/boot/grub/theme
grub-mkfont -i 2 -n HeBiSans -s 24 -o $THEME/HeBiSans-24.pf2 /usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc
grub-mkfont -i 2 -n HeBiSans -b -s 44 -o $THEME/HeBiSans-Bold-44.pf2 /usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc
grub-mkfont -i 2 -n HeBiSans -s 18 -o $THEME/HeBiSans-18.pf2 /usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc
# menu_*.png (菜单背景半透明条)
python3 - <<'PYEOF'
from PIL import Image
import glob, os
d = "/workspace/iso/boot/grub/theme"
tile = Image.new("RGBA", (640, 72), (12, 26, 54, 150))
from PIL import ImageDraw
ImageDraw.Draw(tile).rounded_rectangle([0,0,639,71], radius=12, outline=(70,130,220,120), width=2)
tile.save(os.path.join(d, "menu_c.png"))
PYEOF

echo "== [7/9] 组装 ISO 目录树 =="
mkdir -p $WORK/iso-root/boot/grub
cp -a $THEME $WORK/iso-root/boot/grub/theme
cp $SRC/boot/grub/grub.cfg $WORK/iso-root/boot/grub/grub.cfg
cp -a $SRC/boot/splash-frames $WORK/iso-root/boot/splash-frames
mkdir -p $WORK/iso-root/.disk
echo "HeBi OS 5.0 LTS (Jade) amd64" > $WORK/iso-root/.disk/info
echo "hebios" > $WORK/iso-root/.disk/hebios_release

echo "== [8/9] grub-mkrescue 构建 ISO (BIOS+UEFI) =="
grub-mkrescue -o $OUT $WORK/iso-root \
    --modules="png all_video gfxterm part_msdos ext2 ntfs" 2>&1 | grep -vE "warning|Warning" || true
# grub-mkrescue 自动检测已安装平台(i386-pc + x86_64-efi), 输出混合启动 ISO

echo "== [9/9] 完成 =="
ls -la $OUT
echo ""
echo "合璧OS HeBi OS 5.0 ISO 构建完成: $OUT"
