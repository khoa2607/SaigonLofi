"""Holdfast concept-mockup generator v0.3 (design tool only, not game code).

Renders the Holdfast valley procedurally at true game art resolution:
2:1 isometric, 16x8 art-px tiles, 128x128 tile map, chibi people 13 art px tall.
Default camera = 3 screen px per art px at 1080p (640x360 art px visible), which
puts people at ~39 screen px, the same apparent size as SaigonLofi's walkers.

  python docs/holdfast/tools/mockgen.py <out_dir>

Outputs:
  01-world-overview.png    whole map at 1x, day, zones / routes / camera frames
  02-current-era-dusk.png  default 1920x1080 frame (640x360 art px at 3x), dusk
"""
import math, random, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "."
MAPN = 144                     # map size in tiles
W, H = MAPN * 16, MAPN * 8      # full map in art px (144x144 tiles of 16x8)
CX, CY0 = MAPN * 8, 648         # valley centre in art px
G = 1.44                       # valley scale: design units -> art px
CAM = (CX, 532)              # default camera centre (art px)
VW, VH = 640, 360              # default 1080p view at 3x
VX0, VY0 = CAM[0] - VW // 2, CAM[1] - VH // 2
INK = (59, 42, 38)
rng = random.Random(7)

# ------------------------------------------------------------------ coordinates
def proj(x, y, z=0.0):
    return (CX + (x - y) * 8, (x + y) * 4 - z)

def p2m(px, py):
    a = (px - CX) / 8; b = py / 4
    return ((a + b) / 2, (b - a) / 2)

def D(u, v):
    """design coords (the v0.2 layout units) -> art px"""
    return (CX + (u - 480) * G, CY0 + (v - 300) * G)

def d2m(u, v):
    return p2m(*D(u, v))

def m2d(x, y):
    px, py = proj(x, y)
    return ((px - CX) / G + 480, (py - CY0) / G + 300)

# ------------------------------------------------------------------ geography (design units)
CLEAR = 50
def wall_v(u):
    return 212 + 55 * ((u - 480) / 440) ** 2

def river_side(v, side):
    return 480 + side * (474 + np.maximum(0, 300 - v) ** 2 / 300)

def road_u(v):
    return 480 + 34 * np.sin((212 - v) / 75)

def stream_u(v):
    return 655 + 18 * np.sin(v / 31) + np.maximum(0, v - 270) * 1.05

def trail_l(v):   # west trail: from the cleared ground NW to the farmstead
    return 330 - (212 - v) * 0.15 + 14 * np.sin(v / 23)

def trail_r(v):   # east trail: to the collapsed house and radio hill
    return 640 + (212 - v) * 0.3 + 12 * np.sin(v / 19)

GREEN = (480, 334)

def zones(u, v):
    u = np.asarray(u, float); v = np.asarray(v, float)
    d = np.sqrt(((u - 480) / 445) ** 2 + ((v - 300) / 222) ** 2)
    lower = v >= 300
    cl, cr = river_side(v, -1), river_side(v, 1)
    river = np.where(lower, (d >= 1.0) & (d <= 1.13), (np.abs(u - cl) < 29) | (np.abs(u - cr) < 29))
    inside = np.where(lower, d < 1.0, (u > cl + 29) & (u < cr - 29))
    bank = np.where(lower, ((d > 0.972) & (d < 1.0)) | ((d > 1.13) & (d < 1.155)),
                    (np.abs(np.abs(u - cl) - 31) < 3) | (np.abs(np.abs(u - cr) - 31) < 3)) & ~river
    wv = wall_v(u)
    settle = inside & (v > wv + 2)
    cleared = inside & (v <= wv + 2) & (v > wv - CLEAR)
    wild = (inside & (v <= wv - CLEAR)) | (~inside & ~river & (v < 300))
    farbank = ~inside & ~river & (v >= 300)
    fields = settle & (d < 0.93) & (v > 396) & (np.abs(u - 480) > 9)
    return dict(d=d, river=river, inside=inside, bank=bank, settle=settle, cleared=cleared,
                wild=wild, farbank=farbank, wv=wv, fields=fields)

def zone_at(u, v):
    z = zones(np.array([u]), np.array([v]))
    return {k: val[0] for k, val in z.items()}

# reserved (non-residential) areas inside the wall, design units
RES = {
    "yard": (392, 568, 0, 250), "market": (426, 536, 248, 296), "barracks": (318, 404, 236, 282),
    "infirmary": (556, 620, 232, 276), "workshop": (596, 690, 270, 306), "church": (330, 398, 296, 340),
    "school": (584, 650, 316, 350), "play": (392, 444, 352, 384), "kitchen": (524, 590, 338, 376),
    "barn": (262, 330, 372, 400), "green": None,
}
def reserved(u, v):
    u = np.asarray(u, float); v = np.asarray(v, float)
    m = ((u - GREEN[0]) / 104) ** 2 + ((v - GREEN[1]) / 52) ** 2 < 1
    for k, r in RES.items():
        if r:
            m |= (u > r[0]) & (u < r[1]) & (v > r[2]) & (v < r[3])
    m |= np.abs(u - stream_u(v)) < 14
    m |= (np.abs(u - 480) < 11)
    m |= v < wall_v(u) + 16          # wall walk / inner patrol lane
    return m

# ------------------------------------------------------------------ ground
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0

