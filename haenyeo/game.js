/* ============================================================
   HAENYEO VILLAGE LIFE — game logic & state
   (rendering lives in render.js; both are classic scripts and
    share one global scope, so they freely reference each other)
   ============================================================ */
function $id(i){return document.getElementById(i);}
const $=$id;

const cv=$id('c'), ctx=cv.getContext('2d');
const W=960, H=600;            // logical design space (16:10 landscape); render.js scales to devicePixelRatio

/* ---------------- WORLD DATA ---------------- */
const SEA_Y=498;                 // everything below is ocean (non-beach fallback)
const BEACH_Y=458;               // shore line: below this the bottom splits into beach (left) | sea (right)
const COAST_X=576;               // vertical coastline dividing sand (left) from water (right) — beach 6 : sea 4
function coastX(y){ return COAST_X + Math.sin(y*0.028)*22; }   // gently wavy shoreline
/* solid batdam wall segments (match the backdrop image) — the player cannot pass through;
   openings: home gate, central lane, two field entrances, gear-shop & museum door gaps */
const WALLS=[
  {x:0,  y:202,w:114,h:32},{x:176,y:202,w:272,h:32},{x:512,y:202,w:160,h:32},   // top row
  {x:0,  y:290,w:318,h:36},{x:370,y:290,w:62,h:36},                              // middle row · left (entrance at 318–370)
  {x:528,y:290,w:104,h:36},{x:696,y:290,w:264,h:36},                             // middle row · right (entrance at 632–696)
  {x:400,y:322,w:32,h:70},{x:512,y:322,w:34,h:70},                               // verticals flanking the central lane
  {x:0,  y:390,w:156,h:36},{x:196,y:390,w:240,h:36},                             // bottom row · left (gap: gear-shop door)
  {x:510,y:390,w:246,h:36},{x:796,y:390,w:164,h:36},                             // bottom row · right (gap: museum door)
];
function wallHit(x,y){
  for(const w of WALLS){ if(x>w.x&&x<w.x+w.w&&y>w.y+6&&y<w.y+w.h) return true; }
  return false;
}
const buildings=[
  {x:70, y:120, w:130, h:96,  name:'home',  label:'Home',  en:'Your home',  roof:'#c9512c'},
  {x:690,y:120, w:122, h:96,  name:'coop',  label:'Co-op', en:'Co-op',      roof:'#3a6e8c'},
  {x:420,y:482, w:96,  h:78,  name:'bulteok',label:'Bulteok', en:'Bulteok',    roof:null},
  {x:268,y:474, w:128, h:96,  name:'pojangmacha', label:'Pojangmacha', en:'해녀의 부엌', roof:null},   // position is state-driven — see pojangRect()
  {x:120,y:300, w:112, h:84,  name:'store', label:'Gear', en:'Gear shop', roof:'#5a8c7a'},
  {x:720,y:300, w:112, h:82,  name:'museum',label:'Museum', en:'Haenyeo Museum', roof:'#6a6f8c'},
];
/* the kitchen trades through the night: 17:00 → 03:00 (the clock wraps past midnight) */
function kitchenOpen(){ return G.time>=17*60 || G.time<3*60; }
/* the 포장마차 lives in two spots: folded away under the bulteok by day, and
   raised next to it (on the left) once it opens for the evening. */
function pojangRect(){
  return kitchenOpen()
    ? {x:268, y:452, w:128, h:96}   // open — beside the bulteok, on the left (sat up a bit)
    : {x:409, y:506, w:118, h:90};  // folded — tucked under the bulteok
}
const STATUES=[{x:428,y:240},{x:563,y:240},{x:413,y:392},{x:533,y:392}];   // four dol hareubang baked into the village art — all examinable
const NPCS=[
  {id:'sunja', name:'Granny Sunja', roman:'Granny Sunja', role:'Sanggun · master diver', x:480,y:200, color:'#e8714a',
    skin:'#e8c9a0', scarf:'#e8714a', daily:[
      "When I was your age I dove right through winter. The sea raised me.",
      "Stay close to me out there, child. The yeo rocks don't forgive.",
      "Your grandmother had the strongest lungs in this village. You have her eyes."],
    chat:["Breathe out slow before you go down. Slow, slow.","Greed drowns more divers than the cold ever did."]},
  {id:'youngmi', name:'Youngmi', roman:'Youngmi', role:'Your friend, a junggun', x:250,y:252, color:'#3fa8b8',
    skin:'#e8c9a0', scarf:'#3fa8b8', daily:[
      "You came back! I didn't think city folk ever returned to Jeju.",
      "Race you to the conch beds after lunch?",
      "I saved you a spot by the fire. The good warm spot."],
    chat:["The urchins are fat this season.","Did you hear Okbun's stew today? Smelled like heaven."]},
  {id:'migyeong', name:'Migyeong', roman:'Migyeong', role:'Co-op manager', x:650,y:248, color:'#f2c14e',
    skin:'#e0bf95', scarf:'#3a6e8c', daily:[
      "Bring your catch by — I'll give you a fair weight, always.",
      "Abalone prices are up this week. Dive deep if you can.",
      "Paperwork, paperwork. The sea is simpler than the ledger."],
    chat:["Come to the co-op when your net's full.","The mainland buyers love our urchin roe."]},
  {id:'okbun', name:'Granny Okbun', roman:'Granny Okbun', role:'Village cook & elder', x:360,y:252, color:'#a8466a',
    skin:'#e8c9a0', scarf:'#a8466a', daily:[
      "Sit, sit. You're too thin for a haenyeo. Eat something.",
      "We cook together at the bulteok — that's the real reason we dive.",
      "I'll teach you the diving songs one day. They keep your heart steady."],
    chat:["A warm belly dives longer.","Bring me an octopus and I'll make you something special."]},
];
const ROAM={sunja:140, youngmi:170, migyeong:120, okbun:120};
NPCS.forEach((n,i)=>{ n.phase=i*1.7; n.ax=n.x; n.ay=n.y; n.roam=ROAM[n.id]||52;
  n.anim=0; n.face=1; n.moving=false; n.wait=Math.random()*2.5; n.tx=n.x; n.ty=n.y;
  n.speed=(n.id==='youngmi')?0.42:0.3; });   // de-sync idle sway + give each a roam home (gentle stroll)
// each villager's home doorway — at 22:00 they walk here and turn in for the night
const NPC_HOME={ migyeong:{x:751,y:214}, sunja:{x:776,y:378}, youngmi:{x:176,y:380}, okbun:{x:135,y:214} };
NPCS.forEach(n=>{ n.home=NPC_HOME[n.id]||{x:n.ax,y:n.ay}; n.atHome=false; });

/* ---- resting at the bulteok (fire-shelter) ---- */
const bulteokB=buildings.find(b=>b.name==='bulteok');
const BULTEOK_FIRE={ x:bulteokB.x+bulteokB.w/2, y:bulteokB.y+bulteokB.h*0.46 };   // hearth centre
// a ring of seats around the fire; divers gather here to warm up & chat
const REST_SEATS=[
  {x:bulteokB.x+14,            y:bulteokB.y+bulteokB.h*0.30},
  {x:bulteokB.x+bulteokB.w-14, y:bulteokB.y+bulteokB.h*0.30},
  {x:bulteokB.x+24,            y:bulteokB.y+bulteokB.h*0.62},
  {x:bulteokB.x+bulteokB.w-24, y:bulteokB.y+bulteokB.h*0.62},
];
const seatTaken=[false,false,false,false];
function restingCount(){ return NPCS.reduce((a,n)=>a+(n.rest&&n.rest!=='none'?1:0),0); }
function takeFreeSeat(){ const free=[]; for(let i=0;i<REST_SEATS.length;i++) if(!seatTaken[i]) free.push(i); if(!free.length) return -1; const s=free[Math.floor(Math.random()*free.length)]; seatTaken[s]=true; return s; }
function freeSeat(n){ if(n.seat>=0){ seatTaken[n.seat]=false; n.seat=-1; } }
NPCS.forEach(n=>{ n.rest='none'; n.seat=-1; n.restTimer=0; n.restCd=14+Math.random()*40; });


/* per-character appearance — distinct, role-fitting Korean villagers */
const NPC_LOOKS={
  sunja:   { hairStyle:'bun',      hair:'#8d877f', scarf:'#b85a48',                top:'#3f6f7a', bottom:'#33323d', elder:true,  skin:'#e3c4a0' },
  youngmi: { hairStyle:'ponytail', hair:'#241f1b',                                  top:'#3fa8b8', bottom:'#37343d',              skin:'#eccaa2' },
  migyeong:{ hairStyle:'bob',      hair:'#2a2220', vest:'#3a6e8c', glasses:true, clipboard:true, top:'#f2ead2', bottom:'#4a4a52', skin:'#e7c9a0' },
  okbun:   { hairStyle:'bun',      hair:'#9a948c', scarf:'#c25f86', floral:true, apron:'#ece2c8', top:'#a8466a', bottom:'#5a4a52', elder:true, skin:'#e3c4a0' },
};
NPCS.forEach(n=>{ n.look=NPC_LOOKS[n.id]||{}; });

/* ---------------- CONVERSATION TOPICS + PHONE CALLS ----------------
   Each villager talks in their own voice. `topics` power the branching
   dialogue (choices that rotate through lines so re-asking advances the
   chat); `calls` are what they say when they ring you on the phone.
   Granny → stories · Youngmi → fun things · Migyeong → market ·
   Okbun → food.                                                       */
const NPC_TALK = {
  sunja: {
    topics: [
      { label:'Tell me a story', lines:[
        "Long ago a diver met the dragon king beneath the yeo rocks. He gave her one pearl and one rule — never take more than the sea offers.",
        "My own teacher dove until she was eighty. They say the sea finally called her home, gentle as falling asleep.",
        "In 1932 the Japanese tried to steal our catch. The haenyeo of this island laid down their taewak floats and marched. We have always been fierce.",
        "Once a pod of dolphins circled our boat three whole days. The elders said it meant a rich harvest. They were right." ]},
      { label:'Diving wisdom', lines:[
        "Breathe out slow before you go down. Slow, slow. Panic drowns divers, not the water.",
        "Greed drowns more of us than the cold ever did. Leave the small abalone to grow.",
        "Listen for the sumbisori — the whistle we make as we surface. That's how we know each other still breathes." ]},
      { label:'About grandmother', lines:[
        "Your grandmother had the strongest lungs in this village. You have her eyes — and her stubbornness, I think.",
        "She and I were muljil partners for forty years. The sea is quieter now without her singing." ]},
    ],
    calls: [
      "Aigo, child — I was just remembering. When I was small we dove with stone weights at our waists, no wetsuits, only courage. Come by, I have more tales for you.",
      "I called to say the moon is full tonight. My mother always swore the abalone climb higher on such nights. Dive at first light.",
      "I dreamt of your grandmother — laughing in the water, young again. Come to the bulteok later and I'll tell you about her." ],
  },
  youngmi: {
    topics: [
      { label:'What should we do?', lines:[
        "Race you to the conch beds after lunch — loser scrubs both nets!",
        "Let's dig the beach for treasure. Last week I found an old coin that actually sold for won!",
        "There's a sea cave past the yeo rocks. Save up a big breath and I'll show you.",
        "After diving, urchins roasted over the bulteok fire. Best part of any day, I swear." ]},
      { label:'Any gossip?', lines:[
        "Did you catch the smell of Okbun's stew today? I 'accidentally' walked past it three times.",
        "Migyeong's been muttering at her ledger again. The mainland buyers must be haggling hard.",
        "The cat had kittens behind the gear shop. Don't tell Mr. Gicheol — he pretends he doesn't feed them." ]},
      { label:'How are you?', lines:[
        "The urchins are fat this season. My net's full and my arms are sore — happy sore.",
        "Honestly? Glad you came home. Diving's more fun with someone my own age." ]},
    ],
    calls: [
      "Hey, drop whatever you're doing — the water's like glass today, perfect for the conch beds. Meet me at the shore!",
      "Guess what? I found a tide pool packed with tiny crabs by the beach. Come look before the tide takes it back!",
      "Let's make a contest of it — most octopus to the co-op wins, loser buys dinner. Loser's probably you." ],
  },
  migyeong: {
    topics: [
      { label:"Today's prices", lines:[
        "Abalone's up this week — dive deep if your breath allows. The mainland can't get enough of it.",
        "Conch are steady. Urchin roe is where the real money is right now.",
        "Sea cucumber dipped a little. Hold them a day if you can afford to wait." ]},
      { label:'Selling tips', lines:[
        "Bring everything at once and I weigh it together — you skip the small-batch fuss.",
        "Clean salvage off the beach sells too. Tourists pay oddly well for old glass floats.",
        "Don't undersell yourself. A full net in the right week buys you a new wetsuit." ]},
    ],
    calls: [
      "It's Migyeong at the co-op. Heads up — abalone prices jumped this morning. If you've a full breath in you, today's the day to dive deep.",
      "Quick one — a mainland buyer wants urchin roe by sundown and he's paying well. Bring whatever you've got." ],
  },
  okbun: {
    topics: [
      { label:"What's cooking?", lines:[
        "Today, jeonbok-juk — abalone porridge. Soft enough for old teeth, rich enough for young divers.",
        "I'm steaming a fresh octopus with sesame oil. Bring me one and I'll save you a bowl.",
        "Miyeok-guk, seaweed soup. We eat it after a hard dive to bring the warmth back into our bones." ]},
      { label:'A recipe?', lines:[
        "Boribap — barley rice with whatever the sea gave us. Simple food keeps a diver strong.",
        "For conch: a little gochujang, a little vinegar, eaten raw and cold. The sea on a plate.",
        "Sea urchin over warm rice and nothing else. Don't you dare ruin it with too much." ]},
      { label:'Diving songs', lines:[
        "I'll teach you the diving songs one day. They keep your heart steady when the water is deep and dark.",
        "We sing 'Ieodo Sana' rowing out — Ieodo, the island that isn't there, where lost divers rest." ]},
    ],
    calls: [
      "Child, it's Okbun. The stew's nearly ready and you're nowhere to be seen. A warm belly dives longer — come eat before it's gone!",
      "I called to say: bring me an octopus when you can and I'll make you something special. Cooking for one is no fun.",
      "Are you eating enough? You sound thin even over the phone. Come to the bulteok — I've kept the rice warm." ],
  },
};
NPCS.forEach(n=>{ const t=NPC_TALK[n.id]; if(t){ n.topics=t.topics; n.calls=t.calls; } });

/* ---------------- VILLAGE PETS (cat + Jeju dog) ---------------- */
const PETS=[
  {id:'cat', kind:'cat', label:'cat',     x:64,  y:300, roam:118, speed:0.7},
  {id:'dog', kind:'dog', label:'Jeju dog', x:330, y:370, roam:150, speed:1.0},
];
PETS.forEach((p,i)=>{ p.ax=p.x; p.ay=p.y; p.tx=p.x; p.ty=p.y; p.anim=0; p.face=1; p.moving=false;
  p.wait=0.5+Math.random()*2.5; p.phase=i*2.3; });

/* ---------------- GAME STATE ---------------- */
const G={ day:1, money:0, time:6*60, wetsuitIdx:0, netIdx:0, toolIdx:0, maskIdx:0, tewakIdx:0, bagIdx:0, cutIdx:0,
  friendship:{}, talkedToday:{}, catch:{}, catchQ:{}, trash:{}, season:0, meal:null, preparedMeal:null,
  suit:'traditional', owned:{traditional:true, modern:false}, weather:'sunny',
  renown:0,        // 해녀의 부엌 word-of-mouth — drives the kitchen rank (see restaurant.js)
  beachHealth:60,  // 0–100 shore cleanliness; litter accrues daily, cleaning restores it; feeds the dive
  eco:0,           // eco-points earned by correct 분리수거 sorting & wildlife rescues
  factsSeen:{},    // debris ids whose fact card has been shown (show once)
  cultureLog:{}, cultureMem:0, cultureKeeper:false,   // 해녀 문화 도감: exhibits examined, grandmother memories heard, "Keeper of Tradition" earned
  energy:100 };    // 0–100 stamina; diving/cleaning/cooking spend it, a night's sleep restores it
function clampHealth(){ G.beachHealth=Math.max(0,Math.min(100,G.beachHealth)); }
/* ---- energy / stamina: the day is paced by how tired you are, not the clock ---- */
const ENERGY_COST={ dive:25, beach:20, kitchen:20 };   // what each activity takes out of you
const ENERGY_REST_RATE=5;                              // energy/sec recovered while resting on the lounger
const ENERGY_TIME_DRAIN=0.4;                           // energy/sec lost just from the day wearing on (activities cost more)
function updateEnergyHud(){
  const f=$('energyFill'); if(!f) return; const e=Math.max(0,Math.min(100,Math.round(G.energy)));
  f.style.width=e+'%';
  f.style.background = e<25?'linear-gradient(90deg,#c9512c,#e8714a)':(e<55?'linear-gradient(90deg,#e0a836,#f0d27a)':'linear-gradient(90deg,#6aa647,#acd684)');
  const t=$('energyV'); if(t)t.textContent=e+'%';
}
/* can we start an activity? if not, nudge the player to rest. */
function haveEnergy(kind){
  if(G.energy >= ENERGY_COST[kind]) return true;
  toast('Too tired — head home and sleep to recover. ⚡');
  return false;
}
function spendEnergy(kind){ G.energy=Math.max(0,G.energy-(ENERGY_COST[kind]||0)); updateEnergyHud(); }
/* ---- catch inventory with quality ----
   G.catch[id]  = total count of that species on hand (kept for all the old count-only code)
   G.catchQ[id] = {1:n,2:n,3:n} star breakdown, the two always move in lockstep.
   Every add/remove of seafood MUST go through these helpers so the two never drift. */
function addCatch(id, stars){
  stars=Math.max(1,Math.min(3,stars||2));
  G.catch[id]=(G.catch[id]||0)+1;
  const q=G.catchQ[id]||(G.catchQ[id]={1:0,2:0,3:0});
  q[stars]=(q[stars]||0)+1;
}
/* remove one of a species, spending the LOWEST-quality on hand first so the
   diver keeps her best stars for the kitchen. Returns the star removed, or 0. */
function removeOneCatch(id){
  if((G.catch[id]||0)<=0) return 0;
  const q=G.catchQ[id]||{1:0,2:0,3:0};
  for(let s=1;s<=3;s++){ if(q[s]>0){ q[s]--; G.catch[id]--; if(G.catch[id]<=0){delete G.catch[id];delete G.catchQ[id];} return s; } }
  G.catch[id]--; if(G.catch[id]<=0){delete G.catch[id];delete G.catchQ[id];} return 2;   // fallback if Q missing
}
/* remove one of a species spending the HIGHEST quality first — the kitchen plates
   the freshest catch into its finest dishes. Returns the star removed, or 0. */
function removeBestCatch(id){
  if((G.catch[id]||0)<=0) return 0;
  const q=G.catchQ[id]||{1:0,2:0,3:0};
  for(let s=3;s>=1;s--){ if(q[s]>0){ q[s]--; G.catch[id]--; if(G.catch[id]<=0){delete G.catch[id];delete G.catchQ[id];} return s; } }
  G.catch[id]--; if(G.catch[id]<=0){delete G.catch[id];delete G.catchQ[id];} return 2;
}
function clearCatch(id){ delete G.catch[id]; delete G.catchQ[id]; }
function bestCatchId(){   // highest-value species currently on hand (for gifting)
  let bestId=null,bestV=-1;
  for(const s of SPECIES){ if((G.catch[s.id]||0)>0 && s.value>bestV){bestV=s.value;bestId=s.id;} }
  return bestId;
}
NPCS.forEach(n=>G.friendship[n.id]=0);
PETS.forEach(p=>G.friendship[p.id]=0);   // pets can be befriended too
G.pettedToday={};                        // limits the affection gain to once a day per pet
const SEASONS=['Spring','Summer','Autumn','Winter'];
const WEATHERS={sunny:'☀️  Clear skies today',rain:'🌧️  Rain over the black rocks',wind:'🍃  A windy day on the shore'};
const WEATHER_ICON={sunny:'☀️', rain:'🌧️', wind:'🍃'};
function updateWeatherHud(){ const e=$('clkWx'); if(e) e.textContent=WEATHER_ICON[G.weather]||'☀️'; }   // status-bar weather glyph
function rollWeather(announce){
  const pool=['sunny','sunny','sunny','rain','wind','wind'];   // mostly fair, a little weather
  G.weather=pool[Math.floor(Math.random()*pool.length)];
  if(window.HaenyeoWeather) window.HaenyeoWeather.setWeather(G.weather);
  updateWeatherHud();                                          // keep the top-left status bar in sync
  if(announce) toast(WEATHERS[G.weather]);
  return G.weather;
}
const HEART_PTS=120, MAX_HEARTS=5;
function hearts(id){ return Math.min(MAX_HEARTS, Math.floor(G.friendship[id]/HEART_PTS)); }
function heartStr(id){ const h=hearts(id); return '♥'.repeat(h)+'♡'.repeat(MAX_HEARTS-h); }

/* The water column follows the haenyeo ranks (20 m total — band = fraction of depth):
   · hagun   0–5 m   shore shallows — seaweed (shallowest), conch near the line
   · junggun ~5–10 m — urchin & sea cucumber
   · sanggun 10–20 m — abalone & octopus; the deeper, the dearer */
const SPECIES=[
  {id:'seaweed', name:'Seaweed',     kr:'',color:'#3a7d5d',value:6,  r:14, band:[0,0.25],    w:5},
  {id:'conch',   name:'Conch',       kr:'',color:'#9c6b3a',value:14, r:12, band:[0.15,0.4],  w:4},
  {id:'urchin',  name:'Urchin',      kr:'',color:'#2c2a33',value:26, r:11, band:[0.25,0.5],  w:3},
  {id:'cucumber',name:'Sea cucumber',kr:'',color:'#5f7146',value:34, r:13, band:[0.3,0.5],   w:3},
  {id:'abalone', name:'Abalone',     kr:'',color:'#46708a',value:70, r:12, band:[0.5,0.85],  w:2},
  {id:'octopus', name:'Octopus',     kr:'',color:'#e0533a',value:84, r:14, band:[0.65,1],    w:2},
  {id:'pearl',   name:'Pearl',       kr:'',color:'#e9e2f2',value:140,r:9,  band:[1,1],       w:0},   // never spawns — found only in the sea cave
];
/* ---- catch quality (★1–3) — Dave-the-Diver style, but earned by haenyeo technique ----
   A calm, unhurried approach and a clean dig take the creature at its best. */
function starMult(s){ return s>=3?1.4:(s<=1?0.7:1.0); }              // co-op pays more for a ★3
function starStr(s){ return '★'.repeat(s)+'☆'.repeat(3-s); }
function speciesById(id){ return SPECIES.find(x=>x.id===id); }
/* ---- cargo weight (Dave-the-Diver style) ----
   the net fills by weight, not item count — a big octopus crowds out the small stuff.
   (SPECIES[].w is spawn-frequency, not mass, so physical weight lives here.) */
