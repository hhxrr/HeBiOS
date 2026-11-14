# 合璧OS HeBi OS 5.0 LTS「Jade」

> **珠联璧合 —— 融 Linux 内核，承 Windows 体验**

一款从零构建的完整操作系统交付物：可启动的图形化 ISO（自研开机动画 + TUI/HTML 双图形化安装器）、
Windows 10 级 Web 桌面演示系统、应用商店后台（FastAPI + 管理控制台）、
以及 8 个真实 `.deb` / `.mdn` 自研应用安装包。

---

## 一、交付物总览

| 交付物 | 路径 | 说明 |
| --- | --- | --- |
| 🚀 **可启动 ISO** | `HeBiOS-3.0-amd64.iso` (≈92 MB) | GRUB 主题菜单 + 自研 fbsplash 开机动画 + 图形化安装器 + 18 个离线安装包 |
| 🖥️ **Web 桌面演示** | `HeBiOS-3.0-Web-Desktop.html` (单文件 ≈398 KB) | 完整 Windows 10 风格桌面（13 款应用，含系统安装向导），双击即可在浏览器运行 |
| 🏪 **商店后台** | `store-backend/` | FastAPI + SQLite + 管理控制台（`python3 app.py` → http://localhost:8888）；另有 `store-admin` deb 安装即用 |
| 📦 **安装包** | `iso/packages/*.deb` / `*.mdn` | 8 个自研应用，合法 Debian 包结构，`.mdn` = `.deb` 同字节副本 |
| 🌐 **官网单页** | `hebios-website.html` (≈712 KB) | 特性/商店真实数据/网页安装向导在线演示/规格/验证记录 |
| 🧩 **源码树** | `iso/`、`web-shell/`、`store-backend/` | 内核配置/initramfs/启动器、桌面全部源码 |
| 📸 **验证截图** | `docs/*.png` | 开机动画、登录、Web 桌面、商店控制台实拍 |

---

## 二、系统特性（对照需求）

| 需求 | 实现 |
| --- | --- |
| 系统命名与徽标 | **合璧OS HeBi OS 5.0 LTS「Jade」**；双环玉璧 + 窗棂徽标（`iso/boot/grub/theme/`、`web-shell/assets/logo.svg`） |
| 开机动画 | 自研 `fbsplash`（C + stb_image）：Canvas 渲染 96 帧玉璧动画，15fps 播放 12 秒，帧缓冲直写 |
| ISO 图形化安装 | `hebi-installer`：dialog 全屏 **9 步向导**——欢迎 → 语言 → **用户协议(EULA + 双勾选)** → 磁盘 → 分区与文件系统(auto/auto_uefi/manual/lvm) → **格式化二次确认** → 用户账户(密码二次确认) → 通用驱动 → 安装信息确认 → gauge 进度安装 → 完成；GRUB 菜单双入口（Live/Install） |
| **HTML 网页安装器** | `hebi-webinst`：busybox httpd + CGI + 9 步向导 SPA——局域网内**任意设备的浏览器**访问 `http://<本机IP>:8080` 即可完成整套图形化安装，与 TUI 安装器共用同一安装核心（`hebi-install-lib.sh`）；GRUB 菜单「网页安装」入口 |
| 安装模式 | **BIOS + UEFI 双模**：UEFI 固件下 GPT 布局（ESP 512M + BIOS 引导分区 2M + swap + 根），同一块盘两种固件均可启动；BIOS 固件下 MBR 布局（swap + 根） |
| 系统修复 | `hebi-repair`（内核参数 `hebi.repair=1` 或 GRUB 菜单「固件修复模式」）：引导重装（BIOS+UEFI 双链）、**root 密码重置**、分区表修复(fsck)、恢复出厂配置 |
| 基于 Linux + Windows 体验 | Linux 6.8.0 内核 + initramfs + busybox 用户空间；桌面层对标 Windows 10（开始菜单/任务栏/Aero 贴靠/操作中心/多用户登录） |
| `.deb`/`.exe`/`.msi`/`.mdn` | `hbpm` 包管理器统一处理四种格式（`.mdn` 即 `.deb` 改后缀，`.exe/.msi` 走 Wine 兼容层）；自研 mini-dpkg 安装引擎，支持局域网远程源多机分发 |
| Windows 10 字体 | Segoe UI / 微软雅黑字体栈，ClearType 平滑开关，7 种字体族可切换（设置 → 个性化 → 字体） |
| 设置功能对齐 Windows | 系统（显示缩放/声音/通知）、个性化（主题/主题色/5 张壁纸/字体）、账户（多用户增删改密切换）、更新与安全（**通用驱动**安装/卸载/扫描硬件）、关于 |
| 多用户 | 管理员「璧儿」/标准用户「合合」(密码 hebi)/来宾；登录磁贴、注销、切换用户、锁屏 (Win+L) |
| 办公助手 + 语音助手 | 办公助手「璧儿」（富文本编辑/表格/保存导出）；语音助手「合合」（Web Speech API + 中文命令解析）；均提供 `.mdn` 安装包 |
| 应用商店后台 | 自研栏 + 8 大网络源（Flathub/Snap/AUR/Deepin/AppImage/Nixpkgs/Wine/hbpm）开关；上架/下架/版本/上传/统计/日志 |
| 文件管理器/音乐等 | 文件管理器「璧见」（双盘/双视图/剪贴板/属性）、音乐「聆璧」（Web Audio 实时合成 6 曲 + 频谱可视化）、终端「璧行」、记事本、计算器、图片查看器、徽标设计器、备份工具、驱动管理器 |

