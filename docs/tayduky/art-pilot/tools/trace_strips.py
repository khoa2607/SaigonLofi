"""Trace the owner's single-direction character strips (0N_*_character_reference.png) and the large single references
(Thiên Binh, Tiên Nữ, Nhện Tinh) into ~50 px sprites at the world density.

Strips: dark background, figures in labelled groups. Figures are the tall connected components; labels and banners (short or wide)
are dropped. The cell size is picked per strip from the median figure height, so every figure lands near the target height.
Names come from GROUPS (left to right); if the count differs, the extra figures keep generic names.
Output: out/chars/<name>.png (one front frame), src/chars/<name>.json (grid source). Run: python trace_strips.py
"""
import os, json
import numpy as np
from PIL import Image
from scipy import ndimage
from trace_sheet import (REFD, OUTD, SRCD, bg_colour, make_fg, regrid, palette_for, apply_palette, strip_bg_near, remove_grey_shadow,
                         clean, ink, crop, grid_source)

TARGET = 50
STRIPS = {
    '01_Phat_To_Ngu_Hanh_Son_character_reference.png': [('phat_to', 3), ('linh_son', 3), ('thien_binh_b', 3)],
    '02_Bach_Cot_Linh_character_reference.png': [('bach_cot_tinh', 4), ('yeu_binh', 3), ('yeu_thu', 1)],
    '03_Nu_Nhi_Quoc_character_reference.png': [('nu_vuong', 1), ('cung_nu', 4), ('thi_ve', 4)],
    '04_Ban_To_Dong_character_reference.png': [('nhen_tinh', 7), ('nhen_yeu', 2), ('ken', 2)],
    '05_Thong_Thien_Ha_character_reference.png': [('hang_nga', 2), ('thien_tuong', 3), ('thien_binh', 3), ('thuy_quan', 3)],
    '06_Loi_Am_Tu_character_reference.png': [('tru_tri', 3), ('hoa_thuong', 3), ('tieu_hoa_thuong', 3), ('ho_phap', 3)],
}
SINGLES = {'Thiên Binh.png': ('thien_binh_lon', 54), 'Tiên Nữ.png': ('tien_nu', 54), 'Nhện TInh.png': ('nhen_tinh_lon', 64)}


def save_one(name, f, label):
    os.makedirs(OUTD, exist_ok=True); os.makedirs(SRCD, exist_ok=True)
    Image.fromarray(f, 'RGBA').save(os.path.join(OUTD, name + '.png'))
    src = grid_source(name, [f], label); src['frames'][0]['name'] = name + '-front'
    with open(os.path.join(SRCD, name + '.json'), 'w', encoding='utf-8') as fh: json.dump(src, fh, ensure_ascii=False, indent=1)


def trace_strip(file, groups):
    """figures = the band spanned by tall components (labels sit below it); the band is split into the known number of figures."""
    from trace_sheet import segment_row
    img = np.asarray(Image.open(os.path.join(REFD, file)).convert('RGB')).astype(float)
    img = img[:int(img.shape[0] * 0.86)]
    bg = bg_colour(img); fg = make_fg(img, bg, 45)
    lab, n = ndimage.label(ndimage.binary_dilation(fg, iterations=2))
    objs = ndimage.find_objects(lab)
    hs = [sl[0].stop - sl[0].start for sl in objs]
    hmax = max(hs)
    tall = [sl for sl, h in zip(objs, hs) if h > 0.45 * hmax and (sl[1].stop - sl[1].start) < 6 * h]
    y0 = int(np.median([sl[0].start for sl in tall])) - 6; y1 = int(np.median([sl[0].stop for sl in tall])) + 4
    y0 = max(0, min(y0, min(sl[0].start for sl in tall)))
    band = fg[y0:y1]
    want = sum(k for _, k in groups)
    segs = segment_row(band, want)
    hfig = float(np.median([sl[0].stop - sl[0].start for sl in tall]))
    p = hfig / TARGET
    out = []
    for gi, (g, k) in enumerate(groups):
        frames = []
        for j in range(k):
            idx = sum(kk for _, kk in groups[:gi]) + j
            if idx >= len(segs): break
            sx0, sx1 = segs[idx]
            m = band[:, sx0:sx1].copy()
            l2, n2 = ndimage.label(ndimage.binary_dilation(m, iterations=2))
            if n2 > 1:
                sz = ndimage.sum(m, l2, range(1, n2 + 1)); keep = [i + 1 for i, v in enumerate(sz) if v >= 0.1 * sz.max()]; m &= np.isin(l2, keep)
            frames.append(regrid(img[y0:y1, sx0:sx1], m, p))
        if not frames: continue
        pal = palette_for(frames)
        frames = [crop(ink(clean(strip_bg_near(apply_palette(f, pal), bg)))) for f in frames]
        # groups of 3 are one character seen from the front, the side and the back; other groups are separate figures
        if k == 3:
            save_multi(g, frames); out.append((g, frames[0].shape))
        else:
            for j, f in enumerate(frames):
                nm = g if k == 1 else '%s_%d' % (g, j + 1); save_one(nm, f, nm); out.append((nm, f.shape))
    return out


def save_multi(name, frames):
    os.makedirs(OUTD, exist_ok=True); os.makedirs(SRCD, exist_ok=True)
    src = grid_source(name, frames, name)
    for fr, d in zip(src['frames'], ('front', 'side', 'back')): fr['name'] = name + '-' + d
    with open(os.path.join(SRCD, name + '.json'), 'w', encoding='utf-8') as fh: json.dump(src, fh, ensure_ascii=False, indent=1)
    W = sum(f.shape[1] + 4 for f in frames); H = max(f.shape[0] for f in frames)
    strip = Image.new('RGBA', (W, H), (0, 0, 0, 0)); x = 0
    for f in frames: strip.alpha_composite(Image.fromarray(f, 'RGBA'), (x, H - f.shape[0])); x += f.shape[1] + 4
    strip.save(os.path.join(OUTD, name + '.png'))


def trace_single(file, name, target):
    img = np.asarray(Image.open(os.path.join(REFD, file)).convert('RGB')).astype(float)
    bg = bg_colour(img); fg = make_fg(img, bg, 50)
    lab, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, lab, range(1, n + 1)); main = int(np.argmax(sizes)) + 1
    sl = ndimage.find_objects(lab)[main - 1]
    m = (lab[sl] == main)
    p = (sl[0].stop - sl[0].start) / target
    f = regrid(img[sl], m, p)
    f = crop(ink(clean(remove_grey_shadow(strip_bg_near(apply_palette(f, palette_for([f])), bg), bg))))
    save_one(name, f, name)
    return f.shape


if __name__ == '__main__':
    for f, groups in STRIPS.items():
        res = trace_strip(f, groups)
        print(f[:24], len(res), ' '.join('%s:%dx%d' % (n, s[1], s[0]) for n, s in res))
    for f, (name, t) in SINGLES.items():
        s = trace_single(f, name, t); print(name, s[1], 'x', s[0])
