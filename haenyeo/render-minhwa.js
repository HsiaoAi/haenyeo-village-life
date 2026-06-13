/* ============================================================
   HAENYEO VILLAGE LIFE — MINHWA (민화 / 단청) STYLE renderer
   Korean folk-painting repaint: flat mineral-pigment colour
   fields, bold ink outlines, decorative motifs (cresting folk
   waves, 일월오봉도 five peaks, auspicious clouds, peonies,
   cranes). Classic script, shares global scope with game.js.
   Same function signatures as render.js / render-ghibli.js so
   the three are drop-in interchangeable.
   ============================================================ */

/* ---------------- mineral-pigment palette (단청) ---------------- */
const MIN = {
  ink:   '#2a201a',   // 먹 — outline brown-black
  ink2:  '#1c140f',
  paper: '#efe2c4',   // 한지/비단 ground
  paper2:'#e6d4ad',
  white: '#f4ecd9',   // 호분 (gofun) white
  red:   '#b23a2c',   // 석간주 iron-oxide red
  verm:  '#d6502f',   // 주홍 vermilion
  gold:  '#e3b13a',   // 황 ochre gold
  goldD: '#a87a1e',
  green: '#4f8f63',   // 뇌록 malachite
  greenD:'#2f6b49',
  greenL:'#7bb072',   // 양록
  blue:  '#2f4f8c',   // 군청 ultramarine
  blueL: '#5c84b8',   // 삼청
  teal:  '#2f8a86',
  jade:  '#3f9e8c',
  plum:  '#8a3a5c',
};

/* ---------------- retina ---------------- */
let DPR=Math.max(1,Math.min(3,window.devicePixelRatio||1));
function setupRetina(){
  DPR=Math.max(1,Math.min(3,window.devicePixelRatio||1));
  cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.imageSmoothingEnabled=true;
  villageBG=null; shopBG=null; homeBG=null; marketBG=null;
}
addEventListener('resize',()=>{ clearTimeout(window.__rt); window.__rt=setTimeout(setupRetina,150); });

