"""Step 3 (v2): Bàn Tơ Động gorge at day, dusk and night, at the traced characters' density (K = 4).
Violet cliffs, a giant web canopy, glowing moss and egg sacs, spiders everywhere, the steaming spring (Bát Giới jumped in, as in the novel),
Wukong and Sa Tăng at the edge. The cool palette is not pulled warm; emissive parts glow at night. -> ../out/step3-ban-to-dong*.png"""
import os, sys, math, random
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from px import Canvas, R, OUT, hx, ramp, zoom
from scene import Scene, IsoSprite, vnoise, h2, dither, glow, grade, traced, K

HERE = os.path.dirname(os.path.abspath(__file__)); OUTD = os.path.join(HERE, '..', 'out')
W, H = 960, 540
S = Scene(W, H, 480, 88)
rnd = random.Random(7)

ROCK = ramp('#1a1226', '#2e2040', '#47325e', '#634a7c', '#866aa0')
ROCK_TOP = ramp('#16261e', '#24402c', '#36603a', '#4e8048', '#6aa058')
FLOOR = [hx('#3a2c4a'), hx('#34284a'), hx('#403254'), hx('#2e2440')]
MOSS = [hx('#2c4a40'), hx('#356050'), hx('#4e8a5e')]
WATER = [hx('#1e5a66'), hx('#2a7480'), hx('#3e94a0'), hx('#6cc4c8')]


def spring(x, y): return ((x - 70) / 16) ** 2 + ((y - 62) / 12) ** 2 <= 1


def painter(px, py, x, y):
    if spring(x, y):
        d = ((x - 70) / 16) ** 2 + ((y - 62) / 12) ** 2
        if d > 0.88: return hx('#6a5a7a') if d < 0.94 else hx('#4a3a5a')
        i = 2 if d < 0.4 else 1 if d < 0.7 else 0
        if (int(x * 3) + int(y * 6)) % 13 == 0 and d < 0.7: i = 3
        return WATER[i]
    n = vnoise(x / 10, y / 10, 2)
    if n > 0.71:
        return MOSS[2] if h2(int(x * 4), int(y * 4)) > 0.88 else MOSS[1] if n > 0.76 else MOSS[0]
    c = FLOOR[int(h2(int(x / 2), int(y / 2), 5) * 4)]
    if h2(int(x * 4), int(y * 4), 6) < 0.04: c = hx('#4c3e60')                       # grit
    if 74 <= x <= 82 and y > 72: c = hx('#4a3a5a') if h2(int(x * 2), int(y * 2), 6) > 0.2 else hx('#54426a')
    return c


S.ground(painter)
emis = Image.new('RGBA', (W, H), (0, 0, 0, 0)); E = emis.load()
for py in range(0, H, 2):
    for px in range(0, W, 2):
        x, y = S.to_world(px + 1, py + 1)
        if vnoise(x / 10, y / 10, 2) > 0.74 and h2(int(x * 2), int(y * 2), 3) > 0.93 and not spring(x, y):
            for a in range(2):
                for b in range(2): E[px + a, py + b] = (150, 255, 160, 255)


