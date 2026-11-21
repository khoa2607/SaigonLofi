"""Tây Du Ký asset library: catalog + contact sheets for everything reusable.

Reads tayduky/sprites/sprites.js (PixelLab object sprites, packed by pack_sprites.py) and tayduky/chars/chars.js (characters),
classifies them, and writes
  tayduky/sprites/library.json                 machine-readable catalog (category, biome tags, size, footprint hint, life behaviours, provenance)
  docs/tayduky/v2/library/<category>.png       contact sheets (light background, native size, 2x)
  docs/tayduky/v2/ASSET-LIBRARY.md             the human-readable index
Run: python build_library.py
"""
import os, json, re
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
SP = os.path.join(ROOT, 'tayduky', 'sprites'); CH = os.path.join(ROOT, 'tayduky', 'chars'); DOC = os.path.join(ROOT, 'docs', 'tayduky', 'v2'); LIB = os.path.join(DOC, 'library'); os.makedirs(LIB, exist_ok=True)

# prefix -> (category, biome tags, footprint hint in tiles, life behaviours the renderer gives it, runtime kind, PixelLab job)
CLS = {
    'hvd_fortress': ('hvd-props', ['hvd'], '3x3', 'monumental cave fortress, fire glow', 'hvdfortress', '9e37745f'),
    'hvd_mountain': ('hvd-props', ['hvd'], '3x3', 'crimson mountain landmark', 'hvdpeak', '82e1c210'),
    'hvd_hut': ('hvd-props', ['hvd'], '2x2', 'demon settlement', 'hvdhut', 'f2a42172'),
    'hvd_ritual': ('hvd-props', ['hvd'], '2x2', 'True Fire ritual platform', 'hvdritual', '9556cccf'),
    'hvd_tower': ('hvd-props', ['hvd'], '2x2', 'mountain watchtower', 'hvdtower', '21303d99'),
    'hvd_pine': ('hvd-props', ['hvd'], '1x1', 'wind sway', 'hvdpine', 'b0093b9e'),
    'hvd_bridge': ('hvd-props', ['hvd'], '2x1', 'ravine bridge', 'hvdbridge', 'ad981b8c'),
    'hvd_brazier': ('hvd-props', ['hvd'], '1x1', 'fire glow', 'hvdbrazier', '92d25200'),
    'hvd_banner': ('hvd-props', ['hvd'], '1x1', 'wind sway', 'hvdbanner', '973f52b7'),
    'hvd_waterfall': ('hvd-props', ['hvd'], '2x1', 'animated spray overlay', 'hvdwaterfall', 'f8883123'),
    'bt_cave': ('silk-props', ['btd'], '3x1', 'landmark cave', 'btcave', '0c90a2ec'),
    'bt_throne': ('silk-props', ['btd'], '2x2', 'ritual throne', 'btthrone', '20f9d434'),
    'bt_prison': ('silk-props', ['btd'], '2x2', 'elevated silk prison', 'btprison', '1c1ce3f8'),
    'tc_monument': ('heaven', ['tc'], '5x2 landmark', 'ceremonial gate, integer 2x', 'tcgate', '1348df9c'),
    'tc_kiln': ('heaven', ['tc'], '2x2', 'trigram fire mouth, smoke and sparks', 'tcfurnace', '855cdb4e'),
    'tc_bank': ('heaven', ['tc'], 'cloud sea', 'slow drifting banks', 'tccloud', '445431e5'),
    'tc_silklamp': ('heaven', ['tc'], '1x1', 'red lantern glow', 'tcsilklamp', '6507a136'),
    'tc_gatehouse': ('heaven', ['tc'], '2x2', 'gatehouse behind main arch', 'tcgatehouse', '94673d0b'),
    'tc_pavilion': ('heaven', ['tc'], '2x2', 'banquet pavilion', 'tcpavilion', 'e2fdc359'),
    'tc_pillar': ('heaven', ['tc'], '1x1', 'paired jade huabiao', 'tcpillar', '9c2b0f9e'),
    'tc_brazier': ('heaven', ['tc'], '1x1', 'firelight', 'tcbrazier', 'd65dbacd'),
    'tc_cloud': ('heaven', ['tc'], 'cloud sea', 'slow drift', 'tccloud', '81f96319'),
    'tc_scroll': ('heaven', ['tc'], 'cloud sea', 'slow drift', 'tccloud', 'a81498c0'),
    'tc_gate': ('heaven', ['tc'], '1x1', 'gate landmark', 'tcgate', '1348df9c'),
    'tc_palace': ('heaven', ['tc'], '1x1', 'palace landmark', 'tcpalace', 'eac2e662'),
    'tc_furnace': ('heaven', ['tc'], '1x1', 'flickering glow, rising smoke', 'tcfurnace', 'e52bfc0f'),
    'tc_bridge': ('heaven', ['tc'], 'cloud-channel crossing', 'walkable bridge over animated cloud stream', 'tcbridge', '3c8beb65'),
    'tc_lantern': ('heaven', ['tc'], '1x1', 'golden glow', 'tclantern', '380f2729'),
    'tc_peach': ('heaven', ['tc'], '1x1', 'sway and drifting petals', 'tcpeach', 'c4da708e'),
    'peachtree': ('trees', ['hqs', 'earthly'], '1x1 (canopy 2.5 tiles)', 'sway (6 px strips), drifting petals', 'bigpeach', '1423100d'),
    'hut': ('buildings', ['hqs', 'earthly'], '2x2', 'residents enter and leave (door POI), lantern glow at night', 'hut', '64e8709c'),
    'shrine': ('buildings', ['hqs', 'heaven'], '2x2', 'residents pray / sit at the steps', 'shrine', '0e249abe'),
    'hall': ('buildings', ['hqs', 'heaven'], '3x3', 'landmark; prayers at the stairs', 'hall', '4e334cf4'),
    'stall': ('stalls', ['hqs', 'earthly'], '2x2', 'residents trade, carry peaches away', 'stall', '7d079980'),
    'statue': ('statues', ['hqs', 'heaven'], '1x1', 'landmark', 'statue', '9de37e22'),
    'playground': ('village-props', ['hqs'], '2x2', 'kids climb the frame and drop down', 'playground', '77428071'),
    'bridge': ('bridges', ['hqs', 'earthly'], 'spans a 2-tile stream (mirror to cross along i)', 'residents cross it; water underneath animates', 'hbridge', 'f47ea782'),
    'tent': ('silk-props', ['btd', 'cave'], '2x2', 'residents enter and leave; silk shimmer, green lantern glow', 'tent', '7277f9bd'),
    'altar': ('silk-props', ['btd', 'cave'], '2x2', 'sisters tend it; egg glow pulses, silk shimmers, violet spores', 'altar', '97819ce3'),
    'silkbridge': ('bridges', ['btd', 'cave'], 'spans a 3-tile chasm along j', 'silk shimmer; the abyss underneath', 'silkbr', '0caab83e'),
    'spire': ('silk-props', ['btd', 'cave'], '1x1 or 2x2', 'silk shimmer', 'bspire', '3e2ddeec'),
    'loom': ('silk-props', ['btd', 'cave'], '2x2', 'sisters weave here; silk threads run from their sleeves', 'bloom', 'cd7a9fd8'),
    'crystals': ('crystals', ['btd', 'cave'], '1x1', 'pulse (glow mask), silk shimmer, lights at night, spores', 'pcrystals', 'cd4218c0'),
    'mush': ('mushrooms', ['btd', 'cave'], '1x1', 'pulse + flicker, rising spores', 'bigmush', '4e93cb98'),
    'bath': ('village-props', ['btd'], '2x2', 'not placed yet (hot-spring bath terrace)', 'bath', '274abac0'),
}
catalog = {'sprites': {}, 'characters': {}}
man = json.loads(open(os.path.join(SP, 'sprites.js'), encoding='utf-8').read().split('window.TW_SPRITES = ', 1)[1].strip().rstrip(';'))
for name, m in man.items():
    pre = re.sub(r'_[a-d]$', '', name)
    c = CLS.get(pre, ('misc', [], '', '', '', ''))
    tool = 'create_map_object' if pre in {'bt_cave','bt_throne','bt_prison','tc_bank','tc_silklamp','tc_gatehouse','tc_pillar','tc_brazier','tc_cloud','tc_scroll'} else 'create_1_direction_object'
    catalog['sprites'][name] = {'file': 'sprites/%s.png' % name, 'size': [m['w'], m['h']], 'anchor_y': m['py'], 'category': c[0], 'biomes': c[1], 'footprint': c[2], 'life': c[3], 'runtime_kind': c[4], 'source': 'pixellab ' + tool + ' job ' + c[5]}
