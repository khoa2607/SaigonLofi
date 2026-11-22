// Verify runtime sheets, actions, static props and sorting keys in a browser.
import {withChrome,wait} from './cdp.mjs';
await withChrome(1280,720,async ({base,send,ev,on})=>{
 const errors=[];on(m=>{if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails));});
 await send('Page.navigate',{url:base+'tayduky/index.html?at=tc&seed=7'});await wait(4000);
 const data=JSON.parse(await ev(`(async()=>JSON.stringify(await (async()=>{const ids=['tc_fairy','tc_guard','tc_laojun','tc_wukong'], rows=[];
 for(const id of ids){const C=TD2_CHARS.chars[id], im=new Image();im.src=C.src;await im.decode();let action=null;if(C.action){const a=new Image();a.src=C.action.src;await a.decode();action=[a.naturalWidth,a.naturalHeight,C.action.count]};rows.push({id,size:[im.naturalWidth,im.naturalHeight],cell:C.size,walk:C.anim.walk,action});}
 const statics=TWR.statics.filter(s=>s.p.biome==='tc'), kinds=['tcgate','tcpalace','tcfurnace','tcbridge','tcpeach','tclantern'];return {rows,props:kinds.map(kind=>({kind,count:statics.filter(s=>s.p.kind===kind).length,valid:statics.filter(s=>s.p.kind===kind).every(s=>Number.isFinite(s.key)&&s.sp.frames[0].naturalWidth>0)}))};})()))()`,true));
 const ok=!errors.length&&data.rows.every(r=>r.walk[1]===8&&r.size[0]===r.cell[0]*12&&r.size[1]===r.cell[1]*4)&&data.rows.filter(r=>r.id!=='tc_wukong').every(r=>r.action&&r.action[0]===640&&r.action[1]===320&&r.action[2]===8)&&data.props.every(p=>p.count>0&&p.valid);
 console.log(JSON.stringify({data,errors},null,2));console.log(ok?'PASS':'FAIL');if(!ok)process.exitCode=1;
});
