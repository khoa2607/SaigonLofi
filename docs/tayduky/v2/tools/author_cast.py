"""Tây Du Ký v2 — hand-authored grid sources for the pilot cast (except wukong.json, which is edited directly).

Every row below is typed by hand, one character per pixel. Helpers only (a) mirror half rows, (b) place a typed string at a column,
(c) swap palette roles to make variants from one hand-drawn body (the skill's "variants from one body" rule). Nothing is generated from shapes.
Run: python author_cast.py  (writes ../src/*.json), then python build_chars.py
"""
import os, json, copy

HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, '..', 'src')
INK = '#2a1726'


def save(C):
    with open(os.path.join(SRC, C['name'] + '.json'), 'w', encoding='utf-8') as f: json.dump(C, f, ensure_ascii=False, indent=1)
    print('wrote', C['name'])


def sub(rows, table):
    """swap palette roles in hand-drawn rows: {'R': 'J', ...}"""
    return [''.join(table.get(c, c) for c in r) for r in rows]


def blank(w, h): return [['.'] * w for _ in range(h)]
def put(g, x, y, s):
    for i, ch in enumerate(s):
        if ch != ' ': g[y][x + i] = ch
def rows(g): return [''.join(r) for r in g]


WK = json.load(open(os.path.join(SRC, 'wukong.json'), encoding='utf-8'))
WV = WK['views']

# =====================================================================================================================  Khỉ Lính (monkey guard)
# Wukong's body with a jade vest and khaki trousers, a leather helmet with a red plume, stern brows, and an upright spear.
helmet_front = [
    "................", "................", "................", "................",
    "...............q", "..............qq", "..............qQ", "..............qq",
    "...........ooooo", ".........ooBBBnn", "........oBBBBBnn", ".......oBBBBBBBB", ".......oIIIIIIIi", ".......oiiiiiiii"]
guard_face = [
    ".....ooofSSSSfFF", "....oSSofSffSSSf", "....oSsofSSooSSS", "....ossofSSwoSSS", ".....ooofSSooSSS",
    ".......ofSSSSSSS", ".......ofSSSSSSS", "........ofSSmmmm", ".........ofSSSSS", "..........oooooo"]
guard_body = [
    ".........ooJJJJJ", "........oJJJJJjh", ".......oFfJJJjhh", ".......oFfJJJjhh", ".......oFfJJJjhh", ".......oFfjJJjhh",
    ".......oFfJJJjhh", ".......oSSbbbbbG", ".......osSNNNNNN", "........oNNNNNnN", "........oNNnNNNN", "........oNNNNNnN", "........oooooooo"]
guard_back_head = sub(WV['up']['upper']['rows'][15:25], {})
guard_back_body = [
    ".........ooJJJJJ", "........oJJJJJJJ", ".......oFfJJJJJJ", ".......oFfJJJJJJ", ".......oFfjJJJJJ", ".......oFfJJJJJJ",
    ".......oFfJJJJJJ", ".......oSSbbbbbb", ".......osSNNNNNN", "........oNNNNNnN", "........oNNnNNNN", "........oNNNNNnN", "........oooooooo"]
guard_legs = ["................", "..........oNNNo.", "..........oWWWo.", "..........oWVWo.", "..........oWWWo.", "..........oWWWo.",
              ".........oSSSSo.", ".........oSsSSo.", ".........ozzzzo.", ".........oooooo."]
spear = ["..o..", ".oIo.", ".oIo.", "oIIio", "oIIio", ".oio.", "oqqqo", "oqQqo", ".oqo."] + [".oUo."] * 33 + [".ooo."]
# side view: Wukong's hand-drawn profile, circlet rows replaced by the helmet, feathers removed, brows added, vest and trousers by role swap
ws = WV['right']['upper']['rows']
g_side = [r.replace('q', '.') for r in ws]
g_side[4:9] = ["................................", "...............q................", "..............qQq...............", "..............qQq...............", "...............q................"]
g_side[9:15] = [".............oooooo.............", "...........ooBBnnBBoo...........", "..........oBBBBBnnBBo...........",
                ".........oBBBBBBBBBBBBo.........", ".........oIIIIIIIIIIIIIo........", ".........oiiiiiiiiiiiiiio......."]
