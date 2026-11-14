#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""合璧OS HeBi OS - 品牌资产生成器
生成: 徽标 SVG/PNG 多尺寸、GRUB 主题背景、开机动画帧、Plymouth 主题素材
"""
import math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
CJK_BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
CJK_REG  = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
LATIN    = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

BLUE  = (46, 124, 246)    # #2E7CF6
CYAN  = (34, 195, 230)    # #22C3E6
WHITE = (245, 250, 255)
NAVY  = (10, 22, 51)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.truetype(path, size)

def cjk(size, bold=True, sc_index=2):
    return font(CJK_BOLD if bold else CJK_REG, size, sc_index)

# ---------- 徽标 SVG ----------
LOGO_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2E7CF6"/><stop offset="1" stop-color="#22C3E6"/>
    </linearGradient>
    <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#22C3E6"/><stop offset="1" stop-color="#2E7CF6"/>
    </linearGradient>
  </defs>
  <rect x="46" y="46" width="268" height="268" rx="78" fill="none" stroke="url(#g)" stroke-width="44"/>
  <rect x="198" y="198" width="268" height="268" rx="78" fill="none" stroke="url(#g2)" stroke-width="44" opacity="0.92"/>
  <g fill="none" stroke="#F5FAFF" stroke-width="16" stroke-linecap="round">
    <rect x="200" y="200" width="112" height="112" rx="18"/>
    <line x1="256" y1="200" x2="256" y2="312"/>
    <line x1="200" y1="256" x2="312" y2="256"/>
  </g>
</svg>"""

# ---------- 圆角矩形路径采样(用于开机动画画环) ----------
def rounded_rect_pts(x, y, w, h, r, n=240):
    pts = []
    corners = [(x + w - r, y + r, -90, 0), (x + w - r, y + h - r, 0, 90),
               (x + r, y + h - r, 90, 180), (x + r, y + r, 180, 270)]
    per = n // 4
    for cx, cy, a0, a1 in corners:
        for i in range(per):
            a = math.radians(a0 + (a1 - a0) * i / per)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def draw_ring_prog(dr, pts, prog, color_fn, width):
    """按进度 prog(0~1) 画渐变圆环"""
    total = int(len(pts) * max(0.0, min(1.0, prog)))
    if total < 2:
        return
    for i in range(total - 1):
        c = color_fn(i / max(1, len(pts) - 1))
        dr.line([pts[i], pts[i + 1]], fill=c, width=width)

def vertical_gradient(size, top, bottom):
    w, h = size
    img = Image.new("RGB", (1, h))
    for yy in range(h):
        img.putpixel((0, yy), lerp(top, bottom, yy / max(1, h - 1)))
    return img.resize((w, h))

def radial_glow(size, center, radius, color, peak=90):
    img = Image.new("L", size, 0)
    dr = ImageDraw.Draw(img)
    steps = 40
    for i in range(steps, 0, -1):
        r = int(radius * i / steps)
        a = int(peak * (1 - i / steps) ** 1.6)
        dr.ellipse([center[0]-r, center[1]-r, center[0]+r, center[1]+r], fill=a)
    return img.filter(ImageFilter.GaussianBlur(40))

# ---------- 1. 徽标 ----------
def gen_logo():
    svg = os.path.join(ROOT, "logo.svg")
    open(svg, "w", encoding="utf-8").write(LOGO_SVG)
    import cairosvg
    for s in (1024, 512, 256, 128, 96, 64, 48, 32, 16):
        out = os.path.join(ROOT, f"logo-{s}.png")
        cairosvg.svg2png(bytestring=LOGO_SVG.encode(), write_to=out,
                         output_width=s, output_height=s)
    print("logo ok")