---

## 三、ISO 构建与运行

```bash
# 构建（需要 Debian/Ubuntu 构建机：grub-pc-bin xorriso cpio gzip grub-mkfont imagemagick）
cd iso && bash build-iso.sh          # 产出 /workspace/HeBiOS-3.0-amd64.iso

# 运行（QEMU）
qemu-system-x86_64 -m 2G -accel tcg -boot d \
  -drive file=HeBiOS-3.0-amd64.iso,media=cdrom,readonly=on \
  -vga std -display sdl -netdev user,id=n0 -device e1000,netdev=n0
```

开机流程：GRUB 主题菜单（10s）→ 内核 + initramfs → `fbsplash` 96 帧动画（≈12s）→
文本登录 shell（`root`，无密码）→ `hebi-shell` / `hebi-installer` / `hebi-app <名>`。

### 安装与修复

**图形化安装**（`hebi.install=1` 自动进入，或 GRUB 菜单选「Install」）：

- **9 步向导**：欢迎 → 语言（4 种）→ 用户协议（自拟 EULA 全文 + 「同意协议」「知悉格式化风险」双勾选，缺一不可）→ 磁盘选择（容量/现有分区表预览）→ 分区方式（`auto` MBR / `auto_uefi` GPT / `manual` / `lvm`）→ 文件系统（ext4/btrfs/xfs/ext2）与 swap 大小 → **格式化警告二次确认** → 用户账户（管理员密码二次校验）→ 通用驱动多选 → 安装信息总览确认 → gauge 进度条真实执行
- **GPT 布局**（auto_uefi / manual）：

  | 分区 | 大小 | 类型 | 用途 |
  | --- | --- | --- | --- |
  | 1 | 512M | EFI System (`uefi`) | ESP —— UEFI 引导（BOOTX64.EFI + grub.cfg） |
  | 2 | 2M | BIOS boot (`bios-boot`) | GRUB BIOS 版 core.img 嵌入点（双模关键） |
  | 3 | 可选 | Linux swap | 交换分区 |
  | 4 | 剩余 | Linux filesystem | 根分区 `/` |

- **MBR 布局**（auto）：swap(1) + 根分区(2)，GRUB 嵌入 MBR
- **失败即中止**：分区/格式化/挂载/GRUB 任一步失败立即弹出「安装失败」对话框并说明原因（旧版曾出现分区表未写盘却报安装成功的假成功，已通过子 shell 标志文件机制修复）

**HTML 网页安装**（`hebi.webinst=1`，或 GRUB 菜单选「网页安装 (HTML Web Install)」）：

同一套安装核心（`/usr/lib/hebi-install-lib.sh` 的 `hebi_do_install()`）的 Web 前端——
busybox `httpd -p 8080` + CGI（`/cgi-bin/api`）+ 单页向导（`index.html`），
无需在目标机上接显示器键盘，**手机/平板/另一台电脑的浏览器**打开
`http://<本机IP>:8080` 即可走完 9 步向导：

| 步骤 | 内容 |
| --- | --- |
| 1 欢迎 | 版本徽标 + 入口说明 |
| 2 语言 | 4 种语言切换（向导界面实时翻译） |
| 3 协议 | 自拟 EULA 全文 + 「同意协议」「知悉格式化风险」双勾选，缺一不可 |
| 4 磁盘 | 容量/型号/现有分区表预览（数据来自 CGI 实时探测） |
| 5 分区 | auto / auto_uefi / manual / lvm + 文件系统 + swap 大小 |
| 6 用户 | 管理员账户 + 密码二次校验 |
| 7 驱动 | 通用驱动多选（gpu/net/audio/usb） |
| 8 确认 | 安装信息总览 + 格式化最终警告 |
| 9 安装→完成 | 900ms 轮询真实进度（11 个进度节点与 TUI 一致），完成后提供重启按钮 |

CGI API：`op=disks|install|progress|log|abort|reboot`；安装在后台子 shell 执行，
进度/失败经标志文件与宿主机解耦（规避 CGI 管道挂起陷阱）；用户密码经
`mkpasswd -m sha512` 生成哈希后写入已安装系统 shadow（TUI 安装器/修复器同款机制）。

**系统修复**（`hebi.repair=1`）：

- **引导修复**：重装 GRUB 双链（BIOS i386-pc 嵌入 + UEFI x86_64-efi 至 ESP 的 `/EFI/BOOT`，含 `grub.cfg` 复制到 ESP 的标准做法）
- **root 密码重置**：挂载目标根分区 → `mkpasswd -m sha512` 生成哈希并直接改写 shadow 密码字段（用户不存在则自动建号；写后校验 `$6$` 前缀）
- **分区表修复**：`fsck -y` 根分区
- **恢复出厂配置**：重置系统标识文件

### 关键技术说明

