(function(){
'use strict';
const $=id=>document.getElementById(id);
const T=THREE;
const CHAR_BASE=window.CHAR_BASE||'https://hartwigcam98-star.github.io/Tennis-go/chars/';
const SECTIONS=['title','select','create','hub','decide','season','pregame','ab','result','records','between'];
function show(id){SECTIONS.forEach(s=>{const e=$(s);if(e)e.hidden=s!==id});if(id!=='ab')window.scrollTo(0,0);if(id==='ab')onResize()}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rnd(a,b){return a+Math.random()*(b-a)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function gauss(){return Math.sqrt(-2*Math.log(Math.random()+1e-9))*Math.cos(6.2832*Math.random())}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
const PSCALE=0.95;
const W3={};
/*@FX*/
const now=()=>GT;
/*@PLAY*/
/*@RIG*/
/*@PARK*/
/*@AUDIO*/

/* ================= roster ================= */
/* the golf and tennis characters; their shape (1-10) becomes baseball tools */
const ROSTER=[
 ['boss','The Boss','Beer-league legend, 40 years running',6,5,5,6,6,5,6],
 ['granny','Coach Dot','Retired PE teacher, whistle included',2,10,5,7,8,1,7],
 ['brute','Brick','Strongman, all power',10,3,4,3,3,6,4],
 ['ch09','Scout','Little League all-star, age 12',3,5,10,6,6,3,8],
 ['ch43','El Chupacabra','Lucha libre legend, Sunday softball',8,3,5,4,3,10,6],
 ['ch06','Dex','College athlete, headphones on',8,8,5,3,3,6,8],
 ['remy','Remy','Twilight-league regular',5,6,5,6,8,3,5],
 ['ty','Ty','Sketchbook kid, scarf in July',1,5,8,8,5,6,4],
 ['vegas','Big Vegas','Lounge singer, plays in the jumpsuit',10,1,6,5,5,6,3],
 ['peasant','Farmer Hob','Grows hay, hits it low',8,6,3,5,5,6,9],
 ['ch01','Gary','Sales rep, Friday afternoons',5,8,5,6,6,3,3],
 ['ch08','Marco','Personal trainer, first lesson',8,5,8,3,3,6,9],
 ['ch12','Jordan','Bat boy turned prospect',5,6,5,8,7,2,8],
 ['ch17','Mack','Site foreman, plays in work boots',10,3,5,3,6,6,7],
 ['ch23','Preston','New bat every month',6,7,6,5,5,4,4],
 ['ch24','Shadow','Takes batting practice at dawn',5,6,8,6,3,5,7],
 ['ch28','Andre','Hitting coach on his day off',8,8,5,3,5,4,6],
 ['ch31','Nina','College player, four-year starter',4,7,5,6,8,3,8],
 ['ch39','Master Ko','Ninety years old, still hits .300',1,7,6,8,8,3,2],
 ['ch42','Danny','Summer job mowing the outfield',8,3,8,5,3,6,6]
].map(([id,name,nick,pow,ctl,imp,sg,putt,spin,sta])=>({id,name,nick,shape:{contact:ctl,power:pow,eye:putt,speed:Math.round((imp+sg)/2),field:Math.round((sg+sta)/2),arm:Math.round((pow+spin)/2),velo:Math.round((pow*2+sta)/3),control:ctl,stuff:spin}}));
const RBYID=Object.fromEntries(ROSTER.map(r=>[r.id,r]));
const LIGHT=['ch24','ch09','ch39','brute','remy','ty','peasant','vegas'];
const BAT=[['contact','Contact','Bigger contact zone, fewer whiffs'],['power','Power','Exit velocity: how hard you hit it'],['eye','Eye','Read pitches sooner, more walks'],['speed','Speed','Beat out grounders, take extra bases']];
const GLOVE=[['field','Fielding','Range and sure hands (simulated for now)'],['arm','Arm','Throws across the diamond (simulated for now)']];
const PITCH=[['velo','Velocity','Fastball speed'],['control','Control','Hit your spots'],['stuff','Stuff','How much your pitches move']];
function prime(c,k){return Math.round(40+c.shape[k]*5.5)}// a character's ceiling shape on the 0-99 scale
function ovrBat(s){return Math.round(s.contact*0.32+s.power*0.26+s.eye*0.16+s.speed*0.1+s.field*0.1+s.arm*0.06)}

/* ================= pitches =================
   ax: sideways break (+ toward first base, i.e. glove side for a right-hander), ay: induced vertical break, both m/s² on top of gravity.
   v: speed as a share of the pitcher's fastball. */
const PT={
  FF:{n:'Four-seam fastball',s:'Fastball',v:1,ax:-2.6,ay:5.2,c:'#F28A78'},
  SI:{n:'Sinker',s:'Sinker',v:0.97,ax:-6.4,ay:1.4,c:'#F5A524'},
  CT:{n:'Cutter',s:'Cutter',v:0.93,ax:2.8,ay:2.8,c:'#E6C35C'},
  SL:{n:'Slider',s:'Slider',v:0.87,ax:5.8,ay:-0.6,c:'#74D493'},
  CB:{n:'Curveball',s:'Curveball',v:0.8,ax:3.4,ay:-6.6,c:'#4CA3FF'},
  CH:{n:'Changeup',s:'Changeup',v:0.86,ax:-5.4,ay:1.6,c:'#C792EA'},
  SP:{n:'Splitter',s:'Splitter',v:0.88,ax:-2.2,ay:-3.2,c:'#9FD8E8'}
};
const ZONE={hw:0.25,lo:0.46,hi:1.07};// half width incl. the ball, bottom and top (m) at the front of the plate
function inZone(x,y){return Math.abs(x)<=ZONE.hw&&y>=ZONE.lo&&y<=ZONE.hi}

/* ================= 3D scene ================= */
function initGL(){
  if(W3.r)return;
  const canvas=$('gl');
  const r=W3.r=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;
  const s=W3.scene=new T.Scene();
  W3.cam=new T.PerspectiveCamera(45,1,0.1,600);
  s.add(W3.hemi=new T.HemisphereLight(0xdfefff,0x5a6b4a,1.2));
  const sun=W3.sun=new T.DirectionalLight(0xfff3dd,2.4);sun.position.set(-30,60,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  const sc=sun.shadow.camera;sc.left=-40;sc.right=40;sc.top=45;sc.bottom=-45;sc.near=1;sc.far=160;sun.shadow.bias=-0.0005;sun.target.position.set(0,0,-20);s.add(sun);s.add(sun.target);
  fxInit(s);
  W3.ball=new T.Mesh(new T.SphereGeometry(0.037,16,12),new T.MeshStandardMaterial({color:0xF7F4EC,roughness:.5}));W3.ball.castShadow=true;s.add(W3.ball);
  {const seam=new T.Mesh(new T.TorusGeometry(0.03,0.004,4,24),new T.MeshBasicMaterial({color:0xC0392B}));W3.ball.add(seam)}
  W3.bshadow=new T.Mesh(new T.CircleGeometry(0.06,16),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.3,depthWrite:false}));W3.bshadow.rotation.x=-Math.PI/2;s.add(W3.bshadow);
  // strike zone, plate coverage indicator (PCI), pitch marker, landing marker
  const zg=new T.BufferGeometry().setFromPoints([new T.Vector3(-1,0,0),new T.Vector3(1,0,0),new T.Vector3(1,0,0),new T.Vector3(1,1,0),new T.Vector3(1,1,0),new T.Vector3(-1,1,0),new T.Vector3(-1,1,0),new T.Vector3(-1,0,0)]);
  W3.zone=new T.LineSegments(zg,new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.4,depthTest:false}));W3.zone.renderOrder=5;W3.zone.scale.set(ZONE.hw-0.037,ZONE.hi-ZONE.lo,1);W3.zone.position.set(0,ZONE.lo,0);s.add(W3.zone);
  const pci=W3.pci=new T.Group();
  const ring=new T.Mesh(new T.RingGeometry(0.9,1,48),new T.MeshBasicMaterial({color:0xD3E86B,transparent:true,opacity:0.95,depthTest:false,side:T.DoubleSide}));
  const fill=new T.Mesh(new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:0xD3E86B,transparent:true,opacity:0.12,depthTest:false,side:T.DoubleSide}));
  const dot=new T.Mesh(new T.CircleGeometry(0.16,20),new T.MeshBasicMaterial({color:0xD3E86B,transparent:true,opacity:0.9,depthTest:false,side:T.DoubleSide}));
  pci.add(fill);pci.add(ring);pci.add(dot);pci.children.forEach(c=>c.renderOrder=6);W3.pciRing=ring;W3.pciFill=fill;W3.pciDot=dot;s.add(pci);
  W3.mark=new T.Mesh(new T.CircleGeometry(0.037,20),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.95,depthTest:false,side:T.DoubleSide}));W3.mark.renderOrder=7;W3.mark.visible=false;s.add(W3.mark);
  W3.markRing=new T.Mesh(new T.RingGeometry(0.045,0.06,24),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.95,depthTest:false,side:T.DoubleSide}));W3.markRing.renderOrder=7;W3.mark.add(W3.markRing);
  W3.land=new T.Mesh(new T.RingGeometry(0.6,0.8,32).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0xD3E86B,transparent:true,opacity:0.8,depthWrite:false}));W3.land.visible=false;s.add(W3.land);
  W3.camPos=new T.Vector3(0.4,1.8,4.6);W3.camLook=new T.Vector3(-0.2,1,-6);
  window.addEventListener('resize',onResize);
  requestAnimationFrame(loop);
}
function onResize(){if(!W3.r)return;const w=window.innerWidth,h=window.innerHeight;W3.r.setSize(w,h,false);W3.cam.aspect=w/h;
  // keep about 30 degrees of view across in portrait
  const a=w/h;W3.cam.fov=a<1?clamp(2*Math.atan(Math.tan(15*Math.PI/180)/a)*180/Math.PI,40,64):36;W3.cam.updateProjectionMatrix()}

