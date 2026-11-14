
# ---------- 启动系统 HeBi Shell ----------
if [ -x /usr/bin/hebi-shell ]; then
    exec /usr/bin/hebi-shell
else
    echo "璧行: 系统 HeBi Shell 未安装，进入兼容 busybox sh"
    exec /bin/busybox sh
fi
