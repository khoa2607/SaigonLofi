"""Package the two test biomes for the browser pilot (docs/tayduky/pilot/).

Writes pilot/assets/<plate>.png, pilot/assets/chars/<name>.png (direction strips) and pilot/data.js (window.TD_DATA):
plate size, walkable zones (polygons; the runtime intersects them with ground colours), occluders (polygon + base line y: plate pixels of
the object are redrawn over characters whose feet are above the base), the cast and each strip's frame rectangles.
Also writes out/plates/<biome>-debug.png (zones in green, occluders in red) for authoring.
Run: python build_pilot.py
"""
import os, json, shutil
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
AP = os.path.join(HERE, '..')
PILOT = os.path.join(AP, '..', 'pilot'); ASSETS = os.path.join(PILOT, 'assets')

S = 1337 / 982.0          # Cao Lão Trang polygons are authored on the 982-wide preview, scaled to the 1337-wide plate


def sc(poly, k): return [[round(x * k), round(y * k)] for x, y in poly]


BIOMES = {
    'hoa-qua-son': {
        'title': ['Hoa Quả Sơn', 'Flower-Fruit Mountain'], 'plate': 'hqs-clean', 'k': 1.0, 'clouds': 4,
        'walk': [
            [[318, 262], [372, 214], [452, 176], [520, 182], [578, 214], [628, 262], [640, 302], [560, 344], [474, 342], [392, 302]],   # plaza
            [[392, 152], [440, 140], [470, 172], [440, 186], [404, 176]],                                                             # stairs up
            [[196, 100], [262, 84], [334, 104], [330, 140], [252, 152], [198, 130]],                                                   # upper left plateau
            [[112, 344], [196, 330], [252, 380], [336, 470], [312, 528], [226, 528], [120, 394]],                                      # lower left path
            [[690, 420], [760, 404], [866, 470], [864, 526], [770, 534], [702, 476]],                                                  # stepping stones
            [[600, 300], [650, 286], [700, 330], [660, 350], [610, 340]],                                                               # right ledge
            [[758, 128], [832, 114], [906, 140], [884, 168], [800, 162]],                                                               # cave terrace
        ],
        'occ': [
            ([[240, 0], [420, 0], [420, 112], [240, 112]], 112),          # top peach tree
            ([[0, 0], [116, 0], [116, 146], [0, 146]], 146),              # top-left tree
            ([[0, 216], [104, 216], [104, 306], [0, 306]], 306),          # mid-left tree
            ([[572, 192], [736, 192], [736, 334], [572, 334]], 334),      # big peach tree right of the plaza
            ([[548, 150], [604, 146], [612, 232], [544, 234]], 236, True),   # rune rock (solid)
            ([[0, 336], [204, 336], [204, 512], [0, 512]], 512),          # big peach tree bottom-left
            ([[496, 430], [626, 430], [626, 552], [496, 552]], 552),      # bottom tree
            ([[918, 282], [982, 282], [982, 396], [918, 396]], 396),      # right tree
            ([[324, 236], [416, 236], [416, 334], [324, 334]], 334),      # fence + palm left of the plaza
        ],
        'cast': [('wukong', 1), ('khi_chien_binh', 2), ('khi_lao', 1), ('khi_luc_si', 1), ('khi_con', 3), ('khi_giao', 2)],
    },
    'cao-lao-trang': {
        'title': ['Cao Lão Trang', "Old Gao's Village"], 'plate': 'clt-full', 'k': S, 'clouds': 0,
        'walk': [
            sc([[258, 168], [372, 128], [500, 150], [620, 168], [736, 186], [760, 214], [700, 246], [600, 276], [470, 284], [340, 268], [262, 226]], S),  # courtyard
            sc([[330, 362], [410, 350], [430, 380], [470, 552], [380, 552], [348, 420]], S),          # road from the gate
            sc([[0, 312], [120, 300], [250, 340], [348, 372], [340, 410], [240, 392], [120, 360], [0, 352]], S),  # west road
            sc([[440, 410], [560, 396], [660, 400], [760, 396], [760, 430], [640, 440], [520, 452], [450, 446]], S),  # east road to the bridge
            sc([[620, 470], [700, 450], [800, 430], [900, 404], [940, 430], [860, 470], [740, 500], [640, 510]], S),  # lane by the paddies
        ],
        'occ': [
            (sc([[60, 226], [210, 262], [330, 296], [450, 308], [600, 318], [690, 306], [906, 232], [944, 246], [944, 300], [690, 352], [440, 364], [330, 356], [60, 284]], S), round(352 * S)),  # front wall + gatehouse
            (sc([[330, 250], [450, 250], [450, 372], [330, 372]], S), round(372 * S)),               # gatehouse roof
            (sc([[300, 140], [380, 140], [380, 222], [300, 222]], S), round(222 * S)),               # courtyard tree
            (sc([[636, 176], [712, 176], [712, 254], [636, 254]], S), round(254 * S)),               # courtyard tree right
            (sc([[556, 196], [606, 196], [608, 262], [554, 262]], S), round(264 * S), True),          # well (solid)
            (sc([[360, 384], [470, 384], [470, 470], [360, 470]], S), round(470 * S)),               # tree by the road
            (sc([[20, 330], [130, 330], [130, 420], [20, 420]], S), round(420 * S)),                 # blossom tree
        ],
        'cast': [('bajie', 1), ('cao_thuy_lan', 1), ('cao_thai_cong', 1), ('linh_canh', 2), ('nong_phu', 3), ('dan_lang_nam', 2), ('dan_lang_nu', 3),
                 ('tamtang', 1), ('wukong', 1), ('shaseng', 1)],
    },
}