/* ================= the at-bat engine =================
   One live plate appearance at a time, inside a loaded scene (park, batter, pitcher, catcher, seven fielders, runners). */
let G=null;// the loaded scene: {park, batter, pitcher, catcher, fielders[], runners[]}
let A=null;// the current plate appearance
const SWT=SWINGS.sw.dur*SWINGS.sw.cf;// tap to contact, seconds
const BATTER_X=-0.86;
const STYPES={contact:{n:'Contact',pci:1.28,ev:0.9,tw:1.18},normal:{n:'Normal',pci:1,ev:1,tw:1},power:{n:'Power',pci:0.74,ev:1.09,tw:0.85}};
let swingType='normal';
/* load characters and build the scene. cfg: {park, batterId, pitcherId, fielderIds:[a,b], homeColor, defHue, myHue} */
async function setupScene(cfg){
  initGL();show('ab');$('loading').hidden=false;$('loadMsg').textContent='Loading the ballpark…';
  W3.homeColor=cfg.homeColor||0x2E5FA8;
  if(G)disposeScene();
  buildPark(cfg.park);
  const fid=cfg.fielderIds&&cfg.fielderIds.length?cfg.fielderIds:[pick(LIGHT),pick(LIGHT)];
  const ids=[cfg.batterId,cfg.pitcherId,...fid,cfg.runnerId||fid[0]];
  $('loadMsg').textContent='Players warming up…';
  const Ds=await loadChars(ids);
  const s=W3.scene,mk=(D,o)=>new Player(D,D===R3BOSS,s,o);
  G={cfg,batter:mk(Ds[0],{bat:true}),pitcher:mk(Ds[1],{glove:true,variant:cfg.defHue!=null?{h:cfg.defHue,t:0}:null}),fielders:[],runners:[]};
  G.catcher=mk(Ds[2],{glove:true,variant:{h:cfg.defHue||0,t:0}});
  for(let i=3;i<=9;i++)G.fielders[i]=mk(Ds[i%2?2:3],{glove:true,lite:i>=7,variant:{h:cfg.defHue||0,t:0}});
  G.fielders[1]=G.pitcher;G.fielders[2]=G.catcher;
  for(let i=0;i<3;i++){const r=mk(Ds[4],{variant:{h:cfg.myHue||0,t:0}});r.mesh.visible=false;G.runners.push(r)}
  G.batter.pose='stance';G.catcher.pose='cr';
  resetPositions();
  // calibrate where the sweet spot is at contact for this batter, so the swing can be steered to the pitch
  calibrateSwing();
  $('loading').hidden=true;
}
function disposeScene(){const all=[G.batter,G.pitcher,G.catcher,...G.fielders.slice(3),...G.runners];all.forEach(p=>p&&p.dispose(W3.scene));G=null}
function resetPositions(){
  const b=G.batter;b.pos.set(BATTER_X,0,0.05);b.yaw=Math.PI/2;b.pose='stance';b.swing=null;b.post=null;if(b.bat){b.bat.visible=true}b.mesh.visible=true;
  const p=G.pitcher;p.pos.set(0,0.25,-RUBBER+0.25);p.yaw=0;p.pose='pt';p.poseU=0;p.swing=null;p.post=null;
  const c=G.catcher;c.pos.set(0,0,1.05);c.yaw=Math.PI;c.pose='cr';c.swing=null;
  for(let i=3;i<=9;i++){const f=G.fielders[i];f.pos.set(FPOS[i][0],0,FPOS[i][1]);f.yaw=Math.atan2(-f.pos.x,-f.pos.z);f.pose='rf';f.swing=null;f.post=null;f.mv={x:f.pos.x,z:f.pos.z,vx:0,vz:0}}
  G.pitcher.mv={x:0,z:-RUBBER+0.25,vx:0,vz:0};G.catcher.mv={x:0,z:1.05,vx:0,vz:0};
}
function calibrateSwing(){const b=G.batter;b.startSwing('sw',SWINGS.sw.dur*SWINGS.sw.cf);b.update(0);b.update(0);const sp=b.batPoint(54);b.swing=null;b.pose='stance';
  // nominal sweet spot in the batter's frame (relative to his position)
  G.sweet=sp.clone().sub(b.pos);for(let i=0;i<3;i++)b.update(0.1)}
