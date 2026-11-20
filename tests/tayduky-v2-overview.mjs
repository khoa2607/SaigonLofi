// Footprint overview: the real BIO mask of the compact world next to the pre-normalisation 160 x 160 world, with areas. node tests/tayduky-v2-overview.mjs [out.png]
import { withChrome, wait } from './cdp.mjs';
import { execFileSync } from 'child_process';
import { loadTW } from './tw-load.mjs';
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const out = process.argv[2] || 'overview.png', here = path.dirname(fileURLToPath(import.meta.url));
const dump = M => ({ N: M.N, bio: Array.from(M.BIO), walk: Array.from(M.WALK), h: Array.from(M.H), mat: Array.from(M.MAT), biomes: M.biomes.map(b => [b.id, b.title[0], b.built ? 1 : 0, b.centre]), gates: M.gates || [] });
const now = dump(loadTW().TWM);
const loaderUrl = pathToFileURL(path.join(here, 'tw-load.mjs')).href;
const old = JSON.parse(execFileSync(process.execPath, ['-e', `import('${loaderUrl}').then(m=>{const M=m.loadTW().TWM;console.log(JSON.stringify({N:M.N,bio:Array.from(M.BIO),h:Array.from(M.H),biomes:M.biomes.map(b=>[b.id,b.title[0],b.built?1:0,b.centre])}))})`], { env: { ...process.env, TW_NOLAYOUT: '1' }, maxBuffer: 1 << 28 }).toString());
await withChrome(1920, 1080, async ({ base, send, ev }) => {
  await send('Page.navigate', { url: base + 'tayduky/index.html?at=tc' }); await wait(1500);
  await ev(`(()=>{document.body.innerHTML='';document.body.style.cssText='margin:0;background:#171522';const NOW=${JSON.stringify(now)},OLD=${JSON.stringify(old)};
    const cols=['#d9c38d','#c3623f','#cd7f91','#59426c','#9c98a3','#c3aa70','#568bab','#e8d8eb','#e5d09a','#889ca0','#75ab7e','#79a18b','#dc7951','#a77987','#927b62'];
    const c=document.createElement('canvas');c.width=1920;c.height=1080;document.body.appendChild(c);const g=c.getContext('2d');g.fillStyle='#171522';g.fillRect(0,0,1920,1080);
    g.font='bold 22px sans-serif';g.fillStyle='#fff';g.fillText('Tây Du Ký v2 — footprint normalisation: actual tile mask (4 built biomes outlined)',40,36);
    const draw=(W,x0,y0,s,title)=>{const N=W.N;g.font='bold 17px sans-serif';g.fillStyle='#ddd';g.fillText(title,x0,y0-10);
      for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++){const k=j*N+i,b=W.bio[k];g.fillStyle=cols[b];g.fillRect(x0+i*s,y0+j*s,s,s);if(W.biomes[b][2]){const hh=W.h[k];g.fillStyle='rgba(0,0,0,'+Math.max(0,(3-hh)*0.06)+')';g.fillRect(x0+i*s,y0+j*s,s,s);}}
      g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=1;for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++){const k=j*N+i,b=W.bio[k];if(W.bio[k+1]!==b){g.beginPath();g.moveTo(x0+(i+1)*s,y0+j*s);g.lineTo(x0+(i+1)*s,y0+(j+1)*s);g.stroke();}if(W.bio[k+N]!==b){g.beginPath();g.moveTo(x0+i*s,y0+(j+1)*s);g.lineTo(x0+(i+1)*s,y0+(j+1)*s);g.stroke();}}
      const area={};for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++)area[W.bio[j*N+i]]=(area[W.bio[j*N+i]]||0)+1;
      g.font='bold 13px sans-serif';W.biomes.forEach((b,k)=>{let sx=0,sy=0,n=0;for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++)if(W.bio[j*N+i]===k){sx+=i;sy+=j;n++;}if(!n)return;g.fillStyle=b[2]?'#fff':'#1b1722';g.fillText(b[0].toUpperCase()+(b[2]?' ●':''),x0+sx/n*s-14,y0+sy/n*s);g.font='12px sans-serif';g.fillText(n,x0+sx/n*s-8,y0+sy/n*s+14);g.font='bold 13px sans-serif';});return area;};
    draw(OLD,40,70,5,'BEFORE: 160 x 160 = 24,964 tiles (avg 1,664 per region)');draw(NOW,880,70,9,'AFTER: 104 x 104 = 10,404 tiles (avg 694 per region)');
    for(const gt of NOW.gates){g.fillStyle='#ff0';g.fillRect(880+gt.at[0]*9-1,70+gt.at[1]*9-1,11,11);}
    g.font='13px sans-serif';g.fillStyle='#ccc';g.fillText('yellow squares = ramped gates that open each trimmed built biome onto the world',880,1070);
  })()`);
  const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(out, Buffer.from(s.data, 'base64')); console.log('wrote', out);
});
