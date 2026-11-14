/* ============================================================
   应用商店（后台管理 + 三栏：首页 / 自研 / 网络源）
   支持 .deb / .mdn / .exe / .msi 安装流程
   ============================================================ */
(function () {
  const HB = window.HeBi;
  const { $, el, ico } = HB;

  const SELFPACKS = [
    { id: "office", name: "办公助手 · 璧儿", dev: "珠联璧合工作室", desc: "富文本办公套件：文档编辑、格式排版、导出 .hdoc/.docx，内置通知协作。", icon: "📝", ver: "1.2.0", size: "18.6 MB", pkg: "office-assistant_1.2.0_amd64.mdn", cat: "办公" },
    { id: "voice", name: "语音助手 · 合合", dev: "珠联璧合工作室", desc: "自然语言命令中枢：语音识别、系统控制、应用启动、音乐播放与日程提醒。", icon: "🎙️", ver: "1.2.0", size: "12.4 MB", pkg: "voice-assistant_1.2.0_amd64.mdn", cat: "效率" },
    { id: "files", name: "文件管理器 · 璧见", dev: "珠联璧合工作室", desc: "双盘资源浏览器：快速访问、双视图、剪贴板、属性面板，对标 Windows 资源管理器。", icon: "📁", ver: "3.0.1", size: "6.2 MB", pkg: "hebi-files_3.0.1_amd64.mdn", cat: "系统" },
    { id: "music", name: "音乐播放器 · 聆璧", dev: "珠联璧合工作室", desc: "程序合成音乐引擎：实时音序器、频谱可视化、播放列表与封面生成。", icon: "🎵", ver: "2.4.0", size: "9.8 MB", pkg: "hebi-music_2.4.0_amd64.mdn", cat: "媒体" },
    { id: "terminal", name: "终端 · 璧行", dev: "珠联璧合工作室", desc: "HeBi Shell 终端：ls/cd/cat/hbpm/neofetch，无缝管理 deb 与 mdn 包。", icon: "⌨️", ver: "1.0.3", size: "2.1 MB", pkg: "hebi-terminal_1.0.3_amd64.mdn", cat: "系统" },
    { id: "drivers", name: "驱动管理器", dev: "珠联璧合工作室", desc: "通用驱动安装中心：显卡/网卡/声卡/USB/打印机，一键扫描安装。", icon: "🔧", ver: "1.1.0", size: "4.5 MB", pkg: "hebi-drivers_1.1.0_amd64.mdn", cat: "系统" },
    { id: "logo-lab", name: "徽标设计器", dev: "珠联璧合工作室", desc: "合璧徽标创作工具：双环玉璧参数化生成 SVG/PNG，系统图标定制。", icon: "💠", ver: "0.9.5", size: "3.3 MB", pkg: "logo-lab_0.9.5_amd64.mdn", cat: "创意" },
    { id: "backup", name: "系统备份工具", dev: "珠联璧合工作室", desc: "整机快照与增量备份，支持恢复点管理与云端同步。", icon: "🛡️", ver: "1.0.0", size: "8.7 MB", pkg: "hebi-backup_1.0.0_amd64.mdn", cat: "系统" },
  ];
  const NETSOURCES = [
    { id: "flathub", name: "Flathub", desc: "全球最大 Linux Flatpak 应用仓库 · 2000+ 应用", ico: "📦", color: "#4A86CF", on: true, count: "2 148" },
    { id: "snap", name: "Snap Store", desc: "Canonical 官方 Snap 商店 · 沙箱化应用", ico: "🧰", color: "#E74856", on: true, count: "8 532" },
    { id: "aur", name: "AUR", desc: "Arch User Repository · 社区 PKGBUILD 源", ico: "🏹", color: "#1793D1", on: true, count: "92 017" },
    { id: "deepin", name: "Deepin 应用商店", desc: "深度科技商店镜像 · 中文生态精选", ico: "🐬", color: "#00B4A6", on: true, count: "3 264" },
    { id: "appimage", name: "AppImage Hub", desc: "免安装便携应用中心 · 即点即用", ico: "📀", color: "#7A5AF8", on: false, count: "1 487" },
    { id: "nix", name: "Nixpkgs", desc: "Nix 包集合 · 可复现构建", ico: "❄️", color: "#5B6470", on: false, count: "118 540" },
    { id: "wine", name: "Wine 兼容库", desc: "Windows .exe/.msi 兼容层 · 已内置 9.0", ico: "🍷", color: "#A0522D", on: true, count: "—" },
    { id: "hbpm", name: "合璧软件源 hbpm", desc: "官方 deb/mdn 混合源 · 珠联璧合工作室维护", ico: " Jade", color: "#2E7CF6", on: true, count: "326" },
  ];
  const NETAPPS = {
    flathub: [
      { name: "GIMP 图像编辑器", desc: "专业级位图处理", icon: "🎨", ver: "2.10.36", size: "86 MB" },
      { name: "Kdenlive", desc: "非线性视频剪辑", icon: "🎬", ver: "24.08", size: "120 MB" },
      { name: "Blender", desc: "三维建模与渲染", icon: "🧊", ver: "4.2", size: "340 MB" },
      { name: "Inkscape", desc: "矢量图形设计", icon: "🖊️", ver: "1.3.2", size: "74 MB" },
    ],
    snap: [
      { name: "VS Code", desc: "微软代码编辑器", icon: "📘", ver: "1.94", size: "150 MB" },
      { name: "Slack", desc: "团队协作通讯", icon: "💬", ver: "4.39", size: "98 MB" },
      { name: "Spotify", desc: "流媒体音乐", icon: "🎧", ver: "1.2.5", size: "190 MB" },
    ],
    aur: [
      { name: "Google Chrome", desc: "谷歌浏览器", icon: "🌐", ver: "130", size: "110 MB" },
      { name: "WPS Office", desc: "金山办公套件", icon: "📄", ver: "12.1", size: "420 MB" },
      { name: "Clash Verge", desc: "网络代理工具", icon: "🚀", ver: "1.5", size: "65 MB" },
    ],
    deepin: [
      { name: "深度终端", desc: "Deepin Terminal", icon: "⌨️", ver: "1.3", size: "3 MB" },
      { name: "深度截图", desc: "区域截图与标注", icon: "✂️", ver: "5.0", size: "4 MB" },
      { name: "华宇拼音", desc: "中文输入法", icon: "🔤", ver: "2.0", size: "28 MB" },
    ],
    appimage: [
      { name: "Obsidian", desc: "双链笔记", icon: "📓", ver: "1.6", size: "95 MB" },
      { name: "LMMS", desc: "音乐制作工作站", icon: "🎹", ver: "1.2", size: "60 MB" },
    ],
    nix: [
      { name: "Firefox", desc: "火狐浏览器", icon: "🦊", ver: "131", size: "80 MB" },
      { name: "Thunderbird", desc: "邮件客户端", icon: "📧", ver: "128", size: "70 MB" },
    ],
    wine: [
      { name: "Windows 兼容层 Wine 9.0", desc: "运行 .exe/.msi 程序", icon: "🍷", ver: "9.0", size: "1.2 GB" },
      { name: "微信 PC 版", desc: "通过 Wine 运行", icon: "💚", ver: "3.9", size: "200 MB" },
    ],
    hbpm: [
      { name: "合璧办公套件", desc: "璧儿办公助手完整版", icon: "📝", ver: "1.2.0", size: "18.6 MB" },
      { name: "合璧驱动库", desc: "通用驱动合集包", icon: "🔧", ver: "2026.10", size: "45 MB" },
      { name: "Windows 10 字体包", desc: "Segoe UI / 微软雅黑", icon: "🔤", ver: "10.0", size: "24 MB" },
    ],
  };

  let curTab = "home";
  let curQuery = "";

  HB.registerApp({
    id: "store", name: "应用商店", icon: "store", w: 900, h: 600, multi: true,
    open: openStore, onArg: (win, arg) => {
      if (typeof arg === "string") { curTab = arg; render(win); }
      else if (arg && arg.install) installFile(win, arg.install);
    },
  });

  function openStore(win) { render(win); }

  // 统一搜索索引: 自研 + 全部网络源应用
  const allApps = () => {
    const out = [];
    SELFPACKS.forEach((a) => out.push(Object.assign({}, a, { src: "hbpm", srcName: "合璧自研" })));
    NETSOURCES.filter((s) => s.on).forEach((s) => (NETAPPS[s.id] || []).forEach((a) => out.push(Object.assign({}, a, { src: s.id, srcName: s.name }))));
    return out;
  };
  const hl = (text, q) => {
    if (!q) return text;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return text;
    return text.slice(0, i) + '<mark class="so-hl">' + text.slice(i, i + q.length) + "</mark>" + text.slice(i + q.length);
  };
  const searchAll = (q) => {
    const k = q.toLowerCase();
    return allApps().filter((a) => (a.name + " " + a.desc + " " + (a.cat || "") + " " + a.srcName).toLowerCase().includes(k));
  };

  function render(win) {
    const b = win.body;
    b.innerHTML = `<div class="so-app">
      <div class="so-tabs">
        <button data-t="home" class="${curTab === "home" ? "active" : ""}">🏠 首页</button>
        <button data-t="self" class="${curTab === "self" ? "active" : ""}">💎 自研</button>
        <button data-t="net" class="${curTab === "net" ? "active" : ""}">🌐 网络源</button>
        <div class="so-search"><span class="so-search-ico">🔍</span>
          <input id="so-q" class="hb-input" placeholder="搜索应用（名称 / 描述 / 分类）" value="${curQuery.replace(/"/g, "&quot;")}">
          ${curQuery ? '<button class="so-search-clear" id="so-qc" title="清除">✕</button>' : ""}
        </div>
      </div>
      <div class="so-body" id="so-body"></div>
    </div>`;
    b.querySelectorAll(".so-tabs > button").forEach((t) => (t.onclick = () => { curTab = t.dataset.t; curQuery = ""; render(win); }));
    const q = $("#so-q", b);
    if (q) {
      q.oninput = () => { curQuery = q.value.trim(); render(win); $("#so-q", b).focus(); };
      q.onkeydown = (e) => {
        if (e.key === "Enter" && curQuery) {
          const hits = searchAll(curQuery);
          if (hits.length) doInstall(win, hits[0].id || hits[0].name, "search");
        }
        if (e.key === "Escape") { curQuery = ""; render(win); }
      };
    }
    const qc = $("#so-qc", b);
    if (qc) qc.onclick = () => { curQuery = ""; render(win); };
    if (curQuery) pgSearch($("#so-body", b), win, curQuery);
    else ({ home: pgHome, self: pgSelf, net: pgNet })[curTab]($("#so-body", b), win);
  }

  /* ---------------- 搜索结果页 ---------------- */
  function pgSearch(body, win, q) {
    const hits = searchAll(q);
    body.innerHTML = `<div class="so-sec-title">🔍 搜索“${q}” · ${hits.length} 个结果</div>` +
      (hits.length
        ? `<div class="so-grid">${hits.map((a) => {
            const inst = HB.state.installed.includes(a.id || a.name);
            return `<div class="so-card">
              <div class="sc-ico">${a.icon}</div>
              <div class="sc-body">
                <div class="sc-name">${hl(a.name, q)} <span style="font-weight:400;font-size:10.5px;color:var(--hb-text-2)">v${a.ver}</span></div>
                <div class="sc-dev">${hl(a.srcName, q)}${a.cat ? " · " + hl(a.cat, q) : ""}</div>
                <div class="sc-desc">${hl(a.desc, q)}</div>
                <div class="sc-foot">
                  <button class="hb-btn ${inst ? "" : "primary"} sc-install" data-install="${a.id || a.name}">${inst ? "打开" : "安装"}</button>
                  <span class="sc-meta">${a.size}</span>
                </div>
              </div></div>`;
          }).join("")}</div>`
        : `<div class="so-empty"><div class="se-ico">🫙</div><div class="se-title">未找到“${q}”相关应用</div>
           <div class="se-sub">试试其他关键词，或到「网络源」浏览 8 大软件仓库</div>
           <div class="se-try">${["办公", "音乐", "终端", "安全", "浏览器"].map((k) => `<button class="hb-btn" data-try="${k}">${k}</button>`).join("")}</div></div>`);
    body.querySelectorAll("[data-install]").forEach((b2) => (b2.onclick = () => doInstall(win, b2.dataset.install, "search")));
    body.querySelectorAll("[data-try]").forEach((b2) => (b2.onclick = () => { curQuery = b2.dataset.try; render(win); }));
  }

  /* ---------------- 首页 ---------------- */
  function pgHome(body, win) {
    const rec = SELFPACKS.slice(0, 3).concat([NETAPPS.aur[1]]);
    body.innerHTML = `
      <div class="so-banner"><div class="sb-deco"></div><div class="sb-deco2"></div>
        <div class="sb-title">珠联璧合 · 应用生态</div>
        <div class="sb-sub">自研应用 + 8 大网络源 · 支持 .deb / .mdn / .exe / .msi 全格式安装</div></div>
      <div class="so-sec-title">⭐ 编辑推荐</div>
      <div class="so-grid">${rec.map((a) => selfCard(a, "hbpm")).join("")}</div>
      <div class="so-sec-title">📂 分类浏览</div>
      <div class="so-grid">${["办公", "效率", "系统", "媒体", "创意", "开发", "游戏"].map((c) => `
        <div class="so-card" style="cursor:pointer" data-cat="${c}">
          <div class="sc-ico">${{ 办公: "📝", 效率: "⚡", 系统: "⚙️", 媒体: "🎵", 创意: "🎨", 开发: "💻", 游戏: "🎮" }[c]}</div>
          <div class="sc-body"><div class="sc-name">${c}</div><div class="sc-desc">浏览${c}类应用</div>
          <div class="sc-foot"><button class="hb-btn sc-install" data-cat="${c}">查看</button></div></div></div>`).join("")}</div>`;
    body.querySelectorAll("[data-cat]").forEach((c) => (c.onclick = () => {
      curTab = "self"; render(win);
    }));
    body.querySelectorAll("[data-install]").forEach((b2) => (b2.onclick = () => doInstall(win, b2.dataset.install, "home")));
  }

  const selfCard = (a, src) => {
    const inst = HB.state.installed.includes(a.id || a.name);
    return `<div class="so-card">
      <div class="sc-ico">${a.icon}</div>
      <div class="sc-body">
        <div class="sc-name">${a.name} <span style="font-weight:400;font-size:10.5px;color:var(--hb-text-2)">v${a.ver}</span></div>
        <div class="sc-dev">${a.dev || "网络源应用"}</div>
        <div class="sc-desc">${a.desc}</div>
        <div class="sc-foot">
          <button class="hb-btn ${inst ? "" : "primary"} sc-install" data-install="${a.id || a.name}">${inst ? "打开" : "安装"}</button>
          <span class="sc-meta">${a.size} · ${src}</span>
        </div>
      </div></div>`;
  };

  /* ---------------- 自研 ---------------- */
  function pgSelf(body, win) {
    body.innerHTML = `<div class="so-sec-title">💎 自研应用 · 珠联璧合工作室</div>
      <div style="font-size:12.5px;color:var(--hb-text-2);margin-bottom:12px">全部以 .mdn 格式（.deb 增强后缀）分发，含数字签名与增量更新。安装后即集成至开始菜单与文件管理器。</div>
      <div class="so-grid">${SELFPACKS.map((a) => selfCard(a, "hbpm")).join("")}</div>`;
    body.querySelectorAll("[data-install]").forEach((b) => (b.onclick = () => doInstall(win, b.dataset.install, "self")));
  }

  /* ---------------- 网络源 ---------------- */
  function pgNet(body, win) {
    body.innerHTML = `<div class="so-sec-title">🌐 软件源（${NETSOURCES.filter((s) => s.on).length}/${NETSOURCES.length} 已启用）</div>
      <div style="font-size:12.5px;color:var(--hb-text-2);margin-bottom:12px">从各大知名 Linux 应用商店获取应用。网络源应用经合璧兼容层转换后可直接运行。</div>
      ${NETSOURCES.map((s) => `
        <div class="so-source-row">
          <div class="ss-ico" style="background:${s.color}22;color:${s.color}">${s.ico}</div>
          <div class="ss-info"><div class="ss-name">${s.name}</div><div class="ss-desc">${s.desc}</div></div>
          <span style="font-size:11.5px;color:var(--hb-text-2)">${s.count} 个应用</span>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px"><input type="checkbox" data-src="${s.id}" ${s.on ? "checked" : ""}>启用</label>
          <button class="hb-btn" data-open="${s.id}">浏览</button>
        </div>`).join("")}
      <div id="so-netapp" style="margin-top:18px"></div>`;
    body.querySelectorAll("[data-src]").forEach((c) => (c.onchange = () => {
      const s = NETSOURCES.find((x) => x.id === c.dataset.src);
      s.on = c.checked;
      HB.toast("软件源", s.name + (s.on ? " 已启用" : " 已停用"), "store");
    }));
    body.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => {
      const s = NETSOURCES.find((x) => x.id === b.dataset.open);
      $("#so-netapp", body).innerHTML = `<div class="so-sec-title">${s.ico} ${s.name}</div>
        <div class="so-grid">${(NETAPPS[s.id] || []).map((a) => netCard(a, s)).join("")}</div>`;
      $("#so-netapp", body).querySelectorAll("[data-install]").forEach((bb) => (bb.onclick = () => doInstall(win, bb.dataset.install, "net")));
    }));
  }
  const netCard = (a, s) => `
    <div class="so-card">
      <div class="sc-ico">${a.icon}</div>
      <div class="sc-body">
        <div class="sc-name">${a.name} <span style="font-weight:400;font-size:10.5px;color:var(--hb-text-2)">v${a.ver}</span></div>
        <div class="sc-dev">${s.name}</div>
        <div class="sc-desc">${a.desc}</div>
        <div class="sc-foot"><button class="hb-btn primary sc-install" data-install="${a.name}">获取</button>
        <span class="sc-meta">${a.size}</span></div>
      </div></div>`;

  /* ---------------- 安装流程（.mdn / 网络应用） ---------------- */
  function doInstall(win, id, from) {
    let app = SELFPACKS.find((a) => a.id === id || a.name === id);
    let meta;
    if (app) meta = { name: app.name, size: app.size, pkg: app.pkg, id: app.id };
    else {
      let found = null;
      for (const k of Object.keys(NETAPPS)) found = NETAPPS[k].find((a) => a.name === id);
      meta = found ? { name: found.name, size: found.size, pkg: found.name.replace(/\s+/g, "-").toLowerCase() + ".mdn", id: null } : null;
    }
    if (!meta) return;
    const installed = meta.id && HB.state.installed.includes(meta.id);
    if (installed && meta.id) { HB.openApp(meta.id); return; }

    // 安装遮罩
    const mask = el("div", "so-install-mask");
    mask.innerHTML = `<div class="so-install-box">
      <div class="ib-name">${meta.name}</div>
      <div style="font-size:11.5px;color:var(--hb-text-2)">${meta.pkg} · ${meta.size}</div>
      <div class="ib-st" id="ib-st">正在连接合璧软件源…</div>
      <div style="height:6px;border-radius:3px;background:var(--hb-border);overflow:hidden"><div id="ib-bar" style="height:100%;width:0;background:linear-gradient(90deg,var(--hb-accent),var(--hb-accent2));transition:width .2s"></div></div>
      <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="hb-btn" id="ib-cancel">取消</button></div>
    </div>`;
    win.body.querySelector(".so-app").appendChild(mask);
    const bar = $("#ib-bar", mask), st = $("#ib-st", mask);
    $("#ib-cancel", mask).onclick = () => mask.remove();
    const steps = [["正在连接合璧软件源…", 12], ["下载 " + meta.pkg, 42], ["校验数字签名", 58], ["解包并部署文件", 78], ["注册桌面集成", 92], ["安装完成", 100]];
    let i = 0, dead = false;
    mask.addEventListener("pointerdown", (e) => { if (e.target === mask) dead = true; });
    const tick = () => {
      if (dead || i >= steps.length) {
        if (!dead) {
          if (meta.id && !HB.state.installed.includes(meta.id)) { HB.state.installed.push(meta.id); HB.save(); }
          HB.toast("应用商店", meta.name + " 安装成功", "store");
          render(win);
        }
        return;
      }
      st.textContent = steps[i][0]; bar.style.width = steps[i][1] + "%";
      i++;
      setTimeout(tick, 420 + Math.random() * 380);
    };
    tick();
  }

  /* ---------------- 文件管理器双击 .deb/.mdn 安装 ---------------- */
  function installFile(win, path) {
    const f = HB.vfs.get(path);
    if (!f) { HB.toast("安装失败", "找不到 " + path, "store"); return; }
    const name = path.split("/").pop();
    const isMdn = /\.mdn$/i.test(name);
    const appId = /office|assistant/i.test(name) ? "office" : /voice/i.test(name) ? "voice" : /files|hebi-files/i.test(name) ? "files" : /music/i.test(name) ? "music" : null;
    const mask = el("div", "so-install-mask");
    mask.innerHTML = `<div class="so-install-box">
      <div class="ib-name">${name}</div>
      <div style="font-size:11.5px;color:var(--hb-text-2)">${isMdn ? "合璧安装包 .mdn" : "Debian 安装包 .deb"} · ${HB.vfs.fmtSize(f.size || 0)}</div>
      <div class="ib-st" id="ib-st">hbpm install ${name}</div>
      <div style="height:6px;border-radius:3px;background:var(--hb-border);overflow:hidden"><div id="ib-bar" style="height:100%;width:0;background:linear-gradient(90deg,var(--hb-accent),var(--hb-accent2));transition:width .2s"></div></div>
    </div>`;
    win.body.querySelector(".so-app").appendChild(mask);
    const bar = $("#ib-bar", mask), st = $("#ib-st", mask);
    const steps = ["dpkg-deb -R " + name, "运行 preinst 钩子", "解包数据段到 /", "注册 systemd 服务与桌面项", "配置默认关联", "安装完成 ✓"];
    let i = 0;
    const tick = () => {
      if (i >= steps.length) {
        if (appId && !HB.state.installed.includes(appId)) { HB.state.installed.push(appId); HB.save(); }
        HB.toast("安装完成", name + " 已安装" + (appId ? "，可从开始菜单启动" : ""), "store");
        setTimeout(() => mask.remove(), 700);
        return;
      }
      st.textContent = steps[i]; bar.style.width = ((i + 1) / steps.length * 100) + "%"; i++;
      setTimeout(tick, 480);
    };
    tick();
  }
})();