# ---------- 2. GRUB 主题 ----------
def gen_grub():
    d = os.path.join(ROOT, "..", "iso", "boot", "grub", "theme")
    os.makedirs(d, exist_ok=True)
    W, H = 1920, 1080
    bg = vertical_gradient((W, H), (8, 18, 42), (5, 10, 24)).convert("RGBA")
    glow = radial_glow((W, H), (int(W*0.78), int(H*0.22)), 620, (40, 110, 220), 110)
    bg = Image.composite(Image.new("RGBA", (W, H), (30, 80, 170, 255)), bg, glow)
    glow2 = radial_glow((W, H), (int(W*0.15), int(H*0.85)), 520, (20, 140, 180), 80)
    bg = Image.composite(Image.new("RGBA", (W, H), (20, 130, 170, 255)), bg, glow2)
    dr = ImageDraw.Draw(bg)
    # 装饰圆环
    for (cx, cy, r, col, wd) in [(1650, 240, 300, (60, 140, 240, 60), 10),
                                 (1650, 240, 210, (40, 190, 230, 46), 8),
                                 (280, 900, 260, (40, 190, 230, 40), 9)]:
        dr.ellipse([cx-r, cy-r, cx+r, cy+r], outline=col, width=wd)
    # 中央徽标
    logo = Image.open(os.path.join(ROOT, "logo-256.png")).convert("RGBA")
    logo = logo.resize((200, 200), Image.LANCZOS)
    bg.alpha_composite(logo, (W//2 - 100, 150))
    # 标题
    f1 = cjk(84); f2 = cjk(30, bold=False)
    t1 = "合璧OS"
    b1 = dr.textbbox((0, 0), t1, font=f1)
    dr.text(((W - (b1[2]-b1[0]))/2, 385), t1, font=f1, fill=WHITE)
    t2 = "HeBi OS 3.0 LTS  ·  Jade  ·  amd64"
    b2 = dr.textbbox((0, 0), t2, font=f2)
    dr.text(((W - (b2[2]-b2[0]))/2, 505), t2, font=f2, fill=(150, 190, 230))
    bg.convert("RGB").save(os.path.join(d, "background.png"))
    # 菜单高亮块
    for name, wpx, hpx in [("select_c.png", 640, 72), ("select_e.png", 24, 72), ("select_w.png", 24, 72)]:
        tile = Image.new("RGBA", (wpx, hpx), (0, 0, 0, 0))
        td = ImageDraw.Draw(tile)
        td.rounded_rectangle([0, 0, wpx-1, hpx-1], radius=12, fill=(70, 140, 240, 110),
                             outline=(120, 200, 250, 200), width=2)
        tile.save(os.path.join(d, name))
    print("grub theme ok")

# ---------- 3. 开机动画帧(帧缓冲播放器用) ----------
def gen_boot_frames(total=96):
    d = os.path.join(ROOT, "..", "iso", "boot", "splash-frames")
    os.makedirs(d, exist_ok=True)
    W, H = 1024, 768
    base = vertical_gradient((W, H), (9, 20, 46), (5, 10, 24)).convert("RGBA")
    glow = radial_glow((W, H), (W//2, int(H*0.40)), 430, (40, 110, 220), 100)
    base = Image.composite(Image.new("RGBA", (W, H), (30, 80, 170, 255)), base, glow)
    ring_pts = rounded_rect_pts(322, 208, 380, 380, 108)
    f_title = cjk(40); f_sub = cjk(22, bold=False); f_stat = cjk(20)
    status = ["正在初始化 合璧内核 HeBi Kernel 6.8 ...", "加载通用硬件驱动 ...",
              "启动图形合成服务 ...", "正在准备桌面环境 ...", "欢迎使用 合璧OS"]
    for i in range(total):
        img = base.copy()
        dr = ImageDraw.Draw(img, "RGBA")
        t = i / (total - 1)
        # 阶段1: 画环 (0 ~ 0.45)
        prog = min(1.0, t / 0.45)
        if prog > 0:
            draw_ring_prog(dr, ring_pts, prog,
                           lambda k: lerp(BLUE, CYAN, k), 14)
        # 中心窗棂 (0.45 ~ 0.6 淡入)
        if t > 0.42:
            a = min(1.0, (t - 0.42) / 0.18)
            c = lerp((10, 22, 51), WHITE, a)
            cx, cy, hw = 512, 398, 58
            dr.rounded_rectangle([cx-hw, cy-hw, cx+hw, cy+hw], radius=16,
                                 outline=c, width=8)
            dr.line([(cx, cy-hw), (cx, cy+hw)], fill=c, width=8)
            dr.line([(cx-hw, cy), (cx+hw, cy)], fill=c, width=8)
        # 旋转点环 (0.55 之后)
        if t > 0.5:
            rot = (t - 0.5) * 6.0
            for k in range(14):
                ang = rot + k * (2 * math.pi / 14)
                rr = 258
                x = 512 + rr * math.cos(ang); y = 398 + rr * math.sin(ang)
                fade = (math.sin(ang * 2 + rot * 3) + 1) / 2
                col = lerp(BLUE, CYAN, k / 13) + (int(60 + 150 * fade),)
                dr.ellipse([x-5, y-5, x+5, y+5], fill=col)
        # 标题
        if t > 0.55:
            a = min(1.0, (t - 0.55) / 0.2)
            c = lerp((10, 22, 51), WHITE, a)
            b = dr.textbbox((0, 0), "合璧OS", font=f_title)
            dr.text(((W - (b[2]-b[0]))/2, 630), "合璧OS", font=f_title, fill=c)
            b2 = dr.textbbox((0, 0), "HeBi OS · 融 Linux 内核，承 Windows 体验", font=f_sub)
            dr.text(((W - (b2[2]-b2[0]))/2, 690), "HeBi OS · 融 Linux 内核，承 Windows 体验",
                    font=f_sub, fill=lerp((10, 22, 51), (140, 185, 230), a))
        # 进度条 (0.3 之后)
        if t > 0.28:
            p = min(1.0, (t - 0.28) / 0.68)
            bx, by, bw, bh = 312, 560, 400, 10
            dr.rounded_rectangle([bx, by, bx+bw, by+bh], radius=5,
                                 outline=(90, 130, 190, 160), width=2)
            fw = int((bw - 8) * p)
            if fw > 2:
                dr.rounded_rectangle([bx+4, by+3, bx+4+fw, by+bh-3], radius=3,
                                     fill=lerp(BLUE, CYAN, p))
            si = min(len(status)-1, int(p * len(status)))
            b3 = dr.textbbox((0, 0), status[si], font=f_stat)
            dr.text(((W - (b3[2]-b3[0]))/2, 585), status[si], font=f_stat,
                    fill=(150, 195, 235))
        img.convert("RGB").save(os.path.join(d, f"f{i:03d}.png"))
    print(f"boot frames ok ({total})")

# ---------- 4. Plymouth 主题素材 ----------
def gen_plymouth():
    d = os.path.join(ROOT, "..", "iso", "boot", "plymouth", "themes", "hebi-splash")
    os.makedirs(d, exist_ok=True)
    Image.open(os.path.join(ROOT, "logo-256.png")).save(os.path.join(d, "logo.png"))
    # 进度条底与填充
    bar = Image.new("RGBA", (512, 24), (0, 0, 0, 0))
    ImageDraw.Draw(bar).rounded_rectangle([0, 0, 511, 23], radius=11,
                                          outline=(120, 160, 210, 200), width=3)
    bar.save(os.path.join(d, "progress.png"))
    box = Image.new("RGBA", (512, 24), (0, 0, 0, 0))
    ImageDraw.Draw(box).rounded_rectangle([0, 0, 511, 23], radius=11,
                                          fill=BLUE + (255,))
    box.save(os.path.join(d, "progress_box.png"))
    # bullet
    bl = Image.new("RGBA", (12, 12), (0, 0, 0, 0))
    ImageDraw.Draw(bl).ellipse([1, 1, 11, 11], fill=CYAN + (255,))
    bl.save(os.path.join(d, "bullet.png"))
    print("plymouth assets ok")

# ---------- 5. 安装器背景(图形安装界面) ----------
def gen_installer_bg():
    d = os.path.join(ROOT, "..", "iso", "boot", "grub", "theme")
    W, H = 1920, 1080
    bg = vertical_gradient((W, H), (7, 15, 36), (5, 9, 20)).convert("RGBA")
    glow = radial_glow((W, H), (W//2, int(H*0.30)), 700, (40, 110, 220), 120)
    bg = Image.composite(Image.new("RGBA", (W, H), (30, 80, 170, 255)), bg, glow)
    logo = Image.open(os.path.join(ROOT, "logo-256.png")).resize((150, 150), Image.LANCZOS)
    bg.alpha_composite(logo, (W//2 - 75, 260))
    dr = ImageDraw.Draw(bg)
    t = "合璧OS 安装程序"
    b = dr.textbbox((0, 0), t, font=cjk(64))
    dr.text(((W-(b[2]-b[0]))/2, 440), t, font=cjk(64), fill=WHITE)
    t2 = "HeBi OS Installer · 图形化安装向导"
    b2 = dr.textbbox((0, 0), t2, font=cjk(28, bold=False))
    dr.text(((W-(b2[2]-b2[0]))/2, 540), t2, font=cjk(28, bold=False), fill=(150, 195, 235))
    bg.convert("RGB").save(os.path.join(d, "installer_bg.png"))
    print("installer bg ok")

if __name__ == "__main__":
    gen_logo()
    gen_grub()
    gen_boot_frames()
    gen_plymouth()
    gen_installer_bg()
    print("ALL BRANDING DONE")
