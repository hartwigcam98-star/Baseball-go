/* ================= the other side of the ball: pitching for two-way players, fielding moments, baserunning =================
   Pitching (The Bigs style): pick a pitch, tap the zone to aim, then stop the sweeping meter in the green.
   The batter decides whether to swing from the count and where the pitch is; balls in play go to your defence.
   Fielding: when one of your fielders can just get there, a DIVE! / LEAP! button gives you the chance to make the play.
   Baserunning: send a runner on the pitch (STEAL), or stretch a single into a double (GO FOR TWO). */
const MY_PITCHES=st=>{const m=[['FF',50]];if(st.stuff>=30)m.push(['CH',20]);if(st.stuff>=38)m.push(['SL',22]);if(st.stuff>=50)m.push(['CB',16]);if(st.stuff>=62)m.push(['CT',12]);if(st.stuff>=72)m.push(['SP',10]);return m};
function myVelo(st){return Math.round(70+st.velo*0.3)}
function pitchOVR(st){return Math.round((st.velo+st.control+st.stuff)/3)}

/* cfg: {lv, me:{st} (your pitching ratings), bat:{name,contact,power,eye,speed}, sit, teams, onDone} */
function startPitchPA(cfg){
  A={cfg,pitching:true,count:[0,0],pitches:0,state:'paim',pitch:null,ptSeen:[],practice:false,res:null};
  A.cfg.st=cfg.bat;// the batter runs the bases in the play engine
  resetPositions();placeRunners(cfg.sit?cfg.sit.bases:null);
  A.ptype='FF';A.tgt={x:0.1,y:0.62};A.guess=null;renderGuess();
  W3.mark.visible=false;W3.land.visible=false;W3.ball.visible=true;W3.pci.visible=false;W3.zone.visible=true;W3.tring.visible=false;
  $('ab').classList.add('pitching');{const c=pitchCam();W3.camPos.copy(c[0]);W3.camLook.copy(c[1])}renderPitchBar();renderHUD();say('Pick a pitch, tap the zone to aim, then press Pitch.');
}
function renderPitchBar(){const st=A.cfg.me.st,mix=MY_PITCHES(st);
  $('pitchBar').innerHTML=mix.map(([t])=>'<button data-p="'+t+'" aria-pressed="'+(A.ptype===t)+'" style="--pc:'+PT[t].c+'">'+PT[t].s+'</button>').join('');
  $('pitchBar').querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();A.ptype=b.dataset.p;renderPitchBar()})}
/* the meter: a needle sweeps left to right; green is the sweet spot (wider with better control), the red end adds velocity and wildness */
function startMeter(){if(A.state!=='paim')return;A.state='pmeter';A.mT0=now();const c=A.cfg.me.st.control;A.green=[0.68,0.68+0.06+c*0.0012];
  $('pmeter').hidden=false;$('pmGreen').style.left=(A.green[0]*100)+'%';$('pmGreen').style.width=((A.green[1]-A.green[0])*100)+'%';say('Tap in the green!')}
function stopMeter(){if(A.state!=='pmeter')return;const u=clamp((now()-A.mT0)/1000/0.95,0,1.02);$('pmeter').hidden=true;
  const g=A.green,mid=(g[0]+g[1])/2,half=(g[1]-g[0])/2,miss=u>=g[0]&&u<=g[1]?Math.abs(u-mid)/half*0.3:u<g[0]?0.3+(g[0]-u)*2.2:u>0.93?1.0:0.3+(u-g[1])*3;
  const st=A.cfg.me.st,P=PT[A.ptype],turbo=MET.armT;
  let mph=myVelo(st)*P.v*(u<g[0]?0.97:1)+(u>0.93?2:0)+(turbo?5:0)+gauss()*0.6;
  const sd=(0.035+(100-st.control)*0.0009)*(1+2.4*miss),k=(0.7+st.stuff*0.006)*(turbo?1.25:1);
  A.pitch={type:A.ptype,tx:A.tgt.x+gauss()*sd,ty:A.tgt.y+gauss()*sd*0.9,mph,ax:P.ax*k,ay:P.ay*k,turbo,mine:true,quality:1-Math.min(1,miss)};
  if(turbo){MET.armT=false;MET.turbo=Math.max(0,MET.turbo-100);renderMeters()}
  say(miss<0.31?'Right on the money.':miss<0.8?'A little off.':'Yanked it!');
  A.state='wind';A.tW=now();G.pitcher.pose=null;G.pitcher.startSwing('pt',0);A.tRel=A.tW+SWINGS.pt.dur*SWINGS.pt.cf*1000;A.tLoad=A.tRel-430;A.loaded=false;A.pitches++}
