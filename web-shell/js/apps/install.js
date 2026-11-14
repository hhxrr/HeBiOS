/* ============================================================
   系统安装（九步安装向导 · 演示模式）
   界面与装机 ISO 内置网页安装器 (hebios-webinst) 完全一致:
   语言 → 许可协议 → 选盘 → 分区 → 用户 → 驱动 → 确认 → 安装 → 完成
   本应用为功能演示: 磁盘列表 / 安装进度均为模拟数据, 不写任何磁盘。
   真实安装: 从 HeBiOS 安装介质启动, 在 GRUB 菜单选择
   「图形化安装」或「网页安装」(局域网内任意浏览器访问)。
   ============================================================ */
(function () {
  "use strict";
  const HB = window.HeBi;
  const { $, el } = HB;

  /* 向导完整文档 (iframe srcdoc, 与桌面样式隔离)
     注意: 内嵌 JS 全部使用字符串拼接 (无模板字面量),
     以便安全内联进单文件 HTML 的 <script> 块。 */
  const WIZARD_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>合璧OS 网页安装向导 — 演示模式</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2322d3ee'/%3E%3Cstop offset='1' stop-color='%230891b2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='4' y='4' width='56' height='56' rx='14' fill='url(%23g)'/%3E%3Cpath d='M22 20v12c0 8 5 12 10 12s10-4 10-12V20' fill='none' stroke='%23fff' stroke-width='5' stroke-linecap='round'/%3E%3Ccircle cx='32' cy='48' r='3' fill='%23fff'/%3E%3C/svg%3E">
<style>
:root{
  --bg0:#04121f; --bg1:#0a2436; --card:rgba(10,32,48,.86); --card2:rgba(13,40,60,.7);
  --line:rgba(56,189,248,.22); --line2:rgba(56,189,248,.4);
  --txt:#e8f4f8; --sub:#9db8c6; --dim:#6d8896;
  --acc:#22d3ee; --acc2:#0891b2; --jade:#34d399; --warn:#fbbf24; --err:#f87171;
  --radius:16px;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif;
  background:var(--bg0); color:var(--txt); min-height:100vh; overflow-x:hidden;
  display:flex; flex-direction:column; align-items:center;
}
.bg{position:fixed; inset:0; z-index:-2;
  background:
    radial-gradient(900px 500px at 12% -8%, rgba(34,211,238,.14), transparent 60%),
    radial-gradient(800px 480px at 105% 15%, rgba(192,38,211,.10), transparent 60%),
    radial-gradient(700px 600px at 50% 115%, rgba(8,145,178,.16), transparent 60%),
    linear-gradient(160deg, var(--bg0) 0%, var(--bg1) 55%, #061a29 100%);
}
.bg::after{content:""; position:absolute; inset:0; opacity:.5;
  background-image:radial-gradient(rgba(125,211,252,.08) 1px, transparent 1px);
  background-size:26px 26px;
}
.demo-banner{width:100%; box-sizing:border-box;
  background:linear-gradient(90deg,rgba(251,191,36,.18),rgba(251,191,36,.07));
  border-bottom:1px solid rgba(251,191,36,.42); color:#fde68a;
  font-size:13px; line-height:1.7; padding:10px 22px; text-align:center}
.demo-banner b{color:#fbbf24}
header{width:100%; max-width:1060px; padding:20px 28px 0; display:flex; align-items:center; gap:14px}
.logo{width:44px;height:44px;border-radius:12px;flex:none;
  background:linear-gradient(135deg,var(--acc),var(--acc2));
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 6px 22px rgba(34,211,238,.35)}
.logo svg{width:30px;height:30px}
.brand b{font-size:19px; letter-spacing:.5px; display:block; line-height:1.2}
.brand span{font-size:12.5px; color:var(--sub); letter-spacing:2px}
header .ver{margin-left:auto; font-size:12px; color:var(--warn); border:1px solid rgba(251,191,36,.4);
  padding:5px 12px; border-radius:99px; white-space:nowrap}
.rail{width:100%; max-width:1060px; padding:24px 28px 4px; display:flex; align-items:flex-start}
.rail .node{display:flex; flex-direction:column; align-items:center; gap:7px; flex:1; position:relative; min-width:0}
.rail .node .dot{width:34px;height:34px;border-radius:50%; display:flex;align-items:center;justify-content:center;
  font-size:14px; font-weight:600; color:var(--dim);
  background:var(--card2); border:1.5px solid var(--line); transition:.35s; z-index:1}
.rail .node .lbl{font-size:12px; color:var(--dim); transition:.3s; white-space:nowrap}
.rail .node::before{content:""; position:absolute; top:17px; left:-50%; width:100%; height:2px;
  background:var(--line); transition:.4s}
.rail .node:first-child::before{display:none}
.rail .node.done::before{background:var(--acc)}
.rail .node.done .dot{background:linear-gradient(135deg,var(--acc),var(--acc2)); border-color:transparent; color:#03181f}
.rail .node.done .lbl{color:var(--acc)}
.rail .node.active .dot{background:rgba(34,211,238,.12); border-color:var(--acc); color:var(--acc);
  box-shadow:0 0 0 5px rgba(34,211,238,.12); transform:scale(1.08)}
.rail .node.active .lbl{color:var(--txt); font-weight:600}
main{width:100%; max-width:1060px; padding:16px 28px 26px; flex:1}
.card{background:var(--card); border:1px solid var(--line); border-radius:var(--radius);
  padding:30px 36px; backdrop-filter:blur(14px); box-shadow:0 24px 60px rgba(0,0,0,.45);
  animation:cardIn .45s cubic-bezier(.2,.9,.3,1.2)}
@keyframes cardIn{from{opacity:0; transform:translateY(16px) scale(.99)} to{opacity:1; transform:none}}
.step{display:none}
.step.on{display:block}
/* ---- 快速安装页 (Deepin 风格) ---- */
.quick-hero{text-align:center; margin-bottom:6px}
.quick-hero h1{margin-bottom:6px}
.quick-hero .lead{margin-bottom:0}
.quick-grid{display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:18px 0 6px}
@media (max-width:760px){.quick-grid{grid-template-columns:1fr}}
.qi{display:flex; gap:12px; align-items:center; background:var(--card2);
  border:1px solid var(--line); border-radius:12px; padding:10px 14px}
.qii{font-size:22px; line-height:1}
.qit{font-size:13.5px; color:var(--txt); font-weight:600}
.qid{font-size:12px; color:var(--sub); margin-top:2px}
.quick-actions{display:flex; flex-direction:column; align-items:center; gap:14px; margin:20px 0 4px}
.qbtn-main{background:linear-gradient(135deg,#2E7CF6,#22C3E6); color:#fff; border:0;
  font-size:19px; font-weight:700; letter-spacing:1px; padding:15px 62px; border-radius:999px;
  cursor:pointer; box-shadow:0 8px 28px rgba(46,124,246,.45); transition:transform .15s,box-shadow .15s;
  font-family:inherit}
.qbtn-main:hover{transform:translateY(-2px); box-shadow:0 12px 34px rgba(46,124,246,.55)}
.qbtn-main:disabled{opacity:.55; cursor:wait; transform:none}
.qbtn-sub{background:none; border:0; color:var(--sub); font-size:13px; cursor:pointer;
  text-decoration:underline; text-underline-offset:4px; font-family:inherit}
.qbtn-sub:hover{color:var(--txt)}
.quick-note{text-align:center; font-size:12px; color:var(--dim); margin-top:16px; line-height:1.7}
h1{font-size:26px; font-weight:700; letter-spacing:.5px; margin-bottom:8px}
h1 .em{background:linear-gradient(90deg,var(--acc),#7dd3fc); -webkit-background-clip:text; background-clip:text; color:transparent}
.lead{color:var(--sub); font-size:14.5px; line-height:1.75; margin-bottom:22px}
.gray{color:var(--dim)}
.field{margin-bottom:18px}
.field label{display:block; font-size:13.5px; color:var(--sub); margin-bottom:7px; font-weight:500}
.field input[type=text],.field input[type=password],.field input[type=number],.field select{
  width:100%; padding:11px 14px; border-radius:10px; font-size:14.5px; color:var(--txt);
  background:rgba(2,15,25,.7); border:1px solid var(--line); outline:none; transition:.25s;
  font-family:inherit}
.field input:focus,.field select:focus{border-color:var(--acc); box-shadow:0 0 0 4px rgba(34,211,238,.14)}
.field .hint{font-size:12px; color:var(--dim); margin-top:6px}
.field .hint.bad{color:var(--err)}
.grid2{display:grid; grid-template-columns:1fr 1fr; gap:0 22px}
@media (max-width:720px){.grid2{grid-template-columns:1fr}}
.opts{display:grid; gap:12px}
.opts.c2{grid-template-columns:1fr 1fr}
.opts.c3{grid-template-columns:1fr 1fr 1fr}
@media (max-width:820px){.opts.c2,.opts.c3{grid-template-columns:1fr}}
.opt{position:relative; border:1.5px solid var(--line); border-radius:12px; padding:14px 16px;
  cursor:pointer; transition:.22s; background:var(--card2); display:flex; gap:12px; align-items:flex-start}
.opt:hover{border-color:var(--line2); transform:translateY(-1px)}
.opt.sel{border-color:var(--acc); background:rgba(34,211,238,.09);
  box-shadow:0 0 0 4px rgba(34,211,238,.1)}
.opt .ico{font-size:22px; line-height:1; flex:none; width:34px; height:34px; display:flex; align-items:center; justify-content:center;
  background:rgba(34,211,238,.1); border-radius:9px}
.opt .t{font-size:14.5px; font-weight:600; margin-bottom:3px}
.opt .d{font-size:12.5px; color:var(--sub); line-height:1.55}
.opt .tag{position:absolute; top:10px; right:12px; font-size:11px; color:var(--acc);
  border:1px solid rgba(34,211,238,.4); border-radius:99px; padding:2px 9px}
.disks{display:grid; gap:12px; margin-bottom:8px}
.disk{position:relative; border:1.5px solid var(--line); border-radius:12px; padding:16px 18px;
  cursor:pointer; transition:.22s; background:var(--card2); display:flex; align-items:center; gap:16px}
.disk:hover{border-color:var(--line2); transform:translateY(-1px)}
.disk.sel{border-color:var(--acc); background:rgba(34,211,238,.09); box-shadow:0 0 0 4px rgba(34,211,238,.1)}
.disk .dico{width:46px;height:46px;border-radius:11px; background:rgba(34,211,238,.12);
  display:flex;align-items:center;justify-content:center;font-size:22px;flex:none}
.disk .dname{font-size:15px; font-weight:700; font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
.disk .dmeta{font-size:12.5px; color:var(--sub); margin-top:3px}
.disk .dsize{margin-left:auto; text-align:right}
.disk .dsize b{font-size:19px; color:var(--acc)}
.disk .dsize span{display:block; font-size:11.5px; color:var(--dim)}
.disk .parts{margin-top:10px; border-top:1px dashed var(--line); padding-top:9px;
  font-size:12px; color:var(--dim); font-family:ui-monospace,Consolas,monospace; line-height:1.8}
.checks{display:grid; grid-template-columns:1fr 1fr; gap:12px}
@media (max-width:720px){.checks{grid-template-columns:1fr}}
.chk{display:flex; gap:12px; align-items:center; border:1.5px solid var(--line); border-radius:12px;
  padding:13px 16px; cursor:pointer; transition:.22s; background:var(--card2)}
.chk:hover{border-color:var(--line2)}
.chk.sel{border-color:var(--acc); background:rgba(34,211,238,.08)}
.chk .box{width:22px;height:22px;border-radius:6px; border:1.5px solid var(--line2); flex:none;
  display:flex;align-items:center;justify-content:center; font-size:13px; color:transparent; transition:.2s}
.chk.sel .box{background:linear-gradient(135deg,var(--acc),var(--acc2)); border-color:transparent; color:#03181f}
.chk .t{font-size:14px; font-weight:600}
.chk .d{font-size:12px; color:var(--sub); margin-top:2px}
.cbox{display:flex; gap:11px; align-items:flex-start; padding:13px 15px; border:1px solid var(--line);
  border-radius:11px; background:var(--card2); cursor:pointer; margin-bottom:11px; transition:.2s; font-size:14px; line-height:1.6}
.cbox:hover{border-color:var(--line2)}
.cbox.sel{border-color:var(--acc); background:rgba(34,211,238,.07)}
.cbox .box{width:20px;height:20px;border-radius:5px; border:1.5px solid var(--line2); flex:none; margin-top:1px;
  display:flex;align-items:center;justify-content:center; font-size:12px; color:transparent; transition:.2s}
.cbox.sel .box{background:linear-gradient(135deg,var(--acc),var(--acc2)); border-color:transparent; color:#03181f}
.cbox small{display:block; color:var(--dim); font-size:12.5px; margin-top:2px}
.eula{height:min(320px,34vh); overflow-y:auto; background:rgba(2,15,25,.65); border:1px solid var(--line);
  border-radius:12px; padding:20px 24px; font-size:13px; line-height:1.9; color:#c4d8e2;
  white-space:pre-wrap; font-family:inherit; margin-bottom:18px}
.eula::-webkit-scrollbar{width:9px}
.eula::-webkit-scrollbar-thumb{background:rgba(56,189,248,.3); border-radius:8px}
.sum{border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-bottom:18px}
.sum .r{display:flex; padding:12px 18px; font-size:14px; align-items:center}
.sum .r:nth-child(odd){background:rgba(13,40,60,.5)}
.sum .r .k{width:150px; color:var(--sub); flex:none}
.sum .r .v{font-weight:600; word-break:break-all}
.sum .r .v.mono{font-family:ui-monospace,Consolas,monospace}
.alert{border-radius:12px; padding:14px 18px; font-size:13.5px; line-height:1.7; margin-bottom:18px;
  border:1px solid; display:flex; gap:12px; align-items:flex-start}
.alert .ai{font-size:18px; flex:none}
.alert.warn{background:rgba(251,191,36,.08); border-color:rgba(251,191,36,.35); color:#fde68a}
.alert.err{background:rgba(248,113,113,.08); border-color:rgba(248,113,113,.4); color:#fecaca}
.alert.info{background:rgba(34,211,238,.07); border-color:rgba(34,211,238,.3); color:#a5f3fc}
.pwrap{text-align:center; padding:8px 0 4px}
.pct{font-size:60px; font-weight:800; letter-spacing:-1px;
  background:linear-gradient(90deg,var(--acc),#7dd3fc); -webkit-background-clip:text; background-clip:text; color:transparent}
.pct small{font-size:24px; font-weight:600}
.pmsg{font-size:15px; color:var(--sub); margin:6px 0 24px; min-height:24px}
.bar{height:14px; border-radius:99px; background:rgba(2,15,25,.8); border:1px solid var(--line);
  overflow:hidden; margin-bottom:8px}
.bar .fill{height:100%; width:0; border-radius:99px; position:relative;
  background:linear-gradient(90deg,var(--acc2),var(--acc),#7dd3fc);
  background-size:200% 100%; animation:flow 1.6s linear infinite; transition:width .5s ease}
@keyframes flow{to{background-position:-200% 0}}
.bar .fill::after{content:""; position:absolute; inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
  animation:sheen 1.8s ease-in-out infinite}
@keyframes sheen{from{transform:translateX(-100%)} to{transform:translateX(100%)}
}
.logbox{background:#020a12; border:1px solid var(--line); border-radius:12px; padding:14px 18px;
  font-family:ui-monospace,SFMono-Regular,Consolas,monospace; font-size:12px; line-height:1.85;
  color:#7ea8bc; height:min(170px,24vh); overflow-y:auto; text-align:left; white-space:pre-wrap; word-break:break-all}
.logbox::-webkit-scrollbar{width:9px}
.logbox::-webkit-scrollbar-thumb{background:rgba(56,189,248,.3); border-radius:8px}
.done-hero{text-align:center; padding:6px 0 18px}
.done-mark{width:92px;height:92px;margin:0 auto 20px; border-radius:50%;
  background:radial-gradient(circle,rgba(52,211,153,.25),rgba(52,211,153,.05) 70%);
  border:2px solid rgba(52,211,153,.5); display:flex; align-items:center; justify-content:center;
  animation:pop .6s cubic-bezier(.2,.9,.3,1.4)}
@keyframes pop{0%{transform:scale(.4); opacity:0} 100%{transform:scale(1); opacity:1}}
.done-mark svg{width:44px;height:44px}
.done-mark svg path{stroke-dasharray:60; stroke-dashoffset:60; animation:draw .7s .3s ease forwards}
@keyframes draw{to{stroke-dashoffset:0}}
footer{width:100%; max-width:1060px; padding:0 28px 30px; display:flex; gap:14px; align-items:center}
.btn{border:none; cursor:pointer; font-family:inherit; font-size:15px; font-weight:600;
  padding:13px 30px; border-radius:12px; transition:.22s; letter-spacing:.5px}
.btn.primary{background:linear-gradient(135deg,var(--acc),var(--acc2)); color:#03181f;
  box-shadow:0 8px 26px rgba(34,211,238,.32)}
.btn.primary:hover:not(:disabled){transform:translateY(-2px); box-shadow:0 12px 32px rgba(34,211,238,.45)}
.btn.primary:disabled{opacity:.4; cursor:not-allowed}
.btn.ghost{background:transparent; color:var(--sub); border:1px solid var(--line)}
.btn.ghost:hover{color:var(--txt); border-color:var(--line2)}
.btn.danger{background:transparent; color:var(--err); border:1px solid rgba(248,113,113,.4)}
.btn.danger:hover{background:rgba(248,113,113,.1)}
.btn.big{padding:16px 44px; font-size:16.5px}
.spacer{flex:1}
.tip{font-size:12.5px; color:var(--dim)}
.shake{animation:shk .4s}
@keyframes shk{0%,100%{transform:none}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
</style>
</head>
<body>
<div class="demo-banner">⚠ <b>演示模式</b> — 本向导界面与装机 ISO 内置的网页安装器完全一致，但磁盘列表与安装进度均为<b>模拟数据</b>，不会写入任何磁盘。真实安装请从合璧OS 安装介质启动，在 GRUB 菜单选择「网页安装」或「图形化安装」。</div>
<div class="bg"></div>

<header>
  <div class="logo">
    <svg viewBox="0 0 64 64" fill="none"><path d="M22 20v12c0 8 5 12 10 12s10-4 10-12V20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="48" r="3" fill="#fff"/></svg>
  </div>
  <div class="brand"><b>合璧OS HeBi OS 5.0 LTS</b><span>网页安装向导 · HTML WEB INSTALLER</span></div>
  <div class="ver">演示模式 · 不写磁盘</div>
</header>

<div class="rail" id="rail"></div>

<main>
  <section class="step" id="sQuick">
    <div class="card quick">
      <div class="quick-hero">
        <h1>准备安装 <span class="em">合璧OS</span></h1>
        <p class="lead">默认配置已为您就绪 — 点击「立即安装」即刻开始，无需逐步设置。</p>
      </div>
      <div class="alert warn"><div class="ai">⚠</div>
        <div><b>当前为演示模式</b> — 磁盘列表与安装进度均为模拟数据，全程不会写入任何磁盘。<br>
        真实安装请从合璧OS 安装介质启动后，使用「网页安装」或「图形化安装」。</div></div>
      <div class="quick-grid" id="quickGrid"></div>
      <div class="alert err" id="quickErr" style="display:none"><div class="ai">✗</div>
        <div><b>无法开始安装</b> — <span class="qe"></span></div></div>
      <div class="quick-actions">
        <button class="qbtn-main" id="btnQuickInstall">立即安装 ⚡</button>
        <button class="qbtn-sub" id="btnQuickCustom">自定义安装（高级）</button>
      </div>
      <p class="quick-note">💡 快速安装将使用：第一块磁盘 · 自动分区（UEFI+BIOS 双模）· 交换分区按容量自动 · 用户 hebios · 简体中文 · 中国标准时间</p>
    </div>
  </section>

  <section class="step" id="s0">
    <div class="card">
      <h1>欢迎使用 <span class="em">合璧OS</span></h1>
      <p class="lead">珠联璧合 — 融 Linux 内核，承 Windows 体验。<br>
      本向导将引导您在所选磁盘上完成合璧OS 5.0 LTS「Jade」的安装。<br>
      <span class="gray">安装过程会格式化目标磁盘，请提前备份重要数据。</span></p>
      <div class="alert warn"><div class="ai">⚠</div>
        <div><b>当前为演示模式</b> — 磁盘列表与安装进度均为模拟数据，全程不会写入任何磁盘。<br>
        真实安装请从合璧OS 安装介质启动后，使用「网页安装」或「图形化安装」。</div></div>
      <div class="field">
        <label>选择安装过程中使用的语言</label>
        <div class="opts c2" id="langOpts">
          <div class="opt sel" data-v="zh_CN"><div class="ico">🀄</div><div><div class="t">简体中文</div><div class="d">推荐 · 中文用户首选</div></div></div>
          <div class="opt" data-v="en_US"><div class="ico">EN</div><div><div class="t">English</div><div class="d">Use English during installation</div></div></div>
          <div class="opt" data-v="ja_JP"><div class="ico">🇯🇵</div><div><div class="t">日本語</div><div class="d">インストール中に日本語を使用</div></div></div>
          <div class="opt" data-v="zh_TW"><div class="ico">🀇</div><div><div class="t">繁體中文</div><div class="d">安裝過程使用繁體中文</div></div></div>
        </div>
      </div>
    </div>
  </section>

  <section class="step" id="s1">
    <div class="card">
      <h1>最终用户许可协议</h1>
      <p class="lead">安装前请仔细阅读并同意《合璧OS 最终用户许可协议》，其中包含安装风险告知与担保责任限制。</p>
      <div class="eula" id="eulaBox"></div>
      <div class="cbox" id="ck1"><div class="box">✓</div><div>我已阅读、理解并同意本协议全部条款</div></div>
      <div class="cbox" id="ck2"><div class="box">✓</div><div>我已知悉：安装将格式化目标磁盘，磁盘上的数据将被永久删除且不可恢复</div></div>
    </div>
  </section>

  <section class="step" id="s2">
    <div class="card">
      <h1>选择安装磁盘</h1>
      <p class="lead">选择要安装合璧OS 的磁盘。<b style="color:var(--warn)">该磁盘将被分区并格式化，原有数据全部删除。</b></p>
      <div id="diskList" class="disks"></div>
      <div id="diskEmpty" style="display:none" class="alert err"><div class="ai">✗</div>
        <div><b>未检测到可安装磁盘</b><br>请检查虚拟机磁盘控制器（virtio / SATA / NVMe）或物理硬盘数据线与电源连接。</div></div>
      <div id="diskWarn" style="display:none" class="alert warn"><div class="ai">⚠</div>
        <div>所选磁盘上已存在分区表与数据，安装开始后这些数据将<b>永久丢失且不可恢复</b>。</div></div>
    </div>
  </section>

  <section class="step" id="s3">
    <div class="card">
      <h1>分区与文件系统</h1>
      <p class="lead">选择分区方式、根分区文件系统与交换分区大小。</p>
      <div class="field">
        <label>分区方式</label>
        <div class="opts c2" id="modeOpts">
          <div class="opt sel" data-v="auto"><div class="ico">💽</div><div><div class="t">自动分区 — 使用整个磁盘</div><div class="d">创建 MBR 分区表：swap + 根分区，传统 BIOS 启动</div></div></div>
          <div class="opt" data-v="auto_uefi"><div class="ico">🚀</div><div><div class="t">自动分区 — UEFI 方案</div><div class="d">GPT：ESP(512M) + BIOS 引导(2M) + swap + 根分区，UEFI 与 BIOS 双模启动</div><span class="tag">推荐</span></div></div>
          <div class="opt" data-v="manual"><div class="ico">🛠</div><div><div class="t">手动分区</div><div class="d">自定义根分区大小（GPT 四分区布局），高级用户</div></div></div>
          <div class="opt" data-v="lvm"><div class="ico">📚</div><div><div class="t">自动分区 + LVM</div><div class="d">逻辑卷管理，可在线扩展（安装后配置）</div></div></div>
        </div>
      </div>
      <div class="field">
        <label>根分区文件系统（将被格式化）</label>
        <div class="opts c3" id="fsOpts">
          <div class="opt sel" data-v="ext4"><div class="ico">📁</div><div><div class="t">ext4</div><div class="d">稳定通用，推荐</div></div></div>
          <div class="opt" data-v="btrfs"><div class="ico">🧊</div><div><div class="t">btrfs</div><div class="d">支持快照与压缩</div></div></div>
          <div class="opt" data-v="xfs"><div class="ico">⚡</div><div><div class="t">xfs</div><div class="d">大文件高性能</div></div></div>
        </div>
      </div>
      <div class="grid2">
        <div class="field">
          <label>交换分区 (swap) 大小 — <b id="swapVal" style="color:var(--acc)">2048</b> MB</label>
          <input type="range" id="swapRng" min="128" max="16384" step="128" value="2048" style="width:100%;accent-color:var(--acc)">
          <div class="hint">建议：内存 ≤ 2GB 时设为 2048MB；大内存机器可适当减小</div>
          <div class="hint" id="swapCapHint" style="display:none;color:var(--warn)"></div>
        </div>
        <div class="field" id="rootSizeField" style="display:none">
          <label>根分区大小（仅手动分区）</label>
          <input type="text" id="rootSize" value="100%" placeholder="例如 30720 或 100%">
          <div class="hint">可用 MB 或百分比；留空 / 100% 表示使用剩余全部空间</div>
        </div>
      </div>
    </div>
  </section>

  <section class="step" id="s4">
    <div class="card">
      <h1>用户账户</h1>
      <p class="lead">创建管理员账户。该账户将拥有系统管理权限，并用于登录桌面环境。</p>
      <div class="field">
        <label>用户名</label>
        <input type="text" id="inUser" value="hebios" placeholder="例如 hebios">
        <div class="hint" id="userHint">小写字母、数字，建议以字母开头</div>
      </div>
      <div class="grid2">
        <div class="field">
          <label>密码</label>
          <input type="password" id="inPass" placeholder="请输入密码">
        </div>
        <div class="field">
          <label>确认密码</label>
          <input type="password" id="inPass2" placeholder="请再次输入密码">
        </div>
      </div>
      <div class="field">
        <label>计算机名称</label>
        <input type="text" id="inHost" value="hebios-pc" placeholder="例如 hebios-pc">
        <div class="hint">该名称将显示在局域网与系统信息中</div>
      </div>
      <div class="alert info"><div class="ai">🔐</div><div>密码将通过加密方式写入已安装系统的账户数据库；若留空，用户将无需密码即可登录。</div></div>
    </div>
  </section>

  <section class="step" id="s5">
    <div class="card">
      <h1>通用驱动</h1>
      <p class="lead">选择随系统安装的通用驱动（安装后可在「驱动管理器」中增删）。</p>
      <div class="checks" id="drvOpts">
        <div class="chk sel" data-v="gpu"><div class="box">✓</div><div><div class="t">显卡驱动</div><div class="d">Virtio / VMware / 通用帧缓冲</div></div></div>
        <div class="chk sel" data-v="net"><div class="box">✓</div><div><div class="t">网卡驱动</div><div class="d">Intel / Realtek / virtio-net</div></div></div>
        <div class="chk sel" data-v="audio"><div class="box">✓</div><div><div class="t">音频驱动</div><div class="d">Intel HDA / AC97</div></div></div>
        <div class="chk sel" data-v="usb"><div class="box">✓</div><div><div class="t">USB 驱动</div><div class="d">xHCI / EHCI / 大容量存储</div></div></div>
        <div class="chk" data-v="print"><div class="box">✓</div><div><div class="t">打印驱动</div><div class="d">CUPS / IPP / AirPrint</div></div></div>
        <div class="chk" data-v="bt"><div class="box">✓</div><div><div class="t">蓝牙驱动</div><div class="d">BlueZ 5.x</div></div></div>
      </div>
    </div>
  </section>

  <section class="step" id="s6">
    <div class="card">
      <h1>确认安装信息</h1>
      <p class="lead">请核对以下安装信息，点击「开始安装」后不可更改。</p>
      <div class="alert warn"><div class="ai">⚠⚠⚠</div>
        <div><b>格式化警告</b> — /dev/<span id="cfDisk"></span> 上的所有数据将被永久删除且不可恢复！</div></div>
      <div class="sum" id="sumBox"></div>
    </div>
  </section>

  <section class="step" id="s7">
    <div class="card">
      <h1>正在安装合璧OS <span style="font-size:15px;color:var(--warn)">（演示）</span></h1>
      <div class="pwrap">
        <div class="pct"><span id="pctNum">0</span><small>%</small></div>
        <div class="pmsg" id="pmsg">正在准备安装 ...</div>
        <div class="bar"><div class="fill" id="pfill"></div></div>
      </div>
      <div class="logbox" id="logBox"></div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:16px">
        <span class="tip" id="elapsed">已用时间 00:00</span>
        <div class="spacer"></div>
        <button class="btn danger" id="btnAbort">中止安装</button>
      </div>
      <div id="instErr" style="display:none" class="alert err"><div class="ai">✗</div>
        <div><b>安装失败</b><br><span id="errMsg"></span><br><span class="gray" style="font-size:12px">演示模式 — 未连接真实安装服务，无日志写入</span></div></div>
    </div>
  </section>

  <section class="step" id="s8">
    <div class="card">
      <div class="done-hero">
        <div class="done-mark"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5 5L20 7" stroke="#34d399" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <h1>安装成功</h1>
        <p class="lead" style="margin-bottom:6px">恭喜！合璧OS 已成功安装到您的计算机。</p>
      </div>
      <div class="sum" id="doneBox"></div>
      <div class="alert info"><div class="ai">💡</div>
        <div>演示模式 — 以上安装结果为模拟数据，未写入任何磁盘。<br>
        真实安装完成后，计算机重启后请取出安装介质，系统将从硬盘启动；<br>
        如需修复系统引导，可从安装介质选择「固件修复模式」。</div></div>
    </div>
  </section>
</main>

<footer>
  <button class="btn ghost" id="btnBack">← 上一步</button>
  <button class="btn primary" id="btnNext">下一步 →</button>
  <div class="spacer"></div>
  <span class="tip" id="footTip"></span>
</footer>

<script>
"use strict";
var STEPS = ["欢迎","许可协议","安装磁盘","分区设置","用户账户","通用驱动","确认安装","正在安装","安装完成"];
var S = {
  step: 0, lang: "zh_CN", disk: null, diskMeta: {},
  mode: "auto_uefi", fs: "ext4", swap: 2048, rootSize: "100%",
  user: "hebios", pass: "", host: "hebios-pc",
  drivers: ["gpu","net","audio","usb"],
  disks: [], started: 0, pollT: null, logT: null, elapsedT: null, finished: false,
  quick: false
};
function $(id){ return document.getElementById(id); }
function esc(t){ return String(t==null?"":t).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

var EULA = [
"                合璧OS HeBi OS 5.0 LTS「Jade」",
"                  最终用户许可协议 (EULA)",
"              © 2026 珠联璧合工作室 (HeBi OS Project)",
"",
"  重要提示 — 请仔细阅读本协议全部条款。安装、复制或使用合璧OS",
"  （以下简称\\"本软件\\"）即表示您已阅读、理解并同意接受本协议",
"  各项条款的约束。若您不同意其中任何条款，请立即终止安装并删",
"  除本软件的全部副本。",
"",
"  一、软件许可",
"  1.1 珠联璧合工作室授予您在一台或多台计算机上安装、使用本软",
"      件的非独占、不可转让许可，用于个人、商业或教育目的。",
"  1.2 本软件基于 Linux 6.8 LTS 内核，内核部分遵循 GPL-2.0；",
"      桌面环境、开机动画、fbsplash、hbpm 包管理器及自研应用",
"      遵循 GPL-3.0-or-later。相应源代码随发行镜像提供。",
"",
"  二、兼容性与第三方组件",
"  2.1 本软件包含对 .deb / .exe / .msi / .mdn 安装格式的支持，",
"      并集成 Wine 兼容层以运行部分 Windows 程序。第三方程序",
"      的许可由其各自作者授予，与本协议无关。",
"  2.2 应用商店所列网络源（Flathub、Snap Store、AUR、Deepin",
"      应用商店、AppImage Hub、Nixpkgs 等）内容由各社区维护，",
"      本工作室不对其可用性、安全性作任何担保。",
"  2.3 本软件附带 Segoe UI / 微软雅黑字体兼容替换方案",
"      （Noto Sans CJK SC 等开源字体），相关商标归其权利人所有。",
"",
"  三、数据与隐私",
"  3.1 本软件为离线优先设计，默认不收集、不上传任何用户数据。",
"  3.2 系统修复与备份功能仅在本地执行；云同步（如启用）采用端",
"      到端加密，密钥由用户本地保管。",
"",
"  四、担保责任限制",
"  4.1 本软件按\\"现状\\"提供。在适用法律允许的最大范围内，本工",
"      作室明示否认任何明示或默示的担保，包括但不限于适销性、",
"      特定用途适用性及不侵权的担保。",
"  4.2 在任何情况下，本工作室均不对因使用或无法使用本软件而",
"      导致的任何直接、间接、附带、特殊或后果性损害（包括但不",
"      限于数据丢失、利润损失、业务中断）承担责任，即使已被告",
"      知此类损害的可能性。",
"",
"  五、安装风险告知",
"  5.1 安装过程将对目标磁盘进行分区与格式化，该磁盘上的全部",
"      现有数据将被永久删除且不可恢复。请在安装前备份重要数据。",
"  5.2 请勿在含有重要数据或正在运行其他操作系统的磁盘上直接",
"      安装，除非您已明确知晓并接受数据丢失的后果。",
"",
"  六、协议终止",
"  6.1 若您违反本协议任何条款，本许可自动终止，您须立即停止",
"      使用并销毁本软件全部副本。",
"  6.2 本协议受中华人民共和国法律管辖。",
"",
"  七、开源致谢",
"  本软件凝聚以下开源项目之心血：Linux、busybox、GRUB、Wine、",
"  GNU Coreutils、util-linux、e2fsprogs、Noto Fonts 等。",
"  感谢全球开源社区。"
].join("\\n");

async function api(params){
  var r = await fetch("/cgi-bin/api?" + new URLSearchParams(params), {cache:"no-store"});
  if(!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

function renderRail(){
  $("rail").innerHTML = STEPS.map(function(n,i){
    var cls = "node";
    if(i < S.step) cls += " done";
    else if(i === S.step) cls += " active";
    var dot = i < S.step ? "✓" : (i+1);
    return '<div class="'+cls+'"><div class="dot">'+dot+'</div><div class="lbl">'+n+'</div></div>';
  }).join("");
}

/* ============ 快速安装 (打开即装 · Deepin 风格) ============ */
var QUICK_STEP = -1;
function showQuick(){
  S.step = QUICK_STEP;
  document.querySelectorAll(".step").forEach(function(el){ el.classList.remove("on"); });
  $("sQuick").classList.add("on");
  $("rail").innerHTML = '<div class="node active"><div class="dot">⚡</div><div class="lbl">快速安装</div></div>';
  $("btnBack").style.visibility = "hidden";
  var next = $("btnNext");
  next.style.display = "none";
  $("footTip").textContent = "快速安装 — 默认配置一键装机；需要逐步设置请点「自定义安装」";
  window.scrollTo({top:0, behavior:"smooth"});
  renderQuick();
}
function renderQuick(){
  var items = [
    ["🀄","安装语言","简体中文（zh_CN.UTF-8）"],
    ["🕐","时区 / 区域","中国标准时间 · Asia/Shanghai"],
    ["⌨","键盘布局","中文（us 布局 + 中文输入法）"],
    ["💽","安装磁盘","自动选择第一块可用磁盘"],
    ["📦","分区方式","自动分区 · GPT（UEFI+BIOS 双模）"],
    ["🔄","交换分区","按磁盘容量自动（≤ 25%）"],
    ["👤","用户账户","hebios（管理员账户）"],
    ["🧩","通用驱动","显卡 / 网络 / 声卡 / USB 全选"]
  ];
  $("quickGrid").innerHTML = items.map(function(x){
    return '<div class="qi"><div class="qii">'+x[0]+'</div><div><div class="qit">'+x[1]+'</div><div class="qid">'+x[2]+'</div></div></div>';
  }).join("");
}
async function quickInstall(){
  var btn = $("btnQuickInstall");
  var err = $("quickErr");
  err.style.display = "none";
  btn.disabled = true; btn.textContent = "正在准备 ...";
  try{
    var d = await api({op:"disks"});
    var disks = d.disks || [];
    if(!disks.length){
      err.querySelector(".qe").textContent = "未检测到可安装磁盘。真实安装请检查磁盘控制器；演示模式请刷新页面重试。";
      err.style.display = "";
      btn.disabled = false; btn.textContent = "立即安装 ⚡";
      return;
    }
    S.disk = disks[0].dev;
    S.diskMeta = disks[0];
    var diskMB = Math.round(parseFloat(S.diskMeta.size || 0) * 1024);
    var maxSwap = Math.max(128, Math.min(16384, Math.floor(diskMB / 4)));
    S.swap = Math.min(2048, maxSwap);
    S.lang = "zh_CN"; S.mode = "auto_uefi"; S.fs = "ext4";
    S.user = "hebios"; S.pass = ""; S.host = "hebios-pc";
    S.drivers = ["gpu","net","audio","usb"];
    S.quick = true;
    $("inUser").value = S.user; $("inHost").value = S.host;
    $("inPass").value = ""; $("inPass2").value = "";
    show(7); startInstall();
  }catch(e){
    err.querySelector(".qe").textContent = e.message;
    err.style.display = "";
    btn.disabled = false; btn.textContent = "立即安装 ⚡";
  }
}

function show(n){
  S.step = n;
  // 注意: 必须按 ID 定位而非 querySelectorAll 索引 —— #sQuick (快速安装页)
  // 也是 .step, 会让后续步骤索引整体偏移。
  document.querySelectorAll(".step").forEach(function(el){ el.classList.remove("on"); });
  var el = document.getElementById("s" + n);
  if(el) el.classList.add("on");
  renderRail();
  $("btnBack").style.visibility = (n===0 || n===7) ? "hidden" : "visible";
  var next = $("btnNext");
  if(n === 7){ next.style.display = "none"; }
  else { next.style.display = ""; next.textContent = n===6 ? "开始安装 ⚡" : "下一步 →"; }
  next.disabled = !stepValid(n);
  $("footTip").textContent = ["语言选择将记录到安装日志","必须同意协议才能继续","","","密码可留空","","","",""][n] || "";
  window.scrollTo({top:0, behavior:"smooth"});
  if(n === 2) loadDisks();
  if(n === 6) renderSummary();
}
function stepValid(n){
  switch(n){
    case 0: return !!S.lang;
    case 1: return $("ck1").classList.contains("sel") && $("ck2").classList.contains("sel");
    case 2: return !!S.disk;
    case 4: {
      var u = $("inUser").value.trim(), p1 = $("inPass").value, p2 = $("inPass2").value;
      var okU = /^[a-z_][a-z0-9_-]*$/.test(u);
      var okP = (p1 === p2);
      $("userHint").classList.toggle("bad", !okU);
      $("userHint").textContent = okU ? "小写字母、数字，建议以字母开头" : "用户名需以小写字母或下划线开头，仅含小写字母/数字/-/_";
      return okU && okP && !!$("inHost").value.trim();
    }
    default: return true;
  }
}
function bindOpts(containerId, key, isMulti){
  var box = $(containerId);
  box.addEventListener("click", function(e){
    var item = e.target.closest(".opt,.chk");
    if(!item) return;
    var v = item.dataset.v;
    if(isMulti){
      item.classList.toggle("sel");
      S[key] = Array.prototype.slice.call(box.querySelectorAll(".sel")).map(function(x){ return x.dataset.v; });
    } else {
      box.querySelectorAll(".opt,.chk").forEach(function(x){ x.classList.remove("sel"); });
      item.classList.add("sel");
      S[key] = v;
    }
    $("btnNext").disabled = !stepValid(S.step);
  });
}
function bindCbox(id){
  $(id).addEventListener("click", function(){ this.classList.toggle("sel"); $("btnNext").disabled = !stepValid(S.step); });
}

async function loadDisks(){
  var box = $("diskList");
  box.innerHTML = '<div class="alert info"><div class="ai">⏳</div><div>正在检测磁盘 ...</div></div>';
  try{
    var d = await api({op:"disks"});
    S.disks = d.disks || [];
    if(!S.disks.length){
      box.innerHTML = "";
      $("diskEmpty").style.display = "";
      return;
    }
    $("diskEmpty").style.display = "none";
    box.innerHTML = S.disks.map(function(x){
      var parts = (x.parts||[]).length
        ? '<div class="parts">现有分区: ' + x.parts.map(function(p){ return p.dev + ' (' + p.size + 'GB)'; }).join(' · ') + '</div>' : '';
      return '<div class="disk" data-v="'+esc(x.dev)+'">'
        + '<div class="dico">💽</div>'
        + '<div style="min-width:0"><div class="dname">/dev/'+esc(x.dev)+'</div>'
        + '<div class="dmeta">'+esc(x.model||"磁盘")+parts+'</div></div>'
        + '<div class="dsize"><b>'+esc(x.size)+'</b><span>GB</span></div>'
        + '</div>';
    }).join("");
    box.querySelectorAll(".disk").forEach(function(el){
      el.addEventListener("click", function(){
        box.querySelectorAll(".disk").forEach(function(x){ x.classList.remove("sel"); });
        el.classList.add("sel");
        S.disk = el.dataset.v;
        S.diskMeta = S.disks.find(function(x){ return x.dev===S.disk; }) || {};
        $("diskWarn").style.display = (S.diskMeta.parts||[]).length ? "" : "none";
        // swap 滑块随磁盘容量收紧 (与服务端钳制同规则: ≤25% 磁盘容量),
        // 避免小磁盘上滑块给出装不下的 swap 值 (sfdisk 会静默建 0 扇区
        // 分区导致安装失败); 服务端仍有一道权威兜底。
        var diskMB = Math.round(parseFloat(S.diskMeta.size || 0) * 1024);
        var maxSwap = Math.max(128, Math.min(16384, Math.floor(diskMB / 4)));
        $("swapRng").max = maxSwap;
        if (S.swap > maxSwap) { S.swap = maxSwap; $("swapRng").value = maxSwap; }
        $("swapVal").textContent = S.swap;
        var hint = $("swapCapHint");
        if (hint) {
          if (maxSwap < 16384) {
            hint.style.display = "";
            hint.textContent = "已按磁盘容量收紧：本磁盘 " + diskMB + "MB，交换分区上限 " + maxSwap + "MB（≤ 磁盘容量 25%）";
          } else { hint.style.display = "none"; }
        }
        $("btnNext").disabled = false;
      });
    });
    if(S.disks.length === 1) box.querySelector(".disk").click();
  }catch(err){
    box.innerHTML = '<div class="alert err"><div class="ai">✗</div><div>无法连接安装服务：'+esc(err.message)+'<br>请确认网页安装服务正在运行，然后刷新页面。</div></div>';
  }
}

function renderSummary(){
  $("cfDisk").textContent = S.disk || "";
  var modeName = {auto:"自动分区 (MBR · BIOS)", auto_uefi:"自动分区 (GPT · UEFI+BIOS 双模)", manual:"手动分区 (GPT)", lvm:"自动分区 + LVM"}[S.mode];
  var rows = [
    ["目标磁盘", "/dev/" + (S.disk||""), "mono"],
    ["磁盘容量", (S.diskMeta.size||"?") + " GB", ""],
    ["分区方式", modeName, ""],
    ["根分区文件系统", S.fs, "mono"],
    ["交换分区", S.swap + " MB", ""],
    ["用户名", S.user, ""],
    ["计算机名称", S.host, ""],
    ["通用驱动", (S.drivers.join("、") || "无"), ""],
  ];
  $("sumBox").innerHTML = rows.map(function(r){ return '<div class="r"><div class="k">'+r[0]+'</div><div class="v '+r[2]+'">'+esc(r[1])+'</div></div>'; }).join("");
}

function fmtT(s){ return String(Math.floor(s/60)).padStart(2,"0") + ":" + String(s%60).padStart(2,"0"); }
async function startInstall(){
  if(!S.disk) return;
  S.started = Date.now();
  $("btnNext").disabled = true;
  $("elapsed").textContent = "已用时间 00:00";
  $("pctNum").textContent = "0"; $("pfill").style.width = "0%";
  $("logBox").textContent = "";
  $("instErr").style.display = "none";
  S.elapsedT = setInterval(function(){ $("elapsed").textContent = "已用时间 " + fmtT(Math.floor((Date.now()-S.started)/1000)); }, 1000);
  try{
    var r = await api({
      op:"install", target:S.disk, mode:S.mode, fs:S.fs, swap:S.swap,
      user:$("inUser").value.trim(), pass:$("inPass").value,
      host:$("inHost").value.trim(), drivers:S.drivers.join(",")
    });
    if(!r.ok){ throw new Error(r.error || "启动失败"); }
  }catch(err){
    clearInterval(S.elapsedT);
    $("instErr").style.display = ""; $("instErr").querySelector(".ai").textContent = "✗";
    $("errMsg").textContent = err.message;
    $("pmsg").textContent = "安装未能启动";
    return;
  }
  S.pollT = setInterval(pollProgress, 900);
  S.logT = setInterval(pollLog, 2500);
}
async function pollProgress(){
  try{
    var r = await api({op:"progress"});
    if(r.running){
      $("pctNum").textContent = r.pct;
      $("pfill").style.width = r.pct + "%";
      $("pmsg").textContent = r.msg || "正在安装 ...";
    } else {
      clearInterval(S.pollT); clearInterval(S.logT); clearInterval(S.elapsedT);
      if(r.ok){ finishInstall(r); }
      else {
        $("pctNum").textContent = "0"; $("pfill").style.width = "0%";
        $("pmsg").textContent = "安装已中止";
        $("instErr").style.display = "";
        $("errMsg").textContent = r.msg || "未知原因";
      }
    }
  }catch(err){ }
}
async function pollLog(){
  try{
    var r = await api({op:"log", n:40});
    if(r.ok && r.log){
      var box = $("logBox");
      var atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 30;
      box.textContent = r.log;
      if(atBottom) box.scrollTop = box.scrollHeight;
    }
  }catch(err){}
}
function finishInstall(r){
  S.finished = true;
  var rows = [
    ["安装位置", r.root + " (" + r.fs + ")", "mono"],
    ["引导模式", r.boot, ""],
    r.esp && r.esp !== "/dev/" ? ["EFI 系统分区", r.esp, "mono"] : null,
    ["用户名", r.user, ""],
    ["计算机名称", r.host, ""],
  ].filter(Boolean);
  $("doneBox").innerHTML = rows.map(function(x){ return '<div class="r"><div class="k">'+x[0]+'</div><div class="v '+x[2]+'">'+esc(x[1])+'</div></div>'; }).join("");
  show(8);
  if(S.quick){
    $("rail").innerHTML = '<div class="node done"><div class="dot">✓</div><div class="lbl">快速安装完成</div></div>';
  }
  $("btnNext").textContent = "重启进入合璧OS ⟳";
  $("btnNext").disabled = false;
  $("btnNext").onclick = doReboot;
}
function doReboot(){
  $("btnNext").disabled = true;
  $("btnNext").textContent = "演示模式 · 不会真实重启";
  $("footTip").textContent = "演示模式 — 系统不会真实重启。真实安装请从合璧OS 安装介质启动（GRUB 菜单选择「网页安装」或「图形化安装」）。";
}

bindOpts("langOpts", "lang");
bindOpts("modeOpts", "mode");
bindOpts("fsOpts", "fs");
bindOpts("drvOpts", "drivers", true);
bindCbox("ck1"); bindCbox("ck2");

$("modeOpts").addEventListener("click", function(){
  $("rootSizeField").style.display = S.mode === "manual" ? "" : "none";
});
$("swapRng").addEventListener("input", function(){
  S.swap = parseInt(this.value, 10);
  $("swapVal").textContent = S.swap;
});
["inUser","inPass","inPass2","inHost"].forEach(function(id){
  $(id).addEventListener("input", function(){
    S.user = $("inUser").value.trim();
    S.pass = $("inPass").value;
    S.host = $("inHost").value.trim();
    $("btnNext").disabled = !stepValid(4);
  });
});

$("btnBack").addEventListener("click", function(){ if(S.step > 0) show(S.step - 1); });
$("btnNext").addEventListener("click", function(){
  if(S.step === 7) return;
  if(!stepValid(S.step)){
    document.querySelector(".step.on .card").classList.add("shake");
    setTimeout(function(){ document.querySelector(".step.on .card").classList.remove("shake"); }, 450);
    return;
  }
  if(S.step === 6){ show(7); startInstall(); return; }
  show(S.step + 1);
});
$("btnAbort").addEventListener("click", function(){
  if(!confirm("确定要中止安装吗？\\n中止时磁盘可能处于未完成的分区/格式化状态。")) return;
  api({op:"abort"}).then(function(){
    $("pmsg").textContent = "已发送中止请求 ...";
  }).catch(function(){});
});

$("eulaBox").textContent = EULA;
$("btnQuickInstall").addEventListener("click", quickInstall);
$("btnQuickCustom").addEventListener("click", function(){ show(0); });
showQuick();
<\/script>
<script>
/* ==================== 桌面内嵌演示 · Mock 后端 ====================
 * 覆盖 window.api: 假磁盘列表 + 模拟安装时间线 + 假日志,
 * 不发起任何网络请求, 不触碰真实磁盘。
 * swap 钳制规则与安装核心 hebi-install-lib.sh 完全一致。 */
(function(){
"use strict";
var MOCK_DISKS = [
  { dev:"vda", model:"QEMU HARDDISK · 演示磁盘", size:"64.0",
    parts:[{dev:"vda1", size:"0.5"},{dev:"vda2", size:"63.5"}] },
  { dev:"vdb", model:"SanDisk Cruzer · 演示磁盘", size:"4.0", parts:[] }
];
var DEMO_SECONDS = 24;
var TIMELINE = [
  [4,"正在准备安装环境 ..."], [10,"正在写入分区表 ..."],
  [18,"正在格式化 EFI 系统分区 ..."], [26,"正在创建交换分区 ..."],
  [36,"正在格式化根分区 ..."], [52,"正在复制系统文件 ..."],
  [66,"正在写入系统配置 ..."], [76,"正在安装 GRUB 引导程序 ..."],
  [86,"正在生成 initramfs ..."], [94,"正在创建用户账户 ..."],
  [100,"安装完成"]
];
var t0 = 0, aborted = false, LOG_LINES = [], CLAMP = null;
var sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };

/* swap 容量钳制 — 与 hebi-install-lib.sh 同规则 (演示镜像):
   swap ≤ 磁盘总量 25%, 且至少给根分区留 1GiB (GPT 方案另需
   ESP 512MiB + bios-boot 2MiB); 下限 128MB。
   背景: sfdisk 脚本模式下请求装不下时不报错, 静默建 0 扇区
   分区 → mkswap 失败 → 安装中止。 */
function clampSwap(){
  var diskMB = Math.round(parseFloat((S.diskMeta && S.diskMeta.size) || 0) * 1024);
  if (!diskMB) return null;
  var reserve = (S.mode === "auto") ? 1024 : 1536;
  var maxSwap = Math.floor(diskMB / 4);
  if (diskMB - reserve < maxSwap) maxSwap = diskMB - reserve;
  if (maxSwap < 128) maxSwap = 128;
  if (S.swap > maxSwap){
    var c = { from: S.swap, to: maxSwap, diskMB: diskMB };
    S.swap = maxSwap;
    return c;
  }
  return null;
}
function buildLog(clamp){
  var mbr = (S.mode === "auto");
  var swapDev = "/dev/" + S.disk + (mbr ? "1" : "3");
  var rootDev = "/dev/" + S.disk + (mbr ? "2" : "4");
  var L = [
    "[ 0.001] hebios-webinst: demo mode — no real disk write",
    "[ 0.312] disk scan: /dev/vda 64.0GB (2 parts) · /dev/vdb 4.0GB",
    "[ 1.205] target=/dev/" + S.disk + " mode=" + S.mode + " fs=" + S.fs + " swap=" + S.swap + "MB",
    "[ 1.610] sfdisk: " + (mbr ? "MBR" : "GPT") + " on /dev/" + S.disk
      + (mbr ? " (swap + root)" : " (ESP 512M + bios_grub 2M + swap + root)")
  ];
  if (!mbr) L.push("[ 2.205] mkfs.vfat -F 32 /dev/" + S.disk + "1 (ESP)");
  if (clamp) L.push("[ 2.640] swap 由 " + clamp.from + "MB 钳制为 " + clamp.to + "MB (磁盘 " + clamp.diskMB + "MB)");
  L.push("[ 3.118] mkswap " + swapDev + " " + S.swap + "M");
  L.push("[ 4.902] mkfs.ext4 -F " + rootDev);
  L.push("[ 8.771] copy rootfs: 18 packages · 30 kernel modules");
  L.push("[12.640] write fstab · hostname " + S.host);
  L.push("[15.330] grub-install --target=x86_64-efi --efi-directory=/boot/efi");
  L.push("[17.204] grub-install --target=i386-pc /dev/" + S.disk + " (BIOS fallback)");
  L.push("[19.577] generate initramfs (gzip -2)");
  L.push("[21.940] create user " + S.user + " · hostname " + S.host);
  L.push("[23.855] sync — demo install finished ok");
  return L;
}

window.api = async function(params){
  var op = params.op;
  if(op === "disks"){ await sleep(450); return { disks: MOCK_DISKS }; }
  if(op === "install"){
    t0 = Date.now(); aborted = false;
    CLAMP = clampSwap();
    LOG_LINES = buildLog(CLAMP);
    await sleep(250); return { ok:true };
  }
  if(op === "progress"){
    await sleep(100);
    if(aborted) return { running:false, ok:false, msg:"演示已中止（未写入任何磁盘）" };
    var el = (Date.now() - t0) / 1000;
    var pct = Math.max(0, Math.min(100, Math.round(el / DEMO_SECONDS * 100)));
    if(pct >= 100){
      var mbr = (S.mode === "auto");
      return { running:false, ok:true,
        root: "/dev/" + S.disk + (mbr ? "2" : "4"),
        fs: S.fs,
        boot: mbr ? "传统 BIOS (MBR)" : "UEFI + BIOS 双模",
        esp: mbr ? "/dev/" : "/dev/" + S.disk + "1",
        user: S.user, host: S.host };
    }
    var msg = "正在安装 ...";
    for(var i = 0; i < TIMELINE.length; i++) if(pct >= TIMELINE[i][0]) msg = TIMELINE[i][1];
    return { running:true, pct: pct, msg: msg };
  }
  if(op === "log"){
    var n = Math.floor((Date.now() - t0) / 1800) + 1;
    return { ok:true, log: LOG_LINES.slice(0, Math.min(LOG_LINES.length, n)).join("\\n") };
  }
  if(op === "abort"){ aborted = true; await sleep(150); return { ok:true }; }
  if(op === "reboot"){ await sleep(200); return { ok:false, error:"演示模式不会真实重启" }; }
  return { ok:false, error:"演示模式: 未知操作 " + op };
};

function banner(){
  var v = document.querySelector("header .ver");
  if(v) v.textContent = "演示模式 · 不写磁盘";
}
if(document.readyState === "loading") window.addEventListener("DOMContentLoaded", banner);
else banner();

/* 父桌面关闭窗口时清理轮询定时器 (postMessage 通知) */
window.addEventListener("message", function(e){
  if (e.data && e.data.hbInstallCleanup && typeof S !== "undefined"){
    if (S.pollT) clearInterval(S.pollT);
    if (S.logT) clearInterval(S.logT);
    if (S.elapsedT) clearInterval(S.elapsedT);
  }
});
})();
<\/script>
</body>
</html>`;

  HB.registerApp({
    id: "install", name: "系统安装", icon: "install",
    w: 980, h: 720, showInStart: true,
    keywords: "install 安装 装机 系统安装 重装",
    open: openInstall,
    onClose(win) {
      // 通知向导清理轮询定时器 (iframe 销毁亦会停止, 双保险)
      try {
        const f = win._frame;
        if (f && f.contentWindow) f.contentWindow.postMessage({ hbInstallCleanup: 1 }, "*");
      } catch (e) { /* 跨域或已销毁, 忽略 */ }
    },
  });

  function openInstall(win) {
    const frame = el("iframe", "inst-frame");
    frame.setAttribute("title", "合璧OS 网页安装向导 — 演示模式");
    frame.srcdoc = WIZARD_HTML;
    win.body.appendChild(frame);
    win._frame = frame;
    HB.toast("系统安装", "演示模式：不会写入任何磁盘。真实安装请从安装介质启动", "install");
  }
})();
