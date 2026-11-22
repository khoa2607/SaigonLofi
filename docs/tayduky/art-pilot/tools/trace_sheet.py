"""Trace a multi-character reference sheet (owner's refs) into clean native sprites, grouped by character and direction.

Pipeline per sheet:
  1. background = most common border colour; foreground = pixels far from it (the soft ground shadows stay out on dark sheets);
  2. sprites = connected components of the (slightly dilated) foreground; name banners and title plates are dropped (wide + short),
     specks are dropped (tiny);
  3. rows are clustered by vertical centre, sprites ordered left to right, and named from the sheet's layout config;
  4. every sprite is re-gridded at the chosen cell size (phase picked for the crispest result): robust median of each cell's centre,
     alpha from the cell's foreground coverage;
  5. one palette per character (shared by its directions), shadow flood removal on light sheets, despeckle, spur cleanup,
     and an inked silhouette (darkest tone).
Outputs: out/chars/<name>.png (directions side by side, bottom-aligned), src/chars/<name>.json (pixel-art-studio grid source,
one frame per direction, shared canvas and pivot), and a lineup preview per sheet.
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
REFD = r'E:\game\web-lofi\references\tayduky\ref'
OUTD = os.path.join(HERE, '..', 'out', 'chars'); SRCD = os.path.join(HERE, '..', 'src', 'chars')
DIRS = ['d1', 'd2', 'd3', 'd4']


def bg_colour(a):
    border = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    q = (border // 8).astype(int); keys, counts = np.unique(q[:, 0] * 1024 + q[:, 1] * 32 + q[:, 2], return_counts=True)
    k = keys[counts.argmax()]; sel = border[(q[:, 0] * 1024 + q[:, 1] * 32 + q[:, 2]) == k]
    return sel.mean(0)


def make_fg(img, bg, thresh):
    fg = np.abs(img - bg).sum(2) > thresh
    fg = ndimage.binary_opening(fg, iterations=1)
    fg = ndimage.binary_fill_holes(ndimage.binary_closing(fg, iterations=2))
    return fg


def strip_bg_near(g, bg, tol=48):
    """flood from the transparent outside through cells whose colour is close to the sheet background (soft shadows, halo)."""
    H, W = g.shape[:2]
    near = (np.abs(g[:, :, :3].astype(int) - bg).sum(2) < tol) & (g[:, :, 3] > 0)
    out = g[:, :, 3] == 0
    lab, n = ndimage.label(near)
    touch = set()
    border = ndimage.binary_dilation(out) & near
    for v in np.unique(lab[border]):
        if v: touch.add(v)
    if touch: g[np.isin(lab, list(touch)), 3] = 0
    return g


def components(mask, min_w, min_h):
    lab, n = ndimage.label(ndimage.binary_dilation(mask, iterations=3))
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        ys, xs = sl; h, w = ys.stop - ys.start, xs.stop - xs.start
        if w < min_w or h < min_h: continue
        if w > 2.6 * h: continue                                 # banners / title plates
        boxes.append((xs.start, ys.start, xs.stop, ys.stop, i + 1))
    return boxes, lab


def split_wide(rows, fg, lab):
    """a box much wider than its row's typical sprite holds two touching sprites: cut it at the emptiest column."""
    out = []
    for row in rows:
        med = np.median([b[2] - b[0] for b in row]); nr = []
        for b in row:
            x0, y0, x1, y1, li = b
            if x1 - x0 > 1.55 * med:
                cols = (lab[y0:y1, x0:x1] == li).sum(0).astype(float)
                lo, hi = int((x1 - x0) * 0.3), int((x1 - x0) * 0.7)
                cut = x0 + lo + int(np.argmin(cols[lo:hi]))
                nr += [(x0, y0, cut, y1, li), (cut, y0, x1, y1, li)]
            else: nr.append(b)
        out.append(sorted(nr))
    return out


def rows_of(boxes, tol):
    boxes = sorted(boxes, key=lambda b: (b[1] + b[3]) / 2)
    rows, cur = [], []
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        if cur and abs(cy - np.mean([(c[1] + c[3]) / 2 for c in cur])) > tol: rows.append(sorted(cur)); cur = []
        cur.append(b)
    if cur: rows.append(sorted(cur))
    return rows


