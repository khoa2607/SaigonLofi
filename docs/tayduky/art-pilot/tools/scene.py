"""Isometric scene kit for the art pilot (v2, matched to the traced characters' pixel density).
World units: 1 tile = 8 units; screen px = (K(x - y), K/2 (x + y) - K z) with K = 4 (a tile is 64 x 32 px; a character is ~72 px tall).
IsoSprite sizes its own canvas and crops to the content, so nothing is clipped (v1 cut the bottom of tall sprites).
Clouds follow the owner's cloud reference (references/tayduky/ref/cloud.jpg): many small bumps, 3-4 flat tones, dark-tone outline,
flat shaded underside, detached puffs, plus long wisps for ground mist.
"""
import math, random
from PIL import Image
from px import Canvas, R, OUT, hx, ramp

K = 4


def h2(x, y, s=0):
    n = (int(x) * 374761393 + int(y) * 668265263 + s * 2147483647) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    return ((n ^ (n >> 16)) & 0xffffff) / 0xffffff


def vnoise(x, y, s=0):
    xi, yi = math.floor(x), math.floor(y); fx, fy = x - xi, y - yi
    u, v = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b, c, d = h2(xi, yi, s), h2(xi + 1, yi, s), h2(xi, yi + 1, s), h2(xi + 1, yi + 1, s)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v


BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def dither(x, y, t):
    return BAYER[y & 3][x & 3] < t * 16


class Scene:
    def __init__(self, w, h, ox, oy):
        self.w, self.h, self.ox, self.oy = w, h, ox, oy
        self.img = Image.new('RGBA', (w, h), (0, 0, 0, 255))
        self.items = []; self.glows = []

    def iso(self, x, y, z=0):
        return (self.ox + K * (x - y), self.oy + K / 2 * (x + y) - K * z)

    def to_world(self, px, py):
        a = (px - self.ox) / K; b = (py - self.oy) / (K / 2)
        return ((b + a) / 2.0, (b - a) / 2.0)

    def ground(self, painter):
        pix = self.img.load()
        for py in range(self.h):
            for px in range(self.w):
                wx, wy = self.to_world(px + .5, py + .5)
                c = painter(px, py, wx, wy)
                if c is not None: pix[px, py] = c + (255,)

    def add(self, im, x, y, depth):
        self.items.append((depth, im, int(x), int(y)))

    def place(self, spr, wx, wy, extra=0):
        """spr = (canvas_or_image, ax, ay): its anchor lands on world point (wx, wy, 0)."""
        c, ax, ay = spr; sx, sy = self.iso(wx, wy)
        self.add(c.image() if isinstance(c, Canvas) else c, sx - ax, sy - ay, wx + wy + extra)

    def shadow(self, wx, wy, rx, ry=None, a=70):
        sx, sy = self.iso(wx, wy); ry = ry or rx / 2
        sh = Image.new('RGBA', (int(rx * 2 + 2), int(ry * 2 + 2)), (0, 0, 0, 0)); p = sh.load()
        for y in range(sh.height):
            for x in range(sh.width):
                if ((x + .5 - rx - 1) / rx) ** 2 + ((y + .5 - ry - 1) / ry) ** 2 <= 1: p[x, y] = (40, 20, 40, a)
        self.img.alpha_composite(sh, (int(sx - rx - 1), int(sy - ry - 1)))

    def compose(self):
        for d, im, x, y in sorted(self.items, key=lambda t: t[0]):
            self.img.alpha_composite(im, (x, y))
        return self.img


def crop_canvas(c, ax, ay, pad=1):
    ys = [y for y in range(c.h) if any(v is not None for v in c.px[y])]
    xs = [x for x in range(c.w) if any(c.px[y][x] is not None for y in ys)]
    x0, x1, y0, y1 = min(xs) - pad, max(xs) + pad, min(ys) - pad, max(ys) + pad
    n = Canvas(x1 - x0 + 1, y1 - y0 + 1)
    for y in range(n.h):
        for x in range(n.w):
            if c.inside(x + x0, y + y0): n.px[y][x] = c.px[y + y0][x + x0]; n.sid[y][x] = c.sid[y + y0][x + x0]
    return n, ax - x0, ay - y0


