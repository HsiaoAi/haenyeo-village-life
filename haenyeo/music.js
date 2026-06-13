/* ============================================================
   HAENYEO MUSIC — Village Radio
   A Spotify-style music player for the village. Browse a shelf of
   tracks and tap one to play. There is no copyrighted audio here —
   every track is generated live with the Web Audio API in a calm,
   pentatonic, island-village mood. Pure DOM overlay; mirrors the
   phone button on the opposite (left) corner.
   ============================================================ */
(function(){
  const stage = document.getElementById('stage');
  if(!stage) return;
  window.musicOpen = false;

  /* ---------------- track shelf ---------------- */
  // Each track is a generative recipe. scale/chords are semitone
  // offsets from rootMidi. prog lists chord roots (semitones).
  const TRACKS = [
    { id:'morning', kr:'Morning Dive', en:'Morning Dive', mood:'Bright · pentatonic',
      art:'linear-gradient(150deg,#7fd0d6,#3a8fa6 70%,#2a6f86)', glyph:'MD',
      rootMidi:62, minor:false, scale:[0,2,4,7,9], prog:[0,7,9,5], stepsPerChord:8,
      bpm:74, melDensity:.42, perc:false, padGain:.16, melGain:.16, bassGain:.12 },
    { id:'haenyeo', kr:'Song of the Sea Women', en:'Song of the Sea Women', mood:'Slow · contemplative',
      art:'linear-gradient(150deg,#5a86b8,#34527e 70%,#22324f)', glyph:'SS',
      rootMidi:57, minor:true, scale:[0,3,5,7,10], prog:[0,8,3,10], stepsPerChord:16,
      bpm:60, melDensity:.30, perc:false, padGain:.18, melGain:.15, bassGain:.13 },
    { id:'lane', kr:'Stone Lane Stroll', en:'Stone Lane Stroll', mood:'Lively · warm',
      art:'linear-gradient(150deg,#f4c75a,#e8894a 70%,#cf5734)', glyph:'SL',
      rootMidi:55, minor:false, scale:[0,2,4,7,9], prog:[0,5,7,5], stepsPerChord:8,
      bpm:102, melDensity:.5, perc:true, padGain:.12, melGain:.17, bassGain:.13 },
    { id:'deep', kr:'Deep Water', en:'Deep Water', mood:'Ambient · drone',
      art:'linear-gradient(150deg,#2f7d8a,#16414f 65%,#0a2731)', glyph:'DW',
      rootMidi:50, minor:true, scale:[0,3,5,7,10], prog:[0,-2], stepsPerChord:24,
      bpm:50, melDensity:.16, perc:false, padGain:.2, melGain:.13, bassGain:.14 },
    { id:'blossom', kr:'Tangerine Blossom', en:'Tangerine Blossom', mood:'Bright · gentle',
      art:'linear-gradient(150deg,#f7d264,#f0a85a 70%,#e08450)', glyph:'TB',
      rootMidi:60, minor:false, scale:[0,2,4,7,9], prog:[0,9,5,7], stepsPerChord:8,
      bpm:86, melDensity:.44, perc:false, padGain:.14, melGain:.16, bassGain:.12 },
    { id:'night', kr:'Counting Stars', en:'Counting Stars', mood:'Calm · night',
      art:'linear-gradient(150deg,#5663a0,#33396e 70%,#1d2247)', glyph:'CS',
      rootMidi:52, minor:true, scale:[0,3,5,7,10], prog:[0,5,8,7], stepsPerChord:12,
      bpm:56, melDensity:.28, perc:false, padGain:.17, melGain:.14, bassGain:.13 },
  ];
  const LS = { track:'haenyeo.music.track', vol:'haenyeo.music.vol', on:'haenyeo.music.on' };

  /* ---------------- styles ---------------- */
  const css = `
  #musicBtn{position:absolute;left:12px;bottom:16px;z-index:8;width:50px;height:50px;border:none;cursor:pointer;
    border-radius:15px;display:none;align-items:center;justify-content:center;pointer-events:auto;
    background:linear-gradient(180deg,#f3c659,#e0a836);color:#5a3d08;
    box-shadow:0 5px 0 #b8841f,0 9px 16px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.4);}
  #musicBtn:active{transform:translateY(3px);box-shadow:0 2px 0 #b8841f,0 4px 10px rgba(0,0,0,.4);}
  #musicBtn svg{width:26px;height:26px;}
  /* spinning ring when playing */
  #musicBtn .ring{position:absolute;inset:-4px;border-radius:19px;pointer-events:none;display:none;
    box-shadow:0 0 0 2px rgba(232,113,74,.55),0 0 14px rgba(232,113,74,.5);}
  #musicBtn.playing .ring{display:block;animation:muPulse 1.8s ease-in-out infinite;}
  @keyframes muPulse{0%,100%{opacity:.5}50%{opacity:1}}

  /* mini now-playing pill (sits above the button) */
  #musicPill{position:absolute;left:12px;bottom:74px;z-index:8;display:none;align-items:center;gap:9px;
    max-width:210px;padding:7px 12px 7px 8px;border-radius:99px;cursor:pointer;pointer-events:auto;
    background:linear-gradient(180deg,rgba(38,28,18,.96),rgba(28,20,12,.96));
    box-shadow:0 6px 16px rgba(0,0,0,.45),inset 0 0 0 1.4px rgba(255,236,200,.18);}
  #musicPill.show{display:flex;animation:muRise .2s ease;}
  @keyframes muRise{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
  #musicPill .pa{width:26px;height:26px;border-radius:7px;flex:none;display:flex;align-items:center;justify-content:center;
    font-family:'Gowun Batang',serif;font-weight:700;font-size:13px;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);}
  #musicPill .pt{min-width:0;display:flex;flex-direction:column;gap:1px;}
  #musicPill .pt .pn{font-family:'Gowun Batang',serif;font-weight:700;font-size:11.5px;color:#fbf7ec;line-height:1.1;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  #musicPill .pt .ps{font-family:'Space Mono',monospace;font-size:7.5px;letter-spacing:.12em;text-transform:uppercase;
    color:rgba(251,247,236,.6);line-height:1.1;}
  #musicPill .eq{display:flex;align-items:flex-end;gap:1.5px;height:13px;flex:none;margin-left:1px;}
  #musicPill .eq i{width:2.5px;background:var(--gold);border-radius:1px;height:30%;}
  #musicPill.playing .eq i{animation:muEq .9s ease-in-out infinite;}
  #musicPill .eq i:nth-child(2){animation-delay:.18s}#musicPill .eq i:nth-child(3){animation-delay:.36s}#musicPill .eq i:nth-child(4){animation-delay:.54s}
  @keyframes muEq{0%,100%{height:25%}50%{height:100%}}
  #musicPill .pp{width:30px;height:30px;flex:none;border:none;border-radius:50%;cursor:pointer;margin-left:2px;
    display:flex;align-items:center;justify-content:center;color:#5a3d08;
    background:linear-gradient(180deg,#f3c659,#e0a836);box-shadow:0 2px 0 #b8841f;}
  #musicPill .pp:active{transform:translateY(2px);box-shadow:none;}
  #musicPill .pp svg{width:15px;height:15px;}

  /* overlay */
  #musicOv{position:absolute;inset:0;z-index:21;display:none;align-items:center;justify-content:center;
    background:radial-gradient(120% 90% at 50% 10%,rgba(10,40,48,.55),rgba(3,12,16,.82));backdrop-filter:blur(3px);
    pointer-events:auto;}
  #musicOv.show{display:flex;animation:muFade .18s ease;}
  @keyframes muFade{from{opacity:0}to{opacity:1}}
  .mu-body{position:relative;width:84%;max-width:330px;height:90%;max-height:580px;border-radius:26px;overflow:hidden;
    display:flex;flex-direction:column;background:linear-gradient(180deg,#1b2a30,#0e1a1f);
    box-shadow:0 30px 64px rgba(0,0,0,.62),inset 0 0 0 1.5px rgba(255,236,200,.14);
    animation:muBodyRise .26s cubic-bezier(.2,.85,.25,1);}
  @keyframes muBodyRise{from{transform:translateY(26px) scale(.96);opacity:.4}to{transform:none;opacity:1}}

  .mu-head{flex:none;display:flex;align-items:center;gap:11px;padding:18px 18px 12px;color:#fbf7ec;}
  .mu-head .ht{flex:1;min-width:0;}
  .mu-head .ht .kr{font-family:'Gowun Batang',serif;font-weight:700;font-size:19px;line-height:1.1;}
  .mu-head .ht .en{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.22em;text-transform:uppercase;
    color:rgba(251,247,236,.6);margin-top:4px;}
  .mu-x{width:30px;height:30px;flex:none;border:none;border-radius:50%;cursor:pointer;color:#fbf7ec;font-size:16px;line-height:1;
    background:rgba(255,240,210,.12);box-shadow:inset 0 0 0 1.4px rgba(255,236,200,.28);}
  .mu-x:active{transform:translateY(1px);background:rgba(255,240,210,.24);}

  .mu-list{flex:1 1 0;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:4px 10px 12px;}
  .mu-list::-webkit-scrollbar{width:0;}
  .mu-row{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:13px;cursor:pointer;transition:background .12s;}
  .mu-row:hover{background:rgba(255,236,200,.06);}
  .mu-row.on{background:linear-gradient(180deg,rgba(243,198,89,.16),rgba(232,113,74,.1));box-shadow:inset 0 0 0 1.4px rgba(243,198,89,.4);}
  .mu-art{width:46px;height:46px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;position:relative;
    font-family:'Gowun Batang',serif;font-weight:700;font-size:21px;color:rgba(255,255,255,.92);
    box-shadow:0 4px 10px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.14);}
  .mu-art span{text-shadow:0 1px 4px rgba(0,0,0,.4);}
  .mu-ti{flex:1;min-width:0;}
  .mu-ti .tn{font-family:'Gowun Batang',serif;font-weight:700;font-size:14.5px;color:#fbf7ec;line-height:1.15;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .mu-ti .te{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.04em;color:rgba(251,247,236,.55);margin-top:3px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .mu-ti .tm{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-top:4px;}
  .mu-rowico{width:30px;height:30px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fbf7ec;
    background:rgba(255,236,200,.1);}
  .mu-row.on .mu-rowico{background:linear-gradient(180deg,#f3c659,#e0a836);color:#5a3d08;}
  .mu-rowico svg{width:14px;height:14px;}
  /* live equalizer shown on the playing row */
  .mu-eqr{display:none;align-items:flex-end;gap:2px;height:15px;}
  .mu-row.on.playing .mu-rowico{display:none;}
  .mu-row.on.playing .mu-eqr{display:flex;}
  .mu-eqr i{width:3px;background:var(--gold);border-radius:1px;height:30%;animation:muEq .9s ease-in-out infinite;}
  .mu-eqr i:nth-child(2){animation-delay:.2s}.mu-eqr i:nth-child(3){animation-delay:.4s}

  /* now-playing bar */
  .mu-now{flex:none;padding:14px 16px 18px;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.28));
    box-shadow:0 -1px 0 rgba(255,236,200,.12);}
  .mu-npline{display:flex;align-items:center;gap:13px;}
  .mu-disc{width:52px;height:52px;border-radius:50%;flex:none;position:relative;display:flex;align-items:center;justify-content:center;
    font-family:'Gowun Batang',serif;font-weight:700;font-size:20px;color:rgba(255,255,255,.92);
    box-shadow:0 4px 12px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.14);}
  .mu-disc::after{content:"";position:absolute;width:13px;height:13px;border-radius:50%;background:#0e1a1f;
    box-shadow:inset 0 0 0 2px rgba(255,255,255,.22);}
  .mu-disc.spin{animation:muSpin 6s linear infinite;}
  @keyframes muSpin{to{transform:rotate(360deg)}}
  .mu-npi{flex:1;min-width:0;}
  .mu-npi .nn{font-family:'Gowun Batang',serif;font-weight:700;font-size:15px;color:#fbf7ec;line-height:1.15;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .mu-npi .ne{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.06em;color:rgba(251,247,236,.55);margin-top:3px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

  .mu-prog{height:5px;border-radius:99px;background:rgba(255,255,255,.13);margin:14px 0 4px;overflow:hidden;}
  .mu-prog .pf{height:100%;border-radius:99px;width:0;background:linear-gradient(90deg,#e8894a,#f3c659);transition:width .12s linear;}

  .mu-ctrls{display:flex;align-items:center;justify-content:center;gap:20px;margin-top:8px;}
  .mu-cbtn{border:none;background:none;cursor:pointer;color:#fbf7ec;display:flex;align-items:center;justify-content:center;padding:6px;}
  .mu-cbtn svg{width:24px;height:24px;}
  .mu-cbtn.sm{opacity:.78;}
  .mu-cbtn.sm svg{width:20px;height:20px;}
  .mu-cbtn.sm.act{opacity:1;color:var(--gold);}
  .mu-cbtn:active{transform:scale(.9);}
  .mu-play{width:54px;height:54px;border-radius:50%;background:linear-gradient(180deg,#f3c659,#e0a836);color:#5a3d08;
    box-shadow:0 5px 0 #b8841f,0 8px 16px rgba(0,0,0,.4);}
  .mu-play:active{transform:translateY(3px);box-shadow:0 2px 0 #b8841f;}
  .mu-play svg{width:24px;height:24px;}

  .mu-vol{display:flex;align-items:center;gap:9px;margin-top:14px;}
  .mu-vol svg{width:16px;height:16px;flex:none;color:rgba(251,247,236,.7);}
  .mu-vol input{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:99px;background:rgba(255,255,255,.16);outline:none;}
  .mu-vol input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:15px;height:15px;border-radius:50%;
    background:var(--gold);cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.4);}
  .mu-vol input::-moz-range-thumb{width:15px;height:15px;border:none;border-radius:50%;background:var(--gold);cursor:pointer;}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------------- icons ---------------- */
  const SV = {
    note:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.6" fill="currentColor" stroke="none"/><circle cx="16.5" cy="16" r="2.6" fill="currentColor" stroke="none"/></svg>`,
    play:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>`,
    pause:`<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="5.5" width="3.4" height="13" rx="1"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1"/></svg>`,
    prev:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5h2.4v13H7zM19 5.5v13l-9-6.5z"/></svg>`,
    next:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.6 5.5H17v13h-2.4zM5 5.5v13l9-6.5z"/></svg>`,
    shuffle:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h3.5c1.6 0 2.6.9 3.6 2.4M21 6h-3.6c-2.5 0-3.6 2.2-4.8 4.2C11.4 12.2 10.3 14 7.8 14H3"/><path d="M3 18h4.8c1.4 0 2.4-.7 3.2-1.8M21 18h-3.6c-1.6 0-2.6-.9-3.4-2"/><path d="M18.5 3.5 21 6l-2.5 2.5M18.5 15.5 21 18l-2.5 2.5"/></svg>`,
    repeat:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.5 20 5.5l-3 3"/><path d="M4 11.5V10a4.5 4.5 0 0 1 4.5-4.5H20"/><path d="M7 21.5 4 18.5l3-3"/><path d="M20 12.5V14a4.5 4.5 0 0 1-4.5 4.5H4"/></svg>`,
    vol:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>`,
  };

  /* ================= AUDIO ENGINE ================= */
  const mtof = m => 440 * Math.pow(2,(m-69)/12);
  const majT = r => [r, r+4, r+7];
  const minT = r => [r, r+3, r+7];

  const Eng = {
    ctx:null, master:null, dry:null, wet:null, noise:null,
    playing:false, track:null, timer:null,
    nextT:0, step:0, phraseSteps:0, melIdx:5, vol:0.7,

    _buildGraph(){
      this.master = this.ctx.createGain(); this.master.gain.value = this.vol*0.9;
      this.master.connect(this.ctx.destination);
      // simple feedback-delay reverb
      const delay = this.ctx.createDelay(0.8); delay.delayTime.value = 0.27;
      const fb = this.ctx.createGain(); fb.gain.value = 0.34;
      const damp = this.ctx.createBiquadFilter(); damp.type='lowpass'; damp.frequency.value=2600;
      delay.connect(damp); damp.connect(fb); fb.connect(delay);
      const wetOut = this.ctx.createGain(); wetOut.gain.value = 0.55;
      delay.connect(wetOut); wetOut.connect(this.master);
      this.dry = this.ctx.createGain(); this.dry.gain.value = 1; this.dry.connect(this.master);
      this.wet = this.ctx.createGain(); this.wet.gain.value = 0.28; this.wet.connect(delay);
    },

    // Cut the previous track's in-flight notes instantly: quick fade on the
    // old master to avoid an audible click, then disconnect and rebuild the
    // graph so the new track plays through a fresh master.
    _killAudio(){
      if(!this.ctx) return;
      const now = this.ctx.currentTime;
      const oldDry = this.dry, oldWet = this.wet, oldMaster = this.master;
      if(oldMaster){
        try{
          oldMaster.gain.cancelScheduledValues(now);
          oldMaster.gain.setValueAtTime(oldMaster.gain.value, now);
          oldMaster.gain.linearRampToValueAtTime(0, now + 0.04);
        }catch(e){}
      }
      setTimeout(()=>{
        try{ if(oldDry)    oldDry.disconnect();    }catch(e){}
        try{ if(oldWet)    oldWet.disconnect();    }catch(e){}
        try{ if(oldMaster) oldMaster.disconnect(); }catch(e){}
      }, 220);
      this._buildGraph();
    },

    ensure(){
      if(this.ctx) return;
      const C = window.AudioContext||window.webkitAudioContext;
      this.ctx = new C();
      this._buildGraph();
      // noise buffer for percussion
      const n = this.ctx.createBuffer(1, this.ctx.sampleRate*0.5, this.ctx.sampleRate);
      const d = n.getChannelData(0);
      for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
      this.noise = n;
    },

    setVol(v){ this.vol = v; if(this.master) this.master.gain.setTargetAtTime(v*0.9, this.ctx.currentTime, 0.05); },

    out(node){ node.connect(this.dry); node.connect(this.wet); },

    pad(midis, t, dur, g){
      const peak = g/Math.max(1,midis.length);
      midis.forEach(m=>{
        const o = this.ctx.createOscillator(); o.type='triangle'; o.frequency.value = mtof(m);
        const o2= this.ctx.createOscillator(); o2.type='sine'; o2.frequency.value = mtof(m)*1.006;
        const lp= this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 1700;
        const gg= this.ctx.createGain(); gg.gain.value = 0;
        o.connect(gg); o2.connect(gg); gg.connect(lp); this.out(lp);
        const a=0.55, rel=1.4;
        gg.gain.setValueAtTime(0,t);
        gg.gain.linearRampToValueAtTime(peak, t+a);
        gg.gain.setValueAtTime(peak, t+dur);
        gg.gain.exponentialRampToValueAtTime(0.0001, t+dur+rel);
        o.start(t); o2.start(t); o.stop(t+dur+rel+0.05); o2.stop(t+dur+rel+0.05);
      });
    },
    pluck(m, t, g){
      const o = this.ctx.createOscillator(); o.type='triangle'; o.frequency.value = mtof(m);
      const o2= this.ctx.createOscillator(); o2.type='sine'; o2.frequency.value = mtof(m+12);
      const lp= this.ctx.createBiquadFilter(); lp.type='lowpass';
      lp.frequency.setValueAtTime(3400,t); lp.frequency.exponentialRampToValueAtTime(900,t+0.7);
      const gg= this.ctx.createGain(); gg.gain.value=0;
      const g2= this.ctx.createGain(); g2.gain.value=0.4; o2.connect(g2); g2.connect(gg);
      o.connect(gg); gg.connect(lp); this.out(lp);
      gg.gain.setValueAtTime(0,t);
      gg.gain.linearRampToValueAtTime(g, t+0.012);
      gg.gain.exponentialRampToValueAtTime(0.0001, t+0.95);
      o.start(t); o2.start(t); o.stop(t+1); o2.stop(t+1);
    },
    bass(m, t, dur, g){
      const o = this.ctx.createOscillator(); o.type='sine'; o.frequency.value = mtof(m);
      const gg= this.ctx.createGain(); gg.gain.value=0; o.connect(gg); gg.connect(this.dry);
      gg.gain.setValueAtTime(0,t);
      gg.gain.linearRampToValueAtTime(g, t+0.04);
      gg.gain.setValueAtTime(g, t+dur*0.7);
      gg.gain.exponentialRampToValueAtTime(0.0001, t+dur);
      o.start(t); o.stop(t+dur+0.05);
    },
    kick(t){
      const o=this.ctx.createOscillator(); o.type='sine';
      o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(45,t+0.13);
      const gg=this.ctx.createGain(); gg.gain.setValueAtTime(0.001,t);
      gg.gain.linearRampToValueAtTime(0.22,t+0.005); gg.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
      o.connect(gg); gg.connect(this.dry); o.start(t); o.stop(t+0.2);
    },
    hat(t){
      const s=this.ctx.createBufferSource(); s.buffer=this.noise;
      const hp=this.ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=7000;
      const gg=this.ctx.createGain(); gg.gain.setValueAtTime(0.06,t); gg.gain.exponentialRampToValueAtTime(0.0001,t+0.05);
      s.connect(hp); hp.connect(gg); this.out(gg); s.start(t); s.stop(t+0.06);
    },

    scheduleStep(step, t){
      const T = this.track;
      const ps = this.phraseSteps;
      const s = ((step % ps) + ps) % ps;
      const ci = Math.floor(s / T.stepsPerChord);
      const sc = s % T.stepsPerChord;
      const stepDur = 30/T.bpm;          // 8th note
      const chordRoot = T.prog[ci];
      // pad + bass at chord start
      if(sc===0){
        const triad = (T.minor?minT:majT)(chordRoot).map(x=> T.rootMidi + x);
        triad.push(T.rootMidi + chordRoot + 12);
        this.pad(triad, t, stepDur*T.stepsPerChord*0.94, T.padGain);
        this.bass(T.rootMidi - 12 + chordRoot, t, stepDur*Math.min(8,T.stepsPerChord)*0.92, T.bassGain);
      }
      // melody — random-walk over two octaves of the scale (in key, not transposed)
      if(Math.random() < T.melDensity){
        const len = T.scale.length;
        this.melIdx += [-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)];
        if(this.melIdx < 0) this.melIdx = 1;
        if(this.melIdx > len*2-1) this.melIdx = len*2-2;
        const oct = Math.floor(this.melIdx/len);
        const deg = T.scale[this.melIdx % len];
        const midi = T.rootMidi + 12 + deg + oct*12;
        this.pluck(midi, t, T.melGain);
      }
      // percussion
      if(T.perc){
        if(step%4===0) this.kick(t);
        if(step%2===1) this.hat(t);
      }
    },

    loop(){
      if(!this.playing) return;
      const ahead = 0.16;
      while(this.nextT < this.ctx.currentTime + ahead){
        this.scheduleStep(this.step, this.nextT);
        this.nextT += 30/this.track.bpm;
        this.step++;
      }
      this.timer = setTimeout(()=>this.loop(), 26);
    },

    play(track){
      this.ensure();
      if(this.ctx.state==='suspended') this.ctx.resume();
      clearTimeout(this.timer);
      // kill any in-flight audio from the previous track before starting
      this._killAudio();
      this.track = track;
      this.phraseSteps = track.prog.length * track.stepsPerChord;
      this.step = 0; this.melIdx = 5;
      this.nextT = this.ctx.currentTime + 0.08;
      this.playing = true;
      this.loop();
    },
    resumeSame(){
      if(!this.track) return;
      this.ensure();
      if(this.ctx.state==='suspended') this.ctx.resume();
      this.nextT = this.ctx.currentTime + 0.08;
      this.playing = true;
      clearTimeout(this.timer);
      this.loop();
    },
    stop(){ this.playing = false; clearTimeout(this.timer); this._killAudio(); },
    progress(){ return this.phraseSteps ? (((this.step % this.phraseSteps)+this.phraseSteps)%this.phraseSteps)/this.phraseSteps : 0; },
  };

  /* ---------------- DOM ---------------- */
  let curIdx = TRACKS.findIndex(t=>t.id===localStorage.getItem(LS.track));
  if(curIdx<0) curIdx = 0;
  const savedVol = parseFloat(localStorage.getItem(LS.vol));
  Eng.vol = isNaN(savedVol) ? 0.7 : savedVol;
  let shuffle=false, repeatOne=false, started=false;

  // button
  const btn = document.createElement('button');
  btn.id='musicBtn'; btn.title='Music';
  btn.innerHTML = `<span class="ring"></span>${SV.note}`;
  stage.appendChild(btn);

  // mini pill
  const pill = document.createElement('div');
  pill.id='musicPill';
  pill.innerHTML = `<span class="pa"></span><span class="pt"><span class="pn"></span><span class="ps"></span></span><span class="eq"><i></i><i></i><i></i><i></i></span><button class="pp" title="Play / pause"></button>`;
  stage.appendChild(pill);

  // overlay
  const ov = document.createElement('div');
  ov.id='musicOv';
  ov.innerHTML = `
    <div class="mu-body">
      <div class="mu-head">
        <div class="ht"><div class="kr">Village Radio</div><div class="en">Live · generative</div></div>
        <button class="mu-x" title="Close">✕</button>
      </div>
      <div class="mu-list"></div>
      <div class="mu-now">
        <div class="mu-npline">
          <div class="mu-disc"><span></span></div>
          <div class="mu-npi"><div class="nn"></div><div class="ne"></div></div>
        </div>
        <div class="mu-prog"><div class="pf"></div></div>
        <div class="mu-ctrls">
          <button class="mu-cbtn sm" data-a="shuffle" title="Shuffle">${SV.shuffle}</button>
          <button class="mu-cbtn" data-a="prev" title="Previous">${SV.prev}</button>
          <button class="mu-cbtn mu-play" data-a="play" title="Play / pause">${SV.play}</button>
          <button class="mu-cbtn" data-a="next" title="Next">${SV.next}</button>
          <button class="mu-cbtn sm" data-a="repeat" title="Repeat one">${SV.repeat}</button>
        </div>
        <div class="mu-vol">${SV.vol}<input type="range" min="0" max="1" step="0.01"></div>
      </div>
    </div>`;
  stage.appendChild(ov);

  const $ = s => ov.querySelector(s);
  const listEl = $('.mu-list');
  const discEl = $('.mu-disc');
  const volEl  = $('.mu-vol input');
  volEl.value = Eng.vol;

  // build track list
  TRACKS.forEach((t,i)=>{
    const row = document.createElement('div');
    row.className='mu-row'; row.dataset.i=i;
    row.innerHTML = `
      <div class="mu-art" style="background:${t.art}"><span>${t.glyph}</span></div>
      <div class="mu-ti"><div class="tn">${t.kr}</div><div class="te">${t.mood}</div></div>
      <div class="mu-rowico">${SV.play}</div>
      <div class="mu-eqr"><i></i><i></i><i></i></div>`;
    row.onclick = ()=> selectTrack(i, true);
    listEl.appendChild(row);
  });

  function fmtArt(t){ return t.art; }

  const subs=[];
  function notify(){ for(const f of subs){ try{ f(); }catch(e){} } }

  function refresh(){
    const t = TRACKS[curIdx];
    // rows
    listEl.querySelectorAll('.mu-row').forEach((r,i)=>{
      r.classList.toggle('on', i===curIdx);
      r.classList.toggle('playing', i===curIdx && Eng.playing);
    });
    // now-playing
    $('.mu-disc').style.background = t.art;
    $('.mu-disc span').textContent = t.glyph;
    $('.nn').textContent = t.kr;
    $('.ne').textContent = t.mood;
    discEl.classList.toggle('spin', Eng.playing);
    $('.mu-play').innerHTML = Eng.playing ? SV.pause : SV.play;
    ov.querySelector('[data-a="shuffle"]').classList.toggle('act', shuffle);
    ov.querySelector('[data-a="repeat"]').classList.toggle('act', repeatOne);
    // button + pill
    btn.classList.toggle('playing', Eng.playing);
    pill.classList.toggle('playing', Eng.playing);
    pill.querySelector('.pa').style.background = t.art;
    pill.querySelector('.pa').textContent = t.glyph;
    pill.querySelector('.pn').textContent = t.kr;
    pill.querySelector('.ps').textContent = Eng.playing ? 'Now playing' : 'Paused';
    pill.querySelector('.pp').innerHTML = Eng.playing ? SV.pause : SV.play;
    notify();
  }

  function selectTrack(i, autoplay){
    curIdx = i;
    localStorage.setItem(LS.track, TRACKS[i].id);
    if(autoplay){ Eng.play(TRACKS[i]); started=true; localStorage.setItem(LS.on,'1'); }
    refresh();
  }
  function togglePlay(){
    if(Eng.playing){ Eng.stop(); localStorage.setItem(LS.on,'0'); }
    else { if(Eng.track) Eng.resumeSame(); else Eng.play(TRACKS[curIdx]); started=true; localStorage.setItem(LS.on,'1'); }
    refresh();
  }
  function step(dir){
    let i;
    if(shuffle){ do { i = Math.floor(Math.random()*TRACKS.length); } while(TRACKS.length>1 && i===curIdx); }
    else { i = (curIdx + dir + TRACKS.length) % TRACKS.length; }
    selectTrack(i, true);
  }

  /* ---------------- wiring ---------------- */
  btn.onclick = ()=>{ Eng.ensure(); window.musicOpen=true; ov.classList.add('show'); refresh(); };
  pill.onclick = ()=>{ Eng.ensure(); window.musicOpen=true; ov.classList.add('show'); refresh(); };
  pill.querySelector('.pp').onclick = (e)=>{ e.stopPropagation(); togglePlay(); };
  $('.mu-x').onclick = ()=>{ window.musicOpen=false; ov.classList.remove('show'); };
  ov.addEventListener('pointerdown', e=>{ if(e.target===ov){ window.musicOpen=false; ov.classList.remove('show'); } });
  ov.querySelector('[data-a="play"]').onclick = togglePlay;
  ov.querySelector('[data-a="prev"]').onclick = ()=> step(-1);
  ov.querySelector('[data-a="next"]').onclick = ()=> step(1);
  ov.querySelector('[data-a="shuffle"]').onclick = ()=>{ shuffle=!shuffle; refresh(); };
  ov.querySelector('[data-a="repeat"]').onclick = ()=>{ repeatOne=!repeatOne; refresh(); };
  volEl.addEventListener('input', ()=>{ Eng.setVol(parseFloat(volEl.value)); localStorage.setItem(LS.vol, volEl.value); });
  addEventListener('keydown', e=>{ if(e.key==='Escape' && window.musicOpen){ window.musicOpen=false; ov.classList.remove('show'); } });

  // auto-advance the looping phrase forever is built-in; repeatOne just
  // keeps the same track (default). When NOT repeatOne and shuffle off,
  // the same generative track keeps looping too — that's the calm intent.

  /* ---------------- resume after refresh ----------------
     Disabled by request: music must never start on its own at the
     beginning. It only plays when the player chooses it (gramophone
     or the phone's Radio app). We still remember the last track/volume. */
  localStorage.setItem(LS.on,'0');

  /* ---------------- progress + visibility loop ---------------- */
  const PLAY = ['village','home','shop','market','dive','beach'];
  const pf = $('.pf');
  function tick(){
    // progress bar
    pf.style.width = (Eng.progress()*100).toFixed(1)+'%';
    // the floating launcher button + sticky mini-pill are hidden by request —
    // music is reached via the home gramophone and the phone's Radio app instead.
    btn.style.display = 'none';
    pill.classList.remove('show');
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  refresh();

  /* ---------------- public API (gramophone, phone app, …) ---------------- */
  window.HaenyeoMusic = {
    tracks: TRACKS,
    open(){ Eng.ensure(); window.musicOpen=true; ov.classList.add('show'); refresh(); },
    // prime/unlock the audio context on a user gesture so later (non-gesture)
    // proximity triggers can actually make sound
    unlock(){ Eng.ensure(); if(Eng.ctx && Eng.ctx.state==='suspended') Eng.ctx.resume(); },
    close(){ window.musicOpen=false; ov.classList.remove('show'); },
    toggle(){ togglePlay(); },
    play(){ if(!Eng.playing) togglePlay(); },
    pause(){ if(Eng.playing) togglePlay(); },
    playIndex(i){ selectTrack(i, true); },
    next(){ step(1); },
    prev(){ step(-1); },
    get playing(){ return Eng.playing; },
    get current(){ return curIdx; },
    subscribe(fn){ if(typeof fn==='function'){ subs.push(fn); return ()=>{ const k=subs.indexOf(fn); if(k>=0) subs.splice(k,1); }; } return ()=>{}; },
  };
})();
