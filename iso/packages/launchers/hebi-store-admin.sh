#!/bin/sh
# ============================================================
# hebi-store-admin — 合璧OS 应用商店管理控制台启动器
# FastAPI + SQLite 后台; 启动于 http://localhost:8888 并弹出浏览器
# 端口可用环境变量 HB_STORE_PORT 覆盖
# ============================================================
PORT=${HB_STORE_PORT:-8888}
APPDIR=/usr/share/hebios/store-admin
URL="http://localhost:$PORT"
LOGF=/tmp/hebi-store-admin.log
PIDF=/tmp/hebi-store-admin.pid

ready() {
    python3 -c "import urllib.request as u; u.urlopen('$URL/api/stats', timeout=1)" 2>/dev/null
}

# ---- 依赖检查: fastapi / uvicorn / pydantic / python-multipart ----
# 注: python-multipart 缺失时 FastAPI 注册上传路由即抛 RuntimeError,
#     服务无法启动 (apt 的 python3-fastapi 不依赖它, 必须显式安装)
DEPS="fastapi, uvicorn, pydantic, multipart"
deps_ok() { python3 -c "import $DEPS" 2>/dev/null; }
if ! deps_ok; then
    echo "首次运行: 正在安装 Python 依赖 (fastapi / uvicorn / pydantic / python-multipart) ..."
    python3 -m pip install --user --quiet fastapi uvicorn pydantic python-multipart >/dev/null 2>&1
    if ! deps_ok; then
        echo "✗ 依赖安装失败, 请手动执行:"
        echo "    python3 -m pip install --user fastapi uvicorn pydantic python-multipart"
        echo "  (或通过系统包管理器安装 python3-fastapi / python3-uvicorn / python3-multipart)"
        exit 1
    fi
fi

# ---- 启动服务 (已在运行则直接复用) ----
if ready; then
    echo "管理控制台已在运行: $URL"
else
    echo "正在启动 合璧OS 应用商店管理控制台 (端口 $PORT) ..."
    HB_STORE_PORT="$PORT" nohup python3 "$APPDIR/app.py" >"$LOGF" 2>&1 &
    echo $! > "$PIDF"
    i=0
    while [ "$i" -lt 20 ]; do
        ready && break
        sleep 0.5
        i=$((i + 1))
    done
    if [ "$i" -ge 20 ]; then
        echo "✗ 服务启动超时, 请查看日志: $LOGF"
        exit 1
    fi
    echo "✓ 服务已就绪 (日志: $LOGF)"
fi

# ---- 弹出浏览器 ----
echo "========================================================"
echo "   合璧OS HeBi OS 5.0 LTS「Jade」— 应用商店管理控制台"
echo "   本机访问:   $URL"
echo "   演示账号:   admin / hebi"
IP=$(ip route get 1 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($(i)=="src") print $(i+1)}' | head -1)
[ -n "$IP" ] && echo "   局域网访问: http://$IP:$PORT"
echo "========================================================"
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 && echo "✓ 已弹出浏览器: $URL"
elif command -v gio >/dev/null 2>&1; then
    gio open "$URL" >/dev/null 2>&1 && echo "✓ 已弹出浏览器: $URL"
elif command -v open >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 && echo "✓ 已弹出浏览器: $URL"
else
    echo "(未检测到桌面环境 — 请在任意设备的浏览器中打开 $URL)"
fi
exit 0
