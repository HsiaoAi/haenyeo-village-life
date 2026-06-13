/* ============================================================
   HAENYEO WEATHER AMBIENCE — generative ocean + weather layers
   A subtle, looping soundscape generated live with Web Audio.
   Always-on ocean swell; rain hiss and wind gusts fade in with the
   day's weather. No audio files — pure synthesis. Muffles indoors.
   Public API: window.HaenyeoWeather.{unlock, setWeather, setScene}.
   ============================================================ */
(function(){
  const W = {
    ctx:null, master:null, noise:null, started:false,
    weather:'sunny', scene:'village', vol:0.5,
    layers:{},   // {wave:{gain,target}, rain:{...}, wind:{...}}
  };

  function makeNoise(ctx){
    // brown-ish noise: integrate white noise for a softer, low-heavy texture
    const len = ctx.sampleRate*4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last=0;
    for(let i=0;i<len;i++){
      const white = Math.random()*2-1;
      last = (last + 0.02*white)/1.02;
      d[i] = last*3.2;
    }
    return buf;
  }
  function noiseSrc(){
    const s = W.ctx.createBufferSource();
    s.buffer = W.noise; s.loop = true; s.start();
    return s;
  }

  // one breaking wave: swells in, crests bright, then washes out
  function spawnWave(intensity){
    if(!W.ctx || !W.layers.wave) return;
    const ctx = W.ctx, t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = W.noise; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';
    lp.frequency.setValueAtTime(260, t);
    lp.frequency.linearRampToValueAtTime(1500, t+1.5);   // brightens as it breaks
    lp.frequency.linearRampToValueAtTime(340, t+4.4);    // dulls as it recedes
    const g = ctx.createGain(); g.gain.value = 0;
    const peak = 0.55*intensity;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t+1.6);         // swell in
    g.gain.linearRampToValueAtTime(peak*0.8, t+2.2);     // crest / break
    g.gain.exponentialRampToValueAtTime(0.0001, t+4.6);  // backwash
    src.connect(lp); lp.connect(g); g.connect(W.layers.wave.out);
    src.start(t); src.stop(t+4.8);
  }
  function scheduleWaves(){
    if(!W.ctx) return;
    const w = W.weather, big = (w==='wind');
    const intensity = big ? 1.0+Math.random()*0.3
                     : (w==='rain' ? 0.8+Math.random()*0.3 : 0.6+Math.random()*0.35);
    spawnWave(intensity);
    const gap = (big?1800:2900) + Math.random()*(big?1700:2400);  // overlapping swells
    W._waveTimer = setTimeout(scheduleWaves, gap);
  }

  function build(){
    const ctx = W.ctx;
    W.master = ctx.createGain();
    W.master.gain.value = 0;                 // fade up after start
    W.master.connect(ctx.destination);
    W.noise = makeNoise(ctx);

    // ---- OCEAN WAVES: faint sea bed + discrete breaking waves scheduled live ----
    {
      const out = ctx.createGain(); out.gain.value=0.0;
      out.connect(W.master);
      // a quiet constant wash under the individual breakers
      const bedSrc = noiseSrc();
      const bedLp = ctx.createBiquadFilter(); bedLp.type='lowpass'; bedLp.frequency.value=360; bedLp.Q.value=0.6;
      const bed = ctx.createGain(); bed.gain.value=0.12;
      bedSrc.connect(bedLp); bedLp.connect(bed); bed.connect(out);
      W.layers.wave = { out, target:0.85, level:0 };
      scheduleWaves();
    }
  }

  // wave intensity drifts subtly with the weather, but waves are the only sound
  function applyMix(){
    if(W.layers.wave) W.layers.wave.target = 0.85;
  }

  // smooth ramp loop toward targets + scene-based master level
  function ramp(){
    if(!W.ctx){ return; }
    const now = W.ctx.currentTime;
    for(const k in W.layers){
      const L = W.layers[k];
      L.level += (L.target - L.level)*0.05;
      L.out.gain.setTargetAtTime(L.level, now, 0.2);
    }
    // muffle indoors / during menus
    const indoor = (W.scene==='home'||W.scene==='museum'||W.scene==='panel'||W.scene==='shop');
    const dive   = (W.scene==='dive');
    let mv = W.vol;
    if(indoor) mv = W.vol*0.32;
    else if(dive) mv = 0;                   // underwater: the surface waves fall silent
    W.master.gain.setTargetAtTime(W.started?mv:0, now, 0.4);
    setTimeout(ramp, 120);
  }

  window.HaenyeoWeather = {
    // call on a user gesture so the audio context can start
    unlock(){
      if(!W.ctx){
        const C = window.AudioContext||window.webkitAudioContext;
        if(!C) return;
        W.ctx = new C();
        build(); applyMix(); ramp();
      }
      if(W.ctx.state==='suspended') W.ctx.resume();
      W.started = true;
    },
    setWeather(w){ if(w){ W.weather=w; if(W.ctx) applyMix(); } },
    setScene(s){ if(s) W.scene=s; },
    setVolume(v){ W.vol = Math.max(0,Math.min(1,v)); },
    get ready(){ return !!W.ctx; },
  };
})();
