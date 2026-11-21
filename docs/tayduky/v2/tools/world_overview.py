"""Overview of the 15-region world: biome mask coloured by region, shaded by height, walkable tiles lightened, labelled. Input: JSON dumped by tmp (node: loadTW -> TWM.N, BIO, H, WALK, biomes). python world_overview.py world.json out.png"""
import json, sys
from PIL import Image, ImageDraw, ImageFont
d = json.load(open(sys.argv[1], encoding='utf8')); N = d['N']; S = 9
COL = ['#c8b2e0', '#e0703c', '#7a6a58', '#6a4a8c', '#9aa2a8', '#f0b848', '#3c9ccc', '#f4e4c4', '#e8d8a8', '#5a8a4a', '#d86a8a', '#4ca88c', '#c84a3a', '#5a6a9a', '#8a4a3a']
im = Image.new('RGB', (N * S, N * S), (20, 20, 28)); px = im.load(); dr = ImageDraw.Draw(im)
for j in range(N):
    for i in range(N):
        k = j * N + i; b = d['bio'][k]; c = tuple(int(COL[b % 15][x:x + 2], 16) for x in (1, 3, 5)); h = max(0, d['h'][k]); f = 0.55 + min(h, 14) * 0.035 + (0.12 if d['walk'][k] else 0)
        c = tuple(min(255, int(v * f)) for v in c)
        for y in range(S):
            for x in range(S): px[i * S + x, j * S + y] = c
for j in range(1, N):
    for i in range(1, N):
        k = j * N + i
        if d['bio'][k] != d['bio'][k - 1]: dr.line([(i * S, j * S), (i * S, j * S + S)], fill=(12, 12, 18), width=2)
        if d['bio'][k] != d['bio'][k - N]: dr.line([(i * S, j * S), (i * S + S, j * S)], fill=(12, 12, 18), width=2)
try: font = ImageFont.truetype('arial.ttf', 15)
except Exception: font = ImageFont.load_default()
for bid, title, built, cen in d['biomes']:
    x, y = (cen[0] + 0.5) * S, (cen[1] + 0.5) * S; t = bid.upper(); w = dr.textlength(t, font=font); dr.rectangle([x - w / 2 - 3, y - 10, x + w / 2 + 3, y + 8], fill=(0, 0, 0)); dr.text((x - w / 2, y - 9), t, fill=(255, 240, 200) if bid in ('clt', 'lhd') else (230, 230, 230), font=font)
im.save(sys.argv[2]); print('ok')
