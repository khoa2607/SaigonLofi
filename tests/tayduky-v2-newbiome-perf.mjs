// Frame time (ms, headless software GL) of the two new biomes at wide zoom, day and night, and during a forced signature. node tests/tayduky-v2-newbiome-perf.mjs
import { withChrome, wait } from './cdp.mjs';
const CASES = [['clt day wide', 'at=clt&tod=day&zoom=0.7'], ['clt night wide', 'at=clt&tod=night&zoom=0.7'], ['clt signature', 'at=clt&tod=day&zoom=1&force=clt&speed=3'], ['lhd day wide', 'at=lhd&tod=day&zoom=0.7'], ['lhd night wide', 'at=lhd&tod=night&zoom=0.7'], ['lhd signature', 'at=lhd&tod=day&zoom=1&force=lhd&speed=3'], ['tc day wide (reference)', 'at=tc&tod=day&zoom=0.7']];
await withChrome(1920, 1080, async ({ base, send, ev, on }) => {
  const errs = []; on(m => { if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  for (const [name, q] of CASES) { await send('Page.navigate', { url: base + 'tayduky/index.html?seed=7&' + q }); await wait(9000); const xs = []; for (let k = 0; k < 24; k++) { xs.push(await ev('TWR.frameMs')); await wait(250); } xs.sort((a, b) => a - b); const avg = xs.reduce((s, v) => s + v, 0) / xs.length; console.log(name.padEnd(26), 'avg', avg.toFixed(1), 'ms  median', xs[12].toFixed(1), ' p90', xs[21].toFixed(1)); }
  console.log(JSON.stringify({ errors: errs })); console.log(errs.length ? 'FAIL' : 'PASS');
});