chars = json.loads(open(os.path.join(CH, 'chars.js'), encoding='utf-8').read().split('window.TD2_CHARS = ', 1)[1].strip().rstrip(';'))['chars']
for name, c in chars.items():
    catalog['characters'][name] = {'file': c['src'], 'title': c.get('title'), 'biome': c.get('biome'), 'size': c['size'], 'anim': c['anim'], 'action': c.get('action'), 'source': c.get('source', 'hand-authored (docs/tayduky/v2/src)'), 'role': c.get('role')}
    if c.get('bantoAction'): catalog['characters'][name]['bantoAction'] = c['bantoAction']
    if c.get('hvdAction'): catalog['characters'][name]['hvdAction'] = c['hvdAction']
json.dump(catalog, open(os.path.join(SP, 'library.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# contact sheets per category
cats = {}
for n, c in catalog['sprites'].items(): cats.setdefault(c['category'], []).append(n)
for cat, names in cats.items():
    ims = [Image.open(os.path.join(SP, n + '.png')).convert('RGBA') for n in names]
    pad = 10; W = sum(i.width + pad for i in ims) + pad; H = max(i.height for i in ims) + 2 * pad + 12
    sh = Image.new('RGBA', (W, H), (236, 226, 238, 255)); d = ImageDraw.Draw(sh); x = pad
    for n, im in zip(names, ims): sh.alpha_composite(im, (x, pad)); d.text((x, H - 12), n, fill=(60, 40, 70, 255)); x += im.width + pad
    sh.save(os.path.join(LIB, cat + '.png'))
# characters sheet (south idle frame)
names = list(chars); ims = []
for n in names:
    c = chars[n]; im = Image.open(os.path.join(ROOT, 'tayduky', c['src'])).convert('RGBA'); W, H = c['size']; ims.append(im.crop((0, 0, W, H)))
pad = 8; W = sum(i.width + pad for i in ims) + pad; H = max(i.height for i in ims) + 2 * pad + 12
sh = Image.new('RGBA', (W, H), (236, 226, 238, 255)); d = ImageDraw.Draw(sh); x = pad
for n, im in zip(names, ims): sh.alpha_composite(im, (x, pad)); d.text((x, H - 12), n[:11], fill=(60, 40, 70, 255)); x += im.width + pad
sh.save(os.path.join(LIB, 'characters.png'))

md = ['# Tây Du Ký asset library\n', 'Reusable, Tây Du Ký-only art for future biomes. Generated by `tools/build_library.py` from `tayduky/sprites/library.json`; do not edit by hand.\n',
      'Provenance: object sprites and characters are **PixelLab-generated** (see `PIXELLAB.md` for prompts and jobs); terrain, cliffs, water, stairs, vegetation scatter and effects are code-painted in `tayduky/tw-art.js` and `tw-fx.js`.\n',
      '## Where things live\n', '| What | Path |', '|---|---|', '| Object sprites (trimmed PNG, native pixels) | `tayduky/sprites/<name>.png` (+ `sprites.js` manifest, `library.json` catalog) |', '| Raw PixelLab candidates | `tayduky/sprites/raw/` |',
      '| Character sheets (4 directions x idle/walk/act columns) | `tayduky/chars/<name>.png` + `chars.js` |', '| Raw character ZIPs | `tayduky/chars-pl/raw/` |', '| Packers | `docs/tayduky/v2/tools/pack_sprites.py`, `pack_pl_chars.py`, `build_library.py` |', '| Contact sheets | `docs/tayduky/v2/library/*.png` |\n',
      '## How to add a prop to a biome\n', '1. Generate it (`create_1_direction_object`, "isometric 2:1 view ... transparent background"), download the chosen frame into `tayduky/sprites/raw/`, add it to `tools/sprite_picks.json`, run `pack_sprites.py`.',
      '2. Map it to a runtime kind in `IMGKINDS` (`tw-art.js`); add `LIFE` hooks by name prefix (`GLOWS`, `SILKS`, `SWAY`).', '3. Place it with `prop(kind, i, j, {fp: [w, h]})` in `tw-map.js` and give residents a POI (`poi(kind, biome, i, j)`) if they should use it.\n']
for cat, names in sorted(cats.items()):
    md += ['## ' + cat, '', '![%s](library/%s.png)\n' % (cat, cat), '| Sprite | Size | Biomes | Footprint | Life | Source |', '|---|---|---|---|---|---|']
    for n in names:
        c = catalog['sprites'][n]; md.append('| `%s` | %dx%d | %s | %s | %s | %s |' % (n, c['size'][0], c['size'][1], ', '.join(c['biomes']), c['footprint'], c['life'], c['source']))
    md.append('')
md += ['## characters', '', '![characters](library/characters.png)\n', '| Name | Biome | Canvas | Animations | Source |', '|---|---|---|---|---|']
for n, c in catalog['characters'].items(): md.append('| `%s` | %s | %dx%d | %s | %s |' % (n, c['biome'], c['size'][0], c['size'][1], ', '.join('%s x%d' % (k, v[1]) for k, v in c['anim'].items()) + (', ' + c['action']['clip'] if c.get('action') else '') + (', ' + c['bantoAction']['clip'] if c.get('bantoAction') else '') + (', ' + c['hvdAction']['clip'] if c.get('hvdAction') else ''), c['source']))
open(os.path.join(DOC, 'ASSET-LIBRARY.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
print(len(catalog['sprites']), 'sprites,', len(catalog['characters']), 'characters,', len(cats), 'categories')
