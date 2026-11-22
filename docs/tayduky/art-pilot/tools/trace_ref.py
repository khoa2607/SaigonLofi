"""Trace the owner's top-down reference (references/tayduky/ref/topdown character.png) onto a clean native pixel grid.

The reference is an upscaled, blurred pixel image whose cells are about 6.6-7.0 source px and not perfectly regular. For each character:
  1. search the cell pitch and phase that make cells most uniform;
  2. sample every cell with a robust median of its central area (ignores the blurred cell borders);
  3. map all four characters to one shared palette (median cut), so ramps stay consistent;
  4. remove the opaque grey ground shadow by flooding from the transparent background through shadow-grey cells only
     (the dark outline stops the flood, so the white horse is kept);
  5. clean stray pixels. Output: out/trace-*.png, src/<name>.json (editable grid), out/step1b-traced.png (reference vs traced).
Run: python trace_ref.py
"""
import os, sys, json
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))

HERE = os.path.dirname(os.path.abspath(__file__))
OUTD = os.path.join(HERE, '..', 'out'); SRCD = os.path.join(HERE, '..', 'src')
REF = r'E:\game\web-lofi\references\tayduky\ref\topdown character.png'
NAMES = ['wukong', 'tamtang', 'bajie', 'shaseng']
PITCH = 6.6          # one cell size for all four, so they share one pixel density

img = Image.open(REF).convert('RGBA'); A = np.asarray(img).astype(float)
alpha = A[:, :, 3]


def segments():
    cols = (alpha > 128).sum(0); segs, s = [], None
    for x, v in enumerate(cols):
        if v and s is None: s = x
        if not v and s is not None: segs.append((s, x)); s = None
    out = []
    for (x0, x1) in segs:
        rows = np.nonzero((alpha[:, x0:x1] > 128).sum(1))[0]
        out.append((x0, rows.min(), x1, rows.max() + 1))
    return out


def uniformity(reg, p, phx, phy):
    H, W = reg.shape[:2]; tot = n = 0
    y = phy
    while y + p <= H:
        x = phx
        while x + p <= W:
            b = reg[int(y + p * .25):int(y + p * .75) + 1, int(x + p * .25):int(x + p * .75) + 1]
            if b[:, :, 3].min() > 200: tot += b[:, :, :3].reshape(-1, 3).std(0).sum(); n += 1
            x += p
        y += p
    return tot / max(n, 1)


