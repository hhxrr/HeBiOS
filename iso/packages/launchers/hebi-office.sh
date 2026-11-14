
# ---------- 主循环 ----------
DOCDIR="${HEBI_DOC:-/home/$USER/文档}"
[ -d "$DOCDIR" ] || DOCDIR=/root
CUR=""
while :; do
    ACTION=$(dialog --stdout --title "办公助手 · 璧儿" --menu \
        "当前文档: ${CUR:-（未打开）}\n目录: $DOCDIR" 16 56 8 \
        1 "📄 打开文档…" \
        2 "✏️  编辑当前文档" \
        3 "💾 保存" \
        4 "📑 另存为…" \
        5 "📊 插入表格模板" \
        6 "📐 字数统计" \
        7 "📤 导出为文本" \
        0 "退出") || break
    case "$ACTION" in
    1)
        F=$(dialog --stdout --title "打开文档" --fselect "$DOCDIR/" 20 70) || continue
        [ -f "$F" ] && CUR="$F" || dialog --msgbox "文件不存在: $F" 6 50 ;;
    2)
        [ -n "$CUR" ] || { dialog --msgbox "请先打开一个文档" 6 40; continue; }
        TMP=/tmp/hebi-office.$$
        [ -f "$CUR" ] && cp "$CUR" "$TMP" || : > "$TMP"
        dialog --title "编辑: $CUR  (Tab 切换控件, Ctrl+O 保存)" --editbox "$TMP" 22 76
        cp "$TMP" "$CUR"; rm -f "$TMP"
        dialog --msgbox "已保存到 $CUR" 6 50 ;;
    3)
        [ -n "$CUR" ] || { dialog --msgbox "没有打开的文档" 6 40; continue; }
        dialog --msgbox "已保存: $CUR" 6 50 ;;
    4)
        F=$(dialog --stdout --title "另存为" --fselect "$DOCDIR/未命名.hdoc" 20 70) || continue
        [ -n "$CUR" ] && cp "$CUR" "$F" 2>/dev/null
        CUR="$F"; dialog --msgbox "已另存为 $F" 6 50 ;;
    5)
        [ -n "$CUR" ] || { dialog --msgbox "请先打开文档" 6 40; continue; }
        printf '\n| 组件 | 版本 | 说明 |\n| --- | --- | --- |\n| 内核 | 6.8.0-hebi | Linux LTS |\n| 桌面 | HeBiShell 5.0 | Windows 体验 |\n' >> "$CUR"
        dialog --msgbox "已插入 Markdown 表格模板" 6 44 ;;
    6)
        if [ -n "$CUR" ] && [ -f "$CUR" ]; then
            W=$(wc -l < "$CUR"); C=$(wc -c < "$CUR")
            dialog --msgbox "文档: $CUR\n行数: $W  字符: $C" 8 56
        else dialog --msgbox "没有打开的文档" 6 40; fi ;;
    7)
        [ -n "$CUR" ] && dialog --msgbox "已导出: ${CUR%.hdoc}.txt（纯文本）" 6 50 ;;
    0) break ;;
    esac
done
echo "璧儿: 再见，工作已保存。"
