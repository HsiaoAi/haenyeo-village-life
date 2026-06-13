/* ============================================================
   HAENYEO VILLAGE LIFE — rendering, art & lighting
   Classic script, shares global scope with game.js.
   ============================================================ */

/* ---------------- retina ---------------- */
let DPR=Math.max(1,Math.min(3,window.devicePixelRatio||1));
function setupRetina(){
  DPR=Math.max(1,Math.min(3,window.devicePixelRatio||1));
  cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.imageSmoothingEnabled=true;
  villageBG=null; shopBG=null; homeBG=null; marketBG=null;   // rebuild caches at new resolution
}
addEventListener('resize',()=>{ clearTimeout(window.__rt); window.__rt=setTimeout(setupRetina,150); });

/* ---------------- helpers ---------------- */
function shade(hex,amt){ // amt -100..100 lighten/darken
  const n=parseInt(hex.slice(1),16);
  let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  r=Math.max(0,Math.min(255,r+amt)); g=Math.max(0,Math.min(255,g+amt)); b=Math.max(0,Math.min(255,b+amt));
  return `rgb(${r|0},${g|0},${b|0})`;
}
function rr(g,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  g.beginPath();
  g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);
  g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();
}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function makeCanvas(w,h){const o=document.createElement('canvas');o.width=Math.round(w*DPR);o.height=Math.round(h*DPR);
  const c=o.getContext('2d');c.setTransform(DPR,0,0,DPR,0,0);return {el:o,g:c};}

