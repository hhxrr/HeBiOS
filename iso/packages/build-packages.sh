#!/bin/bash
# ============================================================
# 合璧OS 自研应用安装包构建器
# 生成 8 个真实 .deb 包（合法 Debian 控制字段 + postinst + md5sums）
# 并复制为 .mdn（合璧安装包 = .deb 改后缀，hbpm 原生识别）
# ============================================================
set -eu
PKGROOT="$(cd "$(dirname "$0")" && pwd)"
BUILD=/tmp/hb-packages
rm -rf "$BUILD"; mkdir -p "$BUILD"
STAMP="2026-10-19"
VENDOR="珠联璧合工作室 <dev@hebios.cn>"

build_one() {
    local pkg="$1" name="$2" ver="$3" desc="$4" bin="$5" cat="$6" deps="$7"
    local d="$BUILD/${pkg}_${ver}_amd64"
    mkdir -p "$d/DEBIAN" "$d/usr/bin" "$d/usr/share/applications" \
             "$d/usr/share/hebios/$pkg" "$d/usr/share/doc/$pkg" "$d/usr/share/pixmaps"

    # ---- 启动器（真实可用的 busybox + dialog 程序） ----
    cat > "$d/usr/bin/$bin" <<LAUNCHER
#!/bin/busybox sh
# $name $ver — 合璧OS 自研应用
# 由 hbpm 安装；卸载时将被移除
HEBI_VER="5.0 LTS"
echo "═══════════════════════════════════════"
echo "   $name  v$ver"
echo "   合璧OS HeBi OS \$HEBI_VER · Jade"
echo "═══════════════════════════════════════"
LAUNCHER
    cat "$PKGROOT/launchers/$bin.sh" >> "$d/usr/bin/$bin"
    chmod 755 "$d/usr/bin/$bin"

    # ---- 桌面项 ----
    cat > "$d/usr/share/applications/$bin.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=$name
Name[zh_CN]=$name
Comment=$desc
Comment[zh_CN]=$desc
Exec=$bin
Icon=$bin
Terminal=true
Categories=$cat
Keywords=hebi;hebios;$pkg
X-HeBi-Package=$pkg
X-HeBi-Version=$ver
DESKTOP

    # ---- 数据文件 ----
    cat > "$d/usr/share/hebios/$pkg/package.json" <<JSON
{
  "id": "$pkg",
  "name": "$name",
  "version": "$ver",
  "vendor": "珠联璧合工作室",
  "format": "mdn",
  "engine": "busybox+dialog",
  "installer": "hbpm",
  "built": "$STAMP"
}
JSON
    cp "$PKGROOT/launchers/$bin.sh" "$d/usr/share/hebios/$pkg/source.sh"

    # ---- 文档与版权 ----
    cat > "$d/usr/share/doc/$pkg/copyright" <<CP
$name ($ver) — 合璧OS 自研应用
Copyright (C) 2026 珠联璧合工作室 (HeBi OS Project)
License: GPL-3.0-or-later

本包由合璧OS 离线仓库分发，经 hbpm / dpkg 安装。
格式说明: .mdn 即 .deb 的合璧品牌后缀，内部为合法 ar+tar 结构。
CP
    echo "$name $ver — 安装后执行 $bin 启动，或在开始菜单中选择。" > "$d/usr/share/doc/$pkg/README"

    # ---- 图标（从内置 SVG 生成 PNG） ----
    if [ -f "$PKGROOT/icons/$bin.svg" ]; then
        convert -background none -resize 48x48 "$PKGROOT/icons/$bin.svg" "$d/usr/share/pixmaps/$bin.png" 2>/dev/null || \
            cp "$PKGROOT/icons/$bin.svg" "$d/usr/share/pixmaps/$bin.svg"
    fi

    # ---- DEBIAN 控制文件 ----
    cat > "$d/DEBIAN/control" <<CTRL
Package: $pkg
Version: $ver
Section: $cat
Priority: optional
Architecture: amd64
Depends: $deps
Maintainer: $VENDOR
Installed-Size: $(du -sk "$d" | cut -f1)
Description: $name（合璧OS 自研）
 $desc
 .
 本包属于合璧OS 5.0 LTS「Jade」自研应用生态，以 .mdn 格式分发。
CTRL

    # ---- postinst：注册与集成 ----
    cat > "$d/DEBIAN/postinst" <<POST
#!/bin/busybox sh
set -e
case "\$1" in
    configure)
        echo "hbpm: 注册 $name 到合璧OS 桌面环境 ..."
        mkdir -p /var/lib/hbpm/apps /etc/hebios/desktop.d
        echo "$pkg $ver $STAMP" > /var/lib/hbpm/apps/$pkg
        echo "$bin" > /etc/hebios/desktop.d/$pkg
        command -v update-desktop-database >/dev/null 2>&1 && \\
            update-desktop-database /usr/share/applications 2>/dev/null || true
        echo "hbpm: $name 安装完成 — 运行 '$bin' 启动"
        ;;
