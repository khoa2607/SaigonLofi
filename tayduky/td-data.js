'use strict';
// ===== Tây Du Ký — Huyền Thoại Sống: biome casts and stories as data (design doc §4, §6) =====
// cast: [character, count, role]. Roles: wander (default), hop (monkeys), guard (patrols a short beat), pray (stays, bows), static (never moves).
// Stories are beat lists interpreted by td-sim.js. Beat vocabulary:
//   spawn {id, char, from:'edge'|'sky'|'focal'}   walk {who, to:'focal'|[dx,dy], speed}   gather {r}   face {who|'crowd', to}
//   fx {kind, dur, r, at}   wait {t}   strike {who, target}   swap {who, char}   chase {who, target, t}   leave {who, by:'walk'|'sky'|'fade'|'south'}   disperse {}
//   gather {r, n?, char?} (n = only the n nearest free characters)   bubble {who|'crowd', kind}   face {who, dir}   free {who} (unbury)   bow {who, t}
// fx kinds: gold, fire, sparks, rain, web, mist, petals, lanterns, splash, flash, peaches, bell, cloud, talisman, pebbles, steam, birds, ink, embers, footprints.
// Roles also include buried (Wukong under Ngũ Hành Sơn: only head and shoulders show; freed by the signature, back under the rock at the next peace).
window.TD_DATA = {
  loop: { peace: [150, 330], fore: [35, 55], after: [60, 110] },        // seconds (design: a 5-10 minute loop per biome)
  maxSignatures: 5,
  miniGap: [35, 80],                                                      // seconds between mini events in one biome (peace only)
  beacon: { hqs: '#ffd27a', tc: '#ff7a5a', btp: '#ffe9a0', nhs: '#ffe066', clt: '#ffb4c8', bcl: '#a8ffb8', nnq: '#ffb0d0', btd: '#c890ff', hds: '#ff8a3a', lat: '#fff0b0', tth: '#9adcff' },
  biomes: {
    hqs: {
      cast: [['khi_chien_binh', 3, 'hop'], ['khi_lao', 1, 'wander'], ['khi_luc_si', 2, 'hop'], ['khi_con', 5, 'hop'], ['khi_giao', 3, 'guard']],
      stories: [
        { id: 'king_returns', title: ['Đại Vương trở về', 'The King Returns'], beats: [
          ['spawn', { id: 'king', char: 'wukong', from: 'sky' }], ['fx', { kind: 'cloud', at: 'king', dur: 3 }], ['walk', { who: 'king', to: 'focal' }],
          ['gather', { r: 70 }], ['fx', { kind: 'peaches', dur: 40, r: 70 }], ['fx', { kind: 'sparks', dur: 6 }], ['wait', { t: 40 }],
          ['leave', { who: 'king', by: 'sky' }], ['disperse', {}]] },
        { id: 'feast', title: ['Tiệc trái cây', 'The Fruit Feast'], beats: [
          ['gather', { r: 60 }], ['fx', { kind: 'peaches', dur: 50, r: 60 }], ['wait', { t: 50 }], ['disperse', {}]] },
      ] },
    tc: {
      cast: [['thien_binh', 4, 'guard'], ['thien_tuong', 2, 'guard'], ['thien_binh_lon', 1, 'guard'], ['tien_nu', 3, 'wander'], ['hang_nga_1', 1, 'wander'], ['hang_nga_2', 1, 'wander']],
      stories: [
        { id: 'havoc', title: ['Đại Náo Thiên Cung', 'Havoc in Heaven'], beats: [
          ['spawn', { id: 'wk', char: 'wukong', from: 'sky' }], ['walk', { who: 'wk', to: 'focal' }], ['gather', { r: 46 }],
          ['fx', { kind: 'flash', dur: 1 }], ['fx', { kind: 'sparks', dur: 14 }], ['chase', { who: 'crowd', target: 'wk', t: 18 }],
          ['fx', { kind: 'peaches', dur: 30, r: 90 }], ['leave', { who: 'wk', by: 'sky' }], ['disperse', {}]] },
        { id: 'banquet', title: ['Hội Bàn Đào', 'The Peach Banquet'], beats: [
          ['gather', { r: 60 }], ['fx', { kind: 'petals', dur: 60, r: 120 }], ['wait', { t: 55 }], ['disperse', {}]] },
      ] },
    btp: {
      cast: [['phat_to', 1, 'static'], ['linh_son', 3, 'wander'], ['thien_binh_b', 2, 'guard']],
      stories: [
        { id: 'palm_closes', title: ['Bàn tay khép lại', 'The Palm Closes'], beats: [
          ['spawn', { id: 'wk', char: 'wukong', from: 'sky' }], ['chase', { who: 'wk', target: 'focal', t: 16 }],
          ['fx', { kind: 'gold', dur: 24, r: 150 }], ['wait', { t: 12 }], ['fx', { kind: 'flash', dur: 1.2 }], ['leave', { who: 'wk', by: 'sky' }]] },
      ] },
    nhs: {
      cast: [['wukong', 1, 'buried'], ['khi_con', 2, 'hop'], ['nong_phu', 2, 'wander'], ['dan_lang_nam', 1, 'wander'], ['dan_lang_nu', 1, 'wander'], ['tieu_hoa_thuong', 1, 'wander']],
      stories: [
        { id: 'freed', title: ['Đường Tăng cứu Ngộ Không', 'Tam Tạng Frees the Monkey'], beats: [
          ['fx', { kind: 'talisman', at: 'wukong', dur: 14 }], ['spawn', { id: 'tt', char: 'tamtang', from: 'edge' }], ['walk', { who: 'tt', to: 'wukong', off: [18, 10], speed: 1 }],
          ['bubble', { who: 'wukong', kind: 'excl' }], ['wait', { t: 4 }], ['fx', { kind: 'flash', at: 'wukong', dur: 1 }], ['fx', { kind: 'pebbles', at: 'wukong', dur: 3, r: 50 }],
          ['free', { who: 'wukong' }], ['gather', { r: 70 }], ['bow', { who: 'wukong', t: 4 }], ['bubble', { who: 'tt', kind: 'heart' }], ['fx', { kind: 'gold', at: 'wukong', dur: 10, r: 40 }], ['wait', { t: 6 }],
          ['leave', { who: 'tt', by: 'south' }], ['leave', { who: 'wukong', by: 'south' }], ['wait', { t: 6 }], ['disperse', {}]] },
      ] },
    clt: {
      cast: [['bajie', 1, 'wander'], ['cao_thuy_lan', 1, 'wander'], ['cao_thai_cong', 1, 'wander'], ['linh_canh', 2, 'guard'], ['nong_phu', 4, 'wander'], ['dan_lang_nam', 3, 'wander'], ['dan_lang_nu', 3, 'wander']],
      stories: [
        { id: 'bride', title: ['Cô dâu là khỉ', 'The Bride Is a Monkey'], beats: [
          ['spawn', { id: 'wk', char: 'cao_thuy_lan', from: 'focal' }], ['walk', { who: 'bajie', to: 'focal' }], ['wait', { t: 4 }],
          ['fx', { kind: 'flash', dur: 0.8, at: 'wk' }], ['swap', { who: 'wk', char: 'wukong' }], ['gather', { r: 80 }],
          ['chase', { who: 'wk', target: 'bajie', t: 30 }], ['leave', { who: 'wk', by: 'sky' }], ['disperse', {}]] },
        { id: 'pilgrims', title: ['Thầy trò ghé làng', 'The Pilgrims Visit'], beats: [
          ['spawn', { id: 'p1', char: 'tamtang', from: 'edge' }], ['spawn', { id: 'p2', char: 'wukong', from: 'edge' }], ['spawn', { id: 'p3', char: 'shaseng', from: 'edge' }],
          ['walk', { who: 'p1', to: 'focal' }], ['gather', { r: 60 }], ['fx', { kind: 'lanterns', dur: 30 }], ['wait', { t: 30 }],
          ['leave', { who: 'p1', by: 'walk' }], ['leave', { who: 'p2', by: 'walk' }], ['leave', { who: 'p3', by: 'walk' }], ['disperse', {}]] },
      ] },
    bcl: {
      cast: [['yeu_binh', 4, 'guard'], ['yeu_thu', 2, 'wander']],
      stories: [
        { id: 'three_disguises', title: ['Ba lần biến hóa', 'Three Disguises'], beats: [
          ['spawn', { id: 'bc', char: 'bach_cot_tinh_2', from: 'focal' }], ['spawn', { id: 'wk', char: 'wukong', from: 'edge' }], ['walk', { who: 'wk', to: [-24, 6] }],
          ['strike', { who: 'wk', target: 'bc' }], ['fx', { kind: 'mist', dur: 6, at: 'bc' }], ['swap', { who: 'bc', char: 'bach_cot_tinh_3' }], ['wait', { t: 8 }],
          ['strike', { who: 'wk', target: 'bc' }], ['fx', { kind: 'mist', dur: 6, at: 'bc' }], ['swap', { who: 'bc', char: 'bach_cot_tinh_4' }], ['wait', { t: 8 }],
          ['strike', { who: 'wk', target: 'bc' }], ['swap', { who: 'bc', char: 'bach_cot_tinh_1' }], ['wait', { t: 3 }],
          ['fx', { kind: 'mist', dur: 12, at: 'bc' }], ['leave', { who: 'bc', by: 'fade' }], ['wait', { t: 6 }], ['leave', { who: 'wk', by: 'sky' }]] },
      ] },
    nnq: {
      cast: [['nu_vuong', 1, 'wander'], ['cung_nu_1', 2, 'wander'], ['cung_nu_2', 2, 'wander'], ['cung_nu_3', 1, 'wander'], ['cung_nu_4', 1, 'wander'], ['thi_ve_1', 2, 'guard'], ['thi_ve_3', 2, 'guard']],
      stories: [
        { id: 'queen_monk', title: ['Nữ vương gặp Đường Tăng', 'The Queen Meets the Monk'], beats: [
          ['spawn', { id: 'tt', char: 'tamtang', from: 'edge' }], ['walk', { who: 'tt', to: 'focal' }], ['walk', { who: 'nu_vuong', to: [20, 8] }],
          ['gather', { r: 64 }], ['fx', { kind: 'petals', dur: 40, r: 110 }], ['wait', { t: 26 }], ['fx', { kind: 'lanterns', dur: 50 }],
          ['leave', { who: 'tt', by: 'walk' }], ['disperse', {}]] },
      ] },
    btd: {
      cast: [['nhen_tinh_1', 1, 'wander'], ['nhen_tinh_2', 1, 'wander'], ['nhen_tinh_3', 1, 'wander'], ['nhen_tinh_4', 1, 'wander'], ['nhen_tinh_5', 1, 'wander'], ['nhen_tinh_6', 1, 'wander'], ['nhen_tinh_7', 1, 'wander'],
             ['nhen_yeu_1', 3, 'hop'], ['nhen_yeu_2', 3, 'hop'], ['ken_1', 2, 'static']],
      stories: [
        { id: 'net', title: ['Lưới tơ của bảy chị em', "The Seven Sisters' Net"], beats: [
          ['gather', { r: 50 }], ['fx', { kind: 'web', dur: 40, r: 120 }], ['spawn', { id: 'wk', char: 'wukong', from: 'sky' }], ['walk', { who: 'wk', to: [0, 30] }],
          ['fx', { kind: 'flash', dur: 0.8 }], ['fx', { kind: 'sparks', dur: 10 }], ['wait', { t: 10 }], ['disperse', {}], ['leave', { who: 'wk', by: 'sky' }]] },
      ] },
    hds: {
      cast: [['yeu_binh', 3, 'guard'], ['tamtang', 1, 'wander'], ['bajie', 1, 'wander'], ['shaseng', 1, 'wander']],
      stories: [
        { id: 'fan', title: ['Quạt Ba Tiêu', 'The Palm-Leaf Fan'], beats: [
          ['fx', { kind: 'fire', dur: 20, r: 90 }], ['spawn', { id: 'wk', char: 'wukong', from: 'sky' }], ['walk', { who: 'wk', to: 'focal' }], ['gather', { r: 80 }],
          ['wait', { t: 8 }], ['fx', { kind: 'rain', dur: 45, r: 260 }], ['wait', { t: 30 }], ['leave', { who: 'wk', by: 'sky' }], ['disperse', {}]] },
      ] },
    lat: {
      cast: [['tru_tri', 1, 'pray'], ['hoa_thuong', 4, 'pray'], ['tieu_hoa_thuong', 4, 'wander'], ['ho_phap', 2, 'guard']],
      stories: [
        { id: 'scriptures', title: ['Thỉnh được chân kinh', 'The Scriptures Received'], beats: [
          ['spawn', { id: 'p1', char: 'tamtang', from: 'edge' }], ['spawn', { id: 'p2', char: 'wukong', from: 'edge' }], ['spawn', { id: 'p3', char: 'bajie', from: 'edge' }], ['spawn', { id: 'p4', char: 'shaseng', from: 'edge' }],
          ['walk', { who: 'p1', to: 'focal' }], ['gather', { r: 70 }], ['fx', { kind: 'bell', dur: 4 }], ['fx', { kind: 'gold', dur: 30, r: 120 }], ['wait', { t: 30 }],
          ['leave', { who: 'p1', by: 'walk' }], ['leave', { who: 'p2', by: 'walk' }], ['leave', { who: 'p3', by: 'walk' }], ['leave', { who: 'p4', by: 'walk' }], ['disperse', {}]] },
        { id: 'false_temple', title: ['Tiểu Lôi Âm', 'The False Thunderclap'], beats: [
          ['gather', { r: 50 }], ['fx', { kind: 'mist', dur: 12, r: 90 }], ['spawn', { id: 'wk', char: 'wukong', from: 'sky' }], ['walk', { who: 'wk', to: 'focal' }],
          ['fx', { kind: 'bell', dur: 3 }], ['fx', { kind: 'flash', dur: 1 }], ['fx', { kind: 'gold', dur: 16, r: 100 }], ['wait', { t: 14 }], ['leave', { who: 'wk', by: 'sky' }], ['disperse', {}]] },
      ] },
    tth: {
      cast: [['thuy_quan', 3, 'guard'], ['dan_lang_nam', 3, 'wander'], ['dan_lang_nu', 3, 'wander'], ['nong_phu', 2, 'wander']],
      stories: [
        { id: 'turtle', title: ['Rùa già đưa khách qua sông', 'The Great Turtle'], beats: [
          ['spawn', { id: 'p1', char: 'tamtang', from: 'edge' }], ['spawn', { id: 'p2', char: 'wukong', from: 'edge' }], ['walk', { who: 'p1', to: 'focal' }], ['gather', { r: 70 }],
          ['fx', { kind: 'splash', dur: 8 }], ['wait', { t: 10 }], ['fx', { kind: 'lanterns', dur: 40 }], ['leave', { who: 'p1', by: 'walk' }], ['leave', { who: 'p2', by: 'walk' }], ['disperse', {}]] },
      ] },
  },
};


