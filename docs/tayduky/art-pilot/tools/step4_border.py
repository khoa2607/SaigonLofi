"""Step 4: the edge band between Hỏa Diệm Sơn (west, left) and Cao Lão Trang (east, right).
The band (about 5 tiles) carries both palettes: ash dusts the golden rice, scorched paddies, a half-singed haystack, embers drifting over the bund.
Day and dusk variants. -> ../out/step4-bien-gioi.png"""
import os, sys, math, random
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from px import Canvas, R, OUT, hx, ramp, zoom
from scene import Scene, IsoSprite, vnoise, h2, dither, glow, grade
import cast

HERE = os.path.dirname(os.path.abspath(__file__)); OUTD = os.path.join(HERE, '..', 'out')
W, H = 480, 270
S = Scene(W, H, 240, 6)
rnd = random.Random(3)

EARTH = [hx('#6e2618'), hx('#8a321c'), hx('#a64222'), hx('#c05a28')]
ASH = [hx('#4a4246'), hx('#625a5c'), hx('#7c7272')]
LAVA = [hx('#ff9a2a'), hx('#ffd25a')]
RICE = [hx('#c89a32'), hx('#e2b842'), hx('#f2d468'), hx('#a8802a')]
RICE_SCORCH = [hx('#7a5a2a'), hx('#94702e')]
WATER = [hx('#6a8a7a'), hx('#86a690')]
BUND = [hx('#6a7a3a'), hx('#56662e')]

lava_px = []


def wfire(x, y):
    """weight of Hỏa Diệm Sơn: 1 in the west, 0 in the east; the border is noise-warped (organic, not a straight line)."""
    d = (x - y) + (vnoise(x / 18, y / 18, 7) - 0.5) * 36
    return max(0.0, min(1.0, 0.5 - d / 72))


def fire_ground(px, py, x, y):
    n = vnoise(x / 7, y / 7, 1); n2 = vnoise(x / 13, y / 13, 2)
    if abs(n - 0.5) < 0.018 and n2 > 0.42:
        lava_px.append((px, py)); return LAVA[0] if h2(px, py) > 0.3 else LAVA[1]
    if n2 > 0.66: return ASH[1] if h2(int(x * 2), int(y * 2)) > 0.3 else ASH[2]
    return EARTH[min(3, int(n * 4.4))]


def rice_ground(px, py, x, y, ash=0.0):
    fx, fy = x % 20, y % 20
    if fx < 1.6 or fy < 1.6: return BUND[0] if fx < 0.8 or fy < 0.8 else BUND[1]          # dikes between paddies
    # rice clumps planted in rows: each clump is a small lit cluster on muddy water
    r = int(fy / 3.0); off = 1.25 if r % 2 else 0
    cxl = (math.floor((fx + off) / 2.5) + 0.5) * 2.5 - off; cyl = (r + 0.5) * 3.0
    dx, dy = (fx - cxl) * 2, (fy - cyl) * 2
    sx, sy = dx - dy, (dx + dy) / 2                                                       # offset in screen-ish space
    if abs(sx) <= 2.6 and -2.4 <= sy <= 1.2:
        c = RICE[2] if (sx < -0.6 and sy < -0.6) else RICE[0] if (sx > 1.0 or sy > 0.4) else RICE[1]
    else:
        c = WATER[0] if h2(int(x / 2), int(y / 2), 5) > 0.3 else WATER[1]
    if ash > 0 and vnoise(x / 2.2, y / 2.2, 12) < ash * 0.75:
        c = ASH[2] if h2(int(x * 2), int(y * 2), 3) > 0.5 else ASH[1]                    # ash drifts in clusters
    if ash > 0.6 and vnoise(x / 4, y / 4, 11) < (ash - 0.6) * 1.4:
        c = RICE_SCORCH[int(h2(int(x), int(y)) * 2)]                                     # scorched patches
    return c


def painter(px, py, x, y):
    t = wfire(x, y)
    if t >= 0.98: return fire_ground(px, py, x, y)
    if t <= 0.02: return rice_ground(px, py, x, y)
    # the edge band: both palettes, mixed by an ordered dither on the biome weight
    if vnoise(x / 3.2, y / 3.2, 13) < t: return fire_ground(px, py, x, y)     # organic clusters, not a fade
    return rice_ground(px, py, x, y, ash=t * 1.6)


S.ground(painter)

# ---------------------------------------------------------------- props
def flame(seed, h=22):
    rnd2 = random.Random(seed); c = Canvas(14, h + 4)
    FL = ramp('#7a1a10', '#d8401a', '#f6862a', '#ffc850', '#fff4c0')
    c.poly([(1, h + 2), (3, h * 0.5), (5, h * 0.6), (7, 1), (9, h * 0.45), (11, h * 0.55), (13, h + 2)], FL, shade=lambda X, Y: 1 if Y < h * 0.45 else 2 if Y < h * 0.7 else 3)
    c.poly([(4, h + 2), (6, h * 0.6), (7, h * 0.4), (8, h * 0.62), (10, h + 2)], FL, shade=Canvas.sh_flat(4), ink=False)
    c.outline(hx('#5a1410'))
    return c