r16 = list(g_side[16]); r16[20:23] = ['f', 'f', 'f']; g_side[16] = ''.join(r16)
g_side[20] = g_side[20].replace('P', 'S'); g_side[22] = g_side[22].replace('mmo', 'Smo')
g_side[25:37] = sub(ws[25:37], {'R': 'J', 'r': 'j', 'G': 'J', 'g': 'j', 'Y': 'J', 'd': 'b', 'T': 'N', 't': 'n'})
guard = {
    'version': 1, 'name': 'khi_linh', 'title': ['Khỉ Lính', 'Monkey Guard'], 'biome': 'hqs', 'canvas': [32, 48], 'pivot': [16, 46], 'speed': 18,
    'notes': "Variant of Wukong's hand-drawn body (role swap): helmet with plume, stern brows, jade vest, spear. Spear is symmetric, so the left view mirrors the right.",
    'palette': {**WK['palette'], 'B': '#9a6038', 'n': '#c88a52', 'I': '#d8dce8', 'i': '#8e90a8', 'Q': '#ff7a5a', 'J': '#4fa868', 'j': '#2f7552',
                'N': '#8a6a48', 'b': '#4a3024', 'z': '#d8b878', 'U': '#b8864e'},
    'views': {
        'down': {'upper': {'mirror': True, 'rows': helmet_front + guard_face + guard_body},
                 'lower': {'stand': {'mirror': True, 'at': [0, 36], 'rows': guard_legs}, 'a': {'from': 'stand', 'lift': [0, 15]}, 'b': {'from': 'stand', 'lift': [16, 31]}},
                 'items': [WV['down']['item'], {'layer': 'front', 'part': {'at': [3, 3], 'rows': spear}}]},
        'up': {'upper': {'mirror': True, 'rows': helmet_front[:12] + [".......oIIIIIIII", ".......oiiiiiiii"] + guard_back_head + guard_back_body},
               'lower': {'stand': {'mirror': True, 'at': [0, 36], 'rows': guard_legs}, 'a': {'from': 'stand', 'lift': [0, 15]}, 'b': {'from': 'stand', 'lift': [16, 31]}},
               'items': [WV['up']['item'], {'layer': 'back', 'part': {'at': [24, 3], 'rows': spear}}]},
        'right': {'upper': {'rows': g_side},
                  'items': [WV['right']['item'], {'layer': 'front', 'part': {'at': [21, 3], 'rows': spear}}],
                  'lower': {k: {'at': [0, 36], 'rows': sub(WV['right']['lower'][k]['rows'], {'r': 'N', 'd': 'b', 'K': 'S', 'k': 's', 'J': 's'})} for k in ('stand', 'a', 'b')}},
    }}
save(guard)

# =====================================================================================================================  Khỉ Lão (old monkey)
# Wukong's body recoloured grey, a brown robe in place of armour and skirt, white brows and beard, no feathers or circlet, a crooked cane.
elder_pal = {**WK['palette'], 'F': '#a8968a', 'f': '#6e6070', 'h': '#d4c8b8', 'S': '#f0c8a8', 's': '#c8967e',
             'G': '#8a6a4a', 'g': '#5e4636', 'Y': '#a8865e', 'R': '#6e8a5a', 'r': '#4a6448', 'd': '#3a2c24', 'T': '#8a6a4a', 't': '#5e4636',
             'E': '#fff8ec', 'e': '#c8c0d0', 'U': '#9a6a3a', 'u': '#6a4428'}
eu = [r.replace('q', '.') for r in WV['down']['upper']['rows']]
eu[13] = ".......oFFFFFFhh"; eu[14] = ".......oFFFFFFFF"
eu[16] = "....oSSofEEESSSf"                                      # white brows
eu[20] = ".......ofSSSSSSm"; eu[21] = ".......ofSSSSSSS"
eu[22] = "........ofEESEEE"; eu[23] = ".........oEEEEEE"; eu[24] = "..........oEEEeE"   # beard under the chin
eu[25] = ".........ooRREEe"; eu[26] = "........oRRRRoEE"; eu[27] = ".......oFfrRRRoE"
beard_side = ["....oo", "...oEE", "..oEEE", "..oEEe", "...oEo", "....o."]
es = [r.replace('q', '.') for r in WV['right']['upper']['rows']]
es[13] = ".........oFFFFFFFFFFFFFo........"; es[14] = ".........offffffffffffffo......."
r16 = list(es[16]); r16[19:23] = ['E', 'E', 'E', 'E']; es[16] = ''.join(r16)
es[20] = es[20].replace('P', 'S')
cane = ["oooo.", "oUUo.", "ooUo.", "..oUo", "..oUo"] + ["..oUo"] * 26 + ["..ooo"]
elder = {
    'version': 1, 'name': 'khi_lao', 'title': ['Khỉ Lão', 'Old Monkey'], 'biome': 'hqs', 'canvas': [32, 48], 'pivot': [16, 46], 'speed': 11,
    'notes': "Variant of Wukong's hand-drawn body: grey fur, a moss robe, white brows and beard, no feathers or circlet, and a crooked cane. The cane is held on the near side and redrawn per view.",
    'palette': elder_pal,
    'views': {
        'down': {'upper': {'mirror': True, 'rows': eu, 'edits': {}},
                 'lower': {'stand': {'mirror': True, 'at': [0, 36], 'rows': sub(WV['down']['lower']['stand']['rows'], {'r': 'G', 'W': 'g', 'V': 'd', 'K': 'S', 'k': 's'})},
                           'a': {'from': 'stand', 'lift': [0, 15]}, 'b': {'from': 'stand', 'lift': [16, 31]}},
                 'items': [WV['down']['item'], {'layer': 'front', 'part': {'at': [3, 14], 'rows': cane}}]},
        'up': {'upper': {'mirror': True, 'rows': [r.replace('q', '.') for r in WV['up']['upper']['rows'][:13]] + [".......oFFFFFFFF", ".......offfffffff"[:16]] + WV['up']['upper']['rows'][15:]},
               'lower': {'stand': {'mirror': True, 'at': [0, 36], 'rows': sub(WV['up']['lower']['stand']['rows'], {'r': 'G', 'W': 'g', 'V': 'd', 'K': 'S', 'k': 's'})},
                         'a': {'from': 'stand', 'lift': [0, 15]}, 'b': {'from': 'stand', 'lift': [16, 31]}},
               'items': [WV['up']['item'], {'layer': 'back', 'part': {'at': [24, 14], 'rows': [r[::-1] for r in cane]}}]},
        'right': {'upper': {'rows': es}, 'arm': WV['right']['arm'],
                  'items': [WV['right']['item'], {'layer': 'front', 'part': {'at': [18, 22], 'rows': beard_side}}, {'layer': 'front', 'part': {'at': [22, 14], 'rows': [r[::-1] for r in cane]}}],
                  'lower': {k: {'at': [0, 36], 'rows': sub(WV['right']['lower'][k]['rows'], {'r': 'G', 'd': 'g', 'W': 'g', 'V': 'd', 'K': 'S', 'k': 's', 'J': 's'})} for k in ('stand', 'a', 'b')}},
    }}