/* runner figures on base, a step off the bag toward the next one */
function placeRunners(bases){for(let k=0;k<3;k++){const r=G.runners[k];if(bases&&bases[k]!=null){const a=BASES[k+1],n=BASES[(k+2)%4],d=n.clone().sub(a).normalize();r.mesh.visible=true;r.pos.copy(a).addScaledVector(d,k===2?1.5:2.6);r.pos.y=0;r.yaw=Math.atan2(-r.pos.x,-r.pos.z)+Math.PI;r.yaw=Math.atan2(d.x,d.z);r.pose='rf';r.mv=null}else r.mesh.visible=false}}

/* ---- pitchers ---- */
function choosePitch(pi,count){
  const [b,s]=count,mix=pi.mix,tot=mix.reduce((a,m)=>a+m[1],0);
  // behind in the count: lean on the fastball; two strikes: more breaking balls
  let r=Math.random()*tot,type=mix[0][0];
  const adj=mix.map(([t,w])=>[t,w*(t==='FF'||t==='SI'?(b>=3?2:b>s?1.4:s===2?0.8:1):(s===2?1.35:1))]),tot2=adj.reduce((a,m)=>a+m[1],0);r=Math.random()*tot2;
  for(const [t,w] of adj){if((r-=w)<=0){type=t;break}}
  const pz=b>=3?0.85:s===2&&b<2?0.38:b>s?0.65:0.52;let tx,ty;
  if(Math.random()<pz){// in the zone, working the edges
    tx=pick([-1,1])*rnd(0.04,0.21);ty=rnd(ZONE.lo+0.05,ZONE.hi-0.05);if(Math.random()<0.5)ty=Math.random()<0.6?rnd(ZONE.lo+0.03,ZONE.lo+0.2):rnd(ZONE.hi-0.18,ZONE.hi-0.03)}
  else{// chase: breaking balls low and away, fastballs up
    const P=PT[type];if(P.ay<0||type==='CH'||type==='SP'){ty=rnd(0.2,0.42);tx=rnd(-0.1,0.38)}else if(type==='SL'||type==='CT'){tx=rnd(0.3,0.5);ty=rnd(0.35,0.8)}else{ty=rnd(1.12,1.32);tx=rnd(-0.25,0.25)}}
  const sd=0.15-pi.control*0.0009;tx+=gauss()*sd;ty+=gauss()*sd*0.9;
  const mph=pi.velo*PT[type].v+gauss()*0.8,k=0.7+pi.stuff*0.006;
  return{type,tx,ty,mph,ax:PT[type].ax*k,ay:PT[type].ay*k}}
/* trajectory: constant acceleration (gravity + break + a little drag) solved so it crosses the front of the plate at (tx,ty) */
function makePitch(p,R){const v=p.mph*MPH,dz=-R.z,Tf=dz/(v*0.955),ax=p.ax,ay=-9.81+p.ay,az=v*0.09/Tf;
  const v0=new T.Vector3((p.tx-R.x-0.5*ax*Tf*Tf)/Tf,(p.ty-R.y-0.5*ay*Tf*Tf)/Tf,(dz-0.5*az*Tf*Tf)/Tf);
  return Object.assign(p,{R:R.clone(),v0,a:new T.Vector3(ax,ay,az),Tf})}
function pitchPos(p,t){return new T.Vector3(p.R.x+p.v0.x*t+0.5*p.a.x*t*t,p.R.y+p.v0.y*t+0.5*p.a.y*t*t,p.R.z+p.v0.z*t+0.5*p.a.z*t*t)}
function pitchTimeAtZ(p,z){// solve R.z + v0.z t + a.z t²/2 = z
  const a=0.5*p.a.z,b=p.v0.z,c=p.R.z-z;if(Math.abs(a)<1e-6)return-c/b;const d=b*b-4*a*c;return(-b+Math.sqrt(Math.max(0,d)))/(2*a)}

/* ---- contact ---- */
/* bx,by: where the ball crosses the plate; px,py: PCI centre; dt: swing timing error (s, + = late) */
function contactOf(bx,by,px,py,dt,st,styp,p){
  const S=STYPES[styp],c=st.contact,rx=(0.085+c*0.00085)*S.pci,ry=rx*0.8,tw=(0.048+c*0.0003)*S.tw;
  const ox=(bx-px)/rx,oy=(by-py)/ry,d=Math.hypot(ox,oy),qt=Math.abs(dt)/tw;
  if(d>1.22||qt>1.45)return{kind:'whiff',d,qt};
  if(d>1||qt>1){return Math.random()<0.55?{kind:'foul',tip:Math.random()<0.25,d,qt}:{kind:'whiff',d,qt}}
  const q=clamp(1-d*d*0.55-qt*qt*0.6,0,1);
  const base=(80+st.power*0.27)*S.ev,ev=clamp(base*(0.58+0.42*q)+gauss()*2.5-(p?Math.max(0,PT[p.type].v<0.9?1:0):0),35,121);
  // under the ball (PCI low) lifts it; over the ball beats it into the ground
  let la=11-oy*34+(by-0.76)*-14+gauss()*7;if(qt>0.75)la+=gauss()*14;
  // early pulls (to left for a right-handed hitter), late goes the other way; where the pitch is matters too
  let spray=dt/tw*34+bx*42+gauss()*8;
  return{kind:'play',ev,la:clamp(la,-60,80),spray:spray*Math.PI/180,q,d,qt}}

/* ================= plate appearance flow =================
   cfg: {st (batter ratings), pitcher, sit:{inning,half,outs,bases,score,count}, practice, label, onDone(result)} */