def lava_rock(seed, s=8):
    rr = random.Random(seed); c = Canvas(34, 26)
    ROCK = ramp('#1a1012', '#341c1c', '#4e2822', '#6c382a', '#8a4a34')
    for k in range(3):
        x, y, r = rr.uniform(10, 24), rr.uniform(13, 18), rr.uniform(s * 0.7, s)
        c.fill(Canvas.m_ell(x, y, r, r * 0.75), ROCK, Canvas.sh_sphere(x, y, r, r * 0.75, True))
    for k in range(5):
        x, y = rr.uniform(8, 26), rr.uniform(12, 22)
        if c.px[int(y)][int(x)] is not None: c.put(int(x), int(y), LAVA[0]); c.put(int(x) + 1, int(y), LAVA[1])
    c.outline(); return c


def hut(scorched=0.0):
    sp = IsoSprite(90, 90, 44, 70)
    WALL = R['cream']; TIMBER = R['brown']
    sp.box(0, 0, 0, 18, 14, 10, WALL, WALL, WALL)
    for xx in (0, 8.5, 17): sp.box(xx, 13, 0, 1, 1, 10, TIMBER, TIMBER, TIMBER, ink=False)
    THATCH = ramp('#5a4020', '#9a7434', '#c8a04a', '#e2c26a', '#f4dc94') if scorched < 0.5 else ramp('#2a2420', '#4a4038', '#6a5a48', '#8a7a62', '#a49478')
    sp.roof(0, 0, 10, 18, 14, 9, THATCH, curl=0.6, over=2, ridge=ramp('#3a2a18', '#6a4a28', '#8a6438', '#a88050', '#c49c6a'), rows=2)
    c = sp.done()
    dx, dy = sp.p(7, 14, 0)
    c.fill(Canvas.m_poly([(dx, dy), (dx + 6, dy + 3), (dx + 6, dy - 9), (dx, dy - 12)]), TIMBER, Canvas.sh_flat(1))
    return c, 44, 70


def haystack(ashed=False):
    c = Canvas(26, 22)
    HAY = ramp('#6a4a18', '#b08430', '#dcb24a', '#f0d070', '#fff0a8')
    c.ell(13, 14, 11, 7.5, HAY); c.ell(13, 8, 7, 6, HAY)
    for k in range(6): c.line(5 + k * 3, 10, 4 + k * 3, 19, HAY[1])
    if ashed:
        for (x, y) in [(8, 5), (9, 4), (12, 3), (15, 4), (17, 6), (10, 7), (14, 6)]: c.put(x, y, ASH[2])
        c.ell(19, 12, 2, 1.6, ramp('#2a1a14', '#3a2a22', '#4a3a30', '#5a4a3e', '#6a5a4a'), hi=False)
    c.outline()
    return c


for (x, y, sd) in [(14, 60, 1), (40, 92, 2), (22, 122, 3), (58, 140, 4)]:
    f = flame(sd, 26 + sd * 3); S.add_canvas(f, 7, f.h - 2, x, y)
    S.glows.append((S.iso(x, y, 6), 26, (255, 120, 40)))
for (x, y, sd) in [(30, 70, 5), (8, 100, 6), (46, 120, 7), (70, 150, 8)]:
    S.add_canvas(lava_rock(sd, 7 + sd % 3 * 2), 17, 22, x, y)
h1, ax, ay = hut(); S.add_canvas(h1, ax, ay, 132, 42); S.shadow(140, 50, 22, 8, 50)
h2_, ax, ay = hut(); S.add_canvas(h2_, ax, ay, 160, 98)
h3, ax, ay = hut(scorched=1.0); S.add_canvas(h3, ax, ay, 92, 60)                                    # the border hut: singed thatch
for (x, y, ash) in [(118, 80, False), (142, 128, False), (86, 100, True), (100, 132, True)]:
    S.add_canvas(haystack(ash), 13, 20, x, y)

cs = cast.build()
def put(name, wx, wy):
    c = cs[name]; S.shadow(wx, wy, 7, 3); S.add_canvas(c, c.w // 2, c.h - 2, wx, wy, extra=0.5)
put('bajie', 92, 82)          # Bát Giới at the border, complaining about the heat
put('wukong', 62, 70)
put('monkey', 124, 104)

img = S.compose()

# embers drifting over the band (emissive)
emb = [(rnd.uniform(140, 330), rnd.uniform(40, 230)) for _ in range(60)]


def variant(tint, amount, dusk):
    im = img.copy(); grade(im, tint, amount)
    p = im.load()
    if dusk:
        for (x, y) in lava_px: p[x, y] = (255, 196, 90, 255) if h2(x, y) > 0.4 else (255, 140, 50, 255)
        for (pt, r, rgb) in S.glows: glow(im, pt[0], pt[1], r, rgb, 0.45)
    for (x, y) in emb:
        if 0 <= x < W and 0 <= y < H: p[int(x), int(y)] = (255, 170, 60, 255) if dusk else (240, 140, 60, 255)
    return im


day = variant((255, 240, 220), 0.06, False)
dusk = variant((150, 90, 140), 0.45, True)
day.save(os.path.join(OUTD, 'step4-bien-gioi-day-native.png')); dusk.save(os.path.join(OUTD, 'step4-bien-gioi-dusk-native.png'))
zoom(day, 3).save(os.path.join(OUTD, 'step4-bien-gioi.png'))
zoom(dusk, 3).save(os.path.join(OUTD, 'step4-bien-gioi-dusk.png'))
print('ok')