const CATCH_KG={seaweed:1, conch:1, urchin:1, cucumber:2, abalone:2, octopus:3, pearl:0};
function creatureKg(id){ return CATCH_KG[id]!=null?CATCH_KG[id]:1; }
/* what the co-op pays for everything of one species on hand, summing each star band */
function catchSaleValue(id){
  const s=speciesById(id); if(!s) return 0;
  const q=G.catchQ[id];
  if(!q) return (G.catch[id]||0)*s.value;
  let v=0; for(const k of [1,2,3]) v+=Math.round((q[k]||0)*s.value*starMult(k));
  return v;
}
function catchAvgStars(id){
  const q=G.catchQ[id]; if(!q) return 2;
  let n=0,sum=0; for(const k of [1,2,3]){ n+=(q[k]||0); sum+=k*(q[k]||0); }
  return n?Math.max(1,Math.round(sum/n)):2;
}
const DIVE_MAX_M=20;                                  // BED sits ~20 m down
function diveZone(m){ return m<5?'Hagun':(m<10?'Junggun':'Sanggun'); }
/* ---- beach litter & lost treasures, gathered when you clean the shore ---- */
/* Real Jeju shore debris. Litter carries a 분리수거 `category` (sorted at the end of a
   clean-up) and a one-line real `fact` shown once on first pickup. Treasures bypass
   sorting — they're rare salvage finds, cashed straight to won. */
const BEACH_ITEMS=[
  // ---- litter (sorted into recycling bins) ----
  {id:'styro', name:'Styrofoam buoy', kr:'양식 스티로폼 부표', color:'#eef0ef', value:3, r:12, buried:false, treasure:false,
    category:'styrofoam', fact:"Styrofoam buoys from sea farms are Jeju's most common shore debris — they crumble into microplastics."},
  {id:'bag',   name:'Plastic bag',    kr:'비닐봉지',          color:'#cfe0e6', value:1, r:12, buried:false, treasure:false,
    category:'plastic',   fact:"Sea turtles mistake drifting plastic bags for jellyfish and swallow them."},
  {id:'bottle',name:'PET bottle',     kr:'페트병',            color:'#9fd4cf', value:2, r:11, buried:false, treasure:false,
    category:'plastic',   fact:"A plastic bottle takes about 450 years to break down at sea; many here drift in on the currents."},
  {id:'can',   name:'Drink can',      kr:'음료 캔',           color:'#c9ccd2', value:3, r:10, buried:false, treasure:false,
    category:'metal',     fact:"Aluminium cans are endlessly recyclable — yet take ~200 years to corrode in the ocean."},
  {id:'net',   name:'Ghost-net scrap',kr:'폐어망 조각',       color:'#6aa647', value:2, r:13, buried:false, treasure:false,
    category:'general',   fact:"Lost 'ghost nets' keep trapping fish and animals for decades after they're dumped."},
  {id:'glass', name:'Soju bottle',    kr:'소주병',            color:'#7fae6a', value:4, r:11, buried:false, treasure:false,
    category:'glass',     fact:"Glass never fully decomposes at sea — but it can be recycled again and again."},
  // ---- treasures (rare; salvaged straight to won, no sorting) ----
  {id:'seaglass',name:'Sea glass',    kr:'바다 유리', color:'#5cbfb0', value:18, r:9,  buried:true,  treasure:true,
    fact:"Sea glass is litter the ocean spent decades polishing into a gem — beautiful, but it began as broken glass."},
  {id:'scrap', name:'Brass weight',   kr:'놋쇠 추',   color:'#d59f2e', value:24, r:10, buried:true,  treasure:true},
  {id:'coin',  name:'Old coin',       kr:'옛 동전',   color:'#e0a836', value:40, r:9,  buried:true,  treasure:true},
  {id:'float', name:'Lost taewak',    kr:'잃어버린 태왁', color:'#f47a1f', value:60, r:14, buried:false, treasure:true},
];
function beachItem(id){ return BEACH_ITEMS.find(b=>b.id===id); }
/* 분리수거 recycling bins (Korea's real categories) — used by the end-of-session sorting screen */
const RECYCLE_BINS=[
  {id:'plastic',   kr:'플라스틱',   label:'Plastic', color:'#3a8fc0'},
  {id:'metal',     kr:'캔·고철',    label:'Metal',   color:'#9aa0a8'},
  {id:'glass',     kr:'유리',       label:'Glass',   color:'#4f9e6a'},
  {id:'styrofoam', kr:'스티로폼',   label:'Styrofoam',color:'#e0d7c4'},
  {id:'general',   kr:'일반쓰레기', label:'General', color:'#8a7a5a'},
];
function recycleBin(id){ return RECYCLE_BINS.find(b=>b.id===id); }
/* does the active renderer + page support the beach minigame? (other art styles don't) */
function beachEnabled(){ return typeof drawBeach==='function' && !!document.getElementById('beachHud'); }
const GEAR={
  // net (mangsari) capacity is now measured in KG of cargo, not item count
  net:    [{cap:8,cost:0},     {cap:13,cost:220},     {cap:20,cost:560}],
  // harvesting tool — pries & digs buried catch (urchin/octopus/abalone) loose faster
  tool:   [{name:'Bare hands', dig:1.0, cost:0},
           {name:'Golgaengi',  dig:1.7, cost:200},
           {name:'Bitchang',   dig:2.6, cost:480}],
  // diving lens — traditional goggles up to a modern wide mask (best sight)
  mask:   [{name:'Wooden goggles',vis:120, cost:0},
           {name:'Glass goggles', vis:210, cost:170},
           {name:'Diving mask',   vis:320, cost:400}],
  // taewak (濟州浮球) — the float she rests on to catch her breath; bigger = faster recovery
  tewak:  [{name:'Taewak float', recover:1.0, cost:0},
           {name:'Foam taewak',  recover:1.5, cost:240},
           {name:'Big taewak',   recover:2.0, cost:520}],
  // beach collection sack — how much litter you can carry per tide
  bag:    [{cap:12,cost:0}, {cap:16,cost:180}, {cap:22,cost:420}],
  // net-cutter — how fast you free a tangled animal on the shore
  cutter: [{name:'Bare hands',spd:1.0,cost:0}, {name:'Diving knife',spd:1.5,cost:260}, {name:'Sharp shears',spd:2.2,cost:520}],
};
// two distinct diving outfits — traditional cotton mul-ot vs a modern neoprene wetsuit
const SUITS={
  traditional:{ id:'traditional', name:'Traditional', kr:'', breath:100, cost:0,
    note:'Light cotton tunic and shorts. Cold, but how the grandmothers always dove.' },
  modern:{ id:'modern', name:'Modern wetsuit', kr:'', breath:170, cost:650,
    note:'Warm neoprene with fins. Hold your breath far longer in deep water.' },
};
function maxBreath(){ return SUITS[G.suit].breath; }
function netCap(){ return GEAR.net[G.netIdx].cap; }
function toolDig(){ return GEAR.tool[G.toolIdx].dig; }     // dig-speed multiplier
function maskVis(){ return GEAR.mask[G.maskIdx].vis; }     // clear-sight radius underwater
function tewakRecover(){ return GEAR.tewak[G.tewakIdx].recover; }   // surface breath-recovery multiplier
function bagCap(){ return GEAR.bag[G.bagIdx].cap; }                  // beach litter sack capacity
function cutSpeed(){ return GEAR.cutter[G.cutIdx].spd; }             // net-cut speed multiplier

/* ---------------- PLAYER + INPUT ---------------- */
const P={x:470,y:280,r:13,face:1,moving:false,anim:0,sitting:false,swimming:false};
const LOUNGER={x:140,y:588};   // the right-hand deck chair under the beach parasol
// out past the shoreline: the moored dive boat + the three haenyeo working the water (must match drawSea)
const DIVE_TARGETS=[{x:878,y:548},{x:655,y:510},{x:795,y:553},{x:705,y:598}];
const SPEED=3.4;   // walking pace (was 2.4 — a brisker stroll)
const CLOCK_RATE=15;   // in-game minutes per real second — the day flows on its own
function tickClock(dt){
  G.time+=dt*CLOCK_RATE; G.energy=Math.max(0, G.energy-dt*ENERGY_TIME_DRAIN);   // the day slowly tires you
  if(G.time>=24*60){ G.time-=24*60; tickClock._past=true; }   // past midnight, on through the small hours
  if(tickClock._past && G.time>=6*60){ newDay(); return; }    // 6:00 — dawn breaks; the next day begins on its own
  $('clkTime').textContent=fmtTime(G.time);
  { const nm=(typeof nightAmt==='function')?nightAmt(G.time):0; $('clock').classList.toggle('night', nm>0.45); }
  // gentle nudges — sleeping is the player's choice; the day rolls over by itself at dawn
  if(!tickClock._late && G.time>=20*60){ tickClock._late=true; toast('Evening · rest whenever you\'re ready'); }
  if(!tickClock._curfew && G.time>=22*60){ tickClock._curfew=true; toast('22:00 · the villagers head home for the night'); }
  updateEnergyHud();
}
let scene='title';
let panelBg='village';   // which world to draw behind a centered panel
let toastT=0;
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');toastT=1.6;}
/* a non-blocking marine-debris fact banner (slides up, fades on its own) */
let factT=0;
const FACT_TAG_DEFAULT='알고 계셨나요? · Did you know?';
function showFact(text, dur, tag){ const el=$('factCard'); if(!el||!text) return; const tx=$('factText'); if(tx)tx.textContent=text; const tg=el.querySelector('.factTag'); if(tg) tg.textContent=tag||FACT_TAG_DEFAULT; el.classList.add('show'); factT=dur||5.5; }
/* show a debris fact the first time that item is ever picked up */
function maybeShowFact(item){ if(!item||!item.fact) return; if(G.factsSeen[item.id]) return; G.factsSeen[item.id]=true; showFact(item.fact); }

let actx;
function tone(f,d,type='sine',v=.05){try{
  if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();
  const o=actx.createOscillator(),g=actx.createGain();
  o.type=type;o.frequency.value=f;o.connect(g);g.connect(actx.destination);
  g.gain.setValueAtTime(v,actx.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+d);
  o.start();o.stop(actx.currentTime+d);
}catch(e){}}

/* a little synthesized "woof woof" — two quick falling barks */
function barkSound(){try{
  if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();
  if(actx.state==='suspended')actx.resume();
  const now=actx.currentTime;
  for(let k=0;k<2;k++){ const t0=now+k*0.17;
    const o=actx.createOscillator(),g=actx.createGain(),lp=actx.createBiquadFilter();
    o.type='sawtooth'; o.frequency.setValueAtTime(440,t0); o.frequency.exponentialRampToValueAtTime(150,t0+0.12);
    lp.type='lowpass'; lp.frequency.value=1400;
    g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.09,t0+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.15);
    o.connect(lp);lp.connect(g);g.connect(actx.destination); o.start(t0); o.stop(t0+0.17);
  }
}catch(e){}}
/* a little synthesized "meow" — a pitch rising then falling, softened */
function meowSound(){try{
  if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();
  if(actx.state==='suspended')actx.resume();
  const now=actx.currentTime;
  const o=actx.createOscillator(),g=actx.createGain(),lp=actx.createBiquadFilter();
  o.type='sawtooth';
  o.frequency.setValueAtTime(520,now);
  o.frequency.linearRampToValueAtTime(860,now+0.16);   // "me—"
  o.frequency.linearRampToValueAtTime(600,now+0.46);   // "—ow", falling
  lp.type='lowpass'; lp.frequency.value=1900;
  g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.07,now+0.05);
  g.gain.setValueAtTime(0.07,now+0.34); g.gain.exponentialRampToValueAtTime(0.0001,now+0.5);
  o.connect(lp);lp.connect(g);g.connect(actx.destination); o.start(now); o.stop(now+0.52);
}catch(e){}}
/* a soft, warm 3-note chime — gentle, for the rescue moment (not a loud game jingle) */
function softChime(){try{
  if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();
  if(actx.state==='suspended')actx.resume();
  const now=actx.currentTime, notes=[523.25,659.25,783.99];   // C–E–G
  notes.forEach((f,i)=>{ const t0=now+i*0.13;
    const o=actx.createOscillator(),g=actx.createGain();
    o.type='sine'; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.05,t0+0.05); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.95);
    o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0+1.0);
  });
}catch(e){}}

const keys={};
// Unlock the audio context on the very first user gesture so the diving-song
// proximity trigger (which fires from the game loop, not a gesture) can play.
let _audioUnlocked=false;
function unlockAudioOnce(){ if(_audioUnlocked) return; _audioUnlocked=true; window.HaenyeoMusic && window.HaenyeoMusic.unlock && window.HaenyeoMusic.unlock();
  if(window.HaenyeoWeather){ window.HaenyeoWeather.unlock(); window.HaenyeoWeather.setWeather(G.weather); } }
addEventListener('keydown',unlockAudioOnce,{once:false});
addEventListener('pointerdown',unlockAudioOnce,{once:false});
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
  if(k===' '||k==='e'){ if(scene==='village') doInteract(); else if(scene==='shop') doShopInteract(); else if(scene==='home') doHomeInteract(); else if(scene==='market') doMarketInteract(); else if(scene==='museum') doMuseumInteract(); else if(scene==='dive') trySumbi(); }});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});

let joy={on:false,bx:0,by:0,dx:0,dy:0,moved:false};
function toCanvas(e){const r=cv.getBoundingClientRect();const t=e.touches?e.touches[0]:e;
  return {x:(t.clientX-r.left)/r.width*W,y:(t.clientY-r.top)/r.height*H};}
cv.addEventListener('pointerdown',e=>{const p=toCanvas(e);
  if(scene==='village'||scene==='shop'||scene==='home'||scene==='market'||scene==='beach'||scene==='museum'||scene==='kitchen'){joy.on=true;joy.bx=p.x;joy.by=p.y;joy.dx=0;joy.dy=0;joy.moved=false;}
  if(scene==='kitchen' && typeof restaurantTap==='function') restaurantTap(p);
  if(scene==='dive'){divePtr.on=true;divePtrSet(p);
    const _n=performance.now(); if(_n-lastDiveTap<280)dDashReq=true; lastDiveTap=_n;}});
cv.addEventListener('pointermove',e=>{const p=toCanvas(e);
  if(joy.on){joy.dx=p.x-joy.bx;joy.dy=p.y-joy.by;if(Math.hypot(joy.dx,joy.dy)>10)joy.moved=true;}
  if(divePtr.on)divePtrSet(p);});
addEventListener('pointerup',()=>{
  if(joy.on&&!joy.moved&&scene==='village')doInteract();
  else if(joy.on&&!joy.moved&&scene==='shop')doShopInteract();
  else if(joy.on&&!joy.moved&&scene==='home')doHomeInteract();
  else if(joy.on&&!joy.moved&&scene==='market')doMarketInteract();
  else if(joy.on&&!joy.moved&&scene==='museum')doMuseumInteract();
  else if(scene==='dive'&&divePtr.on)trySumbi();
  joy.on=false;joy.dx=joy.dy=0; divePtr.on=false;});

/* ---------------- VILLAGE UPDATE ---------------- */
function rectHit(x,y){
  for(const b of buildings){ if(b.name==='bulteok'||b.name==='pojangmacha')continue;   // walk right up to the fire / the stall
    if(x>b.x-2&&x<b.x+b.w+2&&y>b.y+b.h*0.35&&y<b.y+b.h) return true; }
  return false;
}
function updateVillage(dt){
  if(joinAnim){   // join-in animation cutscene: hold input, celebrate, then reward
    joinAnim.t+=dt; P.moving=false; $('prompt').classList.remove('show');
    if(joinAnim.t>=joinAnim.dur){ joinAnim=null;
      if(G.friendship) G.friendship.dog=Math.min(MAX_HEARTS*HEART_PTS,(G.friendship.dog||0)+12);
      G.renown=(G.renown||0)+3; G.energy=Math.min(100,G.energy+8); updateEnergyHud();
      tone(880,.14,'sine',.045); toast('A good time with the dog & robot ♥'); }
    $('clkTime').textContent=fmtTime(G.time); return;
  }
  if(joinCheerT>0) joinCheerT-=dt;
  if(P.sitting){
    const wantMove=keys['arrowleft']||keys['a']||keys['arrowright']||keys['d']||keys['arrowup']||keys['w']||keys['arrowdown']||keys['s']||(joy.on&&joy.moved);
    if(P.sitAt==='bulteok'){
      if(wantMove){ P.sitting=false; P.sitAt=null; }            // get up from the fire and walk
      else { P.moving=false; $('clkTime').textContent=fmtTime(G.time); refreshPrompt(); return; }
    } else if(G.time>=1080||wantMove){ standFromLounger(); }    // 18:00 — the lounge set is packed away
    else { P.moving=false;
      if(G.energy<100){ G.energy=Math.min(100,G.energy+dt*ENERGY_REST_RATE); updateEnergyHud(); }   // a rest recovers stamina
      $('clkTime').textContent=fmtTime(G.time); refreshPrompt(); return; }
  }
  let mx=0,my=0;
  if(keys['arrowleft']||keys['a'])mx-=1; if(keys['arrowright']||keys['d'])mx+=1;
  if(keys['arrowup']||keys['w'])my-=1;   if(keys['arrowdown']||keys['s'])my+=1;
  if(joy.on&&joy.moved){const m=Math.hypot(joy.dx,joy.dy)||1;mx+=joy.dx/m;my+=joy.dy/m;}
  const m=Math.hypot(mx,my);
  P.moving=m>0.1;
  if(m>0){mx/=m;my/=m; if(mx!==0)P.face=mx>0?1:-1;
    const nx=P.x+mx*SPEED, ny=P.y+my*SPEED;
    if(!rectHit(nx,P.y)&&!wallHit(nx,P.y)) P.x=nx;
    if(!rectHit(P.x,ny)&&!wallHit(P.x,ny)) P.y=ny;
    P.anim+=dt*9;
  }
  P.x=Math.max(P.r,Math.min(W-P.r,P.x));
  P.y=Math.max(96+P.r,Math.min(H-P.r,P.y));

  if(beachEnabled()){
    // step into the water and you're swimming; reach the boat or a working diver to begin the dive
    P.swimming = P.y>=BEACH_Y+10 && P.x>coastX(P.y)+6;
    if(P.swimming){
      const near = DIVE_TARGETS.some(d=>Math.hypot(P.x-d.x,P.y-d.y)<32);
      if(near && !P._atDive){
        P._atDive=true;
        if(haveEnergy('dive')){ startDive(); return; }
        else toast('Too tired to dive — rest first. ⚡');
      }
      if(!near) P._atDive=false;
    } else { P._atDive=false; }
  } else {
    if(P.y>SEA_Y+8){ if(haveEnergy('dive')) startDive(); else P.y=SEA_Y+4; return; }
  }

  $('clkTime').textContent=fmtTime(G.time);
  refreshPrompt();
}
function fmtTime(t){let h=Math.floor(t/60),m=Math.floor(t%60);return h+':'+(m<10?'0':'')+m;}

/* ---------------- NPC WANDERING ---------------- */
/* dirt cross-paths the villagers stroll along: a vertical lane + a horizontal lane */
function onPath(x,y){
  if(x>452 && x<508 && y>148 && y<BEACH_Y) return true;   // vertical lane
  if(y>230 && y<276 && x>130 && x<796) return true;       // horizontal lane
  return false;
}
function npcPickTarget(n){
  for(let i=0;i<14;i++){
    const a=Math.random()*6.28, rad=10+Math.random()*n.roam;
    const tx=n.ax+Math.cos(a)*rad, ty=n.ay+Math.sin(a)*rad;
    if(tx<22||tx>W-22||ty<118||ty>BEACH_Y-14) continue;   // stay on the meadow, off the shore
    if(rectHit(tx,ty)) continue;
    if(!onPath(tx,ty)) continue;                          // villagers keep to the paths
    n.tx=tx; n.ty=ty; return;
  }
  n.tx=n.x; n.ty=n.y;
}
function updateNPCs(dt){
  const curfew = (typeof G!=='undefined') && (G.time>=22*60 || G.time<6*60);   // 22:00 till dawn — everyone's home for the night
  for(const n of NPCS){
    if(n.talking){ n.moving=false; continue; }              // freeze whoever you're chatting with
    if(n.atHome){ n.moving=false; continue; }                // already tucked in for the night
    if(curfew){
      if(n.rest!=='none'){ freeSeat(n); n.rest='none'; }     // leave the fire, head home
      const dx=n.home.x-n.x, dy=n.home.y-n.y, m=Math.hypot(dx,dy)||1;
      if(m<18){ n.atHome=true; n.moving=false; continue; }    // reached the doorway → go inside
      const sp=n.speed*1.3; n.x+=dx/m*sp; n.y+=dy/m*sp;
      n.face=dx>=0?1:-1; n.moving=true; n.anim+=dt*5.5; continue;
    }
    // ---- resting at the bulteok ----
    if(n.rest==='resting'){
      n.moving=false; n.anim+=dt*1.4;                         // gentle idle sway
      n.face = (n.x <= BULTEOK_FIRE.x) ? 1 : -1;              // turn toward the fire
      n.restTimer-=dt;
      if(n.restTimer<=0){ freeSeat(n); n.rest='none'; n.restCd=30+Math.random()*45; npcPickTarget(n); }
      continue;
    }
    if(n.rest==='going'){
      const s=REST_SEATS[n.seat];
      let dx=s.x-n.x, dy=s.y-n.y, m=Math.hypot(dx,dy)||1;
      if(m<5){ n.rest='resting'; n.restTimer=10+Math.random()*16; n.moving=false; continue; }
      const sp=n.speed; n.x+=dx/m*sp; n.y+=dy/m*sp;
      if(Math.abs(dx)>0.4) n.face=dx>0?1:-1;
      n.moving=true; n.anim+=dt*5.5; continue;
    }
    // occasionally decide to wander down to the fire for a rest
    if(n.restCd>0){ n.restCd-=dt; }
    else if(restingCount()<2 && Math.random()<0.02){
      const seat=takeFreeSeat();
      if(seat>=0){ n.seat=seat; n.rest='going'; continue; }
      n.restCd=8+Math.random()*12;
    }
    let dx=n.tx-n.x, dy=n.ty-n.y, m=Math.hypot(dx,dy);
    if(m<4){ npcPickTarget(n); dx=n.tx-n.x; dy=n.ty-n.y; m=Math.hypot(dx,dy)||1; }  // reached → stroll on, no pausing
    const sp=n.speed;
    const nx=n.x+dx/m*sp, ny=n.y+dy/m*sp;
    const onP=onPath(n.x,n.y);   // once on a path stay on it; if off-path (returning from the fire) move freely back
    if(!rectHit(nx,n.y) && (!onP||onPath(nx,n.y))) n.x=nx; else n.tx=n.x;
    if(!rectHit(n.x,ny) && (!onP||onPath(n.x,ny))) n.y=ny; else n.ty=n.y;
    if(Math.abs(dx)>0.5) n.face=dx>0?1:-1;
    n.moving=true; n.anim+=dt*5.5;
  }
}

