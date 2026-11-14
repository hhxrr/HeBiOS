#!/bin/bash
# 将 web-shell 打包为单文件 HTML（内联 CSS / JS / Logo）
set -e
cd "$(dirname "$0")"
OUT=/workspace/HeBiOS-3.0-Web-Desktop.html
JS_FILES="js/core.js js/boot.js js/apps.js js/apps/files.js js/apps/music.js js/apps/settings.js js/apps/store.js js/apps/office.js js/apps/voice.js js/apps/terminal.js js/apps/mail.js js/apps/browser.js js/apps/misc.js js/apps/install.js"

python3 - "$OUT" $JS_FILES <<'PYEOF'
import sys, re, base64, pathlib
out = pathlib.Path(sys.argv[1])
root = pathlib.Path("/workspace/web-shell")
css = (root / "css/main.css").read_text(encoding="utf-8")
logo_svg = (root / "assets/logo.svg").read_text(encoding="utf-8")
logo_b64 = base64.b64encode(logo_svg.encode()).decode()

html = (root / "index.html").read_text(encoding="utf-8")
# 替换外链 CSS 为内联
html = html.replace('<link rel="stylesheet" href="css/main.css">',
                    "<style>\n" + css + "\n</style>")
# 替换 favicon 为内联 data URI
html = html.replace('href="assets/logo.svg"',
                    'href="data:image/svg+xml;base64,%s"' % logo_b64)
# 收集 JS 并内联
parts = []
for f in sys.argv[2:]:
    parts.append((root / f).read_text(encoding="utf-8"))
js = "\n;\n".join(parts)
html = re.sub(r'<script src="js/[^"]+"></script>\s*', "", html)
# 在 </body> 前插入全部 JS（避免与原启动 script 嵌套）
html = html.replace("</body>", "<script>\n" + js + "\n</script>\n</body>")
out.write_text(html, encoding="utf-8")
print("单文件已生成:", out, "%.1f KB" % (out.stat().st_size / 1024))
PYEOF
