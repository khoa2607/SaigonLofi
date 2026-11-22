'use strict';
// Fire Cloud Cave: cloud banks, banners and pines (sprite sway), ember breath, falls, crows, wind, true fire and divine water.
(function(){
 const F=TWM.hvd,hash=TWM.hash2,A=TWA,T=8,near=(R,X,Y,m=120)=>X>R.cx-R.cv.width/2-m&&X<R.cx+R.cv.width/2+m&&Y>R.cy-R.cv.height/2-m&&Y<R.cy+R.cv.height/2+m;
 const tile=(i,j)=>[A.SX(i,j),A.SY(i,j,TWM.H[TWM.id(i,j)])],clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 let cloud=null;
 function cloudSprite(){if(cloud)return cloud;const c=document.createElement('canvas');c.width=128;c.height=42;const g=c.getContext('2d');
  for(let n=0;n<24;n++){const h=hash(n,3,411),x=5+h*116,y=9+hash(n,4,411)*18,w=13+hash(n,5,411)*27;g.fillStyle=n%4?'#ba6374':'#e9978c';g.fillRect(Math.round(x-w/2),Math.round(y),Math.round(w),5+Math.round(hash(n,6,411)*9));}
  g.fillStyle='#e8a39a';for(let n=0;n<12;n++){const x=8+hash(n,7,411)*108,y=6+hash(n,8,411)*12;g.fillRect(Math.round(x),Math.round(y),10+Math.round(hash(n,9,411)*14),3);}
  return cloud=c;
 }
 const pixel=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
 function mist(g,X,Y,t,a,col){if(a<=.01)return;const c=cloudSprite();g.globalAlpha=a;g.drawImage(c,Math.round(X-64),Math.round(Y-21),128,42);g.globalAlpha=1;}
 function flame(g,X,Y,t,seed,scale=1,amt=1,magic=false){
  if(amt<.01)return;const ph=seed*2.8;
  for(let q=0;q<7;q++){const x=X+(q-3)*2.3*scale,age=(t*(.8+q*.1)+hash(seed,q,412))%1,h=(9+8*Math.abs(Math.sin(t*5+q+ph)))*scale*amt;
   for(let y=0;y<h;y+=2){const f=y/h,drift=Math.sin(t*5+q+f*6)*f*3*scale;pixel(g,x+drift,Y-y,Math.max(1,Math.round((3-f*2)*scale)),2,magic?f<.4?'rgba(255,236,160,.9)':f<.75?'rgba(255,110,90,.8)':'rgba(166,50,122,.7)':f<.4?'rgba(255,220,120,.9)':f<.75?'rgba(238,115,53,.85)':'rgba(150,42,48,.65)');}
   pixel(g,x+Math.sin(t*5+q)*6,Y-h-8*age,2,2,magic?'#ffdb96':'#ffc279');
  }
 }
 function bird(g,X,Y,t,phase,scale=1){const fl=Math.sin(t*10+phase),w=4*scale;pixel(g,X,Y,2,1,'#241c2b');for(let s=1;s<=w;s++){pixel(g,X-s,Y-s*.25-fl*s*.33,1,1,'#241c2b');pixel(g,X+s+1,Y-s*.25-fl*s*.33,1,1,'#241c2b');}}
 function draw(g,S,R,x0,y0,W,Hh){const f=S.hvd;if(!f)return;const t=R.t,x1=x0+W,y1=y0+Hh,[cx,cy]=tile(15,40);if(!near(R,cx,cy,2000))return;
  // Two cloud strata drift at distinct speeds over the actual mountain shelves.
  for(let layer=0;layer<2;layer++)for(let n=0;n<18;n++){
    const i=3+hash(n,layer,413)*25,j=6+hash(n,layer+8,413)*35,k=TWM.id(Math.floor(i),Math.floor(j));
    if(TWM.BIO[k]!==TWM.bi.hvd)continue;const [sx,sy]=tile(i,j),X=sx+Math.sin(t*(layer?.034:.07)+n)*65+((t*(layer?2.5:4.5)+n*73)%170)-85,Y=sy-(layer?60:130)-hash(n,layer+3,413)*28;
    if(!near(R,X,Y,180))continue;g.globalAlpha=(layer?.16:.2)+f.cloud*(layer?.22:.3);g.drawImage(cloudSprite(),Math.round(X-64),Math.round(Y-18),layer?140:176,layer?44:58);g.globalAlpha=1;
  }
  // Fiery cloud formations thicken and pull toward the ritual terrace during the signature.
  for(let n=0;n<8;n++){const [X0,Y0]=tile(24,39),ph=n*6.28/8+t*(.045+hash(n,7,414)*.025),r=100+n%3*25-f.cloud*28,X=X0+Math.cos(ph)*r,Y=Y0-90+Math.sin(ph)*r*.32;
    if(near(R,X,Y,180))mist(g,X,Y,t,(.17+.25*f.cloud)*(1-.45*f.water));}
  // Flowing waterfall curtains, foam, spray and moving stream currents.
  for(const k of F.falls){const i=k%TWM.N,j=(k/TWM.N)|0,[X,Y]=tile(i,j),below=TWM.H[TWM.id(i,j+1)],drop=Math.max(0,(TWM.H[k]-below)*16);if(!near(R,X,Y,100+drop)||drop<8)continue;
    for(let q=0;q<18;q++){const a=hash(i*7+q,j,415),age=(t*(1.5+a)+a*13)%1,x=X-27+a*52,y=Y+17+age*drop;
      pixel(g,x,y,1+q%3,6+q%4,`rgba(206,241,251,${.35+.45*Math.sin(age*Math.PI)})`);
      if(q<9)pixel(g,x+(a-.5)*12,Y+17+drop-Math.sin(age*3.14)*8,2,1,'rgba(234,250,255,.65)');}
    for(let q=0;q<3;q++)mist(g,X+(hash(q,i,416)-.5)*35,Y+drop+25-q*9,t,.12,'white');
  }
  for(let n=0;n<F.stream.length;n++){const k=F.stream[n],i=k%TWM.N,j=(k/TWM.N)|0,[X,Y]=tile(i,j);if(!near(R,X,Y,60))continue;
    for(let q=0;q<3;q++){const a=hash(i,j+q,417),age=(t*(.48+a*.25)+a*4)%1;pixel(g,X-21+age*39,Y+12+(a-.5)*12,5,1,'rgba(215,250,255,.55)');}}
  // Main architecture breathes: gate red glow, smoke from workshops, magical flame on the ritual object.
  for(const s of R.statics){const kind=s.p.kind;if(!kind.startsWith('hvd')||!near(R,s.X+s.sp.w/2,s.Y+s.sp.h/2,180))continue;
    if(kind==='hvdfortress'){const X=s.X+s.sp.w*.5,Y=s.Y+s.sp.h*.72;
      g.globalCompositeOperation='lighter';pixel(g,X-22,Y-17,44,25,`rgba(255,58,58,${.035+.025*Math.sin(t*1.6)+f.fire*.05})`);g.globalCompositeOperation='source-over';
      for(let q=0;q<11;q++){const a=hash(s.p.i,q,418),age=(t*(.13+a*.1)+q/11)%1;pixel(g,X+(a-.5)*43+age*25,Y-60-age*90,5+q%4,3,`rgba(83,49,69,${(1-age)*(.23+f.cloud*.26)})`);}
    }else if(kind==='hvdhut'||kind==='hvdtower'){const X=s.X+s.sp.w*.65,Y=s.Y+s.sp.h*.3;for(let q=0;q<4;q++){const a=hash(s.p.j,q,419),age=(t*.16+q/4+a*.1)%1;pixel(g,X+Math.sin(t*.6+q)*5+age*15,Y-age*45,4+q%3,2,`rgba(105,72,82,${(1-age)*.3})`);}}
    else if(kind==='hvdritual'){flame(g,s.X+s.sp.w*.5,s.Y+s.sp.h*.49,t,41,1.45,.5+f.fire*1.3,true);}
    else if(kind==='hvdbrazier')flame(g,s.X+s.sp.w*.5,s.Y+s.sp.h*.42,t,s.p.i+s.p.j,.8,.7+f.fire*.3,false);
  }
  // Wind-driven ash and pine needles, plus small squirrels on the forest edge.
  for(let n=0;n<46;n++){const i=1+hash(n,4,420)*34,j=3+hash(n,5,420)*78,k=TWM.id(Math.floor(i),Math.floor(j));if(TWM.BIO[k]!==TWM.bi.hvd)continue;
    const [X0,Y0]=tile(i,j),a=hash(n,6,420),age=(t*(.12+a*.14)+a*9)%1,X=X0+age*(35+f.wind*25),Y=Y0-20-age*(20+a*45)+Math.sin(t*.8+n)*4;
    if(near(R,X,Y,30))pixel(g,X,Y,n%3?2:1,1,n%4?'rgba(180,123,91,.7)':'rgba(255,170,85,.78)');}
  for(let n=0;n<4;n++){const i=4+n*3,j=48+n*2,k=TWM.id(i,j);if(TWM.BIO[k]!==TWM.bi.hvd)continue;const [X,Y]=tile(i,j),ph=(t*.18+n*.21)%1;if(near(R,X,Y,40)){pixel(g,X+Math.sin(ph*6.28)*8,Y+6,3,2,'#543b3a');pixel(g,X+Math.sin(ph*6.28)*8+2,Y+4,1,2,'#7b5850');}}
  // Crows circle the peaks; a separate flock crosses the back of the scene.
  for(let n=0;n<10;n++){const [X0,Y0]=tile(7,28),ang=t*(.27+hash(n,4,421)*.1)+n*.72,X=X0+Math.cos(ang)*(90+n*7),Y=Y0-125+Math.sin(ang)*(29+n%3*8);if(near(R,X,Y,40)){g.globalAlpha=1-f.fire*.65;bird(g,X,Y,t,n,n%4===0?2:1);g.globalAlpha=1;}}
  for(let n=0;n<5;n++){const [X0,Y0]=tile(17,34),X=X0+((t*19+n*47)%390)-195,Y=Y0-160+n*7+Math.sin(t*.7+n)*5;if(near(R,X,Y,30))bird(g,X,Y,t,n);}
  // Mini-events alter the local scene: a startled crow flock and a gust visibly crossing the bridge.
  for(const s of f.scares){const X=R.wx(s.x,s.y),Y=R.wy(s.x,s.y,TWM.groundZ(s.x,s.y)),age=s.t/s.life;if(!near(R,X,Y,200))continue;
    if(s.kind==='crows')for(let n=0;n<14;n++){const a=n*2.4,dist=age*(45+n*8),x=X+Math.cos(a)*dist,y=Y-35-age*(65+n*3)+Math.sin(a)*dist*.25;bird(g,x,y,t,n,n%4===0?2:1);}
    if(s.kind==='bridge')for(let n=0;n<20;n++){const a=hash(n,3,423),x=X-75+((t*45+n*19)%150),y=Y-22+(a-.5)*48;pixel(g,x,y,8+n%5,1,`rgba(216,197,166,${(1-age)*.55})`);}
  }
  // Captive monk stays visibly at the cave gate, enclosed by magical bars with a breathing outline.
  if(f.captive){const a=S.agents.find(a=>a.biome==='hvd'&&a.captive&&!a.gone);if(a){const X=R.wx(a.x,a.y),Y=R.wy(a.x,a.y,a.gz)-18;if(near(R,X,Y,65)){for(let q=0;q<5;q++){const xx=X-17+q*8;pixel(g,xx,Y-18,2,36,`rgba(255,125,87,${.55+.16*Math.sin(t*3+q)})`);}pixel(g,X-20,Y-19,42,2,'#ffb884');pixel(g,X-20,Y+17,42,2,'#9a3d53');}}}
  // True fire expands as nested flame tongues and cloud light, then divine water visibly cools it.
  if(f.fire>.02){const [X,Y]=tile(24,40);for(let q=0;q<24;q++){const a=q/24*6.283,rad=(22+f.fire*105)*(1+.13*Math.sin(t*3+q)),x=X+Math.cos(a)*rad,y=Y+Math.sin(a)*rad*.52;
    if(near(R,x,y,60))flame(g,x,y,t,q,.4+f.fire*.6,f.fire*(1-.6*f.water),true);}
    g.globalCompositeOperation='lighter';const rg=g.createRadialGradient(X,Y-45,5,X,Y-45,260);rg.addColorStop(0,`rgba(255,76,65,${.15*f.fire})`);rg.addColorStop(1,'rgba(170,28,62,0)');g.fillStyle=rg;g.fillRect(X-260,Y-305,520,520);g.globalCompositeOperation='source-over';}
  if(f.water>.02){const [X,Y]=tile(24,40);const gy=S.agents.find(a=>a.biome==='hvd'&&a.char==='hvd_guanyin'&&!a.gone&&!a.hidden);
    if(gy){const gx=R.wx(gy.x,gy.y),yy=R.wy(gy.x,gy.y,gy.gz+(gy.lift||0))-43;
      for(let q=0;q<65;q++){const u=(q/65+t*.22)%1,v=1-u,px=v*v*gx+2*v*u*(gx+X)*.5+u*u*X,py=v*v*yy+2*v*u*(Math.min(yy,Y)-86)+u*u*(Y-16);
        if(near(R,px,py,25)){pixel(g,px,py,3+q%3,2,`rgba(174,242,255,${f.water*(.45+.4*u)})`);if(q%4===0)pixel(g,px+4,py+2,1,2,'#f4fff2');}}
    }
    for(let q=0;q<28;q++){const ang=q*6.283/28,rad=10+f.water*(20+5*Math.sin(t*4));pixel(g,X+Math.cos(ang)*rad,Y-7+Math.sin(ang)*rad*.43,3,2,`rgba(193,250,255,${f.water*.7})`);}
    for(let q=0;q<70;q++){const a=hash(q,1,422),b=hash(q,2,422),age=(t*(.7+a*.5)+b)%1,x=X+(a-.5)*170+Math.sin(t+q)*9,y=Y-260+age*250;
    if(near(R,x,y,20))pixel(g,x,y,1+q%3,4+q%4,`rgba(180,240,255,${f.water*(.2+.5*age)})`);}
    for(let n=0;n<6;n++){const age=(t*.22+n/6)%1;mist(g,X+Math.sin(t*.4+n)*60,Y-10-age*65,t,(1-age)*f.water*.18);}
  }
  for(const b of f.bursts){const X=R.wx(b.x,b.y),Y=R.wy(b.x,b.y,TWM.groundZ(b.x,b.y)),age=b.t/(b.life||2.4);if(!near(R,X,Y,80))continue;for(let n=0;n<18;n++){const a=n/18*6.283,r=age*45;pixel(g,X+Math.cos(a)*r,Y-10+Math.sin(a)*r*.5-age*18,2,2,b.kind==='release'?'#c8ecff':n%3?'#ffb370':'#fb6d5d');}}
  for(const s of f.steam){const X=R.wx(s.x,s.y),Y=R.wy(s.x,s.y,TWM.groundZ(s.x,s.y));mist(g,X+Math.sin(t*.5)*13,Y-15-s.t*6,t,.23*(1-s.t/s.life));}
 }
 function light(g,S,R,amt){const f=S.hvd;if(!f||amt<.04)return;const glow=(X,Y,r,a,col)=>{if(!near(R,X,Y,r))return;const gr=g.createRadialGradient(X,Y,3,X,Y,r);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.fillRect(X-r,Y-r,r*2,r*2);};
  for(const s of R.statics){const k=s.p.kind;if(k==='hvdfortress')glow(s.X+s.sp.w*.5,s.Y+s.sp.h*.7,180,(.18+.07*Math.sin(R.t*1.6)+f.fire*.15)*amt,'255,100,75');
    else if(k==='hvdritual')glow(s.X+s.sp.w*.5,s.Y+s.sp.h*.5,160,(.22+f.fire*.33)*amt,'255,85,76');
    else if(k==='hvdbrazier')glow(s.X+s.sp.w*.5,s.Y+s.sp.h*.45,90,.2*amt,'255,160,75');}
  if(f.water>.02){const [X,Y]=tile(24,39);glow(X,Y-65,230,f.water*.29*amt,'160,230,255');}
 }
 TWFX.hvd={draw,light};
})();