function startPA(cfg){
  A={cfg,count:[0,0],pitches:0,state:'ready',t0:now()+rnd(900,1500),pitch:null,swing:null,log:[],res:null,practice:!!cfg.practice,ptSeen:[]};
  resetPositions();placeRunners(cfg.sit?cfg.sit.bases:null);
  W3.mark.visible=false;W3.land.visible=false;W3.ball.visible=true;FX.tp=[];
  A.pci={x:0,y:0.76};W3.pci.visible=true;W3.zone.visible=true;
  renderHUD();say(cfg.intro||'Drag to aim, tap to swing.');
}
function nextPitchSoon(ms){A.state='ready';A.t0=now()+(ms||rnd(1200,1900));A.pitch=null;A.swing=null;A.contact=null;A.judged=false;A.whiff=false;A.foulPlay=false;A.B=null;A.R=null;A.script=null;
  const b=G.batter;b.swing=null;b.post=null;b.pose='stance';b.pos.set(BATTER_X,0,0.05);b.yaw=Math.PI/2;if(b.bat)b.bat.visible=true;
  const p=G.pitcher;p.swing=null;p.post=null;p.pose='pt';p.poseU=0;p.pos.set(0,0.25,-RUBBER+0.25);p.yaw=0;
  const c=G.catcher;c.pos.set(0,0,1.05);c.pose='cr';c.swing=null;
  W3.ball.visible=true;FX.tp=[];}
function deliver(){
  const pi=A.cfg.pitcher;A.pitch=choosePitch(pi,A.count);A.state='wind';A.tW=now();G.pitcher.pose=null;G.pitcher.startSwing('pt',0);
  A.tRel=A.tW+SWINGS.pt.dur*SWINGS.pt.cf*1000;A.tLoad=A.tRel-430;A.loaded=false;A.pitches++;
}
function release(){
  const p=G.pitcher,hw=p.handWorld();
  makePitch(A.pitch,hw);A.state='pitch';A.tR=now();
  A.tPlate=A.tR+pitchTimeAtZ(A.pitch,0)*1000;A.tCon=A.tR+pitchTimeAtZ(A.pitch,-0.28)*1000;
  // the catcher sets up where the pitch is headed
  A.catchZ=0.92;A.tCatch=A.tR+pitchTimeAtZ(A.pitch,A.catchZ)*1000;
  // reading the pitch: a sharper eye names it sooner
  const eye=A.cfg.st.eye;A.tRead=A.tR+clamp(330-eye*2.6,60,300);A.read=false;
  sndWhoosh();
}
/* the swing: tDown is when the finger touched (taps are judged from the touch, not the lift) */
function swingAt(tDown){
  if(!A||A.swing)return;if(A.state!=='pitch'&&A.state!=='wind')return;
  if(A.state==='wind'&&now()<A.tRel-120){say('Wait for the pitch.');return}
  A.swing={t:tDown,type:swingType,pci:{x:A.pci.x,y:A.pci.y}};
  const b=G.batter,el=Math.max(0,(now()-tDown)/1000);
  // steer the bat toward the PCI: the hands move with it (only partly, the swing still has its shape)
  const off=steerFor(A.swing.pci.x,A.swing.pci.y);
  b.pose=null;b.startSwing('sw',Math.min(el,SWT*0.9),off,1);hapticTap();
}
function steerFor(x,y){const b=G.batter;if(!G.sweet)return null;
  // the sweet spot nominally sits at G.sweet (world, relative to the batter); move the hands so it lands on (x,y, contact plane)
  const want=new T.Vector3(x,y,-0.25).sub(b.pos),d=want.sub(G.sweet);
  // world -> batter rig (yaw +90°: rig z = world x, rig x = -world z), in rig centimetres
  const k=100/(PSCALE*b.sz);
  return{hand:[-d.z*k*0.7,d.y*k*0.9,d.x*k*0.85],rd:[0,-d.y*0.6,0]}}
function judgeContact(){
  const s=A.swing,p=A.pitch,tc=s.t+SWT*1000,dt=(tc-A.tCon)/1000;
  const bp=pitchPos(p,pitchTimeAtZ(p,0));
  const res=contactOf(bp.x,bp.y,s.pci.x,s.pci.y,dt,A.cfg.st,s.type,p);A.contact=res;A.contact.dt=dt;A.contact.bx=bp.x;A.contact.by=bp.y;
  return res}
function pitchInfo(){const p=A.pitch;return Math.round(p.mph)+' mph '+PT[p.type].s}
function locWord(x,y){const v=y>ZONE.hi?'up':y<ZONE.lo?'low':'',h=x>ZONE.hw?'away':x<-ZONE.hw?'inside':'';return(v&&h?v+' and '+h:v||h||'')}
function callPitch(){
  const p=A.pitch,bp=pitchPos(p,pitchTimeAtZ(p,0)),strike=inZone(bp.x+gauss()*0.008,bp.y+gauss()*0.008);
  showMark(bp,strike?0xF28A78:0x74D493);A.ptSeen.push({x:bp.x,y:bp.y,type:p.type,res:strike?'S':'B'});
  if(strike){A.count[1]++;if(A.count[1]>=3){umpire('Strike three!');endPA({code:'K',kLooking:true});return}umpire('Strike!');say('Called strike · '+pitchInfo()+(locWord(bp.x,bp.y)?'':''))}
  else{A.count[0]++;if(A.count[0]>=4){umpire('Ball four.');endPA({code:'BB'});return}say('Ball · '+pitchInfo()+' · '+locWord(bp.x,bp.y))}
  renderHUD();}
