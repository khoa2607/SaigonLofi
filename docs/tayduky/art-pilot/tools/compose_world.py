"""Compose the Tây Du Ký world map (hybrid design): every biome keeps a traced centre plate; plates sit on a diamond running east to west,
on a shared base terrain coloured per biome. Seams are organic: each plate's border is dithered into what lies beneath (the lower plate,
which is nearer the viewer, overlaps the upper one), so neighbouring biomes share an edge band.

Steps
  1. trace each scene reference into a plate at the characters' density; name banners are removed by inpainting;
  2. make each plate's sky and border clouds transparent (flood from the plate edge through sky colours), so the plate stands on the map;
  3. paint the base terrain (nearest-biome field, noise-warped), including the procedural Thông Thiên Hà river biome;
  4. paste the plates (upper rows first) with a ragged dithered border;
  5. derive the walk grid (4 px cells, ground colours), the occluder layer (object blobs above the ground, with their base line),
     and water pixels are left to the runtime;
  6. write chunks (512 px, lossless WebP), occluder chunks and world.js for tayduky/.
Run: python compose_world.py   (takes a minute)
"""
import os, json, math, zlib
import numpy as np
from PIL import Image
from scipy import ndimage
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
REFD = r'E:\game\web-lofi\references\tayduky\ref'
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
OUT = os.path.join(ROOT, 'tayduky', 'world'); os.makedirs(OUT, exist_ok=True)
CH = 512

# id, title vi/en, reference, cell size, centre (world px), base terrain, side neighbours (for the Director)
BIOMES = [
    ('lat', ['Lôi Âm Tự', 'Thunderclap Monastery'], '06_Loi_Am_Tu_map_reference.png', 1.6, (640, 1130), 'heaven'),
    ('hds', ['Hỏa Diệm Sơn', 'The Flaming Mountains'], 'hỏa diệm sơn.png', 1.6, (1460, 560), 'fire'),
    ('nnq', ['Nữ Nhi Quốc', "The Women's Kingdom"], '03_Nu_Nhi_Quoc_map_reference.png', 1.6, (1460, 1130), 'lotus'),
    ('btd', ['Bàn Tơ Động', 'Silk Web Cave'], '04_Ban_To_Dong_map_reference.png', 1.6, (1460, 1720), 'violet'),
    ('bcl', ['Bạch Cốt Lĩnh', 'White Bone Ridge'], '02_Bach_Cot_Linh_map_reference.png', 1.6, (2280, 560), 'bone'),
    ('clt', ['Cao Lão Trang', "Old Gao's Village"], 'cao lão tarng 1672x941.png', 1.25, (2300, 1140), 'farm'),
    ('tth', ['Thông Thiên Hà', 'The River That Reaches Heaven'], None, None, (2280, 1720), 'river'),
    ('tc', ['Thiên Cung', 'The Heavenly Palace'], 'Nam Thiên Môn.png', 1.6, (3100, 560), 'heaven'),
    ('btp', ['Lòng Bàn Tay Phật Tổ', "The Buddha's Palm"], '01_Phat_To_Ngu_Hanh_Son_map_reference.png', 1.6, (3100, 1130), 'heaven'),
    ('nhs', ['Ngũ Hành Sơn', 'Five Elements Mountain'], '01_Phat_To_Ngu_Hanh_Son_map_reference.png', 1.6, (3100, 1720), 'stone'),
    ('hqs', ['Hoa Quả Sơn', 'Flower-Fruit Mountain'], 'Hoa Quả Sơn - không nhân vật.png', 1.7, (3920, 1130), 'jungle'),
]
# one reference holds both the palm (left) and the five-element mountain (right): each biome takes its half (source px x0, x1)
CROP = {'btp': (0, 1100), 'nhs': (720, None)}
CUT = {'btp': [(740, 0, 1536, 470), (1000, 0, 1536, 1104)]}   # source-px boxes removed from a plate (the mountain belongs to nhs)
ADJ = {'lat': ['hds', 'nnq', 'btd'], 'hds': ['lat', 'nnq', 'bcl'], 'nnq': ['lat', 'hds', 'btd', 'clt'], 'btd': ['lat', 'nnq', 'tth'],
       'bcl': ['hds', 'clt', 'tc'], 'clt': ['nnq', 'bcl', 'tth', 'btp'], 'tth': ['btd', 'clt', 'nhs'], 'tc': ['bcl', 'btp', 'hqs'],
       'btp': ['clt', 'tc', 'nhs', 'hqs'], 'nhs': ['tth', 'btp', 'hqs'], 'hqs': ['tc', 'btp', 'nhs']}   # design §2.3
