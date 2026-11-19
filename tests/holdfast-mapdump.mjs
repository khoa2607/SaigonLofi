// Prints the settlement as a top-down character map in design units (u →, v ↓) for layout planning.
// Usage: node tests/holdfast-mapdump.mjs [u0 u1 v0 v1 du dv]
import { loadHF, ev } from './hf-load.mjs';
const c = loadHF(['js/core.js', 'js/art.js', 'holdfast/hf-map.js', 'holdfast/hf-art.js']);
c.hfBuildMap(7);
const [u0, u1, v0, v1, du, dv] = (process.argv.slice(2).length ? process.argv.slice(2) : [20, 940, 190, 530, 6, 5]).map(Number);
const HF = ev(c, 'HF'), GK = ev(c, 'GK');
const bAt = new Map(); HF.buildings.forEach(b => { for (const [i, j] of c.fp(b.x, b.y, b.w, b.d)) bAt.set(j * 144 + i, b); });
const pAt = new Map(); HF.props.forEach(p => { const i = Math.floor(p.x / 8), j = Math.floor(p.y / 8); pAt.set(j * 144 + i, p); });
const BK = { house: 'h', barracks: 'B', infirmary: '+', workshop: 'W', church: 'C', school: 'S', barn: 'N', kitchen: 'K', stable: 'H' };
let out = '';
for (let v = v0; v <= v1; v += dv) {
  let row = String(v).padStart(4) + ' ';
  for (let u = u0; u <= u1; u += du) {
    const [x, y] = c.d2w(u, v), i = Math.floor(x / 8), j = Math.floor(y / 8);
    if (i < 0 || j < 0 || i >= 144 || j >= 144) { row += ' '; continue; }
    const k = j * 144 + i, b = bAt.get(k), g = HF.gk[k];
    let ch = '.';
    if (HF.wallAt[k] >= 0) ch = HF.walls[HF.wallAt[k]].gate ? 'G' : '#';
    else if (b) ch = BK[b.kind] || 'b';
    else if (HF.occ[k] === 4) ch = 'T';
    else if (HF.occ[k] === 3) ch = 'o';
    else if (g === GK.WATER) ch = '~'; else if (g === GK.FIELD) ch = 'f'; else if (g === GK.STREET) ch = '='; else if (g === GK.MAIN) ch = '|';
    else if (g === GK.PLAZA) ch = ':'; else if (g === GK.GREEN) ch = 'g'; else if (g === GK.CLEARED) ch = ','; else if (g === GK.STREAM) ch = 's'; else if (g === GK.SAND) ch = '_';
    else if (g === GK.FOREST || g === GK.WGRASS || g === GK.MEADOW) ch = ' ';
    row += ch;
  }
  out += row + '\n';
}
let hdr = '     '; for (let u = u0; u <= u1; u += du) hdr += (Math.round(u) % 60 === 0 || (u - u0) % 60 === 0 && false) ? '|' : ' ';
console.log(out);
console.log('u from', u0, 'step', du, '; lots', HF.lots.length, '; houses', HF.buildings.filter(b => b.kind === 'house').length);