function showMark(bp,col){W3.mark.visible=true;W3.mark.position.set(bp.x,bp.y,0);W3.mark.material.color.setHex(col);W3.markRing.material.color.setHex(col)}
/* ball in play: fly it, let the defence resolve it, then animate the play */
function inPlay(c){
  const sit=A.cfg.sit||{outs:0,bases:[null,null,null]},bat=A.cfg.st;
  const B=simBall(c.ev,c.la,c.spray,PARK,{x0:c.bx*0.5-0.1,y0:c.by,z0:-0.3});
  const R=resolvePlay(B,{outs:A.practice?0:sit.outs,bases:A.practice?[null,null,null]:sit.bases,spd:bat.speed,err:A.cfg.errRate||0.02,arm:A.cfg.arm||30});
  A.B=B;A.R=R;A.state='play';A.tP=now();
  const pw=c.ev/110;sndBat(pw,c.q);onContact(W3.ball.position.clone(),c.ev,c.q>0.85);
  if(R.code==='FOUL'){A.foulPlay=true}
  planPlay(B,R);
}
/* the play script: fielders, throws, runners */
function planPlay(B,R){
  const S=A.script={fielder:R.fielder,tCatch:R.t,catchAt:R.catchAt,throws:R.throws||[],end:0,runners:[]};
  const air=!!R.air;
  // the end of the play: last throw arrives, the catch is made, or the ball stops
  let end=R.code==='HR'&&!R.inside?Math.min(B.T,6.5):R.code==='FOUL'?Math.min(B.T,2.6):(R.t||B.T)+0.4;
  // extra-base hits and singles: the fielder throws it back toward the infield
  if(!R.out&&R.code!=='HR'&&R.code!=='FOUL'&&R.catchAt){const to=BASEXZ[Math.min(3,(R.batterTo||1)+1)%4],from=R.catchAt,d=Math.hypot(to[0]-from[0],to[1]-from[2]);
    S.throws=[{from:[from[0],1.4,from[2]],to:[to[0],1.3,to[1]],t0:R.t+0.6,t1:R.t+0.6+d/30}]}
  if(R.carry)end=Math.max(end,R.carry.t1+0.3);
  for(const t of S.throws)end=Math.max(end,t.t1+0.35);
  // runners: batter from home, then whoever was on base
  const v=runV(A.cfg.st.speed);
  if(R.code==='FOUL'){S.end=Math.min(B.T,2.4);W3.pci.visible=false;W3.zone.visible=false;return}
  const bt=R.code==='HR'&&!R.inside?4:Math.max(1,R.batterTo||1),bOut=R.out&&R.code!=='FC'&&R.code!=='E';
  S.runners.push({who:'b',from:0,to:bt,v:R.code==='HR'&&!R.inside?5.2:v,t0:0.5,out:bOut});
  for(const m of(R.runnerMoves||[]))S.runners.push({who:m.from-1,from:m.from,to:m.to,v:runV(50),t0:R.air&&R.out?(R.t||0)+0.1:0.15});
  if(R.code==='DP'||R.code==='FC'){const r1=S.runners.find(r=>r.who===0);if(!r1)S.runners.push({who:0,from:1,to:2,v:runV(50),t0:0.15,out:true});else r1.out=true}
  for(const r of S.runners){const d=(r.to-r.from)*BASE_L;r.T=r.t0+runTime(d,r.v,6.5)+(r.to-r.from-1)*0.25;end=Math.max(end,Math.min(r.T,R.code==='HR'&&!R.inside?7:r.T)+0.2)}
  S.end=Math.min(end,R.code==='HR'&&!R.inside?7.5:14);
  // the landing spot for fly balls
  if(B.land&&B.apex>4&&R.code!=='HR'){W3.land.visible=true;W3.land.position.set(B.land[0],0.03,B.land[1])}
  W3.pci.visible=false;W3.zone.visible=false;W3.mark.visible=false;
}
function baseLerp(from,to,d){// distance d along the bases from base 'from'
  let k=from;while(d>BASE_L&&k<to){d-=BASE_L;k++}if(k>=to)return BASES[to%4].clone();return BASES[k%4].clone().lerp(BASES[(k+1)%4],clamp(d/BASE_L,0,1))}
function tickPlay(dt){
  const S=A.script,R=A.R,B=A.B,t=(now()-A.tP)/1000;
  // ball: in flight until fielded, then carried / thrown
  let bp;
  if(R.code==='HR'&&!R.inside||R.code==='FOUL'||!R.t||t<R.t){const p=ballAt(B,t);bp=new T.Vector3(p[0],p[1],p[2])}
  else{const th=S.throws.find(x=>t>=x.t0&&t<x.t1),f=G.fielders[R.fielder];
    if(th){const u=(t-th.t0)/(th.t1-th.t0),d=Math.hypot(th.to[0]-th.from[0],th.to[2]-th.from[2]);bp=new T.Vector3(th.from[0]+(th.to[0]-th.from[0])*u,th.from[1]+(th.to[1]-th.from[1])*u+Math.sin(Math.PI*u)*d*0.04,th.from[2]+(th.to[2]-th.from[2])*u);
      if(!th.started){th.started=true;const thr=S.throws.indexOf(th)===0?f:receiverAt(th.from);if(thr){thr.pose=null;thr.startSwing('th',SWINGS.th.dur*0.45)}}}
    else{const last=S.throws.filter(x=>t>=x.t1).pop();if(last){bp=new T.Vector3(...last.to)}else bp=f?f.gloveWorld():new T.Vector3(...R.catchAt)}}
  W3.ball.position.copy(bp);W3.ball.visible=true;
  // catch / pick-up moment
  if(R.t&&t>=R.t&&!S.caught&&R.code!=='HR'&&R.code!=='FOUL'){S.caught=true;sndGlove(R.air?0.8:0.5);if(R.out&&R.air){showCall(R.code==='SF'?'Sac fly':R.code==='LO'?'Line out':R.code==='PO'?'Pop out':'Fly out',R.dive);if(R.robbed)cheer(1)}}
  if(S.throws.length){for(const th of S.throws)if(t>=th.t1&&!th.done){th.done=true;sndGlove(0.6)}}
  // fielders: the one making the play runs to it; the first baseman covers the bag on grounders; others drift
  for(let i=1;i<=9;i++){const f=G.fielders[i];if(!f||i===2&&R.fielder!==2)continue;let tx=f.mv.x,tz=f.mv.z,go=false;
    if(i===R.fielder&&R.catchAt){const rt=freact(i,R.air);if(t>rt){tx=R.catchAt[0];tz=R.catchAt[2];go=true}}
    else if(i===3&&!R.air&&R.fielder!==3&&R.code!=='HR'&&R.code!=='FOUL'){if(t>0.3){tx=B1[0]-0.4;tz=B1[1]-0.5;go=true}}
    else if((i===4||i===6)&&(R.code==='DP'||R.code==='FC')&&i!==R.fielder&&(i===6?R.fielder===4||R.fielder===3:true)&&!(i===4&&(R.fielder===6||R.fielder===5))){if(t>0.3){tx=B2[0];tz=B2[1]+0.6;go=true}}
    else if(i>=7&&R.code!=='FOUL'&&B.land&&t>0.5){const L=B.land;tx=f.mv.x+(L[0]-f.mv.x)*0.25;tz=f.mv.z+(L[1]-f.mv.z)*0.25;go=Math.hypot(L[0]-f.mv.x,L[1]-f.mv.z)<60}
    if(go&&!(i===R.fielder&&S.caught)){const dx=tx-f.mv.x,dz=tz-f.mv.z,d=Math.hypot(dx,dz);const vmax=fv(i);
      let sp=Math.hypot(f.mv.vx,f.mv.vz);const want=d<0.3?0:Math.min(vmax,Math.sqrt(2*7*d));sp+=clamp(want-sp,-12*dt,7*dt);
      if(d>0.01){f.mv.vx=dx/d*sp;f.mv.vz=dz/d*sp}f.mv.x+=f.mv.vx*dt;f.mv.z+=f.mv.vz*dt}
    else{f.mv.vx*=Math.max(0,1-dt*8);f.mv.vz*=Math.max(0,1-dt*8)}
    const sp=Math.hypot(f.mv.vx,f.mv.vz);
    if(sp>0.6){if(f.pose&&f.pose!=='pt')f.pose=null;if(i===1&&f.swing){}else{const want=Math.atan2(f.mv.vx,f.mv.vz);f.yaw=turnTo(f.yaw,want,dt*8)}}
    else if(!f.swing){const want=Math.atan2(bp.x-f.mv.x,bp.z-f.mv.z);f.yaw=turnTo(f.yaw,want,dt*5);if(i!==1&&!f.pose&&!f.post)f.pose='rf'}
    f.pos.set(f.mv.x,i===1&&Math.hypot(f.mv.x,f.mv.z+18)<2.7?0.2:0,f.mv.z)}
  // runners along the base paths
  for(const r of S.runners){const pl=r.who==='b'?G.batter:G.runners[r.who];if(!pl)continue;
    if(t<r.t0){continue}
    if(r.who==='b'&&!r.started){r.started=true;pl.swing=null;pl.post=null;pl.pose=null;if(pl.bat)pl.bat.visible=false;dropBat()}
    const d=Math.min(runDist(t-r.t0,r.v,6.5),(r.to-r.from)*BASE_L),p=baseLerp(r.from,r.to,d),prev=pl.pos.clone();pl.pos.set(p.x,0,p.z);pl.mesh.visible=true;pl.pose=null;
    const vel=p.clone().sub(prev);if(vel.length()>1e-4){pl.yaw=Math.atan2(vel.x,vel.z);pl._v=vel.length()/Math.max(dt,1e-3)}else pl._v=0}
  return t>=S.end}