save(elder)

# =====================================================================================================================  Khỉ Con (monkey kid)
# Small and round: head bigger than the body, a pink bib, both hands round a peach. Hops.
kid_front = [
    "................", "................", "................", "................", "................", "................",
    "................", "................", "................", "................", "................", "................",
    "................", "................", "................", "................", "................", "................",
    "................", "................", "................",
    "...........ooooo",
    ".........ooFFhhh",
    "........oFFFFFhh",
    ".......oFFFFFFFF",
    ".....ooofSSSSfFF",
    "....oSSofSSSSSSf",
    "....oSsofSooSSSS",
    "....ossofSwoSSSS",
    ".....ooofSooSSSS",
    ".......ofPSSSSSm",
    "........ofSSSSSS",
    ".........ooooooo",
    "..........oRRRRR",
    ".........oFRRRRR",
    "........oFfRRRRR",
    "........oSSFFFFF",
    "........ooFFFFFF",
    "..........oFFFFF",
    "..........oooooo"]
kid_back = kid_front[:26] + [
    "....oSSoFFFFFFFF", "....oSsoFFFFFFFF", "....ossofFFFFFFF", ".....ooofFFFFFFF", ".......offFFFFFF", "........offFFFFF", ".........ooooooo",
    "..........oRRRRR", ".........oFRFFFF", "........oFfFFFFF", "........oSSFFFFF", "........ooFFFFFF", "..........oFFFFF", "..........oooooo"]
kid_legs = ["................", "...........oFFo.", "...........oFFo.", "..........oSSSo.", "..........ooooo."]
peach = ["..oL..", ".oPPo.", "oPPPpo", "oPPppo", ".oppo.", "..oo.."]
kid_side = blank(32, 41)
for y, s in [(21, "............ooooo"), (22, "..........ooFFFhho"), (23, ".........oFFFFFFhhho"), (24, "........oFFFFFFFFFFFo"),
             (25, "........oFFoooFFFSSSSo"), (26, "........oFoSSoFSSSSSSSo"), (27, "........oFoSsoFSSSSooSo"), (28, "........oFossoFSSSSwoSSo"),
             (29, "........ofFooFFSSSSooSSo"), (30, "........ofFFFFSPSSSSSSmo"), (31, ".........offFFSSSSSSSSo"), (32, "..........ooooooooooo"),
             (33, "...........oRRRRRRo"), (34, "...........oRRRRRRRo"), (35, "...........oFFFFFFo"), (36, "...........oFFFFFFo"),
             (37, "...........oFFFFFFo"), (38, "...........oFFFFFFo"), (39, "...........oooooooo")]:
    put(kid_side, 0, y, s)
