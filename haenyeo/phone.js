/* ============================================================
   HAENYEO PHONE — in-game smartphone
   A modal "phone" the diver carries: check market prices, village
   contacts, her dive log, the weather and how-to tips. Pure DOM
   overlay; reads live game state (G, SPECIES, NPCS…) from game.js.
   ============================================================ */
(function(){
  const stage = document.getElementById('stage');
  if(!stage) return;
  window.phoneOpen = false;

  /* ---------------- styles ---------------- */
  const css = `
  #phoneBtn{position:absolute;right:12px;bottom:16px;z-index:8;width:50px;height:50px;border:none;cursor:pointer;
    border-radius:15px;display:none;align-items:center;justify-content:center;pointer-events:auto;
    background:linear-gradient(180deg,#3a4654,#28313c);color:#e9f3f6;
    box-shadow:0 5px 0 #1b222a,0 9px 16px rgba(0,0,0,.4),inset 0 0 0 1.5px rgba(255,255,255,.12);}
  #phoneBtn:active{transform:translateY(3px);box-shadow:0 2px 0 #1b222a,0 4px 10px rgba(0,0,0,.4);}
  #phoneBtn .badge{position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;
    background:var(--coral);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;
    font-family:'Space Mono',monospace;box-shadow:0 1px 3px rgba(0,0,0,.4);}

  #phoneOv{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;
    background:radial-gradient(120% 90% at 50% 10%,rgba(10,40,48,.55),rgba(3,12,16,.8));backdrop-filter:blur(3px);
    pointer-events:auto;}
  #phoneOv.show{display:flex;animation:phFade .18s ease;}
  @keyframes phFade{from{opacity:0}to{opacity:1}}

  .ph-body{position:relative;width:80%;max-width:312px;height:90%;max-height:560px;border-radius:34px;
    background:linear-gradient(160deg,#3a4654,#222a33);padding:9px;
    box-shadow:0 30px 60px rgba(0,0,0,.6),inset 0 0 0 2px rgba(255,255,255,.08),0 0 0 2px rgba(0,0,0,.3);
    animation:phRise .26s cubic-bezier(.2,.85,.25,1);}
  @keyframes phRise{from{transform:translateY(26px) scale(.96);opacity:.4}to{transform:none;opacity:1}}
  .ph-screen{position:relative;width:100%;height:100%;border-radius:26px;overflow:hidden;display:flex;flex-direction:column;
    background:linear-gradient(180deg,#bfe6ef 0%,#a9d9e4 26%,#7fc0d0 100%);}

  /* status bar */
  .ph-stat{flex:none;height:26px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;
    font-family:'Space Mono',monospace;font-size:10px;font-weight:700;color:#21323a;letter-spacing:.04em;}
  .ph-stat .sig{display:flex;align-items:center;gap:5px;}
  .ph-sig i{display:inline-block;width:3px;background:#21323a;border-radius:1px;vertical-align:bottom;margin-right:1.5px;}
  .ph-batt{display:inline-block;width:18px;height:9px;border:1.4px solid #21323a;border-radius:2px;position:relative;}
  .ph-batt::after{content:"";position:absolute;right:-3.5px;top:2px;width:2px;height:3px;background:#21323a;border-radius:0 1px 1px 0;}
  .ph-batt i{position:absolute;inset:1.2px;width:72%;background:#2f9e6a;border-radius:1px;}

  /* home (app grid) */
  .ph-home{flex:1;position:relative;overflow:hidden;display:flex;flex-direction:column;}
  .ph-home::before{content:"";position:absolute;right:-26px;top:8px;width:74px;height:74px;border-radius:50%;
    background:radial-gradient(circle at 38% 36%,#fff0bd,#f4c352);box-shadow:0 0 26px rgba(244,195,82,.6);opacity:.9;}
  .ph-hello{flex:none;padding:14px 18px 4px;position:relative;z-index:1;}
  .ph-hello .h1{font-family:'Gowun Batang',serif;font-weight:700;font-size:17px;color:#15323d;line-height:1.15;}
  .ph-hello .h2{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#2d5560;margin-top:3px;}
  .ph-grid{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:8px 6px;align-content:start;
    padding:16px 16px;position:relative;z-index:1;}
  .ph-app{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;border:none;background:none;padding:0;}
  .ph-app .tile{width:50px;height:50px;border-radius:15px;display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 8px rgba(20,40,46,.3),inset 0 1px 0 rgba(255,255,255,.3);transition:transform .12s;}
  .ph-app:active .tile{transform:scale(.9);}
  .ph-app .tile svg{width:27px;height:27px;}
  .ph-app .lab{font-family:'Gowun Batang',serif;font-size:10px;font-weight:700;color:#16323c;line-height:1;text-align:center;white-space:nowrap;}
  .ph-app .lab small{display:block;font-family:'Space Mono',monospace;font-size:7px;letter-spacing:.06em;color:#3a5d66;margin-top:2px;text-transform:uppercase;font-weight:700;}

  /* app screen */
  .ph-app-scr{position:absolute;inset:0;display:none;flex-direction:column;background:var(--paper);}
  .ph-app-scr.show{display:flex;animation:phSlide .22s cubic-bezier(.2,.85,.25,1);}
  @keyframes phSlide{from{transform:translateX(22px);opacity:.3}to{transform:none;opacity:1}}
  .ph-appbar{flex:none;display:flex;align-items:center;gap:10px;padding:11px 14px;color:#fff;
    box-shadow:0 2px 8px rgba(0,0,0,.22);}
  .ph-appbar .back{width:28px;height:28px;border:none;border-radius:9px;cursor:pointer;color:#fff;font-size:16px;line-height:1;
    background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;}
  .ph-appbar .back:active{background:rgba(255,255,255,.34);}
  .ph-appbar .ttl{font-family:'Gowun Batang',serif;font-weight:700;font-size:15px;line-height:1.1;}
  .ph-appbar .ttl small{display:block;font-family:'Space Mono',monospace;font-size:8px;letter-spacing:.18em;opacity:.85;text-transform:uppercase;margin-top:2px;}
  .ph-content{flex:1 1 0;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:14px 15px 22px;color:var(--ink);}
  .ph-content::-webkit-scrollbar{width:0;}

  .ph-sec{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;
    color:var(--coral-d);font-weight:700;margin:4px 0 8px;}
  .ph-sec:not(:first-child){margin-top:18px;}
  .ph-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;
    border-bottom:1px dashed rgba(99,70,30,.26);}
  .ph-row .nm{display:flex;align-items:center;gap:9px;font-family:'Gowun Batang',serif;font-size:14px;color:var(--ink2);}
  .ph-row .nm small{font-family:'Space Mono',monospace;font-size:9px;color:var(--ink-soft);letter-spacing:.04em;}
  .ph-dot{width:14px;height:14px;border-radius:5px;flex:none;box-shadow:0 0 0 1px rgba(0,0,0,.14);}
  .ph-price{font-family:'Space Mono',monospace;font-weight:700;font-size:14px;color:#9a6a13;white-space:nowrap;}
  .ph-price small{font-size:9px;color:var(--ink-soft);font-weight:700;}
  .ph-note{font-size:12.5px;line-height:1.6;color:var(--ink-soft);margin-top:14px;}
  .ph-note b{color:var(--coral-d);}
  .ph-tag{display:inline-block;font-family:'Space Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.08em;
    padding:2px 6px;border-radius:99px;background:var(--gold);color:#5a3d08;margin-left:6px;vertical-align:middle;text-transform:uppercase;}

  /* contacts */
  .ph-card{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px dashed rgba(99,70,30,.26);cursor:pointer;}
  .ph-card:active{opacity:.6;}
  .ph-av{width:40px;height:40px;border-radius:50%;flex:none;overflow:hidden;background:#e8c9a0;
    box-shadow:inset 0 0 0 2px rgba(255,255,255,.5),0 2px 5px rgba(0,0,0,.2);}
  .ph-av svg{width:100%;height:100%;display:block;}
  .ph-ci{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}
  .ph-ci .cn{font-family:'Gowun Batang',serif;font-weight:700;font-size:14.5px;color:var(--ink2);line-height:1.1;}
  .ph-ci .cn small{font-family:'Space Mono',monospace;font-size:9px;color:var(--ink-soft);letter-spacing:.04em;font-weight:700;margin-left:4px;}
  .ph-ci .cr{font-size:11.5px;color:var(--ink-soft);margin-top:3px;line-height:1.3;}
  .ph-hearts{font-size:12px;letter-spacing:1px;color:var(--coral);margin-top:3px;}
  .ph-hearts .e{color:rgba(99,70,30,.28);}
  .ph-quote{font-family:'Gowun Batang',serif;font-style:italic;font-size:12.5px;color:var(--ink);line-height:1.55;
    margin:2px 0 6px 51px;padding:8px 12px;background:rgba(92,191,176,.16);border-radius:12px 12px 12px 3px;display:none;}
  .ph-quote.show{display:block;animation:phFade .2s ease;}

  /* weather hero */
  .ph-wx{border-radius:16px;padding:20px 18px;color:#fff;text-align:center;margin-bottom:8px;
    box-shadow:0 8px 18px rgba(0,0,0,.2);}
  .ph-wx .big{font-family:'Gowun Batang',serif;font-weight:700;font-size:23px;line-height:1.1;margin-top:6px;}
  .ph-wx .sub{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.9;margin-top:6px;}
  .ph-wx .ico{font-size:42px;line-height:1;}
  .ph-fc{display:flex;gap:7px;margin-top:6px;}
  .ph-fc .d{flex:1;text-align:center;background:#fff;border-radius:12px;padding:10px 4px;box-shadow:0 3px 7px rgba(0,0,0,.1);}
  .ph-fc .d .dn{font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:.08em;color:var(--ink-soft);font-weight:700;text-transform:uppercase;}
  .ph-fc .d .di{font-size:21px;margin:5px 0 3px;}
  .ph-fc .d .dl{font-size:10px;color:var(--ink2);font-weight:700;}

  .ph-tips li{font-size:13px;line-height:1.5;color:var(--ink);margin:0 0 11px 0;padding-left:24px;position:relative;list-style:none;}
  .ph-tips li b{color:var(--coral-d);}
  .ph-tips li .n{position:absolute;left:0;top:1px;width:17px;height:17px;border-radius:50%;background:var(--teal);color:#fff;
    font-family:'Space Mono',monospace;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;}

  /* workation app */
  .ph-wk-hero{border-radius:16px;padding:18px 16px;color:#fff;text-align:center;margin-bottom:6px;
    background:linear-gradient(160deg,#f2a65a,#e0653e);box-shadow:0 8px 18px rgba(0,0,0,.18);}
  .ph-wk-hero .t{font-family:'Gowun Batang',serif;font-weight:700;font-size:18px;line-height:1.18;}
  .ph-wk-hero .s{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;opacity:.92;margin-top:8px;}
  .ph-wk-hero .w{font-size:12px;margin-top:9px;opacity:.96;}
  .ph-wk-about p{font-size:13px;line-height:1.6;margin:0 0 8px;color:var(--ink);}
  .ph-wk-about b{color:var(--coral-d);}
  .ph-wk-link{font-family:'Space Mono',monospace;font-size:11px;color:#2f86a6;word-break:break-all;}
  .ph-wk-day{border-bottom:1px dashed rgba(99,70,30,.26);}
  .ph-wk-dayh{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 0;
    border:none;background:none;cursor:pointer;font-family:'Gowun Batang',serif;font-size:14.5px;font-weight:700;color:var(--ink2);text-align:left;}
  .ph-wk-dayh .dt{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.06em;color:var(--ink-soft);font-weight:700;margin-left:7px;}
  .ph-wk-dayh .chev{transition:transform .2s;color:var(--coral-d);font-size:17px;}
  .ph-wk-day.open .ph-wk-dayh .chev{transform:rotate(90deg);}
  .ph-wk-slots{display:none;padding:2px 0 10px;}
  .ph-wk-day.open .ph-wk-slots{display:block;animation:phFade .2s ease;}
  .ph-wk-slot{display:flex;gap:10px;padding:6px 0 6px 4px;}
  .ph-wk-slot .tm{flex:none;width:92px;font-family:'Space Mono',monospace;font-size:10.5px;font-weight:700;color:#9a6a13;line-height:1.5;}
  .ph-wk-slot .ac{font-family:'Gowun Batang',serif;font-size:13px;color:var(--ink);line-height:1.5;}
  .ph-wk-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:2px;}
  .ph-wk-ph{aspect-ratio:1/1;border:none;border-radius:10px;background:#d9cbb0 center/cover no-repeat;cursor:pointer;padding:0;
    box-shadow:inset 0 0 0 1px rgba(0,0,0,.08);}
  .ph-wk-ph:active{opacity:.7;}
  .ph-wk-empty{font-size:12.5px;line-height:1.6;color:var(--ink-soft);background:rgba(92,191,176,.12);border-radius:12px;padding:14px;}
  .ph-wk-empty b{color:var(--coral-d);}
  .ph-wk-lb{position:absolute;inset:0;background:rgba(10,20,24,.93);display:none;flex-direction:column;z-index:20;padding:14px;}
  .ph-wk-lb.show{display:flex;animation:phFade .2s ease;}
  .ph-wk-lb .x{align-self:flex-end;width:30px;height:30px;border:none;border-radius:9px;background:rgba(255,255,255,.16);
    color:#fff;font-size:14px;cursor:pointer;}
  .ph-wk-lb .img{flex:1;min-height:0;margin:10px 0;border-radius:14px;background-size:contain;background-repeat:no-repeat;background-position:center;}
  .ph-wk-lb .cap{color:#f6efde;font-family:'Gowun Batang',serif;font-size:13px;line-height:1.5;text-align:center;min-height:1.2em;}
  .ph-wk-lb .cap.empty{opacity:.4;font-style:italic;}

  /* music app */
  .ph-mhero{display:flex;align-items:center;gap:13px;padding:13px;border-radius:15px;margin:2px 0 6px;
    background:linear-gradient(160deg,rgba(243,198,89,.16),rgba(232,113,74,.08));box-shadow:inset 0 0 0 1.4px rgba(99,70,30,.24);}
  .ph-mart{width:52px;height:52px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;position:relative;
    font-family:'Gowun Batang',serif;font-weight:700;font-size:23px;color:rgba(255,255,255,.94);
    box-shadow:0 4px 10px rgba(0,0,0,.3),inset 0 0 0 1px rgba(255,255,255,.16);}
  .ph-mart.spin{animation:phSpinArt 6s linear infinite;}
  @keyframes phSpinArt{to{transform:rotate(360deg)}}
  .ph-mhi{flex:1;min-width:0;}
  .ph-mhi .mn{font-family:'Gowun Batang',serif;font-weight:700;font-size:15px;color:var(--ink2);line-height:1.15;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ph-mhi .me{font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:.04em;color:var(--ink-soft);margin-top:4px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ph-mctrls{display:flex;align-items:center;justify-content:center;gap:16px;margin:4px 0 12px;}
  .ph-mc{border:none;background:none;cursor:pointer;color:var(--ink2);padding:5px;display:flex;align-items:center;justify-content:center;}
  .ph-mc svg{width:22px;height:22px;}
  .ph-mc:active{transform:scale(.9);}
  .ph-mplay{width:46px;height:46px;border-radius:50%;background:linear-gradient(180deg,#f3c659,#e0a836);color:#5a3d08;
    box-shadow:0 4px 0 #b8841f,0 6px 12px rgba(0,0,0,.25);}
  .ph-mplay:active{transform:translateY(3px);box-shadow:0 1px 0 #b8841f;}
  .ph-mplay svg{width:21px;height:21px;}
  .ph-mrow{display:flex;align-items:center;gap:11px;padding:9px 2px;border-bottom:1px dashed rgba(99,70,30,.26);cursor:pointer;}
  .ph-mrow:active{opacity:.62;}
  .ph-msm{width:40px;height:40px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;
    font-family:'Gowun Batang',serif;font-weight:700;font-size:18px;color:rgba(255,255,255,.94);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);}
  .ph-mrt{flex:1;min-width:0;}
  .ph-mrt .mn{font-family:'Gowun Batang',serif;font-weight:700;font-size:14px;color:var(--ink2);line-height:1.15;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ph-mrow.on .mn{color:var(--coral-d);}
  .ph-mrt .me{font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:.04em;color:var(--ink-soft);margin-top:3px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ph-mri{width:28px;height:28px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--ink-soft);}
  .ph-mrow.on .ph-mri{background:linear-gradient(180deg,#f3c659,#e0a836);color:#5a3d08;}
  .ph-mri svg{width:14px;height:14px;}
  .ph-meqr{display:none;align-items:flex-end;gap:2px;height:14px;}
  .ph-mrow.on.playing .ph-mri{display:none;}
  .ph-mrow.on.playing .ph-meqr{display:flex;}
  .ph-meqr i{width:3px;background:var(--gold);border-radius:1px;height:30%;animation:phEq .9s ease-in-out infinite;}
  .ph-meqr i:nth-child(2){animation-delay:.2s}.ph-meqr i:nth-child(3){animation-delay:.4s}
  @keyframes phEq{0%,100%{height:25%}50%{height:100%}}

  /* dolphin-tail keyring charm — hangs off the phone's edge, visible whenever the phone is open */
  .ph-charm{position:absolute;top:12px;left:-42px;width:82px;z-index:26;cursor:pointer;}
  .ph-charm-hang{width:82px;transform-origin:50% 5px;animation:phSway 4.6s ease-in-out infinite;
    filter:drop-shadow(0 4px 6px rgba(0,0,0,.42));}
  .ph-charm-hang svg,.ph-charm-hang .ph-charm-img{display:block;width:100%;height:auto;}
  /* decorative copy hooked at the phone button's top-right, tail dangling down its right side
     (button hugs the screen's right edge, so it drapes over the right side rather than fully beside it) */
  .ph-charm-btn{position:absolute;right:30px;bottom:16px;width:38px;pointer-events:none;z-index:9;}
  .ph-charm-btn .ph-charm-hang{width:38px;}
  .ph-charm:active .ph-charm-hang{filter:drop-shadow(0 2px 3px rgba(0,0,0,.42)) brightness(1.06);}
  @keyframes phSway{0%,100%{transform:rotate(-4.5deg)}50%{transform:rotate(4.5deg)}}
  .ph-charm-note{position:absolute;top:6px;left:62px;width:156px;padding:9px 11px;border-radius:12px 12px 12px 3px;
    background:rgba(18,38,44,.95);color:#f3ede1;font-size:11px;line-height:1.55;font-family:'Gowun Batang',serif;
    box-shadow:0 6px 16px rgba(0,0,0,.45);display:none;z-index:27;}
  .ph-charm-note.show{display:block;animation:phFade .18s ease;}
  .ph-charm-note b{color:#f2c75a;}

  /* home indicator / close */
  .ph-bottom{flex:none;height:34px;display:flex;align-items:center;justify-content:center;}
  .ph-home-ind{width:90px;height:5px;border-radius:99px;background:rgba(20,40,46,.4);cursor:pointer;}
  .ph-app-scr .ph-bottom{background:var(--paper);}

  /* ---- incoming / outgoing call ---- */
  #phoneBtn .badge{display:none;}
  #phoneBtn .badge.on{display:flex;}
  #phoneCall{position:absolute;inset:0;z-index:30;display:none;align-items:center;justify-content:center;
    background:radial-gradient(120% 90% at 50% 12%,rgba(8,34,42,.72),rgba(2,10,14,.93));backdrop-filter:blur(4px);pointer-events:auto;}
  #phoneCall.show{display:flex;animation:phFade .2s ease;}
  .call-card{position:relative;width:80%;max-width:300px;border-radius:30px;padding:30px 24px 24px;text-align:center;
    color:#eef3f5;background:linear-gradient(180deg,#2c3742,#1b232b);
    box-shadow:0 34px 64px rgba(0,0,0,.6),inset 0 0 0 1.5px rgba(255,255,255,.07);animation:phRise .28s cubic-bezier(.2,.85,.25,1);}
  .call-av{width:104px;height:104px;border-radius:50%;margin:0 auto 16px;overflow:hidden;background:#3a4654;
    box-shadow:inset 0 0 0 2px rgba(255,255,255,.14);}
  .call-av svg{width:100%;height:100%;display:block;}
  #phoneCall.ringing .call-av{animation:callPulse 1.25s ease-in-out infinite;}
  @keyframes callPulse{0%,100%{box-shadow:0 0 0 0 rgba(242,193,78,.55),inset 0 0 0 2px rgba(255,255,255,.14)}
    50%{box-shadow:0 0 0 16px rgba(242,193,78,0),inset 0 0 0 2px rgba(255,255,255,.14)}}
  .call-name{font-family:'Gowun Batang',serif;font-weight:700;font-size:21px;line-height:1.15;}
  .call-name small{display:block;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.16em;text-transform:uppercase;opacity:.75;margin-top:4px;font-weight:700;}
  .call-role{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;margin-top:8px;}
  .call-status{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#f2c14e;margin-top:16px;}
  .call-line{font-family:'Gowun Batang',serif;font-size:15px;line-height:1.62;margin-top:16px;text-align:left;
    max-height:34vh;overflow-y:auto;display:none;color:#f2efe4;}
  .call-line.show{display:block;}
  .call-line::-webkit-scrollbar{width:0;}
  .call-actions{display:flex;gap:14px;justify-content:center;margin-top:22px;}
  .call-actions.hide{display:none;}
  .call-btn{flex:1;max-width:120px;border:none;cursor:pointer;font-family:'Gowun Batang',serif;font-weight:700;
    font-size:13px;color:#fff;padding:14px 10px;border-radius:99px;display:flex;align-items:center;justify-content:center;gap:7px;}
  .call-btn svg{width:16px;height:16px;}
  .call-btn:active{transform:translateY(3px);}
  .call-btn.accept{background:#2f9e6a;box-shadow:0 4px 0 #1f6f49;}
  .call-btn.decline{background:#d3553a;box-shadow:0 4px 0 #9a3a26;}
  .call-end{display:none;margin-top:16px;}
  .call-end.show{display:block;}
  .call-endbtn{border:none;cursor:pointer;font-family:'Gowun Batang',serif;font-weight:700;font-size:12px;color:#fff;
    padding:9px 18px;border-radius:99px;background:#d3553a;box-shadow:0 3px 0 #9a3a26;display:flex;width:100%;justify-content:center;align-items:center;gap:7px;}
  .call-endbtn:active{transform:translateY(3px);}
  .call-endbtn svg{width:15px;height:15px;}

  /* recent calls list inside Contacts */
  .ph-call-row{display:flex;align-items:center;gap:11px;padding:9px 0;border-bottom:1px dashed rgba(99,70,30,.22);}
  .ph-call-row .ph-av{width:34px;height:34px;}
  .ph-call-row .ci{flex:1;min-width:0;}
  .ph-call-row .ci .cn{font-family:'Gowun Batang',serif;font-weight:700;font-size:13px;color:var(--ink2);}
  .ph-call-row .ci .cm{font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:.06em;text-transform:uppercase;margin-top:2px;}
  .ph-call-row .cm.missed{color:var(--coral-d);}
  .ph-call-row .cm.answered{color:var(--ink-soft);}
  .ph-call-row .ph-callback{flex:none;width:30px;height:30px;border:none;cursor:pointer;border-radius:50%;
    background:rgba(47,158,106,.16);color:#2f8a5e;display:flex;align-items:center;justify-content:center;}
  .ph-call-row .ph-callback svg{width:15px;height:15px;}
  .ph-call-row .ph-callback:active{background:rgba(47,158,106,.3);}
  .ph-callbtn{flex:none;width:34px;height:34px;border:none;cursor:pointer;border-radius:50%;
    background:rgba(47,158,106,.16);color:#2f8a5e;display:flex;align-items:center;justify-content:center;}
  .ph-callbtn svg{width:16px;height:16px;}
  .ph-callbtn:active{background:rgba(47,158,106,.3);transform:scale(.92);}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------------- icons ---------------- */
  const IC = {
    market:`<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c3-5 8-5 11-3 2-3 5-3 7-2-1 2-1 3 0 5 0 2 0 3 0 5-2 1-5 1-7-2-3 2-8 2-11-3z" fill="rgba(255,255,255,.18)"/><circle cx="8" cy="11" r="1.1" fill="#fff" stroke="none"/></svg>`,
    contacts:`<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="3.6" fill="rgba(255,255,255,.18)"/><path d="M5 19.5c0-3.6 3.1-6 7-6s7 2.4 7 6"/></svg>`,
    divelog:`<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5c0-1.4 1.1-2.3 4-2.3h8c2.9 0 4 .9 4 2.3v3c0 2.4-2 3.8-4.4 3.8-1.7 0-2.6-1-3.6-2.6-1-1.6-3-1.6-4 0-1 1.6-1.9 2.6-3.6 2.6C2 15.3 4 13.9 4 11.5z" fill="rgba(255,255,255,.18)"/><path d="M9.5 18.5c1.5 1 3.5 1 5 0"/></svg>`,
    weather:`<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2" fill="rgba(255,255,255,.25)"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"/></svg>`,
    tips:`<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" fill="rgba(255,255,255,.18)"/><path d="M12 11v5"/><circle cx="12" cy="7.6" r="1" fill="#fff" stroke="none"/></svg>`,
    workation:`<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L18 8h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" fill="rgba(255,255,255,.18)"/><circle cx="12" cy="13" r="3.4"/></svg>`,
    phone:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" fill="rgba(255,255,255,.1)"/><path d="M10 5.5h4"/><circle cx="12" cy="18.4" r=".9" fill="currentColor" stroke="none"/></svg>`,
    music:`<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.6" fill="rgba(255,255,255,.3)"/><circle cx="16.5" cy="16" r="2.6" fill="rgba(255,255,255,.3)"/></svg>`,
    callPick:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 3.2c.5-.1 1 .2 1.2.7l1.1 2.7c.2.5.1 1-.3 1.4l-1.2 1c.9 1.8 2.4 3.3 4.2 4.2l1-1.2c.4-.4.9-.5 1.4-.3l2.7 1.1c.5.2.8.7.7 1.2l-.6 2.7c-.1.5-.6.9-1.1.9C9.3 19.6 4.4 14.7 3.9 8c0-.5.3-1 .9-1.1z"/></svg>`,
    callEnd:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 9.2c-2.6 0-5 .5-7 1.4-.7.3-1.1 1-1 1.7l.3 1.9c.1.6.6 1 1.2.9l2.6-.4c.6-.1 1-.5 1.1-1.1l.2-1.4c1.5-.4 3.1-.4 4.6 0l.2 1.4c.1.6.5 1 1.1 1.1l2.6.4c.6.1 1.1-.3 1.2-.9l.3-1.9c.1-.7-.3-1.4-1-1.7-2-.9-4.4-1.4-7-1.4z"/></svg>`,
  };
  // transport icons (ink-coloured, for the music app body)
  const MIC = {
    play:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>`,
    pause:`<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="5.5" width="3.4" height="13" rx="1"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1"/></svg>`,
    prev:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5h2.4v13H7zM19 5.5v13l-9-6.5z"/></svg>`,
    next:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.6 5.5H17v13h-2.4zM5 5.5v13l9-6.5z"/></svg>`,
  };

  const APPS = [
    {id:'market',  kr:'Market', en:'Market',   bg:'linear-gradient(160deg,#4fc0d0,#2f86a6)'},
    {id:'contacts',kr:'Contacts',   en:'Contacts', bg:'linear-gradient(160deg,#f0875a,#d3552f)'},
    {id:'music',   kr:'Radio', en:'Radio',  bg:'linear-gradient(160deg,#f3c659,#e0a836)'},
    {id:'divelog', kr:'Dive Log', en:'Dive Log', bg:'linear-gradient(160deg,#6fd0c0,#3f9e8c)'},
    {id:'weather', kr:'Weather',     en:'Weather',  bg:'linear-gradient(160deg,#f7d264,#e0a836)'},
    {id:'tips',    kr:'Tips',   en:'Tips',     bg:'linear-gradient(160deg,#b85f82,#8e3f5e)'},
    {id:'workation',kr:'Workation',en:'Workation',bg:'linear-gradient(160deg,#f2a65a,#e0653e)'},
  ];
  const APPBAR_BG = {market:'#2f86a6',contacts:'#d3552f',music:'#cf9320',divelog:'#3f9e8c',weather:'#cf9320',tips:'#8e3f5e',workation:'#c9502f'};

  /* Real event this app documents — the "Jeju Digital Nomad Workation" by NomadHer.
     A personal/meta scrapbook layered on the game; purely display, touches no game state. */
  const WK = {
    title:'Jeju Digital Nomad Workation',
    tagline:'She Can Create Anywhere',
    host:'NomadHer',
    hostNote:'a global community for female travelers & digital nomads',
    hostedBy:'Hyo (NomadHer founder) & Soyoung',
    dates:'June 28 – July 3, 2026',
    place:'Hamdeok Beach, Jeju',
    url:'nomadher.com/travel-camps/jeju-digital-nomad-workation',
    schedule:[
      {d:'Day 1', date:'Jun 28', items:[['15:00','Check-in & Opening'],['16:00–18:00','Camp Orientation'],['19:00–20:00','Welcome Dinner']]},
      {d:'Day 2', date:'Jun 29', items:[['09:00','Morning Check-in'],['10:00–13:00','Learn Haenyeo Diving — haenyeo school + traditional meal'],['13:00–18:00','Afternoon Coworking']]},
      {d:'Day 3', date:'Jun 30', items:[['09:00','Morning Check-in'],['10:00–11:00','Beach Plogging — with Diphda, a Jeju ocean-protection org'],['11:00–12:00','Upcycling Craft Workshop — dolphin keyring from old haenyeo wetsuits'],['13:00–18:00','Afternoon Coworking']]},
      {d:'Day 4', date:'Jul 1',  items:[['09:00','Morning Check-in'],['10:00–13:00','Vibecoding Workshop'],['13:00–18:00','Afternoon Coworking'],['15:00–16:00','Matcha Ceremony Workshop']]},
      {d:'Day 5', date:'Jul 2',  items:[['06:00–07:00','Wellness Morning Yoga'],['09:00','Morning Check-in'],['10:00–13:00','Mentoring Session'],['13:00–18:00','Afternoon Coworking']]},
      {d:'Day 6', date:'Jul 3',  items:[['09:00–11:00','Final Project Submission'],['16:00–17:00','Awards for Best Creators']]},
    ],
  };
  /* Fill these in later — keyed by photo number (1-based). Blank = no caption shown. */
  const WK_CAPTIONS = {
    // 1:'Opening night at Hamdeok Beach',
    // 2:'Haenyeo diving lesson',
  };

  /* the dolphin-tail keyring — a drawn stand-in; swapped for the real photo at
     assets/dolphin-keyring.png if that file exists (see the upgrade below). */
  const CHARM_SVG = `<svg viewBox="0 0 90 172" aria-label="Dolphin-tail keyring">
    <path d="M45,0 C43,10 47,15 45,23" fill="none" stroke="#6b4a2e" stroke-width="3" stroke-linecap="round"/>
    <circle cx="45" cy="31" r="9" fill="none" stroke="#9aa3ab" stroke-width="4.5"/>
    <circle cx="45" cy="31" r="9" fill="none" stroke="#eef2f5" stroke-width="1.6"/>
    <rect x="42.4" y="37" width="5.2" height="9" rx="2.2" fill="#c6ccd1" stroke="#868f97" stroke-width="1"/>
    <path d="M40,47 C33,71 30,95 13,150 C25,140 37,128 45,124 C53,128 65,140 77,150 C60,95 57,71 50,47 Z" fill="#d9d3c9"/>
    <path d="M40,49 C33,72 30,95 15,148 C26,139 37,128 45,124 C53,128 64,139 75,148 C60,95 57,72 50,49 Z" fill="#b06a3e" stroke="#241c16" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M42,58 C38,82 37,101 31,131" fill="none" stroke="#c9895b" stroke-width="4" stroke-linecap="round" opacity=".5"/>
    <path d="M40,49 C33,72 30,95 15,148 C26,139 37,128 45,124 C53,128 64,139 75,148 C60,95 57,72 50,49 Z" fill="none" stroke="#241c16" stroke-width="2.3" stroke-linecap="round" stroke-dasharray="0.5 5"/>
  </svg>`;

  /* ---------------- DOM ---------------- */
  const btn = document.createElement('button');
  btn.id = 'phoneBtn'; btn.title = 'Phone';
  btn.innerHTML = IC.phone + `<span class="badge"></span>`;
  // keyring dangling off the phone button — visible during play even when the phone is closed (decorative)
  const btnCharm = document.createElement('div');
  btnCharm.className = 'ph-charm-btn';
  btnCharm.innerHTML = `<div class="ph-charm-hang">${CHARM_SVG}</div>`;
  btn.appendChild(btnCharm);
  stage.appendChild(btn);
  const phoneBadge = btn.querySelector('.badge');

  const ov = document.createElement('div');
  ov.id = 'phoneOv';
  ov.innerHTML = `
    <div class="ph-body">
      <div class="ph-screen">
        <div class="ph-stat">
          <span>JEJU</span>
          <span class="ph-time">6:00</span>
          <span class="sig"><span class="ph-sig"><i style="height:4px"></i><i style="height:6px"></i><i style="height:8px"></i><i style="height:10px"></i></span><span class="ph-batt"><i></i></span></span>
        </div>
        <div class="ph-home">
          <div class="ph-hello"><div class="h1"></div><div class="h2"></div></div>
          <div class="ph-grid"></div>
          <div class="ph-bottom"><div class="ph-home-ind" title="Close"></div></div>
        </div>
        <div class="ph-app-scr">
          <div class="ph-appbar"><button class="back" title="Back">‹</button><div class="ttl"></div></div>
          <div class="ph-content"></div>
          <div class="ph-bottom"><div class="ph-home-ind" title="Home"></div></div>
        </div>
      </div>
      <div class="ph-charm" title="Dolphin-tail keyring">
        <div class="ph-charm-hang">${CHARM_SVG}</div>
        <div class="ph-charm-note"><b>Dolphin-tail keyring</b> — hand-stitched from a retired haenyeo wetsuit at the NomadHer upcycling workshop. On Jeju, a passing pod is a diver's good-luck omen.</div>
      </div>
    </div>`;
  stage.appendChild(ov);

  /* ---------------- call overlay ---------------- */
  const callOv = document.createElement('div');
  callOv.id = 'phoneCall';
  callOv.innerHTML = `
    <div class="call-card">
      <div class="call-av"></div>
      <div class="call-name"></div>
      <div class="call-role"></div>
      <div class="call-status">Incoming call…</div>
      <div class="call-line"></div>
      <div class="call-actions">
        <button class="call-btn decline">${IC.callEnd}Decline</button>
        <button class="call-btn accept">${IC.callPick}Accept</button>
      </div>
      <div class="call-end"><button class="call-endbtn">${IC.callEnd}End call</button></div>
    </div>`;
  stage.appendChild(callOv);
  const cAv=callOv.querySelector('.call-av'), cName=callOv.querySelector('.call-name'),
        cRole=callOv.querySelector('.call-role'), cStatus=callOv.querySelector('.call-status'),
        cLine=callOv.querySelector('.call-line'), cActions=callOv.querySelector('.call-actions'),
        cEnd=callOv.querySelector('.call-end');

  const $$ = s => ov.querySelector(s);

  const grid = $$('.ph-grid');
  const homeView = $$('.ph-home');
  const appView = $$('.ph-app-scr');
  const appbar = $$('.ph-appbar');
  const content = $$('.ph-content');
  let musicUnsub = null;

  /* drag-to-scroll: phone UIs invite a click-drag; on desktop an
     overflow:auto div only scrolls via the wheel, so add grab-scroll.
     Touch keeps its native momentum scroll (pointerType==='touch'). */
  (function dragScroll(el){
    let down=false, startY=0, startTop=0, moved=false, pid=null;
    el.addEventListener('pointerdown', e=>{
      if(e.pointerType==='touch') return;      // native touch scroll
      if(e.button!==0) return;
      down=true; moved=false; startY=e.clientY; startTop=el.scrollTop; pid=e.pointerId;
    });
    el.addEventListener('pointermove', e=>{
      if(!down) return;
      const dy=e.clientY-startY;
      if(!moved && Math.abs(dy)>4){ moved=true; el.style.cursor='grabbing';
        try{ el.setPointerCapture(pid); }catch(_){}
      }
      if(moved){ el.scrollTop = startTop - dy; e.preventDefault(); }
    });
    const end=()=>{ down=false; el.style.cursor=''; };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    // swallow the click that ends a drag so track rows don't fire
    el.addEventListener('click', e=>{ if(moved){ e.stopPropagation(); e.preventDefault(); moved=false; } }, true);
  })(content);

  // build app grid
  APPS.forEach(a=>{
    const b = document.createElement('button');
    b.className = 'ph-app';
    b.innerHTML = `<span class="tile" style="background:${a.bg}">${IC[a.id]}</span><span class="lab">${a.en}</span>`;
    b.onclick = ()=> openApp(a.id);
    grid.appendChild(b);
  });

  /* ---------------- helpers ---------------- */
  const seasonName = ()=> (typeof SEASONS!=='undefined' ? SEASONS[G.season] : 'Spring');
  const wxInfo = ()=>({
    sunny:{ico:'☀️', big:'Clear', sub:'Clear skies', advice:'A fine day to dive deep — visibility is good out on the yeo rocks.'},
    rain: {ico:'🌧️', big:'Rain',   sub:'Rain',        advice:'Rain over the black rocks. The catch is quieter; a good day to clean the beach.'},
    wind: {ico:'🍃', big:'Windy', sub:'Windy',        advice:'Wind on the shore. Mind the swell when you surface.'},
  }[G.weather] || {ico:'☀️',big:'Clear',sub:'Clear',advice:''});

  function avatarStyle(n){
    const sk = (n.look&&n.look.skin)||n.skin||'#e8c9a0';
    const sc = (n.look&&(n.look.scarf||n.look.top))||n.scarf||n.color;
    return `background:radial-gradient(circle at 50% 30%, ${sk} 0 46%, ${sc} 47%);`;
  }
  // a little cartoon face for each villager, themed by their look
  function avatarSVG(n){
    const L = n.look||{};
    const skin = L.skin||n.skin||'#e8c9a0';
    const hair = L.hair||'#2a2220';
    const cloth= L.scarf||L.top||n.scarf||n.color||'#3fa8b8';
    const style= L.hairStyle||'bob';
    let p = '';
    // shoulders / collar
    p += `<path d="M3 40 q0-13 17-13 17 0 17 13z" fill="${cloth}"/>`;
    p += `<rect x="16.5" y="24" width="7" height="6" fill="${skin}"/>`;
    // hair crown behind the face
    p += `<circle cx="20" cy="13" r="12" fill="${hair}"/>`;
    // face
    p += `<circle cx="20" cy="18" r="10" fill="${skin}"/>`;
    // hairstyle accents
    if(style==='bun'){ p += `<circle cx="20" cy="4.5" r="3.6" fill="${hair}"/>`; }
    else if(style==='ponytail'){ p += `<path d="M30 12 q6 4 4 13 q-5-2-6-10z" fill="${hair}"/>`; }
    // fringe over the forehead
    p += `<path d="M10 15 Q20 8 30 15 Q20 12.5 10 15 Z" fill="${hair}"/>`;
    // elder headscarf band
    if(L.elder){ p += `<path d="M9.5 14 A11 11 0 0 1 30.5 14 L28 17 Q20 11 12 17 Z" fill="${cloth}"/>`; }
    if(L.floral){ p += `<circle cx="11.5" cy="10.5" r="2.1" fill="#f2c14e"/><circle cx="11.5" cy="10.5" r="0.8" fill="#d35a31"/>`; }
    // eyes
    if(L.glasses){
      p += `<circle cx="16" cy="18" r="2.7" fill="#fff" fill-opacity=".5" stroke="#3a2c20" stroke-width="1.2"/>`;
      p += `<circle cx="24" cy="18" r="2.7" fill="#fff" fill-opacity=".5" stroke="#3a2c20" stroke-width="1.2"/>`;
      p += `<path d="M18.7 18h2.6" stroke="#3a2c20" stroke-width="1.2"/>`;
      p += `<circle cx="16" cy="18" r="1" fill="#2a2018"/><circle cx="24" cy="18" r="1" fill="#2a2018"/>`;
    } else {
      p += `<circle cx="16.5" cy="18" r="1.4" fill="#2a2018"/><circle cx="23.5" cy="18" r="1.4" fill="#2a2018"/>`;
    }
    // cheeks + smile
    p += `<circle cx="13.4" cy="21" r="1.5" fill="#e8896f" opacity=".5"/><circle cx="26.6" cy="21" r="1.5" fill="#e8896f" opacity=".5"/>`;
    p += `<path d="M16.8 22 Q20 24.6 23.2 22" fill="none" stroke="#9c5a44" stroke-width="1.3" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 40 40">${p}</svg>`;
  }
  function heartsHTML(id){
    if(typeof hearts!=='function') return '';
    const h = hearts(id), m = (typeof MAX_HEARTS!=='undefined'?MAX_HEARTS:5);
    return '♥'.repeat(h) + `<span class="e">${'♥'.repeat(Math.max(0,m-h))}</span>`;
  }

  /* ---------------- app screens ---------------- */
  function appHTML(id){
    if(id==='market'){
      let h = `<div class="ph-sec">Today's catch</div>`;
      SPECIES.forEach(s=>{
        h += `<div class="ph-row"><span class="nm"><span class="ph-dot" style="background:${s.color}"></span>${s.name}</span><span class="ph-price">${s.value}<small> won</small></span></div>`;
      });
      h += `<div class="ph-sec">Beach salvage</div>`;
      BEACH_ITEMS.forEach(b=>{
        h += `<div class="ph-row"><span class="nm"><span class="ph-dot" style="background:${b.color}"></span>${b.name}${b.treasure?'<span class="ph-tag">find</span>':''}</span><span class="ph-price">${b.value}<small> won</small></span></div>`;
      });
      h += `<div class="ph-note">Prices are per item. Bring your haul to the co-op by the harbour — Migyeong weighs it and pays you out.</div>`;
      return h;
    }
    if(id==='contacts'){
      let h = '';
      if(recentCalls.length){
        h += `<div class="ph-sec">Recent calls</div>`;
        recentCalls.forEach(rc=>{
          const n = NPCS.find(x=>x.id===rc.id); if(!n) return;
          const meta = rc.out ? 'You called' : (rc.answered ? 'Answered' : 'Missed call');
          const cls = (rc.answered||rc.out) ? 'answered' : 'missed';
          h += `<div class="ph-call-row">
            <span class="ph-av">${avatarSVG(n)}</span>
            <span class="ci"><span class="cn">${n.roman}</span><span class="cm ${cls}">${meta}</span></span>
            <button class="ph-callback" data-call="${n.id}" title="Call back">${IC.callPick}</button>
          </div>`;
        });
      }
      h += `<div class="ph-sec">The village</div>`;
      NPCS.forEach(n=>{
        h += `<div class="ph-card" data-id="${n.id}">
          <span class="ph-av">${avatarSVG(n)}</span>
          <span class="ph-ci"><span class="cn">${n.roman}</span><span class="cr">${n.role}</span><span class="ph-hearts">${heartsHTML(n.id)}</span></span>
          <button class="ph-callbtn" data-call="${n.id}" title="Call ${n.roman}">${IC.callPick}</button>
        </div>
        <div class="ph-quote" data-q="${n.id}"></div>`;
      });
      h += `<div class="ph-note">Tap a name to hear a passing thought, or press the <b>green button</b> to call. Villagers ring you now and then too — answer to hear a story, a tip, or what's cooking at the bulteok.</div>`;
      return h;
    }
    if(id==='music'){
      const M = window.HaenyeoMusic;
      if(!M) return `<div class="ph-note">The village radio is warming up… try again in a moment.</div>`;
      const cur = M.current, t = M.tracks[cur];
      let h = `<div class="ph-mhero">
        <div class="ph-mart${M.playing?' spin':''}" style="background:${t.art}">${t.glyph}</div>
        <div class="ph-mhi"><div class="mn">${t.kr}</div><div class="me">${t.mood}</div></div>
      </div>
      <div class="ph-mctrls">
        <button class="ph-mc" data-m="prev" title="Previous">${MIC.prev}</button>
        <button class="ph-mc ph-mplay" data-m="play" title="Play / pause">${M.playing?MIC.pause:MIC.play}</button>
        <button class="ph-mc" data-m="next" title="Next">${MIC.next}</button>
      </div>
      <div class="ph-sec">Village Radio</div>`;
      M.tracks.forEach((tr,i)=>{
        const on = i===cur;
        h += `<div class="ph-mrow${on?' on':''}${on&&M.playing?' playing':''}" data-mi="${i}">
          <div class="ph-msm" style="background:${tr.art}">${tr.glyph}</div>
          <div class="ph-mrt"><div class="mn">${tr.kr}</div><div class="me">${tr.mood}</div></div>
          <div class="ph-mri">${MIC.play}</div>
          <div class="ph-meqr"><i></i><i></i><i></i></div>
        </div>`;
      });
      h += `<div class="ph-note">Every tune is played live by the village radio — no two loops are quite the same. It keeps playing as you walk the lanes.</div>`;
      return h;
    }
    if(id==='divelog'){
      const totalCatch = SPECIES.reduce((a,s)=>a+(G.catch[s.id]||0),0);
      const totalTrash = BEACH_ITEMS.reduce((a,b)=>a+(G.trash[b.id]||0),0);
      let h = `<div class="ph-sec">In your net today</div>`;
      if(totalCatch){
        SPECIES.forEach(s=>{ const n=G.catch[s.id]||0; if(n) h += `<div class="ph-row"><span class="nm"><span class="ph-dot" style="background:${s.color}"></span>${s.name}</span><span class="ph-price">×${n}</span></div>`; });
      } else { h += `<div class="ph-note" style="margin-top:2px">Nothing caught yet today — head to the <b>sea</b> and dive.</div>`; }
      if(totalTrash){
        h += `<div class="ph-sec">Salvage gathered</div>`;
        BEACH_ITEMS.forEach(b=>{ const n=G.trash[b.id]||0; if(n) h += `<div class="ph-row"><span class="nm"><span class="ph-dot" style="background:${b.color}"></span>${b.name}${b.treasure?'<span class="ph-tag">find</span>':''}</span><span class="ph-price">×${n}</span></div>`; });
      }
      const net = (typeof GEAR!=='undefined' && GEAR.net && GEAR.net[G.netIdx]) ? GEAR.net[G.netIdx].cap : '—';
      const suit = (G.suit==='modern')?'Neoprene wetsuit':'Cotton mul-ot';
      h += `<div class="ph-sec">Gear</div>
        <div class="ph-row"><span class="nm">Net bag</span><span class="ph-price">holds ${net}</span></div>
        <div class="ph-row"><span class="nm">Suit</span><span class="ph-price" style="font-size:12px">${suit}</span></div>`;
      return h;
    }
    if(id==='weather'){
      const w = wxInfo(); const wx = APPBAR_BG.weather;
      let h = `<div class="ph-wx" style="background:linear-gradient(160deg,#69b6d4,#3a7ba6)">
        <div class="ico">${w.ico}</div><div class="big">${w.big}</div>
        <div class="sub">${seasonName()} · Day ${G.day}</div></div>`;
      // little 3-day outlook, deterministic by day so it feels stable
      const pool=['sunny','sunny','rain','wind'];
      const ico={sunny:'☀️',rain:'🌧️',wind:'🍃'}; const lab={sunny:'Clear',rain:'Rain',wind:'Windy'};
      h += `<div class="ph-fc">`;
      for(let d=1; d<=3; d++){ const k=pool[(G.day*7+d*3)%pool.length];
        h += `<div class="d"><div class="dn">Day ${G.day+d}</div><div class="di">${ico[k]}</div><div class="dl">${lab[k]}</div></div>`; }
      h += `</div><div class="ph-note">${w.advice}</div>`;
      return h;
    }
    if(id==='tips'){
      const tips = [
        ['Dive','Walk to the <b>sea</b> and press the button to free-dive for seaweed, conch, urchin and octopus. Watch your breath — surface before it runs out.'],
        ['Beach','On the <b>sandy shore</b>, gather litter and dig up lost treasures. It keeps the coast clean and the rare finds sell well.'],
        ['Sell','Take everything to the <b>co-op</b> to weigh in and earn won.'],
        ['Eat','Cook and eat at <b>home</b> — a full belly lets you dive longer the next day.'],
        ['Friends','Chat with villagers daily and share food to raise your <b>♥</b>.'],
        ['Sleep','Sleep at home to start a new day. Weather and prices shift each morning.'],
      ];
      let h = `<ol class="ph-tips" style="padding:0;margin:0">`;
      tips.forEach((t,i)=> h += `<li><span class="n">${i+1}</span><b>${t[0]}</b> — ${t[1]}</li>`);
      h += `</ol>`;
      return h;
    }
    if(id==='workation'){
      let h = `<div class="ph-wk-hero">
        <div class="t">${WK.title}</div>
        <div class="s">${WK.tagline}</div>
        <div class="w">${WK.dates} · ${WK.place}</div>
      </div>`;
      h += `<div class="ph-sec">About</div>
      <div class="ph-wk-about">
        <p><b>Host:</b> ${WK.host} — ${WK.hostNote}</p>
        <p><b>Hosted by:</b> ${WK.hostedBy}</p>
        <p><b>When:</b> ${WK.dates}</p>
        <p><b>Where:</b> ${WK.place}</p>
        <p><b>Web:</b> <span class="ph-wk-link">${WK.url}</span></p>
      </div>`;
      h += `<div class="ph-sec">Schedule</div>`;
      WK.schedule.forEach((day,di)=>{
        h += `<div class="ph-wk-day${di===0?' open':''}">
          <button class="ph-wk-dayh"><span>${day.d}<span class="dt">${day.date}</span></span><span class="chev">›</span></button>
          <div class="ph-wk-slots">`;
        day.items.forEach(it=>{ h += `<div class="ph-wk-slot"><span class="tm">${it[0]}</span><span class="ac">${it[1]}</span></div>`; });
        h += `</div></div>`;
      });
      h += `<div class="ph-sec">Photo album</div>
        <div class="ph-wk-grid" id="wkGrid"></div>
        <div class="ph-note">Tap a photo to view it larger.</div>`;
      return h;
    }
    return '';
  }
  /* ---- workation photo album: probe assets/workation-photos/photoN.(jpg|jpeg|png|webp),
     appending thumbnails until the first gap. Purely client-side; missing files just stop it. */
  let wkLB = null;
  function ensureWkLB(){
    if(wkLB) return wkLB;
    wkLB = document.createElement('div');
    wkLB.className = 'ph-wk-lb';
    wkLB.innerHTML = `<button class="x" title="Close">✕</button><div class="img"></div><div class="cap"></div>`;
    const close = ()=> wkLB.classList.remove('show');
    wkLB.querySelector('.x').onclick = close;
    wkLB.addEventListener('click', e=>{ if(e.target===wkLB) close(); });
    $$('.ph-screen').appendChild(wkLB);
    return wkLB;
  }
  function openWkPhoto(src, num){
    const lb = ensureWkLB();
    lb.querySelector('.img').style.backgroundImage = `url("${src}")`;
    const cap = lb.querySelector('.cap');
    const txt = WK_CAPTIONS[num];
    cap.textContent = txt || 'Add a caption in WK_CAPTIONS';
    cap.classList.toggle('empty', !txt);
    lb.classList.add('show');
    if(typeof tone==='function') tone(600,.05,'sine',.04);
  }
  function loadWkPhotos(){
    const grid = content.querySelector('#wkGrid'); if(!grid) return;
    const EXTS = ['jpg','jpeg','png','webp'];
    let found = 0; const MAX = 60;
    const tryLoad = (base, ok, fail)=>{        // try each extension for one photo number
      let k = 0;
      (function next(){
        if(k >= EXTS.length) return fail();
        const im = new Image();
        im.onload = ()=> ok(im.src);
        im.onerror = ()=>{ k++; next(); };
        im.src = `${base}.${EXTS[k]}`;
      })();
    };
    (function probe(i){
      if(i > MAX) return;
      tryLoad(`assets/workation-photos/photo${i}`, src=>{
        found++;
        const cell = document.createElement('button');
        cell.className = 'ph-wk-ph';
        cell.style.backgroundImage = `url("${src}")`;
        cell.onclick = ()=> openWkPhoto(src, i);
        grid.appendChild(cell);
        probe(i+1);
      }, ()=>{
        if(found === 0) grid.innerHTML = `<div class="ph-wk-empty">No photos yet — drop your snapshots into <b>assets/workation-photos/</b> named <b>photo1.jpg</b>, <b>photo2.jpg</b> … and they'll appear here.</div>`;
      });
    })(1);
  }

  function openApp(id){
    const a = APPS.find(x=>x.id===id);
    appbar.style.background = APPBAR_BG[id];
    appbar.querySelector('.ttl').innerHTML = `${a.en}`;
    content.innerHTML = appHTML(id);
    content.scrollTop = 0;
    if(musicUnsub){ musicUnsub(); musicUnsub=null; }
    // contacts: tap a card to reveal a quote
    if(id==='contacts'){
      content.querySelectorAll('.ph-card').forEach(card=>{
        card.onclick = ()=>{
          const nid = card.getAttribute('data-id');
          const n = NPCS.find(x=>x.id===nid);
          const q = content.querySelector(`.ph-quote[data-q="${nid}"]`);
          const lines = (n.chat&&n.chat.length)?n.chat:n.daily;
          q.textContent = '“' + lines[Math.floor(Math.random()*lines.length)] + '”';
          q.classList.toggle('show');
          if(typeof tone==='function') tone(560,.05,'sine',.04);
        };
      });
      // call / call-back buttons → ring that villager
      content.querySelectorAll('[data-call]').forEach(b=>{
        b.onclick = (e)=>{
          e.stopPropagation();
          const n = NPCS.find(x=>x.id===b.getAttribute('data-call'));
          if(n){ closePhone(); placeCall(n); }
        };
      });
    }
    // music: live transport + track shelf, kept in sync with the radio
    if(id==='music' && window.HaenyeoMusic){
      const M = window.HaenyeoMusic;
      const wire = ()=>{
        content.querySelectorAll('[data-m]').forEach(b=>{
          b.onclick = ()=>{ const a2=b.getAttribute('data-m'); if(a2==='play') M.toggle(); else if(a2==='prev') M.prev(); else M.next(); };
        });
        content.querySelectorAll('[data-mi]').forEach(r=>{
          r.onclick = ()=> M.playIndex(parseInt(r.getAttribute('data-mi'),10));
        });
      };
      wire();
      // re-render when playback state changes (preserve scroll position)
      musicUnsub = M.subscribe(()=>{
        if(!appView.classList.contains('show')) return;
        const sy = content.scrollTop;
        content.innerHTML = appHTML('music'); wire(); content.scrollTop = sy;
      });
    }
    // workation: collapsible day schedule + lazy-loaded photo album
    if(id==='workation'){
      if(wkLB) wkLB.classList.remove('show');
      content.querySelectorAll('.ph-wk-dayh').forEach(hd=>{
        hd.onclick = ()=>{ hd.closest('.ph-wk-day').classList.toggle('open'); if(typeof tone==='function') tone(520,.04,'sine',.04); };
      });
      loadWkPhotos();
    }
    homeView.style.display='none';
    appView.classList.add('show');
  }
  function backHome(){ if(musicUnsub){ musicUnsub(); musicUnsub=null; } appView.classList.remove('show'); homeView.style.display='flex'; }

  /* ---------------- open / close ---------------- */
  function syncTime(){ if(typeof fmtTime==='function' && typeof G!=='undefined') $$('.ph-time').textContent = fmtTime(G.time); }
  function greet(){
    const hr = Math.floor(G.time/60);
    const g = hr<11?'Good morning': hr<17?'Good day': hr<20?'Good evening':'Good night';
    const ge= hr<11?'Good morning': hr<17?'Good day': hr<20?'Good evening':'Good night';
    $$('.ph-hello .h1').textContent = `${ge} 🌊`;
    $$('.ph-hello .h2').textContent = `${ge} · ${seasonName()} · Day ${G.day}`;
  }
  function openPhone(){
    window.phoneOpen = true;
    missed = 0; updateBadge();
    backHome(); syncTime(); greet();
    ov.classList.add('show');
    if(typeof tone==='function') tone(660,.06,'sine',.05);
  }
  function closePhone(){
    window.phoneOpen = false;
    ov.classList.remove('show');
    const nt = $$('.ph-charm-note'); if(nt) nt.classList.remove('show');   // reset the charm note
  }

  /* ---------------- phone calls ---------------- */
  const callRot = {};        // rotate each caller's lines so repeats vary
  const recentCalls = [];    // {id, answered, out}
  let missed = 0;
  let inCall = false;        // a call card (ringing or talking) is on screen
  let ringTimer = null, autoMissTimer = null;
  let callTimer = 55 + Math.random()*45;   // seconds to first incoming call
  let lastTs = performance.now();

  function updateBadge(){ phoneBadge.textContent = String(missed); phoneBadge.classList.toggle('on', missed>0); }
  const callerById = id => (typeof NPCS!=='undefined') ? NPCS.find(n=>n.id===id) : null;
  function callLineFor(n){
    const lines = (n.calls&&n.calls.length)?n.calls:(n.daily||['…']);
    const k=n.id, idx=callRot[k]||0; callRot[k]=idx+1;
    return lines[idx % lines.length];
  }
  function ring(){ if(typeof tone==='function'){ tone(880,.13,'sine',.05); setTimeout(()=>tone(1108,.13,'sine',.05),160); } }
  function clearCallTimers(){ if(ringTimer){clearInterval(ringTimer);ringTimer=null;} if(autoMissTimer){clearTimeout(autoMissTimer);autoMissTimer=null;} }
  // ---- cute gibberish "voice": types the line out with a speech blip per letter ----
  let speakTimer=null;
  function voiceBase(n){ const L=n.look||{}; if(L.elder) return 188; if(n.id==='youngmi') return 330; if(n.id==='migyeong') return 268; return 240; }
  function stopSpeak(){ if(speakTimer){ clearInterval(speakTimer); speakTimer=null; } }
  function speakLine(n, text){
    stopSpeak();
    const base=voiceBase(n); let i=0;
    cLine.textContent='“';
    const vowels='aeiouAEIOU\uac00-\ud7a3';
    speakTimer=setInterval(()=>{
      if(i>=text.length){ cLine.textContent='“'+text+'”'; stopSpeak(); return; }
      const ch=text[i]; cLine.textContent='“'+text.slice(0,i+1);
      if(typeof tone==='function' && ch.trim() && !'.,!?…'.includes(ch)){
        const vowel=/[aeiou\uac00-\ud7a3]/i.test(ch);
        const f=base*(vowel?1.0:1.18)*(0.92+Math.random()*0.16);
        tone(f, vowel?0.085:0.05, 'triangle', 0.05);
      }
      i++;
    }, 46);
  }
  function pushRecent(rc){ recentCalls.unshift(rc); if(recentCalls.length>6) recentCalls.length=6; }

  function showCallCard(n, incoming){
    inCall = true; window.phoneOpen = true;     // pause world input + hide phone button
    callOv.dataset.cid = n.id;
    cAv.innerHTML = avatarSVG(n);
    cName.innerHTML = `${n.roman}`;
    cRole.textContent = n.role||'';
    cLine.textContent=''; cLine.classList.remove('show');
    cEnd.classList.remove('show');
    if(incoming){
      cStatus.style.display='';
      cStatus.textContent='Incoming call…';
      cActions.classList.remove('hide');
      callOv.classList.add('ringing');
      ring(); ringTimer=setInterval(ring,1700);
      autoMissTimer=setTimeout(()=>declineCall(true), 13000);
    } else {
      answeredView(n);
    }
    callOv.classList.add('show');
  }
  function answeredView(n){
    clearCallTimers();
    callOv.classList.remove('ringing');
    cStatus.style.display='none';
    cActions.classList.add('hide');
    cLine.classList.add('show');
    cEnd.classList.add('show');
    speakLine(n, callLineFor(n));     // talk it out with a little voice
    if(typeof G!=='undefined' && G.friendship){
      G.friendship[n.id]=Math.min(MAX_HEARTS*HEART_PTS,(G.friendship[n.id]||0)+5);
    }
  }
  function answerCall(){
    const n=callerById(callOv.dataset.cid); if(!n) return endCall();
    pushRecent({id:n.id, answered:true});
    answeredView(n);
  }
  function declineCall(){
    const n=callerById(callOv.dataset.cid);
    clearCallTimers();
    if(n){ pushRecent({id:n.id, answered:false}); missed++; updateBadge(); }
    endCall();
  }
  function endCall(){
    clearCallTimers();
    stopSpeak();
    callOv.classList.remove('show','ringing');
    inCall=false; window.phoneOpen=false;
    callTimer = 75 + Math.random()*75;       // next call in ~75–150s
  }
  function placeCall(n){                        // user rings a villager from Contacts
    if(inCall) return;
    pushRecent({id:n.id, out:true, answered:true});
    showCallCard(n, false);
  }
  function triggerIncoming(){
    const pool = (typeof NPCS!=='undefined') ? NPCS.filter(n=>n.calls&&n.calls.length) : [];
    if(!pool.length){ callTimer = 60; return; }
    showCallCard(pool[Math.floor(Math.random()*pool.length)], true);
  }
  callOv.querySelector('.accept').onclick = answerCall;
  callOv.querySelector('.decline').onclick = declineCall;
  callOv.querySelector('.call-endbtn').onclick = endCall;
  window.HaenyeoPhoneCall = { place: placeCall };
  btn.onclick = openPhone;
  ov.addEventListener('pointerdown', e=>{ if(e.target===ov) closePhone(); });
  // dolphin-tail keyring: tap the in-phone charm for its note; use the real photo for BOTH charms if present
  { const charm = $$('.ph-charm');
    if(charm) charm.addEventListener('click', e=>{ e.stopPropagation();
      charm.querySelector('.ph-charm-note').classList.toggle('show');
      if(typeof tone==='function') tone(600,.05,'sine',.04); });
    const im = new Image();
    im.onload = ()=>{ document.querySelectorAll('.ph-charm-hang').forEach(h=>{
      h.innerHTML = '<img class="ph-charm-img" src="'+im.src+'" alt="Dolphin-tail keyring">'; }); };
    im.src = 'assets/dolphin-keyring.png?v=2';   // the real keepsake photo (transparent PNG)
  }
  appbar.querySelector('.back').onclick = backHome;
  ov.querySelectorAll('.ph-home-ind').forEach(h=>{
    h.onclick = ()=>{ if(appView.classList.contains('show')) backHome(); else closePhone(); };
  });
  // ESC closes / hangs up
  addEventListener('keydown', e=>{
    if(e.key!=='Escape') return;
    if(inCall){ if(callOv.classList.contains('ringing')) declineCall(); else endCall(); }
    else if(window.phoneOpen) closePhone();
  });

  /* ---------------- button visibility + call scheduling ---------------- */
  const PLAY = ['village','home','shop','market','dive','beach'];
  const CALM = ['village','home','shop','market'];   // calls only ring in calm scenes
  function tick(){
    const now = performance.now(); const dt = Math.min(0.1,(now-lastTs)/1000); lastTs = now;
    let sc; try{ sc = scene; }catch(_){ sc = window.scene; }
    const panelUp = Array.prototype.some.call(document.querySelectorAll('.panel'), p=>!p.classList.contains('hidden'));
    const dlg = document.getElementById('dialogue');
    const dlgUp = dlg && dlg.classList.contains('show');
    const show = PLAY.indexOf(sc)>=0 && !panelUp && !dlgUp && !window.phoneOpen;
    btn.style.display = show ? 'flex' : 'none';
    if(window.phoneOpen) syncTime();
    // count down toward the next incoming call when the coast is clear
    if(!inCall && !window.phoneOpen && !panelUp && !dlgUp && CALM.indexOf(sc)>=0){
      callTimer -= dt;
      if(callTimer<=0) triggerIncoming();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