/* the batter's decision and what happens if he swings */
function cpuBatter(){const p=A.pitch,cp=pitchPos(p,pitchTimeAtZ(p,0)),inZ=inZone(cp.x,cp.y),b=A.cfg.bat,[balls,str]=A.count,st=A.cfg.me.st;
  const out=Math.max(0,Math.max(Math.abs(cp.x)-ZONE.hw,ZONE.lo-cp.y,cp.y-ZONE.hi));
  let sw=inZ?0.6+(str===2?0.2:0)+(balls===3?0.1:0):clamp(0.34-b.eye*0.0022+(str===2?0.14:0)-out*1.6,0.02,0.55);
  if(Math.random()>=sw)return{swing:false,cp};
  const pq=(st.stuff+st.velo+st.control)/3,brk=Math.hypot(p.ax,p.ay+0)/6,edge=inZ?Math.min(ZONE.hw-Math.abs(cp.x),cp.y-ZONE.lo,ZONE.hi-cp.y):-out;
  const pc=clamp(0.8+(b.contact-pq)*0.006-(inZ?0:0.28+out)-brk*0.05-(p.mph-86)*0.007-(p.turbo?0.08:0)-(1-p.quality)*-0.06,0.2,0.95);
  if(Math.random()>pc)return{swing:true,miss:true,cp};
  if(Math.random()<(inZ?0.36:0.5))return{swing:true,foul:true,cp};
  const mid=clamp(edge/0.12,-1,1);// middle-middle gets punished
  const ev=clamp(87+(b.power-pq)*0.22+mid*5+gauss()*12,40,118),la=11+gauss()*24-(cp.y-0.76)*-18,spray=(-4+gauss()*24)*Math.PI/180;
  return{swing:true,ev,la,spray,cp}}
