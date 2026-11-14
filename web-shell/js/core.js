/* ============================================================
   合璧OS HeBi OS 5.0 — Web 桌面内核
   窗口管理 / 任务栏 / 开始菜单 / 虚拟文件系统 / 通知 / 对话框
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, html) => {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  };
  const pad = (n) => String(n).padStart(2, "0");
  const fmtTime = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
  const fmtDate = (d) => d.getFullYear() + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());

  /* ---------------- 徽标 SVG ---------------- */
  const LOGO_SVG = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hbg1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2E7CF6"/><stop offset="1" stop-color="#22C3E6"/>
    </linearGradient>
    <linearGradient id="hbg2" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#1B4FBF"/><stop offset="1" stop-color="#22C3E6"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="230" fill="none" stroke="url(#hbg1)" stroke-width="26" opacity="0.95"/>
  <circle cx="256" cy="256" r="178" fill="none" stroke="url(#hbg2)" stroke-width="18" opacity="0.9"/>
  <circle cx="256" cy="256" r="104" fill="url(#hbg1)"/>
  <circle cx="256" cy="256" r="104" fill="none" stroke="#BFE8FF" stroke-width="6" opacity="0.55"/>
  <g stroke="#FFFFFF" stroke-width="13" stroke-linecap="round" opacity="0.96">
    <line x1="256" y1="196" x2="256" y2="316"/>
    <line x1="196" y1="256" x2="316" y2="256"/>
  </g>
  <g fill="#BFE8FF">
    <circle cx="256" cy="26" r="17"/><circle cx="486" cy="256" r="17"/>
    <circle cx="256" cy="486" r="17"/><circle cx="26" cy="256" r="17"/>
  </g>
