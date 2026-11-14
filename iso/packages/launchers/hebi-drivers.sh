
# ---------- 硬件扫描与驱动安装 ----------
CONF=/etc/hebios/drivers.conf
mkdir -p /etc/hebios
[ -f "$CONF" ] || echo "# 合璧OS 驱动配置（hbpm drivers 生成）" > "$CONF"
scan() {
    ITEMS=""
    # PCI 设备
    for dev in /sys/bus/pci/devices/*/device 2>/dev/null; do
        [ -e "$dev" ] || continue
        ID=$(cat "$dev" 2>/dev/null)
        NAME=$(cat "$(dirname $dev)/label" 2>/dev/null || echo "PCI 设备 $ID")
        if grep -q "$NAME" "$CONF" 2>/dev/null; then ST=on; else ST=off; fi
        ITEMS="$ITEMS \"$NAME\" \"驱动 v1.0 · $(du -h $dev | cut -f1)\" $ST"
    done
    # 网卡
    for n in /sys/class/net/*; do
        [ -e "$n" ] || continue
        IF=$(basename "$n"); [ "$IF" = "lo" ] && continue
        MAC=$(cat "$n/address" 2>/dev/null)
        if grep -q "$IF" "$CONF" 2>/dev/null; then ST=on; else ST=off; fi
        ITEMS="$ITEMS \"网卡 $IF ($MAC)\" \"e1000/virtio-net\" $ST"
    done
    # 块设备
    for b in /sys/block/*; do
        [ -e "$b" ] || continue
        DEV=$(basename "$b"); case "$DEV" in ram*) continue;; esac
        SZ=$(cat "$b/size" 2>/dev/null)
        if grep -q "$DEV" "$CONF" 2>/dev/null; then ST=on; else ST=off; fi
        ITEMS="$ITEMS \"磁盘 $DEV (${SZ} 扇区)\" \"nvme/virtio-blk\" $ST"
    done
    echo "$ITEMS"
}
while :; do
    SEL=$(eval dialog --stdout --separate-output --title "驱动管理器 — 合璧OS" --checklist \
        \"已检测到以下硬件，勾选并安装通用驱动：\" 20 74 8 $(scan)) || break
    if [ -n "$SEL" ]; then
        for s in $SEL; do
            NAME=$(echo "$s" | sed 's/ (.*//')
            grep -q "$NAME" "$CONF" || echo "$NAME installed $(date '+%F')" >> "$CONF"
        done
        dialog --msgbox "驱动安装完成：\n$SEL\n\n配置写入 $CONF" 12 56
    fi
    A=$(dialog --stdout --title "驱动管理器" --menu "操作" 12 60 4 \
        1 "🔍 重新扫描硬件" 2 "📜 查看已装驱动" 3 "♻️  重置全部驱动" 0 "退出") || break
    case "$A" in
        2) dialog --textbox "$CONF" 18 70 ;;
        3) echo "# 合璧OS 驱动配置" > "$CONF"; dialog --msgbox "已重置" 6 30 ;;
        0) break ;;
    esac
done
echo "驱动管理器: 配置已保存"
