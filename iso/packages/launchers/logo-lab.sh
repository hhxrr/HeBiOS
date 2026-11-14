
# ---------- 徽标参数化生成 ----------
OUTDIR="${HEBI_LOGO_OUT:-/root/图片}"
mkdir -p "$OUTDIR" 2>/dev/null || OUTDIR=/tmp
gen_svg() {
    local R="$1" CORE="$2" RING="$3"
    cat <<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="$CORE"/><stop offset="1" stop-color="$RING"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="$R" fill="none" stroke="url(#g1)" stroke-width="18" opacity="0.9"/>
  <circle cx="256" cy="256" r="104" fill="url(#g1)"/>
  <g stroke="#FFFFFF" stroke-width="13" stroke-linecap="round">
    <line x1="256" y1="196" x2="256" y2="316"/>
    <line x1="196" y1="256" x2="316" y2="256"/>
  </g>
</svg>
SVG
}
while :; do
    A=$(dialog --stdout --title "徽标设计器 · 合璧OS" --menu "参数化生成合璧徽标（双环玉璧）" 16 66 6 \
        1 "🎨 玉璧青（默认）  #2E7CF6 → #22C3E6" \
        2 "🌌 星云紫         #7A5AF8 → #B36BFF" \
        3 "🍵 青瓷绿         #00B4A6 → #6FE3C0" \
        4 "🔴 朱砂红         #E74856 → #FF8A7A" \
        5 "⚫ 水墨墨         #2B2F36 → #5B6470" \
        0 "退出") || break
    case "$A" in
    1) C="#2E7CF6"; R2="#22C3E6"; N="jade" ;;
    2) C="#7A5AF8"; R2="#B36BFF"; N="nebula" ;;
    3) C="#00B4A6"; R2="#6FE3C0"; N="celadon" ;;
    4) C="#E74856"; R2="#FF8A7A"; N="cinnabar" ;;
    5) C="#2B2F36"; R2="#5B6470"; N="ink" ;;
    0) break ;;
    esac
    F="$OUTDIR/hebi-logo-$N.svg"
    gen_svg 178 "$C" "$R2" > "$F"
    if command -v convert >/dev/null 2>&1; then
        convert -background none "$F" "$OUTDIR/hebi-logo-$N-48.png" 2>/dev/null
        convert -background none -resize 256x256 "$F" "$OUTDIR/hebi-logo-$N-256.png" 2>/dev/null
        dialog --msgbox "已生成:\n  $F\n  hebi-logo-$N-48.png\n  hebi-logo-$N-256.png" 10 58
    else
        dialog --msgbox "已生成: $F" 7 50
    fi
done
echo "徽标设计器: 作品已保存到 $OUTDIR"