</svg>`;

  /* ---------------- 应用图标（内联 SVG） ---------------- */
  const P = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" ${extra || ""}>${d}</svg>`;
  const ICONS = {
    logo: LOGO_SVG,
    files: P(`<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h9A1.5 1.5 0 0 1 21 9v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" fill="#FFC94D"/><path d="M3 9.5h18v8.7a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5z" fill="#FFD97A"/>`),
    music: P(`<path d="M9 17.5a2.75 2.75 0 1 1-2.5-2.74V6.2l11-2.2v11.04" stroke="#E35D6A" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.25" cy="17.75" r="2.75" fill="#E35D6A"/><circle cx="17.5" cy="15.04" r="2.75" fill="#E35D6A"/><path d="M9 6.2 20 4v2.3L9 8.5z" fill="#F28B9A"/>`),
    settings: P(`<circle cx="12" cy="12" r="3.1" stroke="#5B6470" stroke-width="1.9"/><path d="M19.4 13.6a7.6 7.6 0 0 0 0-3.2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.8-1.6L13.8 2.4h-3.6l-.5 2.5a7.6 7.6 0 0 0-2.8 1.6l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3.2l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.8 1.6l.5 2.5h3.6l.5-2.5a7.6 7.6 0 0 0 2.8-1.6l2.3 1 2-3.4z" stroke="#5B6470" stroke-width="1.5" stroke-linejoin="round"/>`),
    store: P(`<path d="M4.5 8h15l-1.2 11a1.6 1.6 0 0 1-1.6 1.4H7.3a1.6 1.6 0 0 1-1.6-1.4z" fill="#3D8BFD"/><path d="M8.6 10V6.8a3.4 3.4 0 0 1 6.8 0V10" stroke="#1F5FD0" stroke-width="1.9" fill="none" stroke-linecap="round"/><path d="M10.2 13.5h3.6M12 11.7v3.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`),
    office: P(`<path d="M6 3h8l4.5 4.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#fff" stroke="#2E7CF6" stroke-width="1.6"/><path d="M14 3v4.5h4.5" fill="#DCEBFE" stroke="#2E7CF6" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 12.5h8M8 15.5h8M8 18.5h5" stroke="#8FB8F5" stroke-width="1.7" stroke-linecap="round"/>`),
    voice: P(`<rect x="9.2" y="3.4" width="5.6" height="10.4" rx="2.8" fill="#22C3E6"/><path d="M6 11.6a6 6 0 0 0 12 0M12 17.6V21M9 21h6" stroke="#1490B8" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="12" cy="8.6" r="1.6" fill="#fff"/>`),
    terminal: P(`<rect x="2.6" y="4" width="18.8" height="16" rx="2" fill="#1B1B1B"/><path d="M6.4 9.2l3 2.8-3 2.8M11.6 14.8h5" stroke="#4EC9B0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`),
    notepad: P(`<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="#fff" stroke="#7A8699" stroke-width="1.5"/><path d="M8.5 8h7M8.5 11h7M8.5 14h4.5" stroke="#AAB4C2" stroke-width="1.6" stroke-linecap="round"/>`),
    calc: P(`<rect x="4" y="2.6" width="16" height="18.8" rx="2" fill="#fff" stroke="#5B6470" stroke-width="1.5"/><rect x="6.6" y="5" width="10.8" height="3.4" rx="1" fill="#2E7CF6"/><g fill="#8A94A3"><circle cx="8.6" cy="12" r="1.15"/><circle cx="12" cy="12" r="1.15"/><circle cx="15.4" cy="12" r="1.15"/><circle cx="8.6" cy="15.6" r="1.15"/><circle cx="12" cy="15.6" r="1.15"/><circle cx="15.4" cy="15.6" r="1.15"/><circle cx="8.6" cy="19" r="1.15"/><circle cx="12" cy="19" r="1.15"/></g><circle cx="15.4" cy="19" r="1.15" fill="#E35D6A"/>`),
    pc: P(`<rect x="2.6" y="4.4" width="18.8" height="12.6" rx="1.6" fill="#3A4657"/><rect x="4.4" y="6.2" width="15.2" height="9" rx="0.8" fill="#8FD4F5"/><path d="M9 20.4h6M12 17v3.4" stroke="#5B6470" stroke-width="1.8" stroke-linecap="round"/>`),
    recycle: P(`<path d="M6.2 7.6h11.6l-1 12a1.6 1.6 0 0 1-1.6 1.4H8.8a1.6 1.6 0 0 1-1.6-1.4z" fill="#9AA7B8"/><path d="M4.6 7.6h14.8M9.4 7.6V5.2h5.2v2.4M10 11v6M14 11v6" stroke="#6E7B8D" stroke-width="1.5" stroke-linecap="round"/>`),
    net: P(`<path d="M4.4 8.6a12 12 0 0 1 15.2 0M7 11.7a8.4 8.4 0 0 1 10 0M9.6 14.7a4.6 4.6 0 0 1 4.8 0" stroke="#2E7CF6" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="12" cy="17.8" r="1.7" fill="#2E7CF6"/>`),
    vol: P(`<path d="M4 9.6h3l4.4-3.8v12.4L7 14.4H4z" fill="#5B6470"/><path d="M15 9.2a4.4 4.4 0 0 1 0 5.6M17.4 6.8a8 8 0 0 1 0 10.4" stroke="#5B6470" stroke-width="1.7" fill="none" stroke-linecap="round"/>`),
    power: P(`<path d="M12 3.4v7.2" stroke="#5B6470" stroke-width="2" stroke-linecap="round"/><path d="M7.4 6.4a6.6 6.6 0 1 0 9.2 0" stroke="#5B6470" stroke-width="2" fill="none" stroke-linecap="round"/>`),
    user: P(`<circle cx="12" cy="8.2" r="3.8" fill="#2E7CF6"/><path d="M4.6 20a7.6 7.6 0 0 1 14.8 0" fill="#2E7CF6"/>`),
    guest: P(`<circle cx="12" cy="8.2" r="3.8" fill="#9AA7B8"/><path d="M4.6 20a7.6 7.6 0 0 1 14.8 0" fill="#9AA7B8"/>`),
    search: P(`<circle cx="11" cy="11" r="6.4" stroke="#8A94A3" stroke-width="1.9"/><path d="m20 20-3.8-3.8" stroke="#8A94A3" stroke-width="1.9" stroke-linecap="round"/>`),
    refresh: P(`<path d="M20 12a8 8 0 1 1-2.4-5.7M20 3.6V8h-4.4" stroke="#5B6470" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
    up: P(`<path d="M12 20V5M5.6 11.4 12 5l6.4 6.4" stroke="#5B6470" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
    newfolder: P(`<path d="M3.4 6.4A1.4 1.4 0 0 1 4.8 5h4l2 2.4h8.8A1.4 1.4 0 0 1 21 8.8v9A1.4 1.4 0 0 1 19.6 19H4.8a1.4 1.4 0 0 1-1.4-1.4z" fill="#FFC94D"/><path d="M11.6 13v4.4M9.4 15.2h4.4" stroke="#B98A1E" stroke-width="1.6" stroke-linecap="round"/>`),
    copy: P(`<rect x="8.4" y="3.4" width="12" height="14" rx="1.4" fill="#DCE3EC" stroke="#5B6470" stroke-width="1.4"/><path d="M15.6 20.6H6a1.4 1.4 0 0 1-1.4-1.4V7" stroke="#5B6470" stroke-width="1.5" fill="none" stroke-linecap="round"/>`),
    paste: P(`<rect x="5.6" y="3.4" width="12.8" height="17" rx="1.4" fill="#fff" stroke="#5B6470" stroke-width="1.4"/><path d="M9 3.4V2h6v3.4M9 11h6M9 14.4h6M9 17.8h4" stroke="#5B6470" stroke-width="1.4" stroke-linecap="round"/>`),
    del: P(`<path d="M4.6 7.2h14.8M9.4 7.2V5h5.2v2.2M6.4 7.2l.9 12.4a1.4 1.4 0 0 0 1.4 1.3h7a1.4 1.4 0 0 0 1.4-1.3l.9-12.4M10 10.6v6.6M14 10.6v6.6" stroke="#C0392B" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
    rename: P(`<path d="M4 20h16" stroke="#5B6470" stroke-width="1.6" stroke-linecap="round"/><path d="M4.4 16.2 14.8 5.8l3.4 3.4L7.8 19.6 4 20z" fill="#DCE3EC" stroke="#5B6470" stroke-width="1.4" stroke-linejoin="round"/>`),
    props: P(`<circle cx="12" cy="12" r="8.6" fill="#fff" stroke="#5B6470" stroke-width="1.5"/><path d="M12 10.6v6.4M12 7.4v.1" stroke="#E35D6A" stroke-width="2.1" stroke-linecap="round"/>`),
    view: P(`<path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12z" fill="#DCE3EC" stroke="#5B6470" stroke-width="1.4"/><circle cx="12" cy="12" r="2.8" fill="#fff" stroke="#5B6470" stroke-width="1.4"/>`),
    grid: P(`<rect x="3.6" y="3.6" width="7.4" height="7.4" rx="1" fill="#8FB8F5"/><rect x="13" y="3.6" width="7.4" height="7.4" rx="1" fill="#8FB8F5"/><rect x="3.6" y="13" width="7.4" height="7.4" rx="1" fill="#8FB8F5"/><rect x="13" y="13" width="7.4" height="7.4" rx="1" fill="#8FB8F5"/>`),
    list: P(`<path d="M8.6 6h12M8.6 12h12M8.6 18h12" stroke="#8FB8F5" stroke-width="2" stroke-linecap="round"/><circle cx="4.4" cy="6" r="1.2" fill="#8FB8F5"/><circle cx="4.4" cy="12" r="1.2" fill="#8FB8F5"/><circle cx="4.4" cy="18" r="1.2" fill="#8FB8F5"/>`),
    home: P(`<path d="M3.6 10.4 12 3.6l8.4 6.8v9a1.4 1.4 0 0 1-1.4 1.4H5a1.4 1.4 0 0 1-1.4-1.4z" fill="#8FB8F5"/><path d="M9.6 20.8v-6h4.8v6" fill="#fff" stroke="#5B6470" stroke-width="1.2"/>`),
    drive: P(`<rect x="3" y="6.4" width="18" height="11.2" rx="2" fill="#C7D2DE" stroke="#5B6470" stroke-width="1.4"/><circle cx="17" cy="12" r="1.3" fill="#4EC9B0"/><path d="M6 12h8" stroke="#8A94A3" stroke-width="1.4" stroke-linecap="round"/>`),
    doc: P(`<path d="M6 3h8l4.5 4.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#fff" stroke="#8A94A3" stroke-width="1.5"/><path d="M8.5 12.5h7M8.5 15.5h7M8.5 18h4" stroke="#C0C8D2" stroke-width="1.6" stroke-linecap="round"/>`),
    img: P(`<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2" fill="#BFE3C8" stroke="#3E9B5F" stroke-width="1.4"/><circle cx="8.8" cy="9.8" r="1.8" fill="#F5C542"/><path d="m4.4 17.4 4.6-4.4 3.4 3.2 3-2.8 4.2 4" stroke="#3E9B5F" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`),
    audio: P(`<path d="M9 17.5a2.75 2.75 0 1 1-2.5-2.74V6.2l11-2.2v11.04" stroke="#E35D6A" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.25" cy="17.75" r="2.75" fill="#E35D6A"/><circle cx="17.5" cy="15.04" r="2.75" fill="#E35D6A"/>`),
    moon: P(`<path d="M20 14.4A8.4 8.4 0 0 1 9.6 4 8.6 8.6 0 1 0 20 14.4z" fill="#8A94A3"/>`),
    sun: P(`<circle cx="12" cy="12" r="4.2" fill="#F5C542"/><g stroke="#F5C542" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4 7.2 7.2M16.8 16.8l1.8 1.8M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8"/></g>`),
    bell: P(`<path d="M12 3.4a5.6 5.6 0 0 1 5.6 5.6c0 4.4 1.8 6.2 2.4 6.8H4c.6-.6 2.4-2.4 2.4-6.8A5.6 5.6 0 0 1 12 3.4z" fill="#8A94A3"/><path d="M9.8 19.4a2.4 2.4 0 0 0 4.4 0" stroke="#8A94A3" stroke-width="1.6" fill="none" stroke-linecap="round"/>`),
    info: P(`<circle cx="12" cy="12" r="8.8" fill="#2E7CF6"/><path d="M12 10.6v6M12 7.4v.1" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/>`),
    cloud: P(`<path d="M7 18.4a4.4 4.4 0 0 1-.4-8.8 5.6 5.6 0 0 1 10.9-1 4.2 4.2 0 0 1 1.5 8.2z" fill="#C7D8F0" stroke="#5B87C9" stroke-width="1.3"/>`),
    shield: P(`<path d="M12 3 4.6 6v6c0 4.4 3.1 7.6 7.4 9 4.3-1.4 7.4-4.6 7.4-9V6z" fill="#8FB8F5" stroke="#3D6FB5" stroke-width="1.4"/>`),
    cpu: P(`<rect x="7" y="7" width="10" height="10" rx="1.4" fill="#DCE3EC" stroke="#5B6470" stroke-width="1.5"/><g stroke="#5B6470" stroke-width="1.6" stroke-linecap="round"><path d="M9.4 3.4v3.2M12 3.4v3.2M14.6 3.4v3.2M9.4 17.4v3.2M12 17.4v3.2M14.6 17.4v3.2M3.4 9.4h3.2M3.4 12h3.2M3.4 14.6h3.2M17.4 9.4h3.2M17.4 12h3.2M17.4 14.6h3.2"/></g>`),
    mail: P(`<rect x="2.6" y="5" width="18.8" height="14" rx="2" fill="#fff" stroke="#2E7CF6" stroke-width="1.6"/><path d="m3.6 6.8 8.4 6.3 8.4-6.3" stroke="#2E7CF6" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
    browser: P(`<circle cx="12" cy="12" r="8.8" fill="#DCEBFE" stroke="#2E7CF6" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="3.6" ry="8.8" fill="none" stroke="#2E7CF6" stroke-width="1.3"/><path d="M3.4 12h17.2" stroke="#2E7CF6" stroke-width="1.3"/><path d="M5 7.2c2 1.3 4.4 2 7 2s5-.7 7-2M5 16.8c2-1.3 4.4-2 7-2s5 .7 7 2" stroke="#2E7CF6" stroke-width="1.2" fill="none" stroke-linecap="round"/>`),
    install: P(`<path d="M12 2.2v6.4M9.3 5.5 12 8.2l2.7-2.7" stroke="#2E7CF6" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="10.2" width="18" height="10.6" rx="2" fill="#C7D2DE" stroke="#5B6470" stroke-width="1.4"/><path d="M6 15.5h8" stroke="#8A94A3" stroke-width="1.4" stroke-linecap="round"/><circle cx="17" cy="15.5" r="1.25" fill="#4EC9B0"/>`),
  };
  const ico = (name, size) => {
    const s = ICONS[name] || ICONS.doc;
    return s.replace("<svg ", `<svg width="${size || 20}" height="${size || 20}" `);
  };

  /* ============================================================
     状态与持久化
     ============================================================ */
  const LS_KEY = "hebios-web-state-v1";
  const defaults = () => ({
    users: [
      { id: "bier", name: "璧儿", role: "管理员", pwd: "", color: "#2E7CF6", avatar: "logo" },
      { id: "hehe", name: "合合", role: "标准用户", pwd: "hebi", color: "#22C3E6", avatar: "logo" },
      { id: "guest", name: "来宾", role: "Guest", pwd: "", color: "#9AA7B8", avatar: "guest" },
    ],
    settings: {
      theme: "light", accent: "#2E7CF6", wallpaper: "jade",
      font: '"Segoe UI", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
      fontLabel: "Segoe UI / 微软雅黑", fontSize: 100, cleartype: true,
      volume: 70, muted: false, darkTaskbar: true, showSeconds: false,
      // —— Windows 10 完整设置体系扩展字段 ——
      nightLight: false, nightLightTemp: 50,
      brightness: 100, resolutionScale: 100, orientation: "landscape",
      storageSense: true, storageAlert: true,
      taskbarAlign: "center", taskbarAutoHide: false, showTaskView: true, showSearchBox: true,
      startFull: false, startRecent: true, startFrequent: true,
      wifi: true, bt: false, airplane: false, hotspot: false,
      vpn: false, proxyAuto: true,
      mousePrimary: "left", mouseSpeed: 50, cursorSize: 1,
      keyboardRepeatDelay: 50, repeatRate: 50, capsWarn: true, numlock: false,
      printerDefault: "HeBi PDF Printer",
      appNotifications: true, soundNotifications: true, focusAssist: false,
      quietHours: false, nightSchedule: false,
      focusDuration: 25, focusBreak: 5,
      batterySaver: false, powerMode: "balanced", sleepAfter: 30, hibernateAfter: 90,
      gameBar: true, gameMode: true, gameDVR: false, captureFps: 60,
      highContrast: false, animations: true, transparency: true,
      narration: false, magnifier: false, onScreenKeyboard: false, stickyKeys: false,
      location: true, camera: true, mic: true, notifAccess: true,
      accountSync: true, findDevice: false, telemetry: "basic",
      dynamicLock: false, helloSignin: true, privacyPhishing: true,
      updateActiveHours: false, deliveryOpt: true, updatePause: false,
      autoPlay: true, usbSuspend: true,
      clipboardHistory: true, snapAssist: true, snapWindows: true, timeline: false,
      tabletsTaskbar: true,
      multiDesktop: true, titleBarsColor: true,
      windowsHelloPin: true,
      timeAuto: true, timeZone: "Asia/Shanghai", timeFormat24: true,
      autoRegion: true, regionFormat: "zh-CN", firstDayMonday: true,
      langZh: true, langEn: false,
      defaultBrowser: "HeBi Browser", defaultMail: "合璧邮件", defaultMusic: "聆璧音乐", defaultPhoto: "合璧相册",
      startupOffice: true, startupVoice: false, startupStore: true, startupFiles: false,
      accountsAddMail: "bier@hebios.cn",
      recentFilesClear: false,
      searchCloud: false, searchSafe: true, searchHistory: true,
      phoneLink: false,
      // —— 邮件 / 浏览器与设置补全（v3.2 全量接线） ——
      hdr: false,
      tabletRemember: true, printerAuto: true,
      proxyScript: false, proxyManual: false,
      proxyAddr: "http=10.0.2.2;https=10.0.2.2;port=8080", proxyExcept: "*.hebios.local;10.*",
      lockTaskbar: true, showTrayIcons: true, requireSignin: true,
      colorFilter: false, cursorTrail: true, dragAfterHold: false,
      liveCaptions: false, localNetworkAccess: false,
      micVolume: 82, wheelLines: 3, slideInterval: "10m",
      cursorScheme: "jade", keyboardLayout: "pinyin", narratorVoice: "xiaoxiao", feedbackFreq: "auto",
      soundOutput: "speaker", soundInput: "mic",
      iconSize: "mid", iconSort: "default",
    },
    installed: ["office", "voice", "files", "music", "terminal", "notepad", "calc", "settings", "store", "mail", "browser", "install"],
    currentUser: "bier",
  });
  let state = defaults();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      state = Object.assign(defaults(), p);
      state.settings = Object.assign(defaults().settings, p.settings || {});
    }
  } catch (e) {}
  const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} };
  const curUser = () => state.users.find((u) => u.id === state.currentUser) || state.users[0];

  /* ============================================================
     虚拟文件系统
     ============================================================ */
  const vfsDefaults = () => ({
    type: "dir", children: {
      home: { type: "dir", children: {
        bier: { type: "dir", children: {
          "桌面": { type: "dir", children: {
            "欢迎使用合璧OS.txt": file(`欢迎使用 合璧OS HeBi OS 5.0 LTS「Jade」\n\n—— 珠联璧合：融 Linux 内核，承 Windows 体验 ——\n\n快速上手：\n  1. 点击左下角开始按钮，或按 Win 键\n  2. 双击桌面图标打开应用\n  3. 右键桌面 / 文件可呼出上下文菜单\n  4. 打开「应用商店」体验 .deb / .mdn 安装\n  5. 对语音助手说「打开文件管理器」试试\n\n内置应用：办公助手、语音助手、文件管理器、音乐、\n终端、记事本、计算器、设置、应用商店。\n`),
            "待办清单.txt": file(`[ ] 体验开机动画与登录界面\n[x] 安装 .mdn 离线安装包\n[ ] 在设置里更换壁纸与主题\n[ ] 添加一个多用户账户\n`),
          }},
          "文档": { type: "dir", children: {
            "季度报告.hdoc": file(`<h1>季度工作报告</h1><p>本季度合璧OS完成了 Web 桌面的核心开发：窗口管理、任务栏、开始菜单、文件管理器、音乐播放器、设置中心与应用商店。</p><h2>下阶段计划</h2><ul><li>完善多用户切换</li><li>接入真实应用商店后台</li><li>驱动自动检测</li></ul>`, "hdoc"),
            "读书笔记.txt": file(`《珠联璧合》\n\nLinux 的开放 + Windows 的体验，\n二者并非取舍，而是合璧。\n`),
          }},
          "下载": { type: "dir", children: {
            "HeBiOS-3.0-amd64.iso": file("[ISO 镜像 92MB] 系统安装介质", "bin", 92 * 1024 * 1024),
            "hebi-office_3.0_amd64.mdn": file("[安装包] 办公助手 .mdn 离线安装包", "mdn", 24 * 1024 * 1024),
            "hebi-voice_3.0_amd64.mdn": file("[安装包] 语音助手 .mdn 离线安装包", "mdn", 18 * 1024 * 1024),
            "sample.mp3": file("[音频] 示例音频", "mp3", 4 * 1024 * 1024),
          }},
          "图片": { type: "dir", children: {} },
          "音乐": { type: "dir", children: {} },
          "视频": { type: "dir", children: {} },
        }},
      }},
      etc: { type: "dir", children: {
        "os-release": file(`PRETTY_NAME="HeBi OS 5.0 LTS (Jade)"\nNAME="HeBi OS"\nVERSION="5.0 LTS"\nVERSION_CODENAME=jade\nID=hebios\nID_LIKE="ubuntu debian windows"\nHOME_URL="https://hebios.local"\n`),
        "hostname": file("hebios\n"),
      }},
      usr: { type: "dir", children: {
        "share": { type: "dir", children: { "wallpapers": { type: "dir", children: {} } } },
        "bin": { type: "dir", children: {
          "hbpm": file("#!/bin/sh\n# 合璧OS 包管理器\n# 支持 .deb / .mdn / .exe / .msi\n"),
          "fbsplash": file("[二进制] 帧缓冲开机动画播放器"),
        }},
      }},
    },
  });
  function file(content, kind, size) {
    return { type: "file", content: content || "", kind: kind || "txt", size: size != null ? size : (content || "").length, mtime: Date.now() };
  }
  let vfs = vfsDefaults();
  try {
    const raw = localStorage.getItem(LS_KEY + "-vfs");
    if (raw) vfs = JSON.parse(raw);
  } catch (e) {}
  const saveVfs = () => { try { localStorage.setItem(LS_KEY + "-vfs", JSON.stringify(vfs)); } catch (e) {} };

  const normPath = (p) => {
    const parts = [];
    p.split("/").forEach((s) => {
      if (!s || s === ".") return;
      if (s === "..") parts.pop();
      else parts.push(s);
    });
    return "/" + parts.join("/");
  };
  const vfsGet = (p) => {
    let node = vfs;
    for (const s of normPath(p).split("/").filter(Boolean)) {
      if (!node || node.type !== "dir" || !node.children[s]) return null;
      node = node.children[s];
    }
    return node;
  };
  const vfsParent = (p) => {
    const n = normPath(p);
    const i = n.lastIndexOf("/");
    return { dir: vfsGet(i <= 0 ? "/" : n.slice(0, i)), name: n.slice(i + 1) };
  };
  const vfsExists = (p) => !!vfsGet(p);
  const vfsList = (p) => {
    const n = vfsGet(p);
    if (!n || n.type !== "dir") return [];
    return Object.entries(n.children).map(([name, node]) => ({ name, node, path: normPath(p + "/" + name) }))
      .sort((a, b) => (a.node.type === b.node.type ? a.name.localeCompare(b.name, "zh") : a.node.type === "dir" ? -1 : 1));
  };
  const vfsMkdir = (p) => {
    const { dir, name } = vfsParent(p);
    if (!dir || dir.type !== "dir" || dir.children[name]) return false;
    dir.children[name] = { type: "dir", children: {} };
    saveVfs(); return true;
  };
  const vfsWrite = (p, content, kind) => {
    const { dir, name } = vfsParent(p);
    if (!dir || dir.type !== "dir") return false;
    const old = dir.children[name];
    dir.children[name] = file(content, kind || (old && old.kind) || "txt");
    saveVfs(); return true;
  };
  const vfsRm = (p) => {
    const { dir, name } = vfsParent(p);
    if (!dir || !dir.children[name]) return false;
    delete dir.children[name];
    saveVfs(); return true;
  };
  const vfsRename = (p, newName) => {
    const { dir, name } = vfsParent(p);
    if (!dir || !dir.children[name] || dir.children[newName]) return false;
    dir.children[newName] = dir.children[name];
    delete dir.children[name];
    saveVfs(); return true;
  };
  const vfsCopy = (src, dstDir) => {
    const s = vfsGet(src);
    const d = vfsGet(dstDir);
    if (!s || !d || d.type !== "dir") return false;
    let base = src.split("/").pop();
    let name = base, i = 1;
    while (d.children[name]) name = base + " (" + ++i + ")";
    d.children[name] = JSON.parse(JSON.stringify(s));
    saveVfs(); return true;
  };
  const vfsMove = (src, dstDir) => {
    if (vfsCopy(src, dstDir)) { vfsRm(src); return true; }
    return false;
  };
  const fmtSize = (n) => {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(1) + " MB";
  };

  /* ============================================================
     窗口管理器
     ============================================================ */
  const desktop = () => $("#hb-desktop");
  const wins = new Map(); // id -> {app, el, ...}
  let zTop = 10;
  let winSeq = 0;

  function openApp(appId, arg) {
    const app = HeBi.apps[appId];
    if (!app) return;
    const exist = [...wins.values()].find((w) => w.app.id === appId && !app.multi);
    if (exist) { focusWin(exist.id); if (arg && app.onArg) app.onArg(exist, arg); return exist; }
    winSeq++;
    const id = "win" + winSeq;
    const w = { id, app, min: false, max: false };
    const node = el("div", "hb-win");
    node.id = id;
    node.style.width = (app.w || 720) + "px";
    node.style.height = (app.h || 480) + "px";
    const off = (wins.size % 8) * 26;
    node.style.left = Math.max(8, (desktop().clientWidth - (app.w || 720)) / 2 - 60 + off) + "px";
    node.style.top = Math.max(8, (desktop().clientHeight - (app.h || 480)) / 2 - 40 + off) + "px";
    node.style.zIndex = ++zTop;
    node.innerHTML = `
      <div class="hb-titlebar">
        <span class="t-ico">${ico(app.icon, 17)}</span>
        <span class="t-txt">${app.name}</span>
        <span class="t-btns">
          <button class="t-min" title="最小化">—</button>
          <button class="t-max" title="最大化">▢</button>
          <button class="t-close" title="关闭">✕</button>
        </span>
      </div>
      <div class="hb-win-body"></div>
      ${["e", "w", "s", "n", "se", "sw", "ne", "nw"].map((d) => `<div class="hb-resize ${d}" data-d="${d}"></div>`).join("")}`;
    desktop().appendChild(node);
    w.el = node;
    w.body = $(".hb-win-body", node);
    wins.set(id, w);
    // 标题栏按钮
    $(".t-min", node).onclick = (e) => { e.stopPropagation(); minimizeWin(id); };
    $(".t-max", node).onclick = (e) => { e.stopPropagation(); toggleMax(id); };
    $(".t-close", node).onclick = (e) => { e.stopPropagation(); closeWin(id); };
    // 焦点
    node.addEventListener("pointerdown", () => focusWin(id), true);
    // 拖动
    const bar = $(".hb-titlebar", node);
    bar.addEventListener("dblclick", (e) => { if (!e.target.closest(".t-btns")) toggleMax(id); });
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".t-btns") || e.button !== 0) return;
      const sx = e.clientX, sy = e.clientY;
      const r = node.getBoundingClientRect();
      const ox = r.left, oy = r.top;
      const wasMax = w.max;
      const dr = desktop().getBoundingClientRect();
      let snapGhost = null;
      const move = (ev) => {
        let nx = ox + ev.clientX - sx, ny = oy + ev.clientY - sy;
        if (wasMax && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 10) { restoreWin(id); nx = ev.clientX - r.width / 2; ny = ev.clientY - dr.top - 19; }
        if (wasMax && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) <= 10) return;
        ny = Math.max(dr.top, Math.min(ny, dr.bottom - 60));
        nx = Math.max(dr.left - r.width + 120, Math.min(nx, dr.right - 120));
        node.style.left = nx + "px";
        node.style.top = ny + "px";
        // 边缘吸附预览
        let zone = null;
        if (ev.clientY <= dr.top + 2) zone = "top";
        else if (ev.clientX <= dr.left + 2) zone = "left";
        else if (ev.clientX >= dr.right - 2) zone = "right";
        if (zone) {
          if (!snapGhost) { snapGhost = el("div", "hb-snap-ghost"); desktop().appendChild(snapGhost); }
          const g = snapGhost.style;
          if (zone === "top") { g.left = "0px"; g.top = "0px"; g.width = "100%"; g.height = "100%"; }
          else { g.top = "0px"; g.height = "100%"; g.width = "50%"; g.left = zone === "left" ? "0px" : "50%"; }
          snapGhost.style.display = "block";
        } else if (snapGhost) snapGhost.style.display = "none";
        node._snapZone = zone;
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        if (snapGhost) snapGhost.remove();
        if (node._snapZone) { applySnap(id, node._snapZone); node._snapZone = null; }
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });
    // 缩放
    $$(".hb-resize", node).forEach((h) => {
      h.addEventListener("pointerdown", (e) => {
        if (w.max) return;
        e.preventDefault(); e.stopPropagation();
        const d = h.dataset.d, sx = e.clientX, sy = e.clientY;
        const r = node.getBoundingClientRect();
        const mv = (ev) => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (d.includes("e")) node.style.width = Math.max(320, r.width + dx) + "px";
          if (d.includes("w")) { node.style.width = Math.max(320, r.width - dx) + "px"; node.style.left = r.left + dx + "px"; }
          if (d.includes("s")) node.style.height = Math.max(200, r.height + dy) + "px";
          if (d.includes("n")) { node.style.height = Math.max(200, r.height - dy) + "px"; node.style.top = r.top + dy + "px"; }
        };
        const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); };
        document.addEventListener("pointermove", mv);
        document.addEventListener("pointerup", up);
      });
    });
    // 挂载应用
    if (app.mount) app.mount(w.body, w, arg);
    if (app.open) app.open(w, arg);
    focusWin(id);
    renderTasks();
    if (app.onOpen) app.onOpen(w);
    if (app.onArg && arg) app.onArg(w, arg);
    return w;
  }
  function applySnap(id, zone) {
    const w = wins.get(id); if (!w) return;
    const dr = desktop().getBoundingClientRect();
    const n = w.el;
    if (zone === "top") { saveRect(w); n.style.left = "0px"; n.style.top = "0px"; n.style.width = dr.width + "px"; n.style.height = dr.height + "px"; w.max = true; }
    else { saveRect(w); n.style.top = "0px"; n.style.height = dr.height + "px"; n.style.width = dr.width / 2 + "px"; n.style.left = zone === "left" ? "0px" : dr.width / 2 + "px"; w.max = true; }
    n.classList.add("maxed");
  }
  function saveRect(w) {
    if (!w.prev) w.prev = { left: w.el.style.left, top: w.el.style.top, width: w.el.style.width, height: w.el.style.height };
  }
  function focusWin(id) {
    wins.forEach((w, k) => w.el.classList.toggle("inactive", k !== id));
    const w = wins.get(id);
    if (w) { w.el.style.zIndex = ++zTop; if (w.min) restoreWin(id); }
    renderTasks();
  }
  function minimizeWin(id) {
    const w = wins.get(id); if (!w) return;
    w.min = true;
    w.el.classList.add("minimizing");
    setTimeout(() => { w.el.style.display = "none"; w.el.classList.remove("minimizing"); }, 150);
    renderTasks();
    const next = [...wins.values()].filter((x) => !x.min).sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex))[0];
    if (next) focusWin(next.id);
  }
  function restoreWin(id) {
    const w = wins.get(id); if (!w) return;
    w.min = false;
    w.el.style.display = "flex";
    renderTasks();
  }
  function toggleMax(id) {
    const w = wins.get(id); if (!w) return;
    const dr = desktop().getBoundingClientRect();
    const n = w.el;
    if (w.max) {
      n.classList.remove("maxed");
      Object.assign(n.style, w.prev || {});
      w.max = false;
    } else {
      saveRect(w);
      n.classList.add("maxed");
      n.style.left = "0px"; n.style.top = "0px";
      n.style.width = dr.width + "px"; n.style.height = dr.height + "px";
      w.max = true;
    }
    focusWin(id);
  }
  function closeWin(id) {
    const w = wins.get(id); if (!w) return;
    if (w.app.onClose) { try { w.app.onClose(w); } catch (e) {} }
    w.el.classList.add("closing");
    setTimeout(() => { w.el.remove(); wins.delete(id); renderTasks(); }, 110);
    const next = [...wins.values()].filter((x) => x.id !== id && !x.min).sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex))[0];
    if (next) focusWin(next.id);
  }

  /* ============================================================
     任务栏 / 开始菜单 / 通知
     ============================================================ */
  function renderTasks() {
    const box = $("#tb-tasks");
    if (!box) return;
    box.innerHTML = "";
    wins.forEach((w) => {
      const b = el("button", "tb-task" + (w.app.id === HeBi.apps[HeBi.focusedAppId || ""]?.id ? "" : ""));
      b.dataset.win = w.id;
      if (!w.min && w.el.classList.contains("inactive") === false) b.classList.add("active");
      else if (!w.min) b.classList.add("running");
      b.innerHTML = ico(w.app.icon, 18) + `<span>${w.app.name}</span>`;
      b.onclick = () => {
        if (w.min) { focusWin(w.id); }
        else if (w.el.classList.contains("inactive")) { focusWin(w.id); }
        else minimizeWin(w.id);
      };
      box.appendChild(b);
    });
    // active 高亮
    const topId = [...wins.entries()].filter(([, w]) => !w.min).sort((a, b) => (+b[1].el.style.zIndex) - (+a[1].el.style.zIndex))[0];
    $$(".tb-task", box).forEach((b) => {
      b.classList.toggle("active", topId && b.dataset.win === topId[0]);
      b.classList.toggle("running", !(topId && b.dataset.win === topId[0]) && !wins.get(b.dataset.win)?.min);
    });
  }

  function toggleStart(show) {
    const s = $("#hb-start");
    const want = show != null ? show : !s.classList.contains("show");
    s.classList.toggle("show", want);
    $("#tb-start-btn").classList.toggle("open", want);
    if (want) { renderStart(); $("#start-search").focus(); }
  }
  function renderStart(filter) {
    const box = $("#start-apps");
    box.innerHTML = "";
    const kw = (filter || "").trim().toLowerCase();
    const all = Object.values(HeBi.apps).filter((a) => a.showInStart !== false && a.name !== "关于本机");
    const hit = kw ? all.filter((a) => a.name.toLowerCase().includes(kw) || (a.keywords || "").includes(kw)) : all;
    if (!hit.length) {
      box.innerHTML = `<div class="fm-empty">未找到与「${filter}」相关的应用</div>`;
      return;
    }
    const grid = el("div", "hb-start-grid");
    hit.forEach((a) => {
      const b = el("button", "hb-start-item");
      b.innerHTML = `${ico(a.icon, 30)}<span class="nm">${a.name}</span>`;
      b.onclick = () => { toggleStart(false); openApp(a.id); };
      grid.appendChild(b);
    });
    box.appendChild(grid);
    const foot = el("div", "hb-start-list");
    foot.style.marginTop = "10px";
    [["设置", "settings"], ["电源", null]].forEach(([t, id]) => {
      const r = el("button", "hb-start-row");
      r.innerHTML = `${ico(id === "settings" ? "settings" : "power", 20)}<span>${t}</span><span class="arr">›</span>`;
      r.onclick = () => { toggleStart(false); if (id) openApp(id); else HeBi.powerMenu(); };
      foot.appendChild(r);
    });
    box.appendChild(foot);
  }

  /* ---------------- 通知 / 操作中心 ---------------- */
  const notifications = [];
  function toast(title, msg, icon) {
    const box = $("#hb-toasts");
    const t = el("div", "hb-toast");
    t.innerHTML = `<div class="tt-ico">${ico(icon || "info", 30)}</div><div class="tt-body"><div class="tt-title">${title}</div><div class="tt-msg">${msg || ""}</div></div>`;
    box.appendChild(t);
    const rec = { el: t };
    notifications.push(rec);
    const kill = () => { t.classList.add("out"); setTimeout(() => { t.remove(); const i = notifications.indexOf(rec); if (i >= 0) notifications.splice(i, 1); renderAction(); }, 200); };
    t.onclick = kill;
    setTimeout(kill, 4200);
    renderAction();
  }
  function renderAction() {
    const list = $("#ac-notif-list");
    if (!list) return;
    list.innerHTML = "";
    if (!notifications.length) {
      list.innerHTML = `<div style="font-size:12px;color:var(--hb-text-2);padding:18px 0;text-align:center;">没有新通知</div>`;
      return;
    }
    notifications.slice().reverse().forEach((n) => list.appendChild(n.el.cloneNode(true)));
  }
  function toggleAction(show) {
    const a = $("#hb-action");
    const want = show != null ? show : !a.classList.contains("show");
    a.classList.toggle("show", want);
    if (want) renderAction();
  }

  /* ---------------- 右键菜单 / 对话框 ---------------- */
  function contextMenu(x, y, items) {
    $$(".hb-ctx").forEach((c) => c.remove());
    const m = el("div", "hb-ctx");
    items.forEach((it) => {
      if (it === "-") { m.appendChild(el("div", "sep")); return; }
      const b = el("button", "ci" + (it.disabled ? " disabled" : ""));
      b.innerHTML = `${it.icon ? `<span class="ci-ico">${ico(it.icon, 15)}</span>` : ""}<span>${it.label}</span>${it.key ? `<span class="cic">${it.key}</span>` : ""}`;
      b.onclick = () => { closeCtx(); it.onClick && it.onClick(); };
      m.appendChild(b);
    });
    document.body.appendChild(m);
    const r = m.getBoundingClientRect();
    m.style.left = Math.min(x, innerWidth - r.width - 8) + "px";
    m.style.top = Math.min(y, innerHeight - r.height - 8) + "px";
    setTimeout(() => document.addEventListener("pointerdown", closeCtxDoc, { once: true }), 0);
  }
  function closeCtx() { $$(".hb-ctx").forEach((c) => c.remove()); }
  function closeCtxDoc(e) { if (!e.target.closest(".hb-ctx")) closeCtx(); }

  function dialog(opts) {
    return new Promise((res) => {
      const mask = el("div", "hb-dlg-mask");
      const d = el("div", "hb-dlg");
      d.innerHTML = `
        <div class="d-head">${opts.title || "提示"}</div>
        <div class="d-body">${opts.body || ""}</div>
        <div class="d-foot"></div>`;
      const foot = $(".d-foot", d);
      (opts.buttons || [{ label: "确定", value: true, primary: true }]).forEach((b) => {
        const btn = el("button", "hb-btn" + (b.primary ? " primary" : "") + (b.danger ? " danger" : ""));
        btn.textContent = b.label;
        btn.onclick = () => { mask.remove(); res(b.value); };
        foot.appendChild(btn);
      });
      mask.appendChild(d);
      desktop().appendChild(mask);
      const inp = $("input", d);
      if (inp) { inp.focus(); inp.select(); }
      mask.addEventListener("pointerdown", (e) => { if (e.target === mask) { mask.remove(); res(null); } });
    });
  }
  function prompt2(title, label, def) {
    return dialog({
      title, body: `<div>${label}</div><input class="hb-input" value="${def || ""}">`,
      buttons: [{ label: "取消", value: null }, { label: "确定", value: true, primary: true }],
    }).then((v) => (v ? $(".hb-dlg input").value : null));
  }

  /* ---------------- 主题应用 ---------------- */
  function applySettings() {
    const s = state.settings;
    document.documentElement.classList.toggle("hb-dark", s.theme === "dark");
    document.documentElement.classList.toggle("hb-hc", s.highContrast);
    document.documentElement.style.setProperty("--hb-accent", s.accent);
    document.documentElement.style.setProperty("--hb-font", s.font);
    document.documentElement.style.setProperty("--hb-font-size", s.fontSize + "%");
    const wp = HeBi.wallpapers[s.wallpaper];
    $("#hb-wallpaper").style.backgroundImage = wp ? `url(${wp})` : "none";
    $("#hb-wallpaper").style.background = wp || "#0d2f5e";
    // 夜间光: 全屏暖色滤镜
    let nl = $("#hb-nightlight");
    if (!nl) { nl = el("div", "hb-nightlight"); nl.id = "hb-nightlight"; document.body.appendChild(nl); }
    nl.style.opacity = s.nightLight ? 0.3 + (s.nightLightTemp / 100) * 0.35 : 0;
    nl.style.display = s.nightLight ? "block" : "none";
    // 亮度
    const br = $("#hb-brightness") || (() => { const d = el("div", "hb-brightness"); d.id = "hb-brightness"; document.body.appendChild(d); return d; })();
    br.style.opacity = (100 - s.brightness) / 100 * 0.55;
    br.style.display = s.brightness < 100 ? "block" : "none";
    // 分辨率（根缩放，等同浏览器页面缩放）
    document.documentElement.style.zoom = (Math.max(50, Math.min(200, +s.resolutionScale || 100)) / 100).toString();
    // HDR / 颜色筛选器（色盲友好）
    document.documentElement.classList.toggle("hb-hdr", !!s.hdr);
    document.documentElement.classList.toggle("hb-colorfilter", !!s.colorFilter);
    // 系统托盘图标显隐
    const tray = $("#hb-taskbar .tb-tray");
    if (tray) tray.style.display = s.showTrayIcons === false ? "none" : "";
    // 任务栏对齐 / 自动隐藏 / 深色
    const tb = $("#hb-taskbar");
    if (tb) {
      tb.classList.toggle("align-left", s.taskbarAlign === "left");
      tb.classList.toggle("dark", s.darkTaskbar);
      tb.classList.toggle("auto-hide", s.taskbarAutoHide);
      tb.classList.toggle("locked", !!s.lockTaskbar);
    }
    // 窗口透明度与动画
    document.documentElement.classList.toggle("hb-no-transparency", !s.transparency);
    document.documentElement.classList.toggle("hb-no-anim", !s.animations);
    // 锁屏/开始菜单扩展
    if (HeBi.startExtra) HeBi.startExtra(s);
  }

  /* ============================================================
     导出内核
     ============================================================ */
  window.HeBi = {
    version: "5.0 LTS",
    codename: "Jade",
    $, $$, el, pad, fmtTime, fmtDate, ico, LOGO_SVG,
    state, save, curUser, defaults,
    vfs: { get: vfsGet, list: vfsList, mkdir: vfsMkdir, write: vfsWrite, rm: vfsRm, rename: vfsRename, copy: vfsCopy, move: vfsMove, exists: vfsExists, parent: vfsParent, file, fmtSize, save: saveVfs, normPath },
    apps: {},
    openApp, closeWin, focusWin, minimizeWin, toggleMax, renderTasks,
    contextMenu, dialog, prompt2, toast, toggleAction, toggleStart, renderStart,
    applySettings, save,
    power: null,
    boot: null,
  };
})();
