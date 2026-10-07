/* ================= feel: settings, tap calibration, performance, debug overlay, pitch readability,
   sitting on a zone, and home run replays ================= */
const OPT_KEY='bg-opt';
const OPT=Object.assign({stance:'classic',lat:0,quality:'auto',haptics:true,cam:'normal',speed:'normal',debug:false,replays:true},(()=>{try{return JSON.parse(localStorage.getItem(OPT_KEY))||{}}catch(e){return{}}})());
function saveOpt(){try{localStorage.setItem(OPT_KEY,JSON.stringify(OPT))}catch(e){}}
const SPEEDS={slower:0.86,normal:1,faster:1.12};
const CAMH={low:-0.25,normal:0,high:0.35};

/* ---- settings panel ---- */
function openSettings(back){const p=$('settings');p.hidden=false;CLK.paused=!$('ab').hidden;renderSettings();$('setDone').onclick=()=>{p.hidden=true;if(!$('ab').hidden&&$('pauseMenu').hidden)CLK.paused=false;back&&back()}}
function renderSettings(){
  const row=(lab,key,opts,note)=>'<div class="setrow"><span>'+lab+(note?'<small>'+note+'</small>':'')+'</span><div class="seg">'+opts.map(([v,n])=>'<button data-k="'+key+'" data-v="'+v+'" aria-pressed="'+(String(OPT[key])===String(v))+'">'+n+'</button>').join('')+'</div></div>';
  $('setBody').innerHTML=
    '<div class="setrow"><span>Touch delay<small>Your phone’s delay between touching the glass and the game hearing it. Calibrate it once.</small></span><div class="seg"><b class="num">'+Math.round(OPT.lat)+' ms</b><button id="calGo">Calibrate</button></div></div>'+
    row('Aim','aim',[['auto','Auto'],['lock','Lock-on'],['manual','Manual']],'Auto: you only time the swing.')+
    row('Batting stance','stance',Object.entries(STANCES).map(([k,v])=>[k,v.n]),(STANCES[OPT.stance]||STANCES.classic).d)+
    row('Pitch speed','speed',[['slower','Slower'],['normal','Normal'],['faster','Faster']])+
    row('Graphics','quality',[['auto','Auto'],['high','High'],['low','Low']],'Low turns off shadows and thins the crowd for a smoother game.')+
    row('Camera','cam',[['low','Low'],['normal','Normal'],['high','High']])+
    row('Home run replays','replays',[[true,'On'],[false,'Off']])+
    row('Vibration','haptics',[[true,'On'],[false,'Off']])+
    row('Timing readout','debug',[[true,'On'],[false,'Off']],'Shows your timing in milliseconds after every swing.');
  $('setBody').querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;let v=b.dataset.v;if(v==='true')v=true;else if(v==='false')v=false;
    if(k==='aim'){aimMode=v;try{localStorage.setItem('bg-aim',v)}catch(_){}renderAim()}else OPT[k]=v;
    saveOpt();if(k==='quality')applyQuality();if(k==='stance')applyStance(v);renderSettings()});
  $('calGo').onclick=startCalibration;
  // the aim mode lives in its own key
  $('setBody').querySelectorAll('button[data-k=aim]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===aimMode)))}

/* ---- tap calibration: tap along with eight beats; the average offset is your touch delay ---- */
function startCalibration(){const c=$('calib');c.hidden=false;const dot=$('calDot'),msg=$('calMsg');let beats=[],taps=[],i=0;const N=10,gap=650,t0=performance.now()+900;
  msg.textContent='Tap anywhere on the beat, when the circle flashes.';
  const tick=()=>{if(c.hidden)return;const t=performance.now();
    while(i<N&&t>=t0+i*gap){beats.push(t0+i*gap);dot.className='';void dot.offsetWidth;dot.className='hit';sndTick();i++}
    if(i>=N&&t>t0+N*gap+300){finish();return}requestAnimationFrame(tick)};
  const onTap=e=>{e.preventDefault();taps.push(performance.now());dot.classList.add('tap');setTimeout(()=>dot.classList.remove('tap'),90)};
  const finish=()=>{c.removeEventListener('pointerdown',onTap);
    // pair each tap with its nearest beat, skip the first two while you find the rhythm
    const d=[];for(const tp of taps){let best=null;for(const b of beats){if(best==null||Math.abs(tp-b)<Math.abs(tp-best))best=b}if(best!=null&&Math.abs(tp-best)<300&&beats.indexOf(best)>=2)d.push(tp-best)}
    if(d.length<4){msg.textContent='Not enough taps on the beat. Try again.';setTimeout(()=>{c.hidden=true},1600);return}
    d.sort((a,b)=>a-b);const med=d[Math.floor(d.length/2)];OPT.lat=clamp(Math.round(med),0,200);saveOpt();
    msg.textContent='Your touch delay is '+OPT.lat+' ms. Saved.';setTimeout(()=>{c.hidden=true;renderSettings()},1500)};
  c.addEventListener('pointerdown',onTap);$('calCancel').onclick=e=>{e.stopPropagation();c.hidden=true};requestAnimationFrame(tick)}

/* ---- graphics quality and the automatic performance guard ---- */
const PERF={frames:[],low:false,said:false};
function lowQ(){return OPT.quality==='low'||(OPT.quality==='auto'&&PERF.low)}
function applyQuality(){if(!W3.r)return;const lo=lowQ();W3.r.setPixelRatio(lo?1:Math.min(window.devicePixelRatio||1,2));W3.r.shadowMap.enabled=!lo;if(W3.sun)W3.sun.castShadow=!lo;
  W3.scene&&W3.scene.traverse(o=>{if(o.material&&o.isMesh){const m=o.material;if(Array.isArray(m))m.forEach(x=>x.needsUpdate=true);else m.needsUpdate=true}});onResize()}
function perfFrame(ms){if(OPT.quality!=='auto'||PERF.low)return;PERF.frames.push(ms);if(PERF.frames.length<120)return;
  const avg=PERF.frames.reduce((a,b)=>a+b,0)/PERF.frames.length;PERF.frames=[];
  if(avg>24){PERF.low=true;applyQuality();if(!PERF.said){PERF.said=true;say('Switched to smoother graphics for this phone (Settings to change).')}}}

/* ---- debug: your timing in ms after every swing ---- */
function debugSwing(c){const d=$('dbg');if(!OPT.debug||!c){d.hidden=true;return}d.hidden=false;
  d.textContent=(c.dt>0?'+':'')+Math.round(c.dt*1000)+' ms · window ±'+Math.round(timingWin(A.cfg.st.contact,swingType)*1000)+' · off-center '+(c.d<9?c.d.toFixed(2):'–')+' · delay '+Math.round(OPT.lat)+' ms'}

/* ---- reading pitches: each type spins its own way and shows its colour in the seams; a tracer shows the path ---- */
const SPIN={FF:[-1,0,0,38],SI:[-0.6,0,-0.5,30],CT:[-0.5,0.6,0,30],SL:[0,1,0.3,34],CB:[1,0,0,32],CH:[-0.7,0,-0.3,22],SP:[0.3,0,0,10]};
function ballSpin(dt){const p=A&&A.pitch;if(!p||A.state!=='pitch'){return}const s=SPIN[p.type]||SPIN.FF,ax=new T.Vector3(s[0],s[1],s[2]).normalize();
  W3.ball.rotateOnWorldAxis(ax,s[3]*dt);const seam=W3.ball.children[0];if(seam){const col=A.read?new T.Color(PT[p.type].c):new T.Color(0xC0392B);seam.material.color.copy(col)}}
function drawTracer(p){if(!W3.tracer){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(40*3),3));
    W3.tracer=new T.Line(g,new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.85,depthTest:false}));W3.tracer.renderOrder=6;W3.tracer.frustumCulled=false;W3.scene.add(W3.tracer)}
  const tr=W3.tracer,pa=tr.geometry.attributes.position,tEnd=pitchTimeAtZ(p,0);for(let i=0;i<40;i++){const q=pitchPos(p,tEnd*i/39);pa.setXYZ(i,q.x,q.y,q.z)}pa.needsUpdate=true;
  tr.material.color.set(PT[p.type].c);tr.material.opacity=0.85;tr.visible=true;W3.tracerT=now()}
