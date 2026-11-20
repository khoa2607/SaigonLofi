"""Tây Du Ký v2 — compose hand-authored character parts into directional idle + walk sheets.

Every pixel comes from the grid sources in ../src/*.json (one character per pixel, '.' = transparent). This tool only stacks
parts, it never draws shapes:

  views.<down|up|right|left>:
    upper   {rows, mirror?, edits?, at?}         head + torso (+ arms for front/back). mirror: rows are the left half, mirrored.
    lower   {stand, a, b}                         legs / hem poses. b may be "mirror:a" (front/back). Drawn under upper.
    arm     {n, f, b}  (optional)                 near arm poses for side views (neutral, forward, back).
    item    {part, layer: front|back} (optional)  held item, moves with the upper body.
  left: omitted -> the right view mirrored (only for characters whose held items are symmetric; noted in the source).

Frames per direction: idle0, idle1 (upper 1 px down: breath), walk0..3 = contact A, passing (upper 1 px up), contact B, passing.
Outputs (../out/): <name>.png sheet (rows down, left, right, up; 6 columns), chars.json metadata, plus review boards.
Run: python build_chars.py
"""
import os, json, glob
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'src'); OUT = os.path.join(HERE, '..', 'out'); os.makedirs(OUT, exist_ok=True)
DIRS = ['down', 'left', 'right', 'up']
COLS = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3']
TIMING = {'idle0': 600, 'idle1': 600, 'walk0': 140, 'walk1': 140, 'walk2': 140, 'walk3': 140}


def hexrgba(h):
    h = h.lstrip('#'); a = int(h[6:8], 16) if len(h) == 8 else 255
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def part_rows(p):
    """a part -> full-width rows (list of str); mirrored parts are typed as left halves"""
    if isinstance(p, str): raise ValueError('unresolved part reference ' + p)
    rows = list(p['rows'])
    if p.get('mirror'):
        hw = max(len(r) for r in rows)
        rows = [r.ljust(hw, '.') + r.ljust(hw, '.')[::-1] for r in rows]
    for k, v in (p.get('edits') or {}).items(): rows[int(k)] = v
    return rows


def mirror_part(p):
    rows = part_rows(p); w = max(len(r) for r in rows)
    q = dict(p); q['rows'] = [r.ljust(w, '.')[::-1] for r in rows]; q.pop('mirror', None); q.pop('edits', None)
    if 'at' in p: q['at'] = p['at']
    return q


def stamp(img, pal, p, dx=0, dy=0, flipw=None):
    rows = part_rows(p); ax, ay = p.get('at', [0, 0])
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '.' or ch == ' ': continue
            if ch not in pal: raise KeyError('%s: key %r not in palette' % (p.get('_id', '?'), ch))
            X, Y = ax + x + dx, ay + y + dy
            if 0 <= X < img.width and 0 <= Y < img.height: img.putpixel((X, Y), pal[ch])


def compose(C, view, col):
    W, H = C['canvas']; pal = {k: hexrgba(v) for k, v in C['palette'].items()}
    V = C['views'][view]
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    lower = V['lower']; legs = {'idle0': 'stand', 'idle1': 'stand', 'walk0': 'a', 'walk1': 'stand', 'walk2': 'b', 'walk3': 'stand'}[col]
    lp = lower[legs]
    if isinstance(lp, dict) and 'from' in lp:          # a lifted copy: columns x0..x1 of another pose move up 1 px (a raised foot)
        src = lower[lp['from']]; rows = part_rows(src); x0, x1 = lp['lift']
        rows = [''.join(rows[y + 1][x] if (x0 <= x <= x1 and y + 1 < len(rows)) else ('.' if x0 <= x <= x1 else r[x]) for x in range(len(r))) for y, r in enumerate(rows)]
        lp = {'rows': rows, 'at': src.get('at', [0, 0])}
    if isinstance(lp, str) and lp.startswith('mirror:'):
        src = lower[lp.split(':')[1]]; lp = mirror_part(src); lp['at'] = [W - src.get('at', [0, 0])[0] - max(len(r) for r in part_rows(src)), src.get('at', [0, 0])[1]]
    bob = {'idle0': 0, 'idle1': 1, 'walk0': 0, 'walk1': -1, 'walk2': 0, 'walk3': -1}[col]
    items = list(V.get('items', [])) + ([V['item']] if V.get('item') else [])
    for it in items:
        if it.get('layer') == 'back': stamp(img, pal, it['part'], 0, bob)
    stamp(img, pal, lp)
    stamp(img, pal, V['upper'], 0, bob)
    if bob < 0:   # passing pose lifts the upper body 1 px: refill the row it uncovered with the upper body's own bottom row
        ur = part_rows(V['upper']); last = max((i for i, r in enumerate(ur) if r.strip('.')), default=-1)
        if last >= 0: stamp(img, pal, {'rows': [ur[last]], 'at': [V['upper'].get('at', [0, 0])[0], V['upper'].get('at', [0, 0])[1] + last]}, 0, 0)
    if 'arm' in V:
        a = V['arm'][{'walk0': 'f', 'walk2': 'b'}.get(col, 'n')]
        stamp(img, pal, a, 0, bob)
    for it in items:
        if it.get('layer', 'front') == 'front': stamp(img, pal, it['part'], 0, bob)
    return img