def smooth_noise(scale, seed):
    r = np.random.default_rng(seed)
    small = r.random((H // scale + 2, W // scale + 2)).astype(np.float32)
    im = Image.fromarray((small * 255).astype(np.uint8)).resize(
        ((W // scale + 2) * scale, (H // scale + 2) * scale), Image.BICUBIC)
    return np.asarray(im, np.float32)[:H, :W] / 255.0

WOOD_N = None
def ground():
    global WOOD_N
    py, px = np.mgrid[0:H, 0:W].astype(np.float32)
    u = (px - CX) / G + 480; v = (py - CY0) / G + 300
    mx = ((px - CX) / 8 + py / 4) / 2
    my = (py / 4 - (px - CX) / 8) / 2
    Z = zones(u, v)
    n = smooth_noise(24, 1) * 0.65 + smooth_noise(6, 2) * 0.35
    n = n + (BAYER[(py % 4).astype(int), (px % 4).astype(int)] - 0.5) * 0.28
    WOOD_N = smooth_noise(70, 4) * 0.7 + smooth_noise(26, 8) * 0.3
    img = np.zeros((H, W, 3), np.float32)

    def paint(mask, cols, t=(0.42, 0.68)):
        c0, c1, c2 = [np.array(c, np.float32) for c in cols]
        sel = np.where(n[..., None] < t[0], c0, np.where(n[..., None] < t[1], c1, c2))
        img[mask] = sel[mask]

    void = (mx < 0) | (mx > MAPN) | (my < 0) | (my > MAPN)
    # wilderness: meadow / grassland base, darker under woods, rocky patches
    paint(Z["wild"], [(112, 140, 72), (128, 152, 78), (146, 166, 88)])
    meadow = Z["wild"] & (smooth_noise(50, 12) > 0.6)
    paint(meadow, [(150, 160, 84), (166, 172, 92), (184, 182, 104)])            # dry grassland
    woods = Z["wild"] & (WOOD_N > 0.56)
    paint(woods, [(66, 96, 58), (78, 108, 62), (92, 120, 66)])
    rocky = Z["wild"] & (((u - 690) / 60) ** 2 + ((v - 30) / 30) ** 2 < 1) | Z["wild"] & (((u - 250) / 40) ** 2 + ((v - 140) / 18) ** 2 < 1)
    paint(rocky, [(132, 128, 118), (148, 144, 132), (164, 160, 146)])
    paint(Z["farbank"], [(112, 146, 76), (128, 160, 84), (146, 174, 92)])
    paint(Z["cleared"], [(146, 118, 84), (162, 134, 96), (178, 150, 108)])
    edge = Z["cleared"] & (v < Z["wv"] - CLEAR + 14) & (n > 0.5)
    paint(edge, [(120, 136, 76), (126, 140, 80), (132, 146, 82)])
    paint(Z["settle"], [(122, 156, 72), (138, 170, 80), (156, 184, 92)])
    # trodden earth where people work
    worn = Z["settle"] & (((np.abs(u - 480) < 64) & (v < 300)) | (v < wall_v(u) + 16)) & (smooth_noise(18, 21) + (np.abs(u - 480) < 50) * .3 > .35)
    paint(worn, [(166, 142, 104), (178, 154, 114), (190, 166, 124)])
    g = ((u - GREEN[0]) / 104) ** 2 + ((v - GREEN[1]) / 52) ** 2
    paint(Z["settle"] & (g < 1), [(140, 176, 84), (156, 188, 92), (172, 200, 104)])
    # residential street grid on the map axes (reads as 2:1 diagonals)
    resid = Z["settle"] & ~reserved(u, v) & ~Z["fields"]
    grid = resid & ((np.mod(mx, 6) < 0.8) | (np.mod(my, 5) < 0.7))
    paint(grid, [(168, 152, 124), (180, 164, 134), (192, 176, 144)], (0.35, 0.75))
    # fields
    fld = Z["fields"]
    pid = (np.floor(mx / 5) + np.floor(my / 5) * 3) % 5
    path = (np.mod(mx, 5) < 0.45) | (np.mod(my, 5) < 0.45)
    row = np.mod(my * 2.5, 1) < 0.5
    soil = np.array((120, 86, 58), np.float32)
    for k, crop in enumerate([(98, 146, 58), (124, 164, 66), (196, 168, 82), (86, 128, 62), (150, 120, 70)]):
        m = fld & (pid == k) & ~path
        cc = np.where(row[..., None], soil + (n[..., None] - 0.5) * 20, np.array(crop, np.float32) + (n[..., None] - 0.5) * 30)
        img[m] = cc[m]
    img[fld & path] = (150, 124, 90)
    # main street + green ring + dock lane
    street = Z["settle"] & (np.abs(u - 480) < 7) & (v < 520)
    street |= Z["settle"] & (np.abs(g - 1.0) < 0.1)
    paint(street, [(170, 156, 128), (182, 168, 138), (194, 180, 148)], (0.35, 0.75))
    # outside: old road, trails, riverbank paths
    rd = (v < Z["wv"] + 2) & (np.abs(u - road_u(v)) < 10) & ~Z["river"]
    paint(rd, [(84, 84, 90), (96, 95, 100), (108, 106, 110)], (0.3, 0.8))
    img[rd & (smooth_noise(3, 9) > 0.78)] = (124, 140, 78)
    img[rd & (np.abs(u - road_u(v)) < 0.8) & (np.mod(v, 12) < 5)] = (178, 164, 96)
    tr = (Z["wild"] | Z["cleared"]) & (((np.abs(u - trail_l(v)) < 2.6) & (v < Z["wv"] - 8)) | ((np.abs(u - trail_r(v)) < 2.6) & (v < Z["wv"] - 8)))
    cl, cr = river_side(v, -1), river_side(v, 1)
    tr |= (Z["wild"] | Z["cleared"]) & ((np.abs(u - (cl + 40)) < 2) | (np.abs(u - (cr - 40)) < 2)) & (v < 290)
    paint(tr, [(150, 124, 88), (162, 136, 98), (172, 146, 106)])
    # stream
    st = (np.abs(u - stream_u(v)) < 4.5) & Z["inside"] & ~Z["river"] & (v < 470)
    img[st] = (78, 132, 160)
    img[st & (n > 0.72)] = (130, 182, 200)
    img[(np.abs(np.abs(u - stream_u(v)) - 5.5) < 1) & Z["inside"] & ~Z["river"] & (v < 470)] = (110, 130, 80)
    paint(Z["bank"], [(188, 168, 122), (200, 182, 134), (212, 196, 148)])
    paint(Z["river"], [(58, 112, 142), (66, 124, 154), (72, 132, 162)], (0.3, 0.8))
    img[Z["river"] & (np.mod(px + py * 2, 23) < 3) & (smooth_noise(4, 5) > 0.66)] = (126, 176, 198)
    img[void] = (34, 38, 44)
    return img, Z, void

# ------------------------------------------------------------------ scene + helpers
class Scene:
    def __init__(self):
        self.objs, self.shadows, self.lights, self.emissive = [], [], [], []
        self.people = 0; self.threats = 0; self.houses = 0; self.pos = []
    def add(self, depth, fn):
        self.objs.append((depth, len(self.objs), fn))

S = Scene()
P = proj

def poly(d, pts, fill, outline=INK):
    d.polygon([(round(a), round(b)) for a, b in pts], fill=fill, outline=outline)

def shade(c, k):
    return tuple(max(0, min(255, int(x * k))) for x in c)

def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def dark(c):   # hue-shifted shadow (cooler, toward plum)
    return mix(shade(c, 0.72), (70, 46, 86), 0.22)

def light(c):  # warmer highlight
    return mix(shade(c, 1.12), (255, 232, 186), 0.18)

def add_shadow(x, y, w, dd, h):
    s = h * 0.9 / 8
    S.shadows.append([P(x, y), P(x + w + s, y), P(x + w + s, y + dd), P(x, y + dd)])

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

def dbox(u, v, w, dd, h, top, left=None, right=None, z=0, shadow=True):
    mx, my = d2m(u, v)
    box(mx - w / 2, my - dd / 2, w, dd, h, top, left, right, z, shadow)
    return mx - w / 2, my - dd / 2

def face_pt(x0, y0, x1, y1, t, z):
    return P(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z)

LIT = (255, 210, 130)
def window_on(d, x0, y0, x1, y1, t, z, w=0.16, hgt=5, col=(58, 70, 88), lit=None, boarded=False):
    a = face_pt(x0, y0, x1, y1, t, z); b = face_pt(x0, y0, x1, y1, t + w, z)
    c = face_pt(x0, y0, x1, y1, t + w, z + hgt); e = face_pt(x0, y0, x1, y1, t, z + hgt)
    poly(d, [a, b, c, e], (130, 96, 60) if boarded else col, INK)
    if boarded:
        d.line([a, c], fill=INK); d.line([b, e], fill=INK)
    if lit and not boarded:
        S.emissive.append(lambda dd, pts=(a, b, c, e): poly(dd, pts, lit, (120, 80, 40)))
        S.lights.append(((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, 9, (255, 180, 90), 0.35))

def house_m(x, y, w, dd, h, wall, roof, ridge="x", wins=2, boarded=0, door=True, solar=False, rr=None):
    rr = rr or random.Random(rng.random())
    add_shadow(x, y, w, dd, h + 9)
    left, right = shade(wall, 0.92), shade(wall, 0.72)
    rh = 8; z = 0
    lits = [rr.random() < 0.7 for _ in range(12)]
    brd = [boarded and rr.random() < 0.4 for _ in range(12)]
    def f(d):
        poly(d, [P(x, y + dd, z), P(x + w, y + dd, z), P(x + w, y + dd, z + h), P(x, y + dd, z + h)], left)
        poly(d, [P(x + w, y, z), P(x + w, y + dd, z), P(x + w, y + dd, z + h), P(x + w, y, z + h)], right)
        for zz in range(z + 3, z + h, 3):
            d.line([P(x + 0.05, y + dd, zz), P(x + w - 0.05, y + dd, zz)], fill=shade(wall, 0.82))
            d.line([P(x + w, y + 0.05, zz), P(x + w, y + dd - 0.05, zz)], fill=shade(wall, 0.64))
        k = 0
        storeys = (z + 3, z + 11) if h >= 16 else (z + 3,)
        for i in range(wins):
            t = 0.12 + i * (0.76 / max(1, wins))
            for zz in storeys:
                k += 1
                if door and i == 0 and zz == z + 3:
                    continue
                window_on(d, x, y + dd, x + w, y + dd, t, zz, lit=LIT if lits[k] else None, boarded=brd[k])
        for zz in storeys:
            k += 1
            window_on(d, x + w, y, x + w, y + dd, 0.35, zz, lit=LIT if lits[k] else None, boarded=brd[k])
        if door:
            a = face_pt(x, y + dd, x + w, y + dd, 0.14, z); b = face_pt(x, y + dd, x + w, y + dd, 0.26, z)
            poly(d, [a, b, (b[0], b[1] - 8), (a[0], a[1] - 8)], (112, 76, 56))
            S.lights.append(((a[0] + b[0]) / 2, a[1] - 3, 10, (255, 170, 80), 0.3))
        ov = 0.25
        X0, X1, Y0, Y1 = x - ov, x + w + ov, y - ov, y + dd + ov
        if ridge == "x":
            ym = (Y0 + Y1) / 2
            poly(d, [P(X0, Y0, z + h), P(X1, Y0, z + h), P(X1, ym, z + h + rh), P(X0, ym, z + h + rh)], light(roof))
            poly(d, [P(x + w, y, z + h), P(x + w, y + dd, z + h), P(x + w, y + dd / 2, z + h + rh - 1)], right)
            poly(d, [P(X0, ym, z + h + rh), P(X1, ym, z + h + rh), P(X1, Y1, z + h), P(X0, Y1, z + h)], roof)
            for t in (0.3, 0.6, 0.85):
                yy = ym + (Y1 - ym) * t
                d.line([P(X0 + 0.1, yy, z + h + rh * (1 - t)), P(X1 - 0.1, yy, z + h + rh * (1 - t))], fill=dark(roof))
            if solar:
                poly(d, [P(X0 + .6, ym + .3, z + h + rh - 1.5), P(X0 + 2.2, ym + .3, z + h + rh - 1.5),
                         P(X0 + 2.2, Y1 - .4, z + h + 1.5), P(X0 + .6, Y1 - .4, z + h + 1.5)], (52, 70, 104))
        else:
            xm = (X0 + X1) / 2
            poly(d, [P(X0, Y0, z + h), P(X0, Y1, z + h), P(xm, Y1, z + h + rh), P(xm, Y0, z + h + rh)], light(roof))
            poly(d, [P(x, y + dd, z + h), P(x + w, y + dd, z + h), P(x + w / 2, y + dd, z + h + rh - 1)], left)
            poly(d, [P(xm, Y0, z + h + rh), P(xm, Y1, z + h + rh), P(X1, Y1, z + h), P(X1, Y0, z + h)], shade(roof, 0.8))
            if solar:
                poly(d, [P(xm + .3, Y0 + .6, z + h + rh - 1.5), P(xm + .3, Y0 + 2.4, z + h + rh - 1.5),
                         P(X1 - .4, Y0 + 2.4, z + h + 1.5), P(X1 - .4, Y0 + .6, z + h + 1.5)], (52, 70, 104))
    S.add(x + w + y + dd, f)
    S.houses += 1

def house(u, v, w, dd, h, wall, roof, **k):
    mx, my = d2m(u, v)
    house_m(mx - w / 2, my - dd / 2, w, dd, h, wall, roof, **k)
    return mx - w / 2, my - dd / 2

def pyramid(x, y, w, z, h, col):
    def f(d):
        apex = P(x + w / 2, y + w / 2, z + h)
        poly(d, [P(x, y + w, z), P(x + w, y + w, z), apex], col)
        poly(d, [P(x + w, y, z), P(x + w, y + w, z), apex], shade(col, 0.75))
    S.add(x + w + y + w + 0.01, f)

def awning_stall(u, v, col):
    mx, my = d2m(u, v)
    box(mx, my, 1.6, 1.2, 4, (150, 110, 76))                        # counter
    for (a, b) in ((0, 0), (1.5, 0), (0, 1.1), (1.5, 1.1)):
        box(mx + a, my + b, .12, .12, 10, (110, 80, 56), shadow=False)
    def roof(d, mx=mx, my=my):
        pts = [P(mx - .2, my - .2, 11), P(mx + 1.8, my - .2, 11), P(mx + 1.8, my + 1.5, 9), P(mx - .2, my + 1.5, 9)]
        poly(d, pts, col)
        for t in (0.25, 0.5, 0.75):
            d.line([face_pt(mx - .2, my - .2, mx + 1.8, my - .2, t, 11), face_pt(mx - .2, my + 1.5, mx + 1.8, my + 1.5, t, 9)], fill=light(col))
        for t in (0.2, 0.45, 0.7):   # goods
            p = face_pt(mx, my + 1.2, mx + 1.6, my + 1.2, t, 4)
            d.rectangle([p[0] - 1, p[1] - 2, p[0] + 1, p[1]], fill=rng.choice([(200, 80, 60), (220, 180, 80), (110, 150, 70)]))
    S.add(mx + 1.8 + my + 1.5 + .1, roof)
    S.lights.append((*P(mx + .8, my + .6, 8), 12, (255, 196, 120), 0.35))

# ------------------------------------------------------------------ sprites (8 px wide, 13 px adult)
T = {
 "front": ["..hhHH..", ".hHHHHH.", ".HSSSSH.", ".SESSES.", ".SSSSss.", "..sSSs..", ".CCCCcc.", "SCCCCccs",
           "SCCCCccs", ".PPPPpp.", ".PP..pp.", ".PP..pp.", ".BB..BB."],
 "walk1": ["..hhHH..", ".hHHHHH.", ".HHSSSS.", ".HSSSES.", ".HSSSSs.", "..sSSs..", "..CCCc..", ".SCCCcS.",
           "..CCCc..", "..PPpp..", ".PP..pp.", "PP....pp", "B......B"],
 "walk2": ["..hhHH..", ".hHHHHH.", ".HHSSSS.", ".HSSSES.", ".HSSSSs.", "..sSSs..", "..CCCc..", "..CCCcS.",
           "..CCCc..", "..PPpp..", "..PPpp..", "..PPpp..", "..BBBB.."],
 "pack1": ["..hhHH..", ".hHHHHH.", ".HHSSSS.", ".HSSSES.", ".HSSSSs.", "..sSSs..", "AACCCc..", "AaCCCcS.",
           "AaCCCc..", "..PPpp..", ".PP..pp.", "PP....pp", "B......B"],
 "carry": ["..XXXXx.", "..XXXXx.", "..xxxxx.", "..hhHH..", ".hHHHHH.", ".HHSSSS.", ".HSSSES.", ".HSSSSs.",
           "..sSSs..", "..CCCcS.", "..CCCc..", "..CCCc..", "..PPpp..", ".PP..pp.", "PP....pp", "B......B"],
 "aim": ["..hhHH.....", ".hHHHHH....", ".HHSSSS....", ".HSSSES....", ".HSSSSs....", "..sSSs.....",
         "..CCCcSGGGG", "..CCCcG....", "..CCCc.....", "..PPpp.....", ".PP..pp....", ".PP...pp...", ".BB...BB..."],
 "kneel": ["..hhHH..", ".hHHHHH.", ".HHSSSS.", ".HSSSES.", ".HSSSSs.", "..sSSs..", "..CCCcS.", "..CCCcS.",
           ".PPPpppp", ".BB..ppB"],
 "sit": ["..hhHH..", ".hHHHHH.", ".HSSSSH.", ".SESSES.", ".SSSSss.", "..sSSs..", ".CCCCcc.", "SCCCCccs",
         "SPPPPpps", ".pPPPPp.", ".B....B."],
 "elder": ["..hhHH..", ".hHHHHH.", ".HSSSSH.", ".SESSES.", ".SSSSss.", "..sSSs..", ".CCCCcc.", "SCCCCccW",
           ".CCCCccW", ".PPPPppW", ".PP..ppW", ".PP..ppW", ".BB..BBW"],
 "kid": ["..hhHH..", ".hHHHHH.", ".HSSSSH.", ".SESSES.", "..SSSs..", ".SCCccS.", "..CCcc..", "..PPpp..",
         "..P..p..", "..B..B.."],
 "kidrun": ["..hhHH..", ".hHHHHH.", ".HHSSSS.", ".HSSSES.", "..SSSs..", "..CCcS..", ".SCCcc..", "..PPpp..",
            ".P...p..", "B.....B."],
 "zfront": ["........", "..HHH...", ".HSSSS..", ".SESsES.", ".SSSSss.", "..sSs...", ".CCRCcSS", ".CCCccSs",
            "..CRcc..", "..PPpp..", ".PP..p..", ".PP..pp.", ".B...BB."],
 "zwalk": ["........", "...HHH..", "..HSSSS.", "..HSSSE.", "...SSss.", "...sSs..", "..CCcSSS", "..CRccSs",
           "..CCcc..", "..PPpp..", "..PP.pp.", ".PP...p.", ".B....B."],
 "zdead": ["..HHS.CCCPp..", ".HSSSCRCCPPpB", "..ss.cccc.ppB"],
 "dog": ["H......HH", "HH....HHE", ".HHHHHHH.", ".HhHHHHH.", ".H.H..H.H"],
 "deer": ["........W.W", ".........WW", "........HHE", "........HH.", ".HHHHHHHHH.", "HhHHHHHHHH.",
          ".HHHHHHHH..", ".H.H...H.H.", ".H.H...H.H."],
 "deerrun": ["........W.W", ".........WW", "........HHE", ".......HH..", ".HHHHHHHHH.", "HhHHHHHHHH.",
             ".HHHHHHHH..", "H.H.....H.H", "..........."],
 "rabbit": [".H.", ".HH", "HHH"], "chicken": [".R.", "HHH", "HH."], "crow": ["H.H", ".H."],
 "goat": ["W....HH", "HHHHHHE", "HhHHHH.", "H.H.H.."],
}

def ramp_cols(base):
    return base, dark(base), light(base)

def sprite(px, py, kind, cols, depth, flip=False, bubble=None, lift=0, white=False):
    t = T[kind]; h = len(t); w = len(t[0])
    if flip:
        t = [r[::-1] for r in t]
    ox, oy = round(px) - w // 2, round(py) - h + 1 - lift
    def f(d):
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
                    d.point((ox + i, oy + j), fill=(250, 248, 236) if white else cols.get(ch, INK))
        if bubble:
            bx, by = ox + w // 2, oy - 10
            d.rectangle([bx - 3, by, bx + 3, by + 6], fill=(250, 244, 226), outline=INK)
            d.point([(bx, by + 7), (bx - 1, by + 7)], fill=INK)
            if bubble == "!":
                d.line([(bx, by + 1), (bx, by + 3)], fill=(200, 60, 40)); d.point((bx, by + 5), fill=(200, 60, 40))
            elif bubble == "+":
                d.line([(bx, by + 1), (bx, by + 5)], fill=(60, 150, 90)); d.line([(bx - 2, by + 3), (bx + 2, by + 3)], fill=(60, 150, 90))
            else:
                d.point([(bx - 1, by + 1), (bx, by + 1), (bx + 1, by + 2), (bx, by + 3), (bx, by + 5)], fill=INK)
    S.add(depth, f)

SKIN = [(242, 200, 160), (222, 172, 128), (186, 132, 92), (140, 96, 66), (250, 214, 176)]
HAIR = [(60, 40, 32), (34, 28, 28), (120, 72, 40), (180, 140, 80), (90, 60, 40), (150, 60, 40)]
SHIRT = [(196, 84, 64), (70, 110, 150), (214, 180, 90), (110, 140, 90), (200, 150, 120), (150, 90, 120),
         (90, 120, 130), (230, 220, 200), (180, 110, 60), (120, 150, 170)]
PANTS = [(60, 66, 90), (90, 80, 64), (70, 76, 60), (52, 52, 60), (110, 92, 70)]
ROLE = {"guard": ((86, 98, 70), (78, 86, 62)), "farmer": ((214, 180, 90), None), "medic": ((236, 236, 240), None),
        "builder": ((232, 190, 60), None), "scav": ((100, 92, 80), None), "cook": ((240, 236, 226), None),
        "tech": ((90, 110, 140), None)}

def person(u, v, kind="front", role=None, flip=False, bubble=None, lift=0, depth_bias=0.3, tool=None,
           shirt=None, hair=None, white=False, pm=None):
    sh = shirt or (ROLE[role][0] if role in ROLE else rng.choice(SHIRT))
    hr = hair or (ROLE["guard"][1] if role == "guard" else rng.choice(HAIR))
    sk = rng.choice(SKIN); pa = rng.choice(PANTS)
    if role == "guard":
        pa = (70, 72, 60)
    cols = {"H": hr, "h": light(hr), "S": sk, "s": dark(sk), "E": INK, "C": sh, "c": dark(sh), "P": pa, "p": dark(pa),
            "B": (48, 40, 36), "G": (60, 60, 64), "W": (120, 90, 60), "A": (122, 100, 70), "a": (96, 78, 56),
            "X": (176, 136, 88), "x": (140, 104, 66)}
    if kind == "elder":
        cols["H"] = (214, 210, 200); cols["h"] = (236, 232, 224)
    if kind.startswith("z"):
        skz = rng.choice([(150, 162, 134), (138, 150, 128), (160, 160, 140)])
        clo = rng.choice([(96, 92, 96), (104, 96, 80), (84, 92, 100), (110, 84, 80)])
        cols = {"H": (70, 64, 56), "S": skz, "s": dark(skz), "E": (52, 36, 36), "C": clo, "c": dark(clo),
                "R": (72, 62, 60), "P": (70, 70, 74), "p": (54, 54, 60), "B": (50, 46, 44)}
        if kind != "zdead":
            S.threats += 1
    else:
        S.people += 1
    if pm is None:
        px, py = D(u, v)
    else:
        px, py = proj(*pm)
    mx, my = p2m(px, py)
    S.pos.append((px, py, kind.startswith("z")))
    if kind != "zdead":
        S.shadows.append([(px - 3, py), (px + 3, py), (px + 4, py + 1), (px - 2, py + 1)])
    sprite(px, py, kind, cols, mx + my + depth_bias, flip=flip, bubble=bubble, lift=lift, white=white)
    if tool:
        def tl(d, px=px, py=py, flip=flip, lift=lift):
            sx = -1 if flip else 1
            d.line([(px + 2 * sx, py - 6 - lift), (px + 6 * sx, py - lift)], fill=(120, 90, 60))
            d.line([(px + 5 * sx, py - lift), (px + 7 * sx, py - 1 - lift)], fill=(150, 150, 150))
        S.add(mx + my + depth_bias + 0.01, tl)
    return px, py - lift

def walker(u, v, **k):
    f = rng.random() < 0.5
    kind = rng.choice(["walk1", "walk2"])
    return person(u, v, kind=kind, flip=f, **k)

def animal(u, v, kind, col, flip=False):
    px, py = D(u, v); mx, my = p2m(px, py)
    cols = {"H": col, "h": light(col), "E": INK, "W": (110, 84, 60), "R": (200, 60, 50)}
    sprite(px, py, kind, cols, mx + my + 0.3, flip=flip)

# ------------------------------------------------------------------ trees
LEAF = {"oak": [(54, 92, 50), (76, 120, 58), (104, 148, 70)], "wild": [(46, 80, 48), (62, 100, 54), (86, 124, 62)],
        "pine": [(36, 70, 52), (48, 88, 60), (66, 108, 70)], "fruit": [(64, 110, 56), (88, 140, 64), (118, 164, 76)],
        "birch": [(92, 128, 60), (116, 150, 70), (150, 176, 90)]}

def tree(u, v, r=7, kind="wild", hgt=None, depth_bias=0.0, pm=None):
    px, py = D(u, v) if pm is None else proj(*pm)
    mx, my = p2m(px, py)
    hgt = hgt or r * 1.4
    S.shadows.append([(px - r * .6, py - 1), (px + r * 1.6, py - 1), (px + r * 1.9, py + r * .5), (px - r * .2, py + r * .6)])
    c0, c1, c2 = LEAF[kind]; seed = rng.random()
    def f(d):
        rr = random.Random(seed)
        if kind == "pine":
            d.rectangle([px - 1, py - 4, px + 1, py], fill=(92, 62, 44), outline=INK)
            for k in range(3):
                top = py - hgt - 6 + k * (hgt / 3.2); wdt = r * (.5 + k * .28)
                poly(d, [(px, top - 2), (px + wdt, top + hgt / 2.4), (px - wdt, top + hgt / 2.4)], c1 if k % 2 else c0)
            return
        d.rectangle([px - 1, py - hgt * .55, px + 1, py], fill=(230, 226, 214) if kind == "birch" else (96, 66, 46), outline=INK)
        cy = py - hgt
        blobs = [(0, 0, r)] + [(rr.uniform(-r * .7, r * .7), rr.uniform(-r * .4, r * .45), r * rr.uniform(.55, .8)) for _ in range(3)]
        for bx, by, br in blobs:
            d.ellipse([px + bx - br - 1, cy + by - br * .85 - 1, px + bx + br + 1, cy + by + br * .85 + 1], fill=INK)
        for bx, by, br in blobs:
            d.ellipse([px + bx - br, cy + by - br * .85, px + bx + br, cy + by + br * .85], fill=c0)
        for bx, by, br in blobs:
            d.ellipse([px + bx - br * .8 - 1, cy + by - br * .8, px + bx + br * .5, cy + by + br * .3], fill=c1)
        for _ in range(int(r * 1.5)):
            d.point((round(px + rr.uniform(-r * .7, r * .2)), round(cy + rr.uniform(-r * .7, 0))), fill=c2)
    S.add(mx + my + depth_bias, f)

# ------------------------------------------------------------------ props
def car(u, v, col, along="x", wreck=False):
    mx, my = d2m(u, v)
    L, Wd = (2.4, 1.2) if along == "x" else (1.2, 2.4)
    x, y = mx - L / 2, my - Wd / 2
    box(x, y, L, Wd, 4, shade(col, .8) if wreck else col, z=0 if wreck else .5)
    cab = (52, 48, 46) if wreck else (70, 80, 92)
    if along == "x":
        box(x + .6, y + .1, 1.1, Wd - .2, 3, cab, z=4)
    else:
        box(x + .1, y + .6, Wd - .2, 1.1, 3, cab, z=4)

def bus(u, v):
    mx, my = d2m(u, v)
    box(mx - 3.5, my - .8, 7, 1.6, 9, (176, 146, 70))
    def f(d):
        for i in range(6):
            window_on(d, mx - 3.5, my + .8, mx + 3.5, my + .8, .08 + i * .14, 4, w=.09, hgt=3, col=(46, 44, 46))
    S.add(mx + 3.5 + my + .8 + .01, f)

def point_prop(u, v, fn, bias=0.2):
    px, py = D(u, v); mx, my = p2m(px, py)
    S.add(mx + my + bias, lambda d: fn(d, px, py))

def hedgehog(u, v):
    def f(d, px, py):
        for a, b in (((-3, 0), (3, -5)), ((3, 0), (-3, -5)), ((0, 1), (0, -6))):
            d.line([(px + a[0], py + a[1]), (px + b[0], py + b[1])], fill=(70, 60, 58))
    point_prop(u, v, f)

def stump(u, v):
    point_prop(u, v, lambda d, px, py: d.ellipse([px - 2, py - 3, px + 2, py], fill=(170, 130, 90), outline=INK), 0)

def boulder(u, v, r=4):
    def f(d, px, py):
        poly(d, [(px - r * 1.4, py), (px - r, py - r), (px + r * .4, py - r * 1.3), (px + r * 1.4, py - r * .3), (px + r * 1.2, py)], (138, 132, 124))
        poly(d, [(px - r, py - r), (px + r * .4, py - r * 1.3), (px + r * .2, py - r * .5)], (160, 154, 144))
    point_prop(u, v, f)

def dust(u, v):
    def f(d, px, py):
        d.ellipse([px - 4, py - 2, px + 4, py + 1], fill=(120, 106, 92))
        d.point([(px - 2, py - 1), (px + 1, py - 2), (px + 3, py)], fill=(90, 80, 72))
    point_prop(u, v, f, -0.5)

def light_at(u, v, r, col, k, z=0):
    px, py = D(u, v); S.lights.append((px, py - z, r, col, k))

def fire(u, v, big=False, z=0):
    px, py = D(u, v); py -= z; mx, my = d2m(u, v)
    if not z:
        def ring(d):
            for a in range(0, 360, 45):
                d.point((px + round(5 * math.cos(math.radians(a))), py + round(2.5 * math.sin(math.radians(a)))), fill=(130, 124, 116))
        S.add(mx + my - .4, ring)
    def e(d):
        s = 1.6 if big else 1.0
        poly(d, [(px - 3 * s, py), (px - 2 * s, py - 4 * s), (px - .5 * s, py - 3 * s), (px, py - 8 * s),
                 (px + 1 * s, py - 4 * s), (px + 2.5 * s, py - 5 * s), (px + 3 * s, py)], (236, 112, 40), (170, 64, 28))
        poly(d, [(px - 1.5 * s, py), (px - .5 * s, py - 3 * s), (px + .5 * s, py - 5 * s), (px + 1.5 * s, py)], (255, 214, 104), (255, 190, 80))
    S.emissive.append(e); S.add(mx + my + .6, e)
    S.lights.append((px, py - 3, 46 if big else 22, (255, 150, 60), .9 if big else .6))

def drum_fire(u, v):
    mx, my = d2m(u, v)
    box(mx - .35, my - .35, .7, .7, 6, (110, 70, 52))
    fire(u, v, z=6)

def smoke(u, v, z=14):
    px, py = D(u, v)
    def f(d):
        for k in range(5):
            r = 2 + k
            d.ellipse([px + k * 2 - r, py - z - k * 6 - r, px + k * 2 + r, py - z - k * 6 + r * .8], fill=(170, 164, 160))
    mx, my = d2m(u, v); S.add(mx + my + 2, f)

def tracer(a, b):
    def e(d):
        d.line([a, b], fill=(255, 236, 170))
        d.ellipse([a[0] - 2, a[1] - 2, a[0] + 2, a[1] + 2], fill=(255, 220, 120))
        d.point([(b[0] + 1, b[1] - 1), (b[0] - 1, b[1] - 2), (b[0] + 2, b[1] + 1)], fill=(255, 250, 220))
    S.emissive.append(e); S.add(1e6, e)
    S.lights.append((a[0], a[1], 14, (255, 200, 120), .7))

# ------------------------------------------------------------------ wall & towers
PANEL = [(150, 92, 62), (140, 148, 152), (84, 112, 140), (162, 124, 84), (126, 84, 64), (118, 128, 128)]
GATE = (460, 500)
CUT = [(612, 628)]     # see-through cutaway where a threat presses on the wall (design u)
DAMAGED = (318, 330)   # breached panel being repaired (design u)

def build_wall():
    us = list(np.arange(40, 921, 4.5))
    pts = [(u, wall_v(u)) for u in us]
    for i in range(len(pts) - 1):
        (au, av), (bu, bv) = pts[i], pts[i + 1]
        mid = (au + bu) / 2
        if GATE[0] < mid < GATE[1]:
            continue
        ma, mb = d2m(au, av), d2m(bu, bv)
        if abs(mid - stream_u(wall_v(mid))) < 5:
            S.add(ma[0] + ma[1] + .6, lambda d, a=ma, b=mb: [d.line([P(*a, z), P(*b, z)], fill=(90, 90, 96)) for z in (2, 5, 8)])
            continue
        if DAMAGED[0] < mid < DAMAGED[1]:
            def br(d, a=ma, b=mb):    # gap braced with timber
                d.line([P(*a, 0), P(*b, 8)], fill=(150, 110, 70)); d.line([P(*a, 8), P(*b, 0)], fill=(150, 110, 70))
            S.add(ma[0] + ma[1] + .55, br)
            continue
        col = PANEL[(i * 7 + (i // 3)) % len(PANEL)]
        hgt = 9 + (i % 3 == 0)
        cut = any(c0 < mid < c1 for c0, c1 in CUT)
        def f(d, a=ma, b=mb, col=col, hgt=hgt, i=i, cut=cut):
            q = [P(a[0], a[1], 0), P(b[0], b[1], 0), P(b[0], b[1], hgt), P(a[0], a[1], hgt)]
            if cut:   # checker cutaway: draw only a lattice so the threat behind stays readable
                d.line([q[0], q[1]], fill=col); d.line([q[3], q[2]], fill=col)
                for t in (0, .5):
                    p0 = (q[0][0] + (q[1][0] - q[0][0]) * t, q[0][1] + (q[1][1] - q[0][1]) * t)
                    d.line([p0, (p0[0], p0[1] - hgt)], fill=col)
                return
            poly(d, q, col)
            for t in (.33, .66):
                p0 = (q[0][0] + (q[1][0] - q[0][0]) * t, q[0][1] + (q[1][1] - q[0][1]) * t)
                d.line([p0, (p0[0], p0[1] - hgt + 1)], fill=shade(col, .78))
            if i % 3 == 0:
                pa = P(a[0], a[1], 0)
                d.line([pa, (pa[0], pa[1] - 13)], fill=(96, 70, 50), width=2)
            t0, t1 = P(a[0], a[1], hgt + 2), P(b[0], b[1], hgt + 2)
            d.line([t0, ((t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2 - 2), t1], fill=(176, 176, 170))
            s0 = P(a[0] - .4, a[1] - .4, 2)
            d.line([s0, (s0[0] - 1, s0[1] - 4)], fill=(150, 120, 86))
        S.add(ma[0] + ma[1] + .55, f)
    ga, gb = d2m(GATE[0], wall_v(GATE[0])), d2m(GATE[1], wall_v(GATE[1]))
    def g(d):
        q = [P(*ga, 0), P(*gb, 0), P(*gb, 11), P(*ga, 11)]
        poly(d, q, (78, 82, 88))
        for k in range(1, 10):
            t = k / 10; p0 = (q[0][0] + (q[1][0] - q[0][0]) * t, q[0][1] + (q[1][1] - q[0][1]) * t)
            d.line([p0, (p0[0], p0[1] - 10)], fill=(104, 108, 112))
        d.line([q[0], q[2]], fill=(214, 176, 60)); d.line([q[1], q[3]], fill=(214, 176, 60))
        for p in (ga, gb):
            b0 = P(*p, 0); d.rectangle([b0[0] - 1, b0[1] - 22, b0[0] + 1, b0[1]], fill=(96, 70, 50), outline=INK)
        s0, s1 = P(*ga, 22), P(*gb, 22)
        poly(d, [s0, s1, (s1[0], s1[1] + 6), (s0[0], s0[1] + 6)], (178, 140, 92))
        f = font(7, True)
        d.text(((s0[0] + s1[0]) / 2 - 15, (s0[1] + s1[1]) / 2 - 1), "HOLDFAST", font=f, fill=(246, 240, 224))
    S.add(gb[0] + gb[1] + .56, g)
    light_at(480, wall_v(480), 30, (255, 190, 110), .55, z=20)

def tower(u, tall=26, rock=False, guards=1, aim=None, flipg=False, spot=None):
    v = wall_v(u) + (-6 if rock else 4)
    mx, my = d2m(u, v); s = 1.8
    x, y = mx - s / 2, my - s / 2; z0 = 0
    if rock:
        rk = random.Random(3); cx0, cy0 = P(mx, my, 0)
        blobs = [(rk.uniform(-26, 26), rk.uniform(-6, 8), rk.uniform(8, 13)) for _ in range(9)]
        def rockf(d):
            for bx, by, r in sorted(blobs, key=lambda t: t[1]):
                pts = [(cx0 + bx + r * 1.3 * math.cos(a), cy0 + by - r * .55 - r * .7 * math.sin(a)) for a in np.linspace(0, math.pi, 7)] + [(cx0 + bx - r * 1.3, cy0 + by)]
                poly(d, pts, (128, 122, 116)); poly(d, pts[:4] + [(cx0 + bx, cy0 + by - r * .4)], (150, 144, 136))
        S.add(mx + my - .4, rockf); z0 = 8
    for (a, b) in ((0, 0), (s - .3, 0), (0, s - .3), (s - .3, s - .3)):
        box(x + a, y + b, .3, .3, tall, (128, 94, 64), z=z0, shadow=False)
    add_shadow(x, y, s, s, tall + z0)
    box(x - .1, y - .1, s + .2, s + .2, 2, (150, 112, 76), z=z0 + tall, shadow=False)
    heads = []
    for k in range(guards):
        gx, gy = x + .5 + k * .8, y + .9
        kind = "aim" if (aim and k == 0) else "front"
        hp = person(0, 0, kind=kind, role="guard", flip=flipg, lift=z0 + tall + 2, depth_bias=0, pm=(gx, gy))
        dep, idx, fn = S.objs[-1]; S.objs[-1] = (x + s + y + s + .05, idx, fn)
        heads.append(hp)
    box(x - .1, y + s - .05, s + .2, .15, 4, (160, 120, 82), z=z0 + tall + 2, shadow=False)
    box(x + s - .05, y - .1, .15, s + .2, 4, (138, 102, 70), z=z0 + tall + 2, shadow=False)
    def r(d):   # open platform: only a back canopy pole + tarp so the guards stay readable
        a, b = P(x, y, z0 + tall + 2), P(x, y, z0 + tall + 16)
        d.line([a, b], fill=(110, 80, 56), width=1)
        poly(d, [b, P(x + s, y, z0 + tall + 16), P(x + s, y, z0 + tall + 12), P(x, y, z0 + tall + 12)], (150, 96, 70))
    S.add(x + y + 0.2, r)
    S.lights.append((*P(mx, my, z0 + tall + 8), 16, (255, 196, 120), .45))
    if spot:
        S.lights.append(("spot", P(mx, my, z0 + tall + 10), D(*spot[0]), spot[1]))
    return heads

# ------------------------------------------------------------------ world content (CURRENT era)
WALLC = [(226, 214, 180), (168, 186, 150), (164, 184, 200), (226, 224, 214), (226, 206, 140), (210, 170, 160), (200, 190, 170)]
ROOFC = [(96, 84, 82), (120, 72, 60), (70, 90, 84), (86, 96, 120), (110, 96, 80)]

def build_current():
    build_wall()
    # ---------------- towers (10) + gate
    heads = {}
    heads["main"] = tower(436, tall=30, rock=True, guards=2, aim=True, spot=((520, 176), 18))
    tower(524, tall=26, guards=1, spot=((560, 150), 16))
    for u, aimit in ((110, False), (190, True), (270, False), (360, True), (600, True), (690, False), (770, True), (850, False)):
        tower(u, tall=24, guards=1, aim=aimit, flipg=u < 480, spot=((u + (40 if u > 480 else -40), wall_v(u) - 40), 14) if u in (190, 360, 600, 770) else None)
    for u in (470, 490):
        person(u, wall_v(u) + 9, "front", role="guard")
    person(452, wall_v(452) + 12, "walk1", role="guard", flip=True)
    person(512, wall_v(512) + 13, "front", role="guard")
    # sniper takes down a lone infected in the cleared ground
    hx, hy = heads["main"][0]
    zpx, zpy = person(514, 182, "zwalk", flip=True, white=True)
    tracer((hx + 6, hy - 6), (zpx, zpy - 6))
    # wall-walk patrol (inner lane), staggered, both directions
    for u in np.arange(90, 880, 62):
        if GATE[0] - 20 < u < GATE[1] + 20:
            continue
        person(u + rng.uniform(-8, 8), wall_v(u) + 8 + rng.uniform(0, 3), rng.choice(["walk1", "walk2"]), role="guard", flip=rng.random() < .5)
    for u in (150, 410, 560, 820):
        drum_fire(u, wall_v(u) + 13)
    # ---------------- repair crew at the breached panel
    for (u, v, k, fl) in ((320, wall_v(320) + 7, "kneel", False), (328, wall_v(328) + 8, "kneel", True), (334, wall_v(334) + 14, "carry", True), (312, wall_v(312) + 12, "front", False)):
        person(u, v, k, role="builder", flip=fl)
    mx, my = d2m(326, wall_v(326) + 12); box(mx, my, 1.6, .5, 1, (140, 148, 152))   # replacement panel
    # ---------------- gate yard: scavenger team prepping, trucks, crates, armory
    car(548, 232, (120, 70, 56), along="y"); car(410, 236, (90, 104, 96), along="y")
    for (u, v) in ((426, 242), (432, 244), (420, 248), (540, 246)):
        mx, my = d2m(u, v); box(mx, my, .7, .7, 4, (166, 128, 84))
    for (u, v, fl) in ((446, 238, False), (456, 242, True), (466, 236, False)):
        person(u, v, "pack1", role="scav", flip=fl)
    mx, my = d2m(458, 254); box(mx, my, .3, .3, 18, (110, 80, 56)); box(mx - .5, my - .5, 1.3, 1.3, 2, (110, 80, 56), z=18)
    # ---------------- barracks + drill yard
    bx, by = house(360, 252, 6.0, 2.6, 12, (140, 132, 110), (90, 96, 82), ridge="x", wins=4)
    for (u, v) in ((344, 274), (358, 274)):
        person(u, v, "front", role="guard")
    person(356, 286, "walk1", role="guard", flip=True)
    mx, my = d2m(390, 270); box(mx, my, 1.4, .3, 5, (110, 80, 56))   # weapon rack
    # ---------------- market (trade) along the main street
    STALL = [(196, 84, 64), (70, 110, 150), (214, 180, 90), (110, 140, 90), (150, 90, 120), (200, 120, 70)]
    for i, (u, v) in enumerate(((436, 258), (436, 276), (520, 258), (520, 276), (446, 292), (510, 292))):
        awning_stall(u, v, STALL[i])
    for _ in range(8):
        u = rng.uniform(440, 520); v = rng.uniform(254, 300)
        if abs(u - 480) < 4:
            continue
        person(u, v, rng.choice(["front", "walk1", "walk2", "carry"]), flip=rng.random() < .5)
    # ---------------- infirmary + triage tent
    ix, iy = house(588, 246, 3.8, 2.6, 13, (236, 234, 226), (120, 128, 130), ridge="x", wins=2)
    def cross(d, ix=ix, iy=iy):
        c = face_pt(ix, iy + 2.6, ix + 3.8, iy + 2.6, .62, 7)
        d.rectangle([c[0] - 4, c[1] - 4, c[0] + 4, c[1] + 4], fill=(246, 244, 236), outline=INK)
        d.rectangle([c[0] - 1, c[1] - 3, c[0] + 1, c[1] + 3], fill=(70, 150, 90)); d.rectangle([c[0] - 3, c[1] - 1, c[0] + 3, c[1] + 1], fill=(70, 150, 90))
    S.add(ix + 3.8 + iy + 2.6 + .02, cross)
    tx, ty = d2m(566, 262)
    def tent(d, tx=tx, ty=ty, c=(220, 216, 200)):
        poly(d, [P(tx, ty + 1.8, 0), P(tx + 2.4, ty + 1.8, 0), P(tx + 1.2, ty + 1.8, 9)], shade(c, .9))
        poly(d, [P(tx + 2.4, ty, 0), P(tx + 2.4, ty + 1.8, 0), P(tx + 1.2, ty + 1.8, 9), P(tx + 1.2, ty, 9)], shade(c, .72))
    S.add(tx + 2.4 + ty + 1.8, tent)
    person(570, 270, "kneel", role="medic"); person(578, 272, "sit", bubble="+"); person(596, 266, "walk1", role="medic", flip=True)
    # ---------------- workshop / motor pool
    mx, my = d2m(640, 286)
    box(mx - 3, my - 2, 6, 4, 15, (150, 156, 160), (140, 146, 150), (112, 118, 122))
    def door(d, mx=mx, my=my):
        a = face_pt(mx - 3, my + 2, mx + 3, my + 2, .18, 0); b = face_pt(mx - 3, my + 2, mx + 3, my + 2, .62, 0)
        poly(d, [a, b, (b[0], b[1] - 10), (a[0], a[1] - 10)], (96, 100, 104))
        S.lights.append(((a[0] + b[0]) / 2, a[1] - 4, 22, (255, 190, 110), .5))
    S.add(mx + 3 + my + 2 + .02, door)
    car(618, 300, (70, 96, 130), along="x")
    for (u, v, k, fl) in ((612, 304, "kneel", False), (628, 306, "front", False), (606, 296, "walk1", True), (650, 304, "carry", False)):
        person(u, v, k, role="tech", flip=fl)
    smoke(640, 286, 22)
    # ---------------- church (shelter) + school + town hall
    cx, cy = house(362, 318, 3.4, 5.0, 18, (232, 228, 214), (96, 88, 92), ridge="y", wins=3, door=False)
    box(cx + 1.0, cy + 5.0, 1.4, 1.4, 30, (232, 228, 214)); pyramid(cx + .9, cy + 4.9, 1.6, 30, 12, (96, 88, 92))
    house(616, 332, 4.4, 3.0, 12, (204, 120, 96), (90, 80, 78), ridge="x", wins=3)
    for (u, v) in ((604, 354), (616, 352), (628, 356)):
        person(u, v, "sit" if rng.random() < .6 else "kid")
    person(590, 348, "front", shirt=(170, 50, 50))     # teacher
    # ---------------- green, great oak, commons, kitchen
    tree(GREEN[0], GREEN[1] - 4, r=24, kind="oak", hgt=40, depth_bias=-1.2)
    fire(480, 356, big=True)
    for (u, v) in ((452, 366), (508, 366), (452, 378), (508, 378)):
        mx, my = d2m(u, v); box(mx - 1.2, my - .3, 2.4, .6, 3, (150, 108, 72))
    for _ in range(9):
        u = rng.choice([rng.uniform(440, 466), rng.uniform(494, 520)]); v = rng.uniform(360, 384)
        person(u, v, rng.choice(["sit", "sit", "front", "elder"]))
    for _ in range(4):
        walker(rng.uniform(430, 530), rng.uniform(312, 352))
    mx, my = d2m(556, 356); box(mx - 2, my - 1.4, 4, 2.8, 10, (200, 196, 180), (190, 186, 170), (150, 146, 136))
    smoke(556, 352, 16); fire(546, 372)
    for (u, v, k) in ((546, 368, "front"), (560, 370, "carry"), (570, 366, "front")):
        person(u, v, k, role="cook")
    poles = [(420, 324), (540, 324), (540, 380), (420, 380)]
    for (u, v) in poles:
        mx, my = d2m(u, v); box(mx, my, .2, .2, 16, (96, 70, 50), shadow=False)
    def bulbs(d):
        for i in range(4):
            a0, a1 = D(*poles[i]), D(*poles[(i + 1) % 4])
            for t in np.linspace(0, 1, 18):
                sag = math.sin(t * math.pi) * 5
                d.point((round(a0[0] + (a1[0] - a0[0]) * t), round(a0[1] + (a1[1] - a0[1]) * t - 16 + sag)), fill=(255, 226, 150))
    S.emissive.append(bulbs)
    for (u, v) in poles:
        light_at(u, v, 14, (255, 210, 140), .25, z=14)
    # ---------------- playground
    mx, my = d2m(410, 362)
    def swing(d, mx=mx, my=my):
        a, b = P(mx, my, 0), P(mx + 2, my, 0)
        for p in (a, b):
            d.line([p, (p[0], p[1] - 12)], fill=(176, 70, 60))
        d.line([(a[0], a[1] - 12), (b[0], b[1] - 12)], fill=(176, 70, 60))
    S.add(mx + 2 + my + .1, swing)
    for (u, v) in ((404, 372), (418, 370), (428, 378), (398, 380), (434, 366)):
        person(u, v, rng.choice(["kid", "kidrun"]), flip=rng.random() < .5)
    animal(440, 376, "dog", (170, 120, 70))
    # ---------------- residential grid
    cells = []
    for gx in range(0, MAPN, 6):
        for gy in range(0, MAPN, 5):
            x, y = gx + 1.2, gy + 1.0
            w, dd = rng.choice([(3.6, 2.8), (3.4, 3.0), (4.0, 2.6), (3.0, 3.0)])
            corners = [m2d(x, y), m2d(x + w, y), m2d(x, y + dd), m2d(x + w, y + dd), m2d(x + w + 1, y + dd + 1)]
            ok = all(zone_at(a, b)["settle"] and not zone_at(a, b)["fields"] and not reserved(np.array([a]), np.array([b]))[0] for a, b in corners)
            if ok:
                cells.append((x, y, w, dd))
    for (x, y, w, dd) in cells:
        h = rng.choice([17, 17, 16, 11])
        house_m(x, y, w, dd, h, rng.choice(WALLC), rng.choice(ROOFC), ridge=rng.choice("xy"), boarded=rng.random() < .3,
                solar=rng.random() < .3, wins=2)
        box(x + w + .3, y + .2, .9, 1.6, 2, (118, 150, 64), (120, 86, 58), (100, 72, 50))      # garden bed
        box(x + w + .1, y + dd - .6, .5, .5, 4, (80, 110, 140))                                  # rain barrel
        fy = y + dd + .55
        def fence(d, x=x, fy=fy, w=w):
            for k in np.arange(0, w + 1.01, .5):
                p = P(x - .5 + k, fy, 0); d.line([p, (p[0], p[1] - 3)], fill=(236, 230, 214))
            d.line([P(x - .5, fy, 2), P(x + w + .5, fy, 2)], fill=(236, 230, 214))
        if rng.random() < .55:
            S.add(x + w + fy + .1, fence)
        u0, v0 = m2d(x + w / 2, y + dd + .3)
        roll = rng.random()
        if roll < .13:
            person(0, 0, "elder" if rng.random() < .4 else "sit", pm=(x + .7, y + dd + .25))
        elif roll < .2:
            person(0, 0, rng.choice(["kid", "kidrun"]), pm=(x + w + .6, y + dd + .1), flip=rng.random() < .5)
        if rng.random() < .25:
            def laundry(d, x=x, y=y, w=w):
                a, b = P(x + w + .4, y - .2, 10), P(x + w + .4, y + 2.4, 10)
                d.line([a, b], fill=(220, 220, 210))
                for t, c in zip((.2, .45, .7), rng.sample(SHIRT, 3)):
                    xx = a[0] + (b[0] - a[0]) * t; yy = a[1] + (b[1] - a[1]) * t
                    d.rectangle([xx - 2, yy, xx + 2, yy + 5], fill=c, outline=INK)
            S.add(x + w + y + 2.6, laundry)
    # street walkers on the grid lines (unsynchronised: random facing / frame / load)
    for _ in range(16):
        gx = rng.randrange(0, MAPN, 6); gy = rng.uniform(0, MAPN)
        if rng.random() < .5:
            pm = (gx + .5, gy)
        else:
            pm = (rng.uniform(0, MAPN), rng.randrange(0, MAPN, 5) + .45)
        u, v = m2d(*pm)
        z = zone_at(u, v)
        if z["settle"] and not z["fields"] and not reserved(np.array([u]), np.array([v]))[0]:
            person(0, 0, rng.choice(["walk1", "walk2", "carry", "walk1"]), pm=pm, flip=rng.random() < .5)
    # main street traffic: carriers between gate, market, kitchen, fields
    for v in np.arange(304, 520, 24):
        person(480 + rng.uniform(-5, 5), v + rng.uniform(-3, 3), rng.choice(["walk1", "walk2", "carry"]), flip=rng.random() < .5)
    # ---------------- utilities & animals
    mx, my = d2m(296, 386); box(mx - 2.2, my - 1.6, 4.4, 3.2, 14, (150, 70, 56), (140, 64, 52), (110, 50, 44))  # barn
    pyramid(mx - 2.4, my - 1.8, 4.8, 14, 8, (110, 80, 70))
    for (u, v) in ((692, 404), (730, 410), (716, 432)):
        mx, my = d2m(u, v); box(mx - 1.6, my - 1, 3.2, 2, 8, (196, 226, 222), (176, 212, 208), (150, 190, 188))
    mx, my = d2m(232, 430)
    for (a, b) in ((0, 0), (1.2, 0), (0, 1.2), (1.2, 1.2)):
        box(mx + a, my + b, .2, .2, 20, (110, 80, 56), shadow=False)
    box(mx - .2, my - .2, 1.8, 1.8, 10, (150, 112, 78), z=20)
    for (u, v) in ((818, 420), (842, 360)):
        mx, my = d2m(u, v); box(mx, my, .25, .25, 34, (200, 200, 196), shadow=False)
        S.add(mx + my + .6, lambda d, mx=mx, my=my: [d.line([P(mx + .12, my + .12, 34), (P(mx + .12, my + .12, 34)[0] + 9 * math.cos(math.radians(a)), P(mx + .12, my + .12, 34)[1] + 9 * math.sin(math.radians(a)))], fill=(230, 230, 226)) for a in (20, 140, 260)])
    mx, my = d2m(196, 352); box(mx, my, 2, 1.6, 7, (160, 110, 74))
    for (u, v) in ((210, 366), (216, 362), (204, 370), (222, 370)):
        animal(u, v, "chicken", (236, 232, 220))
    for (u, v) in ((250, 380), (262, 384)):
        animal(u, v, "goat", (226, 220, 206), flip=u > 255)
    for (u, v) in ((770, 330), (782, 336), (776, 342)):
        mx, my = d2m(u, v); box(mx, my, .6, .6, 4, (220, 190, 90))          # beehives
    # memorial stones with candles (deaths are remembered)
    for k, (u, v) in enumerate(((300, 340), (306, 344), (312, 340), (296, 346))):
        mx, my = d2m(u, v); box(mx, my, .5, .3, 5, (150, 146, 140))
    for (u, v) in ((302, 348), (310, 346)):
        fire(u, v)
    person(318, 350, "front", shirt=(60, 60, 80))
    # ---------------- fields: farmers (different crops), carriers, scarecrow
    for _ in range(15):
        u = rng.uniform(160, 800); v = rng.uniform(400, 500)
        if zone_at(u, v)["fields"]:
            person(u, v, rng.choice(["walk1", "kneel", "walk2"]), role="farmer", flip=rng.random() < .5, tool=rng.random() < .6)
    for _ in range(4):
        u = rng.uniform(300, 660); v = rng.uniform(400, 470)
        if zone_at(u, v)["fields"]:
            person(u, v, "carry", flip=rng.random() < .5)
    # ---------------- docks, fishers, smokehouse
    for (du, dv) in ((480, 500), (226, 470), (740, 470)):
        mx, my = d2m(du, dv); box(mx - .5, my - .5, 1.6, 4.2, 2, (160, 120, 82), z=1)
        person(0, 0, "sit", pm=(mx + .2, my + 2.6), depth_bias=1); person(0, 0, "front", pm=(mx + .9, my + 1.2), depth_bias=1)
        S.add(mx + my + 6, lambda d, mx=mx, my=my: d.line([P(mx + .2, my + 2.6, 8), (P(mx + .2, my + 2.6, 8)[0] + 10, P(mx + .2, my + 2.6, 8)[1] - 6), (P(mx + .2, my + 2.6, 8)[0] + 13, P(mx + .2, my + 2.6, 8)[1] + 10)], fill=(200, 190, 160)))
    mx, my = d2m(520, 492); box(mx, my, 1.6, 1.4, 8, (120, 90, 64)); smoke(520, 490, 10)
    # fruit trees / bank trees inside
    for _ in range(40):
        u = rng.uniform(80, 880); v = rng.uniform(230, 480)
        z = zone_at(u, v)
        if z["settle"] and not z["fields"] and (z["d"] > .86 or rng.random() < .3) and not reserved(np.array([u]), np.array([v]))[0]:
            tree(u, v, r=rng.uniform(5, 7), kind=rng.choice(["fruit", "fruit", "birch"]))

    # ================= OUTSIDE =================
    for u in np.arange(70, 900, 22):
        wv = wall_v(u)
        hedgehog(u + rng.uniform(-6, 6), wv - 22 + rng.uniform(-3, 3))
        a, b = u + rng.uniform(-10, 10), wv - rng.uniform(8, CLEAR - 4)
        if zone_at(a, b)["cleared"] and abs(a - road_u(b)) > 12:
            stump(a, b)
    car(398, 190, (96, 110, 120), along="y", wreck=True); car(586, 172, (120, 66, 52), along="x", wreck=True)
    # corpses from earlier shots (temporary), dust stains
    for (u, v) in ((420, 184), (556, 192), (300, 200), (690, 196)):
        person(u, v, "zdead"); dust(u + 3, v + 1)
    # threats in / near the cleared ground
    person(300, 172, "zwalk", bubble="?")
    for (u, v) in ((618, 210), (624, 206), (630, 212)):          # pressing on the weak culvert section (cutaway)
        person(u, v, "zwalk", flip=True)
    for (u, v) in ((262, 156), (272, 152), (280, 160), (268, 164), (288, 150)):   # a group gathering on the west trail
        person(u, v, rng.choice(["zwalk", "zfront"]), flip=rng.random() < .3)
    # zombies chasing deer across the grassland
    animal(420, 128, "deerrun", (170, 120, 76), flip=True); animal(406, 134, "deerrun", (160, 112, 70), flip=True)
    person(446, 132, "zwalk", flip=True); person(456, 138, "zwalk", flip=True)
    # scavengers in trouble at the abandoned houses: retreating while shooting
    house(372, 108, 3.6, 2.8, 15, (196, 186, 166), (96, 84, 82), ridge="x", boarded=1, wins=2)
    house(332, 118, 3.2, 2.8, 11, (176, 168, 150), (110, 96, 80), ridge="y", boarded=1, wins=1)
    for (u, v) in ((394, 120), (402, 116)):
        person(u, v, "zfront")
    sx, sy = person(420, 124, "aim", role="scav", flip=True, bubble="!")
    tracer((sx - 9, sy - 7), D(400, 112))
    person(430, 128, "pack1", role="scav"); person(440, 132, "walk1", role="scav")
    # gas station beside the road + lone wanderers
    gx, gy = d2m(560, 110)
    for (a, b) in ((0, 0), (4.2, 0), (0, 2.6), (4.2, 2.6)):
        box(gx + a, gy + b, .3, .3, 13, (190, 190, 186), shadow=False)
    box(gx - .3, gy - .3, 5, 3.3, 2, (210, 206, 196), (170, 70, 60), (140, 56, 50), z=13)
    box(gx + 1, gy + 1, .6, .4, 4, (170, 70, 60)); box(gx + 2.6, gy + 1, .6, .4, 4, (170, 70, 60))
    mx, my = d2m(600, 96); box(mx, my, 4, 3, 11, (196, 186, 166))
    person(590, 130, "zfront"); person(676, 120, "zwalk", flip=True); person(706, 150, "zwalk")
    for (u, v) in ((646, 164), (652, 160)):
        animal(u, v, "crow", (40, 36, 40))
    bus(road_u(70) + 8, 70); car(road_u(30) - 6, 30, (180, 180, 176), along="x", wreck=True)
    for v in np.arange(-260, 190, 34):
        mx, my = d2m(road_u(v) + 16, v); box(mx, my, .18, .18, 22, (100, 76, 56), shadow=False)
    # rocky outcrops, hunting meadow herd, collapsed house, farmstead, radio hill, town ruins
    for _ in range(14):
        boulder(rng.gauss(690, 30), rng.gauss(30, 14), rng.uniform(3, 6))
    for _ in range(6):
        boulder(rng.gauss(250, 18), rng.gauss(140, 6), rng.uniform(2, 4))
    for k in range(6):
        animal(330 + k * 9 + rng.uniform(-4, 4), 30 + rng.uniform(-8, 8), "deer", (170, 120, 76), flip=rng.random() < .5)
    mx, my = d2m(780, 96)
    box(mx, my, 3.6, .4, 14, (200, 190, 170)); box(mx, my, .4, 3, 9, (190, 180, 160))
    S.add(mx + 4 + my + 3.4, lambda d, mx=mx, my=my: poly(d, [P(mx + .4, my + .4, 14), P(mx + 3.6, my + .4, 14), P(mx + 3.8, my + 3.2, 2), P(mx + .4, my + 3.2, 5)], (96, 84, 82)))
    mx, my = d2m(300, -10); box(mx, my, 4, 3, 14, (170, 96, 76)); pyramid(mx - .2, my - .2, 3.4, 14, 10, (110, 80, 70))
    mx, my = d2m(700, -20); box(mx, my, .3, .3, 70, (176, 74, 64), shadow=False); box(mx - 1, my + 1.4, 2, 1.6, 8, (180, 180, 176))
    for (a, b, w, d_, h) in ((470, -80, 4, 3, 26), (530, -66, 3, 3, 20), (440, -50, 3, 4, 14), (556, -96, 4, 3, 32),
                              (500, -110, 3, 3, 18), (590, -60, 3, 2, 12), (410, -70, 3, 3, 16)):
        mx, my = d2m(a, b); box(mx, my, w, d_, h, (176, 168, 156))
        def rw(d, mx=mx, my=my, w=w, d_=d_, h=h):
            for zz in range(3, h - 3, 6):
                for k in range(int(w)):
                    window_on(d, mx, my + d_, mx + w, my + d_, .1 + k / w, zz, w=.14, hgt=3, col=(54, 52, 58))
        S.add(mx + w + my + d_ + .02, rw)
    for _ in range(18):
        person(rng.uniform(430, 600), rng.uniform(-40, -20), rng.choice(["zfront", "zwalk"]), flip=rng.random() < .5)
    # riverbank stragglers (threats following the bank)
    for (u, v) in ((84, 150), (90, 120), (876, 170)):
        person(u, v, "zwalk", flip=u > 480)
    # far-wild wanderers
    for _ in range(34):
        a, b = rng.uniform(-300, 1300), rng.uniform(-260, 150)
        z = zone_at(a, b); mx, my = d2m(a, b)
        if not z["river"] and not z["inside"] or (z["wild"] and b < 80):
            if 2 < mx < MAPN - 2 and 2 < my < MAPN - 2:
                person(a, b, rng.choice(["zfront", "zwalk"]), flip=rng.random() < .5)
    for _ in range(12):
        a, b = rng.uniform(-300, 1300), rng.uniform(100, 700)
        z = zone_at(a, b); mx, my = d2m(a, b)
        if (z["farbank"] or (z["wild"] and not z["inside"])) and 2 < mx < MAPN - 2 and 2 < my < MAPN - 2:
            animal(a, b, "deer", (170, 120, 76), flip=rng.random() < .5)
    # ---------------- woods: clustered, not solid
    pts = []
    for _ in range(30000):
        a, b = rng.uniform(-560, 1520), rng.uniform(-300, 800)
        mx, my = d2m(a, b)
        if not (0.5 < mx < MAPN - .5 and 0.5 < my < MAPN - .5):
            continue
        z = zone_at(a, b)
        if z["river"] or z["bank"] or z["settle"] or z["cleared"]:
            continue
        if abs(a - road_u(b)) < 18 or (abs(a - trail_l(b)) < 7 or abs(a - trail_r(b)) < 7) and b < 212:
            continue
        pois = ((560, 110, 60), (372, 112, 70), (780, 96, 40), (500, -70, 120), (300, -10, 40), (700, -20, 30),
                (690, 30, 70), (330, 30, 60), (420, 130, 40))
        if any((a - p) ** 2 + ((b - q) * 2) ** 2 < r * r for p, q, r in pois):
            continue
        px, py = D(a, b)
        wn = WOOD_N[int(min(H - 1, max(0, py))), int(min(W - 1, max(0, px)))]
        edge_far = (not z["inside"]) and b < 300
        if z["farbank"]:
            dens = .22
        elif wn > .56:
            dens = .95
        elif edge_far:
            dens = .35
        else:
            dens = .05
        if rng.random() > dens:
            continue
        if any((a - p) ** 2 + ((b - q) * 1.6) ** 2 < 120 for p, q in pts[-80:]):
            continue
        pts.append((a, b))
        tree(a, b, r=rng.uniform(5.5, 8.5), kind=rng.choice(["pine", "wild", "wild", "birch"]) if not z["farbank"] else "oak")

# ------------------------------------------------------------------ render
def font(sz, bold=True):
    for f in ("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/consolab.ttf"):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()

def render(mode):
    global S
    S = Scene(); rng.seed(11)
    g, Z, void = ground()
    build_current()
    base = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8))
    sh = Image.new("L", (W, H), 0); sd = ImageDraw.Draw(sh)
    for p in S.shadows:
        sd.polygon([(round(a), round(b)) for a, b in p], fill=255)
    gnp = np.asarray(base, np.float32) * (1 - .28 * ((np.asarray(sh, np.float32) / 255.0) * ~void)[..., None])
    base = Image.fromarray(gnp.astype(np.uint8)); d = ImageDraw.Draw(base)
    for depth, idx, fn in sorted(S.objs, key=lambda t: (t[0], t[1])):
        fn(d)
    arr = np.asarray(base, np.float32)
    py, px = np.mgrid[0:H, 0:W].astype(np.float32)
    u = (px - CX) / G + 480; v = (py - CY0) / G + 300
    inside_w = (1 / (1 + np.exp(-(v - wall_v(u) - 4) / 8))) * Z["inside"].astype(np.float32)
    inside_w = np.asarray(Image.fromarray((inside_w * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), np.float32) / 255
    fog = np.clip((40 - v) / 360, 0, 1)
    if mode == "day":
        arr = arr * np.array((1.03, 1.0, .95)) * (1 - .06 * (1 - inside_w[..., None]))
        arr = arr * (1 - fog[..., None] * .5) + np.array((150, 170, 190)) * fog[..., None] * .5
        return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    warm = np.array((1.0, .80, .64)) * .92; cool = np.array((.66, .68, .88)) * .74
    arr = arr * (cool + (warm - cool) * inside_w[..., None])
    arr = arr * (1 - fog[..., None] * .6) + np.array((96, 74, 104)) * fog[..., None] * .6
    L = np.zeros((H, W, 3), np.float32)
    spot = Image.new("L", (W, H), 0); spd = ImageDraw.Draw(spot)
    for li in S.lights:
        if li[0] == "spot":
            (sx, sy), (tx, ty), half = li[1], li[2], li[3]
            ang = math.atan2(ty - sy, tx - sx); nx, ny = -math.sin(ang), math.cos(ang)
            spd.polygon([(sx, sy), (tx + nx * half * 2, ty + ny * half), (tx - nx * half * 2, ty - ny * half)], fill=34)
            spd.ellipse([tx - half * 2, ty - half, tx + half * 2, ty + half], fill=70)
            continue
        lx, ly, r, col, k = li
        x0, x1 = int(max(0, lx - r * 2)), int(min(W, lx + r * 2)); y0, y1 = int(max(0, ly - r)), int(min(H, ly + r))
        if x0 >= x1 or y0 >= y1:
            continue
        yy, xx = np.mgrid[y0:y1, x0:x1]
        f = np.exp(-(((xx - lx) / r) ** 2 + ((yy - ly) / (r * .55)) ** 2) * 2.2) * k
        L[y0:y1, x0:x1] += f[..., None] * np.array(col, np.float32)
    spot = np.asarray(spot.filter(ImageFilter.GaussianBlur(4)), np.float32)[..., None] / 255
    arr = arr + L * .55 + arr * L / 255 * .9 + spot * np.array((200, 214, 230)) * .55
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)); dd = ImageDraw.Draw(img)
    for e in S.emissive:
        e(dd)
    return img

def tag(d, x, y, text, sz=13, fg=(250, 244, 226), bg=(59, 42, 38)):
    f = font(sz); w = d.textlength(text, font=f)
    d.rounded_rectangle([x - 5, y - 3, x + w + 5, y + sz + 4], 4, fill=bg)
    d.text((x, y - 1), text, font=f, fill=fg)

def annotate(img, stats):
    d = ImageDraw.Draw(img)
    def frame(cx, cy, w, h, col, label, ly=6):
        x0, y0 = cx - w / 2, cy - h / 2
        for k in range(0, int(w), 8):
            d.line([(x0 + k, y0), (x0 + min(w, k + 4), y0)], fill=col, width=2); d.line([(x0 + k, y0 + h), (x0 + min(w, k + 4), y0 + h)], fill=col, width=2)
        for k in range(0, int(h), 8):
            d.line([(x0, y0 + k), (x0, y0 + min(h, k + 4))], fill=col, width=2); d.line([(x0 + w, y0 + k), (x0 + w, y0 + min(h, k + 4))], fill=col, width=2)
        tag(d, x0 + 4, y0 + ly, label, 12, (20, 20, 24), col)
    frame(CAM[0], CAM[1], 960, 540, (150, 220, 255), "zoom out 2x (1080p): 960x540 art px", 6)
    frame(CAM[0], CAM[1], 640, 360, (255, 214, 120), "DEFAULT 1080p @3x = 640x360 art px  (1440p @4x: same framing)", 6)
    frame(CAM[0], CAM[1] + 20, 234, 506, (255, 150, 190), "iPhone portrait @5 device px/art px", 26)
    T_ = lambda u, v, t, sz=15, fg=(250, 244, 226), bg=(59, 42, 38): tag(d, *D(u, v), t, sz, fg, bg)
    T_(-300, 60, "THREAT WILDERNESS — groves, meadows, trails, ruins", 15)
    T_(-300, 186, "FRONTIER — cleared kill-zone + wall (10 towers)", 15)
    T_(-300, 330, "SETTLEMENT — gridded town of %d homes, %d residents" % (stats["houses_town"], stats["people"]), 15)
    pois = [((560, 92), "gas station"), ((372, 88), "abandoned houses (scavengers)"), ((780, 76), "collapsed house"),
            ((500, -130), "old town ruins: horde gathers"), ((300, -40), "farmstead"), ((700, -90), "radio hill"),
            ((690, 0), "rocky ground"), ((330, 6), "hunting meadow (deer herd)")]
    for (a, b), t in pois:
        T_(a + 6, b - 8, "POI · " + t, 12, (30, 26, 24), (240, 226, 190))
    notes = [((436, 196), "main tower on the outcrop"), ((486, 226), "gate yard"), ((486, 270), "market"),
             ((360, 236), "barracks"), ((592, 232), "infirmary"), ((640, 300), "workshop"),
             ((486, 314), "great oak + commons"), ((300, 352), "memorial"), ((250, 470), "fields"), ((480, 516), "dock"),
             ((624, 196), "weak point: creek culvert")]
    for (a, b), t in notes:
        T_(a, b, t, 11, (250, 244, 226), (70, 50, 44))
    # threat approach routes (red) and scavenger routes (yellow)
    def route(pts, col, dash=True):
        for (a, b), (c, e) in zip(pts, pts[1:]):
            p0, p1 = D(a, b), D(c, e); n = max(1, int(math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 8))
            for k in range(n):
                if k % 2 == 0 or not dash:
                    t0, t1 = k / n, (k + 1) / n
                    d.line([(p0[0] + (p1[0] - p0[0]) * t0, p0[1] + (p1[1] - p0[1]) * t0), (p0[0] + (p1[0] - p0[0]) * t1, p0[1] + (p1[1] - p0[1]) * t1)], fill=col, width=3)
    RED = (235, 90, 80)
    route([(500, -60), (road_u(0), 0), (road_u(120), 120), (480, 205)], RED)                       # R1 main road
    route([(300, -10), (trail_l(40), 40), (trail_l(140), 140), (300, 205)], RED)                    # R2 west trail
    route([(700, -20), (trail_r(60), 60), (trail_r(160), 160), (650, 214)], RED)                   # R3 east trail -> culvert
    route([(river_side(120, -1) + 40, 120), (river_side(200, -1) + 40, 200), (80, 262)], RED)     # R4 west bank
    route([(river_side(120, 1) - 40, 120), (river_side(200, 1) - 40, 200), (880, 262)], RED)      # R5 east bank
    route([(-60, 420), (60, 470), (200, 470)], (120, 160, 230))                                   # R6 river (rare)
    YEL = (255, 232, 140)
    for r in ([(480, 212), (470, 150), (372, 112)], [(480, 212), (road_u(110), 110), (560, 110)],
              [(480, 200), (trail_r(120), 120), (780, 96)], [(480, 200), (road_u(0), 0), (500, -60)], [(480, 200), (trail_l(60), 60), (300, -10)]):
        route(r, YEL)
    tag(d, 1760, 120, "— — threat approach routes R1–R5", 12, (20, 20, 24), RED)
    tag(d, 1760, 142, "— — rare river route R6", 12, (20, 20, 24), (120, 160, 230))
    tag(d, 1760, 164, "— — scavenger routes", 12, (20, 20, 24), YEL)
    tag(d, 24, 20, "HOLDFAST v0.3 — World Overview (Current era, day) · 144x144 tiles · 16x8 px · map shown at 1x", 18)
    tag(d, 24, 50, "In this render: %d settlers (+%d threats). Residents visible in the default frame: %d." % (stats["people"], stats["threats"], stats["in_view"]), 13)
    return img

def count_in_view():
    # rough count of human sprites inside the default frame
    return None

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    dusk = render("dusk")
    st = {"people": S.people, "threats": S.threats, "houses_town": S.houses}
    inv = [(x, y, z) for x, y, z in S.pos if VX0 <= x < VX0 + VW and VY0 <= y < VY0 + VH]
    IN_VIEW = sum(1 for x in inv if not x[2]); st["threats_in_view"] = sum(1 for x in inv if x[2])
    dusk.crop((VX0, VY0, VX0 + VW, VY0 + VH)).resize((VW * 3, VH * 3), Image.NEAREST).save(os.path.join(OUT, "02-current-era-dusk.png"))
    day = render("day")
    st["in_view"] = IN_VIEW
    annotate(day, st).save(os.path.join(OUT, "01-world-overview.png"))
    print(st)
