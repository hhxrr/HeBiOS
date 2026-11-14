/* ============================================================
   记事本 / 计算器 / 图片查看器 / 关于
   ============================================================ */
(function () {
  const HB = window.HeBi;
  const { $, el } = HB;

  /* ================= 记事本 ================= */
  HB.registerApp({
    id: "notepad", name: "记事本", icon: "doc", w: 640, h: 480, multi: true,
    open: openNotepad, onArg: (win, arg) => { if (arg && arg.path) openNpFile(win, arg.path); },
  });
  function openNotepad(win) {
    win.body.innerHTML = `<div class="np-app">
      <div class="np-menu">
        <button data-a="new">新建</button><button data-a="open">打开</button>
        <button data-a="save">保存</button><button data-a="saveas">另存为</button>
        <span style="flex:1"></span><button data-a="wrap">自动换行: 开</button>
      </div>
      <textarea class="np-area" id="np-area" placeholder="在此输入文本…"></textarea>
    </div>`;
    const ta = $("#np-area", win.body);
    win._ta = ta; win._path = null;
    let wrap = true;
    const mark = () => win.body.querySelectorAll(".np-menu button").forEach((b) => (b.title = b.textContent + (b.dataset.a === "wrap" ? " · 当前" + (wrap ? "开" : "关") : "")));
    mark();
    win.body.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => {
      const a = b.dataset.a;
      if (a === "new") { ta.value = ""; win._path = null; }
      if (a === "wrap") { wrap = !wrap; ta.style.whiteSpace = wrap ? "pre-wrap" : "pre"; b.textContent = "自动换行: " + (wrap ? "开" : "关"); }
      if (a === "save" || a === "saveas") saveNp(win, a === "saveas");
      if (a === "open") openNpDialog(win);
      mark();
    }));
    ta.addEventListener("keydown", (e) => { if (e.ctrlKey && e.key === "s") { e.preventDefault(); saveNp(win, !win._path); } });
    setTimeout(() => ta.focus(), 50);
  }
  function saveNp(win, as) {
    const ta = win._ta;
    const doSave = (p) => {
      win._path = p;
      HB.vfs.write(p, { name: p.split("/").pop(), type: "file", content: ta.value, size: ta.value.length });
      HB.toast("记事本", "已保存 " + p, "doc");
    };
    if (win._path && !as) doSave(win._path);
    else HB.prompt2("另存为", "保存路径", "/home/" + HB.curUser().id + "/文档/未命名.txt").then((p) => p && doSave(p));
  }
  function openNpFile(win, path) {
    const f = HB.vfs.get(path);
    if (!f || f.type !== "file") { HB.toast("记事本", "无法打开 " + path, "doc"); return; }
    if (!win._ta) openNotepad(win);
    win._ta.value = f.content || "";
    win._path = path;
    HB.toast("记事本", "已打开 " + path, "doc");
  }
  function openNpDialog(win) {
    const root = "/home/" + HB.curUser().id + "/文档";
    const items = HB.vfs.list(root).filter((f) => f.type === "file");
    HB.dialog({
      title: "打开文本", body: items.length
        ? items.map((f) => `<div style="padding:6px 0;border-bottom:1px solid var(--hb-border);cursor:pointer" data-p="${root}/${f.name}">📄 ${f.name}</div>`).join("")
        : "<div style='color:var(--hb-text-2)'>「文档」文件夹为空</div>",
      buttons: [{ label: "取消", value: false }],
    });
    setTimeout(() => {
      HB.$$(".hb-dlg [data-p]").forEach((d) => (d.onclick = () => { openNpFile(win, d.dataset.p); const m = $(".hb-dlg-mask"); if (m) m.remove(); }));
    }, 30);
  }

  /* ================= 计算器 ================= */
  HB.registerApp({
    id: "calc", name: "计算器", icon: "calc", w: 320, h: 470,
    open: openCalc,
  });
  function openCalc(win) {
    win.body.innerHTML = `<div class="ca-app">
      <div class="ca-display"><div class="cd-expr" id="ca-expr"></div><div class="cd-val" id="ca-val">0</div></div>
      <div class="ca-keys">
        ${["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "√", "="]
          .map((k) => `<button class="${"÷×−+=".includes(k) ? "op" : k === "=" ? "eq" : ""}" data-k="${k}">${k}</button>`).join("")}
      </div>
    </div>`;
    const val = $("#ca-val", win.body), expr = $("#ca-expr", win.body);
    let cur = "0", prev = null, op = null, fresh = true;
    const show = () => { val.textContent = cur.length > 12 ? (+cur).toExponential(6) : cur; };
    const calc = () => {
      const a = parseFloat(prev), b = parseFloat(cur);
      let r = b;
      if (op === "+") r = a + b; if (op === "−") r = a - b;
      if (op === "×") r = a * b; if (op === "÷") r = b === 0 ? NaN : a / b;
      return Math.round(r * 1e10) / 1e10;
    };
    win.body.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => {
      const k = b.dataset.k;
      if (/[0-9]/.test(k)) { cur = fresh ? k : cur === "0" ? k : cur + k; fresh = false; }
      else if (k === ".") { if (!cur.includes(".")) cur += "."; fresh = false; }
      else if (k === "C") { cur = "0"; prev = null; op = null; expr.textContent = ""; fresh = true; }
      else if (k === "±") cur = String(-parseFloat(cur));
      else if (k === "%") cur = String(parseFloat(cur) / 100);
      else if (k === "√") cur = String(Math.sqrt(parseFloat(cur)) || 0);
      else if ("÷×−+".includes(k)) { prev = cur; op = k; expr.textContent = cur + " " + k; fresh = true; }
      else if (k === "=") {
        if (prev != null && op) {
          expr.textContent = prev + " " + op + " " + cur + " =";
          cur = String(calc()); prev = null; op = null; fresh = true;
        }
      }
      show();
    }));
    win.body.addEventListener("keydown", (e) => {
      const map = { "/": "÷", "*": "×", "-": "−", "+": "+", "Enter": "=", "=": "=", "Escape": "C", "%": "%" };
      if (/[0-9.]/.test(e.key)) { win.body.querySelector(`[data-k="${e.key}"]`).click(); }
      else if (map[e.key]) { win.body.querySelector(`[data-k="${map[e.key]}"]`).click(); }
      else if (e.key === "Backspace") { cur = cur.length > 1 ? cur.slice(0, -1) : "0"; show(); }
      e.preventDefault();
    });
    setTimeout(() => win.body.setAttribute("tabindex", "0") || win.body.focus(), 50);
    show();
  }

  /* ================= 图片查看器 ================= */
  HB.registerApp({
    id: "imgview", name: "图片查看器", icon: "img", w: 720, h: 540, multi: true,
    open: openImg, onArg: (win, arg) => { if (arg && arg.path) showImg(win, arg.path); },
  });
  function openImg(win) {
    win.body.innerHTML = `<div class="np-app" style="background:#111">
      <div class="np-menu" style="background:#1c1c1c;border-color:#2a2a2a">
        <button data-a="open" style="color:#ddd">打开</button>
        <button data-a="zin" style="color:#ddd">放大</button>
        <button data-a="zout" style="color:#ddd">缩小</button>
        <button data-a="rot" style="color:#ddd">旋转</button>
        <button data-a="fit" style="color:#ddd">适应窗口</button>
        <span style="flex:1"></span><span id="iv-name" style="color:#888;font-size:11.5px;align-self:center"></span>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:auto;background:#111">
        <img id="iv-img" style="max-width:100%;max-height:100%;display:none" />
      </div>
    </div>`;
    const img = $("#iv-img", win.body);
    win._img = img;
    win._zoom = 1; win._rot = 0;
    const apply = () => { img.style.transform = `scale(${win._zoom}) rotate(${win._rot}deg)`; };
    win.body.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => {
      const a = b.dataset.a;
      if (a === "open") {
        const root = "/home/" + HB.curUser().id + "/图片";
        const items = HB.vfs.list(root).filter((f) => f.type === "file" && /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(f.name));
        HB.dialog({
          title: "打开图片", body: items.length
            ? items.map((f) => `<div style="padding:6px 0;border-bottom:1px solid var(--hb-border);cursor:pointer" data-p="${root}/${f.name}">🖼️ ${f.name}</div>`).join("")
            : "<div style='color:var(--hb-text-2)'>「图片」文件夹为空</div>",
          buttons: [{ label: "取消", value: false }],
        });
        setTimeout(() => HB.$$(".hb-dlg [data-p]").forEach((d) => (d.onclick = () => { showImg(win, d.dataset.p); const m = $(".hb-dlg-mask"); if (m) m.remove(); })), 30);
      }
      if (a === "zin") { win._zoom = Math.min(5, win._zoom * 1.25); apply(); }
      if (a === "zout") { win._zoom = Math.max(0.1, win._zoom / 1.25); apply(); }
      if (a === "rot") { win._rot = (win._rot + 90) % 360; apply(); }
      if (a === "fit") { win._zoom = 1; win._rot = 0; apply(); }
    }));
  }
  function showImg(win, path) {
    const f = HB.vfs.get(path);
    if (!f || f.type !== "file" || !f.content) { HB.toast("图片查看器", "无法打开 " + path, "img"); return; }
    if (!win._img) openImg(win);
    win._img.src = f.content.startsWith("data:") || f.content.startsWith("http") ? f.content : "data:image/png;base64," + f.content;
    win._img.style.display = "block";
    $("#iv-name", win.body).textContent = path.split("/").pop() + " · " + HB.vfs.fmtSize(f.size || 0);
    HB.toast("图片查看器", path.split("/").pop(), "img");
  }

  /* ================= 关于 ================= */
  HB.registerApp({
    id: "about", name: "关于合璧OS", icon: "logo", w: 620, h: 500,
    open: openAbout,
  });
  function openAbout(win) {
    win.body.innerHTML = `<div class="ab-app">
      <div class="ab-hero"><img src="data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(HB.LOGO_SVG)))}" alt="logo">
        <div><div class="ah-name">合璧OS</div>
          <div class="ah-ver">HeBi OS 5.0 LTS · 版本 5.0.0 · 代号「Jade 玉」</div>
          <div style="font-size:12px;color:var(--hb-text-2);margin-top:6px">珠联璧合 · 融 Linux 内核，承 Windows 体验</div></div></div>
      <div class="ab-quote">“璧”为玉，“合”为珠联——取 Linux 之开源稳健，融 Windows 之体验亲和。<br>
        支持 .deb / .exe / .msi / .mdn 安装包，内置办公助手与语音助手，应用商店汇聚自研与全球八大源。</div>
      <div class="st-card"><h3>核心特性</h3>
        <div style="font-size:13px;line-height:2">
          🧿 <b>自研开机动画</b>：帧缓冲直写 fbsplash，双环玉璧品牌呈现<br>
          💿 <b>图形化安装</b>：ISO 引导 → 分区 → 账户 → 驱动，全程向导<br>
          📦 <b>四格式包管理</b>：hbpm 统一管理 deb / mdn / exe / msi<br>
          🖋️ <b>Windows 10 字体</b>：Segoe UI / 微软雅黑，ClearType 平滑<br>
          👥 <b>多用户</b>：管理员 / 标准用户 / 来宾，独立会话与权限<br>
          🔧 <b>通用驱动</b>：显卡网卡声卡 USB 打印机，一键安装<br>
          🤖 <b>双内置助手</b>：办公助手璧儿 + 语音助手合合
        </div></div>
      <div class="st-card"><h3>版本信息</h3>
        <div class="st-spec-grid">
          <span class="sp-k">构建</span><span class="sp-v">5.0.0-LTS.20261019</span>
          <span class="sp-k">内核</span><span class="sp-v">Linux 6.8.0-hebi</span>
          <span class="sp-k">桌面环境</span><span class="sp-v">HeBiShell 5.0</span>
          <span class="sp-k">已装应用</span><span class="sp-v">${HB.state.installed.length} 个</span>
        </div></div>
      <div style="margin-top:16px;display:flex;gap:8px">
        <button class="hb-btn primary" onclick="HeBi.openApp('settings','about')">查看设备规格</button>
        <button class="hb-btn" onclick="HeBi.openApp('store','self')">浏览自研应用</button>
      </div>
    </div>`;
  }
})();