kid_tail_side = [".oo....", "oFFo...", "oFoFo..", ".o.oFo.", "...oFFo", "....oFF", ".....oo"]
kid = {
    'version': 1, 'name': 'khi_con', 'title': ['Khỉ Con', 'Monkey Kid'], 'biome': 'hqs', 'canvas': [32, 48], 'pivot': [16, 46], 'speed': 24, 'gait': 'hop',
    'notes': 'Own small body (about 24 px): oversized head, pink bib, holds a peach in both hands. Peach is drawn per view; the left view mirrors the right.',
    'palette': {**WK['palette'], 'R': '#f08aa0', 'P': '#ffb0a0', 'p': '#e06a6a', 'L': '#5aaa62'},
    'views': {
        'down': {'upper': {'mirror': True, 'rows': kid_front},
                 'lower': {'stand': {'mirror': True, 'at': [0, 40], 'rows': kid_legs + ["................"]}, 'a': {'from': 'stand', 'lift': [0, 15]}, 'b': {'from': 'stand', 'lift': [16, 31]}},
                 'item': {'layer': 'front', 'part': {'at': [13, 34], 'rows': peach}}},
        'up': {'upper': {'mirror': True, 'rows': kid_back},
               'lower': {'stand': {'mirror': True, 'at': [0, 40], 'rows': kid_legs + ["................"]}, 'a': {'from': 'stand', 'lift': [0, 15]}, 'b': {'from': 'stand', 'lift': [16, 31]}},
               'item': {'layer': 'front', 'part': {'at': [15, 35], 'rows': [r[::-1] for r in kid_tail_side]}}},
        'right': {'upper': {'rows': rows(kid_side)},
                  'item': {'layer': 'front', 'part': {'at': [18, 33], 'rows': peach}},
                  'lower': {
                      'stand': {'at': [0, 39], 'rows': ["................................", "............oFFo................", "............oFFo................", "............oSSSo...............", "............ooooo..............."]},
                      'a': {'at': [0, 39], 'rows': ["................................", "...........oFFoFo...............", "..........oFFooFFo..............", "..........oSSo.oSSo.............", "..........ooo..oooo............."]},
                      'b': {'at': [0, 39], 'rows': ["................................", "............oFFo................", "............oFFo................", "............oSSSo...............", "............ooooo..............."]}}},
    }}
# kid's tail behind the side view rides on the build tool's back layer via a second character file would be overkill: add it to the side rows
kid_side_rows = kid['views']['right']['upper']['rows']
g = [list(r) for r in kid_side_rows]
for y, s in enumerate(kid_tail_side): put(g, 4, 31 + y, ''.join(c if c != '.' else ' ' for c in s))
kid['views']['right']['upper']['rows'] = rows(g); save(kid)

# =====================================================================================================================  Nhện Tinh (spider spirit lead) + sister
# One hand-drawn lady body. Lead: twin buns with silver spider-leg pins, violet robe with silver web marks, poison-green sash.
# Sister: same body, single top bun, teal robe, rose sash (palette + hair rows).
lady_hair_lead = [
    "...I............",
    "....i...........",
    ".....i..ooo.....",
    "......ioHhho....",
    ".Iiiii.oHHhHo...",
    "......oHHHHo....",
    ".....ioXHHXoooo.",
    "....I..oXXoHHhhh",
    "........oHHHHhhh",
    ".......oHHHHHHhh",
    ".......oHHHHHHHH",
    ".......oHHHHXXXX"]
lady_hair_sister = [
    "................",
    "................",
    "................",
    "..............oo",
    ".............oHh",
    "............oHHh",
    "...........oXHHH",
    "..........oooXXX",
    "........ooHHHHhh",
    ".......oHHHHHHhh",
    ".......oHHHHHHHH",
    ".......oHHHHXXXX"]
lady_face_body = [
    ".......oHHXSSSSX",
    ".......oHXSSSSSS",
    ".......oHXSSSSSS",
    ".......oHXoooSSS",
    ".......oHXSewSSS",
    ".......oHXSSSSSS",
    ".......oHXPSSSSS",
    ".......oHHSSSSSl",
    ".......oHHoSSSSS",
    ".......oHHHooooo",
    "......oHHHHoIoSS",
    "......oHHoVVVVIS",
    ".....oVVVVVVVVVI",
    "....oVVVVvVVVVVV",
    "....oVVVvVVVVVVV",
    "...oVVVvVVVVVVVV",
    "...oVVVvVNNNNNNN",
    "...oVVVvVnnnnnnN",
    "..oVVVVvVVVVVVnV",
    "..oIIIIvVVVVVVnV",
    "..oooooovVVVVVVV",
    ".......ovVVVVVVV",
    ".......oVvVVVVVV",
    "......oVVVVIVVVV",
    "......oVVVIVIVVV",
    "......oVVVVIVVVV",
    ".....ovVVVVVVVVV",
    ".....oVVVVVVVVVV"]
