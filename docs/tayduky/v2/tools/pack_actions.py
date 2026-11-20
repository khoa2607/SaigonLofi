"""Pack PixelLab custom action clips alongside the existing cast, without changing walk sheets.

The custom model starts from the larger rotation art, whereas the runtime uses the
smaller walking art. Match their per-direction heights with nearest-neighbour pixels
and a fixed pivot per direction. Abort on missing frames or clipped artwork.
Run after refreshing the relevant ZIPs in tayduky/chars-pl/raw/.
"""
import io
import json
import os
import statistics
import zipfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
CAST = os.path.join(ROOT, 'tayduky', 'chars')
RAW = os.path.join(ROOT, 'tayduky', 'chars-pl', 'raw')
OUT = os.path.join(CAST, 'actions')
DIRS = ['south', 'west', 'east', 'north']
NAMES = ['wukong'] + ['sister%d_%s' % x for x in enumerate(['violet', 'teal', 'rose', 'amber', 'crimson', 'silver', 'indigo'], 1)] + ['tc_laojun','tc_guard','tc_fairy']
os.makedirs(OUT, exist_ok=True)

def load(z, path):
    return Image.open(io.BytesIO(z.read(path))).convert('RGBA')

def bbox(im):
    b = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not b: raise ValueError('empty frame')
    return b

def main():
    path = os.path.join(CAST, 'chars.js')
    head, js = open(path, encoding='utf-8').read().split('window.TD2_CHARS = ', 1)
    meta = json.loads(js.strip().rstrip(';'))
    for name in NAMES:
        clip = {'wukong':'staff-practice', 'tc_laojun':'tend-furnace', 'tc_guard':'guard-watch', 'tc_fairy':'tend-peach'}.get(name, 'silk-weaving')
        with zipfile.ZipFile(os.path.join(RAW, name + '.zip')) as z:
            state = json.loads(z.read('metadata.json'))['states'][0]
            frames = state['frames']; anim = frames['animations'][clip]
            walk = next(v for k, v in frames['animations'].items() if k.startswith('walking'))
            sheet = Image.new('RGBA', (80 * 8, 80 * 4))
            for row, direction in enumerate(DIRS):
                fs = anim[direction]
                if len(fs) != 8: raise ValueError('%s %s needs eight frames' % (name, direction))
                rot = load(z, frames['rotations'][direction]); rb = bbox(rot)
                heights = [bbox(load(z, p))[3] - bbox(load(z, p))[1] for p in walk[direction]]
                ratio = statistics.median(heights) / (rb[3] - rb[1])
                # The enlarged custom canvas is centered on the source rotation.
                first = load(z, fs[0]); scale = ratio
                target = (round(first.width * scale), round(first.height * scale))
                pivot_x, pivot_y = 40, 68
                cx = first.width / 2
                baseline = first.height / 2 + (rb[3] - rot.height / 2)
                ox = round(pivot_x - cx * scale); oy = round(pivot_y - baseline * scale)
                for col, f in enumerate(fs):
                    im = load(z, f)
                    if im.size != first.size: raise ValueError('inconsistent canvas')
                    im = im.resize(target, Image.Resampling.NEAREST); b = bbox(im)
                    if ox + b[0] < 0 or oy + b[1] < 0 or ox + b[2] > 80 or oy + b[3] > 80:
                        raise ValueError('%s %s frame %d would clip' % (name, direction, col))
                    sheet.alpha_composite(im, (80 * col + ox, 80 * row + oy))
                print(name, direction, 'scale', round(ratio, 3), 'offset', ox, oy)
            sheet.save(os.path.join(OUT, name + '.png'))
            meta['chars'][name]['action'] = {'src': 'chars/actions/' + name + '.png', 'size': [80, 80], 'pivot': [40, 68], 'count': 8, 'duration': 0.18, 'clip': clip}
    open(path, 'w', encoding='utf-8').write(head + 'window.TD2_CHARS = ' + json.dumps(meta, ensure_ascii=False) + ';\n')

if __name__ == '__main__': main()