/* pets wander the lanes, pausing to sit now and then */
function petPickTarget(p){
  for(let i=0;i<10;i++){
    const a=Math.random()*6.28, rad=22+Math.random()*p.roam;
    const tx=p.ax+Math.cos(a)*rad, ty=p.ay+Math.sin(a)*rad;
    if(tx<26||tx>W-26||ty<122||ty>BEACH_Y-10) continue;   // stay on the meadow, off the shore
    if(rectHit(tx,ty)) continue;
    p.tx=tx; p.ty=ty; return;
  }
  p.tx=p.x; p.ty=p.y;
}
function updatePets(dt){
  for(const p of PETS){
    if(p.petJoy>0) p.petJoy=Math.max(0,p.petJoy-dt);   // floating-heart reaction fades
    if(p.wait>0){ p.wait-=dt; p.moving=false; continue; }     // sitting / resting
    let dx=p.tx-p.x, dy=p.ty-p.y, m=Math.hypot(dx,dy);
    if(m<4){ p.wait=0.9+Math.random()*3.2; petPickTarget(p); p.moving=false; continue; }
    const nx=p.x+dx/m*p.speed, ny=p.y+dy/m*p.speed;
    if(!rectHit(nx,p.y)) p.x=nx; else p.tx=p.x;
    if(!rectHit(p.x,ny)) p.y=ny; else p.ty=p.y;
    if(Math.abs(dx)>0.4) p.face=dx>0?1:-1;
    p.moving=true; p.anim+=dt*9;
  }
}

function nearest(){
  let best=null,bd=44;
  for(const n of NPCS){ if(n.atHome)continue; const d=Math.hypot(P.x-n.x,P.y-(n.y+8));if(d<bd){bd=d;best={type:'npc',npc:n};}}
  for(const p of PETS){const d=Math.hypot(P.x-p.x,P.y-p.y);if(d<38&&d<bd){bd=d;best={type:'pet',pet:p};}}
  for(const s of STATUES){const d=Math.hypot(P.x-s.x,P.y-s.y); if(d<46&&d<bd){bd=d;best={type:'statue'};}}
  {const bt=buildings.find(b=>b.name==='bulteok'); if(bt){const d=Math.hypot(P.x-(bt.x+bt.w/2),P.y-(bt.y+bt.h/2)); if(d<48&&d<bd){bd=d;best={type:'bulteok'};}}}
  {const r=pojangRect(); const d=Math.hypot(P.x-(r.x+r.w/2),P.y-(r.y+r.h-10)); if(d<56&&d<bd){bd=d;best={type:'pojangmacha'};}}
  for(const b of buildings){
    if(b.name==='home'||b.name==='coop'||b.name==='store'||b.name==='museum'){
      const cx=b.x+b.w/2, cy=b.y+b.h; const d=Math.hypot(P.x-cx,P.y-cy);
      if(d<46){bd=d;best={type:'door',b};}
    }
  }
  if(!best && G.time<1080){   // the deck chairs are out until 18:00
    const d=Math.hypot(P.x-LOUNGER.x,P.y-LOUNGER.y);
    if(d<48) best={type:'lounger'};
  }
  { const act=activityNow();   // walk up to the dog & robot's current activity to join in
    if(act && !(G.joinedToday&&G.joinedToday[act.key])){
      const d=Math.hypot(P.x-act.x,P.y-act.y); if(d<56 && d<bd){ bd=d; best={type:'joinact',act}; } } }
  if(beachEnabled()){
    if(!best && P.y>=BEACH_Y && P.x < coastX(P.y)-8){
      best = {type:'beach'};   // sand → clean the beach; out in the water you swim to the boat/divers to dive
    }
  } else {
    if(P.y>SEA_Y-34&&P.y<=SEA_Y+8){best={type:'sea'};}
  }
  return best;
}
let current=null;
/* the dog & robot cycle through a daily beach activity — the diver can join in (once each per day) */
let joinCheerT=0, joinCheerX=0, joinCheerY=0, joinAnim=null;
function activityNow(){
  const tm=G.time;
  if(tm>=1020||tm<180) return {key:'movie', label:'movie night', x:178, y:572};
  if(tm>=180&&tm<300) return null;                                  // heading home / asleep
  if(tm>=480&&tm<600) return {key:'surf', label:'surfing', x:520, y:545};
  if(tm>=600&&tm<660) return {key:'hike', label:'morning hike', x:470, y:202};
  if(tm>=660&&tm<720) return {key:'picnic', label:'picnic', x:470, y:560};
  if(tm>=720&&tm<840) return {key:'skate', label:'roller skating', x:470, y:520};
  if(tm>=840&&tm<1020) return {key:'dive', label:'diving', x:520, y:545};
  return {key:'yoga', label:'beach yoga', x:282, y:556};            // 5:00–8:00
}
function joinActivity(act){
  if(joinAnim) return;
  G.joinedToday=G.joinedToday||{}; G.joinedToday[act.key]=true;   // mark now so it can't re-trigger
  // hop over beside the companions and play a little join-in animation (reward lands when it ends)
  joinAnim={act, t:0, dur:2.8};
  P.x=Math.max(40,Math.min(W-40,act.x+24)); P.y=act.y; P.face=-1; P.moving=false; P.sitting=false;
  $('prompt').classList.remove('show');
  tone(660,.1,'sine',.05);
}
function refreshPrompt(){
  current=nearest();
  if(P.sitting && P.sitAt!=='bulteok') current={type:'lounger'};
  const el=$('prompt');
  if(!current){el.classList.remove('show');return;}
  let txt='';
  if(current.type==='npc') txt='Talk to '+current.npc.roman;
  else if(current.type==='pet') txt='Pet the '+current.pet.label;
  else if(current.type==='statue') txt='Examine · Dol Hareubang';
  else if(current.type==='bulteok') txt='Examine · Bulteok';
  else if(current.type==='pojangmacha') txt=kitchenOpen()?'Open 해녀의 부엌 · the Kitchen':'해녀의 부엌 · opens 17:00–03:00';
  else if(current.type==='lounger') txt=P.sitting?'Stand up':'Rest on the lounger';
  else if(current.type==='door') txt = current.b.name==='home'?'Go inside':(current.b.name==='coop'?'Enter market':(current.b.name==='museum'?'Enter the museum':'Enter shop'));
  else if(current.type==='joinact') txt='Join the '+current.act.label;
  else if(current.type==='beach') txt='Clean the beach';
  else if(current.type==='sea') txt='Dive';
  el.textContent=txt; el.classList.add('show');
}
$('prompt').onclick=()=>{ if(scene==='village') doInteract(); else if(scene==='shop') doShopInteract(); else if(scene==='home') doHomeInteract(); else if(scene==='market') doMarketInteract(); else if(scene==='museum') doMuseumInteract(); };

function doInteract(){
  if(!current) return;
  if(current.type==='npc') openDialogue(current.npc);
  else if(current.type==='pet') petThePet(current.pet);
  else if(current.type==='statue') openStatueInfo();
  else if(current.type==='bulteok') openBulteokInfo();
  else if(current.type==='pojangmacha'){
    if(!kitchenOpen()) toast('해녀의 부엌 is open 17:00–03:00.');
    else if(haveEnergy('kitchen') && typeof enterRestaurant==='function') enterRestaurant();
  }
  else if(current.type==='lounger'){ if(P.sitting) standFromLounger(); else sitOnLounger(); }
  else if(current.type==='door'){ if(current.b.name==='home') enterHome(); else if(current.b.name==='coop') enterMarket(); else if(current.b.name==='museum') enterMuseum(); else enterShop(); }
  else if(current.type==='joinact') joinActivity(current.act);
  else if(current.type==='beach') startBeachClean();
  else if(current.type==='sea') openDiveStart();
}

/* ---- take a rest on the beach deck chair ---- */
function sitOnLounger(){
  P.sitting=true; P.x=LOUNGER.x; P.y=LOUNGER.y; P.face=1; P.moving=false;
  toast('You stretch out on the deck chair — resting restores your energy ⚡');
  if(typeof tone==='function') tone(420,.08,'sine',.04);
}
function standFromLounger(){
  P.sitting=false; P.x=LOUNGER.x+44; P.y=LOUNGER.y+10; P.face=1;
}

/* Walk up to the cat or Jeju dog and give them a pat — they pause, face you,
   do a little happy hop with a floating heart, and warm to you (once a day). */
function petThePet(p){
  p.face = (P.x < p.x) ? -1 : 1;   // turn to look at the diver
  p.wait = Math.max(p.wait, 1.3);  // sit still and enjoy the attention
  p.petJoy = 1;                    // drives the heart + hop in the renderer
  if(p.kind==='cat') meowSound(); else barkSound();   // the cat meows, the dog barks
  const first = !G.pettedToday[p.id];
  const happy = p.kind==='cat' ? 'purrs' : 'wags its tail';
  if(first){
    G.pettedToday[p.id]=true;
    const before=hearts(p.id);
    G.friendship[p.id]=Math.min(MAX_HEARTS*HEART_PTS,(G.friendship[p.id]||0)+18);
    toast('The '+p.label+' '+happy);
    if(hearts(p.id)>before) setTimeout(()=>toast('♥ The '+p.label+' likes you more'),300);
  } else {
    G.friendship[p.id]=Math.min(MAX_HEARTS*HEART_PTS,(G.friendship[p.id]||0)+3);
    toast('The '+p.label+' '+happy+' softly');
  }
}

/* ---------------- DIALOGUE + FRIENDSHIP ---------------- */
let dlg={npc:null};
let dialogBg='village';
const convoRot={};   // remembers where each topic left off, so re-asking advances
function buildConvoButtons(n){
  const btns=$('dlgBtns'); btns.innerHTML='';
  (n.topics||[]).forEach((t,ti)=>{
    const b=document.createElement('button'); b.className='btn ghost'; b.textContent=t.label;
    b.onclick=()=>{
      const key=n.id+'|'+ti, idx=convoRot[key]||0;
      $('dlgText').textContent='“'+t.lines[idx % t.lines.length]+'”';
      convoRot[key]=idx+1;
      const before=hearts(n.id);
      G.friendship[n.id]=Math.min(MAX_HEARTS*HEART_PTS,(G.friendship[n.id]||0)+4);
      $('dlgHearts').textContent=heartStr(n.id);
      if(hearts(n.id)>before) setTimeout(()=>toast('♥ '+n.roman+' likes you more'),250);
      if(typeof tone==='function') tone(560,.05,'sine',.04);
    };
    btns.appendChild(b);
  });
  const haveCatch=Object.values(G.catch).some(v=>v>0);
  if(haveCatch){
    const gift=document.createElement('button');gift.className='btn';gift.textContent='Give a gift 🎁';
    gift.onclick=()=>giveGift(n); btns.appendChild(gift);
  }
  const bye=document.createElement('button');bye.className='btn ghost';bye.textContent='Bye';
  bye.onclick=closeDialogue; btns.appendChild(bye);
}
function openDialogue(n){
  scene='dialogue-open'; dialogBg='village'; n.talking=true;
  dlg.npc=n;
  const first=!G.talkedToday[n.id];
  let line;
  if(first){ G.talkedToday[n.id]=true; const before=hearts(n.id); G.friendship[n.id]+=22;
    line = n.daily[Math.min(n.daily.length-1, Math.floor(G.friendship[n.id]/HEART_PTS))];
    if(hearts(n.id)>before) setTimeout(()=>toast('♥ '+n.roman+' likes you more'),300);
  } else {
    line = n.chat[Math.floor(Math.random()*n.chat.length)];
  }
  $('dlgName').firstChild.textContent=n.roman;
  $('dlgRole').textContent=n.role;
  $('dlgHearts').textContent=heartStr(n.id);
  $('dlgText').textContent=line;
  drawPortrait(n);
  buildConvoButtons(n);
  $('dialogue').classList.add('show');
  $('prompt').classList.remove('show');
}
function giveGift(n){
  const bestId=bestCatchId();
  if(!bestId){return;}
  removeOneCatch(bestId); G.friendship[n.id]+=40;
  const s=SPECIES.find(x=>x.id===bestId);
  const okbun=(n.id==='okbun');
  $('dlgText').textContent = `(You give a fresh ${s.name}.) "` + (okbun ? "Ooh, this'll make a fine stew!" : "For me? You shouldn't have.") + `"`;
  $('dlgHearts').textContent=heartStr(n.id);
  toast('♥ +gift');
  buildConvoButtons(n);
}
function closeDialogue(){ $('dialogue').classList.remove('show'); if(dlg.npc)dlg.npc.talking=false; scene=dialogBg; }

/* ---------------- SLEEP / DAY CYCLE ---------------- */
function askSleep(){   // the home bed — a full night that rolls into the next day
  scene='panel'; panelBg='home';
  const cancel=$('sleepCancel'); if(cancel) cancel.style.display='';   // resting is always the player's choice
  $('sleepNote').textContent = G.time>17*60
    ? "The sun's gone down over the black rocks. Rest, and dive again tomorrow."
    : "It's still early — but you can rest if you like.";
  $('pSleep').classList.remove('hidden'); $('prompt').classList.remove('show');
}
/* roll the calendar to a fresh dawn — whether the diver slept, rested at the fire, or simply stayed up till 6:00 */
function newDay(){
  G.day++; G.season=Math.floor((G.day-1)/7)%4;
  G.time=6*60;
  G.talkedToday={}; G.songToday=false; G.pettedToday={}; G.caveToday=false; G.joinedToday={};
  G.energy=100; updateEnergyHud();   // morning restores your stamina
  tickClock._late=false; tickClock._curfew=false; tickClock._forced=false; tickClock._past=false;
  rollWeather(true);   // a new day's weather, announced
  // overnight the tide washes fresh litter onto the shore — worse on rough days
  const drift = (G.weather==='wind'?BEACH_TUNING.driftWind:(G.weather==='rain'?BEACH_TUNING.driftRain:BEACH_TUNING.driftCalm));
  G.beachHealth -= drift; clampHealth();
  NPCS.forEach(n=>{ n.atHome=false; n.x=n.ax; n.y=n.ay; n.tx=n.ax; n.ty=n.ay; n.moving=false; n.wait=Math.random()*2; });  // villagers back out for the morning
  $('clkDate').textContent=SEASONS[G.season]+' · Day '+G.day;
  $('clkTime').textContent=fmtTime(G.time);
  toast('Day '+G.day);
}
$('sleepBtn').onclick=()=>{
  newDay();
  const cancel=$('sleepCancel'); if(cancel) cancel.style.display='';
  P.sitting=false; P.x=470; P.y=290;
  $('pSleep').classList.add('hidden'); scene='village';
};
$('sleepCancel').onclick=()=>{ $('pSleep').classList.add('hidden'); scene='home'; };
/* short rest — lie on the bed for a few seconds, recover some stamina; the day does NOT roll over */
let restT=0; const REST_DUR=5.0;
function startRest(){
  scene='resting'; restT=0;
  P.x=bedStation.x; P.y=bedStation.y+30; P.face=1; P.moving=false;
  $('pSleep').classList.add('hidden'); $('prompt').classList.remove('show');
  if(typeof tone==='function') tone(330,.3,'sine',.04);
}
function updateRest(dt){ restT+=dt; if(restT>=REST_DUR) finishRest(); }
function finishRest(){
  G.energy=Math.min(100, G.energy+45);                 // a nap brings some stamina back
  G.time=Math.min(G.time+120, 24*60-1);                // ~2 hours pass (stays the same day)
  if(typeof updateEnergyHud==='function') updateEnergyHud();
  $('clkTime').textContent=fmtTime(G.time);
  P.x=bedStation.x; P.y=bedStation.y+30; P.face=1; P.moving=false;   // step off the bedding, free to move
  scene='home';
  toast('A short rest · +stamina'); if(typeof tone==='function') tone(520,.3,'sine',.04);
}
$('restBtn').onclick=()=>{ startRest(); };

/* ---------------- CO-OP SELL ---------------- */
function openSell(){
  scene='panel'; panelBg='market';
  const list=$('sellList'); list.innerHTML=''; let total=0,any=false;
  for(const s of SPECIES){ const n=G.catch[s.id]||0; if(n>0){any=true;const sub=catchSaleValue(s.id);total+=sub;
    const row=document.createElement('div');row.className='line pick sel';
    row.dataset.kind='sp'; row.dataset.id=s.id; row.dataset.sub=sub;
    row.innerHTML=`<span><span class="chk"></span><span class="dot" style="background:${s.color}"></span>${s.kr} ${s.name} <span style="color:#d59f2e">${starStr(catchAvgStars(s.id))}</span> ×${n}</span><span class="right">${sub}</span>`;
    row.onclick=()=>{ row.classList.toggle('sel'); recomputeSell(); };
    list.appendChild(row);} }
  for(const b of BEACH_ITEMS){ const n=G.trash[b.id]||0; if(n>0){any=true;const sub=n*b.value;total+=sub;
    const row=document.createElement('div');row.className='line pick sel';
    row.dataset.kind='tr'; row.dataset.id=b.id; row.dataset.sub=sub;
    row.innerHTML=`<span><span class="chk"></span><span class="dot" style="background:${b.color}"></span>${b.kr} ${b.name} ×${n}</span><span class="right">${sub}</span>`;
    row.onclick=()=>{ row.classList.toggle('sel'); recomputeSell(); };
    list.appendChild(row);} }
  if(any){const t=document.createElement('div');t.className='line tot';
    t.innerHTML=`<span>Selected</span><span id="sellTot">${total} won</span>`;list.appendChild(t);
    $('sellNote').textContent='Tap an item to choose what Migyeong buys.'; $('sellBtn').style.display=''; recomputeSell();}
  else{ $('sellNote').textContent='"Your net is empty — go on, the sea is waiting."'; $('sellBtn').style.display='none'; }
  $('pSell').classList.remove('hidden'); $('prompt').classList.remove('show');
}
function recomputeSell(){
  let total=0, selCount=0;
  document.querySelectorAll('#sellList .line.pick').forEach(r=>{
    if(r.classList.contains('sel')){ total+=+r.dataset.sub; selCount++; }
  });
  const tot=document.getElementById('sellTot'); if(tot) tot.textContent=total+' won';
  const btn=$('sellBtn');
  btn.textContent = selCount ? 'Sell selected · '+total+' won' : 'Choose something to sell';
  btn.disabled = !selCount; btn.style.opacity = selCount ? '1' : '.5';
}
$('sellBtn').onclick=()=>{
  let total=0;
  document.querySelectorAll('#sellList .line.pick.sel').forEach(r=>{
    total+=+r.dataset.sub;
    if(r.dataset.kind==='sp') clearCatch(r.dataset.id); else delete G.trash[r.dataset.id];
  });
  if(!total) return;
  G.money+=total; G.soldWon=(G.soldWon||0)+total; $('moneyV').textContent=G.money;   // lifetime market earnings
  $('pSell').classList.add('hidden'); scene='market'; toast('+'+total+' won');
};
$('sellClose').onclick=()=>{ $('pSell').classList.add('hidden'); scene='market'; };

/* ---------------- HOME INTERIOR (walkable room) ---------------- */
const HOME={x0:40,y0:150,x1:920,y1:586};
/* hotspots tuned to home-bg.png (Dave-the-Diver art) — each well separated so
   it's easy to walk up to. Solid furniture blocks keep the player off the props. */
const hearthBlk={x:150, y:250, w:182, h:96};   // 정지 — stone hearth + iron cauldron (left)
const gopangBlk={x:414, y:252, w:106, h:96};   // 고팡 — onggi jar stack
const homeTable={x:428, y:398, w:112, h:46};   // low dining table (center foreground)
const gudeulBlk={x:626, y:252, w:236, h:98};   // 구들방 — raised sleeping platform (right)
const stoveStation   ={x:212, y:384};          // cook at the hearth
const gopangStation  ={x:458, y:372};          // store catch in the 고팡
const tableStation   ={x:484, y:472};          // eat a plated meal (below the table block, so you're never stuck)
const photoStation   ={x:632, y:360};          // family photo on the wall
const bedStation     ={x:748, y:362};          // sleep on the folded bedding
const maskStation    ={x:892, y:392};          // grandmother's 왕눈 mask on the low table
const wardrobeStation={x:108, y:512};          // change wetsuit (armoire, foreground left)
const gramoStation   ={x:288, y:512};          // gramophone — music
const jangStation    ={x:772, y:520};          // 항아리 crocks — ferment (foreground right)
const homeExit={x:438, y:540, w:84, h:38};
let homeCur=null, homeMaskIdx=0, homePhotoIdx=0, homeJangIdx=0;

/* ---- gramophone: opens the Village Radio music player (see music.js) ---- */
let musicOn=false, musicTimer=null;
function playGramo(){
  // The gramophone is the diver's record player — tapping it opens the
  // full Village Radio, which then stays stuck on screen as a mini-player.
  if(window.HaenyeoMusic){ window.HaenyeoMusic.open(); return; }
  // fallback: the old looping pentatonic tune
  if(musicOn){ stopGramo(); return; }
  musicOn=true;
  try{ if(actx&&actx.state==='suspended') actx.resume(); }catch(e){}
  const notes=[523,587,659,784,880,784,659,587, 523,659,587,784,659,880,784,659];
  const dur=0.40; let i=0;
  (function step(){
    if(!musicOn) return;
    const f=notes[i%notes.length];
    tone(f,dur*1.7,'triangle',.05);
    if(i%2===0) tone(f/2,dur*2.0,'sine',.028);   // soft bass under-note
    i++; musicTimer=setTimeout(step,dur*1000);
  })();
  toast('♪ Now playing');
}
function stopGramo(){ musicOn=false; if(musicTimer)clearTimeout(musicTimer); musicTimer=null; }

function enterHome(){ scene='home'; panelBg='home'; P.x=494; P.y=556; P.face=1; $('prompt').classList.remove('show'); }
function leaveHome(){ stopGramo(); scene='village'; const hb=buildings.find(b=>b.name==='home'); P.x=hb.x+hb.w/2; P.y=hb.y+hb.h+18; P.face=1; $('prompt').classList.remove('show'); }

/* the wooden plank floor — the ONLY walkable region (the stone walls, the back
   wall row and the raised 구들방 platform are all off-limits). */