lady_back_body = [
    ".......oHHHHHHHH",
    ".......oHHHHHHHH",
    ".......oHHHHHHHh",
    ".......oHHHHHHhH",
    ".......oHHHHHHHH",
    ".......oHHHHHHHH",
    ".......oHHHHHHHH",
    ".......oHHHHHHHH",
    ".......oHHHHHHHH",
    ".......oXHHHHHHH",
    "......oVXHHHHHHH",
    "......oVVXHHHHHH",
    ".....oVVVVXHHHHH",
    "....oVVVVvVXHHHH",
    "....oVVVvVVVXHHH",
    "...oVVVvVVVVVXHH",
    "...oVVVvVNNNNNNN",
    "...oVVVvVnnnNNNn",
    "..oVVVVvVVVoNNNo",
    "..oIIIIvVVVVonnV",
    "..oooooovVVVVoVV",
    ".......ovVVVVVVV",
    ".......oVvVVVVVV",
    "......oVVVVIVVVV",
    "......oVVVIVIVVV",
    "......oVVVVIVVVV",
    ".....ovVVVVVVVVV",
    ".....oVVVVVVVVVV"]
hem = {
    'stand': {'mirror': True, 'at': [0, 40], 'rows': [".....ovVVVvVVVVV", "....ovVVVVVVVVVV", "....oooooooooooo", "..........oKKo..", "..........oooo..", "................"]},
    'a': {'at': [0, 40], 'rows': [".....ovVVVvVVVVVVVVVVvVVVvo.....", ".....ovVVVVVVVVVVVVVVVVVVVvo....", ".....ooooooooooooooooooooooo....", "..........oKKo..................", "..........oooo..................", "................................"]},
    'b': {'at': [0, 40], 'rows': [".....ovVVVvVVVVVVVVVVvVVVvo.....", "....ovVVVVVVVVVVVVVVVVVVVvo.....", "....ooooooooooooooooooooooo.....", "..................oKKo..........", "..................oooo..........", "................................"]}}
lady_side = blank(32, 40)
for y, s in [(2, "...........ooo"), (3, "..........oHhHo"), (4, ".Iiiii.o.oHHHHo"), (5, "......ooooHHHHo"), (6, ".....ii.oXHHXo"),
             (7, "..........oXXoooooo"), (8, ".........oHHHHHhhhhoo"), (9, "........oHHHHHHHHhhhho"), (10, "........oHHHHHHHHHHHHHo"),
             (11, "........oHHHHHHHHHXXXXo"), (12, "........oHHHHHHHXSSSSSXo"), (13, "........oHHHHHHXSSSSSSSo"),
             (14, "........oHHHHHHXSSSSSSSSo"), (15, "........oHHHHHHXSSSooSSSo"), (16, "........oHHHHHHXSSSewSSSo"),
             (17, "........oHHHHHHXSSSSSSSo"), (18, "........oHHHHHHXSPSSSSSo"), (19, "........oHHHHHHHSSSSSlSo"),
             (20, "........oHHHHHHHoSSSSSo"), (21, "........oHHHHHHHHooooo"), (22, ".........oHHHHHHoIoS"),
             (23, ".........oHHHHHVVVIVo"), (24, "........oHHHHVVVVVVVVo"), (25, "........oHHHVVVVVVVVVo"),
             (26, "........oHHVVVVVVVVVVo"), (27, "........oHVVVVVVVVVVVo"), (28, "........oHNNNNNNNNNNNo"),
             (29, "........onnnnnnnnnnnNo"), (30, "........oVVVVVVVVVVVVo"), (31, "........ovVVVVVVVVVVVo"),
             (32, ".......ovVVVVVVIVVVVVo"), (33, ".......oVVVVVVIVIVVVVo"), (34, ".......oVVVVVVVIVVVVVVo"),
             (35, "......ovVVVVVVVVVVVVVVo"), (36, "......oVVVVVVVVVVVVVVVo"), (37, "......ovVVVVVVVVVVVVVVo"),
             (38, "......oVVVVVVVVVVVVVVVo"), (39, "......ovVVVVVVVVVVVVVVVo")]:
    put(lady_side, 0, y, s)
lady_sleeve = {'n': {'at': [13, 23], 'rows': [".oooo.", "oVVVVo", "oVVVVo", "oVVvVo", "oVVvVo", "oVVvVo", "oVVvVVo", "oIIIIIo", ".ooooo."]},
               'f': {'at': [14, 23], 'rows': [".oooo..", "oVVVVo.", "oVVVVVo", ".oVVvVo", ".oVVvVVo", "..oVvVVo", "..oVvVVVo", "..oIIIIIo", "...ooooo."]},
               'b': {'at': [11, 23], 'rows': ["...oooo", "..oVVVVo", ".oVVVVVo", "oVVvVVo.", "oVvVVo..", "oVvVVo..", "oVvVVo..", "oIIIIo..", ".oooo..."]}}
