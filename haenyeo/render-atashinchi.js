/* ============================================================
   HAENYEO VILLAGE LIFE — CARTOON (Atashinchi) STYLE
   Cosy slice-of-life cartoon repaint: flat solid fills, thick
   rounded brown outlines, no gradients, super-simplified doodle
   shapes & faces. Classic script, shares global scope with
   game.js. Same function signatures as the other renderers so
   all are drop-in interchangeable.
   ============================================================ */

/* ---------------- flat cartoon palette ---------------- */
const MIN = {
  ink:   '#4a3a2c',   // warm brown outline (not pure black)
  ink2:  '#382c20',
  paper: '#f6efde',   // cream ground
  paper2:'#efe4c8',
  white: '#fbf7ec',
  red:   '#e06a4e',   // tomato red
  verm:  '#e8714a',
  gold:  '#f2c75a',   // cheerful yellow
  goldD: '#d59f2e',
  green: '#8cc163',   // grass green
  greenD:'#6aa647',
  greenL:'#acd684',
  blue:  '#5fa8d6',   // sky/sea blue
  blueL: '#a9d8e6',   // pale sky
  teal:  '#5cbfb0',
  jade:  '#5cbfb0',
  plum:  '#d68aa6',
  brown: '#b88248',   // wood
  roofA: '#d98a5c',
};

/* ---------------- retina ---------------- */
let DPR=Math.max(1,Math.min(3,window.devicePixelRatio||1));
let _beachDeco=null;   // cached static beach decorations (sand speckle + shells), rebuilt on DPR change
function setupRetina(){
  DPR=Math.max(1,Math.min(3,window.devicePixelRatio||1));
  cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.imageSmoothingEnabled=true;
  villageBG=null; shopBG=null; homeBG=null; marketBG=null; _beachDeco=null;
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

/* flat shape with a thick rounded cartoon outline */
function inked(g,col,lw){ g.fillStyle=col; g.strokeStyle=MIN.ink; g.lineWidth=lw||3; g.lineJoin='round'; g.lineCap='round'; }
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

/* ===== CARTOON MOTIF LIBRARY ===== */

/* puffy flat cloud */
function motifCloud(g,x,y,s,col,oc){
  g.save();g.translate(x,y);g.scale(s,s);
  g.fillStyle=col||MIN.white;g.strokeStyle=oc||MIN.ink;g.lineWidth=2.6;g.lineJoin='round';
  g.beginPath();
  g.arc(-12,2,7,Math.PI*0.5,Math.PI*1.5);
  g.arc(-4,-4,8,Math.PI*1.05,Math.PI*1.95);
  g.arc(8,-3,7,Math.PI*1.2,Math.PI*2.05);
  g.arc(14,3,6,Math.PI*1.5,Math.PI*0.5);
  g.closePath();fillStroke(g);
  g.restore();
}

/* simple doodle flower — 5 round petals + dot centre */
function motifPeony(g,x,y,s,col){
  g.save();g.translate(x,y);g.scale(s,s);
  g.fillStyle=col||MIN.red;g.strokeStyle=MIN.ink;g.lineWidth=2;g.lineJoin='round';
  for(let a=0;a<6.28;a+=6.28/5){
    g.beginPath();g.arc(Math.cos(a)*5,Math.sin(a)*5,4,0,7);fillStroke(g);
  }
  g.fillStyle=MIN.gold;g.beginPath();g.arc(0,0,3,0,7);fillStroke(g);
  g.restore();
}

/* little doodle bird (m-shape with a round body) */
function motifCrane(g,x,y,s,dir,flap){
  g.save();g.translate(x,y);g.scale(dir*s,s);
  g.strokeStyle=MIN.ink;g.lineWidth=2.4;g.lineCap='round';g.lineJoin='round';
  g.fillStyle=MIN.white;
  const fl=(flap||0)*4;
  // body
  g.beginPath();g.ellipse(0,0,6,4,0,0,7);fillStroke(g);
  // wing flaps
  g.beginPath();g.moveTo(-1,-2);g.quadraticCurveTo(-9,-9-fl,-15,-5-fl);g.stroke();
  g.beginPath();g.moveTo(1,-2);g.quadraticCurveTo(8,-9-fl,13,-6-fl);g.stroke();
  // beak + eye
  g.fillStyle=MIN.gold;g.beginPath();g.moveTo(5,-1);g.lineTo(9,0);g.lineTo(5,1.5);g.closePath();g.fill();
  g.fillStyle=MIN.ink;g.beginPath();g.arc(3,-1,0.9,0,7);g.fill();
  g.restore();
}

/* rolling cartoon hills backdrop (replaces five peaks) */
function motifPeaks(g,baseY,w){
  // far hill
  g.fillStyle=MIN.greenL;g.strokeStyle=MIN.ink;g.lineWidth=2.6;g.lineJoin='round';
  g.beginPath();g.moveTo(-4,baseY);
  g.quadraticCurveTo(w*0.16,baseY-58,w*0.34,baseY);
  g.quadraticCurveTo(w*0.52,baseY-72,w*0.74,baseY);
  g.quadraticCurveTo(w*0.88,baseY-46,w+4,baseY);
  g.lineTo(w+4,baseY+6);g.lineTo(-4,baseY+6);g.closePath();fillStroke(g);
  // near hill, a touch greener & lower
  g.fillStyle=MIN.green;
  g.beginPath();g.moveTo(-4,baseY+10);
  g.quadraticCurveTo(w*0.24,baseY-30,w*0.46,baseY+10);
  g.quadraticCurveTo(w*0.66,baseY-40,w*0.9,baseY+10);
  g.lineTo(w+4,baseY+10);g.lineTo(w+4,baseY+16);g.lineTo(-4,baseY+16);g.closePath();fillStroke(g);
}

/* simple scalloped wave bump (~28 wide) */
function motifWave(g,x,y,s,fill,crest){
  g.save();g.translate(x,y);g.scale(s,s);
  g.fillStyle=fill;g.strokeStyle=MIN.ink;g.lineWidth=2.2;g.lineJoin='round';g.lineCap='round';
  g.beginPath();
  g.moveTo(-14,5);
  g.quadraticCurveTo(-9,-7,0,-7);
  g.quadraticCurveTo(9,-7,14,5);
  g.closePath();fillStroke(g);
  // tiny crest curl — faces left, the way the waves roll toward the shore
  g.strokeStyle=crest||MIN.white;g.lineWidth=2;
  g.save();g.scale(-1,1);
  g.beginPath();g.arc(0,-2,3.4,Math.PI*0.15,Math.PI*1.5);g.stroke();
  g.restore();
  g.restore();
}

/* dol hareubang — simple cartoon stone grandfather */
/* dol hareubang (돌하르방) — Jeju's basalt grandfather: mushroom hat, bulging
   eyes, big garlic nose, closed mouth, both hands on the belly, porous black rock */
function drawHareubang(g,x,y,s){
  g.save();g.translate(x,y);g.scale(s,s);
  const SINK='#241f29';                                   // dark basalt outline
  const base='#56555b', baseD='#454449', baseL='#67666d', stoneL='#838289';
  const pits=(cx,cy,rx,ry,n,seed)=>{const r=mulberry32(seed);g.fillStyle='rgba(14,11,18,.34)';
    for(let i=0;i<n;i++){const a=r()*6.283,d=Math.sqrt(r());
      g.beginPath();g.arc(cx+Math.cos(a)*rx*d,cy+Math.sin(a)*ry*d,0.45+r()*1.0,0,7);g.fill();}};
  g.lineJoin='round';g.lineCap='round';
  // ground shadow
  g.fillStyle='rgba(28,22,30,.20)';g.beginPath();g.ellipse(0,5,15,4.5,0,0,7);g.fill();
  // ---- body: tapered basalt column ----
  g.fillStyle=base;g.strokeStyle=SINK;g.lineWidth=3;
  g.beginPath();
  g.moveTo(-12,4);g.lineTo(-13,-19);
  g.quadraticCurveTo(-13,-29,-5,-30);g.lineTo(5,-30);
  g.quadraticCurveTo(13,-29,13,-19);g.lineTo(12,4);g.closePath();fillStroke(g);
  // shaded right flank
  g.fillStyle=baseD;g.beginPath();
  g.moveTo(13,-19);g.lineTo(12,4);g.lineTo(6.5,4);g.lineTo(7.5,-21);g.quadraticCurveTo(10.5,-26,13,-19);g.closePath();g.fill();
  pits(0,-12,11,15,28,71);
  // ---- both hands resting on the belly (right set a little higher) ----
  g.fillStyle=baseL;g.strokeStyle=SINK;g.lineWidth=2.4;
  g.beginPath();g.ellipse(-5,-6,5.6,4.3,.16,0,7);fillStroke(g);     // left hand (lower)
  g.beginPath();g.ellipse(5.4,-11,5.6,4.3,-.16,0,7);fillStroke(g);  // right hand (higher)
  g.strokeStyle='rgba(20,16,26,.45)';g.lineWidth=1;
  for(const[hx,hy] of [[-5,-6],[5.4,-11]]){
    for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(hx+k*2.1,hy-2.7);g.lineTo(hx+k*2.1+0.5,hy+2.6);g.stroke();}}
  // ---- head ----
  g.fillStyle=base;g.strokeStyle=SINK;g.lineWidth=3;
  g.beginPath();g.arc(0,-41,12.5,0,7);fillStroke(g);
  pits(0,-40,10,10,18,99);
  // ---- rounded helmet hat (벙거지) — dome cap + slightly flared brim ----
  g.fillStyle=baseL;g.strokeStyle=SINK;g.lineWidth=3;
  g.beginPath();
  g.moveTo(-13,-49);
  g.quadraticCurveTo(-14,-62,0,-64);
  g.quadraticCurveTo(14,-62,13,-49);
  g.closePath();fillStroke(g);                                   // dome cap
  g.beginPath();g.ellipse(0,-49,14.5,3.8,0,0,7);fillStroke(g);   // flared brim
  g.fillStyle='rgba(255,255,255,.12)';g.beginPath();g.ellipse(-3.5,-57,6.5,3.2,-.2,0,7);g.fill();
  pits(0,-56,10,4.2,10,123);
  // ---- big round eyes with clear pupils + a glint ----
  for(const ex of [-5.4,5.4]){
    g.fillStyle=stoneL;g.strokeStyle=SINK;g.lineWidth=2.3;
    g.beginPath();g.arc(ex,-42,4.7,0,7);fillStroke(g);            // raised eyeball
    g.fillStyle=SINK;g.beginPath();g.arc(ex+0.3,-41.6,2.4,0,7);g.fill();      // carved pupil
    g.fillStyle='rgba(245,245,250,.55)';g.beginPath();g.arc(ex-0.9,-42.8,0.8,0,7);g.fill(); // glint
  }
  // ---- big bulbous garlic nose ----
  g.fillStyle=baseL;g.strokeStyle=SINK;g.lineWidth=2.6;
  g.beginPath();
  g.moveTo(-2.6,-44);
  g.quadraticCurveTo(-6.4,-36.5,-3.8,-31.8);
  g.quadraticCurveTo(0,-28.8,3.8,-31.8);
  g.quadraticCurveTo(6.4,-36.5,2.6,-44);
  g.closePath();fillStroke(g);
  g.fillStyle='rgba(255,255,255,.12)';g.beginPath();g.ellipse(-1.2,-37,1.8,2.6,0,0,7);g.fill();
  // ---- gentle closed smile ----
  g.strokeStyle=SINK;g.lineWidth=2;g.lineCap='round';
  g.beginPath();g.moveTo(-4,-28.6);g.quadraticCurveTo(0,-26.4,4,-28.6);g.stroke();
  g.restore();
}
function drawHareubangFlower(g,x,y,s){
  drawHareubang(g,x,y,s);
  const fx=x, fy=y-14*s; g.save();
  g.strokeStyle=MIN.greenD;g.lineWidth=2*s;g.lineCap='round';
  g.beginPath();g.moveTo(fx,fy+9*s);g.lineTo(fx-2*s,fy-7*s);g.stroke();
  motifPeony(g,fx,fy-6*s,0.6*s,MIN.gold);
  g.fillStyle=MIN.green;g.beginPath();g.ellipse(fx-5*s,fy+3*s,3*s,1.6*s,-.6,0,7);g.ellipse(fx+4*s,fy+4*s,3*s,1.6*s,.6,0,7);g.fill();
  g.restore();
}

/* ===== TIME-OF-DAY (flat wash, paper-being-lit) ===== */
const DAYKEYS=[
  {t:0,    c:[28,42,90,.40]},     // deep night
  {t:300,  c:[36,52,104,.38]},    // 5:00 pre-dawn blue
  {t:360,  c:[255,162,110,.22]},  // 6:00 sunrise glow (the day begins)
  {t:430,  c:[255,206,140,.13]},  // 7:10 golden morning
  {t:540,  c:[255,238,200,.05]},  // 9:00 bright morning
  {t:720,  c:[255,250,238,.0]},   // noon — clear, full light
  {t:990,  c:[255,242,200,.05]},  // 16:30 warm afternoon
  {t:1080, c:[255,150,82,.17]},   // 18:00 amber evening
  {t:1140, c:[232,108,92,.23]},   // 19:00 sunset
  {t:1230, c:[120,92,148,.31]},   // 20:30 dusk purple
  {t:1350, c:[40,54,108,.40]},    // 22:30 night
  {t:1440, c:[28,42,90,.40]},
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
/* ===== WEATHER (rolled per day: sunny / rain / wind) ===== */
function drawWeather(){
  const w=(typeof G!=='undefined'&&G.weather)||'sunny';
  const t=performance.now()*0.001;
  if(w==='rain'){
    ctx.save();
    ctx.fillStyle='rgba(64,84,108,.20)';ctx.fillRect(0,0,W,H);   // cool, overcast wash
    ctx.strokeStyle='rgba(206,228,242,.5)';ctx.lineWidth=1.4;ctx.lineCap='round';
    for(let i=0;i<95;i++){
      const sp=460+(i%6)*55;
      const x=((i*53.3+t*46)%(W+70))-35;
      const y=((i*88.7+t*sp)%(H+44))-22;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+16);ctx.stroke();
    }
    // splash rings on the ground band
    ctx.strokeStyle='rgba(220,238,248,.28)';ctx.lineWidth=1;
    for(let i=0;i<10;i++){const x=((i*131.7+t*30)%W);const ph=(t*1.6+i)%1;const yy=SEA_Y-40+(i%3)*16;
      ctx.beginPath();ctx.ellipse(x,yy,2+ph*7,1+ph*2.5,0,0,7);ctx.globalAlpha=1-ph;ctx.stroke();ctx.globalAlpha=1;}
    ctx.restore();
  } else if(w==='wind'){
    ctx.save();
    for(let i=0;i<24;i++){
      const span=W+90;
      const x=((i*73.9+t*(130+(i%4)*44))%span)-45;
      const y=64+((i*97.3+Math.sin(t*1.3+i)*34)%(SEA_Y-90));
      const r=2.4+(i%3);
      ctx.save();ctx.translate(x,y);ctx.rotate(t*3+i);
      ctx.fillStyle=i%2?'rgba(240,174,96,.85)':'rgba(214,118,78,.8)';
      ctx.beginPath();ctx.ellipse(0,0,r,r*0.5,0,0,7);ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=2;ctx.lineCap='round';
    for(let i=0;i<6;i++){const y=88+i*72+Math.sin(t+i)*8;const x=((t*270+i*130)%(W+220))-110;
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+44,y-7,x+88,y);ctx.stroke();}
    ctx.restore();
  } else {
    // sunny — warm halo around the sun
    ctx.save();ctx.globalCompositeOperation='screen';
    const g=ctx.createRadialGradient(58,58,4,58,58,130);
    g.addColorStop(0,'rgba(255,242,180,.22)');g.addColorStop(1,'rgba(255,242,180,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,SEA_Y);
    ctx.restore();
  }
}

/* ================= placeholder for caches (defined later use) ============ */
let villageBG=null, shopBG=null, homeBG=null, marketBG=null;

/* ================= LAND ELEMENTS ================= */
function bWindow(b){return {x:b.x+b.w*0.15,y:b.y+b.h*0.40+8};}
function bDoor(b){return {x:b.x+b.w/2,y:b.y+b.h};}

/* batdam (밭담) — Jeju dry-stacked dark basalt field wall: irregular stones,
   visible gaps & holes, no mortar */
function drawWall(g,x,y,w,h){
  const rng=mulberry32(((x*13+y*7)|0)+5);
  g.save();
  // dark gaps/backing so the holes between stones read through
  g.fillStyle='rgba(26,22,30,.6)';
  rr(g,x-1,y-3,w+2,h+5,3);g.fill();
  g.lineJoin='round';g.lineCap='round';
  const rows=2, rowH=(h+5)/rows;
  for(let r=0;r<rows;r++){
    const ry=y-3+r*rowH;
    let cx=x-rng()*7;
    while(cx<x+w){
      const bw=9+rng()*12;
      const px=cx+1, py=ry+0.8, pw=bw-1.5, ph=rowH-1.6+rng()*1.5;
      const v=40+rng()*24|0;                              // dark basalt
      g.fillStyle=`rgb(${v},${v-2},${v+5})`;g.strokeStyle='#191520';g.lineWidth=1.7;
      rr(g,px,py,pw,ph,Math.min(pw,ph)*0.44);g.fill();g.stroke();
      g.fillStyle='rgba(255,255,255,.10)';g.beginPath();g.ellipse(px+pw*0.42,py+ph*0.32,pw*0.26,ph*0.16,0,0,7);g.fill();
      g.fillStyle='rgba(8,6,12,.4)';
      for(let k=0;k<2;k++){g.beginPath();g.arc(px+1.5+rng()*(pw-3),py+1.5+rng()*(ph-3),0.5+rng()*0.9,0,7);g.fill();}
      cx+=bw+1.4+rng()*2.2;                               // gap to the next stone
    }
  }
  g.restore();
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

/* tangerine tree — Jeju's signature, hung with orange fruit */
function drawTangerineTree(g,x,y,s){
  g.save();
  g.fillStyle='rgba(74,58,44,.16)';g.beginPath();g.ellipse(x+4*s,y+4*s,22*s,6*s,0,0,7);g.fill();
  inked(g,MIN.brown,3);g.fillStyle=MIN.brown;
  rr(g,x-4*s,y-22*s,8*s,26*s,3);fillStroke(g);
  // full leafy canopy from overlapping blobs
  inked(g,MIN.greenD,3);
  g.beginPath();g.arc(x-9*s,y-32*s,13*s,0,7);g.arc(x+10*s,y-33*s,13*s,0,7);g.arc(x,y-43*s,15*s,0,7);fillStroke(g);
  g.fillStyle=MIN.green;
  for(const[dx,dy,r] of [[-9,-32,9],[10,-33,9],[0,-43,11]]){g.beginPath();g.arc(x+dx*s,y+dy*s,r*s,0,7);g.fill();}
  g.fillStyle=MIN.greenL;
  for(const[dx,dy,r] of [[-12,-37,4],[6,-39,4.5],[2,-47,4]]){g.beginPath();g.arc(x+dx*s,y+dy*s,r*s,0,7);g.fill();}
  // tangerines — plump and plentiful
  for(const[dx,dy] of [[-13,-28],[-5,-34],[6,-30],[13,-34],[-10,-41],[2,-45],[12,-43],[-2,-25],[9,-38],[-15,-35],[16,-29],[5,-39]]){
    g.fillStyle='#f0901f';g.strokeStyle=MIN.ink;g.lineWidth=1.4;
    g.beginPath();g.arc(x+dx*s,y+dy*s,3.1*s,0,7);g.fill();g.stroke();
    g.fillStyle='rgba(255,235,190,.7)';g.beginPath();g.arc(x+(dx-0.8)*s,(y+dy*s)-0.9*s,1*s,0,7);g.fill();
    g.fillStyle=MIN.greenD;g.beginPath();g.arc(x+dx*s,(y+dy*s)-2.9*s,1*s,0,7);g.fill();
  }
  g.restore();
}
/* simple lollipop cartoon tree */
function drawTree(g,x,y,s){
  g.save();
  g.fillStyle='rgba(74,58,44,.16)';g.beginPath();g.ellipse(x+4*s,y+4*s,20*s,6*s,0,0,7);g.fill();
  inked(g,MIN.brown,3);g.fillStyle=MIN.brown;
  rr(g,x-4*s,y-22*s,8*s,26*s,3);fillStroke(g);
  // one round leafy canopy
  inked(g,MIN.greenD,3);g.beginPath();g.arc(x,y-34*s,20*s,0,7);fillStroke(g);
  g.fillStyle=MIN.green;g.beginPath();g.arc(x,y-34*s,14*s,0,7);g.fill();
  g.fillStyle=MIN.greenL;g.beginPath();g.arc(x-6*s,y-40*s,6*s,0,7);g.fill();
  g.restore();
}

/* simple flat cartoon roof (trapezoid) */
function drawTiledRoof(g,x,y,w,h,band){
  g.save();
  inked(g,band||MIN.roofA,3);
  // a clean trapezoid roof with a small overhang
  g.beginPath();
  g.moveTo(x-6,y+h);
  g.lineTo(x+w*0.18,y+3);
  g.lineTo(x+w*0.82,y+3);
  g.lineTo(x+w+6,y+h);
  g.closePath();fillStroke(g);
  // one flat highlight stripe + a couple of tile seams
  g.fillStyle='rgba(255,255,255,.18)';
  g.beginPath();g.moveTo(x+w*0.18,y+3);g.lineTo(x+w*0.30,y+3);g.lineTo(x+w*0.06,y+h);g.lineTo(x-2,y+h);g.closePath();g.fill();
  g.strokeStyle='rgba(74,58,44,.35)';g.lineWidth=1.4;
  g.beginPath();g.moveTo(x-2,y+h*0.6+1);g.lineTo(x+w+2,y+h*0.6+1);g.stroke();
  g.restore();
}

/* Jeju Dongmun Market gate — the co-op's market entrance */
function drawMarketGate(g,b){
  const x=b.x, y=b.y, w=b.w, h=b.h, top=y+5, cx=x+w/2;
  g.save();
  g.fillStyle='rgba(20,12,8,.18)';g.beginPath();g.ellipse(cx,y+h+4,w*0.56,9,0,0,7);g.fill();
  // dark slate arched gate body with a humped (cloud) top
  inked(g,'#3b4047',3);
  g.beginPath();
  g.moveTo(x,y+h);
  g.lineTo(x,top+20);
  g.quadraticCurveTo(x+w*0.16,top,x+w*0.33,top+9);
  g.quadraticCurveTo(cx,top-5,x+w*0.67,top+9);
  g.quadraticCurveTo(x+w*0.84,top,x+w,top+20);
  g.lineTo(x+w,y+h);
  g.closePath();fillStroke(g);
  g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x,top+18,w,4);
  // arched entrance opening
  const ow=w*0.48, ox=cx-ow/2, oTop=y+h-44;
  g.fillStyle='#14181c';
  g.beginPath();g.moveTo(ox,y+h);g.lineTo(ox,oTop+10);g.quadraticCurveTo(cx,oTop-8,ox+ow,oTop+10);g.lineTo(ox+ow,y+h);g.closePath();g.fill();
  // warm market light + a hint of stalls inside
  g.fillStyle='rgba(255,196,110,.22)';g.fillRect(ox+3,oTop,ow-6,y+h-oTop-2);
  for(let i=0;i<5;i++){g.fillStyle=['#e8943a','#c0506e','#7bb24a','#f2c75a'][i%4];g.beginPath();g.arc(ox+6+i*((ow-12)/4),y+h-8,1.6,0,7);g.fill();}
  // three overlapping logo circles
  const lx=x+16, ly=top+16;
  g.fillStyle='#e8943a';g.beginPath();g.arc(lx,ly,4,0,7);g.fill();
  g.fillStyle='#4aa3c7';g.beginPath();g.arc(lx+5,ly-2.5,3.4,0,7);g.fill();
  g.fillStyle='#7bb24a';g.beginPath();g.arc(lx+3,ly+3,3,0,7);g.fill();
  // market name sign
  g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
  g.font='700 13px "Gowun Batang", serif';
  g.lineWidth=2.6;g.strokeStyle='rgba(8,14,18,.5)';g.strokeText('Jeju Market', cx+8, top+15);
  g.fillStyle='#bfe3ee';g.fillText('Jeju Market', cx+8, top+15);
  g.font='700 6px "Space Mono", monospace';g.fillStyle='#9fc4d0';g.fillText('JEJU DONGMUN MARKET', cx+8, top+26);
  g.restore();
}
/* a small hanging wooden nameboard mounted on a building (baked into the backdrop) */
function gNameSign(g, cx, cy, kr){
  g.save();
  g.font='700 10px "Gowun Batang", serif';
  const tw=g.measureText(kr).width;
  const w=Math.max(34, tw+18), h=16;
  g.strokeStyle='rgba(40,28,16,.6)';g.lineWidth=1.4;
  g.beginPath();g.moveTo(cx-w*0.34,cy-h/2-5);g.lineTo(cx-w*0.34,cy-h/2);g.moveTo(cx+w*0.34,cy-h/2-5);g.lineTo(cx+w*0.34,cy-h/2);g.stroke();
  inked(g,'#3a2c1e',2);rr(g,cx-w/2,cy-h/2,w,h,3);fillStroke(g);
  g.strokeStyle='rgba(227,177,58,.65)';g.lineWidth=1;rr(g,cx-w/2+2.5,cy-h/2+2.5,w-5,h-5,2);g.stroke();
  g.fillStyle=MIN.gold;g.textAlign='left';g.textBaseline='middle';
  // a tiny coral heart, then the text
  const hx=cx-tw/2-7, hy=cy+0.5;
  g.fillStyle='#e8714a';
  g.beginPath();g.moveTo(hx,hy+1.4);g.bezierCurveTo(hx-2.6,hy-1.2,hx-1.1,hy-3,hx,hy-1.4);
  g.bezierCurveTo(hx+1.1,hy-3,hx+2.6,hy-1.2,hx,hy+1.4);g.closePath();g.fill();
  g.fillStyle=MIN.gold;g.fillText(kr,cx-tw/2,cy+0.5);
  g.restore();
}
/* traditional Jeju thatched house — domed straw thatch, basalt stone walls, wooden lattice doors + raised porch */
function drawJejuHouse(g,b){
  const x=b.x, y=b.y, w=b.w, h=b.h;
  const wallTop=y+h*0.50, wallH=(y+h)-wallTop;
  g.save();
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(x+w/2,y+h+4,w*0.58,9,0,0,7);g.fill();
  // ---- basalt stone wall ----
  drawStoneBlocks(g, x, wallTop, w, wallH, 313);
  g.strokeStyle=MIN.ink;g.lineWidth=2.6;g.lineJoin='round';g.strokeRect(x,wallTop,w,wallH);
  // ---- wooden facade with sliding lattice doors ----
  const fw=w*0.52, fx=x+(w-fw)/2, fy=wallTop+3, fh=wallH-5;
  inked(g,'#9c6b3a',2.4);rr(g,fx,fy,fw,fh,2);fillStroke(g);
  g.fillStyle='#7a4f2a';g.fillRect(fx,fy,3,fh);g.fillRect(fx+fw-3,fy,3,fh);
  const pw=(fw-6)/2;
  for(let i=0;i<2;i++){
    const px=fx+3+i*pw, py=fy+3, ph=fh-6;
    inked(g,'#caa06a',1.6);rr(g,px+1,py,pw-2,ph,1.5);fillStroke(g);
    g.fillStyle='#dfe7dd';g.fillRect(px+3,py+2,pw-6,ph-4);
    g.strokeStyle='rgba(90,60,30,.5)';g.lineWidth=1;
    for(let gx=px+3;gx<px+pw-3;gx+=5){g.beginPath();g.moveTo(gx,py+2);g.lineTo(gx,py+ph-2);g.stroke();}
    for(let gy=py+2;gy<py+ph-2;gy+=5){g.beginPath();g.moveTo(px+3,gy);g.lineTo(px+pw-3,gy);g.stroke();}
  }
  inked(g,MIN.gold,1.2);g.beginPath();g.arc(fx+fw/2-2.5,fy+fh*0.52,1.5,0,7);g.arc(fx+fw/2+2.5,fy+fh*0.52,1.5,0,7);fillStroke(g);
  // painted lintel beam (Jeju houses often have a blue-green painted board)
  inked(g,'#6fae9e',2);rr(g,fx-6,wallTop-3,fw+12,6,2);fillStroke(g);
  // ---- raised wooden porch ----
  const dyP=y+h-6;
  inked(g,'#b07f3c',2.2);rr(g,fx-9,dyP-6,fw+18,10,2);fillStroke(g);
  g.strokeStyle='rgba(60,36,12,.3)';g.lineWidth=1;
  for(let px=fx-7;px<fx+fw+10;px+=10){g.beginPath();g.moveTo(px,dyP-6);g.lineTo(px,dyP+4);g.stroke();}
  // ---- domed straw thatch roof ----
  const ry=y+2, rby=wallTop+4, rh=rby-ry, rx0=x-9, rx1=x+w+9, cxr=x+w/2;
  inked(g,'#c7a056',3);
  g.beginPath();
  g.moveTo(rx0,rby);
  g.quadraticCurveTo(rx0+(rx1-rx0)*0.16, ry, cxr, ry-3);
  g.quadraticCurveTo(rx1-(rx1-rx0)*0.16, ry, rx1, rby);
  g.closePath();fillStroke(g);
  // ---- signature straw-rope net (jipjul) tying the thatch against Jeju's wind ----
  g.lineCap='round';
  const ropeC='#9c7a3a', ropeHi='rgba(255,238,188,.45)';
  const vN=6, verts=[];
  for(let i=0;i<vN;i++){
    const f=(i+0.5)/vN;
    const xb=rx0+(rx1-rx0)*f;            // anchored at the eave
    const xt=cxr+(xb-cxr)*0.30;          // converging toward the ridge
    verts.push({xb,xt});
    g.strokeStyle=ropeC;g.lineWidth=2;
    g.beginPath();g.moveTo(xt,ry+1);g.quadraticCurveTo((xt+xb)/2, ry+rh*0.46, xb, rby-0.5);g.stroke();
    g.strokeStyle=ropeHi;g.lineWidth=0.8;
    g.beginPath();g.moveTo(xt,ry+1.6);g.quadraticCurveTo((xt+xb)/2, ry+rh*0.46, xb, rby-1);g.stroke();
  }
  // horizontal ropes bowing across the dome
  const rows=[0.30,0.56,0.80];
  for(const hf of rows){
    const halfW=(rx1-rx0)*0.5*(1-hf*0.46);
    const yE=rby-(rby-(ry+3))*hf+2;
    g.strokeStyle=ropeC;g.lineWidth=2;
    g.beginPath();g.moveTo(cxr-halfW,yE);g.quadraticCurveTo(cxr,yE-6,cxr+halfW,yE);g.stroke();
    g.strokeStyle=ropeHi;g.lineWidth=0.8;
    g.beginPath();g.moveTo(cxr-halfW,yE-0.6);g.quadraticCurveTo(cxr,yE-6.6,cxr+halfW,yE-0.6);g.stroke();
  }
  // little knots where the ropes cross
  g.fillStyle='#7a5e2c';
  for(const v of verts){ for(const hf of rows){
    const t=1-hf;
    const kx=v.xt+(v.xb-v.xt)*t;
    const ky=(ry+1)+((rby-0.5)-(ry+1))*t;
    g.beginPath();g.arc(kx,ky,1.3,0,7);g.fill();
  }}
  // darker eave rim + ridge cap
  g.strokeStyle='#9c7a3a';g.lineWidth=2.6;g.beginPath();g.moveTo(rx0,rby);g.lineTo(rx1,rby);g.stroke();
  inked(g,'#8f6f33',1.8);rr(g,cxr-11,ry-3,22,6,3);fillStroke(g);
  // hanging nameboard over the doorway
  gNameSign(g, x+w/2, wallTop-14, 'home sweet home');
  g.restore();
}
/* wavy corrugated-tin roof (Jeju village) — terracotta by default, pass col for blue metal etc. */
function drawCorrugatedRoof(g,x,y,w,h,col,colD){
  col=col||'#bf5130'; colD=colD||'#8f3a1f';
  g.save();
  inked(g,col,2.6);
  g.beginPath();
  g.moveTo(x,y+2);
  g.quadraticCurveTo(x+w*0.5,y-2,x+w,y+1);     // slightly arched ridge
  g.lineTo(x+w,y+h-3);
  const bumps=Math.max(6,Math.round(w/8));
  for(let i=bumps;i>=0;i--){ const bx=x+(i/bumps)*w; g.lineTo(bx, y+h-3+(i%2?3:0)); }   // scalloped eave
  g.closePath();fillStroke(g);
  // vertical corrugation seams
  g.strokeStyle=colD;g.globalAlpha=0.5;g.lineWidth=1.1;
  for(let cx=x+5;cx<x+w;cx+=5){g.beginPath();g.moveTo(cx,y+1);g.lineTo(cx,y+h-3);g.stroke();}
  g.globalAlpha=1;
  g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x+2,y+2,w-4,2);
  g.strokeStyle=colD;g.lineWidth=2;g.beginPath();g.moveTo(x,y+h-3);g.lineTo(x+w,y+h-3);g.stroke();
  g.restore();
}
/* ---- little window-display dive-gear icons (teal & orange, per the gear-set look) ---- */
function gearMask(g,x,y){
  g.save();g.translate(x,y);g.lineJoin='round';
  g.strokeStyle='#f0a93a';g.lineWidth=2.4;g.lineCap='round';
  g.beginPath();g.moveTo(7,-6);g.quadraticCurveTo(11,-6,11,0);g.lineTo(11,6);g.stroke();
  inked(g,'#3a8fa6',1.8);rr(g,-9,-5,16,9,3);fillStroke(g);
  g.fillStyle='#bfe3ef';rr(g,-7,-3.5,5.5,6,1.5);g.fill();rr(g,0.6,-3.5,5.5,6,1.5);g.fill();
  g.restore();
}
function gearFins(g,x,y){
  g.save();g.translate(x,y);g.lineJoin='round';
  for(const s of [-1,1]){g.save();g.translate(s*3.6,0);g.rotate(s*0.2);
    inked(g,'#f0a93a',1.6);rr(g,-3,-8,6,12,2);fillStroke(g);
    inked(g,'#3a8fa6',1.4);rr(g,-2.4,3,4.8,4.4,1.6);fillStroke(g);
    g.restore();}
  g.restore();
}
function gearWetsuit(g,x,y){
  g.save();g.translate(x,y);g.lineJoin='round';
  inked(g,'#2f6f80',1.8);
  rr(g,-5,-8,10,9,3);fillStroke(g);
  rr(g,-5,0,4.4,9,2);fillStroke(g);rr(g,0.6,0,4.4,9,2);fillStroke(g);
  rr(g,-8.6,-7,3.6,7,1.6);fillStroke(g);rr(g,5,-7,3.6,7,1.6);fillStroke(g);
  g.strokeStyle='#f0a93a';g.lineWidth=1.3;g.beginPath();g.moveTo(0,-7);g.lineTo(0,0);g.stroke();
  g.restore();
}
function gearTank(g,x,y){
  g.save();g.translate(x,y);g.lineJoin='round';
  inked(g,'#3a8fa6',1.8);rr(g,-5,-6,4.4,12,2);fillStroke(g);rr(g,0.6,-6,4.4,12,2);fillStroke(g);
  g.fillStyle='#cdd2d8';g.strokeStyle=MIN.ink;g.lineWidth=1;rr(g,-5.2,-8,10.4,2.6,1);fillStroke(g);
  g.strokeStyle='#9aa0a8';g.lineWidth=1;g.beginPath();g.moveTo(-2.4,-8);g.lineTo(-2.4,-10);g.lineTo(2.4,-10);g.lineTo(2.4,-8);g.stroke();
  g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=1;g.beginPath();g.moveTo(-3.4,-4);g.lineTo(-3.4,4);g.stroke();
  g.restore();
}
/* Jeju village gear shop — corrugated roof, plaster+basalt wall, big display window, bench & hanging sign */
function drawGearShop(g,b){
  const x=b.x,y=b.y,w=b.w,h=b.h;
  const roofH=Math.round(h*0.30);
  const wallTop=y+roofH-2, wallBot=y+h, wallH=wallBot-wallTop;
  g.save();
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(x+w/2,y+h+4,w*0.56,9,0,0,7);g.fill();
  // ---- rough concrete / plaster wall ----
  inked(g,'#bdb6a8',2.4);g.beginPath();g.rect(x,wallTop,w,wallH);fillStroke(g);
  const rng=mulberry32(48);
  g.fillStyle='rgba(110,100,86,.18)';
  for(let i=0;i<28;i++){g.beginPath();g.arc(x+rng()*w,wallTop+rng()*wallH,1+rng()*2.4,0,7);g.fill();}
  // basalt stone left pier
  const pierW=Math.round(w*0.30);
  drawStoneBlocks(g,x,wallTop,pierW,wallH,71);
  g.strokeStyle=MIN.ink;g.lineWidth=2.4;g.strokeRect(x,wallTop,pierW,wallH);
  // ---- big display window ----
  const wx=x+pierW+6, wy=wallTop+9, ww=(x+w)-wx-5, wh=wallBot-wy-13;
  inked(g,'#7a4a28',2.6);rr(g,wx-3,wy-3,ww+6,wh+8,2);fillStroke(g);
  g.fillStyle='#d2e2da';rr(g,wx,wy,ww,wh,1);g.fill();
  g.fillStyle='#fff6e0';g.fillRect(wx,wy,ww,3);              // light bar
  // ---- dive gear on display for window-shopping ----
  g.save();g.beginPath();g.rect(wx,wy,ww,wh);g.clip();
  g.fillStyle='rgba(255,240,210,.3)';g.fillRect(wx,wy,ww,wh);          // warm interior
  const shelfY=wy+wh*0.54;
  g.strokeStyle='rgba(110,70,40,.55)';g.lineWidth=2;g.beginPath();g.moveTo(wx+2,shelfY);g.lineTo(wx+ww-2,shelfY);g.stroke();
  g.fillStyle='rgba(255,255,255,.18)';g.fillRect(wx+2,shelfY-1.5,ww-4,1.5);
  gearMask(g,   wx+ww*0.27, wy+wh*0.27);
  gearFins(g,   wx+ww*0.73, wy+wh*0.25);
  gearWetsuit(g,wx+ww*0.28, wy+wh*0.80);
  gearTank(g,   wx+ww*0.74, wy+wh*0.78);
  g.restore();
  g.strokeStyle='rgba(90,60,30,.4)';g.lineWidth=1.2;g.beginPath();g.moveTo(wx+ww/2,wy);g.lineTo(wx+ww/2,wy+wh);g.stroke();
  // ---- round wall lamp above window ----
  inked(g,'#3a3a3a',1.6);g.beginPath();g.arc(wx+5,wallTop+5,3,0,7);fillStroke(g);
  g.fillStyle='#fff3cf';g.beginPath();g.arc(wx+5,wallTop+5,1.6,0,7);g.fill();
  // ---- wooden bench / counter under the window ----
  inked(g,'#6e4327',2.2);rr(g,wx-4,wallBot-11,ww+8,6,1.5);fillStroke(g);
  g.fillStyle='#caa06a';g.fillRect(wx,wallBot-5,3,5);g.fillRect(wx+ww-3,wallBot-5,3,5);
  // ---- corrugated tin roof + concrete ridge cap ----
  drawCorrugatedRoof(g,x-7,y,w+14,roofH);
  g.fillStyle='#cfc7b8';g.strokeStyle=MIN.ink;g.lineWidth=1.8;
  g.beginPath();g.ellipse(x+7,y+2,11,5.5,-0.18,0,7);fillStroke(g);
  // ---- hanging wooden signboard on the pier ----
  const sbx=x+3, sby=wallTop+20, sbw=pierW-2, sbh=15;
  g.strokeStyle=MIN.ink;g.lineWidth=1.2;
  g.beginPath();g.moveTo(sbx+4,wallTop+13);g.lineTo(sbx+2,sby);g.moveTo(sbx+sbw-4,wallTop+13);g.lineTo(sbx+sbw-2,sby);g.stroke();
  inked(g,'#ece0c4',2);rr(g,sbx,sby,sbw,sbh,2);fillStroke(g);
  g.fillStyle='#e8943a';g.beginPath();g.arc(sbx+6,sby+5.5,2.6,0,7);g.fill();
  g.fillStyle=MIN.greenD;g.beginPath();g.arc(sbx+6,sby+3.2,0.9,0,7);g.fill();
  g.fillStyle=MIN.ink2;g.font='700 7px "Gowun Batang",serif';g.textAlign='center';g.textBaseline='middle';
  g.fillText('gear', sbx+sbw*0.5+3, sby+10);
  g.restore();
}
/* modern renovated Jeju stone cottage — basalt walls, blue metal roof, warm-lit glass, deck, fairy lights */
function drawModernStoneHouse(g,b){
  const x=b.x,y=b.y,w=b.w,h=b.h;
  const roofH=20;
  const wallTop=y+roofH-2, wallBot=y+h-9, wallH=wallBot-wallTop;
  g.save();
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(x+w/2,y+h,w*0.56,8,0,0,7);g.fill();
  // ---- basalt stone walls ----
  drawStoneBlocks(g,x,wallTop,w,wallH,91);
  g.strokeStyle=MIN.ink;g.lineWidth=2.4;g.lineJoin='round';g.strokeRect(x,wallTop,w,wallH);
  // ---- big glass sliding door (right) with warm interior ----
  const gx=x+w*0.42, gy=wallTop+6, gw=w*0.52, gh=wallH-8;
  inked(g,'#5a3a22',2.4);rr(g,gx-2,gy-2,gw+4,gh+4,1);fillStroke(g);
  g.fillStyle='#37423d';g.fillRect(gx,gy,gw,gh);
  g.fillStyle='rgba(255,196,120,.6)';g.fillRect(gx+2,gy+2,gw-4,gh-4);
  g.fillStyle='rgba(120,70,40,.5)';rr(g,gx+4,gy+gh*0.5,gw*0.5,gh*0.4,2);g.fill();   // sofa hint
  g.fillStyle='#fff1c0';g.beginPath();g.arc(gx+gw-7,gy+gh*0.42,2.2,0,7);g.fill();    // warm lamp
  g.strokeStyle='rgba(50,35,20,.55)';g.lineWidth=1.4;
  g.beginPath();g.moveTo(gx+gw/2,gy);g.lineTo(gx+gw/2,gy+gh);g.stroke();
  g.beginPath();g.moveTo(gx+gw*0.25,gy);g.lineTo(gx+gw*0.25,gy+gh);g.stroke();
  // ---- wood entry door (center-left) ----
  const dw=15,dh=wallH-10,dx=x+w*0.26-dw/2,dy=wallBot-dh;
  inked(g,'#8a5a30',2.2);rr(g,dx,dy,dw,dh,1.5);fillStroke(g);
  g.fillStyle='#ede4d2';rr(g,dx+3,dy+3,dw-6,dh*0.38,1);g.fill();
  inked(g,MIN.gold,1.2);g.beginPath();g.arc(dx+dw-4,dy+dh/2,1.4,0,7);fillStroke(g);
  // ---- small window left of door ----
  const lw=12, lx=x+6, ly=wallTop+8;
  inked(g,'#5a3a22',2);rr(g,lx-1,ly-1,lw+2,14,1);fillStroke(g);
  g.fillStyle='rgba(255,196,120,.55)';g.fillRect(lx,ly,lw,12);
  g.strokeStyle='rgba(50,35,20,.5)';g.lineWidth=1;g.beginPath();g.moveTo(lx+lw/2,ly);g.lineTo(lx+lw/2,ly+12);g.stroke();
  // ---- wood corner posts ----
  inked(g,'#7a4f2a',1.8);rr(g,x-1,wallTop,4,wallH,1);fillStroke(g);rr(g,x+w-3,wallTop,4,wallH,1);fillStroke(g);
  // ---- blue corrugated metal roof ----
  drawCorrugatedRoof(g,x-7,y,w+14,roofH,'#4f7bad','#33567f');
  // ---- wooden deck across the front ----
  inked(g,'#9c6b3a',2);rr(g,x-3,wallBot,w+6,8,1.5);fillStroke(g);
  g.strokeStyle='rgba(60,36,12,.35)';g.lineWidth=1;
  for(let px=x;px<x+w;px+=9){g.beginPath();g.moveTo(px,wallBot+1);g.lineTo(px,wallBot+7);g.stroke();}
  // ---- pergola post + draped fairy lights across the front ----
  const p1x=x+2, p2x=x+w-2, topY=wallTop-3, sag=10;
  inked(g,'#7a4f2a',1.6);rr(g,p1x-1,topY,3,wallTop-topY+2,1);fillStroke(g);
  g.strokeStyle='rgba(40,30,20,.6)';g.lineWidth=1.2;
  g.beginPath();g.moveTo(p1x,topY);g.quadraticCurveTo(x+w/2,topY+2*sag,p2x,topY);g.stroke();
  for(let i=0;i<=8;i++){const t=i/8;const bx=p1x+(p2x-p1x)*t;const by=topY+2*(1-t)*t*2*sag;
    g.fillStyle='rgba(255,243,200,.55)';g.beginPath();g.arc(bx,by,3,0,7);g.fill();
    g.fillStyle=MIN.gold;g.beginPath();g.arc(bx,by,1.5,0,7);g.fill();}
  g.restore();
}
/* a Korean pojangmacha (포장마차) — raised & open for business after 17:00, folded
   down into a tarp bundle during the day (just like the real street stalls). */
function drawPojangmacha(g,b){
  const raised = (typeof G!=='undefined') ? G.time>=17*60 : true;
  if(raised) drawPojangmachaUp(g,b); else drawPojangmachaFolded(g,b);
}
/* daytime — the tarp folded down into a low bound roll, packed away on the sand
   (kept short and within its own footprint so it never overlaps the bulteok) */
function drawPojangmachaFolded(g,b){
  const x=b.x,y=b.y,w=b.w,h=b.h, baseY=y+h, cx=x+w/2;
  g.save(); g.lineJoin='round'; g.lineCap='round';
  const tarp='#c14e28', tarpHi='#d96a3f', frame='#5e3f26', ink=MIN.ink;
  const topY=baseY-26;                          // a low, packed-down bundle
  g.fillStyle='rgba(20,12,8,.2)'; g.beginPath(); g.ellipse(cx,baseY+2,w*0.46,7,0,0,7); g.fill();
  // short collapsed frame poles lying along the top of the roll (no tall overhang)
  g.strokeStyle=frame; g.lineWidth=4;
  g.beginPath(); g.moveTo(x+12,topY+4); g.lineTo(x+w-16,topY-2); g.stroke();
  g.beginPath(); g.moveTo(x+16,topY+9); g.lineTo(x+w-12,topY+3); g.stroke();
  // the low folded tarp roll
  g.fillStyle=tarp; g.strokeStyle=ink; g.lineWidth=2.6;
  g.beginPath();
  g.moveTo(x+8,baseY);
  g.quadraticCurveTo(x+4,topY+6, x+w*0.32,topY+2);
  g.lineTo(x+w-14,topY+4);
  g.quadraticCurveTo(x+w-4,topY+8, x+w-6,baseY);
  for(let i=0;i<=4;i++){ const bx=x+w-6-(i/4)*(w-14); g.lineTo(bx, baseY+(i%2?3:0)); }
  g.closePath(); fillStroke(g);
  // rolled horizontal folds + a binding strap
  g.strokeStyle='rgba(60,25,10,.30)'; g.lineWidth=1.3;
  for(let i=1;i<3;i++){ const fy=topY+(baseY-topY)*i/3; g.beginPath(); g.moveTo(x+10,fy); g.quadraticCurveTo(cx,fy-3,x+w-8,fy+1); g.stroke(); }
  g.strokeStyle=frame; g.lineWidth=3; g.beginPath(); g.moveTo(cx,topY+2); g.lineTo(cx,baseY); g.stroke();
  g.globalAlpha=.4; g.fillStyle=tarpHi; g.beginPath(); g.ellipse(x+w*0.42,topY+7,w*0.2,4,0,0,7); g.fill(); g.globalAlpha=1;
  g.restore();
}
/* evening — the tent raised, enclosed, window glowing warm */
function drawPojangmachaUp(g,b){
  const x=b.x, y=b.y, w=b.w, h=b.h, baseY=y+h, cx=x+w/2;
  const tnow=performance.now()*0.001;
  g.save(); g.lineJoin='round'; g.lineCap='round';
  const tarp='#d9542a', tarpHi='#ef7e54', tarpSh='#b8431d', valance='#c2461f',
        wood='#9c6b3a', woodD='#5e3f26', cream='#fbf3df', ink=MIN.ink,
        steel='#9aa0a6', steelD='#5c6066', navy='#2f3a5c';
  const sideW=Math.round(w*0.16), fx0=x+sideW, fw=w-sideW, topY=y+22;
  // soft contact shadow on the sand
  g.fillStyle='rgba(20,12,8,.20)'; g.beginPath(); g.ellipse(cx,baseY+3,w*0.58,9,0,0,7); g.fill();
  // ---- steel frame poles (a touch taller than the canvas) ----
  g.strokeStyle=steelD; g.lineWidth=4.5; g.beginPath(); g.moveTo(fx0+2,topY-6); g.lineTo(fx0+2,baseY); g.moveTo(x+w-3,topY-6); g.lineTo(x+w-3,baseY); g.stroke();
  g.strokeStyle=steel; g.lineWidth=2; g.beginPath(); g.moveTo(fx0+1,topY-6); g.lineTo(fx0+1,baseY); g.moveTo(x+w-4,topY-6); g.lineTo(x+w-4,baseY); g.stroke();
  // ---- left side wall — depth ----
  g.fillStyle=tarpSh; g.strokeStyle=ink; g.lineWidth=2.6;
  g.beginPath(); g.moveTo(x+3,topY+12); g.quadraticCurveTo(x+1,topY+3,fx0,topY+1); g.lineTo(fx0,baseY); g.lineTo(x+3,baseY-2); g.closePath(); g.fill(); g.stroke();
  // ---- front canvas with rounded top + wavy hem ----
  g.fillStyle=tarp; g.strokeStyle=ink; g.lineWidth=2.8;
  g.beginPath();
  g.moveTo(fx0,topY+14); g.quadraticCurveTo(fx0,topY,fx0+14,topY);
  g.lineTo(x+w-14,topY); g.quadraticCurveTo(x+w,topY,x+w,topY+14);
  g.lineTo(x+w,baseY-6);
  for(let i=0;i<=4;i++){ const bx=x+w-(i/4)*fw; g.quadraticCurveTo(bx+fw/8,baseY+(i%2?2:7),bx,baseY+(i%2?5:1)); }
  g.closePath(); g.fill(); g.stroke();
  g.globalAlpha=.35; g.fillStyle=tarpHi; g.beginPath(); g.moveTo(fx0+8,topY+18); g.quadraticCurveTo(fx0+3,baseY-20,fx0+13,baseY-12); g.lineTo(fx0+20,baseY-14); g.quadraticCurveTo(fx0+16,topY+20,fx0+8,topY+18); g.closePath(); g.fill(); g.globalAlpha=1;
  // ---- draped scalloped valance ----
  g.fillStyle=valance; g.strokeStyle=ink; g.lineWidth=2.2;
  g.beginPath(); g.moveTo(fx0-2,topY+1); g.lineTo(x+w+2,topY+1); g.lineTo(x+w+2,topY+12);
  const sc=6; for(let i=0;i<=sc;i++){ const sx2=x+w+2-(i/sc)*(fw+4); g.quadraticCurveTo(sx2+(fw+4)/sc/2,topY+19,sx2,topY+12); }
  g.closePath(); g.fill(); g.stroke();
  g.globalAlpha=.4; g.fillStyle=tarpHi; g.fillRect(fx0+2,topY+3,fw-4,3); g.globalAlpha=1;
  // ---- window with a cozy interior (grill · soju · hanging menu strips) ----
  const wx=fx0+8, wy=topY+18, ww=fw*0.50, wh=h*0.40;
  g.save(); rr(g,wx,wy,ww,wh,4); g.clip();
  const wg=g.createLinearGradient(wx,wy,wx,wy+wh); wg.addColorStop(0,'#ffe6a6'); wg.addColorStop(1,'#f0a23a');
  g.fillStyle=wg; g.fillRect(wx,wy,ww,wh);
  g.strokeStyle='rgba(150,80,50,.30)'; g.lineWidth=1; for(let ry=wy+4; ry<wy+wh*0.55; ry+=5){ g.beginPath(); g.moveTo(wx,ry); g.lineTo(wx+ww,ry); g.stroke(); }   // brick
  const bf=0.8+0.2*Math.sin(tnow*5);
  g.strokeStyle='rgba(60,40,20,.5)'; g.lineWidth=1; g.beginPath(); g.moveTo(wx+ww*0.30,wy); g.lineTo(wx+ww*0.30,wy+5); g.stroke();
  g.fillStyle=`rgba(255,245,200,${bf.toFixed(2)})`; g.beginPath(); g.arc(wx+ww*0.30,wy+6,2.3,0,7); g.fill();   // bulb
  g.fillStyle='rgba(70,38,20,.55)'; g.fillRect(wx,wy+wh*0.72,ww,wh*0.28);   // counter
  g.fillStyle='#3a2a22'; rr(g,wx+ww*0.08,wy+wh*0.60,ww*0.40,wh*0.12,2); g.fill();   // grill
  for(let fi=0;fi<3;fi++){ g.fillStyle='#cda45e'; g.beginPath(); g.ellipse(wx+ww*0.16+fi*ww*0.13, wy+wh*0.64, ww*0.055, wh*0.045,0,0,7); g.fill(); }   // grilling fish
  g.fillStyle='rgba(40,22,12,.7)'; g.beginPath(); g.ellipse(wx+ww*0.72,wy+wh*0.64,ww*0.12,wh*0.10,0,Math.PI,0); g.fill();   // pot
  g.strokeStyle='rgba(255,250,230,.55)'; g.lineWidth=1.1; g.beginPath(); g.moveTo(wx+ww*0.72,wy+wh*0.56); g.quadraticCurveTo(wx+ww*0.66,wy+wh*0.40,wx+ww*0.72,wy+wh*0.28); g.stroke();
  for(let si=0;si<2;si++){ g.fillStyle='#5a9e54'; rr(g,wx+ww*0.55+si*5,wy+wh*0.58,3,wh*0.18,1); g.fill(); }   // soju bottles
  for(let mi=0;mi<3;mi++){ const mxx=wx+ww*0.80+mi*4; g.fillStyle='rgba(250,243,223,.92)'; g.fillRect(mxx,wy+2,3,wh*0.44);   // hanging menu strips
    g.strokeStyle='rgba(80,40,20,.4)'; g.lineWidth=0.6; for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(mxx+0.6,wy+5+k*4); g.lineTo(mxx+2.4,wy+5+k*4); g.stroke(); } }
  g.restore();
  g.strokeStyle=woodD; g.lineWidth=2.4; rr(g,wx,wy,ww,wh,4); g.stroke();
  g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(wx+4,wy+4); g.lineTo(wx+ww*0.4,wy+4); g.stroke();
  // ---- navy noren (제주 해녀마을) on the right, with haenyeo + shell ----
  const nx=x+w-25, ny=topY+13, nw=21, nh=h*0.42;
  g.fillStyle=navy; g.strokeStyle=ink; g.lineWidth=1.6; rr(g,nx,ny,nw,nh,2); fillStroke(g);
  g.strokeStyle='rgba(255,255,255,.16)'; g.lineWidth=1; for(let s=1;s<3;s++){ g.beginPath(); g.moveTo(nx+s*nw/3,ny+nh*0.5); g.lineTo(nx+s*nw/3,ny+nh); g.stroke(); }
  g.fillStyle='rgba(238,244,255,.92)'; g.beginPath(); g.arc(nx+6,ny+9,3,Math.PI*0.9,Math.PI*0.1,true); g.lineTo(nx+9,ny+12); g.lineTo(nx+3,ny+12); g.closePath(); g.fill();   // haenyeo
  g.strokeStyle='rgba(238,244,255,.85)'; g.lineWidth=1.1; g.beginPath(); g.arc(nx+15,ny+10,3,Math.PI,0); g.stroke(); for(let r=0;r<3;r++){ g.beginPath(); g.moveTo(nx+15,ny+10); g.lineTo(nx+13+r*2,ny+7.4); g.stroke(); }   // shell
  // ---- rooftop signboard: 포장마차 + wave + waving haenyeo mascot ----
  const sgw=Math.min(86,fw-4), sgx=cx-sgw/2, sgy=y-8, sgh=15;
  g.strokeStyle=woodD; g.lineWidth=2.2; g.beginPath(); g.moveTo(sgx+10,sgy+sgh); g.lineTo(sgx+10,topY+1); g.moveTo(sgx+sgw-10,sgy+sgh); g.lineTo(sgx+sgw-10,topY+1); g.stroke();
  inked(g,cream,2); rr(g,sgx,sgy,sgw,sgh,3); fillStroke(g);
  g.strokeStyle='#4f8fb0'; g.lineWidth=1.5; g.beginPath(); g.moveTo(sgx+4,sgy+sgh-5); g.quadraticCurveTo(sgx+7,sgy+sgh-9,sgx+10,sgy+sgh-5); g.quadraticCurveTo(sgx+13,sgy+sgh-1,sgx+16,sgy+sgh-5); g.stroke();   // wave
  const mhx=sgx+sgw-8, mhy=sgy+sgh/2;
  g.fillStyle='#3a4658'; g.beginPath(); g.arc(mhx,mhy,4,0,7); g.fill();
  g.fillStyle='#cfe0ee'; g.beginPath(); g.arc(mhx-0.5,mhy-0.4,2,0,7); g.fill();
  g.strokeStyle='#3a4658'; g.lineWidth=1.4; g.beginPath(); g.moveTo(mhx+3,mhy-2); g.lineTo(mhx+6,mhy-5+Math.sin(tnow*4)*1); g.stroke();   // waving
  g.fillStyle='#c2461f'; g.font='700 10px "Gowun Batang", serif'; g.textAlign='center'; g.textBaseline='middle';
  g.fillText('포장마차', cx-4, sgy+sgh/2+0.5);
  // ---- red paper lantern (맛있수다) swaying at the left pole ----
  const lny=topY+9, sway=Math.sin(tnow*1.4)*1.3, lnx=fx0-2+sway;
  g.strokeStyle=woodD; g.lineWidth=1.3; g.beginPath(); g.moveTo(fx0+1,topY-3); g.lineTo(lnx,lny-7); g.stroke();
  g.save(); g.translate(lnx,lny);
  g.fillStyle='#d3402a'; g.strokeStyle='#8e2417'; g.lineWidth=1.4; g.beginPath(); g.ellipse(0,0,6.5,8.5,0,0,7); fillStroke(g);
  g.fillStyle='#f0c23a'; g.fillRect(-6.5,-1.6,13,3.2);
  g.strokeStyle='rgba(0,0,0,.22)'; g.lineWidth=0.8; for(let s=-1;s<=1;s++){ g.beginPath(); g.moveTo(s*3,-7.5); g.lineTo(s*3,7.5); g.stroke(); }
  g.strokeStyle='#f0c23a'; g.lineWidth=1.3; g.beginPath(); g.moveTo(-2,8.5); g.lineTo(-2,11.5); g.moveTo(2,8.5); g.lineTo(2,11.5); g.stroke();
  g.restore();
  // ---- 영업중 plaque between window and noren ----
  const ogx=wx+ww+3, ogy=topY+15;
  g.strokeStyle=woodD; g.lineWidth=1.2; g.beginPath(); g.moveTo(ogx+6,topY+10); g.lineTo(ogx+6,ogy); g.stroke();
  inked(g,'#3a4658',1.6); rr(g,ogx,ogy,13,17,2); fillStroke(g);
  g.fillStyle='#ffd23a'; g.font='700 6px "Gowun Batang", serif'; g.textAlign='center'; g.textBaseline='middle';
  g.fillText('영업', ogx+6.5, ogy+6); g.fillText('중♡', ogx+6.5, ogy+12);
  // ---- steam wisps from the top ----
  g.strokeStyle='rgba(245,240,225,.5)'; g.lineWidth=2;
  for(let i=0;i<2;i++){ const sxp=fx0+16+i*10; g.beginPath(); g.moveTo(sxp,topY-1); g.quadraticCurveTo(sxp-5+Math.sin(tnow+i)*3,topY-11,sxp+Math.sin(tnow*1.3+i)*2,topY-20); g.stroke(); }
  // ---- A-frame chalkboard (오늘의 메뉴) on the sand, left of the tent ----
  const cbx=x-24, cby=baseY-28, cbw=22, cbh=29;
  g.fillStyle='rgba(20,12,8,.18)'; g.beginPath(); g.ellipse(cbx+cbw/2,baseY+1,15,4,0,0,7); g.fill();
  g.strokeStyle=woodD; g.lineWidth=2.2; g.beginPath(); g.moveTo(cbx+3,cby+cbh-2); g.lineTo(cbx,baseY); g.moveTo(cbx+cbw-3,cby+cbh-2); g.lineTo(cbx+cbw,baseY); g.stroke();
  inked(g,'#33291f',2); rr(g,cbx,cby,cbw,cbh,2); fillStroke(g);
  g.fillStyle='#dfeaae'; g.font='700 5px "Gowun Batang", serif'; g.textAlign='center'; g.textBaseline='top';
  g.fillText('오늘의', cbx+cbw/2, cby+3); g.fillText('메뉴', cbx+cbw/2, cby+9);
  g.fillStyle='#e0884a'; for(let mi=0;mi<3;mi++){ g.beginPath(); g.arc(cbx+5,cby+17+mi*4,1.3,0,7); g.fill(); }
  g.strokeStyle='#4f8fb0'; g.lineWidth=1; g.beginPath(); g.moveTo(cbx+2,cby+cbh-3); g.quadraticCurveTo(cbx+cbw/2,cby+cbh-6,cbx+cbw-2,cby+cbh-3); g.stroke();
  // ---- soju crate + orange tewak float, front-right ----
  const crx=x+w-7, cry=baseY+9;
  g.fillStyle='rgba(20,12,8,.16)'; g.beginPath(); g.ellipse(crx-2,cry+6,15,4,0,0,7); g.fill();
  inked(g,'#3f8f86',1.8); rr(g,crx-12,cry-6,18,12,2); fillStroke(g);
  g.fillStyle='#5a9e54'; for(let s=0;s<3;s++){ g.beginPath(); g.arc(crx-8+s*5,cry-7,1.7,0,7); g.fill(); }
  inked(g,'#f08a3a',2); g.beginPath(); g.arc(crx+10,cry+3,5.5,0,7); fillStroke(g);   // tewak
  g.strokeStyle='rgba(255,255,255,.45)'; g.lineWidth=0.8; g.beginPath(); g.arc(crx+10,cry+3,5.5,0,7); g.stroke(); g.beginPath(); g.moveTo(crx+5,cry+3); g.lineTo(crx+15,cry+3); g.stroke();
  // ---- plastic stools (blue + red) + a wooden bench out front ----
  const stool=(sx,sy,col)=>{ g.fillStyle='rgba(20,12,8,.18)'; g.beginPath(); g.ellipse(sx,sy+6,8,3,0,0,7); g.fill();
    inked(g,col,2); rr(g,sx-7,sy-2,14,6,3); fillStroke(g);
    g.strokeStyle=shade(col,-30); g.lineWidth=2; g.beginPath(); g.moveTo(sx-5,sy+4); g.lineTo(sx-6,sy+10); g.moveTo(sx+5,sy+4); g.lineTo(sx+6,sy+10); g.stroke(); };
  const bnx=fx0+18, bny=baseY+12;
  g.fillStyle='rgba(20,12,8,.18)'; g.beginPath(); g.ellipse(bnx+11,bny+7,21,4,0,0,7); g.fill();
  inked(g,wood,2); rr(g,bnx-2,bny-3,28,5,2); fillStroke(g);
  g.strokeStyle=woodD; g.lineWidth=2.4; g.beginPath(); g.moveTo(bnx+2,bny+2); g.lineTo(bnx+2,bny+9); g.moveTo(bnx+22,bny+2); g.lineTo(bnx+22,bny+9); g.stroke();
  stool(fx0+6, baseY+15, '#3f86c4');     // blue
  stool(fx0+fw-16, baseY+17, '#d3402a'); // red
  g.restore();
}
function drawBuilding(g,b){
  if(b.name==='home'){ drawJejuHouse(g,b); return; }
  if(b.name==='coop'){ drawMarketGate(g,b); return; }
  if(b.name==='store'){ drawGearShop(g,b); return; }
  if(b.name==='house3'){ drawModernStoneHouse(g,b); return; }
  if(b.name==='museum'){ drawMuseumBuilding(g,b); return; }
  if(b.name==='pojangmacha'){ drawPojangmacha(g,b); return; }
  if(b.name==='bulteok'){
    g.save();
    const cx=b.x+b.w/2, cy=b.y+b.h*0.52;
    const rx=b.w*0.46, ry=b.h*0.30, wallH=22;
    const rng=mulberry32(7);
    // ground shadow
    g.fillStyle='rgba(20,12,8,.20)';g.beginPath();g.ellipse(cx,cy+6,rx+8,ry+7,0,0,7);g.fill();
    // sandy floor inside the ring
    g.fillStyle='#d8c197';g.beginPath();g.ellipse(cx,cy,rx-2,ry-1,0,0,7);g.fill();
    g.fillStyle='rgba(120,90,50,.15)';g.beginPath();g.ellipse(cx,cy+2,rx-6,ry-4,0,0,7);g.fill();
    // tall standing-stone positions around the ring
    const N=16, pos=[];
    for(let i=0;i<N;i++){const a=(i/N)*6.2832; pos.push({a,sx:cx+Math.cos(a)*rx,sy:cy+Math.sin(a)*ry});}
    const gap=a=>{let d=Math.abs(((a-1.5708)+Math.PI)%6.2832-Math.PI);return d<0.6;}; // opening faces the viewer
    const stone=p=>{
      const w=10+rng()*3.5, h=wallH+rng()*8;
      const col=shade('#6f6a6f',(rng()*28-14)|0);
      inked(g,col,2.2); rr(g,p.sx-w/2,p.sy-h,w,h,w*0.45); fillStroke(g);
      g.fillStyle='rgba(255,255,255,.16)';g.beginPath();g.ellipse(p.sx,p.sy-h+2.5,w*0.34,2.4,0,0,7);g.fill();
      g.fillStyle='rgba(20,12,8,.18)';g.beginPath();g.ellipse(p.sx,p.sy-2,w*0.30,2,0,0,7);g.fill();
    };
    // back wall (far side) drawn first so the fire reads in front of it
    pos.filter(p=>p.sy<cy).sort((a,b2)=>a.sy-b2.sy).forEach(stone);
    // the fire at the heart of the bulteok
    g.strokeStyle='#5e3c22';g.lineWidth=3.4;g.lineCap='round';
    g.beginPath();g.moveTo(cx-9,cy+4);g.lineTo(cx+9,cy-2);g.moveTo(cx-9,cy-2);g.lineTo(cx+9,cy+4);g.stroke();
    g.fillStyle='#e06a2a';g.beginPath();g.moveTo(cx,cy-17);g.quadraticCurveTo(cx-9,cy-2,cx,cy+3);g.quadraticCurveTo(cx+9,cy-2,cx,cy-17);g.fill();
    g.fillStyle='#f6b03f';g.beginPath();g.moveTo(cx,cy-11);g.quadraticCurveTo(cx-5,cy-1,cx,cy+2);g.quadraticCurveTo(cx+5,cy-1,cx,cy-11);g.fill();
    g.fillStyle='#ffe49a';g.beginPath();g.ellipse(cx,cy-3,2.6,3.6,0,0,7);g.fill();
    // front wall (near side) drawn last, leaving the opening toward the viewer
    pos.filter(p=>p.sy>=cy && !gap(p.a)).sort((a,b2)=>a.sy-b2.sy).forEach(stone);
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
  // simple stone foundation strip
  inked(g,'#cdbfa8',2);g.beginPath();g.rect(x,y+h-baseH,w,baseH);fillStroke(g);
  // window — single pane with a cross
  const win=bWindow(b);
  inked(g,MIN.blueL,2.2);rr(g,win.x-1,win.y-1,18,18,2);fillStroke(g);
  g.strokeStyle=MIN.ink;g.lineWidth=1.6;
  g.beginPath();g.moveTo(win.x+8,win.y-1);g.lineTo(win.x+8,win.y+17);g.moveTo(win.x-1,win.y+8);g.lineTo(win.x+17,win.y+8);g.stroke();
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

/* Haenyeo Museum — a stone-and-plaster exhibition hall with a hanging nameboard */
function drawMuseumBuilding(g,b){
  const x=b.x,y=b.y,w=b.w,h=b.h, cx=x+w/2;
  const wallTop=y+h*0.40, wallH=h*0.60, baseH=wallH*0.42;
  g.save();
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(cx,y+h+4,w*0.58,9,0,0,7);g.fill();
  // whitewashed plaster wall
  inked(g,'#f3ece0',2.4);g.beginPath();g.rect(x,wallTop,w,wallH);fillStroke(g);
  // basalt stone foundation strip
  inked(g,'#8a8487',2);g.beginPath();g.rect(x,y+h-baseH,w,baseH);fillStroke(g);
  g.strokeStyle='rgba(20,12,8,.28)';g.lineWidth=1;
  for(let sx=x+8;sx<x+w;sx+=15){g.beginPath();g.moveTo(sx,y+h-baseH);g.lineTo(sx-3,y+h);g.stroke();}
  g.beginPath();g.moveTo(x,y+h-baseH*0.5);g.lineTo(x+w,y+h-baseH*0.5);g.stroke();
  // two display windows flanking the doorway
  const winY=wallTop+wallH*0.16, winW=w*0.24, winH=wallH*0.34;
  [x+w*0.10, x+w*0.66].forEach(wx=>{
    inked(g,'#bfe0ea',2);rr(g,wx,winY,winW,winH,2.5);fillStroke(g);
    g.strokeStyle=MIN.ink;g.lineWidth=1.4;
    g.beginPath();g.moveTo(wx+winW/2,winY);g.lineTo(wx+winW/2,winY+winH);
    g.moveTo(wx,winY+winH/2);g.lineTo(wx+winW,winY+winH/2);g.stroke();
    g.fillStyle='rgba(255,255,255,.4)';g.beginPath();g.moveTo(wx+3,winY+3);g.lineTo(wx+winW*0.4,winY+3);g.lineTo(wx+3,winY+winH*0.5);g.closePath();g.fill();
  });
  // central double timber door
  const dw=w*0.26,dh=wallH*0.62,dx=cx-dw/2,dy=y+h-dh;
  inked(g,'#7a4f2a',2.2);rr(g,dx,dy,dw,dh,2);fillStroke(g);
  g.strokeStyle='rgba(20,12,8,.42)';g.lineWidth=1.3;g.beginPath();g.moveTo(cx,dy+2);g.lineTo(cx,dy+dh);g.stroke();
  inked(g,MIN.gold,1.3);g.beginPath();g.arc(cx-3,dy+dh*0.5,1.7,0,7);g.arc(cx+3,dy+dh*0.5,1.7,0,7);fillStroke(g);
  // tiled roof + hanging nameboard
  drawTiledRoof(g,x-6,wallTop-h*0.42,w+12,h*0.42+4, b.roof||'#6a6f8c');
  gNameSign(g, cx, wallTop-12, 'Haenyeo Museum');
  g.restore();
}
/* the museum interior — the uploaded illustration, walked in front of */
let museumImg=null, museumImgTried=false;
function ensureMuseumImg(){ if(museumImgTried)return; museumImgTried=true;
  const im=new Image();
  im.onload=()=>{ if(im.decode){ im.decode().catch(()=>{}).then(()=>{museumImg=im;}); } else { museumImg=im; } };
  im.src='museum.png'; }
function drawMuseum(){
  ensureMuseumImg();
  ctx.fillStyle='#cdbfa6'; ctx.fillRect(0,0,W,H);                 // warm fallback ground
  if(museumImg){
    // cover-fit: fill the frame without distorting the wide illustration
    const s=Math.max(W/museumImg.width, H/museumImg.height);
    const dw=museumImg.width*s, dh=museumImg.height*s;
    ctx.drawImage(museumImg, (W-dw)/2, (H-dh)/2, dw, dh);
  } else { ctx.fillStyle='#7a5230'; ctx.font='600 20px "Gowun Batang",serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('Haenyeo Museum', W/2, H/2); }
  // exit mat
  inked(ctx,'#d8c089',2);ctx.setLineDash([4,3]);rr(ctx,museumExit.x,museumExit.y,museumExit.w,museumExit.h,5);fillStroke(ctx);ctx.setLineDash([]);
  // the visitor
  drawPerson(P.x,P.y,{skin:'#eccaa2',scarf:MIN.gold,face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  tag('← out', museumExit.x+museumExit.w/2, museumExit.y+museumExit.h/2, 11, MIN.gold);
}

/* ---- build & cache the static village backdrop ---- */
/* ---- beach props (flat cartoon, baked into the shore) ---- */
function drawBeachParasol(g,cx,topY,s,tilt){
  s=s||1; g.save(); g.translate(cx,topY); g.scale(s,s);
  const R=44, poleH=90, dip=7, n=6, sw=(2*R)/n;
  g.lineJoin='round';g.lineCap='round';
  // sand shadow stays flat at the pole base
  g.fillStyle='rgba(20,12,8,.15)';g.beginPath();g.ellipse(4,poleH,30,7,0,0,7);g.fill();
  // lean the whole umbrella about its base so the canopy shades the lounger
  if(tilt){ g.translate(0,poleH); g.rotate(tilt); g.translate(0,-poleH); }
  // pole
  inked(g,'#c79f5c',2.4);rr(g,-2.4,-2,4.8,poleH,2.4);fillStroke(g);
  g.fillStyle='rgba(255,255,255,.25)';g.fillRect(-1.6,2,1.5,poleH-6);
  // ---- canopy outline: domed top + scalloped fabric edge ----
  const canopy=()=>{ g.beginPath(); g.moveTo(-R,0); g.arc(0,0,R,Math.PI,Math.PI*2,false);
    for(let i=0;i<n;i++){ const x1=R-i*sw, x0=R-(i+1)*sw, xm=(x0+x1)/2; g.quadraticCurveTo(xm,dip,x0,0);} g.closePath(); };
  inked(g,'#f4f0e6',2.6); canopy(); fillStroke(g);
  // ---- coloured panels radiating from the top, alternating with cream ----
  g.save(); canopy(); g.clip();
  const wcol=[MIN.verm,MIN.teal,MIN.gold];
  for(let i=0;i<n;i+=2){
    g.fillStyle=wcol[((i/2)|0)%wcol.length];
    const a0=Math.PI+i*(Math.PI/n), a1=Math.PI+(i+1)*(Math.PI/n);
    g.beginPath();g.moveTo(0,1);g.arc(0,0,R+3,a0,a1,false);g.closePath();g.fill();
  }
  g.restore();
  // ribs (seams between panels)
  g.strokeStyle=MIN.ink;g.lineWidth=1.5;
  for(let i=1;i<n;i++){const a=Math.PI+i*(Math.PI/n);g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*R,Math.sin(a)*R);g.stroke();}
  // little rib tips at each scallop junction
  g.fillStyle='#caa05e';
  for(let i=0;i<=n;i++){const x=R-i*sw;g.beginPath();g.arc(x,1,1.4,0,7);g.fill();}
  // crisp outline over everything
  g.strokeStyle=MIN.ink;g.lineWidth=2.6; canopy(); g.stroke();
  // top finial
  g.strokeStyle='#c79f5c';g.lineWidth=2.4;g.beginPath();g.moveTo(0,-R);g.lineTo(0,-R-6);g.stroke();
  inked(g,'#c79f5c',1.8);g.beginPath();g.arc(0,-R-7.5,2.4,0,7);fillStroke(g);
  g.restore();
}
function drawTowel(g,x,y,w,h,rot,c1,c2){
  g.save();g.translate(x+w/2,y+h/2);g.rotate(rot||0);
  g.fillStyle='rgba(20,12,8,.12)';g.beginPath();g.ellipse(2,h/2+2,w*0.52,5,0,0,7);g.fill();
  inked(g,c1,2.2);rr(g,-w/2,-h/2,w,h,4);fillStroke(g);
  g.save();rr(g,-w/2,-h/2,w,h,4);g.clip();
  g.fillStyle=c2;for(let sx=-w/2;sx<w/2;sx+=12){g.fillRect(sx,-h/2,6,h);}
  g.restore();
  g.strokeStyle=MIN.ink;g.lineWidth=2.2;rr(g,-w/2,-h/2,w,h,4);g.stroke();
  g.restore();
}
function drawBench(g,x,y,s){
  s=s||1; g.save(); g.translate(x,y); g.scale(s,s);
  g.fillStyle='rgba(20,12,8,.14)';g.beginPath();g.ellipse(0,20,34,7,0,0,7);g.fill();
  // legs
  inked(g,shade(MIN.brown,-22),2.4);rr(g,-27,2,5,17,2);fillStroke(g);rr(g,22,2,5,17,2);fillStroke(g);
  // back posts + slats
  inked(g,MIN.brown,2.2);
  rr(g,-30,-28,5,30,2);fillStroke(g);rr(g,25,-28,5,30,2);fillStroke(g);
  rr(g,-31,-27,62,7,3);fillStroke(g);
  rr(g,-31,-17,62,7,3);fillStroke(g);
  // seat
  inked(g,shade(MIN.brown,16),2.4);rr(g,-33,-5,66,9,3);fillStroke(g);
  g.restore();
}
/* a beach sun-lounger (reclining deck chair): striped fabric over a slanted back + flat seat,
   short legs with feet on the sand. The head end (backrest) is on the LEFT, under the umbrella. */
function drawLounger(g,x,y,s){
  s=s||1; g.save(); g.translate(x,y); g.scale(s,s);
  g.lineJoin='round';g.lineCap='round';
  const frameD=shade('#caa05e',-26);
  // ground contact shadow
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(2,7,48,8,0,0,7);g.fill();
  // legs (behind the fabric), feet on the sand
  inked(g,frameD,3);
  g.beginPath();g.moveTo(-16,-12);g.lineTo(-25,7);g.stroke();   // rear leg
  g.beginPath();g.moveTo(28,-7);g.lineTo(33,7);g.stroke();      // front leg
  // a striped fabric bar stretched between two points
  const bar=(x1,y1,x2,y2,wd,col)=>{
    const a=Math.atan2(y2-y1,x2-x1), len=Math.hypot(x2-x1,y2-y1);
    g.save();g.translate(x1,y1);g.rotate(a);
    inked(g,col,2.4);rr(g,0,-wd/2,len,wd,wd/2);fillStroke(g);
    g.save();rr(g,0,-wd/2,len,wd,wd/2);g.clip();
    g.fillStyle='rgba(255,255,255,.92)';for(let sx=4;sx<len;sx+=11){g.fillRect(sx,-wd/2,5,wd);}
    g.restore();
    g.strokeStyle=MIN.ink;g.lineWidth=2.4;rr(g,0,-wd/2,len,wd,wd/2);g.stroke();
    g.restore();
  };
  bar(-34,-28,-12,-13,9,MIN.verm);   // slanted backrest (head end)
  bar(-13,-12,36,-7,9,MIN.verm);     // flat seat
  // little teal headrest pillow at the top of the backrest
  inked(g,MIN.teal,2.2);g.beginPath();g.ellipse(-33,-30,7,5,-0.5,0,7);fillStroke(g);
  g.restore();
}
function limb(g,ax,ay,bx,by,wd,col){
  g.lineCap='round';g.lineJoin='round';
  g.strokeStyle=MIN.ink;g.lineWidth=wd+2.4;g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.stroke();
  g.strokeStyle=col;g.lineWidth=wd;g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.stroke();
}
function joint(g,x,y,r,col){ inked(g,col,2);g.beginPath();g.arc(x,y,r,0,7);fillStroke(g); }
/* the Robot — segmented steel-blue, gentle face, inner (left) arm reaching to the clasp */
function drawBeachRobot(g,x,y,s,pose){
  s=s||1; pose=pose||'yoga'; g.save(); g.translate(x,y); g.scale(s,s);
  const steel='#9fb6c6', steelD='#7791a4', steelL='#bcccd8';
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(0,2,20,6,0,0,7);g.fill();
  if(pose==='sit') g.translate(0,20);   // settle the whole figure down onto the mat
  // segmented legs + feet
  if(pose==='tree'){
    // Vrksasana — left leg planted straight, right foot tucked to the inner thigh
    limb(g,-3,-4,-4,-30,6,steelD); joint(g,-3.5,-17,3.4,steelL);
    inked(g,steel,2.2);g.beginPath();g.ellipse(-4,-1,7,4,0,0,7);fillStroke(g);
    limb(g,4,-30,15,-21,6,steelD); limb(g,15,-21,1,-19,6,steelD);
    inked(g,steel,2);g.beginPath();g.arc(0,-19,3.4,0,7);fillStroke(g);
  } else if(pose==='surf'){
    // wide surfer stance, knees bent — thigh from hip out to knee, shin down to a planted foot
    limb(g,-6,-28,-15,-14,6,steelD); limb(g,-15,-14,-14,-1,6,steelD); joint(g,-15,-14,3.2,steelL);
    inked(g,steel,2.2);g.beginPath();g.ellipse(-15,1,7,4,0,0,7);fillStroke(g);
    limb(g,6,-28,14,-15,6,steelD);  limb(g,14,-15,13,-2,6,steelD);  joint(g,14,-15,3.2,steelL);
    inked(g,steel,2.2);g.beginPath();g.ellipse(14,-1,7,4,0,0,7);fillStroke(g);
  } else if(pose==='sit'){
    // legs folded in front on the mat — knees out, feet crossed at the middle
    limb(g,-6,-26,-18,-14,6,steelD); joint(g,-18,-14,3.2,steelL); limb(g,-18,-14,-3,-16,6,steelD);
    limb(g,6,-26,18,-14,6,steelD);  joint(g,18,-14,3.2,steelL);  limb(g,18,-14,3,-16,6,steelD);
    inked(g,steel,2.2);g.beginPath();g.ellipse(-3,-15,5.5,3.4,0.25,0,7);fillStroke(g);
    g.beginPath();g.ellipse(3,-15,5.5,3.4,-0.25,0,7);fillStroke(g);
  } else {
    limb(g,-6,-4,-7,-30,6,steelD);limb(g,6,-4,7,-30,6,steelD);
    joint(g,-6.5,-16,3.4,steelL);joint(g,6.5,-16,3.4,steelL);
    inked(g,steel,2.2);g.beginPath();g.ellipse(-7,-1,7,4,0,0,7);fillStroke(g);g.beginPath();g.ellipse(7,-1,7,4,0,0,7);fillStroke(g);
  }
  if(pose==='tree'){
    // arms overhead, palms pressed together (prayer)
    joint(g,15,-54,3.6,steelL);limb(g,15,-54,10,-74,5,steelD);limb(g,10,-74,2,-95,5,steelD);
    joint(g,-15,-54,3.6,steelL);limb(g,-15,-54,-10,-74,5,steelD);limb(g,-10,-74,-2,-95,5,steelD);
    inked(g,steel,2);g.beginPath();g.arc(0,-98,4,0,7);fillStroke(g);
  } else if(pose==='yoga'){
    // both arms raised overhead in a sun-salute V
    joint(g,15,-54,3.6,steelL);limb(g,15,-54,23,-72,5,steelD);limb(g,23,-72,17,-94,5,steelD);
    joint(g,23,-72,3,steelL);inked(g,steel,2);g.beginPath();g.arc(16,-96,4,0,7);fillStroke(g);
    joint(g,-15,-54,3.6,steelL);limb(g,-15,-54,-23,-72,5,steelD);limb(g,-23,-72,-17,-94,5,steelD);
    joint(g,-23,-72,3,steelL);inked(g,steel,2);g.beginPath();g.arc(-16,-96,4,0,7);fillStroke(g);
  } else if(pose==='sit'){
    // one hand resting on a knee, the other lifted toward the warm bowl
    joint(g,15,-54,3.6,steelL);limb(g,15,-54,22,-42,5,steelD);limb(g,22,-42,17,-30,5,steelD);
    inked(g,steel,2);g.beginPath();g.arc(16,-27,4,0,7);fillStroke(g);
    joint(g,-15,-54,3.6,steelL);limb(g,-15,-54,-24,-44,5,steelD);limb(g,-24,-44,-28,-34,5,steelD);
    inked(g,steel,2);g.beginPath();g.arc(-29,-32,4,0,7);fillStroke(g);
  } else if(pose==='surf'){
    // arms spread for balance — front arm up, back arm low
    joint(g,15,-54,3.6,steelL);limb(g,15,-54,28,-60,5,steelD);limb(g,28,-60,34,-72,5,steelD);
    inked(g,steel,2);g.beginPath();g.arc(35,-74,4,0,7);fillStroke(g);
    joint(g,-15,-54,3.6,steelL);limb(g,-15,-54,-26,-48,5,steelD);limb(g,-26,-48,-32,-38,5,steelD);
    inked(g,steel,2);g.beginPath();g.arc(-33,-37,4,0,7);fillStroke(g);
  } else {
    // arms hanging at the sides
    joint(g,15,-54,3.6,steelL);limb(g,15,-54,20,-42,5,steelD);limb(g,20,-42,18,-26,5,steelD);
    inked(g,steel,2);g.beginPath();g.arc(18,-25,4,0,7);fillStroke(g);
    joint(g,-15,-54,3.6,steelL);limb(g,-15,-54,-20,-42,5,steelD);limb(g,-20,-42,-18,-26,5,steelD);
    inked(g,steel,2);g.beginPath();g.arc(-18,-25,4,0,7);fillStroke(g);
  }
  // body
  inked(g,steel,2.6);rr(g,-15,-58,30,30,7);fillStroke(g);
  inked(g,steelD,1.8);rr(g,2,-53,9,9,2);fillStroke(g);                 // chest panel
  g.fillStyle=MIN.ink2;for(let i=0;i<4;i++){g.beginPath();g.arc(-7+i*4,-34,1.1,0,7);g.fill();}  // rivets
  // (hands are raised overhead for yoga — no clasp)
  // neck + head
  inked(g,steelD,2);rr(g,-5,-65,10,8,2);fillStroke(g);
  inked(g,steel,2.6);rr(g,-15,-92,30,28,9);fillStroke(g);
  inked(g,steelD,2);rr(g,-2,-97,4,6,1.5);fillStroke(g);                // little antenna nub
  joint(g,-15,-78,2.6,steelD);joint(g,15,-78,2.6,steelD);              // ear bolts
  // eyes + smile
  if(pose==='tree'){
    // calm, content face — eyes gently closed
    g.strokeStyle=MIN.ink;g.lineWidth=2;g.lineCap='round';
    g.beginPath();g.arc(-6,-79,3.6,Math.PI*0.12,Math.PI*0.88);g.stroke();
    g.beginPath();g.arc(6,-79,3.6,Math.PI*0.12,Math.PI*0.88);g.stroke();
    g.beginPath();g.arc(0,-73,4.4,0.18*Math.PI,0.82*Math.PI,false);g.stroke();
  } else {
    g.fillStyle='#fff';g.strokeStyle=MIN.ink;g.lineWidth=2;
    g.beginPath();g.arc(-6,-80,4.6,0,7);fillStroke(g);g.beginPath();g.arc(6,-80,4.6,0,7);fillStroke(g);
    g.fillStyle=MIN.ink2;g.beginPath();g.arc(-5,-80,2.1,0,7);g.fill();g.beginPath();g.arc(7,-80,2.1,0,7);g.fill();
    g.strokeStyle=MIN.ink;g.lineWidth=2;g.lineCap='round';g.beginPath();g.arc(0,-72,5,0.12*Math.PI,0.88*Math.PI,false);g.stroke();
  }
  g.restore();
}
/* the Dog — taupe, looking up at the robot, bag in the outer paw, inner (right) paw clasped */
function drawBeachDog(g,x,y,s,pose){
  s=s||1; pose=pose||'yoga'; g.save(); g.translate(x,y); g.scale(s,s);
  const fur='#9c6a3e', furD='#7c5230', furL='#c79468';   // chestnut-brown dog
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(0,2,17,5,0,0,7);g.fill();
  if(pose==='sit') g.translate(0,14);   // settle onto its haunches on the mat
  // tail
  inked(g,furD,2.4);g.beginPath();g.moveTo(12,-16);g.quadraticCurveTo(26,-13,24,-31);g.quadraticCurveTo(19,-22,10,-20);g.closePath();fillStroke(g);
  // legs + feet
  if(pose==='tree'){
    inked(g,fur,2.4);rr(g,-4,-16,8,17,3.5);fillStroke(g);                              // planted leg (centered)
    inked(g,furD,2.2);g.beginPath();g.ellipse(0,1,5.5,3,0,0,7);fillStroke(g);
    inked(g,fur,2.4);rr(g,7,-15,8,7,3);fillStroke(g);                                  // lifted foot tucked to inner thigh
  } else if(pose==='surf'){
    inked(g,fur,2.4);rr(g,-13,-15,8,15,3.5);fillStroke(g);rr(g,6,-15,8,15,3.5);fillStroke(g);
    inked(g,furD,2.2);g.beginPath();g.ellipse(-10,0,5.5,3,0,0,7);fillStroke(g);g.beginPath();g.ellipse(11,0,5.5,3,0,0,7);fillStroke(g);
  } else if(pose==='sit'){
    // sitting on its haunches — plump thigh, hind foot peeking, front legs down
    inked(g,fur,2.4);g.beginPath();g.ellipse(-7,-22,9.5,10,0.12,0,7);fillStroke(g);
    inked(g,furD,2.2);g.beginPath();g.ellipse(-4,-13,6,3.2,0,0,7);fillStroke(g);
    inked(g,fur,2.4);rr(g,3,-27,7,16,3.5);fillStroke(g);
    inked(g,furD,2.2);g.beginPath();g.ellipse(6.5,-12,5,3,0,0,7);fillStroke(g);
  } else {
    inked(g,fur,2.4);rr(g,-9,-16,8,17,3.5);fillStroke(g);rr(g,2,-16,8,17,3.5);fillStroke(g);
    inked(g,furD,2.2);g.beginPath();g.ellipse(-5,1,5.5,3,0,0,7);fillStroke(g);g.beginPath();g.ellipse(6,1,5.5,3,0,0,7);fillStroke(g);
  }
  // OUTER paw (left) — raised for yoga/tree, resting low otherwise
  if(pose==='yoga'){ limb(g,-9,-40,-20,-62,5,fur); inked(g,furL,2);g.beginPath();g.arc(-21,-64,3.6,0,7);fillStroke(g); }
  else if(pose==='tree'){ limb(g,-9,-40,-5,-62,5,fur); }
  else if(pose==='sit'){ limb(g,-9,-40,-17,-28,5,fur); inked(g,furL,2);g.beginPath();g.arc(-18,-26,3.4,0,7);fillStroke(g); }
  else if(pose==='surf'){ limb(g,-9,-40,-22,-30,5,fur); inked(g,furL,2);g.beginPath();g.arc(-24,-29,3.4,0,7);fillStroke(g); }
  else { limb(g,-9,-40,-14,-20,5,fur); inked(g,furL,2);g.beginPath();g.arc(-15,-19,3.4,0,7);fillStroke(g); }
  // torso
  inked(g,fur,2.6);rr(g,-13,-46,26,33,10);fillStroke(g);
  g.fillStyle=furL;g.beginPath();g.ellipse(-1,-33,6,9,0,0,7);g.fill();
  // blue collar + tag
  inked(g,MIN.blue,2.2);rr(g,-12,-49,24,6,3);fillStroke(g);
  g.fillStyle=MIN.gold;g.beginPath();g.arc(0,-45,1.6,0,7);g.fill();
  // INNER paw (right) — raised for yoga/tree, resting low otherwise
  if(pose==='yoga'){ limb(g,9,-40,20,-62,5,fur); inked(g,furL,2);g.beginPath();g.arc(21,-64,3.6,0,7);fillStroke(g); }
  else if(pose==='tree'){ limb(g,9,-40,5,-62,5,fur); inked(g,furL,2);g.beginPath();g.arc(0,-64,3.6,0,7);fillStroke(g); }   // palms meet overhead
  else if(pose==='sit'){ limb(g,9,-40,17,-28,5,fur); inked(g,furL,2);g.beginPath();g.arc(18,-26,3.4,0,7);fillStroke(g); }
  else if(pose==='surf'){ limb(g,9,-40,22,-54,5,fur); inked(g,furL,2);g.beginPath();g.arc(24,-56,3.4,0,7);fillStroke(g); }
  else { limb(g,9,-40,14,-20,5,fur); inked(g,furL,2);g.beginPath();g.arc(15,-19,3.4,0,7);fillStroke(g); }
  // ---- head (friendly, facing forward) ----
  const hx=3, hy=-61, hr=14;
  inked(g,fur,2.6);g.beginPath();g.arc(hx,hy,hr,0,7);fillStroke(g);
  // droopy ears on both sides
  inked(g,furD,2.4);
  g.beginPath();g.moveTo(hx-10,hy-7);g.quadraticCurveTo(hx-22,hy-3,hx-19,hy+15);g.quadraticCurveTo(hx-13,hy+4,hx-8,hy-3);g.closePath();fillStroke(g);
  g.beginPath();g.moveTo(hx+10,hy-7);g.quadraticCurveTo(hx+22,hy-3,hx+19,hy+15);g.quadraticCurveTo(hx+13,hy+4,hx+8,hy-3);g.closePath();fillStroke(g);
  // muzzle + nose + mouth (lower-front of the face)
  inked(g,furL,2.4);g.beginPath();g.ellipse(hx,hy+5,8,6,0,0,7);fillStroke(g);
  g.fillStyle=MIN.ink2;g.beginPath();g.ellipse(hx,hy+1,2.6,2,0,0,7);g.fill();
  g.strokeStyle=MIN.ink;g.lineWidth=1.5;g.lineCap='round';g.beginPath();g.moveTo(hx,hy+3);g.lineTo(hx,hy+7);g.stroke();
  // big round eyes (gently closed for the calm tree pose)
  if(pose==='tree'){
    g.strokeStyle=MIN.ink;g.lineWidth=1.8;g.lineCap='round';
    g.beginPath();g.arc(hx-5,hy-3,3.2,Math.PI*0.12,Math.PI*0.88);g.stroke();
    g.beginPath();g.arc(hx+5,hy-3,3.2,Math.PI*0.12,Math.PI*0.88);g.stroke();
  } else {
    g.fillStyle='#fff';g.strokeStyle=MIN.ink;g.lineWidth=1.8;
    g.beginPath();g.arc(hx-5,hy-3,3.4,0,7);fillStroke(g);g.beginPath();g.arc(hx+5,hy-3,3.4,0,7);fillStroke(g);
    g.fillStyle=MIN.ink2;g.beginPath();g.arc(hx-4,hy-3.4,1.7,0,7);g.fill();g.beginPath();g.arc(hx+6,hy-3.4,1.7,0,7);g.fill();
  }
  // ---- orange ball cap (worn over the crown) ----
  const capC='#e8742e', capD='#c4561b';
  inked(g,capC,2.6);
  g.beginPath();g.ellipse(hx,hy-7,12.6,10,0,Math.PI,Math.PI*2);g.closePath();fillStroke(g);
  // forward brim
  inked(g,capD,2.2);g.beginPath();g.ellipse(hx-14,hy-6,9,3.4,-0.12,0,Math.PI*2);fillStroke(g);
  // panel seams + button
  g.strokeStyle=capD;g.lineWidth=1.3;g.lineCap='round';
  g.beginPath();g.moveTo(hx,hy-16.5);g.lineTo(hx,hy-7.2);g.stroke();
  g.beginPath();g.moveTo(hx-6,hy-15);g.lineTo(hx-3,hy-7.4);g.stroke();
  g.beginPath();g.moveTo(hx+6,hy-15);g.lineTo(hx+3,hy-7.4);g.stroke();
  inked(g,capD,1.3);g.beginPath();g.arc(hx,hy-16.5,1.7,0,7);fillStroke(g);
  g.restore();
}
/* a little hiking rucksack, drawn in two layers so the straps sit in FRONT of the torso.
   sx = torso half-width, sy = shoulder line (local y); call 'back' before the figure, 'front' after. */
function drawHikePack(g,x,y,s,col,sx,sy,layer){
  g.save();g.translate(x,y);g.scale(s,s);
  if(layer==='back'){
    const w=sx+4;
    inked(g,col,2.6);rr(g,-w,sy-5,w*2,28,7);fillStroke(g);                 // pack body peeking out behind
    inked(g,shade(col,-16),2.2);rr(g,-w+3,sy-1,w*2-6,8,3);fillStroke(g);   // top lid pocket
    inked(g,MIN.gold,2.2);g.beginPath();g.ellipse(0,sy-6,w-2,4.2,0,0,7);fillStroke(g);  // rolled sleeping-mat on top
    inked(g,shade(col,-16),1.8);g.beginPath();g.arc(0,sy+12,2.3,0,7);fillStroke(g);     // side buckle
  } else {
    g.lineCap='round';                                                    // two shoulder straps across the chest
    g.strokeStyle=MIN.ink;g.lineWidth=5.2;
    g.beginPath();g.moveTo(-sx+3,sy+1);g.lineTo(-sx+7,sy+22);g.stroke();
    g.beginPath();g.moveTo(sx-3,sy+1);g.lineTo(sx-7,sy+22);g.stroke();
    g.strokeStyle=col;g.lineWidth=3;
    g.beginPath();g.moveTo(-sx+3,sy+1);g.lineTo(-sx+7,sy+22);g.stroke();
    g.beginPath();g.moveTo(sx-3,sy+1);g.lineTo(sx-7,sy+22);g.stroke();
  }
  g.restore();
}
/* a haenyeo joining the beach yoga in the middle — tree pose, palms together overhead */
function drawBeachYogi(g,x,y,s){
  s=s||1; g.save();g.translate(x,y);g.scale(s,s);
  const skin='#eccaa2', topc=MIN.teal, pants='#4a4a52', hair='#3a2c22';
  g.lineJoin='round';g.lineCap='round';
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(0,2,14,5,0,0,7);g.fill();
  // tree pose: left leg straight, right foot tucked against the inner thigh
  limb(g,-4,-22,-5,-1,6,pants);
  inked(g,pants,2.2);g.beginPath();g.ellipse(-5,1,5,3,0,0,7);fillStroke(g);
  limb(g,4,-22,13,-29,6,pants);
  limb(g,13,-29,1,-25,6,pants);
  // torso
  inked(g,topc,2.4);rr(g,-9,-44,18,24,7);fillStroke(g);
  // arms raised overhead, palms together
  limb(g,-7,-40,-4,-66,5,skin);
  limb(g,7,-40,4,-66,5,skin);
  inked(g,skin,2);g.beginPath();g.arc(0,-70,3.4,0,7);fillStroke(g);
  // head
  inked(g,skin,2.4);g.beginPath();g.arc(0,-52,8,0,7);fillStroke(g);
  inked(g,hair,2);g.beginPath();g.arc(0,-60,3.4,0,7);fillStroke(g);   // top-knot bun
  // calm, content face
  g.fillStyle=MIN.ink;g.beginPath();g.arc(-3,-52,1,0,7);g.fill();g.beginPath();g.arc(3,-52,1,0,7);g.fill();
  g.strokeStyle=MIN.ink;g.lineWidth=1.2;g.beginPath();g.arc(0,-49,2,0.1*Math.PI,0.9*Math.PI);g.stroke();
  g.restore();
}
/* the village landscape backdrop — the uploaded illustration */
let villageImg=null, villageImgTried=false;
function ensureVillageImg(){ if(villageImgTried)return; villageImgTried=true;
  const im=new Image(); im.onload=()=>{ villageImg=im; villageBG=null; }; im.src='village.png?v=3'; }
function buildVillageBG(){
  const {el,g}=makeCanvas(W,H);
  // landscape backdrop — the uploaded illustration (cover-fit to the frame)
  ensureVillageImg();
  if(villageImg){
    const s=Math.max(W/villageImg.width, H/villageImg.height);
    const dw=villageImg.width*s, dh=villageImg.height*s;
    g.drawImage(villageImg,(W-dw)/2,(H-dh)/2,dw,dh);
  } else {
    g.fillStyle=MIN.greenL;g.fillRect(0,0,W,BEACH_Y);   // gentle fallback until the image loads
    g.fillStyle=MIN.green;g.fillRect(0,BEACH_Y*0.42,W,BEACH_Y);
  }
  // buildings (the bulteok + pojangmacha live on the sand, so they're drawn after the shore below)
  for(const b of buildings){ if(b.name==='bulteok'||b.name==='pojangmacha') continue; drawBuilding(g,b); }
  // ---- the shore: warm sand fills the whole bottom band, covering the illustration's
  //      lower rock wall entirely; the sea (right) is painted live over it ----
  (function(){
    const sy=BEACH_Y;
    g.fillStyle='#e9d3a0';
    g.beginPath();g.moveTo(0,H);g.lineTo(0,sy);
    for(let x=0;x<=W;x+=24){ g.lineTo(x, sy+Math.sin(x*0.05)*6); }
    g.lineTo(W,H);g.closePath();g.fill();
    // sand speckle + a few shells & pebbles strewn over the beach
    const rs=mulberry32(88);
    g.fillStyle='rgba(150,116,64,.16)';
    for(let i=0;i<300;i++){g.beginPath();g.arc(rs()*W, sy+10+rs()*(H-sy-12), 1+rs()*1.5,0,7);g.fill();}
    for(let i=0;i<16;i++){const px=rs()*W, py=sy+18+rs()*(H-sy-28);
      g.fillStyle=['#e8d2c0','#d9b89a','#cbb6a0'][i%3];g.strokeStyle='rgba(120,90,40,.4)';g.lineWidth=1;
      g.beginPath();g.ellipse(px,py,3,2.2,rs()*3,0,7);g.fill();g.stroke();}
    // ---- a cosy beach corner: parasol + towel + a wooden bench ----
    // (parasol · towel · bench and the robot & dog are drawn live in drawVillage,
    //  so the evening movie night can clear the beach corner)
    // the bulteok fire-shelter on the sand (the 포장마차 is drawn live in drawVillage,
    //  since it folds/raises with the clock and can't be baked into the static BG)
    const bt=buildings.find(b=>b.name==='bulteok'); if(bt) drawBuilding(g,bt);
  })();
  villageBG=el;
}
/* The beach robot & his dog — drawn live so they can pack up and walk home as evening falls. */
function drawBeachCompanions(t){
  const tm=(typeof G!=='undefined')?G.time:600;
  const bob=ph=>Math.sin(t*1.8+ph)*1.1;
  ctx.save();
  // a burst of hearts when the diver joins the dog & robot's activity
  if(typeof joinCheerT!=='undefined' && joinCheerT>0){ ctx.save(); ctx.fillStyle='#ff7eb3';
    for(let i=0;i<4;i++){ const hp=((1.5-joinCheerT)+i*0.25)%1, hx=joinCheerX+(i-1.5)*9+Math.sin(t*3+i)*3, hy=joinCheerY-12-hp*42;
      ctx.globalAlpha=Math.min(1,joinCheerT)*(1-hp); ctx.beginPath();
      ctx.moveTo(hx,hy+3); ctx.bezierCurveTo(hx-4,hy-1,hx-2,hy-4,hx,hy-1.6); ctx.bezierCurveTo(hx+2,hy-4,hx+4,hy-1,hx,hy+3); ctx.fill(); }
    ctx.globalAlpha=1; ctx.restore(); }
  // daytime beach corner — hand-drawn lounge set (thatched umbrella over two
  // wooden deck chairs on a straw mat, with cats), cleared from 18:00 onward
  if(tm>=300&&tm<1020){
    drawBeachLoungeSet(ctx,112,588,1,t);
    // a small pile of seashells (kept clear of the lounge mat and the yoga spot)
    ctx.save();ctx.translate(208,590);
    ctx.fillStyle='rgba(20,12,8,.14)';ctx.beginPath();ctx.ellipse(0,5,16,4,0,0,7);ctx.fill();
    var shell=function(sx,sy,col){ inked(ctx,col,1.8);ctx.beginPath();ctx.arc(sx,sy,6,Math.PI,0,false);ctx.closePath();fillStroke(ctx);
      ctx.strokeStyle=shade(col,-24);ctx.lineWidth=1;
      for(var k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+k*2.4,sy-5.6);ctx.stroke();} };
    shell(-7,2,'#f3d9b0'); shell(8,3,'#ecc29a'); shell(0,-2,'#f7e6c8');
    ctx.restore();
  }
  if(tm>=180&&tm<240){                // 3:00 — the movie's over: hold hands and head home, then gone
    const p=Math.min(1,(tm-180)/60), off=-p*360, al=p>0.82?Math.max(0,(1-p)/0.18):1;
    if(p>=1){ ctx.restore(); return; }
    const wy=ph=>556+Math.sin(t*7+ph)*1.4;
    const dx=212+off, rx=246+off;
    ctx.globalAlpha=al;
    drawBeachDog(ctx,dx,wy(0),0.7,'side');
    drawBeachRobot(ctx,rx,wy(0.7),0.74,'side');
    // their near hands simply clasp — a short link between the two paws/hands
    const hx1=dx+11, hy1=542, hx2=rx-14, hy2=540;
    ctx.lineCap='round';
    ctx.strokeStyle=MIN.ink;ctx.lineWidth=5.5;ctx.beginPath();ctx.moveTo(hx1,hy1);ctx.lineTo(hx2,hy2);ctx.stroke();
    ctx.strokeStyle='#9c6a3e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hx1,hy1);ctx.lineTo(hx2,hy2);ctx.stroke();
  } else if(tm>=1020||tm<180){        // 17:00 → 3:00 — drive-in beach movie, on late into the night
    // ---- screen on two posts, shifted left so it doesn't overlap the 포장마차 on the right ----
    ctx.save(); ctx.translate(-52,0);
    inked(ctx,'#5a3a22',2.4);rr(ctx,96,498,8,60,2);fillStroke(ctx);rr(ctx,236,498,8,60,2);fillStroke(ctx);
    inked(ctx,'#11161f',3);rr(ctx,84,452,168,92,4);fillStroke(ctx);
    ctx.save();rr(ctx,90,458,156,80,3);ctx.clip();
    // ---- the feature presentation: the village's movie reel, played on the screen ----
    const mov = window.__beachMovie || (window.__beachMovie = document.getElementById('bgmovie'));
    if(mov && mov.readyState>=2 && mov.videoWidth){
      if(mov.paused){ try{ mov.play(); }catch(e){} }
      const sw=mov.videoWidth, sh=mov.videoHeight, dw=168, dh=80;     // cover the screen with no distortion
      const sc=Math.max(dw/sw, dh/sh), cw=dw/sc, ch=dh/sc;
      ctx.fillStyle='#000';ctx.fillRect(84,458,168,80);
      try{ ctx.drawImage(mov, (sw-cw)/2, (sh-ch)/2, cw, ch, 84, 458, 168, 80); }catch(e){}
      const fl=0.9+0.1*Math.sin(t*9);ctx.fillStyle=`rgba(255,255,255,${(0.04*fl).toFixed(3)})`;ctx.fillRect(84,458,168,80);   // soft projector flicker
    } else {
      ctx.fillStyle='#11161f';ctx.fillRect(84,458,168,80);            // reel still threading up
    }
    ctx.restore();
    ctx.strokeStyle=MIN.ink;ctx.lineWidth=3;rr(ctx,84,452,168,92,4);ctx.stroke();
    // ---- the car they sit ON to watch (drive-in) ----
    const cx=166, cy=582;
    ctx.fillStyle='rgba(20,12,8,.18)';ctx.beginPath();ctx.ellipse(cx,cy+14,48,7,0,0,7);ctx.fill();
    inked(ctx,MIN.verm,2.4);rr(ctx,cx-46,cy-8,92,22,8);fillStroke(ctx);                    // car body
    inked(ctx,shade(MIN.verm,-16),2);rr(ctx,cx-30,cy-1,60,7,3);fillStroke(ctx);            // door line
    ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(cx-28,cy-6,42,3);
    inked(ctx,'#2a2228',2.2);ctx.beginPath();ctx.arc(cx-28,cy+13,8,0,7);fillStroke(ctx);ctx.beginPath();ctx.arc(cx+28,cy+13,8,0,7);fillStroke(ctx);
    ctx.fillStyle='#9aa0a8';ctx.beginPath();ctx.arc(cx-28,cy+13,3.2,0,7);ctx.fill();ctx.beginPath();ctx.arc(cx+28,cy+13,3.2,0,7);ctx.fill();
    // dog & robot sitting on top of the car, facing the screen
    drawBeachDog(ctx,cx-16,cy-8+bob(0)*0.3,0.5,'side');
    drawBeachRobot(ctx,cx+16,cy-8+bob(1)*0.3,0.52,'side');
    ctx.restore();
    // faint stars above
    ctx.save();ctx.fillStyle='#fdf8e6';
    for(let i=0;i<10;i++){const sx=(i*97+300)%900, sy=86+((i*61)%62); const tw=0.4+0.6*Math.sin(t*2+i*1.7);
      ctx.globalAlpha=tw;ctx.beginPath();ctx.arc(sx,sy,1.1+(i%2)*0.5,0,7);ctx.fill();}
    ctx.restore();
  } else if(tm>=480&&tm<600){          // 8–10 surfing in the sea
    const surfer=(x,base,ph,col,kind)=>{
      const y=base+Math.sin(t*1.4+ph)*5, tilt=Math.sin(t*6+ph)*0.05;
      ctx.save();ctx.translate(x,y);ctx.scale(-1,1);ctx.rotate(tilt);   // mirrored — riding in toward the beach
      ctx.save();ctx.rotate(-0.18);                                  // board angled, cutting across the wave
      inked(ctx,col,2.4);ctx.beginPath();ctx.ellipse(0,12,30,7,0,0,7);fillStroke(ctx);
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-22,12);ctx.lineTo(22,12);ctx.stroke();
      ctx.restore();
      if(kind==='dog') drawBeachDog(ctx,0,2,0.62,'surf'); else drawBeachRobot(ctx,0,2,0.66,'surf');
      ctx.restore();
      // spray/foam flicking off the leading edge
      ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.lineCap='round';
      for(let i=0;i<4;i++){const pr=((t*32+i*12+ph*9)%26); ctx.globalAlpha=Math.max(0,1-pr/26);
        ctx.beginPath();ctx.arc(x-26-pr*0.5, y+12-pr*0.5, 1.7,0,7);ctx.stroke();}
      ctx.globalAlpha=1;
    };
    // surf the open water lane near the shore, well clear of the working haenyeo divers
    surfer(655,548,0,MIN.gold,'dog');
    surfer(628,592,1,MIN.verm,'robot');
  } else if(tm>=600&&tm<660){          // 10–11 hiking on the mountain — with rucksacks
    const k=(t*0.07)%1;
    const hx=130+k*500, hy=108+Math.sin(hx*0.02)*9;   // climbing across the rolling hill
    drawHikePack(ctx,hx,hy,0.42,MIN.teal,13,-46,'back');
    drawBeachDog(ctx,hx,hy,0.42,'side');
    drawHikePack(ctx,hx,hy,0.42,MIN.teal,13,-46,'front');
    drawHikePack(ctx,hx+28,hy+3,0.46,MIN.verm,15,-56,'back');
    drawBeachRobot(ctx,hx+28,hy+3,0.46,'side');
    drawHikePack(ctx,hx+28,hy+3,0.46,MIN.verm,15,-56,'front');
  } else if(tm>=660&&tm<720){          // 11–12 picnic lunch on the beach (野餐墊)
    // checkered picnic blanket on the sand
    ctx.save();ctx.translate(282,566);
    ctx.fillStyle='rgba(20,12,8,.14)';ctx.beginPath();ctx.ellipse(0,9,54,9,0,0,7);ctx.fill();
    inked(ctx,'#f2e6d2',2.2);rr(ctx,-52,-9,104,24,4);fillStroke(ctx);
    ctx.save();rr(ctx,-52,-9,104,24,4);ctx.clip();
    ctx.fillStyle='rgba(200,80,70,.45)';
    for(let i=0;i<11;i++)for(let j=0;j<3;j++){ if((i+j)%2)continue; ctx.fillRect(-52+i*10,-9+j*8,10,8); }
    ctx.restore();
    ctx.strokeStyle=MIN.ink;ctx.lineWidth=2.2;rr(ctx,-52,-9,104,24,4);ctx.stroke();
    // picnic basket set off to the side of the mat
    inked(ctx,'#caa86a',2);rr(ctx,32,-17,20,11,3);fillStroke(ctx);
    ctx.strokeStyle='#a9763e';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(42,-17,9,Math.PI,0);ctx.stroke();
    // two bowls of steaming ramyeon between them — soft egg, gim, green onion, chopsticks
    const ramyeon=(bx,by,flip)=>{ ctx.save();ctx.translate(bx,by);
      ctx.fillStyle='rgba(20,12,8,.14)';ctx.beginPath();ctx.ellipse(0,4.5,10,2.8,0,0,7);ctx.fill();
      inked(ctx,MIN.white,2);ctx.beginPath();ctx.moveTo(-9,-2);ctx.quadraticCurveTo(-7.5,5,0,5);ctx.quadraticCurveTo(7.5,5,9,-2);ctx.closePath();fillStroke(ctx);
      ctx.strokeStyle=MIN.verm;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-7.6,1.4);ctx.lineTo(7.6,1.4);ctx.stroke();   // bowl stripe
      inked(ctx,'#e8a23c',1.6);ctx.beginPath();ctx.ellipse(0,-2,8.4,2.8,0,0,7);fillStroke(ctx);                            // broth
      ctx.strokeStyle='#f3d9b0';ctx.lineWidth=1.3;ctx.lineCap='round';                                                     // wavy noodles
      for(const nx of [-4,-1,2]){ctx.beginPath();ctx.arc(nx,-2.4,2,Math.PI,0);ctx.stroke();}
      inked(ctx,'#fff',1.1);ctx.beginPath();ctx.ellipse(4.2,-3,2.5,1.8,0,0,7);fillStroke(ctx);                             // soft egg
      ctx.fillStyle='#f0a73a';ctx.beginPath();ctx.arc(4.2,-3,1,0,7);ctx.fill();
      inked(ctx,'#2e3a30',1.1);rr(ctx,-7,-6.5,3.6,4.4,0.7);fillStroke(ctx);                                                // sheet of gim
      ctx.fillStyle='#69a35c';for(const sx of [-2,0.6,2.4]){ctx.beginPath();ctx.arc(sx,-3.8,0.7,0,7);ctx.fill();}          // green onion
      ctx.strokeStyle='#a9763e';ctx.lineWidth=1.3;ctx.lineCap='round';                                                     // chopsticks on the rim
      ctx.beginPath();ctx.moveTo(flip*-9,-7);ctx.lineTo(flip*8,-3);ctx.moveTo(flip*-9,-5.4);ctx.lineTo(flip*8,-1.6);ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.3;                                                            // steam wisps
      for(const wx of [-3,2.5]){ctx.beginPath();ctx.moveTo(wx,-7);
        ctx.quadraticCurveTo(wx+Math.sin(t*2.2+wx)*2.4,-12,wx+Math.sin(t*2.2+wx)*1.2,-16);ctx.stroke();}
      ctx.restore(); };
    ramyeon(-15,6,1); ramyeon(15,6,-1);
    ctx.restore();
    // the dog & robot sit on the mat, turned in toward the shared meal
    ctx.save();ctx.scale(-1,1);drawBeachDog(ctx,-246,562+bob(0)*0.5,0.68,'sit');ctx.restore();
    drawBeachRobot(ctx,318,556+bob(1)*0.5,0.72,'sit');
  } else if(tm>=720&&tm<840){          // 12–14 roller skating along the path
    const ph=((t*0.1)%2), k=ph<1?ph:2-ph, dir=ph<1?1:-1, bx=170+k*520;
    const wheels=(x)=>{ ctx.fillStyle=MIN.ink;for(const fx of [-9,-3,4,10]){ctx.beginPath();ctx.arc(x+fx,259,2,0,7);ctx.fill();} };
    const speed=(x)=>{ ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.lineCap='round';
      for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-dir*(14+i*9),250-i*5);ctx.lineTo(x-dir*(26+i*9),250-i*5);ctx.stroke();} };
    speed(bx); drawBeachDog(ctx,bx,253,0.66,'side'); wheels(bx);
    speed(bx-52*dir); drawBeachRobot(ctx,bx-52*dir,253,0.7,'side'); wheels(bx-52*dir);
  } else if(tm>=840&&tm<1080){         // 14–18 diving in the sea
    const dive=(x,base,ph,kind)=>{
      const y=base+Math.sin(t*1.5+ph)*4;
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+6,18,5,0,0,7);ctx.stroke(); // waterline ring
      ctx.save();ctx.beginPath();ctx.rect(x-30,y-52,60,(y+5)-(y-52));ctx.clip();                                          // show only the upper body
      if(kind==='dog') drawBeachDog(ctx,x,y+16,0.5,'side'); else drawBeachRobot(ctx,x,y+16,0.52,'side');
      ctx.restore();
      ctx.fillStyle='rgba(255,255,255,.6)';for(let i=0;i<3;i++){const by=y-((t*22+i*9+ph*10)%26);ctx.beginPath();ctx.arc(x+11+i*2,by,1.6,0,7);ctx.fill();}  // bubbles
    };
    dive(665,524,0,'dog');
    dive(800,568,1,'robot');
  } else if(tm>=300){                   // 5:00 onward — calm dawn beach yoga (tree pose); before 5:00 the shore is empty
    // a thin yoga mat unrolled flat on the sand (slight 3/4 view) with a soft
    // contact shadow underneath so it rests on the ground; one end lightly rolled.
    const mat=(mx,my,col)=>{ ctx.save();ctx.translate(mx,my);
      const edge=shade(col,-18);
      ctx.fillStyle='rgba(20,12,8,.16)';ctx.beginPath();ctx.ellipse(0,9,38,7,0,0,7);ctx.fill();   // contact shadow on the sand
      inked(ctx,edge,1.6);rr(ctx,-33,-5,66,14,6);fillStroke(ctx);                                  // thin cushion edge (peeks at the near edge)
      inked(ctx,col,2);rr(ctx,-33,-7,66,14,6);fillStroke(ctx);                                     // flat top surface lying on the sand
      ctx.lineCap='round';
      ctx.strokeStyle='rgba(255,255,255,.26)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(0,5);ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.13)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-18,-5);ctx.lineTo(-18,5);ctx.stroke();
      ctx.beginPath();ctx.moveTo(18,-5);ctx.lineTo(18,5);ctx.stroke();
      ctx.restore(); };
    mat(250,560,MIN.teal); mat(314,560,MIN.verm);
    // a water bottle resting on the sand beside the robot's mat
    ctx.save();ctx.translate(352,562);
    ctx.fillStyle='rgba(20,12,8,.12)';ctx.beginPath();ctx.ellipse(0,9,7,2.5,0,0,7);ctx.fill();
    inked(ctx,'#c3e6e1',2);rr(ctx,-4,-9,8,18,3);fillStroke(ctx);                                    // bottle body
    ctx.fillStyle='rgba(255,255,255,.55)';rr(ctx,-2.4,-6,2.2,11,1.4);ctx.fill();                    // highlight
    inked(ctx,MIN.teal,1.8);rr(ctx,-3,-13,6,5,1.6);fillStroke(ctx);                                 // cap
    ctx.restore();
    // calm, slow-drifting sea-breeze particles around them
    ctx.save();
    for(let i=0;i<7;i++){const px=212+((i*61+t*7)%150), py=540-((t*5+i*22)%96);
      ctx.globalAlpha=0.18+0.22*(0.5+0.5*Math.sin(t*0.8+i));ctx.fillStyle='rgba(255,244,214,.9)';
      ctx.beginPath();ctx.arc(px,py,1.4,0,7);ctx.fill();}
    ctx.restore();
    // firm little contact shadows on the mats, under each character's base (these stay put)
    ctx.fillStyle='rgba(20,12,8,.20)';
    ctx.beginPath();ctx.ellipse(250,561,12,3,0,0,7);ctx.fill();
    ctx.beginPath();ctx.ellipse(314,561,12,3,0,0,7);ctx.fill();
    // very gentle breathing — feet stay planted on the mat
    const br=ph=>Math.sin(t*1.6+ph)*1.0;
    drawBeachDog(ctx,250,560+br(0),0.7,'tree');
    drawBeachRobot(ctx,314,560+br(2),0.74,'tree');
  }
  ctx.restore();
}

/* ---------------- SEA (live, folk waves) ---------------- */
function drawTewak(x,y,t){
  const yy=y+Math.sin(t*1.4+x)*2;
  ctx.fillStyle='rgba(20,12,8,.12)';ctx.beginPath();ctx.ellipse(x,yy+5,12,4,0,0,7);ctx.fill();
  inked(ctx,MIN.verm,2.2);ctx.beginPath();ctx.ellipse(x,yy,12,9,0,0,7);fillStroke(ctx);
  ctx.fillStyle=MIN.white;ctx.beginPath();ctx.ellipse(x-3,yy-3,4,2.5,0,0,7);ctx.fill();
}
/* a haenyeo's hooded head + shoulders poking out of the water */
function drawDiverHead(cx,cy,s,face){
  ctx.save();ctx.translate(cx,cy);ctx.scale((face||1)*s,s);
  inked(ctx,MIN.white,2.4);rr(ctx,-9,3,18,13,7);fillStroke(ctx);                 // shoulders
  inked(ctx,'#eccaa2',2.4);ctx.beginPath();ctx.arc(0,-6,9,0,7);fillStroke(ctx);  // face
  inked(ctx,MIN.white,2.4);                                                       // cotton hood
  ctx.beginPath();ctx.arc(0,-6,9.6,Math.PI*0.95,Math.PI*0.05,true);ctx.quadraticCurveTo(0,-1,-9.6,-4);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle=MIN.verm;ctx.beginPath();ctx.ellipse(0,-14,9.6,3,0,Math.PI,0);ctx.fill();  // hood band
  // traditional haenyeo single-lens mask: pink rubber frame, silver rim, amber lens
  ctx.strokeStyle='#c77fa6';ctx.lineWidth=2.2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-6,-7);ctx.quadraticCurveTo(-10,-9.5,-9.6,-4);ctx.stroke();
  ctx.beginPath();ctx.moveTo(6,-7);ctx.quadraticCurveTo(10,-9.5,9.6,-4);ctx.stroke();
  inked(ctx,'#d98ab0',2);ctx.beginPath();ctx.arc(0,-6.5,6.2,0,7);fillStroke(ctx);
  ctx.strokeStyle='#cdd2d8';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,-6.5,5,0,7);ctx.stroke();
  ctx.fillStyle='#f0883a';ctx.beginPath();ctx.arc(0,-6.5,4.4,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,240,210,.6)';ctx.beginPath();ctx.ellipse(-1.6,-8.2,1.9,1.1,-0.5,0,7);ctx.fill();
  ctx.restore();
}
/* a working haenyeo: tewak float + diver who bobs, dives under, and surfaces for breath */
function drawSeaDiver(x,surfY,t,seed,face){
  const bob=Math.sin(t*1.3+seed*3)*1.8;
  const dy=surfY+bob;
  const cyc=((t/9)+seed)%1;
  let depth=0;                                  // 0 at surface, 1 fully under
  if(cyc>=0.58&&cyc<0.70) depth=(cyc-0.58)/0.12;
  else if(cyc>=0.70&&cyc<0.84) depth=1;
  else if(cyc>=0.84&&cyc<0.99) depth=1-(cyc-0.84)/0.15;
  // tewak float, always bobbing beside the diver
  drawTewak(x+15*(face||1), dy+2, t+seed*5);
  // ripple ring at the diver's spot
  ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.ellipse(x,dy+4,11+depth*4,4+depth*1.5,0,0,7);ctx.stroke();
  if(depth<0.96){
    // clip to the waterline so the diver reads as half-submerged
    ctx.save();ctx.beginPath();ctx.rect(0,SEA_Y-30,W,(dy+5)-(SEA_Y-30));ctx.clip();
    drawDiverHead(x, dy-7+depth*30, 0.92, face);
    ctx.restore();
  } else {
    // fully under — just two flipper kicks breaking the surface
    inked(ctx,'#2a2935',2);
    ctx.beginPath();ctx.moveTo(x-5,dy+1);ctx.lineTo(x-9,dy-4);ctx.lineTo(x-2,dy-1);ctx.closePath();fillStroke(ctx);
    ctx.beginPath();ctx.moveTo(x+5,dy+1);ctx.lineTo(x+9,dy-4);ctx.lineTo(x+2,dy-1);ctx.closePath();fillStroke(ctx);
  }
  // rising bubbles while submerged
  if(depth>0.4){ ctx.fillStyle='rgba(255,255,255,.5)';
    for(let i=0;i<3;i++){const bx=x+(i-1)*4+Math.sin(t*2+i)*2, by=dy-2-((t*16+i*9+seed*30)%26);
      ctx.beginPath();ctx.arc(bx,by,1.4+i*0.4,0,7);ctx.fill();} }
  // sumbisori breath puff on resurfacing
  if(cyc>=0.86&&cyc<0.97){ const p=(cyc-0.86)/0.11; ctx.save();ctx.globalAlpha=1-p;
    ctx.fillStyle='rgba(255,255,255,.85)';
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+6+i*4, dy-16-p*14-i*3, 2.4-i*0.5,0,7);ctx.fill();}
    ctx.restore(); }
}
/* the player swimming out across the shallows toward the boat — head at the surface, arm in a crawl stroke, a trailing wake */
function drawPlayerSwimming(x,y,t,face,modern){
  face = face||1;
  const bob=Math.sin(t*7)*1.2, stroke=Math.sin(t*7);
  ctx.save();ctx.translate(x,y);
  // wake trailing behind the direction of travel
  ctx.save();ctx.scale(face,1);
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.lineCap='round';
  for(let i=0;i<3;i++){ ctx.globalAlpha=0.5*(1-i/3);
    ctx.beginPath();ctx.ellipse(-(12+i*7),5,4+i*2,2.5+i,0,0,7);ctx.stroke(); }
  ctx.restore();ctx.globalAlpha=1;
  // ripple ring around the swimmer
  ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.ellipse(0,5+bob*0.3,12,4.5,0,0,7);ctx.stroke();
  // forward-crawl arm + hand
  ctx.save();ctx.scale(face,1);ctx.translate(6,bob);ctx.rotate(-0.7-Math.max(0,stroke)*0.7);
  inked(ctx,modern?MIN.jade:MIN.verm,2.2);rr(ctx,-2,-2,11,4,2);fillStroke(ctx);
  inked(ctx,'#eccaa2',1.6);ctx.beginPath();ctx.arc(10,0,2.4,0,7);fillStroke(ctx);
  ctx.restore();
  ctx.restore();
  // head riding the surface (reuse the haenyeo diver head for a consistent look)
  drawDiverHead(x, y-4+bob, 0.92, face);
  // splash flicking off the leading hand
  ctx.save();ctx.fillStyle='rgba(255,255,255,.7)';
  for(let i=0;i<3;i++){const a=t*9+i*2;ctx.beginPath();ctx.arc(x+face*15+Math.cos(a)*2,y-2+Math.sin(a)*3,1.3,0,7);ctx.fill();}
  ctx.restore();
}
function drawSea(){
  const t=performance.now()*0.001;
  // the sea occupies the RIGHT of the wavy coastline, from the shore line down
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W,BEACH_Y);ctx.lineTo(W,H);ctx.lineTo(coastX(H),H);
  for(let y=H;y>=BEACH_Y;y-=12){ ctx.lineTo(coastX(y), y); }
  ctx.closePath();ctx.clip();
  // sea depth gradient running right (deep, open sea) → left (shallow, near shore)
  const seaGrad=ctx.createLinearGradient(W,0,coastX(BEACH_Y),0);
  seaGrad.addColorStop(0,MIN.blue);
  seaGrad.addColorStop(0.5,'#7cc0e0');
  seaGrad.addColorStop(1,MIN.blueL);
  ctx.fillStyle=seaGrad;ctx.fillRect(0,BEACH_Y,W,H-BEACH_Y);
  // tiled rows of curling folk waves
  const rows=[ [BEACH_Y+22,MIN.blueL,0.95], [BEACH_Y+70,'#7cc0e0',1.0], [BEACH_Y+126,MIN.blue,1.05] ];
  for(let r=0;r<rows.length;r++){const[yb,fill,sc]=rows[r];
    const off=(t*8*(r+1))% (28*sc);
    for(let yy=yb;yy<H;yy+=46){
      for(let x=-30;x<W+30;x+=28*sc){
        motifWave(ctx,x-off+(r%2?14:0), yy+Math.sin(x*0.04+t)*2, sc, fill, MIN.white);
      }
    }
  }
  ctx.restore();
  // foamy shoreline running down the coastline
  ctx.save();ctx.strokeStyle=MIN.white;ctx.lineWidth=4.5;ctx.lineJoin='round';ctx.lineCap='round';
  ctx.beginPath();
  for(let y=BEACH_Y-2;y<=H;y+=9){const x=coastX(y)+Math.sin(y*0.13+t*1.8)*3.2; y===BEACH_Y-2?ctx.moveTo(x,y):ctx.lineTo(x,y);}
  ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2;
  ctx.beginPath();
  for(let y=BEACH_Y;y<=H;y+=9){const x=coastX(y)+10+Math.sin(y*0.13+t*1.8+1)*3.2; y===BEACH_Y?ctx.moveTo(x,y):ctx.lineTo(x,y);}
  ctx.stroke();
  ctx.restore();
  // little wooden pier poking from the sand into the water
  (function(){
    const py=540, px=coastX(py);
    inked(ctx,'#a9824e',2.6);rr(ctx,px-26,py-7,46,14,3);fillStroke(ctx);
    ctx.strokeStyle='rgba(60,36,12,.4)';ctx.lineWidth=1.2;
    for(let i=px-22;i<px+18;i+=8){ctx.beginPath();ctx.moveTo(i,py-7);ctx.lineTo(i,py+7);ctx.stroke();}
    inked(ctx,'#7a4f2a',2.2);ctx.beginPath();ctx.arc(px+16,py-8,2.4,0,7);ctx.arc(px+16,py+8,2.4,0,7);fillStroke(ctx);
  })();
  // haenyeo at work out in the water (kept to the right of the coastline)
  drawSeaDiver(655, BEACH_Y+52, t, 0.0, -1);
  drawSeaDiver(795, BEACH_Y+95, t, 0.42, -1);
  drawSeaDiver(705, BEACH_Y+140, t, 0.74, 1);
  // a little anchored dive boat bobbing out in the deeper water
  drawDiveBoat(878, 548, t);
}

/* a cheery anchored dive boat with a hand at the tiller (bobs & rocks gently) */
function drawDiveBoat(x,y,t){
  const bob=Math.sin(t*1.1)*2.2, rock=Math.sin(t*1.1+0.4)*0.05;
  ctx.save();ctx.translate(x,y+bob);ctx.rotate(rock);
  ctx.lineJoin='round';ctx.lineCap='round';
  // ripple ring around the waterline
  ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,12,40,7,0,0.1,Math.PI-0.1);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,14,52,8,0,0.15,Math.PI-0.15);ctx.globalAlpha=.6;ctx.stroke();ctx.globalAlpha=1;
  // hull — red with a cream stripe, folk-cartoon ink outline
  inked(ctx,'#e0573a',2.6);
  ctx.beginPath();ctx.moveTo(-36,-2);ctx.lineTo(36,-2);
  ctx.quadraticCurveTo(30,16,18,16);ctx.lineTo(-22,16);ctx.quadraticCurveTo(-34,16,-36,-2);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='#f4ead2';ctx.fillRect(-34,-1,68,4.5);
  ctx.strokeStyle='rgba(120,30,16,.4)';ctx.lineWidth=1.1;
  for(let i=-26;i<=26;i+=10){ctx.beginPath();ctx.moveTo(i,5);ctx.lineTo(i,14);ctx.stroke();}
  // small wheelhouse / cabin toward the bow
  inked(ctx,'#f1d27a',2.2);rr(ctx,8,-20,20,18,3);fillStroke(ctx);
  inked(ctx,'#bfe3ea',1.8);rr(ctx,12,-16,12,8,2);fillStroke(ctx);
  ctx.strokeStyle='rgba(60,40,20,.4)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(18,-16);ctx.lineTo(18,-8);ctx.stroke();
  // dive flag (white diagonal on red) on a little mast
  ctx.strokeStyle=MIN.ink;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-30,-2);ctx.lineTo(-30,-30);ctx.stroke();
  const fw=Math.sin(t*3)*1.2;
  inked(ctx,'#d8483a',1.6);ctx.beginPath();ctx.moveTo(-30,-30);ctx.lineTo(-14+fw,-28);ctx.lineTo(-14+fw,-18);ctx.lineTo(-30,-20);ctx.closePath();fillStroke(ctx);
  ctx.strokeStyle=MIN.white;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-29,-29.2);ctx.lineTo(-15+fw,-18.8);ctx.stroke();
  // stacked air tanks at the stern
  inked(ctx,'#f1c14b',1.8);rr(ctx,-26,-12,7,12,2.5);fillStroke(ctx);
  inked(ctx,'#5fa8d6',1.8);rr(ctx,-18,-12,7,12,2.5);fillStroke(ctx);
  // diver in a wetsuit seated at the tiller, ready to splash in
  ctx.fillStyle='#2b6f86';ctx.strokeStyle=MIN.ink;ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(-2,-8,6,7,0,0,7);fillStroke(ctx);                 // torso
  ctx.fillStyle='#eccaa2';ctx.beginPath();ctx.arc(-2,-19,5,0,7);fillStroke(ctx);  // head
  inked(ctx,'#e0573a',1.6);ctx.beginPath();ctx.arc(-2,-21,5.4,Math.PI*1.05,Math.PI*1.95);fillStroke(ctx); // woolly cap
  ctx.fillStyle='#2b6f86';ctx.beginPath();ctx.moveTo(3,-9);ctx.quadraticCurveTo(9,-7,8,-1);ctx.lineTo(5,-1);ctx.quadraticCurveTo(5,-6,1,-7);ctx.closePath();fillStroke(ctx); // arm to tiller
  ctx.restore();
}

/* a sleepy grey cat curled up on a rooftop (gentle tail flick) */
function drawRoofCat(x,y,t){
  const coat='#cdc6bc', coatD='#a9a097';
  ctx.save();ctx.translate(x,y);ctx.lineJoin='round';ctx.lineCap='round';
  const fl=Math.sin(t*1.6)*0.5;
  ctx.fillStyle='rgba(74,58,44,.14)';ctx.beginPath();ctx.ellipse(0,7,13,3.2,0,0,7);ctx.fill();
  // tail draped along the roof, flicking at the tip
  ctx.strokeStyle=MIN.ink;ctx.lineWidth=4.4;
  ctx.beginPath();ctx.moveTo(-7,4);ctx.quadraticCurveTo(-15,5,-13+fl*4,-1+fl*2);ctx.stroke();
  ctx.strokeStyle=coat;ctx.lineWidth=2.6;
  ctx.beginPath();ctx.moveTo(-7,4);ctx.quadraticCurveTo(-15,5,-13+fl*4,-1+fl*2);ctx.stroke();
  // loaf body
  inked(ctx,coat,2.4);ctx.beginPath();ctx.ellipse(-1,1,11,7,0,0,7);fillStroke(ctx);
  ctx.fillStyle=coatD;ctx.beginPath();ctx.ellipse(-1,4,9,3,0,0,7);ctx.fill();
  // a couple of tabby stripes
  ctx.strokeStyle=coatD;ctx.lineWidth=1.3;
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*4-1,-5.5);ctx.lineTo(i*4-1,-2);ctx.stroke();}
  // head resting toward the right
  inked(ctx,coat,2.2);ctx.beginPath();ctx.arc(7,-3,6,0,7);fillStroke(ctx);
  ctx.fillStyle=coat;ctx.strokeStyle=MIN.ink;ctx.lineWidth=1.7;
  ctx.beginPath();ctx.moveTo(3.5,-7);ctx.lineTo(2.5,-12);ctx.lineTo(7,-8.5);ctx.closePath();fillStroke(ctx);
  ctx.beginPath();ctx.moveTo(8,-8.5);ctx.lineTo(12,-12);ctx.lineTo(11.5,-7);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='#e7cdac';ctx.beginPath();ctx.moveTo(4.2,-7.6);ctx.lineTo(3.7,-10.4);ctx.lineTo(6,-8.6);ctx.closePath();ctx.fill();
  // sleepy closed eyes + nose + whiskers
  ctx.strokeStyle=MIN.ink;ctx.lineWidth=1.1;
  ctx.beginPath();ctx.arc(5.5,-3.5,1.4,0.1,Math.PI-0.1);ctx.arc(9.5,-3.5,1.4,0.1,Math.PI-0.1);ctx.stroke();
  ctx.fillStyle='#d98ab0';ctx.beginPath();ctx.arc(7.5,-1.4,0.8,0,7);ctx.fill();
  ctx.strokeStyle='rgba(74,58,44,.5)';ctx.lineWidth=0.7;
  ctx.beginPath();ctx.moveTo(8,-1.2);ctx.lineTo(13,-2);ctx.moveTo(8,-0.4);ctx.lineTo(13,0.4);ctx.stroke();
  ctx.restore();
}
/* ---------------- VILLAGE COMPOSE ---------------- */
function lerpHex(a,b,t){
  const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);
  const r=((pa>>16)&255)+(((pb>>16)&255)-((pa>>16)&255))*t;
  const g=((pa>>8)&255)+(((pb>>8)&255)-((pa>>8)&255))*t;
  const bl=(pa&255)+((pb&255)-(pa&255))*t;
  return `rgb(${r|0},${g|0},${bl|0})`;
}
/* sun · sunset · moon arcing across the sky, in step with the clock */
function drawCelestial(time){
  const RISE=360, SET=1140;                 // 6:00 sunrise · 19:00 sunset
  const arcX=p=>48+Math.max(0,Math.min(1,p))*(W-96);
  const arcY=p=>96-Math.sin(Math.max(0,Math.min(1,p))*Math.PI)*58;
  ctx.save();
  // on rainy days the sky is overcast — the sun/moon is hidden behind cloud
  if(typeof G!=='undefined' && G.weather==='rain'){
    let x,y;
    if(time>=RISE && time<=SET){ const p=(time-RISE)/(SET-RISE); x=arcX(p); y=arcY(p); }
    else { let nt=time>SET?time-SET:time+(1440-SET); const span=(1440-SET)+RISE, p=nt/span; x=arcX(p); y=arcY(p); }
    motifCloud(ctx, x, y+2, 1.35, '#c2cad1', 'rgba(42,32,26,.42)');
    motifCloud(ctx, x-26, y+8, 0.95, '#b6bfc7', 'rgba(42,32,26,.4)');
    ctx.restore();
    return;
  }
  if(time>=RISE && time<=SET){
    const p=(time-RISE)/(SET-RISE), x=arcX(p), y=arcY(p);
    const edge=Math.min(p,1-p)*2;            // 0 at the horizon (dawn/dusk) → 1 at noon
    const col = edge<1 ? lerpHex('#e8714a','#f2c75a',edge) : '#f2c75a';
    ctx.globalCompositeOperation='screen';
    const gg=ctx.createRadialGradient(x,y,4,x,y,48);
    gg.addColorStop(0,`rgba(255,205,120,${(0.55-edge*0.12).toFixed(3)})`);gg.addColorStop(1,'rgba(255,205,120,0)');
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(x,y,48,0,7);ctx.fill();
    ctx.globalCompositeOperation='source-over';
    inked(ctx,col,3);ctx.beginPath();ctx.arc(x,y,18,0,7);fillStroke(ctx);
    ctx.strokeStyle=col;ctx.lineWidth=3;ctx.lineCap='round';
    for(let a=0;a<6.28;a+=6.28/8){ctx.beginPath();ctx.moveTo(x+Math.cos(a)*22,y+Math.sin(a)*22);ctx.lineTo(x+Math.cos(a)*28,y+Math.sin(a)*28);ctx.stroke();}
  } else {
    let nt = time>SET ? time-SET : time+(1440-SET);   // minutes since sunset
    const span=(1440-SET)+RISE, p=nt/span, x=arcX(p), y=arcY(p);
    ctx.globalCompositeOperation='screen';
    const gg=ctx.createRadialGradient(x,y,3,x,y,42);
    gg.addColorStop(0,'rgba(224,234,246,.5)');gg.addColorStop(1,'rgba(224,234,246,0)');
    ctx.fillStyle=gg;ctx.beginPath();ctx.arc(x,y,42,0,7);ctx.fill();
    ctx.globalCompositeOperation='source-over';
    inked(ctx,'#eef2f4',3);ctx.beginPath();ctx.arc(x,y,16,0,7);fillStroke(ctx);
    ctx.fillStyle='rgba(150,170,190,.5)';
    ctx.beginPath();ctx.arc(x-5,y-3,3,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(x+4,y+4,2.4,0,7);ctx.fill();
    ctx.beginPath();ctx.arc(x+3,y-6,1.7,0,7);ctx.fill();
  }
  ctx.restore();
}
function drawVillage(){
  if(!villageBG) buildVillageBG();
  ctx.drawImage(villageBG,0,0,W,H);
  // drifting auspicious clouds across the sky-meadow
  const tc=performance.now()*0.001;
  ctx.save();ctx.beginPath();ctx.rect(0,40,W,SEA_Y-40);ctx.clip();
  for(let i=0;i<3;i++){const span=W+200, cx=((tc*7*(0.5+i*0.3)+i*200)%span)-100; const cy=56+i*24;
    ctx.globalAlpha=.55;motifCloud(ctx,cx,cy,1+i*0.2,MIN.white,'rgba(42,32,26,.5)');ctx.globalAlpha=1;}
  ctx.restore();
  drawSea();
  drawBeachCompanions(tc);   // robot + dog on the sand; they head home at dusk
  // the 포장마차 on the sand — folded under the bulteok by day, raised beside it after 17:00
  { if(typeof pojangRect==='function') drawPojangmacha(ctx, pojangRect()); }
  // village pets — cat & Jeju dog wandering the lanes
  if(typeof PETS!=='undefined'){ for(const p of PETS){
    const by = p.petJoy>0 ? -Math.abs(Math.sin(p.petJoy*Math.PI))*4 : 0;   // a little happy hop when patted
    if(p.kind==='cat') drawCat(p.x,p.y+by,{face:p.face,moving:p.moving,phase:p.anim,idle:p.phase});
    else drawDog(p.x,p.y+by,{face:p.face,moving:p.moving,phase:p.anim,idle:p.phase});
    if(p.petJoy>0){   // floating heart rising + fading above the pet
      ctx.save();
      ctx.globalAlpha=Math.min(1,p.petJoy);
      ctx.fillStyle='#e8714a';ctx.font='14px serif';ctx.textAlign='center';
      ctx.fillText('♥', p.x, p.y-24-(1-p.petJoy)*16);
      ctx.restore();
    }
  } }
  // a grey cat curled up napping on the home's thatch roof
  { const hb=buildings.find(b=>b.name==='home'); if(hb) drawRoofCat(hb.x+hb.w*0.66, hb.y+hb.h*0.30, tc); }
  // characters
  for(const n of NPCS){ if(n.atHome)continue; drawPerson(n.x,n.y,{skin:n.skin,scarf:n.scarf,look:n.look,face:n.face||1,moving:n.moving,phase:n.anim,idle:n.phase}); }
  if(scene!=='title'){
    if(P.sitting && P.sitAt==='bulteok') drawPlayerSittingByFire(P.x,P.y,tc);
    else if(P.sitting) drawPlayerOnLounger(tc);
    else if(P.swimming) drawPlayerSwimming(P.x,P.y,tc,P.face,(typeof G!=='undefined'&&G.suit==='modern'));
    else if(typeof joinAnim!=='undefined' && joinAnim) drawPlayerJoining(P.x,P.y,tc);
    else drawPerson(P.x,P.y,{skin:'#eccaa2',scarf:MIN.gold,face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  }
  // flat day/night wash
  applyDayLight();
  drawCelestial(G.time);
  const nt=nightAmt(G.time);
  // stars scattered across the night sky-field
  if(nt>0.45){ ctx.save();
    const sa=Math.min(1,(nt-0.45)/0.4);
    ctx.fillStyle='#fdf8e6';
    for(let i=0;i<42;i++){const sx=(i*97.3)%W;const sy=(i*53.7)%150+16;
      const tw=0.45+0.55*Math.sin(performance.now()*0.003+i*1.7);
      ctx.globalAlpha=sa*tw;ctx.beginPath();ctx.arc(sx,sy,0.8+(i%3)*0.4,0,7);ctx.fill();}
    ctx.restore();
  }
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
  // the 포장마차 window glows warm from inside in the evening
  { const pm=(typeof pojangRect==='function')?pojangRect():null;
    if(pm && G.time>=17*60 && nt>0.05){ const gx=pm.x+pm.w*0.62, gy=pm.y+pm.h*0.36;
      ctx.save(); ctx.globalCompositeOperation='screen';
      const lg=ctx.createRadialGradient(gx,gy,2,gx,gy,40);
      lg.addColorStop(0,`rgba(255,180,80,${nt*0.7})`); lg.addColorStop(1,'rgba(255,180,80,0)');
      ctx.fillStyle=lg; ctx.beginPath(); ctx.arc(gx,gy,40,0,7); ctx.fill(); ctx.restore(); } }
  // a lantern lit outside the gear shop through the evening, so its doorway isn't left dark
  { const sb=buildings.find(b=>b.name==='store');
    if(sb){ const lx=sb.x+sb.w-13, ly=sb.y+sb.h-24, lit=nt>0.06;
      if(lit){ ctx.save(); ctx.globalCompositeOperation='screen';
        const lg=ctx.createRadialGradient(lx,ly,2,lx,ly,46);
        lg.addColorStop(0,`rgba(255,196,110,${(nt*0.8).toFixed(3)})`); lg.addColorStop(1,'rgba(255,196,110,0)');
        ctx.fillStyle=lg; ctx.beginPath(); ctx.arc(lx,ly,46,0,7); ctx.fill();
        const pg=ctx.createRadialGradient(lx,sb.y+sb.h+12,2,lx,sb.y+sb.h+12,32);   // warm pool on the sand
        pg.addColorStop(0,`rgba(255,188,88,${(nt*0.5).toFixed(3)})`); pg.addColorStop(1,'rgba(255,188,88,0)');
        ctx.fillStyle=pg; ctx.beginPath(); ctx.ellipse(lx,sb.y+sb.h+12,32,11,0,0,7); ctx.fill(); ctx.restore(); }
      // the little wall lantern (bulb brightens after dusk)
      ctx.save();
      ctx.strokeStyle=MIN.ink; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(lx,ly-15); ctx.lineTo(lx,ly-9); ctx.stroke();
      inked(ctx,'#6e4a2c',2); rr(ctx,lx-5,ly-9,10,13,3); fillStroke(ctx);
      ctx.fillStyle = lit ? `rgba(255,212,124,${(0.6+nt*0.4).toFixed(3)})` : 'rgba(150,140,120,.55)';
      rr(ctx,lx-3,ly-7,6,9,2); ctx.fill();
      ctx.restore();
    } }
  // warm window glow at night
  if(nt>0.12){
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const b of buildings){ if(b.name==='bulteok'||b.name==='coop'||b.name==='store'||b.name==='house3'||b.name==='pojangmacha')continue;
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
  { const bt=buildings.find(b=>b.name==='bulteok'); /* Bulteok label removed */ }
  // (dive label removed)
  // flying cranes across the sky
  (function(){const tb=performance.now()*0.001;
    for(let i=0;i<3;i++){
      const span=W+90, bx=((tb*22*(1+i*0.3)+i*180)%span)-45;
      const by=120+i*40+Math.sin(tb*1.1+i)*6;
      const flap=Math.sin(tb*4+i)*0.5+0.5;
      motifCrane(ctx,bx,by,0.9,(i%2?1:-1),flap);
    }})();
  for(const n of NPCS){ if(n.atHome)continue;
    const h=hearts(n.id); if(h>0){ctx.fillStyle=MIN.verm;ctx.font='12px serif';ctx.textAlign='center';ctx.fillText('♥'.repeat(h),n.x,n.y-32);} }
  // weather overlay (rolled per day)
  drawWeather();
}

/* ---------------- PEOPLE (flat folk-art haenyeo) ---------------- */
function drawPerson(x,y,opt){
  const L=opt.look||{};
  const player=opt.player;
  if(player && !L.hairStyle){ L.hairStyle='ponytail'; }   // casual land look for the player
  const skin=opt.skin||L.skin||'#f1cba2';
  const scarf=opt.scarf||L.sash||MIN.verm;
  const face=opt.face||1, moving=opt.moving, phase=opt.phase||0, idle=opt.idle||0;
  const modern=opt.modern;
  const diver=L.hood;                                   // dive hood + mask only underwater (drawn elsewhere); on land everyone's in everyday clothes
  const TOP=player?MIN.verm:(L.top||MIN.white);
  const HOOD=player?MIN.white:(L.top||MIN.white);
  const BOT=player?'#3f5e7a':(L.bottom||'#37343d');
  const hairCol=player?'#2a2018':(L.hair||'#241f1b');
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(74,58,44,.2)';ctx.beginPath();ctx.ellipse(0,16,12,4,0,0,7);ctx.fill();
  const bob=moving?Math.abs(Math.sin(phase))*2:Math.sin(performance.now()*0.002+idle)*0.9;
  ctx.translate(0,-bob);
  ctx.scale(face,1);
  const step=moving?Math.sin(phase):0;
  // stubby legs
  inked(ctx,BOT,2.4);
  rr(ctx,-5.5+step*2.4,5,5,11,2);fillStroke(ctx); rr(ctx,0.5-step*2.4,5,5,11,2);fillStroke(ctx);
  // chunky rounded torso
  inked(ctx,TOP,3); rr(ctx,-9,-7,18,17,8);fillStroke(ctx);
  if(diver){ ctx.strokeStyle=(player&&modern)?MIN.jade:MIN.ink;ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(0,9);ctx.stroke(); }
  // open vest / work jacket
  if(L.vest){ inked(ctx,L.vest,2.4);
    ctx.beginPath();ctx.moveTo(-9,-6.5);ctx.lineTo(-2.6,-6.5);ctx.lineTo(-4,10);ctx.lineTo(-9,10);ctx.closePath();fillStroke(ctx);
    ctx.beginPath();ctx.moveTo(9,-6.5);ctx.lineTo(2.6,-6.5);ctx.lineTo(4,10);ctx.lineTo(9,10);ctx.closePath();fillStroke(ctx);
    ctx.fillStyle=MIN.gold;ctx.beginPath();ctx.arc(-6,0,0.9,0,7);ctx.arc(-6,4,0.9,0,7);ctx.fill(); }
  // apron
  if(L.apron){ inked(ctx,L.apron,2.2);rr(ctx,-7,-3,14,13,3);fillStroke(ctx);
    ctx.strokeStyle='rgba(120,90,40,.3)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-7,-3);ctx.lineTo(7,-3);ctx.stroke();
    if(L.floral){ctx.fillStyle=L.scarf||MIN.plum;for(const[ddx,ddy]of[[-3,2],[3,5],[0,8],[-4,7]]){ctx.beginPath();ctx.arc(ddx,ddy,1.1,0,7);ctx.fill();}} }
  // waist sash for divers
  if(diver){ inked(ctx,scarf,1.8);rr(ctx,-9,6,18,4,2);fillStroke(ctx); }
  // arms + round hands
  inked(ctx,L.vest||TOP,2.4);rr(ctx,-12,-4,4.5,11,2.2);fillStroke(ctx); rr(ctx,7.5,-4,4.5,11,2.2);fillStroke(ctx);
  inked(ctx,skin,1.8);ctx.beginPath();ctx.arc(-9.8,8,2.6,0,7);fillStroke(ctx);ctx.beginPath();ctx.arc(9.8,8,2.6,0,7);fillStroke(ctx);
  // ledger / clipboard for the manager
  if(L.clipboard){ ctx.save();ctx.translate(10,7);ctx.rotate(0.18);
    inked(ctx,'#9c7338',1.6);rr(ctx,-1,-7,9,12,1.5);fillStroke(ctx);
    ctx.fillStyle=MIN.white;ctx.fillRect(0.3,-5.2,6.4,8.4);
    ctx.fillStyle=MIN.verm;rr(ctx,2.2,-6.2,3,2,0.5);ctx.fill();
    ctx.strokeStyle='rgba(74,58,44,.4)';ctx.lineWidth=0.7;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(1.2,-3+i*2);ctx.lineTo(6,-3+i*2);ctx.stroke();}
    ctx.restore(); }

  const hy=-17, hr=10.5;
  // hair tucked behind the head (non-divers)
  if(!diver){
    if(L.hairStyle==='ponytail'){ inked(ctx,hairCol,2);ctx.beginPath();ctx.ellipse(-8.6,-13,3.4,7.6,0.35,0,7);fillStroke(ctx); }
    else if(L.hairStyle==='bun'){ inked(ctx,hairCol,2);ctx.beginPath();ctx.arc(0,-28,4.4,0,7);fillStroke(ctx); }
  }
  // round head
  inked(ctx,skin,2.6);ctx.beginPath();ctx.arc(0,hy,hr,0,7);fillStroke(ctx);

  if(diver){
    // cotton hood
    inked(ctx,HOOD,2.6);
    ctx.beginPath();ctx.arc(0,hy,11,Math.PI*0.96,Math.PI*0.04,true);
    ctx.quadraticCurveTo(0,-11,-11,-15);ctx.closePath();fillStroke(ctx);
    ctx.fillStyle=scarf;ctx.beginPath();ctx.ellipse(0,-26,11,3.4,0,Math.PI,0);ctx.fill();
    // single-lens mask pushed up on the forehead
    ctx.strokeStyle='#c77fa6';ctx.lineWidth=2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-4.4,-23.5);ctx.lineTo(-9,-21.5);ctx.moveTo(4.4,-23.5);ctx.lineTo(9,-21.5);ctx.stroke();
    inked(ctx,'#d98ab0',2);ctx.beginPath();ctx.arc(0,-24,4.6,0,7);fillStroke(ctx);
    ctx.strokeStyle='#cdd2d8';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,-24,3.6,0,7);ctx.stroke();
    ctx.fillStyle='#f0883a';ctx.beginPath();ctx.arc(0,-24,3,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,240,210,.6)';ctx.beginPath();ctx.ellipse(-1,-25,1.2,0.8,-0.5,0,7);ctx.fill();
  } else {
    // hair cap with a forehead hairline
    const hl=(L.male||L.hairStyle==='short')?hy-6.5:hy-3.4;
    inked(ctx,hairCol,2.2);
    ctx.beginPath();
    ctx.moveTo(-hr*0.98,hy-1);
    ctx.quadraticCurveTo(-hr-2,hy-hr,0,hy-hr-2);
    ctx.quadraticCurveTo(hr+2,hy-hr,hr*0.98,hy-1);
    ctx.quadraticCurveTo(hr*0.55,hl,0,hl);
    ctx.quadraticCurveTo(-hr*0.55,hl,-hr*0.98,hy-1);
    ctx.closePath();fillStroke(ctx);
    if(L.hairStyle==='bob'){
      ctx.beginPath();ctx.moveTo(-hr*0.98,hy-1);ctx.quadraticCurveTo(-hr-1.6,hy+4,-hr+1,hy+7.5);ctx.lineTo(-hr+3.2,hy+6.5);ctx.quadraticCurveTo(-hr+1.4,hy+1,-hr*0.62,hy-1);ctx.closePath();fillStroke(ctx);
      ctx.beginPath();ctx.moveTo(hr*0.98,hy-1);ctx.quadraticCurveTo(hr+1.6,hy+4,hr-1,hy+7.5);ctx.lineTo(hr-3.2,hy+6.5);ctx.quadraticCurveTo(hr-1.4,hy+1,hr*0.62,hy-1);ctx.closePath();fillStroke(ctx);
    }
    // headscarf over the hair
    if(L.scarf){
      inked(ctx,L.scarf,2.2);
      ctx.beginPath();
      ctx.moveTo(-hr-1.5,hy-0.5);
      ctx.quadraticCurveTo(0,hy-hr-5.5,hr+1.5,hy-0.5);
      ctx.quadraticCurveTo(0,hy-3,-hr-1.5,hy-0.5);
      ctx.closePath();fillStroke(ctx);
      ctx.beginPath();ctx.arc(hr-0.5,hy-0.5,2.2,0,7);fillStroke(ctx);   // knot
      if(L.floral){ctx.fillStyle='rgba(255,255,255,.78)';for(const[ddx,ddy]of[[-4,-6],[3,-7],[-0.5,-4],[5,-3]]){ctx.beginPath();ctx.arc(ddx,hy+ddy,0.9,0,7);ctx.fill();}}
    }
  }
  // ---- face ----
  const eyeY=hy+0.5, eo=L.elder?2.9:3.2;
  ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(-eo,eyeY,L.elder?1.3:1.6,0,7);ctx.arc(eo,eyeY,L.elder?1.3:1.6,0,7);ctx.fill();
  if(L.glasses){ ctx.strokeStyle=MIN.ink;ctx.lineWidth=1.3;
    ctx.beginPath();ctx.arc(-eo,eyeY,2.7,0,7);ctx.arc(eo,eyeY,2.7,0,7);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-eo+2.7,eyeY);ctx.lineTo(eo-2.7,eyeY);ctx.stroke(); }
  ctx.fillStyle='rgba(232,113,74,.42)';ctx.beginPath();ctx.arc(-6,hy+3.5,2.2,0,7);ctx.arc(6,hy+3.5,2.2,0,7);ctx.fill();
  ctx.strokeStyle=MIN.ink;ctx.lineWidth=1.4;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,hy+2.5,2.5,.2,Math.PI-.2);ctx.stroke();
  if(L.mustache){ ctx.strokeStyle=hairCol;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-3,hy+4.4);ctx.quadraticCurveTo(0,hy+6,3,hy+4.4);ctx.stroke(); }
  if(L.elder){ ctx.strokeStyle='rgba(74,58,44,.4)';ctx.lineWidth=0.9;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-eo-2.6,eyeY-2.4);ctx.lineTo(-eo-0.7,eyeY-1.7);ctx.moveTo(eo+0.7,eyeY-1.7);ctx.lineTo(eo+2.6,eyeY-2.4);ctx.stroke(); }
  ctx.restore();
}

/* ---------------- VILLAGE PETS (cat + Jeju dog) ---------------- */
/* the beach lounge set — straw mat, thatched parasol on a bamboo pole, two wooden
   deck chairs, with the village cat & dog lounging beside. Ground line at (x,y). */
function drawBeachLoungeSet(g,x,y,s,t){
  s=s||1; t=t||0; g.save(); g.translate(x,y); g.scale(s,s); g.lineJoin='round'; g.lineCap='round';
  const straw='#d2ad6c', strawD='#a98a4e', wood='#8a5e3a', woodD='#6e4a2c';
  // soft ground shadow + woven straw mat (gentle trapezoid for a lying-flat read)
  g.fillStyle='rgba(20,12,8,.13)';g.beginPath();g.ellipse(0,4,76,10,0,0,7);g.fill();
  inked(g,straw,2.4);g.beginPath();
  g.moveTo(-60,-28);g.lineTo(60,-28);g.lineTo(72,4);g.lineTo(-72,4);g.closePath();fillStroke(g);
  g.strokeStyle=strawD;g.lineWidth=1.2;                         // weave dashes
  for(let r=0;r<4;r++){ for(let c=0;c<8;c++){
    const wx=-52+c*14+(r%2)*5, wy=-22+r*7;
    g.beginPath();g.moveTo(wx,wy);g.lineTo(wx+7,wy+1.5);g.stroke(); } }
  // bamboo pole (behind the chairs), short — the canopy hangs low over the chairs
  inked(g,'#c9a662',2.2);rr(g,-3,-80,7,58,3);fillStroke(g);
  g.strokeStyle='#a9854a';g.lineWidth=1.6;
  for(const jy of [-68,-52,-36]){g.beginPath();g.moveTo(-3,jy);g.lineTo(4,jy);g.stroke();}
  // thatched canopy: shallow straw cone, scalloped hem, radial strokes, topknot
  inked(g,straw,2.6);g.beginPath();
  g.moveTo(0,-110);g.quadraticCurveTo(34,-102,58,-76);
  g.quadraticCurveTo(44,-80,30,-76);g.quadraticCurveTo(18,-82,0,-78);
  g.quadraticCurveTo(-18,-82,-30,-76);g.quadraticCurveTo(-44,-80,-58,-76);
  g.quadraticCurveTo(-34,-102,0,-110);g.closePath();fillStroke(g);
  g.strokeStyle=strawD;g.lineWidth=1.4;
  for(const k of [-0.85,-0.5,-0.2,0.2,0.5,0.85]){
    g.beginPath();g.moveTo(0,-108);g.quadraticCurveTo(k*30,-98,k*52,-78);g.stroke(); }
  inked(g,strawD,2);rr(g,-4,-120,8,10,3);fillStroke(g);          // tied topknot
  inked(g,straw,1.8);g.beginPath();g.arc(0,-122,4,0,7);fillStroke(g);
  // two slatted wooden deck chairs (3/4, backrest left, seat sloping right)
  const chair=(cx)=>{ g.save();g.translate(cx,0);
    g.fillStyle='rgba(20,12,8,.14)';g.beginPath();g.ellipse(2,1,26,5,0,0,7);g.fill();
    inked(g,woodD,2.2);                                          // crossed legs
    g.beginPath();g.moveTo(-14,-14);g.lineTo(2,1);g.stroke();
    g.beginPath();g.moveTo(8,-12);g.lineTo(-8,1);g.stroke();
    g.beginPath();g.moveTo(20,-10);g.lineTo(16,1);g.stroke();
    inked(g,wood,2.4);                                           // slanted backrest panel
    g.beginPath();g.moveTo(-22,-46);g.lineTo(-10,-44);g.lineTo(0,-16);g.lineTo(-14,-16);g.closePath();fillStroke(g);
    g.strokeStyle=woodD;g.lineWidth=1.4;                         // backrest slats
    for(let i=1;i<4;i++){const t2=i/4;
      g.beginPath();g.moveTo(-22+(-14+22)*t2,-46+30*t2);g.lineTo(-10+(0+10)*t2,-44+28*t2);g.stroke();}
    inked(g,wood,2.4);                                           // seat sloping to the footrest
    g.beginPath();g.moveTo(-14,-16);g.lineTo(0,-16);g.lineTo(24,-9);g.lineTo(12,-7);g.closePath();fillStroke(g);
    g.strokeStyle=woodD;g.lineWidth=1.4;
    g.beginPath();g.moveTo(-4,-14.5);g.lineTo(16,-8.5);g.stroke();
    g.restore(); };
  chair(-30); chair(28);
  // little beach creatures, grounded with soft contact shadows
  // a starfish resting on the mat, front-left
  g.save();g.translate(-36,-6);
  g.fillStyle='rgba(20,12,8,.14)';g.beginPath();g.ellipse(0,3,9,2.6,0,0,7);g.fill();
  inked(g,'#e8a05a',2);g.beginPath();
  for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5, b=a+Math.PI/5;
    g.lineTo(Math.cos(a)*9,Math.sin(a)*9);g.lineTo(Math.cos(b)*3.8,Math.sin(b)*3.8);}
  g.closePath();fillStroke(g);
  g.fillStyle='#cf7e35';for(const d of [[-2,-1],[2,0],[0,2.5]]){g.beginPath();g.arc(d[0],d[1],0.9,0,7);g.fill();}
  g.restore();
  // a little crab scuttling sideways across the sand, right of the mat
  const crabX=66+Math.sin(t*0.7)*16, wig=Math.sin(t*7)*0.8;
  g.save();g.translate(crabX,-3);
  g.fillStyle='rgba(20,12,8,.14)';g.beginPath();g.ellipse(0,4,11,3,0,0,7);g.fill();
  g.strokeStyle='#b84a38';g.lineWidth=2;g.lineCap='round';     // legs (scuttling wiggle)
  for(const lx of [-1,1]){ for(let i=0;i<3;i++){
    g.beginPath();g.moveTo(lx*7,-2+i*1.5);g.lineTo(lx*(11+i*1.5),2+i*1.2+wig*lx);g.stroke(); } }
  inked(g,'#e0604a',2);g.beginPath();g.ellipse(0,-3,8,5.5,0,0,7);fillStroke(g);   // body
  inked(g,'#e0604a',1.8);g.beginPath();g.arc(-10,-7,3,0,7);fillStroke(g);          // claws
  g.beginPath();g.arc(10,-7,3,0,7);fillStroke(g);
  g.strokeStyle=MIN.ink;g.lineWidth=1.4;
  g.beginPath();g.moveTo(-11.5,-9.5);g.lineTo(-9,-7.5);g.stroke();                  // pincer notches
  g.beginPath();g.moveTo(11.5,-9.5);g.lineTo(9,-7.5);g.stroke();
  g.fillStyle=MIN.ink;                                                              // eyes on stalks
  g.strokeStyle=MIN.ink;g.lineWidth=1.2;
  g.beginPath();g.moveTo(-3,-8);g.lineTo(-3,-10.5);g.stroke();g.beginPath();g.arc(-3,-11,1.5,0,7);g.fill();
  g.beginPath();g.moveTo(3,-8);g.lineTo(3,-10.5);g.stroke();g.beginPath();g.arc(3,-11,1.5,0,7);g.fill();
  g.strokeStyle='rgba(74,58,44,.8)';g.lineWidth=1.2;                                // tiny smile
  g.beginPath();g.arc(0,-3.4,2,0.3,Math.PI-0.3);g.stroke();
  g.restore();
  // a tiny shell by the mat corner
  g.save();g.translate(-62,0);
  g.fillStyle='rgba(20,12,8,.12)';g.beginPath();g.ellipse(0,2.5,5.5,1.8,0,0,7);g.fill();
  inked(g,'#f3d9b0',1.6);g.beginPath();g.arc(0,1,4.5,Math.PI,0,false);g.closePath();fillStroke(g);
  g.strokeStyle='#caa05e';g.lineWidth=0.9;
  for(let k=-1;k<=1;k++){g.beginPath();g.moveTo(0,1);g.lineTo(k*2.4,-3);g.stroke();}
  g.restore();
  g.restore();
}
/* the player stretched out on the right deck chair — head back on the rest,
   legs along the seat, eyes closed, listening to the waves. Drawn over the
   lounge set at its chair origin (world 140,588). */
/* the player joining the dog & robot's activity — a happy little bounce with arms thrown up */
function drawPlayerJoining(x,y,t){
  const hop=Math.abs(Math.sin(t*5))*7, lean=Math.sin(t*5)*0.07, sw=Math.sin(t*5)*0.3;
  const TOP=MIN.verm, BOT='#3f5e7a', skin='#eccaa2';
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(74,58,44,.2)'; ctx.beginPath(); ctx.ellipse(0,16,12,4,0,0,7); ctx.fill();   // shadow stays grounded
  ctx.translate(0,-hop); ctx.rotate(lean);
  // legs (a little apart, bouncing)
  inked(ctx,BOT,2.4); rr(ctx,-5.5,5,5,11,2); fillStroke(ctx); rr(ctx,0.5,5,5,11,2); fillStroke(ctx);
  // torso
  inked(ctx,TOP,3); rr(ctx,-9,-7,18,17,8); fillStroke(ctx);
  // both arms thrown up in celebration
  inked(ctx,TOP,2.4);
  ctx.save(); ctx.translate(-8,-5); ctx.rotate(-0.95+sw); rr(ctx,-2,-12,4.2,13,2); fillStroke(ctx);
    inked(ctx,skin,1.8); ctx.beginPath(); ctx.arc(0,-13,2.6,0,7); fillStroke(ctx); ctx.restore();
  inked(ctx,TOP,2.4);
  ctx.save(); ctx.translate(8,-5); ctx.rotate(0.95+sw); rr(ctx,-2.2,-12,4.2,13,2); fillStroke(ctx);
    inked(ctx,skin,1.8); ctx.beginPath(); ctx.arc(0,-13,2.6,0,7); fillStroke(ctx); ctx.restore();
  // ponytail + head + a happy face
  inked(ctx,'#2a2018',2); ctx.beginPath(); ctx.ellipse(-8.6,-13,3.4,7.6,0.35,0,7); fillStroke(ctx);
  inked(ctx,skin,2.6); ctx.beginPath(); ctx.arc(0,-17,10.5,0,7); fillStroke(ctx);
  ctx.fillStyle=MIN.ink; ctx.beginPath(); ctx.arc(-3.4,-18,1.1,0,7); ctx.arc(3.4,-18,1.1,0,7); ctx.fill();
  ctx.strokeStyle=MIN.ink; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(0,-15,3,0.15*Math.PI,0.85*Math.PI); ctx.stroke();
  ctx.restore();
  // cheer sparkles popping around
  ctx.save(); ctx.fillStyle='#f2c75a';
  for(let i=0;i<3;i++){ const a=t*3+i*2.1; ctx.globalAlpha=0.45+0.45*Math.sin(t*6+i*2);
    ctx.beginPath(); ctx.arc(x+Math.cos(a)*20, y-28+Math.sin(a)*7, 1.7,0,7); ctx.fill(); }
  ctx.globalAlpha=1; ctx.restore();
}
/* the player sitting on the warm stone by the bulteok fire — knees up, hands warming, facing the hearth */
function drawPlayerSittingByFire(x,y,t){
  const sway=Math.sin(t*1.6)*0.5;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(74,58,44,.22)';ctx.beginPath();ctx.ellipse(0,11,15,4.5,0,0,7);ctx.fill();
  ctx.translate(0,sway*0.4);
  // folded legs (knees drawn up in front), then feet
  inked(ctx,'#3f5e7a',2.4);
  ctx.beginPath();ctx.ellipse(-6,7,6.5,4.2,0,0,7);fillStroke(ctx);
  ctx.beginPath();ctx.ellipse(6,7,6.5,4.2,0,0,7);fillStroke(ctx);
  inked(ctx,'#2a2228',2);ctx.beginPath();ctx.ellipse(-10,10,3,2,0,0,7);fillStroke(ctx);ctx.beginPath();ctx.ellipse(10,10,3,2,0,0,7);fillStroke(ctx);
  // lowered, rounded torso
  inked(ctx,MIN.verm,3);rr(ctx,-8.5,-9,17,15,7);fillStroke(ctx);
  // arms resting forward on the knees, round hands held to the warmth
  inked(ctx,MIN.verm,2.2);rr(ctx,-11,-1,4.5,8,2);fillStroke(ctx);rr(ctx,6.5,-1,4.5,8,2);fillStroke(ctx);
  inked(ctx,'#eccaa2',1.8);ctx.beginPath();ctx.arc(-8,6,2.5,0,7);fillStroke(ctx);ctx.beginPath();ctx.arc(8,6,2.5,0,7);fillStroke(ctx);
  // ponytail + head, facing the fire (up)
  const hy=-17;
  inked(ctx,'#2a2018',2);ctx.beginPath();ctx.ellipse(-7.5,-13,3,6.5,0.35,0,7);fillStroke(ctx);
  inked(ctx,'#eccaa2',2.6);ctx.beginPath();ctx.arc(0,hy,9.5,0,7);fillStroke(ctx);
  ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(-2.6,hy,1.1,0,7);ctx.arc(2.6,hy,1.1,0,7);ctx.fill();
  ctx.strokeStyle='rgba(208,90,60,.5)';ctx.lineWidth=1.4;   // warm cheeks by the fire
  ctx.beginPath();ctx.arc(-5,hy+3,1.3,0,7);ctx.arc(5,hy+3,1.3,0,7);ctx.stroke();
  ctx.restore();
}
function drawPlayerOnLounger(t){
  const g=ctx; g.save(); g.translate(140,588);
  const skin='#eccaa2', TOP=MIN.verm, BOT='#3f5e7a', hairCol='#2a2018';
  const br=Math.sin((t||0)*1.7)*0.7;                 // slow, contented breathing
  // far leg (slightly behind/darker), then near leg — resting down the sloped seat
  limb(g,-2,-21,10,-20,5.5,shade(BOT,-14)); limb(g,10,-20,21,-11,5.5,shade(BOT,-14));
  inked(g,skin,1.8);g.beginPath();g.arc(22.5,-9.5,2.8,0,7);fillStroke(g);
  limb(g,-4,-24,8,-23,5.5,BOT); limb(g,8,-23,19,-13,5.5,BOT);
  inked(g,skin,1.8);g.beginPath();g.arc(20.5,-11.5,2.8,0,7);fillStroke(g);
  // reclined upper body, leaning back along the backrest
  g.save(); g.translate(-7,-30+br); g.rotate(-0.6);
  // far arm hanging loosely off the side of the chair
  limb(g,-6,-2,-12,7,4.5,shade(TOP,-12));
  inked(g,skin,1.8);g.beginPath();g.arc(-13,9,2.6,0,7);fillStroke(g);
  // torso
  inked(g,TOP,3); rr(g,-8.5,-9,17,19,8); fillStroke(g);
  // near arm folded across the belly
  limb(g,6,-5,-1,4,4.5,TOP);
  inked(g,skin,1.8);g.beginPath();g.arc(-2.5,4.5,2.6,0,7);fillStroke(g);
  // ponytail spilling over the backrest
  inked(g,hairCol,2);g.beginPath();g.ellipse(-9,-24,3.2,7,0.55,0,7);fillStroke(g);
  // head resting back
  inked(g,skin,2.6);g.beginPath();g.arc(0,-19,10,0,7);fillStroke(g);
  // hair cap with a soft hairline
  inked(g,hairCol,2.2);g.beginPath();
  g.moveTo(-10,-20);g.quadraticCurveTo(-11,-30.5,0,-30.5);g.quadraticCurveTo(11,-30.5,10,-20);
  g.quadraticCurveTo(4.5,-24,0,-24);g.quadraticCurveTo(-4.5,-24,-10,-20);g.closePath();fillStroke(g);
  // happy closed eyes + easy smile + blush — basking
  g.strokeStyle=MIN.ink;g.lineWidth=1.8;g.lineCap='round';
  g.beginPath();g.arc(-3.8,-18,2.2,Math.PI*0.12,Math.PI*0.88);g.stroke();
  g.beginPath();g.arc(3.8,-18,2.2,Math.PI*0.12,Math.PI*0.88);g.stroke();
  g.beginPath();g.arc(0,-14,2.6,Math.PI*0.15,Math.PI*0.85);g.stroke();
  g.fillStyle='rgba(220,120,90,.25)';
  g.beginPath();g.ellipse(-6.6,-15.5,1.8,1.2,0,0,7);g.fill();
  g.beginPath();g.ellipse(6.6,-15.5,1.8,1.2,0,0,7);g.fill();
  g.restore();
  g.restore();
}
/* ginger village cat — small, upright curly tail, triangle ears */
function drawCat(x,y,opt){
  const face=opt.face||1, moving=opt.moving, phase=opt.phase||0, idle=opt.idle||0;
  const coat='#e89a4e', coatD='#cf7e35', belly='#f7e6c8';
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(74,58,44,.18)';ctx.beginPath();ctx.ellipse(0,6,12,3.2,0,0,7);ctx.fill();
  const bob=moving?Math.abs(Math.sin(phase*2))*1:Math.sin(performance.now()*0.0022+idle)*0.5;
  ctx.translate(0,-bob);ctx.scale(face,1);
  const step=moving?Math.sin(phase*2):0;
  // legs
  inked(ctx,coatD,2);
  rr(ctx,-6+step*1.6,1,3.4,7,1.6);fillStroke(ctx); rr(ctx,4.5-step*1.6,1,3.4,7,1.6);fillStroke(ctx);
  // upright curling tail (gently swaying tip)
  const cw=Math.sin(performance.now()*0.004+idle)*2.4;
  ctx.strokeStyle=MIN.ink;ctx.lineWidth=3.6;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-8,-2);ctx.quadraticCurveTo(-15-cw*0.4,-7,-11-cw,-13+Math.abs(cw)*0.4);ctx.stroke();
  ctx.strokeStyle=coat;ctx.lineWidth=2.2;
  ctx.beginPath();ctx.moveTo(-8,-2);ctx.quadraticCurveTo(-15-cw*0.4,-7,-11-cw,-13+Math.abs(cw)*0.4);ctx.stroke();
  // body
  inked(ctx,coat,2.4);rr(ctx,-9,-4,16,9,6);fillStroke(ctx);
  ctx.fillStyle=belly;rr(ctx,-5,0.5,10,4.5,3);ctx.fill();
  ctx.strokeStyle=coatD;ctx.lineWidth=1.3;
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*3.4,-4);ctx.lineTo(i*3.4,-1.4);ctx.stroke();}
  // head
  inked(ctx,coat,2.2);ctx.beginPath();ctx.arc(9,-6,6,0,7);fillStroke(ctx);
  // ears
  ctx.fillStyle=coat;ctx.strokeStyle=MIN.ink;ctx.lineWidth=1.8;ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(5,-10);ctx.lineTo(4,-15.5);ctx.lineTo(9.5,-11);ctx.closePath();fillStroke(ctx);
  ctx.beginPath();ctx.moveTo(10,-11);ctx.lineTo(14,-15.5);ctx.lineTo(13.5,-10);ctx.closePath();fillStroke(ctx);
  // face
  ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(7.3,-6.2,1.1,0,7);ctx.arc(11,-6.2,1.1,0,7);ctx.fill();
  ctx.fillStyle=MIN.verm;ctx.beginPath();ctx.arc(9.2,-4.2,0.9,0,7);ctx.fill();
  ctx.strokeStyle='rgba(74,58,44,.45)';ctx.lineWidth=0.8;
  ctx.beginPath();ctx.moveTo(11,-4.3);ctx.lineTo(16,-5);ctx.moveTo(11,-3.7);ctx.lineTo(16,-3);ctx.stroke();
  ctx.restore();
}
/* Jeju dog — tan native dog with erect ears + curled tail over the back */
function drawDog(x,y,opt){
  const face=opt.face||1, moving=opt.moving, phase=opt.phase||0, idle=opt.idle||0;
  const coat='#cf9b54', coatD='#a9792f', belly='#ecd6a8';
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(74,58,44,.18)';ctx.beginPath();ctx.ellipse(0,8,17,4,0,0,7);ctx.fill();
  const bob=moving?Math.abs(Math.sin(phase*2))*1.2:Math.sin(performance.now()*0.002+idle)*0.6;
  ctx.translate(0,-bob);ctx.scale(face,1);
  const step=moving?Math.sin(phase*2):0;
  // legs
  inked(ctx,coatD,2.2);
  rr(ctx,-9+step*2.2,3,4,8,2);fillStroke(ctx); rr(ctx,-4.5-step*2.2,3,4,8,2);fillStroke(ctx);
  rr(ctx,3.5+step*2.2,3,4,8,2);fillStroke(ctx); rr(ctx,8-step*2.2,3,4,8,2);fillStroke(ctx);
  // curled tail over the back (wagging tip)
  const dw=Math.sin(performance.now()*(moving?0.011:0.005)+idle)*3.2;
  ctx.strokeStyle=MIN.ink;ctx.lineWidth=5;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-11,-3);ctx.quadraticCurveTo(-19-dw*0.4,-9,-12-dw,-13+Math.abs(dw)*0.3);ctx.stroke();
  ctx.strokeStyle=coat;ctx.lineWidth=3.2;
  ctx.beginPath();ctx.moveTo(-11,-3);ctx.quadraticCurveTo(-19-dw*0.4,-9,-12-dw,-13+Math.abs(dw)*0.3);ctx.stroke();
  // body
  inked(ctx,coat,2.6);rr(ctx,-13,-6,23,13,7);fillStroke(ctx);
  ctx.fillStyle=belly;rr(ctx,-8,0,15,6,4);ctx.fill();
  // head
  inked(ctx,coat,2.4);ctx.beginPath();ctx.arc(12,-7,7.5,0,7);fillStroke(ctx);
  // erect ear
  ctx.fillStyle=coatD;ctx.strokeStyle=MIN.ink;ctx.lineWidth=2;ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(9,-13);ctx.lineTo(8,-20.5);ctx.lineTo(14.5,-14);ctx.closePath();fillStroke(ctx);
  // muzzle
  inked(ctx,belly,2);rr(ctx,15,-7,9,6,3);fillStroke(ctx);
  ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(23,-6,1.6,0,7);ctx.fill();   // nose
  ctx.beginPath();ctx.arc(12.5,-8.2,1.5,0,7);ctx.fill();                     // eye
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
  g.beginPath();g.rect(70,118,190,8);fillStroke(g);g.beginPath();g.rect(700,118,190,8);fillStroke(g);
  // counter — lacquered wood
  const c=counter;
  inked(g,'#5e3c22',2.6);rr(g,c.x,c.y,c.w,c.h,5);fillStroke(g);
  g.fillStyle='#7a5230';g.fillRect(c.x,c.y,c.w,7);
  g.strokeStyle='rgba(20,12,8,.3)';g.lineWidth=1;
  for(let x=c.x+18;x<c.x+c.w;x+=40){g.beginPath();g.moveTo(x,c.y+9);g.lineTo(x,c.y+c.h);g.stroke();}
  // exit mat
  inked(g,'#d8c089',2);g.setLineDash([4,3]);rr(g,exitZone.x,exitZone.y,exitZone.w,exitZone.h,5);fillStroke(g);g.setLineDash([]);
  // a paper lantern
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
let shopImg=null, shopImgTried=false;
function ensureShopImg(){ if(shopImgTried)return; shopImgTried=true;
  const im=new Image();
  im.onload=()=>{ if(im.decode){ im.decode().catch(()=>{}).then(()=>{shopImg=im;}); } else { shopImg=im; } };
  im.src='shop_bg.jpg'; }
function drawShop(){
  ensureShopImg();
  if(shopImg){ ctx.drawImage(shopImg,0,0,W,H); }
  else { ctx.fillStyle='#e9ddc4'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#caa066'; ctx.fillRect(0,124,W,H-124); }
  // shopkeeper, standing on the floor
  drawPerson(keeper.x,keeper.y,{skin:keeper.skin,scarf:keeper.scarf,look:keeper.look,idle:1.3});
  // player
  drawPerson(P.x,P.y,{skin:'#eccaa2',scarf:MIN.gold,face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  // interaction labels
  tag(keeper.roman, keeper.x, keeper.y-30, 11, MIN.gold);
  tag('← out', exitZone.x+exitZone.w/2, exitZone.y+exitZone.h/2, 11, MIN.gold);
}

/* ---------------- CO-OP MARKET (fish market) ---------------- */
function drawCrate(g,x,y,w,h,col,kind){
  g.save();g.lineJoin='round';g.lineCap='round';
  // contact shadow on the ground
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(x+w/2,y+h+2,w*0.5,4,0,0,7);g.fill();
  // ---- warm wooden crate body with slat seams ----
  inked(g,'#a9763e',2.2);rr(g,x,y,w,h,3);fillStroke(g);
  g.fillStyle='rgba(255,240,210,.12)';rr(g,x+2,y+2,w-4,4,2);g.fill();
  g.strokeStyle='rgba(80,50,22,.42)';g.lineWidth=1.2;
  for(let sx=x+w/5;sx<x+w-2;sx+=w/5){g.beginPath();g.moveTo(sx,y+2);g.lineTo(sx,y+h-2);g.stroke();}
  // back rim board (produce piles in front of it)
  inked(g,'#8a5f2a',1.8);rr(g,x-1,y-3,w+2,5,2);fillStroke(g);
  // ---- produce, piled in tidy rows so each piece reads clearly ----
  const tangerine=(cx,cy,r)=>{
    inked(g,'#ef9436',1.6);g.beginPath();g.arc(cx,cy,r,0,7);fillStroke(g);
    g.fillStyle='#f8ba60';g.beginPath();g.arc(cx-r*0.32,cy-r*0.34,r*0.44,0,7);g.fill();
    g.fillStyle=MIN.greenD;g.beginPath();g.ellipse(cx+r*0.15,cy-r*0.92,r*0.34,r*0.18,0.5,0,7);g.fill();
  };
  const greenBundle=(cx,cy,r)=>{
    inked(g,MIN.greenD,1.6);g.beginPath();g.arc(cx,cy,r,0,7);fillStroke(g);
    g.fillStyle=MIN.green;g.beginPath();g.arc(cx,cy+r*0.1,r*0.74,0,7);g.fill();
    g.fillStyle=MIN.greenL;g.beginPath();g.arc(cx-r*0.26,cy-r*0.28,r*0.42,0,7);g.fill();
    g.strokeStyle=MIN.greenD;g.lineWidth=1;
    g.beginPath();g.moveTo(cx,cy-r*0.55);g.lineTo(cx,cy+r*0.5);
    g.moveTo(cx,cy);g.lineTo(cx-r*0.4,cy+r*0.4);g.moveTo(cx,cy);g.lineTo(cx+r*0.4,cy+r*0.4);g.stroke();
  };
  if(kind==='fish'){
    for(let i=0;i<Math.max(3,(w*h)/120);i++){const fx=x+5+((i*13)%(w-10)),fy=y+4+((i*7)%(h-8));
      inked(g,i%2?'#cdd6dd':'#aeb8c2',1.2);g.beginPath();g.ellipse(fx,fy,5,2.4,(i%3)*0.5,0,7);fillStroke(g);
      g.fillStyle=MIN.ink;g.beginPath();g.arc(fx-3.6,fy-0.5,0.7,0,7);g.fill();}
  } else if(kind==='greens'){
    const r=h*0.30, n1=Math.max(3,Math.round(w/14));
    for(let i=0;i<n1;i++) greenBundle(x+w*0.16+i*(w*0.68/(n1-1)), y+h*0.40, r*0.92);   // back row
    for(let i=0;i<n1-1;i++) greenBundle(x+w*0.30+i*(w*0.68/(n1-1)), y+h*0.72, r);       // front row
  } else if(kind==='chili'){
    for(let i=0;i<Math.max(5,(w*h)/70);i++){const fx=x+3+((i*9)%(w-6)),fy=y+3+((i*13)%(h-6));
      inked(g,i%2?MIN.red:MIN.verm,1.1);g.beginPath();g.ellipse(fx,fy,2,4,(i%4)*0.5,0,7);fillStroke(g);}
  } else {   // tangerines (귤) — neat double row
    const r=h*0.26, n1=Math.max(4,Math.round(w/13));
    for(let i=0;i<n1;i++) tangerine(x+w*0.13+i*(w*0.74/(n1-1)), y+h*0.40, r*0.9);        // back row
    for(let i=0;i<n1-1;i++) tangerine(x+w*0.22+i*(w*0.74/(n1-1)), y+h*0.74, r);          // front row
  }
  g.restore();
}
function drawHangSign(g,x,y,w,col,txt){
  g.strokeStyle=MIN.ink;g.lineWidth=1.4;g.beginPath();g.moveTo(x+6,y-10);g.lineTo(x+6,y);g.moveTo(x+w-6,y-10);g.lineTo(x+w-6,y);g.stroke();
  inked(g,col,2);rr(g,x,y,w,16,2);fillStroke(g);
  g.fillStyle=MIN.gold;
  for(let i=0;i<Math.floor(w/9);i++){g.fillRect(x+6+i*9,y+5,5,6);}
}
function drawPennants(g,y0,sag){
  const cols=[MIN.verm,MIN.gold,MIN.teal,MIN.plum,MIN.blue,MIN.greenD];
  const n=14, step=W/n;
  g.strokeStyle='rgba(60,50,30,.5)';g.lineWidth=1.2;g.beginPath();
  for(let x=0;x<=W;x+=6){g.lineTo(x,y0+Math.sin(x/W*Math.PI)*sag);}g.stroke();
  for(let i=0;i<n;i++){
    const x=i*step+step/2, sy=y0+Math.sin(x/W*Math.PI)*sag;
    g.fillStyle=cols[i%cols.length];g.strokeStyle=MIN.ink;g.lineWidth=1.3;g.lineJoin='round';
    g.beginPath();g.moveTo(x-step*0.42,sy);g.lineTo(x+step*0.42,sy);g.lineTo(x,sy+12);g.closePath();fillStroke(g);
  }
}
function drawCitrusBasket(g,x,y,s){
  s=s||1;g.save();g.translate(x,y);g.scale(s,s);
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(0,15,22,5,0,0,7);g.fill();
  for(const[ox,oy] of [[-9,-2],[0,-4],[9,-2],[-4,-9],[5,-9],[0,-14]]){
    inked(g,'#f0992f',1.8);g.beginPath();g.arc(ox,oy,6,0,7);fillStroke(g);
    g.fillStyle=MIN.greenD;g.beginPath();g.arc(ox,oy-5,1.3,0,7);g.fill();
  }
  inked(g,'#b0843e',2.2);g.beginPath();g.moveTo(-20,0);g.lineTo(20,0);g.lineTo(15,15);g.lineTo(-15,15);g.closePath();fillStroke(g);
  g.strokeStyle='rgba(80,54,20,.5)';g.lineWidth=1;
  for(let i=-14;i<16;i+=5){g.beginPath();g.moveTo(i,2);g.lineTo(i*0.75,14);g.stroke();}
  g.beginPath();g.moveTo(-18,5);g.lineTo(18,5);g.moveTo(-16,10);g.lineTo(16,10);g.stroke();
  g.restore();
}
/* ---- Jeju market dressing ---- */
function drawAwning(g,x,y,w,h,col,col2){
  col2=col2||'#f7efdc';
  const n=Math.max(4,Math.round(w/24)), sw=w/n;
  function edge(){ g.beginPath(); g.moveTo(x,y); g.lineTo(x+w,y); g.lineTo(x+w,y+h);
    for(let i=n;i>0;i--){ g.arc(x+(i-0.5)*sw, y+h, sw/2, 0, Math.PI, false); }
    g.lineTo(x,y+h); g.closePath(); }
  g.save(); edge(); g.save(); g.clip();
  for(let i=0;i<n;i++){ g.fillStyle=i%2?col:col2; g.fillRect(x+i*sw, y-1, sw+1.2, h+sw); }
  g.restore();
  g.lineJoin='round'; g.lineCap='round'; g.strokeStyle=MIN.ink; g.lineWidth=2.4; edge(); g.stroke();
  g.fillStyle='rgba(255,255,255,.16)'; g.fillRect(x+1,y,w-2,2.6);
  g.restore();
}
function drawStringLightsWire(g,y,sag){
  g.strokeStyle='rgba(54,42,26,.55)'; g.lineWidth=1.3; g.beginPath();
  for(let x=0;x<=W;x+=8){ g.lineTo(x, y+Math.sin(x*0.05)*sag); } g.stroke();
}
function drawHangingDried(g,x,y,w,kind){
  g.strokeStyle='rgba(54,42,26,.7)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(x,y); g.lineTo(x+w,y); g.stroke();
  const n=Math.max(3,Math.round(w/22));
  for(let i=0;i<n;i++){ const hx=x+(i+0.5)*(w/n);
    g.strokeStyle='rgba(54,42,26,.55)'; g.lineWidth=1; g.beginPath(); g.moveTo(hx,y); g.lineTo(hx,y+4); g.stroke();
    if(kind==='squid'){
      inked(g,'#e7c89a',1.7); g.beginPath(); g.moveTo(hx-5,y+5); g.quadraticCurveTo(hx,y+2,hx+5,y+5); g.lineTo(hx+3,y+20); g.lineTo(hx,y+16); g.lineTo(hx-3,y+20); g.closePath(); fillStroke(g);
      g.strokeStyle='rgba(60,44,28,.8)'; g.lineWidth=1; g.beginPath(); for(let k=-2;k<=2;k++){ g.moveTo(hx+k*1.4,y+18); g.lineTo(hx+k*2.6,y+27); } g.stroke();
    } else if(kind==='fish'){
      inked(g,'#c3ccd4',1.6);                            // silvery fish, hung head-up
      g.beginPath(); g.moveTo(hx,y+4); g.quadraticCurveTo(hx+5,y+9,hx+3.6,y+19); g.lineTo(hx,y+23); g.lineTo(hx-3.6,y+19); g.quadraticCurveTo(hx-5,y+9,hx,y+4); g.closePath(); fillStroke(g);
      g.fillStyle='rgba(96,126,148,.55)'; g.beginPath(); g.ellipse(hx,y+11,2,6,0,0,7); g.fill();        // darker back
      g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(hx-1.4,y+12,1,4,0,0,7); g.fill();
      g.strokeStyle=MIN.ink; g.lineWidth=1; g.beginPath(); g.moveTo(hx-3,y+25); g.lineTo(hx,y+21); g.lineTo(hx+3,y+25); g.stroke();  // tail fin
      g.fillStyle=MIN.ink; g.beginPath(); g.arc(hx,y+7,0.8,0,7); g.fill();
    } else {                                             // croaker — brown dried fish
      inked(g,'#c79c61',1.7);
      g.beginPath(); g.moveTo(hx,y+4); g.quadraticCurveTo(hx+5.5,y+9,hx+4,y+18); g.lineTo(hx,y+22); g.lineTo(hx-4,y+18); g.quadraticCurveTo(hx-5.5,y+9,hx,y+4); g.closePath(); fillStroke(g);
      g.fillStyle='rgba(150,110,58,.5)'; g.beginPath(); g.ellipse(hx,y+12,2.4,6,0,0,7); g.fill();
      g.strokeStyle='rgba(108,74,38,.6)'; g.lineWidth=0.7; for(let k=-1;k<=1;k++){ g.beginPath(); g.moveTo(hx+k*2,y+8); g.lineTo(hx+k*2.4,y+18); g.stroke(); }
      g.strokeStyle=MIN.ink; g.lineWidth=1; g.beginPath(); g.moveTo(hx-3,y+24); g.lineTo(hx,y+20); g.lineTo(hx+3,y+24); g.stroke();
      g.fillStyle=MIN.ink; g.beginPath(); g.arc(hx,y+7,0.8,0,7); g.fill();
    }
  }
}
function drawSack(g,x,y,r,col,kind){
  g.save(); g.lineJoin='round';
  inked(g,'#c9a96a',2.2); g.beginPath();
  g.moveTo(x-r,y); g.quadraticCurveTo(x-r*1.12,y+r*1.4, x-r*0.55,y+r*1.6); g.lineTo(x+r*0.55,y+r*1.6);
  g.quadraticCurveTo(x+r*1.12,y+r*1.4,x+r,y); g.closePath(); fillStroke(g);
  g.strokeStyle='rgba(120,92,46,.35)'; g.lineWidth=1; for(let k=0;k<2;k++){ g.beginPath(); g.moveTo(x-r*0.7,y+r*0.6+k*6); g.lineTo(x+r*0.7,y+r*0.6+k*6); g.stroke(); }
  inked(g,'#bb9a59',2); g.beginPath(); g.ellipse(x,y,r,r*0.4,0,0,7); fillStroke(g);
  g.fillStyle=col; g.beginPath(); g.ellipse(x,y-1,r-2.5,r*0.34,0,0,7); g.fill();
  g.beginPath(); g.ellipse(x,y-3,r-3,r*0.5,0,Math.PI,0); g.fill();
  const rng=mulberry32((x*7+y*13)|0);
  for(let i=0;i<16;i++){ const a=rng()*6.28,d=rng()*(r-4);
    const px=x+Math.cos(a)*d, py=y-3-Math.abs(Math.sin(a))*rng()*4;
    if(kind==='anchovy'){ g.fillStyle='rgba(222,226,230,.95)'; g.beginPath(); g.ellipse(px,py,2.2,1,a,0,7); g.fill(); g.fillStyle=MIN.ink; g.beginPath(); g.arc(px-1.5,py,0.5,0,7); g.fill(); }
    else if(kind==='seaweed'){ g.strokeStyle='#2f5a3a'; g.lineWidth=1.4; g.lineCap='round'; g.beginPath(); g.moveTo(px,py); g.quadraticCurveTo(px+2,py-3,px,py-6); g.stroke(); }
    else if(kind==='peanut'){ g.fillStyle='#cda069'; g.beginPath(); g.ellipse(px,py,2.4,1.5,a,0,7); g.fill(); g.strokeStyle='rgba(120,90,50,.4)'; g.lineWidth=0.6; g.beginPath(); g.moveTo(px-1,py); g.lineTo(px+1,py); g.stroke(); }
    else { g.fillStyle=col; g.beginPath(); g.arc(px,py,2,0,7); g.fill(); }
  }
  g.restore();
}
function drawPriceSign(g,x,y,accent){
  g.strokeStyle=MIN.ink; g.lineWidth=1.4; g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+13); g.stroke();
  inked(g,'#f4e7c6',1.8); rr(g,x-14,y-15,28,17,2.5); fillStroke(g);
  g.strokeStyle='rgba(70,46,24,.7)'; g.lineWidth=1.5; g.lineCap='round';
  g.beginPath(); g.moveTo(x-10,y-9); g.lineTo(x+9,y-9); g.moveTo(x-10,y-5); g.lineTo(x+2,y-5); g.stroke();
  g.fillStyle=accent||MIN.verm; g.beginPath(); g.arc(x+7,y-5,2,0,7); g.fill();
}
function drawIceTray(g,x,y,w,h){
  inked(g,'#6e4a2a',2.2); rr(g,x,y,w,h,4); fillStroke(g);
  g.fillStyle='#e2edf2'; rr(g,x+3,y+3,w-6,h-6,3); g.fill();
  g.fillStyle='#cad9e1'; const rng=mulberry32((x*5+y)|0);
  for(let i=0;i<w*h/26;i++){ g.beginPath(); g.arc(x+4+rng()*(w-8),y+4+rng()*(h-8),1+rng()*1.4,0,7); g.fill(); }
  inked(g,'#5f4631',1.6); g.beginPath(); g.ellipse(x+w*0.20,y+h*0.5,6,4.4,0,0,7); fillStroke(g);
  g.fillStyle='rgba(255,255,255,.18)';g.beginPath();g.ellipse(x+w*0.20-1.5,y+h*0.5-1.2,2,1.6,0,0,7);g.fill();
  g.save(); g.translate(x+w*0.5,y+h*0.5); inked(g,'#3a2c33',1.4);
  for(let a=0;a<6.28;a+=0.5){ g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*7,Math.sin(a)*5); g.stroke(); }
  g.fillStyle='#4a3640'; g.beginPath(); g.ellipse(0,0,4,3,0,0,7); g.fill(); g.restore();
  inked(g,MIN.verm,1.6); g.beginPath(); g.arc(x+w*0.8,y+h*0.42,5,Math.PI,0); g.lineTo(x+w*0.8+5,y+h*0.55);
  g.quadraticCurveTo(x+w*0.8,y+h*0.62,x+w*0.8-5,y+h*0.55); g.closePath(); fillStroke(g);
  g.strokeStyle=MIN.verm; g.lineWidth=1.4; g.lineCap='round'; for(let k=-2;k<=2;k++){ g.beginPath(); g.moveTo(x+w*0.8+k*2,y+h*0.58); g.lineTo(x+w*0.8+k*2.6,y+h*0.72); g.stroke(); }
}
function drawCitrus(g,x,y,halla){
  inked(g,'#f0992f',1.8); g.beginPath(); g.arc(x,y,6.2,0,7); fillStroke(g);
  g.fillStyle='rgba(255,232,180,.55)'; g.beginPath(); g.arc(x-1.8,y-1.8,2,0,7); g.fill();
  if(halla){ inked(g,'#ef8f24',1.4); g.beginPath(); g.arc(x,y-5.4,2.4,0,7); fillStroke(g); }
  g.fillStyle=MIN.greenD; g.beginPath(); g.arc(x+(halla?0:1.6), y-6, 1, 0,7); g.fill();
}
function drawHallabongCrate(g,x,y,w){
  inked(g,'#a9763e',2.2); rr(g,x,y,w,18,3); fillStroke(g);
  g.strokeStyle='rgba(80,50,22,.5)';g.lineWidth=1;
  for(let gx=x+5;gx<x+w;gx+=8){g.beginPath();g.moveTo(gx,y+2);g.lineTo(gx,y+16);g.stroke();}
  const per=Math.max(3,Math.floor(w/15));
  for(let row=0; row<3; row++){
    const count=per-row; if(count<=0) break;
    const span=(count-1)*13;
    for(let i=0;i<count;i++){ const ox=x+w/2 - span/2 + i*13, oy=y-3-row*11;
      drawCitrus(g,ox,oy,(row+i)%3===0); }
  }
}
function drawPorkSlab(g,x,y){
  inked(g,'#e7a39a',1.8); rr(g,x,y,20,13,3); fillStroke(g);
  g.fillStyle='#f3cfc6'; for(let i=0;i<3;i++){ g.beginPath(); g.ellipse(x+5+i*5,y+5,2,4,0.4,0,7); g.fill(); }
  g.fillStyle='#d46b6b'; rr(g,x+2,y+8,16,4,2); g.fill();
}
/* ---- varied Jeju specialty displays ---- */
function iceBase(g,x,y,w,h){
  inked(g,'#6e4a2a',2.2); rr(g,x,y,w,h,4); fillStroke(g);
  g.fillStyle='#e2edf2'; rr(g,x+3,y+3,w-6,h-6,3); g.fill();
  g.fillStyle='#cad9e1'; const rng=mulberry32((x*5+y)|0);
  for(let i=0;i<w*h/30;i++){ g.beginPath(); g.arc(x+4+rng()*(w-8),y+4+rng()*(h-8),1+rng()*1.3,0,7); g.fill(); }
}
function drawAbaloneTray(g,x,y,w,h){            // 전복 abalone on ice — ridged golden shells
  iceBase(g,x,y,w,h);
  const shell=(cx,cy,s,rot)=>{
    g.save(); g.translate(cx,cy); g.rotate(rot); g.scale(s,s); g.lineJoin='round';
    inked(g,'#a9772f',1.6); g.beginPath(); g.ellipse(0,0,9,6.2,0,0,7); fillStroke(g);   // shell body
    g.fillStyle='#cfa052'; g.beginPath(); g.ellipse(0.6,0.6,6.8,4.4,0,0,7); g.fill();    // inner sheen
    g.fillStyle='rgba(255,242,205,.45)'; g.beginPath(); g.ellipse(-2.2,-1.8,3,1.9,0,0,7); g.fill();
    g.strokeStyle='rgba(86,54,20,.42)'; g.lineWidth=0.7;                                 // radial ridges
    for(let a=-1.0;a<=1.0;a+=0.4){ g.beginPath(); g.moveTo(Math.cos(a)*2.6,Math.sin(a)*1.8); g.lineTo(Math.cos(a)*8.4,Math.sin(a)*5.6); g.stroke(); }
    g.fillStyle='#3a2a16';                                                               // respiratory pores
    for(let k=0;k<4;k++){ g.beginPath(); g.arc(-5.2+k*3.3,-3.8-Math.sin(k*0.9)*0.6,0.85,0,7); g.fill(); }
    g.restore();
  };
  const cy=y+h*0.5;
  shell(x+18,cy-3,1.0,-0.16); shell(x+38,cy-4,1.06,0.10); shell(x+58,cy-3,1.0,-0.10); shell(x+76,cy-2,0.94,0.22);
  shell(x+28,cy+5,1.05,0.14); shell(x+50,cy+5,1.0,-0.18); shell(x+70,cy+5,0.98,0.16);
}
function drawUrchinTray(g,x,y,w,h){             // 성게 sea urchin
  iceBase(g,x,y,w,h); const n=Math.max(3,Math.floor(w/26));
  for(let i=0;i<n;i++){ const ux=x+14+i*((w-22)/n), uy=y+h*0.5;
    g.strokeStyle='#2c2230'; g.lineWidth=1.3; g.lineCap='round';
    for(let a=0;a<6.28;a+=0.45){ g.beginPath(); g.moveTo(ux,uy); g.lineTo(ux+Math.cos(a)*8,uy+Math.sin(a)*6); g.stroke(); }
    inked(g,'#3a2c38',1.4); g.beginPath(); g.ellipse(ux,uy,5,4,0,0,7); fillStroke(g);
    g.fillStyle='#e8924a'; g.beginPath(); g.arc(ux,uy,2,0,7); g.fill(); }
}
function drawOctopusTray(g,x,y,w,h){            // 문어 coiled red octopus with suckered arms
  iceBase(g,x,y,w,h);
  const octo=(cx,cy,s,col)=>{
    g.save(); g.translate(cx,cy); g.scale(s,s); g.lineJoin='round'; g.lineCap='round';
    for(let k=0;k<5;k++){                                   // curling arms
      const dir=k-2;
      const ex=dir*10+(dir>=0?4:-4), ey=12;
      g.strokeStyle=col; g.lineWidth=3.6;
      g.beginPath(); g.moveTo(dir*2,3); g.quadraticCurveTo(dir*8,10,ex,ey); g.stroke();
      g.fillStyle='rgba(255,238,232,.85)';                  // white suckers
      for(let t=0.45;t<1;t+=0.27){ const px=dir*2+(ex-dir*2)*t, py=3+(ey-3)*t; g.beginPath(); g.arc(px,py,0.95,0,7); g.fill(); }
    }
    inked(g,col,1.8);                                       // bulbous mantle/head
    g.beginPath(); g.arc(0,-4,8,Math.PI,0); g.quadraticCurveTo(8,4,0,6); g.quadraticCurveTo(-8,4,-8,-4); g.closePath(); fillStroke(g);
    g.fillStyle='rgba(255,216,192,.4)'; g.beginPath(); g.ellipse(-2.6,-6,3.1,2.1,0,0,7); g.fill();
    g.fillStyle='#4a1c12'; g.beginPath(); g.arc(-3.2,-3,1.3,0,7); g.arc(3.2,-3,1.3,0,7); g.fill();   // eyes
    g.fillStyle='rgba(255,255,255,.6)'; g.beginPath(); g.arc(-2.8,-3.4,0.45,0,7); g.arc(3.6,-3.4,0.45,0,7); g.fill();
    g.restore();
  };
  octo(x+w*0.33, y+h*0.46, 1.16, '#d9583a');
  octo(x+w*0.67, y+h*0.46, 1.0, '#e26a4d');
}
function drawHairtailTray(g,x,y,w,h){           // 갈치 long slender silver hairtail
  iceBase(g,x,y,w,h);
  const fish=(fy,len,curve)=>{
    const x0=x+6, x1=x+6+len, mx=(x0+x1)/2;
    inked(g,'#c7d2da',1.5);
    g.beginPath();
    g.moveTo(x0,fy);                                    // blunt head
    g.quadraticCurveTo(mx, fy-3.4-curve, x1-9, fy-1.4);
    g.lineTo(x1, fy);                                   // tapered tail tip
    g.lineTo(x1-9, fy+1.6);
    g.quadraticCurveTo(mx, fy+3.8-curve, x0, fy);
    g.closePath(); fillStroke(g);
    g.strokeStyle='rgba(255,255,255,.65)'; g.lineWidth=1.4;   // silver sheen
    g.beginPath(); g.moveTo(x0+7,fy-0.6); g.quadraticCurveTo(mx,fy-2.2-curve,x1-12,fy-0.7); g.stroke();
    g.strokeStyle='rgba(118,150,172,.6)'; g.lineWidth=0.8;    // blue-grey dorsal line
    g.beginPath(); g.moveTo(x0+5,fy+1.3); g.quadraticCurveTo(mx,fy+2.4,x1-12,fy+1); g.stroke();
    g.fillStyle=MIN.ink; g.beginPath(); g.arc(x0+5,fy-0.4,0.9,0,7); g.fill();   // eye
  };
  fish(y+h*0.32, w-14, 0);
  fish(y+h*0.55, w-12, 0.7);
  fish(y+h*0.78, w-16, -0.4);
}
function drawMushroomBasket(g,x,y,w){           // 표고버섯 pyogo shiitake
  inked(g,'#b0843e',2.2); g.beginPath(); g.moveTo(x,y); g.lineTo(x+w,y); g.lineTo(x+w-5,y+16); g.lineTo(x+5,y+16); g.closePath(); fillStroke(g);
  g.strokeStyle='rgba(80,54,20,.5)'; g.lineWidth=1; for(let i=x+5;i<x+w;i+=6){ g.beginPath(); g.moveTo(i,y+2); g.lineTo(i-2,y+14); g.stroke(); }
  for(const[fx,dy] of [[0.24,-2],[0.5,-3],[0.76,-2],[0.37,-10],[0.63,-11]]){ const mx=x+w*fx, my=y+dy;
    inked(g,'#7a4f33',1.8); g.beginPath(); g.ellipse(mx,my,7,5,0,0,7); fillStroke(g);
    g.fillStyle='rgba(255,240,210,.22)'; g.beginPath(); g.ellipse(mx-1.5,my-1.5,2.6,1.8,0,0,7); g.fill();
    g.strokeStyle='#e9d8b5'; g.lineWidth=0.7; for(let k=-2;k<=2;k++){ g.beginPath(); g.moveTo(mx,my); g.lineTo(mx+k*2.2,my+3.4); g.stroke(); } }
}
function drawTeaDisplay(g,x,y){                 // 녹차 green tea
  inked(g,'#7a5230',2); rr(g,x-4,y+4,56,9,2); fillStroke(g);
  inked(g,'#6aa647',1.6); g.beginPath(); g.ellipse(x+12,y+4,13,8,0,Math.PI,0); fillStroke(g);
  g.fillStyle='#8cc163'; g.beginPath(); g.ellipse(x+12,y+3,9,5,0,Math.PI,0); g.fill();
  g.fillStyle=MIN.greenD; for(let i=0;i<4;i++){ g.beginPath(); g.ellipse(x+4+i*5,y-1,2,1,i*0.6,0,7); g.fill(); }
  for(let i=0;i<2;i++){ const tx=x+30+i*15; inked(g,i?'#3a6e5a':'#2f6f80',1.8); rr(g,tx,y-12,13,18,2); fillStroke(g);
    g.fillStyle='rgba(255,255,255,.18)'; g.fillRect(tx+2,y-9,9,3);
    g.fillStyle='#cfe8c4'; g.beginPath(); g.arc(tx+6.5,y-2,3,0,7); g.fill();
    g.fillStyle=MIN.greenD; g.beginPath(); g.arc(tx+6.5,y-2,1.3,0,7); g.fill(); }
}
function drawTteokTray(g,x,y,w){                // 오메기떡 rice cakes
  inked(g,'#9c6b3a',2); rr(g,x,y,w,8,2); fillStroke(g);
  const n=Math.max(3,Math.floor(w/14));
  for(let i=0;i<n;i++){ const cx=x+8+i*((w-12)/n);
    inked(g,i%2?'#6fae4f':'#8a5a36',1.6); g.beginPath(); g.arc(cx,y-2,6,0,7); fillStroke(g);
    g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.arc(cx-1.5,y-4,2,0,7); g.fill(); }
  for(let i=0;i<n-1;i++){ const cx=x+15+i*((w-12)/n);
    inked(g,i%2?'#8a5a36':'#6fae4f',1.6); g.beginPath(); g.arc(cx,y-11,6,0,7); fillStroke(g); }
}
function drawSnackBoxes(g,x,y){                 // souvenir tangerine-choc / jelly boxes
  for(const[col,dx,dy] of [['#e8943a',0,0],['#e0573a',26,0],['#f2c75a',13,-15]]){
    inked(g,col,1.8); rr(g,x+dx,y+dy,24,15,2); fillStroke(g);
    g.fillStyle='rgba(255,255,255,.9)'; rr(g,x+dx+4,y+dy+4,16,7,1.5); g.fill();
    g.fillStyle=col; g.beginPath(); g.arc(x+dx+8,y+dy+7.5,2,0,7); g.fill();
    g.fillStyle=MIN.greenD; g.fillRect(x+dx+11,y+dy+5,5,1.4); }
}
function drawJars(g,x,y){                        // honey / citrus marmalade jars
  const cols=['#e9a52c','#e87a2a','#f2c14e'];
  for(let i=0;i<3;i++){ const jx=x+i*16;
    inked(g,'#f2e3c0',1.8); rr(g,jx,y-2,12,16,3); fillStroke(g);
    g.fillStyle=cols[i]; rr(g,jx+1.5,y+2,9,11,2); g.fill();
    g.fillStyle='rgba(255,255,255,.4)'; g.fillRect(jx+2.5,y+3,2,8);
    inked(g,'#b85a48',1.6); rr(g,jx-1,y-5,14,4,1.5); fillStroke(g); }
}
function drawGimStack(g,x,y){                    // 김 / 미역 dried seaweed
  for(let i=0;i<4;i++){ inked(g,i%2?'#2a3a30':'#1f3328',1.6); rr(g,x-i*1.2,y-i*4,30,5,1.5); fillStroke(g);
    g.fillStyle='rgba(120,160,140,.18)'; g.fillRect(x-i*1.2+3,y-i*4+1,24,1.4); }
  g.strokeStyle='#2f5a3a'; g.lineWidth=3; g.lineCap='round';
  g.beginPath(); g.moveTo(x+34,y-4); g.quadraticCurveTo(x+44,y-12,x+40,y+2); g.quadraticCurveTo(x+50,y-6,x+44,y+4); g.stroke();
}
function drawPeanutSacks(g,x,y){                 // 우도 땅콩 Udo peanuts
  drawSack(g,x,y,12,'#d9b483','peanut');
  drawSack(g,x+26,y+3,10,'#cfa874','peanut');
  for(let i=0;i<5;i++){ const px=x+6+i*5, py=y+20;
    inked(g,'#cda069',1); g.save(); g.translate(px,py); g.rotate(i*0.7);
    g.beginPath(); g.ellipse(0,0,3,1.6,0,0,7); fillStroke(g); g.restore(); }
}
function drawSyrupJars(g,x,y){                   // 청 citrus-syrup jars (green/orange)
  const cols=['#e6892a','#d8a72a','#7fae3a'];
  for(let i=0;i<3;i++){ const jx=x+i*15;
    inked(g,'#f2e3c0',1.8); rr(g,jx,y-4,12,20,3); fillStroke(g);
    g.fillStyle=cols[i]; rr(g,jx+1.5,y+1,9,14,2); g.fill();
    g.fillStyle='rgba(255,255,255,.35)'; g.fillRect(jx+2.5,y+2,2,11);
    g.fillStyle='rgba(255,240,200,.85)'; g.beginPath(); g.arc(jx+6,y+8,2.2,0,7); g.fill();
    g.fillStyle=cols[i]; g.beginPath(); g.arc(jx+6,y+8,0.9,0,7); g.fill();
    inked(g,'#b85a48',1.6); rr(g,jx-1,y-7,14,4,1.5); fillStroke(g); }
}
// small hanging Korean signboard above/below a stall
function drawStallSign(g,cx,y,text,accent){
  g.save();
  g.font='700 12px "Gowun Batang",serif';
  const w=Math.max(30, g.measureText(text).width+16);
  g.strokeStyle='rgba(40,30,18,.6)';g.lineWidth=1.3;
  g.beginPath();g.moveTo(cx-w/2+7,y-7);g.lineTo(cx-w/2+7,y+1);g.moveTo(cx+w/2-7,y-7);g.lineTo(cx+w/2-7,y+1);g.stroke();
  inked(g,accent||'#7a5230',2); rr(g,cx-w/2,y,w,19,4); fillStroke(g);
  g.fillStyle='rgba(255,255,255,.16)';rr(g,cx-w/2+3,y+3,w-6,4,2);g.fill();
  g.fillStyle='#fff3df';g.textAlign='center';g.textBaseline='middle';
  g.fillText(text,cx,y+10.5);
  g.restore();
}
function buildMarketBG(){
  const {el,g}=makeCanvas(W,H);
  // ===== warm worn-concrete market floor =====
  paperFill(g,0,150,W,H-150,'#c2b194');
  g.fillStyle='rgba(120,92,54,.10)';g.fillRect(0,150,W,H-150);
  const wk=g.createLinearGradient(W/2-130,0,W/2+130,0);
  wk.addColorStop(0,'rgba(255,250,235,0)');wk.addColorStop(.5,'rgba(255,250,235,.16)');wk.addColorStop(1,'rgba(255,250,235,0)');
  g.fillStyle=wk;g.fillRect(W/2-130,150,260,H-150);
  g.strokeStyle='rgba(90,68,40,.16)';g.lineWidth=1.4;
  for(let y=214;y<H;y+=72){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  for(let x=120;x<W;x+=120){g.beginPath();g.moveTo(x,212);g.lineTo(x,H);g.stroke();}
  const rngF=mulberry32(917);
  for(let i=0;i<70;i++){const x=rngF()*W,y=300+rngF()*(H-312);const k=rngF();
    if(k<0.4){g.fillStyle='#e8943a';g.beginPath();g.arc(x,y,1.6,0,7);g.fill();}
    else if(k<0.7){g.fillStyle='#6aa647';g.beginPath();g.ellipse(x,y,3,1.4,rngF()*3,0,7);g.fill();}
    else{g.fillStyle='rgba(90,68,40,.3)';g.beginPath();g.arc(x,y,1,0,7);g.fill();}}
  // ===== back facade + glass arcade ceiling =====
  g.fillStyle=MIN.paper;g.fillRect(0,86,W,64);
  g.fillStyle='#b7a98e';g.fillRect(0,140,W,12);
  g.strokeStyle='rgba(120,142,154,.4)';g.lineWidth=1.1;
  for(let x=18;x<W;x+=28){g.beginPath();g.moveTo(x,88);g.lineTo(x,138);g.stroke();}
  g.beginPath();g.moveTo(0,110);g.lineTo(W,110);g.stroke();
  // ===== TOP ROW of stalls under striped awnings =====
  (function(){
    const bx=MARKET.x0+112, bw=(MARKET.x1-112)-bx, by=198;   // 148 .. 812
    inked(g,'#7a5230',2.4);rr(g,bx,by,bw,54,4);fillStroke(g);
    g.fillStyle='#8a5f38';g.fillRect(bx,by,bw,7);
    // warm striped awnings: orange/cream over the left, yellow/cream over the right
    drawAwning(g,bx-6,158,366,22,MIN.verm,'#f7efdc');
    drawAwning(g,bx+356,158,bw-350,22,MIN.gold,'#f7efdc');
    // 1) 해조류 seaweed / gim stacks
    drawGimStack(g,bx+12,by+16);
    drawStallSign(g,bx+34,by+44,'해조류',MIN.greenD);
    // 2) SEAFOOD on ice — 전복 abalone + 문어 octopus
    drawAbaloneTray(g,bx+84,by+8,90,28);
    drawOctopusTray(g,bx+182,by+8,90,30);
    drawStallSign(g,bx+178,182,'SEAFOOD',MIN.blue);
    drawStallSign(g,bx+128,by+44,'전복',MIN.blue);
    drawStallSign(g,bx+226,by+44,'문어',MIN.blue);
    // 3) 건어물 dried fish hanging on a line — silvery fish + brown croaker
    drawHangingDried(g,bx+288,178,46,'fish');
    drawHangingDried(g,bx+340,178,44,'croaker');
    // a small green garnish pile on the counter beneath the dried fish
    g.fillStyle=MIN.greenD; for(let i=0;i<8;i++){ const gx=bx+312+((i*7)%30), gy=by+10+((i*5)%6); g.beginPath(); g.ellipse(gx,gy,3,1.6,(i%3)*0.7,0,7); g.fill(); }
    g.fillStyle=MIN.green; for(let i=0;i<5;i++){ const gx=bx+318+((i*8)%22); g.beginPath(); g.ellipse(gx,by+9,2.4,1.3,(i%2)*0.8,0,7); g.fill(); }
    drawStallSign(g,bx+334,by+44,'건어물',MIN.gold);
    // 4) 갈치 hairtail on ice
    drawHairtailTray(g,bx+396,by+8,104,30);
    drawStallSign(g,bx+448,by+44,'갈치',MIN.teal);
    // 5) 녹차 green tea
    drawTeaDisplay(g,bx+516,by+18);
    drawStallSign(g,bx+532,by+44,'녹차',MIN.greenD);
    // 6) 청 citrus-syrup jars
    drawSyrupJars(g,bx+588,by+12);
    drawStallSign(g,bx+602,by+44,'청',MIN.verm);
  })();
  // ===== LEFT COLUMN — 성게 urchin / 우도 땅콩 peanuts / 표고버섯 mushroom =====
  (function(){
    const x0=MARKET.x0;
    inked(g,'#7a5230',2.4);g.beginPath();g.rect(x0,150,112,H-150);fillStroke(g);
    g.fillStyle='rgba(0,0,0,.10)';g.fillRect(x0+104,150,8,H-150);
    drawAwning(g,x0-4,168,124,24,MIN.blue,'#f7efdc');
    drawUrchinTray(g,x0+10,224,94,28);         // 성게 sea urchin on ice
    drawStallSign(g,x0+56,266,'성게',MIN.blue);
    drawPeanutSacks(g,x0+24,338);              // 우도 땅콩 peanuts
    drawStallSign(g,x0+56,388,'우도 땅콩',MIN.gold);
    drawMushroomBasket(g,x0+22,456,68);        // 표고버섯 shiitake mushrooms
    drawStallSign(g,x0+56,486,'표고버섯',MIN.greenD);
  })();
  // ===== RIGHT COLUMN — 흑돼지 pork / 감귤 초콜릿 / 꿀·잼 / 오메기떡 =====
  (function(){
    const x1=MARKET.x1-112;
    inked(g,'#7a5230',2.4);g.beginPath();g.rect(x1,150,112,H-150);fillStroke(g);
    g.fillStyle='rgba(0,0,0,.10)';g.fillRect(x1,150,8,H-150);
    drawAwning(g,x1-8,168,124,24,MIN.teal,'#f7efdc');
    inked(g,'#5e3c22',2.2);rr(g,x1+8,228,96,30,3);fillStroke(g);   // 흑돼지 black pork
    drawPorkSlab(g,x1+14,232);drawPorkSlab(g,x1+40,234);drawPorkSlab(g,x1+66,232);
    drawStallSign(g,x1+56,210,'흑돼지',MIN.red);
    drawSnackBoxes(g,x1+18,312);               // 감귤 초콜릿 tangerine chocolate
    drawStallSign(g,x1+56,360,'감귤 초콜릿',MIN.verm);
    drawJars(g,x1+26,398);                     // 꿀 honey + 잼/청 jam
    drawStallSign(g,x1+56,432,'꿀 · 잼',MIN.gold);
    drawTteokTray(g,x1+22,488,64);             // 오메기떡 rice cakes
    drawStallSign(g,x1+56,500,'오메기떡',MIN.plum);
  })();
  // ===== CENTER — Migyeong's pink-awning stall: 한라봉 hallabong (also the sell counter) =====
  const c=sellCounter;
  drawAwning(g,c.x-12,c.y-42,c.w+24,24,MIN.plum,'#f7efdc');   // pink/cream awning
  g.strokeStyle=MIN.ink;g.lineWidth=2;g.beginPath();g.moveTo(c.x+6,c.y-20);g.lineTo(c.x+6,c.y);g.moveTo(c.x+c.w-6,c.y-20);g.lineTo(c.x+c.w-6,c.y);g.stroke();
  inked(g,'#5e3c22',2.6);rr(g,c.x,c.y,c.w,c.h,5);fillStroke(g);
  g.fillStyle='#7a5230';g.fillRect(c.x,c.y,c.w,7);
  // slim ice strip at the back of the counter (Migyeong still weighs your catch here)
  g.fillStyle='#dfeaf0';rr(g,c.x+12,c.y+27,c.w-24,13,4);g.fill();
  g.fillStyle='#c7d6df';for(let i=0;i<34;i++){g.beginPath();g.arc(c.x+18+i*((c.w-34)/34),c.y+33+((i%3)-1)*2.2,1.3,0,7);g.fill();}
  // 한라봉 piled along the front — bumpy-topped premium tangerines
  for(let i=0;i<6;i++){ const hx=c.x+36+i*((c.w-66)/5), hy=c.y+8;
    g.fillStyle='rgba(20,12,8,.14)';g.beginPath();g.ellipse(hx,hy+11,12,4,0,0,7);g.fill();
    inked(g,'#ef9f33',2.2);g.beginPath();g.arc(hx,hy,11,0,7);fillStroke(g);
    g.fillStyle='#f6b657';g.beginPath();g.arc(hx-3,hy-3,4.4,0,7);g.fill();
    inked(g,'#ef9f33',1.8);g.beginPath();g.arc(hx,hy-9,4.1,0,7);fillStroke(g);            // hallabong knob
    g.fillStyle=MIN.greenD;g.beginPath();g.ellipse(hx+3,hy-12,3.1,1.6,0.7,0,7);g.fill(); }
  drawStallSign(g,c.x+c.w/2,c.y+c.h+3,'한라봉',MIN.plum);
  drawPriceSign(g,c.x+c.w-16,c.y-10,MIN.verm);
  // glass arcade ceiling — pale skylight mullions behind the stalls
  g.strokeStyle='rgba(120,142,154,.45)';g.lineWidth=1.1;
  for(let x=18;x<W;x+=28){g.beginPath();g.moveTo(x,88);g.lineTo(x,138);g.stroke();}
  g.beginPath();g.moveTo(0,110);g.lineTo(W,110);g.stroke();
  // ===== Jeju Dongmun Market arched gate header =====
  g.fillStyle='#3b4047';
  g.beginPath();g.moveTo(0,0);g.lineTo(W,0);g.lineTo(W,46);
  const humps=5, hw=W/humps;
  for(let i=0;i<humps;i++){ const x1=W-(i+1)*hw; g.quadraticCurveTo(W-(i*hw)-hw/2, 64, x1, 46); }
  g.lineTo(0,0);g.closePath();g.fill();
  g.fillStyle='rgba(255,255,255,.05)';g.fillRect(0,0,W,5);
  // three overlapping logo circles (tangerine / blue / green)
  const lx=86,ly=24;
  g.fillStyle='#e8943a';g.beginPath();g.arc(lx,ly,7,0,7);g.fill();
  g.fillStyle='#4aa3c7';g.beginPath();g.arc(lx+9,ly-3,6,0,7);g.fill();
  g.fillStyle='#7bb24a';g.beginPath();g.arc(lx+5,ly+5,5.5,0,7);g.fill();
  // market name
  g.textAlign='center';g.textBaseline='middle';
  g.font='700 25px "Gowun Batang", serif';g.lineJoin='round';
  g.lineWidth=3.4;g.strokeStyle='rgba(8,14,18,.55)';g.strokeText('Jeju Market', W/2+18, 22);
  g.fillStyle='#bfe3ee';g.fillText('Jeju Market', W/2+18, 22);
  g.font='700 9px "Space Mono", monospace';g.fillStyle='#9fc4d0';g.fillText('JEJU DONGMUN MARKET', W/2+18, 38);
  // festive welcome banner under the gate
  inked(g,'#c0506e',2);rr(g,18,66,W-36,18,3);fillStroke(g);
  g.fillStyle=MIN.gold;g.fillRect(21,68,W-42,2.4);
  g.font='700 11px "Gowun Batang", serif';g.fillStyle='#fff2e0';g.textAlign='center';g.textBaseline='middle';
  g.fillText('Welcome to the market', W/2, 76);
  // hanging signboards
  drawHangSign(g,150,98,90,MIN.teal);drawHangSign(g,470,96,110,MIN.plum);drawHangSign(g,790,100,80,MIN.greenD);
  // colourful pennant bunting strung across the aisle
  drawPennants(g,90,9);
  // overhead string-light strands (bulbs animated live in drawMarket)
  drawStringLightsWire(g,120,5);
  drawStringLightsWire(g,466,10);
  // exit mat
  inked(g,'#d8c089',2);g.setLineDash([4,3]);rr(g,marketExit.x,marketExit.y,marketExit.w,marketExit.h,5);fillStroke(g);g.setLineDash([]);
  // ===== aisle clutter — crates/baskets/sacks spilling toward the lane, both sides (center lane stays clear) =====
  (function(){
    // left cluster
    drawCrate(g,166,470,62,32,MIN.gold,'default');     // tangerines
    drawCrate(g,176,442,46,26,MIN.greenD,'greens');    // greens crate stacked on top
    drawCitrusBasket(g,302,500,0.92);
    drawSack(g,346,502,14,'#caa86a','grain');
    drawSack(g,336,514,12,'#2f5a3a','seaweed');
    // right cluster
    drawHallabongCrate(g,608,478,66);                  // hallabong crate
    drawSnackBoxes(g,690,450);                          // souvenir boxes
    drawCitrusBasket(g,760,502,0.9);
    drawSack(g,628,510,13,'#caa86a','grain');
    drawSack(g,640,522,11,'#caa86a','grain');
  })();
  // foreground: one tangerine basket (the 2nd citrus) + a peanut display, framing the aisle
  drawCitrusBasket(g,80,556,1.05);
  drawPeanutSacks(g,856,540);
  marketBG=el;
}
let marketImg=null, marketImgTried=false;
function ensureMarketImg(){ if(marketImgTried)return; marketImgTried=true;
  const im=new Image(); im.onload=()=>{ marketImg=im; }; im.src='market.png?v=1'; }
/* Migyeong's buyer's counter — a wooden stall with a weighing scale + a basket of catch */
function drawSellStall(){
  const cx=480, top=302, cl=cx-86, cr=cx+86, W2=cr-cl;
  const wood='#9c6b3a', woodD='#5e3f26', woodL='#b98a52';
  ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
  // front panel (planks) + counter top
  inked(ctx,woodD,2.6); rr(ctx,cl,top+9,W2,30,4); fillStroke(ctx);
  ctx.strokeStyle='rgba(70,45,25,.4)'; ctx.lineWidth=1; for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(cl+i*W2/5,top+11);ctx.lineTo(cl+i*W2/5,top+38);ctx.stroke();}
  inked(ctx,wood,2.6); rr(ctx,cl-6,top,W2+12,15,5); fillStroke(ctx);
  ctx.fillStyle=woodL; rr(ctx,cl-2,top+2,W2+4,6,3); ctx.fill();
  // a basket of the day's catch (left)
  const bx=cl+34, by=top+1;
  inked(ctx,'#cdab74',2); ctx.beginPath();ctx.ellipse(bx,by,20,8,0,0,7); fillStroke(ctx);
  ctx.strokeStyle='rgba(110,80,40,.45)';ctx.lineWidth=1; for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(bx+i*7,by-7);ctx.lineTo(bx+i*7,by+7);ctx.stroke();}
  for(let i=0;i<3;i++){ inked(ctx,i%2?'#8fb0c0':'#a9c2d0',1.6); ctx.save();ctx.translate(bx-9+i*9,by-5);ctx.rotate(-0.35+i*0.3);ctx.beginPath();ctx.ellipse(0,0,8,3.4,0,0,7);fillStroke(ctx); ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(5,-0.5,0.8,0,7);ctx.fill(); ctx.restore(); }
  // platform weighing scale (right) — the catch is bought by weight
  const sx=cr-30, sy=top+4;
  inked(ctx,'#c4c8cc',1.8); ctx.beginPath();ctx.ellipse(sx,sy-16,11,3.2,0,0,7); fillStroke(ctx);      // pan
  inked(ctx,'#9aa0a6',2); rr(ctx,sx-3,sy-14,6,11,2); fillStroke(ctx);                                  // neck
  inked(ctx,'#c4c8cc',2); rr(ctx,sx-14,sy-3,28,9,2); fillStroke(ctx);                                  // base
  inked(ctx,'#fbf7ec',2); ctx.beginPath();ctx.arc(sx,sy-19,8,0,7); fillStroke(ctx);                    // dial
  ctx.strokeStyle=MIN.ink;ctx.lineWidth=1; for(let a=-2.4;a<=-0.7;a+=0.42){ctx.beginPath();ctx.moveTo(sx+Math.cos(a)*5.5,sy-19+Math.sin(a)*5.5);ctx.lineTo(sx+Math.cos(a)*7.5,sy-19+Math.sin(a)*7.5);ctx.stroke();}
  ctx.strokeStyle='#d35a31';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(sx,sy-19);ctx.lineTo(sx+3.5,sy-24);ctx.stroke();   // needle
  ctx.restore();
}
function drawMarket(){
  const t=performance.now()*0.001;
  ensureMarketImg();
  const usingImg = marketImg && marketImg.complete && marketImg.naturalWidth;
  if(usingImg){ ctx.drawImage(marketImg,0,0,W,H); }
  else { if(!marketBG) buildMarketBG(); ctx.drawImage(marketBG,0,0,W,H); }
  // warm bulbs glowing along both overhead strands (procedural bg only — the illustration has its own)
  if(!usingImg) for(const [sy,sag] of [[120,5],[466,10]]){
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<14;i++){const x=18+i*32, y=sy+Math.sin(x*0.05)*sag+3; const a=0.5+0.3*Math.sin(t*2+i);
      ctx.fillStyle=`rgba(255,210,120,${a})`;ctx.beginPath();ctx.arc(x,y,2.6,0,7);ctx.fill();}
    ctx.restore();
    ctx.fillStyle=MIN.gold;for(let i=0;i<14;i++){const x=18+i*32, y=sy+Math.sin(x*0.05)*sag+3;ctx.beginPath();ctx.arc(x,y,1.5,0,7);ctx.fill();}
  }
  // Migyeong, drawn first so her counter sits in front of her
  drawPerson(vendor.x,vendor.y,{skin:vendor.skin,scarf:vendor.scarf,look:vendor.look,face:1,idle:0.6});
  drawSellStall();   // her wooden buyer's counter + weighing scale + a basket of the day's catch
  // more vendors tending the side & back stalls — a lively market
  drawPerson(120,410,{skin:'#e3c4a0',scarf:MIN.gold,look:{hairStyle:'bun',hair:'#3a2c22',top:'#c0506e',bottom:'#4a4a52',apron:'#ece2c8',elder:true,skin:'#e3c4a0'},face:1,idle:0.4});
  drawPerson(864,412,{skin:'#eccaa2',scarf:MIN.teal,look:{hairStyle:'ponytail',hair:'#241f1b',top:'#3a6e8c',bottom:'#37343d',skin:'#eccaa2'},face:-1,idle:1.1});
  drawPerson(MARKET.x0+200,196,{skin:'#e7c9a0',scarf:MIN.verm,look:{hairStyle:'bob',hair:'#2a2220',top:'#6aa647',bottom:'#4a4a52',skin:'#e7c9a0'},face:1,idle:0.8});
  // shoppers strolling & browsing the aisle (walking NPCs, distinct from the diver)
  if(typeof marketShoppers!=='undefined') for(const s of marketShoppers)
    drawPerson(s.x,s.y,{skin:s.look.skin,look:s.look,face:s.face,moving:s.moving,phase:s.anim,idle:0.5});
  drawPerson(P.x,P.y,{skin:'#eccaa2',scarf:MIN.gold,face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  ctx.save();ctx.globalCompositeOperation='screen';
  const sun=ctx.createLinearGradient(0,86,0,420);sun.addColorStop(0,'rgba(210,235,245,.1)');sun.addColorStop(1,'rgba(210,235,245,0)');
  ctx.fillStyle=sun;ctx.fillRect(W/2-90,86,180,360);ctx.restore();
  tag(vendor.roman, vendor.x, vendor.y-30, 11, MIN.gold);
  tag('Sell', sellStation.x, sellStation.y+8, 11, MIN.gold);
  tag('← out', marketExit.x+marketExit.w/2, marketExit.y+marketExit.h/2, 11, MIN.gold);
}

/* ---------------- HOME INTERIOR ---------------- */
function drawStoneBlocks(g,x,y,w,h,seed){
  const rng=mulberry32(seed||((x*31+y*7)|0));
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  g.fillStyle='#241f2a';g.fillRect(x,y,w,h);            // dark joints between stones
  const rowH=h/Math.max(2,Math.round(h/15));
  g.strokeStyle='#19151f';g.lineWidth=1.6;g.lineJoin='round';
  for(let ry=y;ry<y+h;ry+=rowH){
    let cx=x - rng()*14;
    while(cx<x+w){
      const bw=15+rng()*16, bh=rowH-2;
      const v=46+rng()*22|0;                             // dark basalt
      g.fillStyle=`rgb(${v},${v-2},${v+5})`;
      rr(g,cx+1.6,ry+1.6,bw-3.2,bh-3,3.2);g.fill();g.stroke();
      g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.ellipse(cx+bw*0.45,ry+bh*0.32,bw*0.25,1.4,0,0,7);g.fill();
      g.fillStyle='rgba(8,6,12,.42)';
      for(let k=0;k<4;k++){g.beginPath();g.arc(cx+3+rng()*(bw-6),ry+3+rng()*(bh-6),0.6+rng()*1.1,0,7);g.fill();}
      cx+=bw;
    }
  }
  g.restore();
}
/* ===== warm wooden log-cabin back wall (Story-of-Seasons style) ===== */
const WALLH=140;   // back-wall height; floor starts here
function drawScreen(g){
  // ---- horizontal brown plank wall ----
  for(let py=0;py<WALLH;py+=18){
    g.fillStyle = ((py/18)|0)%2 ? '#a06a3c' : '#90592f';
    g.fillRect(0,py,W,18);
    g.strokeStyle='rgba(54,32,16,.42)';g.lineWidth=1.4;
    g.beginPath();g.moveTo(0,py);g.lineTo(W,py);g.stroke();
    g.strokeStyle='rgba(54,32,16,.16)';g.lineWidth=1;
    for(let gx=12;gx<W;gx+=78){g.beginPath();g.moveTo(gx,py+5);g.lineTo(gx+34,py+5);g.stroke();}
  }
  // ---- blond timber frame: top beam + corner posts ----
  g.fillStyle='#e7cf94';
  g.fillRect(0,0,W,15); g.fillRect(0,0,16,WALLH); g.fillRect(W-16,0,16,WALLH);
  g.fillStyle='rgba(120,90,40,.22)';
  g.fillRect(0,12,W,3); g.fillRect(13,0,3,WALLH); g.fillRect(W-16,0,3,WALLH);
  g.strokeStyle=MIN.ink;g.lineWidth=2.2;
  g.strokeRect(0.5,0.5,W-1,15);
  g.beginPath();g.moveTo(16,15);g.lineTo(16,WALLH);g.moveTo(W-16,15);g.lineTo(W-16,WALLH);g.stroke();
  // ---- baseboard ----
  g.fillStyle='#7a4d28';g.fillRect(0,WALLH-7,W,7);
  g.strokeStyle=MIN.ink;g.lineWidth=2.4;g.beginPath();g.moveTo(0,WALLH-7);g.lineTo(W,WALLH-7);g.stroke();
  // ---- wall fixtures ----
  drawTealWindow(g,470,52,118,80);          // teal-framed sea view (center)
  drawCorkBoard(g,700,54,104,74);          // cork bulletin board (right)
  drawBrickBacksplash(g,70,56,250,WALLH-56-7);  // kitchen brick (left, above the counter)
  drawDishShelf(g,92,66,210);            // shelf of dishes + hanging utensils
}
/* teal-painted wooden window framing a strip of Jeju sea */
function drawTealWindow(g,x,y,w,h){
  inked(g,'#3f9e8c',3);rr(g,x-5,y-5,w+10,h+10,4);fillStroke(g);
  inked(g,'#5cbfb0',2);rr(g,x-2,y-2,w+4,h+4,3);fillStroke(g);
  g.save();g.beginPath();rr(g,x,y,w,h,2);g.clip();
  const sg=g.createLinearGradient(0,y,0,y+h);
  sg.addColorStop(0,'#cfe6f2');sg.addColorStop(.5,'#9fcfe2');sg.addColorStop(.55,'#5f9ec6');sg.addColorStop(1,'#356e95');
  g.fillStyle=sg;g.fillRect(x,y,w,h);
  const hz=y+h*0.55;
  g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.ellipse(x+w*0.3,y+h*0.24,9,4,0,0,7);g.fill();
  g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1.2;g.beginPath();g.moveTo(x,hz);g.lineTo(x+w,hz);g.stroke();
  g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=1;
  for(let i=1;i<=3;i++){const ly=hz+i*((y+h-hz)/4);g.beginPath();for(let xx=x;xx<=x+w;xx+=8)g.lineTo(xx,ly+Math.sin(xx*0.14+i)*1.1);g.stroke();}
  g.restore();
  g.strokeStyle='#3f9e8c';g.lineWidth=2.6;
  g.beginPath();g.moveTo(x+w/2,y);g.lineTo(x+w/2,y+h);g.moveTo(x,y+h/2);g.lineTo(x+w,y+h/2);g.stroke();
}
/* cork bulletin board with a pinned photo + note */
function drawCorkBoard(g,x,y,w,h){
  inked(g,'#7a5a30',3);rr(g,x-3,y-3,w+6,h+6,4);fillStroke(g);
  g.fillStyle='#c79a5f';rr(g,x,y,w,h,2);g.fill();
  g.fillStyle='rgba(110,72,36,.32)';const rng=mulberry32(99);
  for(let i=0;i<46;i++)g.fillRect(x+rng()*w,y+rng()*h,1.4,1.4);
  // pinned photo
  inked(g,MIN.white,1.6);rr(g,x+10,y+12,30,24,2);fillStroke(g);
  g.fillStyle='#a9d8e6';g.fillRect(x+12,y+14,26,11);
  g.fillStyle=MIN.greenL;g.fillRect(x+12,y+25,26,9);
  g.fillStyle=MIN.red;g.beginPath();g.arc(x+25,y+12,2,0,7);g.fill();
  // little note
  inked(g,'#f3ead0',1.4);rr(g,x+48,y+16,26,26,2);fillStroke(g);
  g.strokeStyle='rgba(90,60,30,.4)';g.lineWidth=1;
  for(let i=0;i<3;i++){g.beginPath();g.moveTo(x+52,y+24+i*6);g.lineTo(x+70,y+24+i*6);g.stroke();}
  g.fillStyle=MIN.gold;g.beginPath();g.arc(x+61,y+16,2,0,7);g.fill();
}
/* exposed brick backsplash behind the stove */
function drawBrickBacksplash(g,x,y,w,h){
  g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  g.fillStyle='#9a5a44';g.fillRect(x,y,w,h);
  const bw=26,bh=12,rng=mulberry32(7);
  for(let ry=y,row=0;ry<y+h;ry+=bh,row++){
    const off=(row%2)?-bw/2:0;
    for(let bx=x+off;bx<x+w;bx+=bw){
      const v=152+rng()*30|0;
      g.fillStyle=`rgb(${v},${(v*0.62)|0},${(v*0.5)|0})`;
      rr(g,bx+1.5,ry+1.5,bw-3,bh-3,2);g.fill();
    }
  }
  g.restore();
  g.strokeStyle=MIN.ink;g.lineWidth=2.2;g.strokeRect(x,y,w,h);
}
/* wall shelf with stacked dishes, pot, pan + hanging utensils */
function drawDishShelf(g,x,y,w){
  inked(g,'#b07c40',2.4);rr(g,x,y,w,8,2);fillStroke(g);
  g.fillStyle='rgba(54,32,16,.3)';g.fillRect(x,y+6,w,2);
  // stacked plates
  inked(g,MIN.white,1.5);for(let i=0;i<3;i++){rr(g,x+8,y-5-i*3.5,24,4.5,2);fillStroke(g);}
  // lidded pot
  inked(g,'#bfc4c8',1.8);rr(g,x+42,y-14,22,15,3);fillStroke(g);
  inked(g,'#aab0b6',1.6);rr(g,x+45,y-17,16,4,2);fillStroke(g);
  g.fillStyle=MIN.ink;g.beginPath();g.arc(x+53,y-18,1.5,0,7);g.fill();
  // frying pan
  inked(g,'#3a352f',1.8);g.beginPath();g.arc(x+88,y-7,10,0,7);fillStroke(g);
  g.strokeStyle=MIN.ink;g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(x+98,y-7);g.lineTo(x+114,y-12);g.stroke();
  // stacked bowls
  inked(g,'#cfe0e8',1.6);for(let i=0;i<2;i++){g.beginPath();g.moveTo(x+w-30,y-3-i*7);g.quadraticCurveTo(x+w-18,y+7-i*7,x+w-6,y-3-i*7);g.closePath();fillStroke(g);}
  // hanging-utensil rail
  g.strokeStyle='#8a5a30';g.lineWidth=2;g.beginPath();g.moveTo(x+6,y+12);g.lineTo(x+w-6,y+12);g.stroke();
  // whisk
  g.strokeStyle=MIN.ink;g.lineWidth=1.4;g.beginPath();g.moveTo(x+26,y+12);g.lineTo(x+26,y+22);g.stroke();
  g.strokeStyle='#9aa0a6';g.lineWidth=1.2;
  for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(x+26,y+22);g.quadraticCurveTo(x+26+k*2.5,y+30,x+26+k*1.3,y+34);g.stroke();}
  // spatula
  g.strokeStyle=MIN.ink;g.lineWidth=1.6;g.beginPath();g.moveTo(x+w*0.5,y+12);g.lineTo(x+w*0.5,y+30);g.stroke();
  inked(g,'#caa257',1.4);rr(g,x+w*0.5-4,y+30,8,8,2);fillStroke(g);
  // ladle
  g.strokeStyle=MIN.ink;g.lineWidth=1.6;g.beginPath();g.moveTo(x+w*0.5+24,y+12);g.lineTo(x+w*0.5+24,y+28);g.stroke();
  inked(g,'#bfc4c8',1.4);g.beginPath();g.arc(x+w*0.5+24,y+31,4,0,Math.PI);fillStroke(g);
}
/* low console: book spines behind glass + cabinet, with a retro TV on top */
function drawConsoleTV(g,x,y,w){
  const h=40;
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(x+w/2,y+h+3,w*0.5,7,0,0,7);g.fill();
  inked(g,'#a06a38',2.4);rr(g,x,y,w,h,4);fillStroke(g);
  const bw2=w*0.54;
  g.save();g.beginPath();rr(g,x+4,y+6,bw2-6,h-12,2);g.clip();
  const cols=[MIN.red,MIN.greenD,MIN.gold,MIN.blue,MIN.plum,MIN.teal,MIN.verm];
  let sx=x+5;const rng=mulberry32(42);
  while(sx<x+bw2-4){const ww=5+rng()*4;g.fillStyle=cols[(rng()*cols.length)|0];g.fillRect(sx,y+7,ww,h-14);g.strokeStyle='rgba(40,24,12,.4)';g.lineWidth=1;g.strokeRect(sx,y+7,ww,h-14);sx+=ww+1.5;}
  g.restore();
  g.strokeStyle=MIN.ink;g.lineWidth=1.6;g.strokeRect(x+4,y+6,bw2-6,h-12);
  inked(g,'#8a5a30',1.8);rr(g,x+bw2+2,y+6,w-bw2-6,h-12,3);fillStroke(g);
  g.fillStyle=MIN.gold;g.beginPath();g.arc(x+bw2+8,y+h/2,1.8,0,7);g.fill();
  // retro wood TV on top
  const tx=x+bw2+ (w-bw2)/2;
  inked(g,'#b5803f',2.2);rr(g,tx-17,y-26,34,28,4);fillStroke(g);
  inked(g,'#2a2d33',1.8);rr(g,tx-12,y-22,24,20,3);fillStroke(g);
  g.fillStyle='rgba(180,210,220,.4)';rr(g,tx-10,y-20,11,16,2);g.fill();
  g.fillStyle='#caa257';g.beginPath();g.arc(tx+8,y-16,1.6,0,7);g.arc(tx+8,y-9,1.6,0,7);g.fill();
  g.strokeStyle='#8f969c';g.lineWidth=1.6;g.lineCap='round';
  g.beginPath();g.moveTo(tx,y-26);g.lineTo(tx-9,y-38);g.moveTo(tx,y-26);g.lineTo(tx+9,y-37);g.stroke();
  g.fillStyle='#8f969c';g.beginPath();g.arc(tx,y-26,2,0,7);g.fill();
  // a green book laid flat on the left top
  inked(g,MIN.greenD,1.6);rr(g,x+8,y-7,20,6,1.5);fillStroke(g);
  g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x+9,y-6,18,1.4);
}
/* small wooden tabletop radio (replaces the old gramophone) */
function drawGramophone(g,x,y){
  // soft floor shadow
  g.fillStyle='rgba(20,12,8,.18)';g.beginPath();g.ellipse(x,y+22,22,5,0,0,7);g.fill();
  // wooden body
  inked(g,'#9c6a38',2.4);rr(g,x-20,y-14,40,34,4);fillStroke(g);
  g.fillStyle='rgba(40,22,10,.22)';g.fillRect(x-20,y+8,40,2);
  // dark front faceplate
  inked(g,'#3a2716',1.8);rr(g,x-17,y-10,34,22,3);fillStroke(g);
  // woven speaker grille (left)
  g.save();g.beginPath();rr(g,x-15,y-8,18,18,2);g.clip();
  g.fillStyle='#caa257';g.fillRect(x-15,y-8,18,18);
  g.strokeStyle='rgba(40,22,10,.45)';g.lineWidth=0.8;
  for(let i=-7;i<=10;i+=2){g.beginPath();g.moveTo(x-15,y+i);g.lineTo(x+3,y+i);g.stroke();}
  g.restore();
  g.strokeStyle=MIN.ink;g.lineWidth=1.2;rr(g,x-15,y-8,18,18,2);g.stroke();
  // tuning dial (gold ring + needle)
  inked(g,MIN.gold,1.4);g.beginPath();g.arc(x+9,y-2,5,0,7);fillStroke(g);
  g.fillStyle='#f5e5b8';g.beginPath();g.arc(x+9,y-2,3.2,0,7);g.fill();
  g.strokeStyle=MIN.ink;g.lineWidth=1.4;g.lineCap='round';
  g.beginPath();g.moveTo(x+9,y-2);g.lineTo(x+12,y-5);g.stroke();
  // small power knob
  inked(g,MIN.ink2,1.2);g.beginPath();g.arc(x+9,y+7,2.2,0,7);fillStroke(g);
  // top antenna
  g.strokeStyle=MIN.ink;g.lineWidth=1.6;g.lineCap='round';
  g.beginPath();g.moveTo(x+14,y-14);g.lineTo(x+20,y-26);g.stroke();
  g.fillStyle=MIN.ink;g.beginPath();g.arc(x+20,y-26,1.6,0,7);g.fill();
  // little wooden legs
  g.fillStyle='#5a3a22';g.fillRect(x-17,y+20,3,4);g.fillRect(x+14,y+20,3,4);
}
/* floor-to-wall sea-view window: sky, horizon, ocean, grid mullions, sill plants, tied sheer curtain */
function drawSeaWindow(g,x,y,w,h){
  // dark timber frame
  inked(g,'#5a3a22',3.4);rr(g,x-5,y-5,w+10,h+10,3);fillStroke(g);
  g.save();g.beginPath();rr(g,x,y,w,h,2);g.clip();
  // sky → sea gradient
  const sg=g.createLinearGradient(0,y,0,y+h);
  sg.addColorStop(0,'#cfe6f2');sg.addColorStop(0.42,'#acd2e6');sg.addColorStop(0.52,'#6fa9cf');
  sg.addColorStop(0.62,'#4d8cb6');sg.addColorStop(1,'#2f6c95');
  g.fillStyle=sg;g.fillRect(x,y,w,h);
  const hz=y+h*0.55;
  // soft clouds in the upper sky
  motifCloud(g,x+w*0.26,y+h*0.20,0.6,'rgba(255,255,255,.85)',MIN.ink);
  motifCloud(g,x+w*0.68,y+h*0.30,0.5,'rgba(255,255,255,.7)',MIN.ink);
  // distant headland on the horizon
  g.fillStyle='rgba(70,96,96,.5)';g.beginPath();g.moveTo(x,hz);g.quadraticCurveTo(x+w*0.18,hz-7,x+w*0.34,hz);g.closePath();g.fill();
  // horizon + a few drifting swell lines
  g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.4;g.beginPath();g.moveTo(x,hz);g.lineTo(x+w,hz);g.stroke();
  g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=1;
  for(let i=1;i<=4;i++){const ly=hz+i*((y+h-hz)/5);g.beginPath();
    for(let xx=x;xx<=x+w;xx+=10)g.lineTo(xx,ly+Math.sin(xx*0.12+i)*1.2);g.stroke();}
  g.restore();
  // grid mullions (3 columns, 1 cross-rail) — like the sliding glass doors
  g.strokeStyle='#6e4a2a';g.lineWidth=2.6;
  for(let i=1;i<3;i++){g.beginPath();g.moveTo(x+w*i/3,y);g.lineTo(x+w*i/3,y+h);g.stroke();}
  g.beginPath();g.moveTo(x,y+h*0.5);g.lineTo(x+w,y+h*0.5);g.stroke();
  // tied-back sheer curtain on the right
  g.fillStyle='rgba(255,255,255,.6)';g.strokeStyle='rgba(220,235,240,.9)';g.lineWidth=1;
  g.beginPath();g.moveTo(x+w-2,y);g.quadraticCurveTo(x+w-26,y+h*0.34,x+w-12,y+h*0.5);
  g.quadraticCurveTo(x+w-30,y+h*0.62,x+w-2,y+h*0.74);g.lineTo(x+w-2,y);g.closePath();fillStroke(g);
  g.strokeStyle='rgba(180,200,205,.7)';g.lineWidth=0.8;
  for(let i=0;i<4;i++){g.beginPath();g.moveTo(x+w-4-i*5,y+2);g.quadraticCurveTo(x+w-18-i*3,y+h*0.34,x+w-12,y+h*0.5);g.stroke();}
  // potted plants on the sill
  drawSillPot(g,x+12,y+h-2,MIN.greenD);
  drawSillPot(g,x+w*0.5-4,y+h-1,MIN.greenL);
  drawSillPot(g,x+w-18,y+h-2,MIN.jade);
}
function drawSillPot(g,x,y,leaf){
  inked(g,'#b06a3a',1.6);g.beginPath();g.moveTo(x-5,y-7);g.lineTo(x+5,y-7);g.lineTo(x+3,y);g.lineTo(x-3,y);g.closePath();fillStroke(g);
  g.strokeStyle=leaf;g.lineWidth=1.8;g.lineCap='round';
  for(let i=-1;i<=1;i++){g.beginPath();g.moveTo(x,y-6);g.quadraticCurveTo(x+i*5,y-13,x+i*7,y-17);g.stroke();}
  g.fillStyle=leaf;for(const[dx,dy]of[[-6,-15],[6,-15],[0,-19]]){g.beginPath();g.ellipse(x+dx,y+dy,3,2,dx*0.1,0,7);g.fill();}
}
/* hand-painted hanging cloth: a haenyeo cat in diving goggles (from the Jeju shop photo) */
function drawCatCurtain(g,x,y,w,h){
  // hanging rod + cords
  g.strokeStyle='#7a4f2a';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(x-5,y);g.lineTo(x+w+5,y);g.stroke();
  g.strokeStyle='rgba(60,40,20,.6)';g.lineWidth=1.4;
  g.beginPath();g.moveTo(x+8,y);g.lineTo(x+8,y+4);g.moveTo(x+w-8,y);g.lineTo(x+w-8,y+4);g.stroke();
  // pale-blue painted cloth with a wavy hem
  inked(g,'#cfe0e8',2);
  g.beginPath();g.moveTo(x,y+4);g.lineTo(x+w,y+4);g.lineTo(x+w,y+h-6);
  for(let i=4;i>=0;i--){const sx=x+w*i/5;g.quadraticCurveTo(sx+w/10,y+h+(i%2?2:-3),sx,y+h-4);}
  g.lineTo(x,y+h-6);g.closePath();fillStroke(g);
  // brush-stroke calligraphy band across the top (suggested, not literal)
  g.strokeStyle=MIN.red;g.lineWidth=2;g.lineCap='round';
  for(let i=0;i<3;i++){const cx=x+10+i*16;g.beginPath();g.moveTo(cx,y+12);g.lineTo(cx+7,y+12);g.moveTo(cx+3,y+9);g.lineTo(cx+3,y+18);g.stroke();}
  // the cat — pale body, orange-striped tail, big diving goggles
  const cx=x+w*0.5, cy=y+h*0.62;
  g.save();g.translate(cx,cy);g.lineJoin='round';g.lineCap='round';
  // curling orange-striped tail
  g.strokeStyle=MIN.ink;g.lineWidth=6;g.beginPath();g.moveTo(13,8);g.quadraticCurveTo(24,4,20,-8);g.stroke();
  g.strokeStyle=MIN.verm;g.lineWidth=4;g.beginPath();g.moveTo(13,8);g.quadraticCurveTo(24,4,20,-8);g.stroke();
  g.strokeStyle=MIN.ink;g.lineWidth=1;for(let i=0;i<3;i++){g.beginPath();g.moveTo(15+i*3,7-i*4);g.lineTo(19+i*3,5-i*4);g.stroke();}
  // body
  inked(g,'#eef1f0',2);g.beginPath();g.moveTo(-12,18);g.quadraticCurveTo(-15,-4,0,-6);g.quadraticCurveTo(15,-4,12,18);g.closePath();fillStroke(g);
  // orange patches
  g.fillStyle=MIN.verm;g.beginPath();g.ellipse(-6,6,4,6,0.2,0,7);g.fill();g.beginPath();g.ellipse(7,9,3.5,5,-0.2,0,7);g.fill();
  // head
  inked(g,'#eef1f0',2);g.beginPath();g.arc(0,-12,11,0,7);fillStroke(g);
  // ears
  g.fillStyle='#eef1f0';g.strokeStyle=MIN.ink;g.lineWidth=2;
  g.beginPath();g.moveTo(-9,-19);g.lineTo(-12,-27);g.lineTo(-3,-21);g.closePath();fillStroke(g);
  g.beginPath();g.moveTo(9,-19);g.lineTo(12,-27);g.lineTo(3,-21);g.closePath();fillStroke(g);
  g.fillStyle=MIN.verm;g.beginPath();g.moveTo(-8.5,-20);g.lineTo(-10.5,-25);g.lineTo(-5,-21);g.closePath();g.fill();
  // diving goggles — yellow rims, cyan lenses
  inked(g,MIN.gold,2);g.beginPath();g.arc(-4.5,-12,5,0,7);fillStroke(g);g.beginPath();g.arc(5.5,-12,5,0,7);fillStroke(g);
  g.fillStyle=MIN.teal;g.beginPath();g.arc(-4.5,-12,3,0,7);g.fill();g.beginPath();g.arc(5.5,-12,3,0,7);g.fill();
  g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.arc(-5.6,-13,1,0,7);g.fill();g.beginPath();g.arc(4.4,-13,1,0,7);g.fill();
  g.strokeStyle=MIN.gold;g.lineWidth=2;g.beginPath();g.moveTo(0.5,-12);g.lineTo(0.5,-12);g.moveTo(-9.5,-12);g.lineTo(-12,-13);g.moveTo(10.5,-12);g.lineTo(13,-13);g.stroke();
  // nose + whiskers
  g.fillStyle=MIN.verm;g.beginPath();g.moveTo(-1.5,-6);g.lineTo(1.5,-6);g.lineTo(0,-4);g.closePath();g.fill();
  g.strokeStyle='rgba(20,12,8,.5)';g.lineWidth=0.8;
  g.beginPath();g.moveTo(0,-4.5);g.lineTo(-9,-5);g.moveTo(0,-4.5);g.lineTo(9,-5);g.stroke();
  g.restore();
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
  // raised wooden bed (blond frame, blue checkered quilt) — vertical along the right wall
  const bw=86, bh=104, bx=x-bw/2, by=y-bh/2;
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(x,by+bh+5,bw*0.55,10,0,0,7);g.fill();
  // frame
  inked(g,'#d9b56b',2.6);rr(g,bx,by,bw,bh,8);fillStroke(g);
  // headboard with arch
  inked(g,'#e7cf94',2.4);rr(g,bx-2,by-2,bw+4,22,8);fillStroke(g);
  g.fillStyle='#caa257';g.strokeStyle=MIN.ink;g.lineWidth=2;g.beginPath();g.arc(x,by+13,9,Math.PI,0);g.fill();g.stroke();
  // footboard
  inked(g,'#e7cf94',2.4);rr(g,bx-2,by+bh-16,bw+4,18,8);fillStroke(g);
  // corner posts
  g.fillStyle='#c79a52';g.strokeStyle=MIN.ink;g.lineWidth=2;
  for(const px of [bx+2,bx+bw-7]){rr(g,px,by-6,5,9,2);g.fill();g.stroke();rr(g,px,by+bh-3,5,9,2);g.fill();g.stroke();}
  // mattress + blue checkered quilt
  const mx=bx+6,my=by+20,mw=bw-12,mh=bh-40;
  inked(g,'#7fa9d6',2);rr(g,mx,my,mw,mh,6);fillStroke(g);
  g.save();g.beginPath();rr(g,mx,my,mw,mh,6);g.clip();
  g.fillStyle='rgba(40,70,130,.34)';const cs=13;
  for(let yy=my;yy<my+mh;yy+=cs)for(let xx=mx;xx<mx+mw;xx+=cs){if((((xx-mx)/cs|0)+((yy-my)/cs|0))%2)g.fillRect(xx,yy,cs,cs);}
  g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=1;
  for(let xx=mx-mh;xx<mx+mw;xx+=11){g.beginPath();g.moveTo(xx,my);g.lineTo(xx+mh,my+mh);g.stroke();}
  g.restore();
  // pillow
  inked(g,MIN.white,1.8);rr(g,mx+6,my+2,mw-12,20,6);fillStroke(g);
  g.fillStyle='rgba(127,169,214,.5)';rr(g,mx+10,my+6,mw-20,12,4);g.fill();
}
/* ---- woven tatami mats with green cloth (heri) borders ---- */
function drawTatami(g,x,y,w,h){
  g.fillStyle='#d8c084';g.fillRect(x,y,w,h);                 // straw base
  const mw=Math.round(w/2), mh=99;
  for(let row=0,my=y; my<y+h; row++,my+=mh){
    const rh=Math.min(mh,y+h-my);
    for(let col=0,mx=x; mx<x+w; col++,mx+=mw){
      const cw=Math.min(mw,x+w-mx), woven=((row+col)%2)===0;
      // mat fill (subtle two-tone)
      g.fillStyle=woven?'#dcc488':'#d2b978';g.fillRect(mx,my,cw,rh);
      // fine woven grain — direction alternates per mat
      g.strokeStyle='rgba(150,116,60,.16)';g.lineWidth=1;g.beginPath();
      if(woven){ for(let yy=my+3;yy<my+rh-1;yy+=4){g.moveTo(mx+2,yy);g.lineTo(mx+cw-2,yy);} }
      else     { for(let xx=mx+3;xx<mx+cw-1;xx+=4){g.moveTo(xx,my+2);g.lineTo(xx,my+rh-2);} }
      g.stroke();
      // soft inner sheen
      g.fillStyle='rgba(255,248,225,.12)';g.fillRect(mx+3,my+3,cw-6,3);
      // green heri border + dark seam
      g.strokeStyle='#6f9158';g.lineWidth=3.4;g.strokeRect(mx+2,my+2,cw-4,rh-4);
      g.strokeStyle='rgba(38,56,28,.42)';g.lineWidth=1.2;g.strokeRect(mx+2,my+2,cw-4,rh-4);
    }
  }
}
/* ---- raised wood entrance step / engawa (horizontal planks) ---- */
function drawEngawa(g,x,y,w,h){
  for(let py=y; py<y+h; py+=15){
    g.fillStyle=((((py-y)/15)|0)%2)?'#8a5630':'#7d4d2a';
    g.fillRect(x,py,w,Math.min(15,y+h-py));
    g.strokeStyle='rgba(40,22,10,.42)';g.lineWidth=1.2;g.beginPath();g.moveTo(x,py);g.lineTo(x+w,py);g.stroke();
    g.strokeStyle='rgba(255,236,200,.08)';g.lineWidth=1;g.beginPath();g.moveTo(x,py+1.4);g.lineTo(x+w,py+1.4);g.stroke();
  }
  // raised lip where the tatami room meets the step
  g.fillStyle='#caa257';g.fillRect(x,y-5,w,6);
  g.fillStyle='rgba(255,255,255,.2)';g.fillRect(x,y-4,w,1.6);
  g.strokeStyle=MIN.ink;g.lineWidth=2.4;g.beginPath();g.moveTo(x,y-5);g.lineTo(x+w,y-5);g.stroke();
}
/* ---- packed-earth genkan with stepping stones, bushes, lantern & shoes ---- */
function drawGenkan(g,y){
  // dim threshold shadow under the step
  g.fillStyle='rgba(20,12,8,.22)';g.fillRect(0,y,W,6);
  // packed-earth / gravel ground
  g.fillStyle='#bcab8c';g.fillRect(0,y,W,H-y);
  const rng=mulberry32(53);
  g.fillStyle='rgba(90,70,40,.16)';
  for(let i=0;i<120;i++)g.fillRect(rng()*W,y+rng()*(H-y),1.6,1.6);
  // stepping stones
  g.lineJoin='round';
  for(const[sx,sy,rx, ry] of [[W*0.46,y+24,20,11],[W*0.30,y+9,13,8],[W*0.62,y+12,14,8]]){
    g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(sx,sy+3,rx,ry,0,0,7);g.fill();
    inked(g,'#9a949a',2.2);g.beginPath();g.ellipse(sx,sy,rx,ry,0,0,7);fillStroke(g);
    g.fillStyle='rgba(255,255,255,.16)';g.beginPath();g.ellipse(sx-rx*0.3,sy-ry*0.3,rx*0.5,ry*0.4,0,0,7);g.fill();
  }
  // pair of slippers by the step (centre)
  for(let s=0;s<2;s++){const sx=W*0.5-12+s*16, sy=y+8;
    inked(g,s?'#e0a836':'#e8714a',1.8);g.beginPath();g.ellipse(sx,sy,8,4.6,0.12,0,7);fillStroke(g);
    g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.ellipse(sx-2,sy-1,4,2,0.12,0,7);g.fill();}
  // small stone lantern, bottom-right
  (function(lx,ly){
    inked(g,'#a39a9c',2);rr(g,lx-9,ly-2,18,5,2);fillStroke(g);          // base
    rr(g,lx-3.5,ly-12,7,11,2);fillStroke(g);                            // post
    inked(g,'#b4abad',2);rr(g,lx-9,ly-22,18,11,3);fillStroke(g);        // light box
    g.fillStyle='rgba(247,210,120,.85)';rr(g,lx-4.5,ly-19,9,6,1.5);g.fill();  // glow
    inked(g,'#9a9092',2);g.beginPath();g.moveTo(lx-12,ly-22);g.lineTo(lx+12,ly-22);g.lineTo(lx,ly-32);g.closePath();fillStroke(g); // cap
  })(W-40, H-14);
  // little roadside bushes, both corners
  for(const[bx,by,sc] of [[26,H-18,1],[W-92,H-12,0.82],[80,H-10,0.7]]){
    g.fillStyle='rgba(20,12,8,.14)';g.beginPath();g.ellipse(bx,by+5,16*sc,5,0,0,7);g.fill();
    inked(g,MIN.greenD,2.2);
    for(const[dx,dy,r] of [[-9,0,9],[0,-5,11],[9,0,9],[2,2,8]])
      {g.beginPath();g.arc(bx+dx*sc,by+dy*sc,r*sc,0,7);fillStroke(g);}
    g.fillStyle=MIN.green;for(const[dx,dy,r] of [[-7,-2,4],[3,-6,4],[8,-1,3]]){g.beginPath();g.arc(bx+dx*sc,by+dy*sc,r*sc,0,7);g.fill();}
  }
}
/* tall right-side shoji sliding door — translucent paper grid lit from behind */
function drawRightShojiDoor(g,x,y,w,h){
  // dark timber outer frame (with subtle drop shadow on the floor)
  g.fillStyle='rgba(20,12,8,.2)';g.fillRect(x+3,y+h-2,w-2,5);
  inked(g,'#5a3a22',3);rr(g,x,y,w,h,4);fillStroke(g);
  // warm lantern-light glow behind the paper
  g.save();g.beginPath();rr(g,x+5,y+5,w-10,h-10,2);g.clip();
  const grad=g.createLinearGradient(0,y,0,y+h);
  grad.addColorStop(0,'#fbecbf');grad.addColorStop(0.45,'#f5d488');grad.addColorStop(1,'#d6a64b');
  g.fillStyle=grad;g.fillRect(x,y,w,h);
  // soft halo
  const radial=g.createRadialGradient(x+w/2,y+h*0.45,2,x+w/2,y+h*0.45,Math.max(w,h)*0.7);
  radial.addColorStop(0,'rgba(255,240,200,.55)');radial.addColorStop(1,'rgba(255,240,200,0)');
  g.fillStyle=radial;g.fillRect(x,y,w,h);
  g.restore();
  // paper-pane wooden mullions: 3 columns x 6 rows
  g.strokeStyle='#5a3a22';g.lineWidth=2.4;
  const cols=3, rows=6;
  for(let i=1;i<cols;i++){const cx=x+w*i/cols;g.beginPath();g.moveTo(cx,y+4);g.lineTo(cx,y+h-4);g.stroke();}
  for(let i=1;i<rows;i++){const cy=y+h*i/rows;g.beginPath();g.moveTo(x+4,cy);g.lineTo(x+w-4,cy);g.stroke();}
  // sliding-door split (the two panels meet near the middle)
  g.strokeStyle='rgba(60,40,20,.45)';g.lineWidth=1.2;
  g.beginPath();g.moveTo(x+w*0.5,y+4);g.lineTo(x+w*0.5,y+h-4);g.stroke();
  // a small black ring pull on the right panel
  g.strokeStyle=MIN.ink;g.lineWidth=1.6;g.beginPath();g.arc(x+w*0.78,y+h*0.5,3.5,0,7);g.stroke();
}
/* wooden canopy / curtain header above the futon (matches the bed width) */
function drawFutonCanopy(g,cx,cy){
  const cw=84, ch=22, lx=cx-cw/2;
  // drop shadow under the canopy onto the bed
  g.fillStyle='rgba(20,12,8,.18)';g.beginPath();g.ellipse(cx,cy+ch+4,cw*0.46,5,0,0,7);g.fill();
  // top wooden beam (warm tan, blond highlight)
  inked(g,'#caa257',2.6);rr(g,lx,cy,cw,ch,5);fillStroke(g);
  g.fillStyle='#e7cf94';rr(g,lx+4,cy+3,cw-8,4,2);g.fill();
  // gold trim strip
  g.fillStyle=MIN.gold;rr(g,lx+8,cy+ch-7,cw-16,3,1);g.fill();
  // little arched scallop centred under the beam (the curtain header)
  inked(g,'#e7cf94',2);g.beginPath();
  g.moveTo(lx+cw*0.18,cy+ch);
  g.quadraticCurveTo(cx,cy+ch+10,lx+cw*0.82,cy+ch);
  g.lineTo(lx+cw*0.82,cy+ch-1);
  g.quadraticCurveTo(cx,cy+ch+8,lx+cw*0.18,cy+ch-1);
  g.closePath();fillStroke(g);
  // tiny side-cord rosettes
  g.fillStyle=MIN.gold;g.strokeStyle=MIN.ink;g.lineWidth=1.2;
  g.beginPath();g.arc(lx+6,cy+ch/2,2.4,0,7);fillStroke(g);
  g.beginPath();g.arc(lx+cw-6,cy+ch/2,2.4,0,7);fillStroke(g);
}
/* small decorative wooden cabinet that sits on the engawa */
function drawEngawaCabinet(g,x,y){
  const cw=42, ch=44, lx=x-cw/2, ly=y-ch/2;
  g.fillStyle='rgba(20,12,8,.22)';g.beginPath();g.ellipse(x,ly+ch+4,cw*0.55,5,0,0,7);g.fill();
  // body
  inked(g,'#7a4d28',2.4);rr(g,lx,ly,cw,ch,3);fillStroke(g);
  g.fillStyle='rgba(255,236,200,.14)';g.fillRect(lx+2,ly+2,cw-4,2);
  // vertical divider into two panels
  g.strokeStyle=MIN.ink;g.lineWidth=1.6;
  g.beginPath();g.moveTo(lx+cw/2,ly+3);g.lineTo(lx+cw/2,ly+ch-3);g.stroke();
  // left panel: a small drawer with gold knob
  inked(g,'#5a3a22',1.4);rr(g,lx+3,ly+4,cw/2-5,14,2);fillStroke(g);
  g.fillStyle=MIN.gold;g.beginPath();g.arc(lx+cw/4,ly+11,1.6,0,7);g.fill();
  // right panel: a pale-blue inset (folded cloth)
  inked(g,'#cfe0e8',1.4);rr(g,lx+cw/2+2,ly+4,cw/2-5,18,2);fillStroke(g);
  // a small folded white linen on the right
  inked(g,MIN.white,1);rr(g,lx+cw/2+4,ly+6,cw/2-9,4,1);fillStroke(g);
  // lower bay: a tiny pair of slippers
  inked(g,MIN.verm,1);g.beginPath();g.ellipse(lx+cw*0.32,ly+ch-7,5,2.6,0.1,0,7);fillStroke(g);
  inked(g,MIN.gold,1);g.beginPath();g.ellipse(lx+cw*0.66,ly+ch-7,5,2.6,0.1,0,7);fillStroke(g);
}
/* ---- warm Korean home: tatami living room, kitchen counter, round table ---- */
function buildHomeBG(){
  const {el,g}=makeCanvas(W,H);
  // ---- back wall ----
  drawScreen(g);
  // ---- floor: woven tatami living room, wood entrance step, genkan below ----
  const FT=WALLH, ENGY=518, GENY=566;
  drawTatami(g,0,FT,W,ENGY-FT);
  drawEngawa(g,0,ENGY,W,GENY-ENGY);
  drawGenkan(g,GENY);
  // ---- right-side shoji sliding door (glowing paper grid on the right wall) ----
  drawRightShojiDoor(g,852,FT+2,96,206);
  // ---- freestanding bookshelf + retro TV (center-back, between counter & table) ----
  drawConsoleTV(g,590,176,150);
  // ---- canopy / curtain rail above the futon (sits between shoji bottom and futon) ----
  drawFutonCanopy(g,bedStation.x,bedStation.y-84);
  // ---- decorative wooden cabinet on the right side of the engawa ----
  drawEngawaCabinet(g,724,ENGY+34);
  // ---- kitchen counter: wood cabinet + stainless top w/ stove & sink ----
  const is=homeIsland;
  g.fillStyle='rgba(20,12,8,.2)';g.beginPath();g.ellipse(is.x+is.w/2,is.y+is.h+6,is.w*0.55,11,0,0,7);g.fill();
  inked(g,'#a06a38',2.6);rr(g,is.x,is.y+14,is.w,is.h-14,5);fillStroke(g);
  g.strokeStyle='rgba(50,30,14,.5)';g.lineWidth=1.6;
  for(let i=1;i<3;i++){g.beginPath();g.moveTo(is.x+i*is.w/3,is.y+16);g.lineTo(is.x+i*is.w/3,is.y+is.h-3);g.stroke();}
  g.fillStyle=MIN.gold;g.strokeStyle=MIN.ink;g.lineWidth=1.4;
  for(let i=0;i<3;i++){g.beginPath();g.arc(is.x+is.w/6+i*is.w/3,is.y+is.h*0.55,2.4,0,7);fillStroke(g);}
  // stainless counter top
  inked(g,'#c9ced3',2.4);rr(g,is.x-6,is.y,is.w+12,18,4);fillStroke(g);
  g.fillStyle='rgba(255,255,255,.4)';g.fillRect(is.x-2,is.y+3,is.w+4,3);
  // sink basin (right) + faucet
  inked(g,'#aeb4ba',2);rr(g,is.x+is.w*0.62,is.y+3,is.w*0.30,12,3);fillStroke(g);
  g.strokeStyle='#8f969c';g.lineWidth=3;g.lineCap='round';
  g.beginPath();g.moveTo(is.x+is.w*0.9,is.y+4);g.lineTo(is.x+is.w*0.9,is.y-7);g.quadraticCurveTo(is.x+is.w*0.9,is.y-10,is.x+is.w*0.82,is.y-10);g.stroke();
  // stove burner (kettle is drawn live on top in drawHome)
  inked(g,'#3a352f',2);g.beginPath();g.arc(stoveStation.x,is.y+9,9,0,7);fillStroke(g);
  // ---- round dining table + stool ----
  const tb=homeTable, tcx=tb.x+tb.w/2, tcy=tb.y+tb.h/2, trx=tb.w/2+4, tryd=tb.h/2+4;
  g.fillStyle='rgba(20,12,8,.16)';g.beginPath();g.ellipse(tcx,tcy+tryd+6,trx*0.92,9,0,0,7);g.fill();
  g.strokeStyle='#6e4a28';g.lineWidth=5;g.lineCap='round';
  g.beginPath();g.moveTo(tcx-trx*0.5,tcy+4);g.lineTo(tcx-trx*0.5,tcy+tryd+8);g.moveTo(tcx+trx*0.5,tcy+4);g.lineTo(tcx+trx*0.5,tcy+tryd+8);g.stroke();
  inked(g,'#b5803f',2.8);g.beginPath();g.ellipse(tcx,tcy,trx,tryd,0,0,7);fillStroke(g);
  g.fillStyle='#a8743a';g.beginPath();g.ellipse(tcx,tcy,trx-5,tryd-4,0,0,7);g.fill();
  g.strokeStyle='rgba(58,32,15,.32)';g.lineWidth=1.2;
  for(let i=-2;i<=2;i++){const px=tcx+i*(trx/3);g.beginPath();g.moveTo(px,tcy-tryd+5);g.lineTo(px,tcy+tryd-5);g.stroke();}
  g.fillStyle='rgba(58,32,15,.4)';for(let i=-2;i<=2;i++){g.beginPath();g.arc(tcx+i*(trx/3),tcy-tryd+8,1.1,0,7);g.arc(tcx+i*(trx/3),tcy+tryd-8,1.1,0,7);g.fill();}
  // teapot + two cups
  inked(g,MIN.jade,2);rr(g,tcx-10,tcy-7,20,14,6);fillStroke(g);
  g.strokeStyle=MIN.ink;g.lineWidth=2;g.lineCap='round';g.beginPath();g.moveTo(tcx+10,tcy-3);g.lineTo(tcx+16,tcy-6);g.stroke();
  inked(g,MIN.white,1.4);g.beginPath();g.arc(tcx-15,tcy+5,4,0,7);fillStroke(g);g.beginPath();g.arc(tcx+15,tcy+6,4,0,7);fillStroke(g);
  // small round stool
  inked(g,'#9c6a38',2.2);g.beginPath();g.ellipse(tcx,tcy+tryd+17,12,6,0,0,7);fillStroke(g);
  // ---- gramophone on a nightstand (foreground left) ----
  drawGramophone(g,gramoStation.x,gramoStation.y+20);
  // ---- woven striped doormat at the exit ----
  const em=homeExit;
  inked(g,'#caa257',2);rr(g,em.x,em.y,em.w,em.h,5);fillStroke(g);
  g.save();g.beginPath();rr(g,em.x,em.y,em.w,em.h,5);g.clip();
  const stripes=[MIN.red,MIN.white,MIN.teal,MIN.gold];
  for(let i=0,sx=em.x;sx<em.x+em.w;i++,sx+=9){g.fillStyle=stripes[i%stripes.length];g.fillRect(sx,em.y,9,em.h);}
  g.restore();
  g.strokeStyle=MIN.ink;g.lineWidth=2;g.strokeRect(em.x,em.y,em.w,em.h);
  g.strokeStyle='#caa257';g.lineWidth=1.4;
  for(let sx=em.x+3;sx<em.x+em.w;sx+=6){g.beginPath();g.moveTo(sx,em.y+em.h);g.lineTo(sx,em.y+em.h+4);g.stroke();}
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
  // music notes drifting up from the gramophone while it plays
  if(typeof musicOn!=='undefined' && musicOn){
    ctx.save();
    const gx=gramoStation.x+22, gy=gramoStation.y-26;
    for(let i=0;i<4;i++){
      const ph=(t*0.5+i*0.7)%1;
      const nx=gx+Math.sin(ph*7+i)*9, ny=gy-ph*46;
      ctx.globalAlpha=Math.max(0,0.9*(1-ph));
      ctx.fillStyle=i%2?MIN.red:MIN.teal;
      ctx.font='700 '+(13+i)+'px "Gowun Batang", serif';ctx.textAlign='center';
      ctx.fillText(i%2?'♪':'♫', nx, ny);
    }
    ctx.restore();
  }
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
    glabel('yum!',mouthX+16,mouthY-4,13,'#fff');
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
    ctx.fillStyle='#1f4060';ctx.beginPath();ctx.ellipse(0,R*0.55,R*1.7,R*0.95,0,0,7);ctx.fill();
    ctx.fillStyle='#2b5680';ctx.beginPath();ctx.ellipse(-R*0.85,R*0.55,R*0.55,R*0.4,0,0,7);ctx.ellipse(R*0.9,R*0.5,R*0.5,R*0.36,0,0,7);ctx.fill();
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
  else if(c.s.id==='cucumber'){
    // sea cucumber — a plump knobbly slug resting on the rock
    inked(ctx,col,2.4);ctx.beginPath();ctx.ellipse(0,R*0.25,R*1.3,R*0.55,0.06,0,7);fillStroke(ctx);
    ctx.fillStyle=shade(col,26);ctx.beginPath();ctx.ellipse(-R*0.2,R*0.06,R*0.8,R*0.26,0.06,0,7);ctx.fill();
    ctx.fillStyle=shade(col,-26);
    for(const[ox,oy]of[[-R*0.8,-R*0.05],[-R*0.3,-R*0.22],[R*0.25,-R*0.2],[R*0.75,-R*0.02],[0,R*0.05]]){
      ctx.beginPath();ctx.arc(ox,R*0.25+oy,1.8,0,7);ctx.fill();}
    ctx.strokeStyle=shade(col,-30);ctx.lineWidth=1.6;ctx.lineCap='round';
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*R*0.4,R*0.72);ctx.lineTo(i*R*0.4,R*0.86);ctx.stroke();}
  }
  else if(c.s.id==='abalone'){
    // jeonbok — the prized ear-shell, mother-of-pearl sheen and a row of breathing holes
    inked(ctx,col,2.4);ctx.beginPath();ctx.ellipse(0,0,R*1.18,R*0.78,-0.35,0,7);fillStroke(ctx);
    ctx.fillStyle=shade(col,30);ctx.beginPath();ctx.ellipse(-R*0.18,-R*0.1,R*0.72,R*0.44,-0.35,0,7);ctx.fill();
    ctx.fillStyle='rgba(190,230,220,.5)';ctx.beginPath();ctx.ellipse(-R*0.32,-R*0.22,R*0.4,R*0.2,-0.4,0,7);ctx.fill();
    ctx.fillStyle='rgba(216,196,238,.45)';ctx.beginPath();ctx.ellipse(R*0.16,0,R*0.34,R*0.16,-0.3,0,7);ctx.fill();
    ctx.fillStyle=shade(col,-34);
    for(let i=0;i<4;i++){const a=-2.4+i*0.42;ctx.beginPath();ctx.arc(Math.cos(a)*R*0.82,Math.sin(a)*R*0.5,1.6,0,7);ctx.fill();}
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
/* a green sea turtle gliding by, flippers paddling (ambient, not catchable) */
function drawDiveTurtle(x,y,dir,t){
  ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.lineJoin='round';ctx.lineCap='round';
  const flap=Math.sin(t*2.2);
  inked(ctx,'#4f8f6a',2.2);
  ctx.beginPath();ctx.ellipse(8,-7,9,4.5,-0.5+flap*0.4,0,7);fillStroke(ctx);   // front flippers
  ctx.beginPath();ctx.ellipse(6,9,8,4,0.6-flap*0.4,0,7);fillStroke(ctx);
  ctx.beginPath();ctx.ellipse(-15,5,6,3,0.4,0,7);fillStroke(ctx);              // rear flipper
  inked(ctx,'#5a9a72',2.6);ctx.beginPath();ctx.ellipse(-2,0,15,11,0,0,7);fillStroke(ctx);   // shell
  ctx.fillStyle='#6fae84';for(let a=0.4;a<6.3;a+=1.05){ctx.beginPath();ctx.ellipse(-2+Math.cos(a)*7,Math.sin(a)*5,3,2.6,0,0,7);ctx.fill();}
  ctx.strokeStyle='rgba(20,50,32,.4)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(-2,0,9,6,0,0,7);ctx.stroke();
  inked(ctx,'#6fae84',2);ctx.beginPath();ctx.ellipse(15,0,5,4,0,0,7);fillStroke(ctx);       // head
  ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(17,-1.4,1,0,7);ctx.fill();
  ctx.restore();
}
/* a manta ray cruising the deep, wings rippling (ambient) */
function drawMantaRay(x,y,dir,t){
  ctx.save();ctx.translate(x,y);ctx.scale(dir,1);ctx.lineJoin='round';ctx.lineCap='round';
  const w=Math.sin(t*1.6)*7;
  inked(ctx,'#34556f',2.4);
  ctx.beginPath();ctx.moveTo(7,0);
  ctx.quadraticCurveTo(-2,-7,-26,-4-w);
  ctx.quadraticCurveTo(-8,0,-26,4+w);
  ctx.quadraticCurveTo(-2,7,7,0);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.ellipse(-6,0,10,3,0,0,7);ctx.fill();
  ctx.strokeStyle='#34556f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(-42,1);ctx.stroke();   // tail
  ctx.fillStyle='#34556f';ctx.beginPath();ctx.ellipse(8,-2,3,1.4,0.4,0,7);ctx.ellipse(8,2,3,1.4,-0.4,0,7);ctx.fill();  // cephalic fins
  ctx.restore();
}
/* a five-armed starfish resting on a rock (ambient decor) */
function drawStarfish(x,y,col){
  ctx.save();ctx.translate(x,y);ctx.lineJoin='round';
  inked(ctx,col||'#e8814a',2);
  ctx.beginPath();
  for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5;const r=(i%2===0)?8:3.4;const px=Math.cos(a)*r,py=Math.sin(a)*r*0.62;i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
  ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='rgba(255,255,255,.28)';for(let i=0;i<5;i++){const a=-Math.PI/2+i*2*Math.PI/5;ctx.beginPath();ctx.arc(Math.cos(a)*4,Math.sin(a)*4*0.62,1,0,7);ctx.fill();}
  ctx.restore();
}
/* ---------------- BEACH CLEAN-UP SCENE ---------------- */
function drawLitterIcon(id,R,col,t){
  ctx.lineJoin='round';ctx.lineCap='round';
  if(id==='styro'){
    inked(ctx,'#f3f4f1',2.2);rr(ctx,-R,-R*0.7,R*2,R*1.4,3);fillStroke(ctx);
    ctx.fillStyle='rgba(150,150,150,.2)';for(const[dx,dy]of[[-5,-2],[3,1],[6,-3],[-2,3]]){ctx.beginPath();ctx.arc(dx,dy,1.6,0,7);ctx.fill();}
  } else if(id==='bag'){
    inked(ctx,'#cfe0e6',2);
    ctx.beginPath();ctx.moveTo(-R*0.8,-R*0.4);ctx.quadraticCurveTo(-R,R*0.9,-R*0.3,R);ctx.quadraticCurveTo(0,R*1.1,R*0.3,R);ctx.quadraticCurveTo(R,R*0.9,R*0.8,-R*0.4);ctx.closePath();fillStroke(ctx);
    ctx.strokeStyle=MIN.ink;ctx.lineWidth=2;ctx.beginPath();ctx.arc(-R*0.4,-R*0.45,R*0.3,Math.PI,0);ctx.arc(R*0.4,-R*0.45,R*0.3,Math.PI,0);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-R*0.25,0);ctx.lineTo(-R*0.15,R*0.7);ctx.stroke();
  } else if(id==='bottle'){
    inked(ctx,'#bfe3df',2);rr(ctx,-R*0.45,-R*0.5,R*0.9,R*1.5,R*0.42);fillStroke(ctx);
    inked(ctx,'#bfe3df',1.6);rr(ctx,-R*0.3,-R*0.9,R*0.6,R*0.5,2);fillStroke(ctx);
    inked(ctx,'#5fa8d6',1.6);rr(ctx,-R*0.28,-R*1.1,R*0.56,R*0.3,1.5);fillStroke(ctx);
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-R*0.18,-R*0.15);ctx.lineTo(-R*0.18,R*0.8);ctx.stroke();
  } else if(id==='can'){
    inked(ctx,'#c9ccd2',2);rr(ctx,-R*0.55,-R*0.8,R*1.1,R*1.6,3);fillStroke(ctx);
    ctx.fillStyle='#e06a4e';ctx.fillRect(-R*0.55,-R*0.18,R*1.1,R*0.5);
    ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-R*0.36,-R*0.7);ctx.lineTo(-R*0.36,R*0.7);ctx.stroke();
    ctx.fillStyle='#9aa0a8';ctx.beginPath();ctx.ellipse(0,-R*0.8,R*0.55,R*0.18,0,0,7);ctx.fill();
  } else if(id==='net'){
    inked(ctx,MIN.greenD,2.4);ctx.beginPath();ctx.arc(0,0,R,0,7);fillStroke(ctx);
    ctx.save();ctx.beginPath();ctx.arc(0,0,R-1,0,7);ctx.clip();
    ctx.strokeStyle='#4f7f30';ctx.lineWidth=1.2;
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*R*0.4,-R);ctx.lineTo(i*R*0.4,R);ctx.stroke();ctx.beginPath();ctx.moveTo(-R,i*R*0.4);ctx.lineTo(R,i*R*0.4);ctx.stroke();}
    ctx.restore();
  } else if(id==='glass'){
    inked(ctx,'#7fae6a',2);rr(ctx,-R*0.42,-R*0.5,R*0.84,R*1.4,R*0.36);fillStroke(ctx);
    inked(ctx,'#5e8a4a',1.6);rr(ctx,-R*0.26,-R*0.95,R*0.52,R*0.5,2);fillStroke(ctx);
    ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(-R*0.2,-R*0.2,R*0.15,R*0.9);
  } else if(id==='seaglass'){
    inked(ctx,MIN.teal,2);ctx.beginPath();ctx.moveTo(0,-R);ctx.lineTo(R*0.9,-R*0.1);ctx.lineTo(R*0.5,R);ctx.lineTo(-R*0.6,R*0.7);ctx.lineTo(-R*0.85,-R*0.3);ctx.closePath();fillStroke(ctx);
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.moveTo(0,-R*0.5);ctx.lineTo(R*0.4,0);ctx.lineTo(0,R*0.2);ctx.closePath();ctx.fill();
  } else if(id==='scrap'){
    inked(ctx,MIN.goldD,2.2);ctx.beginPath();ctx.moveTo(-R*0.7,R*0.75);ctx.lineTo(-R*0.42,-R*0.7);ctx.lineTo(R*0.42,-R*0.7);ctx.lineTo(R*0.7,R*0.75);ctx.closePath();fillStroke(ctx);
    ctx.fillStyle='rgba(255,240,200,.4)';ctx.beginPath();ctx.moveTo(-R*0.28,-R*0.5);ctx.lineTo(0,-R*0.5);ctx.lineTo(-R*0.18,R*0.45);ctx.closePath();ctx.fill();
  } else if(id==='float'){ // taewak — bright-orange haenyeo buoy cradled in a green net
    const net='#1c9c78';
    // round buoy body, a touch wider than tall (drum-like)
    inked(ctx,col,2.2);ctx.beginPath();ctx.ellipse(0,0,R,R*0.94,0,0,7);fillStroke(ctx);
    // soft shading + highlight
    ctx.save();ctx.beginPath();ctx.ellipse(0,0,R-1.2,R*0.94-1.2,0,0,7);ctx.clip();
    ctx.fillStyle='rgba(180,70,0,.16)';ctx.beginPath();ctx.ellipse(R*0.3,R*0.34,R*0.9,R*0.85,0,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.34)';ctx.beginPath();ctx.ellipse(-R*0.34,-R*0.36,R*0.36,R*0.24,-0.5,0,7);ctx.fill();
    // green net — curved vertical ribs + connecting bands form diamonds
    ctx.strokeStyle=net;ctx.lineWidth=1.1;
    for(let i=-1;i<=1;i++){const dx=i*R*0.52;ctx.beginPath();ctx.moveTo(dx*0.4,-R);ctx.quadraticCurveTo(dx*1.7,0,dx*0.4,R);ctx.stroke();}
    for(let j=-1;j<=1;j+=2){const dy=j*R*0.5;ctx.beginPath();ctx.ellipse(0,dy,R*0.96,R*0.4,0,0,7);ctx.stroke();}
    ctx.restore();
    // net gathered at the top knot
    ctx.strokeStyle=net;ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,-R*0.82,R*0.28,R*0.12,0,0,7);ctx.stroke();
  } else { // coin — old yeopjeon, square centre
    inked(ctx,'#e0a836',2.2);ctx.beginPath();ctx.arc(0,0,R,0,7);fillStroke(ctx);
    ctx.fillStyle='#b3801f';rr(ctx,-R*0.24,-R*0.24,R*0.48,R*0.48,1);ctx.fill();
    ctx.strokeStyle='rgba(255,245,210,.5)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,R*0.7,Math.PI*1.1,Math.PI*1.7);ctx.stroke();
  }
}
function drawLitter(c,t){
  const x=c.x, y=c.y+Math.sin(c.bob)*(c.buried?0.5:1.4), R=c.r, col=c.s.color;
  ctx.save();ctx.translate(x,y);ctx.lineJoin='round';ctx.lineCap='round';
  ctx.fillStyle='rgba(120,90,40,.2)';ctx.beginPath();ctx.ellipse(0,R*0.9,R*0.9,R*0.32,0,0,7);ctx.fill();
  if(c.buried){
    // half-buried in a little sand mound, with a glint poking out
    ctx.fillStyle='#dcc290';ctx.beginPath();ctx.ellipse(0,R*0.25,R*1.5,R*0.85,0,0,7);ctx.fill();
    ctx.fillStyle='#cbad7e';ctx.beginPath();ctx.ellipse(-R*0.6,R*0.25,R*0.5,R*0.32,0,0,7);ctx.ellipse(R*0.7,R*0.12,R*0.45,R*0.28,0,0,7);ctx.fill();
    ctx.fillStyle=col;ctx.strokeStyle=MIN.ink;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(0,-R*0.1,R*0.42,0,7);fillStroke(ctx);
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.arc(-R*0.12,-R*0.24,R*0.12,0,7);ctx.fill();
    if(c.dig>0){
      const p=Math.min(1,c.dig/c.digMax);
      ctx.strokeStyle='rgba(120,90,40,.4)';ctx.lineWidth=3.2;ctx.beginPath();ctx.arc(0,0,R+9,0,6.28);ctx.stroke();
      ctx.strokeStyle=MIN.gold;ctx.lineWidth=3.2;ctx.beginPath();ctx.arc(0,0,R+9,-Math.PI/2,-Math.PI/2+p*6.28);ctx.stroke();
    }
  } else {
    drawLitterIcon(c.s.id,R,col,t);
  }
  ctx.restore();
}
function drawBeachSack(x,y){
  ctx.save();ctx.translate(x,y);ctx.lineJoin='round';
  ctx.fillStyle='rgba(74,58,44,.18)';ctx.beginPath();ctx.ellipse(0,9,9,3,0,0,7);ctx.fill();
  inked(ctx,'#cdbd8a',2.2);ctx.beginPath();ctx.moveTo(-7,-6);ctx.lineTo(7,-6);ctx.lineTo(5,9);ctx.lineTo(-5,9);ctx.closePath();fillStroke(ctx);
  ctx.strokeStyle='rgba(120,90,40,.5)';ctx.lineWidth=1;
  for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*3.4,-6);ctx.lineTo(i*2.6,9);ctx.stroke();}
  for(let j=-3;j<=6;j+=3){ctx.beginPath();ctx.moveTo(-6.6,j);ctx.lineTo(6.6,j);ctx.stroke();}
  inked(ctx,'#b89a5e',1.6);rr(ctx,-8,-8,16,4,2);fillStroke(ctx);
  ctx.restore();
}
/* a sea creature tangled in a ghost net on the sand — the rescue target */
function drawBeachRescue(t){
  if(typeof bRescue==='undefined' || !bRescue) return;
  const R=bRescue.r, x=bRescue.x, y=bRescue.y+Math.sin(bRescue.bob)*1.5, kind=bRescue.k.kind;
  ctx.save(); ctx.translate(x,y); ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.globalAlpha = bRescue.freed ? Math.max(0,Math.min(1,bRescue.fleeT/2.2)) : 1;
  // a soft glow wraps the freed animal
  if(bRescue.freed){ ctx.save(); ctx.globalCompositeOperation='screen';
    const gg=ctx.createRadialGradient(0,0,4,0,0,R*2.6); gg.addColorStop(0,'rgba(150,235,220,.5)'); gg.addColorStop(1,'rgba(150,235,220,0)');
    ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(0,0,R*2.6,0,7); ctx.fill(); ctx.restore(); }
  // turn to look back at the player during the freed pause
  if(bRescue.freed && bRescue.lookT>0) ctx.scale(bRescue.lookFace||1,1);
  ctx.fillStyle='rgba(10,8,6,.2)'; ctx.beginPath(); ctx.ellipse(0,R*0.72,R*0.95,R*0.32,0,0,7); ctx.fill();
  if(kind==='turtle'){
    inked(ctx,'#4f7f5a',2.6); ctx.beginPath(); ctx.ellipse(0,0,R*0.9,R*0.7,0,0,7); fillStroke(ctx);
    inked(ctx,'#6fae7e',2); ctx.beginPath(); ctx.ellipse(R*0.95,-R*0.08,R*0.28,R*0.22,0,0,7); fillStroke(ctx);
    inked(ctx,'#5f9a6e',2); ctx.beginPath(); ctx.ellipse(-R*0.7,R*0.55,R*0.3,R*0.16,0.6,0,7); fillStroke(ctx);
    ctx.beginPath(); ctx.ellipse(R*0.7,R*0.55,R*0.3,R*0.16,-0.6,0,7); fillStroke(ctx);
    ctx.fillStyle='#5f9a6e'; for(let a=0.5;a<6.3;a+=1.05){ctx.beginPath();ctx.ellipse(Math.cos(a)*R*0.45,Math.sin(a)*R*0.34,R*0.15,R*0.12,0,0,7);ctx.fill();}
    ctx.fillStyle=MIN.ink; ctx.beginPath(); ctx.arc(R*1.02,-R*0.12,1.5,0,7); ctx.fill();
  } else if(kind==='dolphin'){
    inked(ctx,'#8299ad',2.6); ctx.beginPath(); ctx.ellipse(0,0,R*1.0,R*0.5,-0.18,0,7); fillStroke(ctx);
    ctx.beginPath(); ctx.moveTo(-R*0.85,0); ctx.lineTo(-R*1.3,-R*0.42); ctx.lineTo(-R*1.3,R*0.3); ctx.closePath(); fillStroke(ctx);
    ctx.beginPath(); ctx.moveTo(R*0.05,-R*0.34); ctx.lineTo(R*0.28,-R*0.9); ctx.lineTo(R*0.42,-R*0.3); ctx.closePath(); fillStroke(ctx);
    ctx.fillStyle='#cdd6df'; ctx.beginPath(); ctx.ellipse(R*0.2,R*0.18,R*0.7,R*0.22,-0.18,0,7); ctx.fill();
    ctx.fillStyle=MIN.ink; ctx.beginPath(); ctx.arc(R*0.72,-R*0.06,1.6,0,7); ctx.fill();
  } else {
    inked(ctx,'#f3efe6',2.4); ctx.beginPath(); ctx.ellipse(0,0,R*0.72,R*0.55,0,0,7); fillStroke(ctx);
    inked(ctx,'#f3efe6',2.2); ctx.beginPath(); ctx.arc(R*0.42,-R*0.5,R*0.32,0,7); fillStroke(ctx);
    ctx.fillStyle='#e0a836'; ctx.beginPath(); ctx.moveTo(R*0.72,-R*0.5); ctx.lineTo(R*1.12,-R*0.4); ctx.lineTo(R*0.72,-R*0.32); ctx.closePath(); ctx.fill();
    ctx.fillStyle=MIN.ink; ctx.beginPath(); ctx.arc(R*0.5,-R*0.56,1.4,0,7); ctx.fill();
    inked(ctx,'#d8d2c4',2); ctx.beginPath(); ctx.ellipse(-R*0.18,0.02,R*0.5,R*0.3,0.4,0,7); fillStroke(ctx);
  }
  if(!bRescue.freed){
    ctx.strokeStyle='rgba(60,90,40,.7)'; ctx.lineWidth=1.4;
    for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*R*0.4,-R*0.82); ctx.lineTo(i*R*0.4,R*0.82); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-R*0.95,i*R*0.34); ctx.lineTo(R*0.95,i*R*0.34); ctx.stroke(); }
    const p=Math.min(1,bRescue.cut/bRescue.cutMax);
    if(p>0){ ctx.strokeStyle='#5cbfb0'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.arc(0,0,R+9,-Math.PI/2,-Math.PI/2+p*6.283); ctx.stroke(); }
    else { ctx.font='700 17px "Gowun Batang", serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle='#d35a31'; ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=3; ctx.strokeText('!',0,-R-13); ctx.fillText('!',0,-R-13); }
  }
  ctx.restore();
}
/* a small scuttling crab — only seen on a healthy shore */
function drawBeachCrab(x,y,t,ph){
  const wig=Math.sin(t*7+ph)*1.4;
  ctx.save();ctx.translate(x+Math.sin(t*0.8+ph)*10,y);
  ctx.fillStyle='rgba(74,58,44,.18)';ctx.beginPath();ctx.ellipse(0,4,9,2.6,0,0,7);ctx.fill();
  ctx.strokeStyle='#b84a38';ctx.lineWidth=1.6;ctx.lineCap='round';
  for(const lx of [-1,1]){ for(let i=0;i<3;i++){ ctx.beginPath();ctx.moveTo(lx*5,-1+i*1.4);ctx.lineTo(lx*(8+i*1.4),2+i+wig*lx);ctx.stroke(); } }
  inked(ctx,'#e0604a',1.8);ctx.beginPath();ctx.ellipse(0,-2,6,4.2,0,0,7);fillStroke(ctx);
  inked(ctx,'#e0604a',1.4);ctx.beginPath();ctx.arc(-7,-5,2.2,0,7);fillStroke(ctx);ctx.beginPath();ctx.arc(7,-5,2.2,0,7);fillStroke(ctx);
  ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(-2,-4,0.9,0,7);ctx.arc(2,-4,0.9,0,7);ctx.fill();
  ctx.restore();
}
/* a simple gliding seabird (gull) high over a healthy shore */
function drawGull(x,y,flap){
  ctx.save();ctx.strokeStyle='rgba(70,60,52,.7)';ctx.lineWidth=2;ctx.lineCap='round';
  const w=7, d=3+flap*4;
  ctx.beginPath();ctx.moveTo(x-w,y);ctx.quadraticCurveTo(x-w*0.4,y-d,x,y);ctx.quadraticCurveTo(x+w*0.4,y-d,x+w,y);ctx.stroke();
  ctx.restore();
}
/* build the static sand-speckle + shells once into an offscreen canvas (cheap blit per frame) */
function beachDeco(){
  if(_beachDeco) return _beachDeco;
  const c=document.createElement('canvas'); c.width=Math.round(W*DPR); c.height=Math.round(H*DPR);
  const g=c.getContext('2d'); g.setTransform(DPR,0,0,DPR,0,0);
  const rng2=mulberry32(55);
  g.fillStyle='rgba(150,116,64,.15)';
  for(let i=0;i<150;i++){g.beginPath();g.arc(rng2()*W,140+rng2()*(H-140),0.8+rng2()*1.3,0,7);g.fill();}
  for(let i=0;i<9;i++){const sx=rng2()*W, sy=160+rng2()*380;
    g.fillStyle=['#e8d2c0','#d9b89a','#cbb6a0'][i%3];g.strokeStyle='rgba(120,90,40,.4)';g.lineWidth=1;
    g.beginPath();g.ellipse(sx,sy,3,2.2,rng2()*3,0,7);g.fill();g.stroke();}
  _beachDeco=c; return c;
}
let beachImg=null, beachImgTried=false;
function ensureBeachImg(){ if(beachImgTried)return; beachImgTried=true;
  const im=new Image(); im.onload=()=>{ beachImg=im; }; im.src='beach.png?v=1'; }
function drawBeach(){
  const t=performance.now()*0.001;
  // shore health drives the whole mood — lerp every colour from neglected → thriving
  const hp=Math.max(0,Math.min(1,(typeof G!=='undefined'?G.beachHealth:60)/100));
  const tri=(lo,mid,hi)=> hp<0.5?lerpHex(lo,mid,hp*2):lerpHex(mid,hi,(hp-0.5)*2);
  const C_sand=tri('#bdb4a3','#ddc78d','#f0dca6'), C_dune=tri('#aaa495','#cdb87d','#dcc486'),
        C_wet=tri('#9ba197','#cdb583','#dcc187'), C_seaA=tri('#92a39b','#a6ccc6','#c3e6ec'),
        C_seaB=tri('#5e7d71','#4f9fb0','#57b0dd'), C_foam=tri('#b7c2bc','#e2efec','#ffffff');
  const sm=(a,b,v)=>{ const u=Math.max(0,Math.min(1,(v-a)/(b-a))); return u*u*(3-2*u); };
  const hi=sm(0.6,0.9,hp);    // healthy-shore extras (crabs, gulls, sparkle, sun) fade in
  const lo=sm(0.4,0.0,hp);    // neglected murk fades in as health drops
  // ---- base backdrop: the illustrated beach (grass + sand + rocks + shells) above the resting tide;
  //      the picture's own sea is cropped off so the game's live waterline + rising tide draw below ----
  ensureBeachImg();
  if(beachImg && beachImg.complete && beachImg.naturalWidth){
    const wf=0.845;   // fraction of the image above its painted waterline
    ctx.drawImage(beachImg, 0,0, beachImg.naturalWidth, Math.round(beachImg.naturalHeight*wf), 0,0, W, 575);
  } else {
    // fallback (image not loaded): procedural sand + dune + cached speckle/shells
    ctx.fillStyle=C_sand;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=C_dune;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W,0);ctx.lineTo(W,134);
    for(let x=W;x>=0;x-=24)ctx.lineTo(x,134+Math.sin(x*0.05)*7);ctx.closePath();ctx.fill();
    ctx.drawImage(beachDeco(),0,0,W,H);
  }
  // gliding gulls over a healthy shore
  if(hi>0.02){ ctx.globalAlpha=hi*0.8;
    for(let i=0;i<3;i++){ const gx=((t*26*(1+i*0.2)+i*340)%(W+80))-40, gy=40+i*22+Math.sin(t*1.1+i)*5;
      drawGull(gx,gy,Math.sin(t*4+i)*0.5+0.5); }
    ctx.globalAlpha=1; }
  // ---- sea at the bottom — the tide line marches up the sand as time runs out ----
  const seaTop=(typeof tideLineY==='function')?Math.round(tideLineY()):575;
  ctx.fillStyle=C_wet;ctx.fillRect(0,seaTop-14,W,14);                 // wet sand
  ctx.fillStyle=C_seaA;ctx.fillRect(0,seaTop,W,H-seaTop);
  ctx.fillStyle=C_seaB;ctx.fillRect(0,seaTop+38,W,H-seaTop-38);
  inked(ctx,C_foam,2);
  ctx.beginPath();ctx.moveTo(0,seaTop);
  for(let x=0;x<=W;x+=14){const y=seaTop+Math.sin(x*.12+t*1.8)*3+2;ctx.lineTo(x,y);}
  ctx.lineTo(W,seaTop-6);ctx.lineTo(0,seaTop-6);ctx.closePath();ctx.fill();
  ctx.save();ctx.beginPath();ctx.rect(0,seaTop,W,H-seaTop);ctx.clip();
  const off=(t*8)%28;
  for(let x=-30;x<W+30;x+=28){motifWave(ctx,x-off,seaTop+18+Math.sin(x*0.04+t)*2,1,C_seaA,C_foam);}
  // sparkles glinting on a clear sea
  if(hi>0.02){ const rs=mulberry32(7); ctx.fillStyle='#ffffff';
    for(let i=0;i<14;i++){ const sx=rs()*W, sy=seaTop+6+rs()*(H-seaTop-6), tw=Math.sin(t*3+i*1.7);
      if(tw>0.4){ ctx.globalAlpha=hi*(tw-0.4)*1.5; const r=0.8+rs()*1.2; ctx.fillRect(sx-r,sy,r*2,1); ctx.fillRect(sx,sy-r,1,r*2); } }
    ctx.globalAlpha=1; }
  ctx.restore();
  // waves rolling up the shore — translucent foam tongues advancing & receding (bigger when it's blustery)
  { const wWind=(typeof G!=='undefined'&&(G.weather==='wind'||G.weather==='rain'))?1.6:1;
    ctx.save(); ctx.fillStyle='#ffffff';
    for(let i=0;i<3;i++){ const ph=(t*0.45+i*0.34)%1, env=Math.sin(ph*Math.PI), reach=env*20*wWind;
      ctx.globalAlpha=0.42*env;
      ctx.beginPath(); ctx.moveTo(0,seaTop+2);
      for(let x=0;x<=W;x+=20){ ctx.lineTo(x,seaTop-reach+Math.sin(x*0.05+i*2+t*2)*3); }
      ctx.lineTo(W,seaTop+2); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha=1; ctx.restore(); }
  // litter (depth-sorted so nearer items overlap correctly); submerged pieces fade as the tide takes them
  const sorted=bLitter.slice().sort((a,b)=>a.y-b.y);
  for(const c of sorted){ const sub=c.y>seaTop+6; if(sub)ctx.globalAlpha=0.4; drawLitter(c,t); if(sub)ctx.globalAlpha=1; }
  // tiny crabs scuttle on a healthy shore (none on a neglected one)
  if(hi>0.05){ ctx.globalAlpha=hi;
    drawBeachCrab(200,360,t,0); drawBeachCrab(760,470,t,2.3);
    ctx.globalAlpha=1; }
  // a windblown wrapper tumbling across the sand (a stray bit of litter on the breeze)
  { const windy=(typeof G!=='undefined'&&G.weather==='wind'), cyc=(t*(windy?0.12:0.06))%1;
    const wxp=BEACH_AREA.x0+cyc*(BEACH_AREA.x1-BEACH_AREA.x0), wyp=300+Math.sin(cyc*11)*44;
    ctx.save(); ctx.globalAlpha=windy?0.85:0.5; ctx.translate(wxp,wyp); ctx.rotate(t*5);
    ctx.fillStyle='rgba(250,248,240,.9)'; ctx.strokeStyle='rgba(120,118,108,.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-4,-3); ctx.lineTo(4,-4); ctx.lineTo(5,3); ctx.lineTo(-3,4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore(); }
  // a seabird that drops to the sand, rests a beat, then lifts off — only on a healthy shore
  if(hi>0.1){ const cyc=(t*0.06)%1, lx=632, gy0=70, landY=300;
    let gy, flying=true;
    if(cyc<0.32){ gy=gy0+(landY-gy0)*(cyc/0.32); } else if(cyc<0.62){ gy=landY; flying=false; } else { gy=landY+(gy0-landY)*((cyc-0.62)/0.38); }
    const gx=lx+(flying?Math.sin(t*2)*6:0); ctx.globalAlpha=hi;
    if(flying){ drawGull(gx,gy,Math.sin(t*5)*0.5+0.5); }
    else { ctx.save(); ctx.translate(gx,gy);
      ctx.fillStyle='rgba(74,58,44,.18)'; ctx.beginPath(); ctx.ellipse(0,4,7,2,0,0,7); ctx.fill();
      inked(ctx,'#f4f1ea',1.6); ctx.beginPath(); ctx.ellipse(0,0,6,4,0,0,7); fillStroke(ctx);
      inked(ctx,'#f4f1ea',1.4); ctx.beginPath(); ctx.arc(5,-3,2.6,0,7); fillStroke(ctx);
      ctx.fillStyle='#e0a836'; ctx.beginPath(); ctx.moveTo(7,-3); ctx.lineTo(10,-2.4); ctx.lineTo(7,-1.6); ctx.fill();
      ctx.fillStyle=MIN.ink; ctx.beginPath(); ctx.arc(5.6,-3.4,0.7,0,7); ctx.fill();
      ctx.strokeStyle='#d59f2e'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-1,4); ctx.lineTo(-1,7); ctx.moveTo(2,4); ctx.lineTo(2,7); ctx.stroke();
      ctx.restore(); }
    ctx.globalAlpha=1; }
  // a creature tangled in a washed-up net (the rescue)
  drawBeachRescue(t);
  // dig / pickup particles
  for(const p of bParts){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,2.6,0,7);ctx.fill();ctx.globalAlpha=1;}
  // juicy pop rings expanding off each grab
  for(const r of (typeof bRings!=='undefined'?bRings:[])){ const k=1-Math.max(0,r.life), rad=(r.big?6:3)+k*(r.big?34:18);
    ctx.globalAlpha=Math.max(0,r.life)*(r.big?0.75:0.9); ctx.strokeStyle=r.col||'#fff'; ctx.lineWidth=r.big?3:2;
    ctx.beginPath();ctx.arc(r.x,r.y,rad,0,7);ctx.stroke(); }
  ctx.globalAlpha=1;
  // a combo multiplier badge floating over the diver while the streak is hot
  if(typeof bCombo!=='undefined' && bCombo>=2 && bComboT>0){ ctx.save();
    const s=1+Math.min(0.5,bCombo*0.06); ctx.font=`700 ${Math.round(15*s)}px "Gowun Batang", serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha=Math.min(1,bComboT); ctx.fillStyle='#f0c23a'; ctx.strokeStyle='rgba(60,30,10,.6)'; ctx.lineWidth=3;
    ctx.strokeText('x'+bCombo,P.x,P.y-34); ctx.fillText('x'+bCombo,P.x,P.y-34); ctx.restore(); ctx.globalAlpha=1; }
  // the diver, walking the sand with her gathering sack
  drawBeachSack(P.x - P.face*15, P.y+5);
  drawPerson(P.x,P.y,{skin:'#eccaa2',scarf:MIN.gold,face:P.face,moving:P.moving,phase:P.anim,player:true,modern:(typeof G!=='undefined'&&G.suit==='modern')});
  // ---- shore-health mood overlays ----
  if(lo>0.01){ ctx.save(); ctx.globalCompositeOperation='source-over';   // neglected: cool overcast murk
    ctx.fillStyle=`rgba(120,128,126,${(lo*0.26).toFixed(3)})`; ctx.fillRect(0,0,W,H); ctx.restore(); }
  if(hi>0.01){ ctx.save(); ctx.globalCompositeOperation='screen';        // thriving: warm sun + soft light rays
    const sg=ctx.createRadialGradient(W*0.5,-40,20,W*0.5,-40,420);
    sg.addColorStop(0,`rgba(255,236,170,${(hi*0.30).toFixed(3)})`); sg.addColorStop(1,'rgba(255,236,170,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,H*0.7);
    ctx.globalAlpha=hi*0.12; ctx.fillStyle='#fff7d8';
    for(let i=0;i<4;i++){ const lx=W*0.2+i*W*0.2+Math.sin(t*0.2+i)*8; ctx.beginPath();
      ctx.moveTo(lx,0);ctx.lineTo(lx+70,0);ctx.lineTo(lx+200,H*0.7);ctx.lineTo(lx+130,H*0.7);ctx.closePath();ctx.fill(); }
    ctx.globalAlpha=1; ctx.restore(); }
  // floating risk/reward bonus numbers rising off grabbed litter
  ctx.save(); ctx.font='700 13px "Gowun Batang", serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const f of (typeof bFloats!=='undefined'?bFloats:[])){ ctx.globalAlpha=Math.max(0,Math.min(1,f.life));
    ctx.fillStyle=f.col||'#fff'; ctx.strokeStyle='rgba(30,20,12,.5)'; ctx.lineWidth=3; ctx.strokeText(f.txt,f.x,f.y); ctx.fillText(f.txt,f.x,f.y); }
  ctx.globalAlpha=1; ctx.restore();
  // rescue narration — a quiet line fading in as the animal looks back, then leaving with it
  if(typeof bRescue!=='undefined' && bRescue && bRescue.freed && bRescue.narration){
    const a = bRescue.lookT>0 ? (1-bRescue.lookT/1.3) : Math.max(0,Math.min(1,bRescue.fleeT/2.2));
    ctx.save(); ctx.globalAlpha=Math.max(0,a); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='600 18px "Gowun Batang", serif'; ctx.fillStyle='#fbf7ec'; ctx.strokeStyle='rgba(20,30,40,.55)'; ctx.lineWidth=4;
    ctx.strokeText(bRescue.narration, W/2, 130); ctx.fillText(bRescue.narration, W/2, 130); ctx.restore(); }
  // flat day/night wash + weather
  applyDayLight();
  drawWeather();
  // race-against-the-tide urgency: a pulsing warm vignette when little time remains
  if(typeof bTime!=='undefined' && bTimeMax){ const urg=Math.max(0,1-(bTime/(bTimeMax*0.28)));
    if(urg>0.01){ const pul=0.85+0.15*Math.sin(t*6); ctx.save();
      const vg=ctx.createRadialGradient(W/2,H/2,H*0.30,W/2,H/2,H*0.74);
      vg.addColorStop(0,'rgba(190,60,40,0)'); vg.addColorStop(1,`rgba(170,45,30,${(urg*0.34*pul).toFixed(3)})`);
      ctx.fillStyle=vg; ctx.fillRect(0,0,W,H); ctx.restore(); } }
}

/* a drifting bioluminescent jellyfish for the night dive (soft cyan glow) */
function drawGlowJelly(x,y,t){
  const pulse=0.5+Math.sin(t*1.6)*0.12, bw=15*pulse, bh=13;
  ctx.save();ctx.translate(x,y);
  ctx.globalCompositeOperation='screen';
  const gl=ctx.createRadialGradient(0,0,2,0,0,40);
  gl.addColorStop(0,'rgba(120,230,235,0.5)');gl.addColorStop(0.5,'rgba(80,170,220,0.18)');gl.addColorStop(1,'rgba(80,170,220,0)');
  ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,40,0,7);ctx.fill();
  ctx.globalCompositeOperation='source-over';
  // bell
  ctx.fillStyle='rgba(150,240,240,0.85)';ctx.strokeStyle='rgba(220,255,255,0.9)';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.ellipse(0,0,bw,bh,0,Math.PI,0);ctx.lineTo(bw,2);
  for(let i=1;i<=5;i++){const px=bw-i*(bw*2/5);ctx.quadraticCurveTo(px+bw/5,7,px,2);}
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.ellipse(-bw*0.3,-bh*0.3,bw*0.3,bh*0.25,0,0,7);ctx.fill();
  // trailing tentacles
  ctx.strokeStyle='rgba(170,245,245,0.7)';ctx.lineWidth=1.4;ctx.lineCap='round';
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*bw*0.32,2);
    ctx.quadraticCurveTo(i*bw*0.32+Math.sin(t*2+i)*4,bh+14,i*bw*0.32+Math.sin(t*1.5+i)*6,bh+30);ctx.stroke();}
  ctx.restore();
}

/* a drifting pink moon jelly for the daytime — pretty, but it stings */
function drawMoonJelly(x,y,t){
  const pulse=1+Math.sin(t*1.8)*0.09, bw=15*pulse, bh=12;
  ctx.save();ctx.translate(x,y);
  ctx.lineJoin='round';ctx.lineCap='round';
  ctx.strokeStyle='rgba(232,167,200,.85)';ctx.lineWidth=2;
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*4,3);
    ctx.quadraticCurveTo(i*4+Math.sin(t*2+i)*4,15, i*5+Math.sin(t*2.4+i)*5,27);ctx.stroke();}
  inked(ctx,'#e8a7c8',2.2);
  ctx.beginPath();ctx.moveTo(-bw,1);ctx.quadraticCurveTo(-bw,-bh,0,-bh);ctx.quadraticCurveTo(bw,-bh,bw,1);
  ctx.quadraticCurveTo(bw*0.5,bh*0.42,0,bh*0.42);ctx.quadraticCurveTo(-bw*0.5,bh*0.42,-bw,1);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.ellipse(-bw*0.3,-bh*0.35,bw*0.3,bh*0.24,-0.4,0,7);ctx.fill();
  ctx.fillStyle='rgba(214,120,168,.55)';
  for(const[ox,oy]of[[-5,-4],[5,-4],[-2,-7],[3,-1]]){ctx.beginPath();ctx.arc(ox,oy,1.7,0,7);ctx.fill();}
  ctx.restore();
}
/* a flat folk dolphin, porpoising gently */
function drawDolphin(x,y,dir,t){
  const arc=Math.sin(t*2.2)*7;
  ctx.save();ctx.translate(x,y+arc);ctx.scale(dir,1);ctx.rotate(Math.cos(t*2.2)*0.1);
  ctx.lineJoin='round';ctx.lineCap='round';
  inked(ctx,'#7fa8c8',2.4);
  ctx.beginPath();ctx.moveTo(-24,0);
  ctx.quadraticCurveTo(-8,-13,10,-8);ctx.quadraticCurveTo(22,-4,28,1);
  ctx.quadraticCurveTo(18,7,2,8);ctx.quadraticCurveTo(-14,8,-24,0);ctx.closePath();fillStroke(ctx);
  ctx.beginPath();ctx.moveTo(-23,0);ctx.lineTo(-32,-8);ctx.lineTo(-27,0);ctx.lineTo(-32,7);ctx.closePath();fillStroke(ctx);
  ctx.beginPath();ctx.moveTo(2,-9);ctx.quadraticCurveTo(-2,-18,-8,-15);ctx.quadraticCurveTo(-4,-11,-1,-8);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='#d8e8f2';ctx.beginPath();ctx.ellipse(6,3,14,4,0.06,0,7);ctx.fill();
  ctx.fillStyle=MIN.ink;ctx.beginPath();ctx.arc(18,-2,1.7,0,7);ctx.fill();
  ctx.strokeStyle=MIN.ink;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(21,2,3.4,0.5,1.6);ctx.stroke();
  ctx.restore();
}
/* a yeo-rock shelf — a flat basalt ledge where buried catch can nestle */
function drawYeoShelf(sh,t){
  inked(ctx,'#2e5e88',2.6);
  ctx.beginPath();ctx.moveTo(sh.x,sh.y);
  for(let x=sh.x;x<=sh.x+sh.w;x+=18)ctx.lineTo(x,sh.y+Math.sin(x*0.11)*4);
  ctx.lineTo(sh.x+sh.w-16,sh.y+30);ctx.lineTo(sh.x+16,sh.y+32);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='#244e74';
  ctx.beginPath();ctx.ellipse(sh.x+sh.w*0.26,sh.y+1,14,6,0,Math.PI,0);ctx.fill();
  ctx.beginPath();ctx.ellipse(sh.x+sh.w*0.72,sh.y,18,8,0,Math.PI,0);ctx.fill();
  drawKelp(sh.x+10,sh.y+2,38,t,MIN.greenD);
  drawKelp(sh.x+sh.w-12,sh.y+2,32,t,MIN.green);
}
/* the sea cave mouth past the deepest yeo rocks — one pearl rests inside each day */
function drawSeaCave(t){
  if(typeof DCAVE==='undefined')return;
  const cx=DCAVE.x, base=BED+8;
  inked(ctx,'#1c3c5c',2.6);
  ctx.beginPath();ctx.moveTo(cx-58,base);ctx.quadraticCurveTo(cx-52,BED-78,cx-4,BED-80);
  ctx.quadraticCurveTo(W+12,BED-74,W+12,base);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='#07101e';
  ctx.beginPath();ctx.moveTo(cx-32,base);ctx.quadraticCurveTo(cx-28,BED-48,cx+2,BED-50);
  ctx.quadraticCurveTo(cx+32,BED-48,cx+36,base);ctx.closePath();ctx.fill();
  if(typeof G!=='undefined' && !G.caveToday){
    const tw=0.5+0.5*Math.sin(t*2.6);
    ctx.fillStyle=`rgba(240,235,255,${0.3+tw*0.55})`;ctx.beginPath();ctx.arc(cx+2,BED-26,2.4+tw*1.2,0,7);ctx.fill();
  }
}
/* an air vent — a cracked rock nub breathing a column of bubbles; hover in it to refill */
function drawAirVent(v,t){
  ctx.save();ctx.translate(v.x,v.y);
  inked(ctx,'#2b5680',2.2);ctx.beginPath();ctx.ellipse(0,0,13,7,0,Math.PI,0);fillStroke(ctx);
  ctx.fillStyle='#16304a';ctx.beginPath();ctx.ellipse(0,-5,4.5,2.4,0,0,7);ctx.fill();
  for(let i=0;i<7;i++){const p=((t*0.5+v.ph+i*0.14)%1);const by=-6-p*120;
    const bx=Math.sin((t+i)*2.2+v.ph)*6*p;
    ctx.fillStyle=`rgba(220,245,255,${0.55*(1-p)})`;
    ctx.beginPath();ctx.arc(bx,by,1.6+p*3.4,0,7);ctx.fill();}
  ctx.restore();
}
/* the sunken chest — one per dive, glinting until opened */
function drawChest(ch,t){
  ctx.save();ctx.translate(ch.x,ch.y);
  ctx.fillStyle='rgba(10,12,24,.2)';ctx.beginPath();ctx.ellipse(0,9,18,5,0,0,7);ctx.fill();
  if(ch.open){ inked(ctx,'#684a28',2.4);rr(ctx,-17,-22,34,10,4);fillStroke(ctx); }
  inked(ctx,'#7c5a32',2.4);rr(ctx,-16,-8,32,16,3);fillStroke(ctx);
  if(ch.open){ ctx.fillStyle='#2a1d0e';rr(ctx,-12,-6,24,7,2);ctx.fill(); }
  else {
    inked(ctx,'#8f6a3c',2.4);ctx.beginPath();ctx.moveTo(-16,-8);ctx.quadraticCurveTo(0,-18,16,-8);ctx.closePath();fillStroke(ctx);
    const tw=0.5+0.5*Math.sin(t*3);
    ctx.fillStyle=`rgba(240,189,76,${0.4+tw*0.5})`;ctx.beginPath();ctx.arc(0,-2,2.6,0,7);ctx.fill();
  }
  ctx.strokeStyle='#d8b25a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(-6,8);ctx.moveTo(6,-8);ctx.lineTo(6,8);ctx.stroke();
  ctx.restore();
}
function drawDive(){
  const t=performance.now()*0.001;
  const nt=nightAmt(G.time);
  const night = nt>0.4;                    // moonlit night dive (Dave-the-Diver style)
  const cam=(typeof dCamY!=='undefined')?dCamY:0;
  const depth01=Math.max(0,Math.min(1,(dv.y-SURF)/(BED-SURF)));
  // base fill (covers below the seabed when the camera reaches the bottom)
  ctx.fillStyle=night?'#040b13':'#0c2740'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(0,-cam);       // ---- world space: everything below scrolls with the camera ----
  // deep ocean — rich vertical gradient, sunlit shallows down to dark navy depths
  const og=ctx.createLinearGradient(0,SURF,0,BED);
  if(night){
    og.addColorStop(0,'#15324a');
    og.addColorStop(0.12,'#123048');
    og.addColorStop(0.30,'#10293f');
    og.addColorStop(0.52,'#0d2236');
    og.addColorStop(0.74,'#0a1b2c');
    og.addColorStop(0.90,'#07131f');
    og.addColorStop(1,'#040b13');
  } else {
    // the three rank zones, mint shallows → green junggun water → blue sanggun deep
    og.addColorStop(0,'#d6f1e2');
    og.addColorStop(0.12,'#aee4c8');
    og.addColorStop(0.25,'#92d8b6');
    og.addColorStop(0.32,'#7fc8c2');
    og.addColorStop(0.50,'#6aaad8');
    og.addColorStop(0.62,'#4e88c0');
    og.addColorStop(0.80,'#2f5f96');
    og.addColorStop(1,'#1b3f68');
  }
  ctx.fillStyle=og;ctx.fillRect(0,SURF,W,BED-SURF);
  // a soft sunlit pool just under the surface
  const sg=ctx.createRadialGradient(W/2,SURF,8,W/2,SURF,W*0.7);
  sg.addColorStop(0,'rgba(255,255,255,.28)');sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sg;ctx.fillRect(0,SURF,W,270);
  // sky band above surface (paper by day, deep indigo with moon + stars at night)
  ctx.fillStyle=night?'#1a2342':MIN.paper;ctx.fillRect(0,0,W,SURF);
  if(night){
    const rs=mulberry32(7);ctx.fillStyle='rgba(245,240,210,.9)';
    for(let i=0;i<26;i++){const sx=rs()*W, sy=rs()*(SURF-12)+2, r=rs()*1.1+0.4;
      ctx.globalAlpha=0.4+Math.abs(Math.sin(t*1.3+i))*0.6;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();}
    ctx.globalAlpha=1;
    // crescent moon
    ctx.fillStyle='#f3ecc8';ctx.beginPath();ctx.arc(404,34,15,0,7);ctx.fill();
    ctx.fillStyle='#1a2342';ctx.beginPath();ctx.arc(411,30,13,0,7);ctx.fill();
  } else {
    inked(ctx,MIN.verm,2);ctx.beginPath();ctx.arc(64,40,14,0,7);fillStroke(ctx); // sun disc
  }
  // folk waves at the surface
  const off=(t*8)%28;
  for(let x=-30;x<W+30;x+=28){motifWave(ctx,x-off,SURF+8+Math.sin(x*0.04+t)*2,1,MIN.blueL,MIN.white);}
  ctx.strokeStyle=MIN.white;ctx.lineWidth=2.5;ctx.beginPath();
  for(let x=0;x<=W;x+=10){const y=SURF+Math.sin(x*.06+t*1.8)*3;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
  // god rays — they reach only so far down before the blue swallows them
  ctx.save();ctx.beginPath();ctx.rect(0,SURF,W,620);ctx.clip();ctx.globalCompositeOperation='screen';
  for(let i=0;i<5;i++){const cx=((i*120+Math.sin(t*0.3+i)*40)%(W+120))-60;
    ctx.fillStyle='rgba(200,230,255,0.05)';ctx.beginPath();
    ctx.moveTo(cx,SURF);ctx.lineTo(cx+24,SURF);ctx.lineTo(cx+90,SURF+620);ctx.lineTo(cx-46,SURF+620);ctx.closePath();ctx.fill();}
  ctx.restore();
  // seabed — flat ink-outlined rocks
  inked(ctx,'#356894',2.6);
  ctx.beginPath();ctx.moveTo(0,BED);
  for(let x=0;x<=W;x+=22)ctx.lineTo(x,BED+Math.sin(x*.08)*5);ctx.lineTo(W,BED+96);ctx.lineTo(0,BED+96);ctx.closePath();fillStroke(ctx);
  ctx.fillStyle='#2b5680';
  for(const rk of [[60,BED-4,16],[180,BED+2,22],[300,BED-2,18],[420,BED+4,24],[540,BED-3,20],[660,BED+3,24],[780,BED-4,18],[884,BED+2,22]]){
    ctx.beginPath();ctx.ellipse(rk[0],rk[1],rk[2],rk[2]*0.6,0,Math.PI,0);ctx.fill();}
  // kelp
  drawKelp(40,BED,90,t,MIN.greenD);drawKelp(120,BED,70,t,MIN.green);
  drawKelp(360,BED,100,t,MIN.greenD);drawKelp(440,BED,80,t,MIN.green);
  drawKelp(600,BED,96,t,MIN.greenD);drawKelp(690,BED,72,t,MIN.green);
  drawKelp(840,BED,100,t,MIN.greenD);drawKelp(916,BED,78,t,MIN.green);
  // mid-water yeo-rock shelves on the way down
  if(typeof DSHELVES!=='undefined') for(const sh of DSHELVES) drawYeoShelf(sh,t);
  // the sea cave in the deepest corner
  drawSeaCave(t);
  // air vents & the sunken chest
  if(typeof dVents!=='undefined') for(const v of dVents) drawAirVent(v,t);
  if(typeof dChest!=='undefined' && dChest) drawChest(dChest,t);
  // ---- the rank-zone boundaries: dashed lines at 5 m and 10 m, with a tag per zone ----
  {
    const Z5=SURF+(BED-SURF)*0.25, Z10=SURF+(BED-SURF)*0.5;
    ctx.save();
    ctx.setLineDash([12,9]);ctx.strokeStyle=night?'rgba(150,190,225,.3)':'rgba(18,52,88,.45)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,Z5);ctx.lineTo(W,Z5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,Z10);ctx.lineTo(W,Z10);ctx.stroke();
    ctx.setLineDash([]);
    const zoneTag=(txt,y)=>{
      ctx.font='700 13px "Space Mono",monospace';
      const tw=ctx.measureText(txt).width+20;
      ctx.fillStyle='rgba(8,24,40,.45)';rr(ctx,W-14-tw,y-13,tw,26,9);ctx.fill();
      ctx.strokeStyle='rgba(244,236,217,.35)';ctx.lineWidth=1.2;rr(ctx,W-14-tw,y-13,tw,26,9);ctx.stroke();
      ctx.fillStyle='rgba(244,236,217,.92)';ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.fillText(txt,W-14-tw+10,y+1);
    };
    zoneTag('HAGUN · 0–5 m',SURF+40);
    zoneTag('JUNGGUN · 5–10 m',Z5+28);
    zoneTag('SANGGUN · 10–20 m',Z10+28);
    ctx.restore();
  }
  // tewak float on surface
  ctx.fillStyle='rgba(10,12,24,.15)';ctx.beginPath();ctx.ellipse(W/2,SURF+2,18,4,0,0,7);ctx.fill();
  inked(ctx,MIN.verm,2.4);ctx.beginPath();ctx.ellipse(W/2,SURF-5,16,12,0,0,7);fillStroke(ctx);
  ctx.fillStyle=MIN.white;ctx.beginPath();ctx.ellipse(W/2-4,SURF-9,4,2.5,0,0,7);ctx.fill();
  ctx.strokeStyle='rgba(40,30,20,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(W/2,SURF+6);ctx.lineTo(W/2+4,SURF+40);ctx.stroke();
  // ambient fish, scattered down the whole water column
  for(let i=0;i<11;i++){const dir=i%2?1:-1;const span=W+80, raw=(performance.now()*0.018*dir)+i*150;
    const px=((raw%span)+span)%span-40; const fy=SURF+70+i*138+Math.sin(t*0.7+i)*12;
    if(fy<BED-30) drawMiniFish(px,fy,dir,t+i);}
  { const dir=Math.sin(t*0.12)>0?1:-1; const cx=W*0.5+Math.sin(t*0.18)*W*0.42; const cy=SURF+150+Math.sin(t*0.3)*40;
    for(let i=0;i<7;i++){const ox=Math.cos(i*1.3)*22+(i-3)*10, oy=Math.sin(i*1.7)*12;
      drawMiniFish(cx+ox*dir, cy+oy+Math.sin(t*1.5+i)*3, dir, t+i*0.5);} }
  // ---- larger ambient sea life: a turtle gliding the mid-water, a manta in the deep ----
  { const span=W+160, tx=(((performance.now()*0.012)%span)+span)%span-80;
    drawDiveTurtle(tx, SURF+(BED-SURF)*0.30+Math.sin(t*0.5)*20, 1, t); }
  { const span=W+200, mx=(((-performance.now()*0.009)%span)+span)%span-100;
    drawMantaRay(mx, SURF+(BED-SURF)*0.66+Math.sin(t*0.4)*16, -1, t); }
  // starfish resting on the yeo-rock shelves
  if(typeof DSHELVES!=='undefined'){ const cols=['#e8814a','#d35a72','#e0a836','#c97f3a'];
    for(let i=0;i<DSHELVES.length;i++){ const sh=DSHELVES[i]; drawStarfish(sh.x+20+(i*29)%Math.max(18,(sh.w||60)-34), sh.y-5, cols[i%4]); } }
  // drifting moon jellies — beautiful, but they sting (glowing on night dives)
  if(typeof dJellies!=='undefined') for(const j of dJellies){
    if(night) drawGlowJelly(j.x,j.y,t+j.ph); else drawMoonJelly(j.x,j.y,t+j.ph);
  }
  // a passing dolphin pod — swim close for a rich-harvest omen
  if(typeof dPod!=='undefined' && dPod){
    for(let i=0;i<3;i++) drawDolphin(dPod.x-i*dPod.dir*46, dPod.y+(i%2?14:-6), dPod.dir, t+i*0.4);
  }
  // a rescued animal returned to swim alongside — soft glow + a couple of little hearts
  if(typeof dCompanion!=='undefined' && dCompanion){ const C=dCompanion, a=Math.min(1,C.t*1.5);
    ctx.save(); ctx.globalAlpha=a;
    ctx.save(); ctx.globalCompositeOperation='screen';
    const gg=ctx.createRadialGradient(C.x,C.y,4,C.x,C.y,48); gg.addColorStop(0,'rgba(160,240,225,.45)'); gg.addColorStop(1,'rgba(160,240,225,0)');
    ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(C.x,C.y,48,0,7); ctx.fill(); ctx.restore();
    if(C.kind==='turtle') drawDiveTurtle(C.x,C.y,C.dir,t); else drawDolphin(C.x,C.y,C.dir,t);
    ctx.fillStyle='#ff9ec4';
    for(let i=0;i<2;i++){ const hp=(C.t*0.6+i*0.5)%1, hx=C.x+(i?9:-9), hy=C.y-14-hp*22; ctx.globalAlpha=a*(1-hp);
      ctx.beginPath(); ctx.moveTo(hx,hy+2.4); ctx.bezierCurveTo(hx-3.2,hy-0.6,hx-1.5,hy-3.2,hx,hy-1.3); ctx.bezierCurveTo(hx+1.5,hy-3.2,hx+3.2,hy-0.6,hx,hy+2.4); ctx.fill(); }
    ctx.restore(); ctx.globalAlpha=1;
  }
  // marine snow
  ctx.save();ctx.globalCompositeOperation='screen';
  for(let i=0;i<90;i++){const sx=((i*97.3+Math.sin(t*0.2+i)*30)%W+W)%W;
    const sy=SURF+((i*53.7-t*7*((i%3)+1)*0.4)%(BED-SURF)+(BED-SURF))%(BED-SURF);
    ctx.fillStyle=`rgba(220,235,255,${0.05+0.06*((i%5)/5)})`;
    ctx.beginPath();ctx.arc(sx,sy,0.7+(i%3)*0.5,0,7);ctx.fill();}
  ctx.restore();
  // creatures
  for(const c of dCreatures) drawCreature(c,t);
  // particles
  for(const p of dParts){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,3,0,7);ctx.fill();ctx.globalAlpha=1;}
  // bubbles
  ctx.fillStyle='rgba(220,245,255,.5)';for(const b of dBubbles){ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();}
  // dash burst — speed lines streaming behind the diver
  if(typeof dDash!=='undefined' && dDash>0){
    const ta=Math.atan2(dv.vy,dv.vx);
    ctx.save();ctx.translate(dv.x,dv.y);ctx.rotate(ta);
    ctx.strokeStyle='rgba(220,245,255,.5)';ctx.lineWidth=2;ctx.lineCap='round';
    for(const o of [-10,0,10]){ctx.beginPath();ctx.moveTo(-18,o*0.6);ctx.lineTo(-46,o);ctx.stroke();}
    ctx.restore();
  }
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
    // harvesting tool in hand — visibly upgrades hook → homi → bitchang
    {
      const ti=(typeof G!=='undefined')?G.toolIdx:0;
      ctx.save();ctx.translate(R*0.84,R*1.12);ctx.rotate(0.35);
      if(ti>=2){
        // bitchang — long iron pry-bar
        ctx.strokeStyle='#8f6a3c';ctx.lineWidth=3.4;ctx.beginPath();ctx.moveTo(0,-R*0.2);ctx.lineTo(0,R*0.5);ctx.stroke();
        ctx.strokeStyle='#cfd3d8';ctx.lineWidth=3.4;ctx.beginPath();ctx.moveTo(0,R*0.5);ctx.lineTo(0,R*1.55);ctx.stroke();
        ctx.lineWidth=3;ctx.beginPath();ctx.arc(-R*0.16,R*1.55,R*0.17,-0.2,Math.PI*0.8);ctx.stroke();
      } else if(ti>=1){
        // homi — short hoe with an angled iron blade
        ctx.strokeStyle='#9c6a3a';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(0,-R*0.1);ctx.lineTo(0,R*0.9);ctx.stroke();
        ctx.fillStyle='#b8bcc0';ctx.strokeStyle=OL;ctx.lineWidth=1.6;
        ctx.beginPath();ctx.moveTo(0,R*0.9);ctx.lineTo(-R*0.5,R*1.08);ctx.lineTo(-R*0.32,R*1.24);ctx.lineTo(0,R*1.04);ctx.closePath();fillStroke(ctx);
      } else {
        // bare hands — just a small simple hook
        ctx.strokeStyle='#9c6a3a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-R*0.1);ctx.lineTo(0,R*0.7);ctx.stroke();
        ctx.strokeStyle='#b8bcc0';ctx.lineWidth=2.6;ctx.beginPath();ctx.arc(-R*0.18,R*0.72,R*0.2,-0.3,Math.PI*0.95);ctx.stroke();
      }
      ctx.restore();
    }
    // hood
    inked(ctx,HOOD,2.4);ctx.beginPath();ctx.arc(0,R*0.96,R*0.82,0,7);fillStroke(ctx);
    // pink face
    ctx.fillStyle='#f3c9a8';ctx.beginPath();ctx.arc(0,R*1.06,R*0.46,0,7);ctx.fill();
    // traditional single-lens haenyeo mask: pink rubber frame, silver rim, amber lens
    const mcy=R*1.02, mr=R*0.37;
    ctx.strokeStyle='#c77fa6';ctx.lineWidth=R*0.11;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-mr,mcy);ctx.quadraticCurveTo(-R*0.62,mcy-R*0.16,-R*0.64,mcy+R*0.2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mr,mcy);ctx.quadraticCurveTo(R*0.62,mcy-R*0.16,R*0.64,mcy+R*0.2);ctx.stroke();
    ctx.fillStyle='#d98ab0';ctx.strokeStyle=OL;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,mcy,mr,0,7);fillStroke(ctx);
    ctx.strokeStyle='#cdd2d8';ctx.lineWidth=Math.max(1.4,R*0.06);ctx.beginPath();ctx.arc(0,mcy,mr*0.8,0,7);ctx.stroke();
    const lensCol=['#f0883a','#6fb3c0','#a7dcec'][(typeof G!=='undefined'?G.maskIdx:0)||0];
    ctx.fillStyle=lensCol;ctx.beginPath();ctx.arc(0,mcy,mr*0.66,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,240,210,.6)';ctx.beginPath();ctx.ellipse(-mr*0.26,mcy-mr*0.3,mr*0.28,mr*0.16,-0.5,0,7);ctx.fill();
    ctx.restore();
  }
  ctx.restore();                            // ---- back to screen space ----
  const dsx=dv.x, dsy=dv.y-cam;
  // limited underwater sight — the mask sets how far you see, and the deep is murkier still
  {
    const clarity=Math.max(70,maskVis()*(1-depth01*0.22));
    const edge = night ? '6,14,30' : (nt>0.2 ? '10,18,44' : '12,38,66');
    const murkA = Math.min(0.92,(night ? 0.80 : (nt>0.2 ? 0.52 : 0.36)) + depth01*0.28);
    const wy=Math.max(0,SURF-cam);
    const mg=ctx.createRadialGradient(dsx,dsy,Math.max(10,clarity*0.42), dsx,dsy,clarity);
    mg.addColorStop(0,`rgba(${edge},0)`);
    mg.addColorStop(1,`rgba(${edge},${murkA})`);
    ctx.fillStyle=mg;ctx.fillRect(0,wy,W,H-wy);
  }
  // the diver's headlamp cuts a bright cone through the dark — at night, or down in the deep
  if(night||depth01>0.55){
    let la=(Math.hypot(dv.vx,dv.vy)>0.3)?Math.atan2(dv.vy,dv.vx):Math.PI/2;
    ctx.save();ctx.globalCompositeOperation='screen';
    ctx.translate(dsx,dsy);ctx.rotate(la);
    const len=200, spread=0.46;
    const cg=ctx.createLinearGradient(0,0,len,0);
    cg.addColorStop(0,'rgba(255,238,180,0.40)');
    cg.addColorStop(0.5,'rgba(205,225,175,0.15)');
    cg.addColorStop(1,'rgba(170,215,200,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(-spread)*len,Math.sin(-spread)*len);
    ctx.lineTo(Math.cos(spread)*len,Math.sin(spread)*len);
    ctx.closePath();ctx.fill();
    const hot=ctx.createRadialGradient(0,0,2,0,0,34);
    hot.addColorStop(0,'rgba(255,246,205,0.55)');hot.addColorStop(1,'rgba(255,246,205,0)');
    ctx.fillStyle=hot;ctx.beginPath();ctx.arc(0,0,34,0,7);ctx.fill();
    ctx.restore();
  }
  // low-air warning — the edges of sight pulse red
  if(dv.y>SURF+4 && dBreath/maxBreath()<0.25){
    const pl=0.5+0.5*Math.sin(t*5);
    const vg=ctx.createRadialGradient(W/2,H/2,H*0.32,W/2,H/2,H*0.72);
    vg.addColorStop(0,'rgba(160,30,30,0)');vg.addColorStop(1,`rgba(160,30,30,${0.16+pl*0.14})`);
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  }
  // (net count lives in the dive HUD sidebar now)
  if(dSumbi>0){ctx.globalAlpha=Math.min(1,dSumbi);glabel('whew! (gasp)',dv.x,SURF-14-cam,20,MIN.white);ctx.globalAlpha=1;}
  // the sumbisori beat — tap (or Space) as the closing white ring meets the gold one
  if(typeof dBeat!=='undefined' && dBeat.active){
    const sweet=dBeat.p>=0.3&&dBeat.p<=0.74;
    ctx.save();ctx.lineCap='round';
    ctx.strokeStyle=sweet?'#ffd986':'rgba(240,189,76,.75)';ctx.lineWidth=sweet?4:3;
    ctx.setLineDash([7,6]);ctx.beginPath();ctx.arc(dsx,dsy,24,0,7);ctx.stroke();ctx.setLineDash([]);
    const r=64-46*dBeat.p;
    ctx.strokeStyle=sweet?'#fff':'rgba(255,255,255,.85)';ctx.lineWidth=sweet?4:2.5;
    ctx.beginPath();ctx.arc(dsx,dsy,r,0,7);ctx.stroke();
    ctx.restore();
    glabel('sumbisori! — tap',dsx,dsy-72,16,MIN.white);
  }
}

/* ---------------- PORTRAIT (silk medallion) ---------------- */
function drawPortrait(n){
  const p=$('portrait'); const S=54;
  p.width=Math.round(S*DPR);p.height=Math.round(S*DPR);
  const x=p.getContext('2d');x.setTransform(DPR,0,0,DPR,0,0);x.clearRect(0,0,S,S);
  const L=n.look||{};
  const skin=L.skin||n.skin, hair=L.hair||'#241f1b', topc=L.top||n.scarf;
  const cx=S/2, cy=S/2-1, R=15;
  // silk ground
  x.fillStyle=MIN.paper2;x.fillRect(0,0,S,S);
  x.fillStyle='rgba(120,90,40,.06)';for(let i=0;i<40;i++){x.fillRect((i*13)%S,(i*7)%S,2,1);}
  // shoulders / clothing
  x.fillStyle=topc;x.beginPath();x.ellipse(cx,S+6,20,16,0,0,7);x.fill();
  if(L.vest){ x.fillStyle=L.vest;
    x.beginPath();x.moveTo(cx-20,S);x.lineTo(cx-7,S-2);x.lineTo(cx-9,S+12);x.lineTo(cx-20,S+12);x.closePath();x.fill();
    x.beginPath();x.moveTo(cx+20,S);x.lineTo(cx+7,S-2);x.lineTo(cx+9,S+12);x.lineTo(cx+20,S+12);x.closePath();x.fill(); }
  // neck
  x.fillStyle=shade(skin,-14);x.fillRect(cx-5,cy+6,10,8);
  // hair behind (bun / ponytail)
  if(!L.hood){
    if(L.hairStyle==='bun'){x.fillStyle=hair;x.beginPath();x.arc(cx,cy-R-3,6,0,7);x.fill();}
    else if(L.hairStyle==='ponytail'){x.fillStyle=hair;x.beginPath();x.ellipse(cx-R+2,cy+2,5,10,0.3,0,7);x.fill();}
  }
  // face
  x.fillStyle=skin;x.strokeStyle=MIN.ink;x.lineWidth=1.6;x.beginPath();x.arc(cx,cy,R,0,7);x.fill();x.stroke();
  // headscarf OR hair cap
  if(L.scarf){
    x.fillStyle=L.scarf;x.beginPath();x.arc(cx,cy-2,R+1.5,Math.PI*1.02,-Math.PI*0.02);x.quadraticCurveTo(cx,cy-4,cx-(R+1.5),cy-2);x.closePath();x.fill();x.stroke();
    if(L.floral){x.fillStyle='rgba(255,255,255,.8)';for(const[dx,dy]of[[-6,-9],[5,-11],[-1,-6]]){x.beginPath();x.arc(cx+dx,cy+dy,1.4,0,7);x.fill();}}
  } else {
    const hl=(L.male||L.hairStyle==='short')?cy-7:cy-3;
    x.fillStyle=hair;x.beginPath();
    x.moveTo(cx-R*0.98,cy-1);x.quadraticCurveTo(cx-R-2,cy-R,cx,cy-R-2.5);x.quadraticCurveTo(cx+R+2,cy-R,cx+R*0.98,cy-1);
    x.quadraticCurveTo(cx+R*0.5,hl,cx,hl);x.quadraticCurveTo(cx-R*0.5,hl,cx-R*0.98,cy-1);x.closePath();x.fill();x.stroke();
    if(L.hairStyle==='bob'){x.fillStyle=hair;x.fillRect(cx-R-1,cy-2,4,16);x.fillRect(cx+R-3,cy-2,4,16);}
  }
  // eyes
  x.fillStyle=MIN.ink;x.beginPath();x.arc(cx-5,cy+1,2,0,7);x.arc(cx+5,cy+1,2,0,7);x.fill();
  if(L.glasses){x.strokeStyle=MIN.ink;x.lineWidth=1.4;x.beginPath();x.arc(cx-5,cy+1,3.4,0,7);x.arc(cx+5,cy+1,3.4,0,7);x.stroke();x.beginPath();x.moveTo(cx-1.6,cy+1);x.lineTo(cx+1.6,cy+1);x.stroke();}
  x.fillStyle='rgba(214,80,47,.4)';x.beginPath();x.arc(cx-8,cy+6,2.6,0,7);x.arc(cx+8,cy+6,2.6,0,7);x.fill();
  x.strokeStyle='rgba(120,50,40,.7)';x.lineWidth=1.4;x.beginPath();x.arc(cx,cy+5,3.4,.2,Math.PI-.2);x.stroke();
  if(L.mustache){x.strokeStyle=hair;x.lineWidth=2;x.lineCap='round';x.beginPath();x.moveTo(cx-4,cy+7);x.quadraticCurveTo(cx,cy+9,cx+4,cy+7);x.stroke();}
  if(L.elder){x.strokeStyle='rgba(74,58,44,.4)';x.lineWidth=1;x.beginPath();x.moveTo(cx-8,cy-2.5);x.lineTo(cx-5.5,cy-1.6);x.moveTo(cx+5.5,cy-1.6);x.lineTo(cx+8,cy-2.5);x.stroke();}
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
/* preload interior backdrops right away so first entry isn't laggy */
setTimeout(()=>{ ensureShopImg(); ensureMuseumImg(); }, 0);