function stepPitch(dt){const t=now();
  if(A.state==='pmeter'){const u=clamp((t-A.mT0)/1000/0.95,0,1.02);$('pmNeedle').style.left=(u*100)+'%';if(u>=1.02)stopMeter()}
  if(A.state==='wind'){if(!A.loaded&&t>=A.tLoad){A.loaded=true;const b=G.batter;b.pose=null;b.startSwing('ld',0);b.swing.hold=true}
    if(t>=A.tRel){const hw=G.pitcher.handWorld();makePitch(A.pitch,hw);A.state='pitch';A.tR=now();A.tCon=A.tR+pitchTimeAtZ(A.pitch,-0.28)*1000;A.tCatch=A.tR+pitchTimeAtZ(A.pitch,0.92)*1000;
      A.dec=cpuBatter();if(A.dec.swing){A.swingAtT=A.tCon-SWT*1000+gauss()*25}
      sndWhoosh();W3.ball.material.emissive.setHex(A.pitch.turbo?0xFF5A1F:0)}}
  if(A.state==='pitch'){const p=A.pitch,tt=(t-A.tR)/1000;
    if(A.dec.swing&&!A.cswung&&t>=A.swingAtT){A.cswung=true;const b=G.batter;b.pose=null;b.startSwing('sw',0,steerFor(A.dec.cp.x,A.dec.cp.y),1)}
    if(A.dec.swing&&!A.dec.miss&&!A.dec.foul&&t>=A.tCon&&!A.judged){A.judged=true;const hp=pitchPos(p,pitchTimeAtZ(p,-0.28));W3.ball.position.copy(hp);
      const c={ev:A.dec.ev,la:A.dec.la,spray:A.dec.spray,bx:A.dec.cp.x,by:A.dec.cp.y,q:0.5,kind:'play'};A.contact=c;inPlay(c);return}
    if(A.dec.foul&&t>=A.tCon&&!A.judged){A.judged=true;sndBat(0.25,0.1);const B=simBall(55+Math.random()*25,rnd(-10,70),(Math.random()<0.5?-1:1)*rnd(50,80)*Math.PI/180,PARK,{x0:0,y0:A.dec.cp.y,z0:-0.3});A.B=B;A.R={code:'FOUL'};A.state='play';A.tP=now();planPlay(B,A.R);return}
    W3.ball.position.copy(pitchPos(p,Math.min(tt,(A.tCatch-A.tR)/1000)));catcherTrack(p);
    if(t>=A.tCatch){sndGlove(p.mph/95);drawTracer(p);const cp=A.dec.cp,strike=A.dec.swing||inZone(cp.x+gauss()*0.008,cp.y+gauss()*0.008);showMark(cp,strike?0xF28A78:0x74D493);
      if(strike){A.count[1]++;gainTurbo(A.dec.swing?25:20);if(A.count[1]>=3){umpire('Strike three!');gainTurbo(40);endPA({code:'K'});return}umpire('Strike!');say((A.dec.swing?'Swing and a miss':'Called strike')+' · '+Math.round(p.mph)+' mph '+PT[p.type].s)}
      else{A.count[0]++;if(A.count[0]>=4){umpire('Ball four.');endPA({code:'BB'});return}say('Ball · '+locWord(cp.x,cp.y))}
      renderHUD();nextPitchAim()}}
  if(A.state==='play'){if(tickPlay(dt)){if(A.R.code==='FOUL'){if(A.count[1]<2)A.count[1]++;showCall('Foul',false,'');renderHUD();cleanupPlay();W3.pci.visible=false;nextPitchAim()}else finishPlay()}}
  if(A.state==='done'&&now()-A.tDone>1600&&!A.handed){A.handed=true;$('ab').classList.remove('pitching');const cb=A.cfg.onDone;cb&&cb(A.res)}}
function nextPitchAim(){A.state='paim';A.pitch=null;A.dec=null;A.cswung=false;A.judged=false;A.B=null;A.R=null;A.script=null;
  const b=G.batter;if(!(b.swing&&b.swing.type==='sw')){b.swing=null;b.post=null}b.pose='stance';b.pos.set(BATTER_X,0,0.05);b.yaw=Math.PI/2;if(b.bat)b.bat.visible=true;
  const p=G.pitcher;p.swing=null;p.post=null;p.pose='pt';p.poseU=0;p.pos.set(0,0.25,-RUBBER+0.25);p.yaw=0;
  const c=G.catcher;c.pos.set(0,0,1.05);c.pose='cr';c.swing=null;W3.ball.visible=true;FX.tp=[]}
function aimTap(e){if(!A||!A.pitching)return false;if(A.state==='pmeter'){stopMeter();return true}if(A.state!=='paim')return false;
  const p=screenToZone(e.clientX,e.clientY);if(!p)return true;A.tgt={x:clamp(p.x,-0.5,0.5),y:clamp(p.y,0.2,1.35)};return true}
/* the pitching camera: behind the mound, looking in at the plate */
function pitchCam(){const port=W3.cam.aspect<1;return[new T.Vector3(0.7,port?3.1:2.6,-RUBBER-(port?6.2:5.0)),new T.Vector3(0,port?-3.2:-1.2,0)]}
function tgtTick(){if(!W3.tgt){const g=new T.Group(),m=new T.MeshBasicMaterial({color:0xFF5A8A,transparent:true,opacity:0.95,depthTest:false,side:T.DoubleSide});
    g.add(new T.Mesh(new T.RingGeometry(0.05,0.065,32),m));const h=new T.Mesh(new T.PlaneGeometry(0.18,0.012),m),v=new T.Mesh(new T.PlaneGeometry(0.012,0.18),m);g.add(h);g.add(v);g.children.forEach(c=>c.renderOrder=9);W3.tgt=g;W3.scene.add(g)}
  const on=A&&A.pitching&&(A.state==='paim'||A.state==='pmeter');W3.tgt.visible=on;if(on){W3.tgt.position.set(A.tgt.x,A.tgt.y,0.003);W3.tgt.lookAt(W3.cam.position);W3.tgt.scale.setScalar(2.2)}}

