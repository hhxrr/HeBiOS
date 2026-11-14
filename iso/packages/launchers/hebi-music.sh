
# ---------- 曲库与播放动画 ----------
TRACKS="珠玉浅吟|璧合之夜|青瓷流光|云窗寄梦|海上升月|竹露清响"
NAMES=$(echo "$TRACKS" | tr '|' '\n' | nl -ba | awk '{printf "%s \"%s\" ", $1, $2}')
BAR="▏▎▍▌▋▊▉█"
stop=0
play_anim() {
    local idx="$1" t=0 i
    while [ $stop -eq 0 ]; do
        ROW=""
        for i in 1 2 3 4 5 6 7 8; do
            LV=$(( (RANDOM % 8) + 1 ))
            S=$(echo "$BAR" | cut -c$LV)
            ROW="$ROW $S"
        done
        printf "\r  ▶ 播放中 %-*s  %s %02d:%02d " 12 "$(echo "$TRACKS" | cut -d'|' -f$idx)" "$ROW" $((t/60)) $((t%60))
        sleep 1; t=$((t+1))
    done
}
while :; do
    SEL=$(dialog --stdout --title "音乐播放器 · 聆璧" --menu "选择曲目（程序实时合成，无需音频文件）" 16 62 8 \
        $NAMES 9 "⏹ 停止" 0 "退出") || break
    case "$SEL" in
        0) break ;;
        9) stop=1; sleep 1.2; stop=0; echo "已停止" ;;
        *) stop=0; play_anim "$SEL" & ANIM=$!
           dialog --msgbox "正在播放：$(echo "$TRACKS" | cut -d'|' -f$SEL)\n\n合璧OS 内置合成音序器\n（关闭此框继续播放）" 10 52
           stop=1; wait $ANIM 2>/dev/null; stop=0 ;;
    esac
done
echo "聆璧: 感谢聆听"
