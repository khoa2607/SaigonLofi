// Loads the DOM-free Tây Du Ký v2 modules (tayduky/tw-map.js, tw-data.js, tw-sim.js) into one Node VM context for tests.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tayduky');
export function loadTW(files) {
  const ctx = vm.createContext({ console, Math, Date, JSON, Map, Set, Float32Array, Int8Array, Uint8Array, Uint32Array, Int32Array, Object, Array });
  ctx.window = ctx; ctx.globalThis = ctx;
  for (const f of files || ['tw-map.js', 'tw-data.js', 'tw-sim.js']) vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8') + '\n;this.TWM = typeof TWM !== "undefined" ? TWM : this.TWM; if (typeof TWS !== "undefined") this.TWS = TWS;', ctx, { filename: f });
  return ctx;
}
