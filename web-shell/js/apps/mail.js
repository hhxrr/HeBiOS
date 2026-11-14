/* ============================================================
   合璧邮件 — 完整邮件客户端
   文件夹 / 列表 / 阅读窗格 / 写邮件 / 回复转发 / 删除 /
   星标 / 搜索 / 未读计数 / localStorage 持久化
   ============================================================ */
(function () {
  const HB = window.HeBi;
  const { $, $$, el, ico } = HB;

  const LS_KEY = "hebios-mail-v1";
  const FOLDERS = [
    { id: "inbox", name: "收件箱", icon: "📥" },
    { id: "sent", name: "已发送", icon: "📤" },
    { id: "drafts", name: "草稿", icon: "📝" },
    { id: "trash", name: "已删除", icon: "🗑️" },
  ];

  /* ---------------- 数据层 ---------------- */
  const seed = () => ({
    mails: [
      { id: "m1", folder: "inbox", from: "璧儿 <bier@hebios.cn>", to: "我", subject: "欢迎使用合璧邮件", body: "你好！\n\n欢迎使用合璧OS 内置的「合璧邮件」。\n\n在这里你可以：\n· 收发邮件与管理收件箱\n· 使用星标标记重要邮件\n· 在草稿箱暂存未写完的邮件\n· 全屏搜索历史邮件\n\n有问题随时找我 —— 璧儿", date: "2026-10-20 09:12", read: false, starred: true },
      { id: "m2", folder: "inbox", from: "合璧OS 团队 <team@hebios.cn>", to: "hebios 全体用户", subject: "HeBi OS 5.0 LTS「Jade」发布公告", body: "珠联璧合工作室很高兴地宣布：\n\n合璧OS HeBi OS 5.0 LTS「Jade」正式发布！\n\n本版亮点：\n· 系统内版本标识全面升级 5.0\n· 官网应用商店数据与后台实时同步\n· 网页安装向导在线演示\n· 安装核心性能修复（点击安装不再 CPU 满载）\n\n感谢每一位支持合璧OS的朋友。", date: "2026-10-19 16:40", read: false, starred: false },
      { id: "m3", folder: "inbox", from: "合璧应用商店 <store@hebios.cn>", to: "我", subject: "你关注的「徽标设计器」更新到 0.9.5", body: "你收藏的应用有更新：\n\n徽标设计器 Logo Lab 0.9.5\n· 新增 12 款玉璧系模板\n· 支持导出多尺寸 PNG / SVG\n· 修复导出透明背景偶发失效\n\n打开应用商店 → 我的应用 → 更新。", date: "2026-10-18 21:05", read: true, starred: false },
      { id: "m4", folder: "inbox", from: "聆璧音乐 <music@hebios.cn>", to: "我", subject: "本周新歌推荐 · 珠联璧合", body: "本周为你推荐：\n\n1.《玉璧谣》— 民乐电子\n2.《珠联》— 氛围钢琴\n3.《kernel panic blues》— 极客民谣\n\n打开音乐应用即可收听。", date: "2026-10-17 12:30", read: true, starred: false },
      { id: "m5", folder: "inbox", from: "办公助手 <office@hebios.cn>", to: "我", subject: "你的季度工作报告已生成", body: "根据本周的文档记录，办公助手已为你生成《季度工作报告》草稿。\n\n存放位置：/home/文档/季度报告.hdoc\n\n打开办公助手 → 文档 → 最近文件 即可继续编辑。", date: "2026-10-16 10:02", read: true, starred: true },
      { id: "m6", folder: "sent", from: "我 <me@hebios.cn>", to: "璧儿 <bier@hebios.cn>", subject: "Re: 欢迎使用合璧邮件", body: "邮件客户端很好用！\n\n界面清爽，文件夹一目了然。建议下次加一个「定时发送」。\n\n谢谢！", date: "2026-10-20 09:40", read: true, starred: false },
      { id: "m7", folder: "drafts", from: "我 <me@hebios.cn>", to: "team@hebios.cn", subject: "关于 5.0 安装向导的建议", body: "团队你好：\n\n网页安装向导的演示模式做得很清晰。如果在汇总页能显示预计安装耗时就更好了……", date: "2026-10-21 14:20", read: true, starred: false },
      { id: "m8", folder: "trash", from: "推广 <ads@example.com>", to: "我", subject: "【广告】GPU 算力限时优惠", body: "尊敬的客户……（此邮件已被移至已删除）", date: "2026-10-15 08:00", read: true, starred: false },
    ],
  });
  let db = load();
  function load() {
    try {
      const p = JSON.parse(localStorage.getItem(LS_KEY));
      if (p && Array.isArray(p.mails) && p.mails.length) return p;
    } catch (e) {}
    return seed();
  }
  const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(db)); } catch (e) {} };

  /* ---------------- 应用注册 ---------------- */
  HB.registerApp({
    id: "mail", name: "合璧邮件", icon: "mail", w: 900, h: 580, multi: true,
    keywords: "mail email 邮件 邮箱",
    open: openMail,
  });

  function openMail(win) {
    win.body.innerHTML = `<div class="ml-app">
      <div class="ml-bar">
        <button class="ml-new" id="ml-new">✏️ 新建邮件</button>
        <input class="ml-search" id="ml-search" placeholder="🔍 搜索邮件（主题 / 发件人 / 正文）">
      </div>
      <div class="ml-body">
        <div class="ml-folders" id="ml-folders"></div>
        <div class="ml-list" id="ml-list"></div>
        <div class="ml-read" id="ml-read"></div>
      </div>
    </div>`;
    win._folder = "inbox";
    win._sel = null;
    win._kw = "";
    renderFolders(win);
    renderList(win);
    renderRead(win, null);
    $("#ml-new", win.body).onclick = () => compose(win);
    const s = $("#ml-search", win.body);
    s.oninput = () => { win._kw = s.value.trim(); renderList(win); };
  }

  /* ---------------- 渲染: 文件夹 ---------------- */
  function renderFolders(win) {
    const box = $("#ml-folders", win.body);
    box.innerHTML = FOLDERS.map((f) => {
      const n = db.mails.filter((m) => m.folder === f.id && !m.read).length;
      const cnt = f.id === "trash" ? db.mails.filter((m) => m.folder === "trash").length : n;
      return `<button class="ml-folder ${win._folder === f.id ? "active" : ""}" data-f="${f.id}">
        <span class="mf-ico">${f.icon}</span><span class="mf-name">${f.name}</span>
        ${cnt ? `<span class="mf-count">${cnt}</span>` : ""}</button>`;
    }).join("");
    box.querySelectorAll("[data-f]").forEach((b) => (b.onclick = () => {
      win._folder = b.dataset.f;
      win._sel = null;
      renderFolders(win);
      renderList(win);
      renderRead(win, null);
    }));
    // 回收站清空
    if (win._folder === "trash") {
      const b = el("button", "ml-folder ml-empty-trash");
      b.innerHTML = `<span class="mf-ico">🧹</span><span class="mf-name">清空回收站</span>`;
      b.onclick = async () => {
        if (!db.mails.some((m) => m.folder === "trash")) { HB.toast("合璧邮件", "回收站已经是空的", "mail"); return; }
        if (await HB.dialog({ title: "清空回收站", body: "确定要永久删除回收站中的全部邮件吗？此操作不可撤销。", buttons: [{ label: "取消", value: false }, { label: "全部删除", value: true, danger: true }] })) {
          db.mails = db.mails.filter((m) => m.folder !== "trash");
          save(); win._sel = null;
          renderFolders(win); renderList(win); renderRead(win, null);
          HB.toast("合璧邮件", "回收站已清空", "mail");
        }
      };
      box.appendChild(b);
    }
  }

  /* ---------------- 渲染: 邮件列表 ---------------- */
  function listOf(win) {
    const kw = win._kw.toLowerCase();
    return db.mails
      .filter((m) => m.folder === win._folder)
      .filter((m) => !kw || (m.subject + m.from + m.body).toLowerCase().includes(kw))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }
  function renderList(win) {
    const box = $("#ml-list", win.body);
    const items = listOf(win);
    if (!items.length) {
      box.innerHTML = `<div class="ml-none">${win._kw ? "没有匹配的邮件" : "此文件夹为空"}</div>`;
      return;
    }
    box.innerHTML = items.map((m) => `
      <div class="ml-item ${win._sel === m.id ? "sel" : ""} ${m.read ? "" : "unread"}" data-id="${m.id}">
        <div class="mi-top">
          <span class="mi-from">${esc(m.from.split(" <")[0])}</span>
          <span class="mi-date">${esc(m.date || "")}</span>
        </div>
        <div class="mi-sub">${m.starred ? "⭐ " : ""}${esc(m.subject)}</div>
        <div class="mi-body">${esc(m.body.split("\n")[0].slice(0, 60))}</div>
      </div>`).join("");
    box.querySelectorAll("[data-id]").forEach((it) => (it.onclick = () => {
      const m = db.mails.find((x) => x.id === it.dataset.id);
      if (!m) return;
      m.read = true;
      win._sel = m.id;
      save(); renderFolders(win); renderList(win); renderRead(win, m);
    }));
  }

  /* ---------------- 渲染: 阅读窗格 ---------------- */
  function renderRead(win, m) {
    const box = $("#ml-read", win.body);
    if (!m) {
      box.innerHTML = `<div class="ml-none">选择一封邮件开始阅读</div>`;
      return;
    }
    const isTrash = m.folder === "trash";
    box.innerHTML = `
      <div class="mr-head">
        <div class="mr-sub">${m.starred ? "⭐ " : ""}${esc(m.subject)}</div>
        <div class="mr-meta">
          <div><b>发件人：</b>${esc(m.from)}</div>
          <div><b>收件人：</b>${esc(m.to)}</div>
          <div><b>时间：</b>${esc(m.date || "")}</div>
          <div><b>文件夹：</b>${(FOLDERS.find((f) => f.id === m.folder) || {}).name || m.folder}</div>
        </div>
      </div>
      <div class="mr-body">${esc(m.body).replace(/\n/g, "<br>")}</div>
      <div class="mr-acts">
        <button class="hb-btn" id="mr-star">${m.starred ? "★ 取消星标" : "☆ 加星标"}</button>
        ${isTrash
          ? `<button class="hb-btn" id="mr-restore">↩️ 移回收件箱</button><button class="hb-btn danger" id="mr-forever">🗑️ 永久删除</button>`
          : `<button class="hb-btn" id="mr-reply">↩️ 回复</button><button class="hb-btn" id="mr-fwd">📨 转发</button><button class="hb-btn danger" id="mr-del">🗑️ 删除</button>`}
      </div>`;
    $("#mr-star", box).onclick = () => { m.starred = !m.starred; save(); renderList(win); renderRead(win, m); };
    if (isTrash) {
      $("#mr-restore", box).onclick = () => { m.folder = "inbox"; save(); win._sel = null; renderFolders(win); renderList(win); renderRead(win, null); HB.toast("合璧邮件", "已移回收件箱", "mail"); };
      $("#mr-forever", box).onclick = async () => {
        if (await HB.dialog({ title: "永久删除", body: `确定永久删除「${m.subject}」吗？`, buttons: [{ label: "取消", value: false }, { label: "删除", value: true, danger: true }] })) {
          db.mails = db.mails.filter((x) => x.id !== m.id); save(); win._sel = null;
          renderFolders(win); renderList(win); renderRead(win, null);
          HB.toast("合璧邮件", "已永久删除", "mail");
        }
      };
    } else {
      $("#mr-reply", box).onclick = () => compose(win, { mode: "reply", m });
      $("#mr-fwd", box).onclick = () => compose(win, { mode: "fwd", m });
      $("#mr-del", box).onclick = () => {
        m.folder = "trash"; save(); win._sel = null;
        renderFolders(win); renderList(win); renderRead(win, null);
        HB.toast("合璧邮件", "已移至「已删除」", "mail");
      };
    }
  }

  /* ---------------- 写邮件 / 回复 / 转发 ---------------- */
  function compose(win, opt) {
    opt = opt || {};
    const m = opt.m;
    const to = opt.mode === "reply" ? (m ? m.from : "") : opt.mode === "fwd" ? "" : "";
    const subject = opt.mode === "reply" ? "Re: " + (m ? m.subject : "") : opt.mode === "fwd" ? "Fwd: " + (m ? m.subject : "") : "";
    const quote = opt.mode && m ? `\n\n—— 原始邮件 ——\n发件人：${m.from}\n时间：${m.date || ""}\n\n${m.body}` : "";
    const draftId = "d" + Date.now();
    const dlgP = HB.dialog({
      title: opt.mode === "reply" ? "回复邮件" : opt.mode === "fwd" ? "转发邮件" : "新建邮件",
      body: `<div class="ml-compose">
        <label>收件人</label><input class="hb-input" id="mc-to" value="${escAttr(to)}" placeholder="name@hebios.cn">
        <label>主题</label><input class="hb-input" id="mc-sub" value="${escAttr(subject)}" placeholder="邮件主题">
        <label>正文</label><textarea class="hb-input" id="mc-body" rows="9" placeholder="撰写邮件正文…">${esc(quote)}</textarea>
      </div>`,
      buttons: [
        { label: "存草稿", value: "draft" },
        { label: "取消", value: false },
        { label: "发送", value: "send", primary: true },
      ],
    });
    // 对话框关闭时会从 DOM 移除，先持有输入框引用
    const toI = $("#mc-to"), subI = $("#mc-sub"), bodyI = $("#mc-body");
    dlgP.then((r) => {
      if (!r) return;
      const t = (toI && toI.value.trim()) || "（无收件人）";
      const s = (subI && subI.value.trim()) || "（无主题）";
      const b = bodyI ? bodyI.value : "";
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const mail = { id: draftId, folder: r === "send" ? "sent" : "drafts", from: "我 <me@hebios.cn>", to: t, subject: s, body: b, date: stamp, read: true, starred: false };
      db.mails.push(mail);
      save();
      if (r === "send") { HB.toast("合璧邮件", "邮件已发送至 " + t, "mail"); }
      else { HB.toast("合璧邮件", "已存入草稿箱", "mail"); }
      renderFolders(win); renderList(win);
    });
  }

  /* ---------------- 工具 ---------------- */
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
})();
