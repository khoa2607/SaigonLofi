'use strict';
// ===== Tây Du Ký — Huyền Thoại Sống: biome casts and stories as data (design doc §4, §6) =====
// cast: [character, count, role]. Roles: wander (default), hop (monkeys), guard (patrols a short beat), pray (stays, bows), static (never moves).
// Stories are beat lists interpreted by td-sim.js. Beat vocabulary:
//   spawn {id, char, from:'edge'|'sky'|'focal'}   walk {who, to:'focal'|[dx,dy], speed}   gather {r}   face {who|'crowd', to}
//   fx {kind, dur, r, at}   wait {t}   strike {who, target}   swap {who, char}   chase {who, target, t}   leave {who, by:'walk'|'sky'}   disperse {}
// fx kinds: gold, fire, sparks, rain, web, mist, petals, lanterns, splash, flash, peaches, bell, cloud.
window.TD_DATA = {
  loop: { peace: [150, 330], fore: [35, 55], after: [60, 110] },        // seconds (design: a 5-10 minute loop per biome)
  maxSignatures: 5,
  beacon: { hqs: '#ffd27a', tc: '#ff7a5a', btp: '#ffe9a0', clt: '#ffb4c8', bcl: '#a8ffb8', nnq: '#ffb0d0', btd: '#c890ff', hds: '#ff8a3a', lat: '#fff0b0', tth: '#9adcff' },
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