const HOME_FLOOR=[
  [120,422],[150,356],[862,356],[905,388],[905,582],[60,582]
];
function homeHit(x,y){
  if(!pointInPoly(x,y,HOME_FLOOR)) return true;          // only the wood floor is walkable
  for(const b of [hearthBlk,gopangBlk,homeTable,gudeulBlk]){
    if(x>b.x-2 && x<b.x+b.w+2 && y>b.y-2 && y<b.y+b.h+6) return true;
  }
  return false;
}
function updateHome(dt){
  let mx=0,my=0;
  if(keys['arrowleft']||keys['a'])mx-=1; if(keys['arrowright']||keys['d'])mx+=1;
  if(keys['arrowup']||keys['w'])my-=1;   if(keys['arrowdown']||keys['s'])my+=1;
  if(joy.on&&joy.moved){const m=Math.hypot(joy.dx,joy.dy)||1;mx+=joy.dx/m;my+=joy.dy/m;}
  const m=Math.hypot(mx,my); P.moving=m>0.1;
  if(m>0){mx/=m;my/=m; if(mx!==0)P.face=mx>0?1:-1;
    const nx=P.x+mx*SPEED, ny=P.y+my*SPEED;
    if(!homeHit(nx,P.y))P.x=nx; if(!homeHit(P.x,ny))P.y=ny; P.anim+=dt*9;}
  P.x=Math.max(HOME.x0+P.r,Math.min(HOME.x1-P.r,P.x));
  P.y=Math.max(HOME.y0+P.r,Math.min(HOME.y1-P.r,P.y));
  refreshHomePrompt();
}
function homeNearest(){
  let best=null,bd=1e9;
  const cand=[['stove',stoveStation,46],['gopang',gopangStation,48],['bed',bedStation,54],
              ['mask',maskStation,48],['wardrobe',wardrobeStation,52],['gramo',gramoStation,54],
              ['jang',jangStation,48],['photo',photoStation,50]];
  if(G.preparedMeal) cand.push(['table',tableStation,56]);
  for(const [type,st,r] of cand){ const d=Math.hypot(P.x-st.x,P.y-st.y); if(d<r&&d<bd){bd=d;best={type};} }
  if(P.x>homeExit.x-10&&P.x<homeExit.x+homeExit.w+10&&P.y>homeExit.y-24) best={type:'exit'};
  return best;
}
function refreshHomePrompt(){
  homeCur=homeNearest(); const el=$('prompt');
  if(!homeCur){el.classList.remove('show');return;}
  const T={ stove:'Cook', gopang:'Store the catch · 고팡', table:'Eat', bed:'Sleep',
            mask:'Grandmother’s mask', wardrobe:'Change suit', jang:'The crocks · 항아리',
            photo:'Family photo', exit:'Step outside' };
  let txt = T[homeCur.type] || '';
  if(homeCur.type==='gramo') txt=(window.HaenyeoMusic&&window.HaenyeoMusic.playing)?'Music player':'Play music';
  el.textContent=txt; el.classList.add('show');
}
function doHomeInteract(){
  if(!homeCur)return;
  switch(homeCur.type){
    case 'exit': leaveHome(); break;
    case 'bed': askSleep(); break;
    case 'stove': openCook(); break;
    case 'table': startEat(); break;
    case 'wardrobe': openChange(); break;
    case 'gramo': playGramo(); break;
    case 'mask': homeMaskLine(); break;
    case 'gopang': homeGopang(); break;
    case 'jang': homeJangLine(); break;
    case 'photo': homePhotoLine(); break;
  }
}
/* ---- home story & culture interactions (calm, narrative; reuse showFact) ---- */
const HOME_MASK_LINES=[
  '“This 왕눈 was your grandmother’s. Sixty winters in cold water, and the glass is still clear.”',
  '“She pressed it into your hands the morning her own could no longer hold it. ‘The sea will teach you the rest.’”',
  '“Some mornings you hold it to your face before the mirror — and you are eight years old again, learning to breathe.”',
];
function homeMaskLine(){ showFact(HOME_MASK_LINES[homeMaskIdx%HOME_MASK_LINES.length], 9, '할머니의 유산 · A grandmother’s keepsake'); homeMaskIdx++; if(typeof tone==='function') tone(392,.12,'sine',.04); }
const HOME_PHOTO_LINES=[
  '“Three generations on the rocks at Seongsan — your grandmother in front, already a sanggun; your mother a shy junggun behind.”',
  '“No one is smiling; the wind was bitter that day. But everyone came home, and that was enough.”',
  '“There is an empty space at the edge of the frame. They always left room for the next diver.”',
];
function homePhotoLine(){ showFact(HOME_PHOTO_LINES[homePhotoIdx%HOME_PHOTO_LINES.length], 9, '가족 · The family'); homePhotoIdx++; if(typeof tone==='function') tone(523,.1,'sine',.04); }
const HOME_JANG_LINES=[
  '“Soybean paste, salted anchovy, a winter’s worth of kimchi — the crocks breathe slowly in the dark.”',
  '“Lift a lid and the whole yard smells of the sea, slowly turning to gold.”',
];
function homeJangLine(){ showFact(HOME_JANG_LINES[homeJangIdx%HOME_JANG_LINES.length], 7, '항아리 · The crocks'); homeJangIdx++; if(typeof tone==='function') tone(300,.1,'sine',.035); }
function homeGopang(){
  // the 고팡 storeroom — the family elder's domain. Set a catch by for the lean months.
  const id=(typeof bestCatchId==='function')?bestCatchId():null;
  if(id && typeof removeOneCatch==='function'){
    const s=SPECIES.find(x=>x.id===id); removeOneCatch(id);
    const won=Math.max(4, Math.round((s?s.value:10)*0.6));
    G.money+=won; const mv=$('moneyV'); if(mv) mv.textContent=G.money;
    showFact('You salt the '+(s?s.name:'catch')+' and set it on the 고팡 shelf — provision for the lean months. The eldest always kept this room. (+'+won+' won)', 8, '고팡 · The storeroom');
    if(typeof toast==='function') toast('Put by for winter · +'+won+' won');
    if(typeof tone==='function') tone(440,.12,'sine',.04);
  } else {
    showFact('The 고팡 — the family storeroom, always the eldest’s to keep. Empty-handed today; bring a catch home and set some by.', 8, '고팡 · The storeroom');
    if(typeof tone==='function') tone(300,.1,'sine',.03);
  }
}
/* ---- changing room: switch between owned wetsuits ---- */
function openChange(){
  scene='panel'; panelBg='home';
  $('prompt').classList.remove('show');
  buildChange();
  $('pChange').classList.remove('hidden');
}
function buildChange(){
  const list=$('changeList'); list.innerHTML='';
  for(const id of ['traditional','modern']){
    const s=SUITS[id], owned=G.owned[id], on=G.suit===id;
    const c=document.createElement('button');
    c.className='suitcard'+(on?' on':'')+(owned?'':' locked');
    c.innerHTML='<div class="sw '+id+'"></div>'+
      '<div class="si"><div class="sn">'+s.name+' · '+s.kr+'</div>'+
      '<div class="sd">Breath '+s.breath+(owned?'':' · buy at the gear shop ('+s.cost+' won)')+'</div></div>'+
      '<div class="stag">'+(on?'WORN':(owned?'WEAR':'LOCKED'))+'</div>';
    if(owned && !on) c.onclick=()=>{ G.suit=id; tone(440,.12,'sine',.05); toast('Now wearing: '+s.name); buildChange(); };
    list.appendChild(c);
  }
}
$('changeClose').onclick=()=>{ $('pChange').classList.add('hidden'); scene='home'; };
/* ---- sit down and eat the plated ramyeon ---- */
let eatT=0; const EAT_DUR=3.0;
function startEat(){
  if(!G.preparedMeal) return;
  scene='eating'; eatT=0;
  P.x=402; P.y=450; P.face=1; P.moving=false;   // sit on the LEFT (red) floor cushion, facing the bowl
  $('prompt').classList.remove('show');
  tone(300,.25,'sine',.04);
}
function updateEat(dt){
  eatT+=dt;
  if(eatT>=EAT_DUR) finishEat();
}
function finishEat(){
  G.meal=G.preparedMeal; G.preparedMeal=null; updateMealBadge();
  toast('Well fed · '+G.meal.label); tone(520,.4,'sine',.05);
  P.x=484; P.y=490; P.face=1; P.moving=false;   // get up from the cushion onto the floor
  scene='home';
}
function openStatueInfo(){
  scene='panel'; panelBg='village';
  $('prompt').classList.remove('show');
  $('pStatue').classList.remove('hidden');
}
$('statueClose').onclick=()=>{ $('pStatue').classList.add('hidden'); scene='village'; };
function openBulteokInfo(){
  scene='panel'; panelBg='village';
  $('prompt').classList.remove('show');
  $('pBulteok').classList.remove('hidden');
}
$('bulteokClose').onclick=()=>{ $('pBulteok').classList.add('hidden'); scene='village'; };
/* the bulteok is a quick warm-up between dives — a short rest: a little time passes, some stamina back. Not a full night. */
function bulteokRest(){
  G.time = Math.min(G.time + 90, 24*60 - 1);   // ~90 min by the fire, never rolling into the next day
  G.energy = Math.min(100, G.energy + 40);     // warm up and catch your breath
  updateEnergyHud();
  $('clkTime').textContent = fmtTime(G.time);
  // settle onto the warm stone by the fire (a seated rest until you get up and move)
  P.x = bulteokB.x + bulteokB.w/2; P.y = bulteokB.y + bulteokB.h + 6; P.face = 1;
  P.sitting = true; P.sitAt = 'bulteok'; P.moving = false;
  $('pBulteok').classList.add('hidden'); scene='village';
  toast('Warming up by the fire · +stamina');
}
$('bulteokRest').onclick=()=>{ bulteokRest(); };

/* ---------------- COOKING (home stove) ---------------- */
let cookSel=null;
function mealFor(sel){
  // plain ramyeon is a steady +8s; adding a catch scales bonus with its value
  if(!sel) return {time:8, label:'Plain ramyeon', slow:0};
  const s=SPECIES.find(x=>x.id===sel);
  return {time:Math.round(10+s.value/3), label:s.kr+' ramyeon', slow:0.18, sp:s};
}
function openCook(){
  scene='panel'; panelBg='home'; cookSel=null;
  $('prompt').classList.remove('show');
  buildCook();
  $('pCook').classList.remove('hidden');
}
function buildCook(){
  const list=$('cookList'); list.innerHTML='';
  const have=SPECIES.filter(s=>(G.catch[s.id]||0)>0);
  // plain option chip
  const plain=document.createElement('button'); plain.className='chip'+(cookSel===null?' sel':'');
  plain.innerHTML='<span class="dot" style="background:#e9dcbe"></span>Plain';
  plain.onclick=()=>{cookSel=null;buildCook();}; list.appendChild(plain);
  for(const s of have){
    const c=document.createElement('button'); c.className='chip'+(cookSel===s.id?' sel':'');
    c.innerHTML='<span class="dot" style="background:'+s.color+'"></span>'+s.kr+' ×'+(G.catch[s.id]||0);
    c.onclick=()=>{cookSel=s.id;buildCook();}; list.appendChild(c);
  }
  const meal=mealFor(cookSel);
  $('cookHint').innerHTML = cookSel===null
    ? 'A warm, plain bowl. <b>+'+meal.time+'s</b> underwater next dive.'
    : 'Hearty '+meal.label+'. <b>+'+meal.time+'s</b> underwater &amp; slower breath next dive. <b>(uses 1)</b>';
}
$('cookBtn').onclick=()=>{
  const meal=mealFor(cookSel);
  if(cookSel){ if((G.catch[cookSel]||0)<=0){toast('None left');return;} removeOneCatch(cookSel); }
  G.preparedMeal={time:meal.time, slow:meal.slow, label:meal.label};   // plated, not eaten yet
  $('pCook').classList.add('hidden'); scene='home';
  toast('🍜 '+meal.label+' is ready — eat at the table');
};
$('cookClose').onclick=()=>{ $('pCook').classList.add('hidden'); scene='home'; };
function updateMealBadge(){
  const el=$('mealBadge');
  if(G.meal){ $('mealTxt').textContent='Well-fed · '+G.meal.label+' · +'+G.meal.time+'s'; el.classList.add('show'); }
  else el.classList.remove('show');
}

/* ---------------- GEAR SHOP (menu overlay, optional) ---------------- */
const GEAR_ICON={
  wetsuit:`<svg viewBox="0 0 32 32"><g stroke="#4a3a2c" stroke-width="2" stroke-linejoin="round"><path d="M12 4h8l1 4-2 2v5l1 11h-5l-1-7-1 7H8l1-11V10L7 8z" fill="#39424d"/></g><path d="M16 11v9" stroke="#6f7a85" stroke-width="1.6"/></svg>`,
  net:`<svg viewBox="0 0 32 32"><path d="M6 12h20l-3 15H9z" fill="#cdb98a" stroke="#4a3a2c" stroke-width="2" stroke-linejoin="round"/><path d="M6 12c1-4 19-4 20 0" fill="none" stroke="#4a3a2c" stroke-width="2"/><g stroke="#8a6a3a" stroke-width="1"><path d="M11 13l1 13M16 12v15M21 13l-1 13M7 17h18M8 22h16"/></g></svg>`,
  tool:`<svg viewBox="0 0 32 32"><path d="M13 4v17" stroke="#9c6a3a" stroke-width="3.4" stroke-linecap="round"/><path d="M13 21c0 5 6 5 7 1" fill="none" stroke="#b8bcc0" stroke-width="3.4" stroke-linecap="round"/></svg>`,
  mask:`<svg viewBox="0 0 32 32"><rect x="5" y="10" width="22" height="12" rx="6" fill="#d98ab0" stroke="#4a3a2c" stroke-width="2"/><circle cx="16" cy="16" r="5.4" fill="#a7dcec" stroke="#cdd2d8" stroke-width="1.6"/><path d="M5 13l-2-2M27 13l2-2" stroke="#4a3a2c" stroke-width="2" stroke-linecap="round"/></svg>`,
  tewak:`<svg viewBox="0 0 32 32"><circle cx="16" cy="15" r="9" fill="#e8714a" stroke="#4a3a2c" stroke-width="2"/><path d="M16 6a9 9 0 0 1 0 18" fill="#f0bd4c" opacity=".55"/><ellipse cx="12.5" cy="11.5" rx="2.6" ry="1.6" fill="#fff" opacity=".7"/><path d="M16 24v3M13 27h6" stroke="#4a3a2c" stroke-width="2" stroke-linecap="round"/></svg>`,
};
function buildStore(){
  $('storeWon').textContent=G.money;
  const note=$('storeNote'); if(note) note.textContent=KEEPER_LINES[Math.floor(Math.random()*KEEPER_LINES.length)];
  const list=$('storeList'); list.innerHTML='';
  // --- modern wetsuit ---
  {
    const s=SUITS.modern, owned=G.owned.modern, afford=G.money>=s.cost;
    const c=document.createElement('div');c.className='scard';
    c.innerHTML=`<span class="sicon">${GEAR_ICON.wetsuit}</span><div class="meta"><div class="t">Modern wetsuit</div>
      <div class="d">Breath ${SUITS.traditional.breath}s → ${s.breath}s${owned?' · owned':''}</div></div>`;
    const b=document.createElement('button');b.className='btn';
    b.textContent = owned?'Owned':`${s.cost} won`;
    b.disabled = owned || !afford; if(b.disabled)b.style.opacity=.5;
    b.onclick=()=>{ buyGear('wetsuit'); buildStore(); };
    c.appendChild(b); list.appendChild(c);
  }
  // --- net bag (mangsari) ---
  {
    const arr=GEAR.net, idx=G.netIdx, maxed=idx>=arr.length-1, next=arr[Math.min(idx+1,arr.length-1)];
    const pips=arr.map((_,i)=>`<i class="${i<=idx?'on':''}"></i>`).join('');
    const c=document.createElement('div');c.className='scard';
    c.innerHTML=`<span class="sicon">${GEAR_ICON.net}</span><div class="meta"><div class="t">Net bag<span class="levelpips">${pips}</span></div>
      <div class="d">Net size ${arr[idx].cap}${maxed?' · MAX':` → ${next.cap}`}</div></div>`;
    const b=document.createElement('button');b.className='btn';
    b.textContent = maxed?'Maxed':`${next.cost} won`;
    b.disabled = maxed || G.money<next.cost; if(b.disabled)b.style.opacity=.5;
    b.onclick=()=>{ buyGear('net'); buildStore(); };
    c.appendChild(b); list.appendChild(c);
  }
  // --- harvesting tool ---
  {
    const arr=GEAR.tool, idx=G.toolIdx, maxed=idx>=arr.length-1, next=arr[Math.min(idx+1,arr.length-1)];
    const pips=arr.map((_,i)=>`<i class="${i<=idx?'on':''}"></i>`).join('');
    const c=document.createElement('div');c.className='scard';
    c.innerHTML=`<span class="sicon">${GEAR_ICON.tool}</span><div class="meta"><div class="t">${arr[idx].name}<span class="levelpips">${pips}</span></div>
      <div class="d">Harvest speed ${arr[idx].dig.toFixed(1)}×${maxed?' · MAX':` → ${next.dig.toFixed(1)}× (${next.name})`}</div></div>`;
    const b=document.createElement('button');b.className='btn';
    b.textContent = maxed?'Maxed':`${next.cost} won`;
    b.disabled = maxed || G.money<next.cost; if(b.disabled)b.style.opacity=.5;
    b.onclick=()=>{ buyGear('tool'); buildStore(); };
    c.appendChild(b); list.appendChild(c);
  }
  // --- diving mask ---
  {
    const arr=GEAR.mask, idx=G.maskIdx, maxed=idx>=arr.length-1, next=arr[Math.min(idx+1,arr.length-1)];
    const pips=arr.map((_,i)=>`<i class="${i<=idx?'on':''}"></i>`).join('');
    const c=document.createElement('div');c.className='scard';
    c.innerHTML=`<span class="sicon">${GEAR_ICON.mask}</span><div class="meta"><div class="t">${arr[idx].name}<span class="levelpips">${pips}</span></div>
      <div class="d">Clear sight ${arr[idx].vis}${maxed?' · MAX':` → ${next.vis} (${next.name})`}</div></div>`;
    const b=document.createElement('button');b.className='btn';
    b.textContent = maxed?'Maxed':`${next.cost} won`;
    b.disabled = maxed || G.money<next.cost; if(b.disabled)b.style.opacity=.5;
    b.onclick=()=>{ buyGear('mask'); buildStore(); };
    c.appendChild(b); list.appendChild(c);
  }
  // --- tewak buoy (濟州浮球) ---
  {
    const arr=GEAR.tewak, idx=G.tewakIdx, maxed=idx>=arr.length-1, next=arr[Math.min(idx+1,arr.length-1)];
    const pips=arr.map((_,i)=>`<i class="${i<=idx?'on':''}"></i>`).join('');
    const c=document.createElement('div');c.className='scard';
    c.innerHTML=`<span class="sicon">${GEAR_ICON.tewak}</span><div class="meta"><div class="t">${arr[idx].name}<span class="levelpips">${pips}</span></div>
      <div class="d">Breath recovery ${arr[idx].recover.toFixed(1)}×${maxed?' · MAX':` → ${next.recover.toFixed(1)}× (${next.name})`}</div></div>`;
    const b=document.createElement('button');b.className='btn';
    b.textContent = maxed?'Maxed':`${next.cost} won`;
    b.disabled = maxed || G.money<next.cost; if(b.disabled)b.style.opacity=.5;
    b.onclick=()=>{ buyGear('tewak'); buildStore(); };
    c.appendChild(b); list.appendChild(c);
  }
  // --- beach sack (litter capacity per tide) ---
  {
    const arr=GEAR.bag, idx=G.bagIdx, maxed=idx>=arr.length-1, next=arr[Math.min(idx+1,arr.length-1)];
    const pips=arr.map((_,i)=>`<i class="${i<=idx?'on':''}"></i>`).join('');
    const c=document.createElement('div');c.className='scard';
    c.innerHTML=`<span class="sicon">${GEAR_ICON.net}</span><div class="meta"><div class="t">Beach sack<span class="levelpips">${pips}</span></div>
      <div class="d">Litter per tide ${arr[idx].cap}${maxed?' · MAX':` → ${next.cap}`}</div></div>`;
    const b=document.createElement('button');b.className='btn';
    b.textContent = maxed?'Maxed':`${next.cost} won`;
    b.disabled = maxed || G.money<next.cost; if(b.disabled)b.style.opacity=.5;
    b.onclick=()=>{ buyGear('bag'); buildStore(); };
    c.appendChild(b); list.appendChild(c);
  }
  // --- net cutter (rescue speed) ---
  {
    const arr=GEAR.cutter, idx=G.cutIdx, maxed=idx>=arr.length-1, next=arr[Math.min(idx+1,arr.length-1)];
    const pips=arr.map((_,i)=>`<i class="${i<=idx?'on':''}"></i>`).join('');
    const c=document.createElement('div');c.className='scard';
    c.innerHTML=`<span class="sicon">${GEAR_ICON.tool}</span><div class="meta"><div class="t">${arr[idx].name}<span class="levelpips">${pips}</span></div>
      <div class="d">Cut speed ${arr[idx].spd.toFixed(1)}×${maxed?' · MAX':` → ${next.spd.toFixed(1)}× (${next.name})`}</div></div>`;
    const b=document.createElement('button');b.className='btn';
    b.textContent = maxed?'Maxed':`${next.cost} won`;
    b.disabled = maxed || G.money<next.cost; if(b.disabled)b.style.opacity=.5;
    b.onclick=()=>{ buyGear('cutter'); buildStore(); };
    c.appendChild(b); list.appendChild(c);
  }
}
function openStore(){
  scene='panel'; panelBg='shop';
  $('prompt').classList.remove('show');
  buildStore();
  $('pStore').classList.remove('hidden');
}
$('storeClose').onclick=()=>{ $('pStore').classList.add('hidden'); scene='shop'; };

/* ---------------- SHOP INTERIOR (walkable room) ---------------- */
const SHOP={x0:40,y0:150,x1:920,y1:586};
const counter={x:300,y:176,w:360,h:46};
const standW={x:190,y:360};
const standN={x:625,y:402};
const exitZone={x:438,y:548,w:84,h:34};
const keeper={name:'Mr. Gicheol', roman:'Mr. Gicheol', skin:'#e0bf95', scarf:'#3a6e8c', x:478, y:300, id:'keeper',
  look:{ hairStyle:'short', hair:'#6b6258', male:true, mustache:true, vest:'#5a8c7a', top:'#cbb893', bottom:'#3a3530', skin:'#e0bf95' }};
const KEEPER_LINES=[
  "Everything a diver needs — suits, nets, weights. What'll it be?",
  "A good net pays for itself in a week, I always say.",
  "Deeper water needs a thicker suit. Don't be stubborn about it.",
];
let shopCur=null;

function enterShop(){ scene='shop'; P.x=480; P.y=552; P.face=1; $('prompt').classList.remove('show'); }
function leaveShop(){ scene='village'; P.x=176; P.y=400; P.face=1; $('prompt').classList.remove('show'); }

