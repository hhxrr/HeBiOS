/* ============================================================
   语音助手 · 合合（Web Speech API + 命令解析）
   ============================================================ */
(function () {
  const HB = window.HeBi;
  const { $, el, ico } = HB;

  HB.registerApp({
    id: "voice", name: "语音助手", icon: "voice", w: 560, h: 620,
    open: openVoice,
  });

  const QUICK = ["打开应用商店", "播放音乐", "下一首", "换个壁纸", "切换深色模式", "现在几点", "打开设置", "系统信息"];
  const JOKES = [
    "为什么 Linux 用户不用电梯？因为他们习惯 sudo 升权限。",
    "程序员最浪漫的话：你是我 null 指针之外唯一的引用。",
    "璧儿问合合：今天更新了多少驱动？合合说：零，因为稳定压倒一切。",
    "有一只企鹅去酒吧，酒保问：喝点什么？企鹅说：来杯 kernel panic。",
  ];

  function openVoice(win) {
    win.body.innerHTML = `<div class="vc-app">
      <div class="vc-head"><div class="vc-orb"></div>
        <div><div class="vc-title">合合 · 语音助手</div><div class="vc-sub">合璧OS 内置 AI 助手 · 说“你好合合”唤醒</div></div>
        <div style="margin-left:auto;font-size:11px;opacity:.6" id="vc-st">就绪</div></div>
      <div class="vc-log" id="vc-log"></div>
      <div class="vc-quick">${QUICK.map((q) => `<button data-q="${q}">${q}</button>`).join("")}</div>
      <div class="vc-input">
        <input id="vc-in" placeholder="输入命令，或点击麦克风说话…" />
        <button id="vc-mic" title="语音输入">🎤</button>
        <button id="vc-send" title="发送">➤</button>
      </div>
    </div>`;
    const log = $("#vc-log", win.body);
    const say = (text, who) => {
      const d = el("div", "vc-msg " + who);
      d.innerHTML = text + (who === "bot" ? `<span class="vc-cmd">合璧OS · 本地推理</span>` : "");
      log.appendChild(d); log.scrollTop = log.scrollHeight;
      return d;
    };
    say("你好，我是<b>合合</b>，合璧OS 的语音助手。<br>我可以帮你打开应用、播放音乐、调整系统设置。点击下方快捷指令试试！", "bot");

    const exec = (text) => {
      const t = text.trim();
      if (!t) return;
      say(t, "user");
      handle(t, (r) => setTimeout(() => say(r, "bot"), 260));
    };
    $("#vc-send", win.body).onclick = () => { exec($("#vc-in", win.body).value); $("#vc-in", win.body).value = ""; };
    $("#vc-in", win.body).addEventListener("keydown", (e) => { if (e.key === "Enter") $("#vc-send", win.body).click(); });
    win.body.querySelectorAll("[data-q]").forEach((b) => (b.onclick = () => exec(b.dataset.q)));

    // 语音识别
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const mic = $("#vc-mic", win.body);
    if (SR) {
      const rec = new SR();
      rec.lang = "zh-CN"; rec.interimResults = false;
      let on = false;
      mic.onclick = () => {
        if (on) { rec.stop(); return; }
        try { rec.start(); on = true; mic.textContent = "⏹"; $("#vc-st", win.body).textContent = "聆听中…"; } catch (e) {}
      };
      rec.onresult = (e) => { const s = e.results[0][0].transcript; exec(s); };
      rec.onerror = (e) => { $("#vc-st", win.body).textContent = "识别失败：" + e.error; };
      rec.onend = () => { on = false; mic.textContent = "🎤"; $("#vc-st", win.body).textContent = "就绪"; };
    } else {
      mic.onclick = () => HB.toast("语音助手", "当前浏览器不支持语音识别，请用文字输入", "voice");
    }
  }

  /* ---------------- 命令解析 ---------------- */
  function handle(t, reply) {
    const cmd = t.replace(/[。！？!?]/g, "").replace(/你好合合|合璧|合合/, "").trim();
    // 打开应用
    const APP_WORDS = [
      ["应用商店|商店|store", "store"], ["设置|settings", "settings"], ["文件|文件夹|files", "files"],
      ["音乐|歌|music", "music"], ["终端|命令行|shell|terminal", "terminal"],
      ["办公|文档|office|word", "office"], ["记事本|notepad", "notepad"], ["计算器|calc", "calc"],
      ["关于|about", "about"],
    ];
    if (/打开|启动|运行|开一下/.test(cmd)) {
      for (const [re, id] of APP_WORDS) {
        if (new RegExp(re, "i").test(cmd)) {
          HB.openApp(id);
          return reply("好的，已为你打开「" + HB.apps[id].name + "」。");
        }
      }
    }
    // 音乐控制
    if (/播放|放首|来首|music|播放音乐/.test(cmd)) { HB.openApp("music"); return reply("正在打开音乐播放器并播放「珠玉浅吟」。"); }
    if (/下一首|换首|next/.test(cmd)) { HB.music && HB.music.next && HB.music.next(); return reply("已切换到下一首。"); }
    if (/上一首|prev/.test(cmd)) { HB.music && HB.music.prev && HB.music.prev(); return reply("已切换到上一首。"); }
    if (/暂停|停止播放/.test(cmd)) { HB.music && HB.music.pause && HB.music.pause(); return reply("音乐已暂停。"); }
    // 系统控制
    if (/深色|暗夜|夜间/.test(cmd)) { HB.state.settings.theme = "dark"; HB.save(); HB.applySettings(); return reply("已切换为深色模式，护眼从璧做起。"); }
    if (/浅色|白天|亮色/.test(cmd)) { HB.state.settings.theme = "light"; HB.save(); HB.applySettings(); return reply("已切换为浅色模式。"); }
    if (/壁纸|背景|桌面背景/.test(cmd)) {
      const keys = Object.keys(HB.wallpapers);
      const cur = keys.indexOf(HB.state.settings.wallpaper);
      HB.state.settings.wallpaper = keys[(cur + 1) % keys.length];
      HB.save(); HB.applySettings();
      return reply("壁纸已切换为「" + ({ jade: "玉璧青", aurora: "极光", ink: "水墨", bloom: "花青", deep: "深空" }[HB.state.settings.wallpaper]) + "」。");
    }
    if (/音量|大声|小声/.test(cmd)) {
      const s = HB.state.settings;
      if (/大|高/.test(cmd)) s.volume = Math.min(100, s.volume + 20);
      else s.volume = Math.max(0, s.volume - 20);
      HB.save();
      return reply("音量已调整为 " + s.volume + "%。");
    }
    if (/静音/.test(cmd)) { HB.state.settings.muted = true; HB.save(); return reply("已静音。"); }
    if (/几点|时间|报时/.test(cmd)) {
      const d = new Date();
      return reply("现在是 " + HB.fmtTime(d) + "，" + HB.fmtDate(d) + "。");
    }
    if (/日期|今天|几号/.test(cmd)) return reply("今天是 " + HB.fmtDate(new Date()) + "。");
    if (/锁屏|锁定/.test(cmd)) { HB.boot.lock(); return reply("已锁定屏幕，按任意键解锁。"); }
    // 信息类
    if (/系统信息|电脑|配置|关于/.test(cmd)) {
      return reply("合璧OS 5.0 LTS「Jade」<br>· 内核 Linux 6.8.0-hebi · 内存 2 GB<br>· 已装应用 " + HB.state.installed.length + " 个 · 显示 1024×768");
    }
    if (/笑话|讲个|开心/.test(cmd)) return reply(JOKES[Math.floor(Math.random() * JOKES.length)]);
    if (/帮助|你能|功能/.test(cmd)) return reply("我可以：打开应用、播放/切换音乐、切换深浅主题、更换壁纸、调节音量、报时报日期、锁屏、讲笑话、查看系统信息。");
    if (/搜索|搜一下/.test(cmd)) {
      const q = cmd.replace(/搜索|搜一下|一下/, "").trim();
      return reply("已为你记录搜索词「" + (q || "合璧OS") + "」（演示环境不联网，联网版将打开默认搜索引擎）。");
    }
    // 兜底
    return reply("我还不太明白「" + t + "」。试试说：打开应用商店、播放音乐、切换深色模式、换个壁纸、系统信息。");
  }
})();
