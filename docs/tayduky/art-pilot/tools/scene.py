"""Isometric scene kit for the art pilot: projection, ground painter, iso boxes with curved roofs, clouds, trees, depth-sorted sprites.
World units: 1 tile = 8 units; screen px = (2(x - y), (x + y) - 2z) (K = 2 art px per unit, the Lofi Worlds projection). Characters are 48 px (24 units) tall.
"""
import math, random
from PIL import Image
from px import Canvas, R, OUT, hx, ramp


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
    """True on a 4x4 ordered pattern with density t in 0..1 (pixel-art blending without smooth gradients)."""
    return BAYER[y & 3][x & 3] < t * 16


class Scene:
    def __init__(self, w, h, ox, oy):
        self.w, self.h, self.ox, self.oy = w, h, ox, oy
        self.img = Image.new('RGBA', (w, h), (0, 0, 0, 255))
        self.items = []      # (depth, image, x, y)
        self.glows = []      # (x, y, r, rgb, strength) emissive lights for the night pass
        self.emis = []       # (image, x, y) emissive masks

    def iso(self, x, y, z=0):
        return (self.ox + 2 * (x - y), self.oy + (x + y) - 2 * z)

    def to_world(self, px, py):
        a = (px - self.ox) / 2.0; b = py - self.oy
        return ((b + a) / 2.0, (b - a) / 2.0)

    def ground(self, painter):
        pix = self.img.load()
        for py in range(self.h):
            for px in range(self.w):
                wx, wy = self.to_world(px + .5, py + .5)
                c = painter(px, py, wx, wy)
                if c is not None: pix[px, py] = c + (255,)

    def add(self, im, x, y, depth, emis=None):
        self.items.append((depth, im, int(x), int(y), emis))

    def add_canvas(self, c, ax, ay, wx, wy, extra=0, emis=None):
        """place a sprite canvas so its anchor (ax, ay) lands on world point (wx, wy, 0)."""
        sx, sy = self.iso(wx, wy)
        self.add(c.image() if isinstance(c, Canvas) else c, sx - ax, sy - ay, wx + wy + extra, emis)

    def shadow(self, wx, wy, rx, ry=None, a=70):
        sx, sy = self.iso(wx, wy); ry = ry or rx / 2
        sh = Image.new('RGBA', (int(rx * 2 + 2), int(ry * 2 + 2)), (0, 0, 0, 0)); p = sh.load()
        for y in range(sh.height):
            for x in range(sh.width):
                if ((x + .5 - rx - 1) / rx) ** 2 + ((y + .5 - ry - 1) / ry) ** 2 <= 1: p[x, y] = (40, 20, 40, a)
        self.img.alpha_composite(sh, (int(sx - rx - 1), int(sy - ry - 1)))

    def compose(self):
        for d, im, x, y, e in sorted(self.items, key=lambda t: t[0]):
            self.img.alpha_composite(im, (x, y))
        return self.img


