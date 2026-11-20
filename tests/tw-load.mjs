// Loads the DOM-free Tây Du Ký v2 modules (tayduky/tw-map.js, tw-data.js, tw-sim.js) into one Node VM context for tests.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tayduky');
export function loadTW(files) {
  const ctx = vm.createContext({ console, Math, Date, JSON, Map, Set, Float32Array, Int8Array, Uint8Array, Uint32Array, Int32Array, Int16Array, Object, Array });
  ctx.window = ctx; ctx.globalThis = ctx;
  files = (files || ['tw-map.js', 'tw-data.js', 'tw-sim.js']).slice();
  if (files.includes('tw-map.js') && !files.includes('tw-palm.js') && fs.existsSync(path.join(dir, 'tw-palm.js'))) files.unshift('tw-palm.js');   // the Buddha's Palm map section is part of the map
  if (files.includes('tw-sim.js') && !files.includes('tw-palm-data.js') && fs.existsSync(path.join(dir, 'tw-palm-data.js'))) files.splice(files.indexOf('tw-sim.js') + 1, 0, 'tw-palm-data.js');
  if (!process.env.TW_NOLAYOUT && files.includes('tw-map.js') && !files.includes('tw-layout.js') && fs.existsSync(path.join(dir, 'tw-layout.js'))) files.unshift('tw-layout.js');   // footprint normalisation relocates the authored map
  if (files.includes('tw-map.js') && !files.includes('tw-fire.js') && fs.existsSync(path.join(dir, 'tw-fire.js'))) files.splice(files.indexOf('tw-map.js'), 0, 'tw-fire.js');   // Hỏa Diệm Sơn map section
  if (files.includes('tw-sim.js') && !files.includes('tw-fire-data.js') && fs.existsSync(path.join(dir, 'tw-fire-data.js'))) files.splice(files.indexOf('tw-palm-data.js') + 1 || files.indexOf('tw-sim.js') + 1, 0, 'tw-fire-data.js');
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8') + '\n;this.TWM = typeof TWM !== "undefined" ? TWM : this.TWM; if (typeof TWS !== "undefined") this.TWS = TWS;', ctx, { filename: f });
  return ctx;
}
