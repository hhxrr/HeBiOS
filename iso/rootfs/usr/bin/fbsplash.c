/*
 * fbsplash — 合璧OS 帧缓冲开机动画播放器
 * 用法: fbsplash <帧目录> [fps]
 * 帧文件: f000.png f001.png ... (RGB)
 * 特性: 帧懒加载(首帧立即显示)、自适应帧缓冲(16/24/32bpp)、SIGTERM 淡出
 */
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"
#include <fcntl.h>
#include <linux/fb.h>
#include <sys/ioctl.h>
#include <sys/mman.h>
#include <unistd.h>
#include <signal.h>
#include <dirent.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>

static volatile sig_atomic_t g_stop = 0;
static struct timespec g_t0;
static double now_s(void) {
    struct timespec t; clock_gettime(CLOCK_MONOTONIC, &t);
    return (t.tv_sec - g_t0.tv_sec) + (t.tv_nsec - g_t0.tv_nsec) / 1e9;
}
static void on_sig(int s) {
    g_stop = 1;
    fprintf(stderr, "fbsplash: [%.2fs] 收到信号 %d, 准备退出\n", now_s(), s);
}

typedef struct {
    int fd; unsigned char *mem; size_t len;
    int w, h, bpp, stride;
} FB;

static int fb_open(FB *f) {
    struct fb_fix_screeninfo fix;
    struct fb_var_screeninfo var;
    f->fd = open("/dev/fb0", O_RDWR);
    if (f->fd < 0) return -1;
    if (ioctl(f->fd, FBIOGET_FSCREENINFO, &fix) < 0) return -1;
    if (ioctl(f->fd, FBIOGET_VSCREENINFO, &var) < 0) return -1;
    f->w = var.xres; f->h = var.yres; f->bpp = var.bits_per_pixel;
    f->stride = fix.line_length; f->len = fix.smem_len;
    f->mem = mmap(NULL, f->len, PROT_READ | PROT_WRITE, MAP_SHARED, f->fd, 0);
    return (f->mem == MAP_FAILED) ? -1 : 0;
}

