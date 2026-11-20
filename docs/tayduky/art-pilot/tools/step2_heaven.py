"""Step 2: a Thiên Cung corner. Nam Thiên Môn (curved double-eave roof), jade floor floating on a cloud sea, ground clouds,
peach trees, the Bát Quái furnace, soldiers, a fairy, Wukong pilfering a peach. Output ../out/step2-thien-cung.png (+ native)."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from px import Canvas, R, OUT, hx, ramp, zoom
from scene import Scene, IsoSprite, cloud_sprite, peach_tree, text, vnoise, h2, dither, glow
import cast

HERE = os.path.dirname(os.path.abspath(__file__)); OUTD = os.path.join(HERE, '..', 'out')
W, H = 480, 270
S = Scene(W, H, 240, 36)

JADE = [hx('#e9e7d6'), hx('#e2e4cf'), hx('#eeeadb'), hx('#dfe0d0')]
GROUT = hx('#b9b49e'); GOLDP = [hx('#f3d98a'), hx('#ecd07c')]; GOLDG = hx('#c49a4a')
SEA = [hx('#f4dce6'), hx('#e6cce4'), hx('#d4bce0'), hx('#c3aedc')]
EDGE_TOP, EDGE_SIDE, EDGE_SIDE2 = hx('#d8b860'), hx('#cfc9b2'), hx('#a89f88')


def on_platform(x, y):
    return 8 <= x <= 102 and 6 <= y <= 100


def on_path(x, y):
    return 40 <= x <= 54 and y >= 36


def painter(px, py, x, y):
    if on_platform(x, y):
        if (x - 8) < 1.2 or (y - 6) < 1.2 or (102 - x) < 1.2 or (100 - y) < 1.2: return EDGE_TOP
        tx, ty = int(x // 8), int(y // 8)
        if on_path(x, y):
            if (x % 8) < 0.7 or (y % 8) < 0.7: return GOLDG
            return GOLDP[int(h2(tx, ty) * 2)]
        if (x % 8) < 0.7 or (y % 8) < 0.7: return GROUT
        c = JADE[int(h2(tx, ty, 3) * 4)]
        if h2(int(x * 2), int(y * 2), 9) < 0.05: c = hx('#d2d4c0')       # flecks in the jade
        return c
    # platform side faces (front edges drop 6 units)
    for k in range(1, 13):
        xx, yy = S.to_world(px + .5, py + .5 - k)
        if on_platform(xx, yy):
            return EDGE_SIDE if k < 3 else EDGE_SIDE2 if (k < 11 and (px // 6) % 2) else EDGE_SIDE if k < 11 else hx('#8e86a0')
    # cloud sea: stepped bands + noise puffs, dithered between tones
    v = vnoise(x / 22.0, y / 22.0, 4) * 0.6 + vnoise(x / 9.0, y / 9.0, 5) * 0.4
    base = min(3, max(0, int(py / 70)))
    t = v * 1.4 - 0.2
    i = base - (1 if t > 0.55 else 0) - (1 if (t > 0.8 and dither(px, py, (t - 0.8) * 4)) else 0)
    return SEA[max(0, min(3, i))]


S.ground(painter)

# ---------------------------------------------------------------- Nam Thiên Môn: two red pillars, beams, plaque, double curved roof
g = IsoSprite(140, 150, 30, 118)
for px_ in (0, 30):
    g.box(px_ - 1, -1, 0, 7, 7, 3, R['white'], R['white'], R['white'])
    g.box(px_, 0, 3, 5, 5, 30, R['red'], R['red'], R['red'])
    g.box(px_ - 1, -1, 31, 7, 7, 2, R['gold'], R['gold'], R['gold'])
g.box(-3, 0, 25, 41, 5, 3, R['red'], R['red'], R['red'])
g.box(-3, 0, 33, 41, 5, 3, R['red'], R['red'], R['red'])
g.box(-2, 0, 30, 39, 5, 1, R['gold'], R['gold'], R['gold'])
# plaque with the place name (stele layer of signposting)
pl = Canvas.m_poly([g.p(10, 5.2, 18), g.p(26, 5.2, 18), g.p(26, 5.2, 24), g.p(10, 5.2, 24)])
g.c.fill(pl, R['dark'], Canvas.sh_flat(1))
g.roof(-4, -3, 36, 43, 11, 9, R['jade'], curl=3.2, over=3, rows=2)
g.box(6, 0, 45, 24, 5, 3, R['red'], R['red'], R['red'])
g.roof(4, -2, 48, 28, 9, 8, R['jade'], curl=2.6, over=3, rows=2)
gate = g.done()
a, b = g.p(10, 5.2, 24); text(gate, 'NAM THIEN MON', a + 1, b - 0, R['gold'][3]) if False else None
# write the plaque text along the plaque (it slants with the iso face: one glyph column per 2 px step)
sx, sy = g.p(11, 5.2, 23)
for i, ch in enumerate('NAM THIEN MON'):
    from scene import PIXFONT
    gph = PIXFONT.get(ch, PIXFONT[' '])
    for r in range(5):
        for k in range(3):
            if gph[r * 3 + k] == '1':
                X = sx + i * 4 + k; Y = sy + r + (i * 4 + k) // 2
                gate.put(int(X), int(Y), R['gold'][3])
S.add_canvas(gate, 30, 118, 34, 30, extra=6)

# ---------------------------------------------------------------- Bát Quái furnace (bronze, trigram band, glowing mouth)
f = IsoSprite(60, 64, 20, 46)
f.box(0, 0, 0, 12, 12, 3, R['dark'], R['dark'], R['dark'])
f.box(1, 1, 3, 10, 10, 12, R['gold'], R['gold'], R['gold'])
f.box(0, 0, 15, 12, 12, 2, R['brown'], R['brown'], R['brown'])
f.roof(1, 1, 17, 10, 10, 6, R['brown'], curl=1.5, over=1, rows=2)
fc = f.done()
mx, my = f.p(4, 11, 6)
fc.fill(Canvas.m_poly([(mx, my), (mx + 8, my + 4), (mx + 8, my), (mx, my - 4)]), ramp('#7a1a10', '#c83a10', '#f08a20', '#ffd060', '#fff6c0'), Canvas.sh_flat(3))
for k in range(3):
    lx, ly = f.p(1 + k * 3.5, 11, 13)
    fc.put(int(lx) + 1, int(ly), R['dark'][1]); fc.put(int(lx) + 2, int(ly) + 1, R['dark'][1]); fc.put(int(lx) + 4, int(ly) + 2, R['dark'][1])
S.add_canvas(fc, 20, 46, 14, 48)
S.glows.append((S.iso(18, 60, 6), 22, (255, 150, 60)))

# ---------------------------------------------------------------- peach trees, characters, ground clouds
for (wx, wy, sd) in [(80, 40, 1), (90, 74, 2), (22, 80, 3), (66, 92, 4)]:
    t, ax, ay = peach_tree(sd)
    S.shadow(wx, wy, 14, 6, 60); S.add_canvas(t, ax, ay, wx, wy)

cs = cast.build()
def put_char(name, wx, wy):
    c = cs[name]; S.shadow(wx, wy, 7, 3)
    S.add_canvas(c, c.w // 2, c.h - 2, wx, wy, extra=0.5)
put_char('soldier', 34, 40); put_char('soldier', 72, 38)
put_char('fairy', 62, 60)
put_char('wukong', 92, 46)
put_char('monkey', 94, 88)
put_char('fairy', 38, 74)

for (wx, wy, sd, w_, h_) in [(6, 50, 11, 70, 30), (104, 30, 12, 64, 26), (52, 104, 13, 90, 34), (104, 96, 14, 70, 28), (4, 96, 15, 60, 26), (-4, 24, 16, 60, 24)]:
    cl = cloud_sprite(sd, w_, h_)
    S.add_canvas(cl, w_ // 2, h_ - 4, wx, wy, extra=20)
cl = cloud_sprite(21, 40, 16); S.add_canvas(cl, 20, 12, 70, 66, extra=-2)   # a small cloud drifting across the floor

img = S.compose()
for (p, r, rgb) in S.glows: glow(img, p[0], p[1], r, rgb, 0.35)
img.save(os.path.join(OUTD, 'step2-thien-cung-native.png'))
zoom(img, 3).save(os.path.join(OUTD, 'step2-thien-cung.png'))
print('ok')
