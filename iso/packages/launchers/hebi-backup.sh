
# ---------- 系统备份 ----------
BKDIR=/var/backups/hebios
mkdir -p "$BKDIR"
while :; do
    A=$(dialog --stdout --title "系统备份工具" --menu "合璧OS 备份中心" 14 64 6 \
        1 "💾 立即创建整机快照" \
        2 "📜 恢复点列表" \
        3 "♻️  从恢复点还原（/etc + /home）" \
        4 "🗑️  删除恢复点" \
        5 "☁️  云端同步设置" \
        0 "退出") || break
    case "$A" in
        1)
            NAME="hebios-$(date '+%Y%m%d-%H%M%S').tar.gz"
            (tar czf "$BKDIR/$NAME" /etc /home /var/lib/hbpm 2>/dev/null; echo 100) | dialog --gauge "正在压缩 /etc /home /var/lib/hbpm …" 8 60
            dialog --msgbox "快照已创建:\n$BKDIR/$NAME\n大小: $(du -h "$BKDIR/$NAME" | cut -f1)" 9 60 ;;
        2)
            LS=$(ls -lh "$BKDIR" 2>/dev/null | tail -n +2 | awk '{print $9"  "$5"  "$6" "$7" "$8}' | head -20)
            [ -n "$LS" ] && dialog --title "恢复点" --msgbox "$LS" 20 66 || dialog --msgbox "暂无恢复点" 6 30 ;;
        3)
            F=$(dialog --stdout --title "选择恢复点" --fselect "$BKDIR/" 18 70) || continue
            [ -f "$F" ] || continue
            dialog --yesno "将从 $F 还原 /etc 与 /home\n确定继续？" 8 60 || continue
            (tar xzf "$F" -C / 2>/dev/null; echo 100) | dialog --gauge "正在还原…" 8 50
            dialog --msgbox "还原完成。建议重启系统。" 7 44 ;;
        4)
            F=$(dialog --stdout --title "删除恢复点" --fselect "$BKDIR/" 18 70) || continue
            [ -f "$F" ] && rm -f "$F" && dialog --msgbox "已删除" 6 30 ;;
        5)
            dialog --msgbox "云端同步（演示）:\n  端点: sync.hebios.cn\n  状态: 未配置账户\n  频率: 每日 03:00" 10 50 ;;
        0) break ;;
    esac
done
echo "备份工具: 再见"