static inline void put_px(FB *f, int x, int y, int r, int g, int b) {
    if (x < 0 || y < 0 || x >= f->w || y >= f->h) return;
    unsigned char *p = f->mem + (size_t)y * f->stride + (size_t)x * (f->bpp / 8);
    if (f->bpp == 32) {
        p[0] = (unsigned char)b; p[1] = (unsigned char)g;
        p[2] = (unsigned char)r; p[3] = 0;
    } else if (f->bpp == 16) {
        unsigned short v = (unsigned short)(((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3));
        memcpy(p, &v, 2);
    } else if (f->bpp == 24) {
        p[0] = (unsigned char)b; p[1] = (unsigned char)g; p[2] = (unsigned char)r;
    }
}

static void blit_stretch(FB *f, const unsigned char *img, int iw, int ih, int ch) {
    for (int y = 0; y < f->h; y++) {
        int sy = (int)((long)y * ih / f->h);
        const unsigned char *row = img + (size_t)sy * iw * ch;
        for (int x = 0; x < f->w; x++) {
            int sx = (int)((long)x * iw / f->w);
            const unsigned char *px = row + sx * ch;
            put_px(f, x, y, px[0], px[1], px[2]);
        }
    }
}

static void fade_to_black(FB *f, const unsigned char *img, int iw, int ih, int ch) {
    unsigned char *buf = malloc((size_t)iw * ih * ch);
    if (!buf) return;
    memcpy(buf, img, (size_t)iw * ih * ch);
    for (int step = 8; step >= 0; step--) {
        double k = step / 8.0;
        for (long i = 0; i < (long)iw * ih * ch; i++)
            buf[i] = (unsigned char)(buf[i] * k);
        blit_stretch(f, buf, iw, ih, ch);
        usleep(40000);
    }
    free(buf);
}

static int cmpstr(const void *a, const void *b) {
    return strcmp(*(const char **)a, *(const char **)b);
}

/* ---- 帧懒加载 ---- */
static char  **g_names;
static int     g_nframes;
static char    g_dir[1024];
static unsigned char **g_cache;   /* NULL = 未加载 */
static int     g_fw, g_fh;

static unsigned char *load_frame(int i) {
    if (g_cache[i]) return g_cache[i];
    char path[2048];
    snprintf(path, sizeof(path), "%s/%s", g_dir, g_names[i]);
    int w, h, c;
    unsigned char *img = stbi_load(path, &w, &h, &c, 3);
    if (!img) { fprintf(stderr, "fbsplash: 加载失败 %s\n", path); return NULL; }
    g_fw = w; g_fh = h;
    g_cache[i] = img;
    return img;
}

int main(int argc, char **argv) {
    clock_gettime(CLOCK_MONOTONIC, &g_t0);
    if (argc < 2) {
        fprintf(stderr, "usage: fbsplash <frame-dir> [fps]\n");
        return 1;
    }
    signal(SIGTERM, on_sig);
    signal(SIGINT, on_sig);

    snprintf(g_dir, sizeof(g_dir), "%s", argv[1]);
    int fps = (argc > 2) ? atoi(argv[2]) : 15;
    if (fps < 1) fps = 15;
    long frame_ns = 1000000000L / fps;

    /* 收集帧文件名(不解码) */
    DIR *d = opendir(g_dir);
    if (!d) { fprintf(stderr, "fbsplash: 无法打开帧目录 %s\n", g_dir); return 1; }
    g_names = NULL; g_nframes = 0;
    int cap = 0;
    struct dirent *de;
    while ((de = readdir(d))) {
        size_t l = strlen(de->d_name);
        if (l > 4 && strcmp(de->d_name + l - 4, ".png") == 0 && de->d_name[0] == 'f') {
            if (g_nframes == cap) {
                cap = cap ? cap * 2 : 128;
                g_names = realloc(g_names, cap * sizeof(char *));
            }
            g_names[g_nframes++] = strdup(de->d_name);
        }
    }
    closedir(d);
    if (g_nframes == 0) { fprintf(stderr, "fbsplash: 目录中无帧文件\n"); return 1; }
    qsort(g_names, g_nframes, sizeof(char *), cmpstr);
    g_cache = calloc(g_nframes, sizeof(unsigned char *));

    FB fb;
    int has_fb = (fb_open(&fb) == 0);
    if (has_fb)
        fprintf(stderr, "fbsplash: [%.2fs] 帧缓冲 %dx%d %dbpp, %d 帧 @ %d fps\n",
                now_s(), fb.w, fb.h, fb.bpp, g_nframes, fps);

    /* 首帧立即加载并显示 */
    unsigned char *first = load_frame(0);
    if (!first) return 1;
    fprintf(stderr, "fbsplash: [%.2fs] 首帧已加载\n", now_s());
    if (has_fb) blit_stretch(&fb, first, g_fw, g_fh, 3);
    fprintf(stderr, "fbsplash: [%.2fs] 首帧已绘制\n", now_s());

    int idx = 0;
    struct timespec ts;
    double last_log = 0.0;
    while (!g_stop) {
        idx = (idx + 1) % g_nframes;
        unsigned char *img = load_frame(idx);
        if (img && has_fb) blit_stretch(&fb, img, g_fw, g_fh, 3);
        /* 日志节流: 每 5 秒一行。曾每帧 fprintf —— 15fps 刷串口/控制台
         * 既是噪声也拖慢循环 (VMware 下串口重定向到文件时尤其明显) */
        if (now_s() - last_log >= 5.0) {
            fprintf(stderr, "fbsplash: [%.2fs] frame %d/%d\n", now_s(), idx, g_nframes);
            last_log = now_s();
        }
        /* 截止时间必须在 blit 之后重新取 now 再叠加帧时长:
         * 旧代码在循环开头取时间, 若单帧 blit 超过帧预算(VMware SVGA
         * 软渲染下 1024x768 逐像素 blit 很容易超过 66ms), 绝对截止时间
         * 在调用时已过期 → clock_nanosleep 立即返回 → 100% CPU 自旋。
         * 改为"当前时间 + 帧时长"后, 每轮至少睡满一个帧周期, CPU 封顶。 */
        clock_gettime(CLOCK_MONOTONIC, &ts);
        ts.tv_nsec += frame_ns;
        if (ts.tv_nsec >= 1000000000L) { ts.tv_sec++; ts.tv_nsec -= 1000000000L; }
        clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &ts, NULL);
    }
    fprintf(stderr, "fbsplash: [%.2fs] 退出循环, idx=%d\n", now_s(), idx);

    unsigned char *last = g_cache[idx] ? g_cache[idx] : first;
    if (has_fb) {
        fade_to_black(&fb, last, g_fw, g_fh, 3);
        memset(fb.mem, 0, fb.len);   /* 退出前清屏, 避免残影 */
    }
    return 0;
}
