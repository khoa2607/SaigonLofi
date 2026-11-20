"""Tây Du Ký v2 — pack PixelLab characters (v3 + template animations) into runtime sheets.

For each entry of tools/pl_cast.json:  {"name": runtime name, "id": character id, "title": [vi, en], "biome": "hqs|btd", "speed": n, "gait": ..., "role": ...}
  1. downloads https://api.pixellab.ai/mcp/characters/<id>/download (ZIP, no auth) into tayduky/chars-pl/raw/<name>.zip (cached),
  2. lays out rows = down, left, right, up (south, west, east, north); columns = idle frames, walk frames, act frames:
       idle  <- animation "breathing-idle" if present, else the rotation twice (code-driven breath: 1 px bob in the renderer)
       walk  <- the walking animation (walking-8-frames / walking-6-frames / walking-4-frames / walk)
       act   <- fireball / cross-punch / throw-object / picking-up / drinking (whatever was generated), else the idle frames
  3. measures the figure: top row, feet row, pivot (canvas centre x, feet row) and writes tayduky/chars/<name>.png (nothing resampled)
  4. merges the metadata into tayduky/chars/chars.js (TD2_CHARS), next to the hand-authored sheets from build_chars.py.
Run: python pack_pl_chars.py [--only name,name]
"""
import os, sys, io, json, zipfile, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
RAW = os.path.join(ROOT, 'tayduky', 'chars-pl', 'raw'); OUT = os.path.join(ROOT, 'tayduky', 'chars'); os.makedirs(RAW, exist_ok=True)
DIRS = [('down', 'south'), ('left', 'west'), ('right', 'east'), ('up', 'north')]
WALK = ['walking-8-frames', 'walking-6-frames', 'walking-4-frames', 'walking', 'walk']
IDLE = ['breathing-idle', 'fight-stance-idle-8-frames']
ACT = ['fireball', 'cross-punch', 'throw-object', 'picking-up', 'drinking', 'two-footed-jump']


def fetch(name, cid, refresh=False):
    p = os.path.join(RAW, name + '.zip')
    if refresh or not os.path.exists(p):
        with urllib.request.urlopen('https://api.pixellab.ai/mcp/characters/%s/download' % cid) as r, open(p, 'wb') as f: f.write(r.read())
    return zipfile.ZipFile(p)


def frames_of(z, meta, anim_names, d):
    """frames of the first available animation among anim_names for direction d (south...), as PIL images"""
    for st in meta['states']:
        for an, dirs in (st['frames'].get('animations') or {}).items():
            if an in anim_names or any(an.startswith(a) for a in anim_names):
                if d in dirs: return an, [Image.open(io.BytesIO(z.read(f))).convert('RGBA') for f in dirs[d]]
    return None, None


def standing(frames):
    """the walk frame with the narrowest stance (feet together): measured as the opaque width of the lowest third of the figure"""
    best, bw = frames[0], 1e9
    for im in frames:
        bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        if not bb: continue
        y0 = bb[1] + int((bb[3] - bb[1]) * 0.68); low = im.crop((0, y0, im.width, bb[3])).getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        w = (low[2] - low[0]) if low else 99
        if w < bw: bw, best = w, im
    return best


def breathe(im, up=1):
    """a 1 px breath: everything above the waist lifts, a gap row is refilled from the row below"""
    W, H = im.size; bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not bb: return im.copy()
    top, bot = bb[1], bb[3]; waist = int(top + (bot - top) * 0.56)
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0)); out.paste(im.crop((0, 0, W, waist)), (0, -up)); out.paste(im.crop((0, waist, W, H)), (0, waist))
    for y in range(waist - up, waist): out.paste(im.crop((0, waist, W, waist + 1)), (0, y))
    return out