def build(path):
    C = json.load(open(path, encoding='utf-8'))
    W, H = C['canvas']
    sheet = Image.new('RGBA', (W * len(COLS), H * len(DIRS)), (0, 0, 0, 0))
    frames = {}
    for j, d in enumerate(DIRS):
        for i, col in enumerate(COLS):
            if d == 'left' and 'left' not in C['views']:
                im = compose(C, 'right', col).transpose(Image.FLIP_LEFT_RIGHT)
            else:
                im = compose(C, d, col)
            sheet.paste(im, (i * W, j * H))
            frames[d + '_' + col] = [i * W, j * H, W, H]
    sheet.save(os.path.join(OUT, C['name'] + '.png'))
    return C, sheet, frames


def board(chars, bg, scale, name, col='idle0'):
    """line-up of every character, front view and side view, on a flat background"""
    pad = 6; W = sum(C['canvas'][0] + pad for C, _, _ in chars) + pad; H = max(C['canvas'][1] for C, _, _ in chars) * 2 + pad * 3
    im = Image.new('RGBA', (W, H), hexrgba(bg)); x = pad
    for C, sheet, fr in chars:
        w, h = C['canvas']
        for k, d in enumerate(['down', 'right']):
            r = fr[d + '_' + col]; tile = sheet.crop((r[0], r[1], r[0] + w, r[1] + h))
            y = pad + k * (max(c['canvas'][1] for c, _, _ in chars) + pad) + (max(c['canvas'][1] for c, _, _ in chars) - h)
            im.alpha_composite(tile, (x, y))
        x += w + pad
    im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    im.save(os.path.join(OUT, name))


if __name__ == '__main__':
    only = os.environ.get('ONLY')
    chars = []
    meta = {'format': 'tayduky-v2-chars-1', 'dirs': DIRS, 'cols': COLS, 'timing': TIMING, 'chars': {}}
    for p in sorted(glob.glob(os.path.join(SRC, '*.json'))):
        if only and only not in p: continue
        C, sheet, frames = build(p)
        chars.append((C, sheet, frames))
        meta['chars'][C['name']] = {'src': 'out/' + C['name'] + '.png', 'size': C['canvas'], 'pivot': C['pivot'], 'title': C.get('title'),
                                    'biome': C.get('biome'), 'speed': C.get('speed', 22), 'gait': C.get('gait', 'walk')}
        print(C['name'], 'ok')
    if not only:
        with open(os.path.join(OUT, 'chars.js'), 'w', encoding='utf-8') as f:
            f.write('// generated by docs/tayduky/v2/tools/build_chars.py\nwindow.TD2_CHARS = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
        # the runtime world (tayduky/) loads its own copy of the sheets
        import shutil
        RT = os.path.join(HERE, '..', '..', '..', '..', 'tayduky', 'chars'); os.makedirs(RT, exist_ok=True)
        for C, _, _ in chars: shutil.copy(os.path.join(OUT, C['name'] + '.png'), os.path.join(RT, C['name'] + '.png'))
        with open(os.path.join(RT, 'chars.js'), 'w', encoding='utf-8') as f:
            f.write('// generated by docs/tayduky/v2/tools/build_chars.py\nwindow.TD2_CHARS = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
    board(chars, '#f4ead8', 1, 'board-light-1x.png'); board(chars, '#1e1a2a', 1, 'board-dark-1x.png')
    board(chars, '#f4ead8', 4, 'board-light-4x.png'); board(chars, '#1e1a2a', 4, 'board-dark-4x.png')
    # all frames of every character, 4x, for review
    for C, sheet, fr in chars:
        bgim = Image.new('RGBA', sheet.size, hexrgba('#e8dcc8')); bgim.alpha_composite(sheet)
        bgim.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST).save(os.path.join(OUT, 'review-' + C['name'] + '.png'))