WW, WH = 4560, 2280

BASE = {   # palette of 4 ground tones + 1 accent per base terrain
    'heaven': ['#ece0f0', '#f1e6f3', '#e6d8ec', '#f6eef7', '#d8c6e4'],
    'fire': ['#8e3c24', '#984228', '#843620', '#a24a2c', '#ffb04a'],
    'lotus': ['#84c46e', '#8aca72', '#7ebe68', '#92d07a', '#f4a6c0'],
    'violet': ['#4c3c60', '#524266', '#46365a', '#58486c', '#b48ae0'],
    'bone': ['#8e8898', '#948ea0', '#888292', '#9a94a6', '#ece6dc'],
    'farm': ['#88ba5c', '#8ec062', '#82b456', '#94c668', '#e8c860'],
    'river': ['#86b85a', '#8ec062', '#7cae52', '#98c86c', '#f0d870'],
    'stone': ['#8a96a2', '#909ca8', '#84909c', '#7ea06a', '#6a8a5a'],
    'jungle': ['#72b24c', '#78b852', '#6cac46', '#7ebe58', '#f4b0b8'],
}
hx = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)


def vnoise(shape, scale, seed):
    rng = np.random.default_rng(seed)
    gh, gw = shape[0] // scale + 2, shape[1] // scale + 2
    g = rng.random((gh, gw)).astype(np.float32)
    return cv2.resize(g, (shape[1] + scale * 2, shape[0] + scale * 2), interpolation=cv2.INTER_CUBIC)[:shape[0], :shape[1]]


def banner_mask(a):
    """the dark maroon name banner (gold border, text) near the top of the 0N_ map references."""
    h = a.shape[0]; top = a[:int(h * 0.3)].astype(int)
    r, g, b = top[:, :, 0], top[:, :, 1], top[:, :, 2]
    maroon = (r > 55) & (r < 135) & (g < 60) & (b < 70) & (r > g + 30)
    m = np.zeros(a.shape[:2], bool)
    if maroon.sum() < 500: return m
    lab, n = ndimage.label(ndimage.binary_closing(maroon, iterations=4))
    sizes = ndimage.sum(maroon, lab, range(1, n + 1)); k = int(np.argmax(sizes)) + 1
    sl = ndimage.find_objects(lab)[k - 1]
    m[max(0, sl[0].start - 14):sl[0].stop + 14, max(0, sl[1].start - 30):sl[1].stop + 30] = True
    return m


def remove_banner(a):
    """inpaint the dark maroon name banner (with its gold border and text) near the top of a map reference."""
    h = a.shape[0]; top = a[:int(h * 0.3)].astype(int)
    r, g, b = top[:, :, 0], top[:, :, 1], top[:, :, 2]
    maroon = (r > 55) & (r < 135) & (g < 60) & (b < 70) & (r > g + 30)
    if maroon.sum() < 500: return a
    lab, n = ndimage.label(ndimage.binary_closing(maroon, iterations=4))
    sizes = ndimage.sum(maroon, lab, range(1, n + 1)); k = int(np.argmax(sizes)) + 1
    sl = ndimage.find_objects(lab)[k - 1]
    mask = np.zeros(a.shape[:2], np.uint8)
    mask[max(0, sl[0].start - 14):sl[0].stop + 14, max(0, sl[1].start - 30):sl[1].stop + 30] = 255
    return cv2.inpaint(a, mask, 9, cv2.INPAINT_TELEA)


