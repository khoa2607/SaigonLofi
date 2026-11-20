"""Step 1: the cast lineup (uses wukong/eyes/hair from characters.py). Run: python cast.py -> ../out/step1-*.png and ../src/*.json"""
import os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from px import Canvas, R, OUT, hx, zoom, save_source
from characters import wukong, eyes, hair

HERE = os.path.dirname(os.path.abspath(__file__))
OUTD = os.path.join(HERE, '..', 'out'); os.makedirs(OUTD, exist_ok=True)


def crescent(c, cx, cy, r, rmp, cut_dy=-1.6, inner=0.72):
    m = Canvas.m_ell(cx, cy, r, r * 0.8) - Canvas.m_ell(cx, cy + cut_dy, r * inner, r * inner * 0.86)
    c.fill(m, rmp, Canvas.sh_sphere(cx, cy, r, r * 0.8))


def bajie():
    c = Canvas(36, 48)
    # rake: shaft + nine-tooth head
    c.rect(5, 9, 8, 46, R['dark'], shade=Canvas.sh_cyl(5, 8))
    c.rect(1, 3, 14, 7, R['steel'], hi=True)
    for x in range(2, 14, 3): c.rect(x, 7, x + 1, 11, R['steel'], shade=Canvas.sh_cyl(x, x + 1), ink=False)
    c.line(3, 4, 12, 4, R['gold'][3]); c.rect(5, 12, 8, 13, R['gold'], shade=Canvas.sh_cyl(5, 8))
    # legs: puffy brown trousers, white wraps, dark shoes with gold
    c.ell(14, 39.5, 3.6, 3.2, R['brown']); c.ell(22, 39.5, 3.6, 3.2, R['brown'])
    c.rect(12, 42, 15, 44, R['white']); c.rect(20, 42, 23, 44, R['white'])
    c.rect(11, 44, 16, 46, R['dark']); c.rect(19, 44, 24, 46, R['dark'])
    c.dots([(12, 45), (20, 45)], R['gold'][3])
    # open dark robe with gold trim, round belly
    c.poly([(7, 23), (29, 23), (32, 39), (4, 39)], R['plum'])
    c.line(10, 24, 7, 38, R['gold'][2]); c.line(26, 24, 29, 38, R['gold'][1])
    c.ell(18, 31.5, 7.4, 7.2, R['pskin'])
    c.dots([(18, 33), (18, 34)], R['pskin'][1])
    c.rect(11, 36, 25, 37, R['red'])
    c.poly([(16, 37), (20, 37), (21, 42), (15, 42)], R['red'])
    c.ell(11.5, 38, 2.4, 2.4, R['gold']); c.ell(11.5, 35.3, 1.4, 1.2, R['gold'])
    c.ell(29, 30, 2.4, 2.0, R['cream'])
    # arms: left on the rake, right resting on the belly
    c.poly([(8, 24), (12, 25), (10, 31), (5, 30)], R['plum']); c.ell(7.5, 29, 2.6, 2.4, R['pskin'])
    c.poly([(26, 24), (31, 26), (28, 32), (24, 30)], R['plum']); c.ell(24.5, 31.5, 2.6, 2.2, R['pskin'])
    # scarf
    c.poly([(11, 21), (25, 21), (22, 26), (14, 26)], R['red']); c.ell(18, 24.5, 2.2, 1.6, R['red'])
    # head: big pig face, floppy ears, black cap with a gold band
    c.ell(18, 14.5, 10.0, 8.6, R['pskin'])
    c.poly([(9, 10), (4, 13), (6, 18), (11, 15)], R['pskin']); c.poly([(27, 10), (32, 13), (30, 18), (25, 15)], R['pskin'])
    c.ell(18, 7.5, 8.6, 4.4, R['dark'])
    c.line(10, 9, 26, 9, R['gold'][3]); c.ell(18, 8.8, 2.2, 1.5, R['gold'])
    c.ell(18, 18.2, 3.6, 2.5, R['pink'])
    c.dots([(17, 18), (19, 18)], R['pink'][0])
    c.dots([(13, 13), (14, 13), (22, 13), (23, 13)], OUT)
    c.dots([(13, 15), (14, 15), (22, 15), (23, 15)], OUT); c.dots([(14, 14), (22, 14)], hx('#fff6e8')); c.dots([(13, 14), (23, 14)], hx('#3a2418'))
    c.dots([(16, 21), (17, 21), (18, 21), (19, 21), (20, 21)], R['red'][1])
    c.put(20, 20, R['white'][3])
    c.dots([(11, 17), (25, 17)], R['pink'][3])
    c.outline(); c.clean()
    return c