side_hem = {
    'stand': {'at': [0, 40], 'rows': ["......oVVVVVVVVVVVVVVVo.........", "......ovVVVVVVVVVVVVVVVo........", "......oooooooooooooooooo........", "...............oKKKo............", "...............ooooo............", "................................"]},
    'a': {'at': [0, 40], 'rows': ["......oVVVVVVVVVVVVVVVVo........", "......ovVVVVVVVVVVVVVVVVo.......", "......ooooooooooooooooooo.......", "..........ooo.......oKKKo.......", "...................ooooo........", "................................"]},
    'b': {'at': [0, 40], 'rows': ["......oVVVVVVVVVVVVVVVo.........", ".....ovVVVVVVVVVVVVVVVo.........", ".....oooooooooooooooooo.........", "........oKKKo.....ooo...........", "........ooooo...................", "................................"]}}
lady_pal = {'o': INK, 'H': '#3a2c4a', 'h': '#6a5a8a', 'X': '#24182e', 'I': '#ffffff', 'i': '#a49ad0',
            'S': '#fbe0cc', 'P': '#f4a0a8', 'l': '#d2405a', 'e': '#5a2a7a', 'w': '#ffffff', 'K': '#2e2440'}
lead_pal = {**lady_pal, 'V': '#8f5ad0', 'v': '#5e3a9a', 'N': '#7cf05a', 'n': '#3ea84a'}
sister_pal = {**lady_pal, 'V': '#3cb8a8', 'v': '#24807c', 'N': '#f48ab0', 'n': '#c25a84', 'H': '#2e2a44'}


def lady(name, title, hair, pal, notes, side_hair_rows=None):
    up_front = hair + lady_face_body
    up_back = hair[:11] + [".......oHHHHHHHH"] + lady_back_body
    side = rows(lady_side)
    if side_hair_rows:
        g = [list(r) for r in side]
        for y in range(0, 8): g[y] = list('.' * 32)
        for y, s in side_hair_rows: put(g, 0, y, s)
        side = rows(g)
    return {'version': 1, 'name': name, 'title': title, 'biome': 'btd', 'canvas': [32, 48], 'pivot': [16, 46], 'speed': 14, 'gait': 'glide',
            'notes': notes, 'palette': pal,
            'views': {'down': {'upper': {'mirror': True, 'rows': up_front}, 'lower': hem},
                      'up': {'upper': {'mirror': True, 'rows': up_back}, 'lower': hem},
                      'right': {'upper': {'rows': side}, 'arm': lady_sleeve, 'lower': side_hem}}}


save(lady('nhen_tinh', ['Nhện Tinh (chị cả)', 'Spider Spirit, eldest sister'], lady_hair_lead, lead_pal,
          'Own hand-drawn lady body. Twin buns with silver spider-leg pins (the silhouette key), long hair down the back, violet robe with silver web marks, poison-green sash, wide sleeves that swing.'))
save(lady('nhen_tinh_em', ['Nhện Tinh (em)', 'Spider Spirit, younger sister'], lady_hair_sister, sister_pal,
          'Same lady body as the eldest sister; a single high bun, teal robe, rose sash, darker hair.',
          side_hair_rows=[(4, "...........oo"), (5, "..........oHho"), (6, ".........oHHHo"), (7, "..........oXXoooooo")]))

# =====================================================================================================================  Nhện Con (spiderling demon)
# Round charcoal body, poison-green back mark, two big eyes, eight jointed legs. Scuttles: legs alternate.
sp_front = [
    "................", "................", "................", "................", "................", "................",
    "................", "................", "................", "................", "................", "................",
    "................", "................", "................", "................", "................", "................",
    "................", "................", "................", "................", "................", "................",
    "................", "................", "................", "................", "................", "................",
    "...........ooooo",
    ".........ooBBBbb",
    "........oBBBBNbb",
    "...oo..oBBBNNNBB",
    "..oPPooBBBBBBBBB",
    ".oP..oBBBEEBBBBB",
    ".o..oPBBBEwBBBBB",
    "...oPoBBBEEBBBBB",
    "..oPo.oBBBBBBBmm",
    ".oPo..oBBBBBBBBB",
    ".o...oPoBBBBBBBB",
    "....oPo.ooBBBBBB",
    "...oPo....oooooo",
    "..oPo...........",
    "................"]
sp_lift = {'a': {'from': 'stand', 'lift': [0, 7]}, 'b': {'from': 'stand', 'lift': [24, 31]}}
sp_side = blank(32, 46)
for y, s in [(30, "...........oooooo"), (31, ".........ooBBBNbbbo"), (32, "........oBBBBNNNbbBo"), (33, ".......oBBBBNNBBBBBBo"),
             (34, "......oBBBBBBBBBBEEBo.oo"), (35, "......oBBBBBBBBBBEwBBoPPo"), (36, "......oBBBBBBBBBBBBBBBo..o"),
             (37, "....oo.oBBBBBBBBBBBBmo"), (38, "...oPPoooBBBBBBBBBBBo"), (39, "..oP.oPoPoooBBBBBooPo"),
             (40, ".oP.oP.oPo..ooooo.oPoPo"), (41, ".o.oP.oPo.......oPo.oPo"), (42, "...o..oo........oo...oo"), (43, ".................")]:
    put(sp_side, 0, y, s)
