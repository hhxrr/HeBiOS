
# ---------- 目录浏览器 ----------
CUR="${HEBI_HOME:-/root}"
while :; do
    # 生成菜单项
    LIST=$(ls -la "$CUR" | tail -n +2 | awk '{v=$1; n=$9; for(i=10;i<=NF;i++) n=n" "$i; if(n=="."||n=="..") next; printf "%s\t%s\n", (v ~ /^d/ ? "[目录]" : "      "), n}' | head -30)
    SEL=$(dialog --stdout --title "文件管理器 · 璧见 — $CUR" --menu \
        "↑/↓ 选择，回车进入；操作见下方按钮" 22 74 14 \
        "..|返回上级目录|" $LIST 2>/dev/null) || break
    [ -z "$SEL" ] && continue
    if [ "$SEL" = ".." ]; then CUR=$(dirname "$CUR"); continue; fi
    TARGET="$CUR/$SEL"
    if [ -d "$TARGET" ]; then CUR="$TARGET"; continue; fi
    # 文件操作
    OP=$(dialog --stdout --title "$SEL" --menu "大小: $(du -h "$TARGET" | cut -f1)  修改: $(date -r "$TARGET" '+%F %T' 2>/dev/null)" 14 60 6 \
        1 "👁️  查看内容" 2 "✏️  编辑" 3 "📋 复制到…" 4 "🗑️  删除" 5 "ℹ️  属性" 0 "返回") || continue
    case "$OP" in
        1) dialog --title "$SEL" --textbox "$TARGET" 20 74 ;;
        2) T=/tmp/hbf.$$; cp "$TARGET" "$T"; dialog --editbox "$T" 20 74; cp "$T" "$TARGET"; rm -f "$T" ;;
        3) D=$(dialog --stdout --title "复制到" --fselect "$CUR/" 18 70) || continue
           cp -r "$TARGET" "$D/" && dialog --msgbox "已复制到 $D" 6 50 ;;
        4) dialog --yesno "确定删除 $SEL？" 7 46 && { rm -rf "$TARGET"; } ;;
        5) dialog --msgbox "路径: $TARGET\n类型: $(file -b "$TARGET" 2>/dev/null || echo 文件)\n大小: $(du -h "$TARGET" | cut -f1)\n权限: $(ls -l "$TARGET" | awk '{print $1}')" 10 58 ;;
    esac
done
echo "璧见: 已退出文件管理器"