/* ---------------- HAENYEO MUSEUM (walkable view) ---------------- */
const MUSEUMF={x0:46,y0:H-150,x1:W-46,y1:H-26};   // (legacy) bounding box
// One open, connected walkable floor (canvas coords): the whole foreground plus
// a wide corridor up EACH side of the sunken net-mending pit, which is carved out
// as a top-centre notch. The hanok corner (bottom-right) is excluded. No more
// squeezing through a single left-hand gap — you can circle the pit freely.
const MUSEUM_POLY=[
  [58,316],[300,316],[300,408],[668,408],[668,316],[904,316],
  [904,452],[806,468],[806,586],[58,586]
];
function pointInPoly(x,y,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}
function inMuseumFloor(x,y){ return pointInPoly(x,y,MUSEUM_POLY); }
const museumExit={x:W/2-44,y:H-46,w:88,h:34};
let museumCur=null, museumT=0, museumMemIdx=0;

/* ---- the museum as the game's reflective, educational heart ----
   Six clickable exhibits open a culture card (real haenyeo facts + an evocative
   line); the seated grandmothers share rotating, deepening memories. Examining
   all six and hearing three memories earns the "Keeper of Tradition" log.
   Positions map onto museum.png (cover-fit); an exhibit is "active" when the
   player stands roughly in its column inside the gallery. */
const MUSEUM_EXHIBITS=[
  {id:'flags', x:46, y:132, name:'Jamsugut', ko:'잠수굿 · 영등굿',
   fact:'Each spring the village holds the Jamsugut — a shaman rite to Yeongdeung, goddess of wind and sea — praying for calm water and every diver’s safe return.',
   quote:'“We pray not to conquer the sea, but to come home from it.”'},
  {id:'nets', x:300, y:256, name:'Nets & Ranks', ko:'망사리 · 계급',
   fact:'By skill and breath a diver is ranked hagun, junggun, or sanggun. The sanggun go deepest and longest — yet the catch is shared, so the youngest and the oldest are never left behind.',
   quote:'“The deepest diver eats the same as the youngest.”'},
  {id:'statue', x:434, y:236, name:'Keeper of Tradition', ko:'해녀상',
   fact:'Jeju’s haenyeo free-dive for shellfish on a single breath — a craft over a thousand years old. ~23,000 dived in the 1960s; today only ~2,700 remain, most over seventy.',
   quote:'“We do not take what the sea cannot spare.”'},
  {id:'sunset', x:589, y:112, name:'Sumbi-sori', ko:'숨비소리 · 노을', sound:true,
   fact:'Surfacing, a haenyeo lets her held breath go in a long whistle — the sumbi-sori. It is the sound of the sea-women: a body saying, I am still here.',
   quote:'“I am still here.”'},
  {id:'gear', x:709, y:184, name:'Goggles & Taewak', ko:'물안경 · 태왁',
   fact:'No tanks — only goggles, lead weights, a net bag, and the taewak: a buoyant float she rests on between dives and clings to when the water turns rough.',
   quote:'“The taewak is the only thing that waits for you up there.”'},
  {id:'pottery', x:846, y:316, name:'Onggi Jars', ko:'항아리',
   fact:'When the sea closes in winter and storm season, the haenyeo turn to the volcanic fields — farming, and fermenting the harvest in onggi jars. A life split between water and earth.',
   quote:'“Winter belongs to the soil.”'},
];
const MUSEUM_GRANDMA={ x:492, y:382,
  base:[
    '“I first dived when I was eight. My mother fit the mask to my face and said: the sea is not something you conquer.”',
    '“A single morning once gave three times the abalone it gives now. The sea is tired too, you know.”',
    '“We sing on the way out. If you can no longer hear the others sing, you have swum too far.”',
    '“My daughter is in Seoul. She says she’ll come home. I have been hearing ‘I’ll come home’ for three years now.”',
  ],
  deep:[
    '“My closest friend did not surface, one winter. The sea gives, and the sea keeps. We still dived the next morning.”',
    '“When I can no longer dive, who will? Come back, child. Let an old woman teach you to read the water.”',
  ],
};
/* idea 3 — a tangled net you help the grandmothers mend (proximity-hold, like the
   beach ghost-net rescue). Repeatable each visit; the eco reward is once per day. */
const MUSEUM_NET={x:372, y:412, r:42, max:2.0};
let museumNetCut=0, museumNetDone=false;
function updateMuseumNet(dt){
  if(museumNetDone) return;
  const near=Math.hypot(P.x-MUSEUM_NET.x, P.y-MUSEUM_NET.y) < MUSEUM_NET.r;
  if(near){
    museumNetCut+=dt;
    if(typeof tone==='function' && museumNetCut%0.4<dt) tone(250,.05,'sine',.03);
    if(museumNetCut>=MUSEUM_NET.max){
      museumNetDone=true;
      const first=(G.netMendedDay!==G.day); G.netMendedDay=G.day;
      if(typeof tone==='function'){ tone(523,.12,'sine',.04); setTimeout(()=>tone(659,.16,'sine',.04),120); }
      showFact(first ? '“Aigo — quick hands. The net thanks you, and so do I. Sit with us a while.”'
                     : '“Always a help, this one. The sea raised you well.”',
               7, '할머니 · A grandmother');
      if(first){ G.eco=(G.eco||0)+8; if(typeof toast==='function') toast('🧶 Helped mend the net · +8 eco'); }
    }
  } else { museumNetCut=Math.max(0, museumNetCut-dt); }
}
/* idea 5 — a visitor's ledger that sublimates the player's deeds into the story */
const MUSEUM_LEDGER={x:206, y:498, r:36};
function museumMetaText(){
  const r=G.rescuedAnimals||{}; const freed=Object.values(r).reduce((a,b)=>a+(b||0),0);
  const dives=G.dives||0, runs=G.beachRuns||0, won=G.soldWon||0;
  return 'Day '+G.day+'   ·   '+dives+' dives   ·   '+runs+' shore clean-ups\n'
    + freed+' animals freed   ·   '+won+' won at market   ·   '+(G.eco||0)+' eco\n'
    + 'The shore stands at '+Math.round(G.beachHealth)+'%.\n'
    + '— Every dive is a promise kept to the sea.';
}
function museumExhibitAt(){
  // nearest active exhibit to the player; active = standing in its column, in-gallery
  let best=null, bestScore=1e9;
  for(const e of MUSEUM_EXHIBITS){
    if(Math.abs(P.x-e.x)>58) continue;
    if(P.y < e.y+8 || P.y > 582) continue;          // stand anywhere in its column, on the floor below it
    const s=Math.abs(P.x-e.x) + 0.3*Math.abs(P.y-e.y);
    if(s<bestScore){ bestScore=s; best=e; }
  }
  return best;
}
function cultureCounts(){ let ex=0; for(const e of MUSEUM_EXHIBITS) if(G.cultureLog[e.id]) ex++; return {ex, total:MUSEUM_EXHIBITS.length, mem:G.cultureMem}; }
function checkKeeper(){
  if(G.cultureKeeper) return;
  const c=cultureCounts();
  if(c.ex>=c.total && c.mem>=3){
    G.cultureKeeper=true; G.eco=(G.eco||0)+30;
    if(typeof tone==='function'){ tone(523,.5,'sine',.05); setTimeout(()=>tone(784,.7,'sine',.05),260); }
    setTimeout(()=>showFact('You have listened to every voice in this hall. The sea-women’s story now travels with you. (+30 eco · 해녀 문화 지킴이)', 10, '🏛 해녀 문화 지킴이 · Keeper of Tradition'), 400);
    setTimeout(()=>{ if(typeof toast==='function') toast('🏛 Keeper of Tradition'); }, 900);
  }
}
function playSumbiSori(){
  if(typeof tone!=='function') return;       // the breath on surfacing: a soft, falling whistle
  tone(1180,.5,'sine',.045); setTimeout(()=>tone(880,.6,'sine',.04),180); setTimeout(()=>tone(660,.7,'sine',.03),460);
}
let museumPrevMusic=null;
/* the museum plays "Song of the Sea Women" — slow & contemplative — while you're
   inside, then restores whatever the radio was doing when you leave */
function startMuseumMusic(){
  const M=window.HaenyeoMusic; if(!M) return;
  museumPrevMusic={ playing:M.playing, idx:M.current };
  try{ M.unlock(); }catch(e){}
  const i=M.tracks.findIndex(t=>t.id==='haenyeo');
  if(i>=0) M.playIndex(i);
}
function stopMuseumMusic(){
  const M=window.HaenyeoMusic; if(!M){ museumPrevMusic=null; return; }
  if(museumPrevMusic && museumPrevMusic.playing){
    if(museumPrevMusic.idx>=0 && museumPrevMusic.idx!==M.current) M.playIndex(museumPrevMusic.idx);
  } else { M.pause(); }
  museumPrevMusic=null;
}
function enterMuseum(){ scene='museum'; P.x=W/2; P.y=H-80; P.face=1; museumNetCut=0; museumNetDone=false; $('prompt').classList.remove('show'); startMuseumMusic(); }
function leaveMuseum(){ stopMuseumMusic(); scene='village'; const b=buildings.find(x=>x.name==='museum'); if(b){P.x=b.x+b.w/2;P.y=b.y+b.h+18;} P.face=1; $('prompt').classList.remove('show'); }
function updateMuseum(dt){
  museumT+=dt;
  let mx=0,my=0;
  if(keys['arrowleft']||keys['a'])mx-=1; if(keys['arrowright']||keys['d'])mx+=1;
  if(keys['arrowup']||keys['w'])my-=1;   if(keys['arrowdown']||keys['s'])my+=1;
  if(joy.on&&joy.moved){const m=Math.hypot(joy.dx,joy.dy)||1;mx+=joy.dx/m;my+=joy.dy/m;}
  const m=Math.hypot(mx,my); P.moving=m>0.1;
  if(m>0){mx/=m;my/=m; if(mx!==0)P.face=mx>0?1:-1; P.anim+=dt*9;
    // move on each axis independently so the player slides along the walls
    const nx=P.x+mx*SPEED; if(inMuseumFloor(nx, P.y)) P.x=nx;
    const ny=P.y+my*SPEED; if(inMuseumFloor(P.x, ny)) P.y=ny;
  }
  updateMuseumNet(dt);
  refreshMuseumPrompt();
}
function refreshMuseumPrompt(){
  const el=$('prompt');
  const dExit=Math.hypot(P.x-(museumExit.x+museumExit.w/2),P.y-(museumExit.y+museumExit.h/2));
  const dGran=Math.hypot(P.x-MUSEUM_GRANDMA.x,P.y-MUSEUM_GRANDMA.y);
  const dNet=Math.hypot(P.x-MUSEUM_NET.x,P.y-MUSEUM_NET.y);
  const dLed=Math.hypot(P.x-MUSEUM_LEDGER.x,P.y-MUSEUM_LEDGER.y);
  const ex=museumExhibitAt();
  if(dNet<MUSEUM_NET.r){ museumCur={type:'net'}; el.textContent=museumNetDone?'The net is mended — thank you':'Mending the net… (stay close)'; el.classList.add('show'); }
  else if(dGran<62){ museumCur={type:'grandma'}; el.textContent='Sit with the grandmothers'; el.classList.add('show'); }
  else if(dLed<MUSEUM_LEDGER.r){ museumCur={type:'ledger'}; el.textContent='Read the visitor ledger'; el.classList.add('show'); }
  else if(dExit<56){ museumCur={type:'exit'}; el.textContent='Leave museum'; el.classList.add('show'); }
  else if(ex){ museumCur={type:'exhibit', ex}; el.textContent=(G.cultureLog[ex.id]?'Revisit':'Examine')+': '+ex.name; el.classList.add('show'); }
  else { museumCur=null; el.classList.remove('show'); }
}
function doMuseumInteract(){
  if(!museumCur) return;
  if(museumCur.type==='exit'){ leaveMuseum(); return; }
  if(museumCur.type==='net'){ return; }   // mended just by staying close (handled in updateMuseumNet)
  if(museumCur.type==='ledger'){ showFact(museumMetaText(), 11, '기록 · 당신의 발자취 · Your impact'); if(typeof tone==='function') tone(440,.1,'sine',.04); return; }
  if(museumCur.type==='exhibit'){
    const e=museumCur.ex;
    const card=e.name+' ('+e.ko+')\n'+e.fact+'\n— '+e.quote;
    showFact(card, 10, '해녀 문화 · Haenyeo Culture');
    if(e.sound) playSumbiSori(); else if(typeof tone==='function') tone(560,.1,'sine',.04);
    if(!G.cultureLog[e.id]){ G.cultureLog[e.id]=true; checkKeeper(); }
    return;
  }
  if(museumCur.type==='grandma'){
    const base=MUSEUM_GRANDMA.base, deep=MUSEUM_GRANDMA.deep;
    const all = (G.cultureMem>=base.length) ? base.concat(deep) : base;
    const line = all[museumMemIdx % all.length];
    museumMemIdx++;
    showFact(line, 9, '할머니의 기억 · A grandmother remembers');
    if(typeof tone==='function') tone(330,.12,'sine',.035);
    G.cultureMem = Math.min(base.length+deep.length, G.cultureMem+1);
    checkKeeper();
    return;
  }
}

/* Mr. Gicheol's sales counter — he stands behind it, you buy across it (like Migyeong's stall) */
const shopCounter={x:400, y:314, w:156, h:36};
function shopHit(x,y){
  const c=shopCounter;                                   // can't walk through the counter
  return x>c.x-2 && x<c.x+c.w+2 && y>c.y-2 && y<c.y+c.h+8;
}
function updateShop(dt){
  let mx=0,my=0;
  if(keys['arrowleft']||keys['a'])mx-=1; if(keys['arrowright']||keys['d'])mx+=1;
  if(keys['arrowup']||keys['w'])my-=1;   if(keys['arrowdown']||keys['s'])my+=1;
  if(joy.on&&joy.moved){const m=Math.hypot(joy.dx,joy.dy)||1;mx+=joy.dx/m;my+=joy.dy/m;}
  const m=Math.hypot(mx,my); P.moving=m>0.1;
  if(m>0){mx/=m;my/=m; if(mx!==0)P.face=mx>0?1:-1;
    const nx=P.x+mx*SPEED, ny=P.y+my*SPEED;
    if(!shopHit(nx,P.y))P.x=nx; if(!shopHit(P.x,ny))P.y=ny; P.anim+=dt*9;}
  P.x=Math.max(SHOP.x0+P.r,Math.min(SHOP.x1-P.r,P.x));
  P.y=Math.max(SHOP.y0+P.r,Math.min(SHOP.y1-P.r,P.y));
  refreshShopPrompt();
}
function shopNearest(){
  let best=null,bd=44;
  const fx=shopCounter.x+shopCounter.w/2, fy=shopCounter.y+shopCounter.h+6;   // talk across the counter front
  const dk=Math.hypot(P.x-fx,P.y-fy); if(dk<56){bd=dk;best={type:'keeper'};}
  if(P.x>exitZone.x-10&&P.x<exitZone.x+exitZone.w+10&&P.y>exitZone.y-24) best={type:'exit'};
  return best;
}
function refreshShopPrompt(){
  shopCur=shopNearest(); const el=$('prompt');
  if(!shopCur){el.classList.remove('show');return;}
  let txt='';
  if(shopCur.type==='keeper') txt='Talk to Mr. Gicheol';
  else if(shopCur.type==='exit') txt='Leave shop';
  el.textContent=txt; el.classList.add('show');
}
function doShopInteract(){
  if(!shopCur)return;
  if(shopCur.type==='exit') leaveShop();
  else if(shopCur.type==='keeper') keeperTalk();
}
function keeperTalk(){
  openStore();
}
function openBuyConfirm(kind){
  if(kind==='wetsuit'){
    if(G.owned.modern){ toast('You already own it — switch at home'); return; }
    const s=SUITS.modern, afford=G.money>=s.cost;
    dialogBg='shop'; scene='dialogue-open';
    drawPortrait(keeper);
    $('dlgName').firstChild.textContent=keeper.roman;
    $('dlgRole').textContent='Gear shop owner';
    $('dlgHearts').textContent='';
    $('dlgText').textContent=s.note+'  Breath '+SUITS.traditional.breath+' → '+s.breath+'.  Cost: '+s.cost+' won.'+(afford?'':' (You can\'t afford it yet.)');
    const btns=$('dlgBtns');btns.innerHTML='';
    const buy=document.createElement('button');buy.className='btn';buy.textContent='Buy'; buy.disabled=!afford; if(!afford)buy.style.opacity=.5;
    buy.onclick=()=>{ buyGear('wetsuit'); keeperTalk(); };
    const cancel=document.createElement('button');cancel.className='btn ghost';cancel.textContent='Cancel';
    cancel.onclick=()=>{ keeperTalk(); };
    btns.appendChild(buy);btns.appendChild(cancel);
    $('dialogue').classList.add('show'); $('prompt').classList.remove('show');
    return;
  }
  const arr=GEAR.net;
  const idx=G.netIdx;
  if(idx>=arr.length-1){ toast('Best net already'); return; }
  const nx=arr[idx+1];
  dialogBg='shop'; scene='dialogue-open';
  drawPortrait(keeper);
  $('dlgName').firstChild.textContent=keeper.roman;
  $('dlgRole').textContent='Gear shop owner';
  $('dlgHearts').textContent='';
  const stat=('Net size '+arr[idx].cap+' → '+nx.cap);
  const afford=G.money>=nx.cost;
  $('dlgText').textContent='A bigger net. '+stat+'.  Cost: '+nx.cost+' won.'+(afford?'':' (You can\'t afford it yet.)');
  const btns=$('dlgBtns');btns.innerHTML='';
  const buy=document.createElement('button');buy.className='btn';buy.textContent='Buy'; buy.disabled=!afford; if(!afford)buy.style.opacity=.5;
  buy.onclick=()=>{ buyGear('net'); keeperTalk(); };
  const cancel=document.createElement('button');cancel.className='btn ghost';cancel.textContent='Cancel';
  cancel.onclick=()=>{ keeperTalk(); };
  btns.appendChild(buy);btns.appendChild(cancel);
  $('dialogue').classList.add('show'); $('prompt').classList.remove('show');
}
function buyGear(kind){
  if(kind==='wetsuit'){
    const s=SUITS.modern;
    if(G.owned.modern){ toast('Already owned'); return; }
    if(G.money<s.cost){ toast('Not enough won'); return; }
    G.money-=s.cost; G.owned.modern=true; G.suit='modern'; $('moneyV').textContent=G.money;
    toast('Modern wetsuit — now equipped!');
    return;
  }
  if(kind==='net'){
    const arr=GEAR.net;
    const nx=G.netIdx+1; if(nx>=arr.length)return;
    if(G.money<arr[nx].cost){toast('Not enough won');return;}
    G.money-=arr[nx].cost; G.netIdx=nx; $('moneyV').textContent=G.money;
    toast('New net! +capacity');
    return;
  }
  if(kind==='bag'){
    const arr=GEAR.bag, nx=G.bagIdx+1; if(nx>=arr.length)return;
    if(G.money<arr[nx].cost){toast('Not enough won');return;}
    G.money-=arr[nx].cost; G.bagIdx=nx; $('moneyV').textContent=G.money;
    toast('Bigger sack — carry more litter each tide!');
    return;
  }
  if(kind==='cutter'){
    const arr=GEAR.cutter, nx=G.cutIdx+1; if(nx>=arr.length)return;
    if(G.money<arr[nx].cost){toast('Not enough won');return;}
    G.money-=arr[nx].cost; G.cutIdx=nx; $('moneyV').textContent=G.money;
    toast('Sharper cutter — free tangled animals faster!');
    return;
  }
  if(kind==='tool'){
    const arr=GEAR.tool;
    const nx=G.toolIdx+1; if(nx>=arr.length)return;
    if(G.money<arr[nx].cost){toast('Not enough won');return;}
    G.money-=arr[nx].cost; G.toolIdx=nx; $('moneyV').textContent=G.money;
    toast(arr[nx].name+' — harvests faster!');
    return;
  }
  if(kind==='mask'){
    const arr=GEAR.mask;
    const nx=G.maskIdx+1; if(nx>=arr.length)return;
    if(G.money<arr[nx].cost){toast('Not enough won');return;}
    G.money-=arr[nx].cost; G.maskIdx=nx; $('moneyV').textContent=G.money;
    toast(arr[nx].name+' — clearer sight!');
    return;
  }
  if(kind==='tewak'){
    const arr=GEAR.tewak;
    const nx=G.tewakIdx+1; if(nx>=arr.length)return;
    if(G.money<arr[nx].cost){toast('Not enough won');return;}
    G.money-=arr[nx].cost; G.tewakIdx=nx; $('moneyV').textContent=G.money;
    toast(arr[nx].name+' — recover breath faster!');
    return;
  }
}

/* ---------------- CO-OP MARKET (walkable fish market) ---------------- */
const MARKET={x0:36,y0:140,x1:924,y1:586};
const sellCounter={x:402,y:452,w:156,h:38};   // Migyeong's buyer's counter — out on the open floor, clear of the stalls
const sellStation={x:480,y:516};             // stand here (just below the counter) to sell your catch
const marketExit={x:438,y:548,w:84,h:34};
const vendor={name:'Migyeong', roman:'Migyeong', skin:'#f0c89a', scarf:'#c0506e', x:480, y:438, id:'vendor',
  look:{ hairStyle:'bob', hair:'#2a2220', vest:'#3a6e8c', glasses:true, top:'#f2ead2', bottom:'#4a4a52', skin:'#e7c9a0' }};