class IsoSprite:
    """A large scratch canvas with its own iso origin (world (0,0,0)); done() inks, crops and returns (canvas, ax, ay)."""

    def __init__(self, size=760):
        self.c = Canvas(size, size); self.ax, self.ay = size // 2, int(size * 0.72)

    def p(self, x, y, z=0):
        return (self.ax + K * (x - y), self.ay + K / 2 * (x + y) - K * z)

    def box(self, x, y, z, w, d, h, top, left, right, ink=True, tex=None):
        c = self.c; P = self.p
        m = Canvas.m_poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)])
        c.fill(m, right, (lambda X, Y: tex(2, X, Y)) if tex else Canvas.sh_flat(1), ink)
        m = Canvas.m_poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)])
        c.fill(m, left, (lambda X, Y: tex(1, X, Y)) if tex else Canvas.sh_flat(2), ink)
        m = Canvas.m_poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)])
        c.fill(m, top, (lambda X, Y: tex(0, X, Y)) if tex else Canvas.sh_flat(3), ink)

    def roof(self, x, y, z, w, d, h, rmp, curl=2.5, over=3, ridge=None, rows=3):
        """hip roof with upturned (curved) eaves; glazed tile courses and a ridge with flying ends."""
        c = self.c; P = self.p
        x0, y0, x1, y1 = x - over, y - over, x + w + over, y + d + over
        n = 16
        def eave(ax, ay, bx, by):
            return [(ax + (bx - ax) * i / n, ay + (by - ay) * i / n, z + curl * ((2 * i / n - 1) ** 4)) for i in range(n + 1)]
        ins = min(w, d) / 2 + over * 0.5
        rx0, rx1, ry = x0 + ins, x1 - ins, (y0 + y1) / 2
        if rx1 < rx0: rx0 = rx1 = (x0 + x1) / 2
        right = [P(*q) for q in eave(x1, y1, x1, y0)] + [P(rx1, ry, z + h)]
        front = [P(*q) for q in eave(x0, y1, x1, y1)] + [P(rx1, ry, z + h), P(rx0, ry, z + h)]
        mr = Canvas.m_poly(right); mf = Canvas.m_poly(front)
        c.fill(mr, rmp, Canvas.sh_flat(1)); c.fill(mf, rmp, Canvas.sh_flat(2))
        steps = 60
        for k in range(1, steps):
            t = k / steps
            lift = curl * (1 - t) * 0.9
            if k % rows == 0:
                a = P(x0 + (rx0 - x0) * t, y1 + (ry - y1) * t, z + h * t + lift); b = P(x1 + (rx1 - x1) * t, y1 + (ry - y1) * t, z + h * t + lift)
                for q in Canvas.m_line(int(a[0]), int(a[1]), int(b[0]), int(b[1])):
                    if q in mf: c.put(q[0], q[1], rmp[1])
                a2 = P(x1 + (rx1 - x1) * t, y1 + (ry - y1) * t, z + h * t + lift); b2 = P(x1 + (rx1 - x1) * t, y0 + (ry - y0) * t, z + h * t + lift)
                for q in Canvas.m_line(int(a2[0]), int(a2[1]), int(b2[0]), int(b2[1])):
                    if q in mr: c.put(q[0], q[1], rmp[0])
        # vertical tile seams (barrel tiles) on the front slope
        for i in range(1, int((x1 - x0) * K / 6)):
            u = i / ((x1 - x0) * K / 6)
            a = P(x0 + (x1 - x0) * u, y1, z + curl * ((2 * u - 1) ** 4)); b = P(rx0 + (rx1 - rx0) * u, ry, z + h)
            for q in Canvas.m_line(int(a[0]), int(a[1]), int(b[0]), int(b[1])):
                if q in mf and c.px[q[1]][q[0]] == rmp[2]: c.put(q[0], q[1], rmp[3])
        for q in eave(x0, y1, x1, y1):
            sx, sy = P(*q)
            for dx in range(K): c.put(int(sx) + dx, int(sy) - 1, rmp[4]); c.put(int(sx) + dx, int(sy), rmp[3])
        rg = ridge or R['gold']
        a, b = P(rx0, ry, z + h), P(rx1, ry, z + h)
        c.fill(Canvas.m_line(int(a[0]), int(a[1]) - 2, int(b[0]), int(b[1]) - 2, 3), rg, Canvas.sh_flat(3))
        for (ex, sgn) in ((a, -1), (b, 1)):
            c.fill(Canvas.m_poly([(ex[0], ex[1] - 2), (ex[0] + 5 * sgn, ex[1] - 12), (ex[0] + 8 * sgn, ex[1] - 9), (ex[0] + 2 * sgn, ex[1] + 2)]), rg, Canvas.sh_flat(3))
        for q in (eave(x0, y1, x1, y1)[0], eave(x0, y1, x1, y1)[-1], eave(x1, y1, x1, y0)[-1]):
            sx, sy = P(*q); c.fill(Canvas.m_poly([(sx - 2, sy), (sx + 2, sy - 8), (sx + 4, sy - 2)]), rg, Canvas.sh_flat(3))

    def done(self, outline=OUT):
        n, ax, ay = crop_canvas(self.c, self.ax, self.ay)
        n.outline(outline)
        return n, ax, ay