- **busybox applet 拦截**：initramfs 的 shell 是 `#!/bin/busybox sh`，ash 对 busybox 自带的 applet 名（`fdisk`/`mkswap`/`chpasswd`/`dpkg`/`wget`/`ar` 等）**绕过 PATH 直接内置执行**——busybox fdisk 无 GPT 的 `g` 命令、busybox chpasswd 无 `-R`。安装器内凡调用 util-linux 工具一律使用**绝对路径**（`/usr/sbin/sfdisk` 等）；hbpm 则反向利用该特性显式调用 `busybox ar`
- **busybox dpkg 无法安装本系包**：合璧系统无真 dpkg 二进制，busybox dpkg applet 对 `dpkg-deb` 构建的包报 `can't extract control file`——根因是 **Ubuntu dpkg-deb 默认 zstd 压缩成员**（control.tar.zst）而 busybox tar 只认 gzip。修复：构建器统一 `dpkg-deb -Zgzip` + hbpm 换自研 mini-dpkg（ar+tar 直解，见「hbpm 包管理」节）
- **busybox wget 两个静默失败陷阱**：① 先解析 IPv6(::1) 且**不回退 IPv4**，连 localhost 服务器必失败（hbpm 将 `localhost` 规范化为 `127.0.0.1`）；② **不接受含原始 UTF-8 字节的 URL**，中文查询参数静默失败（hbpm 改为下载全量 + 本地 grep 过滤，不用 `?q=` 中文参数）
- **while read 管道丢末行**：`cmd | while read -r l` 中若 cmd 输出末行无换行符（如 sed 未插入换行的单结果 JSON），read 读到 EOF 返回非 0 导致**整个循环零迭代**——管道后补 `{ cmd; echo; }` 保证末行换行
- **udhcpc 脚本必须可执行**：busybox udhcpc 用 `execve` **直接执行** `-s` 指定的脚本（而非 `sh script`），无可执行位则静默失败——表象是 DHCP 租约照拿、接口却永远没有 IP（网页安装器 API 全超时即此故障；`build-iso.sh` 已显式 `chmod +x`，且 Ubuntu busybox 的默认脚本路径是 `/etc/udhcpc/default.script`，与上游 `/usr/share/udhcpc/` 不同）
- **Linux 网络接口默认 DOWN**：DHCP 前必须 `ifconfig <if> up`（含 `lo`），否则 udhcpc 报 `sendto: Network is down` 并进入无限重试循环（`-n`/`-q` 均无法退出），需 `timeout` 包裹兜底
- **chpasswd -R 在 chroot 内不可用**：Ubuntu 的 chpasswd 依赖 PAM，`-R <chroot>` 时因 chroot 内无 `/etc/pam.d/chpasswd` 必然 `pam_start failure`——且错误常被 `2>/dev/null` 吞掉，形成「安装/修复报告成功、用户却永远无密码」的假成功（E2E 离线校验实证）。安装器与修复器改用 busybox `mkpasswd -m sha512` 生成哈希 + awk 直接改写目标 shadow 密码字段，写后校验 `$6$` 前缀
- **sfdisk 脚本化分区**：替代 fdisk 交互序列——GPT 一步到位（`label: gpt` + `size/type` 行），无「t 命令在单分区时默认选中不问分区号」的交互错位陷阱；`-W always` 擦除旧签名
- **dialog I/O**：不使用 `--stdout` + 命令替换（dialog 1.3 在无控制终端时打开输出 tty 会失败），改用 `--output-fd 3` 写临时文件
- **switch_root 必须由 PID 1 执行**：已安装系统启动时，initramfs 的 `/init`（内核以 PID 1 执行）依据 `root=` 参数挂载真实根分区并 `switch_root`；挂载失败自动回退 Live 模式。**busybox switch_root applet 硬性要求 PID 1**——曾把切换逻辑放在 rcS 里（init 的子进程），必报 usage 后 shell 退出，只剩 tty 登录、无动画无桌面（E2E 实证）；rcS 内只保留静默兜底尝试，绝不能用 `exec`（exec 失败同样杀死 rcS）
- **安装核心必须拷贝 /init**：安装器的系统拷贝清单（目录循环）天然不含位于根下的 `/init`——漏拷它，安装出来的 initramfs 没有入口脚本，内核只能回退「直接挂真实根」，仅当磁盘控制器驱动是内核 builtin（virtio）时才碰巧能启动；VMware SATA(ahci)/NVMe(nvme)/LSI-SCSI(mptspi) 全是模块，装好的系统在 VMware/真实硬件上直接 kernel panic（E2E 实证后修复）
- **initramfs 压缩级别**：安装核心生成已安装系统 initramfs 用 `gzip -2` 而非 `-9`——本发行版数据（内核模块+二进制）实测 `-9: 9.53s/18.35MB`、`-2: 0.66s/19.53MB`，`-9` 慢 14 倍而体积几乎相同；`-9` 曾让安装最后一步单线程满跑数十秒、进度卡在 88%，即「点击安装 CPU 爆炸」的直接根因（解压耗时各级别基本一致，启动不受影响）
- **fbsplash 绝对截止时间陷阱**：`clock_nanosleep(TIMER_ABSTIME)` 的截止时间若在 blit 超过帧预算时已过期（VMware SVGA 软渲染下 1024×768 逐像素 blit 很容易超过 66ms），调用立即返回 → 100% CPU 自旋。修复：截止时间改为 blit 之后取 `当前时间 + 帧时长`；同时去掉每帧 `fprintf`（15fps 刷串口既拖慢循环又是噪声），改为 5 秒节流
- **ESP 条件格式化的 shell 陷阱**：`[ -n "$ESP_PART" ] && mkfs.vfat ... || hb_fail ...` 在 ESP 为空（MBR 方案）时 `&&` 短路返回非 0，反而触发 `|| hb_fail`——MBR 自动模式永远报「EFI 系统分区 (/dev/) 格式化失败」。条件命令必须用 `if` 块，不能 `&&/||` 链
- **UEFI 启动链**：`grub-install --removable` 的 BOOTX64.EFI 嵌入 prefix 指向 ESP 的 `/EFI/BOOT`，GRUB 只从该目录读 `grub.cfg`——根分区上的 `/boot/grub/grub.cfg` 无法被固件启动链发现，必须复制一份到 ESP（标准发行版同款做法）
- **QEMU OVMF 磁盘接口**：OVMF 固件的 ATA 驱动会干扰内核对 IDE/AHCI 磁盘的 libata 探测（实测：OVMF+IDE/q35 无盘，OVMF+virtio 正常，SeaBIOS+IDE 正常）；QEMU 下测试 UEFI 安装请使用 `-drive if=virtio`（安装器磁盘列表本就支持 `vd[a-z]`）

