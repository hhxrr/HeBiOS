/* ============================================================
   设置（13 大类完整设置体系 · 全量 HeBi 品牌化）
   13 大类: 系统/设备/手机/网络/个性化/应用/账户/时间语言/
             游戏/轻松使用/隐私/更新安全/搜索
   ============================================================ */
(function () {
  const HB = window.HeBi;
  const { $, el, ico } = HB;

  const FONTS = [
    { id: "segoe", label: "Segoe UI / 微软雅黑（推荐）", css: '"Segoe UI", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif' },
    { id: "yahei", label: "微软雅黑 Microsoft YaHei", css: '"Microsoft YaHei", "PingFang SC", sans-serif' },
    { id: "dengxian", label: "等线 DengXian", css: '"DengXian", "Segoe UI", sans-serif' },
    { id: "simsun", label: "宋体 SimSun（衬线）", css: "SimSun, 'Noto Serif CJK SC', serif" },
    { id: "simhei", label: "黑体 SimHei", css: "SimHei, 'Noto Sans CJK SC', sans-serif" },
    { id: "source", label: "思源黑体 Source Han Sans", css: '"Source Han Sans SC", "Noto Sans CJK SC", sans-serif' },
    { id: "cascadia", label: "Cascadia Mono（等宽）", css: '"Cascadia Mono", Consolas, monospace' },
  ];
  const ACCENTS = ["#2E7CF6", "#00B4A6", "#7A5AF8", "#E74856", "#FF8C00", "#107C10", "#C239B3", "#5B6470"];
  const WALL_NAMES = { jade: "玉璧青", aurora: "极光", ink: "水墨", bloom: "花青", deep: "深空" };
  const DRIVERS = [
    { id: "gpu-virtio", name: "合璧虚拟显卡 Virtio-GPU", desc: "virtio-gpu · 2D/3D 加速 · 内置驱动", ver: "1.0.7", size: "1.8 MB", state: "ok", icon: "🖥️" },
    { id: "net-e1000", name: "Intel 千兆网卡 e1000", desc: "以太网控制器 · 1000 Mb/s", ver: "8.0.35", size: "0.4 MB", state: "ok", icon: "🌐" },
    { id: "audio-hda", name: "Intel 高清音频 HDA", desc: "声卡 · Realtek ALC 兼容", ver: "1.0.29", size: "1.1 MB", state: "ok", icon: "🔊" },
    { id: "usb3-xhci", name: "USB 3.0 xHCI 控制器", desc: "通用串行总线 · 6 端口", ver: "1.0.0", size: "0.3 MB", state: "ok", icon: "🔌" },
    { id: "nvme", name: "NVMe 固态硬盘控制器", desc: "块设备 · PCIe 3.0 x4", ver: "1.0.0", size: "0.6 MB", state: "ok", icon: "💾" },
    { id: "wifi-ath9k", name: "Atheros 无线网卡 ath9k", desc: "Wi-Fi 6 · 尚未检测到硬件", ver: "—", size: "2.2 MB", state: "off", icon: "📶" },
    { id: "print-cups", name: "通用打印机 CUPS 驱动", desc: "IPP / AirPrint · 即插即用", ver: "2.4.7", size: "5.4 MB", state: "off", icon: "🖨️" },
    { id: "bt-bluez", name: "蓝牙协议栈 BlueZ", desc: "Bluetooth 5.2 · 尚未检测到适配器", ver: "5.66", size: "3.9 MB", state: "off", icon: "📷" },
  ];

  /* ---------------- 控件库 ---------------- */
  // 设置行: 标签 + 副标签 + 控件
  const row = (label, sub, ctl, extra) =>
    `<div class="st-row"${extra ? " " + extra : ""}><div class="sr-label">${label}${sub ? `<srl-sub>${sub}</srl-sub>` : ""}</div><div class="sr-ctl${ctl && ctl.wide ? " wide" : ""}">${ctl ? ctl.html : ""}</div></div>`;
  const tgl = (id, key, def) => ({ html: `<input type="checkbox" id="${id}" ${HB.state.settings[key] === undefined ? def : HB.state.settings[key] ? "checked" : ""}>` });
  const tglOn = (key) => ({ html: `<input type="checkbox" id="tg-${key}" ${HB.state.settings[key] ? "checked" : ""}>` });
  const rng = (id, key, min, max, step) => ({ wide: true, html: `<input type="range" id="${id}" min="${min}" max="${max}" step="${step || 1}" value="${HB.state.settings[key]}" style="width:100%"><span class="rng-val" id="${id}-v">${HB.state.settings[key]}</span>` });
  const sel = (id, key, opts) => ({ wide: true, html: `<select id="${id}" class="hb-input">${opts.map((o) => `<option value="${o[0]}" ${HB.state.settings[key] == o[0] ? "selected" : ""}>${o[1]}</option>`).join("")}</select>` });
  const card = (title, body, extra) => `<div class="st-card"${extra ? " " + extra : ""}>${title ? `<h3>${title}</h3>` : ""}${body}</div>`;
  const bindToggle = (m, id, key, after) => { const e = $("#" + id, m); if (e) e.onchange = () => { HB.state.settings[key] = e.checked; HB.save(); HB.applySettings(); if (after) after(e.checked); }; };
  const bindRange = (m, id, key, after) => {
    const e = $("#" + id, m); if (!e) return;
    const v = $("#" + id + "-v", m);
    const paint = () => { const p = (e.value - e.min) / (e.max - e.min) * 100; e.style.setProperty("--rng", p + "%"); };
    paint();
    e.oninput = () => { HB.state.settings[key] = +e.value; if (v) v.textContent = e.value; paint(); HB.save(); HB.applySettings(); if (after) after(+e.value); };
  };
  const bindSelect = (m, id, key, after) => { const e = $("#" + id, m); if (e) e.onchange = () => { HB.state.settings[key] = e.value; HB.save(); HB.applySettings(); if (after) after(e.value); }; };
  const hdr = (name, sub) => `<h2>${name}</h2><div class="st-sub">${sub}</div>`;

  /* ============================================================
     分类与子页注册表
     ============================================================ */
  const CATS = [
    { id: "system", name: "系统", icon: "🖥️" },
    { id: "devices", name: "设备", icon: "🖧" },
    { id: "phone", name: "手机", icon: "📱" },
    { id: "network", name: "网络和 Internet", icon: "🌐" },
    { id: "personal", name: "个性化", icon: "🎨" },
    { id: "apps", name: "应用", icon: "📦" },
    { id: "accounts", name: "账户", icon: "👤" },
    { id: "time", name: "时间和语言", icon: "🕐" },
    { id: "gaming", name: "游戏", icon: "🎮" },
    { id: "ease", name: "轻松使用", icon: "♿" },
    { id: "privacy", name: "隐私", icon: "🔒" },
    { id: "update", name: "更新和安全", icon: "🛡️" },
    { id: "search", name: "搜索", icon: "🔍" },
  ];
  // 子页: key = "cat/sub"
  const SUBS = {};
  const sub = (cat, id, name, icon, fn) => { SUBS[cat + "/" + id] = { cat, id, name, icon, fn }; };

  HB.registerApp({
    id: "settings", name: "设置", icon: "settings", w: 940, h: 620,
    open: openSettings, onArg: (win, arg) => { if (arg) nav(win, arg); },
  });

  function openSettings(win, arg) {
    win.body.innerHTML = `<div class="st-app">
      <div class="st-side">
        <div class="ss-user"><span class="avatar" id="st-av"></span><span id="st-uname"></span></div>
        <div class="st-nav" id="st-nav"></div>
        <div class="st-sidesearch"><span class="ss-ico">🔍</span><input id="st-search" placeholder="查找设置" class="hb-input"></div>
      </div>
      <div class="st-main" id="st-main"></div>
    </div>`;
    const u = HB.curUser();
    $("#st-av", win.body).innerHTML = u.avatar === "logo" ? HB.LOGO_SVG : ico("guest", 30);
    $("#st-uname", win.body).textContent = u.name;
    renderNav(win);
    $("#st-search", win.body).oninput = (e) => searchSettings(win, e.target.value.trim());
    $("#st-search", win.body).onkeydown = (e) => { if (e.key === "Escape") { e.target.value = ""; searchSettings(win, ""); } };
    nav(win, arg || "system/display");
  }

  function renderNav(win, activeCat) {
    const nav = $("#st-nav", win.body);
    nav.innerHTML = CATS.map((c) => {
      const subs = Object.values(SUBS).filter((s) => s.cat === c.id);
      const open = activeCat ? activeCat === c.id : subs.some((s) => s.cat + "/" + s.id === win._curSub);
      return `<button class="sn-item ${open ? "open" : ""}" data-c="${c.id}"><span class="sni">${c.icon}</span>${c.name}<span class="sn-arrow">${open ? "▾" : "▸"}</span></button>` +
        (open ? `<div class="sn-subs">${subs.map((s) => `<button class="sn-sub ${win._curSub === c.id + "/" + s.id ? "active" : ""}" data-s="${c.id}/${s.id}">${s.name}</button>`).join("")}</div>` : "");
    }).join("");
    nav.querySelectorAll(".sn-item").forEach((b) => (b.onclick = () => {
      const first = Object.values(SUBS).find((s) => s.cat === b.dataset.c);
      renderNav(win, b.dataset.c);
      nav2(win, b.dataset.c + "/" + first.id);
    }));
    nav.querySelectorAll(".sn-sub").forEach((b) => (b.onclick = () => nav2(win, b.dataset.s)));
  }
  function nav(win, key) {
    if (key.indexOf("/") < 0) {
      const first = Object.values(SUBS).find((s) => s.cat === key);
      key = key + "/" + first.id;
    }
    win._curSub = key;
    renderNav(win, key.split("/")[0]);
    const s = SUBS[key];
    if (!s) return;
    const m = $("#st-main", win.body);
    m.scrollTop = 0;
    s.fn(win, m);
  }
  function nav2(win, key) {
    win._curSub = key;
    renderNav(win, key.split("/")[0]);
    const s = SUBS[key];
    if (!s) return;
    const m = $("#st-main", win.body);
    m.scrollTop = 0;
    s.fn(win, m);
  }
  // 设置搜索: 遍历子页名与关键词
  function searchSettings(win, q) {
    if (!q) { nav(win, win._curSub || "system/display"); return; }
    const hits = Object.values(SUBS).filter((s) => (s.name + " " + (s.kw || "") + " " + s.cat).toLowerCase().includes(q.toLowerCase()));
    const m = $("#st-main", win.body);
    m.innerHTML = hits.length
      ? `<h2>搜索“${q}”</h2><div class="st-sub">找到 ${hits.length} 个设置项</div>` +
        card(null, hits.map((s) => `<div class="st-hit" data-k="${s.cat}/${s.id}"><span class="hit-ico">${s.icon}</span><div><div class="hit-name">${s.name}</div><div class="hit-cat">${CATS.find((c) => c.id === s.cat).name}</div></div><span class="hit-go">→</span></div>`).join(""))
      : `<h2>搜索“${q}”</h2><div class="st-sub">未找到相关设置，请尝试其他关键词</div>`;
    m.querySelectorAll(".st-hit").forEach((h) => (h.onclick = () => nav(win, h.dataset.k)));
  }

  /* ============================================================
     一、系统
     ============================================================ */
  sub("system", "display", "显示", "🖥️", (win, m) => {
    const s = HB.state.settings;
    m.innerHTML = hdr("系统 - 显示", "亮度、夜间光、缩放与显示方向") +
      card("亮度和颜色", row("亮度", "调整内置显示器的亮度", rng("st-bright", "brightness", 25, 100)) +
        row("夜间光", "使用较暖的颜色来阻止蓝光，有助于睡眠", tglOn("nightLight")) +
        row("夜间光强度", "色温强度", rng("st-nlt", "nightLightTemp", 0, 100))) +
      card("缩放与布局", row("更改文本、应用等项目的大小", "依据显示器自动调整", sel("st-scale", "fontSize", [[100, "100%（推荐）"], [125, "125%"], [150, "150%"], [175, "175%"], [200, "200%"]])) +
        row("显示方向", "更改文本与应用的方向", sel("st-ori", "orientation", [["landscape", "横向"], ["portrait", "纵向"], ["flipped", "横向（翻转）"]])) +
        row("分辨率", "显示器原生分辨率（影响桌面缩放）", sel("st-res", "resolutionScale", [[75, "1920 × 1080（高清）"], [85, "1366 × 768"], [100, "1024 × 768（推荐）"], [125, "800 × 600"]]))) +
      card("HeBi HD Color", row("HDR 与广色域", "播放 HDR 视频与游戏", tglOn("hdr")) + `<div class="st-note" id="st-hdr-note">${HB.state.settings.hdr ? "HDR 已开启：画面动态范围增强（演示）" : "未检测到支持 HDR 的显示器"}</div>`);
    bindRange(m, "st-bright", "brightness");
    bindRange(m, "st-nlt", "nightLightTemp");
    bindToggle(m, "tg-nightLight", "nightLight", (v) => HB.toast("显示", v ? "夜间光已开启" : "夜间光已关闭", "settings"));
    bindSelect(m, "st-scale", "fontSize");
    bindSelect(m, "st-ori", "orientation", (v) => HB.toast("显示", "方向已切换为 " + { landscape: "横向", portrait: "纵向", flipped: "横向（翻转）" }[v], "settings"));
    bindSelect(m, "st-res", "resolutionScale", (v) => HB.toast("显示", "分辨率已切换（桌面缩放 " + v + "%）", "settings"));
    bindToggle(m, "tg-hdr", "hdr", (v) => {
      const n = $("#st-hdr-note", m);
      if (n) n.textContent = v ? "HDR 已开启：画面动态范围增强（演示）" : "未检测到支持 HDR 的显示器";
      HB.toast("显示", v ? "HDR 已开启" : "HDR 已关闭", "settings");
    });
  });
  sub("system", "sound", "声音", "🔊", (win, m) => {
    const s = HB.state.settings;
    m.innerHTML = hdr("系统 - 声音", "输出、输入与应用音量") +
      card("输出", row("选择播放声音的位置", "扬声器 / HDMI / 蓝牙音频", sel("st-out", "soundOutput", [["speaker", "扬声器 - 合璧 HD Audio"], ["hdmi", "HeBi HDMI 输出"], ["bt", "Jade Buds Pro（蓝牙）"]])) +
        row("主音量", "", rng("st-vol", "volume", 0, 100)) +
        row("静音", "", tglOn("muted"))) +
      card("输入", row("选择输入设备", "", sel("st-in", "soundInput", [["mic", "麦克风 - HeBi Audio"], ["line", "线路输入 - 合璧 HD Audio"]])) +
        row("输入音量", "", rng("st-mic", "micVolume", 0, 100))) +
      card("高级声音选项", row("应用音量和设备首选项", "按应用单独控制音量", { html: `<button class="hb-btn" id="st-appvol">打开</button>` }) +
        row("播放启动声音", "开机时播放合璧启动音", tglOn("cleartype")));
    bindRange(m, "st-vol", "volume", (v) => { if (v > 0) HB.state.settings.muted = false; });
    bindToggle(m, "tg-muted", "muted");
    bindSelect(m, "st-out", "soundOutput", (v) => HB.toast("声音", "输出设备已切换（演示）", "settings"));
    bindSelect(m, "st-in", "soundInput", (v) => HB.toast("声音", "输入设备已切换（演示）", "settings"));
    bindRange(m, "st-mic", "micVolume");
    $("#st-appvol", m).onclick = () => HB.toast("声音", "按应用音量面板已打开（演示）", "settings");
  });
  sub("system", "notify", "通知和操作", "🔔", (win, m) => {
    m.innerHTML = hdr("系统 - 通知和操作", "通知来源、专注助手与快速操作") +
      card("通知", row("获取来自应用和其他发送者的通知", "", tglOn("appNotifications")) +
        row("播放通知声音", "", tglOn("soundNotifications")) +
        row("显示通知横幅", "锁屏界面也显示通知", tglOn("showSeconds"))) +
      card("专注助手", row("开启专注助手", "隐藏通知，仅接收优先级通知", tglOn("focusAssist")) +
        row("自动规则 - 安静时段", "在指定时间段自动开启", tglOn("quietHours")) +
        row("自动规则 - 夜间计划", "日落后自动开启", tglOn("nightSchedule"))) +
      card("快速操作", `<div class="st-quick-grid">
        ${[["wifi", "📶", "Wi-Fi"], ["bt", "🦷", "蓝牙"], ["airplane", "✈️", "飞行模式"], ["nightLight", "🌙", "夜间光"], ["batterySaver", "🔋", "节电模式"], ["focusAssist", "🌗", "专注助手"]].map(([k, i, n]) =>
          `<button class="st-quick ${HB.state.settings[k] ? "on" : ""}" data-q="${k}"><span>${i}</span>${n}<span class="q-dot"></span></button>`).join("")}
      </div><div class="st-note">点击快速操作可即时开关（与设置面板双向同步）</div>`);
    bindToggle(m, "tg-appNotifications", "appNotifications");
    bindToggle(m, "tg-soundNotifications", "soundNotifications");
    bindToggle(m, "tg-showSeconds", "showSeconds", (v) => HB.toast("通知", v ? "时钟将显示秒" : "时钟已隐藏秒针", "settings"));
    bindToggle(m, "tg-focusAssist", "focusAssist", (v) => HB.toast("专注助手", v ? "已开启" : "已关闭", "settings"));
    bindToggle(m, "tg-quietHours", "quietHours");
    bindToggle(m, "tg-nightSchedule", "nightSchedule");
    m.querySelectorAll(".st-quick").forEach((b) => (b.onclick = () => {
      const k = b.dataset.q;
      HB.state.settings[k] = !HB.state.settings[k];
      HB.save(); HB.applySettings();
      b.classList.toggle("on", HB.state.settings[k]);
      HB.toast("快速操作", (HB.state.settings[k] ? "已开启：" : "已关闭：") + b.textContent.replace(/\s+/g, ""), "settings");
    }));
  });
  sub("system", "power", "电源和睡眠", "🔋", (win, m) => {
    m.innerHTML = hdr("系统 - 电源和睡眠", "屏幕关闭时间与电源模式") +
      card("电源和睡眠", row("接通电源时，在此时间后关闭屏幕", "", sel("st-sleep", "sleepAfter", [[5, "5 分钟"], [10, "10 分钟"], [30, "30 分钟"], [60, "1 小时"], [0, "从不"]])) +
        row("接通电源时，在此时间后进入睡眠", "", sel("st-hib", "hibernateAfter", [[15, "15 分钟"], [30, "30 分钟"], [60, "1 小时"], [90, "90 分钟"], [0, "从不"]]))) +
      card("节电模式", row("使用节电模式", "电量低于 20% 时自动开启", tglOn("batterySaver")) +
        row("电源模式", "平衡性能与能耗", sel("st-pm", "powerMode", [["best-eff", "最佳能效"], ["balanced", "平衡（推荐）"], ["best-perf", "最佳性能"]])));
    bindSelect(m, "st-sleep", "sleepAfter");
    bindSelect(m, "st-hib", "hibernateAfter");
    bindToggle(m, "tg-batterySaver", "batterySaver", (v) => HB.toast("节电模式", v ? "已开启" : "已关闭", "settings"));
    bindSelect(m, "st-pm", "powerMode");
  });
  sub("system", "storage", "存储", "💾", (win, m) => {
    m.innerHTML = hdr("系统 - 存储", "磁盘空间与存储感知") +
      card("存储空间", `<div class="st-usage"><div class="su-bar"><div class="su-seg" style="width:42%;background:#2E7CF6" title="系统"></div><div class="su-seg" style="width:18%;background:#00B4A6" title="应用"></div><div class="su-seg" style="width:9%;background:#FF8C00" title="文档"></div><div class="su-seg" style="width:6%;background:#7A5AF8" title="临时文件"></div></div>
        <div class="su-legend">${[["系统", "#2E7CF6", "108 GB"], ["应用和功能", "#00B4A6", "46 GB"], ["文档", "#FF8C00", "23 GB"], ["临时文件", "#7A5AF8", "15 GB"], ["可用空间", "#c7d2de", "64 GB"]].map(([n, c, v]) => `<span class="lg-i"><i style="background:${c}"></i>${n} · ${v}</span>`).join("")}</div></div>`) +
      card("存储感知", row("自动释放空间", "删除临时文件并清空回收站", tglOn("storageSense")) +
        row("磁盘空间不足时提醒我", "", tglOn("storageAlert")) +
        row("立即释放空间", "清理临时文件（演示）", { html: `<button class="hb-btn primary" id="st-clean">立即清理</button>` }));
    bindToggle(m, "tg-storageSense", "storageSense");
    bindToggle(m, "tg-storageAlert", "storageAlert");
    $("#st-clean", m).onclick = function () { this.disabled = true; this.textContent = "清理中…"; setTimeout(() => { this.disabled = false; this.textContent = "立即清理"; HB.toast("存储", "已释放 15 GB 临时空间", "settings"); }, 1200); };
  });
  sub("system", "multitask", "多任务", "🪟", (win, m) => {
    m.innerHTML = hdr("系统 - 多任务", "贴靠窗口、时间线与虚拟桌面") +
      card("贴靠窗口", row("将窗口贴靠排列", "拖动窗口到屏幕边缘时自动排列", tglOn("snapWindows")) +
        row("贴靠助手", "贴靠时提示排列其他窗口", tglOn("snapAssist"))) +
      card("虚拟桌面", row("使用多桌面", "在任务栏视图中创建多个桌面", tglOn("multiDesktop")) +
        row("任务栏上显示任务视图按钮", "", tglOn("showTaskView"))) +
      card("时间线", row("显示时间线建议", "Alt+Tab 与任务视图中的活动历史", tglOn("timeline")) +
        row("显示剪贴板历史记录", "Win+V 查看历史剪贴", tglOn("clipboardHistory")));
    bindToggle(m, "tg-snapWindows", "snapWindows");
    bindToggle(m, "tg-snapAssist", "snapAssist");
    bindToggle(m, "tg-multiDesktop", "multiDesktop");
    bindToggle(m, "tg-showTaskView", "showTaskView", (v) => HB.toast("多任务", v ? "任务视图按钮已显示" : "任务视图按钮已隐藏", "settings"));
    bindToggle(m, "tg-timeline", "timeline");
    bindToggle(m, "tg-clipboardHistory", "clipboardHistory");
  });
  sub("system", "tablet", "平板模式", "📋", (win, m) => {
    m.innerHTML = hdr("系统 - 平板模式", "平板设备的使用体验") +
      card("当我登录时", row("使用平板模式", "应用全屏运行，任务栏显示应用按钮", tglOn("tabletsTaskbar")) +
        row("记住我在此设备上使用的模式", "", tglOn("tabletRemember"))) +
      `<div class="st-note">当前设备未检测到触摸屏与加速度传感器，平板模式不可用。</div>`;
    bindToggle(m, "tg-tabletsTaskbar", "tabletsTaskbar");
    bindToggle(m, "tg-tabletRemember", "tabletRemember", (v) => HB.toast("平板模式", v ? "将记住在此设备上使用的模式" : "不再记住使用模式", "settings"));
  });
  sub("system", "about", "关于", "ℹ️", (win, m) => {
    m.innerHTML = hdr("系统 - 关于", "设备规格与系统信息") +
      `<div class="st-about-logo"><img src="${HB.LOGO_SVG.startsWith("<svg") ? "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(HB.LOGO_SVG))) : HB.LOGO_SVG}" alt="logo">
        <div><div class="al-name">合璧OS</div><div class="al-ver">HeBi OS 5.0 LTS · 版本 5.0.0 · 代号「Jade 玉」</div></div></div>
      <div class="ab-quote">珠联璧合——融 Linux 内核，承 Windows 体验。<br>支持 .deb / .exe / .msi / .mdn 安装包，兼容双生态应用。</div>` +
      card("设备规格", `<div class="st-spec-grid">
        <span class="sp-k">处理器</span><span class="sp-v">HeBi Virtual CPU @ 2.60GHz（双核）</span>
        <span class="sp-k">内存</span><span class="sp-v">2.0 GB</span>
        <span class="sp-k">系统类型</span><span class="sp-v">64 位操作系统 · x64</span>
        <span class="sp-k">内核</span><span class="sp-v">Linux 6.8.0-hebi (LTS)</span>
        <span class="sp-k">显示适配器</span><span class="sp-v">Virtio-GPU · 1024×768×32</span>
        <span class="sp-k">存储</span><span class="sp-v">合璧 SSD 256 GB</span>
        <span class="sp-k">HeBi 规格</span><span class="sp-v">版本 5.0.0 · 安装日期 2026/10/21 · 体验包 Jade</span>
      </div>`) +
      card("重命名此电脑", row("计算机名", "用于局域网内标识本机", { wide: true, html: `<div style="display:flex;gap:8px"><input class="hb-input" id="st-pcname" value="hebios-pc" style="flex:1"><button class="hb-btn" id="st-renamepc">重命名</button></div>` })) +
      card("相关设置", `<div class="st-links">
        <button class="st-link" data-go="update/windows">HeBi 更新</button>
        <button class="st-link" data-go="privacy/general">隐私选项</button>
        <button class="st-link" data-go="accounts/info">账户信息</button>
        <button class="st-link" id="st-spec">系统规格（诊断）</button>
      </div>`) +
      card("法律信息", `<div style="font-size:12.5px;line-height:1.8;color:var(--hb-text-2)">
        授权方式：GPL-3.0（内核）+ 部分闭源组件<br>
        字体许可：Segoe UI 微软雅黑（兼容替换：Noto Sans CJK SC）<br>
        内置办公助手 璧儿 / 语音助手 合合 · 版本 1.2.0<br>
        © 2026 HeBi OS Project · 珠联璧合工作室</div>`);
    $("#st-renamepc", m).onclick = () => { const v = $("#st-pcname", m).value.trim(); if (v) HB.toast("系统", "计算机名将更改为 " + v + "（重启后生效）", "settings"); };
    $("#st-spec", m).onclick = () => HB.toast("关于", "设备规格：CPU 2 核 2.60GHz · 内存 2.0 GB · 磁盘 256 GB · 显示 Virtio-GPU", "settings");
    m.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => nav(win, b.dataset.go)));
  });

  /* ============================================================
     二、设备
     ============================================================ */
  sub("devices", "bt", "蓝牙和其他设备", "🦷", (win, m) => {
    m.innerHTML = hdr("设备 - 蓝牙和其他设备", "蓝牙、打印机与自动播放") +
      card("蓝牙", row("打开蓝牙", "发现并连接到其他设备", tglOn("bt")) +
        `<div class="st-note">${HB.state.settings.bt ? "蓝牙已开启，正在搜索附近设备…" : "蓝牙已关闭"}</div>`) +
      card("已配对设备", `<div class="st-dev-list">
        ${[["🖱️", "HeBi 无线鼠标", "已连接", true], ["⌨️", "合璧蓝牙键盘", "已连接", true], ["🎧", "Jade Buds Pro", "未连接", false], ["📱", "璧儿 Phone", "已配对", false]].map(([i, n, s2, on]) =>
          `<div class="st-dev-row"><span>${i}</span><div><div class="dev-name">${n}</div><div class="dev-st">${s2}</div></div><button class="hb-btn${on ? "" : " primary"}" data-bt="${n}|${on ? "1" : "0"}">${on ? "断开" : "连接"}</button></div>`).join("")}
      </div>`) +
      card("自动播放", row("在所有媒体和设备上使用自动播放", "插入设备后自动打开操作面板", tglOn("autoPlay")) +
        row("USB 选择性暂停", "未使用时自动降低 USB 设备功耗", tglOn("usbSuspend")));
    bindToggle(m, "tg-bt", "bt", (v) => { m.querySelector(".st-note").textContent = v ? "蓝牙已开启，正在搜索附近设备…" : "蓝牙已关闭"; HB.toast("设备", v ? "蓝牙已开启" : "蓝牙已关闭", "settings"); });
    bindToggle(m, "tg-autoPlay", "autoPlay");
    bindToggle(m, "tg-usbSuspend", "usbSuspend");
    m.querySelectorAll("[data-bt]").forEach((b) => (b.onclick = () => {
      const [nm, on] = b.dataset.bt.split("|");
      HB.toast("蓝牙", on === "1" ? "已断开 " + nm : "正在连接 " + nm + "…（演示）", "settings");
    }));
  });
  sub("devices", "printers", "打印机和扫描仪", "🖨️", (win, m) => {
    m.innerHTML = hdr("设备 - 打印机和扫描仪", "打印设备管理") +
      card("打印机", `<div class="st-dev-list">
        <div class="st-dev-row"><span>🖨️</span><div><div class="dev-name">HeBi PDF Printer（默认）</div><div class="dev-st">虚拟打印 · 就绪</div></div><button class="hb-btn" data-pr="HeBi PDF Printer|管理">管理</button></div>
        <div class="st-dev-row"><span>🖨️</span><div><div class="dev-name">HP LaserJet Pro MFP</div><div class="dev-st">USB · 脱机</div></div><button class="hb-btn" data-pr="HP LaserJet Pro MFP|连接">连接</button></div>
      </div>`) +
      card("默认打印机", row("让 HeBi 管理默认打印机", "自动选择最近使用的打印机", tglOn("printerAuto"))) +
      `<div style="margin-top:10px"><button class="hb-btn primary" id="st-addprinter">＋ 添加打印机或扫描仪</button></div>`;
    bindToggle(m, "tg-printerAuto", "printerAuto", (v) => HB.toast("打印机", v ? "已让 HeBi 管理默认打印机" : "已改回手动选择默认打印机", "settings"));
    m.querySelectorAll("[data-pr]").forEach((b) => (b.onclick = () => {
      const [nm, act] = b.dataset.pr.split("|");
      HB.toast("打印机", nm + "：" + (act === "管理" ? "打印队列 · 属性 · 端口（演示）" : "正在连接…（演示）"), "settings");
    }));
    $("#st-addprinter", m).onclick = () => HB.toast("打印机", "正在搜索网络打印机…（演示）", "settings");
  });
  sub("devices", "mouse", "鼠标", "🖱️", (win, m) => {
    m.innerHTML = hdr("设备 - 鼠标", "按钮、指针速度与滚轮") +
      card("按钮", row("主按钮", "选择鼠标左键或右键", sel("st-mb", "mousePrimary", [["left", "左键"], ["right", "右键"]]))) +
      card("指针选项", row("指针速度", "", rng("st-ms", "mouseSpeed", 0, 100)) +
        row("指针大小", "更改光标与插入点大小", sel("st-cs", "cursorSize", [[1, "标准"], [2, "中等"], [3, "大"]]))) +
      card("滚轮", row("每次滚动滚动的行数", "垂直滚动", { wide: true, html: `<input type="number" class="hb-input" id="st-wheel" value="${HB.state.settings.wheelLines}" min="1" max="20" style="width:80px">` }));
    bindSelect(m, "st-mb", "mousePrimary", (v) => HB.toast("鼠标", "主按钮已设为" + (v === "left" ? "左键" : "右键"), "settings"));
    bindRange(m, "st-ms", "mouseSpeed");
    bindSelect(m, "st-cs", "cursorSize");
    $("#st-wheel", m).onchange = function () {
      const v = Math.max(1, Math.min(20, +this.value || 3));
      this.value = v; HB.state.settings.wheelLines = v; HB.save();
      HB.toast("鼠标", "每滚轮格滚动 " + v + " 行", "settings");
    };
  });
  sub("devices", "typing", "输入（键入）", "⌨️", (win, m) => {
    m.innerHTML = hdr("设备 - 输入", "键盘与输入法") +
      card("按键重复", row("重复延迟", "按住按键多久后开始重复", rng("st-krd", "keyboardRepeatDelay", 0, 100)) +
        row("重复速度", "按键重复的快慢", rng("st-krr", "repeatRate", 0, 100))) +
      card("按键行为", row("按 Caps Lock 时提示", "切换大小写时播放提示音", tglOn("capsWarn")) +
        row("登录时启用数字键盘", "", tglOn("numlock"))) +
      card("输入法", `<div class="st-dev-list">
        <div class="st-dev-row"><span>🔤</span><div><div class="dev-name">合璧拼音 · HeBi Pinyin</div><div class="dev-st">默认输入法 · 云拼音候选</div></div><button class="hb-btn" data-ime="合璧拼音|选项">选项</button></div>
        <div class="st-dev-row"><span>⌨️</span><div><div class="dev-name">微软拼音（兼容）</div><div class="dev-st">已安装</div></div><button class="hb-btn" data-ime="微软拼音|删除">删除</button></div>
      </div><div style="margin-top:10px"><button class="hb-btn primary" id="st-addime">＋ 添加输入法</button></div>`);
    bindRange(m, "st-krd", "keyboardRepeatDelay");
    bindRange(m, "st-krr", "repeatRate");
    bindToggle(m, "tg-capsWarn", "capsWarn");
    bindToggle(m, "tg-numlock", "numlock");
    m.querySelectorAll("[data-ime]").forEach((b) => (b.onclick = () => {
      const [nm, act] = b.dataset.ime.split("|");
      HB.toast("输入", nm + "：" + (act === "选项" ? "云拼音 / 双拼 / 模糊音设置（演示）" : "已删除（演示）"), "settings");
    }));
    $("#st-addime", m).onclick = () => HB.toast("输入", "可从合璧软件源安装：五笔、郑码、手写输入（演示）", "settings");
  });

  /* ============================================================
     三、手机
     ============================================================ */
  sub("phone", "link", "手机", "📱", (win, m) => {
    m.innerHTML = hdr("手机", "将手机链接到电脑") +
      card("手机链接", row("打开手机链接", "在电脑上查看手机通知、照片与消息", tglOn("phoneLink"))) +
      `<div class="st-note">${HB.state.settings.phoneLink ? "请在手机上安装「手机链接」应用并扫描配对码。" : "开启后可将 Android / 璧儿 Phone 链接到合璧OS。"}</div>` +
      card("最近使用的设备", `<div class="st-dev-list"><div class="st-dev-row"><span>📱</span><div><div class="dev-name">暂无链接设备</div><div class="dev-st">开启手机链接后可发现设备</div></div></div></div>`);
    bindToggle(m, "tg-phoneLink", "phoneLink");
  });

  /* ============================================================
     四、网络和 Internet
     ============================================================ */
  sub("network", "status", "状态", "📶", (win, m) => {
    const s = HB.state.settings;
    m.innerHTML = hdr("网络和 Internet - 状态", "连接状态与疑难解答") +
      card("网络状态", `<div class="st-net-status">
        <div class="ns-hero ${s.wifi ? "on" : ""}"><span class="ns-ico">${s.airplane ? "✈️" : s.wifi ? "📶" : "🔌"}</span>
          <div><div class="ns-title">${s.airplane ? "飞行模式已开启" : s.wifi ? "HeBi-5G（已连接，安全）" : "以太网 2（未连接）"}</div>
          <div class="ns-sub">${s.airplane ? "所有无线连接已关闭" : s.wifi ? "IPv4 + IPv6 连接 · 信号强度：优 · 1 Gb/s" : "未插入网线"}</div></div></div>
        <div class="ns-grid">
          <span class="ns-k">IPv4 地址</span><span class="ns-v">10.0.2.15</span>
          <span class="ns-k">IPv6 地址</span><span class="ns-v">fe80::a00:27ff:fe4e:66a1</span>
          <span class="ns-k">DNS 服务器</span><span class="ns-v">10.0.2.3（自动）</span>
          <span class="ns-k">默认网关</span><span class="ns-v">10.0.2.2</span>
        </div></div>`) +
      card("疑难解答", `<div class="st-links">
        <button class="st-link" id="st-nett">🌐 网络疑难解答</button>
        <button class="st-link" id="st-netr">🔄 重置网络</button>
        <button class="st-link" id="st-neth">🔥 查看硬件属性</button>
      </div>`);
    $("#st-nett", m).onclick = function () { this.disabled = true; this.textContent = "正在检测…"; setTimeout(() => { this.disabled = false; this.textContent = "🌐 网络疑难解答"; HB.toast("网络", "疑难解答完成：未发现问题 · 网络连接正常", "settings"); }, 1500); };
    $("#st-netr", m).onclick = () => HB.toast("网络", "已重置网络适配器与 DNS 缓存（演示）", "settings");
    $("#st-neth", m).onclick = () => HB.toast("网络", "Intel 82540EM Gigabit Ethernet Controller · 驱动 8.0.35", "settings");
  });
  sub("network", "wifi", "WLAN", "📶", (win, m) => {
    const s = HB.state.settings;
    m.innerHTML = hdr("网络 - WLAN", "Wi-Fi 连接与热点") +
      card("Wi-Fi", row("使用 Wi-Fi", "关闭后可使用以太网连接", tglOn("wifi")) +
        row("热点", "共享你的 Internet 连接", tglOn("hotspot"))) +
      card("可用网络", `${s.wifi ? `<div class="st-net-list">
        ${[["HeBi-5G", "已连接，安全", 4, true], ["HeBi-2.4G", "安全", 3, false], ["TP-LINK_5F3A", "安全", 3, false], ["CMCC-8x2k", "开放", 2, false]].map(([n, d, b, cur]) =>
          `<div class="st-net-row ${cur ? "cur" : ""}"><span class="nr-bars">${"▮▮▮▮".slice(0, b) + "▯".repeat(4 - b)}</span><div><div class="nr-name">${n}</div><div class="nr-desc">${d}</div></div>${cur ? '<button class="hb-btn">断开</button>' : '<button class="hb-btn">连接</button>'}</div>`).join("")}
      </div>` : `<div class="st-note">Wi-Fi 已关闭。开启后可搜索附近网络。</div>`}`) +
      card("高级选项", row("随机硬件地址", "增强隐私，防止跨网络跟踪", tglOn("findDevice")) +
        row("随时查找我的设备", "使用定位服务查找丢失设备", { html: `<input type="checkbox" id="st-wififind" ${s.wifi ? "checked" : ""}>` }));
    bindToggle(m, "tg-wifi", "wifi", () => nav(win, "network/wifi"));
    bindToggle(m, "tg-hotspot", "hotspot", (v) => HB.toast("热点", v ? "热点已开启：HeBi-Hotspot / hebi2026" : "热点已关闭", "settings"));
    $("#st-wififind", m).onchange = function () { HB.toast("WLAN", this.checked ? "已开启随时查找我的设备" : "已关闭随时查找我的设备", "settings"); };
  });
  sub("network", "ethernet", "以太网", "🔌", (win, m) => {
    m.innerHTML = hdr("网络 - 以太网", "有线网络适配器") +
      card("以太网 2", `<div class="st-net-status"><div class="ns-hero off"><span class="ns-ico">🔌</span>
        <div><div class="ns-title">以太网 2（未连接）</div><div class="ns-sub">未插入网线 · Realtek PCIe GbE</div></div></div></div>`) +
      card("适配器选项", `<div class="st-links">
        <button class="st-link" id="st-ethcfg">⚙️ 更改适配器选项</button>
        <button class="st-link" id="st-ethdi">📊 数据使用量</button>
      </div>`);
    $("#st-ethcfg", m).onclick = () => HB.toast("以太网", "控制面板 → 网络连接 → 以太网 2（演示）", "settings");
    $("#st-ethdi", m).onclick = () => HB.toast("以太网", "过去 30 天数据使用量：4.7 GB", "settings");
  });
  sub("network", "vpn", "VPN", "🔐", (win, m) => {
    m.innerHTML = hdr("网络 - VPN", "虚拟专用网络") +
      card("VPN", row("添加 VPN 连接", "通过虚拟专用网络安全访问", { html: `<button class="hb-btn primary" id="st-addvpn">＋ 添加 VPN</button>` })) +
      card("已配置连接", `<div class="st-dev-list">
        <div class="st-dev-row"><span>🔐</span><div><div class="dev-name">合璧办公 VPN</div><div class="dev-st">IKEv2 · vpn.hebios.cn · 未连接</div></div><button class="hb-btn">连接</button></div>
      </div>`) +
      card("高级选项", row("允许通过 VPN 流量分离", "", tglOn("vpn")));
    bindToggle(m, "tg-vpn", "vpn", (v) => HB.toast("VPN", v ? "流量分离已开启" : "流量分离已关闭", "settings"));
    $("#st-addvpn", m).onclick = () => HB.toast("VPN", "请输入连接信息：服务器地址、类型（IKEv2/L2TP/OpenVPN）（演示）", "settings");
  });
  sub("network", "proxy", "代理", "🛰️", (win, m) => {
    m.innerHTML = hdr("网络 - 代理", "代理服务器设置") +
      card("自动代理设置", row("自动检测设置", "自动检测网络代理配置", tglOn("proxyAuto")) +
        row("使用安装程序脚本", "", tglOn("proxyScript"))) +
      card("手动代理设置", row("使用代理服务器", "手动指定代理地址与端口", { html: `<input type="checkbox" id="st-px" ${HB.state.settings.proxyManual ? "checked" : ""}>` }) +
        row("地址", "", { wide: true, html: `<input class="hb-input" id="st-pxa" value="${HB.state.settings.proxyAddr}" ${HB.state.settings.proxyManual ? "" : "disabled"}>` }) +
        row("例外", "不使用代理的地址", { wide: true, html: `<input class="hb-input" id="st-pxe" value="${HB.state.settings.proxyExcept}" ${HB.state.settings.proxyManual ? "" : "disabled"}>` }));
    const pxBox = $("#st-px", m), addrI = $("#st-pxa", m), excI = $("#st-pxe", m);
    const setManual = (on) => {
      HB.state.settings.proxyManual = on;
      if (on) HB.state.settings.proxyAuto = false;
      HB.save(); HB.applySettings();
      pxBox.checked = on;
      addrI.disabled = excI.disabled = !on;
      const au = $("#tg-proxyAuto", m); if (au) au.checked = HB.state.settings.proxyAuto;
      HB.toast("代理", on ? "已启用手动代理服务器" : "已关闭手动代理服务器", "settings");
    };
    pxBox.onchange = () => setManual(pxBox.checked);
    addrI.onchange = () => { HB.state.settings.proxyAddr = addrI.value.trim(); HB.save(); HB.toast("代理", "代理地址已保存", "settings"); };
    excI.onchange = () => { HB.state.settings.proxyExcept = excI.value.trim(); HB.save(); HB.toast("代理", "例外列表已保存", "settings"); };
    bindToggle(m, "tg-proxyAuto", "proxyAuto", (v) => { if (v) setManual(false); });
    bindToggle(m, "tg-proxyScript", "proxyScript", (v) => HB.toast("代理", v ? "安装程序脚本已启用" : "安装程序脚本已关闭", "settings"));
  });

  /* ============================================================
     五、个性化
     ============================================================ */
  sub("personal", "background", "背景", "🖼️", (win, m) => {
    const s = HB.state.settings;
    m.innerHTML = hdr("个性化 - 背景", "桌面壁纸与契合度") +
      card("选择背景", row("背景类型", "图片 / 纯色 / 幻灯片放映", sel("st-bg", "wallpaper", Object.keys(HB.wallpapers).map((k) => [k, WALL_NAMES[k] || k]))) +
        `<div class="st-wall-grid" id="st-walls"></div>` +
        row("选择契合度", "桌面背景的显示方式", sel("st-fit", "cleartype", [["fill", "填充"], ["fit", "适应"], ["stretch", "拉伸"], ["tile", "平铺"], ["center", "居中"], ["span", "跨区"]]))) +
      card("幻灯片放映", row("幻灯片放映相册", "选择用于轮播的相册", { html: `<button class="hb-btn" id="st-slide">选择相册</button>` }) +
        row("更改图片频率", "轮播切换间隔", { wide: true, html: `<select class="hb-input" id="st-slide-i" style="width:120px"><option value="1m">1 分钟</option><option value="10m">10 分钟</option><option value="30m">30 分钟</option><option value="1h">1 小时</option><option value="1d">1 天</option></select>` }));
    $("#st-slide", m).onclick = () => HB.toast("背景", "请选择相册：本机照片 / 共享图片 / 壁纸库（演示）", "settings");
    const sli = $("#st-slide-i", m); sli.value = HB.state.settings.slideInterval || "10m";
    sli.onchange = () => { HB.state.settings.slideInterval = sli.value; HB.save(); HB.toast("背景", "轮播间隔已设为 " + sli.selectedOptions[0].textContent, "settings"); };
    bindSelect(m, "st-bg", "wallpaper");
    bindSelect(m, "st-fit", "cleartype");
    const wg = $("#st-walls", m);
    Object.keys(HB.wallpapers).forEach((k) => {
      const d = el("div", "st-theme-preview" + (k === s.wallpaper ? " sel" : ""));
      d.style.backgroundImage = `url(${HB.wallpapers[k]})`;
      d.dataset.w = k;
      d.innerHTML = `<div class="stp-check">✓</div><div style="position:absolute;left:8px;bottom:6px;font-size:10.5px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.8)">${WALL_NAMES[k] || k}</div>`;
      d.onclick = () => {
        s.wallpaper = k; HB.save(); HB.applySettings();
        wg.querySelectorAll(".st-theme-preview").forEach((q) => q.classList.toggle("sel", q === d));
        HB.toast("背景", "壁纸已切换为「" + (WALL_NAMES[k] || k) + "」", "settings");
      };
      wg.appendChild(d);
    });
  });
  sub("personal", "colors", "颜色", "🎨", (win, m) => {
    const s = HB.state.settings;
    m.innerHTML = hdr("个性化 - 颜色", "主题模式、主题色与透明效果") +
      card("选择颜色模式", row("选择模式", "浅色 / 深色 / 自定义", sel("st-theme", "theme", [["light", "浅色"], ["dark", "深色"]])) +
        `<div style="display:flex;gap:14px;margin:10px 0">
          <div class="st-theme-preview ${s.theme === "light" ? "sel" : ""}" data-t="light" style="background:linear-gradient(160deg,#dbe7f5,#f5f8fc)"><div class="stp-check">✓</div><div style="position:absolute;left:10px;bottom:8px;font-size:11px;color:#333">浅色</div></div>
          <div class="st-theme-preview ${s.theme === "dark" ? "sel" : ""}" data-t="dark" style="background:linear-gradient(160deg,#141a22,#232b36)"><div class="stp-check">✓</div><div style="position:absolute;left:10px;bottom:8px;font-size:11px;color:#cdd6e0">深色</div></div>
        </div>`) +
      card("主题色", `<div class="st-accents">${ACCENTS.map((c) => `<div class="st-accent-dot ${c === s.accent ? "sel" : ""}" data-c="${c}" style="background:${c}"></div>`).join("")}</div>`) +
      card("透明效果", row("启用透明效果", "窗口背景呈现亚克力质感", tglOn("transparency")) +
        row("在标题栏显示主题色", "", tglOn("titleBarsColor")));
    bindSelect(m, "st-theme", "theme");
    m.querySelectorAll(".st-theme-preview").forEach((p) => (p.onclick = () => {
      s.theme = p.dataset.t; HB.save(); HB.applySettings();
      m.querySelectorAll(".st-theme-preview").forEach((q) => q.classList.toggle("sel", q === p));
      $("#st-theme", m).value = s.theme;
    }));
    m.querySelectorAll(".st-accent-dot").forEach((d) => (d.onclick = () => {
      s.accent = d.dataset.c; HB.save(); HB.applySettings();
      m.querySelectorAll(".st-accent-dot").forEach((q) => q.classList.toggle("sel", q === d));
    }));
    bindToggle(m, "tg-transparency", "transparency");
    bindToggle(m, "tg-titleBarsColor", "titleBarsColor");
  });
  sub("personal", "lockscreen", "锁屏界面", "🔒", (win, m) => {
    m.innerHTML = hdr("个性化 - 锁屏界面", "锁屏图片与状态显示") +
      card("选择图片", `<div class="st-wall-grid" id="st-lwalls"></div>`) +
      card("锁屏界面状态", `<div class="st-dev-list" id="st-lockstates">
        ${[["🌤️", "天气：晴 22°C · 空气优"], ["📅", "日历：今日 2 个日程"], ["✉️", "邮件：3 封未读"]].map(([i, t]) => `<div class="st-dev-row"><span>${i}</span><div><div class="dev-name">${t}</div></div><button class="hb-btn" data-ls="${t}">移除</button></div>`).join("")}
        <div style="margin-top:10px"><button class="hb-btn primary" id="st-addapp2">＋ 选择一个应用以显示详细状态</button></div>
      </div>`);
    const wg = $("#st-lwalls", m);
    Object.keys(HB.wallpapers).forEach((k) => {
      const d = el("div", "st-theme-preview");
      d.style.backgroundImage = `url(${HB.wallpapers[k]})`;
      d.innerHTML = `<div class="stp-check">✓</div>`;
      d.onclick = () => { wg.querySelectorAll(".st-theme-preview").forEach((q) => q.classList.remove("sel")); d.classList.add("sel"); HB.toast("锁屏", "锁屏图片已更新", "settings"); };
      wg.appendChild(d);
    });
    $("#st-addapp2", m).onclick = () => HB.toast("锁屏", "选择应用：日历 / 邮件 / 天气 / 音乐（演示）", "settings");
    m.querySelectorAll("[data-ls]").forEach((b) => (b.onclick = () => {
      b.closest(".st-dev-row").remove();
      HB.toast("锁屏", "已移除锁屏状态：" + b.dataset.ls, "settings");
    }));
  });
  sub("personal", "themes", "主题", "🖌️", (win, m) => {
    m.innerHTML = hdr("个性化 - 主题", "主题包与桌面图标") +
      card("当前主题", `<div class="st-theme-hero">
        <div class="th-preview" style="background-image:url(${HB.wallpapers[HB.state.settings.wallpaper]})"><div class="th-bar"></div></div>
        <div><div class="th-name">合璧 Jade 主题</div><div class="th-sub">壁纸 + 主题色 ${HB.state.settings.accent} + 字体 ${HB.state.settings.fontLabel}</div>
        <button class="hb-btn primary" id="st-themesave">保存主题</button></div></div>`) +
      card("主题设置", row("桌面图标显示", "计算机 / 回收站 / 网络", { html: `<button class="hb-btn" id="st-icons">更改桌面图标</button>` }) +
        row("鼠标光标方案", "合璧 Jade 光标", { wide: true, html: `<select class="hb-input" id="st-cs2"><option value="jade">合璧 Jade（默认）</option><option value="classic">HeBi 经典</option><option value="hc">大号高对比度</option></select>` }));
    $("#st-themesave", m).onclick = () => HB.toast("主题", "主题「合璧 Jade」已保存到 共享/主题（演示）", "settings");
    $("#st-icons", m).onclick = () => HB.toast("主题", "桌面图标设置：计算机、用户文件、网络、回收站、控制面板（演示）", "settings");
    const cs2 = $("#st-cs2", m); cs2.value = HB.state.settings.cursorScheme || "jade";
    cs2.onchange = () => { HB.state.settings.cursorScheme = cs2.value; HB.save(); HB.toast("主题", "光标方案已切换为 " + cs2.selectedOptions[0].textContent, "settings"); };
  });
  sub("personal", "start", "开始", "🚀", (win, m) => {
    m.innerHTML = hdr("个性化 - 开始", "开始菜单布局") +
      card("开始菜单布局", row("全屏开始", "使用全屏开始菜单（平板习惯）", tglOn("startFull")) +
        row("显示最近添加的应用", "", tglOn("startRecent")) +
        row("显示最常用的应用", "", tglOn("startFrequent"))) +
      card("磁贴", `<div class="st-live-tiles" id="st-tiles">
        ${[["office", "📝", "办公"], ["voice", "🎙️", "语音"], ["files", "📁", "文件"], ["store", "🛍️", "商店"], ["weather", "🌤️", "天气"], ["news", "📰", "资讯"]].map(([k, i, n]) =>
          `<div class="live-tile" data-t="${k}"><span>${i}</span>${n}</div>`).join("")}
      </div><div class="st-note">点击磁贴可从开始菜单固定/取消固定（演示）</div>`);
    bindToggle(m, "tg-startFull", "startFull", (v) => HB.toast("开始", v ? "全屏开始已开启" : "全屏开始已关闭", "settings"));
    bindToggle(m, "tg-startRecent", "startRecent");
    bindToggle(m, "tg-startFrequent", "startFrequent");
    m.querySelectorAll(".live-tile").forEach((t) => (t.onclick = () => { t.classList.toggle("pinned"); HB.toast("开始", (t.classList.contains("pinned") ? "已固定到开始：" : "已取消固定：") + t.textContent.trim(), "settings"); }));
  });
  sub("personal", "taskbar", "任务栏", "📊", (win, m) => {
    m.innerHTML = hdr("个性化 - 任务栏", "任务栏行为与系统托盘") +
      card("任务栏", row("锁定任务栏", "禁止调整任务栏位置与大小", tglOn("lockTaskbar")) +
        row("在任务栏按钮上显示角标", "", tglOn("showSearchBox"))) +
      card("任务栏在屏幕上的位置", row("对齐方式", "居中或左对齐", sel("st-ta", "taskbarAlign", [["center", "居中"], ["left", "左对齐"]])) +
        row("自动隐藏任务栏", "鼠标离开时收起", tglOn("taskbarAutoHide")) +
        row("使用深色任务栏", "", tglOn("darkTaskbar")) +
        row("在任务栏上显示时钟秒", "", tglOn("showSeconds"))) +
      card("通知区域", row("显示系统托盘图标", "网络、音量、电源", tglOn("showTrayIcons")) +
        row("打开或关闭系统图标", "", { html: `<button class="hb-btn" id="st-tray">选择系统图标</button>` }));
    bindSelect(m, "st-ta", "taskbarAlign");
    bindToggle(m, "tg-taskbarAutoHide", "taskbarAutoHide", (v) => HB.toast("任务栏", v ? "自动隐藏已开启" : "自动隐藏已关闭", "settings"));
    bindToggle(m, "tg-darkTaskbar", "darkTaskbar");
    bindToggle(m, "tg-showSeconds", "showSeconds", (v) => HB.toast("任务栏", v ? "时钟将显示秒" : "时钟已隐藏秒针", "settings"));
    bindToggle(m, "tg-showSearchBox", "showSearchBox", (v) => HB.toast("任务栏", v ? "任务栏搜索框已显示" : "任务栏搜索框已隐藏", "settings"));
    bindToggle(m, "tg-lockTaskbar", "lockTaskbar", (v) => {
      HB.toast("任务栏", v ? "任务栏已锁定" : "任务栏已解除锁定", "settings");
      ["st-ta", "tg-taskbarAutoHide", "tg-darkTaskbar"].forEach((id) => { const e = $("#" + id, m); if (e) e.disabled = v; });
    });
    if (HB.state.settings.lockTaskbar) ["st-ta", "tg-taskbarAutoHide", "tg-darkTaskbar"].forEach((id) => { const e = $("#" + id, m); if (e) e.disabled = true; });
    bindToggle(m, "tg-showTrayIcons", "showTrayIcons", (v) => HB.toast("任务栏", v ? "系统托盘图标已显示" : "系统托盘图标已隐藏", "settings"));
    $("#st-tray", m).onclick = () => HB.toast("任务栏", "系统图标：网络、音量、电源、操作中心（演示）", "settings");
  });

  /* ============================================================
     六、应用
     ============================================================ */
  sub("apps", "features", "应用和功能", "📦", (win, m) => {
    const apps = [
      ["📝", "办公助手 · 璧儿", "珠联璧合工作室", "18.6 MB"], ["🎙️", "语音助手 · 合合", "珠联璧合工作室", "12.4 MB"],
      ["📁", "文件管理器 · 璧见", "珠联璧合工作室", "6.2 MB"], ["🎵", "音乐播放器 · 聆璧", "珠联璧合工作室", "9.8 MB"],
      ["⌨️", "终端 · 璧行", "珠联璧合工作室", "2.1 MB"], ["🔧", "驱动管理器", "珠联璧合工作室", "4.5 MB"],
      ["💠", "徽标设计器", "珠联璧合工作室", "3.3 MB"], ["🛡️", "系统备份工具", "珠联璧合工作室", "8.7 MB"],
    ];
    m.innerHTML = hdr("应用 - 应用和功能", "已安装应用管理与可选功能") +
      card("应用和功能", row("排序与筛选", "按大小 / 名称 / 安装日期", { wide: true, html: `<select class="hb-input" style="width:150px"><option>按大小</option><option>按名称</option><option>按安装日期</option></select>` }) +
        `<div class="st-app-list" id="st-apps">${apps.map(([i, n, d, s2]) =>
          `<div class="st-app-row"><span>${i}</span><div><div class="ap-name">${n}</div><div class="ap-desc">${d} · ${s2}</div></div><button class="hb-btn" data-mod="${n}">修改</button><button class="hb-btn danger" data-un="${n}">卸载</button></div>`).join("")}</div>`) +
      card("可选功能", `<div class="st-app-list">
        <div class="st-app-row"><span>🖨️</span><div><div class="ap-name">打印到 PDF</div><div class="ap-desc">虚拟打印组件 · 已安装</div></div></div>
        <div class="st-app-row"><span>🧮</span><div><div class="ap-name">HeBi 计算器</div><div class="ap-desc">标准/科学/程序员模式 · 已安装</div></div></div>
        <div class="st-app-row"><span>🌐</span><div><div class="ap-name">HeBi 浏览器</div><div class="ap-desc">内置组件 · 已安装</div></div><button class="hb-btn" data-open="browser">打开</button></div>
        <div class="st-app-row"><span>✉️</span><div><div class="ap-name">合璧邮件</div><div class="ap-desc">内置组件 · 已安装</div></div><button class="hb-btn" data-open="mail">打开</button></div>
      </div>`);
    m.querySelectorAll("[data-mod]").forEach((b) => (b.onclick = () => HB.toast("应用", "修改「" + b.dataset.mod + "」：更改/修复/卸载（演示）", "settings")));
    m.querySelectorAll("[data-un]").forEach((b) => (b.onclick = () => HB.toast("应用", "「" + b.dataset.un + "」为核心组件，不可卸载", "settings")));
    m.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => HB.openApp(b.dataset.open)));
  });
  sub("apps", "defaults", "默认应用", "⭐", (win, m) => {
    m.innerHTML = hdr("应用 - 默认应用", "按文件类型与协议设置默认程序") +
      card("默认应用", row("Web 浏览器", "", sel("st-db", "defaultBrowser", [["HeBi Browser", "HeBi Browser"], ["Chrome", "Chrome（Wine）"], ["Firefox", "Firefox"]])) +
        row("电子邮件", "", sel("st-dm", "defaultMail", [["合璧邮件", "合璧邮件"], ["Thunderbird", "Thunderbird"]])) +
        row("音乐播放器", "", sel("st-dmu", "defaultMusic", [["聆璧音乐", "聆璧音乐"], ["Spotify", "Spotify"]])) +
        row("照片查看器", "", sel("st-dp", "defaultPhoto", [["合璧相册", "合璧相册"], ["GIMP", "GIMP"]]))) +
      card("按文件类型设置默认应用", `<div class="st-app-list">
        ${[[".deb / .mdn", "hbpm 包管理器"], [".exe / .msi", "Wine 兼容层"], [".hdoc / .docx", "办公助手 璧儿"], [".png / .jpg", "合璧相册"], [".mp3 / .flac", "聆璧音乐"]].map(([t, a]) =>
          `<div class="st-app-row"><span>📄</span><div><div class="ap-name">${t}</div><div class="ap-desc">当前默认：${a}</div></div><button class="hb-btn" data-ft="${t}">更改</button></div>`).join("")}
      </div>`);
    ["st-db", "st-dm", "st-dmu", "st-dp"].forEach((id, i) => bindSelect(m, id, ["defaultBrowser", "defaultMail", "defaultMusic", "defaultPhoto"][i], (v) => HB.toast("默认应用", "已设为 " + v, "settings")));
    m.querySelectorAll("[data-ft]").forEach((b) => (b.onclick = () => HB.toast("默认应用", "为 " + b.dataset.ft + " 选择默认应用（演示）", "settings")));
  });
  sub("apps", "startup", "启动", "🚀", (win, m) => {
    m.innerHTML = hdr("应用 - 启动", "开机自启动管理") +
      card("启动应用", `<div class="st-dev-list">
        ${[["📝", "办公助手", "启动影响：高", true], ["🎙️", "语音助手", "启动影响：中", false], ["🛍️", "应用商店", "启动影响：低", true], ["📁", "文件管理器", "启动影响：低", false]].map(([i, n, d, on]) =>
          `<div class="st-dev-row"><span>${i}</span><div><div class="dev-name">${n}</div><div class="dev-st">${d}</div></div><button class="hb-btn ${on ? "" : "primary"}" data-su="${n}">${on ? "禁用" : "启用"}</button></div>`).join("")}
      </div>`);
    m.querySelectorAll("[data-su]").forEach((b) => (b.onclick = () => HB.toast("启动", (b.textContent === "禁用" ? "已禁用开机启动：" : "已启用开机启动：") + b.dataset.su, "settings")));
  });

  /* ============================================================
     七、账户
     ============================================================ */
  sub("accounts", "info", "账户信息", "👤", (win, m) => {
    const render = () => {
      const u = HB.curUser();
      m.innerHTML = hdr("账户 - 账户信息", "当前账户与 Microsoft 风格账户") +
        card("当前账户", `<div class="st-user-row"><span class="avatar" style="background:${u.color}">${u.avatar === "logo" ? HB.LOGO_SVG : ico("guest", 24)}</span>
          <div class="su-info"><div class="su-name">${u.name}</div><div class="su-role">${u.role} · ${HB.state.settings.accountsAddMail}</div></div>
          <button class="hb-btn" id="st-accmail">管理我的账户</button></div>`) +
        card("本机用户（${HB.state.users.length}）", HB.state.users.map((x) => `
          <div class="st-user-row">
            <span class="avatar" style="background:${x.color}">${x.avatar === "logo" ? HB.LOGO_SVG : ico("guest", 22)}</span>
            <div class="su-info"><div class="su-name">${x.name}${x.id === HB.state.currentUser ? ' <span style="color:var(--hb-accent);font-size:11px">· 当前登录</span>' : ""}</div>
              <div class="su-role">${x.role}${x.pwd ? " · 已设密码" : " · 无密码"}</div></div>
            <button class="hb-btn" data-act="switch" data-id="${x.id}" ${x.id === HB.state.currentUser ? "disabled" : ""}>切换</button>
            <button class="hb-btn" data-act="pwd" data-id="${x.id}">密码</button>
            <button class="hb-btn danger" data-act="del" data-id="${x.id}" ${x.id === "bier" || x.id === HB.state.currentUser ? "disabled" : ""}>删除</button>
          </div>`).join("")) +
        `<div style="margin-top:12px"><button class="hb-btn primary" id="st-adduser">＋ 添加其他用户</button></div>`;
      m.querySelectorAll("[data-act]").forEach((b) => (b.onclick = async () => {
        const id = b.dataset.id, uu = HB.state.users.find((x) => x.id === id);
        if (b.dataset.act === "switch") {
          HB.state.currentUser = id; HB.save(); HB.boot.logout();
          HB.toast("账户", "已切换到 " + uu.name + "，正在重新登录…", "guest");
        } else if (b.dataset.act === "pwd") {
          const p = await HB.prompt2("更改密码 - " + uu.name, "新密码（留空表示无密码）", uu.pwd || "");
          if (p !== null) { uu.pwd = p; HB.save(); render(); HB.toast("账户", uu.name + " 的密码已更新", "settings"); }
        } else if (b.dataset.act === "del") {
          if (await HB.dialog({ title: "删除用户", body: `确定删除用户「${uu.name}」？其个人文件将被移除。`, buttons: [{ label: "取消", value: false }, { label: "删除", value: true, danger: true }] })) {
            HB.state.users = HB.state.users.filter((x) => x.id !== id);
            HB.save(); render(); HB.toast("账户", "用户 " + uu.name + " 已删除", "settings");
          }
        }
      }));
      $("#st-adduser", m).onclick = async () => {
        const name = await HB.prompt2("添加用户", "用户名", "");
        if (!name) return;
        const role = await HB.dialog({ title: "账户类型", body: "选择新用户的权限级别", buttons: [{ label: "管理员", value: "管理员" }, { label: "标准用户", value: "标准用户", primary: true }] });
        if (!role) return;
        const id = "u" + Date.now().toString(36);
        HB.state.users.push({ id, name, role, pwd: "", color: ACCENTS[HB.state.users.length % ACCENTS.length], avatar: "logo" });
        HB.save(); render(); HB.toast("账户", "已创建用户 " + name + "（" + role + "）", "guest");
      };
      $("#st-accmail", m).onclick = () => HB.toast("账户", "合璧账户：已登录 " + u.name + " · 订阅：HeBi 5.0 LTS", "settings");
    };
    render();
  });
  sub("accounts", "email", "电子邮件和账户", "✉️", (win, m) => {
    m.innerHTML = hdr("账户 - 电子邮件和账户", "应用使用的账户") +
      card("电子邮件和账户", `<div class="st-dev-list">
        <div class="st-dev-row"><span>✉️</span><div><div class="dev-name">${HB.state.settings.accountsAddMail}</div><div class="dev-st">合璧账户 · 已同步</div></div><button class="hb-btn">管理</button></div>
      </div>`) +
      card("添加账户", row("从 Microsoft / 合璧账户添加", "", { html: `<button class="hb-btn primary" id="st-addacc">＋ 添加账户</button>` }) +
        row("同步你的设置", "主题、密码、语言跨设备同步", tglOn("accountSync")));
    bindToggle(m, "tg-accountSync", "accountSync", (v) => HB.toast("账户同步", v ? "设置同步已开启" : "设置同步已关闭", "settings"));
    $("#st-addacc", m).onclick = () => HB.toast("账户", "选择账户类型：合璧账户 / Exchange / IMAP（演示）", "settings");
  });
  sub("accounts", "signin", "登录选项", "🔑", (win, m) => {
    m.innerHTML = hdr("账户 - 登录选项", "登录方式与安全") +
      card("登录方式", `<div class="st-signin-list">
        ${[["🔑", "HeBi Hello PIN", "使用 PIN 登录（推荐）", true], ["👤", "密码", "经典密码方式", true], ["🔒", "安全密钥", "FIDO2 硬件密钥", false], ["🖼️", "图片密码", "手势登录", false]].map(([i, n, d, on]) =>
          `<div class="st-signin-row ${on ? "on" : ""}"><span>${i}</span><div><div class="dev-name">${n}</div><div class="dev-st">${d}</div></div><span class="sg-st">${on ? "✓ 可用" : "未设置"}</span></div>`).join("")}
      </div>`) +
      card("其他登录选项", row("需要登录", "唤醒设备时必须登录", tglOn("requireSignin")) +
        row("动态锁", "离开时自动锁定设备", tglOn("dynamicLock")) +
        row("隐私：防钓鱼", "输入密码时启用防钓鱼保护", tglOn("privacyPhishing")));
    bindToggle(m, "tg-dynamicLock", "dynamicLock");
    bindToggle(m, "tg-privacyPhishing", "privacyPhishing");
    bindToggle(m, "tg-requireSignin", "requireSignin", (v) => HB.toast("登录选项", v ? "唤醒设备时需要登录" : "唤醒设备时自动进入桌面（演示）", "settings"));
  });
  sub("accounts", "family", "家庭和其他成员", "👨‍👩‍👧", (win, m) => {
    m.innerHTML = hdr("账户 - 家庭和其他成员", "家庭组与共享设备") +
      card("家庭", `<div class="st-note">将家庭成员添加到合璧OS，共同管理屏幕使用时间与应用权限。</div>
        <div style="margin-top:10px"><button class="hb-btn primary" id="st-addfam">＋ 添加家庭成员</button></div>`) +
      card("其他成员", `<div class="st-dev-list"><div class="st-dev-row"><span>👤</span><div><div class="dev-name">暂无其他成员</div><div class="dev-st">此设备当前为个人使用</div></div></div></div>`);
    $("#st-addfam", m).onclick = () => HB.toast("家庭", "输入成员的合璧账户邮箱以邀请（演示）", "settings");
  });

  /* ============================================================
     八、时间和语言
     ============================================================ */
  sub("time", "datetime", "日期和时间", "🕐", (win, m) => {
    m.innerHTML = hdr("时间和语言 - 日期和时间", "时区、时钟格式") +
      card("自动设置", row("自动设置时间", "与合璧时间服务器同步", tglOn("timeAuto")) +
        row("自动设置时区", "根据位置自动调整", tglOn("autoRegion"))) +
      card("手动设置", row("时区", "北京 / 上海 / 香港", sel("st-tz", "timeZone", [["Asia/Shanghai", "(UTC+08:00) 北京，重庆，香港特别行政区，乌鲁木齐"], ["Asia/Tokyo", "(UTC+09:00) 大阪，札幌，东京"], ["UTC", "(UTC) 协调世界时"]])) +
        row("使用 24 小时制", "例如 16:00", tglOn("timeFormat24")) +
        row("每周第一天", "影响日历与周视图", tglOn("firstDayMonday"))) +
      card("当前时间", `<div class="st-clock-hero" id="st-clock"></div>`);
    bindToggle(m, "tg-timeAuto", "timeAuto");
    bindToggle(m, "tg-autoRegion", "autoRegion");
    bindSelect(m, "st-tz", "timeZone", (v) => HB.toast("时间", "时区已切换为 " + v, "settings"));
    bindToggle(m, "tg-timeFormat24", "timeFormat24");
    bindToggle(m, "tg-firstDayMonday", "firstDayMonday");
    const tick = () => { const c = $("#st-clock", m); if (!c) return; const d = new Date(); c.textContent = (HB.state.settings.timeFormat24 ? HB.pad(d.getHours()) : HB.pad(d.getHours() % 12 || 12)) + ":" + HB.pad(d.getMinutes()) + ":" + HB.pad(d.getSeconds()); setTimeout(tick, 1000); };
    tick();
  });
  sub("time", "region", "区域", "🌏", (win, m) => {
    m.innerHTML = hdr("时间和语言 - 区域", "区域格式与国家") +
      card("区域格式", row("国家或地区", "影响应用显示格式", sel("st-cn", "regionFormat", [["zh-CN", "中国"], ["zh-TW", "中国台湾"], ["zh-HK", "中国香港"], ["en-US", "美国"]])) +
        row("区域格式", "当前区域的数据格式", { wide: true, html: `<select class="hb-input" id="st-rf2"><option value="zh-CN">中文（简体，中国）</option><option value="zh-TW">中文（繁體，中國臺灣）</option><option value="zh-HK">中文（繁體，中國香港）</option><option value="en-US">English (United States)</option></select>` })) +
      card("货币与度量", `<div class="st-spec-grid">
        <span class="sp-k">货币</span><span class="sp-v">¥ 人民币 (CNY)</span>
        <span class="sp-k">首日</span><span class="sp-v">星期一</span>
        <span class="sp-k">短日期</span><span class="sp-v">2026/10/21</span>
        <span class="sp-k">长时间</span><span class="sp-v">18:21:59</span>
      </div>`);
    const rf2 = $("#st-rf2", m); rf2.value = HB.state.settings.regionFormat || "zh-CN";
    bindSelect(m, "st-cn", "regionFormat", (v) => { rf2.value = v; HB.toast("区域", "区域格式已切换（演示）", "settings"); });
    rf2.onchange = () => { HB.state.settings.regionFormat = rf2.value; HB.save(); const a = $("#st-cn", m); if (a) a.value = rf2.value; HB.toast("区域", "区域格式已切换（演示）", "settings"); };
  });
  sub("time", "language", "语言", "🔤", (win, m) => {
    m.innerHTML = hdr("时间和语言 - 语言", "显示语言与输入语言") +
      card("首选语言", `<div class="st-dev-list">
        <div class="st-dev-row"><span>🇨🇳</span><div><div class="dev-name">中文（简体，中国）</div><div class="dev-st">HeBi 显示语言 · 输入语言</div></div></div>
        <div class="st-dev-row"><span>🇺🇸</span><div><div class="dev-name">English (United States)</div><div class="dev-st">可作为显示语言</div></div><button class="hb-btn" id="st-lang-en">设为默认</button></div>
      </div>` + `<div style="margin-top:10px"><button class="hb-btn primary" id="st-langadd">＋ 添加语言</button></div>`) +
      card("键盘", row("键盘布局", "默认输入法", { wide: true, html: `<select class="hb-input" id="st-kb"><option value="pinyin">合璧拼音（默认）</option><option value="wubi">合璧五笔</option><option value="us">美式键盘 QWERTY</option></select>` }));
    $("#st-lang-en", m).onclick = () => HB.toast("语言", "切换显示语言需要重启后生效（演示）", "settings");
    $("#st-langadd", m).onclick = () => HB.toast("语言", "可从合璧软件源安装语言包：日本語 / 한국어 / Français（演示）", "settings");
    const kb = $("#st-kb", m); kb.value = HB.state.settings.keyboardLayout || "pinyin";
    kb.onchange = () => { HB.state.settings.keyboardLayout = kb.value; HB.save(); HB.toast("语言", "键盘布局已切换为 " + kb.selectedOptions[0].textContent, "settings"); };
  });

  /* ============================================================
     九、游戏
     ============================================================ */
  sub("gaming", "gamebar", "游戏栏", "🎮", (win, m) => {
    m.innerHTML = hdr("游戏 - Xbox 游戏栏", "录屏与快捷键") +
      card("游戏栏", row("使用游戏栏录制游戏剪辑", "Win+G 打开覆盖层", tglOn("gameBar")) +
        row("后台录制", "自动录制最近 30 秒", tglOn("gameDVR")) +
        row("录制帧率", "", sel("st-fps", "captureFps", [[30, "30 fps"], [60, "60 fps"], [120, "120 fps"]]))) +
      card("快捷键", `<div class="st-spec-grid">
        <span class="sp-k">打开游戏栏</span><span class="sp-v">Win + G</span>
        <span class="sp-k">录屏</span><span class="sp-v">Win + Alt + G</span>
        <span class="sp-k">截图</span><span class="sp-v">Win + Alt + PrtScn</span>
      </div>`);
    bindToggle(m, "tg-gameBar", "gameBar", (v) => HB.toast("游戏栏", v ? "游戏栏已开启（Win+G）" : "游戏栏已关闭", "settings"));
    bindToggle(m, "tg-gameDVR", "gameDVR");
    bindSelect(m, "st-fps", "captureFps");
  });
  sub("gaming", "gamemode", "游戏模式", "⚡", (win, m) => {
    m.innerHTML = hdr("游戏 - 游戏模式", "游戏性能优化") +
      card("游戏模式", row("使用游戏模式", "优先保障前台游戏的系统资源", tglOn("gameMode")) +
        `<div class="st-note">开启后，HeBi 将阻止后台应用更新与通知，减少游戏卡顿。</div>`);
    bindToggle(m, "tg-gameMode", "gameMode", (v) => HB.toast("游戏模式", v ? "已开启：游戏将获得资源优先权" : "已关闭", "settings"));
  });

  /* ============================================================
     十、轻松使用
     ============================================================ */
  sub("ease", "display", "显示（辅助）", "🔎", (win, m) => {
    m.innerHTML = hdr("轻松使用 - 显示", "放大、对比度与文本大小") +
      card("放大", row("放大镜", "屏幕局部放大（Win++）", tglOn("magnifier")) +
        row("放大级别", "", rng("st-mag", "highContrast", 100, 400, 25))) +
      card("对比度", row("高对比度", "增强文本与边框对比", tglOn("highContrast")) +
        row("筛选器颜色", "色盲友好调色板", tglOn("colorFilter"))) +
      card("文本大小", row("全局字号缩放", "", rng("st-fs2", "fontSize", 80, 150)));
    bindToggle(m, "tg-magnifier", "magnifier", (v) => HB.toast("放大镜", v ? "放大镜已开启：Win++ 唤出" : "放大镜已关闭", "settings"));
    bindToggle(m, "tg-highContrast", "highContrast", (v) => HB.toast("高对比度", v ? "已开启高对比度主题" : "已恢复标准主题", "settings"));
    bindToggle(m, "tg-colorFilter", "colorFilter", (v) => HB.toast("轻松使用", v ? "颜色筛选器已开启：红绿色盲友好" : "颜色筛选器已关闭", "settings"));
    bindRange(m, "st-fs2", "fontSize");
  });
  sub("ease", "pointer", "鼠标指针和交互", "👆", (win, m) => {
    m.innerHTML = hdr("轻松使用 - 鼠标指针", "指针样式与触控") +
      card("指针", row("指针颜色", "白色 / 黑色 / 反转 / 金色", sel("st-pc", "cursorSize", [[1, "标准白色"], [2, "大号黑色"], [3, "反转高对比度"]])) +
        row("指针动画", "拖动时显示拖尾", tglOn("cursorTrail"))) +
      card("触控", row("按住后拖动", "双击并按住拖动", tglOn("dragAfterHold")));
    bindSelect(m, "st-pc", "cursorSize");
    bindToggle(m, "tg-cursorTrail", "cursorTrail", (v) => HB.toast("鼠标指针", v ? "指针拖尾动画已开启" : "指针拖尾动画已关闭", "settings"));
    bindToggle(m, "tg-dragAfterHold", "dragAfterHold", (v) => HB.toast("触控", v ? "按住后拖动已开启" : "按住后拖动已关闭", "settings"));
  });
  sub("ease", "keyboard", "键盘", "⌨️", (win, m) => {
    m.innerHTML = hdr("轻松使用 - 键盘", "屏幕键盘与粘滞键") +
      card("屏幕键盘", row("使用屏幕键盘", "无需物理键盘输入文本", tglOn("onScreenKeyboard")) +
        row("在输入框获得焦点时弹出", "", tglOn("numlock"))) +
      card("粘滞键", row("允许使用粘滞键", "连续按 5 次 Shift 启用", tglOn("stickyKeys")) +
        row("切换键提示音", "", tglOn("capsWarn")));
    bindToggle(m, "tg-onScreenKeyboard", "onScreenKeyboard", (v) => HB.toast("屏幕键盘", v ? "屏幕键盘已开启" : "屏幕键盘已关闭", "settings"));
    bindToggle(m, "tg-stickyKeys", "stickyKeys");
    bindToggle(m, "tg-capsWarn", "capsWarn");
  });
  sub("ease", "audio", "音频（辅助）", "🎧", (win, m) => {
    m.innerHTML = hdr("轻松使用 - 音频", "单声道与视觉通知") +
      card("音频", row("单声道音频", "合并左右声道输出", tglOn("soundNotifications")) +
        row("视觉通知", "用屏幕闪烁替代提示音", tglOn("appNotifications"))) +
      card("字幕", row("实时字幕", "自动为音频生成字幕", tglOn("liveCaptions")));
    bindToggle(m, "tg-soundNotifications", "soundNotifications");
    bindToggle(m, "tg-appNotifications", "appNotifications");
    bindToggle(m, "tg-liveCaptions", "liveCaptions", (v) => HB.toast("字幕", v ? "实时字幕已开启：音频播放时显示字幕条" : "实时字幕已关闭", "settings"));
  });
  sub("ease", "narration", "讲述人", "🔈", (win, m) => {
    m.innerHTML = hdr("轻松使用 - 讲述人", "屏幕阅读器") +
      card("讲述人", row("启动讲述人", "朗读屏幕文本与控件（Ctrl+Win+Enter）", tglOn("narration")) +
        row("讲述人语速", "", rng("st-narr", "nightLightTemp", 1, 10))) +
      card("语音", row("选择语音", "合璧晓晓 - 中文女声", { wide: true, html: `<select class="hb-input" id="st-nv"><option value="xiaoxiao">合璧晓晓（中文女声）</option><option value="yunyang">合璧云扬（中文男声）</option><option value="aria">Microsoft Aria</option></select>` }));
    bindToggle(m, "tg-narration", "narration", (v) => HB.toast("讲述人", v ? "讲述人已开启" : "讲述人已关闭", "settings"));
    bindRange(m, "st-narr", "nightLightTemp");
    const nv = $("#st-nv", m); nv.value = HB.state.settings.narratorVoice || "xiaoxiao";
    nv.onchange = () => { HB.state.settings.narratorVoice = nv.value; HB.save(); HB.toast("讲述人", "语音已切换为 " + nv.selectedOptions[0].textContent, "settings"); };
  });

  /* ============================================================
     十一、隐私
     ============================================================ */
  sub("privacy", "general", "常规", "🛡️", (win, m) => {
    m.innerHTML = hdr("隐私 - 常规", "隐私选项与广告 ID") +
      card("隐私选项", row("允许应用使用广告 ID", "个性化推荐", tglOn("telemetry")) +
        row("网站本地访问", "本地网络内容发现", tglOn("localNetworkAccess"))) +
      card("诊断和反馈", row("诊断数据", "发送使用数据以改进合璧OS", sel("st-tel", "telemetry", [["off", "关闭"], ["basic", "基本"], ["full", "完整"]])) +
        row("反馈频率", "", { wide: true, html: `<select class="hb-input" id="st-fb"><option value="auto">自动（推荐）</option><option value="ask">每次询问</option><option value="never">从不</option></select>` }));
    bindSelect(m, "st-tel", "telemetry", (v) => HB.toast("诊断", "诊断数据级别：" + { off: "关闭", basic: "基本", full: "完整" }[v], "settings"));
    bindToggle(m, "tg-localNetworkAccess", "localNetworkAccess", (v) => HB.toast("隐私", v ? "已允许网站本地访问" : "已禁止网站本地访问", "settings"));
    const fb = $("#st-fb", m); fb.value = HB.state.settings.feedbackFreq || "auto";
    fb.onchange = () => { HB.state.settings.feedbackFreq = fb.value; HB.save(); HB.toast("诊断", "反馈频率：" + fb.selectedOptions[0].textContent, "settings"); };
  });
  sub("privacy", "location", "位置", "📍", (win, m) => {
    m.innerHTML = hdr("隐私 - 位置", "定位服务与应用权限") +
      card("位置", row("允许应用访问你的位置", "", tglOn("location")) +
        row("定位服务历史", "清除历史位置记录", { html: `<button class="hb-btn" id="st-clrloc">清除</button>` })) +
      card("应用权限", `<div class="st-dev-list">
        ${[["🌤️", "天气", "精确位置 · 已允许"], ["🗺️", "合璧地图", "大致位置 · 已允许"], ["📷", "相机", "已拒绝"], ["🎵", "音乐", "已允许"]].map(([i, n, d]) =>
          `<div class="st-dev-row"><span>${i}</span><div><div class="dev-name">${n}</div><div class="dev-st">${d}</div></div><button class="hb-btn">更改</button></div>`).join("")}
      </div>`);
    bindToggle(m, "tg-location", "location", (v) => HB.toast("位置", v ? "定位服务已开启" : "定位服务已关闭", "settings"));
    $("#st-clrloc", m).onclick = () => HB.toast("位置", "已清除位置历史记录（演示）", "settings");
  });
  sub("privacy", "camera", "相机", "📷", (win, m) => {
    m.innerHTML = hdr("隐私 - 相机", "相机访问权限") +
      card("允许应用访问相机", row("合璧相机", "访问摄像头", tglOn("camera")) +
        `<div class="st-note">当前应用列表：办公助手（视频会议）、徽标设计器（拍照取色）</div>`);
    bindToggle(m, "tg-camera", "camera", (v) => HB.toast("相机", v ? "相机访问已允许" : "相机访问已关闭", "settings"));
  });
  sub("privacy", "mic", "麦克风", "🎤", (win, m) => {
    m.innerHTML = hdr("隐私 - 麦克风", "麦克风访问权限") +
      card("允许应用访问麦克风", row("语音助手 合合", "语音识别唤醒词", tglOn("mic")) +
        row("办公助手", "会议录音", tglOn("voiceAssistantMic"))) +
      card("权限历史", `<div class="st-note">最近 7 天：语音助手 12 次 · 办公助手 3 次 · 其他 0 次</div>`);
    bindToggle(m, "tg-mic", "mic", (v) => HB.toast("麦克风", v ? "麦克风访问已允许" : "麦克风访问已关闭", "settings"));
  });
  sub("privacy", "finddev", "查找我的设备", "📍", (win, m) => {
    m.innerHTML = hdr("隐私 - 查找我的设备", "设备丢失保护") +
      card("查找我的设备", row("定期发送设备位置", "丢失时可远程定位", tglOn("findDevice")) +
        `<div class="st-note">需要登录合璧账户后使用。</div>`);
    bindToggle(m, "tg-findDevice", "findDevice", (v) => HB.toast("查找设备", v ? "已开启设备定位上报" : "已关闭设备定位上报", "settings"));
  });

  /* ============================================================
     十二、更新和安全
     ============================================================ */
  sub("update", "windows", "HeBi 更新", "🔄", (win, m) => {
    m.innerHTML = hdr("更新和安全 - HeBi 更新", "系统更新与传递优化") +
      card("更新状态", `<div class="st-upd-hero">
          <div class="ud-st">✓ 你使用的是最新版本</div>
          <div class="ud-ver">合璧OS 5.0.0 LTS (Jade) · 内核 Linux 6.8.0-hebi · 最近检查：今天 18:00</div>
        </div>` +
        row("检查更新", "", { html: `<button class="hb-btn primary" id="st-chkupd">检查更新</button>` })) +
      card("更新选项", row("暂停更新", "最多暂停 35 天", tglOn("updatePause")) +
        row("活动时间", "避免在工作时段重启", tglOn("updateActiveHours")) +
        row("传递优化", "从局域网其他电脑下载更新", tglOn("deliveryOpt")));
    bindToggle(m, "tg-updatePause", "updatePause");
    bindToggle(m, "tg-updateActiveHours", "updateActiveHours");
    bindToggle(m, "tg-deliveryOpt", "deliveryOpt", (v) => HB.toast("传递优化", v ? "已开启：本地网络加速更新" : "已关闭", "settings"));
    $("#st-chkupd", m).onclick = function () { this.disabled = true; this.textContent = "正在检查…"; setTimeout(() => { this.disabled = false; this.textContent = "检查更新"; HB.toast("HeBi 更新", "已是最新版本 · 2026-10-19 累积更新", "settings"); }, 1400); };
  });
  sub("update", "backup", "备份", "💼", (win, m) => {
    m.innerHTML = hdr("更新和安全 - 备份", "系统映像与文件历史") +
      card("使用文件历史记录保存备份", row("自动备份文件", "将文件备份到外部驱动器或网络位置", tglOn("storageSense")) +
        `<div class="st-note">上次备份：2026/10/20 09:15 · 目标：HeBi Backup 卷（外置）</div>`) +
      card("备份选项", `<div class="st-links">
        <button class="st-link" id="st-bk1">📂 选择备份驱动器</button>
        <button class="st-link" id="st-bk2">⏪ 从当前备份还原文件</button>
        <button class="st-link" id="st-bk3">🖼️ 创建系统映像</button>
      </div>`);
    bindToggle(m, "tg-storageSense", "storageSense");
    $("#st-bk1", m).onclick = () => HB.toast("备份", "可用驱动器：HeBi Backup 128GB（外置）· 网络共享", "settings");
    $("#st-bk2", m).onclick = () => HB.toast("备份", "选择版本：2026/10/20 · 2026/10/19 · 2026/10/18（演示）", "settings");
    $("#st-bk3", m).onclick = () => HB.toast("备份", "系统映像将包含系统分区与引导配置（演示）", "settings");
  });
  sub("update", "recovery", "恢复", "⏪", (win, m) => {
    m.innerHTML = hdr("更新和安全 - 恢复", "重置此电脑与高级启动") +
      card("重置此电脑", row("重置电脑", "保留或删除个人文件，重新安装合璧OS", { html: `<button class="hb-btn primary" id="st-reset">开始</button>` })) +
      card("高级启动", row("立即重新启动", "从 U 盘/光盘/网络启动", { html: `<button class="hb-btn" id="st-advboot">立即重启</button>` }) +
        row("回退到上一版本", "返回上一个合璧OS 版本", { html: `<button class="hb-btn" id="st-rollback">回退</button>` }));
    $("#st-reset", m).onclick = () => HB.toast("恢复", "可选择「保留我的文件」或「删除所有内容」（演示）", "settings");
    $("#st-advboot", m).onclick = () => HB.toast("恢复", "将重启进入固件设置（UEFI/BIOS）界面", "settings");
    $("#st-rollback", m).onclick = async () => {
      if (await HB.dialog({ title: "回退到上一版本", body: "回退将保留个人文件，但部分已安装应用可能需要重新安装。确定继续吗？", buttons: [{ label: "取消", value: false }, { label: "回退", value: true, primary: true }] })) {
        HB.toast("恢复", "正在准备回退到上一版本…（演示）", "settings");
      }
    };
  });
  sub("update", "drivers", "驱动管理", "🔧", (win, m) => {
    m.innerHTML = hdr("更新和安全 - 驱动", "通用驱动安装与管理") +
      `<div style="font-size:12px;color:var(--hb-text-2);margin-bottom:10px">已安装 ${DRIVERS.filter((d) => d.state === "ok").length} 项 · 可安装 ${DRIVERS.filter((d) => d.state !== "ok").length} 项</div>` +
      `<div id="st-drvlist">${drvRows()}</div>` +
      `<div style="margin-top:12px;display:flex;gap:8px"><button class="hb-btn primary" id="st-scan">🔍 扫描硬件改动</button><button class="hb-btn" id="st-drvstore">打开驱动库</button></div>`;
    $("#st-drvstore", m).onclick = () => HB.openApp("store", "drivers");
    $("#st-scan", m).onclick = () => HB.toast("驱动", "扫描完成：发现 5 项已识别硬件，无新硬件", "settings");
    bindDrv(m);
  });
  const drvRows = () => DRIVERS.map((d) => `
    <div class="st-drv-row">
      <span class="drv-ico">${d.icon}</span>
      <div class="drv-info"><div class="drv-name">${d.name} <span style="font-weight:400;font-size:11px;color:var(--hb-text-2)">v${d.ver}</span></div>
      <div class="drv-desc">${d.desc}</div></div>
      <span style="font-size:11.5px;color:${d.state === "ok" ? "var(--hb-accent)" : "var(--hb-text-2)"}">${d.state === "ok" ? "✓ 运行中" : "未安装"}</span>
      <button class="hb-btn${d.state === "ok" ? "" : " primary"}" data-drv="${d.id}">${d.state === "ok" ? "卸载" : "安装"}</button>
    </div>`).join("");
  function bindDrv(m) {
    m.querySelectorAll("[data-drv]").forEach((b) => (b.onclick = () => {
      const d = DRIVERS.find((x) => x.id === b.dataset.drv);
      if (d.state === "ok") {
        d.state = "off"; HB.toast("驱动", d.name + " 已卸载", "settings");
        $("#st-drvlist", m).innerHTML = drvRows(); bindDrv(m);
      } else {
        b.disabled = true; b.textContent = "安装中…";
        setTimeout(() => {
          d.state = "ok"; d.ver = "1.0.0";
          $("#st-drvlist", m).innerHTML = drvRows(); bindDrv(m);
          HB.toast("驱动", d.name + " 安装完成（" + d.size + "）", "settings");
        }, 900);
      }
    }));
  }

  /* ============================================================
     十三、搜索
     ============================================================ */
  sub("search", "searchwin", "搜索 HeBi", "🔍", (win, m) => {
    m.innerHTML = hdr("搜索 - 搜索 HeBi", "搜索范围与索引") +
      card("查找我的内容", row("在云中搜索", "合璧账户云端内容", tglOn("searchCloud")) +
        row("安全搜索", "过滤成人内容", tglOn("searchSafe")) +
        row("历史记录", "保存此设备上的搜索历史", tglOn("searchHistory"))) +
      card("搜索范围", `<div class="st-dev-list">
        ${[["📁", "文件和文件夹", "已索引 2 341 项"], ["📧", "邮件", "合璧邮件索引"], ["⚙️", "设置", "全部设置项"], ["🌐", "网页", "必应 / 合璧搜索"]].map(([i, n, d]) =>
          `<div class="st-dev-row"><span>${i}</span><div><div class="dev-name">${n}</div><div class="dev-st">${d}</div></div><button class="hb-btn" data-sc="${n}">管理</button></div>`).join("")}
      </div>`);
    bindToggle(m, "tg-searchCloud", "searchCloud");
    bindToggle(m, "tg-searchSafe", "searchSafe");
    bindToggle(m, "tg-searchHistory", "searchHistory");
    m.querySelectorAll("[data-sc]").forEach((b) => (b.onclick = () => HB.toast("搜索", "管理搜索范围：" + b.dataset.sc + "（演示）", "settings")));
  });
  sub("search", "perm", "权限和历史记录", "📜", (win, m) => {
    m.innerHTML = hdr("搜索 - 权限和历史记录", "设备历史记录") +
      card("隐私", row("显示搜索历史记录", "任务栏搜索框显示历史", tglOn("searchHistory")) +
        row("清除此设备上的搜索历史", "", { html: `<button class="hb-btn danger" id="st-clrhis">清除</button>` })) +
      card("活动历史记录", `<div class="st-note">合璧OS 不会将你的活动发送到任何服务器，所有搜索索引仅保存在本机。</div>`);
    bindToggle(m, "tg-searchHistory", "searchHistory");
    $("#st-clrhis", m).onclick = () => HB.toast("搜索", "已清除此设备上的全部搜索历史", "settings");
  });
})();