# ---------------------------------------------------------------- clouds (style of the owner's cloud.jpg)
HEAVEN_CLOUD = [hx('#9a86b6'), hx('#c8b4d8'), hx('#e8daee'), hx('#f8f0f8'), hx('#ffffff')]   # outline, shadow, mid, light, highlight


def cumulus(seed, w=150, h=80, tones=HEAVEN_CLOUD):
    """a lumpy dome: bumps make the silhouette; inside, each bump gets a lit cap and a shadow pocket under it (tone patches, no inner lines)."""
    rnd = random.Random(seed); c = Canvas(w, h)
    ol, sh, mid, li, hi = tones
    base = h - 5
    mass = set()
    for i in range(5):
        cx = w * (0.16 + 0.17 * i) + rnd.uniform(-4, 4); r = h * (0.24 + 0.22 * (1 - abs(i - 2) / 2)) + rnd.uniform(-3, 3)
        mass |= Canvas.m_ell(cx, base - r * 0.7, r * 1.0, r * 0.9)
    top = {}
    for (x, y) in mass:
        if 0 <= x < w and (x not in top or y < top[x]): top[x] = y
    bumps = []
    for k in range(int(w / 6)):
        x = rnd.uniform(5, w - 5); xi = int(x)
        if xi in top:
            r = rnd.uniform(h * 0.07, h * 0.14); bumps.append((x, top[xi] + r * 0.45, r))
    for k in range(int(w / 9)):
        x = rnd.uniform(10, w - 10); xi = int(x)
        if xi in top:
            r = rnd.uniform(h * 0.08, h * 0.15); bumps.append((x, rnd.uniform(top[xi] + r * 1.4, base - h * 0.22), r))
    for (x, y, r) in bumps: mass |= Canvas.m_ell(x, y, r, r * 0.9)
    mass = {(x, y) for (x, y) in mass if 0 <= x < w and 0 <= y <= base}
    for (x, y) in mass: c.px[y][x] = mid
    bumps.sort(key=lambda b: b[1])
    for (bx, by, r) in bumps:
        for y in range(int(by - r - 1), int(by + r + 4)):
            for x in range(int(bx - r - 1), int(bx + r + 2)):
                if (x, y) not in mass: continue
                dx, dy = (x + .5 - bx) / r, (y + .5 - by) / (r * 0.9); d = dx * dx + dy * dy
                if d <= 1:
                    v = -0.62 * dx - 0.78 * dy
                    if v > 0.72: c.px[y][x] = hi
                    elif v > 0.2: c.px[y][x] = li
                    elif c.px[y][x] not in (li, hi): c.px[y][x] = mid
                elif d <= 1.55 and dy > 0.35 and c.px[y][x] == mid:
                    c.px[y][x] = sh                                                      # shadow pocket under the bump
    for (x, y) in mass:
        if y > base - h * 0.14: c.px[y][x] = sh if (y > base - h * 0.07 or dither(x, y, 0.5)) else c.px[y][x]
    for k in range(rnd.randint(2, 4)):
        side = rnd.choice((-1, 1)); x = w / 2 + side * rnd.uniform(w * 0.40, w * 0.47); y = base - rnd.uniform(3, h * 0.3); r = rnd.uniform(2.5, 4.5)
        for (px_, py_) in Canvas.m_ell(x, y, r, r * 0.85):
            if 0 <= px_ < w and 0 <= py_ < h: c.px[py_][px_] = li if py_ < y else mid
    c.outline(ol)
    return c, w // 2, base


def wisp(seed, w=170, h=30, tones=HEAVEN_CLOUD):
    """long tapered mist streaks, layered (ground clouds drifting through Heaven)."""
    rnd = random.Random(seed); c = Canvas(w, h)
    ol, sh, mid, li, hi = tones
    for k in range(3):
        L = rnd.uniform(w * 0.55, w * 0.95); x0 = rnd.uniform(0, w - L); y0 = 7 + k * 7 + rnd.uniform(-1, 1); t = rnd.uniform(3.5, 6)
        top, bot = [], []
        for i in range(31):
            u = i / 30; x = x0 + L * u; yy = y0 + math.sin(u * math.pi * 1.3 + k) * 1.2
            th = t * (math.sin(math.pi * u) ** 0.7)
            top.append((x, yy - th)); bot.append((x, yy + th * 0.7))
        m = {q for q in Canvas.m_poly(top + bot[::-1]) if 0 <= q[0] < w and 0 <= q[1] < h}
        for (x, y) in m: c.px[y][x] = li if y < y0 - 1.5 else mid if y < y0 + 1 else sh
    c.outline(ol)
    return c, w // 2, h // 2