### 关键构建参数说明

Live/Install 内核行为 `vga=791 vt.handoff=1 quiet ignore_loglevel`：

- Linux 6.8 已移除 `vesafb`，`vga=791` 由早期代码解析，图形模式经 sysfb/simpledrm 暴露为 `fb0`；
- **不可单独使用 `quiet`**：仅 `quiet`（console_loglevel=4）时 simpledrm 幻影帧缓冲不被激活，动画不可见；
- `ignore_loglevel` 与 `quiet` 组合可兼顾「启动安静」与「帧缓冲正确激活」（已 A/B 验证，见 `docs/boot-animation-screenshot.png`）。

### hbpm 包管理

```bash
# 本地安装
hbpm install office-assistant_1.2.0_amd64.mdn   # .mdn 自动识别内部为 .deb
hbpm install hebi-music_2.4.0_amd64.deb         # 原生 Debian 包
hbpm install WeChatSetup.exe                    # .exe/.msi 走 Wine 兼容层
hbpm list / search / info / remove

# 局域网多机分发（远程源）
hbpm repo set http://192.168.1.5:8888            # 指向局域网内的合璧商店后台
hbpm repo                                       # 查看当前源与在线状态
hbpm search 璧见                                 # 本地+远程源搜索(名称/描述/slug)
hbpm install logo-lab                            # 裸包名: 远程源自动查找并安装
hbpm install http://192.168.1.5:8888/packages/hebi-files_3.0.1_amd64.mdn   # URL 直装
hbpm repo del                                    # 删除远程源配置
```

远程源由 `hebi-store-admin`（或任意 HTTP 静态目录）提供：`/api/apps` 应用索引、
`/api/packages` 包清单、`/packages/<文件>` 下载。**多机场景下，A 机上架/上传的应用，
B 机配置同一远程源后一条命令即可安装**（每机仍独立安装，非自动镜像——发行版哲学）。
`HB_ROOT=/tmp/testroot hbpm install x.deb` 可隔离安装到指定根目录。

安装引擎为自研 mini-dpkg：busybox `ar` 提取成员 → `tar` 解 data 到安装根 →
留存 control/postinst/prerm 与文件清单 → 按清单卸载（逆序删文件 + prerm）。
不依赖 dpkg 二进制（合璧 busybox 系统无真 dpkg，其自带 dpkg applet 无法解析本系包）。

---

## 四、Web 桌面演示系统

单文件 `HeBiOS-3.0-Web-Desktop.html`（或 `web-shell/index.html` 开发版），零依赖、零构建：

- **开机动画**：Canvas 绘制双环玉璧（脉冲光环/旋转点环/进度弧）+ 4600ms 品牌呈现
- **登录/锁屏/关机**：多用户磁贴 + 密码验证、Win+L 锁屏、关机/重启/注销遮罩
- **窗口管理**：打开/聚焦/最小化/最大化/关闭、8 向缩放、标题栏拖动、Aero 贴靠（左半/右半/顶部）
- **任务栏**：开始按钮、搜索框、任务按钮、托盘（网络/音量/通知/时钟）、显示桌面
- **开始菜单**：用户磁贴、应用搜索、应用网格、电源菜单
- **13 个内置应用**：文件管理器、音乐、设置、应用商店、办公助手、语音助手、终端、记事本、计算器、图片查看器、关于、**合璧邮件**、**HeBi 浏览器**
- **虚拟文件系统**：localStorage 持久化，`/home/<用户>/{桌面,文档,下载,图片,音乐,视频}` + `/etc` + 双盘符
- **音乐引擎**：Web Audio 实时合成（音序器 + 合成器 + AnalyserNode 频谱），6 首内置曲目
- **应用商店**：首页/自研/网络源三栏，`.mdn` 安装流程（下载→校验→解包→注册）

```bash
# 开发模式（分文件）
cd web-shell && python3 -m http.server 8080   # http://localhost:8080
# 或重新生成单文件
bash build-single.sh
```

---

## 五、应用商店后台

```bash
# 方式一：deb 安装（推荐，装完即有桌面菜单项）
sudo dpkg -i iso/packages/store-admin_1.0.0_amd64.deb
hebi-store-admin        # 起服务于 localhost:8888 并自动弹出浏览器
hebi-store-admin-stop   # 停止服务

# 方式二：源码直跑
cd store-backend && python3 app.py    # http://localhost:8888
```