def regrid(rgb, fg, p):
    best = None
    for phx in np.arange(0, p, p / 4):
        for phy in np.arange(0, p, p / 4):
            H, W = fg.shape; ny, nx = int((H - phy) // p), int((W - phx) // p)
            out = np.zeros((ny, nx, 4), np.uint8)
            for j in range(ny):
                for i in range(nx):
                    y0, x0 = phy + j * p, phx + i * p
                    ys, ye, xs, xe = int(y0 + p * .28), int(y0 + p * .72) + 1, int(x0 + p * .28), int(x0 + p * .72) + 1
                    cov = fg[int(y0):int(y0 + p), int(x0):int(x0 + p)].mean() if p >= 1 else 0
                    if cov < 0.5: continue
                    b = rgb[ys:ye, xs:xe].reshape(-1, 3); m = fg[ys:ye, xs:xe].reshape(-1)
                    if m.sum() == 0: continue
                    out[j, i, :3] = np.median(b[m], axis=0); out[j, i, 3] = 255
            g = out.astype(int); a = out[:, :, 3] > 0
            s = (np.abs(np.diff(g[:, :, :3], axis=1)).sum(2) * (a[:, 1:] & a[:, :-1])).mean() + (np.abs(np.diff(g[:, :, :3], axis=0)).sum(2) * (a[1:] & a[:-1])).mean()
            if best is None or s > best[0]: best = (s, out)
    return best[1]


def palette_for(frames, n=30):
    px = np.concatenate([f[f[:, :, 3] > 0][:, :3] for f in frames])
    q = Image.fromarray(px.reshape(1, -1, 3).astype(np.uint8), 'RGB').quantize(colors=n, method=Image.Quantize.MEDIANCUT, kmeans=2)
    return np.array(q.getpalette()[:n * 3]).reshape(-1, 3)


def apply_palette(g, pal):
    out = g.copy(); m = g[:, :, 3] > 0
    if m.any():
        c = g[m][:, :3].astype(int); out[m, :3] = pal[((c[:, None, :] - pal[None]) ** 2).sum(2).argmin(1)]
    return out


def remove_grey_shadow(g, bg):
    """light sheets: the grey ground shadow is opaque; flood it from the transparent background through grey cells in the lower part."""
    H, W = g.shape[:2]
    def grey(c):
        r, gg, b = [int(v) for v in c[:3]]; mx, mn = max(r, gg, b), min(r, gg, b)
        return mx > 90 and (mx - mn) < 30 and np.abs(np.array([r, gg, b]) - bg).sum() < 220
    seen, stack = set(), []
    for y in range(H):
        for x in range(W):
            if g[y, x, 3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H and g[Y, X, 3] and Y > H * 0.7 and grey(g[Y, X]): stack.append((X, Y))
    while stack:
        x, y = stack.pop()
        if (x, y) in seen: continue
        seen.add((x, y))
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            X, Y = x + dx, y + dy
            if 0 <= X < W and 0 <= Y < H and g[Y, X, 3] and (X, Y) not in seen and Y > H * 0.6 and grey(g[Y, X]): stack.append((X, Y))
    for (x, y) in seen: g[y, x, 3] = 0
    return g


def clean(g):
    H, W = g.shape[:2]
    out = g.copy()
    for y in range(1, H - 1):                                    # despeckle
        for x in range(1, W - 1):
            if not g[y, x, 3]: continue
            nb = [tuple(g[y + dy, x + dx]) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            if len(set(nb)) == 1 and nb[0] != tuple(g[y, x]) and nb[0][3]: out[y, x] = nb[0]
    g = out
    for _ in range(2):                                           # spurs
        a = g[:, :, 3] > 0
        n = np.zeros_like(a, int)
        n[1:] += a[:-1]; n[:-1] += a[1:]; n[:, 1:] += a[:, :-1]; n[:, :-1] += a[:, 1:]
        g[(a) & (n <= 1), 3] = 0
    lab, k = ndimage.label(g[:, :, 3] > 0)                      # keep only blobs of a useful size (drops stray bits of neighbours)
    if k > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, k + 1))
        for i, (s, sl) in enumerate(zip(sizes, ndimage.find_objects(lab))):
            hgt = sl[0].stop - sl[0].start
            wid = sl[1].stop - sl[1].start
            if s < 12 or (s < 0.35 * sizes.max() and hgt <= 8 and wid >= 2.5 * hgt): g[lab == i + 1, 3] = 0
    return g


def ink(g):
    a = g[:, :, 3] > 0
    if not a.any(): return g
    lum = g[:, :, 0] * .3 + g[:, :, 1] * .59 + g[:, :, 2] * .11
    inkc = g[a][np.argmin(lum[a]), :3]
    edge = a & ~ndimage.binary_erosion(a)
    sel = edge & (lum > 75)
    g[sel, :3] = inkc
    return g


def crop(g):
    ys, xs = np.nonzero(g[:, :, 3])
    return g[ys.min():ys.max() + 1, xs.min():xs.max() + 1] if len(ys) else g


def grid_source(name, frames, label):
    W = max(f.shape[1] for f in frames); H = max(f.shape[0] for f in frames)
    keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=?!<>~^'
    pal, out = {}, []
    for d, f in zip(DIRS, frames):
        can = np.zeros((H, W, 4), np.uint8); x0 = (W - f.shape[1]) // 2; can[H - f.shape[0]:, x0:x0 + f.shape[1]] = f
        rows = []
        for y in range(H):
            r = ''
            for x in range(W):
                if not can[y, x, 3]: r += '.'; continue
                h = '#%02x%02x%02x' % tuple(int(v) for v in can[y, x, :3])
                if h not in pal: pal[h] = keys[len(pal)]
                r += pal[h]
            rows.append(r)
        out.append({'name': '%s-%s' % (name, d), 'duration_ms': 200, 'rows': rows})
    return {'version': 1, 'name': name, 'label': label, 'canvas': [W, H], 'pivot': [W // 2, H - 1],
            'palette': {v: k for k, v in pal.items()}, 'frames': out,
            'provenance': 'traced from the owner reference sheet (references/tayduky/ref); licence not determined'}


def segment_row(band, want):
    """split a row band into `want` sprites using empty columns: merge the closest neighbours while there are too many pieces,
    split the widest piece at its emptiest column while there are too few."""
    col = band.sum(0)
    segs, s0 = [], None
    for x, v in enumerate(col):
        if v and s0 is None: s0 = x
        if not v and s0 is not None: segs.append([s0, x]); s0 = None
    if s0 is not None: segs.append([s0, len(col)])
    segs = [sg for sg in segs if sg[1] - sg[0] >= 3 or col[sg[0]:sg[1]].sum() > 20]
    while len(segs) > want:
        gaps = [segs[i + 1][0] - segs[i][1] + 0.15 * min(segs[i][1] - segs[i][0], segs[i + 1][1] - segs[i + 1][0]) for i in range(len(segs) - 1)]
        i = int(np.argmin(gaps)); segs[i] = [segs[i][0], segs[i + 1][1]]; del segs[i + 1]
    while len(segs) < want:
        i = int(np.argmax([sg[1] - sg[0] for sg in segs])); a, b = segs[i]
        lo, hi = a + (b - a) // 3, a + 2 * (b - a) // 3
        cut = lo + int(np.argmin(col[lo:hi])); segs[i:i + 1] = [[a, cut], [cut, b]]
    return [(max(0, a - 2), b + 2) for a, b in segs]


def trace_sheet(cfg):
    img = np.asarray(Image.open(os.path.join(REFD, cfg['file'])).convert('RGB')).astype(float)
    if cfg.get('crop'): x0, y0, x1, y1 = cfg['crop']; img = img[y0:y1, x0:x1]
    bg = bg_colour(img)
    fg = make_fg(img, bg, cfg.get('fg_thresh', 60))
    boxes, lab = components(fg, cfg.get('min_w', 30), cfg.get('min_h', 40))
    rows = rows_of(boxes, cfg.get('row_tol', 60))
    names = cfg['names']                                     # list per row: [(name, label), ...] each owning 4 sprites
    result = {}
    for r, row in enumerate(rows):
        if r >= len(names): break
        want = len(names[r]) * 4
        y0, y1 = min(b[1] for b in row), max(b[3] for b in row)
        band = fg[y0:y1]
        segs = segment_row(band, want)
        if len(segs) != want: print('  row %d: %d segments, expected %d' % (r, len(segs), want))
        for k, (nm, label) in enumerate(names[r]):
            frames = []
            for (sx0, sx1) in segs[k * 4:(k + 1) * 4]:
                m = band[:, sx0:sx1].copy()
                lab2, n2 = ndimage.label(ndimage.binary_dilation(m, iterations=2))
                if n2 > 1:                                   # keep the sprite (largest blob) and anything near it; drop slivers of neighbours
                    sizes = ndimage.sum(m, lab2, range(1, n2 + 1))
                    keep = [i + 1 for i, s_ in enumerate(sizes) if s_ >= 0.08 * sizes.max()]
                    m &= np.isin(lab2, keep)
                frames.append(regrid(img[y0:y1, sx0:sx1], m, cfg['pitch']))
            pal = palette_for(frames)
            done = []
            for f in frames:
                f = strip_bg_near(apply_palette(f, pal), bg)
                if cfg.get('light'): f = remove_grey_shadow(f, bg)
                done.append(crop(ink(clean(f))))
            result[nm] = (label, done)
    return result


def save(result, sheet_name):
    os.makedirs(OUTD, exist_ok=True); os.makedirs(SRCD, exist_ok=True)
    for nm, (label, frames) in result.items():
        src = grid_source(nm, frames, label)
        with open(os.path.join(SRCD, nm + '.json'), 'w', encoding='utf-8') as fh: json.dump(src, fh, ensure_ascii=False, indent=1)
        W = sum(f.shape[1] + 4 for f in frames); H = max(f.shape[0] for f in frames)
        strip = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = 0
        for f in frames: strip.alpha_composite(Image.fromarray(f, 'RGBA'), (x, H - f.shape[0])); x += f.shape[1] + 4
        strip.save(os.path.join(OUTD, nm + '.png'))
    # lineup: one row per character, light and dark background halves, 4x
    k, pad = 4, 6
    rows = [(nm, Image.open(os.path.join(OUTD, nm + '.png'))) for nm in result]
    W = max(im.width for _, im in rows) + pad * 2; H = sum(im.height + pad for _, im in rows) + pad
    sheet = Image.new('RGBA', (W * 2 * k, H * k), (0, 0, 0, 255))
    for half, bgc in enumerate([(238, 228, 210), (38, 32, 44)]):
        band = Image.new('RGBA', (W, H), bgc + (255,)); y = pad
        for nm, im in rows: band.alpha_composite(im, (pad, y)); y += im.height + pad
        sheet.alpha_composite(band.resize((W * k, H * k), Image.NEAREST), (half * W * k, 0))
    sheet.save(os.path.join(HERE, '..', 'out', 'lineup-%s.png' % sheet_name))


SHEETS = {
    'cao-lao-trang': {
        'file': 'cao lão trang nhân vật.png', 'pitch': 3.0, 'crop': (0, 60, 1774, 887), 'fg_thresh': 40, 'row_tol': 80,
        'names': [[('bajie', 'Trư Bát Giới'), ('cao_thuy_lan', 'Cao Thúy Lan'), ('cao_thai_cong', 'Cao Thái Công')],
                  [('tamtang', 'Đường Tăng (Tam Tạng)'), ('wukong', 'Tôn Ngộ Không'), ('shaseng', 'Sa Tăng')],
                  [('linh_canh', 'Lính canh (trang viên)'), ('nong_phu', 'Nông phu'), ('dan_lang_nam', 'Dân làng nam'), ('dan_lang_nu', 'Dân làng nữ')]]},
    'hoa-qua-son': {
        'file': 'Khỉ Con.png', 'pitch': 4.2, 'fg_thresh': 60, 'row_tol': 90, 'light': True, 'columns': True,
        'names': [[('khi_chien_binh', 'Khỉ chiến binh'), ('khi_lao', 'Khỉ già'), ('khi_luc_si', 'Khỉ lực sĩ'), ('khi_con', 'Khỉ con ôm đào'), ('khi_giao', 'Khỉ cầm giáo')]]},
}


if __name__ == '__main__':
    for key in (sys.argv[1:] or SHEETS.keys()):
        cfg = SHEETS[key]
        if cfg.get('columns'):
            # one character per column, 4 directions top to bottom, on an even grid: cut by grid cells
            img = np.asarray(Image.open(os.path.join(REFD, cfg['file'])).convert('RGB')).astype(float)
            bg = bg_colour(img); fg = make_fg(img, bg, cfg['fg_thresh'])
            ys, xs = np.nonzero(fg); X0, X1, Y0, Y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            nc, nr = len(cfg['names'][0]), 4
            cw, chh = (X1 - X0) / nc, (Y1 - Y0) / nr
            result = {}
            for c, (nm, label) in enumerate(cfg['names'][0]):
                frames = []
                for r in range(nr):
                    x0, x1, y0, y1 = int(X0 + c * cw), int(X0 + (c + 1) * cw), int(Y0 + r * chh), int(Y0 + (r + 1) * chh)
                    m = fg[y0:y1, x0:x1]
                    lab2, k = ndimage.label(ndimage.binary_dilation(m, iterations=3))
                    if k > 1:                                                     # keep the main sprite (plus anything touching it)
                        sizes = ndimage.sum(m, lab2, range(1, k + 1)); keep = int(np.argmax(sizes)) + 1; m = m & (lab2 == keep)
                    frames.append(regrid(img[y0:y1, x0:x1], m, cfg['pitch']))
                pal = palette_for(frames)
                result[nm] = (label, [crop(ink(clean(remove_grey_shadow(strip_bg_near(apply_palette(f, pal), bg), bg)))) for f in frames])
        else:
            result = trace_sheet(cfg)
            print(key, 'characters', len(result))
        save(result, key)
        for nm, (label, frames) in result.items(): print('  %-16s %s' % (nm, ' '.join('%dx%d' % (f.shape[1], f.shape[0]) for f in frames)))
