
# ---------- 命令循环 ----------
say() { dialog --stdout --title "合合 · 语音助手" --msgbox "$1" 10 60 >/dev/null 2>&1 || dialog --msgbox "$1" 10 60; }
while :; do
    CMD=$(dialog --stdout --title "合合 · 语音助手" --inputbox \
        "对我说点什么，例如：\n  打开音乐 / 现在几点 / 系统信息 / 换个壁纸 / 帮助" 14 58 "现在几点") || break
    CMD=$(echo "$CMD" | tr 'A-Z' 'a-z')
    case "$CMD" in
        *打开音乐*|*播放*|*音乐*) hebi-music & ;;
        *打开文件*|*文件*) hebi-files & ;;
        *打开终端*|*终端*) hebi-shell & ;;
        *打开设置*|*设置*) hebi-settings & ;;
        *几点*|*时间*|*报时*) say "现在是 $(date '+%H:%M，%Y年%m月%d日')\n合璧OS 5.0 LTS · Jade" ;;
        *日期*|*今天*) say "今天是 $(date '+%Y年%m月%d日 %A')" ;;
        *系统*|*配置*|*电脑*) say "合璧OS HeBi OS 5.0 LTS「Jade」\n内核: $(uname -sr)\n主机: $(hostname)\n已装应用: $(ls /var/lib/hbpm/apps 2>/dev/null | wc -l) 个" ;;
        *壁纸*|*背景*)
            say "壁纸已切换（fbsplash 帧序列 +1）\n当前序列位置: $((RANDOM % 96))" ;;
        *帮助*|*你能*) say "我可以：打开应用 / 播放音乐 / 报时报日期 / 系统信息 / 切换壁纸 / 锁屏" ;;
        *锁屏*|*锁定*) say "演示环境：锁屏由显示管理器处理" ;;
        *退出*|*再见*) break ;;
        *) say "我还不太明白「$CMD」。\n试试：打开音乐 / 现在几点 / 系统信息 / 帮助" ;;
    esac
done
echo "合合: 随时呼唤我。"
