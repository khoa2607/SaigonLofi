"""Step 3: Bàn Tơ Động gorge at day, dusk and night. Violet cliffs, a giant web canopy, glowing moss and egg sacs, spiders everywhere,
a steaming hot spring with the spider sisters. The cool palette is not pulled warm; emissive parts glow at night. -> ../out/step3-ban-to-dong.png"""
import os, sys, math, random
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from px import Canvas, R, OUT, hx, ramp, zoom
from scene import Scene, IsoSprite, text, vnoise, h2, dither, glow, grade
import cast

HERE = os.path.dirname(os.path.abspath(__file__)); OUTD = os.path.join(HERE, '..', 'out')
W, H = 480, 270
S = Scene(W, H, 240, 44)
rnd = random.Random(7)

ROCK = ramp('#1a1226', '#2e2040', '#47325e', '#634a7c', '#866aa0')
ROCK_TOP = ramp('#16261e', '#24402c', '#36603a', '#4e8048', '#6aa058')
FLOOR = [hx('#3a2c4a'), hx('#34284a'), hx('#403254'), hx('#2e2440')]
MOSS = [hx('#2c4a40'), hx('#356050'), hx('#4e8a5e')]
GLOW = (120, 255, 150)
WATER = [hx('#1e5a66'), hx('#2a7480'), hx('#3e94a0'), hx('#6cc4c8')]


def spring(x, y):
    return ((x - 70) / 16) ** 2 + ((y - 62) / 12) ** 2 <= 1


def painter(px, py, x, y):
    if spring(x, y):
        d = ((x - 70) / 16) ** 2 + ((y - 62) / 12) ** 2
        if d > 0.86: return hx('#5a4a6a')                         # stone rim
        i = 2 if d < 0.4 else 1 if d < 0.7 else 0
        if (int(x * 1.5) + int(y * 3)) % 9 == 0 and d < 0.7: i = 3   # ripples
        return WATER[i]
    n = vnoise(x / 10, y / 10, 2)
    if n > 0.71:                                                  # moss patches with clustered texture
        return MOSS[2] if (h2(int(x * 2), int(y * 2)) > 0.86) else MOSS[1] if n > 0.7 else MOSS[0]
    c = FLOOR[int(h2(int(x / 3), int(y / 3), 5) * 4)]
    if 74 <= x <= 82 and y > 72: c = hx('#4a3a5a') if h2(int(x), int(y), 6) > 0.2 else hx('#54426a')     # trodden path toward the spring
    return c


S.ground(painter)
emis = Image.new('RGBA', (W, H), (0, 0, 0, 0)); E = emis.load()

# glowing moss specks (emissive)
for py in range(H):
    for px in range(W):
        x, y = S.to_world(px + .5, py + .5)
        if vnoise(x / 10, y / 10, 2) > 0.74 and h2(int(x), int(y), 3) > 0.93 and not spring(x, y):
            E[px, py] = (150, 255, 160, 255)