function tracerTick(){const tr=W3.tracer;if(!tr||!tr.visible)return;const age=(now()-W3.tracerT)/1000;tr.material.opacity=Math.max(0,0.85-Math.max(0,age-1.2)*1.2);if(tr.material.opacity<=0)tr.visible=false}

/* ---- sit on a zone: before the pitch, tap a ninth of the strike zone. Guess right and your circle grows; guess wrong and it shrinks ---- */
function guessCell(x,y){const w=(ZONE.hw-0.037)*2,h=ZONE.hi-ZONE.lo;const cx=Math.floor((x+w/2)/w*3),cy=Math.floor((y-ZONE.lo)/h*3);return cx>=0&&cx<3&&cy>=0&&cy<3?{cx,cy}:null}
function cellCenter(g){const w=(ZONE.hw-0.037)*2,h=ZONE.hi-ZONE.lo;return{x:-w/2+(g.cx+0.5)*w/3,y:ZONE.lo+(g.cy+0.5)*h/3,w:w/3,h:h/3}}
function screenToZone(cx,cy){const ndc=new T.Vector2(cx/window.innerWidth*2-1,-(cy/window.innerHeight)*2+1),rc=new T.Raycaster();rc.setFromCamera(ndc,W3.cam);const o=rc.ray.origin,d=rc.ray.direction;if(Math.abs(d.z)<1e-6)return null;const t=-o.z/d.z;return{x:o.x+d.x*t,y:o.y+d.y*t}}
function trySitOn(e){if(!A||A.state!=='ready')return false;const p=screenToZone(e.clientX,e.clientY);if(!p)return false;const g=guessCell(p.x,p.y);
  if(!g){if(A.guess){A.guess=null;renderGuess();say('Not sitting on anything.')}else say('Tap a part of the zone to sit on it, or just wait for the pitch.');return true}
  if(A.guess&&A.guess.cx===g.cx&&A.guess.cy===g.cy){A.guess=null;renderGuess();say('Not sitting on anything.');return true}
  A.guess=g;renderGuess();say('Sitting on '+['low','middle','up'][g.cy]+' '+['inside','middle','away'][g.cx]+'. Right guess: bigger circle. Wrong: smaller.');return true}
