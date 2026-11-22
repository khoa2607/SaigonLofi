"""Tây Du Ký v2 — sit and action poses for the hand-drawn cast (run before author_cast.py; edits src/wukong.json in place).

New frames per view (see build_chars.py): sit (lower body part + upper body dropped), act0 / act1 (an arm part and/or items).
Wukong: staff practice (twirl across the body / overhead wind-up, then a strike). Staffs and spears are straight 2 px rods with
gold caps placed by rod(); every arm and leg pose is typed by hand.
"""
import os, json
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.join(HERE, '..', 'src')


def rod(x0, y0, x1, y1, body='B', hi='b', cap='G', caplen=3, tip=None):
    """a straight 2 px rod with an ink outline, as a part {'at', 'rows'}; tip: a spearhead colour key on the (x1, y1) end"""
    pts = []; n = max(abs(x1 - x0), abs(y1 - y0))
    for s in range(n + 1):
        x = round(x0 + (x1 - x0) * s / n); y = round(y0 + (y1 - y0) * s / n); pts.append((x, y, s))
    vert = abs(y1 - y0) > abs(x1 - x0)
    px = {}
    for x, y, s in pts:
        c = cap if (s < caplen or s > n - caplen) else body
        if tip and s > n - 4: c = tip
        px[(x, y)] = c if c != body else hi
        px[(x + 1, y) if vert else (x, y + 1)] = c if c != body else body
    out = dict(px)
    for (x, y) in list(px):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if (x + dx, y + dy) not in px: out.setdefault((x + dx, y + dy), 'o')
    xs = [p[0] for p in out]; ys = [p[1] for p in out]; X0, Y0 = min(xs), min(ys)
    rows = [''.join(out.get((x, y), '.') for x in range(X0, max(xs) + 1)) for y in range(Y0, max(ys) + 1)]
    return {'at': [X0, Y0], 'rows': rows}


IT = lambda part: {'layer': 'front', 'part': part}

if __name__ == '__main__':
    p = os.path.join(SRC, 'wukong.json'); C = json.load(open(p, encoding='utf-8'))
    C['palette'].update({'B': '#4a3a52', 'b': '#7a6a8a'})
    V = C['views']
    sit_front = ["................", "........orrrrrrr", ".......oKrrrrrrr", ".......oKKoooooo", "........oo......", "................"]
    sit_side = ["................................", "...........orrrrrrrro...........", "...........orrrrrrrrrrooo.......", "............oooooooooKKKKo......", "....................ooooo.......", "................................"]
    V['down']['lower']['sit'] = {'mirror': True, 'at': [0, 40], 'rows': sit_front}
    V['up']['lower']['sit'] = {'mirror': True, 'at': [0, 40], 'rows': sit_front}
    V['right']['lower']['sit'] = {'at': [0, 40], 'rows': sit_side}
    C['sitDrop'] = 4
    tail_d, tail_u, tail_r = V['down']['item'], V['up']['item'], V['right']['item']
    arm_up = {'at': [15, 17], 'rows': [".oo..", "oSSo.", "oSso.", "oFFo.", "oFFo.", "oFfo.", "oFFo.", "oFfo.", ".oFo.", "..oo."]}
    arm_fwd = {'at': [16, 25], 'rows': [".oooooo.", "oFFFFSSo", "oFfFFSso", ".ooooooo"]}
    V['down']['acts'] = {'act0': {'items': [tail_d, IT(rod(1, 31, 30, 29))]}, 'act1': {'items': [tail_d, IT(rod(3, 21, 28, 40))]}}
    V['up']['acts'] = {'act0': {'items': [tail_u, IT(rod(1, 31, 30, 29))]}, 'act1': {'items': [tail_u, IT(rod(28, 21, 3, 40))]}}
    V['right']['acts'] = {'act0': {'arm': arm_up, 'items': [tail_r, IT(rod(27, 2, 6, 30))]}, 'act1': {'arm': arm_fwd, 'items': [tail_r, IT(rod(8, 26, 31, 26))]}}
    json.dump(C, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('wukong poses ok')