spider = {
    'version': 1, 'name': 'nhen_con', 'title': ['Nhện Con', 'Spiderling Demon'], 'biome': 'btd', 'canvas': [32, 48], 'pivot': [16, 46], 'speed': 30, 'gait': 'scuttle',
    'notes': 'Own hand-drawn body: round charcoal-violet abdomen with a poison-green mark, two big eyes, a fanged mouth, eight bent legs. Front/back walk lifts the legs on one side, then the other.',
    'palette': {'o': INK, 'B': '#56466e', 'b': '#7a6a96', 'N': '#7cf05a', 'E': '#ff5a6a', 'w': '#ffffff', 'm': '#eceaf8', 'P': '#8a7ab0'},
    'views': {'down': {'upper': {'mirror': True, 'rows': sp_front[:30] + ["................"] * 0}, 'lower': {'stand': {'mirror': True, 'rows': sp_front}, **sp_lift}},
              'up': {'upper': {'mirror': True, 'rows': ["................"]}, 'lower': {'stand': {'mirror': True, 'rows': [r.replace('E', 'B').replace('w', 'N').replace('m', 'B') for r in sp_front]}, **sp_lift}},
              'right': {'upper': {'rows': ["................................"]},
                        'lower': {'stand': {'rows': rows(sp_side)}, 'a': {'from': 'stand', 'lift': [0, 10]}, 'b': {'from': 'stand', 'lift': [16, 31]}}}}}
save(spider)

# =====================================================================================================================  Đường Tam Tạng (the monk)
# Tall and calm: five-panel gold crown, closed smiling eyes, red kasaya with a gold grid over a saffron robe, a ringed khakkhara staff.
monk_front = [
    "................",
    "................",
    "................",
    "................",
    "...........ooooo",
    "..........oGYGGG",
    ".........ooGGoGG",
    "........oGGooGGY",
    "........oGYGoGYG",
    "........oGGGoGGG",
    ".......ooggggggg",
    ".......oRRRRRRRR",
    ".......oSSSSSSSS",
    ".......oSSSSSSSS",
    ".......oSSSSSSSS",
    "......oSoSSSSSSS",
    "......oSoSooSSSS",
    "......oSoSSSSSSS",
    ".......ooSPSSSSS",
    "........oSSSSSmm",
    "........oSSSSSSS",
    ".........ooooooo",
    "..........oAAAAA",
    "........ooAARRRA",
    ".......oAAARRGRR",
    "......oAAARRRGRR",
    "......oAAaRGGGGG",
    "......oAAaRRRGRR",
    "......oAAaRRRGRR",
    ".....oAAAaRGGGGG",
    ".....oSSAaRRRGRR",
    ".....oSsoaRRRGRR",
    "......ooaARGGGGG",
    ".......oaARRRGRR",
    ".......oAARRRGRR",
    ".......oAARGGGGG",
    "......oAAARRRGRR",
    "......oAAARRRGRR",
    "......oAAAAAAAAA",
    "......oAaAAAAAAA",
    "......oaAAAaAAAA"]
monk_back = monk_front[:12] + [
    ".......oSSSSSSSS", ".......oSSSSSSSS", ".......oSSSSSSSS", "......oSoSSSSSSS", "......oSosSSSSSS", "......oSoSSSSSSS", ".......oosSSSSSS",
    "........osSSSSSS", "........ossSSSSS", ".........ooooooo",
    "..........oAAAAA", "........ooAAAAAA", ".......oAAARRRRR", "......oAAARRRRRR", "......oAAaRRRRRR", "......oAAaRGGGGG", "......oAAaRRRRGR",
    ".....oAAAaRRRRGR", ".....oSSAaRRRRGR", ".....oSsoaRGGGGG", "......ooaARRRRGR", ".......oaARRRRGR", ".......oAARRRRGR", ".......oAARGGGGG",
    "......oAAARRRRGR", "......oAAARRRRGR", "......oAAAAAAAAA", "......oAaAAAAAAA", "......oaAAAaAAAA"]
monk_hem = {
    'stand': {'mirror': True, 'at': [0, 41], 'rows': ["......oAAAAAAAAA", "......oooooooooo", "..........oKKo..", "..........oooo..", "................"]},
    'a': {'at': [0, 41], 'rows': ["......oAAAAAAAAAAAAAAAAAAo......", ".......oooooooooooooooooooo.....", "..........oKKo..................", "..........oooo..................", "................................"]},
    'b': {'at': [0, 41], 'rows': ["......oAAAAAAAAAAAAAAAAAAo......", ".....oooooooooooooooooooo.......", "..................oKKo..........", "..................oooo..........", "................................"]}}
