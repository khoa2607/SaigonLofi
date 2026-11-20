"""Tiny pixel-art authoring kit for the Tây Du Ký art pilot.

Shapes are filled with 5-tone material ramps [deep, shadow, base, light, highlight], shaded by form with light from the top left.
Every shape inks its own border against what is already drawn (darker ramp tone), and a final pass draws the outer silhouette outline.
Output: native PNG, integer-zoom previews and an editable grid source (one character per pixel, shared palette keys).
"""
import json, math
from PIL import Image

OUT = (43, 27, 34)           # outline: warm near-black, never pure black
LIGHT = (-0.55, -0.70, 0.45)
_l = math.sqrt(sum(c * c for c in LIGHT)); LIGHT = tuple(c / _l for c in LIGHT)


def hx(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def ramp(*hexes):
    return [hx(h) for h in hexes]


# shared material ramps (deep, shadow, base, light, highlight); shadows lean violet, lights lean yellow
R = {
    'skin':  ramp('#7a4440', '#c7826a', '#eab48f', '#f7d3b4', '#fff0de'),
    'pskin': ramp('#7e3c46', '#c96f78', '#eda2a0', '#f8c8bc', '#ffe6da'),     # pig skin
    'fur':   ramp('#4a2420', '#82402a', '#b0623a', '#d68f58', '#f0b878'),
    'gold':  ramp('#6a3e22', '#b4742a', '#e8b03a', '#fbd968', '#fff4c0'),
    'red':   ramp('#4a1626', '#8a2232', '#c63a36', '#ea6a52', '#ff9c7c'),
    'dark':  ramp('#1c1828', '#2c2840', '#433b58', '#5e5578', '#857aa0'),
    'tiger': ramp('#6a3a10', '#bc7618', '#e9a42a', '#f8cb58', '#fff0a0'),
    'white': ramp('#7c6e70', '#bfb0a6', '#e9dccb', '#fbf3e6', '#ffffff'),
    'cream': ramp('#7a5a4a', '#bf9a72', '#e6cc9c', '#f6e6c0', '#fff8e4'),
    'teal':  ramp('#1a2a30', '#2e4a4c', '#3f6a64', '#5e8e7e', '#8ab8a0'),
    'brown': ramp('#2e1a18', '#56322a', '#7c4e36', '#a2704a', '#c89668'),
    'steel': ramp('#2a2632', '#5a5866', '#8c8c98', '#bcbcc4', '#eceef2'),
    'beard': ramp('#140e12', '#2a1e1e', '#40302a', '#5c463a', '#7a6050'),
    'plum':  ramp('#2a1430', '#4e2450', '#74386e', '#9c5890', '#c888b8'),
    'jade':  ramp('#123028', '#1e5040', '#2f7656', '#4ea070', '#88d098'),
    'pink':  ramp('#6a2a48', '#b04a6a', '#e07a8e', '#f6a8b0', '#ffd8d8'),
    'sky':   ramp('#2a3060', '#4a5a98', '#7a92c8', '#a8c4e6', '#e0f0ff'),
    'silk':  ramp('#4a4a6a', '#8a8aa8', '#c4c4dc', '#e6e6f4', '#ffffff'),
    'violet': ramp('#1a1226', '#2c1e40', '#45305e', '#62487e', '#8a6aa6'),
    'green': ramp('#1a3418', '#2e5a26', '#4a8234', '#74a848', '#a8d068'),
}


class Canvas:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[None] * w for _ in range(h)]      # rgb or None
        self.sid = [[-1] * w for _ in range(h)]       # shape id per pixel
        self.n = 0

    def inside(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def put(self, x, y, c):
        if self.inside(x, y):
            self.px[y][x] = c

    # ---------------------------------------------------------------- core: fill a mask with a shading function, then ink its border
    def fill(self, mask, rmp, shade, ink=True, ink_tone=0):
        """mask: set of (x,y); shade(x,y)->tone index 0..4 (or rgb tuple)."""
        sid = self.n; self.n += 1
        for (x, y) in mask:
            if not self.inside(x, y): continue
            t = shade(x, y)
            self.px[y][x] = rmp[t] if isinstance(t, int) else t
            self.sid[y][x] = sid
        if ink:
            for (x, y) in mask:
                if not self.inside(x, y): continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if (nx, ny) in mask: continue
                    if self.inside(nx, ny) and self.px[ny][nx] is not None and self.sid[ny][nx] != sid:
                        self.px[y][x] = rmp[ink_tone]; break
        return mask

    # ---------------------------------------------------------------- masks
    @staticmethod
    def m_ell(cx, cy, rx, ry):
        s = set()
        for y in range(int(cy - ry - 1), int(cy + ry + 2)):
            for x in range(int(cx - rx - 1), int(cx + rx + 2)):
                if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1.0: s.add((x, y))
        return s

    @staticmethod
    def m_poly(pts):
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]; s = set()
        for y in range(int(min(ys)) - 1, int(max(ys)) + 2):
            for x in range(int(min(xs)) - 1, int(max(xs)) + 2):
                px, py, ins = x + .5, y + .5, False
                j = len(pts) - 1
                for i in range(len(pts)):
                    xi, yi = pts[i]; xj, yj = pts[j]
                    if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi + 1e-9) + xi: ins = not ins
                    j = i
                if ins: s.add((x, y))
        return s

    @staticmethod
    def m_rect(x0, y0, x1, y1):
        return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}

    @staticmethod
    def m_line(x0, y0, x1, y1, w=1):
        s = set(); n = max(abs(x1 - x0), abs(y1 - y0), 1)
        for i in range(n + 1):
            x = round(x0 + (x1 - x0) * i / n); y = round(y0 + (y1 - y0) * i / n)
            for a in range(w):
                for b in range(w): s.add((x + a, y + b))
        return s

    # ---------------------------------------------------------------- shading functions
    @staticmethod
    def sh_sphere(cx, cy, rx, ry, hi=True, bias=0.0):
        def f(x, y):
            dx = (x + .5 - cx) / rx; dy = (y + .5 - cy) / ry; d = min(1.0, dx * dx + dy * dy); nz = math.sqrt(1 - d)
            v = dx * LIGHT[0] + dy * LIGHT[1] + nz * LIGHT[2] + bias
            return 4 if (hi and v > 0.86) else 3 if v > 0.55 else 2 if v > 0.12 else 1
        return f

    @staticmethod
    def sh_lin(mask, ax=0.6, ay=0.45, hi=False, bias=0.0):
        xs = [p[0] for p in mask]; ys = [p[1] for p in mask]
        x0, x1, y0, y1 = min(xs), max(xs) + 1, min(ys), max(ys) + 1
        def f(x, y):
            u = (x + .5 - x0) / (x1 - x0); v = (y + .5 - y0) / (y1 - y0)
            val = 1 - (ax * u + ay * v) / (ax + ay) + bias
            return 4 if (hi and val > 0.9) else 3 if val > 0.68 else 2 if val > 0.3 else 1
        return f

    @staticmethod
    def sh_cyl(x0, x1, hi=True):        # vertical cylinder lit from the left
        def f(x, y):
            u = (x + .5 - x0) / max(1, x1 - x0 + 1)
            return 4 if (hi and u < 0.28) else 3 if u < 0.45 else 2 if u < 0.75 else 1
        return f

    @staticmethod
    def sh_flat(t):
        return lambda x, y: t

    # ---------------------------------------------------------------- convenience
    def ell(self, cx, cy, rx, ry, rmp, hi=True, ink=True, bias=0.0):
        return self.fill(self.m_ell(cx, cy, rx, ry), rmp, self.sh_sphere(cx, cy, rx, ry, hi, bias), ink)

    def poly(self, pts, rmp, shade=None, ink=True, **kw):
        m = self.m_poly(pts)
        if not m: return m
        return self.fill(m, rmp, shade or self.sh_lin(m, **kw), ink)

    def rect(self, x0, y0, x1, y1, rmp, shade=None, ink=True, **kw):
        m = self.m_rect(x0, y0, x1, y1)
        return self.fill(m, rmp, shade or self.sh_lin(m, **kw), ink)

    def line(self, x0, y0, x1, y1, c, w=1):
        for (x, y) in self.m_line(x0, y0, x1, y1, w): self.put(x, y, c)

    def dots(self, pts, c):
        for (x, y) in pts: self.put(x, y, c)

    def outline(self, col=OUT):
        out = []
        for y in range(self.h):
            for x in range(self.w):
                if self.px[y][x] is None: continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if not self.inside(nx, ny) or self.px[ny][nx] is None: out.append((x, y)); break
        for (x, y) in out: self.px[y][x] = col

    def clean(self):
        """remove orphan single pixels of a colour surrounded by one other colour (noise)."""
        for y in range(1, self.h - 1):
            for x in range(1, self.w - 1):
                c = self.px[y][x]
                if c is None: continue
                n = [self.px[y][x + 1], self.px[y][x - 1], self.px[y + 1][x], self.px[y - 1][x]]
                if all(k is not None and k != c for k in n) and len(set(n)) == 1 and c != OUT:
                    self.px[y][x] = n[0]

    # ---------------------------------------------------------------- output
    def image(self):
        im = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        for y in range(self.h):
            for x in range(self.w):
                c = self.px[y][x]
                if c is not None: im.putpixel((x, y), c + (255,) if len(c) == 3 else c)
        return im

    def grid(self, name):
        keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=?!<>~^'
        pal, rows = {}, []
        for y in range(self.h):
            row = ''
            for x in range(self.w):
                c = self.px[y][x]
                if c is None: row += '.'; continue
                h = '#%02x%02x%02x' % c[:3]
                if h not in pal: pal[h] = keys[len(pal)]
                row += pal[h]
            rows.append(row)
        return {'name': name, 'canvas': [self.w, self.h], 'palette': {v: k for k, v in pal.items()}, 'rows': rows}


def zoom(im, k):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


def save_source(path, frames, canvas, pivot):
    pal = {}
    for f in frames:
        pal.update(f['palette'])
    # remap: frames have independent keys; merge into one shared palette
    merged, out = {}, []
    keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=?!<>~^'
    k2 = list(keys) + [chr(c) for c in range(0xC0, 0x250)]
    for f in frames:
        rev = {}
        for k, h in f['palette'].items():
            if h not in merged: merged[h] = k2[len(merged)]
            rev[k] = merged[h]
        out.append({'name': f['name'], 'duration_ms': 200, 'rows': [''.join(rev.get(ch, '.') if ch != '.' else '.' for ch in r) for r in f['rows']]})
    src = {'version': 1, 'name': path.split('/')[-1].split('\\')[-1].replace('.json', ''), 'canvas': canvas, 'pivot': pivot,
           'palette': {v: k for k, v in merged.items()}, 'frames': out}
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(src, fh, ensure_ascii=False, indent=1)
