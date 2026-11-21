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
  if (files.includes('tw-map.js') && !files.includes('tw-lion.js') && fs.existsSync(path.join(dir, 'tw-lion.js'))) files.splice(files.indexOf('tw-map.js'), 0, 'tw-lion.js');   // Sư Đà Lĩnh map section
  if (files.includes('tw-sim.js') && !files.includes('tw-lion-data.js') && fs.existsSync(path.join(dir, 'tw-lion-data.js'))) files.splice(files.indexOf('tw-fire-data.js') + 1, 0, 'tw-lion-data.js');
  if (files.includes('tw-map.js') && !files.includes('tw-river.js') && fs.existsSync(path.join(dir, 'tw-river.js'))) files.splice(files.indexOf('tw-map.js'), 0, 'tw-river.js');   // Thông Thiên Hà map section
  if (files.includes('tw-sim.js') && !files.includes('tw-river-data.js') && fs.existsSync(path.join(dir, 'tw-river-data.js'))) files.splice(files.indexOf('tw-lion-data.js') + 1, 0, 'tw-river-data.js');
  if (files.includes('tw-map.js') && !files.includes('tw-hps.js') && fs.existsSync(path.join(dir, 'tw-hps.js'))) files.splice(files.indexOf('tw-map.js'), 0, 'tw-hps.js');   // Hắc Phong Sơn map section
  if (files.includes('tw-sim.js') && !files.includes('tw-hps-data.js') && fs.existsSync(path.join(dir, 'tw-hps-data.js'))) files.splice(files.indexOf('tw-river-data.js') + 1, 0, 'tw-hps-data.js');
  if (files.includes('tw-map.js') && !files.includes('tw-nhs.js') && fs.existsSync(path.join(dir, 'tw-nhs.js'))) files.splice(files.indexOf('tw-map.js'), 0, 'tw-nhs.js');   // Ngũ Hành Sơn map section
  if (files.includes('tw-sim.js') && !files.includes('tw-nhs-data.js') && fs.existsSync(path.join(dir, 'tw-nhs-data.js'))) files.splice(files.indexOf('tw-hps-data.js') + 1, 0, 'tw-nhs-data.js');
  if (files.includes('tw-map.js') && !files.includes('tw-ntq.js') && fs.existsSync(path.join(dir, 'tw-ntq.js'))) files.splice(files.indexOf('tw-map.js'), 0, 'tw-ntq.js');   // Ngũ Trang Quán map section
  if (files.includes('tw-sim.js') && !files.includes('tw-ntq-data.js') && fs.existsSync(path.join(dir, 'tw-ntq-data.js'))) files.splice(files.indexOf('tw-nhs-data.js') + 1, 0, 'tw-ntq-data.js');
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8') + '\n;this.TWM = typeof TWM !== "undefined" ? TWM : this.TWM; if (typeof TWS !== "undefined") this.TWS = TWS;', ctx, { filename: f });
  return ctx;
}
