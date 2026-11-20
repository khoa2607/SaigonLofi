"""Step 4 (v2): the edge band between Hỏa Diệm Sơn (west, left) and Cao Lão Trang (east, right), at the traced characters' density (K = 4).
The band carries both palettes: ash drifts over the golden rice, scorched paddies, a singed hut, ashy haystacks. Huts stand on stone footings
(v1 clipped their walls, so they looked sunk into the ground). Day and dusk. -> ../out/step4-bien-gioi*.png"""
import os, sys, math, random
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from px import Canvas, R, OUT, hx, ramp, zoom
from scene import Scene, IsoSprite, vnoise, h2, dither, glow, grade, traced, K

HERE = os.path.dirname(os.path.abspath(__file__)); OUTD = os.path.join(HERE, '..', 'out')
W, H = 960, 540
S = Scene(W, H, 480, 12)
rnd = random.Random(3)

EARTH = [hx('#6e2618'), hx('#8a321c'), hx('#a64222'), hx('#c05a28')]
ASH = [hx('#4a4246'), hx('#625a5c'), hx('#7c7272')]
LAVA = [hx('#ff9a2a'), hx('#ffd25a')]
RICE = [hx('#c89a32'), hx('#e2b842'), hx('#f2d468'), hx('#a8802a')]
RICE_SCORCH = [hx('#7a5a2a'), hx('#94702e')]
WATER = [hx('#6a8a7a'), hx('#86a690')]
BUND = [hx('#6a7a3a'), hx('#56662e'), hx('#8a9a4a')]
lava_px = []


def wfire(x, y):
    d = (x - y) + (vnoise(x / 18, y / 18, 7) - 0.5) * 36
    return max(0.0, min(1.0, 0.5 - d / 72))


def fire_ground(px, py, x, y):
    n = vnoise(x / 7, y / 7, 1); n2 = vnoise(x / 13, y / 13, 2)
    if abs(n - 0.5) < 0.012 and n2 > 0.42:
        lava_px.append((px, py)); return LAVA[0] if h2(px, py) > 0.3 else LAVA[1]
    if n2 > 0.66: return ASH[1] if h2(int(x * 3), int(y * 3)) > 0.3 else ASH[2]
    c = EARTH[min(3, int(n * 4.4))]
    if h2(int(x * 4), int(y * 4), 3) < 0.05: c = EARTH[max(0, min(3, int(n * 4.4)) - 1)]    # grit
    return c


def rice_ground(px, py, x, y, ash=0.0):
    fx, fy = x % 20, y % 20
    if fx < 1.6 or fy < 1.6:
        if fx < 0.4 or fy < 0.4: return BUND[1]
        return BUND[2] if (fx < 0.8 or fy < 0.8) else BUND[0]                   # dike: lit edge, top, shaded edge
    r = int(fy / 3.0); off = 1.25 if r % 2 else 0
    cxl = (math.floor((fx + off) / 2.5) + 0.5) * 2.5 - off; cyl = (r + 0.5) * 3.0
    dx, dy = (fx - cxl) * K, (fy - cyl) * K
    sx, sy = dx - dy, (dx + dy) / 2
    if abs(sx) <= 5 and -4.8 <= sy <= 2.4:
        c = RICE[2] if (sx < -1.2 and sy < -1.2) else RICE[0] if (sx > 2 or sy > 0.8) else RICE[1]
        if abs(sx) < 1 and sy < -3.6: c = RICE[2]                                  # grain head tip
    else:
        c = WATER[0] if h2(int(x / 2), int(y / 2), 5) > 0.3 else WATER[1]
    if ash > 0 and vnoise(x / 2.2, y / 2.2, 12) < ash * 0.75:
        c = ASH[2] if h2(int(x * 3), int(y * 3), 3) > 0.5 else ASH[1]
    if ash > 0.6 and vnoise(x / 4, y / 4, 11) < (ash - 0.6) * 1.4:
        c = RICE_SCORCH[int(h2(int(x * 2), int(y * 2)) * 2)]
    return c