def shaseng():
    c = Canvas(32, 48)
    c.rect(5, 8, 8, 44, R['dark'], shade=Canvas.sh_cyl(5, 8))
    crescent(c, 6.5, 4.8, 6.2, R['steel'], cut_dy=-3.2, inner=0.62)
    c.rect(4, 8, 9, 10, R['gold'], shade=Canvas.sh_cyl(4, 9))
    c.ell(3, 11.5, 1.2, 1.4, R['gold']); c.ell(10, 11.5, 1.2, 1.4, R['gold'])
    c.poly([(5, 44), (8, 44), (6.5, 47.5)], R['steel'])
    c.rect(11, 37, 15, 41, R['dark']); c.rect(17, 37, 21, 41, R['dark'])
    c.rect(11, 41, 15, 43, R['white']); c.rect(17, 41, 21, 43, R['white'])
    c.rect(10, 43, 15, 46, R['brown']); c.rect(17, 43, 22, 46, R['brown'])
    c.poly([(9, 23), (23, 23), (25, 38), (7, 38)], R['teal'])
    c.poly([(12, 24), (20, 24), (17, 32), (15, 32)], R['white'])
    c.rect(9, 31, 23, 32, R['red']); c.poly([(15, 32), (18, 32), (19, 38), (14, 38)], R['red'])
    c.poly([(7, 22), (25, 22), (26, 27), (6, 27)], R['cream'])
    c.ell(10, 34, 2.4, 2.6, R['gold']); c.ell(10, 31.5, 1.3, 1.1, R['gold'])
    c.poly([(7, 24), (11, 25), (10, 30), (5, 29)], R['teal']); c.ell(7.5, 28.5, 2.4, 2.2, R['skin'])
    c.poly([(22, 25), (26, 24), (27, 30), (23, 30)], R['teal']); c.rect(23, 29, 27, 30, R['white'], ink=False)
    c.ell(25, 32, 2.3, 2.1, R['skin'])
    c.ell(7.5, 16, 3.0, 4.2, R['beard']); c.ell(24.5, 16, 3.0, 4.2, R['beard'])
    c.ell(16, 13.5, 8.2, 8.4, R['skin'])
    c.poly([(9, 17), (23, 17), (23, 21), (19, 26), (13, 26), (9, 21)], R['beard'])
    c.dots([(14, 21), (15, 21), (16, 21), (17, 21)], R['beard'][0])
    for (x, y) in [(8, 23), (10, 25.5), (13, 27), (16, 27.6), (19, 27), (22, 25.5), (24, 23)]: c.ell(x, y, 1.7, 1.6, R['brown'])
    c.line(8, 10, 24, 10, R['gold'][3]); c.line(8, 11, 24, 11, R['gold'][1])
    crescent(c, 16, 9.6, 2.6, R['gold'], cut_dy=-1.2)
    c.dots([(11, 13), (12, 13), (13, 13), (14, 14)], R['beard'][1]); c.dots([(21, 13), (20, 13), (19, 13), (18, 14)], R['beard'][1])
    eyes(c, 14, 12, 18, hx('#3a2418'))
    c.dots([(15, 17), (16, 17), (17, 17)], R['skin'][1])
    c.line(20, 12, 22, 15, R['red'][2])
    c.outline(); c.clean()
    return c