def trace_plate(file, p, crop=None, cut=None):
    a = np.asarray(Image.open(os.path.join(REFD, file)).convert('RGB'))
    bm = banner_mask(a) if file.startswith('0') else np.zeros(a.shape[:2], bool)
    for (cx0, cy0, cx1, cy1) in (cut or []): bm[cy0:cy1, cx0:cx1] = True
    if crop: a, bm = a[:, crop[0]:crop[1]], bm[:, crop[0]:crop[1]]
    H, W = a.shape[:2]
    best = None
    for ph in np.linspace(0, p, 5, endpoint=False):
        ys = np.clip((ph + np.arange(int((H - ph) // p)) * p + p / 2).astype(int), 0, H - 1)
        xs = np.clip((ph + np.arange(int((W - ph) // p)) * p + p / 2).astype(int), 0, W - 1)
        g = a[ys][:, xs].astype(int)
        s = np.abs(np.diff(g, axis=0)).mean() + np.abs(np.diff(g, axis=1)).mean()
        if best is None or s > best[0]: best = (s, g)
    im = Image.fromarray(best[1].astype(np.uint8), 'RGB').quantize(colors=96, method=Image.Quantize.MEDIANCUT, kmeans=2).convert('RGB')
    out = np.asarray(im)
    bmd = cv2.resize(bm.astype(np.uint8), (out.shape[1], out.shape[0]), interpolation=cv2.INTER_NEAREST).astype(bool)
    return out, bmd


def hsv(a):
    h = cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    return h[:, :, 0] * 360 / 255, h[:, :, 1] / 255, h[:, :, 2] / 255


def sky_mask(pl):
    """sky + framing clouds = bright, low-saturation or pale-blue pixels connected to the plate border."""
    H, S, V = hsv(pl)
    sky = ((V > 0.78) & (S < 0.26)) | ((H > 185) & (H < 235) & (V > 0.62) & (S < 0.55)) | ((H > 250) & (H < 320) & (V > 0.72) & (S < 0.3))
    lab, n = ndimage.label(sky)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    m = np.isin(lab, list(edge))
    return ndimage.binary_opening(m, iterations=1)


def ground_mask(img):
    H, S, V = hsv(img)
    stone = (S < 0.34) & (V > 0.52) & (img[:, :, 0].astype(int) >= img[:, :, 2].astype(int) - 8)
    grass = (H > 55) & (H < 115) & (S > 0.3) & (V > 0.45)
    earth = (H < 40) & (S > 0.3) & (S < 0.75) & (V > 0.35) & (V < 0.85)            # fire ground, paths
    violet = (H > 250) & (H < 300) & (S > 0.15) & (S < 0.5) & (V > 0.3) & (V < 0.7)   # cave floors
    return stone | grass | earth | violet


def water_mask(img):
    H, S, V = hsv(img)
    return (H > 170) & (H < 215) & (S > 0.28) & (V > 0.45)


if __name__ == '__main__':
    rng = np.random.default_rng(7)
    centres = np.array([b[4] for b in BIOMES], float)
    # ---------------------------------------------------------------- base terrain: noise-warped nearest biome, 4 px pixel clusters
    gh, gw = WH // 4, WW // 4
    yy, xx = np.mgrid[0:gh, 0:gw].astype(np.float32) * 4
    wx = xx + (vnoise((gh, gw), 24, 1) - .5) * 360; wy = yy + (vnoise((gh, gw), 24, 2) - .5) * 260
    d = np.stack([((wx - c[0]) / 1.0) ** 2 + ((wy - c[1]) / 1.15) ** 2 for c in centres]); owner = d.argmin(0)
    n1 = vnoise((gh, gw), 3, 3) * 0.6 + vnoise((gh, gw), 12, 13) * 0.4; n2 = vnoise((gh, gw), 2, 4)
    base = np.zeros((gh, gw, 3), np.uint8)
    for i, b in enumerate(BIOMES):
        pal = [hx(c) for c in BASE[b[5]]]; m = owner == i
        tone = np.clip(((n1 - 0.2) * 3.4).astype(int), 0, 3)
        for t in range(4): base[m & (tone == t)] = pal[t]
        base[m & (n2 > 0.965)] = pal[4]
    # outside the diamond: cloud sea
    cx, cy = WW / 2, WH / 2
    # land only around the biome centres (plates are about 960 x 690): further out is cloud sea, so the map reads as joined floating isles
    land = np.zeros_like(xx, bool)
    for b in BIOMES:
        bx, by = b[4]; hw, hh = (560, 380) if b[0] != 'clt' else (700, 420)
        land |= (np.abs(wx - bx) < hw) & (np.abs(wy - by) < hh)
    out = ~land
    sea = [hx('#efe4f0'), hx('#ebdeed'), hx('#f4ecf5'), hx('#e6d8ea')]
    t2 = np.clip(((vnoise((gh, gw), 4, 9) * 0.6 + vnoise((gh, gw), 16, 19) * 0.4 - 0.2) * 4).astype(int), 0, 3)
    for t in range(4): base[out & (t2 == t)] = sea[t]
    world = cv2.resize(base, (WW, WH), interpolation=cv2.INTER_NEAREST)
    ownerF = cv2.resize(owner.astype(np.uint8), (WW, WH), interpolation=cv2.INTER_NEAREST)

    # Thông Thiên Hà (no reference yet): a broad river with banks, stepping stones and lantern rafts, painted procedurally
    tth = BIOMES[6][4]
    ys, xs = np.mgrid[0:WH, 0:WW]
    river = np.abs((ys - tth[1]) - 0.28 * (xs - tth[0]) + 40 * np.sin(xs / 140.0)) < 70
    near = (np.abs(xs - tth[0]) < 640) & (np.abs(ys - tth[1]) < 360)
    rv = river & near
    wt = [hx('#2f78b4'), hx('#3a8ac4'), hx('#2a6aa4'), hx('#58a8dc')]
    rn = cv2.resize(vnoise((WH // 4, WW // 4), 5, 11), (WW, WH), interpolation=cv2.INTER_NEAREST)
    for t in range(4): world[rv & (np.clip((rn * 4).astype(int), 0, 3) == t)] = wt[t]
    bank = ndimage.binary_dilation(rv, iterations=10) & ~rv & near
    world[bank] = hx('#c9b48a')
    for k in range(9):                                              # lantern rafts
        x = int(tth[0] - 480 + k * 120); y = int(tth[1] + 0.28 * (x - tth[0]) - 40 * math.sin(x / 140.0) + rng.uniform(-50, 50))
        world[y - 5:y + 5, x - 14:x + 14] = hx('#7a4a2a'); world[y - 12:y - 5, x - 3:x + 3] = hx('#ffcc5a')

    # ---------------------------------------------------------------- plates
    occ_layer = np.zeros((WH, WW, 4), np.uint8)
    plates_meta = []
    order = sorted([b for b in BIOMES if b[2]], key=lambda b: b[4][1])
    for b in order:
        bid, title, file, p, (pcx, pcy), terr = b
        pl, bmd = trace_plate(file, p, CROP.get(bid), CUT.get(bid)); ph, pw = pl.shape[:2]
        x0, y0 = int(pcx - pw / 2), int(pcy - ph / 2)
        keep = ~sky_mask(pl) & ~bmd
        # ragged dithered border (edge band shared with the neighbour beneath)
        dist = np.minimum.reduce([np.arange(pw)[None, :].repeat(ph, 0), (pw - 1 - np.arange(pw))[None, :].repeat(ph, 0),
                                  np.arange(ph)[:, None].repeat(pw, 1), (ph - 1 - np.arange(ph))[:, None].repeat(pw, 1)]).astype(np.float32)
        if bmd.any(): dist = np.minimum(dist, ndimage.distance_transform_edt(~bmd).astype(np.float32))   # cut and banner edges get the same ragged band
        nz = cv2.resize(vnoise((ph // 4 + 1, pw // 4 + 1), 4, zlib.crc32(bid.encode()) % 1000), (pw, ph), interpolation=cv2.INTER_NEAREST)
        keep &= dist > nz * 70
        Y0, X0 = max(0, y0), max(0, x0); Y1, X1 = min(WH, y0 + ph), min(WW, x0 + pw)
        sub = keep[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
        world[Y0:Y1, X0:X1][sub] = pl[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0][sub]
        # occluders: object blobs (not ground, not water) of moderate size, inside this plate
        plw = pl[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
        obj = sub & ~ground_mask(plw) & ~water_mask(plw)
        obj = ndimage.binary_opening(obj, iterations=1)
        lab, n = ndimage.label(obj)
        blobs = []
        for i, sl in enumerate(ndimage.find_objects(lab)):
            if sl is None: continue
            hgt, wid = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            area = int((lab[sl] == i + 1).sum())
            if area < 260 or area > 70000 or hgt < 18 or hgt > 420: continue
            m = lab[sl] == i + 1
            dst = occ_layer[Y0 + sl[0].start:Y0 + sl[0].stop, X0 + sl[1].start:X0 + sl[1].stop]
            dst[m, :3] = plw[sl][m]; dst[m, 3] = 255
            blobs.append([X0 + sl[1].start, Y0 + sl[0].start, wid, hgt, Y0 + sl[0].stop])
        plates_meta.append({'id': bid, 'rect': [x0, y0, pw, ph], 'occ': blobs})
        print(bid, 'plate', pw, 'x', ph, 'occluders', len(blobs))
    plates_meta.append({'id': 'tth', 'rect': [tth[0] - 640, tth[1] - 360, 1280, 720], 'occ': []})

    # ---------------------------------------------------------------- walk grid (4 px cells): ground colours, not water, not occluder pixels
    g = ground_mask(world) & ~water_mask(world) & (occ_layer[:, :, 3] == 0)
    g &= ~out.repeat(4, 0).repeat(4, 1)[:WH, :WW]
    cells = g[:WH // 4 * 4, :WW // 4 * 4].reshape(WH // 4, 4, WW // 4, 4).mean((1, 3)) > 0.7
    cells = ndimage.binary_opening(cells, iterations=2)          # drops thin strips such as wall tops (under 5 cells)
    lab, n = ndimage.label(cells); sizes = ndimage.sum(cells, lab, range(1, n + 1))
    cells &= np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 40])
    Image.fromarray((cells * 255).astype(np.uint8)).save(os.path.join(OUT, 'walk.png'))

    # ---------------------------------------------------------------- chunks
    for cy_ in range(0, WH, CH):
        for cx_ in range(0, WW, CH):
            Image.fromarray(world[cy_:cy_ + CH, cx_:cx_ + CH]).save(os.path.join(OUT, 'g_%d_%d.webp' % (cx_ // CH, cy_ // CH)), lossless=True, quality=100, method=4)
            o = occ_layer[cy_:cy_ + CH, cx_:cx_ + CH]
            if o[:, :, 3].any(): Image.fromarray(o, 'RGBA').save(os.path.join(OUT, 'o_%d_%d.webp' % (cx_ // CH, cy_ // CH)), lossless=True, quality=100, method=4)
    Image.fromarray(world).resize((WW // 4, WH // 4), Image.NEAREST).save(os.path.join(HERE, '..', 'out', 'world-overview.png'))
    meta = {'size': [WW, WH], 'chunk': CH, 'cell': 4, 'biomes': [{'id': b[0], 'title': b[1], 'centre': list(b[4]), 'terrain': b[5]} for b in BIOMES],
            'adj': ADJ, 'plates': plates_meta}
    with open(os.path.join(OUT, 'world.js'), 'w', encoding='utf-8') as f:
        f.write('// generated by docs/tayduky/art-pilot/tools/compose_world.py\nwindow.TD_WORLD = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
    print('world', WW, 'x', WH, 'walk cells', int(cells.sum()))