const VENDOR_LINES=[
  "Fresh catch? Let's see what the sea gave you today.",
  "The conch are fetching a good price this week.",
  "Careful with those urchins — worth more than you'd think.",
];
// ---- Jeju specialty stalls — walk up to one to introduce the product (educational) ----
const MARKET_STALLS=[
  // BACK ROW seafood (now reachable; central dried-fish stall is the Sell counter, so skipped)
  {x:176,y:200,kr:'전복',cn:'鮑魚',      fact:"鮑魚(전복)——海女最珍貴的漁獲,以海帶為食、需數年才能採收。濟州冰冷的洋流讓牠格外鮮美,可生食、煮成鮑魚粥(전복죽)或炭烤。"},
  {x:344,y:200,kr:'성게·문어',cn:'海膽·章魚', fact:"海膽(성게)與章魚(문어)都是海女的漁獲。海膽金黃的卵是珍味;章魚則汆燙成軟嫩的「숙회」。"},
  {x:644,y:200,kr:'김·미역',cn:'海苔·海帶', fact:"海苔與海帶(김·미역)採自礁岩。海帶湯(미역국)是生日與產後必喝,象徵滋補與感謝。"},
  {x:758,y:200,kr:'갈치',cn:'白帶魚',    fact:"白帶魚(갈치)——細長銀亮的濟州名魚,夜裡延繩釣起。最適合炭烤(갈치구이)或燉煮(갈치조림)。"},
  // FRONT ROW (land specialties)
  {x:220,y:400,kr:'흑돼지',cn:'黑豬肉',  fact:"濟州黑豬(흑돼지)——島上著名的傳統黑毛豬,油脂濃郁、肉質有嚼勁,是濟州烤肉的代表。"},
  {x:344,y:400,kr:'한라봉',cn:'漢拏峰',   fact:"漢拏峰(한라봉)——濟州高級柑橘,頂部有個像肚臍的凸起(名字取自漢拏山)。比一般蜜柑更大更甜,是濟州的招牌名產。"},
  {x:483,y:400,kr:'표고버섯',cn:'香菇',  fact:"香菇(표고버섯)——在濟州潮濕的森林裡以橡木段栽培,菇傘厚實多肉,用於煮湯與涼拌。"},
  {x:608,y:400,kr:'녹차',cn:'綠茶',      fact:"綠茶(녹차)——濟州火山土壤與海霧孕育出優質綠茶,是韓國主要的抹茶產區之一。"},
  {x:740,y:400,kr:'오메기떡',cn:'오메기年糕', fact:"오메기年糕(오메기떡)——濟州的糯小米年糕,外裹紅豆或艾草,口感Q彈,是島上人人喜愛的點心。"},
  // SIDE stalls (left/right) — per layout: 右上 peanuts, 右下 tangerine, 左下 citrus souvenirs
  {x:808,y:268,kr:'우도 땅콩',cn:'牛島花生', fact:"牛島花生(우도 땅콩)——濟州外海牛島(우도)的特產小花生,香氣濃、顆粒小,可烤來當零嘴或做成花生冰淇淋。"},
  {x:808,y:446,kr:'감귤',cn:'柑橘',       fact:"柑橘(감귤)——濟州最日常的蜜柑,冬天整片橘園金黃。香甜好剝,是島上家家戶戶的零嘴(比漢拏峰小巧親民)。"},
  {x:152,y:446,kr:'감귤 선물',cn:'柑橘伴手禮', fact:"柑橘伴手禮——濟州熱門的伴手禮:漢拏峰巧克力、柑橘果醬與軟糖,裝進小盒帶回家分送親友。"},
];
const MARKET_LANE={x0:200,x1:760,y0:300,y1:560};   // where shoppers roam (the open aisle)
let marketShoppers=[];
function marketPickTarget(s){ for(let i=0;i<14;i++){ const tx=MARKET_LANE.x0+Math.random()*(MARKET_LANE.x1-MARKET_LANE.x0), ty=MARKET_LANE.y0+Math.random()*(MARKET_LANE.y1-MARKET_LANE.y0); if(!marketHit(tx,ty)){ s.tx=tx; s.ty=ty; return; } } s.tx=s.x; s.ty=s.y; }
function initMarketShoppers(){
  // shoppers — deliberately unlike the diver: varied skin/hair/clothes, baskets, an elder
  const defs=[
    {look:{hairStyle:'bun',hair:'#1c140e',top:'#3a6e8c',bottom:'#37343d',basket:true,skin:'#c98a5a'}, speed:1.1},
    {look:{hairStyle:'short',hair:'#5a4636',top:'#b85a48',bottom:'#4a4a52',skin:'#f0d2a8'}, speed:1.25},
    {look:{hairStyle:'ponytail',hair:'#241f1b',top:'#5cbfb0',bottom:'#37343d',basket:true,skin:'#e0b088'}, speed:1.0},
    {look:{hairStyle:'bun',hair:'#9a948a',top:'#a23c5a',bottom:'#4a4a52',apron:'#ece2c8',elder:true,skin:'#e3c4a0'}, speed:0.8},
    {look:{hairStyle:'bob',hair:'#2a2220',top:'#6aa647',bottom:'#4a4a52',skin:'#d6a070'}, speed:1.15},
  ];
  const spots=[[410,370],[560,370],[440,560],[600,560],[480,540]];   // clear aisle spots (avoid stall/clutter no-walk zones)
  marketShoppers=defs.map((d,i)=>{ const sp=spots[i]||[480,400]; return { x:sp[0], y:sp[1], tx:sp[0], ty:sp[1], face:1, moving:false, anim:Math.random()*6, wait:Math.random()*1.5, speed:d.speed, look:d.look }; });
  for(const s of marketShoppers) marketPickTarget(s);
}
let marketCur=null;
function enterMarket(){ scene='market'; P.x=480; P.y=552; P.face=1; initMarketShoppers(); $('prompt').classList.remove('show'); }
function leaveMarket(){ scene='village'; const b=buildings.find(x=>x.name==='coop'); if(b){P.x=b.x+b.w/2; P.y=b.y+b.h+18;} P.face=1; $('prompt').classList.remove('show'); }
function marketHit(x,y){
  if(x>sellCounter.x-2&&x<sellCounter.x+sellCounter.w+2&&y>sellCounter.y-2&&y<sellCounter.y+sellCounter.h+8)return true;
  if(y<566){ if(x<MARKET.x0+112)return true; if(x>MARKET.x1-112)return true; }   // deep side stalls (left/right)
  // (a): the back-stall row is no longer walled — the diver can walk up to the seafood stalls.
  //  Only the side stalls and the central sell counter are solid; the rest of the floor is open.
  return false;
}
function updateMarket(dt){
  let mx=0,my=0;
  if(keys['arrowleft']||keys['a'])mx-=1; if(keys['arrowright']||keys['d'])mx+=1;
  if(keys['arrowup']||keys['w'])my-=1;   if(keys['arrowdown']||keys['s'])my+=1;
  if(joy.on&&joy.moved){const m=Math.hypot(joy.dx,joy.dy)||1;mx+=joy.dx/m;my+=joy.dy/m;}
  const m=Math.hypot(mx,my); P.moving=m>0.1;
  if(m>0){mx/=m;my/=m; if(mx!==0)P.face=mx>0?1:-1;
    const nx=P.x+mx*SPEED, ny=P.y+my*SPEED;
    if(!marketHit(nx,P.y))P.x=nx; if(!marketHit(P.x,ny))P.y=ny; P.anim+=dt*9;}
  P.x=Math.max(MARKET.x0+P.r,Math.min(MARKET.x1-P.r,P.x));
  P.y=Math.max(MARKET.y0+P.r,Math.min(MARKET.y1-P.r,P.y));
  // shoppers stroll the aisle, pausing to browse the stalls
  for(const s of marketShoppers){
    if(s.wait>0){ s.wait-=dt; s.moving=false; continue; }
    const dx=s.tx-s.x, dy=s.ty-s.y, m=Math.hypot(dx,dy);
    if(m<5){ s.wait=1+Math.random()*3.2; marketPickTarget(s); s.moving=false; continue; }   // pause = browsing
    const nx=s.x+dx/m*s.speed, ny=s.y+dy/m*s.speed;
    if(!marketHit(nx,s.y)) s.x=nx; else marketPickTarget(s);
    if(!marketHit(s.x,ny)) s.y=ny; else marketPickTarget(s);
    if(Math.abs(dx)>0.4) s.face=dx>0?1:-1;
    s.moving=true; s.anim+=dt*8;
  }
  refreshMarketPrompt();
}
function marketNearest(){
  let best=null,bd=1e9;
  for(const s of MARKET_STALLS){ const d=Math.hypot(P.x-s.x,P.y-s.y); if(d<70 && d<bd){ bd=d; best={type:'stall',stall:s}; } }
  const ds=Math.hypot(P.x-sellStation.x,P.y-sellStation.y); if(ds<52 && ds<bd){ bd=ds; best={type:'sell'}; }
  if(P.x>marketExit.x-10&&P.x<marketExit.x+marketExit.w+10&&P.y>marketExit.y-24) best={type:'exit'};   // exit mat overrides
  return best;
}
function refreshMarketPrompt(){
  marketCur=marketNearest(); const el=$('prompt');
  if(!marketCur){el.classList.remove('show');return;}
  let txt='';
  if(marketCur.type==='sell') txt='Sell catch';
  else if(marketCur.type==='exit') txt='Leave market';
  else if(marketCur.type==='stall') txt=marketCur.stall.cn+' · 介紹';
  el.textContent=txt; el.classList.add('show');
}
function doMarketInteract(){
  if(!marketCur)return;
  if(marketCur.type==='exit') leaveMarket();
  else if(marketCur.type==='sell') openSell();
  else if(marketCur.type==='stall'){ showFact(marketCur.stall.fact); if(typeof tone==='function') tone(560,.08,'sine',.05); }
}

/* ---------------- DIVE ---------------- */
const SURF=70, BED=1660;                 // the sea is now ~3 screens deep — the camera follows the diver down
let dCamY=0;                             // vertical scroll of the dive camera
/* yeo-rock shelves at increasing depth — buried catch can nestle on them */
const DSHELVES=[
  {x:96,  y:560,  w:200},
  {x:610, y:780,  w:230},
  {x:170, y:1050, w:250},
  {x:560, y:1300, w:220}];
const DCAVE={x:W-66,y:BED-30};           // the hidden sea cave past the deepest yeo rocks
const dv={x:W/2,y:SURF-6,vx:0,vy:0,r:13,face:1,kick:0};
let dBreath=100,dTime=0,dTimeMax=34,dNet=[],dCreatures=[],dBubbles=[],dParts=[],dSumbi=0,diveCatch={},dSlow=1,dFresh=0;
/* dNet holds {id,stars} objects; diveCatch is {id:{1:n,2:n,3:n}} banked by quality.
   bankNet() empties the carried net into the dive's quality-tallied haul. */
function bankNet(){ for(const it of dNet){ const q=diveCatch[it.id]||(diveCatch[it.id]={1:0,2:0,3:0}); q[it.stars]=(q[it.stars]||0)+1; } dNet=[]; }
function netWeight(){ let w=0; for(const it of dNet) w+=creatureKg(it.id); return w; }    // kg carried
function netFull(extra){ return netWeight()+(extra||0) > netCap(); }                       // would adding `extra` kg overflow?
/* the star a creature yields, from how it was taken: a calm catch / clean dig is best,
   a perfect sumbisori adds a freshness bonus on top. */
function catchStars(c){
  let st = c.buried ? (c.slipped?2:3) : (c.alarm<0.34?3:(c.alarm<0.7?2:1));
  if(dFresh>0) st++;                 // sumbisori freshness window
  // a healthy shore means a healthier catch; a neglected one, sicklier (moderate nudge)
  if(G.beachHealth>=78 && Math.random()<0.28) st++;
  else if(G.beachHealth<35 && Math.random()<0.30) st--;
  return Math.max(1,Math.min(3,st));
}
let dJellies=[],dPod=null,dCompanion=null,dBeat={active:false,p:0},dSting=0,dHintT=0;
let dVents=[],dChest=null,dDash=0,dDashCd=0,dDashReq=false,lastDiveTap=0,dLowT=0;
let divePtr={on:false,x:0,y:0};
function divePtrSet(p){divePtr.x=p.x;divePtr.y=p.y;}
/* Pre-dive briefing — the diver pauses on the float to ready her breath before
   going under. Shows the run's conditions, then you choose to dive in or wait. */
function openDiveStart(){
  scene='panel'; panelBg='village';
  $('prompt').classList.remove('show');
  const time = 46 + ((G.meal&&G.meal.time)||0);
  const rows = [
    ['Wetsuit', SUITS[G.suit].name],
    ['Breath', maxBreath()],
    ['Tool', GEAR.tool[G.toolIdx].name],
    ['Mask', GEAR.mask[G.maskIdx].name],
    ['Taewak', GEAR.tewak[G.tewakIdx].name],
    ['Time underwater', time+'s'],
    ['Net space', netCap()+' kg'],
    ['Depth zones', 'hagun 0–5 · junggun 5–10 · sanggun 10–20 m'],
  ];
  $('diveStartList').innerHTML = rows.map(r=>
    '<div class="line"><span>'+r[0]+'</span><span>'+r[1]+'</span></div>').join('');
  const wx = { sunny:'Clear water — visibility is good out on the yeo rocks.',
               rain:'Rain stirs the surface, but the catch waits below.',
               wind:'A swell is running — mind your footing when you surface.' }[G.weather]
             || 'The sea is calm today.';
  const fed = G.meal ? ' A full belly ('+G.meal.label+') will carry your breath longer.' : '';
  $('diveStartNote').textContent = wx + fed;
  $('pDiveStart').classList.remove('hidden');
}
$('diveStartGo').onclick=()=>{ if(!haveEnergy('dive')) return; $('pDiveStart').classList.add('hidden'); startDive(); };
$('diveStartClose').onclick=()=>{ $('pDiveStart').classList.add('hidden'); scene='village'; };
function startDive(){
  spendEnergy('dive');   // a dive takes it out of you
  G.dives=(G.dives||0)+1;   // lifetime tally (the museum ledger remembers)
  scene='dive'; dv.x=W/2;dv.y=SURF-6;dv.vx=dv.vy=0; dCamY=0;
  dBreath=maxBreath(); dTimeMax=46+((G.meal&&G.meal.time)||0); dTime=dTimeMax;
  dSlow=1-((G.meal&&G.meal.slow)||0);   // well-fed = slower breath loss
  dNet=[]; diveCatch={}; dCreatures=[];dBubbles=[];dParts=[]; dFresh=0;
  dBeat={active:false,p:0}; dSting=0; dHintT=0;
  // a clean shore makes the sea richer — more life to find; a trashed one, sparse (moderate)
  const h01=G.beachHealth/100, creatureN=Math.round(BEACH_TUNING.diveCreatureBase+h01*BEACH_TUNING.diveCreatureFromHealth);   // ~14 (neglected) → ~24 (pristine)
  for(let i=0;i<creatureN;i++)spawnC();
  // drifting moon jellies — brushing one stings and costs breath
  dJellies=[];
  for(let i=0;i<5;i++){ const fr=0.16+i*0.17+Math.random()*0.07;
    dJellies.push({bx:70+Math.random()*(W-140), y:SURF+90+fr*(BED-SURF-140), ph:Math.random()*6.28, x:0}); }
  for(const j of dJellies) j.x=j.bx;
  // on lucky days a dolphin pod crosses the bay — swim close for a blessing
  dPod = Math.random()<0.35 ? {x:-120, y:SURF+200+Math.random()*420, dir:1, blessed:false} : null;
  if(dPod && Math.random()<0.5){ dPod.dir=-1; dPod.x=W+120; }
  // a sea creature you once freed from a ghost net sometimes returns to swim with you
  dCompanion=null;
  { const marine=Object.keys(G.rescuedAnimals||{}).filter(k=>k==='turtle'||k==='dolphin');
    if(marine.length && Math.random()<0.5){ const side=Math.random()<0.5?-1:1;
      dCompanion={kind:marine[Math.floor(Math.random()*marine.length)], x:dv.x+side*320, y:dv.y+140+Math.random()*200, state:'enter', hold:6, dir:side<0?1:-1, t:0}; } }
  // air vents — bubble columns that refill your lungs mid-dive (Dave-the-Diver style)
  dVents=[
    {x:DSHELVES[1].x+44+(Math.random()-.5)*30, y:DSHELVES[1].y, ph:Math.random()*6.28},
    {x:DSHELVES[3].x+DSHELVES[3].w-44+(Math.random()-.5)*30, y:DSHELVES[3].y, ph:Math.random()*6.28},
    {x:160+Math.random()*(W-420), y:BED, ph:Math.random()*6.28}];
  // one sunken chest per dive, somewhere deep
  { const cs=DSHELVES[2+Math.floor(Math.random()*2)];
    dChest = Math.random()<0.5
      ? {x:cs.x+34+Math.random()*(cs.w-68), y:cs.y-6, open:false, loot:30+Math.floor(Math.random()*51)}
      : {x:120+Math.random()*(W-300), y:BED-8, open:false, loot:30+Math.floor(Math.random()*51)}; }
  dDash=0;dDashCd=0;dDashReq=false;dLowT=0;
  $('diveHud').classList.add('show'); $('surfBtn').classList.add('show'); $('prompt').classList.remove('show');
  $('mealBadge').classList.remove('show');   // tuck the well-fed badge away while underwater
  P.y=SEA_Y-30;
}
function placeCreature(c){
  // weighted pick — common things up shallow, the precious things down deep
  const pool=[]; for(const sp of SPECIES) for(let i=0;i<(sp.w||0);i++) pool.push(sp);
  const s=pool[Math.floor(Math.random()*pool.length)];
  const buried=(s.id==='urchin'||s.id==='octopus'||s.id==='abalone'||s.id==='cucumber');
  c.s=s; c.r=s.r||12; c.seed=Math.random()*6.28;
  c.alarm=0; c.slipped=false; c.inked=false;   // quality tracking + has-fled-once flag
  c.buried=buried; c.dig=0; c.digMax = s.id==='octopus'?2.0:(s.id==='abalone'?2.6:(s.id==='cucumber'?0.9:1.2));
  // some are juveniles — too small to take; leave them to grow
  // dirtier shore → more undersized juveniles you must leave (0.12 pristine → 0.30 neglected)
  const youngRate = 0.30 - (G.beachHealth/100)*0.18;
  c.young = s.id!=='seaweed' && Math.random()<youngRate;
  if(c.young) c.r=Math.max(6,Math.round(c.r*0.6));
  const span=BED-SURF;
  if(buried){
    const sp=buriedSpot(s);
    c.x=sp.x; c.y=sp.y;
  } else {
    const fr=s.band[0]+Math.random()*(s.band[1]-s.band[0]);
    c.x=40+Math.random()*(W-80); c.y=SURF+70+fr*(span-130);
  }
  return c;
}
/* a fresh burrow within a species' depth band — a seabed hollow or a yeo-rock shelf */
function buriedSpot(s){
  const span=BED-SURF, spots=[];
  if(s.band[1]>=0.95) spots.push({x:40+Math.random()*(W-110), y:BED-10-Math.random()*14});
  for(const sh of DSHELVES){ const f=(sh.y-SURF)/span;
    if(f>=s.band[0]&&f<=s.band[1]) spots.push({x:sh.x+14+Math.random()*(sh.w-28), y:sh.y-7}); }
  return spots.length?spots[Math.floor(Math.random()*spots.length)]:{x:40+Math.random()*(W-110), y:BED-10-Math.random()*14};
}
/* a startled octopus inks and slips off to a new burrow — it never gives ★3 again */
function relocateOctopus(c){
  const sp=buriedSpot(c.s);
  c.x=sp.x; c.y=sp.y; c.dig=0; c.alarm=0; c.inked=false; c.slipped=true;
}
function spawnC(){ dCreatures.push(placeCreature({bob:Math.random()*6.28})); }
function updateDive(dt){
  const f=Math.min(2.2, dt*60);            // frame-rate normaliser (tuned for 60fps)
  let ax=0,ay=0;const A=.55;
  if(keys['arrowleft']||keys['a'])ax-=A;if(keys['arrowright']||keys['d'])ax+=A;
  if(keys['arrowup']||keys['w'])ay-=A;if(keys['arrowdown']||keys['s'])ay+=A;
  if(divePtr.on){const dx=divePtr.x-dv.x,dy=(divePtr.y+dCamY)-dv.y,m=Math.hypot(dx,dy)||1;if(m>6){ax+=dx/m*A;ay+=dy/m*A;}}
  // dash kick — Shift / double-tap: a quick burst that costs a sip of air
  if(dDashCd>0)dDashCd-=dt; if(dDash>0)dDash-=dt;
  if((keys['shift']||dDashReq)&&dDashCd<=0&&dv.y>SURF+4){
    dDash=0.32; dDashCd=1.5; dBreath=Math.max(0,dBreath-4); tone(520,.1,'triangle',.05);
    for(let i=0;i<6;i++)dParts.push({x:dv.x,y:dv.y,vx:(Math.random()-.5)*2-dv.vx*0.3,vy:(Math.random()-.5)*2-dv.vy*0.3,life:.7,c:'#cfeaf6'});
  }
  dDashReq=false;
  const netLoad=Math.min(1,netWeight()/netCap());   // a heavy net drags — full cargo swims slower
  const boost=dDash>0?2.4:1;
  dv.vx+=ax*f*boost;dv.vy+=ay*f*boost; if(dv.y>SURF)dv.vy-=.10*f;
  const damp=Math.pow(.9,f); dv.vx*=damp;dv.vy*=damp;
  const sp=Math.hypot(dv.vx,dv.vy), MAX=(dDash>0?8.6:5.2)*(1-0.28*netLoad); if(sp>MAX){dv.vx=dv.vx/sp*MAX;dv.vy=dv.vy/sp*MAX;}
  dv.x+=dv.vx*f;dv.y+=dv.vy*f;
  if(ax!==0)dv.face=ax>0?1:-1;
  if(Math.hypot(dv.vx,dv.vy)>.4)dv.kick+=dt*12;
  dv.x=Math.max(dv.r,Math.min(W-dv.r,dv.x));
  if(dv.y<SURF-22){dv.y=SURF-22;dv.vy*=-.3;} if(dv.y>BED-6){dv.y=BED-6;dv.vy*=-.3;}
  // camera eases down after the diver
  const camT=Math.max(0,Math.min(BED+30-H, dv.y-H*0.52));
  dCamY+=(camT-dCamY)*Math.min(1,dt*7);
  const depth01=Math.max(0,Math.min(1,(dv.y-SURF)/(BED-SURF)));
  const sub=dv.y>SURF+4;
  if(sub){ dBreath-=6.5*(1+depth01*0.85)*dt*dSlow;        // the deep costs dearer breath
    if(Math.random()<.25)dBubbles.push({x:dv.x+(Math.random()-.5)*8,y:dv.y-8,r:1+Math.random()*2,v:.6+Math.random()});
    if(dBreath<=0){dBreath=0;
      // blackout — but a haenyeo's grip is stubborn: she keeps her single best take
      let keep=null,bv=-1;
      for(const it of dNet){const s=speciesById(it.id); const v=s?s.value*starMult(it.stars):0; if(v>bv){bv=v;keep=it;}}
      dNet=keep?[keep]:[];
      dv.y=SURF-6;dv.vy=0;
      toast(keep?('Blackout! You held onto the '+speciesById(keep.id).name.toLowerCase()):'Blackout! net lost');}
  } else {
    if(dNet.length>0){ bankNet(); dSumbi=1; tone(300,.4,'sine',.05);
      dBeat={active:true,p:0}; }                          // sumbisori! — tap in the gold ring for a deep gulp of air
    dBreath=Math.min(maxBreath(),dBreath+42*dt*tewakRecover());
  }
  if(dSumbi>0)dSumbi-=dt;
  if(dFresh>0)dFresh-=dt;          // sumbisori freshness window ebbs away
  if(dHintT>0)dHintT-=dt;
  if(dSting>0)dSting-=dt;
  if(dBeat.active){ dBeat.p+=dt/1.35; if(dBeat.p>=1) dBeat.active=false; }
  // ---- drifting jellies sting ----
  for(const j of dJellies){
    j.ph+=dt; j.x=j.bx+Math.sin(j.ph*0.5)*46;
    if(dSting<=0 && sub && Math.hypot(dv.x-j.x,dv.y-j.y)<dv.r+15){
      dSting=1.6; dBreath=Math.max(0,dBreath-14);
      dv.vx+=(dv.x-j.x)*0.22; dv.vy+=(dv.y-j.y)*0.22;
      toast('Ouch — jellyfish sting!'); tone(170,.18,'sawtooth',.05);
      for(let i=0;i<10;i++)dParts.push({x:dv.x,y:dv.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,life:1,c:'#e8a7c8'});
    }
  }
  // ---- air vents refill the lungs; the chest spills salvage ----
  for(const v of dVents){ v.ph+=dt;
    if(sub && Math.hypot(dv.x-v.x,dv.y-(v.y-26))<34){
      dBreath=Math.min(maxBreath(),dBreath+30*dt);
      if(Math.random()<.4)dBubbles.push({x:v.x+(Math.random()-.5)*10,y:dv.y-6,r:1.5+Math.random()*2,v:1+Math.random()});
    } }
  if(dChest && !dChest.open && Math.hypot(dv.x-dChest.x,dv.y-dChest.y)<dv.r+20){
    dChest.open=true; G.money+=dChest.loot; $('moneyV').textContent=G.money;
    toast('Sunken chest — +'+dChest.loot+' won salvage!'); tone(820,.3,'triangle',.07);
    for(let i=0;i<12;i++)dParts.push({x:dChest.x,y:dChest.y-8,vx:(Math.random()-.5)*3,vy:-Math.random()*2.6,life:1,c:'#f0bd4c'});
  }
  // low-air heartbeat
  if(sub && dBreath/maxBreath()<0.25){ dLowT-=dt; if(dLowT<=0){ dLowT=0.9; tone(88,.14,'sine',.06); } }
  // ---- the dolphin pod passes through ----
  if(dPod){
    dPod.x+=dPod.dir*dt*95;
    if(!dPod.blessed && Math.hypot(dv.x-dPod.x,dv.y-dPod.y)<100){
      dPod.blessed=true; dBreath=Math.min(maxBreath(),dBreath+40);
      toast('A dolphin pod circles you — a rich harvest omen!'); tone(880,.3,'sine',.06);
    }
    if(dPod.x<-180||dPod.x>W+180) dPod=null;
  }
  // ---- a rescued animal that remembers you: swims in, circles alongside a while, then drifts off ----
  if(dCompanion){ const C=dCompanion; C.t+=dt;
    if(C.state==='enter'){
      const dx=dv.x-C.x, dy=(dv.y+30)-C.y, m=Math.hypot(dx,dy)||1;
      C.x+=dx/m*dt*130; C.y+=dy/m*dt*130; C.dir=dx>=0?1:-1;
      if(m<80){ C.state='along'; if(!G.rescueRememberSeen){ G.rescueRememberSeen=true; toast('The '+C.kind+' you freed… it remembers.'); } }
    } else if(C.state==='along'){
      C.hold-=dt; const ang=C.t*1.1, tx=dv.x+Math.cos(ang)*72, ty=dv.y+30+Math.sin(ang)*42;
      C.dir=(tx-C.x)>=0?1:-1; C.x+=(tx-C.x)*dt*3; C.y+=(ty-C.y)*dt*3;
      if(C.hold<=0){ C.state='leave'; C.dir=C.x<W/2?-1:1; }
    } else { C.x+=C.dir*dt*120; C.y+=dt*38; if(C.x<-160||C.x>W+160||C.y>BED+80) dCompanion=null; }
  }
  // ---- the sea cave keeps one pearl, found once a day ----
  if(!G.caveToday && Math.hypot(dv.x-DCAVE.x,dv.y-DCAVE.y)<46){
    if(netFull(0)){ if(dHintT<=0){dHintT=3;toast('Net full — the pearl must wait');} }
    else { G.caveToday=true; dNet.push({id:'pearl',stars:3});
      toast('✨ A pearl, hidden deep in the sea cave!'); tone(980,.4,'triangle',.07);
      for(let i=0;i<12;i++)dParts.push({x:DCAVE.x,y:DCAVE.y-12,vx:(Math.random()-.5)*3,vy:-Math.random()*2.5,life:1,c:'#f2ecff'});
    }
  }
  const dvSpd=Math.hypot(dv.vx,dv.vy);
  for(const c of dCreatures){c.bob+=dt*2;
    const reach=dv.r+c.r+(c.buried?7:0);
    const dist=Math.hypot(dv.x-c.x,dv.y-c.y);
    const near=dist<reach;
    // ---- free-swimmers grow wary of a rushing diver; a slow approach soothes them ----
    if(!c.buried){
      if(dist<78){ if(dvSpd>3.0) c.alarm=Math.min(1,c.alarm+dt*2.2); else c.alarm=Math.max(0,c.alarm-dt*0.3); }
      else c.alarm=Math.max(0,c.alarm-dt*0.6);
      // a spooked conch scoots away from the diver — you must come back calm to take it well
      if(c.s.id!=='seaweed' && c.alarm>0.45 && dist<120){
        const m=dist||1, flee=(0.5+c.alarm)*60*dt;
        c.x+=(c.x-dv.x)/m*flee; c.y+=(c.y-dv.y)/m*flee;
        c.x=Math.max(24,Math.min(W-24,c.x)); c.y=Math.max(SURF+44,Math.min(BED-8,c.y));
      }
    }
    // juveniles are left to grow — the sea only gives what it offers
    if(c.young){
      if(near && dHintT<=0){ dHintT=3; toast('Too small — leave it to grow'); tone(500,.08,'sine',.03); }
      continue;
    }
    const grab=()=>{
      const stars=catchStars(c);
      dNet.push({id:c.s.id, stars}); tone(stars>=3?760:680,.07,'triangle',.06);
      if(stars>=3) toast('★★★ A perfect take!');
      for(let i=0;i<8;i++)dParts.push({x:c.x,y:c.y,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,life:1,c:c.s.color});
      placeCreature(c);
    };
    if(c.buried){
      if(near){
        if(netFull(creatureKg(c.s.id))){ toast('Net full — surface!'); }
        else {
          c.dig+=dt*toolDig();                                    // dig it loose — faster with a better tool
          if(Math.random()<.5)dParts.push({x:c.x+(Math.random()-.5)*c.r*2,y:c.y+(Math.random()-.3)*c.r,vx:(Math.random()-.5)*2.4,vy:-Math.random()*2.2,life:.7,c:'#6b563a'});
          if(c.dig%0.5<dt)tone(160,.05,'square',.03);
          if(c.dig>=c.digMax) grab();
        }
      } else if(c.dig>0){
        c.dig=Math.max(0,c.dig-dt*1.4); c.slipped=true;   // a broken dig costs a star
        // an octopus seizes the lapse — inks a dark cloud and slips off to a new burrow
        if(c.s.id==='octopus' && !c.inked && c.dig<=0){
          c.inked=true;
          for(let i=0;i<16;i++)dParts.push({x:c.x,y:c.y,vx:(Math.random()-.5)*3.4,vy:(Math.random()-.5)*3.4,life:1.4,c:'#241f2e'});
          tone(150,.22,'sine',.05); if(dHintT<=0){dHintT=3;toast('The octopus inks and slips away!');}
          relocateOctopus(c);
        }
      }
    } else {
      if(near){
        if(netFull(creatureKg(c.s.id))){toast('Net full — surface!');continue;}
        grab();
      }
    }
  }
  for(const b of dBubbles){b.y-=b.v;b.x+=Math.sin(b.y*.05)*.3;}dBubbles=dBubbles.filter(b=>b.y>SURF-4);
  for(const p of dParts){p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.life-=dt*1.6;}dParts=dParts.filter(p=>p.life>0);
  if(dParts.length>160) dParts.splice(0,dParts.length-160);   // bound the dive particle pool
  dTime-=dt; if(dTime<=0){endDive();return;}
  const bp=dBreath/maxBreath();
  $('breathFill').style.width=(bp*100)+'%';
  $('breathFill').style.background=bp<.25?'linear-gradient(90deg,#c9512c,#e8714a)':'linear-gradient(90deg,#f0bd4c,#f6f1e3)';
  $('breathPct').textContent=Math.round(bp*100)+'%';
  $('timeFill').style.width=(dTime/dTimeMax*100)+'%';
  const dpv=$('depthV'); if(dpv){ const m=Math.max(0,depth01*DIVE_MAX_M); dpv.textContent=Math.round(m)+' m · '+diveZone(m); }
  const nv=$('netV'); if(nv){ const full=netFull(0);
    nv.textContent=Math.round(netWeight())+'/'+netCap()+' kg'+(full?' · FULL':'');
    nv.style.color=full?'#f0a07c':''; }
}
/* the sumbisori beat — tap (or Space) as the closing ring meets the gold circle
   for a deep, perfect breath: a chunk of air back and a touch more time */
