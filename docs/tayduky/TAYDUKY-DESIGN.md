# Journey to the West — A Living Legend (Tây Du Ký — Huyền Thoại Sống): Design Document (v0.3)

Lofi Worlds, World 3. Status: **design v0.3. The map size and layout are locked by the owner; the art pilot is in progress; no world code yet.** Branch `feature/tayduky-world`.
This document follows step 1 of `docs/WORLD-BUILDER-GUIDE.md`. The platform rules (observation only, isometric, code-drawn art, crisp pixels,
bilingual UI, no loading screen) are inherited and not repeated here.

---

## 0. Decisions already made by the owner

v0.2 changes from v0.1: up to 5 signatures at once (D9); readability markers (D14); loops last 5–10 minutes (D15); no journal and no world setting (D12); the bathing scene is kept (§4.8); Lôi Âm Tự is a huge temple (D16, §4.11).
v0.3 changes: **the whole map is Saigon-sized and each biome is small** (D13, §2.1, locked); a diamond layout of 1–3–3–3–1 columns running east to west (§2.2, locked); **no calm biomes**, every biome is full of activity (D17); instrument accents always quieter than the lofi music (§8); the gallery title (D18).

| # | Decision |
|---|---|
| D1 | **One large, continuous isometric map** holds about 10 biomes side by side. Many things happen at once, there are no scene transitions, and there is no biome switcher, ticker or fly-to button. The viewer pans and zooms freely and discovers events by roaming. Mood reference: the last chapter of Black Myth: Wukong, where the world keeps replaying its stories on its own. |
| D2 | **All ~10 biomes are in scope**, not a 3-biome MVP. Biomes are fixed, authored and loop, so content grows biome by biome. |
| D3 | Each biome has a **strong, distinct colour identity and geography**. The palette table in §3 is approved. (Black Myth's per-chapter colour identity is the *principle* we borrow. No designs, characters or compositions are copied from it or any other adaptation.) |
| D4 | **Biome borders carry both palettes** (Hollow Knight-style). The edge band mixes the neighbour's colours and props. |
| D5 | Heavenly realms (Thiên Cung, Buddha's palm, Lôi Âm Tự) are **flat regions on the ground**, made to read through clouds and colour. |
| D6 | **No pilgrim party walks across the map.** Each biome has its own cast, which appears, plays its story, leaves and comes back. Duplicate Wukongs in different biomes are fine. |
| D7 | Three activity layers: **ambient** (always on), **mini events** (now and then, with many variants) and **signature events** (rare, with a beginning, middle and end). |
| D8 | **Living Story Loop** per biome (Peaceful, then Foreshadowing, Signature, Aftermath, Gradual reset). "Reset the story, never the world": no fade, no reload, no snapping back. |
| D9 | **Global Story Director:** up to **5 signature events at once** (a lively world is fine), but **never in two biomes that share a border**. |
| D10 | One shared time of day. **Each biome interprets weather its own way** (rain becomes a flower rain in Thiên Cung, an ash rain in Hỏa Diệm Sơn, fog in Bạch Cốt Lĩnh). **Seasons apply only to earthly biomes.** |
| D11 | At max zoom-out the viewer sees **3–5 biomes**. |
| D12 | The viewer only does small things: music (play, choose a track or YouTube), time of day, weather (including each biome's special weather), seasons, volume, zoom. **No world-specific setting, no journal, no event list, nothing sequential.** Each biome runs by itself. |
| D13 | **The whole map is the size of SaigonLofi's map (160 × 160 tiles); each biome is a small, dense area of about 46 × 46 tiles** (§2.1). |
| D14 | **Each biome is readable for people who don't know Journey to the West** (§4.0). |
| D15 | **One story loop takes 5–10 minutes**, depending on the biome. |
| D16 | Lôi Âm Tự stays and is a showpiece: a huge, towering temple. |
| D17 | **No biome is calm.** Every biome is busy with ambient life, mini events and signatures; biomes differ only in loop length (5–10 min) and mood. |
| D18 | Gallery title: **"Journey to the West — A Living Legend"** / **"Tây Du Ký — Huyền Thoại Sống"**. |

## 1. Fantasy and pillars

*A living picture-book of Journey to the West: ten legendary places, each replaying its story forever. Everyone lives their daily life there, the legends
come and go, and the world remembers a little of each one.*

1. **Every place is a legend.** Each biome is recognisable at a glance from its landmark and its colours.
2. **Always alive, never frantic.** Busy life everywhere, with several legends playing out at once across the map, but each one stays readable and gentle (lofi first).
3. **Stories leave footprints.** Aftermath and slow recovery are as watchable as the event itself.
4. **Discovery by wandering.** Foreshadowing is visible from afar, so the viewer drifts toward it.
5. **Respectful and cozy.** Sacred figures are dignified, comedy belongs to Wukong and Bát Giới, nothing is gruesome, and defeated demons dissolve into mist or retreat.

## 2. Map

### 2.1 Scale (locked)

| | |
|---|---|
| **Whole map** | **160 × 160 tiles, the same as SaigonLofi** (25,600 tiles; T = 8 units, K = 2 art px per unit, so 1280 × 1280 world units) |
| **One biome** | about **2,100 tiles on average (around 46 × 46)**, about 1/11 of the map. Showpiece biomes are larger (Lôi Âm Tự, Thiên Cung, Hoa Quả Sơn: around 55 × 55); compact ones are smaller (Bàn tay Phật, Ngũ Hành Sơn: around 38 × 38) |
| **Edge bands** | 4–6 tiles wide (§3.3) |
| **Margins** | about 10% of the map is cloud sea and the Đông Hải coast around the edges |
| **Population** | about 40 characters per biome, about 450 in total |

**Zoom at 1080p** (the same integer-pixel rules and the same single art density as SaigonLofi, with no extra art level):

| Zoom step | Device px per art px | Visible |
|---|---|---|
| **Widest** (Saigon's widest) | 1 | about 960 × 540 units, roughly a third of the map's area: **3–5 biomes** |
| **Default** | 2 | about **one biome** filling the screen |
| **Close** | 3–6 | one landmark or one scene |

Larger screens (1440p, 4K) see more at the widest step. The widest step is clamped the way Saigon clamps it, so the view never extends past the map.
At about 450 characters, the simulation cost is below Holdfast's peak.

### 2.2 Layout (locked): a diamond of 1–3–3–3–1 columns, east to west

An isometric map is a diamond on screen. The 11 biomes fill it in five columns of **1–3–3–3–1**. They run from **east (right) to west (left)** in roughly the novel's
order of the journey:

```
          WEST ◄────────────────── the road to the scriptures ──────────────────► EAST
 top                 Hỏa Diệm Sơn     Bạch Cốt Lĩnh     Thiên Cung
 middle  Lôi Âm Tự   Nữ Nhi Quốc      Cao Lão Trang     Bàn tay Phật     Hoa Quả Sơn  ~ Đông Hải
 bottom              Bàn Tơ Động      Thông Thiên Hà    Ngũ Hành Sơn
```

- **Lôi Âm Tự is at the western tip**, the end of the journey. Its towering temple stands at the map's corner, so it hides no other biome; above it on screen is only cloud sea.
- **Hoa Quả Sơn is at the eastern tip**, a mountain jutting into Đông Hải.
- **The Buddha's palm sits directly above Ngũ Hành Sơn**, as in the novel: the palm comes down and becomes the mountain. **Thiên Cung borders Hoa Quả Sơn.**
- **Ngũ Hành Sơn touches the map's lower edge**, so when Tam Tạng frees Wukong, the two walk off the map edge and disappear (§4.4).
- **Thông Thiên Hà** runs along the lower edge and drains east into Đông Hải. Its banks mark several borders.
- The heavenly regions (Thiên Cung, the palm, Lôi Âm Tự) are flat ground (D5). Cloud banks, light and colour set them apart from the earth.
- The diagram shows topology, not straight lines. Real borders are organic: ridges, river banks, cloud banks and noise-warped edges.

### 2.3 Adjacency (for the Director)

Two biomes are **adjacent** when they **share a border side**. Diagonal corners do not count, because organic borders barely touch there. Lists per biome:
```
LAT: HDS, NNQ, BTD
HDS: LAT, NNQ, BCL        BCL: HDS, CLT, TC         TC:  BCL, BTP, HQS
NNQ: LAT, HDS, BTD, CLT   CLT: NNQ, BCL, TTH, BTP   BTP: CLT, TC, NHS, HQS     HQS: TC, BTP, NHS
BTD: LAT, NNQ, TTH        TTH: BTD, CLT, NHS        NHS: TTH, BTP, HQS
```
(LAT Lôi Âm Tự · BTP Bàn tay Phật · TC Thiên Cung · HDS Hỏa Diệm Sơn · NHS Ngũ Hành Sơn · CLT Cao Lão Trang · HQS Hoa Quả Sơn ·
BTD Bàn Tơ Động · NNQ Nữ Nhi Quốc · TTH Thông Thiên Hà · BCL Bạch Cốt Lĩnh)

This is **11 biomes**. Five can run signatures at once with no two adjacent, for example Hỏa Diệm Sơn, Bàn Tơ Động, Cao Lão Trang, Thiên Cung and Ngũ Hành Sơn. The cap of 5 (D9) is therefore reachable.

**Tall landmarks are placed where nothing stands behind them on screen:** Lôi Âm Tự's temple at the western tip, the finger pillars and the heavenly gate on the upper edges. In isometric view, things higher on the screen are *behind*, so tall sprites there rise into the cloud sea without hiding other biomes. They also work as beacons that can be seen from across the map.

## 3. Colour system

### 3.1 Biome palettes (approved)

| Biome | Dominant tones | Light / glow | Night mood |
|---|---|---|---|
| Hoa Quả Sơn | jade green, white waterfall, peach-blossom pink | warm sun on wet rock | blue moonlit falls, fireflies |
| Thiên Cung / Vườn Đào | ivory, gold, pink-violet cloud | gold halo, glowing peaches | violet sky, lanterns, the furnace's orange glow |
| Lòng bàn tay Phật Tổ | light gold, pale blue void | soft golden radiance from below | the palm glows faintly, with stars in the void |
| Ngũ Hành Sơn | blue-grey stone, yellow talismans, moss | talisman glyphs glow | cold blue; the talisman lights the summit |
| Cao Lão Trang | earth brown, golden rice, thatch | warm lamp light | amber windows, frogs and fireflies |
| Bạch Cốt Lĩnh | bone white, grey-violet, pale-green mist | ghost lights | green-violet fog, will-o'-the-wisps |
| Nữ Nhi Quốc | lotus pink, vermilion, turquoise lake | lantern red-gold | the lantern festival on the water |
| Bàn Tơ Động | charcoal violet, fluorescent green, silver silk | dew on webs, glowing moss | the brightest night biome: glowing webs |
| Hỏa Diệm Sơn | red-orange, ash black | lava cracks, fire | red glow, ember drift |
| Thông Thiên Hà | deep blue, lantern gold, ice | lantern reflections | floating lanterns on dark water |
| Lôi Âm Tự | pale gold, white, sky blue | serene gold | a soft golden temple and quiet stars |

### 3.2 Regional grade (a technical requirement)

The shared `grade()` (`js/core.js`) pulls every colour toward one warm brown-orange ramp. That gives the Lofi Worlds look, but it would erase cool biomes
(Bàn Tơ violet, Thông Thiên blue, Bạch Cốt bone white). So:

- **Each biome has its own 8-step ramp.** The ink outline (cocoa), the sunlit tops, the plum shade side and the crease lines stay shared, so the world is still one family with Saigon and Holdfast.
- Implemented in a **world-local copy of the baker** (`td-bake.js`, §9) that takes the ramp as a parameter, so the shared `js/core.js` is not touched.

### 3.3 Edge bands (D4)

- Every point of the map has a **biome weight field** `w_b(x, y)`, which sums to 1. Borders come from a noise-warped biome map, smoothed over an **edge band about 4–6 tiles wide**.
- **Ground** is painted per pixel, so it blends both ramps by weight with a dithered mix (crisp pixels, no smooth gradient). Ash dusts the Cao Lão Trang rice near Hỏa Diệm Sơn; silk threads reach into Nữ Nhi Quốc's reeds.
- **Props** in the band are drawn from *both* biomes' prop lists, weighted by `w_b`. Each prop is baked with the ramp of the biome it belongs to, or with a quantised blend (4 steps) to keep the bake cache small.
- **Atmosphere** (§5) blends the same way, so the light, tint and weather particles of two biomes meet in the band.

## 4. Biomes

### 4.0 Readable without knowing the novel (D14)

Each biome gives four layers of signposting, from subtle to explicit:

1. **Silhouette landmark.** One big shape that names the place by itself: the waterfall cave, the heavenly gate, five finger pillars, five peaks with a head beneath,
   the flaming ridge, the web canopy, the golden temple. Each is visible at the widest zoom.
2. **Emblem motif** repeated in props and banners: peach, monkey, trigram, talisman, rake, bone, lotus, silk, palm-leaf fan, goldfish, sutra scroll.
3. **Entrance gate (paifang) or stele** at the main path into each biome, with the place name painted in the pixel font. In-world text is not translated (platform rule),
   and the 3 × 5 font is Latin capitals without diacritics, so these read as `HOA QUA SON` and similar.
4. **Place-name card (UI, bilingual).** When the centre of the view settles inside a biome for about 2 seconds, a calligraphy-style title fades in near the top of the screen and fades out after about 4 seconds.
   Example: *"Hoa Quả Sơn: nơi Tôn Ngộ Không ra đời"* / *"Flower-Fruit Mountain: birthplace of the Monkey King"*. The same biome does not show it again for a few minutes.
   This names the **place**, not an event, so it is not a ticker or a journal (D12). It can be turned off in the `···` panel.

Each sheet below names its emblem and its one-line card.

Every biome sheet lists: identity and landmarks · ambient life (Layer 1) · mini events (Layer 2, with variants) · signature stories (Layer 3) ·
footprints left after a signature · weather interpretation · seasons · loop length (5–10 min). No biome is calm (D17).

### 4.1 Hoa Quả Sơn: Flower-Fruit Mountain · loop about 7 min
- **Emblem:** peach and monkey. **Card:** *"Hoa Quả Sơn: nơi Tôn Ngộ Không ra đời"* / *"Flower-Fruit Mountain: birthplace of the Monkey King"*
- **Landmarks:** stacked jade cliffs; **Thủy Liêm Động** (the waterfall cave) at the centre; fruit orchards; the stone seat of the Monkey King; the shore of Đông Hải on the east.
- **Ambient:** a big troop of monkeys (about 40) who eat, groom, swing, bathe under the falls and squabble over fruit; birds; mist from the falls.
- **Mini events:** a monkey fruit feast · Wukong practises the 72 transformations (he becomes a tree, a bird, a rock, then pops back) · monkeys drill with wooden staffs · a baby monkey steals a banana and is chased · Wukong naps on the stone seat.
- **Signatures:** (a) *The King Returns*: a cloud streaks in, the troop rushes out and a celebration follows. (b) *The Demon of Havoc*: a demon tries to seize the mountain and Wukong drives him off. (c) *Storm Shelter* (weather-triggered): heavy rain, and the whole troop runs into Thủy Liêm Động.
- **Footprints:** peels and husks on the ground (monkeys slowly clean them up), a broken branch that regrows.
- **Weather:** rain is real rain (it can trigger (c)), wind sends blossoms flying. **Seasons:** yes.

### 4.2 Thiên Cung / Vườn Đào: the Heavenly Palace and Peach Garden · loop about 5 min
- **Emblem:** immortal peach and trigram. **Card:** *"Thiên Cung: vườn đào tiên của Ngọc Hoàng"* / *"The Heavenly Palace: the Jade Emperor's peach garden"*
- **Landmarks:** Nam Thiên Môn (the South Heaven Gate) with cloud pillars; the peach orchard; Lão Quân's **Bát Quái furnace** (a glowing bronze trigram furnace); jade bridges over cloud streams.
- **Ambient:** fairies tend and pick peaches, heavenly soldiers patrol in formation, cranes glide, smoke curls from the furnace, clouds drift *through* the ground.
- **Mini events:** the guard changes at the gate · Lão Quân stokes the furnace (it flares) · a monkey (Wukong) pilfers one peach and naps in a tree · fairies carry baskets to a banquet table · a soldier dozes off on duty.
- **Signatures:** (a) *Đại Náo Thiên Cung* (Havoc in Heaven). Foreshadowing: red-gold clouds gather over the gate and the soldiers become restless. Event: Wukong storms the garden, soldiers tumble like skittles, peaches scatter and the furnace erupts with sparks. Ending: Wukong somersaults away on a cloud. (b) *Hội Bàn Đào* (the Peach Banquet): a calm, festive procession.
- **Footprints:** knocked-over banners and fallen peaches, which fairies replant; a scorched furnace, which soldiers polish.
- **Weather:** rain becomes **a rain of peach blossom**, wind becomes streaming cloud ribbons. **Seasons:** no (eternal spring).

### 4.3 Lòng bàn tay Phật Tổ: the Buddha's Palm · loop about 6 min
- **Emblem:** open palm and lotus. **Card:** *"Lòng bàn tay Phật Tổ: nơi Ngộ Không không thể thoát ra"* / *"The Buddha's Palm: where the Monkey King could not escape"*
- **Landmarks:** the ground *is* a vast golden palm (crease lines as paths), with **five finger pillars** rising at the far edge and lotus clouds around. The Buddha is shown only as the hand and a distant golden radiance, never as a comic figure.
- **Ambient:** lotus petals drift, golden motes rise, small clouds circle.
- **Mini events:** Wukong somersaults in long loops and lands, sure he has reached the end of the world · he writes "Tề Thiên Đại Thánh đến đây chơi" on a finger pillar · he relieves himself at the pillar's foot, back turned, with a little puff of steam (never shown explicitly) · he bounces off an invisible edge.
- **Signature:** *The Palm Closes*. Foreshadowing: the fingers glow and the radiance deepens. Event: the fingers slowly curl, Wukong is caught in the light, and the hand turns into stone mountains for a moment. Ending: the hand reopens gently and the light settles.
- **Footprints:** the inscription fades slowly; a small damp patch dries.
- **Weather:** rain becomes **a rain of golden light**, wind sends lotus petals drifting. **Seasons:** no.

### 4.4 Ngũ Hành Sơn: Five Elements Mountain · loop about 8 min
- **Emblem:** talisman. **Card:** *"Ngũ Hành Sơn: năm trăm năm dưới chân núi"* / *"Five Elements Mountain: five hundred years beneath the rock"*
- **Landmarks:** five peaks with subtle element tints (metal, wood, water, fire, earth); **Wukong's head and one arm** stick out from under the base; the **six-syllable talisman** sits on the summit.
- **Ambient:** grass grows around his head and birds land on it; a local earth spirit (thổ địa) visits with iron pellets and copper water (from the novel); the seasons change the mountain's coat.
- **Mini events:** a bird nests in his hair · he chats with the earth spirit · he yawns, and the mountain shakes slightly · children from a nearby trail peek and run away · travellers and woodcutters pass on the mountain road · monkeys from the east come to visit him · the five peaks catch the light one by one (metal, wood, water, fire, earth).
- **Signature:** *Tam Tạng Frees the Monkey*. Foreshadowing: a lone monk is seen on the path and the talisman flickers. Event: the monk lifts the talisman, the mountain cracks and Wukong bursts out in a shower of pebbles and kneels. Ending: master and disciple walk down the road and **off the map's lower edge, where they disappear** (§2.2).
- **Reset:** stones settle and moss returns. When the dust has cleared and no one is watching closely (a cloud bank drifts over the base), Wukong's head is under the mountain again (the story resets, D8).
- **Weather:** real rain, and the talisman glows in it. **Seasons:** yes (snow-capped peaks in winter).

### 4.5 Cao Lão Trang: Old Gao's Village · loop about 7 min
- **Emblem:** rake and pig. **Card:** *"Cao Lão Trang: ngôi làng của Trư Bát Giới"* / *"Old Gao's Village: home of Pigsy"*
- **Landmarks:** an old farming village with the Cao family's courtyard manor, terraced rice fields, a threshing floor, haystacks and a pig pen.
- **Ambient:** farmers, children and buffalo; **Bát Giới** (as the Cao son-in-law) ploughs absurdly fast, eats enormous meals and sleeps on haystacks.
- **Mini events:** Bát Giới raids the kitchen · he dozes off mid-field · a village market day · children fly kites · Old Cao argues with him in the courtyard.
- **Signature:** *The Bride Is a Monkey*. Wukong takes the bride's place, Bát Giới arrives, the disguise drops, and a chase runs across the paddies until Bát Giới yields.
- **Footprints:** trampled rice (replanted by farmers), a broken fence (mended).
- **Weather:** real rain (farmers wear straw cloaks), wind sends straw flying. **Seasons:** yes (rice cycles).

### 4.6 Bạch Cốt Lĩnh: White Bone Ridge · loop about 6 min (spooky-cozy)
- **Emblem:** bone and crow. **Card:** *"Bạch Cốt Lĩnh: yêu tinh ba lần biến hóa"* / *"White Bone Ridge: the spirit of three disguises"*
- **Landmarks:** **bones everywhere**: dead white trees, ribbed rock arches like giant ribs, skull-shaped boulders, bone fences and bone wind chimes, a misty tarn, a mirage pavilion.
- **Ambient:** crows, ghost lights, rolling fog; the mirage pavilion shimmers in and out.
- **Mini events:** a mirage of a feast appears and dissolves · wisps lure each other in circles · skeletal trees creak in the wind · a lost woodcutter hurries through.
- **Signature:** *Three Disguises*. The White Bone Spirit comes as a girl with a rice basket, Wukong strikes and she escapes as mist. She returns as an old woman, and then as an old man. **Wukong strikes her on the head three times**, one strike per disguise. On the third strike her true form shows: a bone shape that **dissolves into mist** (no gore).
- **Footprints:** the rice basket turns into toads and stones, and the fog lifts for a while.
- **Weather:** rain becomes **thick fog**, wind tears the mist into ribbons. **Seasons:** yes (muted).

### 4.7 Nữ Nhi Quốc: the Women's Kingdom · loop about 10 min (festive day cycle)
- **Emblem:** lotus and lantern. **Card:** *"Nữ Nhi Quốc: vương quốc chỉ có phụ nữ"* / *"The Women's Kingdom: a realm ruled by women"*
- **Landmarks:** a vermilion palace, a turquoise lotus lake with small boats, a market street, a ceremonial bridge.
- **Ambient:** court ladies, merchants, boatwomen, children and herons.
- **Daily loop (the owner's design):** the morning market, then boating, a court ceremony, and the lantern festival in the evening.
- **Mini events:** a lotus harvest from boats · a guard drill · a merchant haggles · a poet on the bridge.
- **Signature:** *The Queen Meets the Monk*. A royal procession greets Tam Tạng, followed by a courtly audience. He departs gently, the queen watches from the bridge, and lanterns are released.
- **Footprints:** lanterns drift on the lake through the night.
- **Weather:** rain becomes a drizzle with rings on the lotus lake. **Seasons:** yes (lotus in summer, bare stems in winter).

### 4.8 Bàn Tơ Động: Silk Web Cave · loop about 6 min
- **Emblem:** silk web. **Card:** *"Bàn Tơ Động: hang của bảy nhện tinh"* / *"Silk Web Cave: lair of the seven spider sisters"*
- **Landmarks:** an **open-air gorge under a giant web canopy** instead of a closed cave (this avoids isometric cutaways), a cave mouth, a steaming hot spring and silver silk bridges.
- **Ambient:** **spiders everywhere**: on every web, rock and branch. Big ones weave, baby spiders swing on threads in swarms, egg sacs glow; glowing moss pulses and steam rises.
- **Mini events:** the spider sisters spin silk on looms · **the sisters bathe in the steaming hot spring** (from the novel; tasteful and chibi, in bathing robes, wrapped in steam) · a moth is caught and released · a web snaps and is rewoven · dew glitters at dawn.
- **Signature:** *The Seven Sisters' Net*. Foreshadowing: webs spread over the trail. Event: the net closes over the gorge, Wukong plucks hairs that become a swarm of little monkeys, they cut the silk, and the sisters retreat into the cave.
- **Footprints:** drifting silk strands that the spiders slowly reweave.
- **Weather:** rain becomes **dew-laden webs that sparkle**, wind makes the web canopy sway. **Seasons:** no (sheltered).

### 4.9 Hỏa Diệm Sơn: the Flaming Mountains · loop about 5 min
- **Emblem:** palm-leaf fan. **Card:** *"Hỏa Diệm Sơn: ngọn núi lửa chỉ quạt Ba Tiêu dập được"* / *"The Flaming Mountains: only the palm-leaf fan can quench them"*
- **Landmarks:** red ridges with lava cracks, a fire-cake village on hot ground (the novel's cake seller), and Thiết Phiến's palm-leaf cave at the edge.
- **Ambient:** heat haze, flame jets, villagers baking cakes on the ground, ember drift.
- **Mini events:** a cake seller hawks his wares · a flame jet startles a mule · Bát Giới complains about the heat · ash devils whirl.
- **Signature:** *The Palm-Leaf Fan*. (1) Thiết Phiến fans Wukong away, and he flies in a long comic arc across the map and back. (2) He returns with the fan and fans 49 times. Rain falls, the fires die, and the ground cools and turns green.
- **Footprints (the best aftermath):** for several minutes the mountain is cool, green and rained on; then the cracks glow again and the fire slowly returns (the gradual reset).
- **Weather:** rain becomes **a rain of ash** (except during the fan aftermath, when it is real rain), wind brings ember storms. **Seasons:** no.

### 4.10 Thông Thiên Hà: the River That Reaches Heaven · loop about 8 min
- **Emblem:** goldfish and turtle. **Card:** *"Thông Thiên Hà: dòng sông của Linh Cảm Đại Vương"* / *"The River That Reaches Heaven: the goldfish king's river"*
- **Landmarks:** a wide river, the fishing village of Trần Gia Trang on stilts, the river temple of the Linh Cảm king, and festival lanterns.
- **Ambient:** fishing boats and nets, children floating lotus lanterns, a goldfish shoal glinting.
- **Mini events:** a big catch · a boat race · a goldfish leaps · offerings at the river temple.
- **Signatures:** (a) *The Frozen River* (likelier in winter). Linh Cảm freezes the river, travellers cross on the ice, the ice breaks, and **Quan Âm** arrives with a bamboo fish basket and lifts the goldfish demon out (as in the novel). (b) *The Great Turtle*: an old giant turtle surfaces and carries the pilgrims across.
- **Footprints:** ice floes melt for minutes after (a), and the village cheers and repairs its boats.
- **Weather:** real rain, and snow plus ice in winter. **Seasons:** yes.
- (The novel's child-offering demand is reframed as a demand for tribute, so no children are in danger.)

### 4.11 Lôi Âm Tự: Thunderclap Monastery (the Western Paradise) · loop about 8 min
- **Emblem:** sutra scroll and bell. **Card:** *"Lôi Âm Tự: nơi cuối con đường thỉnh kinh"* / *"Thunderclap Monastery: the end of the journey west"*
- **Landmarks:** the **largest structure in the world: a towering golden temple complex** on stepped terraces. Grand stairs, a many-tiered main hall, a pagoda that rises far into the cloud sea and catches the light, giant guardian statues flanking the stairs, the sutra library, a bell tower and a lotus pond. It is visible from much of the map and glows softly at night (a beacon in the top-left corner). It is baked with `slice` so actors walk in front of and behind its parts correctly.
- **Setting:** a mountain region; the whole temple complex climbs its slopes.
- **Ambient:** many monks walking, chanting, sweeping the long stairs, reading and carrying scrolls; pilgrims climbing; bells; doves; incense smoke.
- **Mini events:** a sutra procession · a bell is rung (heard from afar) · monks copy sutras · a novice chases a dove.
- **Signatures:** (a) *The False Thunderclap* (the novel's Tiểu Lôi Âm Tự story of the Yellow Brow demon, folded into this biome): the temple light turns sickly, **the monks transform into demons**, Wukong is trapped inside a pair of giant golden cymbals and fights his way out, and the illusion breaks so the golden light returns. (b) *The Scriptures Received*: a golden light descends, and the pilgrims receive the sutra scrolls in a solemn ceremony.
- **Footprints:** scrolls are shelved one by one in the library.
- **Weather:** rain becomes a gentle golden drizzle. **Seasons:** no.

### 4.12 Expansion list (not in v0.1)

Ngũ Trang Quán (the ginseng-fruit tree), Liên Hoa Động (Kim Giác and Ngân Giác and the magic gourd), Tiểu Lôi Âm Tự as its own biome (its story already plays in Lôi Âm Tự, §4.11),
Sư Đà Lĩnh (the lion, elephant and roc city), Long Cung (the Dragon Palace). The owner's notes for these are kept for a later version.

## 5. Atmosphere: time, weather, seasons

- **One time of day** for the whole map (the shared clock and time modes).
- The **weather control** (auto / clear / rain / wind) is global, and **each biome interprets it** (§4): flower rain, light rain, fog, sparkling dew, ash rain, real rain or snow.
  Weather particles are spawned **in world space per biome**, so a screen spanning a border shows both (flower petals on one side, ash on the other) blended across the edge band.
- **Seasons** apply only to earthly biomes (Hoa Quả Sơn, Ngũ Hành Sơn, Cao Lão Trang, Bạch Cốt Lĩnh, Nữ Nhi Quốc, Thông Thiên Hà). The heavenly and magical ones keep their fixed state.
- **Regional light:** each biome has its own ambient keyframes (Bàn Tơ violet, Hỏa Diệm red at night, Thiên Cung brighter). The ambient multiply and the
  night light pass are applied **per region** (a coarse tint map blended by `w_b`), not as one screen-wide colour as in Holdfast.

## 6. Story system

### 6.1 Living Story Loop (per biome)

| Phase | Duration (tunable) | What happens |
|---|---|---|
| 1. Peaceful life | 2–5 min | ambient and mini events only |
| 2. Foreshadowing | 30–60 s | **long-range cues**: coloured sky columns, glows, drifting smoke, distant sounds, restless NPCs |
| 3. Signature | 1–2 min | the scripted story, with a beginning, middle and end |
| 4. Aftermath | 1–2 min | NPCs react, clean up and repair; footprints stay |
| 5. Gradual reset | overlaps the next peaceful phase | damage heals step by step (no snapping) and footprints fade |

**One loop takes 5–10 minutes** (D15), set per biome in §4 (Thiên Cung and Hỏa Diệm Sơn about 5; Nữ Nhi Quốc's festive day about 10). Every biome is busy throughout (D17); the loop length only sets how often a signature comes.
Because the reset overlaps the next peaceful phase, the world never waits on a reset.
Over 11 biomes, a 1.5-minute signature per 7.5-minute loop averages about **2.2 signatures running at once**, sometimes 4–5. That is the lively, fun-to-watch world the owner asked for (D9).
Since a biome has several signatures (§4), the same story comes back to the same biome only about every 15–30 minutes.

### 6.2 Stories as data

Each story is a data record that an engine interprets, so adding a story does not need new engine code:

```js
tdStory('hqs.kingReturns', {
  biome: 'hqs', layer: 'signature', weight: 1, cooldown: 900,
  needs: { time: ['morning', 'noon', 'dusk'], weatherNot: ['rain'] },
  cast: { king: 'wukong', troop: 'monkey*all' },
  foreshadow: [['skyColumn', { colour: 'gold', at: 'east' }], ['npc', { who: 'troop', act: 'lookUp' }]],
  beats: [
    ['arrive',  { who: 'king', by: 'cloud', to: 'stoneSeat', dur: 6 }],
    ['gather',  { who: 'troop', to: 'stoneSeat', dur: [10, 20] }],
    ['party',   { who: 'troop', act: ['dance', 'feast'], dur: [40, 70] }],
    ['leave',   { who: 'king', by: 'cloud', dur: 5, optional: 0.5 }]
  ],
  footprints: [['litter', { kind: 'peel', n: 30, cleanBy: 'troop', fade: 300 }]]
});
```

- **Actions** form a small reusable vocabulary: walk/arrive/leave (by foot, cloud or water), gather, act (poses), say (a bubble icon), transform, fight (stylised: dust puffs, staff arcs, tumbling soldiers), cast (an effect), damage/repair, spawn/despawn.
- **Variants:** mini events pick random cast members, routes, durations and outcomes from `HS.R`, so no two runs are identical.
- **Footprints** are world-state changes with their own recovery processes, so the world remembers (pillar 3).

### 6.3 Global Story Director

| Rule | Value (tunable) |
|---|---|
| Concurrent signature events (whole map) | at most **5** |
| Signature in a biome adjacent (§2.3) to one already running or foreshadowing | **not allowed** |
| Minimum gap between two signatures in the same biome | aftermath done, and at least 3 min |
| Same signature story twice in a row in one biome | avoided (pick another story or variant) |
| Concurrent mini events per biome | 1–3 |
| Story pressure | grows while a biome waits; the biome with the highest pressure that is allowed goes next |
| Camera | **no bias** (D1: the world plays on its own). One tunable is kept off by default and documented. |
| Flash safety | magic flashes are capped in brightness and frequency (no full-screen strobes) |

There is no user-facing pace setting (D12). The durations are tuned per biome in data.

## 7. Cast and art

### 7.1 Recurring cast (about 25 unique characters plus crowds)

Wukong (several instances), Bát Giới, Sa Tăng, Tam Tạng, the white dragon horse, Quan Âm (rare and dignified), the earth spirit, heavenly soldiers, fairies,
Lão Quân, monkeys (in several sizes), villagers, court ladies, the queen, the White Bone Spirit (3 disguises and her mist form), 7 spider sisters plus spiderlings,
Thiết Phiến, the Linh Cảm goldfish demon, the giant turtle, the Demon of Havoc, Old Cao, monks, cranes, herons, crows and buffalo.

- Humans and humanoids use the chibi `drawPerson` pipeline with new costumes and overlays (staff, rake, fan, basket, sutra scroll).
- Creatures (monkeys, spiders, the turtle, the goldfish, cranes) get custom grids, the way Holdfast Past made its 15 dinosaur species.
- All designs are **original**, based on the novel's descriptions, and do not copy any film, game or comic adaptation.

### 7.2 Hard art problems (solve these in the pilot)

1. **Curved roofs and eaves** (palace, temple, manor) built from box models: stepped boxes plus a painter that curves the eave line.
2. **Clouds that live on the ground** (heavens): layered soft-edged cloud sprites that move slowly and are partly see-through, still pixel-crisp.
3. **Organic giant forms:** the palm, the finger pillars, the bone arches.
4. **Water features:** the waterfall, the frozen river, the lotus lake.
5. **Cool palettes under the new regional ramps** (§3.2).
6. **Edge-band blending** (§3.3).

### 7.3 Art pilot (gate before milestone 1)

One static pilot page (`docs/tayduky/art-pilot/`) with three vignettes, compared side by side with Saigon and Holdfast:
- **A. Thiên Cung corner:** the gate, a curved roof, ground clouds, the peach orchard, two soldiers, a fairy and Wukong. This tests roofs, clouds and the ivory-gold palette.
- **B. Bàn Tơ Động gorge:** the web canopy, glowing moss, two spider sisters, at dusk and at night. This tests the cool palette and emissive light.
- **C. The Hỏa Diệm Sơn ↔ Cao Lão Trang border:** an ash-dusted paddy and mixed props. This tests the edge band.

## 8. UI and audio

- **Dock:** the shared markup and behaviour: music (play, track, YouTube), time of day, weather, seasons, volumes, zoom and full screen.
  The weather buttons keep their shared names (auto / clear / rain / wind), and each biome shows its own special weather for them (§5). Seasons apply to earthly lands only.
  **No world-specific setting** (D12). The only extra switch is "place names on/off" in the `···` panel (§4.0).
- **HUD plate:** the world title only. **No ticker, no journal, no event list, no fly-to buttons** (D1, D12). Camera: drag, wheel and zoom buttons, and Esc returns to the gallery.
- **Audio:** the gallery's shared lofi radio is not changed. The world adds a **regional ambience** mixed by biome weight at the view centre (waterfall and monkeys,
  wind chimes and cranes, fire crackle, river and oars, temple bells, the hum of the web). It also adds **soft instrument accents** (synthesised zither plucks, bamboo flute,
  wooden fish, bells). These follow the music slider and are **always quieter than the lofi music**: their gain is capped at about a third of the music gain, and they are silent when the music is off. The world also adds **distance-attenuated story sounds**, so a distant signature can be *heard* and invites the viewer over.

## 9. Technical plan (summary)

- Folder `tayduky/`, prefix `td`. The modules follow the Holdfast template (`docs/WORLD-BUILDER-GUIDE.md` §5): `td-map` (biomes, weight field, layout, nav),
  `td-art`, `td-sim` (cast, routines, warm start), **`td-story`** (story engine, DOM-free), **`td-director`** (DOM-free), `td-render`, `td-audio`, `td-main`.
- **Biome plug-ins:** `tayduky/biomes/<id>.js` registers a biome's layout, palette, props, cast and stories. Adding a biome means adding one file.
- **Streaming without a loading screen:** at entry only the view ring is baked (target: first frame within about 1 s of the gallery zoom), then rings outward in about 5 ms idle
  slices, nearest first, with far chunks trimmed. No task over 50 ms.
- **Simulation:** the whole map simulates at once: about 450 characters (§2.1). Holdfast runs 120 agents in 0.2–0.4 ms per 0.1 s tick, so about 1–1.5 ms per tick is estimated (to be measured).
- **Baker:** the world uses a **local copy of the box baker** (`td-bake.js`) that adds a per-biome ramp (§3.2) as a parameter. Shared `js/core.js` stays untouched, so there is no Saigon or Holdfast parity risk.
- **Shared change needed:** the gallery frame host, generalised for a second framed world (guide §3.2), with Holdfast's browser and flow tests as the parity check.
- **Tests** (deterministic): story-engine runs; the Director over 6 game hours (never more than 5 signatures, never adjacent, every biome gets its turn, no story repeats back to back, every reset completes);
  the weight field (sums to 1, edge-band widths); streaming (no long tasks); benches at the widest, default and close zoom.

## 10. Resolved in v0.3

- Instrument accents: **yes**, always quieter than the lofi music (§8).
- Gallery title: **"Journey to the West — A Living Legend"** / **"Tây Du Ký — Huyền Thoại Sống"** (D18). The thumbnail motif will be chosen after the art pilot.
- Place-name cards: as specified in §4.0 (on by default, can be turned off).

## 11. Milestones (proposed)

| Milestone | Content |
|---|---|
| **M0** | this doc approved, plus the art pilot (§7.3) approved |
| **M1 Platform** | the whole map skeleton: all biome regions' ground, palettes and edge bands, landmarks as simple blocks, regional light and weather, camera and zoom steps, streaming bake, place-name cards, gallery card. The world can be explored end to end from day one. |
| **M2 Stories** | story engine and Director, plus 2 contrasting biomes in full: **Hoa Quả Sơn** and **Hỏa Diệm Sơn** |
| **M3** | Thiên Cung, Cao Lão Trang |
| **M4** | Lòng bàn tay Phật, Ngũ Hành Sơn |
| **M5** | Thông Thiên Hà, Nữ Nhi Quốc |
| **M6** | Bạch Cốt Lĩnh, Bàn Tơ Động, Lôi Âm Tự (the showpiece temple) |
| **M7** | audio pass, performance pass, docs and screenshots |

## 12. Risks

| Risk | Mitigation |
|---|---|
| Art volume (11 dense biomes, about 25 characters, effects) is the main schedule risk | the pilot first; biome plug-ins; reuse `drawPerson`, props and Holdfast's water and boats |
| Curved roofs, clouds and organic forms in a box-model style | pilot vignettes A and C; a painter-based eave curve |
| The shared warm grade erases cool palettes | regional ramps (§3.2) with a parity check |
| Frame budget at the widest zoom (3–5 busy biomes on screen) | culling, skipping the tiniest creatures at the widest step, streaming and trimming of chunks; benches at every zoom |
| Signatures missed with no ticker | strong long-range foreshadowing (sky columns, light, sound), 2–5 signatures running at once, short loops |
| Viewers who don't know the novel | the four signposting layers of §4.0 |
| Cultural and religious sensitivity | the Buddha only as the hand and radiance; Quan Âm dignified; humour stays with Wukong and Bát Giới; no gore; the child offering reframed as tribute; the bathing scene kept tasteful (robes, steam, chibi) |
| Originality and IP | the source is a public-domain classic; all designs original; no adaptation is copied |
