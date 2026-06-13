/* ============================================================================
   해녀의 부엌 — Haenyeo's Kitchen  (the evening half of the Dave-the-Diver loop)
   ----------------------------------------------------------------------------
   Loaded after game.js + the renderer, so it shares their globals:
     cv, ctx, W, H, G, scene, SPECIES, P, joy, keys, tone, toast, $,
     speciesById, catchSaleValue, removeBestCatch, starStr, starMult,
     and the renderer helpers rr / inked / fillStroke / shade / MIN.

   Flow:  bulteok (evening) → plan menu (#pMenu) → 'kitchen' scene service
          → close up → tally (#pKitchen) → back to the village.
   The day clock is paused while the scene is 'kitchen' (game.js leaves
   'kitchen' out of the tickClock allowlist).
   ============================================================================ */
(function(){
'use strict';

/* ---- dishes: each made from today's catch; freshest catch → finest plates ---- */
const DISHES=[
  {id:'sora',   kr:'소라무침',   name:'Spiced conch',          ing:{conch:1},             price:60,  col:'#9c6b3a'},
  {id:'haemul', kr:'해물라면',   name:'Seafood ramyeon',       ing:{seaweed:1,conch:1},   price:78,  col:'#e0723a'},
  {id:'haesam', kr:'해삼초무침', name:'Sea-cucumber salad',    ing:{cucumber:1},          price:88,  col:'#6f8154'},
  {id:'seong',  kr:'성게미역국', name:'Urchin & seaweed soup', ing:{urchin:1,seaweed:1},  price:96,  col:'#caa24a'},
  {id:'jeonbok',kr:'전복죽',     name:'Abalone porridge',      ing:{abalone:1},           price:132, col:'#6f9ab2'},
  {id:'muneo',  kr:'문어숙회',   name:'Boiled octopus',        ing:{octopus:1},           price:152, col:'#e0533a'},
];
function dishById(id){ return DISHES.find(d=>d.id===id); }

/* ---- guests are drawn with the village NPC sprite (drawPerson), so they match
   the rest of the cast. Each gets a randomized everyday look on arrival. ---- */
const G_SKIN=['#f1cba2','#eccaa2','#e3c4a0','#e7c9a0','#e3bd96','#d9b890'];
const G_HAIR=['#241f1b','#2a2220','#3a2c22','#1f1a17'];
const G_TOP =['#3a6e8c','#c0506e','#6aa647','#c9803a','#b85a48','#3a6e5a','#5a6e9c','#9c6a3a','#7c5a9c'];
const G_BOT =['#37343d','#4a4a52','#3a3530','#444049'];
const G_HS  =['ponytail','bun','bob','short'];
function rpick(a){ return a[Math.floor(Math.random()*a.length)]; }
function makeGuestLook(){
  const skin=rpick(G_SKIN);
  const L={ hairStyle:rpick(G_HS), hair:rpick(G_HAIR), top:rpick(G_TOP), bottom:rpick(G_BOT), skin:skin };
  const r=Math.random();
  if(r<0.18){ L.elder=true; L.hair='#b8b0a4'; }                  // a grey-haired elder
  else if(r<0.34){ L.male=true; L.hairStyle='short'; if(Math.random()<0.5) L.mustache=true; }
  if(Math.random()<0.22) L.glasses=true;
  if(Math.random()<0.30 && typeof MIN!=='undefined') L.scarf=rpick([MIN.verm,MIN.gold,MIN.teal,MIN.plum,MIN.blue]);
  return { skin, look:L, face:(Math.random()<0.5?1:-1) };
}

/* ---- renown → rank: gates how many guests come and how much they tip ---- */
const RANKS=[
  {name:'Shore Stall',      need:0,    guests:5,  rep:'소문 없음'},
  {name:'Village Favorite', need:350,  guests:7,  rep:'동네 단골'},
  {name:'Famed 부엌',        need:1100, guests:9,  rep:'소문난 집'},
  {name:'Island Legend',    need:2600, guests:12, rep:'제주 명소'},
];
function rankIdx(){ let i=0; for(let k=0;k<RANKS.length;k++) if((G.renown||0)>=RANKS[k].need) i=k; return i; }
function rankName(){ return RANKS[rankIdx()].name; }
function guestQuota(){ return RANKS[rankIdx()].guests; }

/* ---- kitchen geometry, aligned to the kitchen_bg.png 포장마차 art ----
   The counter (the pass) runs across the upper-middle of the tent; the open
   wooden floor below it is where the diver walks and guests are seated. */
const FLOOR={x0:60,y0:415,x1:905,y1:580};          // walkable wooden floor in front of the bar
const rCounter={x:405, y:360, w:560};              // the pass — walk up to it to take a plate
const rBanchan={x:108, y:452};                     // 반찬 crock by the fish tank (bottom-left)
// two dining sets (table + 3 stools each), 포장마차 style
const DINING_TABLES=[{x:312,y:520},{x:648,y:520}];
const rTables=[                                    // the 6 stool seats around the two tables
  {x:240,y:506},{x:312,y:558},{x:384,y:506},
  {x:576,y:506},{x:648,y:558},{x:720,y:506}
];
/* the seaside-stall backdrop (generated art); drawn full-frame behind the sprites */
let kitchenImg=null;
(function(){ const im=new Image(); im.onload=()=>{ kitchenImg=im; }; im.src='kitchen_bg.png?v=1'; })();

/* ---- service state ---- */
let rP={x:W/2, y:380, r:13, face:1, kick:0};       // the diver, now waitress, on the floor
let rPlates=[];        // plates cooked tonight, waiting on the pass: {dish, stars}
let rMenuSel={};       // dish id -> selected for tonight
let rGuests=[];        // seated guests
let rCarry=null;       // the plate in hand, or null
let rToSpawn=0, rSpawnT=0;
let rEarned=0, rServed=0, rLeft=0, rTips=0;
let rBan=1;            // 반찬 supply level 0..1
let rPour=null;        // active tea-pour minigame, or null
let rParts=[];         // little particles (hearts, sparkles)
let rEndedToast=false;

/* =========================== ENTRY · PLAN THE MENU ========================= */
function enterRestaurant(){
  // build the plan panel from whatever catch is on hand
  rMenuSel={};
  buildMenuPanel();
  scene='panel'; panelBg='village';
  $('prompt').classList.remove('show');
  $('pMenu').classList.remove('hidden');
}
window.enterRestaurant=enterRestaurant;   // game.js calls this from the bulteok

function dishMakeable(d){
  let n=Infinity;
  for(const ing in d.ing) n=Math.min(n, Math.floor((G.catch[ing]||0)/d.ing[ing]));
  return n===Infinity?0:n;
}
function buildMenuPanel(){
  $('menuRank').textContent=rankName()+' · '+(RANKS[rankIdx()].rep);
  const list=$('menuList'); list.innerHTML='';
  let anyMakeable=false;
  for(const d of DISHES){
    const can=dishMakeable(d);
    const ingTxt=Object.keys(d.ing).map(k=>{const s=speciesById(k);return (s?s.name:k)+(d.ing[k]>1?'×'+d.ing[k]:'');}).join(' + ');
    const row=document.createElement('div'); row.className='scard';
    if(can<=0){ row.style.opacity='.45'; }
    else anyMakeable=true;
    const sel=!!rMenuSel[d.id];
    row.innerHTML=
      `<div class="sicon" style="background:${d.col}22"><span style="font-size:20px">🍲</span></div>`+
      `<div class="meta"><div class="t">${d.kr} · ${d.name}</div>`+
      `<div class="d">${ingTxt} · ${d.price} won · up to ${can}</div></div>`+
      `<button class="btn ${sel?'coral':'ghost'}" data-d="${d.id}" ${can<=0?'disabled':''}>${sel?'On menu':'Add'}</button>`;
    const btn=row.querySelector('button');
    if(can>0) btn.onclick=()=>{ rMenuSel[d.id]=!rMenuSel[d.id]; buildMenuPanel(); };
    list.appendChild(row);
  }
  const note=$('menuNote'), openBtn=$('menuOpen');
  if(!anyMakeable){ note.textContent='Your basket is empty — dive first, then come cook tonight.'; openBtn.style.display='none'; }
  else { note.textContent='Pick tonight’s dishes. The freshest (★★★) catch is plated first.'; openBtn.style.display=''; }
}
$('menuClose').onclick=()=>{ $('pMenu').classList.add('hidden'); scene='village'; };
$('menuOpen').onclick=()=>{
  const chosen=Object.keys(rMenuSel).filter(id=>rMenuSel[id] && dishMakeable(dishById(id))>0);
  if(!chosen.length){ toast('Choose at least one dish'); return; }
  cookPlates(chosen);
  if(!rPlates.length){ toast('No plates could be made'); return; }
  $('pMenu').classList.add('hidden');
  startService();
};

/* turn the chosen dishes into plates, spending the best catch first (premium plates) */
function cookPlates(chosenIds){
  rPlates=[];
  for(const id of chosenIds){
    const d=dishById(id); const n=dishMakeable(d);
    for(let k=0;k<n;k++){
      let sum=0,cnt=0;
      for(const ing in d.ing){ for(let j=0;j<d.ing[ing];j++){ const st=removeBestCatch(ing); if(st){sum+=st;cnt++;} } }
      const stars=cnt?Math.max(1,Math.min(3,Math.round(sum/cnt))):2;
      rPlates.push({dish:d, stars});
    }
  }
  // best plates to the front of the pass
  rPlates.sort((a,b)=> (b.dish.price*starMult(b.stars)) - (a.dish.price*starMult(a.stars)) );
}

/* ============================ SERVICE (the floor) ========================= */
function startService(){
  if(typeof spendEnergy==='function') spendEnergy('kitchen');   // a night on the floor is tiring
  scene='kitchen';
  rP.x=W/2; rP.y=510; rP.face=1; rP.kick=0;
  rGuests=[]; rCarry=null; rPour=null; rParts=[];
  rEarned=0; rServed=0; rLeft=0; rTips=0; rBan=1; rEndedToast=false;
  rToSpawn=Math.min(guestQuota(), rPlates.length);     // never seat more guests than we can plate
  rSpawnT=0.6;
  $('kitchenHud').classList.add('show');
  $('kitchenDoneBtn').classList.add('show');
  $('prompt').classList.remove('show');
  toast('Open! Serve the guests their plates 🍲');
}

function freeSeats(){ const used=new Set(rGuests.map(g=>g.seat)); const f=[]; for(let i=0;i<rTables.length;i++) if(!used.has(i)) f.push(i); return f; }
function spawnGuest(){
  const seats=freeSeats(); if(!seats.length) return false;
  const seat=seats[Math.floor(Math.random()*seats.length)];
  const look=makeGuestLook();
  rGuests.push({ seat, state:'waiting', wait:0, patience:20+Math.random()*10,
                 plate:null, wantsTea:false, teaDone:true, bob:0, bobPhase:Math.random()*6.28, joy:0,
                 skin:look.skin, look:look.look, face:look.face });
  return true;
}

function nearestWaitingGuest(){   // a seated guest still needing a plate, nearest to the diver
  let best=null,bd=1e9;
  for(const g of rGuests){ if(g.state!=='waiting') continue;
    const t=rTables[g.seat]; const d=Math.hypot(rP.x-t.x,rP.y-t.y);
    if(d<bd){bd=d;best=g;} }
  return {g:best,d:bd};
}

function pickUpPlate(){
  if(rCarry||!rPlates.length) return;
  // grab the most valuable plate left on the pass
  rCarry=rPlates.shift();
  tone(560,.06,'triangle',.05);
}

function serveGuest(g){
  if(!rCarry) return;
  if(rBan<=0.001){ if(toastCd<=0){toast('반찬 ran out — refill at the side station!');toastCd=2;} return; }
  // serving a dish is immediate — no tea pour required
  finishServe(g);
}
function finishServe(g){
  const plate=rCarry; rCarry=null;
  rBan=Math.max(0, rBan-0.16);                          // each dish spends some 반찬
  let pay=Math.round(plate.dish.price*starMult(plate.stars));
  let bonus=0;
  if(g.teaPour!=null){ if(g.teaPour>=0.78){ bonus=Math.round(pay*0.30); g.joy=1; } }
  pay+=bonus;
  rEarned+=pay; rTips+=bonus; rServed++;
  g.state='served'; g.plate=plate; g.served=1.0;
  G.renown=(G.renown||0) + Math.round(6*starMult(plate.stars)) + (bonus?4:0);
  const t=rTables[g.seat];
  for(let i=0;i<10;i++) rParts.push({x:t.x,y:t.y-26,vx:(Math.random()-.5)*2.4,vy:-Math.random()*2.4-0.4,life:1,c:bonus?'#5cbfb0':'#f0bd4c',heart:i<3});
  tone(bonus?880:720,.16,'sine',.06);
  if(bonus) toast('Perfect tea! +'+pay+' won (with tip)'); else toast('+'+pay+' won');
}

/* ---- tea pour minigame: tap once to lock the rising fill near the gold line ---- */
function startPour(g){ rPour={g, level:0, dir:1, locked:false, t:0}; tone(420,.1,'sine',.04); }
function lockPour(){
  if(!rPour||rPour.locked) return;
  rPour.locked=true;
  const target=0.82, miss=Math.abs(rPour.level-target);
  const quality=Math.max(0, 1-miss/0.5);               // 1 = bang on the line
  const g=rPour.g; g.teaDone=true; g.teaPour=quality;
  setTimeout(()=>{ if(rPour&&rPour.g===g){ rPour=null; finishServe(g); } }, 260);
}
// game.js routes kitchen canvas taps here
function restaurantTap(p){ if(rPour&&!rPour.locked) lockPour(); }
window.restaurantTap=restaurantTap;

let toastCd=0;
function updateRestaurant(dt){
  toastCd-=dt; if(toastCd<0)toastCd=0;
  // particles
  for(const p of rParts){ p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=dt*1.3; } rParts=rParts.filter(p=>p.life>0);

  // ---- the tea pour pauses the floor ----
  if(rPour){
    if(!rPour.locked){ rPour.t+=dt; rPour.level+=rPour.dir*dt*0.85; if(rPour.level>=1){rPour.level=1;rPour.dir=-1;} if(rPour.level<=0){rPour.level=0;rPour.dir=1;} }
    updateHud(); return;
  }

  // ---- spawn guests over the night ----
  if(rToSpawn>0){ rSpawnT-=dt; if(rSpawnT<=0){ if(spawnGuest()) rToSpawn--; rSpawnT=2.2+Math.random()*2.2; } }

  // ---- move the diver (joystick or arrows), reuse the village feel ----
  let mx=0,my=0;
  if(keys['arrowleft']||keys['a'])mx-=1; if(keys['arrowright']||keys['d'])mx+=1;
  if(keys['arrowup']||keys['w'])my-=1; if(keys['arrowdown']||keys['s'])my+=1;
  if(joy.on&&joy.moved){ const m=Math.hypot(joy.dx,joy.dy)||1; if(m>10){mx+=joy.dx/m;my+=joy.dy/m;} }
  const m=Math.hypot(mx,my); rP.moving=m>0; if(m>0){ mx/=m;my/=m; if(mx!==0)rP.face=mx>0?1:-1; rP.x+=mx*3.0; rP.y+=my*3.0; rP.kick+=dt*9; }
  rP.x=Math.max(FLOOR.x0+rP.r,Math.min(FLOOR.x1-rP.r,rP.x));
  rP.y=Math.max(FLOOR.y0+rP.r,Math.min(FLOOR.y1-rP.r,rP.y));

  // ---- proximity actions: pass / 반찬 / serving ----
  // walk up to the bar (top edge of the floor, within the counter span) to take a plate
  if(Math.abs(rP.x-rCounter.x)<rCounter.w/2 && rP.y<FLOOR.y0+40) pickUpPlate();
  if(Math.hypot(rP.x-rBanchan.x,rP.y-rBanchan.y)<48){ rBan=Math.min(1, rBan+dt*0.9); }   // refill 반찬
  // serve a nearby waiting guest if carrying a plate
  if(rCarry){ const {g,d}=nearestWaitingGuest(); if(g && d<46) serveGuest(g); }

  // ---- guests grow impatient ----
  for(const g of rGuests){
    g.bob+=dt*3; if(g.joy>0)g.joy-=dt; if(g.served>0)g.served-=dt*0.5;
    if(g.state==='waiting'){
      g.wait+=dt;
      if(g.wait>=g.patience){ g.state='left'; rLeft++; G.renown=Math.max(0,(G.renown||0)-4); tone(180,.2,'sawtooth',.04); if(toastCd<=0){toast('A guest left, tired of waiting…');toastCd=2;} }
    }
  }
  // clear guests that have finished eating / left so seats free up
  for(const g of rGuests){ if(g.state==='served'){ g.eat=(g.eat||3.0)-dt; if(g.eat<=0) g.state='done'; } }
  rGuests=rGuests.filter(g=>g.state!=='done'&&g.state!=='left' || g.served>0);   // keep briefly for the leave anim
  rGuests=rGuests.filter(g=>!(g.state==='left'));

  // ---- end of night: no more to spawn, none waiting, nothing left to serve ----
  const anyWaiting=rGuests.some(g=>g.state==='waiting');
  const anyServedAnim=rGuests.some(g=>g.state==='served');
  if(rToSpawn<=0 && !anyWaiting && !anyServedAnim && !rEndedToast){ rEndedToast=true; setTimeout(endRestaurant, 500); }
  if(rToSpawn<=0 && !anyWaiting && !rPlates.length && !rCarry && !anyServedAnim && !rEndedToast){ rEndedToast=true; endRestaurant(); }

  updateHud();
}

function updateHud(){
  const remaining=rToSpawn + rGuests.filter(g=>g.state==='waiting').length;
  $('kGuests').textContent=remaining;
  $('kEarned').textContent=rEarned+' won';
  $('kBanchan').textContent=Math.round(rBan*100)+'%';
  $('kBanchanFill').style.width=(rBan*100)+'%';
  $('kBanchanFill').style.background = rBan<0.2 ? 'linear-gradient(90deg,#c9512c,#e8714a)' : 'linear-gradient(90deg,#6aa647,#acd684)';
  $('kCarry').textContent = rCarry ? (rCarry.dish.kr+' '+starStr(rCarry.stars)) : (rPlates.length?('pass: '+rPlates.length):'—');
}

function endRestaurant(){
  G.money += rEarned; $('moneyV').textContent=G.money;
  $('kitchenHud').classList.remove('show'); $('kitchenDoneBtn').classList.remove('show');
  const list=$('kitchenList'); list.innerHTML='';
  const row=(a,b)=>{ const r=document.createElement('div'); r.className='line'; r.innerHTML=`<span>${a}</span><span>${b}</span>`; list.appendChild(r); };
  row('Guests served', rServed);
  if(rLeft) row('Left waiting', rLeft);
  if(rTips) row('Tea tips', rTips+' won');
  const t=document.createElement('div'); t.className='line tot'; t.innerHTML=`<span>Earned tonight</span><span>${rEarned} won</span>`; list.appendChild(t);
  const before=rankName();
  $('kitchenNote').textContent = rServed
    ? ('Word spreads — 해녀의 부엌 is now “'+rankName()+'”. Rest, then dive again tomorrow.')
    : 'A quiet night. Better catch tomorrow brings better plates.';
  // any unserved plates are discarded (the catch was already spent making them)
  rPlates=[]; rCarry=null; rPour=null;
  scene='panel'; panelBg='village';
  $('pKitchen').classList.remove('hidden');
}
window.endRestaurant=endRestaurant;
$('kitchenDoneBtn').onclick=()=>{ if(scene==='kitchen') endRestaurant(); };
$('kitchenClose').onclick=()=>{ $('pKitchen').classList.add('hidden'); scene='village';
  // step away from the bulteok so the prompt doesn't immediately reopen the kitchen
  P.x=470; P.y=300; P.face=1; toast('Day '+G.day+' · '+rankName()); };

/* ================================ DRAW =================================== */
function drawRestaurant(){
  // the 포장마차 backdrop art (falls back to a warm wash until the image loads)
  if(kitchenImg){ ctx.drawImage(kitchenImg,0,0,W,H); }
  else { const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#5a3a24'); g.addColorStop(1,'#7a5230'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }

  drawPass();                                  // plates waiting on the bar + a "take a plate" hint
  drawBanchanCrock();                          // the 반찬 refill spot by the fish tank

  // two dining sets, then empty stools, then seated guests (each draws its own stool)
  for(const dt of DINING_TABLES) drawDiningTable(dt.x,dt.y);
  for(let i=0;i<rTables.length;i++){ if(!rGuests.some(g=>g.seat===i)){ drawStoolBase(rTables[i].x,rTables[i].y); drawStoolSeat(rTables[i].x,rTables[i].y+2); } }
  for(const gst of rGuests) drawGuest(gst);

  drawWaitress();                              // the diver, working the floor

  for(const p of rParts){ ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.c;
    if(p.heart){ ctx.font='12px serif'; ctx.fillText('♥',p.x,p.y); }
    else { ctx.beginPath(); ctx.arc(p.x,p.y,2.4,0,7); ctx.fill(); } }
  ctx.globalAlpha=1;

  if(rPour) drawPour();
}

function drawPass(){
  // a soft glow marks the pass, then the cooked plates line up along the bar top
  const y=FLOOR.y0-6;
  ctx.font='600 11px "Space Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(255,243,210,.9)'; ctx.strokeStyle='rgba(30,18,8,.7)'; ctx.lineWidth=3;
  ctx.strokeText('▲ THE PASS — step up to take a plate', rCounter.x, y);
  ctx.fillText('▲ THE PASS — step up to take a plate', rCounter.x, y);
  const n=Math.min(rPlates.length,9);
  for(let i=0;i<n;i++){ const px=rCounter.x-(n-1)*20/2+i*20; drawPlateIcon(px, FLOOR.y0+8, rPlates[i]); }
  if(rPlates.length>9){ ctx.fillStyle='#fff7e6'; ctx.fillText('+'+(rPlates.length-9), rCounter.x+rCounter.w/2-8, FLOOR.y0+8); }
}
function drawPlateIcon(x,y,plate){
  ctx.save();
  ctx.fillStyle='rgba(10,8,6,.25)'; ctx.beginPath(); ctx.ellipse(x,y+4,8,3,0,0,7); ctx.fill();
  ctx.fillStyle='#f3ede0'; ctx.strokeStyle='rgba(30,20,12,.55)'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.arc(x,y,7,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle=plate.dish.col; ctx.beginPath(); ctx.arc(x,y,4,0,7); ctx.fill();
  ctx.restore();
}
function drawBanchanCrock(){
  const x=rBanchan.x,y=rBanchan.y;
  ctx.fillStyle='rgba(10,8,6,.28)'; ctx.beginPath(); ctx.ellipse(x,y+14,20,6,0,0,7); ctx.fill();
  // a celadon crock that empties as 반찬 runs low
  ctx.fillStyle='#7c9e84'; ctx.strokeStyle='rgba(30,40,30,.6)'; ctx.lineWidth=2.4;
  ctx.beginPath(); rr(ctx,x-17,y-12,34,26,6); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#3a2414'; ctx.globalAlpha=0.35; ctx.beginPath(); rr(ctx,x-13,y-8,26,18,4); ctx.fill(); ctx.globalAlpha=1;
  ctx.fillStyle=rBan<0.2?'#caa24a':'#cfe0b0'; ctx.beginPath(); rr(ctx,x-13,y+10-18*rBan,26,18*rBan,4); ctx.fill();
  ctx.font='700 12px "Gowun Batang", serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='#fff7e6'; ctx.strokeStyle='rgba(30,18,8,.7)'; ctx.lineWidth=3;
  ctx.strokeText('반찬',x,y-24); ctx.fillText('반찬',x,y-24);
}
/* ---- 포장마차 furniture, drawn in the game's inked cartoon-wood style ---- */
const WOOD='#9c6b3a', WOOD_L='#b98a52', WOOD_D='#6e4a2c', STEEL='#c3c7cc', STEEL_D='#8a8e94';
function drawStoolBase(x,y){   // legs + stretcher (drawn behind a seated guest)
  ctx.fillStyle='rgba(10,8,6,.22)'; ctx.beginPath(); ctx.ellipse(x,y+19,20,6,0,0,7); ctx.fill();
  inked(ctx,WOOD_D,2.4);
  ctx.beginPath(); rr(ctx,x-13,y-2,4,21,1.5); fillStroke(ctx); ctx.beginPath(); rr(ctx,x+9,y-2,4,21,1.5); fillStroke(ctx);
  ctx.beginPath(); rr(ctx,x-6,y,4,19,1.5); fillStroke(ctx);   ctx.beginPath(); rr(ctx,x+2,y,4,19,1.5); fillStroke(ctx);
  ctx.strokeStyle=WOOD_D; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(x-12,y+11); ctx.lineTo(x+12,y+11); ctx.stroke();
}
function drawStoolSeat(x,y){   // the seat top (drawn over the guest's lower body → reads as seated)
  inked(ctx,WOOD,2.4); ctx.beginPath(); ctx.ellipse(x,y,16,7,0,0,7); fillStroke(ctx);
  ctx.fillStyle=WOOD_L; ctx.beginPath(); ctx.ellipse(x,y-1,12,4.4,0,0,7); ctx.fill();
  ctx.strokeStyle='rgba(70,45,25,.4)'; ctx.lineWidth=1; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(x-11,y+i*3); ctx.lineTo(x+11,y+i*3); ctx.stroke(); }
}
function drawDiningTable(x,y){  // wooden top on a steel trapezoid frame, like the reference
  ctx.fillStyle='rgba(10,8,6,.2)'; ctx.beginPath(); ctx.ellipse(x,y+24,50,10,0,0,7); ctx.fill();
  ctx.strokeStyle=STEEL_D; ctx.lineWidth=6; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x-30,y); ctx.lineTo(x-40,y+28); ctx.moveTo(x+30,y); ctx.lineTo(x+40,y+28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x-40,y+28); ctx.lineTo(x+40,y+28); ctx.stroke();
  ctx.strokeStyle=STEEL; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(x-30,y); ctx.lineTo(x-40,y+28); ctx.moveTo(x+30,y); ctx.lineTo(x+40,y+28); ctx.stroke();
  inked(ctx,WOOD_D,2.6); ctx.beginPath(); rr(ctx,x-46,y-4,92,12,3); fillStroke(ctx);
  inked(ctx,WOOD,2.6); ctx.beginPath(); ctx.ellipse(x,y-8,46,13,0,0,7); fillStroke(ctx);
  ctx.fillStyle=WOOD_L; ctx.beginPath(); ctx.ellipse(x,y-10,37,9,0,0,7); ctx.fill();
  ctx.strokeStyle='rgba(70,45,25,.32)'; ctx.lineWidth=1; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x-36,y-10+i*3.4); ctx.lineTo(x+36,y-10+i*3.4); ctx.stroke(); }
}
function drawGuest(g){
  const t=rTables[g.seat], x=t.x, y=t.y;
  drawStoolBase(x,y);
  // the guest as a village NPC sprite, lifted so the feet rest on the stool
  if(typeof drawPerson==='function') drawPerson(x, y-16, {skin:g.skin, look:g.look, face:g.face, idle:g.bobPhase});
  drawStoolSeat(x, y+2);                          // seat over the lower body → seated read
  // a served plate sits on the table in front of them
  if(g.state==='served' && g.plate){ const dt=DINING_TABLES[g.seat<3?0:1]; drawPlateIcon(dt.x+(x<dt.x?-14:14), dt.y-12, g.plate); }
  // status bubble above the head
  const by=y-58;
  if(g.joy>0){ ctx.font='15px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#e0567a'; ctx.fillText('♥', x, by); }
  else if(g.state==='served'){ /* contentment — nothing, they're eating */ }
  else {
    // a white thought bubble holding the order: a steaming bowl (everyone wants a dish),
    // plus a small teacup badge only if this guest also wants tea.
    ctx.fillStyle='rgba(255,255,255,.94)'; ctx.strokeStyle='rgba(30,18,8,.4)'; ctx.lineWidth=1.4;
    ctx.beginPath(); ctx.arc(x,by,13,0,7); ctx.fill(); ctx.stroke();
    drawFoodIcon(x, by+1);
    if(g.wantsTea && !g.teaDone) drawTeaBadge(x+11, by+10);
    const pr=Math.max(0,1-g.wait/g.patience);
    ctx.strokeStyle = pr<0.3?'#d35a31':'#e0a836'; ctx.lineWidth=2.6;
    ctx.beginPath(); ctx.arc(x,by,15,-Math.PI/2,-Math.PI/2+pr*6.283); ctx.stroke();
  }
}
/* hand-drawn order icons (no emoji — they render reliably in canvas across fonts) */
function drawFoodIcon(cx,cy){
  ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.strokeStyle='rgba(150,110,70,.6)'; ctx.lineWidth=1.3;            // steam
  ctx.beginPath(); ctx.moveTo(cx-3,cy-4); ctx.quadraticCurveTo(cx-5,cy-7,cx-3,cy-10);
  ctx.moveTo(cx+3,cy-4); ctx.quadraticCurveTo(cx+5,cy-7,cx+3,cy-10); ctx.stroke();
  ctx.fillStyle='#e9dcbe'; ctx.strokeStyle='rgba(60,40,20,.75)'; ctx.lineWidth=1.6;   // bowl
  ctx.beginPath(); ctx.moveTo(cx-7,cy-1); ctx.lineTo(cx+7,cy-1); ctx.arc(cx,cy-1,7,0,Math.PI,false); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#d98a4a'; ctx.beginPath(); ctx.ellipse(cx,cy-1,6,2,0,0,7); ctx.fill();   // broth/food
  ctx.restore();
}
function drawTeaBadge(cx,cy){
  ctx.save();
  ctx.fillStyle='#5cbfb0'; ctx.strokeStyle='rgba(20,40,38,.5)'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.arc(cx,cy,6,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#fff7e6';   // tiny cup
  ctx.beginPath(); ctx.moveTo(cx-3,cy-2.4); ctx.lineTo(cx+2.4,cy-2.4); ctx.lineTo(cx+1.4,cy+2.6); ctx.lineTo(cx-2,cy+2.6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#fff7e6'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(cx+2.6,cy,1.7,-1,1.4); ctx.stroke();   // handle
  ctx.restore();
}
function drawWaitress(){
  const x=rP.x,y=rP.y;
  // the diver herself, in the same village sprite, now working the floor
  if(typeof drawPerson==='function')
    drawPerson(x,y,{skin:'#eccaa2',scarf:(typeof MIN!=='undefined'?MIN.gold:'#f2c75a'),face:rP.face,moving:rP.moving,phase:rP.kick,player:true});
  // carried plate held out front
  if(rCarry){ drawPlateIcon(x+rP.face*15, y-2, rCarry);
    ctx.font='600 10px "Space Mono", monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.strokeStyle='rgba(30,18,8,.6)'; ctx.lineWidth=2.6; ctx.fillStyle='#fff7e6';
    ctx.strokeText(rCarry.dish.kr, x, y-40); ctx.fillText(rCarry.dish.kr, x, y-40); }
}
function drawPour(){
  // dim the floor, draw a teacup fill bar
  ctx.fillStyle='rgba(8,16,18,.55)'; ctx.fillRect(0,0,W,H);
  const cx=W/2, cy=H/2, bw=70, bh=200, by=cy-bh/2;
  ctx.font='700 18px "Gowun Batang", serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='#f6f1e3'; ctx.fillText('Pour the 보리차 — tap at the line', cx, by-34);
  // cup
  ctx.fillStyle='rgba(255,255,255,.12)'; rr(ctx,cx-bw/2,by,bw,bh,10); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=2; rr(ctx,cx-bw/2,by,bw,bh,10); ctx.stroke();
  // tea fill
  const lv=rPour.level; const fh=bh*lv;
  ctx.fillStyle=rPour.locked?'#7bd0c0':'#caa24a'; rr(ctx,cx-bw/2+3,by+bh-fh+0,bw-6,fh,8); ctx.fill();
  // target line
  const ty=by+bh*(1-0.82);
  ctx.strokeStyle='#f2c75a'; ctx.lineWidth=3; ctx.setLineDash([8,6]);
  ctx.beginPath(); ctx.moveTo(cx-bw/2-12,ty); ctx.lineTo(cx+bw/2+12,ty); ctx.stroke(); ctx.setLineDash([]);
  ctx.font='600 11px "Space Mono", monospace'; ctx.fillStyle='#f2c75a'; ctx.textAlign='left';
  ctx.fillText('aim here', cx+bw/2+16, ty);
  if(rPour.locked){ const ok=Math.abs(rPour.level-0.82)<0.12;
    ctx.font='700 20px "Gowun Batang", serif'; ctx.textAlign='center';
    ctx.fillStyle=ok?'#7bd0c0':'#e8a07c'; ctx.fillText(ok?'좋아! Perfect pour':'A bit off…', cx, by+bh+30); }
}
window.updateRestaurant=updateRestaurant;
window.drawRestaurant=drawRestaurant;

})();
