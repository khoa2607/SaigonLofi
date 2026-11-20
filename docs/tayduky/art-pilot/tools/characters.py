"""Step 1: character lineup. In-game sprites, 3/4 top-down front view (as in references/tayduky/ref/topdown character.png).
Canvas 32 x 48 per character (pivot at the feet: 16, 46). Run: python characters.py  -> ../out/
"""
import os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from px import Canvas, R, OUT, hx, zoom, save_source

W, H = 32, 48
HERE = os.path.dirname(os.path.abspath(__file__))
OUTD = os.path.join(HERE, '..', 'out'); os.makedirs(OUTD, exist_ok=True)


def eyes(c, y, xl, xr, iris, style='normal'):
    """chibi eyes: 2 px wide, 3 rows: lid (outline), iris, iris with glint."""
    for x0 in (xl, xr):
        c.dots([(x0, y), (x0 + 1, y)], OUT)
        c.dots([(x0, y + 1), (x0 + 1, y + 1)], iris)
        c.put(x0 + (1 if x0 == xl else 0), y + 1, hx('#fff6e8'))
        c.dots([(x0, y + 2), (x0 + 1, y + 2)], OUT if style == 'normal' else iris)


def hair(c, tufts, rmp):
    """wide flame tufts: (base left, base right, tip); each tuft shaded on its own with a dark crease on its right side."""
    for bl, br, tip in tufts:
        m = c.poly([bl, tip, br], rmp, hi=True)
        mx = (bl[0] + br[0]) / 2
        c.line(round(mx + 1), round((bl[1] + br[1]) / 2) - 1, round((mx + tip[0]) / 2 + 1), round((bl[1] + tip[1]) / 2), rmp[1])


def wukong():
    c = Canvas(W, H)
    # cape behind, blown to the left
    c.poly([(10, 22), (22, 22), (24, 30), (21, 39), (10, 41), (1, 40), (4, 36), (2, 33), (6, 30), (8, 25)], R['red'])
    c.line(5, 33, 9, 38, R['red'][1]); c.line(3, 38, 8, 40, R['red'][1])
    # tail curling on the right
    for (x, y, r) in [(21, 37, 1.6), (23, 38, 1.6), (25, 37, 1.6), (27, 35, 1.6), (28, 32, 1.6), (27, 29, 1.6), (25, 28, 1.4)]:
        c.ell(x, y, r, r, R['fur'], hi=False, ink=False)
    # legs and boots
    c.rect(12, 37, 15, 41, R['dark']); c.rect(17, 37, 20, 41, R['dark'])
    c.rect(11, 41, 15, 46, R['dark']); c.rect(17, 41, 21, 46, R['dark'])
    c.rect(11, 41, 15, 42, R['gold'], ink=False); c.rect(17, 41, 21, 42, R['gold'], ink=False)
    c.dots([(11, 45), (12, 45), (17, 45), (18, 45)], R['gold'][2])
    # armoured torso
    c.poly([(10, 24), (22, 24), (23, 33), (9, 33)], R['dark'], hi=True)
    c.line(11, 27, 16, 30, R['gold'][2]); c.line(21, 27, 16, 30, R['gold'][1])          # gold V trim
    c.line(10, 33, 22, 33, R['red'][2])                                                 # red sash
    # tiger-skin skirt with white fur fringe
    c.poly([(9, 32), (23, 32), (24, 38), (8, 38)], R['tiger'])
    for x in range(9, 24, 3): c.line(x, 33, x - 1, 37, R['tiger'][0])
    for x in range(8, 25, 2): c.ell(x + .5, 38.5, 1.3, 1.1, R['white'], hi=False, ink=False)
    c.ell(16, 32, 2.2, 1.8, R['gold'])                                                  # cloud buckle
    c.poly([(15, 33), (17, 33), (18, 39), (14, 39)], R['red'])                          # sash tails
    # arms: left holds the staff, right fist down
    c.poly([(9, 25), (12, 26), (10, 31), (6, 30)], R['dark'])
    c.poly([(21, 26), (24, 25), (26, 31), (22, 31)], R['dark'])
    c.rect(22, 30, 26, 31, R['gold'], ink=False)
    c.ell(24.5, 33, 2.1, 2.0, R['skin'])
    # staff (4 px incl. outline, gold caps with a band)
    c.rect(5, 6, 8, 44, R['red'], shade=Canvas.sh_cyl(5, 8))
    c.rect(4, 3, 9, 9, R['gold'], shade=Canvas.sh_cyl(4, 9)); c.rect(4, 40, 9, 46, R['gold'], shade=Canvas.sh_cyl(4, 9))
    c.line(5, 7, 8, 7, R['gold'][1]); c.line(5, 42, 8, 42, R['gold'][1])
    c.rect(5, 20, 8, 21, R['gold'], shade=Canvas.sh_cyl(5, 8))
    c.ell(7.5, 28.5, 2.4, 2.2, R['skin'])                                               # hand on staff
    # shoulder pads
    c.ell(10, 25, 3.2, 2.2, R['gold']); c.ell(22.5, 25, 3.2, 2.2, R['gold'])
    # red scarf knot
    c.poly([(11, 21), (21, 21), (19, 25), (13, 25)], R['red']); c.ell(16, 23.5, 2.0, 1.6, R['red'])
    # head: furry round head, ears, heart-shaped face
    c.ell(16, 14.5, 9.4, 8.4, R['fur'])
    c.ell(6.4, 15.5, 2.1, 2.4, R['skin']); c.ell(25.6, 15.5, 2.1, 2.4, R['skin'])
    c.dots([(6, 15), (6, 16)], R['skin'][1]); c.dots([(25, 15), (25, 16)], R['skin'][1])
    c.poly([(11, 13), (14, 14), (16, 13), (18, 14), (21, 13), (22, 17), (20, 21), (12, 21), (10, 17)], R['skin'], shade=Canvas.sh_sphere(16, 16, 7, 6))
    # flame hair: tufts leaning right, each shaded on its own
    hair(c, [((5, 13), (11, 9), (4, 5)), ((8, 10), (15, 8), (9, 1)), ((12, 8), (20, 8), (16, -1)), ((17, 8), (24, 10), (24, 1)), ((21, 10), (28, 14), (29, 6))], R['fur'])
    # golden circlet (one curved row) with a swirl
    c.line(8, 12, 10, 11, R['gold'][2]); c.line(10, 11, 22, 11, R['gold'][3]); c.line(22, 11, 24, 12, R['gold'][2])
    c.ell(16, 10.3, 2.3, 1.6, R['gold'])
    c.dots([(15, 10), (17, 10)], R['gold'][1])
    # face details
    c.dots([(11, 14), (12, 14), (13, 15)], R['fur'][0]); c.dots([(21, 14), (20, 14), (19, 15)], R['fur'][0])   # fierce brows
    eyes(c, 15, 12, 18, hx('#a8302a'))
    c.put(16, 18, R['skin'][1])
    c.dots([(14, 19), (15, 20), (16, 20), (17, 19)], R['skin'][0])                    # smirk
    c.dots([(12, 19), (20, 19)], R['pink'][3])                                         # cheeks
    c.outline(); c.clean()
    return c