esac
exit 0
POST
    chmod 755 "$d/DEBIAN/postinst"

    # ---- prerm：卸载清理 ----
    cat > "$d/DEBIAN/prerm" <<PRERM
#!/bin/busybox sh
rm -f /var/lib/hbpm/apps/$pkg /etc/hebios/desktop.d/$pkg
exit 0
PRERM
    chmod 755 "$d/DEBIAN/prerm"

    # ---- md5sums ----
    (cd "$d" && find . -type f ! -path "./DEBIAN/*" -print0 | xargs -0 md5sum > DEBIAN/md5sums)

    # ---- 打包 ----
    dpkg-deb -Zgzip --root-owner-group --build "$d" "$PKGROOT/${pkg}_${ver}_amd64.deb" >/dev/null
    cp "$PKGROOT/${pkg}_${ver}_amd64.deb" "$PKGROOT/${pkg}_${ver}_amd64.mdn"
    echo "  ✓ ${pkg}_${ver}_amd64.deb/.mdn  ($(du -h "$PKGROOT/${pkg}_${ver}_amd64.deb" | cut -f1))"
}

echo "== 构建合璧OS 自研应用安装包 =="
mkdir -p "$PKGROOT/launchers" "$PKGROOT/icons"

build_one office-assistant "办公助手 · 璧儿" 1.2.0 \
    "富文本办公套件：文档编辑、格式排版、导出 hdoc/docx" \
    hebi-office utils "dialog, busybox"
build_one voice-assistant "语音助手 · 合合" 1.2.0 \
    "自然语言命令中枢：语音识别、系统控制、应用启动" \
    hebi-voice utils "dialog, busybox"
build_one hebi-files "文件管理器 · 璧见" 3.0.1 \
    "双盘资源浏览器：快速访问、双视图、剪贴板、属性面板" \
    hebi-files utils "dialog, busybox"
build_one hebi-music "音乐播放器 · 聆璧" 2.4.0 \
    "终端音乐引擎：播放列表、频谱可视化、封面生成" \
    hebi-music sound "dialog, busybox"
build_one hebi-terminal "终端 · 璧行" 1.0.3 \
    "HeBi Shell 终端：文件管理、hbpm 包管理、系统信息" \
    hebi-shell utils "busybox"
build_one hebi-drivers "驱动管理器" 1.1.0 \
    "通用驱动安装中心：显卡网卡声卡USB打印机一键安装" \
    hebi-drivers utils "dialog, busybox"
build_one hebi-backup "系统备份工具" 1.0.0 \
    "整机快照与增量备份，恢复点管理" \
    hebi-backup utils "tar, gzip, dialog"
build_one logo-lab "徽标设计器" 0.9.5 \
    "合璧徽标参数化生成 SVG/PNG，系统图标定制" \
    logo-lab graphics "imagemagick | coreutils"

