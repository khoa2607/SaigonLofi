"""Holdfast concept-mockup generator (design tool only, not game code).

Renders the Holdfast valley procedurally at true game art resolution:
2:1 isometric, 16x8 px tiles, 128x128 tile map, chibi people ~12 px tall.

  python -I docs/holdfast/tools/mockgen.py <out_dir>

Outputs:
  01-world-overview.png   whole map, day, zones/POIs/routes/camera frames
  02-current-era-dusk.png default 1920x1080 frame (960x540 art px at 2x), dusk
"""
import math, random, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
W, H = 2048, 1024              # full map in art px (128x128 tiles of 16x8)
OVX, OVY = 544, 242            # default 1080p view origin (art px)
VW, VH = 960, 540              # default view size (art px) -> x2 = 1920x1080
INK = (59, 42, 38)             # cocoa outline, as in Saigon
rng = random.Random(7)
nrng = np.random.default_rng(7)

def proj(x, y, z=0.0):
    return (1024 + (x - y) * 8, (x + y) * 4 - z)

def v2m(vx, vy):
    a = (vx + OVX - 1024) / 8; b = (vy + OVY) / 4
    return ((a + b) / 2, (b - a) / 2)

def m2v(x, y):
    px, py = proj(x, y)
    return px - OVX, py - OVY

# ------------------------------------------------------------------ geography
def wall_vy(vx):
    return 212 + 55 * ((vx - 480) / 440) ** 2

def river_side(vy, side):
    return 480 + side * (474 + np.maximum(0, 300 - vy) ** 2 / 300)

def road_vx(vy):
    return 480 + 34 * np.sin((212 - vy) / 75)

def stream_vx(vy):
    return 655 + 18 * np.sin(vy / 31) + np.maximum(0, vy - 270) * 1.05

GREEN = (480, 348)

def zones(vx, vy):
    vx = np.asarray(vx, float); vy = np.asarray(vy, float)
    d = np.sqrt(((vx - 480) / 445) ** 2 + ((vy - 300) / 222) ** 2)
    lower = vy >= 300
    cl, cr = river_side(vy, -1), river_side(vy, 1)
    river = np.where(lower, (d >= 1.0) & (d <= 1.13),
                     (np.abs(vx - cl) < 29) | (np.abs(vx - cr) < 29))
    inside = np.where(lower, d < 1.0, (vx > cl + 29) & (vx < cr - 29))
    bank = np.where(lower, (d > 0.972) & (d < 1.0) | (d > 1.13) & (d < 1.155),
                    (np.abs(np.abs(vx - cl) - 31) < 3) | (np.abs(np.abs(vx - cr) - 31) < 3)) & ~river
    wv = wall_vy(vx)
    settle = inside & (vy > wv + 2)
    cleared = inside & (vy <= wv + 2) & (vy > wv - 62)
    wild = (inside & (vy <= wv - 62)) | (~inside & ~river & (vy < 300))
    farbank = ~inside & ~river & (vy >= 300)
    return dict(d=d, river=river, inside=inside, bank=bank, settle=settle,
                cleared=cleared, wild=wild, farbank=farbank, wv=wv)

def zone_at(vx, vy):
    z = zones(np.array([vx]), np.array([vy]))
    return {k: v[0] for k, v in z.items()}

# ------------------------------------------------------------------ ground
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0