function receiverAt(p){let best=null,bd=9;for(let i=1;i<=9;i++){const f=G.fielders[i];if(!f)continue;const d=Math.hypot(f.mv.x-p[0],f.mv.z-p[2]);if(d<bd){bd=d;best=f}}return best}
function turnTo(a,b,k){let d=b-a;d=Math.atan2(Math.sin(d),Math.cos(d));return a+d*Math.min(1,k)}
function dropBat(){const b=G.batter;if(!b.bat)return;const m=b.bat.clone();W3.scene.add(m);const p=b.batPoint(20);m.position.copy(p).setY(0.04);m.rotation.set(Math.PI/2,0,rnd(0,6.28));m.scale.setScalar(0.01*PSCALE*b.sz);G.dropped=m}
/* ---- result of the plate appearance ---- */
const CODE_TEXT={K:'Strikeout',BB:'Walk',HBP:'Hit by pitch','1B':'Single','2B':'Double','3B':'Triple',HR:'Home run!',GO:'Ground out',FO:'Fly out',LO:'Line out',PO:'Pop out',DP:'Double play',FC:'Fielder’s choice',E:'Safe on error',SF:'Sacrifice fly'};
function endPA(r){
  if(A.ended)return;A.ended=true;
  const sit=A.cfg.sit||{outs:0,bases:[null,null,null]};
  const res=Object.assign({pitches:A.pitches,count:A.count.slice(),ev:A.contact&&A.contact.ev,la:A.contact&&A.contact.la,dist:A.B&&A.B.dist,desc:''},r);
  if(r.code==='K'){res.out=1;res.bases=sit.bases.slice();res.runs=0;res.rbi=0;res.desc=r.kLooking?'strikes out looking':'strikes out swinging'}
  else if(r.code==='BB'||r.code==='HBP'){const b=sit.bases.slice(),nb=[A.cfg.st.speed,null,null];let runs=0;
    const mv=[];if(b[0]!=null){nb[1]=b[0];mv.push({from:1,to:2});if(b[1]!=null){nb[2]=b[1];mv.push({from:2,to:3});if(b[2]!=null){runs=1;mv.push({from:3,to:4})}}else nb[2]=b[2]}else{nb[1]=b[1];nb[2]=b[2]}
    res.out=0;res.bases=nb;res.runs=runs;res.rbi=runs;res.runnerMoves=mv;res.desc=r.code==='BB'?'walks':'is hit by a pitch'}
  A.res=res;A.state='done';A.tDone=now();
  const big=['1B','2B','3B','HR'].includes(res.code);
  showCall(CODE_TEXT[res.code]||res.code,false,big?'w':res.out?'l':'');
  if(res.code==='HR'){cheer(1);sndCrowd(1.2);kick(0.12)}else if(big){cheer(0.6);sndCrowd(0.8)}else if(res.out&&res.code!=='K'){sndCrowd(0.2)}
  if(res.runs&&!A.practice)say((res.runs===1?'A run scores':res.runs+' runs score')+'!');
  renderHUD();
}
function finishPlay(){const R=A.R;
  if(R.code==='FOUL'){foulBall();return}
  const out={code:R.code==='HR'?'HR':R.code,out:R.out,bases:R.bases,runs:R.runs,rbi:R.rbi,desc:R.desc,hit:R.hit,err:R.err,runnerMoves:R.runnerMoves};
  if(A.practice){A.state='done';A.tDone=now();A.res=out;showCall(CODE_TEXT[R.code]||R.code,false,R.hit?'w':'l');say(contactLine());
    const bp=A.bp=A.bp||{n:0,hits:0,hr:0,best:0};bp.n++;if(R.hit)bp.hits++;if(R.code==='HR')bp.hr++;const ft=Math.round(distFt());if(ft>bp.best)bp.best=ft;renderHUD();return}
  endPA(out)}
/* projected distance: where it landed, or for a home run where it would have come down */
function distFt(){const B=A.B;if(!B)return 0;if(B.hr){const c=A.contact,B2=simBall(c.ev,c.la,c.spray,{line:999,cf:999,wall:0},{x0:0,y0:c.by,z0:-0.3});return(B2.dist||0)*3.281}return(B.dist||0)*3.281}
function contactLine(){const c=A.contact;if(!c)return'';const d=distFt();return Math.round(c.ev)+' mph off the bat · '+Math.round(c.la)+'°'+(d>30?' · '+Math.round(d)+' ft':'')}
function foulBall(){A.foulPlay=false;if(A.count[1]<2)A.count[1]++;umpire('Foul ball.');showCall('Foul',false,'');say('Foul · '+pitchInfo());renderHUD();cleanupPlay();nextPitchSoon(1500)}
function cleanupPlay(){W3.land.visible=false;if(G.dropped){W3.scene.remove(G.dropped);G.dropped=null}resetPositions();placeRunners(A.cfg.sit?A.cfg.sit.bases:null);W3.pci.visible=true;W3.zone.visible=true}