def tamtang():
    c = Canvas(40, 60)
    c.rect(4, 9, 6, 57, R['brown'], shade=Canvas.sh_cyl(4, 6))
    c.ell(5, 5, 3.6, 4.0, R['gold']); c.ell(5, 5, 1.6, 2.0, R['gold'], ink=False, bias=-0.5)
    c.ell(1.5, 8.5, 1.5, 1.6, R['gold']); c.ell(8.5, 8.5, 1.5, 1.6, R['gold'])
    # white horse: body behind, legs, hooves
    c.ell(20, 45, 12.5, 7.5, R['white'])
    for x in (15, 22): c.rect(x, 50, x + 2, 56, R['silk'])
    for x in (11, 26): c.rect(x, 48, x + 3, 56, R['white'])
    for x in (11, 26): c.rect(x, 56, x + 3, 58, R['brown'])
    # monk's robe: red kasaya with a gold grid over a cream robe
    c.poly([(10, 20), (30, 20), (34, 38), (6, 38)], R['red'])
    for x in (13, 20, 27): c.line(x, 21, x - 1, 37, R['gold'][2])
    c.line(8, 29, 32, 29, R['gold'][1])
    c.poly([(16, 20), (24, 20), (22, 30), (18, 30)], R['cream'])
    c.ell(7, 37, 2.6, 1.6, R['dark']); c.ell(33, 37, 2.6, 1.6, R['dark'])
    c.rect(30, 16, 36, 24, R['brown']); c.ell(33, 15.5, 3.2, 1.6, R['cream'])
    # horse head in front: ears, forelock, long face, muzzle, bridle
    c.poly([(14, 38), (16, 32), (18, 38)], R['white']); c.poly([(22, 38), (24, 32), (26, 38)], R['white'])
    c.poly([(15, 37), (25, 37), (24, 50), (16, 50)], R['white'], shade=Canvas.sh_cyl(15, 25))
    c.ell(20, 50.5, 4.8, 3.4, R['white'], bias=0.1)
    c.poly([(16, 37), (20, 34), (24, 37), (20, 41)], R['cream'], bias=0.2)
    c.dots([(16, 42), (17, 42), (23, 42), (24, 42)], OUT); c.dots([(17, 43), (23, 43)], OUT)
    c.line(15, 46, 25, 46, R['red'][2]); c.line(16, 40, 16, 46, R['red'][2]); c.line(24, 40, 24, 46, R['red'][2])
    c.ell(20, 46, 1.4, 1.2, R['gold'])
    c.dots([(18, 52), (22, 52)], R['white'][0])
    c.poly([(11, 21), (16, 21), (19, 26), (13, 27)], R['cream']); c.poly([(24, 21), (29, 21), (27, 27), (21, 26)], R['cream'])
    c.ell(20, 25, 2.0, 2.6, R['skin'])
    c.rect(11, 11, 13, 25, R['white']); c.rect(27, 11, 29, 25, R['white'])
    c.ell(20, 13.5, 7.0, 7.2, R['skin'])
    c.poly([(12, 9), (13, 2), (16, 5), (18, 0), (20, 3), (22, 0), (24, 5), (27, 2), (28, 9)], R['red'], hi=True)
    c.line(12, 9, 28, 9, R['gold'][3]); c.line(12, 10, 28, 10, R['gold'][1])
    for x in (14, 18, 22, 26): c.line(x, 5, x, 8, R['gold'][2])
    c.ell(20, 7, 1.3, 1.3, R['red']); c.put(20, 7, R['red'][4])
    c.dots([(16, 12), (17, 12), (23, 12), (24, 12)], OUT)
    eyes(c, 13, 16, 23, hx('#5a3420'))
    c.put(20, 11, R['red'][2])
    c.dots([(19, 18), (20, 18), (21, 18)], R['skin'][0])
    for (x, y) in [(15, 21), (17, 22.8), (20, 23.4), (23, 22.8), (25, 21)]: c.ell(x, y, 1.3, 1.3, R['brown'], ink=False)
    c.outline(); c.clean()
    return c


def monkey():
    c = Canvas(20, 22)
    for (x, y, r) in [(14, 18, 1.4), (16, 17, 1.4), (17, 15, 1.4), (16, 13, 1.3)]: c.ell(x, y, r, r, R['fur'], hi=False, ink=False)
    c.ell(10, 15.5, 4.6, 4.4, R['fur'])
    c.ell(7, 20, 1.8, 1.2, R['fur']); c.ell(13, 20, 1.8, 1.2, R['fur'])
    c.ell(10, 16.5, 2.4, 2.4, R['skin'])
    c.ell(10, 8, 5.4, 5.0, R['fur'])
    c.ell(4.6, 8.5, 1.6, 1.8, R['skin']); c.ell(15.4, 8.5, 1.6, 1.8, R['skin'])
    c.poly([(7, 7), (13, 7), (13, 11), (10, 13), (7, 11)], R['skin'], shade=Canvas.sh_sphere(10, 9, 4, 4))
    c.ell(14, 14, 1.8, 1.7, R['pink'], bias=0.15); c.put(14, 12, R['green'][3])
    c.dots([(8, 8), (12, 8), (8, 9), (12, 9)], OUT)
    c.dots([(9, 11), (10, 11), (11, 11)], R['skin'][0])
    c.outline(); c.clean()
    return c


