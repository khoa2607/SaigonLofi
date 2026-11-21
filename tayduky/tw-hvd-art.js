'use strict';
// Fire Cloud Cave: a copper-crimson cliff language, cold stream and dark pines.
(function(){
  const A=TWA,M=TWM.M,{vnoise,hash2}=TWM,{tone,mix}=A;
  const rgb=s=>{const v=parseInt(s.slice(1),16);return[v>>16,v>>8&255,v&255]};
  const ramp=a=>a.map(rgb);
  const CR=ramp(['#271b24','#3c2430','#582c35','#78373a','#9e4b43','#bf6551','#e18d64']);
  const CU=ramp(['#372530','#53313a','#744149','#955349','#b46952','#d18d65','#e8b47e']);
  const PN=ramp(['#182c32','#25423e','#345a49','#49745a','#69906c','#9ab089']);
  const AS=ramp(['#29242c','#41313a','#5e4144','#80564e','#a6765b','#c89770']);
  const WT=ramp(['#173344','#285572','#3a7899','#62a6b9','#a5d9db','#e8f6ed']);
  const ST=ramp(['#4d2c37','#6a3940','#8b4b48','#ad6756','#d38b67']);
  const stone=(r,I,J,side=0)=>tone(r,1+vnoise(I*.48,J*.47,340)*3+vnoise(I*1.8,J*1.8,341)*.8-side*.7);
  function top(m,I,J,X,Y,k,d,SH){
    const n=vnoise(I*.63,J*.63,342),f=vnoise(I*1.9,J*1.9,343),h=hash2(X,Y,344);
    if(m===M.STREAM){SH.water=2;const c=stone(WT,I,J);return h<.05?WT[5]:c;}
    if(m===M.CHASM){return tone(AS,.5+n*1.4);}
    if(m===M.HBRIDGE){const u=Math.floor((I+J)*4),seam=((I+J)*4)%1<.15;return seam?CR[1]:tone(CU,2+hash2(u,Math.floor(I-J),345)*2);}
    if(m===M.HCOPPER){const row=Math.floor(J*1.6),u=(I*1.6+(row&1)*.5)%1,join=u<.055||(J*1.6)%1<.07;
      let c=join?CU[1]:tone(CU,2+n*2+f*.8);if(h<.006){SH.em=[255,136,85];c=CU[6];}return c;}
    if(m===M.HPATH){const c=stone(CU,I,J);return ((I*4+J*2)%1<.06)?mix(c,CU[5],.38):c;}
    if(m===M.HPINE){let c=stone(PN,I,J);if(h<.023)c=PN[4];return c;}
    if(m===M.HASH){let c=stone(AS,I,J);if(h<.014){SH.em=[255,113,65];c=mix(c,CR[6],.6);}return c;}
    let c=stone(CR,I,J);const grain=vnoise(I*.9,J*.9,346),band=(Math.floor((I-J)*1.4)%4+4)%4;
    if(grain>.7)c=mix(c,CU[3],.25);
    if(band===0&&h<.012){SH.em=CR[6];c=CR[6];}
    return c;
  }
  function face(side,lx,ry,drop,elev,gx,k,SH){
    const m=TWM.MAT[k],band=Math.floor((elev+vnoise(gx*.12,.5,347)*5)/7),
      c=tone(m===M.STREAM?WT:m===M.CHASM?AS:CR,
        (side?.7:1.7)+hash2(band,Math.floor(gx/9),348)*1.8+(vnoise(gx*.24,elev*.16,349)-.5)*1.2);
    if(ry<2)return m===M.STREAM?WT[4]:CR[1];
    if(m===M.STREAM){SH.water=2;return mix(c,WT[5],.2+vnoise(gx*.7,ry*.2,350)*.35);}
    if(ry>drop-3)return mix(c,CR[0],.4);
    if(hash2(gx>>1,elev>>2,351)<.008&&m!==M.HPINE){SH.em=[255,95,55];return mix(c,CR[6],.55);}
    if(m===M.HPINE&&ry<drop*.16&&vnoise(gx*.3,ry*.3,352)>.65)return mix(c,PN[2],.55);
    return c;
  }
  const seamTone=(I,J,n0,n1)=>tone(CR,1+n0*2+n1*.6);
  const K={hvdfortress:['hvd_fortress_a'],hvdtower:['hvd_tower_a'],hvdhut:['hvd_hut_a'],
    hvdritual:['hvd_ritual_a'],hvdpine:['hvd_pine_a','sdl_pine_a'],hvdrock:['sdl_rock_a','sdl_rock_b'],hvdpeak:['hvd_mountain_a'],
    hvdburnt:['hds_tree_a'],hvdbrazier:['hvd_brazier_a'],hvdbanner:['hvd_banner_a'],hvdbridge:['hvd_bridge_a'],hvdwaterfall:['hvd_waterfall_a']};
  Object.assign(A.IMGKINDS,K);
  A.GLOWS.push('hvd_fortress_','hvd_ritual_','hvd_tower_','hvd_hut_','hvd_bridge_');
  Object.assign(A.SWAY,{hvdpine:.9,hvdbanner:1.8,hvdburnt:.45,hvdbrazier:.25});
  A.hvd={top,face,edge:()=>CR[0],stairPal:ST,seamTone,ramps:{CR,CU,PN,AS,WT}};
})();