/* ---- per-frame at-bat logic ---- */
function stepAB(dt){
  if(!A)return;const t=now();
  if(A.state==='ready'){if(t>=A.t0)deliver()}
  if(A.state==='wind'){
    if(!A.loaded&&t>=A.tLoad){A.loaded=true;const b=G.batter;b.pose=null;b.startSwing('ld',0);b.swing.hold=true}
    if(t>=A.tRel)release()}
  if(A.state==='wind'||A.state==='pitch'){const b=G.batter;if(!A.loaded&&A.state==='pitch'){A.loaded=true;b.pose=null;b.startSwing('ld',0.3);b.swing.hold=true}}
  if(A.state==='pitch'){
    const p=A.pitch,tt=(t-A.tR)/1000;
    if(!A.read&&t>=A.tRead){A.read=true;$('ptype').textContent=PT[p.type].s;$('ptype').style.color=PT[p.type].c;$('ptype').hidden=false}
    if(A.swing&&!A.judged&&t>=A.swing.t+SWT*1000){A.judged=true;const c=judgeContact();
      if(c.kind==='play'){const hp=pitchPos(p,pitchTimeAtZ(p,-0.28));W3.ball.position.copy(hp);inPlay(c);return}
      if(c.kind==='foul'){if(c.tip&&A.count[1]>=2&&Math.random()<0.3){sndGlove(0.6);umpire('Strike three!');showMark(pitchPos(p,pitchTimeAtZ(p,0)),0xF28A78);endPA({code:'K',tip:true});return}
        sndBat(0.25,0.1);const B=simBall(55+Math.random()*25,rnd(-10,70),(Math.random()<0.5?-1:1)*rnd(50,80)*Math.PI/180,PARK,{x0:0,y0:c.by,z0:-0.3});A.B=B;A.R={code:'FOUL'};A.state='play';A.tP=now();planPlay(B,A.R);return}
      // swing and a miss
      A.whiff=true;say('Swing and a miss · '+pitchInfo());}
    const pos=pitchPos(p,Math.min(tt,(A.tCatch-A.tR)/1000));W3.ball.position.copy(pos);
    // catcher's glove meets the ball
    catcherTrack(p);
    if(t>=A.tCatch){sndGlove(p.mph/95);W3.ball.position.copy(pitchPos(p,(A.tCatch-A.tR)/1000));
      if(A.swing){const bp=pitchPos(p,pitchTimeAtZ(p,0));showMark(bp,0xF28A78);A.ptSeen.push({x:bp.x,y:bp.y,type:p.type,res:'W'});A.count[1]++;
        if(A.count[1]>=3){umpire('Strike three!');endPA({code:'K'});return}umpire('Strike!');renderHUD();nextPitchSoon()}
      else{callPitch();if(A.state==='pitch')nextPitchSoon()}
      $('ptype').hidden=true;A.judged=false}}
  if(A.state==='play'){$('ptype').hidden=true;if(tickPlay(dt)){if(A.R.code==='FOUL'){foulBall()}else finishPlay()}}
  if(A.state==='done'){if(t-A.tDone>(A.res&&A.res.code==='HR'?1200:1800)&&!A.handed){A.handed=true;
      if(A.practice){practiceNext();return}
      const cb=A.cfg.onDone;cb&&cb(A.res)}}
}
function catcherTrack(p){const c=G.catcher;const tg=pitchPos(p,(A.tCatch-A.tR)/1000);const s=c.sz,k=100/(PSCALE*s);
  c.root.updateMatrixWorld(true);const hip=c.bones[0].getWorldPosition(new T.Vector3());
  // world -> catcher rig (facing -z: rig x = -(world x), rig z = -(world z - pos.z))
  const L=[-(tg.x-c.pos.x)*k+6,96+(tg.y-hip.y)*k,-(tg.z-c.pos.z)*k+10];
  const K0=SWINGS.cr.keys;for(const kk of K0){kk.L[0]+= (L[0]-kk.L[0])*0.25;kk.L[1]+=(L[1]-kk.L[1])*0.25;kk.L[2]+=(L[2]-kk.L[2])*0.25}}

/* ================= batting practice ================= */
function practiceNext(){A.ended=false;A.handed=false;A.state='ready';cleanupPlay();A.contact=null;A.B=null;A.R=null;A.count=[0,0];nextPitchSoon(900);renderHUD()}

/* ================= HUD ================= */
function say(t){$('msg').textContent=t}
let callT=null;
function showCall(t,dive,cls){const c=$('call');c.textContent=t;c.className='on '+(cls||'');clearTimeout(callT);callT=setTimeout(()=>c.className=cls||'',1500)}
function renderHUD(){if(!A)return;const c=A.cfg,s=c.sit;
  $('cnt').innerHTML='<b>'+A.count[0]+'</b>–<b>'+A.count[1]+'</b>';
  if(A.practice){$('bug').innerHTML='<div class="bl"><span class="eyebrow">Batting practice</span><span class="num">'+(A.bp?A.bp.n+' swings · '+A.bp.hr+' HR · best '+A.bp.best+' ft':'')+'</span></div>';return}
  const inn=(s.half==='top'?'▲ ':'▼ ')+ord(s.inning);
  $('bug').innerHTML='<div class="bl"><span class="tm">'+esc(c.teams[0])+' <b class="num">'+s.score[0]+'</b></span><span class="tm">'+esc(c.teams[1])+' <b class="num">'+s.score[1]+'</b></span></div>'+
    '<div class="bm"><span>'+inn+'</span>'+diamond(s.bases)+'<span class="outs">'+[0,1,2].map(i=>'<i class="'+(i<s.outs?'on':'')+'"></i>').join('')+'</span></div>';
  $('who').textContent=(c.pitcher.name)+' · '+c.pitcher.velo+' mph'+(c.ab?' · AB '+c.ab:'');
}
function ord(n){return n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th')}
function diamond(b){const on=k=>b&&b[k]!=null?'on':'';return'<svg class="dia" viewBox="0 0 40 30" aria-label="bases"><rect class="'+on(1)+'" x="15" y="2" width="10" height="10" transform="rotate(45 20 7)"/><rect class="'+on(0)+'" x="26" y="12" width="10" height="10" transform="rotate(45 31 17)"/><rect class="'+on(2)+'" x="4" y="12" width="10" height="10" transform="rotate(45 9 17)"/></svg>'}
function renderSwingType(){document.querySelectorAll('#stype button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.t===swingType)))}
document.querySelectorAll('#stype button').forEach(b=>b.onclick=e=>{e.stopPropagation();swingType=b.dataset.t;renderSwingType();try{localStorage.setItem('bg-stype',swingType)}catch(_){}});
try{const s=localStorage.getItem('bg-stype');if(STYPES[s])swingType=s}catch(_){}renderSwingType();

/* ================= input: drag the PCI anywhere, tap to swing (or the swing button) ================= */
const cv=$('gl');let drag=null;
function mPerPx(){const d=W3.cam.position.z,h=2*d*Math.tan(W3.cam.fov*Math.PI/360);return h/window.innerHeight}
function movePCI(dx,dy,k){if(!A)return;const m=mPerPx()*(k||1.25);A.pci.x=clamp(A.pci.x+dx*m,-0.55,0.55);A.pci.y=clamp(A.pci.y-dy*m,0.15,1.45)}
cv.addEventListener('pointerdown',e=>{if(!A||CLK.paused)return;e.preventDefault();
  if(A.state==='play'||A.state==='done'){skipPlay();return}
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:now(),moved:0,lx:e.clientX,ly:e.clientY};
  if(e.pointerType==='mouse'){swingAt(now());drag=null}});
cv.addEventListener('pointermove',e=>{if(!A)return;
  if(e.pointerType==='mouse'&&!drag){if(W3._lm){movePCI(e.clientX-W3._lm[0],e.clientY-W3._lm[1],1.0)}W3._lm=[e.clientX,e.clientY];return}
  if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.lx,dy=e.clientY-drag.ly;drag.lx=e.clientX;drag.ly=e.clientY;drag.moved+=Math.hypot(dx,dy);movePCI(dx,dy)});
cv.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;
  if(d.moved<12&&now()-d.t<320)swingAt(d.t)});
