"""Pack PixelLab Fire Cloud Cave action clips to the runtime's fixed feet anchor.

Run after pack_pl_chars.py has refreshed the four character ZIPs.
"""
import io
import json
import os
import statistics
import zipfile
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
RAW = os.path.join(ROOT, 'tayduky/chars-pl/raw')
OUT = os.path.join(ROOT, 'tayduky/chars/actions')
META = os.path.join(ROOT, 'tayduky/chars/chars.js')
CLIPS = {'hvd_redboy': 'hvd_true_fire', 'hvd_guanyin': 'hvd_divine_water',
         'hvd_guard': 'hvd_spear', 'hvd_trainee': 'hvd_spell'}
DIRS = ['south', 'west', 'east', 'north']

def load(z, path):
    return Image.open(io.BytesIO(z.read(path))).convert('RGBA')

def bbox(im):
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not box:
        raise ValueError('empty action frame')
    return box

os.makedirs(OUT, exist_ok=True)
head, js = open(META, encoding='utf8').read().split('window.TD2_CHARS = ', 1)
meta = json.loads(js.strip().rstrip(';'))
for name, clip in CLIPS.items():
    with zipfile.ZipFile(os.path.join(RAW, name + '.zip')) as z:
        states = json.loads(z.read('metadata.json'))['states']
        state = next(st for st in states if st['character']['id'] == meta['chars'][name]['pl_id'])
        frames = state['frames']
        action = frames['animations'][clip]
        walk = next(v for k, v in frames['animations'].items() if k.startswith('walking') or k == 'hvd_walk')
        sheet = Image.new('RGBA', (80 * 8, 80 * 4))
        for row, direction in enumerate(DIRS):
            source = [load(z, f) for f in action[direction][-8:]]
            if len(source) != 8:
                raise ValueError(f'{name}/{direction} needs eight frames')
            boxes = [bbox(f) for f in source]
            left, right = min(b[0] for b in boxes), max(b[2] for b in boxes)
            top, bottom = min(b[1] for b in boxes), max(b[3] for b in boxes)
            walking = [load(z, f) for f in walk[direction]]
            target_height = statistics.median(bbox(f)[3] - bbox(f)[1] for f in walking)
            scale = min(target_height / (bottom - top), 76 / (right - left))
            for col, src in enumerate(source):
                crop = src.crop((left, top, right, bottom))
                crop = crop.resize((round(crop.width * scale), round(crop.height * scale)), Image.Resampling.NEAREST)
                x, y = 40 - crop.width // 2, 68 - crop.height
                if x < 0 or y < 0 or x + crop.width > 80 or y + crop.height > 80:
                    raise ValueError(f'{name}/{direction}/{col} clips')
                sheet.alpha_composite(crop, (80 * col + x, 80 * row + y))
        sheet.save(os.path.join(OUT, name + '.png'))
        meta['chars'][name]['hvdAction'] = {'src': 'chars/actions/' + name + '.png',
            'size': [80, 80], 'pivot': [40, 68], 'count': 8, 'duration': 0.18, 'clip': clip}
        print(name, clip, 'packed')
open(META, 'w', encoding='utf8').write(head + 'window.TD2_CHARS = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
