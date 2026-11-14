/* ============================================================
   合璧OS — 音乐播放器（Web Audio 实时合成，无需外部音频文件）
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, el, ico } = HeBi;

  /* ---------- 曲库（实时合成的程序音乐） ---------- */
  // 音名 → 频率（十二平均律）
  const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz
  const PENTA = [0, 3, 5, 7, 10]; // 小调五声
  const seq = (midiBase, steps, pattern) => pattern.map((s) => (s == null ? null : NOTE(midiBase + s)));
  const TRACKS = [
    {
      title: "珠玉浅吟", artist: "合璧音律 · 青玉", bpm: 72, wave: "sine", hues: ["#2E7CF6", "#22C3E6"],
      lead: seq(72, 32, [0, null, 3, null, 5, null, 3, null, 7, null, 5, null, 3, null, 0, null,
        10, null, 7, null, 5, null, 7, null, 3, null, 5, null, 3, null, 0, null]),
      bass: seq(48, 32, [0, null, null, null, 0, null, null, null, 5, null, null, null, 5, null, null, null,
        -2, null, null, null, -2, null, null, null, 3, null, null, null, 3, null, null, null]),
      drums: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0,
        1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    },
    {
      title: "璧合之夜", artist: "合璧音律 · 双环", bpm: 92, wave: "triangle", hues: ["#1B4FBF", "#7B5CFF"],
      lead: seq(69, 32, [0, 3, null, 5, 7, null, 5, 3, 0, null, null, 3, 5, null, 7, null,
        10, 7, null, 5, 3, null, 5, 7, 10, null, 7, 5, 3, null, 0, null]),
      bass: seq(45, 32, [0, null, 0, null, 3, null, 3, null, 5, null, 5, null, -2, null, -2, null,
        0, null, 0, null, 3, null, 3, null, 7, null, 7, null, 5, null, 5, null]),
      drums: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1,
        1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0],
    },
    {
      title: "青瓷流光", artist: "合璧音律 · 秘色", bpm: 108, wave: "square", hues: ["#0E9B50", "#22C3E6"],
      lead: seq(72, 32, [0, 0, 3, null, 5, 5, 7, null, 10, 10, 7, null, 5, 5, 3, null,
        0, 0, 3, null, 5, 5, 7, null, 12, 12, 10, null, 7, 7, 5, null]),
      bass: seq(48, 32, [0, 0, null, 0, 3, 3, null, 3, 5, 5, null, 5, 7, 7, null, 7,
        0, 0, null, 0, 3, 3, null, 3, 10, 10, null, 10, 7, 7, null, 7]),
      drums: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1,
        1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
    },
    {
      title: "云窗寄梦", artist: "合璧音律 · 云母", bpm: 84, wave: "sine", hues: ["#1497c9", "#BFE8FF"],
      lead: seq(74, 32, [0, null, null, null, 5, null, null, null, 7, null, null, null, 5, null, null, null,
        10, null, null, null, 7, null, null, null, 5, null, null, null, 3, null, null, null]),
      bass: seq(50, 32, [0, null, null, null, null, null, null, null, -4, null, null, null, null, null, null, null,
        2, null, null, null, null, null, null, null, -2, null, null, null, null, null, null, null]),
      drums: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
        0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0],
    },
    {
      title: "海上升月", artist: "合璧音律 · 沧澜", bpm: 120, wave: "sawtooth", hues: ["#0d2f5e", "#2E7CF6"],
      lead: seq(69, 32, [0, 3, 5, 7, 10, 7, 5, 3, 0, 3, 5, 7, 12, 10, 7, 5,
        10, 7, 5, 3, 5, 7, 10, 12, 10, 7, 5, 3, 0, null, 0, null]),
      bass: seq(45, 32, [0, null, null, null, 0, null, null, null, 0, null, null, null, 0, null, null, null,
        3, null, null, null, 3, null, null, null, 3, null, null, null, 3, null, null, null]),
      drums: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0],
    },
    {
      title: "竹露清响", artist: "合璧音律 · 斑竹", bpm: 66, wave: "triangle", hues: ["#1FB6A6", "#0E9B50"],
      lead: seq(76, 32, [7, null, 5, null, 3, null, null, null, 5, null, 3, null, 0, null, null, null,
        10, null, 7, null, 5, null, null, null, 7, null, 5, null, 3, null, null, null]),
      bass: seq(52, 32, [0, null, null, null, null, null, null, null, 5, null, null, null, null, null, null, null,
        3, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null]),
      drums: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
        0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    },
  ];
  const STEPS = 32;
  const durOf = (t) => (STEPS * 60) / t.bpm;

  /* ---------- 音频引擎 ---------- */
  const Engine = {
    ctx: null, master: null, analyser: null, freqData: null,
    track: null, idx: 0, playing: false, timer: 0, step: 0, nextT: 0, startT: 0, pauseT: 0,
    shuffle: false, repeat: false, onTick: null, onEnd: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        const s = HeBi.state.settings;
        this.master.gain.value = (s.muted ? 0 : s.volume / 100) * 0.5;
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
        this.master.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    applyVolume() {
      if (!this.master) return;
      const s = HeBi.state.settings;
      this.master.gain.setTargetAtTime(s.muted ? 0 : (s.volume / 100) * 0.5, this.ctx.currentTime, 0.05);
    },
    note(freq, when, dur, type, vol, detune) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      if (detune) o.detune.value = detune;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(vol, when + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(this.master);
      o.start(when); o.stop(when + dur + 0.05);
    },
    kick(when) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(150, when);
      o.frequency.exponentialRampToValueAtTime(45, when + 0.12);
      g.gain.setValueAtTime(0.5, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
      o.connect(g); g.connect(this.master);
      o.start(when); o.stop(when + 0.2);
    },
    hat(when, vol) {
      const len = 0.05, sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, sr * len, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const f = this.ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000;
      const g = this.ctx.createGain(); g.gain.value = vol || 0.12;
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(when);
    },
    schedule() {
      const t = this.track;
      const stepDur = 60 / t.bpm / 4; // 16分音符
      while (this.nextT < this.ctx.currentTime + 0.18) {
        const s = this.step % STEPS;
        if (t.lead[s] != null) this.note(t.lead[s], this.nextT, stepDur * 2.2, t.wave, 0.16, (Math.random() - 0.5) * 6);
        if (t.bass[s] != null) this.note(t.bass[s], this.nextT, stepDur * 3.4, "sine", 0.30);
        if (t.drums[s] === 1) { this.kick(this.nextT); if (s % 4 === 2) this.hat(this.nextT + stepDur / 2, 0.1); }
        else if (s % 2 === 0) this.hat(this.nextT, 0.045);
        // 点缀高音
        if (s % 8 === 6 && t.lead[s + 2] != null) this.note(t.lead[s + 2] * 2, this.nextT, stepDur * 1.4, t.wave, 0.05);
        this.step++;
        this.nextT += stepDur;
      }
    },
    play(idx) {
      this.ensure();
      this.stopTimer();
      this.idx = idx;
      this.track = TRACKS[idx];
      this.step = 0;
      this.nextT = this.ctx.currentTime + 0.06;
      this.startT = this.ctx.currentTime;
      this.playing = true;
      this.schedule();
      this.timer = setInterval(() => {
        if (!this.playing) return;
        this.schedule();
        if (this.onTick) this.onTick(this.position());
        if (this.position() >= durOf(this.track) - 0.05) {
          if (this.repeat) { this.step = 0; this.nextT = this.ctx.currentTime + 0.06; this.startT = this.ctx.currentTime; }
          else if (this.onEnd) this.onEnd();
        }
      }, 90);
    },
    pause() { this.stopTimer(); this.playing = false; if (this.ctx) this.ctx.suspend(); },
    resume() { this.ensure(); this.stopTimer(); this.playing = true; this.nextT = this.ctx.currentTime + 0.06; this.schedule(); this.timer = setInterval(() => { this.schedule(); if (this.onTick) this.onTick(this.position()); }, 90); },
    stopTimer() { if (this.timer) { clearInterval(this.timer); this.timer = 0; } },
    position() {
      if (!this.ctx || !this.playing) return this._pausedPos || 0;
      return Math.min(durOf(this.track), this.ctx.currentTime - this.startT);
    },
    next() { const n = this.shuffle ? Math.floor(Math.random() * TRACKS.length) : (this.idx + 1) % TRACKS.length; this.play(n); },
    prev() { this.play((this.idx - 1 + TRACKS.length) % TRACKS.length); },
  };

  /* ---------- 封面生成 ---------- */
  function cover(track, size) {
    const c = document.createElement("canvas");
    c.width = c.height = size || 300;
    const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, size, size);
    gr.addColorStop(0, track.hues[0]); gr.addColorStop(1, track.hues[1]);
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    // 圆环装饰
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = size * 0.02;
    for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(size * 0.5, size * 0.5, size * (0.12 * i), 0, Math.PI * 2); g.stroke(); }
    // 窗棂
    g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = size * 0.035; g.lineCap = "round";
    g.beginPath();
    g.moveTo(size * 0.5, size * 0.34); g.lineTo(size * 0.5, size * 0.66);
    g.moveTo(size * 0.34, size * 0.5); g.lineTo(size * 0.66, size * 0.5);
    g.stroke();
    // 音符点
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fillStyle = "rgba(255,255,255,0.8)";
      g.beginPath(); g.arc(size * 0.5 + Math.cos(a) * size * 0.4, size * 0.5 + Math.sin(a) * size * 0.4, size * 0.016, 0, Math.PI * 2); g.fill();
    }
    return c.toDataURL();
  }

  /* ---------- 播放器应用 ---------- */
  HeBi.registerApp({
    id: "music", name: "音乐", icon: "music", w: 760, h: 560, multi: true,
    mount(body, win, arg) {
      body.innerHTML = `
        <div class="mu-app">
          <div class="mu-top">
            <div class="mu-cover paused" id="mu-cover"><img id="mu-cover-img" alt=""></div>
            <div class="mu-meta">
              <div class="mu-title" id="mu-title">—</div>
              <div class="mu-artist" id="mu-artist">合璧音律</div>
              <div class="mu-viz"><canvas id="mu-viz"></canvas></div>
            </div>
          </div>
          <div class="mu-ctrl">
            <button id="mu-prev" title="上一首">⏮</button>
            <button class="mu-play" id="mu-play" title="播放/暂停">▶</button>
            <button id="mu-next" title="下一首">⏭</button>
            <button id="mu-shuffle" title="随机播放" style="font-size:14px">🔀</button>
            <button id="mu-repeat" title="单曲循环" style="font-size:14px">🔁</button>
            <div class="mu-bar">
              <span id="mu-cur">0:00</span>
              <div class="track" id="mu-track"><div id="mu-fill" style="width:0%"></div></div>
              <span id="mu-dur">0:00</span>
            </div>
            <div class="mu-vol">${ico("vol", 15)}<input type="range" class="hb-slider" id="mu-vol" min="0" max="100" value="${HeBi.state.settings.volume}"></div>
          </div>
          <div class="mu-list" id="mu-list"></div>
        </div>`;
      const fmt = (s) => Math.floor(s / 60) + ":" + HeBi.pad(Math.floor(s % 60));
      let vizRaf = 0;

      function renderList() {
        const l = $("#mu-list", body);
        l.innerHTML = "";
        TRACKS.forEach((t, i) => {
          const r = el("div", "mu-track" + (Engine.idx === i && Engine.track === t ? " playing" : ""));
          r.innerHTML = `<span class="tplay">${Engine.idx === i && Engine.playing ? "♪" : ""}</span>
            <span class="tnum">${i + 1}</span>
            <span class="tname">${t.title}</span>
            <span class="tartist">${t.artist}</span>
            <span class="tdur">${fmt(durOf(t))}</span>`;
          r.onclick = () => { Engine.play(i); syncUI(); };
          l.appendChild(r);
        });
        // VFS 中的音频文件
        const audioFiles = [];
        (function walk(node, path) {
          if (node.type === "dir") Object.entries(node.children).forEach(([n, c]) => walk(c, path + "/" + n));
          else if (["mp3", "wav", "flac"].includes(node.kind)) audioFiles.push({ name: path.split("/").pop(), path, node });
        })(HeBi.vfs.get("/"), "");
        if (audioFiles.length) {
          const h = el("div", null, `<div style="padding:8px 12px 4px;font-size:11px;opacity:.6">本地音乐（文件管理器）</div>`);
          l.appendChild(h);
          audioFiles.forEach((f) => {
            const r = el("div", "mu-track");
            r.innerHTML = `<span class="tplay">🎵</span><span class="tname">${f.name}</span><span class="tartist">${f.path}</span><span class="tdur">--:--</span>`;
            r.onclick = () => HeBi.toast("音乐", "「" + f.name + "」为演示文件，正在播放同名单曲预览", "music");
            l.appendChild(r);
          });
        }
      }
      function syncUI() {
        const t = Engine.track || TRACKS[0];
        $("#mu-title", body).textContent = t.title;
        $("#mu-artist", body).textContent = t.artist;
        $("#mu-cover-img", body).src = cover(t, 300);
        $("#mu-dur", body).textContent = fmt(durOf(t));
        $("#mu-play", body).textContent = Engine.playing ? "⏸" : "▶";
        $("#mu-cover", body).classList.toggle("paused", !Engine.playing);
        renderList();
      }
      function tick() {
        const pos = Engine.position();
        const t = Engine.track || TRACKS[0];
        $("#mu-cur", body).textContent = fmt(pos);
        $("#mu-fill", body).style.width = (pos / durOf(t)) * 100 + "%";
      }
      function drawViz() {
        const cv = $("#mu-viz", body);
        if (!cv) { vizRaf = 0; return; }
        const g = cv.getContext("2d");
        const W = cv.clientWidth, H = cv.clientHeight;
        if (cv.width !== W * 2) { cv.width = W * 2; cv.height = H * 2; }
        g.clearRect(0, 0, W * 2, H * 2);
        if (Engine.analyser && Engine.playing) {
          Engine.analyser.getByteFrequencyData(Engine.freqData);
          const n = Engine.freqData.length;
          const bw = (W * 2) / n;
          for (let i = 0; i < n; i++) {
            const v = Engine.freqData[i] / 255;
            const h = Math.max(2, v * H * 2 * 0.9);
            const gr = g.createLinearGradient(0, H * 2 - h, 0, H * 2);
            gr.addColorStop(0, "#22C3E6"); gr.addColorStop(1, "rgba(46,124,246,0.25)");
            g.fillStyle = gr;
            g.fillRect(i * bw + 1, H * 2 - h, bw - 2, h);
          }
        } else {
          // 静止波形
          g.strokeStyle = "rgba(255,255,255,0.25)";
          g.lineWidth = 2;
          g.beginPath();
          for (let x = 0; x < W * 2; x += 4) {
            const y = H + Math.sin(x / 40 + Date.now() / 500) * H * 0.12;
            x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
          }
          g.stroke();
        }
        vizRaf = requestAnimationFrame(drawViz);
      }
      Engine.onTick = tick;
      Engine.onEnd = () => { if (Engine.repeat) return; Engine.next(); syncUI(); };

      $("#mu-play", body).onclick = () => {
        if (!Engine.ctx) { Engine.play(Engine.idx || 0); }
        else if (Engine.playing) Engine.pause();
        else Engine.resume();
        syncUI();
      };
      $("#mu-next", body).onclick = () => { Engine.next(); syncUI(); };
      $("#mu-prev", body).onclick = () => { Engine.prev(); syncUI(); };
      $("#mu-shuffle", body).onclick = (e) => { Engine.shuffle = !Engine.shuffle; e.currentTarget.style.opacity = Engine.shuffle ? 1 : 0.45; HeBi.toast("音乐", Engine.shuffle ? "随机播放：开" : "随机播放：关", "music"); };
      $("#mu-repeat", body).onclick = (e) => { Engine.repeat = !Engine.repeat; e.currentTarget.style.opacity = Engine.repeat ? 1 : 0.45; HeBi.toast("音乐", Engine.repeat ? "单曲循环：开" : "单曲循环：关", "music"); };
      $("#mu-vol", body).oninput = (e) => { HeBi.state.settings.volume = +e.target.value; HeBi.state.settings.muted = false; HeBi.save(); Engine.applyVolume(); };
      $("#mu-track", body).onclick = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const p = (e.clientX - r.left) / r.width;
        const t = Engine.track || TRACKS[0];
        const pos = p * durOf(t);
        if (Engine.playing) { Engine.step = Math.floor((pos / durOf(t)) * STEPS); Engine.nextT = Engine.ctx.currentTime + 0.05; Engine.startT = Engine.ctx.currentTime - pos; }
        else HeBi.toast("音乐", "请先播放后再拖动进度", "music");
      };
      if (arg && arg.path) HeBi.toast("音乐", "已从文件管理器载入：" + arg.path.split("/").pop(), "music");
      syncUI();
      drawViz();
    },
    onClose() { Engine.onTick = null; Engine.onEnd = null; },
  });
  // 导出供语音助手等外部调用
  HeBi.music = {
    next: () => Engine.next(), prev: () => Engine.prev(),
    pause: () => Engine.pause && Engine.pause(),
    play: () => { if (!HeBi.apps.music) return; const w = HeBi.openApp("music"); Engine.play && Engine.play(); },
  };
})();