/* ---- fielding moments (your defence only): a near miss becomes a chance ---- */
function qteSetup(R){if(!A||!A.pitching||R.out||R.code==='FOUL')return null;
  if(R.robAt)return{kind:'leap',at:R.robAt,label:'LEAP!'};if(R.diveAt)return{kind:'dive',at:R.diveAt,label:'DIVE!'};
  if(R.gDiveAt&&!R.out)return{kind:'gdive',at:R.gDiveAt,label:'DIVE!'};return null}
function qteTick(t){const Q=A.qte;if(!Q||Q.done)return;const tq=Q.at.t,b=$('qte');
  if(t>=tq-0.75&&t<tq+0.12){if(b.hidden){b.hidden=false;b.textContent=Q.label;slowMo(true,0.4);sndCrowd(0.3)}}
  else if(t>=tq+0.12&&!Q.done){Q.done=true;b.hidden=true;slowMo(false)}}
function qteTap(){const Q=A&&A.qte;if(!Q||Q.done)return false;const t=(now()-A.tP)/1000,tq=Q.at.t;if(t<tq-0.75)return false;Q.done=true;$('qte').hidden=true;slowMo(false);
  if(t<tq-0.45){say('Too early!');return true}
  // the play is made: rebuild the result as an out
  const sit=A.cfg.sit,ctx={outs:sit.outs,bases:sit.bases,spd:A.cfg.st.speed,err:0,arm:30},a=Q.at,i=a.i;let R2;
  if(Q.kind==='gdive'){R2={code:'GO',out:1,fielder:i,t:tq,catchAt:[a.x,0.2,a.z],throws:[{from:[a.x,1.2,a.z],to:[B1[0],1.2,B1[1]],t0:tq+0.85,t1:tq+0.85+dist2([a.x,a.z],B1)/31}],dive:true,runs:0,rbi:0,bases:[null,null,null],runnerMoves:[],desc:'grounds out on a diving stop by the '+FNAME[i]};R2=advanceOnGround(R2,ctx,sit.bases.slice(),1,false)}
  else{R2={code:Q.kind==='leap'?'FO':(A.B.la<14?'LO':'FO'),out:1,fielder:i,t:tq,catchAt:[a.x,a.y,a.z],air:true,dive:Q.kind==='dive',robbed:Q.kind==='leap',runs:0,rbi:0,runnerMoves:[],desc:Q.kind==='leap'?'is robbed at the wall by the '+FNAME[i]:'lines out on a diving catch by the '+FNAME[i]};R2=finishOut(R2,ctx,A.B)}
  if(Q.kind==='leap'){A.B=Object.assign({},A.B,{hr:false})}
  A.R=R2;const tP=A.tP;planPlay(A.B,R2);A.tP=tP;cheer(1);sndCrowd(1.1);showCall(Q.kind==='leap'?'Robbed!':Q.kind==='gdive'?'Diving stop!':'Diving catch!',false,'w');return true}

/* ---- baserunning while you bat: steal, and stretching a single ---- */
function stealable(){const s=A&&A.cfg.sit;if(!s||A.pitching||A.practice||A.cfg.mode)return-1;const b=s.bases;if(b[1]!=null&&b[2]==null)return 1;if(b[0]!=null&&b[1]==null)return 0;return-1}
function renderRunBtns(){const st=$('stealBtn');if(!st)return;const k=A&&A.state==='ready'&&!A.steal?stealable():-1;st.hidden=k<0;if(k>=0)st.textContent='Steal '+['2nd','3rd'][k]}
function armSteal(){const k=stealable();if(k<0||!A||A.state!=='ready')return;A.steal={k,spd:A.cfg.sit.bases[k]};$('stealBtn').hidden=true;say('The runner goes on the pitch!')}
function stealTick(){const S=A.steal;if(!S||S.over)return;const t=now();const r=G.runners[S.k];if(!r)return;
  if(A.state==='wind'&&t>=A.tRel-250&&!S.t0)S.t0=t;if(!S.t0)return;
  const v=runV(S.spd),d=Math.min(runDist((t-S.t0)/1000,v,6.5),BASE_L-2.4),a=BASES[S.k+1],n=BASES[S.k+2],dir=n.clone().sub(a).normalize();
  r.pos.copy(a).addScaledVector(dir,(S.k===1?1.5:2.6)+d);r.pos.y=0;r.yaw=Math.atan2(dir.x,dir.z);r._v=v;r.pose=null}