/* ---------------- helpers ---------------- */
function shade(hex,amt){
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

/* flat shape with a bold ink outline — the minhwa signature */
function inked(g,col,lw){ g.fillStyle=col; g.strokeStyle=MIN.ink; g.lineWidth=lw||2.4; g.lineJoin='round'; g.lineCap='round'; }
function fillStroke(g){ g.fill(); g.stroke(); }

/* over-canvas outlined label (Korean-safe) */
function glabel(text,x,y,size,color){
  ctx.font=`700 ${size}px "Gowun Batang", serif`; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  ctx.lineWidth=3.6; ctx.lineJoin='round'; ctx.strokeStyle='rgba(20,12,8,.92)';
  ctx.strokeText(text,x,y);
  ctx.fillStyle=color||MIN.white; ctx.fillText(text,x,y);
}
/* lacquer-plaque label: dark wood with a thin gold rule + gold text */
function tag(text,x,y,size,accent){
  ctx.font=`700 ${size}px "Gowun Batang", serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(text).width+20, h=size+12;
  ctx.save();
  ctx.fillStyle='rgba(28,18,12,.82)';
  rr(ctx,x-w/2,y-h/2,w,h,5);ctx.fill();
  ctx.strokeStyle='rgba(227,177,58,.65)';ctx.lineWidth=1.2;rr(ctx,x-w/2+2,y-h/2+2,w-4,h-4,4);ctx.stroke();
  ctx.fillStyle=accent||MIN.gold;ctx.fillText(text,x,y+0.5);
  ctx.restore();
}

/* warm silk/paper ground with faint flecks */
function paperFill(g,x,y,w,h,base){
  g.fillStyle=base||MIN.paper; g.fillRect(x,y,w,h);
  const rng=mulberry32(((x*13+y*7)|0)+1);
  g.save();g.globalAlpha=.5;
  for(let i=0;i<w*h/900;i++){const px=x+rng()*w,py=y+rng()*h;
    g.fillStyle=rng()>.5?'rgba(120,90,40,.05)':'rgba(255,250,235,.06)';
    g.fillRect(px,py,1.4,1.4);}
  g.restore();
}

/* ===== DECORATIVE MOTIF LIBRARY ===== */

/* auspicious scroll cloud (구름무늬 / ruyi) */
function motifCloud(g,x,y,s,col,oc){
  g.save();g.translate(x,y);g.scale(s,s);
  inked(g,col||MIN.white,2.2); g.strokeStyle=oc||MIN.ink;
  g.beginPath();
  g.arc(-12,2,7,0,7); g.arc(-2,-3,9,0,7); g.arc(9,1,8,0,7); g.arc(0,6,8,0,7);
  g.fill();
  // single sweeping under-stroke spiral
  g.beginPath();g.moveTo(-18,4);g.quadraticCurveTo(0,16,18,5);g.stroke();
  g.beginPath();g.arc(18,5,3,Math.PI*0.3,Math.PI*1.6);g.stroke();
  g.restore();
}

/* folk peony / blossom (모란) */
function motifPeony(g,x,y,s,col){
  g.save();g.translate(x,y);g.scale(s,s);
  inked(g,col||MIN.verm,2);
  for(let a=0;a<6.28;a+=6.28/7){
    g.beginPath();g.ellipse(Math.cos(a)*6,Math.sin(a)*6,5,3.4,a,0,7);fillStroke(g);
  }
  g.fillStyle=shade(col||MIN.verm,30);
  for(let a=0.4;a<6.28;a+=6.28/5){g.beginPath();g.ellipse(Math.cos(a)*3,Math.sin(a)*3,3,2.1,a,0,7);g.fill();}
  inked(g,MIN.gold,1.6);g.beginPath();g.arc(0,0,2.6,0,7);fillStroke(g);
  g.restore();
}

/* flying crane (학) — replaces the gliding birds */
function motifCrane(g,x,y,s,dir,flap){
  g.save();g.translate(x,y);g.scale(dir*s,s);
  inked(g,MIN.white,1.8);
  // body
  g.beginPath();g.ellipse(0,0,9,4,0,0,7);fillStroke(g);
  // long neck + head
  g.beginPath();g.moveTo(7,-1);g.quadraticCurveTo(15,-4,17,-9);g.stroke();
  g.beginPath();g.arc(17,-10,2.2,0,7);fillStroke(g);
  g.strokeStyle=MIN.gold;g.fillStyle=MIN.verm;g.beginPath();g.arc(17,-12,1.1,0,7);g.fill(); // red crown
  g.strokeStyle=MIN.ink;g.fillStyle=MIN.ink;g.beginPath();g.moveTo(19,-10);g.lineTo(23,-9.5);g.lineTo(19,-8.5);g.closePath();g.fill(); // beak
  // wings (flap)
  const fl=(flap||0);
  g.strokeStyle=MIN.ink;g.fillStyle=MIN.white;g.lineWidth=1.8;
  g.beginPath();g.moveTo(-2,-2);g.quadraticCurveTo(-10,-10-fl*5,-18,-6-fl*3);g.quadraticCurveTo(-9,-3,-2,-1);g.closePath();fillStroke(g);
  g.fillStyle=MIN.ink;g.beginPath();g.moveTo(-12,-7-fl*3);g.lineTo(-18,-6-fl*3);g.lineTo(-13,-4);g.closePath();g.fill(); // black wingtip
  // trailing legs
  g.strokeStyle=MIN.ink;g.lineWidth=1.3;g.beginPath();g.moveTo(-8,2);g.lineTo(-16,6);g.stroke();
  g.restore();
}

/* five-peaks backdrop (일월오봉도) — layered ridge of mountains */
function motifPeaks(g,baseY,w){
  const peaks=[ [0.10,46],[0.27,70],[0.5,96],[0.73,70],[0.9,46] ];
  // far indigo range
  inked(g,MIN.blueL,2.2);
  g.beginPath();g.moveTo(0,baseY);
  for(const[fx,ph] of peaks){const px=fx*w; g.lineTo(px-44,baseY); g.lineTo(px,baseY-ph); g.lineTo(px+44,baseY);}
  g.lineTo(w,baseY);g.fill();
  // near jade range, slightly lower & forward
  inked(g,MIN.green,2.2);
  g.beginPath();g.moveTo(0,baseY+8);
  for(const[fx,ph] of peaks){const px=fx*w; g.lineTo(px-40,baseY+8); g.lineTo(px,baseY-ph*0.72); g.lineTo(px+40,baseY+8);}
  g.lineTo(w,baseY+8);fillStroke(g);
  // white snow caps + ridge lines
  g.strokeStyle=MIN.white;g.lineWidth=2;
  for(const[fx,ph] of peaks){const px=fx*w;
    g.beginPath();g.moveTo(px-12,baseY-ph*0.72+12);g.lineTo(px,baseY-ph*0.72);g.lineTo(px+12,baseY-ph*0.72+12);g.stroke();}
}

/* a single curled folk wave unit (drawn at origin, ~28 wide) */
function motifWave(g,x,y,s,fill,crest){
  g.save();g.translate(x,y);g.scale(s,s);
  inked(g,fill,2);
  // the rolling body
  g.beginPath();g.moveTo(-14,4);
  g.quadraticCurveTo(-14,-9,-2,-9);
  g.quadraticCurveTo(10,-9,11,2);
  g.quadraticCurveTo(11,9,4,9);
  g.quadraticCurveTo(0,9,1,4);
  g.quadraticCurveTo(1,0,-3,0);
  g.quadraticCurveTo(-7,0,-7,4);
  g.closePath();fillStroke(g);
  // curling white crest spiral
  g.strokeStyle=crest||MIN.white;g.lineWidth=2;
  g.beginPath();g.arc(-2,-3,4.2,Math.PI*0.1,Math.PI*1.7);g.stroke();
  g.restore();
}

/* dol hareubang — flat folk-art stone grandfather */
function drawHareubang(g,x,y,s){
  g.save();g.translate(x,y);g.scale(s,s);
  g.fillStyle='rgba(20,12,8,.18)';g.beginPath();g.ellipse(0,4,15,4.5,0,0,7);g.fill();
  inked(g,'#6f6a6f',2.6);
  // body
  rr(g,-12,-34,24,38,11);fillStroke(g);
  // hands on belly
  g.fillStyle='#5b565d';g.beginPath();g.ellipse(-5,-9,4,5,.3,0,7);g.ellipse(6,-13,4,5,-.3,0,7);g.fill();
  // head
  inked(g,'#7a757b',2.6);g.beginPath();g.arc(0,-41,12.5,0,7);fillStroke(g);
  // mushroom hat
  inked(g,'#5f5a61',2.6);g.beginPath();g.ellipse(0,-52,14,7,0,0,7);fillStroke(g);
  rr(g,-9,-57,18,8,3);fillStroke(g);
  // nose
  g.fillStyle='#8a848c';g.strokeStyle=MIN.ink;g.lineWidth=2;g.beginPath();g.ellipse(0,-39,3.6,6.5,0,0,7);fillStroke(g);
  // bulging eyes (folk style — big round)
  g.fillStyle=MIN.white;g.beginPath();g.arc(-5.5,-44,3.2,0,7);g.arc(5.5,-44,3.2,0,7);fillStroke(g);
  g.fillStyle=MIN.ink;g.beginPath();g.arc(-5.5,-44,1.4,0,7);g.arc(5.5,-44,1.4,0,7);g.fill();
  // speckle
  const rng=mulberry32(99);g.fillStyle='rgba(20,12,8,.16)';
  for(let i=0;i<16;i++){g.beginPath();g.arc(-10+rng()*20,-32+rng()*32,0.8,0,7);g.fill();}
  g.restore();
}
function drawHareubangFlower(g,x,y,s){
  drawHareubang(g,x,y,s);
  const fx=x, fy=y-14*s; g.save();
  g.strokeStyle=MIN.greenD;g.lineWidth=2*s;g.lineCap='round';
  g.beginPath();g.moveTo(fx,fy+9*s);g.lineTo(fx-2*s,fy-7*s);g.stroke();
  motifPeony(g,fx,fy-6*s,0.52*s,MIN.gold);
  g.fillStyle=MIN.green;g.beginPath();g.ellipse(fx-5*s,fy+3*s,3*s,1.6*s,-.6,0,7);g.ellipse(fx+4*s,fy+4*s,3*s,1.6*s,.6,0,7);g.fill();
  g.restore();
}

/* ===== TIME-OF-DAY (flat wash, paper-being-lit) ===== */
const DAYKEYS=[
  {t:0,    c:[28,38,82,.30]},
  {t:330,  c:[40,50,96,.22]},
  {t:400,  c:[224,128,72,.10]},   // dawn vermilion (gentle)
  {t:470,  c:[244,214,150,.03]},
  {t:660,  c:[247,238,210,.0]},
  {t:1010, c:[247,224,168,.03]},
  {t:1085, c:[224,96,52,.10]},    // dusk
  {t:1170, c:[120,80,120,.20]},
  {t:1320, c:[36,44,92,.30]},
  {t:1440, c:[28,38,82,.30]},
];
function dayWash(t){
  let a=DAYKEYS[0],b=DAYKEYS[DAYKEYS.length-1];
  for(let i=0;i<DAYKEYS.length-1;i++){if(t>=DAYKEYS[i].t&&t<=DAYKEYS[i+1].t){a=DAYKEYS[i];b=DAYKEYS[i+1];break;}}
  const f=(t-a.t)/((b.t-a.t)||1);
  return a.c.map((v,i)=>v+(b.c[i]-v)*f);
}
function nightAmt(t){
  if(t>=415 && t<=1055) return 0;
  if(t<415) return Math.min(1,(415-t)/175);
  return Math.min(1,(t-1055)/185);
}
function applyDayLight(){
  const c=dayWash(G.time);
  ctx.save();
  ctx.fillStyle=`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${c[3]})`;
  ctx.fillRect(0,0,W,H);
  ctx.restore();
}

/* ================= placeholder for caches (defined later use) ============ */
let villageBG=null, shopBG=null, homeBG=null, marketBG=null;

/* ================= LAND ELEMENTS ================= */
function bWindow(b){return {x:b.x+b.w*0.15,y:b.y+b.h*0.40+8};}
function bDoor(b){return {x:b.x+b.w/2,y:b.y+b.h};}

/* low basalt wall — flat stacked folk blocks */
function drawWall(g,x,y,w,h){
  inked(g,'#6e6970',2);
  let cx=x;
  while(cx<x+w){const bw=12+((cx*7)%6);
    g.fillStyle=(((cx/12)|0)%2)?'#6e6970':'#7c777e';
    rr(g,cx+0.6,y,bw-1.2,h,2);fillStroke(g);cx+=bw;}
  g.fillStyle='rgba(20,12,8,.18)';g.fillRect(x,y+h,w,2.5);
}

/* fluffy folk shrub — flat blobs, ink-outlined, with blossoms */
function drawBush(g,x,y,s){
  g.save();
  g.fillStyle='rgba(20,40,24,.16)';g.beginPath();g.ellipse(x,y+9*s,13*s,4.5*s,0,0,7);g.fill();
  inked(g,MIN.green,2.4);
  const blobs=[[-7,2,8],[7,2,8],[0,-5,9.5],[0,3,8.5]];
  g.beginPath();for(const[dx,dy,r] of blobs){g.moveTo(x+(dx+r)*s,y+dy*s);g.arc(x+dx*s,y+dy*s,r*s,0,7);}fillStroke(g);
  g.fillStyle=MIN.greenL;
  for(const[dx,dy,r] of blobs){g.beginPath();g.arc(x+(dx-2)*s,y+(dy-2.5)*s,r*0.45*s,0,7);g.fill();}
  // tangerine dots
  inked(g,MIN.gold,1.4);
  for(const[dx,dy] of [[-5,1],[5,-2],[1,5]]){g.beginPath();g.arc(x+dx*s,y+dy*s,1.9*s,0,7);fillStroke(g);}
  g.restore();
}

/* tall folk tree — single ink-outlined canopy on a trunk */
function drawTree(g,x,y,s){
  g.save();
  g.fillStyle='rgba(20,40,24,.18)';g.beginPath();g.ellipse(x+4*s,y+4*s,22*s,7*s,0,0,7);g.fill();
  inked(g,'#6e4a2a',2.4);g.fillStyle='#7a5230';
  rr(g,x-3*s,y-22*s,6*s,26*s,2);fillStroke(g);
  inked(g,MIN.greenD,2.6);
  const blobs=[[-12,-26,12],[12,-26,12],[0,-36,15],[0,-22,12]];
  g.beginPath();for(const[dx,dy,r] of blobs){g.moveTo(x+(dx+r)*s,y+dy*s);g.arc(x+dx*s,y+dy*s,r*s,0,7);}fillStroke(g);
  g.fillStyle=MIN.green;for(const[dx,dy,r] of blobs){g.beginPath();g.arc(x+dx*s,y+dy*s,r*0.62*s,0,7);g.fill();}
  g.fillStyle=MIN.greenL;for(const[dx,dy,r] of blobs){g.beginPath();g.arc(x+(dx-3)*s,y+(dy-3)*s,r*0.34*s,0,7);g.fill();}
  g.restore();
}

/* upturned tiled roof (기와) with a dancheong colour band */
function drawTiledRoof(g,x,y,w,h,band){
  g.save();
  inked(g,'#46505e',2.6);
  // gently curved roof slab with flaring eaves
  g.beginPath();
  g.moveTo(x-6,y+h);
  g.quadraticCurveTo(x-9,y+h-6,x+2,y+h-6);
  g.lineTo(x+w*0.5-14,y+4);
  g.quadraticCurveTo(x+w*0.5,y-3,x+w*0.5+14,y+4);
  g.lineTo(x+w-2,y+h-6);
  g.quadraticCurveTo(x+w+9,y+h-6,x+w+6,y+h);
  g.closePath();fillStroke(g);
  // ridge tile
  g.fillStyle='#39424d';g.beginPath();
  g.moveTo(x+w*0.5-15,y+4);g.quadraticCurveTo(x+w*0.5,y-4,x+w*0.5+15,y+4);
  g.quadraticCurveTo(x+w*0.5,y+2,x+w*0.5-15,y+4);g.closePath();g.fill();
  // convex tile flutes
  g.strokeStyle='rgba(20,24,30,.55)';g.lineWidth=1.4;
  const n=8;for(let i=1;i<n;i++){const f=i/n;
    const tx=x+w*f, topx=x+w*0.5+(tx-(x+w*0.5))*0.34;
    g.beginPath();g.moveTo(tx,y+h-6);g.lineTo(topx,y+6);g.stroke();}
  g.strokeStyle='rgba(220,228,236,.25)';
  for(let i=1;i<n;i+=2){const f=i/n;const tx=x+w*f+2, topx=x+w*0.5+(tx-(x+w*0.5))*0.34+2;
    g.beginPath();g.moveTo(tx,y+h-6);g.lineTo(topx,y+6);g.stroke();}
  // dancheong band under the eave
  if(band){
    g.fillStyle=band;g.fillRect(x-2,y+h-6,w+4,5);
    g.fillStyle=MIN.green;for(let bx=x;bx<x+w;bx+=14){g.fillRect(bx+2,y+h-5,6,3);}
    g.fillStyle=MIN.blue;for(let bx=x+7;bx<x+w;bx+=14){g.beginPath();g.arc(bx,y+h-3.5,1.6,0,7);g.fill();}
  }
  // round eave end-tiles (막새) with a taegeuk-ish dot
  g.fillStyle='#39424d';g.strokeStyle=MIN.ink;g.lineWidth=1.6;
  for(const ex of [x+2,x+w-2]){g.beginPath();g.arc(ex,y+h-4,4,0,7);fillStroke(g);
    g.fillStyle=MIN.gold;g.beginPath();g.arc(ex,y+h-4,1.6,0,7);g.fill();g.fillStyle='#39424d';}
  g.restore();
}

function drawBuilding(g,b){
  if(b.name==='bulteok'){
    g.save();
    g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(b.x+b.w/2,b.y+b.h/2+6,b.w/2+4,10,0,0,7);g.fill();
    const cx=b.x+b.w/2,cy=b.y+b.h/2;const rng=mulberry32(7);
    inked(g,'#6e6970',2);
    for(let a=0;a<6.28;a+=0.5){const rx=b.w/2,ry=b.h/2;
      const sx=cx+Math.cos(a)*rx,sy=cy+Math.sin(a)*ry,r=5+rng()*2;
      g.fillStyle=shade('#6e6970',(rng()*24-12)|0);g.beginPath();g.arc(sx,sy,r,0,7);fillStroke(g);}
    g.fillStyle='#6b5f54';g.beginPath();g.ellipse(cx,cy,b.w*0.28,b.h*0.26,0,0,7);g.fill();
    g.fillStyle='#2c241e';g.beginPath();g.ellipse(cx,cy,b.w*0.16,b.h*0.15,0,0,7);g.fill();
    g.strokeStyle='#5e3c22';g.lineWidth=3;g.lineCap='round';
    g.beginPath();g.moveTo(cx-8,cy+4);g.lineTo(cx+8,cy-3);g.moveTo(cx-7,cy-4);g.lineTo(cx+9,cy+4);g.stroke();
    g.restore();
    return;
  }
  const x=b.x,y=b.y,w=b.w,h=b.h;
  const wallTop=y+h*0.42, wallH=h*0.58, baseH=wallH*0.40;
  g.save();
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(x+w/2,y+h+4,w*0.56,9,0,0,7);g.fill();
  // whitewashed plaster wall — flat, ink-bordered
  inked(g,MIN.white,2.4);
  g.beginPath();g.rect(x,wallTop,w,wallH);fillStroke(g);
  // basalt foundation band
  g.fillStyle='#6e6970';g.fillRect(x,y+h-baseH,w,baseH);
  g.strokeStyle=MIN.ink;g.lineWidth=2;g.strokeRect(x+1,y+h-baseH,w-2,baseH);
  g.fillStyle='rgba(20,12,8,.18)';for(let i=0;i<14;i++){const rng=((i*53+x)%w);g.beginPath();g.arc(x+rng,y+h-baseH+((i*29)%baseH),1,0,7);g.fill();}
  // window — paper lattice (창호)
  const win=bWindow(b);
  inked(g,'#caa46a',2);rr(g,win.x-1,win.y-1,18,18,2);fillStroke(g);
  g.fillStyle=MIN.paper;g.fillRect(win.x+1,win.y+1,14,14);
  g.strokeStyle='#8a5c33';g.lineWidth=1.2;
  for(let i=1;i<3;i++){g.beginPath();g.moveTo(win.x+1+i*4.6,win.y+1);g.lineTo(win.x+1+i*4.6,win.y+15);
    g.moveTo(win.x+1,win.y+1+i*4.6);g.lineTo(win.x+15,win.y+1+i*4.6);g.stroke();}
  // door — timber plank
  const dw=22,dh=28,dx=x+w/2-dw/2,dy=y+h-dh;
  inked(g,'#7a4f2a',2.2);rr(g,dx,dy,dw,dh,2);fillStroke(g);
  g.strokeStyle='rgba(20,12,8,.4)';g.lineWidth=1.2;g.beginPath();g.moveTo(dx+dw/2,dy+2);g.lineTo(dx+dw/2,dy+dh);g.stroke();
  inked(g,MIN.gold,1.4);g.beginPath();g.arc(dx+dw-6,dy+dh/2,2,0,7);fillStroke(g);
  // tiled roof
  drawTiledRoof(g,x-6,wallTop-h*0.46,w+12,h*0.46+4, b.roof||MIN.red);
  // little banner flag for identity
  if(b.roof && b.name!=='house3'){
    inked(g,b.roof,1.6);
    g.beginPath();g.moveTo(x+w-13,y+2);g.lineTo(x+w-13,y+22);g.stroke();
    g.fillStyle=b.roof;g.beginPath();g.moveTo(x+w-12,y+4);g.lineTo(x+w+6,y+8);g.lineTo(x+w-12,y+12);g.closePath();fillStroke(g);
  }
  g.restore();
}

/* ---- build & cache the static village backdrop ---- */
function buildVillageBG(){
  const {el,g}=makeCanvas(W,SEA_Y);
  // flat malachite-green meadow with a paler upper field
  g.fillStyle=MIN.greenL;g.fillRect(0,0,W,SEA_Y);
  g.fillStyle=MIN.green;g.fillRect(0,SEA_Y*0.46,W,SEA_Y);
  // soft horizon band where land meets the sky
  g.fillStyle=MIN.paper;g.fillRect(0,90,W,18);
  // five-peaks range on the upper field (일월오봉도)
  motifPeaks(g,150,W);
  // a golden sun disc upper-left, white moon mirror upper-right (sun-moon motif)
  inked(g,MIN.verm,2.2);g.beginPath();g.arc(70,70,20,0,7);fillStroke(g);
  inked(g,MIN.white,2);g.beginPath();g.arc(W-64,64,13,0,7);fillStroke(g);
  // stylised field stripes (planted rows)
  g.strokeStyle='rgba(47,107,73,.5)';g.lineWidth=2;
  for(let yy=176;yy<SEA_Y-30;yy+=26){g.beginPath();
    for(let x=0;x<=W;x+=18){g.lineTo(x,yy+Math.sin(x*0.05+yy)*2);}g.stroke();}
  // drifts of peony / blossom across the meadow
  const rng=mulberry32(424);
  const fcol=[MIN.verm,MIN.gold,MIN.plum,MIN.white];
  for(let i=0;i<26;i++){const x=20+rng()*(W-40),y=170+rng()*(SEA_Y-200);
    if(y>248&&y<262)continue;
    motifPeony(g,x,y,0.5+rng()*0.35,fcol[(rng()*fcol.length)|0]);}
  // stone-dust path (warm sand) crossing to the shore
  const path=(x,y,w,h)=>{ inked(g,'#e3c98e',2); rr(g,x,y,w,h,Math.min(8,w/2,h/2));fillStroke(g);
    g.fillStyle='rgba(150,116,64,.14)';for(let i=0;i<w*h/90;i++){g.beginPath();g.arc(x+rng()*w,y+rng()*h,1+rng()*1.2,0,7);g.fill();} };
  path(218,182,44,SEA_Y-182);
  path(76,300,330,28);
  // low stone walls framing fields
  drawWall(g,18,250,150,9);
  drawWall(g,300,250,160,9);
  drawWall(g,18,432,120,9);
  // buildings
  for(const b of buildings) drawBuilding(g,b);
  // statues & foliage
  drawHareubangFlower(g,176,300,1);
  drawHareubang(g,300,300,0.92);
  drawTree(g,108,250,1.05);
  drawTree(g,408,300,0.95);
  drawBush(g,70,288,1.1);
  drawBush(g,300,470,1);
  drawBush(g,420,360,0.9);
  drawBush(g,140,250,0.85);
  // basalt jetty into the sea
  g.fillStyle='#6e6970';g.strokeStyle=MIN.ink;g.lineWidth=2;
  g.beginPath();g.rect(222,SEA_Y-30,36,30);fillStroke(g);
  villageBG=el;
}

/* ---------------- SEA (live, folk waves) ---------------- */
function drawTewak(x,y,t){
  const yy=y+Math.sin(t*1.4+x)*2;
  ctx.fillStyle='rgba(20,12,8,.12)';ctx.beginPath();ctx.ellipse(x,yy+5,12,4,0,0,7);ctx.fill();
  inked(ctx,MIN.verm,2.2);ctx.beginPath();ctx.ellipse(x,yy,12,9,0,0,7);fillStroke(ctx);
  ctx.fillStyle=MIN.white;ctx.beginPath();ctx.ellipse(x-3,yy-3,4,2.5,0,0,7);ctx.fill();
}
function drawSea(){
  const t=performance.now()*0.001;
  // flat indigo sea bands (lighter near shore → deep ultramarine)
  ctx.fillStyle=MIN.blueL;ctx.fillRect(0,SEA_Y,W,(H-SEA_Y)*0.4);
  ctx.fillStyle=MIN.blue;ctx.fillRect(0,SEA_Y+(H-SEA_Y)*0.36,W,H-SEA_Y);
  // tiled rows of curling folk waves
  ctx.save();ctx.beginPath();ctx.rect(0,SEA_Y,W,H-SEA_Y);ctx.clip();
  const rows=[ [SEA_Y+14,MIN.blueL,0.95], [SEA_Y+44,'#3f63a0',1.0], [SEA_Y+80,MIN.blue,1.05] ];
  for(let r=0;r<rows.length;r++){const[yb,fill,sc]=rows[r];
    const off=(t*8*(r+1))% (28*sc);
    for(let x=-30;x<W+30;x+=28*sc){
      motifWave(ctx,x-off+ (r%2?14:0), yb+Math.sin((x)*0.04+t)*2, sc, fill, MIN.white);
    }
  }
  ctx.restore();
  // shoreline foam band
  inked(ctx,MIN.white,2);
  ctx.beginPath();ctx.moveTo(0,SEA_Y);
  for(let x=0;x<=W;x+=14){const y=SEA_Y+Math.sin(x*.12+t*1.8)*3+2;ctx.lineTo(x,y);}
  ctx.lineTo(W,SEA_Y-6);ctx.lineTo(0,SEA_Y-6);ctx.closePath();ctx.fill();
  // wet jetty tip
  ctx.fillStyle='rgba(28,40,72,.55)';ctx.fillRect(224,SEA_Y,32,12);
  // ambient floats
  drawTewak(60,SEA_Y+44,t);drawTewak(410,SEA_Y+70,t+2);drawTewak(150,SEA_Y+96,t+4);
}

/* ---------------- VILLAGE COMPOSE ---------------- */
function drawVillage(){
  if(!villageBG) buildVillageBG();
  ctx.drawImage(villageBG,0,0,W,SEA_Y);
  // drifting auspicious clouds across the sky-meadow
  const tc=performance.now()*0.001;
  ctx.save();ctx.beginPath();ctx.rect(0,40,W,SEA_Y-40);ctx.clip();
  for(let i=0;i<3;i++){const span=W+200, cx=((tc*7*(0.5+i*0.3)+i*200)%span)-100; const cy=120+i*38;
    ctx.globalAlpha=.55;motifCloud(ctx,cx,cy,1+i*0.2,MIN.white,'rgba(42,32,26,.5)');ctx.globalAlpha=1;}
  ctx.restore();
  drawSea();
  // characters
  for(const n of NPCS) drawPerson(n.x,n.y,{skin:n.skin,scarf:n.scarf,face:n.face||1,moving:n.moving,phase:n.anim,idle:n.phase});
  if(scene!=='title') drawPerson(P.x,P.y,{skin:'#eccaa2',scarf:MIN.gold,face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  // flat day/night wash
  applyDayLight();
  const nt=nightAmt(G.time);
  // bulteok fire
  const bt=buildings.find(b=>b.name==='bulteok'); const fc={x:bt.x+bt.w/2,y:bt.y+bt.h/2};
  const flick=0.7+Math.sin(performance.now()*0.012)*0.3;
  const fr=ctx.createRadialGradient(fc.x,fc.y,2,fc.x,fc.y,32+nt*24);
  fr.addColorStop(0,`rgba(255,180,90,${0.4+nt*0.4})`);fr.addColorStop(1,'rgba(255,150,60,0)');
  ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=fr;
  ctx.beginPath();ctx.arc(fc.x,fc.y,(32+nt*24)*flick,0,7);ctx.fill();ctx.restore();
  for(let i=0;i<5;i++){const a=i/5*6.28;const fx=fc.x+Math.cos(a)*4,fy=fc.y+Math.sin(a)*3;
    const fh=8+Math.sin(performance.now()*0.02+i)*4;
    inked(ctx,i%2?MIN.gold:MIN.verm,1.4);ctx.beginPath();
    ctx.moveTo(fx-3,fy+2);ctx.quadraticCurveTo(fx,fy-fh,fx+3,fy+2);ctx.closePath();fillStroke(ctx);}
  ctx.fillStyle='#fff4d0';ctx.beginPath();ctx.arc(fc.x,fc.y-1,2.5,0,7);ctx.fill();
  // warm window glow at night
  if(nt>0.12){
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const b of buildings){ if(b.name==='bulteok')continue;
      const win=bWindow(b);const d=bDoor(b);
      ctx.fillStyle=`rgba(255,200,110,${nt*0.85})`;ctx.fillRect(win.x+1,win.y+1,14,14);
      const g2=ctx.createRadialGradient(win.x+8,win.y+8,2,win.x+8,win.y+8,28);
      g2.addColorStop(0,`rgba(255,196,110,${nt*0.5})`);g2.addColorStop(1,'rgba(255,196,110,0)');
      ctx.fillStyle=g2;ctx.beginPath();ctx.arc(win.x+8,win.y+8,28,0,7);ctx.fill();
      const lg=ctx.createRadialGradient(d.x+13,d.y-20,1,d.x+13,d.y-20,16);
      lg.addColorStop(0,`rgba(255,190,90,${nt*0.7})`);lg.addColorStop(1,'rgba(255,190,90,0)');
      ctx.fillStyle=lg;ctx.beginPath();ctx.arc(d.x+13,d.y-20,16,0,7);ctx.fill();
    }
    ctx.restore();
  }
  // labels
  for(const b of buildings){ if(b.label){ tag(b.en?(b.en+' '+b.label):b.label, b.x+b.w/2, b.y+b.h*0.42-10, 12, MIN.gold); } }
  tag('↓ the sea · 바다', W/2, SEA_Y+30, 13, MIN.gold);
  // flying cranes across the sky
  (function(){const tb=performance.now()*0.001;
    for(let i=0;i<3;i++){
      const span=W+90, bx=((tb*22*(1+i*0.3)+i*180)%span)-45;
      const by=120+i*40+Math.sin(tb*1.1+i)*6;
      const flap=Math.sin(tb*4+i)*0.5+0.5;
      motifCrane(ctx,bx,by,0.9,(i%2?1:-1),flap);
    }})();
  for(const n of NPCS){ tag(n.roman, n.x, n.y-30, 11, MIN.gold);
    const h=hearts(n.id); if(h>0){ctx.fillStyle=MIN.verm;ctx.font='12px serif';ctx.textAlign='center';ctx.fillText('♥'.repeat(h),n.x,n.y-42);} }
}

/* ---------------- PEOPLE (flat folk-art haenyeo) ---------------- */
function drawPerson(x,y,opt){
  const skin=opt.skin||'#eccaa2', scarf=opt.scarf||MIN.verm,
        face=opt.face||1, moving=opt.moving, phase=opt.phase||0, idle=opt.idle||0;
  const modern=opt.modern;
  const TOP=modern?'#2a2a33':MIN.white, HOOD=modern?'#20202a':MIN.white, BOT='#26242c';
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(20,12,8,.22)';ctx.beginPath();ctx.ellipse(0,15,12.5,4.5,0,0,7);ctx.fill();
  const bob=moving?Math.abs(Math.sin(phase))*2:Math.sin(performance.now()*0.002+idle)*0.9;
  ctx.translate(0,-bob);
  ctx.scale(face,1);
  const step=moving?Math.sin(phase):0;
  // legs (dark 물소중이 shorts)
  inked(ctx,BOT,2);
  rr(ctx,-6.5+step*2.4,3,5,12,1.6);fillStroke(ctx); rr(ctx,1.5-step*2.4,3,5,12,1.6);fillStroke(ctx);
  // torso jacket
  inked(ctx,TOP,2.4); rr(ctx,-10,-9,20,18,7);fillStroke(ctx);
  if(!modern){ ctx.fillStyle=MIN.ink;ctx.fillRect(-0.8,-9,1.6,17);
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(2.6,-5+i*4.5,0.9,0,7);ctx.fill();} }
  else { ctx.strokeStyle=MIN.jade;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.stroke(); }
  // colored waist sash (per-NPC accent)
  inked(ctx,scarf,1.6);rr(ctx,-10,5,20,4,2);fillStroke(ctx);
  // sleeves + skin hands
  inked(ctx,TOP,2);rr(ctx,-13,-6,5,12,2.5);fillStroke(ctx); rr(ctx,8,-6,5,12,2.5);fillStroke(ctx);
  ctx.fillStyle=skin;ctx.strokeStyle=MIN.ink;ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(-10.5,7,2.6,0,7);fillStroke(ctx);ctx.beginPath();ctx.arc(10.5,7,2.6,0,7);fillStroke(ctx);
  // head
  ctx.fillStyle=skin;ctx.strokeStyle=MIN.ink;ctx.lineWidth=1.4;ctx.fillRect(-3,-14,6,5);
  inked(ctx,skin,2);ctx.beginPath();ctx.arc(0,-18,8.6,0,7);fillStroke(ctx);
  // cotton hood framing the face
  inked(ctx,HOOD,2.2);
  ctx.beginPath();ctx.arc(0,-19,9.6,Math.PI*0.92,Math.PI*0.08,true);ctx.lineTo(9.6,-15);
  ctx.quadraticCurveTo(0,-12.5,-9.6,-15);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle=scarf;ctx.fillRect(-9.3,-26.5,18.6,3);
  // round red goggles (왕눈) pushed up on the forehead
  ctx.fillStyle='rgba(150,210,235,.55)';ctx.beginPath();ctx.arc(-3.4,-23,2.7,0,7);ctx.arc(3.4,-23,2.7,0,7);ctx.fill();
  ctx.strokeStyle=MIN.verm;ctx.lineWidth=1.9;ctx.beginPath();ctx.arc(-3.4,-23,3,0,7);ctx.arc(3.4,-23,3,0,7);ctx.stroke();
  ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-0.6,-23.2);ctx.lineTo(0.6,-23.2);ctx.stroke();
  // face — folk dot eyes, rosy cheeks, tiny smile
  ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(-2.4,-17.5,1.5,0,7);ctx.arc(3.2,-17.5,1.5,0,7);ctx.fill();
  ctx.fillStyle='rgba(214,80,47,.5)';ctx.beginPath();ctx.arc(-4.8,-15.2,2.1,0,7);ctx.arc(5.4,-15,2.1,0,7);ctx.fill();
  ctx.strokeStyle='rgba(120,50,40,.7)';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(0.6,-15,2.4,.25,Math.PI-.25);ctx.stroke();
  ctx.restore();
}

/* ---------------- SHOP INTERIOR ---------------- */
function buildShopBG(){
  const {el,g}=makeCanvas(W,H);
  // warm timber floor
  paperFill(g,0,90,W,H-90,'#caa066');
  g.strokeStyle='rgba(60,36,12,.28)';g.lineWidth=2;
  for(let y=120;y<H;y+=30){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  // back wall — paper with a dancheong rail
  g.fillStyle=MIN.paper;g.fillRect(0,90,W,68);
  g.fillStyle=MIN.greenD;g.fillRect(0,150,W,8);
  g.fillStyle=MIN.red;for(let x=0;x<W;x+=22){g.fillRect(x,151,11,6);}
  g.fillStyle=MIN.gold;for(let x=11;x<W;x+=22){g.beginPath();g.arc(x,154,2,0,7);g.fill();}
  // hanging shelves
  inked(g,'#6e4a2a',2.4);g.fillStyle='#7a5230';
  g.beginPath();g.rect(40,116,124,8);fillStroke(g);g.beginPath();g.rect(318,116,124,8);fillStroke(g);
  // counter — lacquered wood
  const c=counter;
  inked(g,'#5e3c22',2.6);rr(g,c.x,c.y,c.w,c.h,5);fillStroke(g);
  g.fillStyle='#7a5230';g.fillRect(c.x,c.y,c.w,7);
  g.strokeStyle='rgba(20,12,8,.3)';g.lineWidth=1;
  for(let x=c.x+18;x<c.x+c.w;x+=40){g.beginPath();g.moveTo(x,c.y+9);g.lineTo(x,c.y+c.h);g.stroke();}
  // exit mat
  inked(g,'#d8c089',2);g.setLineDash([4,3]);rr(g,exitZone.x,exitZone.y,exitZone.w,exitZone.h,5);fillStroke(g);g.setLineDash([]);
  // a paper lantern (청사초롱-ish)
  g.strokeStyle=MIN.ink;g.lineWidth=1.4;g.beginPath();g.moveTo(W/2,90);g.lineTo(W/2,104);g.stroke();
  inked(g,MIN.white,2);rr(g,W/2-12,104,24,20,8);fillStroke(g);
  g.fillStyle=MIN.blue;g.fillRect(W/2-12,104,24,4);g.fillStyle=MIN.verm;g.fillRect(W/2-12,120,24,4);
  shopBG=el;
}
function drawShopIcon(kind,x,y){
  ctx.save();
  if(kind==='wetsuit'){
    inked(ctx,'#4a3a2a',2);ctx.fillRect(x-2,y+4,4,26);
    inked(ctx,MIN.teal,2.4);rr(ctx,x-12,y-22,24,34,11);fillStroke(ctx);
    ctx.fillStyle=MIN.verm;ctx.fillRect(x-12,y-8,24,4);
    ctx.fillStyle='rgba(180,235,255,.6)';ctx.beginPath();ctx.arc(x,y-14,4.5,0,7);ctx.fill();
    ctx.fillStyle=shade(MIN.teal,-30);ctx.fillRect(x-9,y+12,7,16);ctx.fillRect(2+x-9,y+12,7,16);
  } else {
    inked(ctx,'#6e4a2a',2);ctx.fillRect(x-2,y+6,4,22);
    ctx.strokeStyle=MIN.gold;ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(x,y-6,13,0,Math.PI*2);ctx.stroke();
    inked(ctx,MIN.verm,2);ctx.beginPath();ctx.arc(x,y-6,13,0,Math.PI);fillStroke(ctx);
    ctx.strokeStyle='rgba(244,236,217,.85)';ctx.lineWidth=1;
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(x+i*5,y-2);ctx.lineTo(x+i*6,y+18);ctx.stroke();}
    for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(x-11,y+2+j*5);ctx.lineTo(x+11,y+2+j*5);ctx.stroke();}
  }
  ctx.restore();
}
function drawShop(){
  if(!shopBG) buildShopBG();
  ctx.drawImage(shopBG,0,0,W,H);
  drawShopIcon('wetsuit',74,104);drawShopIcon('wetsuit',118,104);
  drawShopIcon('net',360,106);drawShopIcon('net',406,106);
  drawPerson(keeper.x,keeper.y,{skin:keeper.skin,scarf:keeper.scarf,idle:1.3});
  // display stands
  ctx.fillStyle='#6e4a2a';ctx.beginPath();ctx.ellipse(standW.x,standW.y+30,18,5,0,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(standN.x,standN.y+30,18,5,0,0,7);ctx.fill();
  drawShopIcon('wetsuit',standW.x,standW.y);
  drawShopIcon('net',standN.x,standN.y);
  drawPerson(P.x,P.y,{skin:'#eccaa2',scarf:MIN.gold,face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  // warm interior wash
  ctx.save();ctx.fillStyle='rgba(255,210,150,.06)';ctx.fillRect(0,0,W,H);
  const lg=ctx.createRadialGradient(W/2,118,8,W/2,118,200);lg.addColorStop(0,'rgba(255,210,130,.16)');lg.addColorStop(1,'rgba(255,210,130,0)');
  ctx.globalCompositeOperation='screen';ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);ctx.restore();
  tag(keeper.roman, keeper.x, keeper.y-30, 11, MIN.gold);
  tag('Wetsuit 잠수복 · '+(G.owned.modern?'owned':SUITS.modern.cost+' won'), standW.x, standW.y+46, 11, MIN.gold);
  tag('Net 망사리 · Lv'+(G.netIdx+1), standN.x, standN.y+46, 11, MIN.gold);
  tag('← out · 나가기', exitZone.x+exitZone.w/2, exitZone.y+exitZone.h/2, 11, MIN.gold);
}

/* ---------------- CO-OP MARKET (수산시장) ---------------- */
function drawCrate(g,x,y,w,h,col,kind){
  inked(g,MIN.blue,1.8);rr(g,x-2,y-2,w+4,h+4,3);fillStroke(g);
  g.fillStyle=col;rr(g,x,y,w,h,3);g.fill();
  if(kind==='fish'){
    for(let i=0;i<Math.max(3,(w*h)/120);i++){const fx=x+5+((i*13)%(w-10)),fy=y+4+((i*7)%(h-8));
      inked(g,i%2?'#cdd6dd':'#aeb8c2',1.2);g.beginPath();g.ellipse(fx,fy,5,2.4,(i%3)*0.5,0,7);fillStroke(g);
      g.fillStyle=MIN.ink;g.beginPath();g.arc(fx-3.6,fy-0.5,0.7,0,7);g.fill();}
  } else if(kind==='greens'){
    for(let i=0;i<Math.max(4,(w*h)/90);i++){const fx=x+4+((i*11)%(w-8)),fy=y+3+((i*9)%(h-6));
      inked(g,i%2?MIN.greenD:MIN.green,1.2);g.beginPath();g.ellipse(fx,fy,3.4,5,(i%3)*0.4,0,7);fillStroke(g);}
  } else if(kind==='chili'){
    for(let i=0;i<Math.max(5,(w*h)/70);i++){const fx=x+3+((i*9)%(w-6)),fy=y+3+((i*13)%(h-6));
      inked(g,i%2?MIN.red:MIN.verm,1.1);g.beginPath();g.ellipse(fx,fy,2,4,(i%4)*0.5,0,7);fillStroke(g);}
  } else {
    for(let i=0;i<Math.max(4,(w*h)/110);i++){const fx=x+5+((i*12)%(w-10)),fy=y+5+((i*8)%(h-10));
      inked(g,MIN.gold,1.2);g.beginPath();g.arc(fx,fy,4,0,7);fillStroke(g);
      g.fillStyle=MIN.greenD;g.beginPath();g.arc(fx,fy-3.6,1,0,7);g.fill();}
  }
}
function drawHangSign(g,x,y,w,col,txt){
  g.strokeStyle=MIN.ink;g.lineWidth=1.4;g.beginPath();g.moveTo(x+6,y-10);g.lineTo(x+6,y);g.moveTo(x+w-6,y-10);g.lineTo(x+w-6,y);g.stroke();
  inked(g,col,2);rr(g,x,y,w,16,2);fillStroke(g);
  g.fillStyle=MIN.gold;
  for(let i=0;i<Math.floor(w/9);i++){g.fillRect(x+6+i*9,y+5,5,6);}
}
function buildMarketBG(){
  const {el,g}=makeCanvas(W,H);
  // wet stone aisle floor
  paperFill(g,0,150,W,H-150,'#9aa0a2');
  g.save();g.globalAlpha=.5;
  const sh=g.createLinearGradient(W/2-60,0,W/2+60,0);sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.5,'rgba(220,235,245,.2)');sh.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=sh;g.fillRect(W/2-70,150,140,H-150);g.restore();
  // side stalls with stacked crates
  for(const side of [-1,1]){
    const baseX = side<0 ? MARKET.x0 : MARKET.x1-40;
    inked(g,'#6e4a2a',2.2);g.fillStyle='#7a5230';g.beginPath();g.rect(baseX,150,40,420);fillStroke(g);
    const items=[['fish','#3a4d5e'],['greens','#3a5a2c'],['chili','#6a241a'],['citrus','#7a5512'],['fish','#3a4d5e'],['greens','#3a5a2c']];
    for(let r=0;r<6;r++){const cy=168+r*64; const cx=baseX+4;
      drawCrate(g,cx,cy,32,30,items[r][1],items[r][0]);
      if(r%2===0)drawCrate(g,cx+2,cy-12,28,14,items[(r+2)%6][1],items[(r+2)%6][0]);
    }
  }
  // central seafood counter with ice
  const c=sellCounter;
  inked(g,'#5e3c22',2.6);rr(g,c.x,c.y,c.w,c.h,5);fillStroke(g);
  g.fillStyle='#7a5230';g.fillRect(c.x,c.y,c.w,7);
  g.fillStyle='#dfeaf0';rr(g,c.x+10,c.y+9,c.w-20,18,4);g.fill();
  g.fillStyle='#c7d6df';for(let i=0;i<40;i++){g.beginPath();g.arc(c.x+16+i*((c.w-30)/40),c.y+18+((i%3)-1)*3,1.6,0,7);g.fill();}
  // back facade
  g.fillStyle=MIN.paper;g.fillRect(0,86,W,64);
  g.fillStyle='#6e6970';g.fillRect(0,140,W,12);
  // roof beam band
  g.fillStyle='#3a4750';g.fillRect(0,0,W,86);
  g.fillStyle=MIN.greenD;g.fillRect(0,78,W,8);
  g.fillStyle=MIN.gold;for(let x=6;x<W;x+=20){g.beginPath();g.arc(x,82,2,0,7);g.fill();}
  g.strokeStyle='rgba(20,28,34,.5)';g.lineWidth=2;
  for(let x=30;x<W;x+=80){g.beginPath();g.moveTo(x,0);g.lineTo(x,78);g.stroke();}
  // hanging signboards
  drawHangSign(g,60,92,90,MIN.teal);drawHangSign(g,200,90,110,MIN.plum);drawHangSign(g,340,94,80,MIN.greenD);
  // festoon string
  g.strokeStyle='rgba(60,50,30,.5)';g.lineWidth=1.2;g.beginPath();
  for(let x=0;x<=W;x+=8){g.lineTo(x,120+Math.sin(x*0.05)*5);}g.stroke();
  // exit mat
  inked(g,'#d8c089',2);g.setLineDash([4,3]);rr(g,marketExit.x,marketExit.y,marketExit.w,marketExit.h,5);fillStroke(g);g.setLineDash([]);
  marketBG=el;
}
function drawMarket(){
  if(!marketBG) buildMarketBG();
  ctx.drawImage(marketBG,0,0,W,H);
  const t=performance.now()*0.001;
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<14;i++){const x=18+i*32, y=120+Math.sin(x*0.05)*5+3;
    const a=0.5+0.3*Math.sin(t*2+i);
    ctx.fillStyle=`rgba(255,210,120,${a})`;ctx.beginPath();ctx.arc(x,y,2.4,0,7);ctx.fill();}
  ctx.restore();
  ctx.fillStyle=MIN.gold;for(let i=0;i<14;i++){const x=18+i*32, y=120+Math.sin(x*0.05)*5+3;ctx.beginPath();ctx.arc(x,y,1.4,0,7);ctx.fill();}
  const c=sellCounter;
  for(let i=0;i<6;i++){const fx=c.x+24+i*((c.w-48)/5), fy=c.y+18;
    inked(ctx,i%2?'#9c6b3a':'#b5563a',1.4);ctx.beginPath();ctx.ellipse(fx,fy,9,4.4,(i%2?0.3:-0.3),0,7);fillStroke(ctx);
    ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(fx-6,fy-1,1,0,7);ctx.fill();}
  // red octopus centrepiece
  inked(ctx,MIN.verm,1.8);ctx.beginPath();ctx.arc(c.x+c.w/2,c.y+16,7,Math.PI,0);ctx.lineTo(c.x+c.w/2+7,c.y+20);ctx.quadraticCurveTo(c.x+c.w/2,c.y+24,c.x+c.w/2-7,c.y+20);ctx.closePath();fillStroke(ctx);
  drawPerson(vendor.x,vendor.y,{skin:vendor.skin,scarf:vendor.scarf,face:1,idle:0.6});
  drawPerson(P.x,P.y,{skin:'#eccaa2',scarf:MIN.gold,face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  ctx.save();ctx.globalCompositeOperation='screen';
  const sun=ctx.createLinearGradient(0,86,0,420);sun.addColorStop(0,'rgba(210,235,245,.1)');sun.addColorStop(1,'rgba(210,235,245,0)');
  ctx.fillStyle=sun;ctx.fillRect(W/2-90,86,180,360);ctx.restore();
  tag(vendor.roman, vendor.x, vendor.y-30, 11, MIN.gold);
  tag('Sell 팔기', sellStation.x, sellStation.y+8, 11, MIN.gold);
  tag('← out · 나가기', marketExit.x+marketExit.w/2, marketExit.y+marketExit.h/2, 11, MIN.gold);
}

/* ---------------- HOME INTERIOR ---------------- */
function drawStoneBlocks(g,x,y,w,h,seed){
  const rng=mulberry32(seed||((x*31+y*7)|0));
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  g.fillStyle='#6e6970';g.fillRect(x,y,w,h);
  const rowH=h/Math.max(2,Math.round(h/16));
  g.strokeStyle=MIN.ink;g.lineWidth=1.6;
  for(let ry=y;ry<y+h;ry+=rowH){
    let cx=x - rng()*14;
    while(cx<x+w){
      const bw=16+rng()*18, bh=rowH-2;
      const v=104+rng()*22|0;
      g.fillStyle=`rgb(${v},${v-3},${v+5})`;
      rr(g,cx+1.5,ry+1.5,bw-3,bh-3,3);g.fill();g.stroke();
      g.fillStyle='rgba(20,12,8,.2)';
      for(let k=0;k<4;k++){g.beginPath();g.arc(cx+3+rng()*(bw-6),ry+3+rng()*(bh-6),0.7+rng()*1.1,0,7);g.fill();}
      cx+=bw;
    }
  }
  g.restore();
}
// painted folding screen (병풍) back wall with crane + peony panels
function drawScreen(g){
  g.fillStyle=MIN.paper;g.fillRect(0,0,W,92);
  // panel divisions
  const panels=6, pw=W/panels;
  for(let i=0;i<panels;i++){
    const px=i*pw;
    g.fillStyle=i%2?'#efe2c4':'#e8d8b4';g.fillRect(px,8,pw-2,82);
    g.strokeStyle='#8a5c33';g.lineWidth=2;g.strokeRect(px+1,8,pw-3,82);
  }
  g.fillStyle='#6e4a2a';g.fillRect(0,4,W,5);g.fillStyle='#6e4a2a';g.fillRect(0,88,W,5);
  // motifs scattered across the screen
  motifPeony(g,pw*0.5,52,0.8,MIN.verm);
  motifCrane(g,pw*1.5,46,0.9,1,0.4);
  motifPeony(g,pw*2.5,54,0.7,MIN.gold);
  motifCloud(g,pw*3.5,48,0.9,MIN.blueL,'rgba(42,32,26,.5)');
  motifPeony(g,pw*4.5,52,0.8,MIN.plum);
  motifCrane(g,pw*5.5,48,0.9,-1,0.3);
}
function drawKettle(g,x,y){
  inked(g,'#2a2a2e',2);rr(g,x-13,y+4,26,9,3);fillStroke(g);
  inked(g,MIN.verm,2.4);rr(g,x-12,y-12,24,18,6);fillStroke(g);
  g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.ellipse(x-5,y-6,4,6,-.5,0,7);g.fill();
  inked(g,MIN.red,2);rr(g,x-9,y-16,18,5,2.5);fillStroke(g);
  g.fillStyle=MIN.ink;g.beginPath();g.arc(x,y-18,2,0,7);g.fill();
  g.strokeStyle=MIN.ink;g.lineWidth=2.4;g.lineCap='round';g.beginPath();g.arc(x,y-13,8,Math.PI+0.4,-0.4);g.stroke();
  g.fillStyle=MIN.red;g.strokeStyle=MIN.ink;g.lineWidth=1.6;g.beginPath();g.moveTo(x+11,y-6);g.lineTo(x+18,y-9);g.lineTo(x+12,y-2);g.closePath();fillStroke(g);
}
function drawChair(g,x,y,col){
  g.fillStyle='rgba(20,12,8,.14)';g.beginPath();g.ellipse(x,y+10,11,4,0,0,7);g.fill();
  inked(g,col,2);rr(g,x-9,y-4,18,12,3);fillStroke(g);
  g.fillStyle=shade(col,-22);rr(g,x-9,y-16,18,6,2);g.fill();g.stroke();
  g.fillStyle=shade(col,-30);g.fillRect(x-8,y+6,3,8);g.fillRect(x+5,y+6,3,8);
}
function drawRamenBowl(g,x,y){
  g.fillStyle='rgba(20,12,8,.2)';g.beginPath();g.ellipse(x,y+11,23,6,0,0,7);g.fill();
  g.strokeStyle='#9c6a2e';g.lineWidth=2.6;g.lineCap='round';
  g.beginPath();g.moveTo(x-20,y-2);g.lineTo(x-27,y-4);g.moveTo(x+20,y-2);g.lineTo(x+27,y-4);g.stroke();
  g.fillStyle=MIN.gold;g.beginPath();g.arc(x-28,y-4,2.2,0,7);g.arc(x+28,y-4,2.2,0,7);g.fill();
  // aluminium pot body, ink-outlined
  inked(g,'#b8bec4',2.4);g.beginPath();g.moveTo(x-20,y-6);g.quadraticCurveTo(x,y+16,x+20,y-6);g.closePath();fillStroke(g);
  g.strokeStyle='#6f767d';g.lineWidth=2.8;g.beginPath();g.moveTo(x-20,y-6);g.quadraticCurveTo(x,y+1,x+20,y-6);g.stroke();
  // spicy broth
  g.fillStyle=MIN.verm;g.beginPath();g.ellipse(x,y-6,18,5.4,0,0,7);g.fill();
  g.fillStyle=MIN.red;g.beginPath();g.ellipse(x,y-4.6,18,4,0,0,7);g.fill();
  // noodle loops
  g.strokeStyle=MIN.gold;g.lineWidth=1.8;g.lineCap='round';
  for(let i=0;i<6;i++){g.beginPath();g.arc(x-11+i*4.2,y-7.5,2.7,0.05,Math.PI-0.05);g.stroke();}
  // egg
  inked(g,MIN.white,1.4);g.beginPath();g.ellipse(x-8,y-7,4.6,3.3,-0.2,0,7);fillStroke(g);
  g.fillStyle=MIN.gold;g.beginPath();g.arc(x-8,y-7,2,0,7);g.fill();
  // scallion + chili
  g.fillStyle=MIN.greenD;for(const[dx,dy]of[[4,-9],[9,-6],[2,-5],[12,-8]]){g.beginPath();g.arc(x+dx,y+dy,1.3,0,7);g.fill();}
  g.fillStyle=MIN.red;for(const[dx,dy]of[[-3,-5],[6,-4],[-12,-6]]){g.beginPath();g.arc(x+dx,y+dy,0.7,0,7);g.fill();}
  // chopsticks
  g.strokeStyle='#9c6a3a';g.lineWidth=1.9;g.lineCap='round';
  g.beginPath();g.moveTo(x+8,y-10);g.lineTo(x+22,y-21);g.moveTo(x+11,y-9);g.lineTo(x+25,y-20);g.stroke();
}
function drawBedMat(g,x,y){
  g.fillStyle='rgba(20,12,8,.14)';g.beginPath();g.ellipse(x,y+24,42,10,0,0,7);g.fill();
  inked(g,'#e7d3a8',2.2);rr(g,x-44,y-14,88,40,9);fillStroke(g);
  // folk quilt — red field with gold band + white dots
  inked(g,MIN.red,2);rr(g,x-42,y-2,84,26,7);fillStroke(g);
  g.fillStyle=MIN.gold;g.fillRect(x-42,y+8,84,4);
  g.fillStyle=MIN.white;for(const dx of [-28,-9,11,30]){g.beginPath();g.arc(x+dx,y+16,2.3,0,7);g.fill();}
  inked(g,MIN.white,1.6);rr(g,x-40,y-12,28,15,5);fillStroke(g);
  g.fillStyle=MIN.verm;g.beginPath();g.arc(x-26,y-4,2.6,0,7);g.fill();
}
function buildHomeBG(){
  const {el,g}=makeCanvas(W,H);
  // warm paper floor
  paperFill(g,0,150,W,H-150,'#d8c79c');
  g.strokeStyle='rgba(120,90,45,.18)';g.lineWidth=1;
  for(let i=0;i<5;i++){const yy=210+i*90;g.beginPath();g.moveTo(0,yy);for(let x=0;x<=W;x+=24)g.lineTo(x,yy+Math.sin(x*.03+i)*4);g.stroke();}
  // ---- painted folding screen back wall ----
  drawScreen(g);
  // shelf with celadon jars
  g.fillStyle='#3a2c1c';g.fillRect(40,118,W-200,4);
  const jarcol=[MIN.jade,MIN.blue,MIN.verm,MIN.jade,MIN.greenD,MIN.gold];
  for(let i=0;i<6;i++){const jx=64+i*40;inked(g,jarcol[i],1.6);rr(g,jx-5,104,10,12,3);fillStroke(g);}
  // ---- glass / paper sliding door (right) ----
  inked(g,'#5e3c24',2.2);g.beginPath();g.rect(404,92,40,72);fillStroke(g);
  g.fillStyle='#cfe7df';g.fillRect(408,96,32,64);
  g.fillStyle=MIN.greenL;g.fillRect(408,140,32,20);
  g.strokeStyle='#8a5c33';g.lineWidth=1.4;g.beginPath();g.moveTo(424,96);g.lineTo(424,160);g.moveTo(408,128);g.lineTo(440,128);g.stroke();
  // ---- wooden entry door (left of glass) ----
  inked(g,'#7a4f2a',2.2);g.beginPath();g.rect(330,92,56,72);fillStroke(g);
  g.strokeStyle='rgba(20,12,8,.4)';g.lineWidth=1.4;for(let i=1;i<3;i++){g.beginPath();g.moveTo(330+i*18.6,92);g.lineTo(330+i*18.6,164);g.stroke();}
  inked(g,MIN.gold,1.4);g.beginPath();g.arc(336,130,2.2,0,7);fillStroke(g);
  // ---- kitchen island: stone base + counter ----
  const is=homeIsland;
  g.fillStyle='rgba(20,12,8,.2)';g.beginPath();g.ellipse(is.x+is.w/2,is.y+is.h+6,is.w*0.55,11,0,0,7);g.fill();
  drawStoneBlocks(g,is.x,is.y+12,is.w,is.h-12,71);
  inked(g,'#9c7338',2.2);rr(g,is.x-6,is.y,is.w+12,16,4);fillStroke(g);
  // ---- dining table + chairs ----
  const tb=homeTable;
  drawChair(g,tb.x-2,tb.y+8,'#8a5a32'); drawChair(g,tb.x-2,tb.y+40,'#6e4a2a');
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(tb.x+tb.w/2,tb.y+tb.h+4,tb.w*0.5,8,0,0,7);g.fill();
  inked(g,'#9c7340',2.4);rr(g,tb.x,tb.y,tb.w,tb.h,7);fillStroke(g);
  g.strokeStyle='rgba(50,30,12,.25)';g.lineWidth=1;for(let i=1;i<4;i++){g.beginPath();g.moveTo(tb.x+4,tb.y+i*tb.h/4);g.lineTo(tb.x+tb.w-4,tb.y+i*tb.h/4);g.stroke();}
  drawChair(g,tb.x+tb.w+8,tb.y+8,'#8a5a32'); drawChair(g,tb.x+tb.w+8,tb.y+40,'#6e4a2a');
  inked(g,MIN.jade,2);rr(g,tb.x+tb.w/2-12,tb.y+18,24,16,6);fillStroke(g);
  inked(g,MIN.white,1.4);g.beginPath();g.arc(tb.x+18,tb.y+30,4.5,0,7);fillStroke(g);g.beginPath();g.arc(tb.x+tb.w-18,tb.y+30,4.5,0,7);fillStroke(g);
  // ---- stone bench foreground ----
  drawStoneBlocks(g,28,584,150,40,222);
  inked(g,'#2f3038',2);rr(g,24,576,158,14,5);fillStroke(g);
  // ---- exit mat ----
  inked(g,'#d8c089',2);g.setLineDash([4,3]);rr(g,homeExit.x,homeExit.y,homeExit.w,homeExit.h,5);fillStroke(g);g.setLineDash([]);
  homeBG=el;
}
function drawHome(){
  if(!homeBG) buildHomeBG();
  ctx.drawImage(homeBG,0,0,W,H);
  const t=performance.now()*0.001;
  // kettle + steam + burner glow
  drawKettle(ctx,stoveStation.x,homeIsland.y+2);
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<3;i++){const ph=t*1.3+i*2.1; const sy=homeIsland.y-10-((ph*9)%28);
    const sx=stoveStation.x+8+Math.sin(ph*1.6)*5; const a=0.16*(1-((ph*9)%28)/28);
    ctx.fillStyle=`rgba(255,250,240,${Math.max(0,a)})`;ctx.beginPath();ctx.arc(sx,sy,4+i,0,7);ctx.fill();}
  const fg=ctx.createRadialGradient(stoveStation.x,homeIsland.y+6,1,stoveStation.x,homeIsland.y+6,20);
  fg.addColorStop(0,'rgba(255,140,60,.4)');fg.addColorStop(1,'rgba(255,140,60,0)');
  ctx.fillStyle=fg;ctx.beginPath();ctx.arc(stoveStation.x,homeIsland.y+6,20,0,7);ctx.fill();
  ctx.restore();
  // sleeping mat
  drawBedMat(ctx,bedStation.x,bedStation.y);
  // wardrobe / changing armoire
  (function(wx,wy){
    ctx.save();
    ctx.fillStyle='rgba(20,12,8,.18)';ctx.beginPath();ctx.ellipse(wx,wy+38,40,9,0,0,7);ctx.fill();
    inked(ctx,'#6e4a2a',2.4);rr(ctx,wx-38,wy-44,76,82,5);fillStroke(ctx);
    ctx.fillStyle='#3a2716';rr(ctx,wx-30,wy-36,60,66,3);ctx.fill();
    ctx.strokeStyle=MIN.gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(wx-28,wy-30);ctx.lineTo(wx+28,wy-30);ctx.stroke();
    // traditional suit
    inked(ctx,MIN.white,1.6);rr(ctx,wx-25,wy-26,20,20,3);fillStroke(ctx);
    inked(ctx,'#26242c',1.6);rr(ctx,wx-25,wy-8,20,22,3);fillStroke(ctx);
    // modern wetsuit (greyed if not owned)
    ctx.globalAlpha=(typeof G!=='undefined'&&G.owned&&G.owned.modern)?1:0.4;
    inked(ctx,'#26252e',1.6);rr(ctx,wx+5,wy-26,20,40,3);fillStroke(ctx);
    ctx.strokeStyle=MIN.jade;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(wx+15,wy-24);ctx.lineTo(wx+15,wy+10);ctx.stroke();
    ctx.globalAlpha=1;
    inked(ctx,'#9c7338',1.6);rr(ctx,wx-50,wy+18,20,14,3);fillStroke(ctx);
    ctx.fillStyle=MIN.white;rr(ctx,wx-49,wy+15,18,5,2);ctx.fill();
    ctx.restore();
  })(wardrobeStation.x,wardrobeStation.y);
  // plated ramyeon waiting on the table
  if(G.preparedMeal && scene!=='eating'){
    const bx=homeTable.x+homeTable.w/2, by=homeTable.y+36;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<3;i++){const ph=t*1.3+i*2.0; const sy=by-12-((ph*8)%24);
      const sx=bx+Math.sin(ph*1.7)*4; const a=0.14*(1-((ph*8)%24)/24);
      ctx.fillStyle=`rgba(255,250,240,${Math.max(0,a)})`;ctx.beginPath();ctx.arc(sx,sy,3+i,0,7);ctx.fill();}
    ctx.restore();
    drawRamenBowl(ctx,bx,by);
  }
  drawPerson(P.x,P.y,{skin:'#eccaa2',scarf:MIN.gold,face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  // cozy warm wash
  ctx.save();ctx.fillStyle='rgba(255,196,120,.06)';ctx.fillRect(0,0,W,H);ctx.restore();
  tag('Stove 라면', stoveStation.x, homeIsland.y-28, 11, MIN.gold);
  tag('Sleep 잠자리', bedStation.x, bedStation.y-26, 11, MIN.gold);
  tag('Change 옷 · '+(G.suit==='modern'?'wetsuit':'물옷'), wardrobeStation.x, wardrobeStation.y-54, 11, MIN.gold);
  tag('← outside · 나가기', homeExit.x+homeExit.w/2, homeExit.y+homeExit.h/2, 11, MIN.gold);
}
function drawEat(){
  drawHome();
  const t=performance.now()*0.001;
  const bx=homeTable.x+homeTable.w/2, by=homeTable.y+30;
  ctx.save();ctx.fillStyle='rgba(20,16,10,.3)';ctx.fillRect(0,0,W,H);ctx.restore();
  ctx.save();ctx.globalCompositeOperation='screen';
  const sp=ctx.createRadialGradient(bx,by,8,bx,by,150);sp.addColorStop(0,'rgba(255,212,134,.28)');sp.addColorStop(1,'rgba(255,212,134,0)');
  ctx.fillStyle=sp;ctx.beginPath();ctx.arc(bx,by,150,0,7);ctx.fill();ctx.restore();
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<4;i++){const ph=t*1.3+i*1.6;const sy=by-14-((ph*9)%26);const sx=bx+Math.sin(ph*1.6)*5;const a=0.16*(1-((ph*9)%26)/26);
    ctx.fillStyle=`rgba(255,250,240,${Math.max(0,a)})`;ctx.beginPath();ctx.arc(sx,sy,4+i,0,7);ctx.fill();}
  ctx.restore();
  drawRamenBowl(ctx,bx,by);
  const cyc=(Math.sin(eatT*5)*0.5+0.5);
  const mouthX=P.x+6, mouthY=P.y-22;
  const clumpX=bx+(mouthX-bx)*cyc, clumpY=(by-6)+(mouthY-(by-6))*cyc;
  ctx.strokeStyle=MIN.gold;ctx.lineWidth=1.6;ctx.lineCap='round';
  for(let s=-1;s<=1;s++){ctx.beginPath();ctx.moveTo(bx+s*3,by-4);ctx.quadraticCurveTo(clumpX+s*2,(by-4+clumpY)/2,clumpX+s*2,clumpY);ctx.stroke();}
  ctx.strokeStyle='#9c6a3a';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(clumpX+10,clumpY-12);ctx.lineTo(clumpX-2,clumpY+2);ctx.moveTo(clumpX+13,clumpY-11);ctx.lineTo(clumpX+1,clumpY+3);ctx.stroke();
  if(cyc>0.8){
    glabel('냠냠',mouthX+16,mouthY-4,13,'#fff');
    ctx.fillStyle=MIN.verm;ctx.font='12px serif';ctx.textAlign='center';
    const hy=mouthY-14-((eatT*30)%26);ctx.globalAlpha=Math.max(0,1-((eatT*30)%26)/26);
    ctx.fillText('♥',mouthX-12,hy);ctx.globalAlpha=1;
  }
  const p=Math.min(1,eatT/EAT_DUR);
  ctx.fillStyle='rgba(20,12,8,.3)';rr(ctx,bx-26,by+18,52,5,2.5);ctx.fill();
  ctx.fillStyle=MIN.gold;rr(ctx,bx-26,by+18,52*p,5,2.5);ctx.fill();
}

/* ---------------- DIVE ---------------- */
function drawKelp(x,baseY,h,t,hue){
  inked(ctx,hue,5);
  ctx.beginPath();ctx.moveTo(x,baseY);
  for(let i=1;i<=6;i++){const yy=baseY-h*i/6;const sw=Math.sin(t*1.4+i*0.6+x)*6*(i/6);ctx.lineTo(x+sw,yy);}
  ctx.stroke();
  // a couple of blade leaves
  ctx.fillStyle=hue;
  for(let i=2;i<=5;i+=1.5){const yy=baseY-h*i/6;const sw=Math.sin(t*1.4+i*0.6+x)*6*(i/6);
    ctx.beginPath();ctx.ellipse(x+sw+ (i%2?6:-6),yy,5,2.4,(i%2?0.5:-0.5),0,7);ctx.fill();}
}
function drawCreature(c,t){
  const y=c.y+(c.buried?Math.sin(c.bob)*0.6:Math.sin(c.bob)*2.5), x=c.x, col=c.s.color, R=c.r;
  ctx.save();ctx.translate(x,y);
  ctx.lineJoin='round';ctx.lineCap='round';
  ctx.fillStyle='rgba(10,12,24,.18)';ctx.beginPath();ctx.ellipse(0,R*1.05,R*0.85,R*0.3,0,0,7);ctx.fill();
  if(c.buried){
    ctx.fillStyle='#10243a';ctx.beginPath();ctx.ellipse(0,R*0.55,R*1.7,R*0.95,0,0,7);ctx.fill();
    ctx.fillStyle='#16304a';ctx.beginPath();ctx.ellipse(-R*0.85,R*0.55,R*0.55,R*0.4,0,0,7);ctx.ellipse(R*0.9,R*0.5,R*0.5,R*0.36,0,0,7);ctx.fill();
  }
  if(c.s.id==='seaweed'){
    inked(ctx,MIN.greenD,2.4);
    for(let b=-1;b<=1;b++){
      ctx.fillStyle=b===0?MIN.green:MIN.greenD;
      ctx.beginPath();ctx.moveTo(b*5,R);
      for(let i=1;i<=5;i++){const yy=R-i*(R*2.2)/5;ctx.lineTo(b*5+Math.sin(t*2+i*0.7+b)*5,yy);}
      ctx.stroke();
    }
    inked(ctx,MIN.verm,1.4);
    for(let a=0;a<6.28;a+=1.25){ctx.beginPath();ctx.ellipse(Math.cos(a)*4,-R*1.05+Math.sin(a)*4,2.7,2,a,0,7);fillStroke(ctx);}
    ctx.fillStyle=MIN.gold;ctx.beginPath();ctx.arc(0,-R*1.05,2,0,7);ctx.fill();
  }
  else if(c.s.id==='conch'){
    inked(ctx,col,2.4);
    ctx.beginPath();ctx.ellipse(0,R*0.15,R,R*0.88,0,0,7);fillStroke(ctx);
    ctx.strokeStyle=shade(col,-40);ctx.lineWidth=2;
    ctx.beginPath();for(let a=0;a<7;a+=0.22){const r2=R*0.82*(1-a/8);const px=Math.cos(a)*r2,py=R*0.15+Math.sin(a)*r2*0.85;a===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}ctx.stroke();
    ctx.fillStyle=shade(col,24);
    for(let a=-0.5;a<3.2;a+=0.62){ctx.beginPath();ctx.arc(Math.cos(a)*R*0.96,R*0.15+Math.sin(a)*R*0.82,2.3,0,7);ctx.fill();}
  }
  else if(c.s.id==='urchin'){
    ctx.strokeStyle=MIN.ink;ctx.lineWidth=2.6;
    for(let a=0;a<6.28;a+=0.36){const r1=R*0.55,r2=R+5+Math.sin(a*3)*1.6;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke();}
    inked(ctx,col,2.4);ctx.beginPath();ctx.arc(0,0,R*0.64,0,7);fillStroke(ctx);
    ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.arc(-R*0.2,-R*0.2,R*0.2,0,7);ctx.fill();
  }
  else { // red octopus
    inked(ctx,col,R*0.42+4);
    for(let l=-2;l<=2;l++){const bx=l*R*0.34;
      ctx.beginPath();ctx.moveTo(bx,R*0.15);
      ctx.quadraticCurveTo(bx+Math.sin(t*3+l)*R*0.5,R*0.95, l*R*0.55+Math.sin(t*3+l)*R*0.4,R*1.32);
      ctx.stroke();}
    ctx.strokeStyle=col;ctx.lineWidth=R*0.42;
    for(let l=-2;l<=2;l++){const bx=l*R*0.34;
      ctx.beginPath();ctx.moveTo(bx,R*0.15);
      ctx.quadraticCurveTo(bx+Math.sin(t*3+l)*R*0.5,R*0.95, l*R*0.55+Math.sin(t*3+l)*R*0.4,R*1.32);
      ctx.stroke();}
    inked(ctx,col,2.6);
    ctx.beginPath();ctx.arc(0,-R*0.12,R,Math.PI,0);ctx.lineTo(R,R*0.28);ctx.quadraticCurveTo(0,R*0.52,-R,R*0.28);ctx.closePath();fillStroke(ctx);
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-R*0.3,-R*0.18,R*0.2,0,7);ctx.arc(R*0.3,-R*0.18,R*0.2,0,7);ctx.fill();
    ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(-R*0.26,-R*0.15,R*0.1,0,7);ctx.arc(R*0.34,-R*0.15,R*0.1,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,140,140,.55)';ctx.beginPath();ctx.arc(-R*0.52,R*0.02,R*0.13,0,7);ctx.arc(R*0.52,R*0.02,R*0.13,0,7);ctx.fill();
  }
  if(c.buried && c.dig>0){
    const p=Math.min(1,c.dig/c.digMax);
    ctx.strokeStyle='rgba(10,12,24,.3)';ctx.lineWidth=3.4;ctx.beginPath();ctx.arc(0,-R*0.1,R+10,0,6.28);ctx.stroke();
    ctx.strokeStyle=MIN.gold;ctx.lineWidth=3.4;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,-R*0.1,R+10,-Math.PI/2,-Math.PI/2+p*6.28);ctx.stroke();
  }
  ctx.restore();
}
function drawMiniFish(x,y,dir,t){
  ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.translate(0,Math.sin(t*2)*1.5);
  ctx.lineJoin='round';
  inked(ctx,MIN.blueL,1.4);
  ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(-12,-4.5);ctx.lineTo(-12,4.5);ctx.closePath();fillStroke(ctx);
  ctx.beginPath();ctx.ellipse(0,0,7.5,4.6,0,0,7);fillStroke(ctx);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(4,-1,1.5,0,7);ctx.fill();
  ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(4.5,-1,0.75,0,7);ctx.fill();
  ctx.restore();
}
function drawDive(){
  const t=performance.now()*0.001;
  // flat indigo water column
  ctx.fillStyle=MIN.blueL;ctx.fillRect(0,SURF,W,(BED-SURF)*0.35+SURF);
  ctx.fillStyle=MIN.blue;ctx.fillRect(0,SURF+(BED-SURF)*0.3,W,H);
  ctx.fillStyle='#1a2b54';ctx.fillRect(0,SURF+(BED-SURF)*0.7,W,H);
  // sky band above surface (paper)
  const nt=nightAmt(G.time);
  ctx.fillStyle=nt>0.4?'#27314f':MIN.paper;ctx.fillRect(0,0,W,SURF);
  inked(ctx,MIN.verm,2);ctx.beginPath();ctx.arc(64,40,14,0,7);fillStroke(ctx); // sun disc
  // folk waves at the surface
  const off=(t*8)%28;
  for(let x=-30;x<W+30;x+=28){motifWave(ctx,x-off,SURF+8+Math.sin(x*0.04+t)*2,1,MIN.blueL,MIN.white);}
  ctx.strokeStyle=MIN.white;ctx.lineWidth=2.5;ctx.beginPath();
  for(let x=0;x<=W;x+=10){const y=SURF+Math.sin(x*.06+t*1.8)*3;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
  // god rays
  ctx.save();ctx.beginPath();ctx.rect(0,SURF,W,H-SURF);ctx.clip();ctx.globalCompositeOperation='screen';
  for(let i=0;i<5;i++){const cx=((i*120+Math.sin(t*0.3+i)*40)%(W+120))-60;
    ctx.fillStyle='rgba(200,230,255,0.05)';ctx.beginPath();
    ctx.moveTo(cx,SURF);ctx.lineTo(cx+24,SURF);ctx.lineTo(cx+90,BED);ctx.lineTo(cx-46,BED);ctx.closePath();ctx.fill();}
  ctx.restore();
  // seabed — flat ink-outlined rocks
  inked(ctx,'#16304a',2.4);
  ctx.beginPath();ctx.moveTo(0,BED);
  for(let x=0;x<=W;x+=22)ctx.lineTo(x,BED+Math.sin(x*.08)*5);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='#0e2236';
  for(const rk of [[60,BED-4,16],[180,BED+2,22],[300,BED-2,18],[420,BED+4,24]]){
    ctx.beginPath();ctx.ellipse(rk[0],rk[1],rk[2],rk[2]*0.6,0,Math.PI,0);ctx.fill();}
  // kelp
  drawKelp(40,BED,90,t,MIN.greenD);drawKelp(120,BED,70,t,MIN.green);
  drawKelp(360,BED,100,t,MIN.greenD);drawKelp(440,BED,80,t,MIN.green);
  // tewak float on surface
  ctx.fillStyle='rgba(10,12,24,.15)';ctx.beginPath();ctx.ellipse(W/2,SURF+2,18,4,0,0,7);ctx.fill();
  inked(ctx,MIN.verm,2.4);ctx.beginPath();ctx.ellipse(W/2,SURF-5,16,12,0,0,7);fillStroke(ctx);
  ctx.fillStyle=MIN.white;ctx.beginPath();ctx.ellipse(W/2-4,SURF-9,4,2.5,0,0,7);ctx.fill();
  ctx.strokeStyle='rgba(40,30,20,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(W/2,SURF+6);ctx.lineTo(W/2+4,SURF+40);ctx.stroke();
  // ambient fish
  for(let i=0;i<5;i++){const dir=i%2?1:-1;const span=W+80, raw=(performance.now()*0.018*dir)+i*150;
    const px=((raw%span)+span)%span-40; const fy=SURF+70+i*86+Math.sin(t*0.7+i)*12;
    drawMiniFish(px,fy,dir,t+i);}
  { const dir=Math.sin(t*0.12)>0?1:-1; const cx=W*0.5+Math.sin(t*0.18)*W*0.42; const cy=SURF+150+Math.sin(t*0.3)*40;
    for(let i=0;i<7;i++){const ox=Math.cos(i*1.3)*22+(i-3)*10, oy=Math.sin(i*1.7)*12;
      drawMiniFish(cx+ox*dir, cy+oy+Math.sin(t*1.5+i)*3, dir, t+i*0.5);} }
  // marine snow
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<40;i++){const sx=((i*97.3+Math.sin(t*0.2+i)*30)%W+W)%W;
    const sy=SURF+((i*53.7-t*7*((i%3)+1)*0.4)%(H-SURF)+(H-SURF))%(H-SURF);
    ctx.fillStyle=`rgba(220,235,255,${0.05+0.06*((i%5)/5)})`;
    ctx.beginPath();ctx.arc(sx,sy,0.7+(i%3)*0.5,0,7);ctx.fill();}
  ctx.restore();
  // creatures
  for(const c of dCreatures) drawCreature(c,t);
  // particles
  for(const p of dParts){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill();ctx.globalAlpha=1;}
  // bubbles
  ctx.fillStyle='rgba(220,245,255,.5)';for(const b of dBubbles){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();}
  // ---- diver (flat folk haenyeo, dives head-first) ----
  {
    const vmag=Math.hypot(dv.vx,dv.vy);
    const targetAng = vmag>0.35 ? Math.atan2(dv.vy,dv.vx)-Math.PI/2 : 0;
    if(dv.ang===undefined)dv.ang=0;
    let da=targetAng-dv.ang; da=Math.atan2(Math.sin(da),Math.cos(da)); dv.ang+=da*0.16;
    const R=dv.r*1.32, OL=MIN.ink, WHITE=MIN.white, kick=Math.sin(dv.kick);
    const modern=(typeof G!=='undefined'&&G.suit==='modern');
    const NEO='#26252e', ACC=MIN.jade;
    const TOP=modern?NEO:WHITE, BOT=modern?NEO:'#26242c', HOOD=modern?'#20202a':WHITE, SLEEVE=modern?NEO:WHITE;
    ctx.save();ctx.translate(dv.x,dv.y);ctx.rotate(dv.ang);
    ctx.lineJoin='round';ctx.lineCap='round';
    // legs + orange fins
    for(const sgn of [-1,1]){ const sw=sgn*kick*0.5;
      ctx.strokeStyle=BOT;ctx.lineWidth=6.5;
      ctx.beginPath();ctx.moveTo(sgn*R*0.34,-R*0.5);ctx.lineTo(sgn*R*0.55+sw*R,-R*1.12);ctx.stroke();
      ctx.save();ctx.translate(sgn*R*0.6+sw*R,-R*1.3);ctx.rotate(sgn*0.5+sw);
      inked(ctx,MIN.gold,2);ctx.beginPath();ctx.ellipse(0,0,R*0.27,R*0.5,0,0,7);fillStroke(ctx);ctx.restore();
    }
    // hand-net slung behind the shoulder
    ctx.save();ctx.translate(-R*0.72,-R*0.15);ctx.rotate(-0.5);
    ctx.strokeStyle='#6e4a2a';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,R*0.6);ctx.lineTo(0,-R*0.18);ctx.stroke();
    ctx.strokeStyle='#cdbd8a';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,-R*0.55,R*0.42,0,7);ctx.stroke();
    ctx.strokeStyle='rgba(120,150,90,.85)';ctx.lineWidth=1;
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*R*0.15,-R*0.95);ctx.lineTo(i*R*0.15,-R*0.15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-R*0.4,-R*0.55+i*R*0.15);ctx.lineTo(R*0.4,-R*0.55+i*R*0.15);ctx.stroke();}
    ctx.restore();
    // shorts / suit bottom
    inked(ctx,BOT,2.2);ctx.beginPath();ctx.ellipse(0,-R*0.42,R*0.72,R*0.6,0,0,7);fillStroke(ctx);
    if(!modern){ ctx.strokeStyle=WHITE;ctx.lineWidth=1.3;
      ctx.beginPath();ctx.moveTo(-R*0.34,-R*0.72);ctx.lineTo(R*0.34,-R*0.16);ctx.moveTo(R*0.34,-R*0.72);ctx.lineTo(-R*0.34,-R*0.16);ctx.stroke(); }
    else { ctx.strokeStyle=ACC;ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-R*0.52,-R*0.62);ctx.lineTo(R*0.52,-R*0.62);ctx.stroke(); }
    // jacket / suit top
    inked(ctx,TOP,2.4);ctx.beginPath();ctx.ellipse(0,R*0.26,R*0.8,R*0.66,0,0,7);fillStroke(ctx);
    if(!modern){ ctx.fillStyle=MIN.ink;ctx.fillRect(-R*0.05,-R*0.28,R*0.1,R*0.7); }
    else { ctx.strokeStyle=ACC;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-R*0.36);ctx.lineTo(0,R*0.5);ctx.stroke(); }
    // arms + gloves
    for(const sgn of [-1,1]){
      ctx.strokeStyle=SLEEVE;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(sgn*R*0.5,R*0.2);ctx.lineTo(sgn*R*0.8,R*1.0);ctx.stroke();
      ctx.strokeStyle=OL;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sgn*R*0.5,R*0.2);ctx.lineTo(sgn*R*0.8,R*1.0);ctx.stroke();
      inked(ctx,modern?'#20202a':WHITE,2);ctx.beginPath();ctx.arc(sgn*R*0.84,R*1.12,R*0.2,0,7);fillStroke(ctx);
    }
    // J-hook (빗창)
    ctx.save();ctx.translate(R*0.84,R*1.12);ctx.rotate(0.35);
    ctx.strokeStyle='#9c6a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-R*0.1);ctx.lineTo(0,R*0.7);ctx.stroke();
    ctx.strokeStyle='#b8bcc0';ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(-R*0.18,R*0.72,R*0.2,-0.3,Math.PI*0.95);ctx.stroke();ctx.restore();
    // hood
    inked(ctx,HOOD,2.4);ctx.beginPath();ctx.arc(0,R*0.96,R*0.82,0,7);fillStroke(ctx);
    // pink face
    ctx.fillStyle='#f3c9a8';ctx.beginPath();ctx.arc(0,R*1.06,R*0.46,0,7);ctx.fill();
    // red round goggles
    ctx.fillStyle='rgba(150,210,235,.45)';rr(ctx,-R*0.4,R*0.8,R*0.8,R*0.5,R*0.25);ctx.fill();
    ctx.strokeStyle=MIN.verm;ctx.lineWidth=3.4;rr(ctx,-R*0.42,R*0.78,R*0.84,R*0.54,R*0.27);ctx.stroke();
    ctx.strokeStyle=MIN.red;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,R*0.78);ctx.lineTo(0,R*1.32);ctx.stroke();
    ctx.fillStyle=OL;ctx.beginPath();ctx.arc(-R*0.16,R*1.04,R*0.09,0,7);ctx.arc(R*0.16,R*1.04,R*0.09,0,7);ctx.fill();
    ctx.fillStyle='rgba(214,80,47,.5)';ctx.beginPath();ctx.arc(-R*0.3,R*1.2,R*0.1,0,7);ctx.arc(R*0.3,R*1.2,R*0.1,0,7);ctx.fill();
    ctx.restore();
  }
  // night dim underwater
  if(nt>0.2){ctx.fillStyle=`rgba(10,18,44,${nt*0.4})`;ctx.fillRect(0,SURF,W,H-SURF);}
  // net counter
  ctx.fillStyle=MIN.white;ctx.font='700 14px "Space Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  ctx.strokeStyle='rgba(20,12,8,.7)';ctx.lineWidth=3;ctx.lineJoin='round';
  ctx.strokeText('Net '+dNet.length+'/'+netCap(),16,42);ctx.fillText('Net '+dNet.length+'/'+netCap(),16,42);
  if(dSumbi>0){ctx.globalAlpha=Math.min(1,dSumbi);glabel('휴— (gasp)',dv.x,SURF-14,20,MIN.white);ctx.globalAlpha=1;}
}

/* ---------------- PORTRAIT (silk medallion) ---------------- */
function drawPortrait(n){
  const p=$('portrait'); const S=54;
  p.width=Math.round(S*DPR);p.height=Math.round(S*DPR);
  const x=p.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);x.clearRect(0,0,S,S);
  // silk ground
  x.fillStyle=MIN.paper2;x.fillRect(0,0,S,S);
  x.fillStyle='rgba(120,90,40,.06)';for(let i=0;i<40;i++){x.fillRect((i*13)%S,(i*7)%S,2,1);}
  // shoulders
  x.fillStyle='#26242c';x.beginPath();x.ellipse(S/2,S+6,20,16,0,0,7);x.fill();
  x.fillStyle=n.scarf;x.fillRect(S/2-20,S-10,40,4);
  // neck + face
  x.fillStyle=shade(n.skin,-14);x.fillRect(S/2-5,S/2+6,10,8);
  x.fillStyle=n.skin;x.strokeStyle=MIN.ink;x.lineWidth=1.6;x.beginPath();x.arc(S/2,S/2-1,15,0,7);x.fill();x.stroke();
  // headscarf
  x.fillStyle=n.scarf;x.beginPath();x.arc(S/2,S/2-4,16.5,Math.PI*1.03,-Math.PI*0.03);x.closePath();x.fill();x.stroke();
  x.fillRect(S/2-16.5,S/2-7,33,7);
  // face — folk dots
  x.fillStyle=MIN.ink;x.beginPath();x.arc(S/2-5,S/2,2,0,7);x.arc(S/2+5,S/2,2,0,7);x.fill();
  x.fillStyle='rgba(214,80,47,.4)';x.beginPath();x.arc(S/2-8,S/2+5,2.6,0,7);x.arc(S/2+8,S/2+5,2.6,0,7);x.fill();
  x.strokeStyle='rgba(120,50,40,.7)';x.lineWidth=1.4;x.beginPath();x.arc(S/2,S/2+4,3.4,.2,Math.PI-.2);x.stroke();
  // gold medallion border
  x.strokeStyle=MIN.goldD;x.lineWidth=2.4;x.strokeRect(2,2,S-4,S-4);
  x.strokeStyle=MIN.gold;x.lineWidth=1;x.strokeRect(4,4,S-8,S-8);
}

/* ---------------- JOYSTICK ---------------- */
function drawJoy(){
  if(!joy.on||!joy.moved)return;
  ctx.fillStyle='rgba(244,236,217,.16)';ctx.beginPath();ctx.arc(joy.bx,joy.by,36,0,7);ctx.fill();
  ctx.strokeStyle='rgba(244,236,217,.34)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.bx,joy.by,36,0,7);ctx.stroke();
  const m=Math.min(28,Math.hypot(joy.dx,joy.dy)),a=Math.atan2(joy.dy,joy.dx);
  const hx=joy.bx+Math.cos(a)*m,hy=joy.by+Math.sin(a)*m;
  inked(ctx,MIN.gold,2);ctx.beginPath();ctx.arc(hx,hy,15,0,7);fillStroke(ctx);
}

/* ---------------- boot ---------------- */
setupRetina();
requestAnimationFrame(frame);