def painter(px, py, x, y):
    t = wfire(x, y)
    if t >= 0.98: return fire_ground(px, py, x, y)
    if t <= 0.02: return rice_ground(px, py, x, y)
    if vnoise(x / 3.2, y / 3.2, 13) < t: return fire_ground(px, py, x, y)
    return rice_ground(px, py, x, y, ash=t * 1.6)


S.ground(painter)


def flame(seed, h=52):
    c = Canvas(28, h + 6)
    FL = ramp('#7a1a10', '#d8401a', '#f6862a', '#ffc850', '#fff4c0')
    c.poly([(2, h + 4), (6, h * 0.5), (10, h * 0.62), (14, 1), (18, h * 0.45), (22, h * 0.58), (26, h + 4)], FL, shade=lambda X, Y: 1 if Y < h * 0.4 else 2 if Y < h * 0.65 else 3)
    c.poly([(8, h + 4), (12, h * 0.62), (14, h * 0.38), (16, h * 0.64), (20, h + 4)], FL, shade=lambda X, Y: 4 if Y > h * 0.7 else 3, ink=False)
    c.outline(hx('#5a1410'))
    return c, 14, h + 3


def lava_rock(seed, s=16):
    rr = random.Random(seed); c = Canvas(68, 52)
    ROCK = ramp('#1a1012', '#341c1c', '#4e2822', '#6c382a', '#8a4a34')
    for k in range(3):
        x, y, r = rr.uniform(20, 48), rr.uniform(26, 36), rr.uniform(s * 0.7, s)
        c.fill(Canvas.m_ell(x, y, r, r * 0.75), ROCK, Canvas.sh_sphere(x, y, r, r * 0.75, True))
    for k in range(9):
        x, y = rr.uniform(16, 52), rr.uniform(24, 44)
        if c.px[int(y)][int(x)] is not None:
            for d in range(rr.randint(2, 4)): c.put(int(x) + d, int(y) + (d // 2), LAVA[d % 2])
    c.outline(); return c, 34, 44


def hut(scorched=False):
    sp = IsoSprite(520)
    STONE = ramp('#3a3436', '#5e5658', '#857c7a', '#a8a09a', '#ccc4ba')
    WALL = ramp('#7a5a4a', '#bf9a72', '#e2c89a', '#f2e0b8', '#fff4d8')
    TIMBER = R['brown']
    sp.box(-1, -1, 0, 20, 16, 2, STONE, STONE, STONE)                                     # stone footing: the hut sits ON the ground
    def wall_tex(face, X, Y):
        if face == 0: return 2
        return 2 if (Y // 3) % 3 else 1                                                    # wattle bands
    sp.box(0, 0, 2, 18, 14, 10, WALL, WALL, WALL, tex=wall_tex)
    for xx in (0, 8.5, 17): sp.box(xx, 13, 2, 1, 1, 10, TIMBER, TIMBER, TIMBER)
    for yy in (0, 6.5, 13): sp.box(17, yy, 2, 1, 1, 10, TIMBER, TIMBER, TIMBER)
    sp.box(0, 13, 11, 18, 1, 1, TIMBER, TIMBER, TIMBER)
    THATCH = ramp('#5a4020', '#9a7434', '#c8a04a', '#e2c26a', '#f4dc94') if not scorched else ramp('#1e1a18', '#3a322c', '#5a4c40', '#7a6a58', '#968670')
    sp.roof(0, 0, 12, 18, 14, 10, THATCH, curl=0.8, over=2.5, ridge=ramp('#3a2a18', '#6a4a28', '#8a6438', '#a88050', '#c49c6a'), rows=2)
    c = sp.c
    d0 = sp.p(5, 14, 2); d1 = sp.p(9, 14, 2)
    c.fill(Canvas.m_poly([d0, d1, (d1[0], d1[1] - 30), (d0[0], d0[1] - 30)]), ramp('#1e140e', '#3a2618', '#56381e', '#6e4a28', '#8a6034'), Canvas.sh_flat(1))
    w0 = sp.p(12, 14, 6); w1 = sp.p(15, 14, 6)
    c.fill(Canvas.m_poly([w0, w1, (w1[0], w1[1] - 14), (w0[0], w0[1] - 14)]), ramp('#1e140e', '#3a2618', '#ffd27a', '#ffe6a8', '#fff4d8'), lambda X, Y: 1 if (X + Y) % 4 else 0)
    if scorched:
        rr = random.Random(5)
        for k in range(60):
            x, y = rr.randint(0, c.w - 1), rr.randint(0, c.h - 1)
            if c.px[y][x] is not None and c.px[y][x] in THATCH: c.put(x, y, ASH[2])
    return sp.done()


def haystack(ashed=False):
    c = Canvas(52, 44)
    HAY = ramp('#6a4a18', '#b08430', '#dcb24a', '#f0d070', '#fff0a8')
    c.ell(26, 28, 22, 15, HAY); c.ell(26, 16, 14, 12, HAY); c.ell(26, 7, 5, 4, HAY)
    rr = random.Random(9)
    for k in range(40):
        x, y = rr.uniform(8, 44), rr.uniform(6, 40)
        if c.px[int(y)][int(x)] is not None: c.line(int(x), int(y), int(x) + rr.choice((-2, 2)), int(y) + 3, HAY[1] if x + y > 50 else HAY[3])
    if ashed:
        for k in range(40):
            x, y = rr.uniform(10, 42), rr.uniform(2, 20)
            if c.px[int(y)][int(x)] is not None: c.put(int(x), int(y), ASH[2]); c.put(int(x) + 1, int(y), ASH[1])
        c.ell(38, 24, 4, 3.2, ramp('#2a1a14', '#3a2a22', '#4a3a30', '#5a4a3e', '#6a5a4a'), hi=False)
        c.put(38, 23, LAVA[0])
    c.outline()
    return c, 26, 40


for (x, y, sd) in [(14, 60, 1), (40, 92, 2), (22, 122, 3), (58, 140, 4)]:
    S.place(flame(sd, 44 + sd * 6), x, y)
    S.glows.append((S.iso(x, y, 8), 56, (255, 120, 40)))
for (x, y, sd) in [(30, 70, 5), (8, 100, 6), (46, 120, 7), (70, 150, 8)]:
    S.place(lava_rock(sd, 14 + sd % 3 * 4), x, y)
S.shadow(144, 50, 50, 18, 45); S.place(hut(), 132, 42)
S.shadow(172, 106, 50, 18, 45); S.place(hut(), 160, 98)
S.shadow(104, 68, 50, 18, 45); S.place(hut(scorched=True), 92, 60)
for (x, y, ash) in [(118, 80, False), (142, 128, False), (84, 100, True), (100, 132, True)]:
    S.shadow(x, y, 22, 8, 50); S.place(haystack(ash), x, y)
S.shadow(80, 82, 18, 7); S.place(traced('bajie'), 80, 82, extra=0.5)
S.shadow(124, 96, 22, 9); S.place(traced('tamtang'), 124, 96, extra=0.5)

img = S.compose()
emb = [(rnd.uniform(280, 660), rnd.uniform(80, 460)) for _ in range(90)]


def variant(tint, amount, dusk):
    im = img.copy(); grade(im, tint, amount)
    p = im.load()
    if dusk:
        for (x, y) in lava_px: p[x, y] = (255, 196, 90, 255) if h2(x, y) > 0.4 else (255, 140, 50, 255)
        for (pt, r, rgb) in S.glows: glow(im, pt[0], pt[1], r, rgb, 0.45)
    for (x, y) in emb:
        c = (255, 170, 60, 255) if dusk else (240, 140, 60, 255)
        for a in range(2):
            for b in range(2):
                if 0 <= x + a < W and 0 <= y + b < H: p[int(x) + a, int(y) + b] = c
    return im


day = variant((255, 240, 220), 0.06, False)
dusk = variant((150, 90, 140), 0.45, True)
day.save(os.path.join(OUTD, 'step4-bien-gioi-day-native.png')); dusk.save(os.path.join(OUTD, 'step4-bien-gioi-dusk-native.png'))
zoom(day, 2).save(os.path.join(OUTD, 'step4-bien-gioi.png'))
zoom(dusk, 2).save(os.path.join(OUTD, 'step4-bien-gioi-dusk.png'))
print('ok')