# ---------------------------------------------------------------- iso building blocks drawn into a sprite canvas
class IsoSprite:
    """A canvas with its own iso origin, for drawing boxes/roofs in world units; anchor = world (0,0,0)."""

    def __init__(self, w, h, ax, ay):
        self.c = Canvas(w, h); self.ax, self.ay = ax, ay

    def p(self, x, y, z=0):
        return (self.ax + 2 * (x - y), self.ay + (x + y) - 2 * z)

    def box(self, x, y, z, w, d, h, top, left, right, ink=True, tex=None):
        c = self.c; P = self.p
        # right face (+x side): shadow side
        m = Canvas.m_poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)])
        c.fill(m, right, (lambda X, Y: tex(2, X, Y)) if tex else Canvas.sh_flat(1), ink)
        # left face (+y side): lit side
        m = Canvas.m_poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)])
        c.fill(m, left, (lambda X, Y: tex(1, X, Y)) if tex else Canvas.sh_flat(2), ink)
        # top
        m = Canvas.m_poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)])
        c.fill(m, top, (lambda X, Y: tex(0, X, Y)) if tex else Canvas.sh_flat(3), ink)

    def roof(self, x, y, z, w, d, h, rmp, curl=2.5, over=3, ridge=None, rows=3):
        """hip roof with upturned (curved) eaves over the footprint (x, y, w, d) at eave height z, rising h."""
        c = self.c; P = self.p
        x0, y0, x1, y1 = x - over, y - over, x + w + over, y + d + over
        n = 10
        def eave(ax, ay, bx, by):
            pts = []
            for i in range(n + 1):
                t = i / n; lift = curl * ((2 * t - 1) ** 4)
                pts.append((ax + (bx - ax) * t, ay + (by - ay) * t, z + lift))
            return pts
        ins = min(w, d) / 2 + over * 0.5
        rx0, rx1, ry = x0 + ins, x1 - ins, (y0 + y1) / 2
        if rx1 < rx0: rx0 = rx1 = (x0 + x1) / 2
        # back slopes are hidden; draw right (+x) slope then front (+y) slope
        right = [P(*q) for q in eave(x1, y1, x1, y0)] + [P(rx1, ry, z + h)]
        front = [P(*q) for q in eave(x0, y1, x1, y1)] + [P(rx1, ry, z + h), P(rx0, ry, z + h)]
        mr = Canvas.m_poly(right); mf = Canvas.m_poly(front)
        c.fill(mr, rmp, Canvas.sh_flat(1)); c.fill(mf, rmp, Canvas.sh_flat(2))
        # glazed tile rows: lines parallel to the eave, darker
        for k in range(1, 40):
            t = k / 40.0
            if k % rows: continue
            a = P(x0 + (rx0 - x0) * t, y1 + (ry - y1) * t, z + h * t + curl * (1 - t) * 0.9)
            b = P(x1 + (rx1 - x1) * t, y1 + (ry - y1) * t, z + h * t + curl * (1 - t) * 0.9)
            for q in Canvas.m_line(int(a[0]), int(a[1]), int(b[0]), int(b[1])):
                if q in mf: c.put(q[0], q[1], rmp[1])
            a2 = P(x1 + (rx1 - x1) * t, y1 + (ry - y1) * t, z + h * t + curl * (1 - t) * 0.9)
            b2 = P(x1 + (rx1 - x1) * t, y0 + (ry - y0) * t, z + h * t + curl * (1 - t) * 0.9)
            for q in Canvas.m_line(int(a2[0]), int(a2[1]), int(b2[0]), int(b2[1])):
                if q in mr: c.put(q[0], q[1], rmp[0])
        # eave lip highlight
        for q in eave(x0, y1, x1, y1):
            sx, sy = P(*q); c.put(int(sx), int(sy) - 1, rmp[3])
        # ridge with upturned ends
        rg = ridge or R['gold']
        a, b = P(rx0, ry, z + h), P(rx1, ry, z + h)
        c.fill(Canvas.m_line(int(a[0]), int(a[1]) - 1, int(b[0]), int(b[1]) - 1, 2), rg, Canvas.sh_flat(3))
        for (ex, sgn) in ((a, -1), (b, 1)):
            c.fill(Canvas.m_poly([(ex[0], ex[1] - 1), (ex[0] + 3 * sgn, ex[1] - 6), (ex[0] + 4 * sgn, ex[1] - 4), (ex[0] + 1 * sgn, ex[1] + 1)]), rg, Canvas.sh_flat(3))
        for q in (eave(x0, y1, x1, y1)[0], eave(x0, y1, x1, y1)[-1], eave(x1, y1, x1, y0)[-1]):
            sx, sy = P(*q); c.fill(Canvas.m_poly([(sx - 1, sy), (sx + 1, sy - 4), (sx + 2, sy - 1)]), rg, Canvas.sh_flat(3))

    def done(self):
        self.c.outline(); return self.c