# ---------------------------------------------------------------- peach tree (2x detail)
def peach_tree(seed):
    rnd = random.Random(seed); c = Canvas(120, 136)
    trunk = R['brown']
    c.poly([(54, 135), (66, 135), (64, 96), (74, 74), (68, 70), (61, 84), (52, 68), (44, 72), (56, 96)], trunk, shade=Canvas.sh_cyl(44, 74))
    c.line(58, 130, 59, 100, trunk[1]); c.line(62, 92, 70, 76, trunk[3])
    leaves = R['green']
    for (x, y, r) in [(32, 52, 20), (82, 48, 22), (58, 30, 22), (46, 70, 16), (76, 70, 16), (60, 56, 18), (98, 62, 12), (20, 66, 12)]:
        x += rnd.uniform(-2, 2); y += rnd.uniform(-2, 2)
        c.fill(Canvas.m_ell(x, y, r, r * 0.8), leaves, Canvas.sh_sphere(x, y, r, r * 0.8, True))
        for j in range(int(r)):                                               # leaf clusters: small darker crescents inside each clump
            a = rnd.uniform(0, math.tau); d = rnd.uniform(0.3, 0.85) * r
            qx, qy = int(x + math.cos(a) * d), int(y + math.sin(a) * d * 0.8)
            if c.inside(qx, qy) and c.px[qy][qx] is not None and c.px[qy][qx] != leaves[0]:
                c.put(qx, qy, leaves[1] if qx + qy > x + y else leaves[3]); c.put(qx + 1, qy, leaves[1] if qx + qy > x + y else leaves[3])
    pink = R['pink']
    for i in range(70):
        x, y = rnd.uniform(10, 110), rnd.uniform(10, 84)
        if not c.inside(int(x) + 1, int(y) + 1) or c.px[int(y)][int(x)] is None: continue
        tone = 4 if (x + y) < 80 else 3
        c.put(int(x), int(y), pink[tone]); c.put(int(x) + 1, int(y), pink[tone - 1]); c.put(int(x), int(y) + 1, pink[tone - 1]); c.put(int(x) + 1, int(y) + 1, pink[2])
    PEACH = ramp('#8a2a3a', '#d8566a', '#f69a8a', '#ffd0b0', '#fff0e0')
    for i in range(9):
        x, y = rnd.uniform(18, 102), rnd.uniform(34, 82)
        if c.px[int(y)][int(x)] is None: continue
        c.ell(x, y, 3.8, 3.6, PEACH, hi=True); c.put(int(x), int(y) - 4, leaves[3]); c.put(int(x) + 1, int(y) - 4, leaves[2])
    c.outline(); c.clean()
    return c, 60, 133


PIXFONT = {'A': '010101111101101', 'E': '111100110100111', 'H': '101101111101101', 'I': '111010010010111', 'M': '101111111101101',
           'N': '110101101101101', 'O': '010101101101010', 'T': '111010010010010', 'U': '101101101101111', 'Q': '010101101110011',
           'S': '011100010001110', 'C': '011100100100011', 'G': '011100101101011', 'L': '100100100100111', 'D': '110101101101110',
           'R': '110101110101101', 'B': '110101110101110', 'Y': '101101010010010', 'P': '110101110100100', 'K': '101101110101101', ' ': '000000000000000'}


def grade(img, tint, amount):
    px = img.load(); tr, tg, tb = tint
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (int(r * (1 - amount + amount * tr / 255)), int(g * (1 - amount + amount * tg / 255)), int(b * (1 - amount + amount * tb / 255)), a)
    return img


def glow(img, x, y, r, rgb, strength=1.0):
    px = img.load()
    for yy in range(max(0, int(y - r)), min(img.height, int(y + r + 1))):
        for xx in range(max(0, int(x - r)), min(img.width, int(x + r + 1))):
            d = math.hypot((xx - x), (yy - y) * 1.6) / r
            if d >= 1: continue
            band = 1 - d
            if not dither(xx, yy, min(1, band * 2.2)): continue
            k = strength * (0.18 + 0.5 * (band > 0.5) + 0.3 * (band > 0.8))
            R0, G0, B0, A0 = px[xx, yy]
            px[xx, yy] = (min(255, int(R0 + rgb[0] * k)), min(255, int(G0 + rgb[1] * k)), min(255, int(B0 + rgb[2] * k)), A0)


def traced(name):
    """the owner's four pilgrims, traced from the top-down reference (out/trace-*.png): (image, ax, ay) anchored at the feet."""
    import os
    im = Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'out', 'trace-%s.png' % name)).convert('RGBA')
    return im, im.width // 2, im.height - 3
