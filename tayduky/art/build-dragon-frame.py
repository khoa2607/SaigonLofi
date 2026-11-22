"""Builds tayduky/art/dragon-frame.webp from the supplied Reference A (docs/tayduky/v3/reference/ref-a-dragon-ui.png).
1. White background -> transparent (large near-white components, including enclosed pockets such as the whisker curls).
2. Edge pixels are un-matted from white (alpha + colour recovery) so there is no white halo.
3. The plaque interior (green board, title and the 15 baked buttons) is knocked out, keeping the gold frame and the four corner
   ornaments, so the real DOM board shows through. The dragon, clouds, mountains and pagoda stay as one static layer.
No generation, no animation. Run from the repo root: python tayduky/art/build-dragon-frame.py"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = 'docs/tayduky/v3/reference/ref-a-dragon-ui.png'
im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
mn = im.min(axis=2)
cand = mn >= 247                                    # pure paper white (255,254,254); scale highlights stay below this
lab, n = ndi.label(cand)
sizes = ndi.sum(cand, lab, range(1, n + 1))
bg = np.zeros_like(cand)
for i, s in enumerate(sizes, 1):
    if s >= 120: bg |= lab == i
bg = ndi.binary_opening(bg, iterations=1) | (bg & ~ndi.binary_erosion(bg))   # keep the edge of the region, drop speckles
fg = ~bg
fg = ndi.binary_opening(fg, iterations=1)           # remove isolated specks left in the paper
inner = ndi.binary_erosion(fg, iterations=2)        # trusted foreground colour
dist, (iy, ix) = ndi.distance_transform_edt(~inner, return_indices=True)
f = im[iy, ix]                                      # nearest trusted fg colour for every pixel
edge = fg & ~inner
alpha = np.where(fg, 1.0, 0.0).astype(np.float32)
d = 255.0 - f; c = 255.0 - im
a = (c * d).sum(2) / np.maximum((d * d).sum(2), 1.0)
alpha[edge] = np.clip(a[edge], 0, 1)
alpha[alpha < 0.08] = 0
rgb = im.copy()
m = edge & (alpha > 0)
rgb[m] = np.clip((im[m] - (1 - alpha[m, None]) * 255.0) / alpha[m, None], 0, 255)
# knock out the plaque interior (orig px), keep four 46px corner ornaments
x0, x1, y0, y1, k = 112, 856, 168, 518, 46
hole = np.zeros((H, W), bool); hole[y0:y1, x0:x1] = True
kb = 20                                              # the lower ornaments sit lower in the art: keep them shallow so the last button row is not overdrawn
for (cx, cy, kk) in [(x0, y0, k), (x1 - k, y0, k), (x0, y1 - kb, kb), (x1 - kb, y1 - kb, kb)]: hole[cy:cy + kk, cx:cx + kk] = False
alpha[hole] = 0
out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
img = Image.fromarray(out, 'RGBA')
img.save('tayduky/art/dragon-frame.webp', lossless=True, quality=100, method=6)
img.save('tayduky/art/dragon-frame.png', optimize=True)
# preview on a checkerboard + on the map colour, for review
chk = Image.new('RGBA', (W, H)); px = chk.load()
for y in range(H):
    for x in range(W): px[x, y] = (200, 200, 200, 255) if ((x // 16 + y // 16) & 1) else (120, 120, 120, 255)
chk.alpha_composite(img); chk.convert('RGB').save('docs/tayduky/v3/screenshots/ui/dragon-art-transparent-preview.png')
print('alpha coverage', float((alpha > 0).mean()))
