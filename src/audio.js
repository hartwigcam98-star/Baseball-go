/* ================= sound: synthesised with Web Audio, no files =================
   the crack of the bat (sharper on the barrel), the pop of the mitt, the pitch's whoosh, crowd murmur and roars,
   and the umpire through the browser's speech voice */
const SND={ctx:null,on:true,amb:null,ambG:null,level:0,buf:{}};
try{SND.on=localStorage.getItem('bg-sound')!=='off'}catch(e){}
function sndInit(){
  if(SND.ctx)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  let c;try{c=SND.ctx=new AC()}catch(e){return false}
  SND.master=c.createGain();SND.master.gain.value=SND.on?0.9:0;SND.master.connect(c.destination);
  const sr=c.sampleRate,noise=c.createBuffer(1,sr*2,sr),d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;SND.buf.noise=noise;
  const br=c.createBuffer(1,sr*4,sr),bd=br.getChannelData(0);let l=0;for(let i=0;i<bd.length;i++){l=(l+0.02*(Math.random()*2-1))/1.02;bd[i]=l*3.5}SND.buf.brown=br;
  const src=c.createBufferSource();src.buffer=br;src.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=380;bp.Q.value=0.6;
  const g=SND.ambG=c.createGain();g.gain.value=0;src.connect(bp);bp.connect(g);g.connect(SND.master);src.start();
  return true}
function sndResume(){if(!sndInit())return;if(SND.ctx.state==='suspended')SND.ctx.resume();sndAmbience()}
function sndToggle(){SND.on=!SND.on;try{localStorage.setItem('bg-sound',SND.on?'on':'off')}catch(e){}if(SND.master)SND.master.gain.setTargetAtTime(SND.on?0.9:0,SND.ctx.currentTime,0.05);if(!SND.on&&window.speechSynthesis)speechSynthesis.cancel();return SND.on}
function sndReady(){return SND.ctx&&SND.on&&SND.ctx.state==='running'}
function burst(dur,type,freq,q,gain,when){const c=SND.ctx,t=c.currentTime+(when||0),s=c.createBufferSource();s.buffer=SND.buf.noise;
  const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(gain,t+0.002);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(SND.master);s.start(t,Math.random()*1.5);s.stop(t+dur+0.05)}
function tone(freq,dur,gain,type,f1,when){const c=SND.ctx,t=c.currentTime+(when||0),o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(freq,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(SND.master);o.start(t);o.stop(t+dur+0.02)}
/* wood on leather: a barrel is a sharp crack, a jam or a tip is a dull thud */
function sndBat(pw,q){if(!sndReady())return;q=q||0;const sharp=clamp(q,0,1);
  burst(0.06+sharp*0.05,'bandpass',900+sharp*1800,0.9+sharp,0.5+pw*0.5);burst(0.03,'highpass',3000+sharp*2000,0.7,0.2+sharp*0.5);tone(170+sharp*160,0.09,0.3,'triangle',90);
  if(sharp>0.7)burst(0.25,'bandpass',2400,4,0.12,0.01)}
function sndGlove(k){if(!sndReady())return;k=clamp(k||0.7,0.2,1.2);burst(0.05,'lowpass',900,0.9,0.6*k);tone(120,0.05,0.35*k,'sine',70)}
function sndWhoosh(){if(!sndReady())return;burst(0.25,'bandpass',600,0.6,0.06)}
function sndCrowd(a){if(!sndReady())return;const c=SND.ctx,t=c.currentTime,s=c.createBufferSource();s.buffer=SND.buf.brown;
  const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=1.2;f.frequency.setValueAtTime(500,t);f.frequency.linearRampToValueAtTime(760,t+0.5);
  const z=(typeof PARK!=='undefined'&&PARK.crowd)||0.5,g=c.createGain(),pk=clamp(a,0,1.4)*0.5*(0.3+z),dur=1.2+a*1.8;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+0.3);g.gain.setValueAtTime(pk,t+dur*0.4);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(SND.master);s.start(t,Math.random()*2);s.stop(t+dur+0.1)}
function sndAmbience(){if(!SND.ambG||!SND.ctx)return;const z=(typeof PARK!=='undefined'&&PARK.crowd)||0.3,target=SND.on?0.03*(0.3+z):0;SND.ambG.gain.setTargetAtTime(target,SND.ctx.currentTime,0.6)}
function speak(txt,o){if(!SND.on||!window.speechSynthesis)return;try{const u=new SpeechSynthesisUtterance(txt);u.rate=(o&&o.rate)||1.1;u.pitch=(o&&o.pitch)||0.8;u.volume=0.9;u.lang='en-US';speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
function umpire(word){speak(word.replace(/[.!]$/,'!'),{rate:1.15,pitch:0.75})}