// ===== mini events (design §4: the middle activity layer) and natural recovery (aftermath footprint + a short tidy-up run) =====
// minis run during peace, one at a time per biome, every TD_DATA.miniGap seconds. at: 'focal' | a character id | (default) where a free character stands.
// after: the footprint left for the whole aftermath. recover: beats run once when the aftermath starts.
(function (B) {
  const g = (r, n, char) => ['gather', { r, n, char }], bub = (kind, who) => ['bubble', { who: who || 'crowd', kind }], fx = (kind, dur, r, at) => ['fx', { kind, dur, r, at }],
    w = t => ['wait', { t }], end = ['disperse', {}];
  const M = {
    hqs: { minis: [{ id: 'splash', beats: [g(30, 4), fx('splash', 6), bub('note'), w(10), end] },
                   { id: 'peach_drop', beats: [fx('peaches', 20, 30), g(26, 3, 'khi'), bub('heart'), w(14), end] },
                   { id: 'elder_story', at: 'khi_lao', beats: [g(34, 4, 'khi_con'), bub('dots', 'khi_lao'), w(4), bub('excl'), w(10), end] }],
           after: { kind: 'peaches', r: 60 }, recover: [g(50, 3), bub('note'), w(12), end] },
    tc:  { minis: [{ id: 'drill', beats: [g(30, 3, 'thien'), fx('bell', 3), bub('excl'), w(10), end] },
                   { id: 'fairies_pick', beats: [g(28, 2, 'tien_nu'), fx('petals', 16, 40), bub('heart'), w(14), end] }],
           after: { kind: 'peaches', r: 80 }, recover: [g(60, 3), fx('petals', 18, 60), bub('note'), w(14), end] },
    btp: { minis: [{ id: 'somersault', at: 'focal', beats: [['spawn', { id: 'wk', char: 'wukong', from: 'sky' }], ['walk', { who: 'wk', to: [70, -20], speed: 1.6 }],
                     ['face', { who: 'wk', dir: 3 }], fx('ink', 50, 20, 'wk'), w(4), fx('steam', 4, 14, 'wk'), w(4), bub('excl', 'wk'), ['leave', { who: 'wk', by: 'sky' }]] },
                   { id: 'motes', beats: [fx('gold', 14, 40), g(30, 2), bub('note'), w(12), end] }],
           after: { kind: 'gold', r: 110 }, recover: [g(40, 3, 'linh_son'), bub('heart'), w(10), end] },
    nhs: { minis: [{ id: 'birds', at: 'wukong', beats: [fx('birds', 16, 30, 'wukong'), w(5), bub('note', 'wukong'), w(10)] },
                   { id: 'monkeys_visit', at: 'wukong', beats: [['spawn', { id: 'm1', char: 'khi_con', from: 'edge' }], ['walk', { who: 'm1', to: 'wukong', off: [-16, 8] }],
                     bub('heart', 'm1'), bub('heart', 'wukong'), w(8), ['leave', { who: 'm1', by: 'walk' }]] },
                   { id: 'yawn', at: 'wukong', beats: [bub('dots', 'wukong'), fx('pebbles', 2, 24, 'wukong'), g(44, 2, 'dan_lang'), bub('excl'), w(5), end] },
                   { id: 'travellers', at: 'wukong', beats: [g(40, 2, 'nong_phu'), bub('q'), bub('note', 'wukong'), w(10), end] }],
           after: { kind: 'pebbles', r: 40 }, recover: [g(40, 3), bub('q'), w(10), end] },
    clt: { minis: [{ id: 'market', beats: [g(30, 4, 'dan_lang'), bub('note'), w(12), end] },
                   { id: 'bajie_snack', at: 'bajie', beats: [g(30, 2, 'nong_phu'), bub('heart', 'bajie'), w(4), bub('excl'), w(8), end] }],
           after: { kind: 'footprints', r: 60 }, recover: [g(50, 3, 'dan_lang'), bub('q'), w(12), end] },
    bcl: { minis: [{ id: 'fog', beats: [fx('mist', 14, 60), g(30, 2), bub('excl'), w(10), end] },
                   { id: 'patrol', beats: [g(26, 3, 'yeu_binh'), bub('dots'), w(10), end] }],
           after: { kind: 'mist', r: 90 }, recover: [g(40, 2), bub('q'), w(10), end] },
    nnq: { minis: [{ id: 'lotus_walk', beats: [g(30, 3, 'cung_nu'), fx('petals', 14, 30), bub('heart'), w(14), end] },
                   { id: 'guard_drill', beats: [g(24, 3, 'thi_ve'), bub('excl'), w(8), end] }],
           after: { kind: 'lanterns', r: 70 }, recover: [g(50, 3, 'cung_nu'), bub('note'), w(12), end] },
    btd: { minis: [{ id: 'spin', beats: [g(30, 2, 'nhen_yeu'), fx('web', 18, 50), bub('dots'), w(12), end] },
                   { id: 'bathing', beats: [g(30, 3, 'nhen_tinh'), fx('splash', 10), bub('note'), w(12), end] }],
           after: { kind: 'web', r: 80 }, recover: [g(40, 3, 'nhen_yeu'), bub('dots'), w(12), end] },
    hds: { minis: [{ id: 'flare', beats: [fx('fire', 10, 40), g(36, 2), bub('excl'), w(8), end] },
                   { id: 'rest', at: 'tamtang', beats: [g(24, 3), bub('dots'), w(12), end] }],
           after: { kind: 'embers', r: 100 }, recover: [g(50, 2), bub('note'), w(10), end] },
    lat: { minis: [{ id: 'chant', beats: [fx('bell', 3), g(30, 4), bub('note'), w(14), end] },
                   { id: 'incense', beats: [fx('gold', 12, 30), g(24, 2, 'tieu'), bub('heart'), w(10), end] }],
           after: { kind: 'gold', r: 120 }, recover: [g(50, 3), fx('bell', 3), bub('note'), w(10), end] },
    tth: { minis: [{ id: 'lantern_float', beats: [fx('lanterns', 18, 40), g(30, 3), bub('heart'), w(14), end] },
                   { id: 'fishers', beats: [fx('splash', 6), g(26, 2), bub('excl'), w(8), end] }],
           after: { kind: 'lanterns', r: 80 }, recover: [g(50, 3), fx('splash', 6), bub('note'), w(10), end] },
  };
  for (const k in M) Object.assign(B[k], M[k]);
})(window.TD_DATA.biomes);