function trySumbi(){
  if(!dBeat.active) return;
  const hit=dBeat.p>=0.3&&dBeat.p<=0.74;
  dBeat.active=false;
  if(hit){
    dBreath=Math.min(maxBreath(),dBreath+maxBreath()*0.35);
    dTime=Math.min(dTimeMax,dTime+2.5);
    dSumbi=1.2; dFresh=6; toast('♪ Perfect sumbisori! Fresh catch ahead'); tone(740,.25,'sine',.06);
  }
}
function endDive(){
  bankNet();                                              // empty the carried net into the quality-tallied haul
  for(const k in diveCatch){ const q=diveCatch[k]; for(const s of [1,2,3]) for(let i=0;i<(q[s]||0);i++) addCatch(k,s); }
  G.meal=null; updateMealBadge();   // the meal carried you through this dive
  $('diveHud').classList.remove('show'); $('surfBtn').classList.remove('show');
  const list=$('diveList');list.innerHTML='';let any=false,val=0;
  for(const s of SPECIES){const q=diveCatch[s.id]; if(!q)continue;
    const n=(q[1]||0)+(q[2]||0)+(q[3]||0); if(n<=0)continue; any=true;
    // average star, for a compact one-line summary; value reflects the quality mix
    let starsSum=0; for(const k of [1,2,3]){ starsSum+=k*(q[k]||0); val+=Math.round((q[k]||0)*s.value*starMult(k)); }
    const avg=Math.max(1,Math.round(starsSum/n));
    const row=document.createElement('div');row.className='line';
    row.innerHTML=`<span><span class="dot" style="background:${s.color}"></span>${s.name} <span style="color:#d59f2e">${starStr(avg)}</span></span><span>×${n}</span>`;list.appendChild(row);}
  if(!any)list.innerHTML='<div class="line"><span>Empty net…</span><span></span></div>';
  $('diveNote').textContent = any? 'Take it to the co-op to sell.' : 'The sea was quiet today.';
  scene='panel'; panelBg='dive'; $('pDive').classList.remove('hidden');
}
$('surfBtn').onclick=()=>endDive();
$('diveClose').onclick=()=>{ $('pDive').classList.add('hidden'); scene='village'; P.x=330; P.y=BEACH_Y-24; P.face=1; };

/* ---------------- BEACH CLEAN-UP (walk the sand, gather litter, dig out treasure) ---------------- */
/* ---- all beach balance knobs in one place (tune here, see SPEC.md §B) ---- */
const BEACH_TUNING={
  bag:12,                                   // collection bag capacity
  tideSeconds:46,                           // base tide-timer length
  earlyDays:4, earlyTideBonus:10, earlyLitterCut:3, litterMin:5,   // gentle early-game ramp (SPEC §B2): eases out by ~day 5
  litterBase:8, litterPerNeglect:12, litterMax:18, litterWeatherBump:3,   // count = min(max, base + round((100-health)/perNeglect) + weatherBump)
  rescueChanceRough:0.70, rescueChanceCalm:0.45, cutSeconds:2.6,
  healthPerLitter:0.9, healthPerTreasure:0.4, healthPerRescue:14, healthSortBonus:6, healthSortAccGate:0.8,
  driftCalm:7, driftRain:10, driftWind:12,  // overnight beach-health loss by weather
  riskRefY:300, riskSpan:275, riskEcoMax:4, // value-by-distance: round(clamp((y-refY)/span)*ecoMax)
  comboWindow:2.2, comboCap:5, comboPitchBase:520, comboPitchStep:40,
  spotlessRadius:150, spotlessEco:5, spotlessCd:4,
  ecoPerLitterSort:2, wrongSortPayout:0.4, rescueEco:15,
  tideBaseY:575, tideRise:200, tideEase:1.5,
  diveCreatureBase:14, diveCreatureFromHealth:10,   // dive richness: round(base + health01*fromHealth)
};
const BEACH_BAG=BEACH_TUNING.bag;
const BEACH_AREA={x0:18, x1:W-18, y0:152, y1:558};
let bLitter=[], bParts=[], bFloats=[], bRings=[], beachCatch={}, bBagCount=0, bTime=0, bTimeMax=46;
let bCombo=0, bComboT=0, bSpotlessCd=0;   // quick-grab combo + area-clear cooldown
let bGoal=null, bMod=null, bModEco=0, bHealthStart=0, bRescuedThis=false;   // daily goal + session modifier
/* ghost-net wildlife rescue — a creature tangled in washed-up net; hold to cut it free */
let bRescue=null;
const RESCUE_KINDS=[
  {kind:'turtle',  name:'sea turtle', kr:'바다거북', reward:70, fact:"Six of the seven sea-turtle species are endangered — lost nets and lines are a leading cause of death."},
  {kind:'dolphin', name:'dolphin',    kr:'돌고래',   reward:90, fact:"Dolphins drown when they can't surface, tangled in discarded fishing gear. Freeing one is a rare gift."},
  {kind:'seabird', name:'seabird',    kr:'가마우지', reward:55, fact:"Seabirds get snared in fishing line and plastic loops; a few quick cuts can save a life."},
];
function makeRescue(){
  const k=RESCUE_KINDS[Math.floor(Math.random()*RESCUE_KINDS.length)];
  return { k, x:BEACH_AREA.x0+80+Math.random()*(BEACH_AREA.x1-BEACH_AREA.x0-160),
           y:BEACH_AREA.y0+120+Math.random()*(BEACH_AREA.y1-BEACH_AREA.y0-200),
           cut:0, cutMax:BEACH_TUNING.cutSeconds/cutSpeed(), freed:false, fleeT:0, bob:Math.random()*6.28, r:22 };
}
// quiet lines that fade in as a freed animal looks back, then leaves
const RESCUE_LINES=["One less life lost to the sea's neglect.","It looked back once. Then it was free.","The sea remembers kindness."];
// remember which animals the diver has freed — they may return to visit on later dives
function recordRescue(k){ G.rescuedAnimals=G.rescuedAnimals||{}; G.rescuedAnimals[k.kind]=(G.rescuedAnimals[k.kind]||0)+1; }
function pickBeachItem(){
  const pool=[];
  for(const b of BEACH_ITEMS){ const w=b.treasure?1:4; for(let i=0;i<w;i++) pool.push(b); }   // litter common, treasure rare
  return pool[Math.floor(Math.random()*pool.length)];
}
/* the waterline marches up the sand as the tide timer runs out (accelerating near the end).
   575 = the dry baseline · ~375 = fully in. Shared by updateBeach (flooding) and drawBeach (visual). */
function tideLineY(){ if(!bTimeMax) return 575;
  const p=Math.max(0,Math.min(1,1-(bTime/bTimeMax))); return BEACH_TUNING.tideBaseY - Math.pow(p,BEACH_TUNING.tideEase)*BEACH_TUNING.tideRise; }