- 管理控制台：`/`（演示账号 `admin` / `hebi`）
- REST API：`/api/apps`（CRUD）、`/api/sources`（开关）、`/api/packages/upload`（上传即解析 dpkg 元数据）、`/api/apps/{slug}/download`（下载计数）、`/api/stats`（看板）
- 自动 API 文档：`/docs`（Swagger UI）
- 同时挂载 Web 桌面演示：`/web-shell/`
- 端口默认 8888，可用环境变量 `HB_STORE_PORT` 覆盖
- deb 版数据目录自适应：root 安装时数据在 `/usr/share/hebios/store-admin`（就地），
  普通用户安装时回退 `~/.local/share/hebi-store-admin` 并从随包种子（store.db.template + 18 个应用包）自动播种；
  依赖 fastapi/uvicorn/pydantic/**python-multipart**（缺失时启动器自动 pip 安装，
  也可 `apt install python3-fastapi python3-uvicorn python3-multipart`）

---

## 六、安装包制作

```bash
cd iso/packages && bash build-packages.sh
```

每个包均为合法 Debian 包：`DEBIAN/{control,postinst,prerm,md5sums}` + `usr/bin` 启动器
（busybox + dialog 真实可用程序）+ 桌面项 + 文档 + 图标。`.mdn` 与 `.deb` 字节一致
（`cmp` 验证通过）。

| 包 | 应用 | 启动器 |
| --- | --- | --- |
| office-assistant | 办公助手 · 璧儿 | `hebi-office`（dialog 编辑器） |
| voice-assistant | 语音助手 · 合合 | `hebi-voice`（命令循环） |
| hebi-files | 文件管理器 · 璧见 | `hebi-files`（目录浏览器） |
| hebi-music | 音乐播放器 · 聆璧 | `hebi-music`（播放列表+动画） |
| hebi-terminal | 终端 · 璧行 | `hebi-shell` |
| hebi-drivers | 驱动管理器 | `hebi-drivers`（/sys 硬件扫描） |
| hebi-backup | 系统备份工具 | `hebi-backup`（tar 快照） |
| logo-lab | 徽标设计器 | `logo-lab`（SVG/PNG 生成） |
| store-admin | 应用商店管理控制台 | `hebi-store-admin`（FastAPI 服务 + 弹浏览器） |

---

## 七、验证记录

| 验证项 | 方法 | 结果 |
| --- | --- | --- |
| 开机动画可见 | QEMU screendump 像素统计 | mean=[8,18,44] 玉璧青，nonzero 20000/20000 ✅ |
| 动画完整播放 | 串口帧日志 | 96 帧 15fps ≈12s 后进入登录 ✅ |
| ISO 离线包 | initramfs 清单 | 18 个（9 deb + 9 mdn）✅ |
| deb 合法性 | `dpkg-deb -I/-c` | 控制字段/md5sums/postinst 齐全 ✅ |
| mdn ≡ deb | `cmp` | 字节一致 ✅ |
| Web 桌面全链路 | Chrome DevTools Protocol | 登录→桌面→13 应用→设置 5 页→商店 3 栏→终端→语音，**控制台零错误** ✅ |
| 商店后台 API | curl + CDP | 上架/下架/开关/上传解析/下载计数全部通过 ✅ |
| **图形化安装 E2E** | QEMU OVMF + virtio 盘 + 串口驱动 dialog | 9 步向导（语言→协议→磁盘→分区→文件系统→用户→驱动→确认→gauge）全通过，安装完成 ✅ |
| **HTML 网页安装器 E2E** | QEMU hostfwd + HTTP API 驱动真实安装（disks→install→progress→log）+ 从盘启动 + 宿主机 debugfs/mtools 离线校验 | 25/25 通过：GPT 四分区、双链引导、密码哈希写入 shadow、fstab、已安装 grub.cfg、ESP BOOTX64.EFI+grub.cfg（含 menuentry/root 指向）✅ |
| **网页安装向导 UI** | Chrome DevTools Protocol | 9 步流程（含中文密码/表单校验/空态/进度轮询），46/46 通过，控制台零错误 ✅ |
| **UEFI 启动链 E2E** | OVMF 固件启动已安装系统 | ESP→BOOTX64.EFI→GRUB→内核→fbsplash 帧序列，串口日志确认 ✅ |
| **GPT 双引导布局** | `sfdisk` 脚本化分区 + `grub-install` 双 target | ESP(512M)+BIOS-Boot(2M)+swap+root 四分区，i386-pc 与 x86_64-efi 双链均安装成功 ✅ |
| **安装器/修复器语法** | `busybox sh -n` | 无语法错误 ✅ |
| **VFAT/ESP 挂载** | rcS 显式 modprobe + 模块解压 | 内核不支持 .ko.zst → initramfs 模块全部解压为纯 .ko 并做依赖闭包裁剪（1011→30 个，14MB，含 VMware 五件套）✅ |
| **修复中心冒烟** | QEMU + `hebi.repair=1` 串口驱动 dialog | 7/7 通过：菜单渲染/功能项/boot 修复分支/修复执行/结果反馈/返回菜单/退出重启 ✅ |
| **修复器磁盘探测** | 已安装盘 + 修复中心 | 「✓ 已检测到合璧OS 安装： /dev/vda4」→ 重装 GRUB 双链 →「引导修复完成」✅ |
| **store-admin deb 生命周期** | dpkg -i → 启动器 → curl → nobody 回退播种 → 幂等 → stop 助手 → dpkg -r | 安装/卸载干净，localhost:8888 四端点（/、/api/stats、/web-shell/、/packages/）全通；root 就地 + 普通用户 `~/.local/share` 种子播种双路径验证通过；修复 python-multipart 缺失导致的上传路由启动崩溃 ✅ |
| **hbpm mini-dpkg 安装引擎** | busybox sh 真装真卸 + HB_ROOT 隔离 | 本地 deb/URL/裸名三路径安装全通；文件清单逆序卸载 + prerm 执行 + postinst 注册验证；HB_ROOT 隔离安装宿主零污染；修复 busybox dpkg 无法装本系包（zstd→gzip）✅ |
| **hbpm 局域网远程源** | 商店后台作源 + 裸包名/中文搜索 | `repo set`→`search 璧见`→`install logo-lab` 全链路；中文/多结果/slug 搜索均通；修复 busybox wget IPv6 不回落与 UTF-8 URL 拒绝两陷阱 ✅ |
| **「点击安装 CPU 爆炸」根因查明与修复** | QEMU hostfwd 全自动 E2E + 逐秒 CPU 采样（/proc/qemu/stat） | 四层根因：① 安装核心 initramfs 生成用 `gzip -9`（-9 与 -2 体积几乎相同却慢 14 倍，实测 9.53s vs 0.66s），最后一步单线程满跑数十秒、进度卡 88%——直接根因；② fbsplash `TIMER_ABSTIME` 截止时间过期即 100% 自旋；③ **安装拷贝清单漏 `/init`**——生成的 initramfs 无入口，安装后系统仅 virtio builtin 能起，VMware SATA/NVMe/LSI-SCSI 全模块必 panic；④ **busybox switch_root 要求 PID 1**，rcS 子进程调用必败（usage 后 shell 退出只剩 tty 登录）——切换逻辑移入 `/init`。修复后重测：MBR/auto_uefi 双模式安装成功（41s），从盘启动 0 错误直达桌面菜单 ✅ |
| **VMware 兼容** | 模块闭包扩展 + rcS 双处 modprobe 清单 | 新增 `vmw_pvscsi`(半虚拟化 SCSI)/`mptspi`(LSI Logic)/`BusLogic`/`nvme`(NVMe)/`vmxnet3`(网卡) 及依赖闭包；安装后启动的根分区挂载清单同步补齐——VMware 默认 SCSI/NVMe 盘 + vmxnet3 网络均被覆盖 ✅ |
| **MBR 自动分区模式** | QEMU E2E（mode=auto） | 修复 `[ -n "$ESP" ] && mkfs.vfat || hb_fail` 短路陷阱后，MBR 方案（swap+root 两分区）安装成功，回执 `传统 BIOS (MBR)` ✅ |
| **版本标识统一升级 5.0** | 全交付面 grep 扫描 + initramfs 解包逐项核对 | `etc/os-release`（本次起进入 ISO 与已安装系统，旧版从未打包）、GRUB 菜单五项、`etc/issue` 横幅、三大安装器标题、EULA、hebi-shell、Web 桌面（标题/关于/neofetch/终端）、商店后台/控制台、官网、README 全部改为 5.0；包名版本号与既有文件名保持不变 ✅ |
| **官网商店数据同步** | store.db.template 为准 + 控制台截图重生成 + 无头浏览器渲染验证 | 商店 section 原只有截图，现含 8 款上架应用卡片/8 个软件源（6 启用+2 关闭）/18 个离线包/累计下载 69,775；旧控制台截图显示 9 个应用已过期，按当前库重截（FastAPI+headless Chromium 1440×761）✅ |
| **网页安装向导内嵌演示** | Chrome DevTools Protocol 全流程点击驱动 | 官网「安装」section 以 iframe srcdoc 嵌入同一套九步向导（mock 后端：假磁盘+26s 模拟时间线+假日志），CDP 实时点击走完全流程：欢迎→协议→磁盘→分区→用户→驱动→汇总→安装→完成全部 OK，汇总页正确带出所选磁盘与修改后的用户名，完成页渲染正确；页面明确标注演示模式 ✅ |
| **store-admin deb 去递归嵌套** | 构建脚本审查 + 体积实证 | 旧种子循环把上一版 store-admin deb 嵌入包内，体积逐轮膨胀（1.4MB→3.0MB 实证）；现种子只含 8 款上架应用的 16 个包文件（与 apps 表一致），deb 回落到 149KB，ISO 同步缩小约 1MB ✅ |
| **5.0 版 ISO 启动冒烟** | QEMU 串口抓取 52s | 内核 6.8.0-147 启动→`Run /init as init process`→fbsplash 1024×768 96 帧→`合璧OS HeBi OS 5.0 LTS` 横幅亮相，无 kernel panic ✅ |
| **合璧邮件 + HeBi 浏览器上线** | 源码接线 + CDP 全流程 | 两个应用从"写了没接线"到完整可用：邮件侧（文件夹/未读计数/阅读/星标/删除/恢复/搜索/写邮件发送/草稿），浏览器侧（多标签/地址栏导航/书签栏/星标/主页磁贴/模拟搜索/历史记录/前进后退/关标签）；修复 3 处不存在的 API 引用（`HB.wins`→DOM 反查、`win.close`→`HB.closeWin`、自写剪贴板兜底）、compose 对话框时序 bug（先持有输入框引用再 `.then`）、标签标题慢一拍 ✅ |
| **设置应用全量接线（16 处摆设 + 15 处无绑定）** | CDP 逐控件验证 | 分辨率（根 zoom 实现）/HDR/记住平板模式/默认打印机/安装脚本/代理（手动开关联动地址与例外禁用态）/锁定任务栏（联动禁用任务栏属性）/托盘图标/需要登录/区域格式双向同步/筛选器颜色/指针动画/按住拖动/实时字幕/网站本地访问/回退确认框全部有真实功能；声音输出输入、输入音量、滚轮行数、蓝牙/输入法/WLAN/锁屏/幻灯片/光标方案/文件类型/键盘布局/讲述人语音/反馈频率/搜索范围逐一接线 ✅ |
| **bindSelect/bindRange 全量失效 bug 修复** | CDP 探针定位到打包文件行号 | 箭头函数捕获的是元素 `e` 而非事件对象，`e.target.value` 全量 TypeError——所有下拉与滑块一交互即崩；改为 `e.value` 后分辨率/亮度/缩放等全部生效 ✅ |
| **Web 桌面 v3.2 CDP 全量回归** | headless Chromium + CDP 48 项检查 | 登录/桌面/邮件 14 项/浏览器 14 项/设置 16 项/桌面右键子菜单（查看大图标、按名称排序）全通过，**控制台错误 0、页面异常 0** ✅ |
| **GRUB 菜单 100% CPU 根因查明** | 7 个最小化 ISO 变体 A/B 对照（原主题/去 progress_bar/无主题/标题字号 44→24/无 gfxterm/原版 grub-mkrescue/`timeout_style=hidden`）+ SeaBIOS 空盘对照 + `-d int` 中断 trace | 全部变体在菜单显示期均持续 100% 单核；SeaBIOS 空盘对照仅 0-1%——定位为 **GRUB 按键等待忙轮询**（等待期间不执行 HLT，纯 TCG 无 KVM 的 QEMU 下尤甚），属上游通用行为，与主题/倒计时渲染无关，无配置可消除。**缓解**：ISO 与已安装系统模板的 GRUB `timeout` 10s→5s，暴露窗口减半 ✅ |
| **小磁盘 swap 安装失败修复（容量钳制）** | QEMU + 2GiB virtio 盘 E2E + `op=log` 取证 | 根因：sfdisk 脚本模式下请求的分区装不下时**不报错**，静默创建 0 扇区分区→设备节点不出现→mkswap "No such file or directory"→安装中止于 12%（2GiB 盘扣 1MiB 对齐仅剩 2047MiB，装不下默认 2048MiB swap，小磁盘必现）。修复：安装核心 `hebi-install-lib.sh` 增加磁盘容量感知钳制（swap ≤ 磁盘 25% 且为根分区预留 1GiB，GPT 方案另留 ESP 512M+bios-boot 2M，下限 128MB，TUI 与网页安装器共用）+ 网页向导滑块同步收紧并给出提示；修复后 E2E 3%→12%→30%→62%→84%→88%→92%→完成 ✅ |
| **安装→启动闭环（复验）** | 从 testdisk.img 直接启动 + 串口捕获 | SeaBIOS→GRUB→内核 6.8→fbsplash 96 帧→rcS→hebi-shell 菜单，switch_root 到真实根分区正常 ✅ |
| **Web 桌面「系统安装」应用上线** | CDP 37 项专项（含 iframe 内九步向导全流程实跑） | 桌面图标 + 开始菜单入口；iframe srcdoc 承载与装机 ISO **同一套九步向导界面**（语言→协议→磁盘→分区→用户→驱动→确认→安装→完成），mock 后端（2 块模拟磁盘含 4GB 小盘、24s 进度时间线、假日志，**swap 钳制规则与服务端逐行一致**——选小盘即演示滑块收紧至 1024MB）；全程醒目标注演示模式（横幅 + 完成页说明 + 重启按钮演示提示，不写任何磁盘）；表单校验（非法用户名/密码不一致/空主机名）/中止路径/关窗 postMessage 清理轮询定时器均验证；安装期 CPU 峰值 <25%，关闭后回落 <10%，**控制台错误 0、页面异常 0** ✅ |
| **5.1beta ISO 启动冒烟** | QEMU 串口抓取 90s | SeaBIOS→内核 6.8.0-147→fbsplash 96 帧→rcS→hebi-shell 五步菜单完整亮相；initrd.gz 内三项补丁（swap 钳制/滑块收紧/grub timeout=5）解包核对就位 ✅ |
| **系统安装「打开即装」（快速安装）** | CDP 42 项专项 + QEMU E2E | 效仿 Deepin 一键装机体验：Web 桌面「系统安装」与 ISO 网页安装器**打开即显示快速安装页**（不再从九步欢迎页开始）——8 项默认配置摘要卡（简体中文 zh_CN.UTF-8 / 中国标准时间 Asia/Shanghai / 中文键盘布局 / 第一块磁盘 / GPT 自动分区 UEFI+BIOS 双模 / swap 按容量自动 ≤25% / 用户 hebios / 通用驱动全选）+ 醒目「立即安装 ⚡」大按钮一键装机到完成；「自定义安装（高级）」次级入口保留原九步。快速安装页首屏即达，进度→完成页 rail 标记「⚡ 快速安装完成」；CDP 42/42 全绿（含小盘 swap 钳制/中止路径/关窗清理/CPU 峰值 <25%）；ISO 侧 QEMU E2E 以同组默认参数真实装机 30/31 通过（唯一未过项为空密码不写哈希——快速安装默认无密码管理员账户的预期行为），安装→重启→switch_root 全链路正常 ✅ |
| **中文包本地化（开箱即中文）** | 构建产物解包核对 + E2E debugfs 校验 | 装机核心 `hebi-install-lib.sh` 向目标系统写入 `/etc/locale.conf`（LANG=zh_CN.UTF-8）、`/etc/timezone`（Asia/Shanghai）、`/etc/localtime`（TZif）、`/etc/vconsole.conf`（KEYMAP=us）、`/etc/environment`；介质 rootfs 预置同套模板 + zoneinfo（Asia/Shanghai 等 5 区域 + UTC）+ **简体中文字体子集**（fontTools 从 NotoSansCJK ttc 提取 SC 子体，GB2312 一级 3755 字 + 常用符号 4005 字形，19.5MB→1.8MB）；rcS 启动即 export LANG=zh_CN.UTF-8 TZ=Asia/Shanghai；E2E debugfs 六项中文包校验全过（含字体子集已装机）✅ |

截图存档：| **登录界面「登录」主按钮** | CDP 三路径实测 | 原登录方式为点击用户头像进入桌面，新用户易卡在登录界面（时钟画面）找不到入口；现底部右侧新增蓝色「🔑 登录」主按钮：未选中用户时一键登录默认账户（璧儿·管理员·无密码）；已选中密码用户（合合）时点击弹出密码框，错误密码有提示、正确密码（hebi）进桌面；头像点击旧路径保留。两条登录路径 + 头像回归全通过，控制台错误 0、页面异常 0 ✅ |

截图存档：`docs/boot-animation-screenshot.png`、`docs/login-screenshot.png`、
`docs/web-desktop-screenshot.png`、`docs/store-admin-screenshot.png`、
`docs/login-screen-users.png`、`docs/desktop-with-install.png`、
`docs/start-menu-with-install.png`、`docs/login-with-button.png`、
`docs/quick-install-screen.png`、`docs/quick-install-running.png`、
`docs/quick-install-done.png`。

---

## 八、目录结构

```
/workspace
├── HeBiOS-3.0-amd64.iso          # 可启动 ISO
├── HeBiOS-3.0-Web-Desktop.html   # Web 桌面单文件
├── README.md                     # 本文档
├── iso/                          # ISO 源码树
│   ├── build-iso.sh              # 一键构建
│   ├── init                      # 内核 PID 1 入口（真根 switch_root 在此执行）
│   ├── boot/{vmlinuz,initrd模板,grub,splash-frames}
│   ├── rootfs/etc/init.d/rcS     # 启动模式分发（install/webinst/repair/live）
│   ├── rootfs/usr/lib/hebi-install-lib.sh   # 安装核心共享库（TUI/Web 双端复用）
│   ├── rootfs/usr/bin/{fbsplash,hbpm,hebi-installer,hebi-webinst,hebi-repair}
│   ├── rootfs/usr/share/hebios/webinst/     # 网页安装器 htdocs（index.html + cgi-bin/api）
│   └── packages/                 # deb/mdn 包 + 构建器 + 启动器 + 图标
├── web-shell/                    # Web 桌面（css/js/index/build-single.sh）
│   └── js/apps/                  # 13 个应用模块
├── store-backend/                # FastAPI 后台
│   ├── app.py                    # API + 静态挂载（数据目录自适应 + 种子播种）
│   ├── static/admin.html         # 管理控制台
│   ├── store.db.template         # 干净种子数据库（deb 随包播种用）
│   └── packages/                 # 仓库包副本（18 个）
└── docs/                         # 验证截图
```

---

| **VMware「客户机已禁用 CPU」报错排查** | QEMU SATA/NVMe 全自动 E2E 复测 + VMware KB 2000542 机理分析 | 该报错是 VMware 检测到客户机内核执行 `CLI; HLT`（关中断停机），Linux 侧成因是内核 panic 或 soft-lockup。全量复测排除安装后启动 panic（MBR+SATA、GPT/UEFI+NVMe 两种模式从盘启动均直达桌面菜单）；按 VMware 官方建议给全部启动项加 `nowatchdog`（禁 soft-lockup 检测与 NMI watchdog，避免虚拟环境误报挂起）；修复网页安装器 `disk_names()` 把 NVMe 整盘 `nvme0n1` 误剥为不存在的 `nvme0n` 导致 NVMe 盘无法安装的 bug；initramfs 重打包排除自身输出文件与 ESP 挂载内容（旧逻辑会把半成品 initrd.gz 与整个 ESP 打进包内逐轮膨胀）✅ |
| **修复后双模式 E2E 复测** | QEMU ich9-ahci(SATA)+OVMF(NVMe) 安装→从盘启动 | SATA/MBR 与 NVMe/UEFI 安装均成功，从盘启动无 panic、无 soft lockup、无 NMI 事件，直达桌面菜单；op=disks 正确返回 `nvme0n1` ✅ |
*合璧OS Project · 珠联璧合工作室 · 2026*