def pack(entry):
    name, cid = entry['name'], entry['id']
    z = fetch(name, cid, entry.get('refresh', False) or '--refresh' in sys.argv); meta = json.loads(z.read('metadata.json'))
    st0 = meta['states'][0]; W, H = st0['character']['size']['width'], st0['character']['size']['height']
    rot = {d: Image.open(io.BytesIO(z.read(st0['frames']['rotations'][d]))).convert('RGBA') for _, d in DIRS}
    idle, walk, act = {}, {}, {}
    ia = wa = aa = None
    for _, d in DIRS:
        ia, idle[d] = frames_of(z, meta, IDLE, d) if entry.get('use_generated_idle') else (None, None)
        wa, walk[d] = frames_of(z, meta, WALK, d); aa, act[d] = frames_of(z, meta, ACT, d)
        if not idle[d]:
            base = standing(walk[d]) if walk[d] and len(walk[d]) > 1 else rot[d]       # the walk clips are drawn a little smaller than the base rotation: take idle from a walk frame so the scale never pops
            b = breathe(base); idle[d] = [base, b, b, base]
        if not walk[d]: walk[d] = [rot[d]]
        if not act[d]: act[d] = None
    nI, nW = len(idle['south']), len(walk['south']); nA = len(act['south']) if act['south'] else 0
    cols = nI + nW + nA
    sheet = Image.new('RGBA', (W * cols, H * 4), (0, 0, 0, 0))
    top, feet = H, 0
    for r, (dn, d) in enumerate(DIRS):
        seq = idle[d] + walk[d] + (act[d] or [])
        for c, im in enumerate(seq):
            if im.size != (W, H): im = im.crop((0, 0, W, H))
            sheet.paste(im, (c * W, r * H))
            bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
            if bb: top = min(top, bb[1]); feet = max(feet, bb[3])
    feet_row = feet  # rows below the lowest opaque pixel are empty
    sheet.save(os.path.join(OUT, name + '.png'))
    anim = {'idle': [0, nI], 'walk': [nI, nW]}
    if nA: anim['act'] = [nI + nW, nA]
    info = {'src': 'chars/' + name + '.png', 'size': [W, H], 'pivot': [W // 2, feet_row - 2], 'top': top, 'title': entry.get('title'), 'biome': entry.get('biome'),
            'speed': entry.get('speed', 22), 'gait': entry.get('gait', 'walk'), 'anim': anim, 'stride': entry.get('stride', 1.0), 'idleDur': entry.get('idleDur', 0.28 if nI >= 6 else 0.42),
            'actDur': entry.get('actDur', 0.14), 'shadow': entry.get('shadow', 16), 'sitDrop': entry.get('sitDrop', 6), 'source': 'pixellab', 'pl_id': cid, 'frames': {'idle': ia, 'walk': wa, 'act': aa}, 'role': entry.get('role')}
    return info


if __name__ == '__main__':
    only = None
    if '--only' in sys.argv: only = sys.argv[sys.argv.index('--only') + 1].split(',')
    cast = json.load(open(os.path.join(HERE, 'pl_cast.json'), encoding='utf-8'))
    cj = os.path.join(OUT, 'chars.js'); txt = open(cj, encoding='utf-8').read(); head, js = txt.split('window.TD2_CHARS = ', 1); meta = json.loads(js.strip().rstrip(';'))
    for e in cast:
        if only and e['name'] not in only: continue
        try:
            action = meta['chars'].get(e['name'], {}).get('action')
            meta['chars'][e['name']] = pack(e)
            if action: meta['chars'][e['name']]['action'] = action
            print('packed', e['name'], meta['chars'][e['name']]['anim'], meta['chars'][e['name']]['size'], 'top', meta['chars'][e['name']]['top'], 'feet', meta['chars'][e['name']]['pivot'][1])
        except Exception as ex: print('FAILED', e['name'], repr(ex)[:160])
    # the runtime carries only the PixelLab cast; the hand-authored v2 pilot sheets stay in docs/tayduky/v2 (pilot page and src/)
    for n in [n for n, c in meta['chars'].items() if c.get('source') != 'pixellab']:
        del meta['chars'][n]
        try: os.remove(os.path.join(OUT, n + '.png'))
        except OSError: pass
    meta['cols'] = []; open(cj, 'w', encoding='utf-8').write(head + 'window.TD2_CHARS = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
