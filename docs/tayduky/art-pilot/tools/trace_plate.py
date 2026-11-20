"""Trace a scene reference into a clean pixel "plate" at the characters' density.

The cell size is chosen so the scene's own figures match the traced character sheets (about 50 px tall). Each cell takes the colour at its
centre (vectorised nearest sampling at a crisp phase), then the plate is mapped to a shared scene palette (median cut, 96 colours) so
the blur halos collapse into clean clusters. Output: out/plates/<name>.png
Run: python trace_plate.py
"""
import os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REFD = r'E:\game\web-lofi\references\tayduky\ref'
OUTD = os.path.join(HERE, '..', 'out', 'plates')

PLATES = {
    # name: (file, crop box or None, cell size)
    'hoa-qua-son': ('hoa quả sơn.png', None, 1.7),
    'cao-lao-trang': ('tổng hợp - nam thiên môn - động bàn tơ - cao lão trang.png', (732, 566, 1536, 1024), 1.0),
    'hqs-clean': ('Hoa Quả Sơn - không nhân vật.png', None, 1.7),
    'clt-full': ('cao lão tarng 1672x941.png', None, 1.25),
}


def plate(file, box, p, colours=96):
    im = Image.open(os.path.join(REFD, file)).convert('RGB')
    if box: im = im.crop(box)
    a = np.asarray(im).astype(int)
    H, W = a.shape[:2]
    best = None
    for ph in np.linspace(0, p, 5, endpoint=False):
        ys = np.clip((ph + np.arange(int((H - ph) // p)) * p + p / 2).astype(int), 0, H - 1)
        xs = np.clip((ph + np.arange(int((W - ph) // p)) * p + p / 2).astype(int), 0, W - 1)
        g = a[ys][:, xs]
        s = np.abs(np.diff(g, axis=0)).mean() + np.abs(np.diff(g, axis=1)).mean()
        if best is None or s > best[0]: best = (s, g)
    g = Image.fromarray(best[1].astype(np.uint8), 'RGB')
    return g.quantize(colors=colours, method=Image.Quantize.MEDIANCUT, kmeans=2).convert('RGB')


if __name__ == '__main__':
    os.makedirs(OUTD, exist_ok=True)
    for name, (f, box, p) in PLATES.items():
        g = plate(f, box, p); g.save(os.path.join(OUTD, name + '.png')); print(name, g.size)