/* the throw down after the pitch is caught: runner time against pop time plus the throw */
function stealResolve(){const S=A.steal;if(!S||S.over)return false;S.over=true;
  const p=A.pitch,tRun=runTime(BASE_L-2.4,runV(S.spd),6.5)+0.25,tCatchFromJump=(A.tCatch-S.t0)/1000,tThrow=tCatchFromJump+0.75+dist2([0,1],BASEXZ[S.k+2])/36+(p&&PT[p.type].v<0.9?0.08:0);
  const safe=tRun+gauss()*0.12<tThrow,sit=A.cfg.sit;
  W3.ball.visible=true;A.stealAnim={t0:now(),to:BASES[S.k+2].clone().setY(1.2),safe};
  if(safe){sit.bases[S.k+1]=S.spd;sit.bases[S.k]=null;showCall('Stolen base!',false,'w');sndCrowd(0.6)}
  else{sit.bases[S.k]=null;sit.outs++;showCall('Caught stealing',false,'l');sndCrowd(0.3)}
  const r=G.runners[S.k];if(r)r.mesh.visible=safe;placeRunners(sit.bases);renderHUD();
  if(!safe&&sit.outs>=3){A.res={code:'CS',noPA:true,out:0,csOut:true,bases:[null,null,null],runs:0,rbi:0,desc:'',endInning:true};A.state='done';A.tDone=now();A.ended=true;return true}
  A.steal=null;return false}
/* a single to the outfield: offer to stretch it */
function stretchSetup(R){if(!A||A.pitching||A.practice||R.code!=='1B'||R.infield||!R.catchAt)return null;if(R.bases&&R.bases[1]!=null)return null;return{t:R.t}}
function stretchTick(t){const S=A.stretch;if(!S||S.done)return;const b=$('qte');if(t>=S.t-0.5&&t<S.t+0.6){if(b.hidden){b.hidden=false;b.textContent='GO FOR TWO'}}else if(t>=S.t+0.6){S.done=true;b.hidden=true}}
function stretchTap(){const S=A&&A.stretch;if(!S||S.done)return false;S.done=true;$('qte').hidden=true;const R=A.R,spd=A.cfg.st.speed,v=runV(spd);
  const tRun=toFirst(spd)+runTime(BASE_L,v,7)*0.93+0.12,tThr=R.t+0.6+dist2([R.catchAt[0],R.catchAt[2]],B2)/(A.cfg.arm||30)+gauss()*0.15;
  const safe=tRun<tThr;R.batterTo=2;
  if(safe){R.code='2B';R.hit=2;R.desc='stretches it into a double';R.bases[1]=spd;R.bases[0]=null;showCall('Safe at second!',false,'w')}
  else{R.out=1;R.desc='singles but is thrown out trying for two';R.bases[0]=null;R.stretchOut=true;showCall('Out at second!',false,'l')}
  const r=A.script.runners.find(x=>x.who==='b');if(r){r.to=2;r.out=!safe;r.T=r.t0+runTime(BASE_L*2,r.v,6.5)+0.25}
  A.script.throws=[{from:[R.catchAt[0],1.4,R.catchAt[2]],to:[B2[0],1.3,B2[1]],t0:R.t+0.6,t1:R.t+0.6+dist2([R.catchAt[0],R.catchAt[2]],B2)/(A.cfg.arm||30)}];
  A.script.end=Math.max(A.script.end,(r?r.T:0)+0.4);return true}