# ============================================================
# store-admin — 应用商店管理控制台 (Python/FastAPI 后台, 与上述
# busybox+dialog 应用不同: 面向真实 Debian/Ubuntu 系统安装运行)
# 启动器以后台方式起服务于 http://localhost:8888 并弹出浏览器
# ============================================================
SRC="$(cd "$PKGROOT/../.." && pwd)"
build_store_admin() {
    local pkg="store-admin" ver="1.0.0"
    local name="应用商店管理控制台"
    local d="$BUILD/${pkg}_${ver}_amd64"
    rm -rf "$d"
    mkdir -p "$d/DEBIAN" "$d/usr/bin" "$d/usr/share/applications" \
             "$d/usr/share/hebios/$pkg/static" \
             "$d/usr/share/hebios/$pkg/packages" \
             "$d/usr/share/hebios/$pkg/web-shell" \
             "$d/usr/share/doc/$pkg" "$d/usr/share/pixmaps"

    # ---- 启动器 (POSIX sh: 起服务 + 等就绪 + 弹浏览器) ----
    cp "$PKGROOT/launchers/hebi-store-admin.sh" "$d/usr/bin/hebi-store-admin"
    chmod 755 "$d/usr/bin/hebi-store-admin"

    # ---- 桌面项 ----
    cat > "$d/usr/share/applications/hebi-store-admin.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=$name
Name[zh_CN]=$name
Comment=合璧OS 应用商店后台：应用上架/下架、软件源开关、包上传解析、统计看板
Comment[zh_CN]=合璧OS 应用商店后台：应用上架/下架、软件源开关、包上传解析、统计看板
Exec=hebi-store-admin
Icon=hebi-store-admin
Terminal=true
Categories=Network;System;PackageManager;
Keywords=hebi;hebios;store;admin;商店
X-HeBi-Package=$pkg
X-HeBi-Version=$ver
DESKTOP

    # ---- 载荷: 后台程序 + 控制台 + Web 桌面演示 + 种子包仓库 ----
    cp "$SRC/store-backend/app.py"                "$d/usr/share/hebios/$pkg/app.py"
    cp "$SRC/store-backend/static/admin.html"     "$d/usr/share/hebios/$pkg/static/admin.html"
    cp "$SRC/store-backend/store.db.template"     "$d/usr/share/hebios/$pkg/store.db.template"
    cp -a "$SRC/web-shell/."                      "$d/usr/share/hebios/$pkg/web-shell/"
    # 种子仓库只装 8 款上架应用的 deb+mdn (与 apps 表对应);
    # 必须排除 store-admin 自身 —— 否则每次构建都会把上一版的
    # store-admin deb 嵌进种子目录, deb 体积逐轮递归膨胀 (已实证:
    # 1.4MB -> 3.0MB), 且 store-admin 并不在 apps 表中, 无需分发。
    for f in "$PKGROOT"/*_amd64.deb "$PKGROOT"/*_amd64.mdn; do
        [ -e "$f" ] || continue
        case "$f" in *store-admin*) continue ;; esac
        cp "$f" "$d/usr/share/hebios/$pkg/packages/"
    done

    # ---- 文档与版权 ----
    cat > "$d/usr/share/doc/$pkg/copyright" <<CP
$name ($ver) — 合璧OS 自研
Copyright (C) 2026 珠联璧合工作室 (HeBi OS Project)
License: GPL-3.0-or-later

本包由合璧OS 分发。运行 hebi-store-admin 启动管理控制台:
服务监听 http://localhost:8888 并自动弹出浏览器。
数据存放于 ~/.local/share/hebi-store-admin (store.db + packages/)。
CP
    cat > "$d/usr/share/doc/$pkg/README" <<RM
$name $ver
================
安装:  dpkg -i store-admin_1.0.0_amd64.deb
运行:  hebi-store-admin        # 起服务于 localhost:8888 并弹出浏览器
停止:  hebi-store-admin-stop   # 或直接删除本包 (prerm 自动停止服务)
依赖:  python3 (>= 3.8) + fastapi/uvicorn/pydantic/python-multipart (缺失时启动器自动安装)
端口:  默认 8888, 可用 HB_STORE_PORT 环境变量覆盖
账号:  admin / hebi (演示)
RM

    # ---- 停止助手 (与启动器配套, 供手工停止服务) ----
    cat > "$d/usr/bin/hebi-store-admin-stop" <<'STOP'
#!/bin/sh
# hebi-store-admin-stop — 停止应用商店管理控制台服务
if [ -f /tmp/hebi-store-admin.pid ]; then
    kill "$(cat /tmp/hebi-store-admin.pid)" 2>/dev/null
    rm -f /tmp/hebi-store-admin.pid
    echo "✓ 管理控制台服务已停止"
else
    echo "(未发现运行中的服务)"
fi
exit 0
STOP
    chmod 755 "$d/usr/bin/hebi-store-admin-stop"

    # ---- 图标 ----
    if [ -f "$PKGROOT/icons/$pkg.svg" ]; then
        convert -background none -resize 48x48 "$PKGROOT/icons/$pkg.svg" \
            "$d/usr/share/pixmaps/hebi-store-admin.png" 2>/dev/null || \
            cp "$PKGROOT/icons/$pkg.svg" "$d/usr/share/pixmaps/hebi-store-admin.svg"
    fi

    # ---- DEBIAN 控制文件 ----
    cat > "$d/DEBIAN/control" <<CTRL
Package: $pkg
Version: $ver
Section: net
Priority: optional
Architecture: amd64
Depends: python3 (>= 3.8), dpkg
Recommends: python3-fastapi, python3-uvicorn, python3-pydantic, python3-multipart
Maintainer: $VENDOR
Installed-Size: $(du -sk "$d" | cut -f1)
Description: $name（合璧OS 自研）
 FastAPI + SQLite 后台：自研 .mdn 应用上架/下架/版本管理、8 大网络
 软件源开关、.deb/.mdn 上传与 dpkg 元数据解析、下载统计看板。安装后
 执行 hebi-store-admin，服务启动于 http://localhost:8888 并自动弹出
 浏览器（演示账号 admin / hebi）。
 .
 属于合璧OS 5.0 LTS「Jade」生态；.mdn 与 .deb 字节一致。
CTRL

    # ---- postinst ----
    cat > "$d/DEBIAN/postinst" <<POST
#!/bin/sh
set -e
case "\$1" in
    configure)
        echo "hebi-store-admin: 安装完成"
        echo "  运行 'hebi-store-admin' 启动管理控制台 (http://localhost:8888)"
        mkdir -p /var/lib/hbpm/apps /etc/hebios/desktop.d
        echo "$pkg $ver $STAMP" > /var/lib/hbpm/apps/$pkg
        echo "hebi-store-admin" > /etc/hebios/desktop.d/$pkg
        command -v update-desktop-database >/dev/null 2>&1 && \\
            update-desktop-database -q /usr/share/applications 2>/dev/null || true
        ;;
esac
exit 0
POST
    chmod 755 "$d/DEBIAN/postinst"

    # ---- prerm: 卸载前停止正在运行的服务 ----
    cat > "$d/DEBIAN/prerm" <<PRERM
#!/bin/sh
if [ -f /tmp/hebi-store-admin.pid ]; then
    kill "\$(cat /tmp/hebi-store-admin.pid)" 2>/dev/null || true
    rm -f /tmp/hebi-store-admin.pid
fi
pkill -f "hebios/store-admin/app.py" 2>/dev/null || true
rm -f /var/lib/hbpm/apps/$pkg /etc/hebios/desktop.d/$pkg
exit 0
PRERM
    chmod 755 "$d/DEBIAN/prerm"

    # ---- md5sums ----
    (cd "$d" && find . -type f ! -path "./DEBIAN/*" -print0 | xargs -0 md5sum > DEBIAN/md5sums)

    # ---- 打包 (.deb + .mdn 孪生) ----
    dpkg-deb -Zgzip --root-owner-group --build "$d" "$PKGROOT/${pkg}_${ver}_amd64.deb" >/dev/null
    cp "$PKGROOT/${pkg}_${ver}_amd64.deb" "$PKGROOT/${pkg}_${ver}_amd64.mdn"
    echo "  ✓ ${pkg}_${ver}_amd64.deb/.mdn  ($(du -h "$PKGROOT/${pkg}_${ver}_amd64.deb" | cut -f1))"
}

build_store_admin

echo ""
echo "完成: $(ls "$PKGROOT"/*.deb | wc -l) 个 .deb + $(ls "$PKGROOT"/*.mdn | wc -l) 个 .mdn"
ls -la "$PKGROOT"/*.deb | awk '{printf "  %-52s %s\n", $9, $5}'
