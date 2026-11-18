// Loads SaigonLofi core + Holdfast modules into one Node VM realm (DOM-free) for tests.
import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export function loadHF(files) {
  const ctx = { console, Math, Date, performance: { now: () => Number(process.hrtime.bigint() / 1000n) / 1000 }, setTimeout, clearTimeout };
  ctx.window = ctx; vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
  return ctx;
}
export const ev = (ctx, expr) => vm.runInContext(expr, ctx);