cv.addEventListener('pointercancel',()=>{drag=null});
$('swingBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!A)return;if(A.state==='play'||A.state==='done'){skipPlay();return}swingAt(now())});
window.addEventListener('keydown',e=>{if($('ab').hidden||!A)return;
  if(e.code==='Space'){e.preventDefault();if(A.state==='play'||A.state==='done')skipPlay();else swingAt(now())}
  const k=0.04;if(e.code==='ArrowLeft')A.pci.x=clamp(A.pci.x-k,-0.55,0.55);if(e.code==='ArrowRight')A.pci.x=clamp(A.pci.x+k,-0.55,0.55);if(e.code==='ArrowUp')A.pci.y=clamp(A.pci.y+k,0.15,1.45);if(e.code==='ArrowDown')A.pci.y=clamp(A.pci.y-k,0.15,1.45)});
function skipPlay(){if(A.state==='play'&&A.script&&(now()-A.tP)>600){A.tP-=60000;}else if(A.state==='done'&&now()-A.tDone>400){A.tDone-=60000}}

/* ================= per frame ================= */
let lastT=0;
function loop(t){
  requestAnimationFrame(loop);
  if(window.__FREEZE){clockTick();if(G&&window.__POSEFN)window.__POSEFN();if(G){for(const p of[G.batter,G.pitcher,G.catcher,...G.fielders.slice(3)])p.update(0,0,0)}camera(0.016);W3.r.render(W3.scene,W3.cam);return}
  const rawMs=t-lastT,dtr=Math.min(0.05,rawMs/1000||0.016);lastT=t;clockTick();
  if($('ab').hidden||!G)return;
  const dt=dtr*CLK.ts;
  stepAB(dt);
  // PCI follows its position, sized to the swing type
  if(A){const S=STYPES[swingType],c=A.cfg.st.contact,rx=(0.085+c*0.00085)*S.pci;W3.pci.position.set(A.pci.x,A.pci.y,0.0);W3.pci.scale.set(rx,rx*0.8,1);
    const live=A.state==='pitch'||A.state==='wind';W3.pciRing.material.opacity=live?0.95:0.6;W3.pciFill.material.opacity=live?0.14:0.08;
    W3.zone.material.opacity=A.state==='play'?0:0.42;
    // the pitcher holds his set position until he delivers
    if(A.state==='ready'){G.pitcher.pose='pt';G.pitcher.poseU=0}
    if(A.state==='wind'||A.state==='ready'){W3.ball.position.copy(G.pitcher.handWorld())}}
  // players
  const b=G.batter;b.update(dt,0,b._v||0);
  G.pitcher.update(dt,0,Math.hypot(G.pitcher.mv.vx,G.pitcher.mv.vz));
  G.catcher.update(dt,0,0);
  for(let i=3;i<=9;i++){const f=G.fielders[i];f.update(dt,0,Math.hypot(f.mv.vx,f.mv.vz))}
  for(const r of G.runners)if(r.mesh.visible)r.update(dt,0,r._v||0);
  // ball shadow
  const bw=W3.ball.position;W3.bshadow.visible=W3.ball.visible;W3.bshadow.position.set(bw.x,0.02,bw.z);W3.bshadow.scale.setScalar(1/(1+bw.y*0.15));
  camera(dtr);crowdTick(dtr,t);fxTick(dt);
  // the catcher fades so you can see low pitches through him
  {const fade=A&&(A.state==='pitch'||A.state==='wind'||A.state==='ready')?0.3:1,m=G.catcher.mat;m.opacity+=(fade-m.opacity)*Math.min(1,dtr*8);const tr=m.opacity<0.99;
    if(tr!==m.transparent){m.transparent=tr;m.depthWrite=!tr;m.needsUpdate=true}
    if(G.catcher.glove)G.catcher.glove.traverse(o=>{if(o.isMesh){o.material.transparent=true;o.material.opacity=Math.max(0.45,m.opacity)}})}
  W3.r.render(W3.scene,W3.cam);
}
function camera(dt){
  if(window.__CAM){const c=window.__CAM;W3.cam.position.set(c[0],c[1],c[2]);W3.cam.lookAt(c[3],c[4],c[5]);return}
  let tp,tl,k=Math.min(1,dt*3);
  const follow=A&&A.B&&A.R&&A.R.code!=='FOUL'&&(A.state==='play'||A.state==='done'&&A.res&&!['K','BB','HBP'].includes(A.res.code));
  if(follow){
    const bp=W3.ball.position,B=A.B,far=Math.hypot(bp.x,bp.z);
    // broadcast-style: rise behind the plate, follow the ball out, pull back for deep drives
    const h=B&&B.apex>8?6+far*0.12:4+far*0.08;tp=new T.Vector3(bp.x*0.35,h,9+far*0.15);tl=new T.Vector3(bp.x*0.85,Math.min(bp.y,8)*0.6,bp.z*0.9-2);k=Math.min(1,dt*2.2)}
  else{const port=W3.cam.aspect<1;tp=new T.Vector3(port?0.3:0.45,port?2.05:1.9,port?5.3:4.6);tl=new T.Vector3(port?-0.3:-0.35,port?1.18:1.2,-9);k=Math.min(1,dt*4)}
  W3.camPos.lerp(tp,k);W3.camLook.lerp(tl,k);W3.cam.position.copy(W3.camPos);const sk=shakeOffset();if(sk)W3.cam.position.add(sk);W3.cam.lookAt(W3.camLook)}

/*@SIM*/
/*@CAREER*/
document.addEventListener('pointerdown',sndResume,{passive:true});
$('snd').textContent=SND.on?'Sound on':'Sound off';$('snd').onclick=()=>{sndResume();$('snd').textContent=sndToggle()?'Sound on':'Sound off'};
window.__GT=()=>GT;window.__BG={get A(){return A},get G(){return G},W3,setupScene,startPA,swingAt,SWINGS,PT,simBall,resolvePlay,get save(){return save}};
renderTitle();
})();