def smooth_noise(scale, seed):
    r = np.random.default_rng(seed)
    small = r.random((H // scale + 2, W // scale + 2)).astype(np.float32)
    im = Image.fromarray((small * 255).astype(np.uint8)).resize(
        ((W // scale + 2) * scale, (H // scale + 2) * scale), Image.BICUBIC)
    return np.asarray(im, np.float32)[:H, :W] / 255.0

def ground(era="current"):
    py, px = np.mgrid[0:H, 0:W].astype(np.float32)
    vx, vy = px - OVX, py - OVY
    mx = ((px - 1024) / 8 + py / 4) / 2
    my = (py / 4 - (px - 1024) / 8) / 2
    Z = zones(vx, vy)
    n = smooth_noise(24, 1) * 0.65 + smooth_noise(6, 2) * 0.35
    n = n + (BAYER[(py % 4).astype(int), (px % 4).astype(int)] - 0.5) * 0.28
    img = np.zeros((H, W, 3), np.float32)

    def paint(mask, cols, t=(0.42, 0.68)):
        c0, c1, c2 = [np.array(c, np.float32) for c in cols]
        sel = np.where(n[..., None] < t[0], c0, np.where(n[..., None] < t[1], c1, c2))
        img[mask] = sel[mask]

    void = (mx < 0) | (mx > 128) | (my < 0) | (my > 128)
    # distance into the wilderness (for forest floor)
    wd = Z["wv"] - 62 - vy
    paint(Z["wild"], [(80, 112, 62), (94, 128, 70), (110, 142, 78)])
    paint(Z["wild"] & ((wd > 70) | ~Z["inside"]), [(58, 88, 56), (70, 100, 60), (84, 112, 64)])
    paint(Z["farbank"], [(112, 146, 76), (128, 160, 84), (146, 174, 92)])
    paint(Z["cleared"], [(146, 118, 84), (162, 134, 96), (178, 150, 108)])
    # cleared ground fades into the wild grass
    edge = Z["cleared"] & (vy < Z["wv"] - 44) & (n > 0.5)
    paint(edge, [(110, 134, 76), (120, 140, 80), (128, 146, 82)])
    paint(Z["settle"], [(122, 158, 72), (140, 174, 82), (160, 188, 94)])
    # town green
    g = ((vx - GREEN[0]) / 100) ** 2 + ((vy - GREEN[1]) / 50) ** 2
    paint(Z["settle"] & (g < 1), [(138, 176, 84), (154, 188, 92), (172, 200, 104)])
    # fields: patches on the map grid inside the river bend
    fld = Z["settle"] & (Z["d"] < 0.93) & (vy > 405) & (np.abs(vx - 480) > 12)
    pid = (np.floor(mx / 5) + np.floor(my / 5) * 3) % 4
    path = (np.mod(mx, 5) < 0.45) | (np.mod(my, 5) < 0.45)
    row = np.mod(my * 2.5, 1) < 0.5
    soil = np.array((120, 86, 58), np.float32)
    for k, crop in enumerate([(98, 146, 58), (124, 164, 66), (196, 168, 82), (86, 128, 62)]):
        m = fld & (pid == k) & ~path
        cc = np.where(row[..., None], soil + (n[..., None] - 0.5) * 20,
                      np.array(crop, np.float32) + (n[..., None] - 0.5) * 30)
        img[m] = cc[m]
    img[fld & path] = (150, 124, 90)
    # gate yard
    yard = Z["settle"] & (vy < Z["wv"] + 26) & (np.abs(vx - 480) < 70)
    paint(yard, [(160, 136, 100), (172, 148, 110), (184, 160, 120)])
    # streets: main street, green ring, lanes on the grid
    street = Z["settle"] & (np.abs(vx - 480) < 7) & (vy < GREEN[1])
    street |= Z["settle"] & (np.abs(g - 1.0) < 0.1)
    for (ax, ay, s, lo, hi) in [(398, 352, -0.5, 150, 398), (562, 352, 0.5, 562, 830),
                                (392, 336, 0.5, 220, 392), (568, 336, -0.5, 568, 760)]:
        street |= Z["settle"] & (np.abs(vy - (ay + (vx - ax) * s)) < 3.6) & (vx > lo) & (vx < hi)
    street |= Z["settle"] & (np.abs(vx - 480) < 5) & (vy > GREEN[1]) & (Z["d"] < 1)
    paint(street, [(170, 156, 128), (182, 168, 138), (194, 180, 148)], (0.35, 0.75))
    # old road outside
    rd = (vy < Z["wv"] + 2) & (np.abs(vx - road_vx(vy)) < 10) & ~Z["river"]
    paint(rd, [(84, 84, 90), (96, 95, 100), (108, 106, 110)], (0.3, 0.8))
    crack = rd & (smooth_noise(3, 9) > 0.78)
    img[crack] = (124, 140, 78)            # weeds in cracks
    centre = rd & (np.abs(vx - road_vx(vy)) < 0.8) & (np.mod(vy, 12) < 5)
    img[centre] = (178, 164, 96)
    # stream
    st = (np.abs(vx - stream_vx(vy)) < 4.5) & ~Z["river"] & (Z["inside"]) & (vy < 470)
    img[st] = (78, 132, 160)
    img[st & (n > 0.72)] = (130, 182, 200)
    img[(np.abs(np.abs(vx - stream_vx(vy)) - 5.5) < 1) & Z["inside"] & ~Z["river"] & (vy < 470)] = (110, 130, 80)
    # river and banks
    paint(Z["bank"], [(188, 168, 122), (200, 182, 134), (212, 196, 148)])
    paint(Z["river"], [(58, 112, 142), (66, 124, 154), (72, 132, 162)], (0.3, 0.8))
    rip = Z["river"] & (np.mod(px + py * 2, 23) < 3) & (smooth_noise(4, 5) > 0.66)
    img[rip] = (126, 176, 198)
    img[void] = (34, 38, 44)
    return img, Z, void

# ------------------------------------------------------------------ drawing helpers
class Scene:
    def __init__(self):
        self.objs = []          # (depth, fn)
        self.shadows = []       # polygons
        self.lights = []        # (px, py, r, color, k)
        self.emissive = []      # fn(draw) after grading (dusk only)
        self.labels = []

    def add(self, depth, fn):
        self.objs.append((depth, len(self.objs), fn))

S = Scene()

def P(x, y, z=0):
    return proj(x, y, z)

def poly(d, pts, fill, outline=INK):
    d.polygon([(round(a), round(b)) for a, b in pts], fill=fill, outline=outline)

def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c)

def box_fn(x, y, w, dd, h, z, top, left=None, right=None, outline=INK):
    left = left or shade(top, 0.86); right = right or shade(top, 0.68)
    def f(d):
        poly(d, [P(x, y + dd, z), P(x + w, y + dd, z), P(x + w, y + dd, z + h), P(x, y + dd, z + h)], left, outline)
        poly(d, [P(x + w, y, z), P(x + w, y + dd, z), P(x + w, y + dd, z + h), P(x + w, y, z + h)], right, outline)
        poly(d, [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + dd, z + h), P(x, y + dd, z + h)], top, outline)
    return f

def box(x, y, w, dd, h, top, left=None, right=None, z=0, shadow=True, outline=INK):
    if shadow and h > 2:
        add_shadow(x, y, w, dd, h + z)
    S.add(x + w + y + dd, box_fn(x, y, w, dd, h, z, top, left, right, outline))

def add_shadow(x, y, w, dd, h):
    s = h * 0.9 / 8   # shadow cast toward +x (screen right-down)
    pts = [P(x, y), P(x + w + s, y), P(x + w + s, y + dd), P(x, y + dd)]
    S.shadows.append(pts)

def face_pt(x0, y0, x1, y1, u, z):
    return P(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, z)

def window_on(d, x0, y0, x1, y1, u, z, w=0.16, hgt=5, col=(58, 70, 88), lit=None, boarded=False):
    a = face_pt(x0, y0, x1, y1, u, z); b = face_pt(x0, y0, x1, y1, u + w, z)
    c = face_pt(x0, y0, x1, y1, u + w, z + hgt); e = face_pt(x0, y0, x1, y1, u, z + hgt)
    poly(d, [a, b, c, e], (130, 96, 60) if boarded else col, INK)
    if boarded:
        d.line([a, c], fill=INK); d.line([b, e], fill=INK)
    if lit and not boarded:
        S.emissive.append(lambda dd, pts=(a, b, c, e): poly(dd, pts, lit, (120, 80, 40)))
        cx = (a[0] + c[0]) / 2; cy = (a[1] + c[1]) / 2
        S.lights.append((cx, cy, 9, (255, 180, 90), 0.35))

LIT = (255, 210, 130)

def house(vx, vy, w, dd, h, wall, roof, ridge="x", wins=2, boarded=0, door=True, solar=False, z=0):
    mx, my = v2m(vx, vy); x, y = mx - w / 2, my - dd / 2
    add_shadow(x, y, w, dd, h + 9)
    left, right = shade(wall, 0.92), shade(wall, 0.72)
    rh = 8
    def f(d):
        # walls
        poly(d, [P(x, y + dd, z), P(x + w, y + dd, z), P(x + w, y + dd, z + h), P(x, y + dd, z + h)], left)
        poly(d, [P(x + w, y, z), P(x + w, y + dd, z), P(x + w, y + dd, z + h), P(x + w, y, z + h)], right)
        # siding lines
        for zz in range(z + 3, z + h, 3):
            d.line([P(x + 0.05, y + dd, zz), P(x + w - 0.05, y + dd, zz)], fill=shade(wall, 0.82))
            d.line([P(x + w, y + 0.05, zz), P(x + w, y + dd - 0.05, zz)], fill=shade(wall, 0.64))
        # windows: two storeys
        for i in range(wins):
            u = 0.12 + i * (0.76 / max(1, wins))
            for zz in (z + 3, z + 11) if h >= 16 else (z + 4,):
                if door and i == 0 and zz == z + 3:
                    continue
                window_on(d, x, y + dd, x + w, y + dd, u, zz, lit=LIT if rng.random() < 0.7 else None,
                          boarded=(boarded > 0 and rng.random() < 0.4))
        for zz in (z + 3, z + 11) if h >= 16 else (z + 4,):
            window_on(d, x + w, y, x + w, y + dd, 0.35, zz, lit=LIT if rng.random() < 0.5 else None,
                      boarded=(boarded > 0 and rng.random() < 0.5))
        if door:
            a = face_pt(x, y + dd, x + w, y + dd, 0.14, z); b = face_pt(x, y + dd, x + w, y + dd, 0.26, z)
            poly(d, [a, b, (b[0], b[1] - 8), (a[0], a[1] - 8)], (112, 76, 56))
            S.lights.append(((a[0] + b[0]) / 2, a[1] - 3, 10, (255, 170, 80), 0.3))
        ov = 0.25
        X0, X1, Y0, Y1 = x - ov, x + w + ov, y - ov, y + dd + ov
        rc, rcd = roof, shade(roof, 0.78)
        if ridge == "x":
            ym = (Y0 + Y1) / 2
            poly(d, [P(X0, Y0, z + h), P(X1, Y0, z + h), P(X1, ym, z + h + rh), P(X0, ym, z + h + rh)], shade(roof, 1.12))
            poly(d, [P(x + w, y, z + h), P(x + w, y + dd, z + h), P(x + w, (y + y + dd) / 2, z + h + rh - 1)], right)
            poly(d, [P(X0, ym, z + h + rh), P(X1, ym, z + h + rh), P(X1, Y1, z + h), P(X0, Y1, z + h)], rc)
            for t in np.linspace(0.25, 0.85, 3):
                yy = ym + (Y1 - ym) * t
                d.line([P(X0 + 0.1, yy, z + h + rh * (1 - t)), P(X1 - 0.1, yy, z + h + rh * (1 - t))], fill=rcd)
            if solar:
                poly(d, [P(X0 + 0.6, ym + 0.3, z + h + rh - 1.5), P(X0 + 2.2, ym + 0.3, z + h + rh - 1.5),
                         P(X0 + 2.2, Y1 - 0.4, z + h + 1.5), P(X0 + 0.6, Y1 - 0.4, z + h + 1.5)], (52, 70, 104))
        else:
            xm = (X0 + X1) / 2
            poly(d, [P(X0, Y0, z + h), P(X0, Y1, z + h), P(xm, Y1, z + h + rh), P(xm, Y0, z + h + rh)], shade(roof, 1.12))
            poly(d, [P(x, y + dd, z + h), P(x + w, y + dd, z + h), P((x + x + w) / 2, y + dd, z + h + rh - 1)], left)
            poly(d, [P(xm, Y0, z + h + rh), P(xm, Y1, z + h + rh), P(X1, Y1, z + h), P(X1, Y0, z + h)], shade(roof, 0.8))
            if solar:
                poly(d, [P(xm + 0.3, Y0 + 0.6, z + h + rh - 1.5), P(xm + 0.3, Y0 + 2.4, z + h + rh - 1.5),
                         P(X1 - 0.4, Y0 + 2.4, z + h + 1.5), P(X1 - 0.4, Y0 + 0.6, z + h + 1.5)], (52, 70, 104))
    S.add(x + w + y + dd, f)
    return x, y

def pyramid(x, y, w, z, h, col):
    def f(d):
        apex = P(x + w / 2, y + w / 2, z + h)
        poly(d, [P(x, y + w, z), P(x + w, y + w, z), apex], col)
        poly(d, [P(x + w, y, z), P(x + w, y + w, z), apex], shade(col, 0.75))
    S.add(x + w + y + w + 0.01, f)

# ------------------------------------------------------------------ sprites
TPL = {
    "human": ["..HHH..", ".HHHHH.", ".HSSSH.", ".SESES.", "..SSS..", ".CCCCC.", "SCCCCCS", ".CCCCC.",
              "..PPP..", ".PP.PP.", ".PP.PP.", ".BB.BB."],
    "guard": ["..HHH..", ".HHHHH.", ".HSSSH.", ".SESES.", "..SSS..", ".CCCCCG", "SCCCCGS", ".CCCGC.",
              "..PGP..", ".PP.PP.", ".PP.PP.", ".BB.BB."],
    "pack": ["..HHH..", ".HHHHH.", ".HSSSH.", ".SESES.", "..SSS..", "ACCCCC.", "ACCCCCS", "ACCCCC.",
             "..PPP..", ".PP.PP.", ".PP.PP.", ".BB.BB."],
    "kid": ["..HHH..", ".HHHHH.", ".HSSSH.", ".SESES.", "..SSS..", "SCCCCCS", ".CCCCC.", ".PP.PP.", ".BB.BB."],
    "elder": ["..HHH..", ".HHHHH.", ".HSSSH.", ".SESES.", "..SSS..", ".CCCCC.", "SCCCCC.", ".CCCCCG",
              "..PPP.G", ".PP.PPG", ".PP.PPG", ".BB.BBG"],
    "zombie": ["...HH..", "..HSSS.", "..SESSS", "..SSSS.", "...CCC.", "..CCCSS", "..CCCC.", "..CCC..",
               "..PPP..", ".PP.PP.", ".PP..P.", ".B...B."],
    "zombie2": ["..HH...", ".HSSS..", "SSESS..", ".SSSS..", ".CCC...", "SSCCCC.", ".CCCC..", "..CCC..",
                "..PPP..", ".PP.PP.", ".P..PP.", ".B..BB."],
    "dog": [".......", "H....HH", "H...HHE", ".HHHHH.", ".HHHHH.", ".H.H.H."],
    "deer": ["G.G....", ".GG....", "..HHE..", "..HH...", "..HHHHH", "..HHHHH", "..H...H", "..H...H"],
    "rabbit": [".H.", ".HH", "HHH"],
    "chicken": [".R.", "HHH", "HH."],
}

def sprite(px, py, kind, cols, depth=None, bubble=None, outline=True):
    """Draw a template so its feet sit at art pixel (px, py)."""
    t = TPL[kind]; h = len(t); w = len(t[0])
    ox, oy = round(px) - w // 2, round(py) - h + 1
    def f(d):
        if outline:
            pts = set()
            for j, r in enumerate(t):
                for i, ch in enumerate(r):
                    if ch != ".":
                        for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            ii, jj = i + a, j + b
                            if not (0 <= jj < h and 0 <= ii < w and t[jj][ii] != "."):
                                pts.add((ox + ii, oy + jj))
            d.point(list(pts), fill=INK)
        for j, r in enumerate(t):
            for i, ch in enumerate(r):
                if ch != ".":
                    d.point((ox + i, oy + j), fill=cols.get(ch, INK))
        if bubble:
            bx, by = ox + w // 2, oy - 9
            d.rectangle([bx - 3, by, bx + 3, by + 6], fill=(250, 244, 226), outline=INK)
            d.point([(bx, by + 7), (bx - 1, by + 7)], fill=INK)
            if bubble == "!":
                d.line([(bx, by + 1), (bx, by + 3)], fill=(200, 60, 40)); d.point((bx, by + 5), fill=(200, 60, 40))
            else:
                d.point([(bx - 1, by + 1), (bx, by + 1), (bx + 1, by + 2), (bx, by + 3), (bx, by + 5)], fill=INK)
    if depth is None:
        mx, my = ((px - 1024) / 8 + py / 4) / 2, (py / 4 - (px - 1024) / 8) / 2
        depth = mx + my + 0.3
    S.add(depth, f)

SKIN = [(242, 200, 160), (222, 172, 128), (186, 132, 92), (140, 96, 66), (250, 214, 176)]
HAIR = [(60, 40, 32), (34, 28, 28), (120, 72, 40), (180, 140, 80), (90, 60, 40)]
SHIRT = [(196, 84, 64), (70, 110, 150), (214, 180, 90), (110, 140, 90), (200, 150, 120), (150, 90, 120),
         (90, 120, 130), (230, 220, 200)]
PANTS = [(60, 66, 90), (90, 80, 64), (70, 76, 60), (52, 52, 60)]

def person_at(vx, vy, kind="human", shirt=None, bubble=None, depth_bias=0.3, hair=None, pack=None):
    cols = {"H": hair or rng.choice(HAIR), "S": rng.choice(SKIN), "E": INK,
            "C": shirt or rng.choice(SHIRT), "P": rng.choice(PANTS), "B": (48, 40, 36),
            "G": (70, 64, 60), "A": pack or (122, 100, 70)}
    if kind == "elder":
        cols["H"] = (214, 210, 200); cols["G"] = (120, 90, 60)
    if kind.startswith("zombie"):
        cols = {"H": (70, 64, 56), "S": rng.choice([(150, 162, 134), (138, 150, 128), (160, 160, 140)]),
                "E": (60, 40, 40), "C": rng.choice([(96, 92, 96), (104, 96, 80), (84, 92, 100), (110, 84, 80)]),
                "P": (70, 70, 74), "B": (50, 46, 44)}
    px, py = vx + OVX, vy + OVY
    mx, my = v2m(vx, vy)
    S.shadows.append([(px - 3, py), (px + 3, py), (px + 4, py + 1), (px - 2, py + 1)])
    sprite(px, py, kind, cols, depth=mx + my + depth_bias, bubble=bubble)

def animal_at(vx, vy, kind, col, depth_bias=0.3):
    cols = {"H": col, "E": INK, "G": (110, 84, 60), "R": (200, 60, 50)}
    mx, my = v2m(vx, vy)
    sprite(vx + OVX, vy + OVY, kind, cols, depth=mx + my + depth_bias)

# ------------------------------------------------------------------ trees
LEAF = {"oak": [(54, 92, 50), (76, 120, 58), (104, 148, 70)],
        "wild": [(46, 80, 48), (62, 100, 54), (86, 124, 62)],
        "pine": [(36, 70, 52), (48, 88, 60), (66, 108, 70)],
        "autumn": [(150, 80, 40), (190, 120, 50), (220, 170, 80)],
        "fruit": [(64, 110, 56), (88, 140, 64), (118, 164, 76)]}

def tree_at(vx, vy, r=7, kind="wild", hgt=None, depth_bias=0.0):
    px, py = vx + OVX, vy + OVY
    mx, my = v2m(vx, vy)
    hgt = hgt or r * 1.4
    S.shadows.append([(px - r * 0.6, py - 1), (px + r * 1.6, py - 1), (px + r * 1.9, py + r * 0.5), (px - r * 0.2, py + r * 0.6)])
    c0, c1, c2 = LEAF[kind]
    seed = rng.random()
    def f(d):
        rr = random.Random(seed)
        if kind == "pine":
            d.rectangle([px - 1, py - 4, px + 1, py], fill=(92, 62, 44), outline=INK)
            for k in range(3):
                top = py - hgt - 6 + k * (hgt / 3.2)
                wdt = r * (0.5 + k * 0.28)
                poly(d, [(px, top - 2), (px + wdt, top + hgt / 2.4), (px - wdt, top + hgt / 2.4)], c1 if k % 2 else c0)
            return
        d.rectangle([px - 1, py - hgt * 0.55, px + 1, py], fill=(96, 66, 46), outline=INK)
        cy = py - hgt
        blobs = [(0, 0, r)] + [(rr.uniform(-r * .7, r * .7), rr.uniform(-r * .4, r * .45), r * rr.uniform(.55, .8)) for _ in range(3)]
        for bx, by, br in blobs:
            d.ellipse([px + bx - br - 1, cy + by - br * .85 - 1, px + bx + br + 1, cy + by + br * .85 + 1], fill=INK)
        for bx, by, br in blobs:
            d.ellipse([px + bx - br, cy + by - br * .85, px + bx + br, cy + by + br * .85], fill=c0)
        for bx, by, br in blobs:
            d.ellipse([px + bx - br * .8 - 1, cy + by - br * .8, px + bx + br * .5, cy + by + br * .3], fill=c1)
        for _ in range(int(r * 1.5)):
            hx = px + rr.uniform(-r * .7, r * .2); hy = cy + rr.uniform(-r * .7, 0)
            d.point((round(hx), round(hy)), fill=c2)
    S.add(mx + my + depth_bias, f)

# ------------------------------------------------------------------ props
def car_at(vx, vy, col, along="x", wreck=False):
    mx, my = v2m(vx, vy)
    L, Wd = (2.4, 1.2) if along == "x" else (1.2, 2.4)
    x, y = mx - L / 2, my - Wd / 2
    body = shade(col, 0.8) if wreck else col
    box(x, y, L, Wd, 4, body, z=0.5 if not wreck else 0)
    if along == "x":
        box(x + 0.6, y + 0.1, 1.1, Wd - 0.2, 3, (70, 80, 92) if not wreck else (52, 48, 46), z=4.5 if not wreck else 4)
    else:
        box(x + 0.1, y + 0.6, Wd - 0.2, 1.1, 3, (70, 80, 92) if not wreck else (52, 48, 46), z=4.5 if not wreck else 4)

def bus_at(vx, vy):
    mx, my = v2m(vx, vy)
    box(mx - 3.5, my - 0.8, 7, 1.6, 9, (176, 146, 70))
    def f(d):
        for i in range(6):
            window_on(d, mx - 3.5, my + 0.8, mx + 3.5, my + 0.8, 0.08 + i * 0.14, 4, w=0.09, hgt=3, col=(46, 44, 46))
    S.add(mx + 3.5 + my + 0.8 + 0.01, f)

def hedgehog_at(vx, vy):
    px, py = vx + OVX, vy + OVY; mx, my = v2m(vx, vy)
    def f(d):
        for a, b in (((-3, 0), (3, -5)), ((3, 0), (-3, -5)), ((0, 1), (0, -6))):
            d.line([(px + a[0], py + a[1]), (px + b[0], py + b[1])], fill=(70, 60, 58), width=1)
        d.point((px + 3, py - 5), fill=(160, 120, 90))
    S.add(mx + my + 0.2, f)

def stump_at(vx, vy):
    px, py = vx + OVX, vy + OVY; mx, my = v2m(vx, vy)
    S.add(mx + my, lambda d: (d.ellipse([px - 2, py - 3, px + 2, py], fill=(170, 130, 90), outline=INK)))

def dust_at(vx, vy):
    px, py = vx + OVX, vy + OVY; mx, my = v2m(vx, vy)
    def f(d):
        d.ellipse([px - 4, py - 2, px + 4, py + 1], fill=(120, 106, 92))
        d.point([(px - 2, py - 1), (px + 1, py - 2), (px + 3, py)], fill=(90, 80, 72))
    S.add(mx + my - 0.5, f)

def light_at(vx, vy, r, col, k, z=0):
    S.lights.append((vx + OVX, vy + OVY - z, r, col, k))

def fire_at(vx, vy, big=False):
    px, py = vx + OVX, vy + OVY; mx, my = v2m(vx, vy)
    def f(d):
        for a in range(0, 360, 45):
            d.point((px + round(5 * math.cos(math.radians(a))), py + round(2.5 * math.sin(math.radians(a)))), fill=(130, 124, 116))
    S.add(mx + my - 0.4, f)
    def e(d):
        s = 1.6 if big else 1.0
        poly(d, [(px - 3 * s, py), (px - 2 * s, py - 4 * s), (px - .5 * s, py - 3 * s), (px, py - 8 * s),
                 (px + 1 * s, py - 4 * s), (px + 2.5 * s, py - 5 * s), (px + 3 * s, py)], (236, 112, 40), (170, 64, 28))
        poly(d, [(px - 1.5 * s, py), (px - .5 * s, py - 3 * s), (px + .5 * s, py - 5 * s), (px + 1.5 * s, py)], (255, 214, 104), (255, 190, 80))
        if big:
            d.line([(px - 5, py + 1), (px + 5, py - 1)], fill=(96, 62, 44), width=2)
            d.line([(px - 5, py - 1), (px + 5, py + 1)], fill=(110, 72, 50), width=2)
    S.emissive.append(e)
    S.add(mx + my - 0.3, e)
    light_at(vx, vy, 46 if big else 22, (255, 150, 60), 0.9 if big else 0.6, z=3)

def drum_fire(vx, vy):
    mx, my = v2m(vx, vy)
    box(mx - 0.35, my - 0.35, 0.7, 0.7, 6, (110, 70, 52))
    fire_at(vx, vy - 6)

# ------------------------------------------------------------------ wall & towers
PANEL = [(150, 92, 62), (140, 148, 152), (84, 112, 140), (162, 124, 84), (126, 84, 64), (118, 128, 128)]

def build_wall():
    xs = list(np.arange(40, 921, 6.0))
    pts = [(vx, wall_vy(vx)) for vx in xs]
    gate = (458, 502)
    for i in range(len(pts) - 1):
        (ax, ay), (bx, by) = pts[i], pts[i + 1]
        mid = (ax + bx) / 2
        if gate[0] < mid < gate[1]:
            continue
        if abs(mid - stream_vx(wall_vy(mid))) < 5:   # culvert grate over the stream
            ma, mb = v2m(ax, ay), v2m(bx, by)
            S.add(ma[0] + ma[1] + 0.6, lambda d, a=ma, b=mb: [d.line([P(*a, z), P(*b, z)], fill=(90, 90, 96)) for z in (2, 5, 8)])
            continue
        ma, mb = v2m(ax, ay), v2m(bx, by)
        col = PANEL[(i * 7 + (i // 3)) % len(PANEL)]
        hgt = 9 + (i % 3 == 0)
        def f(d, a=ma, b=mb, col=col, hgt=hgt, i=i):
            q = [P(a[0], a[1], 0), P(b[0], b[1], 0), P(b[0], b[1], hgt), P(a[0], a[1], hgt)]
            poly(d, q, col)
            for t in (0.33, 0.66):   # corrugation
                p0 = (q[0][0] + (q[1][0] - q[0][0]) * t, q[0][1] + (q[1][1] - q[0][1]) * t)
                d.line([p0, (p0[0], p0[1] - hgt + 1)], fill=shade(col, 0.78))
            if i % 3 == 0:          # post + brace (inner side faces camera)
                pa = P(a[0], a[1], 0)
                d.line([pa, (pa[0], pa[1] - 13)], fill=(96, 70, 50), width=2)
                d.line([(pa[0] + 1, pa[1] + 3), (pa[0] + 1, pa[1] - 8)], fill=(120, 90, 62))
            # razor wire
            t0, t1 = P(a[0], a[1], hgt + 2), P(b[0], b[1], hgt + 2)
            d.line([t0, ((t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2 - 2), t1], fill=(176, 176, 170))
            # outward stakes
            s0 = P(a[0] - 0.4, a[1] - 0.4, 2)
            d.line([s0, (s0[0] - 1, s0[1] - 4)], fill=(150, 120, 86))
        S.add(ma[0] + ma[1] + 0.55, f)
    # gate
    ga, gb = v2m(gate[0], wall_vy(gate[0])), v2m(gate[1], wall_vy(gate[1]))
    def g(d):
        q = [P(*ga, 0), P(*gb, 0), P(*gb, 11), P(*ga, 11)]
        poly(d, q, (78, 82, 88))
        n = 8
        for k in range(1, n):
            t = k / n
            p0 = (q[0][0] + (q[1][0] - q[0][0]) * t, q[0][1] + (q[1][1] - q[0][1]) * t)
            d.line([p0, (p0[0], p0[1] - 10)], fill=(104, 108, 112))
        d.line([q[0], q[2]], fill=(214, 176, 60)); d.line([q[1], q[3]], fill=(214, 176, 60))
        for p in (ga, gb):
            b0 = P(*p, 0)
            d.rectangle([b0[0] - 1, b0[1] - 20, b0[0] + 1, b0[1]], fill=(96, 70, 50), outline=INK)
        s0, s1 = P(*ga, 20), P(*gb, 20)
        poly(d, [(s0[0], s0[1]), (s1[0], s1[1]), (s1[0], s1[1] + 5), (s0[0], s0[1] + 5)], (178, 140, 92))
        for k in range(8):   # painted letters, abstract
            t = 0.12 + k * 0.1
            xx = s0[0] + (s1[0] - s0[0]) * t; yy = s0[1] + (s1[1] - s0[1]) * t + 1
            d.rectangle([xx, yy, xx + 1, yy + 2], fill=(240, 236, 220))
    S.add(gb[0] + gb[1] + 0.56, g)
    light_at(480, wall_vy(480), 28, (255, 190, 110), 0.5, z=18)

def tower_at(vx, vy, tall=30, lamp=True, guard="guard", spot=None, rock=False):
    mx, my = v2m(vx, vy)
    s = 1.7
    x, y = mx - s / 2, my - s / 2
    z0 = 0
    if rock:
        rk = random.Random(3)
        cx0, cy0 = P(mx, my, 0)
        blobs = [(rk.uniform(-22, 22), rk.uniform(-6, 8), rk.uniform(7, 12)) for _ in range(9)]
        def rockf(d, blobs=blobs, cx0=cx0, cy0=cy0):
            for bx, by, r in sorted(blobs, key=lambda t: t[1]):
                pts = [(cx0 + bx + r * 1.3 * math.cos(a), cy0 + by - r * 0.55 - r * 0.7 * math.sin(a))
                       for a in np.linspace(0, math.pi, 7)] + [(cx0 + bx - r * 1.3, cy0 + by)]
                poly(d, pts, (128, 122, 116))
                poly(d, pts[:4] + [(cx0 + bx, cy0 + by - r * 0.4)], (150, 144, 136))
                d.line([(cx0 + bx - r * .4, cy0 + by - r * .5), (cx0 + bx + r * .2, cy0 + by - r * .2)], fill=(100, 96, 92))
            for k in range(14):
                d.point((round(cx0 + rk.uniform(-30, 30)), round(cy0 + rk.uniform(-14, 4))), fill=(96, 130, 70))
        S.add(mx + my - 0.4, rockf)
        S.shadows.append([(cx0 - 30, cy0), (cx0 + 40, cy0), (cx0 + 46, cy0 + 8), (cx0 - 24, cy0 + 8)])
        z0 = 7
    for (a, b) in ((0, 0), (s - .3, 0), (0, s - .3), (s - .3, s - .3)):
        box(x + a, y + b, .3, .3, tall, (128, 94, 64), z=z0, shadow=False)
    add_shadow(x, y, s, s, tall + z0)
    box(x - .1, y - .1, s + .2, s + .2, 2, (150, 112, 76), z=z0 + tall, shadow=False)
    person_at(*m2v(mx, my), kind=guard, shirt=(84, 96, 74), depth_bias=0)
    # shift that person up onto the platform
    dep, idx, fn = S.objs[-1]
    S.objs[-1] = (x + s + y + s + 0.05, idx, lambda d, fn=fn: _shifted(d, fn, 0, -(z0 + tall + 2)))
    box(x - .1, y + s - .05, s + .2, .15, 4, (160, 120, 82), z=z0 + tall + 2, shadow=False)
    box(x + s - .05, y - .1, .15, s + .2, 4, (138, 102, 70), z=z0 + tall + 2, shadow=False)
    # roof
    def r(d):
        poly(d, [P(x - .3, y - .3, z0 + tall + 13), P(x + s + .3, y - .3, z0 + tall + 13),
                 P(x + s + .3, y + s + .3, z0 + tall + 11), P(x - .3, y + s + .3, z0 + tall + 11)], (138, 84, 62))
        for zz in (z0 + tall + 6,):
            d.line([P(x, y + s, zz), P(x + s, y + s, zz)], fill=INK)
    S.add(x + s + y + s + 0.3, r)
    if lamp:
        light_at(vx, vy, 16, (255, 196, 120), 0.45, z=z0 + tall + 8)
    if spot:
        S.lights.append(("spot", (vx + OVX, vy + OVY - z0 - tall - 8), spot))

class _ShiftDraw:
    def __init__(self, d, dx, dy): self.d, self.dx, self.dy = d, dx, dy
    def _m(self, pts):
        if isinstance(pts, tuple) and len(pts) == 2 and not isinstance(pts[0], tuple):
            return (pts[0] + self.dx, pts[1] + self.dy)
        return [(a + self.dx, b + self.dy) for a, b in pts]
    def point(self, pts, fill=None):
        self.d.point(self._m(pts) if not isinstance(pts, tuple) or isinstance(pts[0], tuple) else self._m(pts), fill=fill)
    def rectangle(self, b, **k):
        self.d.rectangle([b[0] + self.dx, b[1] + self.dy, b[2] + self.dx, b[3] + self.dy], **k)
    def line(self, pts, **k): self.d.line(self._m(pts), **k)
    def polygon(self, pts, **k): self.d.polygon(self._m(pts), **k)

def _shifted(d, fn, dx, dy):
    fn(_ShiftDraw(d, dx, dy))

# ------------------------------------------------------------------ world content (CURRENT era)
def build_current():
    Zs = None
    build_wall()
    # towers: main on the rock outcrop by the gate, two mid, two at the river ends
    tower_at(436, wall_vy(436) - 6, tall=30, rock=True, guard="guard", spot=((404, 120), 120, 20))
    tower_at(524, wall_vy(524) + 4, tall=24, guard="guard")
    tower_at(220, wall_vy(220) + 3, tall=26, guard="guard", spot=((240, 150), 90, 16))
    tower_at(748, wall_vy(748) + 3, tall=26, guard="guard", spot=((700, 130), 90, 16))
    tower_at(78, wall_vy(78) + 4, tall=22, guard="guard")
    tower_at(884, wall_vy(884) + 4, tall=22, guard="guard")
    # wall walk / repair scene near the left mid tower
    person_at(300, wall_vy(300) + 5, "human", shirt=(214, 180, 90))      # builder
    person_at(310, wall_vy(310) + 6, "human", shirt=(196, 84, 64))
    mx, my = v2m(305, wall_vy(305) + 8)
    box(mx, my, 1.2, 0.5, 2, (170, 130, 84))     # lumber pile
    # drum fires and lamps along the inner wall
    for vx in (150, 360, 600, 820):
        drum_fire(vx, wall_vy(vx) + 12)

    # gate yard: pickup, crates, two gate guards
    car_at(538, 244, (120, 70, 56), along="y")
    for (a, b) in ((418, 240), (424, 243), (414, 246)):
        mx, my = v2m(a, b); box(mx, my, .7, .7, 4, (166, 128, 84))
    person_at(470, wall_vy(470) + 8, "guard", shirt=(84, 96, 74))
    person_at(494, wall_vy(494) + 8, "guard", shirt=(90, 84, 70))
    # bell post (alarm)
    mx, my = v2m(452, 252)
    box(mx, my, .3, .3, 18, (110, 80, 56))
    box(mx - .5, my - .5, 1.3, 1.3, 2, (110, 80, 56), z=18)
    def bell(d, mx=mx, my=my):
        p = P(mx + .15, my + .15, 16); d.ellipse([p[0] - 2, p[1] - 3, p[0] + 2, p[1] + 1], fill=(200, 160, 70), outline=INK)
    S.add(mx + my + 1.2, bell)

    # civic buildings
    # church w/ steeple (bell tower) – left of the green
    cx, cy = house(332, 302, 3.4, 5.2, 18, (232, 228, 214), (96, 88, 92), ridge="y", wins=3, door=False)
    box(cx + 1.0, cy + 5.2, 1.4, 1.4, 30, (232, 228, 214))
    pyramid(cx + 0.9, cy + 5.1, 1.6, 30, 12, (96, 88, 92))
    # infirmary (white, green cross banner)
    ix, iy = house(398, 270, 3.6, 2.6, 13, (236, 234, 226), (120, 128, 130), ridge="x", wins=2)
    def cross(d, ix=ix, iy=iy):
        c = face_pt(ix, iy + 2.6, ix + 3.6, iy + 2.6, 0.62, 7)
        d.rectangle([c[0] - 4, c[1] - 4, c[0] + 4, c[1] + 4], fill=(246, 244, 236), outline=INK)
        d.rectangle([c[0] - 1, c[1] - 3, c[0] + 1, c[1] + 3], fill=(70, 150, 90))
        d.rectangle([c[0] - 3, c[1] - 1, c[0] + 3, c[1] + 1], fill=(70, 150, 90))
    S.add(ix + 3.6 + iy + 2.6 + 0.02, cross)
    person_at(380, 288, "human", shirt=(230, 230, 236))           # medic
    person_at(388, 290, "human", shirt=(70, 110, 150))            # patient w/ arm sling
    # workshop / garage
    mx, my = v2m(598, 262)
    box(mx - 3, my - 2, 6, 4, 15, (150, 156, 160), (140, 146, 150), (112, 118, 122))
    def door(d, mx=mx, my=my):
        a = face_pt(mx - 3, my + 2, mx + 3, my + 2, 0.18, 0); b = face_pt(mx - 3, my + 2, mx + 3, my + 2, 0.62, 0)
        poly(d, [a, b, (b[0], b[1] - 10), (a[0], a[1] - 10)], (96, 100, 104))
        for k in range(1, 5):
            d.line([(a[0], a[1] - k * 2), (b[0], b[1] - k * 2)], fill=(80, 84, 88))
        S.lights.append(((a[0] + b[0]) / 2, a[1] - 4, 22, (255, 190, 110), 0.5))
    S.add(mx + 3 + my + 2 + 0.02, door)
    person_at(586, 290, "human", shirt=(110, 90, 70))
    person_at(600, 291, "human", shirt=(70, 76, 60))
    mx2, my2 = v2m(624, 284); box(mx2, my2, 1.6, .8, 3, (150, 110, 76))   # workbench
    # town hall (brick)
    house(632, 318, 4.6, 3.6, 19, (176, 104, 82), (90, 80, 78), ridge="x", wins=3)

    # homes
    homes = [
        (214, 306, 3.6, 2.8, 17, (226, 214, 180), (96, 84, 82), "x", 1, True),
        (262, 352, 3.2, 3.2, 16, (168, 186, 150), (120, 72, 60), "y", 0, False),
        (196, 384, 3.6, 2.8, 17, (164, 184, 200), (86, 96, 120), "x", 0, False),
        (322, 384, 3.4, 2.8, 16, (226, 206, 140), (90, 84, 82), "x", 1, True),
        (690, 352, 3.4, 3.0, 17, (210, 170, 160), (86, 96, 120), "y", 0, False),
        (752, 312, 3.6, 2.8, 17, (226, 224, 214), (120, 72, 60), "x", 1, False),
        (640, 392, 3.2, 3.0, 16, (226, 214, 180), (70, 90, 84), "x", 0, True),
        (786, 384, 3.0, 3.0, 15, (168, 186, 150), (96, 84, 82), "y", 1, False),
        (552, 296, 3.0, 2.6, 16, (164, 184, 200), (96, 84, 82), "x", 0, False),
    ]
    for (a, b, w, dd, h, wc, rc, ridge, br, sol) in homes:
        house(a, b, w, dd, h, wc, rc, ridge=ridge, boarded=br, solar=sol)
        # raised garden bed
        mx, my = v2m(a, b)
        box(mx + w / 2 + 0.3, my - 0.6, 1.0, 1.8, 2, (118, 150, 64), (120, 86, 58), (100, 72, 50))

        # picket fence along the yard front + rain barrel + shed for some homes
        x0, y0 = mx - w / 2, my - dd / 2
        fy = y0 + dd + 1.4
        def fence(d, x0=x0, fy=fy, w=w):
            for k in np.arange(0, w + 1.01, 0.5):
                p = P(x0 - .5 + k, fy, 0)
                d.line([p, (p[0], p[1] - 3)], fill=(236, 230, 214))
            d.line([P(x0 - .5, fy, 2), P(x0 + w + .5, fy, 2)], fill=(236, 230, 214))
        S.add(x0 + w + fy + .1, fence)
        box(x0 + w + .1, y0 + dd - .6, .5, .5, 4, (80, 110, 140))
        if rng.random() < 0.6:
            box(x0 - 1.6, y0 + .2, 1.2, 1.0, 7, (150, 110, 76), (140, 100, 70), (110, 80, 58))

    # RV and tarp tents: newer arrivals by the east lane
    mx, my = v2m(712, 262)
    box(mx - 1.8, my - .7, 3.6, 1.4, 9, (226, 222, 206), z=.5)
    def rvstripe(d, mx=mx, my=my):
        d.line([P(mx - 1.8, my + .7, 5), P(mx + 1.8, my + .7, 5)], fill=(180, 110, 70), width=2)
        window_on(d, mx - 1.8, my + .7, mx + 1.8, my + .7, .2, 6, w=.2, hgt=2, lit=LIT)
    S.add(mx + 1.8 + my + .7 + .02, rvstripe)
    for (a, b, c) in ((664, 242, (70, 110, 150)), (686, 236, (110, 140, 90))):
        tx, ty = v2m(a, b)
        def tent(d, tx=tx, ty=ty, c=c):
            poly(d, [P(tx, ty + 1.4, 0), P(tx + 1.6, ty + 1.4, 0), P(tx + .8, ty + 1.4, 7)], shade(c, .9))
            poly(d, [P(tx + 1.6, ty, 0), P(tx + 1.6, ty + 1.4, 0), P(tx + .8, ty + 1.4, 7), P(tx + .8, ty, 7)], shade(c, .7))
        S.add(tx + 1.6 + ty + 1.4, tent)
    person_at(676, 254, "human"); person_at(732, 282, "kid")
    # woodpile + axe-man, compost, extra veg beds near the commons
    mx, my = v2m(384, 330); box(mx, my, 1.6, .8, 4, (150, 104, 64), (140, 96, 60), (120, 82, 52))
    person_at(402, 334, "human", shirt=(110, 90, 70))
    for (a, b) in ((582, 410), (600, 418), (566, 418), (420, 418), (402, 410)):
        mx, my = v2m(a, b); box(mx, my, 1.6, .7, 2, (110, 150, 62), (120, 86, 58), (100, 72, 50))
    for (a, b) in ((300, 262), (340, 250), (640, 270), (130, 280), (860, 290), (170, 450), (790, 446)):
        if zone_at(a, b)["settle"]:
            tree_at(a, b, r=rng.uniform(5, 7), kind="fruit")

    # the big oak at the centre of the green, commons beneath it
    tree_at(GREEN[0], GREEN[1] - 4, r=24, kind="oak", hgt=40, depth_bias=-1.2)
    fire_at(480, 372, big=True)
    for (a, b) in ((452, 384), (508, 384)):
        mx, my = v2m(a, b); box(mx - 1.2, my - .3, 2.4, .6, 3, (150, 108, 72))
    for (a, b, k) in ((448, 380, "human"), (458, 389, "human"), (500, 380, "elder"), (514, 390, "human"),
                      (472, 366, "human"), (492, 366, "kid")):
        person_at(a, b, k)
    # string lights over the green
    poles = [(420, 340), (540, 340), (540, 392), (420, 392)]
    for (a, b) in poles:
        mx, my = v2m(a, b); box(mx, my, .2, .2, 16, (96, 70, 50), shadow=False)
    def bulbs(d):
        for i in range(4):
            (a0, b0), (a1, b1) = poles[i], poles[(i + 1) % 4]
            for t in np.linspace(0, 1, 14):
                sag = math.sin(t * math.pi) * 5
                x_ = a0 + (a1 - a0) * t + OVX; y_ = b0 + (b1 - b0) * t + OVY - 16 + sag
                d.point((round(x_), round(y_)), fill=(255, 226, 150))
    S.emissive.append(bulbs)
    for (a, b) in poles:
        light_at(a, b, 12, (255, 210, 140), 0.25, z=14)
    # playground: swings + kids
    mx, my = v2m(566, 352)
    def swing(d, mx=mx, my=my):
        a, b = P(mx, my, 0), P(mx + 2, my, 0)
        for p in (a, b):
            d.line([p, (p[0], p[1] - 12)], fill=(176, 70, 60), width=1)
        d.line([(a[0], a[1] - 12), (b[0], b[1] - 12)], fill=(176, 70, 60))
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        d.line([(m[0], m[1] - 12), (m[0] + 1, m[1] - 4)], fill=INK)
    S.add(mx + 2 + my + .1, swing)
    for (a, b) in ((562, 370), (576, 364), (552, 360)):
        person_at(a, b, "kid")
    animal_at(586, 372, "dog", (170, 120, 70))
    # elders on a porch, laundry line, chickens + coop
    person_at(236, 330, "elder"); person_at(708, 378, "elder")
    def laundry(d):
        a, b = (258 + OVX, 396 + OVY - 10), (300 + OVX, 410 + OVY - 10)
        d.line([a, b], fill=(220, 220, 210))
        for t, c in zip((0.15, 0.35, 0.55, 0.78), ((196, 84, 64), (240, 236, 220), (70, 110, 150), (214, 180, 90))):
            x_ = a[0] + (b[0] - a[0]) * t; y_ = a[1] + (b[1] - a[1]) * t
            d.rectangle([x_ - 2, y_, x_ + 2, y_ + 5], fill=c, outline=INK)
    mx, my = v2m(280, 403); S.add(mx + my + .5, laundry)
    person_at(292, 414, "human", shirt=(150, 90, 120))
    mx, my = v2m(150, 340); box(mx, my, 2, 1.6, 7, (160, 110, 74))
    for (a, b) in ((168, 362), (176, 358), (160, 366), (182, 366)):
        animal_at(a, b, "chicken", (236, 232, 220))
    # greenhouse
    mx, my = v2m(726, 418)
    box(mx - 2, my - 1.2, 4, 2.4, 9, (196, 226, 222), (176, 212, 208), (150, 190, 188))
    # water tower + DIY wind turbine
    mx, my = v2m(246, 430)
    for (a, b) in ((0, 0), (1.2, 0), (0, 1.2), (1.2, 1.2)):
        box(mx + a, my + b, .2, .2, 20, (110, 80, 56), shadow=False)
    box(mx - .2, my - .2, 1.8, 1.8, 10, (150, 112, 78), z=20)
    mx, my = v2m(820, 430)
    box(mx, my, .25, .25, 34, (200, 200, 196), shadow=False)
    def blades(d, mx=mx, my=my):
        c = P(mx + .12, my + .12, 34)
        for a in (0, 120, 240):
            d.line([c, (c[0] + 9 * math.cos(math.radians(a + 20)), c[1] + 9 * math.sin(math.radians(a + 20)))], fill=(230, 230, 226))
    S.add(mx + my + .6, blades)
    # fields: farmers
    for (a, b) in ((300, 452), (360, 470), (604, 470), (680, 452), (540, 486)):
        person_at(a, b, "human", shirt=rng.choice([(214, 180, 90), (110, 140, 90), (200, 150, 120)]))
    # scarecrow
    person_at(420, 450, "human", shirt=(150, 110, 70), hair=(200, 170, 80))
    # dock + fishers + rowboat
    mx, my = v2m(480, 500)
    box(mx - .5, my - .5, 1.6, 4.2, 2, (160, 120, 82), z=1)
    person_at(*m2v(mx + .2, my + 2.6), kind="human", shirt=(70, 110, 150), depth_bias=1)
    person_at(*m2v(mx + .9, my + 1.2), kind="kid", shirt=(196, 84, 64), depth_bias=1)
    def rods(d, mx=mx, my=my):
        for a, b in ((mx + .2, my + 2.6), (mx + .9, my + 1.2)):
            p = P(a, b, 8); d.line([p, (p[0] + 9, p[1] - 6), (p[0] + 12, p[1] + 10)], fill=(200, 190, 160))
    S.add(mx + my + 6, rods)
    mx, my = v2m(556, 516)
    def boat(d, mx=mx, my=my):
        poly(d, [P(mx, my, 1), P(mx + 2.4, my, 1), P(mx + 2.8, my + .5, 1), P(mx + 2.4, my + 1, 1), P(mx, my + 1, 1)], (150, 96, 60))
    S.add(mx + my, boat)
    # cook / carrier walking the main street
    person_at(484, 300, "human", shirt=(200, 150, 120)); person_at(476, 262, "pack", shirt=(110, 140, 90))
    # fruit trees and bank trees inside
    for (a, b) in ((160, 420), (420, 300), (530, 410), (770, 350), (612, 350), (380, 420), (230, 270),
                   (700, 280), (120, 316), (850, 320), (300, 318), (660, 300)):
        if zone_at(a, b)["settle"]:
            tree_at(a, b, r=rng.uniform(6, 8), kind="fruit")

    # ------------------------------------------------ outside: cleared ground
    for vx in np.arange(70, 900, 26):
        wy = wall_vy(vx)
        hedgehog_at(vx + rng.uniform(-6, 6), wy - 26 + rng.uniform(-3, 3))
        for _ in range(2):
            a, b = vx + rng.uniform(-12, 12), wy - rng.uniform(8, 56)
            if zone_at(a, b)["cleared"] and abs(a - road_vx(b)) > 12:
                stump_at(a, b)
    for (a, b) in ((380, 180), (560, 178), (612, 190), (330, 196)):
        dust_at(a, b)
    car_at(392, 190, (96, 110, 120), along="y", wreck=True)
    car_at(610, 168, (120, 66, 52), along="x", wreck=True)
    # threats nearing the wall
    person_at(352, 168, "zombie", bubble="?")
    person_at(574, 150, "zombie2")
    person_at(700, 176, "zombie")
    # tower guard spots something
    # ------------------------------------------------ wilderness POIs
    # ruined gas station
    gx, gy = v2m(286, 104)
    for (a, b) in ((0, 0), (4.2, 0), (0, 2.6), (4.2, 2.6)):
        box(gx + a, gy + b, .3, .3, 13, (190, 190, 186), shadow=False)
    box(gx - .3, gy - .3, 5, 3.3, 2, (210, 206, 196), (170, 70, 60), (140, 56, 50), z=13)
    box(gx + 1, gy + 1, .6, .4, 4, (170, 70, 60)); box(gx + 2.6, gy + 1, .6, .4, 4, (170, 70, 60))
    mx, my = v2m(236, 86)
    box(mx, my, 4, 3, 11, (196, 186, 166))
    def broken(d, mx=mx, my=my):
        for u in (0.1, 0.45):
            window_on(d, mx, my + 3, mx + 4, my + 3, u, 2, w=0.3, hgt=6, col=(40, 40, 46))
    S.add(mx + 4 + my + 3 + .02, broken)
    person_at(300, 124, "zombie2"); person_at(262, 112, "zombie")
    # collapsed house
    mx, my = v2m(770, 96)
    box(mx, my, 3.6, .4, 14, (200, 190, 170)); box(mx, my, .4, 3, 9, (190, 180, 160))
    def caved(d, mx=mx, my=my):
        poly(d, [P(mx + .4, my + .4, 14), P(mx + 3.6, my + .4, 14), P(mx + 3.8, my + 3.2, 2), P(mx + .4, my + 3.2, 5)], (96, 84, 82))
        d.line([P(mx + 1.5, my + .4, 14), P(mx + 2.2, my + 3, 3)], fill=(60, 50, 48))
    S.add(mx + 4 + my + 3.4, caved)
    # bus on the road + power poles
    bus_at(road_vx(56) + 8, 56)
    car_at(road_vx(18) - 6, 18, (180, 180, 176), along="x", wreck=True)
    for vy in np.arange(-220, 190, 34):
        a = road_vx(vy) + 16
        mx, my = v2m(a, vy); box(mx, my, .18, .18, 22, (100, 76, 56), shadow=False)
    # scavenger team returning on the road (in the default frame)
    for (a, b, k) in ((road_vx(98) - 3, 98, "pack"), (road_vx(104) + 4, 104, "pack"), (road_vx(112) - 1, 112, "guard")):
        person_at(a, b, k, shirt=rng.choice([(110, 120, 90), (120, 100, 80), (90, 100, 110)]))
    # wildlife
    animal_at(852, 160, "deer", (170, 120, 76)); animal_at(866, 150, "deer", (160, 112, 70))
    animal_at(130, 150, "rabbit", (190, 170, 140)); animal_at(30, 520, "deer", (170, 120, 76))
    # far town ruins (overview only)
    for (a, b, w, d_, h) in ((470, -170, 4, 3, 26), (530, -150, 3, 3, 20), (430, -130, 3, 4, 14),
                              (580, -190, 4, 3, 32), (500, -210, 3, 3, 18), (620, -140, 3, 2, 12)):
        mx, my = v2m(a, b)
        box(mx, my, w, d_, h, (176, 168, 156))
        def rw(d, mx=mx, my=my, w=w, d_=d_, h=h):
            for zz in range(3, h - 3, 6):
                for k in range(int(w)):
                    window_on(d, mx, my + d_, mx + w, my + d_, 0.1 + k / w, zz, w=0.14, hgt=3, col=(54, 52, 58))
                for k in range(int(d_)):
                    window_on(d, mx + w, my, mx + w, my + d_, 0.1 + k / d_, zz, w=0.14, hgt=3, col=(44, 42, 48))
            poly(d, [P(mx + w * .5, my, h), P(mx + w, my, h), P(mx + w, my + d_ * .6, h - 5)], (120, 112, 104))
        S.add(mx + w + my + d_ + .02, rw)
    for _ in range(16):
        person_at(rng.uniform(440, 620), rng.uniform(-120, -96), rng.choice(["zombie", "zombie2"]))
    # old farmstead (left), radio hill (right)
    mx, my = v2m(150, -20); box(mx, my, 4, 3, 14, (170, 96, 76)); pyramid(mx - .2, my - .2, 3.4, 14, 10, (110, 80, 70))
    mx, my = v2m(866, -110)
    box(mx, my, .3, .3, 70, (176, 74, 64), shadow=False)
    box(mx - 1, my + 1.4, 2, 1.6, 8, (180, 180, 176))
    # forests
    tries = 0
    pts = []
    while tries < 26000:
        tries += 1
        a, b = rng.uniform(-560, 1520), rng.uniform(-260, 790)
        mx, my = v2m(a, b)
        if not (0.5 < mx < 127.5 and 0.5 < my < 127.5):
            continue
        z = zone_at(a, b)
        if z["river"] or z["bank"] or z["settle"]:
            continue
        if abs(a - road_vx(b)) < 16 and b < 230:
            continue
        if z["cleared"]:
            continue
        pois = ((270, 100, 70), (770, 100, 46), (520, -160, 120), (150, -20, 40), (866, -110, 30))
        if any((a - p) ** 2 + ((b - q) * 2) ** 2 < r * r for p, q, r in pois):
            continue
        if z["inside"] and b > -60:
            dens = min(1, max(0.06, (z["wv"] - 62 - b) / 90))
        elif z["farbank"]:
            dens = 0.25
        else:
            dens = 0.9
        if rng.random() > dens:
            continue
        if any((a - p) ** 2 + ((b - q) * 1.6) ** 2 < 110 for p, q in pts[-60:]):
            continue
        pts.append((a, b))
        kind = "pine" if rng.random() < 0.3 else "wild"
        if z["farbank"]:
            kind = "oak"
        tree_at(a, b, r=rng.uniform(5.5, 8.5), kind=kind)
    # wandering threats deep in the wild (overview)
    for _ in range(26):
        a, b = rng.uniform(-300, 1300), rng.uniform(-220, 130)
        z = zone_at(a, b)
        mx, my = v2m(a, b)
        if not z["river"] and not z["settle"] and 2 < mx < 126 and 2 < my < 126:
            person_at(a, b, rng.choice(["zombie", "zombie2"]))
    for _ in range(10):
        a, b = rng.uniform(-400, 1400), rng.uniform(0, 700)
        z = zone_at(a, b)
        mx, my = v2m(a, b)
        if (z["farbank"] or (z["wild"] and not z["inside"])) and 2 < mx < 126 and 2 < my < 126:
            animal_at(a, b, "deer", (170, 120, 76))

# ------------------------------------------------------------------ render
def render(mode):
    global S
    S = Scene(); rng.seed(11)
    g, Z, void = ground()
    build_current()
    base = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8))
    # shadows
    sh = Image.new("L", (W, H), 0); sd = ImageDraw.Draw(sh)
    for p in S.shadows:
        sd.polygon([(round(a), round(b)) for a, b in p], fill=255)
    gnp = np.asarray(base, np.float32)
    m = (np.asarray(sh, np.float32) / 255.0)[..., None]
    gnp = gnp * (1 - 0.28 * m) + np.array((40, 30, 60)) * 0.0 * m
    base = Image.fromarray(gnp.astype(np.uint8))
    d = ImageDraw.Draw(base)
    for depth, idx, fn in sorted(S.objs, key=lambda t: (t[0], t[1])):
        fn(d)
    arr = np.asarray(base, np.float32)
    py, px = np.mgrid[0:H, 0:W].astype(np.float32)
    vx, vy = px - OVX, py - OVY
    inside_w = 1 / (1 + np.exp(-(vy - wall_vy(vx) - 4) / 10))       # 0 outside wall -> 1 inside
    inside_w = inside_w * Z["inside"].astype(np.float32) + 0.0
    inside_w = np.asarray(Image.fromarray((inside_w * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), np.float32) / 255
    fog = np.clip((60 - vy) / 340, 0, 1)
    if mode == "day":
        arr = arr * np.array((1.03, 1.0, 0.95))
        arr = arr * (1 - 0.06 * (1 - inside_w[..., None]))
        arr = arr * (1 - fog[..., None] * 0.5) + np.array((150, 170, 190)) * fog[..., None] * 0.5
    else:
        warm = np.array((1.0, 0.80, 0.64)) * 0.92
        cool = np.array((0.62, 0.64, 0.86)) * 0.66
        mult = cool + (warm - cool) * inside_w[..., None]
        arr = arr * mult
        arr = arr * (1 - fog[..., None] * 0.6) + np.array((96, 74, 104)) * fog[..., None] * 0.6
        img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        dd = ImageDraw.Draw(img)
        # light layer
        L = np.zeros((H, W, 3), np.float32)
        spot = Image.new("L", (W, H), 0); spd = ImageDraw.Draw(spot)
        for li in S.lights:
            if li[0] == "spot":
                (sx, sy), ((tx, ty), length, half) = li[1], li[2]
                tx, ty = tx + OVX, ty + OVY
                ang = math.atan2(ty - sy, tx - sx); nx, ny = -math.sin(ang), math.cos(ang)
                spd.polygon([(sx, sy), (tx + nx * half * 2, ty + ny * half), (tx - nx * half * 2, ty - ny * half)], fill=40)
                spd.ellipse([tx - half * 2, ty - half, tx + half * 2, ty + half], fill=80)
                continue
            lx, ly, r, col, k = li
            x0, x1 = int(max(0, lx - r * 2)), int(min(W, lx + r * 2)); y0, y1 = int(max(0, ly - r)), int(min(H, ly + r))
            if x0 >= x1 or y0 >= y1:
                continue
            yy, xx = np.mgrid[y0:y1, x0:x1]
            f = np.exp(-(((xx - lx) / (r * 1.0)) ** 2 + ((yy - ly) / (r * 0.55)) ** 2) * 2.2) * k
            L[y0:y1, x0:x1] += f[..., None] * np.array(col, np.float32)
        spot = np.asarray(spot.filter(ImageFilter.GaussianBlur(5)), np.float32)[..., None] / 255
        a = np.asarray(img, np.float32)
        a = a + L * 0.55 + a * L / 255 * 0.9 + spot * np.array((200, 214, 230)) * 0.55
        img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        dd = ImageDraw.Draw(img)
        for e in S.emissive:
            e(dd)
        return img
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

def font(sz, bold=True):
    for f in ("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/consolab.ttf"):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()

def tag(d, x, y, text, sz=13, fg=(250, 244, 226), bg=(59, 42, 38)):
    f = font(sz); w = d.textlength(text, font=f)
    d.rounded_rectangle([x - 5, y - 3, x + w + 5, y + sz + 4], 4, fill=bg)
    d.text((x, y - 1), text, font=f, fill=fg)

def annotate(img):
    d = ImageDraw.Draw(img)
    def V(a, b): return (a + OVX, b + OVY)
    # camera frames
    def frame(cx, cy, w, h, col, label):
        x0, y0 = cx - w / 2 + OVX, cy - h / 2 + OVY
        for k in range(0, int(w), 8):
            d.line([(x0 + k, y0), (x0 + min(w, k + 4), y0)], fill=col, width=2)
            d.line([(x0 + k, y0 + h), (x0 + min(w, k + 4), y0 + h)], fill=col, width=2)
        for k in range(0, int(h), 8):
            d.line([(x0, y0 + k), (x0, y0 + min(h, k + 4))], fill=col, width=2)
            d.line([(x0 + w, y0 + k), (x0 + w, y0 + min(h, k + 4))], fill=col, width=2)
        tag(d, x0 + 4, y0 + 6, label, 12, (20, 20, 24), col)
    frame(480, 270, 960, 540, (255, 214, 120), "DEFAULT 1920x1080  ·  zoom 2x  ·  960x540 art px")
    frame(480, 286, 683, 384, (150, 220, 255), "1366x768 if left at 2x (too tight: auto-fit picks 1.5x = default framing)")
    frame(480, 300, 312, 675, (255, 150, 190), "iPhone portrait 390x844 · zoom 1.25x")
    # zone bands (left gutter of the default frame)
    tag(d, *V(-150, 40), "THREAT WILDERNESS  ~38%", 15)
    tag(d, *V(-150, 205), "FRONTIER: cleared ground + wall  ~14%", 15)
    tag(d, *V(-150, 380), "SETTLEMENT (inside the river bend)  ~48%", 15)
    tag(d, *V(-430, 560), "FAR BANK — wildlife, deer drinking", 13)
    # POIs
    pois = [((286, 92), "POI · ruined gas station"), ((770, 80), "POI · collapsed house"),
            ((520, -236), "POI · old town ruins (horde gathers here)"), ((150, -52), "POI · old farmstead"),
            ((866, -186), "POI · radio hill"), ((480, 52), "school-bus wreck on the old road")]
    for (a, b), t in pois:
        tag(d, a + OVX + 10, b + OVY - 10, t, 12, (30, 26, 24), (240, 226, 190))
    notes = [((436, 178), "main tower on the rock outcrop"), ((480, 226), "gate + yard"),
             ((480, 330), "the great oak + commons"), ((655, 160), "creek → culvert under wall"),
             ((480, 520), "fishing dock"), ((250, 460), "fields along the bend"),
             ((90, 300), "river (the rear wall)")]
    for (a, b), t in notes:
        tag(d, a + OVX + 6, b + OVY + 4, t, 11, (250, 244, 226), (70, 50, 44))
    # scavenger routes (dashed)
    routes = [[(480, 212), (road_vx(150), 150), (road_vx(60), 60), (road_vx(-40), -40), (520, -150)],
              [(480, 200), (420, 150), (330, 112)], [(480, 190), (600, 150), (760, 106)],
              [(480, 160), (300, 60), (160, -10)], [(480, 120), (700, 20), (860, -100)]]
    for r in routes:
        for (a, b), (c, e) in zip(r, r[1:]):
            n = int(math.hypot(c - a, e - b) / 8)
            for k in range(n):
                if k % 2 == 0:
                    t0, t1 = k / n, (k + 1) / n
                    d.line([V(a + (c - a) * t0, b + (e - b) * t0), V(a + (c - a) * t1, b + (e - b) * t1)], fill=(255, 232, 140), width=2)
    tag(d, *V(980, 40), "- - -  scavenger routes (gate → POI → gate)", 12, (30, 26, 24), (255, 232, 140))
    tag(d, 24, 20, "HOLDFAST — World Overview (Current era, day)  ·  128x128 tiles · 16x8 px tiles · 2:1 iso", 18)
    return img

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    day = render("day")
    annotate(day).save(os.path.join(OUT, "01-world-overview.png"))
    dusk = render("dusk")
    crop = dusk.crop((OVX, OVY, OVX + VW, OVY + VH)).resize((VW * 2, VH * 2), Image.NEAREST)
    crop.save(os.path.join(OUT, "02-current-era-dusk.png"))
    print("ok")
