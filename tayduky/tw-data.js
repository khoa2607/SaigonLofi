'use strict';
// ===== Tây Du Ký v2 — biome data: residents, roles, stories (Living Story Loop), mini events, recovery =====
// Story beats are interpreted by tw-sim.js (tsRun). Beat ops:
//   arrive {who, at}            a resident (or a new actor) comes down from the sky on a cloud
//   spawn  {id, char, from: 'edge'|'sky', at, edge}   a visiting actor
//   depart {who}                a resident leaves on a cloud (comes back later)
//   go     {who, to, off, run}  walk (A*) to a POI kind, a named point or [i, j]; waits until arrived
//   gather {at, r, roles, n}    free residents walk to a ring around a point and face it
//   face / act / sit / hop / bubble {who | 'crowd', ...}   poses on one actor or on everyone gathered
//   fx {kind, at, dur, r}   wait {t}   strike {who, at}   wrap {who, on}   web {target, rate, glow}
//   litter {at, n, r}   clean {roles, dur}   retreat {roles, to}   return {roles}   scatter {roles}   reweave {dur}   leave {who, by, to}   disperse {}
window.TW_DATA = {
  loop: { peace: [150, 300], fore: [30, 45], after: [70, 110] },      // seconds; a full loop takes about 5-9 minutes (design D15)
  maxSignatures: 5,
  miniGap: [30, 70],
  beacon: { hqs: '255,214,120', btd: '190,140,255' },
  biomes: {
    hqs: {
      residents: [['wukong', 1, 'king'], ['khi_linh', 3, 'guard'], ['khi_lao', 2, 'elder'], ['khi_con', 6, 'kid'], ['khi_dan', 5, 'citizen'], ['khi_dan_b', 5, 'citizen']],
      roles: {
        king: [['train', 3], ['throne', 3], ['visit', 2], ['hop_rocks', 2], ['pray', 1], ['play', 1], ['wander', 1]],
        guard: [['patrol', 5], ['drill', 3], ['watch', 2], ['pray', 1], ['hut', 1], ['rest', 1]],
        elder: [['rest', 4], ['talk', 2], ['pray', 2], ['stall', 1], ['hut', 2], ['wander', 1], ['eat', 1]],
        kid: [['chase', 3], ['hop', 2], ['climb', 3], ['play', 4], ['wall', 3], ['eat', 2], ['swim', 2], ['stall', 1], ['wander', 1]],
        citizen: [['wander', 2], ['rest', 2], ['eat', 2], ['groom', 2], ['climb', 2], ['swim', 1], ['cave', 1], ['talk', 2], ['hut', 2], ['stall', 3], ['fish', 3], ['pray', 1], ['wall', 1], ['play', 1]],
      },
      minis: ['fruit_raid', 'storytime', 'dive_party', 'guard_drill', 'supper'],
      stories: [
        { id: 'king_returns', title: ['Đại Vương trở về', 'The King Returns'],
          fore: [['depart', { who: 'king' }], ['gather', { at: 'lookout', r: 2.5, roles: ['guard', 'kid'], n: 6 }], ['face', { who: 'crowd', dir: 'up' }], ['fx', { kind: 'goldtrail', at: 'court', dur: 60 }]],
          beats: [
            ['disperse', {}], ['arrive', { who: 'king', at: 'court' }], ['gather', { at: 'court', r: 4.5 }], ['bubble', { who: 'crowd', kind: 'excl' }], ['wait', { t: 2 }],
            ['hop', { who: 'crowd', t: 5 }], ['bubble', { who: 'crowd', kind: 'heart' }], ['go', { who: 'king', to: 'throne' }], ['face', { who: 'king', dir: 'down' }],
            ['disperse', {}], ['gather', { at: 'throne', r: 4, off: [0, 3] }], ['sit', { who: 'king', t: 14, wait: false }], ['fx', { kind: 'peaches', at: 'throne', dur: 14, r: 40 }],
            ['fx', { kind: 'petals', at: 'court', dur: 22, r: 70 }], ['bubble', { who: 'crowd', kind: 'note' }], ['wait', { t: 14 }],
            ['go', { who: 'king', to: 'court' }], ['disperse', {}], ['gather', { at: 'court', r: 5 }], ['act', { who: 'king', t: 10, wait: false }], ['fx', { kind: 'sparks', at: 'king', dur: 10 }],
            ['hop', { who: 'crowd', t: 8 }], ['bubble', { who: 'crowd', kind: 'star' }], ['wait', { t: 4 }], ['litter', { at: 'court', n: 26, r: 5 }], ['disperse', {}]],
          after: { fx: 'petals', at: 'court', r: 60 },
          recover: [['clean', { roles: ['citizen', 'kid'], dur: 90 }]] },
      ] },
    btd: {
      residents: [['nhen_tinh', 1, 'sister'], ['nhen_tinh_em', 2, 'sister'], ['nhen_tinh_hong', 2, 'sister'], ['nhen_tinh_vang', 2, 'sister'], ['nhen_con', 10, 'spiderling']],
      roles: {
        sister: [['weave', 4], ['bath', 2], ['talk', 3], ['stroll', 2], ['eggs', 2], ['cave', 1], ['hut', 2], ['altar', 2], ['crystal', 3], ['wall', 1]],
        spiderling: [['scuttle', 3], ['thread', 3], ['wall', 4], ['follow', 2]],
      },
      minis: ['weaving_circle', 'hot_spring', 'spider_rain', 'lantern_gather', 'egg_watch'],
      stories: [
        { id: 'net', title: ['Lưới tơ của bảy chị em', "The Seven Sisters' Net"],
          fore: [['web', { glow: true }], ['gather', { at: 'circle', r: 2.6, roles: ['sister'] }], ['reweave', { dur: 30 }]],
          beats: [
            ['act', { who: 'crowd', t: 3 }], ['web', { target: 1, rate: 0.04 }], ['fx', { kind: 'silkrise', at: 'circle', dur: 14 }], ['act', { who: 'crowd', t: 12 }],
            ['spawn', { id: 'monk', char: 'tam_tang', from: 'edge', edge: 'east' }], ['go', { who: 'monk', to: 'canopy', run: 1.4 }],
            ['wrap', { who: 'monk', on: true }], ['fx', { kind: 'silk', at: 'monk', dur: 6 }], ['bubble', { who: 'monk', kind: 'excl' }], ['bubble', { who: 'crowd', kind: 'heart' }], ['wait', { t: 5 }],
            ['spawn', { id: 'wk', char: 'wukong', from: 'sky', at: 'monk', off: [2, 1] }], ['wait', { t: 1 }], ['bubble', { who: 'wk', kind: 'excl' }],
            ['strike', { who: 'wk', at: 'monk' }], ['strike', { who: 'wk', at: 'monk' }], ['web', { target: 0.12, rate: 0.9, glow: false }], ['fx', { kind: 'shreds', at: 'canopy', dur: 16, r: 90 }],
            ['wrap', { who: 'monk', on: false }], ['bubble', { who: 'crowd', kind: 'excl' }], ['retreat', { roles: ['sister'], to: 'cave' }], ['scatter', { roles: ['spiderling'] }],
            ['wait', { t: 3 }], ['bubble', { who: 'monk', kind: 'heart' }], ['leave', { who: 'monk', by: 'walk', to: 'mouthE' }], ['leave', { who: 'wk', by: 'walk', to: 'mouthE' }]],
          after: { fx: 'shreds', at: 'canopy', r: 80 },
          recover: [['return', { roles: ['sister'] }], ['web', { target: 0.55, rate: 0.005 }], ['reweave', { dur: 100 }]] },
      ] },
  },
};