function renderGuess(){if(!W3.guess){W3.guess=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:0x4CA3FF,transparent:true,opacity:0.28,depthTest:false,side:T.DoubleSide}));W3.guess.renderOrder=5;W3.scene.add(W3.guess)}
  const g=A&&A.guess;W3.guess.visible=!!g;if(g){const c=cellCenter(g);W3.guess.position.set(c.x,c.y,0.002);W3.guess.scale.set(c.w,c.h,1)}}
/* how the guess changes your circle for this pitch */
function guessMult(){if(!A||!A.guess||!A.pitch||!A.pitch.R)return 1;const cp=pitchPos(A.pitch,pitchTimeAtZ(A.pitch,0)),g=guessCell(cp.x,cp.y);
  return g&&g.cx===A.guess.cx&&g.cy===A.guess.cy?1.3:0.85}

/* ---- home run replay from a second angle ---- */
function startReplay(){if(!A||!A.B||!OPT.replays)return false;A.replay={t0:now()};A.state='replay';W3.land.visible=false;
  resetPositions();placeRunners(A.cfg.sit?A.cfg.sit.bases:null);if(G.dropped){W3.scene.remove(G.dropped);G.dropped=null}
  // replay the play from contact: the batter's swing, the flight, the trot
  A.script=null;const B=A.B,R=A.R;planPlay(B,R);A.tP=now()+700;const b=G.batter;b.pose=null;b.startSwing('sw',0);b.swing.t=-0.7+SWT;
  $('replayTag').hidden=false;$('ab').classList.add('rp');clipStart();slowMo(true,0.55);W3.pci.visible=false;W3.zone.visible=false;FX.tp=[];return true}
function tickReplay(dt){const t=(now()-A.tP)/1000;if(t<0){const hp=pitchPos(A.pitch,pitchTimeAtZ(A.pitch,-0.28)+t);W3.ball.position.copy(hp);return false}
  const done=tickPlay(dt);if(done||t>6.5){clipStop();$('replayTag').hidden=true;$('ab').classList.remove('rp');slowMo(false);return true}return false}
function replayCam(){const bp=W3.ball.position,far=Math.hypot(bp.x,bp.z),t=(now()-A.tP)/1000;
  // low and wide down the first-base line at contact, then a chase view from behind the batter
  if(t<0.5)return[new T.Vector3(6.5,1.1,-3.5),new T.Vector3(-0.8,1.0,0)];
  return[new T.Vector3(-3+bp.x*0.2,2+Math.min(bp.y,25)*0.3,6+far*0.05),new T.Vector3(bp.x,bp.y*0.9,bp.z)]}
/* a broadcast cut on big contact: half a second from the side, then the follow camera */
function cutCam(){return[new T.Vector3(7,1.4,-5),new T.Vector3(W3.ball.position.x*0.5-0.4,1.1,W3.ball.position.z*0.3)]}

applyStance(OPT.stance);