# ---------------------------------------------------------------- cliffs: stacked rock columns along the two back edges
def rock_tex(face, X, Y):
    if face == 0: return 3 if h2(X, Y, 1) > 0.5 else 2
    stratum = (Y // 5) % 2
    if face == 1: return 2 if stratum else 3
    return 1 if stratum else 2


for i in range(15):
    for (wx, wy) in ((i * 8 - 4, -14), (-14, i * 8 - 4)):
        hgt = 34 + int(vnoise(i * 0.7, wx * 0.01 + wy * 0.03, 8) * 46) + (14 if i in (6, 7) else 0)
        sp = IsoSprite(48, hgt * 2 + 40, 24, hgt * 2 + 20)
        sp.box(0, 0, 0, 10, 10, hgt, ROCK_TOP, ROCK, ROCK, tex=rock_tex)
        c = sp.done()
        # egg sacs and hanging moss on some columns
        if h2(i, wx, 4) > 0.5:
            ex, ey = sp.p(5, 10, hgt * 0.5)
            c.ell(ex + 3, ey, 2.4, 3.0, R['silk']); c.ell(ex + 7, ey + 2, 2.0, 2.4, R['silk'])
            S.glows.append(((S.iso(wx + 5, wy + 10, hgt * 0.5)[0] + 5, S.iso(wx + 5, wy + 10, hgt * 0.5)[1]), 12, (200, 220, 255)))
        S.add_canvas(c, 24, hgt * 2 + 20, wx, wy, extra=-30)

# cave mouth on the left wall
cave = IsoSprite(60, 70, 30, 60)
m = Canvas.m_poly([cave.p(0, 10, 0), cave.p(12, 10, 0), cave.p(12, 10, 14), cave.p(6, 10, 20), cave.p(0, 10, 14)])
cave.c.fill(m, ramp('#0a0610', '#120a1c', '#1a1026', '#241834', '#30223e'), Canvas.sh_flat(1))
S.add_canvas(cave.done(), 30, 60, 30, -6, extra=-10)
S.glows.append((S.iso(36, 4, 6), 16, (150, 255, 160)))


# ---------------------------------------------------------------- spiders: small sprites, everywhere
def spider(size=1, col=None):
    col = col or ROCK
    c = Canvas(13, 9)
    for (a, b) in [((6, 4), (1, 1)), ((6, 4), (0, 5)), ((6, 5), (2, 8)), ((7, 4), (12, 1)), ((7, 4), (12, 5)), ((7, 5), (11, 8))]:
        c.fill(Canvas.m_line(a[0], a[1], b[0], b[1]), col, Canvas.sh_flat(1), ink=False)
    c.ell(6.5, 4.5, 3.0, 2.6, col); c.ell(6.5, 2.2, 1.8, 1.4, col)
    c.dots([(5, 2), (8, 2)], hx('#8aff9a'))
    c.outline()
    return c


for k in range(26):
    x, y = rnd.uniform(4, 110), rnd.uniform(4, 110)
    if spring(x, y): continue
    sp = spider(); S.add_canvas(sp, 6, 7, x, y)
    sx, sy = S.iso(x, y); E[int(sx) - 1, int(sy) - 5] = (140, 255, 150, 255); E[int(sx) + 2, int(sy) - 5] = (140, 255, 150, 255)

# ---------------------------------------------------------------- characters: two sisters by the spring, one bathing (robe, steam), Wukong peeking
cs = cast.build()
def put(name, wx, wy):
    c = cs[name]; S.shadow(wx, wy, 7, 3); S.add_canvas(c, c.w // 2, c.h - 2, wx, wy, extra=0.5)
put('spider_sister', 52, 52); put('spider_sister', 92, 70); put('wukong', 100, 30)
bath = cs['spider_sister'].image().crop((0, 0, 32, 24))
sx, sy = S.iso(70, 63)
S.add(bath, sx - 16, sy - 20, 200)
for k in range(9):                                                    # steam wisps
    st = Canvas(10, 8); st.ell(5, 4, 4, 3, ramp('#8a8aa8', '#b8b8d0', '#dcdcec', '#f0f0fa', '#ffffff'), hi=False, ink=False)
    im = st.image(); a = im.split()[3].point(lambda v: 150 if v else 0); im.putalpha(a)
    px_, py_ = S.iso(70 + rnd.uniform(-10, 10), 62 + rnd.uniform(-8, 8), rnd.uniform(4, 14))
    S.add(im, px_ - 5, py_ - 4, 260)

img = S.compose()

# ---------------------------------------------------------------- web canopy across the gorge (overlay; silver by day, glowing at night)
web = Image.new('RGBA', (W, H), (0, 0, 0, 0)); Wp = web.load()
def wline(x0, y0, x1, y1, col):
    n = max(1, int(max(abs(x1 - x0), abs(y1 - y0))))
    for i in range(n + 1):
        x = int(round(x0 + (x1 - x0) * i / n)); y = int(round(y0 + (y1 - y0) * i / n))
        if 0 <= x < W and 0 <= y < H: Wp[x, y] = col
cx, cy = 250, 26
silk = (226, 226, 244, 190); silk2 = (200, 200, 228, 150)
spokes = 16
def rim(k, r):
    a = k / spokes * math.tau + 0.1
    return (cx + math.cos(a) * r, cy + math.sin(a) * r * 0.42)
for k in range(spokes):
    ex, ey = rim(k, 300)
    wline(cx, cy, ex, ey, silk)
for ring in range(1, 8):
    r = ring * 30 + ring * ring * 2
    for k in range(spokes):
        (ax, ay), (bx, by) = rim(k, r), rim(k + 1, r)
        mx, my = (ax + bx) / 2, (ay + by) / 2 + 2 + ring * 0.6       # threads sag between spokes
        wline(ax, ay, mx, my, silk if ring % 2 else silk2); wline(mx, my, bx, by, silk if ring % 2 else silk2)
for k in range(7):
    x = int(rnd.uniform(90, 400)); y0 = int(cy + rnd.uniform(0, 50)); y1 = y0 + int(rnd.uniform(40, 120))
    wline(x, y0, x, y1, silk2)
    sp = spider().image(); web.alpha_composite(sp, (x - 6, y1))
webglow = web.copy()


def variant(name, tint, amount, night):
    im = img.copy(); grade(im, tint, amount)
    w = web.copy()
    if amount:
        grade(w, tint, amount * (0.3 if night else 0.8))
    im.alpha_composite(w)
    if night:
        im.alpha_composite(emis)
        for (p, r, rgb) in S.glows: glow(im, p[0], p[1], r, rgb, 0.5)
        glow(im, *S.iso(70, 62), 40, (60, 200, 210), 0.35)
        # glowing web: re-light the silk
        wp = web.load(); ip = im.load()
        for y in range(H):
            for x in range(W):
                if wp[x, y][3] > 100: ip[x, y] = (150, 200, 250, 255) if (x + y) % 6 else (220, 255, 235, 255)
    return im


day = variant('day', (210, 220, 255), 0.12, False)
dusk = variant('dusk', (255, 150, 170), 0.38, False)
night = variant('night', (40, 46, 110), 0.66, True)
for n, im in (('day', day), ('dusk', dusk), ('night', night)):
    im.save(os.path.join(OUTD, 'step3-ban-to-dong-%s-native.png' % n))
sheet = Image.new('RGBA', (W * 3 * 2 + 8, H * 2), (0, 0, 0, 255))
for i, im in enumerate((day, dusk, night)): sheet.alpha_composite(zoom(im, 2), (i * (W * 2 + 4), 0))
sheet.save(os.path.join(OUTD, 'step3-ban-to-dong.png'))
zoom(night, 3).save(os.path.join(OUTD, 'step3-ban-to-dong-night.png'))
zoom(day, 3).save(os.path.join(OUTD, 'step3-ban-to-dong-day.png'))
print('ok')
