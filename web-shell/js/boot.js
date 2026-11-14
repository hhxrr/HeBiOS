/* ============================================================
   合璧OS — 开机动画 / 登录 / 锁屏 / 关机
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, el, ico, LOGO_SVG } = HeBi;

  /* ============================================================
     一、开机动画（Canvas：双环玉璧 + 旋转点环 + 进度）
     ============================================================ */
  function drawBootLogo(ctx, cx, cy, R, t, prog) {
    // 外光环（脉冲）
    const pulse = 1 + 0.05 * Math.sin(t * 2.4);
    ctx.save();
    ctx.translate(cx, cy);
    // 光晕
    const halo = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 2.1 * pulse);
    halo.addColorStop(0, "rgba(46,124,246,0.34)");
    halo.addColorStop(0.55, "rgba(34,195,230,0.10)");
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, R * 2.1 * pulse, 0, Math.PI * 2); ctx.fill();
    // 外环（双环玉璧）
    ctx.rotate(t * 0.35);
    ctx.lineWidth = R * 0.13;
    ctx.strokeStyle = "rgba(120,190,255,0.95)";
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = R * 0.055;
    ctx.strokeStyle = "rgba(34,195,230,0.85)";
    ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, Math.PI * 2); ctx.stroke();
    ctx.rotate(-t * 0.35);
    // 玉璧核心
    const core = ctx.createLinearGradient(-R * 0.5, -R * 0.5, R * 0.5, R * 0.5);
    core.addColorStop(0, "#2E7CF6"); core.addColorStop(1, "#22C3E6");
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.56, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = R * 0.035;
    ctx.strokeStyle = "rgba(191,232,255,0.6)";
    ctx.beginPath(); ctx.arc(0, 0, R * 0.56, 0, Math.PI * 2); ctx.stroke();
    // 窗棂十字
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = R * 0.09; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -R * 0.3); ctx.lineTo(0, R * 0.3);
    ctx.moveTo(-R * 0.3, 0); ctx.lineTo(R * 0.3, 0);
    ctx.stroke();
    // 旋转点环
    for (let i = 0; i < 8; i++) {
      const a = t * 1.6 + (i * Math.PI) / 4;
      const rr = R * 1.32;
      const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      const alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3 - i * 0.7));
      ctx.fillStyle = `rgba(140,220,255,${alpha.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, R * 0.055, 0, Math.PI * 2); ctx.fill();
    }
    // 进度弧
    ctx.lineWidth = R * 0.07;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath(); ctx.arc(0, 0, R * 1.13, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#BFE8FF";
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(0, 0, R * 1.13, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function bootAnimation() {
    return new Promise((resolve) => {
      const box = $("#hb-boot");
      const cv = el("canvas");
      box.insertBefore(cv, box.firstChild);
      const ctx = cv.getContext("2d");
      let W, H, DPR = Math.min(devicePixelRatio || 1, 2);
      const fit = () => {
        W = box.clientWidth; H = box.clientHeight;
        cv.width = W * DPR; cv.height = H * DPR;
        cv.style.width = W + "px"; cv.style.height = H + "px";
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      };
      fit();
      addEventListener("resize", fit);
      const t0 = performance.now();
      const DUR = 4600;
      let raf = 0;
      const frame = () => {
        const el0 = (performance.now() - t0) / 1000;
        const t = el0;
        const prog = Math.min(1, el0 / (DUR / 1000));
        // 背景
        ctx.clearRect(0, 0, W, H);
        const bg = ctx.createRadialGradient(W / 2, H * 0.44, 10, W / 2, H * 0.44, Math.max(W, H) * 0.75);
        bg.addColorStop(0, "#0d2f5e"); bg.addColorStop(0.45, "#071a38"); bg.addColorStop(1, "#020a18");
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        // 流动网格纹理
        ctx.strokeStyle = "rgba(90,150,220,0.05)";
        ctx.lineWidth = 1;
        const gap = 64, off = (t * 18) % gap;
        for (let x = -gap + off; x < W + gap; x += gap) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = -gap + off; y < H + gap; y += gap) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        const R = Math.min(W, H) * 0.13;
        drawBootLogo(ctx, W / 2, H * 0.44, R, t, prog);
        // 进度条
        const bw = Math.min(W * 0.34, 380), bh = 4;
        const bx = (W - bw) / 2, by = H * 0.44 + R * 2.0;
        ctx.fillStyle = "rgba(255,255,255,0.14)";
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 2); ctx.fill();
        const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
        grad.addColorStop(0, "#2E7CF6"); grad.addColorStop(1, "#22C3E6");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(bx, by, bw * prog, bh, 2); ctx.fill();
        // 品牌字
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = `300 ${Math.round(R * 0.34)}px "Segoe UI","Microsoft YaHei",sans-serif`;
        ctx.fillText("合璧OS", W / 2, by + R * 0.62);
        ctx.fillStyle = "rgba(160,210,255,0.6)";
        ctx.font = `${Math.round(R * 0.15)}px "Segoe UI",sans-serif`;
        ctx.fillText("HeBi OS 5.0 LTS · Jade", W / 2, by + R * 0.62 + R * 0.3);
        // 底部提示
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `${Math.round(R * 0.14)}px "Segoe UI",sans-serif`;
        ctx.fillText("正在启动 珠联璧合 · 融 Linux 内核 · 承 Windows 体验", W / 2, H * 0.9);
        if (el0 < DUR / 1000) raf = requestAnimationFrame(frame);
        else {
          // 完成：进度条充满 + 微停
          box.classList.add("fade-out");
          setTimeout(() => { box.style.display = "none"; resolve(); }, 950);
        }
      };
      raf = requestAnimationFrame(frame);
    });
  }

  /* ============================================================
     二、登录界面
     ============================================================ */
  let clockTimer = 0;
  function startClock() {
    clearInterval(clockTimer);
    const tick = () => {
      const d = new Date();
      const c1 = $("#login-clock-t"), c2 = $("#login-clock-d");
      if (c1) c1.textContent = HeBi.pad(d.getHours()) + ":" + HeBi.pad(d.getMinutes());
      if (c2) c2.textContent = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][d.getDay()] + " · " + (d.getMonth() + 1) + "月" + d.getDate() + "日";
      const lt = $("#lock-time"), ld = $("#lock-date");
      if (lt) lt.textContent = HeBi.pad(d.getHours()) + ":" + HeBi.pad(d.getMinutes());
      if (ld) ld.textContent = (d.getMonth() + 1) + "月" + d.getDate() + "日 " + ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][d.getDay()];
    };
    tick();
    clockTimer = setInterval(tick, 1000);
  }

  function showLogin() {
    const lg = $("#hb-login");
    lg.classList.add("show");
    startClock();
    const box = $("#login-users");
    box.innerHTML = "";
    state_users();
    function state_users() {
      box.innerHTML = "";
      HeBi.state.users.forEach((u) => {
        const t = el("div", "hb-user-tile");
        t.dataset.uid = u.id;
        t.innerHTML = `
          <div class="avatar">${u.avatar === "logo" ? HeBi.LOGO_SVG : ico("guest", 108)}</div>
          <div class="name">${u.name}</div>
          <div class="role">${u.role}</div>`;
        t.onclick = () => {
          $$(".hb-user-tile", box).forEach((x) => x.classList.remove("selected"));
          t.classList.add("selected");
          setTimeout(() => pickUser(u), 260);
        };
        box.appendChild(t);
      });
    }
    $("#login-pwd").classList.remove("show");
    // 底部「登录」主按钮：登录已选中用户，未选中则登录默认用户（第一个账户）
    const loginBtn = $("#lb-login");
    if (loginBtn) {
      loginBtn.onclick = () => {
        const sel = box.querySelector(".hb-user-tile.selected");
        let u = null;
        if (sel) u = HeBi.state.users.find((x) => String(x.id) === sel.dataset.uid);
        if (!u) {
          u = HeBi.state.users[0];
          $$(".hb-user-tile", box).forEach((x) => x.classList.remove("selected"));
          const first = box.querySelector('.hb-user-tile[data-uid="' + u.id + '"]');
          if (first) first.classList.add("selected");
        }
        if (u) setTimeout(() => pickUser(u), 180);
      };
    }
  }
  function pickUser(u) {
    const pwdBox = $("#login-pwd");
    if (!u.pwd) { doLogin(u); return; }
    pwdBox.classList.add("show");
    $("#pwd-name").textContent = u.name;
    const inp = $("#pwd-input");
    inp.value = ""; $("#pwd-err").textContent = "";
    setTimeout(() => inp.focus(), 60);
    const go = () => {
      if (inp.value === u.pwd) { pwdBox.classList.remove("show"); doLogin(u); }
      else { $("#pwd-err").textContent = "密码不正确，请重试（提示：hebi）"; inp.value = ""; inp.focus(); }
    };
    $("#pwd-go").onclick = go;
    inp.onkeydown = (e) => { if (e.key === "Enter") go(); };
  }
  function doLogin(u) {
    HeBi.state.currentUser = u.id;
    HeBi.save();
    const lg = $("#hb-login");
    lg.style.transition = "opacity .5s";
    lg.style.opacity = "0";
    setTimeout(() => { lg.classList.remove("show"); lg.style.opacity = "1"; }, 520);
    setTimeout(() => HeBi.enterDesktop(), 260);
  }

  /* ============================================================
     三、锁屏
     ============================================================ */
  function lockScreen() {
    $("#hb-lock").classList.add("show");
    startClock();
    const unlock = () => {
      $("#hb-lock").classList.remove("show");
      document.removeEventListener("keydown", unlock);
      showLogin();
    };
    $("#hb-lock").onclick = unlock;
    setTimeout(() => document.addEventListener("keydown", unlock, { once: true }), 400);
  }

  /* ============================================================
     四、电源：关机 / 重启 / 注销 / 切换用户
     ============================================================ */
  function shutdown(restart) {
    const sd = $("#hb-shutdown");
    $("#sd-msg").textContent = restart ? "正在重启…" : "正在关机…";
    sd.classList.add("show");
    HeBi.$("#hb-desktop").classList.remove("show");
    HeBi.$("#hb-start").classList.remove("show");
    setTimeout(() => {
      if (restart) location.reload();
      else {
        $("#sd-msg").textContent = "您可以安全地关闭计算机了";
        $(".sd-ring").style.display = "none";
      }
    }, 2400);
  }
  function logout() {
    HeBi.$("#hb-desktop").classList.remove("show");
    showLogin();
  }

  /* ============================================================
     五、桌面图标
     ============================================================ */
  const SIZE_NAMES = { large: "大图标", mid: "中等图标", small: "小图标" };
  const SORT_NAMES = { name: "按名称", type: "按类型", default: "默认顺序" };
  function setIconSize(v) {
    HeBi.state.settings.iconSize = v; HeBi.save(); renderDesktopIcons();
    HeBi.toast("桌面", "图标大小已切换为" + (SIZE_NAMES[v] || v), "view");
  }
  function setIconSort(v) {
    HeBi.state.settings.iconSort = v; HeBi.save(); renderDesktopIcons();
    HeBi.toast("桌面", "排序方式：" + (SORT_NAMES[v] || v), "list");
  }
  const desktopApps = ["pc", "store", "office", "voice", "files", "music", "terminal", "mail", "browser"];
  function renderDesktopIcons() {
    const box = $("#hb-icons");
    box.innerHTML = "";
    const defs = [
      { id: "pc", name: "此电脑", icon: "pc" },
      { id: "install", name: "系统安装", icon: "install" },
      { id: "store", name: "应用商店", icon: "store" },
      { id: "office", name: "办公助手", icon: "office" },
      { id: "voice", name: "语音助手", icon: "voice" },
      { id: "files", name: "文件管理器", icon: "files" },
      { id: "music", name: "音乐", icon: "music" },
      { id: "terminal", name: "终端", icon: "terminal" },
      { id: "mail", name: "合璧邮件", icon: "mail" },
      { id: "browser", name: "HeBi 浏览器", icon: "browser" },
      { id: "recycle", name: "回收站", icon: "recycle" },
    ];
    // 排序方式（持久化到 settings.iconSort）
    const sort = HeBi.state.settings.iconSort || "default";
    if (sort === "name") defs.sort((a, b) => a.name.localeCompare(b.name, "zh"));
    else if (sort === "type") {
      const sys = (d) => (d.id === "pc" || d.id === "recycle" ? 0 : 1);
      defs.sort((a, b) => sys(a) - sys(b) || a.name.localeCompare(b.name, "zh"));
    }
    // 图标大小（settings.iconSize）
    box.classList.remove("icons-large", "icons-mid", "icons-small");
    box.classList.add("icons-" + (HeBi.state.settings.iconSize || "mid"));
    defs.forEach((d) => {
      const i = el("div", "hb-dicon");
      i.innerHTML = `<div class="di-ico">${ico(d.icon, 40)}</div><div class="di-name">${d.name}</div>`;
      i.onclick = (e) => {
        e.stopPropagation();
        $$(".hb-dicon").forEach((x) => x.classList.remove("selected"));
        i.classList.add("selected");
      };
      i.ondblclick = () => {
        if (d.id === "pc") HeBi.openApp("files", "此电脑");
        else if (d.id === "recycle") HeBi.toast("回收站", "回收站是空的", "recycle");
        else HeBi.openApp(d.id);
      };
      i.oncontextmenu = (e) => {
        e.preventDefault(); e.stopPropagation();
        $$(".hb-dicon").forEach((x) => x.classList.remove("selected"));
        i.classList.add("selected");
        HeBi.contextMenu(e.clientX, e.clientY, [
          { label: "打开", icon: "view", onClick: () => i.ondblclick() },
          { label: "固定到任务栏", icon: "grid", onClick: () => HeBi.toast("任务栏", "已固定「" + d.name + "」，可从任务栏直接启动", "grid") },
          "-",
          { label: "属性", icon: "props", onClick: () => HeBi.dialog({ title: d.name + " 属性", body: `<div>合璧OS 内置应用</div><div style="margin-top:6px;color:var(--hb-text-2)">版本 5.0.0 · HeBi 自研</div>` }) },
        ]);
      };
      box.appendChild(i);
    });
  }

  /* ============================================================
     六、桌面右键菜单 / 全局快捷键
     ============================================================ */
  function setupDesktop() {
    const dt = $("#hb-desktop");
    dt.addEventListener("contextmenu", (e) => {
      if (e.target.closest(".hb-win") || e.target.closest(".hb-dicon")) return;
      e.preventDefault();
      HeBi.contextMenu(e.clientX, e.clientY, [
        { label: "查看", icon: "view", onClick: () => HeBi.contextMenu(e.clientX + 6, e.clientY + 26, [
            { label: "大图标", icon: "grid", onClick: () => setIconSize("large") },
            { label: "中等图标", icon: "grid", onClick: () => setIconSize("mid") },
            { label: "小图标", icon: "grid", onClick: () => setIconSize("small") },
          ]) },
        { label: "排序方式", icon: "list", onClick: () => HeBi.contextMenu(e.clientX + 6, e.clientY + 50, [
            { label: "按名称", icon: "list", onClick: () => setIconSort("name") },
            { label: "按类型", icon: "list", onClick: () => setIconSort("type") },
            { label: "默认顺序", icon: "list", onClick: () => setIconSort("default") },
          ]) },
        { label: "刷新", icon: "refresh", onClick: () => { HeBi.toast("桌面", "已刷新", "refresh"); } },
        "-",
        { label: "新建文件夹", icon: "newfolder", onClick: () => {
            const name = "新建文件夹";
            const base = "/home/" + HeBi.curUser().id + "/桌面";
            let n = name, i = 1;
            while (HeBi.vfs.exists(base + "/" + n)) n = name + " (" + ++i + ")";
            HeBi.vfs.mkdir(base + "/" + n);
            HeBi.toast("桌面", "已创建「" + n + "」", "newfolder");
          } },
        "-",
        { label: "显示设置", icon: "settings", onClick: () => HeBi.openApp("settings", "display") },
        { label: "个性化", icon: "sun", onClick: () => HeBi.openApp("settings", "personal") },
      ]);
    });
    dt.addEventListener("pointerdown", (e) => {
      if (e.target === dt || e.target.id === "hb-wallpaper" || e.target.id === "hb-icons") {
        $$(".hb-dicon").forEach((x) => x.classList.remove("selected"));
      }
    });
    // 全局快捷键
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { HeBi.toggleStart(false); HeBi.toggleAction(false); HeBi.contextMenuClose && HeBi.contextMenuClose(); }
      if (e.metaKey && e.key === "l" && HeBi.$("#hb-desktop").classList.contains("show")) { e.preventDefault(); lockScreen(); }
    });
    // Win 键（用 Ctrl+Space 兼容浏览器）
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.code === "Space") { e.preventDefault(); HeBi.toggleStart(); }
    });
  }

  /* ============================================================
     七、导出
     ============================================================ */
  HeBi.boot = {
    run: async () => {
      await bootAnimation();
      showLogin();
      setupDesktop();
    },
    lock: lockScreen, shutdown, logout, showLogin,
    renderDesktopIcons,
  };
})();
