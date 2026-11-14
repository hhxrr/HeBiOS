#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
合璧OS 应用商店后台（HeBi Store Backend）
FastAPI + SQLite + 管理控制台
- 自研应用（.mdn 包）上架 / 下架 / 版本管理
- 网络软件源（Flathub / Snap / AUR / Deepin / AppImage / Nix / Wine / hbpm）开关
- .deb/.mdn 安装包上传与元数据解析（dpkg-deb -I）
- 统计看板
"""
import os
import re
import shutil
import sqlite3
import subprocess
import time
import zipfile
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE = Path(__file__).parent

# ---------------------------------------------------------------- 数据目录
# 开发模式(源码目录可写): 数据就在脚本旁 (store.db + packages/)
# 只读安装位置(如 deb 安装到 /usr/share/hebios/store-admin): 回退到
# 用户数据目录, 并在首次运行时从随包种子播种 (数据库 + 包仓库)
def _writable(p: Path) -> bool:
    try:
        p.mkdir(parents=True, exist_ok=True)
        t = p / ".wtest"
        t.write_text("1")
        t.unlink()
        return True
    except Exception:
        return False

DATA = BASE if _writable(BASE) else (
    Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share")) / "hebi-store-admin")

def _seed_from_package():
    """包安装模式首跑: 播种种子数据库与包仓库到用户数据目录"""
    tpl = BASE / "store.db.template"
    if not DB.exists() and tpl.exists():
        shutil.copy2(tpl, DB)
    seed_pkgs = BASE / "packages"
    PKG_DIR.mkdir(parents=True, exist_ok=True)
    if seed_pkgs.is_dir() and not any(PKG_DIR.iterdir()):
        for f in seed_pkgs.iterdir():
            shutil.copy2(f, PKG_DIR / f.name)

DB = DATA / "store.db"
PKG_DIR = DATA / "packages"
STATIC = BASE / "static"
PKG_DIR.mkdir(parents=True, exist_ok=True)
if DATA != BASE:
    _seed_from_package()

PORT = int(os.environ.get("HB_STORE_PORT", "8888"))

app = FastAPI(title="HeBi Store Backend", version="3.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ---------------------------------------------------------------- 数据库
SCHEMA = """
CREATE TABLE IF NOT EXISTS apps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  dev TEXT NOT NULL DEFAULT '珠联璧合工作室',
  desc TEXT NOT NULL DEFAULT '',
  icon TEXT DEFAULT '📦',
  category TEXT DEFAULT 'utils',
  version TEXT DEFAULT '1.0.0',
  size TEXT DEFAULT '',
  source TEXT DEFAULT 'self',          -- self / net
  net_origin TEXT DEFAULT '',          -- 网络源 id
  pkg_file TEXT DEFAULT '',            -- 包文件名
  downloads INTEGER DEFAULT 0,
  rating REAL DEFAULT 5.0,
  status TEXT DEFAULT 'published',     -- published / draft / offline
  created_at REAL, updated_at REAL
);
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, desc TEXT DEFAULT '', icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#2E7CF6', enabled INTEGER DEFAULT 1, count TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT, message TEXT, ts REAL
);
"""

def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c

def init_db():
    c = db()
    c.executescript(SCHEMA)
    if not c.execute("SELECT 1 FROM sources LIMIT 1").fetchone():
        c.executemany(
            "INSERT INTO sources (id,name,desc,icon,color,enabled,count) VALUES (?,?,?,?,?,?,?)",
            [
                ("hbpm", "合璧软件源 hbpm", "官方 deb/mdn 混合源 · 珠联璧合工作室维护", "💎", "#2E7CF6", 1, "326"),
                ("flathub", "Flathub", "全球最大 Linux Flatpak 应用仓库", "📦", "#4A86CF", 1, "2148"),
                ("snap", "Snap Store", "Canonical 官方 Snap 商店 · 沙箱化应用", "🧰", "#E74856", 1, "8532"),
                ("aur", "AUR", "Arch User Repository · 社区 PKGBUILD 源", "🏹", "#1793D1", 1, "92017"),
                ("deepin", "Deepin 应用商店", "深度科技商店镜像 · 中文生态精选", "🐬", "#00B4A6", 1, "3264"),
                ("appimage", "AppImage Hub", "免安装便携应用中心 · 即点即用", "📀", "#7A5AF8", 0, "1487"),
                ("nix", "Nixpkgs", "Nix 包集合 · 可复现构建", "❄️", "#5B6470", 0, "118540"),
                ("wine", "Wine 兼容库", "Windows .exe/.msi 兼容层 · 已内置 9.0", "🍷", "#A0522D", 1, "—"),
            ],
        )
    if not c.execute("SELECT 1 FROM apps LIMIT 1").fetchone():
        now = time.time()
        self_apps = [
            ("office-assistant", "办公助手 · 璧儿", "富文本办公套件：文档编辑、格式排版、导出 .hdoc/.docx", "📝", "utils", "1.2.0", "18.6 MB", "office-assistant_1.2.0_amd64.mdn", 12840, 5.0),
            ("voice-assistant", "语音助手 · 合合", "自然语言命令中枢：语音识别、系统控制、应用启动", "🎙️", "utils", "1.2.0", "12.4 MB", "voice-assistant_1.2.0_amd64.mdn", 9312, 4.9),
            ("hebi-files", "文件管理器 · 璧见", "双盘资源浏览器：快速访问、双视图、剪贴板、属性面板", "📁", "system", "3.0.1", "6.2 MB", "hebi-files_3.0.1_amd64.mdn", 15203, 4.8),
            ("hebi-music", "音乐播放器 · 聆璧", "终端音乐引擎：播放列表、频谱可视化、封面生成", "🎵", "sound", "2.4.0", "9.8 MB", "hebi-music_2.4.0_amd64.mdn", 7756, 4.7),
            ("hebi-terminal", "终端 · 璧行", "HeBi Shell 终端：文件管理、hbpm 包管理、系统信息", "⌨️", "system", "1.0.3", "2.1 MB", "hebi-terminal_1.0.3_amd64.mdn", 11045, 4.9),
            ("hebi-drivers", "驱动管理器", "通用驱动安装中心：显卡网卡声卡USB打印机一键安装", "🔧", "system", "1.1.0", "4.5 MB", "hebi-drivers_1.1.0_amd64.mdn", 6021, 4.6),
            ("logo-lab", "徽标设计器", "合璧徽标参数化生成 SVG/PNG，系统图标定制", "💠", "graphics", "0.9.5", "3.3 MB", "logo-lab_0.9.5_amd64.mdn", 3188, 4.4),
            ("hebi-backup", "系统备份工具", "整机快照与增量备份，恢复点管理", "🛡️", "system", "1.0.0", "8.7 MB", "hebi-backup_1.0.0_amd64.mdn", 4410, 4.5),
        ]
        c.executemany(
            "INSERT INTO apps (slug,name,desc,icon,category,version,size,source,pkg_file,downloads,rating,created_at,updated_at) VALUES (?,?,?,?,?,?,?, 'self', ?,?,?,?,?)",
            [(s, n, d, i, cat, v, sz, f, dl, r, now, now) for s, n, d, i, cat, v, sz, f, dl, r in self_apps],
        )
    c.commit()
    c.close()

init_db()

def log_event(kind: str, message: str):
    c = db()
    c.execute("INSERT INTO events (kind,message,ts) VALUES (?,?,?)", (kind, message, time.time()))
    c.commit(); c.close()

# ---------------------------------------------------------------- 模型
class AppIn(BaseModel):
    slug: str
    name: str
    dev: str = "珠联璧合工作室"
    desc: str = ""
    icon: str = "📦"
    category: str = "utils"
    version: str = "1.0.0"
    size: str = ""
    source: str = "self"
    net_origin: str = ""
    pkg_file: str = ""
    status: str = "published"

class SourceIn(BaseModel):
    name: str = ""
    desc: str = ""
    enabled: bool = True

# ---------------------------------------------------------------- API：应用
@app.get("/api/apps")
def list_apps(source: str = "", q: str = "", status: str = ""):
    sql = "SELECT * FROM apps WHERE 1=1"
    args = []
    if source:
        sql += " AND source=?"; args.append(source)
    if status:
        sql += " AND status=?"; args.append(status)
    if q:
        sql += " AND (name LIKE ? OR desc LIKE ? OR slug LIKE ?)"; args += [f"%{q}%", f"%{q}%", f"%{q}%"]
    sql += " ORDER BY downloads DESC"
    rows = db().execute(sql, args).fetchall()
    return JSONResponse([dict(r) for r in rows])

@app.get("/api/apps/{slug}")
def app_detail(slug: str):
    r = db().execute("SELECT * FROM apps WHERE slug=?", (slug,)).fetchone()
    if not r:
        raise HTTPException(404, "应用不存在")
    return dict(r)

@app.post("/api/apps", status_code=201)
def create_app(a: AppIn):
    c = db()
    try:
        cur = c.execute(
            "INSERT INTO apps (slug,name,dev,desc,icon,category,version,size,source,net_origin,pkg_file,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (a.slug, a.name, a.dev, a.desc, a.icon, a.category, a.version, a.size, a.source, a.net_origin, a.pkg_file, a.status, time.time(), time.time()),
        )
        c.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(409, f"标识 {a.slug} 已存在")
    finally:
        c.close()
    log_event("publish", f"上架应用 {a.name} v{a.version}")
    return {"ok": True, "id": cur.lastrowid}

@app.put("/api/apps/{slug}")
def update_app(slug: str, a: AppIn):
    c = db()
    cur = c.execute(
        "UPDATE apps SET name=?,dev=?,desc=?,icon=?,category=?,version=?,size=?,source=?,net_origin=?,pkg_file=?,status=?,updated_at=? WHERE slug=?",
        (a.name, a.dev, a.desc, a.icon, a.category, a.version, a.size, a.source, a.net_origin, a.pkg_file, a.status, time.time(), slug),
    )
    c.commit(); c.close()
    if not cur.rowcount:
        raise HTTPException(404, "应用不存在")
    log_event("update", f"更新应用 {a.name} → v{a.version}")
    return {"ok": True}

@app.delete("/api/apps/{slug}")
def delete_app(slug: str):
    c = db()
    r = c.execute("SELECT name FROM apps WHERE slug=?", (slug,)).fetchone()
    c.execute("DELETE FROM apps WHERE slug=?", (slug,))
    c.commit(); c.close()
    if not r:
        raise HTTPException(404, "应用不存在")
    log_event("offline", f"下架应用 {r['name']}")
    return {"ok": True}

@app.get("/api/apps/{slug}/download")
def download_app(slug: str):
    c = db()
    r = c.execute("SELECT * FROM apps WHERE slug=?", (slug,)).fetchone()
    c.execute("UPDATE apps SET downloads=downloads+1 WHERE slug=?", (slug,))
    c.commit(); c.close()
    if not r or not r["pkg_file"]:
        raise HTTPException(404, "安装包不存在")
    f = PKG_DIR / r["pkg_file"]
    if not f.exists():
        raise HTTPException(404, f"包文件缺失: {r['pkg_file']}")
    return FileResponse(f, filename=r["pkg_file"], media_type="application/vnd.debian.binary-package")

# ---------------------------------------------------------------- API：软件源
@app.get("/api/sources")
def list_sources():
    return JSONResponse([dict(r) for r in db().execute("SELECT * FROM sources").fetchall()])

@app.post("/api/sources/{sid}/toggle")
def toggle_source(sid: str):
    c = db()
    r = c.execute("SELECT enabled,name FROM sources WHERE id=?", (sid,)).fetchone()
    if not r:
        c.close(); raise HTTPException(404, "源不存在")
    new = 0 if r["enabled"] else 1
    c.execute("UPDATE sources SET enabled=? WHERE id=?", (new, sid))
    c.commit(); c.close()
    log_event("source", f"{r['name']} {'启用' if new else '停用'}")
    return {"ok": True, "enabled": bool(new)}

# ---------------------------------------------------------------- API：包上传
@app.post("/api/packages/upload")
async def upload_package(file: UploadFile = File(...)):
    if not re.search(r"\.(deb|mdn)$", file.filename, re.I):
        raise HTTPException(400, "仅支持 .deb / .mdn 安装包")
    dest = PKG_DIR / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    # 解析 deb 元数据（.mdn 临时复制为 .deb）
    meta = {"file": file.filename, "size": f"{dest.stat().st_size/1024:.1f} KB"}
    tmp = PKG_DIR / f"._parse_{file.filename}"
    shutil.copy(dest, tmp)
    try:
        out = subprocess.run(["dpkg-deb", "-I", str(tmp)], capture_output=True, text=True, timeout=30).stdout
        for key in ("Package", "Version", "Section", "Architecture", "Maintainer", "Description"):
            m = re.search(rf"^\s*{key}:\s*(.+)$", out, re.M)
            if m:
                meta[key.lower()] = m.group(1).strip()
    except Exception:
        pass
    finally:
        tmp.unlink(missing_ok=True)
    log_event("upload", f"上传安装包 {file.filename}（{meta['size']}）")
    return {"ok": True, "meta": meta}

@app.get("/api/packages")
def list_packages():
    files = sorted(PKG_DIR.glob("*"))
    return JSONResponse([{"name": f.name, "size": f.stat().st_size} for f in files if f.is_file()])

# ---------------------------------------------------------------- API：统计
@app.get("/api/stats")
def stats():
    c = db()
    apps = c.execute("SELECT COUNT(*) n, SUM(downloads) d FROM apps WHERE status='published'").fetchone()
    self_n = c.execute("SELECT COUNT(*) n FROM apps WHERE source='self'").fetchone()["n"]
    net_n = c.execute("SELECT COUNT(*) n FROM apps WHERE source='net'").fetchone()["n"]
    src_on = c.execute("SELECT COUNT(*) n FROM sources WHERE enabled=1").fetchone()["n"]
    top = [dict(r) for r in c.execute("SELECT name, downloads FROM apps ORDER BY downloads DESC LIMIT 5").fetchall()]
    events = [dict(r) for r in c.execute("SELECT * FROM events ORDER BY ts DESC LIMIT 10").fetchall()]
    c.close()
    return {
        "total_apps": apps["n"], "total_downloads": apps["d"] or 0,
        "self_apps": self_n, "net_apps": net_n,
        "sources_on": src_on, "sources_total": 8,
        "top": top, "events": events,
        "os": "HeBi OS 5.0 LTS Jade",
    }

# ---------------------------------------------------------------- 静态：管理控制台 + Web 桌面演示
# Web 桌面演示: 随包分发(包内 web-shell/)或开发机 /workspace/web-shell, 不存在则跳过挂载
WEB_SHELL = Path(os.environ.get("HB_WEB_SHELL", "")) if os.environ.get("HB_WEB_SHELL") else (
    BASE / "web-shell" if (BASE / "web-shell").is_dir() else Path("/workspace/web-shell"))
if WEB_SHELL.is_dir():
    app.mount("/web-shell", StaticFiles(directory=WEB_SHELL, html=True), name="webshell")
app.mount("/packages", StaticFiles(directory=PKG_DIR), name="packages")

@app.get("/", response_class=HTMLResponse)
def admin():
    idx = STATIC / "admin.html"
    return HTMLResponse(idx.read_text(encoding="utf-8") if idx.exists() else "<h1>admin.html 缺失</h1>")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
