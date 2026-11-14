/* ============================================================
   HeBi 浏览器 — 多标签浏览器
   标签管理 / 地址栏 / 前进后退 / 刷新 / 主页 / 书签栏 /
   内置站点 / 模拟搜索 / 历史记录 / 新标签页
   ============================================================ */
(function () {
  const HB = window.HeBi;
  const { $, $$, el, ico } = HB;

  /* ---------------- 内置站点 ---------------- */
  const SITES = {
    "hebi://home": { title: "新标签页", render: renderHome },
    "hebi://about": { title: "关于 HeBi 浏览器", render: renderAbout },
    "hebi://history": { title: "历史记录", render: renderHistory },
    "hebi://bookmarks": { title: "书签管理", render: renderBookmarks },
    "hebios.cn": { title: "合璧OS 官网", render: () => sitePage("hebios.cn", "合璧OS 官网", "#2E7CF6", [
      [" hero", ""], ["特性", "系统特性一览：开机动画、图形化安装、四格式包管理、Windows 10 字体、多用户"], ["下载", "获取 HeBi OS 5.0 LTS「Jade」amd64 镜像（约 92 MB）"], ["安装", "光盘 / U 盘启动，或使用网页安装向导"], ["商店", "8 款上架应用 · 8 个软件源 · 18 个离线安装包"], ["文档", "开发文档与常见问题"],
    ]) },
    "store.hebios.cn": { title: "合璧应用商店", render: () => sitePage("store.hebios.cn", "合璧应用商店", "#00B4A6", [
      ["精选", "办公助手 1.2.0 · 语音助手 1.2.0 · 文件管理器 3.0.1"], ["热门", "音乐播放器 2.4.0 · 终端 1.0.3 · 驱动管理器 1.1.0"], ["新上架", "徽标设计器 0.9.5 · 系统备份工具 1.0.0"], ["软件源", "flathub · snap · aur · deepin · hbpm · wine（6 启用）"],
    ]) },
    "bbs.hebios.cn": { title: "合璧社区", render: () => sitePage("bbs.hebios.cn", "合璧社区", "#7A5AF8", [
      ["置顶", "HeBi OS 5.0 LTS 发布公告 & 升级指南"], ["热帖", " VMware 安装全记录：SATA / NVMe / LSI 三种控制器实测"], ["求助", "hbpm 安装第三方 deb 失败怎么办？"], ["分享", "我的玉璧主题桌面 Show"],
    ]) },
    "docs.hebios.cn": { title: "合璧文档", render: () => sitePage("docs.hebios.cn", "合璧文档", "#107C10", [
      ["快速开始", "镜像写入 → 启动 → 安装 → 首次配置"], ["包管理", "hbpm 用法：安装 / 卸载 / 搜索 / 远程源"], ["开发", "Web 桌面扩展与自研应用打包"], ["FAQ", "启动失败、驱动缺失、网络配置"],
    ]) },
  };
  const BOOKMARKS_DEF = [
    { url: "hebios.cn", name: "合璧官网" },
    { url: "store.hebios.cn", name: "应用商店" },
    { url: "bbs.hebios.cn", name: "合璧社区" },
    { url: "docs.hebios.cn", name: "合璧文档" },
    { url: "hebi://about", name: "关于浏览器" },
  ];
  const LS_KEY = "hebios-browser-v1";
  let store = loadStore();
  function loadStore() {
    try {
      const p = JSON.parse(localStorage.getItem(LS_KEY));
      if (p && Array.isArray(p.bookmarks)) return p;
    } catch (e) {}
    return { bookmarks: BOOKMARKS_DEF.slice(), history: [] };
  }
  const saveStore = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (e) {} };

  /* ---------------- 应用注册 ---------------- */
  HB.registerApp({
    id: "browser", name: "HeBi 浏览器", icon: "browser", w: 980, h: 620, multi: true,
    keywords: "browser web 浏览器 上网 edge",
    open: openBrowser,
  });

  let tabSeq = 1;
  // 窗口实例挂到 DOM 上，供 document 级委托反查（core.js 的 wins Map 未导出）
  function winOf(node) {
    const wel = node && node.closest && node.closest(".hb-win");
    return wel ? wel._hbBrWin : null;
  }
  function openBrowser(win, arg) {
    win._tabs = [];
    win._active = null;
    win.el._hbBrWin = win;
    win.body.innerHTML = `<div class="br-app">
      <div class="br-tabs" id="br-tabs"></div>
      <div class="br-tools">
        <button class="br-tb" id="br-back" title="后退">←</button>
        <button class="br-tb" id="br-fwd" title="前进">→</button>
        <button class="br-tb" id="br-ref" title="刷新">⟳</button>
        <button class="br-tb" id="br-home" title="主页">🏠</button>
        <input class="br-addr" id="br-addr" placeholder="输入网址或搜索内容，回车访问">
        <button class="br-tb" id="br-star" title="加入书签">☆</button>
        <button class="br-tb" id="br-menu" title="菜单">⋮</button>
      </div>
      <div class="br-marks" id="br-marks"></div>
      <div class="br-page" id="br-page"></div>
      <div class="br-status" id="br-status">就绪</div>
    </div>`;
    newTab(win, "hebi://home");
    $("#br-back", win.body).onclick = () => go(win, -1);
    $("#br-fwd", win.body).onclick = () => go(win, 1);
    $("#br-ref", win.body).onclick = () => render(win);
    $("#br-home", win.body).onclick = () => navigate(win, "hebi://home");
    const addr = $("#br-addr", win.body);
    addr.onkeydown = (e) => {
      if (e.key !== "Enter") return;
      const v = addr.value.trim();
      if (!v) return;
      navigate(win, normalize(v));
    };
    addr.onfocus = () => addr.select();
    $("#br-star", win.body).onclick = () => addBookmark(win);
    $("#br-menu", win.body).onclick = (e) => openMenu(win, e);
    renderTabs(win); renderMarks(win); render(win);
  }

  /* ---------------- 标签管理 ---------------- */
  function newTab(win, url) {
    const t = { id: tabSeq++, url: null, title: "新标签页", hist: [], hidx: -1 };
    win._tabs.push(t);
    win._active = t.id;
    if (url) navigate(win, url);
    renderTabs(win); render(win);
    return t;
  }
  function activeTab(win) { return win._tabs.find((t) => t.id === win._active); }
  function closeTab(win, id) {
    const i = win._tabs.findIndex((t) => t.id === id);
    if (i < 0) return;
    win._tabs.splice(i, 1);
    if (!win._tabs.length) { HB.closeWin(win.id); return; }
    if (win._active === id) win._active = win._tabs[Math.min(i, win._tabs.length - 1)].id;
    renderTabs(win); render(win);
  }
  function renderTabs(win) {
    const box = $("#br-tabs", win.body);
    box.innerHTML = win._tabs.map((t) => `
      <div class="br-tab ${t.id === win._active ? "active" : ""}" data-t="${t.id}">
        <span class="bt-fav">${t.id === win._active ? "🌐" : "▫️"}</span>
        <span class="bt-title">${esc(t.title)}</span>
        <button class="bt-x" data-x="${t.id}" title="关闭标签">✕</button>
      </div>`).join("") + `<button class="br-tab-add" id="br-addtab" title="新建标签">＋</button>`;
    box.querySelectorAll("[data-t]").forEach((t) => (t.onclick = (e) => {
      if (e.target.dataset.x) return;
      win._active = +t.dataset.t;
      renderTabs(win); render(win);
    }));
    box.querySelectorAll("[data-x]").forEach((x) => (x.onclick = (e) => { e.stopPropagation(); closeTab(win, +x.dataset.x); }));
    $("#br-addtab", box).onclick = () => { newTab(win, "hebi://home"); $("#br-addr", win.body).focus(); };
  }

  /* ---------------- 导航 ---------------- */
  function normalize(v) {
    if (/^hebi:\/\//.test(v)) return v;
    if (/^https?:\/\//.test(v)) return v.replace(/^https?:\/\//, "");
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) return v;
    return "hebi://search?q=" + encodeURIComponent(v);
  }
  function navigate(win, url) {
    const t = activeTab(win);
    if (!t) return;
    t.hist = t.hist.slice(0, t.hidx + 1);
    t.hist.push(url);
    t.hidx = t.hist.length - 1;
    t.url = url;
    if (url !== "hebi://home") addHistory(url);
    render(win);
  }
  function go(win, d) {
    const t = activeTab(win);
    if (!t) return;
    const ni = t.hidx + d;
    if (ni < 0 || ni >= t.hist.length) return;
    t.hidx = ni;
    t.url = t.hist[ni];
    render(win);
  }
  function addHistory(url) {
    const s = SITES[url];
    store.history.unshift({ url, title: s ? s.title : url, time: new Date().toLocaleString("zh-CN", { hour12: false }) });
    if (store.history.length > 50) store.history.length = 50;
    saveStore();
  }

  /* ---------------- 渲染 ---------------- */
  function titleOf(url) {
    if (!url) return "新标签页";
    if (url.indexOf("hebi://search?") === 0) {
      let q = "";
      try { q = decodeURIComponent(url.split("q=")[1] || ""); } catch (e) {}
      return q ? q + " - 搜索" : "搜索";
    }
    return SITES[url] ? SITES[url].title : "无法访问";
  }
  function render(win) {
    const t = activeTab(win);
    if (!t) return;
    // 先更新标题再渲染标签栏，避免标签文字慢一拍
    t.title = titleOf(t.url || "hebi://home");
    renderTabs(win); renderMarks(win);
    const addr = $("#br-addr", win.body);
    addr.value = t.url === "hebi://search?q=" + decodeAddr(t.url) ? "" : (t.url || "");
    if (t.url && t.url.indexOf("hebi://search?") === 0) {
      try { addr.value = decodeURIComponent(t.url.split("q=")[1] || ""); } catch (e) { addr.value = ""; }
    }
    const page = $("#br-page", win.body);
    const url = t.url || "hebi://home";
    if (url.indexOf("hebi://search?") === 0) {
      let q = "";
      try { q = decodeURIComponent(url.split("q=")[1] || ""); } catch (e) {}
      page.innerHTML = renderSearch(q);
      bindSearch(win, q);
    } else {
      const s = SITES[url];
      if (s) {
        page.innerHTML = "";
        page.appendChild(s.render(win));
      } else {
        page.innerHTML = `<div class="br-err"><div class="be-ico">🌐</div><div class="be-t">无法访问此网站</div>
          <div class="be-u">${esc(url)}</div>
          <div class="be-d">合璧浏览器为离线演示环境，仅内置少量站点。<br>试试访问 hebios.cn、store.hebios.cn，或直接输入关键词搜索。</div></div>`;
      }
    }
    $("#br-back", win.body).disabled = t.hidx <= 0;
    $("#br-fwd", win.body).disabled = t.hidx >= t.hist.length - 1;
    $("#br-star", win.body).textContent = store.bookmarks.some((b) => b.url === url) ? "★" : "☆";
    $("#br-status", win.body).textContent = (SITES[url] ? "已加载：" : "地址：") + url + (store.history.length ? " · 历史 " + store.history.length + " 条" : "");
  }
  function decodeAddr(u) { try { return decodeURIComponent(u.split("q=")[1] || ""); } catch (e) { return ""; } }

  /* ---------------- 内置页面 ---------------- */
  function shell(inner) {
    const d = el("div", "br-doc");
    d.innerHTML = inner;
    return d;
  }
  function renderHome(win) {
    return shell(`<div class="bh-hero">
        <div class="bh-logo">${HB.LOGO_SVG.replace("<svg ", "<svg width='64' height='64' ")}</div>
        <div class="bh-title">HeBi 浏览器</div>
        <div class="bh-sub">珠联璧合 · 融 Linux 内核，承 Windows 体验</div>
        <input class="bh-search" id="bh-q" placeholder="输入关键词，回车搜索">
      </div>
      <div class="bh-tiles">
        ${BOOKMARKS_DEF.map((b) => `<button class="bh-tile" data-u="${b.url}"><span class="bt2-ico">${ico("browser", 26)}</span>${b.name}</button>`).join("")}
      </div>
      <div class="bh-note">提示：地址栏输入 hebios.cn / store.hebios.cn / bbs.hebios.cn / docs.hebios.cn 可直接访问内置站点</div>`);
  }
  function renderAbout(win) {
    return shell(`<div class="bp-card"><h2>关于 HeBi 浏览器</h2>
      <p>HeBi 浏览器是合璧OS 内置的网页浏览器，为离线演示环境。</p>
      <div class="bp-kv"><span>版本</span><span>5.0.0-jade</span></div>
      <div class="bp-kv"><span>内核</span><span>HeBiWebEngine（演示）</span></div>
      <div class="bp-kv"><span>协议</span><span>hebi:// 内置页面</span></div>
      <div class="bp-kv"><span>书签</span><span>${store.bookmarks.length} 个</span></div>
      <div class="bp-kv"><span>历史</span><span>${store.history.length} 条</span></div>
      <p style="margin-top:12px;color:var(--hb-text-2)">在真实系统中，此处由系统 WebView 组件渲染网页。</p></div>`);
  }
  function renderHistory(win) {
    if (!store.history.length) return shell(`<div class="bp-card"><h2>历史记录</h2><p style="color:var(--hb-text-2)">暂无历史记录</p></div>`);
    return shell(`<div class="bp-card"><h2>历史记录</h2>
      <div style="margin:10px 0"><button class="hb-btn danger" id="bh-clear">清空历史记录</button></div>
      <div class="bp-hist">${store.history.map((h, i) => `
        <div class="bp-hrow"><button class="bp-hlink" data-u="${h.url}">${esc(h.title)}</button>
        <span class="bp-hurl">${esc(h.url)}</span><span class="bp-ht">${esc(h.time)}</span></div>`).join("")}</div></div>`);
  }
  function renderBookmarks(win) {
    return shell(`<div class="bp-card"><h2>书签管理</h2>
      <div class="bp-bms">${store.bookmarks.map((b, i) => `
        <div class="bp-brow"><button class="bp-hlink" data-u="${b.url}">${esc(b.name)}</button>
        <span class="bp-hurl">${esc(b.url)}</span>
        <button class="hb-btn danger" data-rm="${i}">删除</button></div>`).join("") || "<p style='color:var(--hb-text-2)'>暂无书签</p>"}</div></div>`);
  }
  function sitePage(host, title, color, secs) {
    return shell(`<div class="sp-wrap" style="--sp-c:${color}">
      <div class="sp-head"><div class="sp-logo">${HB.LOGO_SVG.replace("<svg ", "<svg width='34' height='34' ")}</div>
        <div><div class="sp-title">${esc(title)}</div><div class="sp-host">${esc(host)}</div></div></div>
      <div class="sp-secs">${secs.map((s) => `<div class="sp-sec"><h4>${esc(s[0])}</h4><p>${esc(s[1])}</p></div>`).join("")}</div>
      <div class="sp-foot">合璧OS 离线演示站点 · 内容为模拟数据</div></div>`);
  }
  function renderSearch(q) {
    if (!q) return `<div class="br-srch"><div class="bs-t">输入关键词开始搜索</div></div>`;
    const ql = q.toLowerCase();
    const hits = Object.keys(SITES)
      .filter((u) => u !== "hebi://home")
      .map((u) => ({ u, t: SITES[u].title }))
      .filter((x) => x.t.toLowerCase().includes(ql) || x.u.toLowerCase().includes(ql));
    return `<div class="br-srch"><div class="bs-t">「${esc(q)}」的搜索结果（演示）</div>
      ${hits.length ? hits.map((h) => `<div class="bs-row"><button class="bs-link" data-u="${h.u}">${esc(h.t)}</button><span class="bs-url">${esc(h.u)}</span></div>`).join("")
        : `<div class="bs-none">未找到与「${esc(q)}」相关的内置站点。<br>可试试：hebios.cn、商店、社区、文档、璧儿、邮件、安装</div>`}</div>`;
  }

  /* ---------------- 事件绑定（页面内） ---------------- */
  function bindSearch(win, q) { /* 搜索页无动态绑定，链接在 page 委托 */ }

  /* ---------------- 书签 / 菜单 ---------------- */
  function addBookmark(win) {
    const t = activeTab(win);
    if (!t || !t.url) return;
    const i = store.bookmarks.findIndex((b) => b.url === t.url);
    if (i >= 0) {
      store.bookmarks.splice(i, 1);
      HB.toast("HeBi 浏览器", "已移除书签", "browser");
    } else {
      store.bookmarks.push({ url: t.url, name: t.title });
      HB.toast("HeBi 浏览器", "已加入书签：" + t.title, "browser");
    }
    saveStore(); render(win);
  }
  function renderMarks(win) {
    const box = $("#br-marks", win.body);
    box.innerHTML = store.bookmarks.map((b) => `<button class="br-mark" data-u="${b.url}" title="${esc(b.url)}">${esc(b.name)}</button>`).join("");
    box.querySelectorAll("[data-u]").forEach((b) => (b.onclick = () => navigate(win, b.dataset.u)));
  }
  function openMenu(win, e) {
    const t = activeTab(win);
    HB.contextMenu(e.clientX, e.clientY, [
      { label: "新建标签页", icon: "grid", onClick: () => newTab(win, "hebi://home") },
      { label: "加入书签 / 移除", icon: "star", onClick: () => addBookmark(win) },
      "-",
      { label: "书签管理", icon: "list", onClick: () => navigate(win, "hebi://bookmarks") },
      { label: "历史记录", icon: "refresh", onClick: () => navigate(win, "hebi://history") },
      { label: "关于 HeBi 浏览器", icon: "info", onClick: () => navigate(win, "hebi://about") },
      "-",
      { label: "复制当前网址", icon: "copy", onClick: () => {
          if (t && t.url) { copyText(t.url); HB.toast("HeBi 浏览器", "已复制：" + t.url, "browser"); }
        } },
    ]);
  }
  // 复制到剪贴板（navigator.clipboard 不可用时回退 execCommand）
  function copyText(t) {
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(fallback);
    else fallback();
  }

  /* ---------------- 页面内委托（书签/历史/主页磁贴） ---------------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-u]");
    if (!b) return;
    const win = winOf(b);
    if (win) navigate(win, b.dataset.u);
    const rm = b.dataset.rm;
    if (rm != null && b.closest(".bp-bms")) { store.bookmarks.splice(+rm, 1); saveStore(); }
  });
  document.addEventListener("click", (e) => {
    const clr = e.target.closest("#bh-clear");
    if (clr) { store.history = []; saveStore(); const win = winOf(clr); if (win) navigate(win, "hebi://history"); }
  });
  // 新标签页搜索框
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const inp = e.target;
    if (inp.id === "bh-q") {
      const v = inp.value.trim();
      if (!v) return;
      const win = winOf(inp);
      if (win) navigate(win, normalize(v));
    }
  });

  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
})();