def soldier():
    c = Canvas(32, 48)
    c.rect(24, 4, 26, 46, R['brown'], shade=Canvas.sh_cyl(24, 26))
    c.poly([(23, 6), (25, -1), (27, 6)], R['steel'], hi=True)
    c.ell(25, 8.5, 2.6, 1.8, R['red'])
    c.rect(11, 36, 15, 41, R['sky']); c.rect(17, 36, 21, 41, R['sky'])
    c.rect(10, 41, 15, 46, R['dark']); c.rect(17, 41, 22, 46, R['dark'])
    c.poly([(9, 22), (23, 22), (24, 37), (8, 37)], R['sky'])
    c.poly([(10, 22), (22, 22), (22, 31), (10, 31)], R['gold'])
    for y in (24, 26, 28, 30):
        for x in range(11, 22, 2): c.put(x + (y // 2) % 2, y, R['gold'][1])
    c.ell(16, 27, 2.8, 2.2, R['steel'])
    c.rect(8, 31, 24, 32, R['red'])
    c.poly([(8, 32), (15, 32), (14, 38), (8, 37)], R['gold']); c.poly([(17, 32), (24, 32), (24, 37), (18, 38)], R['gold'])
    c.ell(8.5, 23.5, 3.4, 2.4, R['gold']); c.ell(23.5, 23.5, 3.4, 2.4, R['gold'])
    c.poly([(5, 24), (9, 25), (9, 31), (5, 30)], R['sky']); c.ell(7, 31.5, 2.2, 2.0, R['skin'])
    c.poly([(23, 25), (27, 24), (27, 30), (24, 30)], R['sky']); c.ell(25, 29.5, 2.3, 2.1, R['skin'])
    c.ell(16, 15, 7.6, 7.4, R['skin'])
    c.poly([(8, 13), (9, 6), (16, 3), (23, 6), (24, 13), (24, 18), (21, 15), (11, 15), (8, 18)], R['gold'], hi=True)
    c.line(9, 12, 23, 12, R['sky'][2]); c.line(9, 13, 23, 13, R['sky'][1])
    c.poly([(14, 4), (16, -1), (21, 1), (18, 5)], R['red'])
    c.ell(16, 7.5, 1.4, 1.4, R['sky'])
    c.dots([(12, 15), (13, 15), (19, 15), (20, 15)], OUT)
    eyes(c, 16, 12, 18, hx('#3a2418'))
    c.dots([(15, 20), (16, 20), (17, 20)], R['skin'][0])
    c.outline(); c.clean()
    return c


def fairy():
    c = Canvas(32, 48)
    c.poly([(4, 18), (8, 24), (6, 34), (2, 40), (5, 42), (9, 34), (11, 26)], R['jade'])
    c.poly([(28, 18), (24, 24), (27, 31), (30, 37), (27, 38), (23, 31), (21, 25)], R['jade'])
    c.poly([(10, 30), (22, 30), (26, 46), (6, 46)], R['pink'])
    c.poly([(12, 30), (20, 30), (21, 46), (11, 46)], R['white'])
    c.line(13, 34, 12, 45, R['white'][1]); c.line(18, 34, 19, 45, R['white'][1])
    c.rect(9, 44, 23, 46, R['pink'])
    c.poly([(11, 21), (21, 21), (22, 31), (10, 31)], R['white'])
    c.poly([(10, 21), (14, 21), (12, 31), (9, 31)], R['pink']); c.poly([(18, 21), (22, 21), (23, 31), (20, 31)], R['pink'])
    c.rect(10, 29, 22, 30, R['gold'])
    c.poly([(8, 22), (12, 23), (13, 30), (9, 31)], R['white']); c.poly([(20, 23), (24, 22), (23, 31), (19, 30)], R['white'])
    c.ell(16, 32, 5.2, 3.0, R['brown'])
    c.ell(14, 30.4, 1.7, 1.5, R['pink'], bias=0.2); c.ell(17.6, 30.2, 1.7, 1.5, R['pink'], bias=0.2)
    c.dots([(15, 29), (18, 29)], R['green'][3])
    c.ell(16, 13.5, 7.4, 7.2, R['skin'])
    c.ell(9.5, 5, 2.8, 2.6, R['beard']); c.ell(22.5, 5, 2.8, 2.6, R['beard'])
    c.poly([(8, 13), (9, 6), (16, 4), (23, 6), (24, 13), (24, 19), (22, 12), (10, 12), (8, 19)], R['beard'], hi=True)
    c.line(16, 5, 16, 11, R['beard'][0])
    c.ell(22, 8, 1.4, 1.3, R['pink']); c.ell(10, 8, 1.2, 1.1, R['gold'])
    c.dots([(12, 13), (13, 13), (19, 13), (20, 13)], R['beard'][1])
    eyes(c, 14, 12, 18, hx('#4a2a3a'))
    c.dots([(11, 17), (21, 17)], R['pink'][3])
    c.dots([(15, 18), (16, 18)], R['red'][2])
    c.put(16, 10, R['red'][2])
    c.outline(); c.clean()
    return c


def spider_sister():
    c = Canvas(32, 48)
    for pts in ([(10, 24), (4, 14), (2, 20)], [(9, 27), (2, 24), (1, 31)], [(22, 24), (28, 14), (30, 20)], [(23, 27), (30, 24), (31, 31)]):
        a, b, e = pts
        c.fill(Canvas.m_line(a[0], a[1], b[0], b[1], 2) | Canvas.m_line(b[0], b[1], e[0], e[1], 2), R['violet'], Canvas.sh_flat(3))
    c.poly([(10, 22), (22, 22), (26, 46), (6, 46)], R['violet'])
    for (x0, y0, x1, y1) in [(16, 30, 9, 44), (16, 30, 23, 44), (16, 30, 16, 45), (11, 38, 21, 38), (10, 42, 22, 42)]: c.line(x0, y0, x1, y1, R['silk'][2])
    c.rect(10, 29, 22, 30, R['jade'])
    c.poly([(12, 22), (20, 22), (18, 29), (14, 29)], R['silk'])
    c.poly([(8, 23), (12, 23), (12, 31), (8, 31)], R['violet']); c.poly([(20, 23), (24, 23), (24, 31), (20, 31)], R['violet'])
    c.ell(9.5, 32, 2.0, 1.9, R['white']); c.ell(22.5, 32, 2.0, 1.9, R['white'])
    c.line(10, 33, 14, 40, R['silk'][3]); c.line(22, 33, 18, 40, R['silk'][3]); c.line(14, 40, 18, 40, R['silk'][3])
    c.ell(16, 13.5, 7.4, 7.2, R['white'])
    c.ell(16, 4.5, 4.0, 3.0, R['beard'])
    c.poly([(8, 14), (9, 7), (16, 5), (23, 7), (24, 14), (25, 22), (22, 13), (10, 13), (7, 22)], R['beard'], hi=True)
    c.line(12, 3, 21, 6, R['silk'][3]); c.ell(21.5, 6, 1.0, 1.0, R['jade'])
    c.dots([(12, 13), (13, 13), (19, 13), (20, 13)], R['beard'][1])
    eyes(c, 14, 12, 18, R['jade'][4])
    c.dots([(15, 18), (16, 18)], R['plum'][3])
    c.outline(); c.clean()
    return c


CHARS = [('wukong', wukong), ('bajie', bajie), ('shaseng', shaseng), ('tamtang', tamtang),
         ('monkey', monkey), ('soldier', soldier), ('fairy', fairy), ('spider_sister', spider_sister)]


def lineup(ims, path, k=5):
    pad, base = 6, 60
    w = sum(im.width + pad for im in ims) + pad
    sheet = Image.new('RGBA', (w * k, base * 2 * k), (0, 0, 0, 255))
    for row, bg in enumerate([(238, 228, 210), (38, 32, 44)]):
        band = Image.new('RGBA', (w * k, base * k), bg + (255,))
        x = pad
        for im in ims:
            y = base - 3 - im.height
            sh = Image.new('RGBA', (im.width, 6), (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse((im.width // 2 - 8, 0, im.width // 2 + 8, 5), fill=(30, 20, 30, 70))
            band.alpha_composite(zoom(sh, k), (x * k, (base - 7) * k))
            band.alpha_composite(zoom(im, k), (x * k, y * k))
            x += im.width + pad
        sheet.alpha_composite(band, (0, row * base * k))
    sheet.save(path)


def build():
    return {n: f() for n, f in CHARS}


if __name__ == '__main__':
    cs = build()
    ims = [cs[n].image() for n, _ in CHARS]
    lineup(ims, os.path.join(OUTD, 'step1-characters.png'))
    native = Image.new('RGBA', (sum(i.width for i in ims), max(i.height for i in ims)), (0, 0, 0, 0))
    x = 0
    for im in ims: native.alpha_composite(im, (x, native.height - im.height)); x += im.width
    native.save(os.path.join(OUTD, 'step1-characters-native.png'))
    os.makedirs(os.path.join(HERE, '..', 'src'), exist_ok=True)
    for n, c in cs.items():
        save_source(os.path.join(HERE, '..', 'src', n + '.json'), [c.grid(n)], [c.w, c.h], [c.w // 2, c.h - 2])
    print('ok')