staff = [".oGo.", "oG.Go", "oGoGo", "oG.Go", ".oGo.", "..G..", ".oGo."] + [".oUo."] * 34 + [".ooo."]
monk_side = blank(32, 41)
for y, s in [(4, "............ooooo"), (5, "...........oGYGGGo"), (6, "..........oGGoGGYGo"), (7, ".........oGGGoGGGGGo"),
             (8, ".........oGYGoGGYGGo"), (9, ".........oGGGoGGGGGo"), (10, ".........oggggggggggo"), (11, ".........oRRRRRRRRRRo"),
             (12, ".........oSSSSSSSSSSSo"), (13, ".........oSSSSSSSSSSSo"), (14, ".........oSSSSSSSSSSSSo"),
             (15, "........oSoSSSSSSSSSSSo"), (16, "........oSoSSSSSSooSSSo"), (17, "........oSoSSSSSSSSSSSSo"),
             (18, ".........ooSSSSPSSSSSSo"), (19, "..........oSSSSSSSSSmo"), (20, "...........oSSSSSSSSo"), (21, "............oooooooo"),
             (22, "............oAAAAAo"), (23, "...........oAAAARRRo"), (24, "..........oAAARRGRRRo"), (25, "..........oAARRRGRRRo"),
             (26, "..........oAARGGGGGRo"), (27, "..........oAARRRGRRRo"), (28, "..........oAARRRGRRRo"), (29, "..........oAARGGGGGRo"),
             (30, "..........oAARRRGRRRo"), (31, "..........oAARRRGRRRo"), (32, "..........oAARGGGGGRo"), (33, "..........oAARRRGRRRo"),
             (34, "..........oAARRRGRRRo"), (35, "..........oAAAAAAAAAAo"), (36, "..........oAAAAAAAAAAo"), (37, ".........oAAAAAAAAAAAo"),
             (38, ".........oAaAAAAAAAAAo"), (39, ".........oaAAAAaAAAAAAo"), (40, ".........oAAAAAAAAAAAAo")]:
    put(monk_side, 0, y, s)
monk_sleeve = {'n': {'at': [13, 23], 'rows': [".oooo.", "oAAAAo", "oAAAAo", "oAAaAo", "oAAaAo", "oAAaAo", "oAAaAAo", "oSSSSo.", ".oooo.."]},
               'f': {'at': [14, 23], 'rows': [".oooo..", "oAAAAo.", "oAAAAAo", ".oAAaAo", ".oAAaAAo", "..oAaAAo", "..oAaAAAo", "..oSSSSo.", "...oooo.."]},
               'b': {'at': [11, 23], 'rows': ["...oooo", "..oAAAAo", ".oAAAAAo", "oAAaAAo.", "oAaAAo..", "oAaAAo..", "oAaAAo..", "oSSSo...", ".ooo...."]}}
monk_side_hem = {
    'stand': {'at': [0, 41], 'rows': [".........oAAAAAAAAAAAAo.........", ".........oooooooooooooo.........", "...............oKKKo............", "...............ooooo............", "................................"]},
    'a': {'at': [0, 41], 'rows': [".........oAAAAAAAAAAAAAo........", ".........ooooooooooooooo........", "...........ooo......oKKKo.......", "...................ooooo........", "................................"]},
    'b': {'at': [0, 41], 'rows': ["........oAAAAAAAAAAAAAo.........", "........ooooooooooooooo.........", "........oKKKo.....ooo...........", "........ooooo...................", "................................"]}}
monk = {
    'version': 1, 'name': 'tam_tang', 'title': ['Đường Tam Tạng', 'Tang Sanzang'], 'biome': 'btd', 'canvas': [32, 48], 'pivot': [16, 46], 'speed': 13,
    'notes': 'Own hand-drawn body: five-panel gold crown, closed smiling eyes, red kasaya with a gold grid over a saffron robe, ringed staff (symmetric, so the left view mirrors the right). The scale reference: the tallest figure in the pilot.',
    'palette': {'o': INK, 'G': '#f2c03c', 'g': '#c0802a', 'Y': '#fff0a0', 'R': '#d8443a', 'S': '#fbdcc0', 's': '#d9a088', 'P': '#f4a0a0', 'm': '#a85a5a',
                'A': '#f0b860', 'a': '#c08840', 'K': '#3a2c44', 'U': '#9a6a3a', 'k': '#2e2440'},
    'views': {'down': {'upper': {'mirror': True, 'rows': monk_front}, 'lower': monk_hem, 'item': {'layer': 'front', 'part': {'at': [2, 4], 'rows': staff}}},
              'up': {'upper': {'mirror': True, 'rows': monk_back}, 'lower': monk_hem, 'item': {'layer': 'back', 'part': {'at': [25, 4], 'rows': staff}}},
              'right': {'upper': {'rows': rows(monk_side)}, 'arm': monk_sleeve, 'lower': monk_side_hem, 'item': {'layer': 'front', 'part': {'at': [22, 4], 'rows': staff}}}}}
save(monk)