def rock_tex(face, X, Y):
    if face == 0: return 3 if h2(X // 3, Y // 3, 1) > 0.55 else 2
    band = Y % 12
    if band == 0: return 0 if face == 2 else 1                                    # strata seam
    if band == 1: return 3 if face == 1 else 2                                    # lit lip under the seam
    if h2(X // 2, Y // 2, 5) < 0.03: return 4 if face == 1 else 3                 # chips
    return 2 if face == 1 else 1


for i in range(15):
    for (wx, wy) in ((i * 8 - 4, -14), (-14, i * 8 - 4)):
        hgt = 34 + int(vnoise(i * 0.7, wx * 0.01 + wy * 0.03, 8) * 46) + (14 if i in (6, 7) else 0)
        sp = IsoSprite(520)
        sp.box(0, 0, 0, 10, 10, hgt, ROCK_TOP, ROCK, ROCK, tex=rock_tex)
        if h2(i, wx, 4) > 0.5:
            ex, ey = sp.p(4, 10, hgt * 0.5)
            sp.c.ell(ex + 6, ey, 5, 6.4, R['silk']); sp.c.ell(ex + 15, ey + 4, 4, 5, R['silk'])
            S.glows.append((S.iso(wx + 4, wy + 10, hgt * 0.5), 26, (200, 220, 255)))
        S.place(sp.done(), wx, wy, extra=-30)

cave = IsoSprite(300)
m = Canvas.m_poly([cave.p(0, 10, 0), cave.p(12, 10, 0), cave.p(12, 10, 14), cave.p(6, 10, 20), cave.p(0, 10, 14)])
cave.c.fill(m, ramp('#0a0610', '#120a1c', '#1a1026', '#241834', '#30223e'), Canvas.sh_flat(1))
S.place(cave.done(), 30, -6, extra=-10)
S.glows.append((S.iso(36, 4, 6), 32, (150, 255, 160)))


def spider(col=ROCK):
    c = Canvas(26, 18)
    for (a, b, e) in [((12, 8), (5, 3), (2, 6)), ((12, 9), (4, 9), (1, 14)), ((12, 10), (6, 14), (4, 17)), ((14, 8), (21, 3), (24, 6)), ((14, 9), (22, 9), (25, 14)), ((14, 10), (20, 14), (22, 17))]:
        c.fill(Canvas.m_line(a[0], a[1], b[0], b[1]) | Canvas.m_line(b[0], b[1], e[0], e[1]), col, Canvas.sh_flat(1), ink=False)
    c.ell(13, 10, 5.4, 4.8, col); c.ell(13, 5, 3.2, 2.6, col)
    c.dots([(11, 4), (15, 4), (12, 5), (14, 5)], hx('#8aff9a'))
    c.dots([(11, 9), (12, 8)], col[4])
    c.outline()
    return c, 13, 15


spots = []
for k in range(30):
    x, y = rnd.uniform(4, 110), rnd.uniform(4, 110)
    if spring(x, y): continue
    S.place(spider(), x, y)
    sx, sy = S.iso(x, y)
    for (dx, dy) in ((-2, -10), (2, -10)): E[int(sx) + dx, int(sy) + dy] = (140, 255, 150, 255)

# characters: Bát Giới in the spring (head and shoulders above the water), Wukong and Sa Tăng at the edge
bj, ax, ay = traced('bajie')
bath = bj.crop((0, 0, bj.width, 40)); sx, sy = S.iso(70, 63)
S.add(bath, sx - bj.width // 2, sy - 34, 200)
S.shadow(100, 30, 16, 6); S.place(traced('wukong'), 100, 30, extra=0.5)
S.shadow(38, 74, 18, 7); S.place(traced('shaseng'), 38, 74, extra=0.5)
for k in range(10):
    st = Canvas(20, 16); st.ell(10, 8, 8, 6, ramp('#8a8aa8', '#b8b8d0', '#dcdcec', '#f0f0fa', '#ffffff'), hi=False, ink=False)
    im = st.image(); im.putalpha(im.split()[3].point(lambda v: 150 if v else 0))
    px_, py_ = S.iso(70 + rnd.uniform(-12, 12), 62 + rnd.uniform(-9, 9), rnd.uniform(6, 18))
    S.add(im, px_ - 10, py_ - 8, 260)

img = S.compose()

web = Image.new('RGBA', (W, H), (0, 0, 0, 0)); Wp = web.load()


def wline(x0, y0, x1, y1, col):
    n = max(1, int(max(abs(x1 - x0), abs(y1 - y0))))
    for i in range(n + 1):
        x = int(round(x0 + (x1 - x0) * i / n)); y = int(round(y0 + (y1 - y0) * i / n))
        if 0 <= x < W and 0 <= y < H: Wp[x, y] = col


cx, cy = 500, 52
silk = (226, 226, 244, 200); silk2 = (196, 196, 226, 160)
spokes = 18
def rim(k, r):
    a = k / spokes * math.tau + 0.1
    return (cx + math.cos(a) * r, cy + math.sin(a) * r * 0.42)
for k in range(spokes):
    ex, ey = rim(k, 640); wline(cx, cy, ex, ey, silk)
for ring in range(1, 11):
    r = ring * 44 + ring * ring * 3
    for k in range(spokes):
        (ax_, ay_), (bx, by) = rim(k, r), rim(k + 1, r)
        mx, my = (ax_ + bx) / 2, (ay_ + by) / 2 + 3 + ring
        wline(ax_, ay_, mx, my, silk if ring % 2 else silk2); wline(mx, my, bx, by, silk if ring % 2 else silk2)
for k in range(8):
    x = int(rnd.uniform(180, 800)); y0 = int(cy + rnd.uniform(0, 90)); y1 = y0 + int(rnd.uniform(80, 220))
    wline(x, y0, x, y1, silk2)
    sp, ax_, ay_ = spider(); web.alpha_composite(sp.image(), (x - 13, y1))
    for k2 in range(4): Wp[x, y0 + rnd.randint(4, max(5, y1 - y0 - 4))] = (255, 255, 255, 230)     # dew beads


def variant(tint, amount, night):
    im = img.copy(); grade(im, tint, amount)
    w = web.copy()
    if amount: grade(w, tint, amount * (0.3 if night else 0.8))
    im.alpha_composite(w)
    if night:
        im.alpha_composite(emis)
        for (p, r, rgb) in S.glows: glow(im, p[0], p[1], r, rgb, 0.5)
        glow(im, *S.iso(70, 62), 80, (60, 200, 210), 0.35)
        wp = web.load(); ip = im.load()
        for y in range(H):
            for x in range(W):
                if wp[x, y][3] > 100: ip[x, y] = (150, 200, 250, 255) if (x + y) % 7 else (220, 255, 235, 255)
    return im


day = variant((210, 220, 255), 0.12, False)
dusk = variant((255, 150, 170), 0.38, False)
night = variant((40, 46, 110), 0.66, True)
for n, im in (('day', day), ('dusk', dusk), ('night', night)):
    im.save(os.path.join(OUTD, 'step3-ban-to-dong-%s-native.png' % n))
sheet = Image.new('RGBA', (W * 3 + 8, H), (0, 0, 0, 255))
for i, im in enumerate((day, dusk, night)): sheet.alpha_composite(im, (i * (W + 4), 0))
sheet.save(os.path.join(OUTD, 'step3-ban-to-dong.png'))
zoom(night, 2).save(os.path.join(OUTD, 'step3-ban-to-dong-night.png'))
zoom(day, 2).save(os.path.join(OUTD, 'step3-ban-to-dong-day.png'))
print('ok')