function placeLitter(c){
  const s=pickBeachItem();
  c.s=s; c.r=s.r||12; c.buried=!!s.buried; c.dig=0;
  c.digMax = s.treasure?1.5:0; c.bob=Math.random()*6.28;
  c.x=BEACH_AREA.x0+16+Math.random()*(BEACH_AREA.x1-BEACH_AREA.x0-32);
  // fresh litter washes in on the dry sand, above the advancing waterline
  const dryBottom=Math.min(BEACH_AREA.y1-48, tideLineY()-24);
  c.y=BEACH_AREA.y0+24+Math.random()*Math.max(40,(dryBottom-(BEACH_AREA.y0+24)));
  return c;
}
function spawnL(){ bLitter.push(placeLitter({})); }
function startBeachClean(){
  if(!haveEnergy('beach')) return;   // too tired to comb the shore
  spendEnergy('beach');
  G.beachRuns=(G.beachRuns||0)+1;   // lifetime tally
  scene='beach'; beachCatch={}; bBagCount=0; bParts=[]; bFloats=[]; bRings=[]; bLitter=[];
  bCombo=0; bComboT=0; bSpotlessCd=0;
  const dayEase=Math.max(0,1-(G.day-1)/BEACH_TUNING.earlyDays);   // 1 on day 1 → 0 by ~day 5
  bTimeMax=BEACH_TUNING.tideSeconds+Math.round(BEACH_TUNING.earlyTideBonus*dayEase); bTime=bTimeMax;
  // a dirtier shore washes up more to clean (8 pristine → ~16 neglected), and rough
  // weather surges the debris further — the tide drags in more on wind/rain days
  const weatherBump=(G.weather==='wind'||G.weather==='rain')?BEACH_TUNING.litterWeatherBump:0;
  const litterN=Math.max(BEACH_TUNING.litterMin, Math.min(BEACH_TUNING.litterMax, BEACH_TUNING.litterBase+Math.round((100-G.beachHealth)/BEACH_TUNING.litterPerNeglect)+weatherBump-Math.round(BEACH_TUNING.earlyLitterCut*dayEase)));
  for(let i=0;i<litterN;i++) spawnL();
  // sometimes a creature is tangled in a washed-up net (more likely after rough weather)
  const rescueChance = (G.weather==='wind'||G.weather==='rain') ? BEACH_TUNING.rescueChanceRough : BEACH_TUNING.rescueChanceCalm;
  bRescue = Math.random()<rescueChance ? makeRescue() : null;
  // ---- session modifier (variety, SPEC §A3) ----
  bMod=null; bModEco=0;
  const rough=(G.weather==='wind'||G.weather==='rain');
  if(rough && Math.random()<0.55){ bMod='surge';
    for(let i=0;i<4;i++) spawnL();                       // an extra debris wave
    bModEco=1;                                           // every piece cleaned pays +1 eco today
    toast('⛈ Storm surge — debris everywhere. Cleaning pays extra today.');
  } else if(!rough && G.beachHealth>=67 && Math.random()<0.55){ bMod='wildlife';
    if(!bRescue) bRescue=makeRescue();                   // a lively, healthy shore → something to free
    toast('☀ A lively shore today — keep an eye out for wildlife.');
  } else if(Math.random()<0.25){ bMod='bounty';
    const tr=BEACH_ITEMS.find(b=>b.treasure); if(tr){ const c=placeLitter({}); c.s=tr; c.r=tr.r||12; c.buried=!!tr.buried; c.digMax=tr.treasure?1.5:0; bLitter.push(c); }
    toast('✦ Word is a salvage washed up on the shore today.');
  }
  // ---- daily goal (SPEC §A2) ----
  bHealthStart=G.beachHealth; bRescuedThis=false;
  const goals=[{key:'bag', label:'Fill your collection bag', reward:30},
               {key:'sort', label:'Sort at least 90% correctly', reward:35}];
  if(bRescue) goals.push({key:'rescue', label:'Free the tangled animal', reward:40});
  if(G.beachHealth<82) goals.push({key:'heal', label:'Heal the shore by +10', reward:30});
  bGoal=goals[Math.floor(Math.random()*goals.length)]; bGoal.done=false;
  toast('🎯 Goal: '+bGoal.label);
  P.x=W/2; P.y=BEACH_AREA.y0+40; P.face=1; P.moving=false; P.anim=0;
  $('beachHud').classList.add('show'); $('leaveBeachBtn').classList.add('show');
  $('prompt').classList.remove('show'); $('mealBadge').classList.remove('show');
  tone(360,.18,'sine',.04);
}
function updateBeach(dt){
  let mx=0,my=0;
  if(keys['arrowleft']||keys['a'])mx-=1; if(keys['arrowright']||keys['d'])mx+=1;
  if(keys['arrowup']||keys['w'])my-=1;   if(keys['arrowdown']||keys['s'])my+=1;
  if(joy.on&&joy.moved){const mm=Math.hypot(joy.dx,joy.dy)||1;mx+=joy.dx/mm;my+=joy.dy/mm;}
  const m=Math.hypot(mx,my); P.moving=m>0.1;
  if(m>0){mx/=m;my/=m; if(mx!==0)P.face=mx>0?1:-1; P.x+=mx*SPEED; P.y+=my*SPEED; P.anim+=dt*9;}
  P.x=Math.max(BEACH_AREA.x0,Math.min(BEACH_AREA.x1,P.x));
  P.y=Math.max(BEACH_AREA.y0,Math.min(BEACH_AREA.y1,P.y));
  P.y=Math.min(P.y, tideLineY()-P.r-3);   // stay on the sand — can't wade into the rising sea
  // gather litter / dig out treasure
  const tideY=tideLineY();
  for(const c of bLitter){
    c.bob+=dt*2;
    if(c.y > tideY+6){ c.dig=0; continue; }   // washed under the rising tide — out of reach, lost to the sea
    const reach=P.r+c.r+(c.buried?9:2);
    const near=Math.hypot(P.x-c.x,P.y-c.y)<reach;
    const grab=()=>{
      const gx=c.x, gy=c.y, col=c.s.color, treasure=c.s.treasure;
      beachCatch[c.s.id]=(beachCatch[c.s.id]||0)+1; bBagCount++;
      bCombo=(bComboT>0)?bCombo+1:1; bComboT=BEACH_TUNING.comboWindow; const mult=Math.min(BEACH_TUNING.comboCap,bCombo);
      // risk/reward: litter snatched closer to the rising tide is worth bonus eco-points
      const risk=Math.max(0,Math.min(1,(gy-BEACH_TUNING.riskRefY)/BEACH_TUNING.riskSpan)), ecoBonus=Math.round(risk*BEACH_TUNING.riskEcoMax)+(mult>1?mult:0)+bModEco;
      if(ecoBonus>0){ G.eco=(G.eco||0)+ecoBonus; bFloats.push({x:c.x,y:c.y-8,txt:'+'+ecoBonus+' ♻',life:1.1,col:'#7fd0c0'}); }
      bRings.push({x:gx,y:gy,life:1,col});
      if(mult>1) bFloats.push({x:gx,y:gy-22,txt:'COMBO x'+mult,life:1.0,col:'#f0c23a'});
      tone(treasure?740:(BEACH_TUNING.comboPitchBase+Math.min(7,bCombo)*BEACH_TUNING.comboPitchStep),.07,'triangle',.06);
      for(let i=0;i<8;i++)bParts.push({x:gx,y:gy,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,life:1,c:col});
      G.beachHealth += treasure?BEACH_TUNING.healthPerTreasure:BEACH_TUNING.healthPerLitter; clampHealth();   // every piece removed heals the shore a little
      const bp=$('bagPct'); if(bp){ bp.style.animation='none'; void bp.offsetWidth; bp.style.animation='bagbump .3s'; }   // counter bump
      if(c.s.treasure) toast('\u2726 '+c.s.name+' (+'+c.s.value+' won)');
      else maybeShowFact(c.s);                                // first time picking up this debris \u2192 a real fact
      placeLitter(c);
      // area clear: the local patch is now empty \u2192 a small Spotless! bonus + a bright flash
      if(bSpotlessCd<=0){
        const localLeft=bLitter.filter(o=>o!==c && o.y<=tideLineY()+6 && Math.hypot(o.x-gx,o.y-gy)<BEACH_TUNING.spotlessRadius).length;
        if(localLeft===0){ bSpotlessCd=BEACH_TUNING.spotlessCd; G.eco=(G.eco||0)+BEACH_TUNING.spotlessEco;
          bRings.push({x:gx,y:gy,life:1.3,col:'#fff7d8',big:true});
          bFloats.push({x:gx,y:gy-36,txt:'SPOTLESS! +5',life:1.4,col:'#fff7d8'});
          toast('Spotless! A patch of shore gleams \u2728'); }
      }
    };
    if(c.buried){
      if(near){
        if(bBagCount>=bagCap()){ toast('Bag full \u2014 head back!'); }
        else {
          c.dig+=dt;
          if(Math.random()<.5)bParts.push({x:c.x+(Math.random()-.5)*c.r*2,y:c.y+(Math.random()-.3)*c.r,vx:(Math.random()-.5)*2.4,vy:-Math.random()*2.2,life:.7,c:'#c9a36a'});
          if(c.dig%0.5<dt)tone(150,.05,'square',.03);
          if(c.dig>=c.digMax) grab();
        }
      } else { c.dig=Math.max(0,c.dig-dt*1.4); }
    } else {
      if(near){ if(bBagCount>=bagCap()){ toast('Bag full \u2014 head back!'); } else grab(); }
    }
  }
  // ---- ghost-net wildlife rescue: walk up and hold to cut the net away ----
  if(bRescue){
    bRescue.bob+=dt*2;
    if(bRescue.freed){
      if(bRescue.lookT>0){
        // a beat: it pauses and turns to look back at you, wrapped in a soft glow
        bRescue.lookT-=dt;
        if(Math.random()<0.4)bParts.push({x:bRescue.x+(Math.random()-.5)*bRescue.r*2,y:bRescue.y+(Math.random()-.5)*bRescue.r,vx:(Math.random()-.5)*1,vy:-Math.random()*1.2,life:1,c:'#bfe9e0'});
        if(bRescue.lookT<=0){ const k=bRescue.k;   // the look-back over, the normal reward lands
          toast('✦ Freed the '+k.name+'! +'+k.reward+' won'); showFact(k.fact); }
      } else {
        // then it heads for the open water (or sky) and leaves
        bRescue.fleeT-=dt;
        if(bRescue.k.kind==='seabird'){ bRescue.y-=dt*60; bRescue.x+=dt*30; }
        else { bRescue.y+=dt*70; }      // turtle & dolphin make for the sea
        if(bRescue.fleeT<=0) bRescue=null;
      }
    } else {
      const near=Math.hypot(P.x-bRescue.x,P.y-bRescue.y)<P.r+bRescue.r+10;
      if(near){
        bRescue.cut+=dt;               // hold position to cut the net strands
        if(Math.random()<.5)bParts.push({x:bRescue.x+(Math.random()-.5)*bRescue.r*2,y:bRescue.y+(Math.random()-.5)*bRescue.r,vx:(Math.random()-.5)*2,vy:-Math.random()*2,life:.7,c:'#6aa647'});
        if(bRescue.cut%0.5<dt)tone(300,.05,'square',.04);
        if(bRescue.cut>=bRescue.cutMax){
          // freed!
          const k=bRescue.k;
          bRescue.freed=true; bRescue.lookT=1.3; bRescue.fleeT=2.2; bRescuedThis=true;
          bRescue.lookFace=(P.x<=bRescue.x)?-1:1;     // turn to face the diver
          bRescue.narration=RESCUE_LINES[(G.rescueLineIdx=((G.rescueLineIdx||0)+1)%RESCUE_LINES.length)];
          G.money+=k.reward; $('moneyV').textContent=G.money;   // rewards kept intact
          G.eco+=BEACH_TUNING.rescueEco; G.beachHealth+=BEACH_TUNING.healthPerRescue; clampHealth();
          if(typeof recordRescue==='function') recordRescue(k);   // remembered later, in the dives
          for(let i=0;i<16;i++)bParts.push({x:bRescue.x,y:bRescue.y,vx:(Math.random()-.5)*3.5,vy:(Math.random()-.5)*3.5,life:1.2,c:'#5cbfb0'});
          softChime();                                // gentle warm chime (toast + fact card land after the look-back)
        }
      } else { bRescue.cut=Math.max(0,bRescue.cut-dt*1.2); }   // wandering off lets the net re-tangle
    }
  }
  for(const p of bParts){p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.life-=dt*1.6;} bParts=bParts.filter(p=>p.life>0);
  for(const f of bFloats){ f.y-=dt*22; f.life-=dt; } bFloats=bFloats.filter(f=>f.life>0);
  for(const r of bRings){ r.life-=dt*1.8; } bRings=bRings.filter(r=>r.life>0);
  // cap the effect pools so a combo/rescue burst can never churn memory unbounded
  if(bParts.length>140) bParts.splice(0,bParts.length-140);
  if(bFloats.length>30) bFloats.splice(0,bFloats.length-30);
  if(bRings.length>30) bRings.splice(0,bRings.length-30);
  bComboT-=dt; if(bComboT<=0) bCombo=0; bSpotlessCd-=dt;   // combo lapses after a pause
  bTime-=dt; if(bTime<=0){ endBeach(); return; }
  $('bagFill').style.width=(bBagCount/bagCap()*100)+'%';
  $('bagPct').textContent=bBagCount+'/'+bagCap();
  $('tideFill').style.width=(bTime/bTimeMax*100)+'%';
  { const sf=$('shoreFill'); if(sf){ const h=Math.round(G.beachHealth);
      sf.style.width=h+'%'; sf.style.background = h<35?'linear-gradient(90deg,#c9512c,#e8714a)':(h<70?'linear-gradient(90deg,#e0a836,#f0d27a)':'linear-gradient(90deg,#6aa647,#acd684)');
      const sp=$('shorePct'); if(sp)sp.textContent=h+'% · '+(h<34?'Neglected':h<67?'Recovering':'Thriving'); } }
}
/* sorting session state */
let sortQueue=[], sortIdx=0, sortStreak=0, sortTally={won:0, eco:0, correct:0, total:0, treasure:0};
function endBeach(){
  $('beachHud').classList.remove('show'); $('leaveBeachBtn').classList.remove('show');
  sortTally={won:0, eco:0, correct:0, total:0, treasure:0}; sortStreak=0;
  // treasures are salvaged straight to won \u2014 no sorting needed
  for(const b of BEACH_ITEMS){ const n=beachCatch[b.id]||0; if(n>0 && b.treasure){ sortTally.treasure+=n*b.value; } }
  // litter goes to the \ubd84\ub9ac\uc218\uac70 sorting screen
  sortQueue=[]; for(const b of BEACH_ITEMS){ const n=beachCatch[b.id]||0; if(n>0 && !b.treasure) sortQueue.push({item:b, n}); }
  if(!sortQueue.length){
    if(sortTally.treasure){ G.money+=sortTally.treasure; $('moneyV').textContent=G.money; }
    showBeachResult(); return;
  }
  sortIdx=0; scene='panel'; panelBg='village';
  $('prompt').classList.remove('show'); $('pSort').classList.remove('hidden');
  renderSortItem();
}
function renderSortItem(){
  const e=sortQueue[sortIdx]; const b=e.item;
  $('sortProg').textContent=(sortIdx+1)+' / '+sortQueue.length;
  $('sortItem').innerHTML=`<span class="dot" style="background:${b.color};width:16px;height:16px;border-radius:4px"></span> <b>${b.kr}</b> ${b.name} \u00d7${e.n}<br><span style="font-size:12px;color:var(--ink-soft)">Which bin does this go in?</span>`;
  $('sortFeedback').textContent='';
  $('sortNext').classList.add('hidden');
  const bins=$('sortBins'); bins.innerHTML='';
  for(const bin of RECYCLE_BINS){
    const btn=document.createElement('button'); btn.className='chip'; btn.dataset.bin=bin.id;
    btn.innerHTML=`<span class="dot" style="background:${bin.color}"></span>${bin.kr} \u00b7 ${bin.label}`;
    btn.onclick=()=>pickBin(bin.id);
    bins.appendChild(btn);
  }
}
function pickBin(binId){
  const e=sortQueue[sortIdx]; const b=e.item;
  // lock the buttons
  document.querySelectorAll('#sortBins .chip').forEach(c=>{ c.onclick=null; c.disabled=true;
    if(c.dataset.bin===b.category) c.classList.add('sel'); });
  const right=(binId===b.category);
  sortTally.total+=e.n;
  const chosen=document.querySelector('#sortBins .chip[data-bin="'+binId+'"]');
  if(right){
    sortStreak++; const sb=Math.min(6,sortStreak), streakBonus=(sb>1?sb:0);
    sortTally.correct+=e.n; sortTally.won+=b.value*e.n; sortTally.eco+=e.n*BEACH_TUNING.ecoPerLitterSort+streakBonus;
    if(chosen){ chosen.classList.add('gulp'); }     // the bin "eats" it
    const streakTxt = sb>1 ? ` \u00b7 \uc5f0\uc18d Streak x${sortStreak}!${streakBonus?' +'+streakBonus+' \u267b':''}` : '';
    $('sortFeedback').innerHTML=`\u2713 \ub9de\uc544\uc694! Correct \u2014 +${b.value*e.n} won${streakTxt}`;
    tone(620+sb*70,.12,'sine',.06);              // rising pitch with the streak
  } else {
    sortStreak=0;
    const got=Math.round(b.value*e.n*BEACH_TUNING.wrongSortPayout);
    sortTally.won+=got;
    const correct=recycleBin(b.category);
    if(chosen){ chosen.classList.add('buzz'); }     // soft buzz on the wrong bin
    $('sortFeedback').innerHTML=`\u2717 Not quite \u2014 ${b.kr} goes in <b>${correct?correct.kr:b.category}</b>. (+${got} won)`;
    tone(196,.18,'sine',.045);                    // gentle low buzz, not harsh
  }
  $('sortNext').textContent = (sortIdx>=sortQueue.length-1) ? '\ub9c8\uce68 Finish' : '\ub2e4\uc74c Next \u25b6';
  $('sortNext').classList.remove('hidden');
}
$('sortNext').onclick=()=>{
  if(sortIdx<sortQueue.length-1){ sortIdx++; renderSortItem(); return; }
  // done sorting \u2014 tally, pay, reward
  $('pSort').classList.add('hidden');
  const acc = sortTally.total ? sortTally.correct/sortTally.total : 1;
  if(acc>=BEACH_TUNING.healthSortAccGate){ G.beachHealth+=BEACH_TUNING.healthSortBonus; clampHealth(); }   // a tidy sorter keeps the shore that bit cleaner
  G.eco += sortTally.eco;
  G.money += sortTally.won + sortTally.treasure; $('moneyV').textContent=G.money;
  showBeachResult(acc);
};
function showBeachResult(acc){
  const list=$('beachList'); list.innerHTML='';
  const row=(a,b)=>{ const r=document.createElement('div'); r.className='line'; r.innerHTML=`<span>${a}</span><span>${b}</span>`; list.appendChild(r); };
  if(sortTally.total){
    row('Sorted correctly', sortTally.correct+' / '+sortTally.total);
    row('Eco-points', '+'+sortTally.eco);
  }
  if(sortTally.treasure) row('Treasure salvage', sortTally.treasure+' won');
  // daily goal result (SPEC §A2)
  if(bGoal){
    let met=false;
    if(bGoal.key==='rescue') met=bRescuedThis;
    else if(bGoal.key==='bag') met=bBagCount>=bagCap();
    else if(bGoal.key==='sort') met=sortTally.total>0 && (sortTally.correct/sortTally.total)>=0.9;
    else if(bGoal.key==='heal') met=(G.beachHealth-bHealthStart)>=10;
    if(met){ G.money+=bGoal.reward; row('🎯 Goal cleared!', bGoal.label+' · +'+bGoal.reward+' won'); }
    else row('🎯 Goal missed', bGoal.label);
    bGoal=null;
  }
  // long arc: cumulative shore restored (SPEC §A4)
  G.shoreCleaned=(G.shoreCleaned||0)+bBagCount;
  for(const m of [50,100,200,400,800]){ if(G.shoreCleaned>=m && (G.shoreMilestone||0)<m){ G.shoreMilestone=m;
    row('🏖 Shore restored', G.shoreCleaned+' pieces cleaned — thank you'); break; } }
  const earned=sortTally.won+sortTally.treasure;
  const t=document.createElement('div'); t.className='line tot'; t.innerHTML=`<span>Earned</span><span>${earned} won</span>`; list.appendChild(t);
  $('beachNote').textContent = (acc!=null && acc>=0.8)
    ? 'Well sorted \u2014 the shore breathes easier, and the sea will thank you.'
    : (sortTally.total ? 'Every piece off the sand helps. Check the bins again next time.' : 'The sand was clean today.');
  // result flourish: celebrate a perfect \ubd84\ub9ac\uc218\uac70, otherwise an encouraging tally
  const cheer=$('beachCheer');
  if(cheer){ cheer.innerHTML=''; cheer.classList.remove('pop');
    const perfect=(sortTally.total>0 && sortTally.correct===sortTally.total);
    if(sortTally.total>0){
      cheer.textContent = perfect ? '\uc644\ubcbd\ud55c \ubd84\ub9ac\uc218\uac70! Perfect! \u2728' : (acc>=0.6?'\uc798\ud588\uc5b4\uc694! Nicely sorted':'\ubd84\ub9ac\uc218\uac70 \uc5f0\uc2b5 \u2014 keep at it!');
      void cheer.offsetWidth; cheer.classList.add('pop');
      if(perfect) beachConfetti(cheer);
    } else { cheer.textContent=''; }
  }
  scene='panel'; panelBg='village'; $('pBeach').classList.remove('hidden');
}
function beachConfetti(host){
  const cols=['#e8714a','#f2c75a','#5cbfb0','#6aa647','#d68aa6'];
  for(let i=0;i<18;i++){ const s=document.createElement('span'); s.className='confetti';
    s.style.left=(8+Math.random()*84)+'%'; s.style.background=cols[i%cols.length];
    s.style.animationDelay=(Math.random()*0.35).toFixed(2)+'s';
    host.appendChild(s); setTimeout(()=>s.remove(),1900); }
}
{ const e=$('leaveBeachBtn'); if(e) e.onclick=()=>endBeach(); }
{ const e=$('beachClose'); if(e) e.onclick=()=>{ $('pBeach').classList.add('hidden'); scene='village'; P.x=150; P.y=BEACH_Y+40; P.face=1; }; }

/* ---------------- LOOP ---------------- */
function drawPanelBg(){
  if(panelBg==='home')drawHome();
  else if(panelBg==='shop')drawShop();
  else if(panelBg==='market')drawMarket();
  else if(panelBg==='dive')drawDive();
  else drawVillage();
}
let last=performance.now();
let _frameErrLogged=false;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(window.HaenyeoWeather) window.HaenyeoWeather.setScene(scene);
  try{
    if(window.phoneOpen){ for(const k in keys)keys[k]=false; joy.on=false; divePtr.on=false; }   // pause input while the phone is up
    if(!window.phoneOpen && ['village','shop','home','dive','eating','market','beach','museum'].includes(scene)) tickClock(dt);
    if(scene==='village'){updateVillage(dt);updateNPCs(dt);updatePets(dt);drawVillage();drawJoy();}
    else if(scene==='shop'){updateShop(dt);drawShop();drawJoy();}
    else if(scene==='market'){updateMarket(dt);drawMarket();drawJoy();}
    else if(scene==='museum'){updateMuseum(dt);drawMuseum();drawJoy();}
    else if(scene==='home'){updateHome(dt);drawHome();drawJoy();}
    else if(scene==='eating'){updateEat(dt);drawEat();}
    else if(scene==='resting'){updateRest(dt);drawRest();}
    else if(scene==='dialogue-open'){ if(dialogBg==='shop')drawShop(); else if(dialogBg==='home')drawHome(); else {updateNPCs(dt);updatePets(dt);drawVillage();} }
    else if(scene==='dive'){updateDive(dt);drawDive();}
    else if(scene==='kitchen'){ if(typeof updateRestaurant==='function')updateRestaurant(dt); if(typeof drawRestaurant==='function')drawRestaurant(); drawJoy(); }
    else if(scene==='beach'){updateBeach(dt);drawBeach();drawJoy();}
    else if(scene==='panel'){ if(panelBg==='village'){updateNPCs(dt);updatePets(dt);} drawPanelBg(); }
    else if(scene==='title'){updateNPCs(dt);updatePets(dt);drawVillage();}
    if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('show');}
    if(factT>0){factT-=dt;if(factT<=0){const fc=$('factCard');if(fc)fc.classList.remove('show');}}
  }catch(e){
    if(!_frameErrLogged){ console.error('[frame] recovered from error in scene "'+scene+'":', e); _frameErrLogged=true; }
  }
  requestAnimationFrame(frame);   // ALWAYS reschedule — a transient throw must never freeze the canvas
}

/* ---------------- OPENING STORY ---------------- */
const STORY=[
  {seal:'I', ch:'Chapter One', kr:'A Child of the Sea', en:'Jeju · before the city',
   txt:'Born in a stone house above the shore — you knew your grandmother\'s <b>sumbisori</b> before you could swim. The sea was your first lullaby.'},
  {seal:'II', ch:'Chapter Two', kr:'The Daughter Who Left', en:'Seoul · eighteen years old',
   txt:'At eighteen, the ferry and the train carried you to <b>Seoul</b>. Bright offices, crowded carriages, a city that never smelled of salt.'},
  {seal:'III', ch:'Chapter Three', kr:'A Call from Home', en:'Winter · the news',
   txt:'One winter morning, the call came. Your grandmother had grown old — too old to dive — and her <b>mul-ot</b> still hung by the door, stiff with salt.'},
  {seal:'IV', ch:'Chapter Four', kr:'The Diver Returns', en:'Home · the cold green water',
   txt:'So you came home, to the cold green water and the women who knew her whistle. You take her place beside her now — the sea still knows your name.'},
];
let storyIdx=0;
function fitStoryCard(){
  const card=$('storyCard'); const stage=document.getElementById('stage');
  if(!card||!stage||$('pStory').classList.contains('hidden')) return;
  card.style.transform='';
  const avail=stage.clientHeight-14;
  const h=card.offsetHeight;
  const s=Math.min(1, avail/h);
  card.style.transformOrigin='center center';
  card.style.transform = s<1 ? 'scale('+s.toFixed(3)+')' : '';
}
addEventListener('resize', fitStoryCard);
function buildStoryDots(){
  const d=$('storyDots'); d.innerHTML='';
  STORY.forEach((_,i)=>{ const el=document.createElement('i'); if(i===storyIdx)el.className='on'; d.appendChild(el); });
}
function showStory(){
  const s=STORY[storyIdx];
  $('storySeal').textContent=s.seal;
  $('storyCh').textContent=s.ch;
  $('storyKr').textContent=s.kr;
  $('storyEn').textContent=s.en;
  const t=$('storyTxt'); t.innerHTML=s.txt;
  t.classList.add('enter');
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.remove('enter')));
  for(let i=0;i<STORY.length;i++){ const sc=$('scn'+i); if(sc) sc.classList.toggle('on', i===storyIdx); }
  requestAnimationFrame(fitStoryCard);
  $('storyNext').textContent = storyIdx>=STORY.length-1 ? 'Begin' : 'Next';
  $('storySkip').style.visibility = storyIdx>=STORY.length-1 ? 'hidden' : 'visible';
  buildStoryDots();
  tone(360+storyIdx*40,.18,'sine',.04);
}
function endStory(){
  $('pStory').classList.add('hidden');
  $('pTitle').classList.remove('hidden');
}
$('storyNext').onclick=()=>{
  if(storyIdx>=STORY.length-1){ endStory(); return; }
  storyIdx++; showStory();
};
$('storySkip').onclick=endStory;
showStory();

$('startBtn').onclick=()=>{ $('pTitle').classList.add('hidden'); scene='village';
  rollWeather(true);
  $('clkDate').textContent=SEASONS[0]+' · Day 1'; };

function restartGame(){
  G.day=1; G.money=0; G.time=6*60; G.season=0; G.catch={}; G.catchQ={}; G.trash={}; G.renown=0; G.beachHealth=60; G.eco=0; G.energy=100; G.factsSeen={}; G.cultureLog={}; G.cultureMem=0; G.cultureKeeper=false; G.dives=0; G.beachRuns=0; G.soldWon=0; G.netMendedDay=0; G.talkedToday={}; G.songToday=false; G.pettedToday={}; G.caveToday=false; G.meal=null; G.preparedMeal=null; tickClock._late=false; tickClock._curfew=false; tickClock._forced=false; G.weather='sunny';
  G.netIdx=0; G.toolIdx=0; G.maskIdx=0; G.tewakIdx=0; G.bagIdx=0; G.cutIdx=0; G.suit='traditional'; G.owned={traditional:true, modern:false};
  G.shoreCleaned=0; G.shoreMilestone=0;
  NPCS.forEach(n=>{G.friendship[n.id]=0; n.x=n.ax; n.y=n.ay; n.tx=n.ax; n.ty=n.ay; n.talking=false; n.moving=false; n.atHome=false; n.wait=Math.random()*2;});
  PETS.forEach(p=>{ p.x=p.ax; p.y=p.ay; p.tx=p.ax; p.ty=p.ay; p.moving=false; p.petJoy=0; G.friendship[p.id]=0; p.wait=0.5+Math.random()*2.5; });
  P.x=240; P.y=330; P.face=1; P.sitting=false;
  ['pSleep','pSell','pDive','pDiveStart','pBeach','pStore','pCook','pChange','pStatue','pBulteok','pStory'].forEach(id=>{const e=$(id);if(e)e.classList.add('hidden');});
  $('dialogue').classList.remove('show');
  $('diveHud').classList.remove('show'); $('surfBtn').classList.remove('show');
  { const e=$('beachHud'); if(e)e.classList.remove('show'); } { const e=$('leaveBeachBtn'); if(e)e.classList.remove('show'); }
  $('prompt').classList.remove('show'); updateMealBadge(); updateEnergyHud();
  $('moneyV').textContent='0';
  $('clkTime').textContent='6:00'; $('clkDate').textContent=SEASONS[0]+' · Day 1'; updateWeatherHud();
  $('pTitle').classList.remove('hidden'); scene='title';
}
$('restartBtn').onclick=restartGame;
