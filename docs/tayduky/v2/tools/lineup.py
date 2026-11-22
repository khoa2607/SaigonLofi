"""Character lineup sheets from the runtime sheets: every character, idle + walk frames, 4 directions, on light and dark. Output: docs/tayduky/v2/screenshots/lineup-*.png"""
import os, json
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..')); OUT = os.path.join(ROOT, 'docs', 'tayduky', 'v2', 'screenshots')
txt = open(os.path.join(ROOT, 'tayduky', 'chars', 'chars.js'), encoding='utf-8').read(); meta = json.loads(txt.split('window.TD2_CHARS = ', 1)[1].strip().rstrip(';'))
def bg(c): return Image.new('RGBA', (1, 1), c)
def sheet(names, fname, scale=3):
    names = [n for n in names if n in meta['chars']]
    rows = []
    for n in names:
        C = meta['chars'][n]; W, H = C['size']; im = Image.open(os.path.join(ROOT, 'tayduky', C['src'])).convert('RGBA'); A = C['anim']
        cols = [A['idle'][0], A['idle'][0] + 1] + [A['walk'][0] + k * max(1, A['walk'][1] // 4) for k in range(min(4, A['walk'][1]))]
        row = []
        for r in range(4):
            for c in cols: row.append(im.crop((c * W, r * H, (c + 1) * W, (r + 1) * H)))
        rows.append((n, W, H, row, len(cols)))
    cw = max(r[1] for r in rows); ch = max(r[2] for r in rows); ncol = rows[0][4]
    for mode, color in (('light', (244, 234, 216, 255)), ('dark', (30, 26, 42, 255))):
        sheetim = Image.new('RGBA', (4 * ncol * cw + 8, len(rows) * ch + 8), color)
        for ri, (n, W, H, row, nc) in enumerate(rows):
            for k, fr in enumerate(row): sheetim.alpha_composite(fr, (k * cw + (cw - W) // 2 + (k // nc) * 4, ri * ch + (ch - H) + 4))
        sheetim = sheetim.resize((sheetim.width * scale // 2 if scale % 2 == 0 else sheetim.width * scale, sheetim.height * scale // 2 if scale % 2 == 0 else sheetim.height * scale), Image.NEAREST)
        sheetim.save(os.path.join(OUT, '%s-%s.png' % (fname, mode)))
if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    import sys
    if len(sys.argv) > 2: sheet(sys.argv[2].split(','), sys.argv[1], 2); raise SystemExit
    sheet(['wukong', 'khi_linh', 'khi_lao', 'khi_con_small', 'khi_dan', 'khi_dan_b'], 'lineup-hoa-qua-son', 2)
    sheet([n for n in meta['chars'] if n.startswith('sister') or n.startswith('nhen_con') or n == 'tam_tang'], 'lineup-ban-to-dong', 2)
    print('ok')