def render(chars):
    names = [n for n, _ in chars]
    ims = [f().image() if callable(f) else f for _, f in chars]
    return names, ims


def lineup(names, ims, path, k=6):
    pad = 4
    bgs = [(240, 230, 214), (40, 34, 46)]
    w = len(ims) * (W + pad) + pad
    sheet = Image.new('RGBA', (w * k, (H + pad) * 2 * k + 40), (24, 20, 28, 255))
    for row, bg in enumerate(bgs):
        band = Image.new('RGBA', (w * k, (H + pad) * k), bg + (255,))
        for i, im in enumerate(ims):
            x = pad + i * (W + pad)
            sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
            d.ellipse((8, 43, 24, 48), fill=(30, 20, 30, 70))
            band.alpha_composite(zoom(sh, k), (x * k, (pad // 2) * k))
            band.alpha_composite(zoom(im, k), (x * k, (pad // 2) * k))
        sheet.alpha_composite(band, (0, row * (H + pad) * k))
    sheet.save(path)


if __name__ == '__main__':
    chars = [('wukong', wukong)]
    cs = {n: f() for n, f in chars}
    ims = [cs[n].image() for n, _ in chars]
    lineup([n for n, _ in chars], ims, os.path.join(OUTD, 'step1-characters.png'))
    native = Image.new('RGBA', (len(ims) * W, H), (0, 0, 0, 0))
    for i, im in enumerate(ims): native.alpha_composite(im, (i * W, 0))
    native.save(os.path.join(OUTD, 'step1-characters-native.png'))
    save_source(os.path.join(HERE, '..', 'src-characters.json'), [cs[n].grid(n) for n, _ in chars], [W, H], [16, 46])
    print('ok')