# ---------------------------------------------------------------- organic props
def cloud_sprite(seed, w=56, h=26, rmp=None, outline=hx('#9c86b8')):
    rmp = rmp or ramp('#8a76a8', '#c4b0d8', '#f0e4f2', '#fff8fa', '#ffffff')
    rnd = random.Random(seed); c = Canvas(w, h)
    puffs = []
    for i in range(7):
        r = rnd.uniform(h * 0.22, h * 0.42)
        cx = rnd.uniform(r + 1, w - r - 1); cy = h - r - 1 - rnd.uniform(0, h * 0.25) * (1 - abs(cx / w - 0.5) * 1.6)
        puffs.append((cx, cy, r))
    puffs.sort(key=lambda p: p[1] + p[2])
    for (cx, cy, r) in puffs:
        c.fill(Canvas.m_ell(cx, cy, r, r * 0.86), rmp, Canvas.sh_sphere(cx, cy, r, r * 0.86, True, 0.12), ink=True, ink_tone=1)
    # flat underside
    for x in range(w):
        for y in range(h - 3, h):
            if c.px[y][x] is not None: c.px[y][x] = rmp[1]
    c.outline(outline)
    return c


def peach_tree(seed, bloom=True):
    rnd = random.Random(seed); c = Canvas(56, 64)
    # trunk with two branches
    trunk = R['brown']
    c.poly([(25, 63), (31, 63), (30, 44), (34, 34), (31, 33), (28, 40), (24, 32), (21, 34), (26, 44)], trunk, shade=Canvas.sh_cyl(21, 34))
    leaves = R['green']; blossom = R['pink']
    clumps = [(16, 24, 10), (38, 22, 11), (27, 14, 11), (22, 32, 8), (36, 32, 8), (28, 26, 9)]
    for (x, y, r) in clumps:
        x += rnd.uniform(-1, 1); y += rnd.uniform(-1, 1)
        c.fill(Canvas.m_ell(x, y, r, r * 0.82), leaves, Canvas.sh_sphere(x, y, r, r * 0.82, True))
    # blossom clusters + peaches
    for i in range(46 if bloom else 0):
        x, y = rnd.uniform(6, 50), rnd.uniform(5, 38)
        if c.px[int(y)][int(x)] is None: continue
        tone = 3 if (x + y) < 46 else 2
        c.put(int(x), int(y), blossom[tone]); c.put(int(x) + 1, int(y), blossom[tone - 1])
    for i in range(7):
        x, y = rnd.uniform(10, 46), rnd.uniform(14, 38)
        if c.px[int(y)][int(x)] is None: continue
        c.ell(x, y, 1.9, 1.8, ramp('#8a2a3a', '#d8566a', '#f69a8a', '#ffd0b0', '#fff0e0'), hi=True, ink=True)
    c.outline(); c.clean()
    return c, 28, 62


PIXFONT = {'A': '010101111101101', 'E': '111100110100111', 'H': '101101111101101', 'I': '111010010010111', 'M': '101111111101101',
           'N': '110101101101101', 'O': '010101101101010', 'T': '111010010010010', 'U': '101101101101111', 'Q': '010101101110011',
           'S': '011100010001110', 'C': '011100100100011', 'G': '011100101101011', 'L': '100100100100111', 'D': '110101101101110',
           'R': '110101110101101', 'B': '110101110101110', 'Y': '101101010010010', 'P': '110101110100100', 'K': '101101110101101', ' ': '000000000000000'}


def text(c, s, x, y, col):
    for i, ch in enumerate(s):
        g = PIXFONT.get(ch, PIXFONT[' '])
        for r in range(5):
            for k in range(3):
                if g[r * 3 + k] == '1': c.put(x + i * 4 + k, y + r, col)


def grade(img, tint, amount):
    """time-of-day grade: multiply toward a tint (keeps pixels crisp, no blur)."""
    px = img.load(); tr, tg, tb = tint
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (int(r * (1 - amount + amount * tr / 255)), int(g * (1 - amount + amount * tg / 255)), int(b * (1 - amount + amount * tb / 255)), a)
    return img


def glow(img, x, y, r, rgb, strength=1.0):
    """stepped (banded, dithered) additive glow: light pools without smooth gradients."""
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