SIDE_LEFT = {'khi_chien_binh', 'khi_lao', 'khi_luc_si', 'khi_con', 'khi_giao'}     # monkey sheet: d2/d3 face left


def frames_of(strip):
    a = strip.split()[3]; W, H = strip.size
    cols = [any(a.getpixel((x, y)) for y in range(H)) for x in range(W)]
    segs, s = [], None
    for x, c in enumerate(cols + [False]):
        if c and s is None: s = x
        if not c and s is not None: segs.append((s, x)); s = None
    out = []
    for (x0, x1) in segs:
        bb = strip.crop((x0, 0, x1, H)).getbbox()
        out.append([x0 + bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]])
    return out


if __name__ == '__main__':
    os.makedirs(os.path.join(ASSETS, 'chars'), exist_ok=True)
    data = {'biomes': {}, 'chars': {}}
    used = set()
    for key, b in BIOMES.items():
        src = os.path.join(AP, 'out', 'plates', b['plate'] + '.png')
        shutil.copy(src, os.path.join(ASSETS, key + '.png'))
        im = Image.open(src)
        data['biomes'][key] = {'title': b['title'], 'plate': 'assets/%s.png' % key, 'size': im.size, 'walk': b['walk'],
                               'occ': [{'poly': o[0], 'base': o[1], 'solid': len(o) > 2 and o[2]} for o in b['occ']], 'cast': b['cast'], 'clouds': b.get('clouds', 0)}
        for n, _ in b['cast']: used.add(n)
        dbg = im.convert('RGBA'); ov = Image.new('RGBA', dbg.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        for p in b['walk']: d.polygon([tuple(q) for q in p], fill=(60, 255, 80, 90), outline=(0, 140, 0, 255))
        for o in b['occ']:
            p, base = o[0], o[1]
            d.polygon([tuple(q) for q in p], outline=(255, 40, 40, 255)); xs = [q[0] for q in p]; d.line([(min(xs), base), (max(xs), base)], fill=(255, 40, 40, 255), width=2)
        dbg.alpha_composite(ov); dbg.save(os.path.join(AP, 'out', 'plates', key + '-debug.png'))
    for n in sorted(used):
        strip = Image.open(os.path.join(AP, 'out', 'chars', n + '.png')).convert('RGBA')
        strip.save(os.path.join(ASSETS, 'chars', n + '.png'))
        data['chars'][n] = {'src': 'assets/chars/%s.png' % n, 'frames': frames_of(strip), 'sideLeft': n in SIDE_LEFT}
    with open(os.path.join(PILOT, 'data.js'), 'w', encoding='utf-8') as f:
        f.write('// generated by docs/tayduky/art-pilot/tools/build_pilot.py\nwindow.TD_DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n')
    print('ok', len(used), 'characters')
