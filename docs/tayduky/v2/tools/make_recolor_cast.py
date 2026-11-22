"""Tây Du Ký v2 - zero-cost cast for Cao Lão Trang and Liên Hoa Động: palette-swapped copies of existing PixelLab sheets.
Every entry: new name <- base sheet + a list of colour rules (hue range / sat range / val range -> new hue, sat gain, val gain) -> tayduky/chars/<name>.png and a TD2_CHARS entry.
Run from the repo root: python docs/tayduky/v2/tools/make_recolor_cast.py"""
import os, json, colorsys, re
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..')); CH = os.path.join(ROOT, 'tayduky', 'chars')
JS = os.path.join(CH, 'chars.js')
# rule: (hmin, hmax, smin, smax, vmin, vmax, newHue or None, satGain, valGain, valAdd); hue in degrees; first matching rule wins
LOW = (0, 360, 0.0, 0.28, 0.0, 1.0)   # greys / whites (clothes in neutral colours)
def R(h0, h1, s0, s1, v0, v1, nh, sg=1.0, vg=1.0, va=0.0): return (h0, h1, s0, s1, v0, v1, nh, sg, vg, va)
CAST = [
  # ---- Cao Lão Trang
  dict(name='gao_taigong', base='bgt_elder', title=['Cao Thái Công', 'Old Gao, the village patriarch'], role='gao', biome='clt', speed=11, rules=[R(0, 360, 0, 0.3, 0.25, 1, 28, 0, 1.0, 0.0), R(0, 360, 0, 0.3, 0.25, 1, 28, 1.0)]),
  dict(name='gao_cuilan', base='bgt_girl', title=['Cao Thúy Lan', 'Gao Cuilan, the daughter'], role='gao', biome='clt', speed=14, rules=[R(0, 360, 0, 0.17, 0.62, 1, 150, 0, 1, 0)]),
  dict(name='gao_granny', base='bgt_crone', title=['Bà cụ họ Cao', 'Granny Gao'], role='gao', biome='clt', speed=10, rules=[R(0, 360, 0, 0.3, 0.2, 0.85, 215, 0, 1.0, 0.04)]),
  dict(name='bajie_son', base='hds_baker', title=['Chữ Cương Liệp (con rể họ Cao)', 'Zhu Gangsha, the son-in-law (Bajie in disguise)'], role='son', biome='clt', speed=15, rules=[R(0, 360, 0, 0.3, 0.5, 1, 222, 0, 0.8, -0.05)]),
  dict(name='clt_farmer', base='tth_fisher', title=['Nông dân', 'Farmer'], role='farmer', biome='clt', speed=13, rules=[R(180, 260, 0.2, 1, 0.2, 1, 36, 0.9, 1.05)]),
  dict(name='clt_farmer_b', base='nhs_hermit', title=['Nông dân già', 'Old farmer'], role='farmer', biome='clt', speed=11, rules=[R(0, 360, 0.15, 1, 0.2, 1, None, 1.0, 1.0)]),
  dict(name='clt_child', base='hps_novice', title=['Trẻ chăn vịt', 'Village child'], role='child', biome='clt', speed=19, rules=[R(0, 360, 0.15, 1, 0.2, 1, 12, 1.5, 1.1, 0.04)]),
  dict(name='clt_ox', base='hds_mule', title=['Trâu', 'Water buffalo'], role='ox', biome='clt', speed=9, rules=[R(0, 360, 0, 1, 0.0, 1, 24, 1.8, 1.05, 0.04)]),
  # ---- Liên Hoa Động
  dict(name='lhd_gold_king', base='kim_si', title=['Kim Giác Đại Vương', 'Golden Horn Great King'], role='goldking', biome='lhd', speed=18, rules=[]),
  dict(name='lhd_silver_king', base='kim_si', title=['Ngân Giác Đại Vương', 'Silver Horn Great King'], role='silverking', biome='lhd', speed=18, rules=[R(20, 70, 0.25, 1, 0.2, 1, 205, 0.45, 1.05, 0.12), R(0, 360, 0, 0.25, 0.1, 1, 215, 0.4, 1.12, 0.06)]),
  dict(name='lhd_guard', base='hvd_guard', title=['Yêu binh Liên Hoa', 'Lotus Cave demon guard'], role='guard', biome='lhd', speed=15, rules=[R(0, 60, 0.3, 1, 0.1, 1, 200, 0.7, 1.0), R(300, 360, 0.3, 1, 0.1, 1, 200, 0.7, 1.0)]),
  dict(name='lhd_wolf', base='hps_minion', title=['Sói tinh canh cổng', 'Wolf-demon sentry'], role='sentry', biome='lhd', speed=19, rules=[R(0, 360, 0.1, 1, 0.1, 1, 262, 1.0, 1.0)]),
  dict(name='lhd_imp', base='tth_imp', title=['Tiểu yêu hầu động', 'Cave servant imp'], role='servant', biome='lhd', speed=16, rules=[R(150, 230, 0.2, 1, 0.1, 1, 285, 1.0, 1.0)]),
  dict(name='lhd_gold_boy', base='hps_novice', title=['Kim Lô đồng tử', 'Golden Furnace Boy'], role='boy', biome='lhd', speed=15, rules=[R(0, 360, 0.1, 1, 0.2, 1, 46, 1.4, 1.2, 0.08)]),
  dict(name='lhd_silver_boy', base='hps_novice', title=['Ngân Lô đồng tử', 'Silver Furnace Boy'], role='boy', biome='lhd', speed=15, rules=[R(0, 360, 0.1, 1, 0.2, 1, 208, 0.45, 1.2, 0.18)]),
]
def recolor(img, rules):
    if not rules: return img.copy()
    px = img.load(); out = img.copy(); po = out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a < 8: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255); hd = h * 360
            for (h0, h1, s0, s1, v0, v1, nh, sg, vg, va) in rules:
                if h0 <= hd <= h1 and s0 <= s <= s1 and v0 <= v <= v1:
                    if nh is not None: h = (nh % 360) / 360
                    s = min(1, s * sg + (0.28 if (nh is not None and sg == 0) else 0)) if sg != 0 else min(0.55, 0.38 + v * 0.1) if nh is not None else s
                    v = max(0, min(1, v * vg + va)); break
            nr, ng, nb = colorsys.hsv_to_rgb(h, s, v); po[x, y] = (int(nr * 255), int(ng * 255), int(nb * 255), a)
    return out
s = open(JS, encoding='utf8').read(); pre = s[:s.index('=') + 1]; data = json.loads(s[s.index('=') + 1:].strip().rstrip(';'))
for c in CAST:
    base = data['chars'][c['base']]; im = Image.open(os.path.join(CH, c['base'] + '.png')).convert('RGBA'); recolor(im, c['rules']).save(os.path.join(CH, c['name'] + '.png'))
    e = json.loads(json.dumps(base)); e.update(src='chars/%s.png' % c['name'], title=c['title'], biome=c['biome'], role=c['role'], speed=c['speed'], source='recolour', pl_id=base.get('pl_id'))
    for k in ('action', 'bantoAction'): e.pop(k, None)
    data['chars'][c['name']] = e
open(JS, 'w', encoding='utf8').write(pre + ' ' + json.dumps(data, ensure_ascii=False) + ';\n'); print('ok', len(CAST))
