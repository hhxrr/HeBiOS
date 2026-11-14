/* ============================================================
   办公助手 · 璧儿（富文本文档编辑器）
   ============================================================ */
(function () {
  const HB = window.HeBi;
  const { $, $$, el, ico } = HB;

  HB.registerApp({
    id: "office", name: "办公助手", icon: "doc", w: 880, h: 600, multi: true,
    open: openOffice, onArg: (win, arg) => { if (arg && arg.path) openDoc(win, arg.path); },
  });

  const SAMPLE = `<h1>合璧OS 产品白皮书</h1>
<p><b>珠联璧合，融 Linux 内核，承 Windows 体验。</b></p>
<p>合璧OS（HeBi OS）5.0 LTS「Jade」是一款基于 Linux 6.8 内核、面向双生态桌面体验自主研发的操作系统：</p>
<ul>
<li><b>内核层</b>：Linux 6.8 LTS + 自研 fbsplash 开机动画（帧缓冲直写）</li>
<li><b>兼容层</b>：deb / mdn / exe / msi 四格式安装包统一走 hbpm 包管理器</li>
<li><b>体验层</b>：Windows 10 级桌面（开始菜单、任务栏、Aero 贴靠、操作中心）</li>
<li><b>生态层</b>：应用商店 + 8 大网络源 + 自研应用专栏</li>
</ul>
<p>本文档由内置办公助手「璧儿」撰写。试试上方的功能区：修改字体、插入表格、导出 .hdoc。</p>
<table border="1" style="border-collapse:collapse;width:100%"><tr><th>组件</th><th>版本</th></tr><tr><td>内核</td><td>6.8.0-hebi</td></tr><tr><td>桌面</td><td>HeBiShell 5.0</td></tr></table>`;

  function openOffice(win) {
    win.body.innerHTML = `<div class="of-app">
      <div class="of-ribbon">
        <select id="of-ff" title="字体">
          <option>Segoe UI</option><option>Microsoft YaHei</option><option>SimSun</option><option>SimHei</option><option>DengXian</option><option>Cascadia Mono</option>
        </select>
        <select id="of-fs" title="字号"><option>12</option><option selected>15</option><option>18</option><option>22</option><option>28</option><option>36</option></select>
        <span class="or-sep"></span>
        <button data-cmd="bold" title="加粗"><b>B</b></button>
        <button data-cmd="italic" title="斜体"><i>I</i></button>
        <button data-cmd="underline" title="下划线"><u>U</u></button>
        <button data-cmd="strikeThrough" title="删除线"><s>S</s></button>
        <span class="or-sep"></span>
        <button data-cmd="foreColor:#E74856" title="红色字">🔴</button>
        <button data-cmd="foreColor:#2E7CF6" title="蓝色字">🔵</button>
        <button data-cmd="foreColor:#107C10" title="绿色字">🟢</button>
        <span class="or-sep"></span>
        <button data-cmd="justifyLeft" title="左对齐">⯇</button>
        <button data-cmd="justifyCenter" title="居中">⯈</button>
        <button data-cmd="justifyRight" title="右对齐">⯉</button>
        <span class="or-sep"></span>
        <button data-cmd="insertUnorderedList" title="项目符号">•≡</button>
        <button data-cmd="insertOrderedList" title="编号列表">1≡</button>
        <button data-cmd="formatBlock:h1" title="标题1">H1</button>
        <button data-cmd="formatBlock:h2" title="标题2">H2</button>
        <button data-cmd="formatBlock:p" title="正文">¶</button>
        <span class="or-sep"></span>
        <button id="of-table" title="插入表格">▦</button>
        <button id="of-img" title="插入图片">🖼️</button>
        <button id="of-line" title="分隔线">—</button>
        <span class="or-sep"></span>
        <button id="of-save" title="保存 (Ctrl+S)">💾</button>
        <button id="of-export" title="导出">📤</button>
        <button id="of-open" title="打开">📂</button>
      </div>
      <div class="of-page"><div class="of-doc" id="of-doc" contenteditable="true"></div></div>
      <div class="of-status">
        <span id="of-count">字数 0</span><span id="of-path">未命名文档</span>
        <span style="margin-left:auto">合璧OS 办公助手 1.2.0 · 支持导出 .hdoc / .docx</span>
      </div>
    </div>`;
    const doc = $("#of-doc", win.body);
    doc.innerHTML = SAMPLE;
    win._doc = doc; win._path = null;

    const cmd = (c, v) => { doc.focus(); document.execCommand(c, false, v || null); updCount(win); };
    win.body.querySelectorAll("[data-cmd]").forEach((b) => (b.onclick = () => {
      const [c, v] = b.dataset.cmd.split(":");
      cmd(c, v);
    }));
    $("#of-ff", win.body).onchange = (e) => cmd("fontName", e.target.value);
    $("#of-fs", win.body).onchange = (e) => cmd("fontSize", { 12: 2, 15: 3, 18: 4, 22: 5, 28: 6, 36: 7 }[e.target.value] || 3);
    $("#of-table", win.body).onclick = () => {
      let t = '<table border="1" style="border-collapse:collapse;width:100%">';
      for (let r = 0; r < 3; r++) { t += "<tr>"; for (let c = 0; c < 3; c++) t += "<td style='padding:6px'>　</td>"; t += "</tr>"; }
      cmd("insertHTML", t + "</table><p>　</p>");
    };
    $("#of-img", win.body).onclick = () => {
      const cv = document.createElement("canvas"); cv.width = 320; cv.height = 160;
      const x = cv.getContext("2d");
      const g = x.createLinearGradient(0, 0, 320, 160);
      g.addColorStop(0, "#2E7CF6"); g.addColorStop(1, "#22C3E6");
      x.fillStyle = g; x.fillRect(0, 0, 320, 160);
      x.fillStyle = "#fff"; x.font = "bold 20px sans-serif"; x.textAlign = "center";
      x.fillText("合璧OS", 160, 88);
      cmd("insertHTML", `<img src="${cv.toDataURL()}" style="max-width:100%">`);
    };
    $("#of-line", win.body).onclick = () => cmd("insertHorizontalRule");
    $("#of-save", win.body).onclick = () => saveDoc(win);
    $("#of-open", win.body).onclick = () => openDialog(win);
    $("#of-export", win.body).onclick = () => exportDoc(win);
    doc.addEventListener("input", () => updCount(win));
    doc.addEventListener("keydown", (e) => { if (e.ctrlKey && e.key === "s") { e.preventDefault(); saveDoc(win); } });
    updCount(win);
  }

  function updCount(win) {
    const t = win._doc.innerText || "";
    const cn = (t.match(/[\u4e00-\u9fa5]/g) || []).length;
    const en = (t.match(/[a-zA-Z0-9]+/g) || []).length;
    $("#of-count", win.body).textContent = `字数 ${cn + en}（中文 ${cn} · 英文 ${en}）`;
    $("#of-path", win.body).textContent = win._path || "未命名文档";
  }

  function saveDoc(win) {
    const doSave = async (p) => {
      win._path = p;
      HB.vfs.write(p, { name: p.split("/").pop(), type: "file", content: win._doc.innerHTML, size: win._doc.innerHTML.length });
      HB.toast("办公助手", "已保存到 " + p, "doc");
      updCount(win);
    };
    if (win._path) doSave(win._path);
    else HB.prompt2("保存文档", "保存路径", "/home/" + HB.curUser().id + "/文档/未命名文档.hdoc").then((p) => p && doSave(p));
  }

  function openDoc(win, path) {
    const f = HB.vfs.get(path);
    if (!f || f.type !== "file") { HB.toast("办公助手", "无法打开 " + path, "doc"); return; }
    if (!win._doc) openOffice(win);
    win._doc.innerHTML = f.content || "";
    win._path = path;
    updCount(win);
    HB.toast("办公助手", "已打开 " + path, "doc");
  }

  function openDialog(win) {
    const root = "/home/" + HB.curUser().id + "/文档";
    const items = HB.vfs.list(root).filter((f) => f.type === "file");
    HB.dialog({
      title: "打开文档", body: items.length
        ? items.map((f) => `<div style="padding:6px 0;border-bottom:1px solid var(--hb-border);cursor:pointer" data-p="${root}/${f.name}">📄 ${f.name} <span style="float:right;color:var(--hb-text-2);font-size:11px">${HB.vfs.fmtSize(f.size || 0)}</span></div>`).join("")
        : "<div style='color:var(--hb-text-2)'>「文档」文件夹为空</div>",
      buttons: [{ label: "取消", value: false }],
    }).then(() => {});
    setTimeout(() => {
      $$(".hb-dlg [data-p]").forEach((d) => (d.onclick = () => {
        openDoc(win, d.dataset.p);
        const m = $(".hb-dlg-mask"); if (m) m.remove();
      }));
    }, 30);
  }

  function exportDoc(win) {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>合璧OS 文档</title>
<style>body{max-width:680px;margin:40px auto;font-family:"Segoe UI","Microsoft YaHei",sans-serif;line-height:1.75}table{border-collapse:collapse}td,th{border:1px solid #999;padding:6px}</style>
</head><body>${win._doc.innerHTML}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = (win._path || "未命名文档.hdoc").replace(/\.hdoc$/, "") + ".html";
    a.click();
    HB.toast("办公助手", "已导出为 HTML（可再存为 .docx）", "doc");
  }
})();
