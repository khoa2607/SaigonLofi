"""Cao Lão Trang pig (PixelLab character ba6595ea..., standard quadruped, 4 directions; walk-4-frames generated for south and east only).
Sheet rows = down, left, right, up; columns = 4 idle (a 1 px breath) + 4 walk. left = mirrored east, up = the north rotation with a 1 px trot bob. Run from the repo root after downloading the PNGs into tayduky/chars-pl/raw/clt_pig/."""
import os, io, json, urllib.request
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..')); CH = os.path.join(ROOT, 'tayduky', 'chars'); RAW = os.path.join(ROOT, 'tayduky', 'chars-pl', 'raw', 'clt_pig'); os.makedirs(RAW, exist_ok=True)
CID = 'ba6595ea-cffa-43c3-bc23-322c6f7f5d31'
import zipfile
ZP = os.path.join(ROOT, 'tayduky', 'chars-pl', 'raw', 'clt_pig.zip')
if not os.path.exists(ZP):
    with urllib.request.urlopen('https://api.pixellab.ai/mcp/characters/%s/download' % CID) as r, open(ZP, 'wb') as f: f.write(r.read())
Z = zipfile.ZipFile(ZP)
def get(n):
    if n.startswith('rot_'): path = 'Idle/rotations/%s.png' % n[4:]
    else: d, i = n.split('_'); path = 'Idle/animations/walk-4-frames/%s/frame_%03d.png' % (d, int(i))
    return Image.open(io.BytesIO(Z.read(path))).convert('RGBA')
S = 56
def shift(im, dy): o = Image.new('RGBA', im.size, (0, 0, 0, 0)); o.paste(im, (0, dy), im); return o
walk_s = [get('south_%d' % i) for i in range(4)]; walk_e = [get('east_%d' % i) for i in range(4)]; walk_w = [e.transpose(Image.FLIP_LEFT_RIGHT) for e in walk_e]
rot = {k: get('rot_' + k) for k in ('south', 'east', 'north', 'west')}; north = [shift(rot['north'], dy) for dy in (0, -1, 0, -1)]
idle = {'down': [shift(rot['south'], dy) for dy in (0, 0, -1, -1)], 'left': [shift(rot['west'], dy) for dy in (0, 0, -1, -1)], 'right': [shift(rot['east'], dy) for dy in (0, 0, -1, -1)], 'up': [shift(rot['north'], dy) for dy in (0, 0, -1, -1)]}
walk = {'down': walk_s, 'left': walk_w, 'right': walk_e, 'up': north}
sheet = Image.new('RGBA', (8 * S, 4 * S), (0, 0, 0, 0)); bot = 0; top = 99
for r, d in enumerate(['down', 'left', 'right', 'up']):
    for c, f in enumerate(idle[d] + walk[d]):
        f = f.resize((S, S)) if f.size != (S, S) else f; sheet.paste(f, (c * S, r * S))
        bb = f.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
        if bb: bot = max(bot, bb[3]); top = min(top, bb[1])
sheet.save(os.path.join(CH, 'clt_pig.png'))
js = os.path.join(CH, 'chars.js'); s = open(js, encoding='utf8').read(); pre = s[:s.index('=') + 1]; data = json.loads(s[s.index('=') + 1:].strip().rstrip(';'))
data['chars']['clt_pig'] = {'src': 'chars/clt_pig.png', 'size': [S, S], 'pivot': [S // 2, bot - 2], 'top': top, 'title': ['Lợn', 'Pig'], 'biome': 'clt', 'speed': 14, 'gait': 'walk', 'anim': {'idle': [0, 4], 'walk': [4, 8]}, 'stride': 1.0, 'idleDur': 0.42, 'actDur': 0.14, 'shadow': 14, 'sitDrop': 6, 'source': 'pixellab', 'pl_id': CID, 'frames': {'idle': None, 'walk': 'walk-4-frames', 'act': None}, 'role': 'pig'}
open(js, 'w', encoding='utf8').write(pre + ' ' + json.dumps(data, ensure_ascii=False) + ';\n'); print('pig ok', bot, top)
