"""Step 2 (v2): a Thiên Cung corner at the traced characters' density (K = 4). Nam Thiên Môn with a curved double-eave roof,
a jade floor floating on a cloud sea, cumulus clouds and ground mist after the owner's cloud reference, peach trees, the Bát Quái furnace,
Wukong pilfering peaches. -> ../out/step2-thien-cung.png (+ native)"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from px import Canvas, R, OUT, hx, ramp, zoom
from scene import Scene, IsoSprite, cumulus, wisp, peach_tree, vnoise, h2, dither, glow, PIXFONT, traced, K

HERE = os.path.dirname(os.path.abspath(__file__)); OUTD = os.path.join(HERE, '..', 'out')
W, H = 960, 540
S = Scene(W, H, 480, 112)

JADE = [hx('#e9e7d6'), hx('#e2e4cf'), hx('#eeeadb'), hx('#dfe0d0')]
GROUT, GROUT_HI = hx('#bab49e'), hx('#f6f3e8')
GOLDP = [hx('#f3d98a'), hx('#ecd07c')]; GOLDG = hx('#c49a4a')
SEA = [hx('#f4dce6'), hx('#e8cfe6'), hx('#d8c0e2'), hx('#c8b2de')]
RIM, SIDE_A, SIDE_B, SIDE_DK = hx('#d9b860'), hx('#d4cdb6'), hx('#b4aa92'), hx('#8e86a0')


def on_platform(x, y): return 8 <= x <= 102 and 6 <= y <= 100
def on_path(x, y): return 40 <= x <= 54 and y >= 36


def painter(px, py, x, y):
    if on_platform(x, y):
        if min(x - 8, y - 6, 102 - x, 100 - y) < 0.6: return RIM
        tx, ty = int(x // 8), int(y // 8); fx, fy = x % 8, y % 8
        if on_path(x, y):
            if fx < 0.35 or fy < 0.35: return GOLDG
            return GOLDP[int(h2(tx, ty) * 2)]
        if fx < 0.35 or fy < 0.35: return GROUT
        if fx < 0.7 or fy < 0.7: return GROUT_HI
        c = JADE[int(h2(tx, ty, 3) * 4)]
        if h2(int(x * 4), int(y * 4), 9) < 0.03: c = hx('#d0d2bc')
        if 2 < fx < 3.2 and 2 < fy < 6 and h2(tx, ty, 7) < 0.25: c = hx('#e6e8d8')
        return c
    for k in range(1, 25):
        xx, yy = S.to_world(px + .5, py + .5 - k)
        if on_platform(xx, yy):
            if k < 3: return SIDE_A
            if k > 21: return SIDE_DK
            return SIDE_A if (px // 10) % 2 else SIDE_B
    v = vnoise(x / 22.0, y / 22.0, 4) * 0.6 + vnoise(x / 9.0, y / 9.0, 5) * 0.4
    base = min(3, max(0, int(py / 140)))
    t = v * 1.4 - 0.2
    i = base - (1 if t > 0.55 else 0) - (1 if (t > 0.8 and dither(px, py, (t - 0.8) * 4)) else 0)
    return SEA[max(0, min(3, i))]


S.ground(painter)

# ---------------------------------------------------------------- Nam Thiên Môn
g = IsoSprite(900)
for gx in (0, 30):
    g.box(gx - 1, -1, 0, 7, 7, 3, R['white'], R['white'], R['white'])
    g.box(gx, 0, 3, 5, 5, 30, R['red'], R['red'], R['red'])
    g.box(gx - 1, -1, 31, 7, 7, 2, R['gold'], R['gold'], R['gold'])
g.box(-3, 0, 25, 41, 5, 3, R['red'], R['red'], R['red'])
g.box(-3, 0, 33, 41, 5, 3, R['red'], R['red'], R['red'])
g.box(-2, 0, 30, 39, 5, 1, R['gold'], R['gold'], R['gold'])
pl = Canvas.m_poly([g.p(9, 5.2, 17.5), g.p(27, 5.2, 17.5), g.p(27, 5.2, 24.5), g.p(9, 5.2, 24.5)])
g.c.fill(pl, R['dark'], Canvas.sh_flat(1))
for (a, b) in (((9, 17.5), (27, 17.5)), ((9, 24.5), (27, 24.5))):
    A, B = g.p(a[0], 5.2, a[1]), g.p(b[0], 5.2, b[1])
    for q in Canvas.m_line(int(A[0]), int(A[1]), int(B[0]), int(B[1])): g.c.put(q[0], q[1], R['gold'][3])
sx, sy = g.p(10, 5.2, 23.4)
for i, ch in enumerate('NAM THIEN MON'):
    gph = PIXFONT.get(ch, PIXFONT[' '])
    for r in range(5):
        for k in range(3):
            if gph[r * 3 + k] == '1':
                u = (i * 4 + k) * 2
                for a in range(2):
                    for b in range(2): g.c.put(int(sx + u + a), int(sy + r * 2 + u // 2 + b), R['gold'][3])
g.roof(-4, -3, 36, 43, 11, 9, R['jade'], curl=3.2, over=3, rows=3)
g.box(6, 0, 45, 24, 5, 3, R['red'], R['red'], R['red'])
g.roof(4, -2, 48, 28, 9, 8, R['jade'], curl=2.6, over=3, rows=3)
S.place(g.done(), 34, 30, extra=6)

# ---------------------------------------------------------------- Bát Quái furnace
f = IsoSprite(400)
BR = ramp('#3a2414', '#6e4420', '#a8702e', '#d4a04a', '#f2cc78')
f.box(0, 0, 0, 12, 12, 3, R['dark'], R['dark'], R['dark'])
f.box(1, 1, 3, 10, 10, 12, BR, BR, BR)
f.box(0, 0, 15, 12, 12, 2, R['brown'], R['brown'], R['brown'])
f.roof(1, 1, 17, 10, 10, 6, R['brown'], curl=1.5, over=1, rows=3)
for zz in (6, 12):
    A, B = f.p(1, 11, zz), f.p(11, 11, zz)
    for q in Canvas.m_line(int(A[0]), int(A[1]), int(B[0]), int(B[1])): f.c.put(q[0], q[1], BR[1])
mx, my = f.p(4, 11, 4)
FIRE = ramp('#7a1a10', '#c83a10', '#f08a20', '#ffd060', '#fff6c0')
f.c.fill(Canvas.m_poly([(mx, my), (mx + 16, my + 8), (mx + 16, my - 8), (mx, my - 16)]), FIRE, lambda X, Y: 4 if (X - mx) % 5 < 2 else 3)
S.place(f.done(), 14, 48)
S.glows.append((S.iso(16, 60, 4), 44, (255, 150, 60)))

# ---------------------------------------------------------------- peach trees, Wukong, clouds
for (wx, wy, sd) in [(80, 40, 1), (90, 74, 2), (22, 80, 3), (66, 92, 4)]:
    S.shadow(wx, wy, 30, 12, 55); S.place(peach_tree(sd), wx, wy)
S.shadow(92, 50, 16, 6); S.place(traced('wukong'), 92, 50, extra=0.5)

for (wx, wy, sd, w_, h_) in [(-6, 64, 11, 170, 86), (106, 26, 12, 150, 76), (54, 108, 13, 200, 96), (108, 92, 14, 150, 70), (-4, 100, 15, 130, 64), (18, -8, 16, 120, 60)]:
    S.place(cumulus(sd, w_, h_), wx, wy, extra=30)
for (wx, wy, sd) in [(116, 60, 21)]:
    S.place(wisp(sd, 190, 30), wx, wy, extra=40)

img = S.compose()
for (p, r, rgb) in S.glows: glow(img, p[0], p[1], r, rgb, 0.35)
img.save(os.path.join(OUTD, 'step2-thien-cung-native.png'))
zoom(img, 2).save(os.path.join(OUTD, 'step2-thien-cung.png'))
print('ok')
