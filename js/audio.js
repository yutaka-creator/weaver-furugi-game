'use strict';
/* 古着屋ゲーム専用のオリジナル8bitサウンド。外部音源や通信は不要。 */
window.GameAudio = (() => {
  let ctx = null, master = null, musicBus = null, fxBus = null;
  let enabled = true, running = false, stepTimer = null, nextTime = 0, step = 0;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const BPM = 94, beatSec = 60 / BPM, stepSec = beatSec / 2;
  // 元曲のコピーではない短いオリジナルループ。C major pentatonic寄りの落ち着いた音型。
  const melody = [
    72,null,76,null,79,76,74,null, 72,null,67,null,69,72,74,null,
    76,null,79,81,79,null,76,74, 72,null,69,null,67,null,null,null,
    72,null,76,79,81,null,79,null, 76,null,74,72,69,null,67,null,
    69,null,72,null,76,74,72,null, 67,null,69,72,60,null,null,null
  ];
  const harmony = [48, 45, 41, 43, 48, 45, 41, 43];

  function init() {
    if (!AudioCtx) return false;
    if (ctx) return true;
    ctx = new AudioCtx();
    master = ctx.createGain(); master.gain.value = .55;
    musicBus = ctx.createGain(); musicBus.gain.value = .16;
    fxBus = ctx.createGain(); fxBus.gain.value = .40;
    musicBus.connect(master); fxBus.connect(master); master.connect(ctx.destination);
    return true;
  }
  function awake() { if (!init()) return false; if (ctx.state === 'suspended') ctx.resume().catch(()=>{}); return true; }
  const hz = midi => 440 * Math.pow(2,(midi-69)/12);
  function tone(midi, when, length, opts={}) {
    if (!ctx || !enabled) return;
    const {wave='triangle', gain=.1, bus=fxBus, slide=0} = opts;
    const osc=ctx.createOscillator(), g=ctx.createGain();
    osc.type=wave; osc.frequency.setValueAtTime(hz(midi), when);
    if (slide) osc.frequency.exponentialRampToValueAtTime(hz(midi+slide),when+Math.max(.02,length));
    g.gain.setValueAtTime(.0001,when);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),when+.012);
    g.gain.exponentialRampToValueAtTime(.0001,when+length);
    osc.connect(g);g.connect(bus);osc.start(when);osc.stop(when+length+.025);
  }
  function scheduleBeat(idx,when) {
    const note=melody[idx%melody.length];
    if(note!==null)tone(note,when,stepSec*.68,{wave:'triangle',gain:.18,bus:musicBus});
    if(idx%4===0){
      const chord=harmony[Math.floor(idx/8)%harmony.length];
      tone(chord,when,beatSec*1.4,{wave:'sine',gain:.21,bus:musicBus});
      tone(chord+7,when,beatSec*.95,{wave:'sine',gain:.08,bus:musicBus});
    }
    if(idx%2===0)tone(48+(idx%8===0?0:7),when,.12,{wave:'triangle',gain:.025,bus:musicBus});
  }
  function tick() {
    if(!running || !enabled || !ctx)return;
    while(nextTime<ctx.currentTime+.18){scheduleBeat(step++,nextTime);nextTime+=stepSec;}
  }
  function start() {
    if(!enabled||!awake()||running)return;
    running=true; step=0;nextTime=ctx.currentTime+.08;
    tick();stepTimer=setInterval(tick,90);
  }
  function stop() {
    running=false; if(stepTimer!==null){clearInterval(stepTimer);stepTimer=null;}
    if(ctx&&musicBus){const t=ctx.currentTime;musicBus.gain.cancelScheduledValues(t);musicBus.gain.setValueAtTime(musicBus.gain.value,t);musicBus.gain.linearRampToValueAtTime(0,t+.08);}
  }
  function effect(name) {
    if(!enabled || !awake())return;
    const t=ctx.currentTime+.005;
    const n=(m,delay=0,dur=.09,opt={})=>tone(m,t+delay,dur,{wave:'square',gain:.09,...opt});
    switch(name){
      case 'door': n(79,0,.09);n(84,.11,.18,{wave:'triangle'});break;
      case 'pickup': n(57,0,.07,{wave:'triangle'});break;
      case 'place': n(52,0,.10,{wave:'triangle',gain:.16,slide:-8});break;
      case 'thinking': n(66,0,.07,{wave:'sine'});n(69,.13,.08,{wave:'sine'});break;
      case 'negotiate-ok': n(72,0,.07);n(76,.09,.07);n(79,.18,.14);break;
      case 'negotiate-fail':n(64,0,.12,{slide:-3});n(57,.12,.18,{slide:-6});break;
      case 'sell':n(72,0,.09);n(76,.10,.10);n(79,.21,.10);n(84,.32,.23,{wave:'triangle'});break;
      case 'rare':n(84,0,.09);n(88,.11,.09);n(91,.22,.09);n(96,.33,.24,{wave:'sine'});break;
      case 'result': [72,76,79,84,79,84].forEach((m,i)=>n(m,i*.11,.18,{wave:'triangle'}));break;
      case 'tap':n(72,0,.055,{wave:'triangle'});break;
      default:n(66,0,.065);
    }
  }
  function setEnabled(value) {
    enabled=!!value;
    if(!enabled){stop(); if(ctx&&master){master.gain.setValueAtTime(.0001,ctx.currentTime);}}
    else {if(awake()){master.gain.setValueAtTime(.55,ctx.currentTime);musicBus.gain.setValueAtTime(.16,ctx.currentTime);start();}}
  }
  return {start,stop,effect,setEnabled,isEnabled:()=>enabled};
})();
