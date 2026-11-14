/* ============================================================
   终端 · 璧行（HeBi Shell）
   ============================================================ */
(function () {
  const HB = window.HeBi;
  const { $, el } = HB;

  HB.registerApp({
    id: "terminal", name: "终端", icon: "terminal", w: 760, h: 460,
    open: openTerm,
  });

  const NEOFETCH = `        ╭──────────╮        璧儿@hebi
       ╭┴──────────┴╮       ─────────────
      ╭┴╮  ┌────┐  ╭┴╮      OS: 合璧OS 5.0 LTS Jade
     ╭┴╮┌┘  │ ◈◈ │  └╮╭┴╮    Kernel: Linux 6.8.0-hebi
    ╭┴╮┌┘╰──└────┘──╯└╮╭┴╮   Shell: hbsh 1.0.3
   ╭┴╮┌┘   ┌──────┐   └╮╭┴╮  DE: HeBiShell 5.0
  ╭┴╮┌┘     │ ┌──┐ │     └╮╭┴╮ WM: hebi-wm
 ╭┴╮┌┘       │ │界│ │       └╮╭┴╮  Font: Segoe UI 10pt
╰─╯          │ └──┘ │          ╰─╯   Apps: ${HB.state.installed.length} installed`;

  function openTerm(win) {
    win.body.innerHTML = `<div class="tm-app">
      <div class="tm-out" id="tm-out"></div>
      <div class="tm-input-row">
        <span class="tm-ps" id="tm-ps">璧儿@hebi:/$</span>
        <input id="tm-in" spellcheck="false" autocomplete="off" />
      </div>
    </div>`;
    const out = $("#tm-out", win.body), inp = $("#tm-in", win.body), ps = $("#tm-ps", win.body);
    let cwd = "/home/" + HB.curUser().id;

    const print = (txt, cls) => {
      const l = el("div", cls || "");
      l.textContent = txt;
      out.appendChild(l); out.scrollTop = out.scrollHeight;
    };
    const printHTML = (html) => { const l = el("div"); l.innerHTML = html; out.appendChild(l); out.scrollTop = out.scrollHeight; };
    const ps1 = () => (ps.textContent = "璧儿@hebi:" + cwd + "$");

    print("合璧OS HeBi OS 5.0 LTS「Jade」 · HeBi Shell 1.0.3", "ln-hl");
    print("输入 help 查看可用命令 · hbpm --help 管理安装包", "ln-dim");
    print("");
    ps1();
    setTimeout(() => inp.focus(), 50);
    win.body.addEventListener("pointerup", () => { if (!getSelection().toString()) inp.focus(); });

    const hist = []; let hi = -1;
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const line = inp.value; inp.value = "";
        print("璧儿@hebi:" + cwd + "$ " + line);
        if (line.trim()) { hist.push(line); hi = hist.length; }
        exec(line);
      } else if (e.key === "ArrowUp") { if (hi > 0) { hi--; inp.value = hist[hi]; } e.preventDefault(); }
      else if (e.key === "ArrowDown") { if (hi < hist.length - 1) { hi++; inp.value = hist[hi]; } else { hi = hist.length; inp.value = ""; } e.preventDefault(); }
    });

    function resolve(p) {
      if (!p) return cwd;
      if (p.startsWith("/")) return HB.vfs.normPath(p);
      return HB.vfs.normPath(cwd + "/" + p);
    }
    function listDir(path) {
      const items = HB.vfs.list(path);
      return items.length ? items.map((f) => (f.type === "dir" ? f.name + "/" : f.name)).join("   ") : "(空)";
    }

    function exec(line) {
      const parts = line.trim().match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const cmd = (parts[0] || "").toLowerCase();
      const args = parts.slice(1).map((s) => s.replace(/^"|"$/g, ""));
      try {
        switch (cmd) {
          case "": return;
          case "help":
            print("内置命令: ls cd pwd cat echo mkdir touch rm clear date whoami neofetch open uname");
            print("包管理:     hbpm install <pkg.mdn|deb> | hbpm remove <name> | hbpm list | hbpm search <kw>");
            print("系统:       hbver  hbupdate  exit");
            return;
          case "ls": return print(args[0] ? listDir(resolve(args[0])) : listDir(cwd));
          case "cd": {
            const t = resolve(args[0] || "/home/" + HB.curUser().id);
            const d = HB.vfs.get(t);
            if (d && d.type === "dir") { cwd = t; ps1(); } else print("cd: " + (args[0] || "") + ": 没有该目录", "ln-err");
            return;
          }
          case "pwd": return print(cwd);
          case "cat": {
            if (!args[0]) return print("用法: cat <文件>", "ln-dim");
            const f = HB.vfs.get(resolve(args[0]));
            if (!f || f.type !== "file") return print("cat: " + args[0] + ": 没有该文件", "ln-err");
            if (f.content && /<[a-z]/i.test(f.content)) { printHTML("<i>" + f.content.replace(/</g, "&lt;").slice(0, 600) + (f.content.length > 600 ? "…" : "") + "</i>"); }
            else print(f.content || "(空文件)");
            return;
          }
          case "echo": return print(args.join(" "));
          case "mkdir": if (args[0]) { HB.vfs.mkdir(resolve(args[0])); print("已创建 " + resolve(args[0])); } else print("用法: mkdir <目录>", "ln-dim"); return;
          case "touch": if (args[0]) { HB.vfs.write(resolve(args[0]), { name: args[0], type: "file", content: "", size: 0 }); } else print("用法: touch <文件>", "ln-dim"); return;
          case "rm": {
            if (!args[0]) return print("用法: rm [-r] <路径>", "ln-dim");
            const t = resolve(args[0].replace(/^-r$/, "") || args[1] || "");
            if (HB.vfs.get(t)) { HB.vfs.rm(t); print("已删除 " + t); } else print("rm: 没有 " + t, "ln-err");
            return;
          }
          case "clear": out.innerHTML = ""; return;
          case "date": return print(new Date().toString());
          case "whoami": return print(HB.curUser().name + "（" + HB.curUser().role + "）");
          case "uname": return print("Linux hebi 6.8.0-hebi #1 SMP HeBi x86_64 GNU/Linux");
          case "neofetch": print(NEOFETCH.replace("${HB.state.installed.length}", HB.state.installed.length)); return;
          case "hbver": print("合璧OS HeBi OS 5.0.0 LTS · 代号 Jade（玉）"); return;
          case "open": {
            if (args[0] && HB.apps[args[0]]) { HB.openApp(args[0]); print("已启动 " + HB.apps[args[0]].name, "ln-ok"); }
            else print("open: 未知应用「" + (args[0] || "") + "」，可用: " + Object.keys(HB.apps).join(" "), "ln-err");
            return;
          }
          case "exit": HB.closeWin(win.id); return;
          case "hbpm": return hbpm(args);
          case "hbupdate":
            print("hbpm: 正在同步 8 个软件源…", "ln-dim");
            setTimeout(() => print("hbpm: 已是最新（hbpm 1.0.3 · 源索引 2026-10-19）", "ln-ok"), 700);
            return;
          default:
            print("hbsh: 命令未找到: " + cmd + "（输入 help 查看命令列表）", "ln-err");
        }
      } catch (err) { print("错误: " + err.message, "ln-err"); }
    }

    function hbpm(args) {
      const sub = args[0];
      if (sub === "install" && args[1]) {
        const f = args[1];
        const isMdn = /\.mdn$/i.test(f), isDeb = /\.deb$/i.test(f);
        if (!isMdn && !isDeb) return print("hbpm: 不支持的格式（支持 .mdn / .deb）", "ln-err");
        print("hbpm: 正在安装 " + f + " …", "ln-dim");
        const steps = ["读取包元数据", "校验依赖关系", "解包到 /", "运行配置脚本", "更新桌面数据库"];
        let i = 0;
        const tick = () => {
          if (i >= steps.length) {
            print("hbpm: " + f + " 安装成功 ✓", "ln-ok");
            const m = f.match(/office|voice|files|music|terminal|drivers|backup|logo/);
            if (m && !HB.state.installed.includes(m[0])) { HB.state.installed.push(m[0]); HB.save(); print("hbpm: 已注册应用 " + m[0], "ln-ok"); }
            return;
          }
          print("  · " + steps[i++]);
          setTimeout(tick, 320);
        };
        tick();
        return;
      }
      if (sub === "remove" && args[1]) {
        const id = args[1].replace(/_[\d.]+_amd64\.(mdn|deb)$/, "");
        HB.state.installed = HB.state.installed.filter((x) => x !== id);
        HB.save();
        return print("hbpm: " + args[1] + " 已卸载", "ln-ok");
      }
      if (sub === "list") {
        print("已安装软件包（" + HB.state.installed.length + "）:");
        HB.state.installed.forEach((id) => print("  ii  " + id + "  " + (HB.apps[id] ? HB.apps[id].name : "")));
        return;
      }
      if (sub === "search" && args[1]) {
        const kw = args[1].toLowerCase();
        const hits = ["office-assistant", "voice-assistant", "hebi-files", "hebi-music", "hebi-terminal", "hebi-drivers", "logo-lab", "hebi-backup"].filter((p) => p.includes(kw));
        print(hits.length ? hits.map((h) => "  hbpm/" + h + "_amd64.mdn").join("\n") : "hbpm: 未找到匹配「" + args[1] + "」的包", hits.length ? "ln-ok" : "ln-dim");
        return;
      }
      print("hbpm 1.0.3 — 合璧包管理器（支持 .mdn / .deb）");
      print("用法: hbpm install <包.mdn|包.deb> | remove <包> | list | search <关键词>");
    }
  }
})();
