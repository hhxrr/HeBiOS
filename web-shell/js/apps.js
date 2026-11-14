/* ============================================================
   合璧OS — 应用注册表 / 壁纸生成 / 桌面装配
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, el, ico } = HeBi;

  /* ============================================================
     壁纸（运行时 Canvas 生成，无需外部文件）
     ============================================================ */
  const wallpapers = {};
  function genWallpapers() {
    const W = 1920, H = 1080;
    const mk = (name, draw) => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      draw(c.getContext("2d"), W, H);
      wallpapers[name] = c.toDataURL("image/jpeg", 0.88);
    };
    // 1. 玉璧青（默认）：深蓝放射 + 双环 + 流光
    mk("jade", (g, w, h) => {
      const bg = g.createRadialGradient(w * 0.5, h * 0.42, 60, w * 0.5, h * 0.42, w * 0.72);
      bg.addColorStop(0, "#10407e"); bg.addColorStop(0.5, "#0a2a58"); bg.addColorStop(1, "#04122b");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      // 大环
      g.strokeStyle = "rgba(120,190,255,0.16)"; g.lineWidth = 2;
      for (let r = 180; r <= 900; r += 120) { g.beginPath(); g.arc(w * 0.5, h * 0.42, r, 0, Math.PI * 2); g.stroke(); }
      // 玉璧核心
      const cx = w * 0.5, cy = h * 0.42, R = 190;
      const halo = g.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.6);
      halo.addColorStop(0, "rgba(46,124,246,0.5)"); halo.addColorStop(1, "rgba(46,124,246,0)");
      g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, R * 2.6, 0, Math.PI * 2); g.fill();
      g.lineWidth = 22; g.strokeStyle = "rgba(150,215,255,0.85)";
      g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 10; g.strokeStyle = "rgba(34,195,230,0.8)";
      g.beginPath(); g.arc(cx, cy, R * 0.8, 0, Math.PI * 2); g.stroke();
      const core = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      core.addColorStop(0, "#2E7CF6"); core.addColorStop(1, "#22C3E6");
      g.fillStyle = core; g.beginPath(); g.arc(cx, cy, R * 0.56, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#fff"; g.lineWidth = 14; g.lineCap = "round";
      g.beginPath();
      g.moveTo(cx, cy - R * 0.3); g.lineTo(cx, cy + R * 0.3);
      g.moveTo(cx - R * 0.3, cy); g.lineTo(cx + R * 0.3, cy);
      g.stroke();
      // 点环
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.fillStyle = `rgba(190,235,255,${0.25 + 0.2 * Math.sin(i)})`;
        g.beginPath(); g.arc(cx + Math.cos(a) * R * 1.32, cy + Math.sin(a) * R * 1.32, 9, 0, Math.PI * 2); g.fill();
      }
      // 底部流光
      const streak = g.createLinearGradient(0, h * 0.78, w, h);
      streak.addColorStop(0, "rgba(34,195,230,0)"); streak.addColorStop(0.5, "rgba(34,195,230,0.10)"); streak.addColorStop(1, "rgba(46,124,246,0)");
      g.fillStyle = streak; g.fillRect(0, h * 0.78, w, h * 0.22);
    });
    // 2. 极光
    mk("aurora", (g, w, h) => {
      g.fillStyle = "#0b1030"; g.fillRect(0, 0, w, h);
      const bands = [["#2E7CF6", 0.30], ["#22C3E6", 0.45], ["#7B5CFF", 0.62], ["#1FB6A6", 0.80]];
      bands.forEach(([col, p], i) => {
        const gr = g.createLinearGradient(0, h * p - 300, w, h * p + 300);
        gr.addColorStop(0, col + "00"); gr.addColorStop(0.5, col + "66"); gr.addColorStop(1, col + "00");
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(0, h);
        for (let x = 0; x <= w; x += 40) {
          const y = h * p + Math.sin(x / 260 + i * 2.1) * 110 + Math.sin(x / 90 + i) * 26;
          g.lineTo(x, y);
        }
        g.lineTo(w, h); g.closePath(); g.fill();
      });
      // 星点
      for (let i = 0; i < 160; i++) {
        g.fillStyle = `rgba(255,255,255,${(Math.random() * 0.5 + 0.1).toFixed(2)})`;
        g.beginPath(); g.arc(Math.random() * w, Math.random() * h * 0.6, Math.random() * 1.8 + 0.4, 0, Math.PI * 2); g.fill();
      }
    });
    // 3. 水墨
    mk("ink", (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#eef1f4"); bg.addColorStop(1, "#dde5ee");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      // 远山
      const mountain = (base, amp, col, alpha) => {
        g.fillStyle = col; g.globalAlpha = alpha;
        g.beginPath(); g.moveTo(0, h);
        for (let x = 0; x <= w; x += 30) {
          const y = base + Math.sin(x / 340) * amp + Math.sin(x / 130 + 2) * amp * 0.35;
          g.lineTo(x, y);
        }
        g.lineTo(w, h); g.closePath(); g.fill(); g.globalAlpha = 1;
      };
      mountain(h * 0.55, 130, "#9db4cc", 0.5);
      mountain(h * 0.68, 100, "#5f7f9f", 0.65);
      mountain(h * 0.80, 80, "#2e4a66", 0.85);
      // 红日
      g.fillStyle = "rgba(200,70,60,0.75)";
      g.beginPath(); g.arc(w * 0.72, h * 0.3, 74, 0, Math.PI * 2); g.fill();
      // 飞鸟
      g.strokeStyle = "rgba(40,60,90,0.6)"; g.lineWidth = 3;
      [[0.3, 0.22, 1], [0.36, 0.27, 0.8], [0.42, 0.19, 0.65]].forEach(([px, py, s]) => {
        const x = w * px, y = h * py;
        g.beginPath();
        g.moveTo(x - 18 * s, y); g.quadraticCurveTo(x - 9 * s, y - 12 * s, x, y - 2 * s);
        g.quadraticCurveTo(x + 9 * s, y - 12 * s, x + 18 * s, y);
        g.stroke();
      });
    });
    // 4. 花青（浅色）
    mk("bloom", (g, w, h) => {
      g.fillStyle = "#f4f7fb"; g.fillRect(0, 0, w, h);
      const blobs = [
        [0.22, 0.30, 0.30, "rgba(46,124,246,0.20)"],
        [0.78, 0.24, 0.24, "rgba(34,195,230,0.22)"],
        [0.60, 0.78, 0.32, "rgba(123,92,255,0.14)"],
        [0.15, 0.85, 0.22, "rgba(31,182,166,0.16)"],
      ];
      blobs.forEach(([px, py, r, col]) => {
        const gr = g.createRadialGradient(w * px, h * py, 0, w * px, h * py, w * r);
        gr.addColorStop(0, col); gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      });
      // 细环装饰
      g.strokeStyle = "rgba(46,124,246,0.12)"; g.lineWidth = 1.5;
      for (let r = 120; r <= 700; r += 90) { g.beginPath(); g.arc(w * 0.78, h * 0.24, r, 0, Math.PI * 2); g.stroke(); }
    });
    // 5. 纯色深空
    mk("deep", (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0a1a33"); bg.addColorStop(0.6, "#0d2547"); bg.addColorStop(1, "#123a6b");
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(120,190,255,0.07)"; g.lineWidth = 1;
      for (let i = 0; i < 26; i++) {
        g.beginPath();
        g.moveTo(Math.random() * w, 0);
        g.lineTo(Math.random() * w, h);
        g.stroke();
      }
    });
  }
  HeBi.wallpapers = wallpapers;
  genWallpapers();

  /* ============================================================
     应用注册表（各 app 文件向此处注册）
     ============================================================ */
  HeBi.registerApp = function (app) {
    HeBi.apps[app.id] = Object.assign({
      name: app.id, icon: "doc", w: 720, h: 480, showInStart: true,
    }, app);
  };

  /* ============================================================
     桌面装配（登录后进入）
     ============================================================ */
  HeBi.enterDesktop = function () {
    if ($("#hb-desktop").classList.contains("show")) return;
    HeBi.applySettings();
    HeBi.boot.renderDesktopIcons && HeBi.boot.renderDesktopIcons();
    $("#hb-desktop").classList.add("show");
    buildTaskbar();
    startClockTb();
    HeBi.toast("欢迎回来，" + HeBi.curUser().name, "合璧OS 5.0 LTS「Jade」· 双击图标或点击开始按钮使用", "logo");
  };

  /* ---------------- 任务栏 ---------------- */
  function buildTaskbar() {
    const tb = $("#hb-taskbar");
    if (tb.dataset.built) { HeBi.renderTasks(); return; }
    tb.dataset.built = "1";
    tb.innerHTML = `
      <button class="tb-start" id="tb-start-btn" title="开始">${HeBi.LOGO_SVG}</button>
      <input class="tb-search" id="tb-search" placeholder="在合璧OS 中搜索" />
      <div class="tb-tasks" id="tb-tasks"></div>
      <div class="tb-tray">
        <button class="tb-tray-btn" id="tb-net" title="网络">${ico("net", 16)}</button>
        <button class="tb-tray-btn" id="tb-vol" title="音量">${ico("vol", 16)}</button>
        <button class="tb-tray-btn" id="tb-action" title="通知中心">${ico("bell", 16)}</button>
        <button class="tb-tray-btn" id="tb-clock"><span id="tb-time">--:--</span><span id="tb-date"></span></button>
        <button class="tb-showdesk" id="tb-showdesk" title="显示桌面"></button>
      </div>`;
    $("#tb-start-btn").onclick = (e) => { e.stopPropagation(); HeBi.toggleStart(); };
    $("#tb-search").onfocus = () => { HeBi.toggleStart(true); };
    $("#tb-search").addEventListener("input", (e) => HeBi.renderStart(e.target.value));
    $("#tb-action").onclick = (e) => { e.stopPropagation(); HeBi.toggleAction(); };
    $("#tb-net").onclick = () => HeBi.toast("网络", "eth0 已连接 · 本地回环正常 · Internet 可达", "net");
    $("#tb-vol").onclick = (e) => {
      e.stopPropagation();
      const s = HeBi.state.settings;
      s.muted = !s.muted; HeBi.save();
      HeBi.toast("音量", s.muted ? "已静音" : "音量 " + s.volume + "%", "vol");
    };
    $("#tb-showdesk").onclick = () => {
      const vis = [...HeBi.wins ? [] : []];
      document.querySelectorAll(".hb-win").forEach((w) => (w.style.display = w.style.display === "none" ? "flex" : "none"));
    };
    // 开始菜单
    const sm = el("div"); sm.id = "hb-start";
    sm.innerHTML = `
      <div class="hb-start-head">
        <div class="avatar" id="sm-avatar"></div>
        <div><div class="un" id="sm-uname"></div><div class="ur" id="sm-urole"></div></div>
      </div>
      <div class="hb-start-search">${ico("search", 14)}<input id="start-search" placeholder="输入应用名称搜索" /></div>
      <div class="hb-start-body"><div class="hb-start-apps" id="start-apps"></div></div>
      <div class="hb-start-foot">
        <button class="user-mini" id="sm-user"><span class="avatar" id="sm-avatar2"></span><span id="sm-uname2"></span></button>
        <div class="pwr">
          <button id="sm-lock" title="锁定">🔒</button>
          <button id="sm-logout" title="注销">⎋</button>
          <button id="sm-power" title="电源">⏻</button>
        </div>
      </div>`;
    $("#hb-desktop").appendChild(sm);
    $("#start-search").addEventListener("input", (e) => HeBi.renderStart(e.target.value));
    $("#sm-user").onclick = () => { HeBi.toggleStart(false); HeBi.openApp("settings", "accounts"); };
    $("#sm-lock").onclick = () => { HeBi.toggleStart(false); HeBi.boot.lock(); };
    $("#sm-logout").onclick = () => { HeBi.toggleStart(false); HeBi.boot.logout(); };
    $("#sm-power").onclick = () => { HeBi.toggleStart(false); HeBi.powerMenu(); };
    // 操作中心
    const ac = el("div"); ac.id = "hb-action";
    ac.innerHTML = `
      <div class="ac-quick">
        <button id="ac-theme"><span class="qi">🌗</span>主题</button>
        <button id="ac-wifi"><span class="qi">📶</span>网络</button>
        <button id="ac-vol"><span class="qi">🔊</span>音量</button>
      </div>
      <div class="ac-notif-title"><span>通知</span><button id="ac-clear">全部清除</button></div>
      <div id="ac-notif-list"></div>
      <div class="ac-cal"><div class="cal-date" id="cal-date"></div><div class="cal-grid" id="cal-grid"></div></div>`;
    $("#hb-desktop").appendChild(ac);
    $("#ac-theme").onclick = () => {
      const s = HeBi.state.settings;
      s.theme = s.theme === "dark" ? "light" : "dark";
      HeBi.save(); HeBi.applySettings();
      HeBi.toast("个性化", "已切换为" + (s.theme === "dark" ? "深色" : "浅色") + "主题", "sun");
    };
    $("#ac-wifi").onclick = () => HeBi.toast("网络", "eth0 已连接 · 本地回环正常", "net");
    $("#ac-vol").onclick = () => {
      const s = HeBi.state.settings;
      s.muted = !s.muted; HeBi.save();
      HeBi.toast("音量", s.muted ? "已静音" : "音量 " + s.volume + "%", "vol");
    };
    $("#ac-clear").onclick = () => { document.querySelectorAll(".hb-toast").forEach((t) => t.click()); };
    // 桌面点击关闭浮层
    document.addEventListener("pointerdown", (e) => {
      if (!e.target.closest("#hb-start") && !e.target.closest("#tb-start-btn") && !e.target.closest("#tb-search")) HeBi.toggleStart(false);
      if (!e.target.closest("#hb-action") && !e.target.closest("#tb-action")) HeBi.toggleAction(false);
    });
    renderActionCal();
    HeBi.renderTasks();
  }
  function renderActionCal() {
    const d = new Date();
    $("#cal-date").textContent = d.getFullYear() + "年" + (d.getMonth() + 1) + "月";
    const g = $("#cal-grid");
    g.innerHTML = ["一", "二", "三", "四", "五", "六", "日"].map((x) => `<div class="hd">${x}</div>`).join("");
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    let offset = (first.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) g.innerHTML += "<div></div>";
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= days; i++) {
      g.innerHTML += `<div class="cd${i === d.getDate() ? " today" : ""}">${i}</div>`;
    }
  }
  function startClockTb() {
    const tick = () => {
      const d = new Date();
      $("#tb-time").textContent = HeBi.pad(d.getHours()) + ":" + HeBi.pad(d.getMinutes());
      $("#tb-date").textContent = (d.getMonth() + 1) + "/" + d.getDate();
      const u = HeBi.curUser();
      const av = $("#sm-avatar"), av2 = $("#sm-avatar2");
      if (av) av.innerHTML = u.avatar === "logo" ? HeBi.LOGO_SVG : ico("guest", 42);
      if (av2) av2.innerHTML = u.avatar === "logo" ? HeBi.LOGO_SVG : ico("guest", 26);
      $("#sm-uname").textContent = u.name;
      $("#sm-urole").textContent = u.role + " · 已登录";
      $("#sm-uname2").textContent = u.name;
      renderActionCal();
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------------- 电源菜单 ---------------- */
  HeBi.powerMenu = function (x, y) {
    const items = [
      { label: "锁定", icon: "power", onClick: () => HeBi.boot.lock() },
      { label: "注销", icon: "power", onClick: () => HeBi.boot.logout() },
      { label: "重启", icon: "power", onClick: () => HeBi.boot.shutdown(true) },
      { label: "关机", icon: "power", onClick: () => HeBi.boot.shutdown(false) },
    ];
    if (x != null) HeBi.contextMenu(x, y, items);
    else {
      // 开始菜单电源按钮下方弹出
      const r = $("#sm-power").getBoundingClientRect();
      HeBi.contextMenu(r.left, r.top - 10, items);
    }
  };
})();