/* outlined ink label — Korean-safe */
function glabel(text,x,y,size,color){
  ctx.font=`700 ${size}px "Gowun Batang", serif`; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.lineWidth=3.6; ctx.lineJoin='round'; ctx.strokeStyle='rgba(8,28,34,.92)';
  ctx.strokeText(text,x,y);
  ctx.fillStyle=color||'#f6f1e3'; ctx.fillText(text,x,y);
}
/* hanji-ish dark plaque label */
function tag(text,x,y,size,accent){
  ctx.font=`700 ${size}px "Gowun Batang", serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(text).width+18, h=size+11;
  ctx.save();
  ctx.fillStyle='rgba(12,32,38,.78)';
  rr(ctx,x-w/2,y-h/2,w,h,h/2);ctx.fill();
  ctx.strokeStyle='rgba(240,189,76,.5)';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle=accent||'#f6f1e3';ctx.fillText(text,x,y+0.5);
  ctx.restore();
}

/* ================= TIME-OF-DAY LIGHTING ================= */
const DAYKEYS=[
  {t:0,    c:[16,24,56,.58], glow:0},
  {t:330,  c:[32,38,76,.48], glow:0},
  {t:385,  c:[233,150,118,.30], glow:.30},
  {t:455,  c:[255,224,182,.13], glow:.16},
  {t:660,  c:[255,252,242,.045],glow:.05},
  {t:790,  c:[255,255,252,.02], glow:.03},
  {t:1010, c:[255,233,188,.11], glow:.13},
  {t:1085, c:[251,170,108,.26], glow:.36},
  {t:1145, c:[224,106,92,.34],  glow:.32},
  {t:1235, c:[88,68,120,.46],   glow:.10},
  {t:1320, c:[20,30,72,.58],    glow:0},
  {t:1440, c:[16,24,56,.58],    glow:0},
];
function dayWash(t){
  let a=DAYKEYS[0],b=DAYKEYS[DAYKEYS.length-1];
  for(let i=0;i<DAYKEYS.length-1;i++){if(t>=DAYKEYS[i].t&&t<=DAYKEYS[i+1].t){a=DAYKEYS[i];b=DAYKEYS[i+1];break;}}
  const f=(t-a.t)/((b.t-a.t)||1);
  const c=a.c.map((v,i)=>v+(b.c[i]-v)*f);
  return {c, glow:a.glow+(b.glow-a.glow)*f};
}
function nightAmt(t){ // 0 day .. 1 deep night
  if(t>=415 && t<=1055) return 0;
  if(t<415) return Math.min(1,(415-t)/175);
  return Math.min(1,(t-1055)/185);
}
function applyDayLight(){
  const {c,glow}=dayWash(G.time);
  ctx.save();
  ctx.fillStyle=`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${c[3]})`;
  ctx.fillRect(0,0,W,H);
  if(glow>0.02){
    const gx=W*0.5,gy=64;
    const rg=ctx.createRadialGradient(gx,gy,8,gx,gy,460);
    rg.addColorStop(0,`rgba(255,214,150,${glow*0.55})`);
    rg.addColorStop(1,'rgba(255,214,150,0)');
    ctx.globalCompositeOperation='screen';ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
  }
  // soft vignette for depth
  const vg=ctx.createRadialGradient(W/2,H*0.42,H*0.3,W/2,H*0.5,H*0.72);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(4,12,18,.32)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  ctx.restore();
}

/* ================= STATIC LAND TEXTURES ================= */
function drawBasaltBand(g,x,y,w,h,seed){
  const rng=mulberry32(seed||((x*131+y*17)|0));
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  g.fillStyle='#2c2a2e';g.fillRect(x,y,w,h);
  for(let sy=y+4;sy<y+h+4;sy+=7){
    for(let sx=x+3;sx<x+w;sx+=11){
      const r=3.6+rng()*2.4, ox=sx+rng()*5, oy=sy+rng()*2;
      const v=44+rng()*22|0;
      g.fillStyle=`rgb(${v},${v-2},${v+4})`;
      g.beginPath();g.ellipse(ox,oy,r,r*0.74,rng()*1,0,7);g.fill();
      g.fillStyle='rgba(255,255,255,.06)';g.beginPath();g.ellipse(ox-1,oy-1.2,r*0.5,r*0.32,0,0,7);g.fill();
      g.fillStyle='rgba(0,0,0,.25)';g.beginPath();g.ellipse(ox+1,oy+1.5,r*0.5,r*0.3,0,0,7);g.fill();
    }
  }
  g.restore();
}
function drawWall(g,x,y,w,h){ // low batdam stone wall
  drawBasaltBand(g,x,y,w,h,(x*7+y*13)|0);
  g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x,y+h,w,3);
}
function drawBush(g,x,y,s){
  const grd=g.createRadialGradient(x-3*s,y-3*s,1,x,y,12*s);
  grd.addColorStop(0,'#6f9450');grd.addColorStop(1,'#3f6234');
  g.fillStyle=grd;
  for(const[dx,dy,r] of [[-6,2,7],[6,2,7],[0,-4,8],[0,3,8]]){g.beginPath();g.arc(x+dx*s,y+dy*s,r*s,0,7);g.fill();}
  // tangerines
  g.fillStyle='#f0973a';
  for(const[dx,dy] of [[-4,0],[5,-2],[1,4]]){g.beginPath();g.arc(x+dx*s,y+dy*s,1.7*s,0,7);g.fill();}
}
function drawHareubang(g,x,y,s){
  g.save();g.translate(x,y);g.scale(s,s);
  g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(0,3,15,4.5,0,0,7);g.fill();
  const grd=g.createLinearGradient(-12,-44,12,2);grd.addColorStop(0,'#615d63');grd.addColorStop(1,'#3b383d');
  g.fillStyle=grd; rr(g,-12,-34,24,36,11);g.fill();
  // speckle
  const rng=mulberry32(99);g.fillStyle='rgba(0,0,0,.18)';
  for(let i=0;i<26;i++){g.beginPath();g.arc(-10+rng()*20,-32+rng()*32,0.8,0,7);g.fill();}
  // hands on belly
  g.fillStyle='#4c4951';g.beginPath();g.ellipse(-5,-9,4,5,.3,0,7);g.ellipse(6,-13,4,5,-.3,0,7);g.fill();
  // head
  g.fillStyle='#56525a';g.beginPath();g.arc(0,-41,12.5,0,7);g.fill();
  // mushroom hat
  g.fillStyle='#46434a';g.beginPath();g.ellipse(0,-52,14,6.5,0,0,7);g.fill();g.fillRect(-9,-56,18,7);
  // nose
  g.fillStyle='#6a656e';g.beginPath();g.ellipse(0,-39,3.6,6.5,0,0,7);g.fill();
  // eyes
  g.strokeStyle='#2a272d';g.lineWidth=2;g.lineCap='round';
  g.beginPath();g.arc(-5.5,-44,2.4,.15,Math.PI-.15);g.arc(5.5,-44,2.4,.15,Math.PI-.15);g.stroke();
  g.restore();
}
// dol hareubang cradling a yellow yuchae blossom
function drawHareubangFlower(g,x,y,s){
  drawHareubang(g,x,y,s);
  const fx=x, fy=y-14*s; g.save();
  g.strokeStyle='#3c7d52';g.lineWidth=2*s;g.lineCap='round';
  g.beginPath();g.moveTo(fx,fy+9*s);g.lineTo(fx-2*s,fy-7*s);g.stroke();
  for(const [dx,dy] of [[-5,-6],[3,-4],[-1,-11],[6,-9],[-7,-1]]){const px=fx+dx*s,py=fy+dy*s;
    g.fillStyle='#f0bd2c';for(let a=0;a<6.28;a+=1.05){g.beginPath();g.ellipse(px+Math.cos(a)*2.4*s,py+Math.sin(a)*2.4*s,1.7*s,1.1*s,a,0,7);g.fill();}
    g.fillStyle='#caa019';g.beginPath();g.arc(px,py,1*s,0,7);g.fill();}
  g.fillStyle='#5b8f4a';g.beginPath();g.ellipse(fx-5*s,fy+3*s,3*s,1.6*s,-.6,0,7);g.ellipse(fx+4*s,fy+4*s,3*s,1.6*s,.6,0,7);g.fill();
  g.restore();
}

/* thatched roof with rope net (Jeju) */
function drawThatch(g,x,y,w,h){
  const grd=g.createLinearGradient(0,y,0,y+h);
  grd.addColorStop(0,'#dcb663');grd.addColorStop(.6,'#c89a45');grd.addColorStop(1,'#a87d34');
  g.save();
  g.beginPath();g.moveTo(x,y+h);g.quadraticCurveTo(x+w*0.5,y-h*0.62,x+w,y+h);g.closePath();
  g.fillStyle=grd;g.fill();
  g.save();g.clip();
  // straw streaks
  g.strokeStyle='rgba(120,85,28,.30)';g.lineWidth=1;
  for(let i=0;i<=18;i++){const px=x+w*(i/18);g.beginPath();g.moveTo(px,y+h);
    g.lineTo(x+w*0.5+(px-(x+w*0.5))*0.32,y+h*0.06);g.stroke();}
  g.strokeStyle='rgba(255,240,200,.18)';
  for(let i=0;i<=18;i+=2){const px=x+w*(i/18);g.beginPath();g.moveTo(px+1,y+h);
    g.lineTo(x+w*0.5+(px-(x+w*0.5))*0.32+1,y+h*0.08);g.stroke();}
  g.restore();
  // rope grid
  g.strokeStyle='rgba(70,50,18,.55)';g.lineWidth=1.5;
  for(let i=1;i<6;i++){const px=x+w*(i/6);const top=y+h - (h*1.0)*(1-Math.pow((i/6-0.5)*2,2)*0.92);
    g.beginPath();g.moveTo(px,y+h);g.lineTo(px,top);g.stroke();}
  for(const fy of [0.42,0.72]){g.beginPath();
    for(let t=0;t<=1;t+=0.05){const px=x+w*t;const archTop=y+h-(h)*(1-Math.pow((t-0.5)*2,2))*0.92;
      const py=archTop+(y+h-archTop)*(1-fy);t===0?g.moveTo(px,py):g.lineTo(px,py);}g.stroke();}
  // ridge + fringe
  g.fillStyle='#9a7230';g.beginPath();g.moveTo(x,y+h);g.quadraticCurveTo(x+w*0.5,y+h-9,x+w,y+h);
  g.lineTo(x+w,y+h+5);g.quadraticCurveTo(x+w*0.5,y+h-2,x,y+h+5);g.closePath();g.fill();
  g.restore();
}
function bWindow(b){return {x:b.x+b.w*0.15,y:b.y+b.h*0.40+8};}
function bDoor(b){return {x:b.x+b.w/2,y:b.y+b.h};}

function drawBuilding(g,b){
  if(b.name==='bulteok'){ // open stone fire-ring (drawn static; fire glow added live)
    g.save();
    g.fillStyle='rgba(0,0,0,.16)';g.beginPath();g.ellipse(b.x+b.w/2,b.y+b.h/2+6,b.w/2+4,10,0,0,7);g.fill();
    // stone ring
    const cx=b.x+b.w/2,cy=b.y+b.h/2;const rng=mulberry32(7);
    for(let a=0;a<6.28;a+=0.5){const rx=b.w/2,ry=b.h/2;
      const sx=cx+Math.cos(a)*rx,sy=cy+Math.sin(a)*ry,r=5+rng()*2;
      g.fillStyle=shade('#3a373c',(rng()*30-10)|0);g.beginPath();g.ellipse(sx,sy,r,r*0.8,0,0,7);g.fill();
      g.fillStyle='rgba(255,255,255,.06)';g.beginPath();g.ellipse(sx-1,sy-1,r*0.5,r*0.3,0,0,7);g.fill();}
    // ash bed
    g.fillStyle='#5b5048';g.beginPath();g.ellipse(cx,cy,b.w*0.28,b.h*0.26,0,0,7);g.fill();
    g.fillStyle='#2c2520';g.beginPath();g.ellipse(cx,cy,b.w*0.16,b.h*0.15,0,0,7);g.fill();
    // logs
    g.strokeStyle='#5e3c22';g.lineWidth=3;g.lineCap='round';
    g.beginPath();g.moveTo(cx-8,cy+4);g.lineTo(cx+8,cy-3);g.moveTo(cx-7,cy-4);g.lineTo(cx+9,cy+4);g.stroke();
    g.restore();
    return;
  }
  const x=b.x,y=b.y,w=b.w,h=b.h;
  const wallTop=y+h*0.40, wallH=h*0.60, baseH=wallH*0.42;
  g.save();
  // ground shadow
  g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(x+w/2,y+h+4,w*0.56,9,0,0,7);g.fill();
  // plaster wall
  const wg=g.createLinearGradient(0,wallTop,0,y+h);wg.addColorStop(0,'#ece0c6');wg.addColorStop(1,'#d8c8a4');
  g.fillStyle=wg;g.fillRect(x,wallTop,w,wallH);
  g.fillStyle='rgba(90,60,25,.10)';g.fillRect(x,wallTop,w,7);          // eave shadow
  // basalt foundation band
  drawBasaltBand(g,x,y+h-baseH,w,baseH,(x*9+y)|0);
  // outline
  g.strokeStyle='rgba(80,55,25,.32)';g.lineWidth=1.4;g.strokeRect(x+.5,wallTop+.5,w-1,wallH-1);
  // window
  const win=bWindow(b);
  g.fillStyle='#5e3c24';g.fillRect(win.x-1,win.y-1,18,18);
  g.fillStyle='#cfe3e0';g.fillRect(win.x+1,win.y+1,14,14);
  g.strokeStyle='#5e3c24';g.lineWidth=1.4;
  g.beginPath();g.moveTo(win.x+8,win.y+1);g.lineTo(win.x+8,win.y+15);g.moveTo(win.x+1,win.y+8);g.lineTo(win.x+15,win.y+8);g.stroke();
  // door
  const dw=20,dh=27,dx=x+w/2-dw/2,dy=y+h-dh;
  g.fillStyle='#3f2817';g.fillRect(dx,dy,dw,dh);
  g.fillStyle='#5a3a22';g.fillRect(dx+2,dy+2,dw-4,dh-2);
  g.strokeStyle='rgba(0,0,0,.32)';g.lineWidth=1.2;g.beginPath();g.moveTo(dx+dw/2,dy+2);g.lineTo(dx+dw/2,dy+dh);g.stroke();
  g.fillStyle='#caa46a';g.beginPath();g.arc(dx+dw-5,dy+dh/2,1.6,0,7);g.fill();
  // thatch roof
  drawThatch(g,x-7,wallTop-h*0.5,w+14,h*0.5+4);
  // identity banner
  if(b.roof && b.name!=='house3'){
    g.fillStyle=b.roof;g.fillRect(x+w-14,y+2,4,20);
    g.beginPath();g.moveTo(x+w-10,y+4);g.lineTo(x+w+6,y+8);g.lineTo(x+w-10,y+12);g.closePath();g.fill();
  }
  g.restore();
}

/* ---- build & cache the static village backdrop ---- */
let villageBG=null;
function buildVillageBG(){
  const {el,g}=makeCanvas(W,SEA_Y);
  // grass base
  const gg=g.createLinearGradient(0,90,0,SEA_Y);gg.addColorStop(0,'#6d8a4e');gg.addColorStop(1,'#577540');
  g.fillStyle=gg;g.fillRect(0,0,W,SEA_Y);
  // dappling
  const rng=mulberry32(20240);
  for(let i=0;i<520;i++){const x=rng()*W,y=92+rng()*(SEA_Y-94);
    g.fillStyle=`rgba(${60+rng()*40|0},${90+rng()*40|0},${50+rng()*30|0},${.12+rng()*.18})`;
    g.beginPath();g.ellipse(x,y,1.4+rng()*2,1+rng()*1.4,0,0,7);g.fill();}
  // grass tufts
  g.strokeStyle='rgba(70,100,55,.4)';g.lineWidth=1;
  for(let i=0;i<160;i++){const x=rng()*W,y=100+rng()*(SEA_Y-110);
    g.beginPath();g.moveTo(x,y);g.lineTo(x-1.5,y-4);g.moveTo(x,y);g.lineTo(x+1.5,y-4.5);g.stroke();}
  // stone-dust paths
  const path=(x,y,w,h)=>{
    const pg=g.createLinearGradient(0,y,0,y+h);pg.addColorStop(0,'#d8bd86');pg.addColorStop(1,'#c4a771');
    g.fillStyle=pg;g.fillRect(x,y,w,h);
    g.fillStyle='rgba(120,90,45,.14)';
    for(let i=0;i<w*h/60;i++){g.beginPath();g.arc(x+rng()*w,y+rng()*h,1+rng()*1.4,0,7);g.fill();}
    g.strokeStyle='rgba(120,90,45,.22)';g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,h-1);
  };
  path(218,182,44,SEA_Y-182);
  path(76,300,330,30);
  // low stone walls framing fields
  drawWall(g,18,250,150,9);
  drawWall(g,300,250,160,9);
  drawWall(g,18,430,120,9);
  // buildings (static)
  for(const b of buildings) drawBuilding(g,b);
  // statues & bushes
  drawHareubangFlower(g,176,300,1);
  drawHareubang(g,300,300,0.92);
  drawBush(g,70,288,1.1);
  drawBush(g,300,470,1);
  drawBush(g,420,330,0.9);
  drawBush(g,140,250,0.85);
  // jetty stones into the sea
  drawBasaltBand(g,222,SEA_Y-30,36,30,555);
  villageBG=el;
}

/* ---------------- SEA (live) ---------------- */
function drawTewak(x,y,t){
  const yy=y+Math.sin(t*1.4+x)*2;
  ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.ellipse(x,yy+5,12,4,0,0,7);ctx.fill();
  const g=ctx.createRadialGradient(x-3,yy-3,1,x,yy,12);g.addColorStop(0,'#f59a6f');g.addColorStop(1,'#cf5b34');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,yy,12,9,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(x-3,yy-3,4,2.5,0,0,7);ctx.fill();
}
function drawSea(){
  const t=performance.now()*0.001;
  const sg=ctx.createLinearGradient(0,SEA_Y,0,H);
  sg.addColorStop(0,'#4cb1bf');sg.addColorStop(.5,'#2c8ea0');sg.addColorStop(1,'#11586a');
  ctx.fillStyle=sg;ctx.fillRect(0,SEA_Y,W,H-SEA_Y);
  // shimmering caustic dapples
  ctx.save();ctx.beginPath();ctx.rect(0,SEA_Y,W,H-SEA_Y);ctx.clip();
  for(let i=0;i<26;i++){const x=(i*53+Math.sin(t*0.6+i)*20)%W;const y=SEA_Y+12+((i*37)%(H-SEA_Y-16));
    ctx.fillStyle=`rgba(255,255,255,${0.05+0.04*Math.sin(t*2+i)})`;
    ctx.beginPath();ctx.ellipse(x,y,7,2.4,0,0,7);ctx.fill();}
  // crest lines
  for(let r=0;r<5;r++){const yb=SEA_Y+10+r*24;ctx.strokeStyle=`rgba(255,255,255,${.20-r*.03})`;ctx.lineWidth=2;
    ctx.beginPath();for(let x=0;x<=W;x+=10){const y=yb+Math.sin(x*.05+t*1.6+r)*3;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
  ctx.restore();
  // shoreline foam
  ctx.fillStyle='rgba(246,241,227,.85)';
  ctx.beginPath();ctx.moveTo(0,SEA_Y);
  for(let x=0;x<=W;x+=10){const y=SEA_Y+Math.sin(x*.08+t*1.8)*2.5+1;ctx.lineTo(x,y);}
  ctx.lineTo(W,SEA_Y-5);ctx.lineTo(0,SEA_Y-5);ctx.closePath();ctx.fill();
  // wet jetty tip
  ctx.fillStyle='rgba(20,40,46,.5)';ctx.fillRect(224,SEA_Y,32,12);
  // ambient floats
  drawTewak(60,SEA_Y+44,t);drawTewak(410,SEA_Y+70,t+2);drawTewak(150,SEA_Y+96,t+4);
}

/* ---------------- PEOPLE ---------------- */
function drawPerson(x,y,opt){
  const skin=opt.skin||'#e8c9a0', scarf=opt.scarf||'#e8714a', suit=opt.suit||'#274a52',
        face=opt.face||1, moving=opt.moving, player=opt.player, phase=opt.phase||0, idle=opt.idle||0;
  const modern=opt.modern;
  const WHITE='#f2ede1', WSH='#d7d0c0', BLK='#23222a', OL='#3a342b';
  const TOP=modern?'#26252e':WHITE, HOOD=modern?'#1d1c24':WHITE;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,15,12.5,4.5,0,0,7);ctx.fill();
  const bob=moving?Math.abs(Math.sin(phase))*2:Math.sin(performance.now()*0.002+idle)*0.9;
  ctx.translate(0,-bob);
  ctx.scale(face,1);
  const step=moving?Math.sin(phase):0;
  // legs in dark 물소중이 shorts
  ctx.fillStyle=BLK;
  ctx.fillRect(-6.5+step*2.4,3,5,12); ctx.fillRect(1.5-step*2.4,3,5,12);
  ctx.fillStyle='#15141a';
  ctx.fillRect(-8+step*2.4,14,8,4); ctx.fillRect(0-step*2.4,14,8,4);
  // torso jacket (white cotton 물적삼, or dark neoprene if modern)
  ctx.fillStyle=TOP;ctx.strokeStyle=OL;ctx.lineWidth=1.4; rr(ctx,-10,-9,20,18,7);ctx.fill();ctx.stroke();
  if(!modern){ ctx.fillStyle=WSH;ctx.fillRect(-1,-9,2,17);                          // center placket
    ctx.strokeStyle=WSH;ctx.lineWidth=1;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(2.6,-5+i*4.5,0.9,0,7);ctx.stroke();} }
  else { ctx.strokeStyle='#2f9c8a';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.stroke(); }
  ctx.fillStyle=scarf;rr(ctx,-10,5,20,4,2);ctx.fill();                 // colored waist sash (per-NPC accent)
  // sleeves + skin hands
  ctx.fillStyle=TOP;ctx.strokeStyle=OL;ctx.lineWidth=1.2;
  rr(ctx,-13,-6,5,12,2.5);ctx.fill();ctx.stroke(); rr(ctx,8,-6,5,12,2.5);ctx.fill();ctx.stroke();
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(-10.5,7,2.5,0,7);ctx.arc(10.5,7,2.5,0,7);ctx.fill();
  // neck + head
  ctx.fillStyle=shade(skin,-14);ctx.fillRect(-3,-14,6,5);
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(0,-18,8.6,0,7);ctx.fill();
  ctx.fillStyle=shade(skin,-16);ctx.beginPath();ctx.arc(3,-17,8.6,-.5,1.0);ctx.fill();  // cheek shade
  // cotton hood framing the face
  ctx.fillStyle=HOOD;ctx.strokeStyle=OL;ctx.lineWidth=1.3;
  ctx.beginPath();ctx.arc(0,-19,9.6,Math.PI*0.92,Math.PI*0.08,true);ctx.lineTo(9.6,-15);
  ctx.quadraticCurveTo(0,-12.5,-9.6,-15);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=scarf;ctx.fillRect(-9.3,-26.5,18.6,3);                  // colored hood band (per-NPC accent)
  // round red goggles (왕눈) pushed up on the forehead
  ctx.fillStyle='rgba(150,210,235,.5)';ctx.beginPath();ctx.arc(-3.4,-23,2.7,0,7);ctx.arc(3.4,-23,2.7,0,7);ctx.fill();
  ctx.strokeStyle='#c23a2e';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(-3.4,-23,3,0,7);ctx.arc(3.4,-23,3,0,7);ctx.stroke();
  ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-0.6,-23.2);ctx.lineTo(0.6,-23.2);ctx.stroke();   // bridge
  // face
  ctx.fillStyle='#2a2320';ctx.beginPath();ctx.arc(-2.4,-17.5,1.15,0,7);ctx.arc(3.2,-17.5,1.15,0,7);ctx.fill();
  ctx.fillStyle='rgba(220,110,80,.34)';ctx.beginPath();ctx.arc(-4.4,-15.4,1.7,0,7);ctx.arc(5,-15.2,1.7,0,7);ctx.fill();
  ctx.strokeStyle='rgba(120,70,50,.6)';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(0.6,-15,2.6,.2,Math.PI-.2);ctx.stroke();
  ctx.restore();
}

/* ---------------- VILLAGE COMPOSE ---------------- */
function drawVillage(){
  if(!villageBG) buildVillageBG();
  ctx.drawImage(villageBG,0,0,W,SEA_Y);
  drawSea();
  // characters
  for(const n of NPCS) drawPerson(n.x,n.y,{skin:n.skin,scarf:n.scarf,suit:'#27474e',face:n.face||1,moving:n.moving,phase:n.anim,idle:n.phase});
  if(scene!=='title') drawPerson(P.x,P.y,{skin:'#e8c9a0',scarf:'#f0bd4c',suit:'#2f7d72',face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  // lighting wash over the world
  applyDayLight();
  // night glows (after wash so they pop)
  const nt=nightAmt(G.time);
  // bulteok fire
  const bt=buildings.find(b=>b.name==='bulteok'); const fc={x:bt.x+bt.w/2,y:bt.y+bt.h/2};
  const flick=0.7+Math.sin(performance.now()*0.012)*0.3;
  const fr=ctx.createRadialGradient(fc.x,fc.y,2,fc.x,fc.y,34+nt*26);
  fr.addColorStop(0,`rgba(255,180,90,${0.45+nt*0.4})`);fr.addColorStop(1,'rgba(255,150,60,0)');
  ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=fr;
  ctx.beginPath();ctx.arc(fc.x,fc.y,(34+nt*26)*flick,0,7);ctx.fill();ctx.restore();
  // flames
  for(let i=0;i<5;i++){const a=i/5*6.28;const fx=fc.x+Math.cos(a)*4,fy=fc.y+Math.sin(a)*3;
    const fh=8+Math.sin(performance.now()*0.02+i)*4;
    ctx.fillStyle=i%2?'#f0bd4c':'#e8714a';ctx.beginPath();
    ctx.moveTo(fx-3,fy+2);ctx.quadraticCurveTo(fx,fy-fh,fx+3,fy+2);ctx.closePath();ctx.fill();}
  ctx.fillStyle='#fff4d0';ctx.beginPath();ctx.arc(fc.x,fc.y-1,2.5,0,7);ctx.fill();
  // warm window light at night
  if(nt>0.12){
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const b of buildings){ if(b.name==='bulteok')continue;
      const win=bWindow(b);const d=bDoor(b);
      ctx.fillStyle=`rgba(255,200,110,${nt*0.85})`;ctx.fillRect(win.x+1,win.y+1,14,14);
      const g2=ctx.createRadialGradient(win.x+8,win.y+8,2,win.x+8,win.y+8,30);
      g2.addColorStop(0,`rgba(255,196,110,${nt*0.5})`);g2.addColorStop(1,'rgba(255,196,110,0)');
      ctx.fillStyle=g2;ctx.beginPath();ctx.arc(win.x+8,win.y+8,30,0,7);ctx.fill();
      // door lantern
      const lg=ctx.createRadialGradient(d.x+13,d.y-20,1,d.x+13,d.y-20,18);
      lg.addColorStop(0,`rgba(255,190,90,${nt*0.7})`);lg.addColorStop(1,'rgba(255,190,90,0)');
      ctx.fillStyle=lg;ctx.beginPath();ctx.arc(d.x+13,d.y-20,18,0,7);ctx.fill();
    }
    ctx.restore();
  }
  // labels on top (always readable)
  for(const b of buildings){ if(b.label){ tag(b.en?(b.en+' '+b.label):b.label, b.x+b.w/2, b.y+b.h*0.40-10, 12, '#f6f1e3'); } }
  tag('↓ the sea · 바다', W/2, SEA_Y+30, 13, '#f6f1e3');
  for(const n of NPCS){ tag(n.roman, n.x, n.y-30, 11, '#f6f1e3');
    const h=hearts(n.id); if(h>0){ctx.fillStyle='#e8714a';ctx.font='11px serif';ctx.textAlign='center';ctx.fillText('♥'.repeat(h),n.x,n.y-42);} }
}

/* ---------------- SHOP INTERIOR ---------------- */
let shopBG=null;
function buildShopBG(){
  const {el,g}=makeCanvas(W,H);
  // wood floor
  const fg=g.createLinearGradient(0,90,0,H);fg.addColorStop(0,'#9c7747');fg.addColorStop(1,'#7d5d36');
  g.fillStyle=fg;g.fillRect(0,90,W,H-90);
  g.strokeStyle='rgba(40,24,8,.22)';g.lineWidth=2;
  for(let y=120;y<H;y+=30){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  const rng=mulberry32(77);
  for(let i=0;i<300;i++){g.strokeStyle='rgba(40,24,8,.06)';g.beginPath();const x=rng()*W,y=92+rng()*(H-92);g.moveTo(x,y);g.lineTo(x+10+rng()*20,y);g.stroke();}
  // back wall (plaster + basalt wainscot)
  const wg=g.createLinearGradient(0,90,0,158);wg.addColorStop(0,'#cdb083');wg.addColorStop(1,'#b89868');
  g.fillStyle=wg;g.fillRect(0,90,W,68);
  drawBasaltBand(g,0,150,W,16,3);
  // hanging shelves with stock
  g.fillStyle='#5e3c22';g.fillRect(40,116,124,8);g.fillRect(318,116,124,8);
  g.fillStyle='rgba(0,0,0,.18)';g.fillRect(40,124,124,3);g.fillRect(318,124,124,3);
  // counter
  const cg=g.createLinearGradient(0,counter.y,0,counter.y+counter.h);cg.addColorStop(0,'#6e4a2a');cg.addColorStop(1,'#4f3318');
  g.fillStyle=cg;rr(g,counter.x,counter.y,counter.w,counter.h,5);g.fill();
  g.fillStyle='#7d5630';g.fillRect(counter.x,counter.y,counter.w,7);
  g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1;
  for(let x=counter.x+18;x<counter.x+counter.w;x+=40){g.beginPath();g.moveTo(x,counter.y+9);g.lineTo(x,counter.y+counter.h);g.stroke();}
  // exit mat
  g.fillStyle='#caa46a';rr(g,exitZone.x,exitZone.y,exitZone.w,exitZone.h,5);g.fill();
  g.strokeStyle='rgba(90,60,25,.5)';g.setLineDash([4,3]);g.strokeRect(exitZone.x+2,exitZone.y+2,exitZone.w-4,exitZone.h-4);g.setLineDash([]);
  // a paper lantern hanging
  g.fillStyle='#e8714a';g.fillRect(W/2-1,90,2,14);
  g.fillStyle='#f3d9a0';rr(g,W/2-12,104,24,20,8);g.fill();
  g.strokeStyle='rgba(180,120,40,.5)';g.lineWidth=1;g.beginPath();g.moveTo(W/2-12,114);g.lineTo(W/2+12,114);g.stroke();
  shopBG=el;
}
function drawShopIcon(kind,x,y){
  ctx.save();
  if(kind==='wetsuit'){
    ctx.fillStyle='#4a3a2a';ctx.fillRect(x-2,y+4,4,26);
    const g=ctx.createLinearGradient(x-12,y-22,x+12,y+10);g.addColorStop(0,'#356068');g.addColorStop(1,'#16363c');
    ctx.fillStyle=g;rr(ctx,x-12,y-22,24,34,11);ctx.fill();
    ctx.fillStyle='#e8714a';ctx.fillRect(x-12,y-8,24,4);
    ctx.fillStyle='rgba(180,235,255,.55)';ctx.beginPath();ctx.arc(x,y-14,4.5,0,7);ctx.fill();
    ctx.fillStyle='#16363c';ctx.fillRect(x-9,y+12,7,16);ctx.fillRect(2+x-9,y+12,7,16);
  } else {
    ctx.fillStyle='#5e3c22';ctx.fillRect(x-2,y+6,4,22);
    ctx.strokeStyle='#caa46a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-6,13,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='rgba(232,113,74,.85)';ctx.beginPath();ctx.arc(x,y-6,13,0,Math.PI);ctx.fill();
    ctx.strokeStyle='rgba(217,205,176,.8)';ctx.lineWidth=1;
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*5,y-2);ctx.lineTo(x+i*6,y+18);ctx.stroke();}
    for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(x-11,y+2+j*5);ctx.lineTo(x+11,y+2+j*5);ctx.stroke();}
  }
  ctx.restore();
}
function drawShop(){
  if(!shopBG) buildShopBG();
  ctx.drawImage(shopBG,0,0,W,H);
  // stock on shelves
  drawShopIcon('wetsuit',74,104);drawShopIcon('wetsuit',118,104);
  drawShopIcon('net',360,106);drawShopIcon('net',406,106);
  // keeper behind counter
  drawPerson(keeper.x,keeper.y,{skin:keeper.skin,scarf:keeper.scarf,suit:'#3a5560',idle:1.3});
  // display stands
  ctx.fillStyle='#5e3c22';ctx.beginPath();ctx.ellipse(standW.x,standW.y+30,18,5,0,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(standN.x,standN.y+30,18,5,0,0,7);ctx.fill();
  drawShopIcon('wetsuit',standW.x,standW.y);
  drawShopIcon('net',standN.x,standN.y);
  // player
  drawPerson(P.x,P.y,{skin:'#e8c9a0',scarf:'#f0bd4c',suit:'#2f7d72',face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  // warm interior wash
  ctx.save();ctx.fillStyle='rgba(255,210,150,.07)';ctx.fillRect(0,0,W,H);
  const lg=ctx.createRadialGradient(W/2,118,8,W/2,118,200);lg.addColorStop(0,'rgba(255,210,130,.22)');lg.addColorStop(1,'rgba(255,210,130,0)');
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);ctx.restore();
  // labels
  tag(keeper.roman, keeper.x, keeper.y-30, 11, '#f6f1e3');
  tag('Wetsuit 잠수복 · '+(G.owned.modern?'owned':SUITS.modern.cost+' won'), standW.x, standW.y+46, 11, '#f6f1e3');
  tag('Net 망사리 · Lv'+(G.netIdx+1), standN.x, standN.y+46, 11, '#f6f1e3');
  tag('← out · 나가기', exitZone.x+exitZone.w/2, exitZone.y+exitZone.h/2, 11, '#f6f1e3');
}

/* ---------------- CO-OP MARKET (수산시장) ---------------- */
let marketBG=null;
function drawCrate(g,x,y,w,h,col,kind){
  g.fillStyle='#4f6a86';rr(g,x-2,y-2,w+4,h+4,3);g.fill();          // plastic crate rim
  g.fillStyle=col;rr(g,x,y,w,h,3);g.fill();                         // contents bed
  if(kind==='fish'){
    for(let i=0;i<Math.max(3,(w*h)/120);i++){const fx=x+5+((i*13)%(w-10)),fy=y+4+((i*7)%(h-8));
      g.fillStyle=i%2?'#cdd6dd':'#aeb8c2';g.beginPath();g.ellipse(fx,fy,5,2.4,(i%3)*0.5,0,7);g.fill();
      g.fillStyle='#3a444e';g.beginPath();g.arc(fx-3.6,fy-0.5,0.7,0,7);g.fill();}
  } else if(kind==='greens'){
    for(let i=0;i<Math.max(4,(w*h)/90);i++){const fx=x+4+((i*11)%(w-8)),fy=y+3+((i*9)%(h-6));
      g.fillStyle=i%2?'#5b8f3a':'#74a84a';g.beginPath();g.ellipse(fx,fy,3.4,5,(i%3)*0.4,0,7);g.fill();}
  } else if(kind==='chili'){
    for(let i=0;i<Math.max(5,(w*h)/70);i++){const fx=x+3+((i*9)%(w-6)),fy=y+3+((i*13)%(h-6));
      g.fillStyle=i%2?'#cf3a22':'#e0533a';g.beginPath();g.ellipse(fx,fy,2,4,(i%4)*0.5,0,7);g.fill();}
  } else { // citrus / hallabong
    for(let i=0;i<Math.max(4,(w*h)/110);i++){const fx=x+5+((i*12)%(w-10)),fy=y+5+((i*8)%(h-10));
      g.fillStyle='#f0a02a';g.beginPath();g.arc(fx,fy,4,0,7);g.fill();
      g.fillStyle='#caa019';g.beginPath();g.arc(fx,fy-3.6,1,0,7);g.fill();}
  }
}
function drawHangSign(g,x,y,w,col,txt){
  g.strokeStyle='rgba(40,30,16,.5)';g.lineWidth=1.4;g.beginPath();g.moveTo(x+6,y-10);g.lineTo(x+6,y);g.moveTo(x+w-6,y-10);g.lineTo(x+w-6,y);g.stroke();
  g.fillStyle=col;rr(g,x,y,w,15,2);g.fill();
  g.fillStyle='rgba(255,255,255,.92)';
  for(let i=0;i<Math.floor(w/9);i++){g.fillRect(x+6+i*9,y+5,5,5);}   // faux hangul blocks
}
function buildMarketBG(){
  const {el,g}=makeCanvas(W,H);
  // wet concrete aisle floor
  const fg=g.createLinearGradient(0,150,0,H);fg.addColorStop(0,'#9aa0a2');fg.addColorStop(1,'#6f7476');
  g.fillStyle=fg;g.fillRect(0,150,W,H-150);
  const rng=mulberry32(517);
  for(let i=0;i<240;i++){g.fillStyle=`rgba(40,44,46,${.04+rng()*.06})`;g.beginPath();g.arc(rng()*W,150+rng()*(H-150),1+rng()*2,0,7);g.fill();}
  // wet sheen down the centre aisle
  g.save();g.globalCompositeOperation='screen';
  const sh=g.createLinearGradient(W/2-60,0,W/2+60,0);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.5,'rgba(220,235,245,.16)');sh.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=sh;g.fillRect(W/2-70,150,140,H-150);g.restore();
  // side stall platforms (left & right), receding rows
  for(const side of [-1,1]){
    const baseX = side<0 ? MARKET.x0 : MARKET.x1-40;
    // wooden stall table
    g.fillStyle='#6e4a2a';g.fillRect(baseX,150,40,420);
    g.fillStyle='#8a5c33';g.fillRect(baseX,150,40,8);
    // crates of goods stacked down the row
    const items=[['fish','#26333f'],['greens','#2f4a22'],['chili','#5a1f12'],['citrus','#6e4d12'],['fish','#26333f'],['greens','#2f4a22']];
    for(let r=0;r<6;r++){const cy=168+r*64; const cx=side<0?baseX+4:baseX+4;
      drawCrate(g,cx,cy,32,30,items[r][1],items[r][0]);
      // upper tilted crate for abundance
      if(r%2===0)drawCrate(g,cx+2,cy-12,28,14,items[(r+2)%6][1],items[(r+2)%6][0]);
    }
  }
  // central seafood counter with crushed ice
  const c=sellCounter;
  const cg=g.createLinearGradient(0,c.y,0,c.y+c.h);cg.addColorStop(0,'#6e4a2a');cg.addColorStop(1,'#4f3318');
  g.fillStyle=cg;rr(g,c.x,c.y,c.w,c.h,5);g.fill();
  g.fillStyle='#7d5630';g.fillRect(c.x,c.y,c.w,7);
  // ice bed + display fish on top of counter
  g.fillStyle='#dfeaf0';rr(g,c.x+10,c.y+9,c.w-20,18,4);g.fill();
  g.fillStyle='#c7d6df';for(let i=0;i<40;i++){g.beginPath();g.arc(c.x+16+i*((c.w-30)/40),c.y+18+((i%3)-1)*3,1.6,0,7);g.fill();}
  // back wall facade above (market entrance)
  const wg=g.createLinearGradient(0,86,0,150);wg.addColorStop(0,'#caa074');wg.addColorStop(1,'#b0875a');
  g.fillStyle=wg;g.fillRect(0,86,W,64);
  drawBasaltBand(g,0,140,W,12,5);
  // corrugated arched roof + skylight strip at the very top
  g.fillStyle='#3a4750';g.fillRect(0,0,W,86);
  g.fillStyle='#465761';for(let x=0;x<W;x+=16){g.fillRect(x,0,8,86);}            // corrugation
  const sky=g.createLinearGradient(0,8,0,30);sky.addColorStop(0,'rgba(200,235,245,.6)');sky.addColorStop(1,'rgba(200,235,245,0)');
  g.fillStyle=sky;g.fillRect(0,8,W,24);                                          // skylight glow
  // roof trusses
  g.strokeStyle='rgba(20,28,34,.5)';g.lineWidth=2;
  for(let x=30;x<W;x+=80){g.beginPath();g.moveTo(x,0);g.lineTo(x,86);g.stroke();}
  // hanging shop signboards
  drawHangSign(g,60,92,90,'#1f7a86');drawHangSign(g,200,90,110,'#c0506e');drawHangSign(g,340,94,80,'#2f7d52');
  // string of festoon lights across
  g.strokeStyle='rgba(60,50,30,.5)';g.lineWidth=1.2;g.beginPath();
  for(let x=0;x<=W;x+=8){g.lineTo(x,120+Math.sin(x*0.05)*5);}g.stroke();
  // exit mat
  g.fillStyle='#caa46a';rr(g,marketExit.x,marketExit.y,marketExit.w,marketExit.h,5);g.fill();
  g.strokeStyle='rgba(90,60,25,.5)';g.setLineDash([4,3]);g.strokeRect(marketExit.x+2,marketExit.y+2,marketExit.w-4,marketExit.h-4);g.setLineDash([]);
  marketBG=el;
}
function drawMarket(){
  if(!marketBG) buildMarketBG();
  ctx.drawImage(marketBG,0,0,W,H);
  const t=performance.now()*0.001;
  // festoon bulbs glowing
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<14;i++){const x=18+i*32, y=120+Math.sin(x*0.05)*5+3;
    const a=0.5+0.3*Math.sin(t*2+i);
    ctx.fillStyle=`rgba(255,210,120,${a})`;ctx.beginPath();ctx.arc(x,y,2.4,0,7);ctx.fill();}
  ctx.restore();
  ctx.fillStyle='#f3d27a';for(let i=0;i<14;i++){const x=18+i*32, y=120+Math.sin(x*0.05)*5+3;ctx.beginPath();ctx.arc(x,y,1.4,0,7);ctx.fill();}
  // a few prize catches displayed on the ice
  const c=sellCounter;
  for(let i=0;i<6;i++){const fx=c.x+24+i*((c.w-48)/5), fy=c.y+18;
    ctx.fillStyle=i%2?'#9c6b3a':'#b5563a';ctx.beginPath();ctx.ellipse(fx,fy,9,4.4,(i%2?0.3:-0.3),0,7);ctx.fill();
    ctx.fillStyle='#2a2320';ctx.beginPath();ctx.arc(fx-6,fy-1,1,0,7);ctx.fill();}
  // a red octopus centrepiece
  ctx.fillStyle='#e0533a';ctx.beginPath();ctx.arc(c.x+c.w/2,c.y+16,7,Math.PI,0);ctx.lineTo(c.x+c.w/2+7,c.y+20);ctx.quadraticCurveTo(c.x+c.w/2,c.y+24,c.x+c.w/2-7,c.y+20);ctx.closePath();ctx.fill();
  // vendor (Migyeong) behind the counter
  drawPerson(vendor.x,vendor.y,{skin:vendor.skin,scarf:vendor.scarf,face:1,idle:0.6});
  // player
  drawPerson(P.x,P.y,{skin:'#e8c9a0',scarf:'#f0bd4c',face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  // cool market wash + skylight shaft
  ctx.save();ctx.globalCompositeOperation='screen';
  const sun=ctx.createLinearGradient(0,86,0,420);sun.addColorStop(0,'rgba(210,235,245,.14)');sun.addColorStop(1,'rgba(210,235,245,0)');
  ctx.fillStyle=sun;ctx.fillRect(W/2-90,86,180,360);ctx.restore();
  // vignette
  const vg=ctx.createRadialGradient(W/2,H*0.5,H*0.34,W/2,H*0.5,H*0.74);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(8,14,16,.36)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  // labels
  tag(vendor.roman, vendor.x, vendor.y-30, 11, '#f6f1e3');
  tag('Sell 팔기', sellStation.x, sellStation.y+8, 11, '#f6f1e3');
  tag('← out · 나가기', marketExit.x+marketExit.w/2, marketExit.y+marketExit.h/2, 11, '#f6f1e3');
}

/* ---------------- HOME INTERIOR (rustic Jeju stone house) ---------------- */
// stacked-basalt block wall/island — chunky irregular stones
function drawStoneBlocks(g,x,y,w,h,seed){
  const rng=mulberry32(seed||((x*31+y*7)|0));
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  g.fillStyle='#5b5a5f';g.fillRect(x,y,w,h);
  const rowH=h/Math.max(2,Math.round(h/16));
  for(let ry=y;ry<y+h;ry+=rowH){
    let cx=x - rng()*14;
    while(cx<x+w){
      const bw=16+rng()*18, bh=rowH-2;
      const v=78+rng()*30|0;
      g.fillStyle=`rgb(${v},${v-3},${v+5})`;
      rr(g,cx+1.5,ry+1.5,bw-3,bh-3,3);g.fill();
      // pocked vesicular speckle
      g.fillStyle='rgba(0,0,0,.28)';
      for(let k=0;k<5;k++){g.beginPath();g.arc(cx+3+rng()*(bw-6),ry+3+rng()*(bh-6),0.7+rng()*1.1,0,7);g.fill();}
      g.fillStyle='rgba(255,255,255,.10)';g.fillRect(cx+2,ry+2,bw-4,1.4); // top highlight
      g.fillStyle='rgba(0,0,0,.22)';g.fillRect(cx+2,ry+bh-3,bw-4,1.6);    // bottom shade
      cx+=bw;
    }
  }
  g.restore();
}
// warm round timber rafters fanning from a ridge (the A-frame ceiling, seen from below)
function drawRafters(g){
  const ridgeY=42, top=0, bot=92;
  // dark attic behind beams
  g.fillStyle='#241a12';g.fillRect(0,top,W,bot);
  // plaster between rafters (warm lit)
  const pg=g.createLinearGradient(0,top,0,bot);pg.addColorStop(0,'#caa86a');pg.addColorStop(1,'#9c7c4a');
  g.fillStyle=pg;g.fillRect(0,top,W,bot);
  const beam=(x0,y0,x1,y1,wd)=>{
    const a=Math.atan2(y1-y0,x1-x0);
    g.save();g.translate(x0,y0);g.rotate(a);
    const len=Math.hypot(x1-x0,y1-y0);
    const bg=g.createLinearGradient(0,-wd/2,0,wd/2);
    bg.addColorStop(0,'#caa063');bg.addColorStop(.5,'#9c7338');bg.addColorStop(1,'#6e4d22');
    g.fillStyle=bg;rr(g,0,-wd/2,len,wd,wd/2);g.fill();
    g.strokeStyle='rgba(50,32,12,.5)';g.lineWidth=1;g.beginPath();g.moveTo(2,0);g.lineTo(len-2,0);g.stroke();
    g.fillStyle='rgba(255,235,190,.16)';g.fillRect(2,-wd/2+1,len-4,1.4);
    g.restore();
  };
  // rafters fanning down both sides from the ridge line
  for(let i=0;i<=10;i++){const rx=W*i/10;
    beam(rx,ridgeY, rx*0.62+W*0.5*0.38, bot+6, 7);            // left/right pitch
  }
  // ridge beam
  beam(-6,ridgeY,W+6,ridgeY,11);
  // two purlins
  beam(-6,ridgeY+22,W+6,ridgeY+22,5);
  beam(-6,ridgeY-16,W+6,ridgeY-16,5);
  // warm glow leaking along ridge
  g.save();g.globalCompositeOperation='screen';
  const lg=g.createLinearGradient(0,ridgeY-10,0,ridgeY+14);lg.addColorStop(0,'rgba(255,200,110,0)');lg.addColorStop(.5,'rgba(255,200,110,.5)');lg.addColorStop(1,'rgba(255,200,110,0)');
  g.fillStyle=lg;g.fillRect(0,ridgeY-12,W,28);g.restore();
}
function drawKettle(g,x,y){
  // small burner
  g.fillStyle='#2a2a2e';rr(g,x-13,y+4,26,9,3);g.fill();
  // red enamel kettle (the photo's pop of colour)
  const kg=g.createLinearGradient(x-12,y-14,x+12,y+6);kg.addColorStop(0,'#e15a3c');kg.addColorStop(1,'#a8331f');
  g.fillStyle=kg;rr(g,x-12,y-12,24,18,6);g.fill();
  g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.ellipse(x-5,y-6,4,6,-.5,0,7);g.fill();
  g.fillStyle='#7a2516';rr(g,x-9,y-16,18,5,2.5);g.fill();                 // lid
  g.fillStyle='#2a2a2e';g.beginPath();g.arc(x,y-18,2,0,7);g.fill();
  g.strokeStyle='#2a2a2e';g.lineWidth=2.4;g.lineCap='round';g.beginPath();g.arc(x,y-13,8,Math.PI+0.4,-0.4);g.stroke(); // handle
  g.fillStyle='#a8331f';g.beginPath();g.moveTo(x+11,y-6);g.lineTo(x+18,y-9);g.lineTo(x+12,y-2);g.closePath();g.fill(); // spout
}
function drawChair(g,x,y,col){
  g.fillStyle='rgba(0,0,0,.14)';g.beginPath();g.ellipse(x,y+10,11,4,0,0,7);g.fill();
  g.fillStyle=col;rr(g,x-9,y-4,18,12,3);g.fill();                        // seat
  g.fillStyle=shade(col,-22);rr(g,x-9,y-16,18,6,2);g.fill();             // back
  g.fillStyle=shade(col,-30);g.fillRect(x-8,y+6,3,8);g.fillRect(x+5,y+6,3,8);
}
// a finished serving of Korean instant ramyeon in the classic dented aluminium pot (양은냄비)
function drawRamenBowl(g,x,y){
  g.fillStyle='rgba(0,0,0,.2)';g.beginPath();g.ellipse(x,y+11,23,6,0,0,7);g.fill();
  // brass side handles
  g.strokeStyle='#9c6a2e';g.lineWidth=2.6;g.lineCap='round';
  g.beginPath();g.moveTo(x-20,y-2);g.lineTo(x-27,y-4);g.moveTo(x+20,y-2);g.lineTo(x+27,y-4);g.stroke();
  g.fillStyle='#caa05a';g.beginPath();g.arc(x-28,y-4,2.2,0,7);g.arc(x+28,y-4,2.2,0,7);g.fill();
  // dented aluminium pot body
  const pot=g.createLinearGradient(x-20,y-7,x+20,y+12);
  pot.addColorStop(0,'#e8ebee');pot.addColorStop(.5,'#aeb4ba');pot.addColorStop(1,'#7e858c');
  g.fillStyle=pot;g.beginPath();g.moveTo(x-20,y-6);g.quadraticCurveTo(x,y+16,x+20,y-6);g.closePath();g.fill();
  // dent shading
  g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=1.4;g.beginPath();g.moveTo(x-13,y+2);g.lineTo(x-9,y+6);g.stroke();
  g.strokeStyle='rgba(0,0,0,.16)';g.beginPath();g.moveTo(x+6,y+1);g.lineTo(x+11,y+6);g.stroke();
  // rim
  g.strokeStyle='#6f767d';g.lineWidth=2.8;g.beginPath();g.moveTo(x-20,y-6);g.quadraticCurveTo(x,y+1,x+20,y-6);g.stroke();
  g.strokeStyle='#cfd4d8';g.lineWidth=1.2;g.beginPath();g.moveTo(x-19,y-6.5);g.quadraticCurveTo(x,y-0.5,x+19,y-6.5);g.stroke();
  // vivid spicy broth
  g.fillStyle='#d6481f';g.beginPath();g.ellipse(x,y-6,18,5.4,0,0,7);g.fill();
  g.fillStyle='#b83714';g.beginPath();g.ellipse(x,y-4.6,18,4,0,0,7);g.fill();
  g.fillStyle='rgba(255,180,90,.5)';g.beginPath();g.ellipse(x-6,y-7,5,1.6,0,0,7);g.fill();   // sheen
  // springy noodle loops lifting out of the broth
  g.strokeStyle='#f2cf5e';g.lineWidth=1.8;g.lineCap='round';
  for(let i=0;i<6;i++){g.beginPath();g.arc(x-11+i*4.2,y-7.5,2.7,0.05,Math.PI-0.05);g.stroke();}
  g.strokeStyle='#e0b84a';g.lineWidth=1.1;
  for(let i=0;i<4;i++){g.beginPath();g.arc(x-7+i*5,y-6.5,1.8,0.2,Math.PI-0.2);g.stroke();}
  // soft egg, golden yolk
  g.fillStyle='#fbf4e4';g.beginPath();g.ellipse(x-8,y-7,4.6,3.3,-0.2,0,7);g.fill();
  g.fillStyle='#f4a72c';g.beginPath();g.arc(x-8,y-7,2,0,7);g.fill();
  g.fillStyle='#ffd06a';g.beginPath();g.arc(x-8.7,y-7.7,0.8,0,7);g.fill();
  // scallion rings
  g.fillStyle='#3f8a4e';for(const[dx,dy]of[[4,-9],[9,-6],[2,-5],[12,-8]]){g.beginPath();g.arc(x+dx,y+dy,1.3,0,7);g.fill();
    g.fillStyle='#bfe0a8';g.beginPath();g.arc(x+dx,y+dy,0.5,0,7);g.fill();g.fillStyle='#3f8a4e';}
  // chili-oil flecks + sesame
  g.fillStyle='#9c2a12';for(const[dx,dy]of[[-3,-5],[6,-4],[-12,-6],[1,-9]]){g.beginPath();g.arc(x+dx,y+dy,0.7,0,7);g.fill();}
  g.fillStyle='#f3ead0';for(const[dx,dy]of[[-5,-8],[7,-8],[-1,-4]]){g.beginPath();g.ellipse(x+dx,y+dy,0.8,0.5,0,0,7);g.fill();}
  // chopsticks resting on rim
  g.strokeStyle='#9c6a3a';g.lineWidth=1.9;g.lineCap='round';
  g.beginPath();g.moveTo(x+8,y-10);g.lineTo(x+22,y-21);g.moveTo(x+11,y-9);g.lineTo(x+25,y-20);g.stroke();
  g.strokeStyle='#7a4f28';g.lineWidth=0.9;g.beginPath();g.moveTo(x+22,y-21);g.lineTo(x+24.5,y-22.8);g.moveTo(x+25,y-20);g.lineTo(x+27.5,y-21.8);g.stroke();
}
function drawBedMat(g,x,y){
  g.fillStyle='rgba(0,0,0,.14)';g.beginPath();g.ellipse(x,y+24,42,10,0,0,7);g.fill();
  const mg=g.createLinearGradient(x-44,y-16,x+44,y+22);mg.addColorStop(0,'#e7d3a8');mg.addColorStop(1,'#d2b67e');
  g.fillStyle=mg;rr(g,x-44,y-14,88,40,9);g.fill();
  g.strokeStyle='rgba(120,90,45,.4)';g.lineWidth=1.4;rr(g,x-44,y-14,88,40,9);g.stroke();
  const qg=g.createLinearGradient(x-42,y-10,x-42,y+22);qg.addColorStop(0,'#c4563a');qg.addColorStop(1,'#9c3f29');
  g.fillStyle=qg;rr(g,x-42,y-2,84,26,7);g.fill();
  g.fillStyle='#f0bd4c';g.fillRect(x-42,y+8,84,4);
  g.fillStyle='rgba(246,241,227,.85)';for(const dx of [-28,-9,11,30]){g.beginPath();g.arc(x+dx,y+16,2.3,0,7);g.fill();}
  g.fillStyle='#eaddbe';rr(g,x-40,y-12,28,15,5);g.fill();                // pillow
  g.strokeStyle='rgba(120,90,45,.35)';g.lineWidth=1;rr(g,x-40,y-12,28,15,5);g.stroke();
  g.fillStyle='#bb3b2e';g.beginPath();g.arc(x-26,y-4,2.6,0,7);g.fill();
}
let homeBG=null;
function buildHomeBG(){
  const {el,g}=makeCanvas(W,H);
  // ---- polished concrete floor ----
  const fg=g.createLinearGradient(0,150,0,H);fg.addColorStop(0,'#b3a587');fg.addColorStop(1,'#8d8068');
  g.fillStyle=fg;g.fillRect(0,150,W,H-150);
  const rng=mulberry32(909);
  for(let i=0;i<260;i++){g.fillStyle=`rgba(70,58,38,${.03+rng()*.05})`;g.beginPath();g.arc(rng()*W,150+rng()*(H-150),1+rng()*2,0,7);g.fill();}
  // faint trowel seams
  g.strokeStyle='rgba(255,255,255,.05)';g.lineWidth=1;
  for(let i=0;i<5;i++){const yy=210+i*90;g.beginPath();g.moveTo(0,yy);for(let x=0;x<=W;x+=24)g.lineTo(x,yy+Math.sin(x*.03+i)*4);g.stroke();}
  // ---- sun pool spilling from the glass door (right) ----
  g.save();g.globalCompositeOperation='screen';
  g.fillStyle='rgba(255,224,150,.30)';
  g.beginPath();g.moveTo(W,170);g.lineTo(W,560);g.lineTo(250,H);g.lineTo(W-150,150);g.closePath();g.fill();
  const sgr=g.createRadialGradient(W-20,300,10,W-20,360,260);sgr.addColorStop(0,'rgba(255,236,180,.5)');sgr.addColorStop(1,'rgba(255,236,180,0)');
  g.fillStyle=sgr;g.fillRect(0,150,W,H-150);
  g.restore();
  // ---- back wall: basalt brick ----
  drawBasaltBand(g,0,86,W,80,17);
  g.fillStyle='rgba(0,0,0,.22)';g.fillRect(0,164,W,4);                   // wall base shadow onto floor
  // mortar courses for a bricky read
  g.strokeStyle='rgba(20,16,14,.25)';g.lineWidth=1;
  for(let yy=98;yy<162;yy+=12){g.beginPath();g.moveTo(0,yy);g.lineTo(W,yy);g.stroke();}
  // under-shelf warm LED strip (signature of the photo)
  g.save();g.globalCompositeOperation='screen';
  const led=g.createLinearGradient(0,120,0,150);led.addColorStop(0,'rgba(255,196,96,.7)');led.addColorStop(1,'rgba(255,150,50,0)');
  g.fillStyle=led;g.fillRect(40,120,W-200,30);g.restore();
  g.fillStyle='#3a2c1c';g.fillRect(40,118,W-200,4);                      // the shelf board
  // cups/jars lined on the lit shelf
  for(let i=0;i<6;i++){const jx=64+i*40;g.fillStyle=['#cdbfa0','#3a5560','#cf7a3a','#cdbfa0','#8a9c52','#cdbfa0'][i];
    rr(g,jx-5,104,10,12,2);g.fill();}
  // ---- glass sliding door on the right wall ----
  g.fillStyle='#5e3c24';g.fillRect(404,86,40,80);                        // door frame
  const glass=g.createLinearGradient(408,90,408,162);glass.addColorStop(0,'#cfe7df');glass.addColorStop(1,'#9fc6b6');
  g.fillStyle=glass;g.fillRect(408,90,32,72);
  g.fillStyle='#6f9450';g.fillRect(408,140,32,22);                       // greenery outside
  g.fillStyle='rgba(255,255,255,.5)';g.fillRect(420,90,2,72);            // mullion + sheen
  g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.moveTo(410,92);g.lineTo(424,92);g.lineTo(414,160);g.lineTo(408,160);g.closePath();g.fill();
  // ---- wooden entry door (left of glass) ----
  g.fillStyle='#7a4f2a';g.fillRect(330,90,56,76);
  g.fillStyle='#8a5c33';g.fillRect(334,94,48,68);
  g.strokeStyle='rgba(50,30,12,.5)';g.lineWidth=1.4;for(let i=1;i<3;i++){g.beginPath();g.moveTo(330+i*18.6,94);g.lineTo(330+i*18.6,162);g.stroke();}
  g.fillStyle='#caa46a';g.beginPath();g.arc(336,130,2.2,0,7);g.fill();
  // ---- KITCHEN ISLAND: stacked basalt base + counter ----
  const is=homeIsland;
  g.fillStyle='rgba(0,0,0,.20)';g.beginPath();g.ellipse(is.x+is.w/2,is.y+is.h+6,is.w*0.55,11,0,0,7);g.fill();
  drawStoneBlocks(g,is.x,is.y+12,is.w,is.h-12,71);
  // counter top slab (warm wood / concrete)
  const ct=g.createLinearGradient(0,is.y,0,is.y+16);ct.addColorStop(0,'#caa05f');ct.addColorStop(1,'#9c7338');
  g.fillStyle=ct;rr(g,is.x-6,is.y,is.w+12,16,4);g.fill();
  g.fillStyle='rgba(255,235,190,.2)';g.fillRect(is.x-6,is.y+1,is.w+12,2);
  g.fillStyle='rgba(0,0,0,.2)';g.fillRect(is.x-6,is.y+13,is.w+12,3);
  // ---- DINING TABLE + chairs (left) ----
  const tb=homeTable;
  drawChair(g,tb.x-2,tb.y+8,'#8a5a32'); drawChair(g,tb.x-2,tb.y+40,'#6e4a2a');
  g.fillStyle='rgba(0,0,0,.16)';g.beginPath();g.ellipse(tb.x+tb.w/2,tb.y+tb.h+4,tb.w*0.5,8,0,0,7);g.fill();
  const tg=g.createLinearGradient(0,tb.y,0,tb.y+tb.h);tg.addColorStop(0,'#a8814f');tg.addColorStop(1,'#7a5630');
  g.fillStyle=tg;rr(g,tb.x,tb.y,tb.w,tb.h,7);g.fill();
  g.fillStyle='#b89160';rr(g,tb.x+4,tb.y+3,tb.w-8,8,5);g.fill();
  // plank lines
  g.strokeStyle='rgba(50,30,12,.25)';g.lineWidth=1;for(let i=1;i<4;i++){g.beginPath();g.moveTo(tb.x+4,tb.y+i*tb.h/4);g.lineTo(tb.x+tb.w-4,tb.y+i*tb.h/4);g.stroke();}
  drawChair(g,tb.x+tb.w+8,tb.y+8,'#8a5a32'); drawChair(g,tb.x+tb.w+8,tb.y+40,'#6e4a2a');
  // teapot + cups on table
  g.fillStyle='#3a5560';rr(g,tb.x+tb.w/2-12,tb.y+18,24,16,6);g.fill();
  g.fillStyle='#cdbfa0';g.beginPath();g.arc(tb.x+18,tb.y+30,4.5,0,7);g.arc(tb.x+tb.w-18,tb.y+30,4.5,0,7);g.fill();
  // ---- basalt bench in the foreground (decorative) ----
  drawStoneBlocks(g,28,584,150,40,222);
  g.fillStyle='#2a2b30';rr(g,24,576,158,14,5);g.fill();                  // dark cushion
  g.fillStyle='#3a3b42';rr(g,28,578,150,8,4);g.fill();
  // ---- exit mat ----
  g.fillStyle='#caa46a';rr(g,homeExit.x,homeExit.y,homeExit.w,homeExit.h,5);g.fill();
  g.strokeStyle='rgba(90,60,25,.5)';g.setLineDash([4,3]);g.strokeRect(homeExit.x+2,homeExit.y+2,homeExit.w-4,homeExit.h-4);g.setLineDash([]);
  // ---- timber rafter ceiling over the top ----
  drawRafters(g);
  homeBG=el;
}
function drawHome(){
  if(!homeBG) buildHomeBG();
  ctx.drawImage(homeBG,0,0,W,H);
  const t=performance.now()*0.001;
  // kettle on the island + live steam + burner glow
  drawKettle(ctx,stoveStation.x,homeIsland.y+2);
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<3;i++){const ph=t*1.3+i*2.1; const sy=homeIsland.y-10-((ph*9)%28);
    const sx=stoveStation.x+8+Math.sin(ph*1.6)*5; const a=0.16*(1-((ph*9)%28)/28);
    ctx.fillStyle=`rgba(255,250,240,${Math.max(0,a)})`;ctx.beginPath();ctx.arc(sx,sy,4+i,0,7);ctx.fill();}
  const fg=ctx.createRadialGradient(stoveStation.x,homeIsland.y+6,1,stoveStation.x,homeIsland.y+6,20);
  fg.addColorStop(0,'rgba(255,140,60,.45)');fg.addColorStop(1,'rgba(255,140,60,0)');
  ctx.fillStyle=fg;ctx.beginPath();ctx.arc(stoveStation.x,homeIsland.y+6,20,0,7);ctx.fill();
  ctx.restore();
  // sleeping mat (floor)
  drawBedMat(ctx,bedStation.x,bedStation.y);
  // ---- wardrobe / changing room: open armoire with both suits on hangers ----
  (function(wx,wy){
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(wx,wy+38,40,9,0,0,7);ctx.fill();
    // cabinet body
    ctx.fillStyle='#6e4a2a';rr(ctx,wx-38,wy-44,76,82,5);ctx.fill();
    ctx.fillStyle='#8a5c33';rr(ctx,wx-34,wy-40,68,74,4);ctx.fill();
    // open interior
    ctx.fillStyle='#3a2716';rr(ctx,wx-30,wy-36,60,66,3);ctx.fill();
    // hanging rail
    ctx.strokeStyle='#caa46a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(wx-28,wy-30);ctx.lineTo(wx+28,wy-30);ctx.stroke();
    // traditional suit on left hanger (white top / black bottom)
    ctx.strokeStyle='#cbbf9c';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(wx-15,wy-30);ctx.lineTo(wx-15,wy-26);ctx.stroke();
    ctx.fillStyle='#f2ede1';rr(ctx,wx-25,wy-26,20,20,3);ctx.fill();
    ctx.fillStyle='#23222a';rr(ctx,wx-25,wy-8,20,22,3);ctx.fill();
    ctx.strokeStyle='#d8453a';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(wx-15,wy-30,2.4,0,7);ctx.stroke();
    // modern wetsuit on right hanger (dark neoprene + teal accent) — greyed if not owned
    ctx.globalAlpha = (typeof G!=='undefined'&&G.owned&&G.owned.modern)?1:0.4;
    ctx.strokeStyle='#cbbf9c';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(wx+15,wy-30);ctx.lineTo(wx+15,wy-26);ctx.stroke();
    ctx.fillStyle='#26252e';rr(ctx,wx+5,wy-26,20,40,3);ctx.fill();
    ctx.strokeStyle='#2f9c8a';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(wx+15,wy-24);ctx.lineTo(wx+15,wy+10);ctx.stroke();
    ctx.globalAlpha=1;
    // a small stool + folded towel
    ctx.fillStyle='#9c7338';rr(ctx,wx-50,wy+18,20,14,3);ctx.fill();
    ctx.fillStyle='#e8e0cc';rr(ctx,wx-49,wy+15,18,5,2);ctx.fill();
    ctx.restore();
  })(wardrobeStation.x,wardrobeStation.y);
  // cooked ramyeon plated on the dining table (waiting to be eaten)
  if(G.preparedMeal && scene!=='eating'){
    const bx=homeTable.x+homeTable.w/2, by=homeTable.y+36;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<3;i++){const ph=t*1.3+i*2.0; const sy=by-12-((ph*8)%24);
      const sx=bx+Math.sin(ph*1.7)*4; const a=0.14*(1-((ph*8)%24)/24);
      ctx.fillStyle=`rgba(255,250,240,${Math.max(0,a)})`;ctx.beginPath();ctx.arc(sx,sy,3+i,0,7);ctx.fill();}
    ctx.restore();
    drawRamenBowl(ctx,bx,by);
  }
  // player
  drawPerson(P.x,P.y,{skin:'#e8c9a0',scarf:'#f0bd4c',suit:'#2f7d72',face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  // cozy warm wash + sun shaft from the glass door
  ctx.save();ctx.fillStyle='rgba(255,196,120,.08)';ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='screen';
  const sun=ctx.createLinearGradient(W,200,W-260,520);sun.addColorStop(0,'rgba(255,228,150,.22)');sun.addColorStop(1,'rgba(255,228,150,0)');
  ctx.fillStyle=sun;ctx.beginPath();ctx.moveTo(W,180);ctx.lineTo(W,560);ctx.lineTo(260,H);ctx.lineTo(W-160,160);ctx.closePath();ctx.fill();
  ctx.restore();
  // vignette
  const vg=ctx.createRadialGradient(W/2,H*0.5,H*0.34,W/2,H*0.5,H*0.74);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(8,16,10,.36)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  // labels
  tag('Stove 라면', stoveStation.x, homeIsland.y-28, 11, '#f6f1e3');
  tag('Sleep 잠자리', bedStation.x, bedStation.y-26, 11, '#f6f1e3');
  tag('Change 옷 · '+(G.suit==='modern'?'wetsuit':'물옷'), wardrobeStation.x, wardrobeStation.y-54, 11, '#f6f1e3');
  tag('← outside · 나가기', homeExit.x+homeExit.w/2, homeExit.y+homeExit.h/2, 11, '#f6f1e3');
}
function drawEat(){
  drawHome();                                   // room + diner standing at the table
  const t=performance.now()*0.001;
  const bx=homeTable.x+homeTable.w/2, by=homeTable.y+30;
  // focus the moment
  ctx.save();ctx.fillStyle='rgba(6,16,10,.32)';ctx.fillRect(0,0,W,H);ctx.restore();
  ctx.save();ctx.globalCompositeOperation='screen';
  const sp=ctx.createRadialGradient(bx,by,8,bx,by,150);sp.addColorStop(0,'rgba(255,212,134,.30)');sp.addColorStop(1,'rgba(255,212,134,0)');
  ctx.fillStyle=sp;ctx.beginPath();ctx.arc(bx,by,150,0,7);ctx.fill();ctx.restore();
  // steam
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<4;i++){const ph=t*1.3+i*1.6;const sy=by-14-((ph*9)%26);const sx=bx+Math.sin(ph*1.6)*5;const a=0.16*(1-((ph*9)%26)/26);
    ctx.fillStyle=`rgba(255,250,240,${Math.max(0,a)})`;ctx.beginPath();ctx.arc(sx,sy,4+i,0,7);ctx.fill();}
  ctx.restore();
  drawRamenBowl(ctx,bx,by);
  // chopsticks lift a noodle clump from the bowl to the diner's mouth, on a loop
  const cyc=(Math.sin(eatT*5)*0.5+0.5);
  const mouthX=P.x+6, mouthY=P.y-22;
  const clumpX=bx+(mouthX-bx)*cyc, clumpY=(by-6)+(mouthY-(by-6))*cyc;
  ctx.strokeStyle='#f0d98a';ctx.lineWidth=1.6;ctx.lineCap='round';
  for(let s=-1;s<=1;s++){ctx.beginPath();ctx.moveTo(bx+s*3,by-4);ctx.quadraticCurveTo(clumpX+s*2,(by-4+clumpY)/2,clumpX+s*2,clumpY);ctx.stroke();}
  ctx.strokeStyle='#9c6a3a';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(clumpX+10,clumpY-12);ctx.lineTo(clumpX-2,clumpY+2);ctx.moveTo(clumpX+13,clumpY-11);ctx.lineTo(clumpX+1,clumpY+3);ctx.stroke();
  // 냠냠 + floating heart at the mouth
  if(cyc>0.8){
    glabel('냠냠',mouthX+16,mouthY-4,13,'#fff');
    ctx.fillStyle='#e8714a';ctx.font='12px serif';ctx.textAlign='center';
    const hy=mouthY-14-((eatT*30)%26);ctx.globalAlpha=Math.max(0,1-((eatT*30)%26)/26);
    ctx.fillText('♥',mouthX-12,hy);ctx.globalAlpha=1;
  }
  // eating progress
  const p=Math.min(1,eatT/EAT_DUR);
  ctx.fillStyle='rgba(0,0,0,.3)';rr(ctx,bx-26,by+18,52,5,2.5);ctx.fill();
  ctx.fillStyle='#f0bd4c';rr(ctx,bx-26,by+18,52*p,5,2.5);ctx.fill();
}

/* ---------------- DIVE ---------------- */
function drawKelp(x,baseY,h,t,hue){
  ctx.strokeStyle=hue;ctx.lineWidth=4;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x,baseY);
  for(let i=1;i<=6;i++){const yy=baseY-h*i/6;const sw=Math.sin(t*1.4+i*0.6+x)*6*(i/6);ctx.lineTo(x+sw,yy);}
  ctx.stroke();
  ctx.lineWidth=2;ctx.strokeStyle=shade(hue.replace('rgb','').length?'#3a7d5d':'#3a7d5d',10);
}
function drawCreature(c,t){
  const y=c.y+(c.buried?Math.sin(c.bob)*0.6:Math.sin(c.bob)*2.5), x=c.x, col=c.s.color, R=c.r;
  const OL='#241f29';
  ctx.save();ctx.translate(x,y);
  ctx.lineJoin='round';ctx.lineCap='round';
  ctx.fillStyle='rgba(0,0,0,.10)';ctx.beginPath();ctx.ellipse(0,R*1.05,R*0.85,R*0.3,0,0,7);ctx.fill();
  if(c.buried){   // nestled into a basalt crevice — must be dug out
    ctx.fillStyle='#0b2932';ctx.beginPath();ctx.ellipse(0,R*0.55,R*1.7,R*0.95,0,0,7);ctx.fill();
    ctx.fillStyle='#10363f';ctx.beginPath();ctx.ellipse(-R*0.85,R*0.55,R*0.55,R*0.4,0,0,7);ctx.ellipse(R*0.9,R*0.5,R*0.5,R*0.36,0,0,7);ctx.fill();
  }

  if(c.s.id==='seaweed'){
    // cute kelp: wavy green blades with a dark outline, topped by a little red bloom
    for(let pass=0;pass<2;pass++){
      ctx.strokeStyle=pass?col:OL; ctx.lineWidth=pass?5:8.5;
      for(let b=-1;b<=1;b++){
        ctx.beginPath();ctx.moveTo(b*5,R);
        for(let i=1;i<=5;i++){const yy=R-i*(R*2.2)/5;ctx.lineTo(b*5+Math.sin(t*2+i*0.7+b)*5,yy);}
        ctx.stroke();
      }
    }
    ctx.fillStyle='#e8534a';
    for(let a=0;a<6.28;a+=1.25){ctx.beginPath();ctx.ellipse(Math.cos(a)*4,-R*1.05+Math.sin(a)*4,2.7,2,a,0,7);ctx.fill();}
    ctx.fillStyle='#f0bd4c';ctx.beginPath();ctx.arc(0,-R*1.05,2,0,7);ctx.fill();
  }
  else if(c.s.id==='conch'){
    // brown turban shell: round body + spiral + knobs
    ctx.fillStyle=col;ctx.strokeStyle=OL;ctx.lineWidth=2.4;
    ctx.beginPath();ctx.ellipse(0,R*0.15,R,R*0.88,0,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle=shade(col,-34);ctx.lineWidth=2;
    ctx.beginPath();for(let a=0;a<7;a+=0.22){const r2=R*0.82*(1-a/8);const px=Math.cos(a)*r2,py=R*0.15+Math.sin(a)*r2*0.85;a===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}ctx.stroke();
    ctx.fillStyle=shade(col,22);
    for(let a=-0.5;a<3.2;a+=0.62){ctx.beginPath();ctx.arc(Math.cos(a)*R*0.96,R*0.15+Math.sin(a)*R*0.82,2.3,0,7);ctx.fill();}
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-R*0.32,-R*0.22,R*0.28,R*0.2,0,0,7);ctx.fill();
  }
  else if(c.s.id==='urchin'){
    // spiky black ball
    ctx.strokeStyle=OL;ctx.lineWidth=2.6;
    for(let a=0;a<6.28;a+=0.36){const r1=R*0.55,r2=R+5+Math.sin(a*3)*1.6;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke();}
    ctx.fillStyle=col;ctx.strokeStyle=OL;ctx.lineWidth=2.4;
    ctx.beginPath();ctx.arc(0,0,R*0.64,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.arc(-R*0.2,-R*0.2,R*0.2,0,7);ctx.fill();
  }
  else { // cute red octopus
    for(let pass=0;pass<2;pass++){   // tentacles: dark outline pass, then colour
      ctx.strokeStyle=pass?col:OL; ctx.lineWidth=pass?R*0.42:R*0.42+4;
      for(let l=-2;l<=2;l++){const bx=l*R*0.34;
        ctx.beginPath();ctx.moveTo(bx,R*0.15);
        ctx.quadraticCurveTo(bx+Math.sin(t*3+l)*R*0.5,R*0.95, l*R*0.55+Math.sin(t*3+l)*R*0.4,R*1.32);
        ctx.stroke();}
    }
    ctx.fillStyle=col;ctx.strokeStyle=OL;ctx.lineWidth=2.6;
    ctx.beginPath();ctx.arc(0,-R*0.12,R,Math.PI,0);ctx.lineTo(R,R*0.28);ctx.quadraticCurveTo(0,R*0.52,-R,R*0.28);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-R*0.3,-R*0.18,R*0.2,0,7);ctx.arc(R*0.3,-R*0.18,R*0.2,0,7);ctx.fill();
    ctx.fillStyle=OL;ctx.beginPath();ctx.arc(-R*0.26,-R*0.15,R*0.1,0,7);ctx.arc(R*0.34,-R*0.15,R*0.1,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,140,140,.55)';ctx.beginPath();ctx.arc(-R*0.52,R*0.02,R*0.13,0,7);ctx.arc(R*0.52,R*0.02,R*0.13,0,7);ctx.fill();
    ctx.strokeStyle=OL;ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(R*0.02,-R*0.04,R*0.15,0.25,Math.PI-0.25);ctx.stroke();
  }
  if(c.buried && c.dig>0){   // dig-progress ring
    const p=Math.min(1,c.dig/c.digMax);
    ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=3.4;ctx.beginPath();ctx.arc(0,-R*0.1,R+10,0,6.28);ctx.stroke();
    ctx.strokeStyle='#f0bd4c';ctx.lineWidth=3.4;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,-R*0.1,R+10,-Math.PI/2,-Math.PI/2+p*6.28);ctx.stroke();
  }
  ctx.restore();
}
function drawMiniFish(x,y,dir,t){
  ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.translate(0,Math.sin(t*2)*1.5);
  ctx.lineJoin='round';
  ctx.fillStyle='#5aa7c8';ctx.strokeStyle='#2a6f8a';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(-12,-4.5);ctx.lineTo(-12,4.5);ctx.closePath();ctx.fill();ctx.stroke();  // tail
  ctx.beginPath();ctx.ellipse(0,0,7.5,4.6,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(4,-1,1.5,0,7);ctx.fill();
  ctx.fillStyle='#241f29';ctx.beginPath();ctx.arc(4.5,-1,0.75,0,7);ctx.fill();
  ctx.restore();
}
function drawDive(){
  const t=performance.now()*0.001;
  // water column
  const g=ctx.createLinearGradient(0,SURF,0,BED+20);
  g.addColorStop(0,'#46b0bf');g.addColorStop(.4,'#1f7286');g.addColorStop(1,'#04202b');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // sky band above surface
  const sky=ctx.createLinearGradient(0,0,0,SURF);
  const nt=nightAmt(G.time);
  sky.addColorStop(0, nt>0.4?'#23304f':'#ead9c0');sky.addColorStop(1,'#9ccfc9');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,SURF);
  // god rays
  ctx.save();ctx.beginPath();ctx.rect(0,SURF,W,H-SURF);ctx.clip();ctx.globalCompositeOperation='screen';
  for(let i=0;i<5;i++){const cx=((i*120+Math.sin(t*0.3+i)*40)%(W+120))-60;
    ctx.fillStyle='rgba(200,245,255,0.06)';ctx.beginPath();
    ctx.moveTo(cx,SURF);ctx.lineTo(cx+24,SURF);ctx.lineTo(cx+90,BED);ctx.lineTo(cx-46,BED);ctx.closePath();ctx.fill();}
  ctx.restore();
  // surface caustics
  ctx.save();ctx.beginPath();ctx.rect(0,SURF,W,60);ctx.clip();
  for(let i=0;i<30;i++){const x=(i*40+Math.sin(t+i)*16)%W;
    ctx.fillStyle=`rgba(255,255,255,${0.05+0.05*Math.sin(t*2+i)})`;ctx.beginPath();ctx.ellipse(x,SURF+14+Math.sin(i)*8,9,2.6,0,0,7);ctx.fill();}
  ctx.restore();
  // surface wave line
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2.5;ctx.beginPath();
  for(let x=0;x<=W;x+=10){const y=SURF+Math.sin(x*.06+t*1.8)*3;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
  // seabed
  ctx.fillStyle='#07222c';ctx.beginPath();ctx.moveTo(0,BED);
  for(let x=0;x<=W;x+=22)ctx.lineTo(x,BED+Math.sin(x*.08)*5);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
  ctx.fillStyle='#0c3340';ctx.beginPath();ctx.moveTo(0,BED+4);
  for(let x=0;x<=W;x+=30)ctx.lineTo(x,BED+4+Math.sin(x*.05+1)*4);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
  // rocks
  ctx.fillStyle='#0a2c36';
  for(const rk of [[60,BED-4,16],[180,BED+2,22],[300,BED-2,18],[420,BED+4,24]]){
    ctx.beginPath();ctx.ellipse(rk[0],rk[1],rk[2],rk[2]*0.6,0,Math.PI,0);ctx.fill();}
  // kelp
  drawKelp(40,BED,90,t,'#2f6e4e');drawKelp(120,BED,70,t,'#357d56');
  drawKelp(360,BED,100,t,'#2f6e4e');drawKelp(440,BED,80,t,'#357d56');
  // tewak float on surface
  ctx.fillStyle='rgba(0,0,0,.15)';ctx.beginPath();ctx.ellipse(W/2,SURF+2,18,4,0,0,7);ctx.fill();
  const tg=ctx.createRadialGradient(W/2-4,SURF-9,1,W/2,SURF-5,16);tg.addColorStop(0,'#f59a6f');tg.addColorStop(1,'#cf5b34');
  ctx.fillStyle=tg;ctx.beginPath();ctx.ellipse(W/2,SURF-5,16,12,0,0,7);ctx.fill();
  ctx.strokeStyle='rgba(60,40,20,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(W/2,SURF+6);ctx.lineTo(W/2+4,SURF+40);ctx.stroke();
  // ambient little blue fish drifting through
  for(let i=0;i<5;i++){
    const dir=i%2?1:-1;
    const span=W+80, raw=(performance.now()*0.018*dir)+i*150;
    const px=((raw%span)+span)%span-40;
    const fy=SURF+70+i*86+Math.sin(t*0.7+i)*12;
    drawMiniFish(px,fy,dir,t+i);
  }
  // a calm little school drifting together (cozy Jeju feel)
  {
    const dir = Math.sin(t*0.12)>0?1:-1;
    const cx = W*0.5 + Math.sin(t*0.18)*W*0.42;
    const cy = SURF+150+Math.sin(t*0.3)*40;
    for(let i=0;i<7;i++){
      const ox=Math.cos(i*1.3)*22+ (i-3)*10, oy=Math.sin(i*1.7)*12;
      drawMiniFish(cx+ox*dir, cy+oy+Math.sin(t*1.5+i)*3, dir, t+i*0.5);
    }
  }
  // marine snow — slow drifting particulate, very calming
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<46;i++){
    const sx=((i*97.3 + Math.sin(t*0.2+i)*30)%W+W)%W;
    const sy=SURF+ ((i*53.7 - t*7*( (i%3)+1 )*0.4) % (H-SURF) + (H-SURF)) % (H-SURF);
    const a=0.05+0.07*((i%5)/5);
    ctx.fillStyle=`rgba(220,245,255,${a})`;
    ctx.beginPath();ctx.arc(sx,sy,0.7+(i%3)*0.5,0,7);ctx.fill();
  }
  ctx.restore();
  // creatures
  for(const c of dCreatures) drawCreature(c,t);
  // particles
  for(const p of dParts){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill();ctx.globalAlpha=1;}
  // bubbles
  ctx.fillStyle='rgba(220,250,255,.5)';for(const b of dBubbles){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();}
  // ---- diver: cute haenyeo, dives head-first toward swim direction ----
  {
    const vmag=Math.hypot(dv.vx,dv.vy);
    const targetAng = vmag>0.35 ? Math.atan2(dv.vy,dv.vx)-Math.PI/2 : 0;   // head leads; default head-down
    if(dv.ang===undefined)dv.ang=0;
    let da=targetAng-dv.ang; da=Math.atan2(Math.sin(da),Math.cos(da)); dv.ang+=da*0.16;
    const R=dv.r*1.32, OL='#3a342b', WHITE='#f2ede1', WSH='#d9d2c2', BLK='#23222a', kick=Math.sin(dv.kick);
    const modern=(typeof G!=='undefined'&&G.suit==='modern');
    const NEO='#26252e', ACC='#2f9c8a';
    const TOP=modern?NEO:WHITE, BOT=modern?NEO:BLK, HOOD=modern?'#1d1c24':WHITE, SLEEVE=modern?NEO:WHITE;
    ctx.save();ctx.translate(dv.x,dv.y);ctx.rotate(dv.ang);
    ctx.lineJoin='round';ctx.lineCap='round';
    // legs in shorts + orange fins (trailing, up), kicking
    for(const sgn of [-1,1]){ const sw=sgn*kick*0.5;
      ctx.strokeStyle=BOT;ctx.lineWidth=6.5;
      ctx.beginPath();ctx.moveTo(sgn*R*0.34,-R*0.5);ctx.lineTo(sgn*R*0.55+sw*R,-R*1.12);ctx.stroke();
      ctx.save();ctx.translate(sgn*R*0.6+sw*R,-R*1.3);ctx.rotate(sgn*0.5+sw);
      ctx.fillStyle='#f0a23a';ctx.strokeStyle=OL;ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(0,0,R*0.27,R*0.5,0,0,7);ctx.fill();ctx.stroke();ctx.restore();
    }
    // hand-net slung behind the shoulder
    ctx.save();ctx.translate(-R*0.72,-R*0.15);ctx.rotate(-0.5);
    ctx.strokeStyle='#6e4a2a';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,R*0.6);ctx.lineTo(0,-R*0.18);ctx.stroke();
    ctx.strokeStyle='#cdbd8a';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,-R*0.55,R*0.42,0,7);ctx.stroke();
    ctx.strokeStyle='rgba(120,150,90,.85)';ctx.lineWidth=1;
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*R*0.15,-R*0.95);ctx.lineTo(i*R*0.15,-R*0.15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-R*0.4,-R*0.55+i*R*0.15);ctx.lineTo(R*0.4,-R*0.55+i*R*0.15);ctx.stroke();}
    ctx.restore();
    // shorts / suit bottom (lower torso, leg-end)
    ctx.fillStyle=BOT;ctx.strokeStyle=OL;ctx.lineWidth=2.2;
    ctx.beginPath();ctx.ellipse(0,-R*0.42,R*0.72,R*0.6,0,0,7);ctx.fill();ctx.stroke();
    if(!modern){
      ctx.strokeStyle=WSH;ctx.lineWidth=1.3;
      ctx.beginPath();ctx.moveTo(-R*0.52,-R*0.66);ctx.lineTo(R*0.52,-R*0.66);ctx.stroke();              // waist stitch
      ctx.beginPath();ctx.moveTo(-R*0.34,-R*0.72);ctx.lineTo(R*0.34,-R*0.16);                            // X cross-stitch
      ctx.moveTo(R*0.34,-R*0.72);ctx.lineTo(-R*0.34,-R*0.16);ctx.stroke();
    } else {
      ctx.strokeStyle=ACC;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-R*0.52,-R*0.62);ctx.lineTo(R*0.52,-R*0.62);ctx.stroke(); // accent band
    }
    // jacket / suit top (upper torso, head-end)
    ctx.fillStyle=TOP;ctx.strokeStyle=OL;ctx.lineWidth=2.4;
    ctx.beginPath();ctx.ellipse(0,R*0.26,R*0.8,R*0.66,0,0,7);ctx.fill();ctx.stroke();
    if(!modern){
      ctx.fillStyle=WSH;ctx.fillRect(-R*0.06,-R*0.28,R*0.12,R*0.7);                                       // center placket
      ctx.strokeStyle=WSH;ctx.lineWidth=1.4;
      for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(R*0.16,-R*0.06+i*R*0.24,R*0.05,0,7);ctx.stroke();}       // knotted buttons
    } else {
      ctx.strokeStyle=ACC;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-R*0.36);ctx.lineTo(0,R*0.5);ctx.stroke();   // front zip
      ctx.fillStyle=ACC;ctx.beginPath();ctx.arc(0,-R*0.34,R*0.06,0,7);ctx.fill();
    }
    // arms in sleeves reaching toward the head, gloves
    for(const sgn of [-1,1]){
      ctx.strokeStyle=SLEEVE;ctx.lineWidth=7;
      ctx.beginPath();ctx.moveTo(sgn*R*0.5,R*0.2);ctx.lineTo(sgn*R*0.8,R*1.0);ctx.stroke();
      ctx.strokeStyle=OL;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sgn*R*0.5,R*0.2);ctx.lineTo(sgn*R*0.8,R*1.0);ctx.stroke();
      ctx.fillStyle=modern?'#1d1c24':WHITE;ctx.strokeStyle=OL;ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(sgn*R*0.84,R*1.12,R*0.2,0,7);ctx.fill();ctx.stroke();
    }
    // J-hook (빗창) gripped in the right glove
    ctx.save();ctx.translate(R*0.84,R*1.12);ctx.rotate(0.35);
    ctx.strokeStyle='#9c6a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-R*0.1);ctx.lineTo(0,R*0.7);ctx.stroke();
    ctx.strokeStyle='#b8bcc0';ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(-R*0.18,R*0.72,R*0.2,-0.3,Math.PI*0.95);ctx.stroke();ctx.restore();
    // hood framing the face
    ctx.fillStyle=HOOD;ctx.strokeStyle=OL;ctx.lineWidth=2.4;
    ctx.beginPath();ctx.arc(0,R*0.96,R*0.82,0,7);ctx.fill();ctx.stroke();
    // hood ties trailing (traditional cotton only)
    if(!modern){ctx.strokeStyle=WHITE;ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(-R*0.6,R*1.3);ctx.quadraticCurveTo(-R*0.5,R*1.6,-R*0.7,R*1.85);ctx.stroke();}
    // pink face
    ctx.fillStyle='#f3c9a8';ctx.beginPath();ctx.arc(0,R*1.06,R*0.46,0,7);ctx.fill();
    // red-rimmed round goggles (왕눈) over light glass
    ctx.fillStyle='rgba(150,210,235,.45)';rr(ctx,-R*0.4,R*0.8,R*0.8,R*0.5,R*0.25);ctx.fill();
    ctx.strokeStyle='#c23a2e';ctx.lineWidth=3.4;rr(ctx,-R*0.42,R*0.78,R*0.84,R*0.54,R*0.27);ctx.stroke();
    ctx.strokeStyle='#8a2a20';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,R*0.78);ctx.lineTo(0,R*1.32);ctx.stroke(); // nose bridge
    // eyes + cheeks
    ctx.fillStyle=OL;ctx.beginPath();ctx.arc(-R*0.16,R*1.04,R*0.09,0,7);ctx.arc(R*0.16,R*1.04,R*0.09,0,7);ctx.fill();
    ctx.fillStyle='rgba(232,120,110,.5)';ctx.beginPath();ctx.arc(-R*0.3,R*1.2,R*0.1,0,7);ctx.arc(R*0.3,R*1.2,R*0.1,0,7);ctx.fill();
    ctx.restore();
  }
  // night dim underwater
  if(nt>0.2){ctx.fillStyle=`rgba(8,18,40,${nt*0.4})`;ctx.fillRect(0,SURF,W,H-SURF);}
  // vignette
  const vg=ctx.createRadialGradient(W/2,H*0.45,H*0.25,W/2,H*0.5,H*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(2,12,20,.5)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  // net counter
  ctx.fillStyle='rgba(246,241,227,.95)';ctx.font='700 14px "Space Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.fillText('Net '+dNet.length+'/'+netCap(),16,42);
  if(dSumbi>0){ctx.globalAlpha=Math.min(1,dSumbi);glabel('휴— (gasp)',dv.x,SURF-14,20,'#f6f1e3');ctx.globalAlpha=1;}
}

/* ---------------- PORTRAIT (hanji) ---------------- */
function drawPortrait(n){
  const p=$('portrait'); const S=54;
  p.width=Math.round(S*DPR);p.height=Math.round(S*DPR);
  const x=p.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);x.clearRect(0,0,S,S);
  // hanji bg
  const bg=x.createLinearGradient(0,0,0,S);bg.addColorStop(0,'#efe4cb');bg.addColorStop(1,'#e2d2af');
  x.fillStyle=bg;x.fillRect(0,0,S,S);
  x.fillStyle='rgba(120,90,40,.06)';for(let i=0;i<40;i++){x.fillRect((i*13)%S,(i*7)%S,2,1);}
  // shoulders
  x.fillStyle='#27474e';x.beginPath();x.ellipse(S/2,S+6,20,16,0,0,7);x.fill();
  x.fillStyle=n.scarf;x.fillRect(S/2-20,S-10,40,4);
  // neck + face
  x.fillStyle=shade(n.skin,-14);x.fillRect(S/2-5,S/2+6,10,8);
  x.fillStyle=n.skin;x.beginPath();x.arc(S/2,S/2-1,15,0,7);x.fill();
  x.fillStyle=shade(n.skin,-15);x.beginPath();x.arc(S/2+5,S/2-1,15,-.5,1);x.fill();
  // headscarf
  x.fillStyle=n.scarf;x.beginPath();x.arc(S/2,S/2-4,16.5,Math.PI*1.03,-Math.PI*0.03);x.closePath();x.fill();
  x.fillRect(S/2-16.5,S/2-7,33,7);
  x.fillStyle=shade(n.scarf,-22);x.beginPath();x.arc(S/2-15,S/2,3.4,0,7);x.fill();
  // face
  x.fillStyle='#2a2320';x.beginPath();x.arc(S/2-5,S/2,1.9,0,7);x.arc(S/2+5,S/2,1.9,0,7);x.fill();
  x.fillStyle='rgba(220,110,80,.3)';x.beginPath();x.arc(S/2-8,S/2+5,2.6,0,7);x.arc(S/2+8,S/2+5,2.6,0,7);x.fill();
  x.strokeStyle='rgba(120,70,50,.6)';x.lineWidth=1.4;x.beginPath();x.arc(S/2,S/2+4,3.4,.2,Math.PI-.2);x.stroke();
  // border
  x.strokeStyle='rgba(99,70,30,.5)';x.lineWidth=2;x.strokeRect(1,1,S-2,S-2);
}

/* ---------------- JOYSTICK ---------------- */
function drawJoy(){
  if(!joy.on||!joy.moved)return;
  ctx.fillStyle='rgba(246,241,227,.16)';ctx.beginPath();ctx.arc(joy.bx,joy.by,36,0,7);ctx.fill();
  ctx.strokeStyle='rgba(246,241,227,.3)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.bx,joy.by,36,0,7);ctx.stroke();
  const m=Math.min(28,Math.hypot(joy.dx,joy.dy)),a=Math.atan2(joy.dy,joy.dx);
  const hx=joy.bx+Math.cos(a)*m,hy=joy.by+Math.sin(a)*m;
  const g=ctx.createRadialGradient(hx-3,hy-3,1,hx,hy,15);g.addColorStop(0,'#f6f1e3');g.addColorStop(1,'rgba(240,189,76,.7)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(hx,hy,15,0,7);ctx.fill();
}

/* ---------------- boot ---------------- */
setupRetina();
requestAnimationFrame(frame);