def sample(reg, p, phx, phy):
    H, W = reg.shape[:2]
    ny, nx = int((H - phy) // p), int((W - phx) // p)
    out = np.zeros((ny, nx, 4), np.uint8)
    for j in range(ny):
        for i in range(nx):
            y0, x0 = phy + j * p, phx + i * p
            b = reg[int(y0 + p * .22):int(y0 + p * .78) + 1, int(x0 + p * .22):int(x0 + p * .78) + 1].reshape(-1, 4)
            if np.median(b[:, 3]) < 128: continue
            out[j, i, :3] = np.median(b[b[:, 3] > 128][:, :3], axis=0); out[j, i, 3] = 255
    return out


def trace_one(box):
    x0, y0, x1, y1 = box; m = 8
    reg = A[max(0, y0 - m):y1 + m, max(0, x0 - m):x1 + m]
    p = PITCH
    ph = min(((uniformity(reg, p, q, q), q) for q in np.arange(0, p, 1.0)))[1]
    # refine x/y phase separately
    bx = min(((uniformity(reg, p, phx, ph), phx) for phx in np.arange(0, p, 0.5)))[1]
    by = min(((uniformity(reg, p, bx, phy), phy) for phy in np.arange(0, p, 0.5)))[1]
    return sample(reg, p, bx, by), p


def shared_palette(grids, n=48):
    px = np.concatenate([g[g[:, :, 3] > 0][:, :3] for g in grids])
    strip = Image.fromarray(px.reshape(1, -1, 3).astype(np.uint8), 'RGB')
    q = strip.quantize(colors=n, method=Image.Quantize.MEDIANCUT)
    pal = np.array(q.getpalette()[:n * 3]).reshape(-1, 3)
    return pal


def own_palette(g, n=30):
    px = g[g[:, :, 3] > 0][:, :3]
    q = Image.fromarray(px.reshape(1, -1, 3).astype(np.uint8), 'RGB').quantize(colors=n, method=Image.Quantize.MEDIANCUT, kmeans=2)
    return np.array(q.getpalette()[:n * 3]).reshape(-1, 3)


def ink_silhouette(g):
    """the outer silhouette takes the darkest ink colour (the reference outlines every shape with warm near-black)."""
    H, W = g.shape[:2]; m = g[:, :, 3] > 0
    lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
    cols = g[m][:, :3]; ink = cols[np.argmin([lum(c) for c in cols])]
    out = g.copy()
    for y in range(H):
        for x in range(W):
            if not m[y, x]: continue
            edge = any(not (0 <= x + dx < W and 0 <= y + dy < H) or not m[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if edge and lum(g[y, x]) > 70: out[y, x, :3] = ink
    return out


def apply_palette(g, pal):
    out = g.copy(); m = g[:, :, 3] > 0
    c = g[m][:, :3].astype(int)
    d = ((c[:, None, :] - pal[None, :, :]) ** 2).sum(2); out[m, :3] = pal[d.argmin(1)]
    return out


def remove_shadow(g):
    H, W = g.shape[:2]
    def greyish(c):
        r, gg, b = [int(v) for v in c[:3]]; mx, mn = max(r, gg, b), min(r, gg, b)
        return mx > 120 and (mx - mn) < 26
    seen = set(); stack = []
    for y in range(H):
        for x in range(W):
            if g[y, x, 3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H and g[Y, X, 3] and Y > H * 0.6 and greyish(g[Y, X]): stack.append((X, Y))
    while stack:
        x, y = stack.pop()
        if (x, y) in seen: continue
        seen.add((x, y))
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            X, Y = x + dx, y + dy
            if 0 <= X < W and 0 <= Y < H and g[Y, X, 3] and (X, Y) not in seen and greyish(g[Y, X]): stack.append((X, Y))
    for (x, y) in seen: g[y, x, 3] = 0
    return g


def crop(g):
    ys, xs = np.nonzero(g[:, :, 3])
    return g[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def despeckle(g):
    """a lone pixel whose 4 neighbours all share one other colour takes that colour (blur debris)."""
    H, W = g.shape[:2]; out = g.copy()
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if not g[y, x, 3]: continue
            nb = [tuple(g[y + dy, x + dx]) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            if len(set(nb)) == 1 and nb[0] != tuple(g[y, x]) and nb[0][3]: out[y, x] = nb[0]
    return out


def despur(g, rounds=2):
    """remove spur pixels on the silhouette (an opaque pixel with at most one opaque 4-neighbour): blur debris, not drawing."""
    for _ in range(rounds):
        H, W = g.shape[:2]; kill = []
        for y in range(H):
            for x in range(W):
                if not g[y, x, 3]: continue
                n = sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= x + dx < W and 0 <= y + dy < H and g[y + dy, x + dx, 3])
                if n <= 1: kill.append((x, y))
        for (x, y) in kill: g[y, x, 3] = 0
    return g


def to_source(name, g):
    keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=?!<>~^'
    pal, rows = {}, []
    for y in range(g.shape[0]):
        r = ''
        for x in range(g.shape[1]):
            if not g[y, x, 3]: r += '.'; continue
            h = '#%02x%02x%02x' % tuple(int(v) for v in g[y, x, :3])
            if h not in pal: pal[h] = keys[len(pal)]
            r += pal[h]
        rows.append(r)
    src = {'version': 1, 'name': name, 'canvas': [g.shape[1], g.shape[0]], 'pivot': [g.shape[1] // 2, g.shape[0] - 1],
           'palette': {v: k for k, v in pal.items()},
           'frames': [{'name': name + '-front', 'duration_ms': 200, 'rows': rows}],
           'provenance': 'traced from references/tayduky/ref/topdown character.png (supplied by the owner; licence not determined)'}
    with open(os.path.join(SRCD, name + '.json'), 'w', encoding='utf-8') as f: json.dump(src, f, indent=1)


if __name__ == '__main__':
    os.makedirs(SRCD, exist_ok=True)
    boxes = segments(); assert len(boxes) == 4, boxes
    raw = []
    for name, box in zip(NAMES, boxes):
        g, p = trace_one(box); raw.append(g); print(name, 'pitch %.1f' % p, 'grid', g.shape[1], 'x', g.shape[0])
    final = []
    for name, g in zip(NAMES, raw):
        g = remove_shadow(g)
        g = crop(ink_silhouette(despur(despeckle(apply_palette(g, own_palette(g))))))
        final.append(g); Image.fromarray(g, 'RGBA').save(os.path.join(OUTD, 'trace-%s.png' % name)); to_source(name, g)
    # comparison sheet: reference (top) vs traced at the same size (bottom), on a dark background
    k = 7; Wt = sum(g.shape[1] * k + 40 for g in final); Ht = max(g.shape[0] for g in final) * k
    sheet = Image.new('RGBA', (Wt + 40, Ht * 2 + 60), (40, 34, 46, 255)); x = 20
    for box, g in zip(boxes, final):
        ref = img.crop(box); s = (g.shape[0] * k) / ref.height
        ref = ref.resize((int(ref.width * s), int(ref.height * s)), Image.LANCZOS)
        sheet.alpha_composite(ref, (x, 20))
        sheet.alpha_composite(Image.fromarray(g, 'RGBA').resize((g.shape[1] * k, g.shape[0] * k), Image.NEAREST), (x, Ht + 40))
        x += max(ref.width, g.shape[1] * k) + 40
    sheet.save(os.path.join(OUTD, 'step1b-traced.png'))
    print('done')
