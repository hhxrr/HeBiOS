/* ============================================================
   合璧OS — 文件管理器（仿 Windows 资源管理器）
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, el, ico } = HeBi;

  const FILE_ICONS = {
    txt: "📄", hdoc: "📝", md: "📄", png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", svg: "🖼️",
    mp3: "🎵", wav: "🎵", flac: "🎵", ogg: "🎵", mp4: "🎬", mkv: "🎬", webm: "🎬",
    deb: "📦", mdn: "📦", exe: "🪟", msi: "🪟", iso: "💿", bin: "💿", gz: "🗜️", zip: "🗜️",
    pdf: "📕", default: "📄",
  };
  const fileIcon = (node) => (node.type === "dir" ? "📁" : FILE_ICONS[node.kind] || FILE_ICONS.default);
  const KIND_NAMES = { txt: "文本文档", hdoc: "合璧文档", deb: "Debian 安装包", mdn: "合璧安装包 (.mdn)", exe: "Windows 应用", msi: "Windows 安装包", iso: "光盘映像", bin: "二进制文件", mp3: "音频文件" };

  HeBi.registerApp({
    id: "files", name: "文件管理器", icon: "files", w: 900, h: 560,
    mount(body, win, arg) {
      const user = HeBi.curUser();
      const HOME = "/home/" + user.id;
      const quick = [
        { name: "桌面", path: HOME + "/桌面", ico: "home" },
        { name: "下载", path: HOME + "/下载", ico: "cloud" },
        { name: "文档", path: HOME + "/文档", ico: "doc" },
        { name: "图片", path: HOME + "/图片", ico: "img" },
        { name: "音乐", path: HOME + "/音乐", ico: "audio" },
        { name: "视频", path: HOME + "/视频", ico: "view" },
      ];
      let cwd = HOME + "/桌面";
      let view = "grid"; // grid | list
      let selected = null;
      let history = [cwd], hIdx = 0;
      let clipboard = null; // {path, mode:'copy'|'cut'}
      let filter = "";

      body.innerHTML = `
        <div class="fm-toolbar">
          <button data-a="back" title="后退">←</button>
          <button data-a="fwd" title="前进">→</button>
          <button data-a="up" title="上级">↑</button>
          <button data-a="new" title="新建文件夹">${ico("newfolder", 15)} 新建</button>
          <button data-a="copy" title="复制">${ico("copy", 15)} 复制</button>
          <button data-a="paste" title="粘贴">${ico("paste", 15)} 粘贴</button>
          <button data-a="del" title="删除">${ico("del", 15)} 删除</button>
          <button data-a="rename" title="重命名">${ico("rename", 15)} 重命名</button>
          <span style="flex:1"></span>
          <button data-a="view" title="切换视图">${ico("grid", 15)}</button>
          <button data-a="refresh" title="刷新">${ico("refresh", 15)}</button>
        </div>
        <div class="fm-addr">
          <div class="fa-path" id="fm-path"></div>
          <input class="fa-search" id="fm-search" placeholder="搜索当前文件夹" />
        </div>
        <div class="fm-main">
          <div class="fm-side" id="fm-side"></div>
          <div class="fm-content" id="fm-content"></div>
        </div>
        <div class="fm-status"><span id="fm-status-l"></span><span id="fm-status-r"></span></div>`;

      /* ---------- 侧栏 ---------- */
      function renderSide() {
        const sb = $("#fm-side", body);
        sb.innerHTML = `<div class="fs-head">快速访问</div>`;
        quick.forEach((q) => {
          const b = el("button", "fs-item" + (cwd === q.path ? " active" : ""));
          b.innerHTML = `<span class="fsi">${ico(q.ico, 16)}</span>${q.name}`;
          b.onclick = () => nav(q.path);
          sb.appendChild(b);
        });
        sb.appendChild(el("div", "fs-head")).textContent = "此电脑";
        const drives = [
          { name: "本地磁盘 (C:)", path: "/", ico: "drive", used: 0.42 },
          { name: "数据 (D:)", path: HOME, ico: "drive", used: 0.18 },
        ];
        drives.forEach((d) => {
          const b = el("button", "fs-item" + (cwd === d.path ? " active" : ""));
          b.innerHTML = `<span class="fsi">${ico(d.ico, 16)}</span>${d.name}`;
          b.onclick = () => nav(d.path);
          sb.appendChild(b);
        });
        const net = el("button", "fs-item");
        net.innerHTML = `<span class="fsi">${ico("net", 16)}</span>网络`;
        net.onclick = () => HeBi.toast("文件管理器", "网络邻居暂不可用（演示）", "net");
        sb.appendChild(net);
      }

      /* ---------- 导航 ---------- */
      function nav(path, push = true) {
        const node = HeBi.vfs.get(path);
        if (!node || node.type !== "dir") { HeBi.toast("文件管理器", "路径不存在: " + path, "del"); return; }
        cwd = path;
        selected = null;
        if (push) { history = history.slice(0, hIdx + 1); history.push(path); hIdx = history.length - 1; }
        renderAll();
      }
      function crumbs() {
        const parts = cwd.split("/").filter(Boolean);
        const out = [{ name: "此电脑", path: "/" }];
        let acc = "";
        parts.forEach((p) => { acc += "/" + p; out.push({ name: p, path: acc }); });
        return out;
      }
      function renderPath() {
        const pb = $("#fm-path", body);
        pb.innerHTML = "";
        crumbs().forEach((c, i, arr) => {
          const b = el("button", "crumb", c.name);
          b.onclick = () => nav(c.path);
          pb.appendChild(b);
          if (i < arr.length - 1) pb.appendChild(el("span", null, "›"));
        });
        $$(".crumb", pb).forEach((b) => b.onclick = () => nav(b.textContent === "此电脑" ? "/" : crumbPath(b.textContent)));
        function crumbPath(name) { let acc = ""; for (const p of cwd.split("/").filter(Boolean)) { acc += "/" + p; if (p === name) break; } return acc; }
        // 修正：为每个面包屑绑定准确路径
        const cs = crumbs();
        $$(".crumb", pb).forEach((b, i) => { b.onclick = () => nav(cs[i].path); });
      }

      /* ---------- 内容 ---------- */
      function currentItems() {
        let items = HeBi.vfs.list(cwd);
        if (filter) items = items.filter((it) => it.name.toLowerCase().includes(filter.toLowerCase()));
        return items;
      }
      function renderContent() {
        const cc = $("#fm-content", body);
        const items = currentItems();
        cc.innerHTML = "";
        if (!items.length) {
          cc.innerHTML = `<div class="fm-empty">${filter ? "没有匹配「" + filter + "」的项目" : "此文件夹为空"}</div>`;
        } else if (view === "grid") {
          const g = el("div", "fm-grid");
          items.forEach((it) => g.appendChild(itemNode(it, "grid")));
          cc.appendChild(g);
        } else {
          const l = el("div", "fm-list");
          l.innerHTML = `<div class="fl-head"><span>名称</span><span>修改日期</span><span>类型</span><span>大小</span></div>`;
          items.forEach((it) => l.appendChild(itemNode(it, "list")));
          cc.appendChild(l);
        }
        cc.oncontextmenu = (e) => {
          if (e.target.closest(".fm-item, .fl-row")) return;
          e.preventDefault();
          HeBi.contextMenu(e.clientX, e.clientY, [
            { label: "新建文件夹", icon: "newfolder", onClick: () => act("new") },
            { label: "粘贴", icon: "paste", disabled: !clipboard, onClick: () => act("paste") },
            "-",
            { label: "刷新", icon: "refresh", onClick: () => renderAll() },
            { label: "在大图标/列表间切换", icon: "view", onClick: () => act("view") },
          ]);
        };
        renderStatus(items);
      }
      function itemNode(it, mode) {
        const node = el(mode === "grid" ? "div" : "div", mode === "grid" ? "fm-item" : "fl-row");
        if (selected === it.path) node.classList.add("selected");
        const d = new Date(it.node.mtime || Date.now());
        const dateStr = d.getFullYear() + "/" + HeBi.pad(d.getMonth() + 1) + "/" + HeBi.pad(d.getDate()) + " " + HeBi.pad(d.getHours()) + ":" + HeBi.pad(d.getMinutes());
        if (mode === "grid") {
          node.innerHTML = `<div class="fi-ico">${fileIcon(it.node)}</div><div class="fi-name">${it.name}</div>`;
        } else {
          node.innerHTML = `<div class="nm"><span class="fi">${fileIcon(it.node)}</span><span>${it.name}</span></div>
            <div class="dim">${dateStr}</div>
            <div class="dim">${it.node.type === "dir" ? "文件夹" : KIND_NAMES[it.node.kind] || "文件"}</div>
            <div class="dim">${it.node.type === "dir" ? "" : HeBi.vfs.fmtSize(it.node.size || 0)}</div>`;
        }
        node.onclick = (e) => { e.stopPropagation(); selected = it.path; renderAll(); };
        node.ondblclick = () => openItem(it);
        node.oncontextmenu = (e) => {
          e.preventDefault(); e.stopPropagation();
          selected = it.path; renderAll();
          HeBi.contextMenu(e.clientX, e.clientY, [
            { label: "打开", icon: "view", onClick: () => openItem(it) },
            { label: "复制", icon: "copy", onClick: () => { clipboard = { path: it.path, mode: "copy" }; HeBi.toast("文件管理器", "已复制 " + it.name, "copy"); } },
            { label: "剪切", icon: "copy", onClick: () => { clipboard = { path: it.path, mode: "cut" }; HeBi.toast("文件管理器", "已剪切 " + it.name, "copy"); } },
            { label: "删除", icon: "del", onClick: () => act("del") },
            { label: "重命名", icon: "rename", onClick: () => act("rename") },
            "-",
            { label: "属性", icon: "props", onClick: () => props(it) },
          ]);
        };
        return node;
      }
      function renderStatus(items) {
        const dirs = items.filter((i) => i.node.type === "dir").length;
        $("#fm-status-l", body).textContent = items.length + " 个项目（" + dirs + " 个文件夹）";
        $("#fm-status-r", body).textContent = cwd;
      }
      function renderAll() { renderSide(); renderPath(); renderContent(); }

      /* ---------- 动作 ---------- */
      async function act(a) {
        if (a === "back" && hIdx > 0) { hIdx--; cwd = history[hIdx]; selected = null; renderAll(); return; }
        if (a === "fwd" && hIdx < history.length - 1) { hIdx++; cwd = history[hIdx]; selected = null; renderAll(); return; }
        if (a === "up") { const i = cwd.lastIndexOf("/"); if (i > 0) nav(cwd.slice(0, i)); return; }
        if (a === "new") {
          let name = "新建文件夹", i = 1;
          while (HeBi.vfs.exists(cwd + "/" + name)) name = "新建文件夹 (" + ++i + ")";
          HeBi.vfs.mkdir(cwd + "/" + name);
          renderAll();
          return;
        }
        if (a === "copy" && selected) { clipboard = { path: selected, mode: "copy" }; HeBi.toast("文件管理器", "已复制", "copy"); return; }
        if (a === "paste" && clipboard) {
          const src = clipboard.path, name = src.split("/").pop();
          if (HeBi.vfs.move(src, cwd) || HeBi.vfs.copy(src, cwd)) {
            HeBi.toast("文件管理器", (clipboard.mode === "cut" ? "已移动 " : "已粘贴 ") + name, "paste");
            clipboard = null; renderAll();
          }
          return;
        }
        if (a === "del" && selected) {
          const name = selected.split("/").pop();
          const ok = await HeBi.dialog({
            title: "删除", body: `确定要删除「${name}」吗？此项目将被永久删除。`,
            buttons: [{ label: "取消", value: false }, { label: "删除", value: true, danger: true, primary: true }],
          });
          if (ok) { HeBi.vfs.rm(selected); selected = null; renderAll(); HeBi.toast("文件管理器", "已删除 " + name, "del"); }
          return;
        }
        if (a === "rename" && selected) {
          const old = selected.split("/").pop();
          const name = await HeBi.prompt2("重命名", "新名称：", old);
          if (name && name !== old) {
            if (HeBi.vfs.rename(selected, name)) { selected = cwd + "/" + name; renderAll(); }
            else HeBi.toast("文件管理器", "重命名失败（名称可能已存在）", "del");
          }
          return;
        }
        if (a === "view") { view = view === "grid" ? "list" : "grid"; renderAll(); return; }
        if (a === "refresh") { renderAll(); return; }
      }
      $$(".fm-toolbar button", body).forEach((b) => (b.onclick = () => act(b.dataset.a)));
      $("#fm-search", body).addEventListener("input", (e) => { filter = e.target.value; renderContent(); });

      /* ---------- 打开 ---------- */
      function openItem(it) {
        if (it.node.type === "dir") { nav(it.path); return; }
        const kind = it.node.kind;
        if (kind === "txt" || kind === "md") HeBi.openApp("notepad", { path: it.path });
        else if (kind === "hdoc") HeBi.openApp("office", { path: it.path });
        else if (kind === "deb" || kind === "mdn") HeBi.openApp("store", { installFile: it.path });
        else if (kind === "mp3" || kind === "wav" || kind === "flac") HeBi.openApp("music", { path: it.path });
        else if (["png", "jpg", "jpeg", "gif", "svg"].includes(kind)) HeBi.openApp("imgview", { path: it.path });
        else if (kind === "iso" || kind === "bin") HeBi.toast("文件管理器", "「" + it.name + "」是系统镜像/二进制文件（" + HeBi.vfs.fmtSize(it.node.size || 0) + "）", "info");
        else HeBi.openApp("notepad", { path: it.path });
      }
      function props(it) {
        HeBi.dialog({
          title: it.name + " 属性",
          body: `<div style="display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:13px">
            <span style="color:var(--hb-text-2)">类型</span><span>${it.node.type === "dir" ? "文件夹" : KIND_NAMES[it.node.kind] || "文件"}</span>
            <span style="color:var(--hb-text-2)">位置</span><span>${cwd}</span>
            <span style="color:var(--hb-text-2)">大小</span><span>${it.node.type === "dir" ? "—" : HeBi.vfs.fmtSize(it.node.size || 0)}</span>
            <span style="color:var(--hb-text-2)">修改时间</span><span>${new Date(it.node.mtime || Date.now()).toLocaleString("zh-CN")}</span>
          </div>`,
        });
      }

      if (arg === "此电脑") { nav("/", false); }
      renderAll();
    },
  });
})();
