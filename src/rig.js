/* ================= characters: loading, retargeting the Mixamo clips, and the posed rig =================
   Same characters and rig as Tennis Go. Rig space is centimetres: +z is where the player faces, the player's right is -x,
   y is up with hand heights relative to a 96 cm hip height. Poses drive the hips and shoulders (separately), the hands
   (two-bone arm IK), the bat direction, both feet (leg IK, planted in the yaw frame so they stay put while the body turns)
   and a hip shift for weight transfer. */
function b64(s,Ty){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new Ty(u.buffer)}
Object.assign(R3BOSS.clips,window.MCLIPS||{});
const CH={},WAIT={};
window.R3CHAR=function(D){CH[D.id]=D;const w=WAIT[D.id];if(w){delete WAIT[D.id];w.forEach(f=>f(D))}};
function loadChar(id,cb){
  if(id==='boss'){cb(R3BOSS);return}
  if(CH[id]){cb(CH[id]);return}
  if(WAIT[id]){WAIT[id].push(cb);return}
  WAIT[id]=[cb];
  const names=['chars/char_'+id+'.js',CHAR_BASE+'char_'+id+'.js'];let k=0;
  const tryNext=()=>{const s=document.createElement('script');s.src=names[k];
    s.onerror=()=>{s.remove();if(++k<names.length){tryNext();return}const w=WAIT[id];delete WAIT[id];if(w)w.forEach(f=>f(null))};
    document.head.appendChild(s)};
  tryNext();
}
function loadChars(ids){return Promise.all(ids.map(id=>new Promise(r=>loadChar(id,D=>r(D||R3BOSS)))))}
function quatYaw(x,y,z,w){const fx=2*(x*z+w*y),fz=1-2*(x*x+y*y);return Math.atan2(fx,fz)}
function retarget(D){
  const B=R3BOSS,nbB=B.names.length,nb=D.names.length;
  const rot=(inv,k)=>{const m=new T.Matrix4().fromArray(inv,k*16).transpose().invert(),q=new T.Quaternion(),p=new T.Vector3();m.decompose(p,q,new T.Vector3());return{q,p}};
  const iB=b64(B.inv,Float32Array),iC=b64(D.inv,Float32Array),RB=[],RC=[];for(let k=0;k<nbB;k++)RB.push(rot(iB,k));for(let k=0;k<nb;k++)RC.push(rot(iC,k));
  const bI=Object.fromEntries(B.names.map((s,i)=>[s,i])),map=D.names.map(s=>bI[s]??-1);
  const sc=RC[D.names.indexOf('Hips')].p.y/RB[bI.Hips].p.y;
  const RBi=RB.map(r=>r.q.clone().invert()),RCi=RC.map(r=>r.q.clone().invert());
  const out={},WB=[],WC=[];for(let k=0;k<nbB;k++)WB.push(new T.Quaternion());for(let k=0;k<nb;k++)WC.push(new T.Quaternion());
  const ql=new T.Quaternion(),tmp=new T.Quaternion();
  for(const ck in B.clips){const c=B.clips[ck],Qa=b64(c.q,Int16Array),QS=b64(c.qs,Int16Array),H=b64(c.hip,Float32Array),na=c.anim.length,n=c.n;
    const Q=new Int16Array(n*nb*4),HC=new Float32Array(n*3),qb=new Float32Array(nbB*4);
    for(let f=0;f<n;f++){for(let k=0;k<nbB*4;k++)qb[k]=QS[k]/32767;for(let j=0;j<na;j++){const k=c.anim[j];for(let e=0;e<4;e++)qb[k*4+e]=Qa[(f*na+j)*4+e]/32767}
      for(let k=0;k<nbB;k++){ql.set(qb[k*4],qb[k*4+1],qb[k*4+2],qb[k*4+3]).normalize();const p=B.parent[k];if(p>=0)WB[k].copy(WB[p]).multiply(ql);else WB[k].copy(ql)}
      for(let k=0;k<nb;k++){const p=D.parent[k],jb=map[k];
        if(jb>=0)WC[k].copy(WB[jb]).multiply(RBi[jb]).multiply(RC[k].q);
        else if(p>=0)WC[k].copy(WC[p]).multiply(RCi[p]).multiply(RC[k].q);else WC[k].copy(RC[k].q);
        if(p>=0)tmp.copy(WC[p]).invert().multiply(WC[k]);else tmp.copy(WC[k]);
        const o=(f*nb+k)*4;Q[o]=Math.round(tmp.x*32767);Q[o+1]=Math.round(tmp.y*32767);Q[o+2]=Math.round(tmp.z*32767);Q[o+3]=Math.round(tmp.w*32767)}
      for(let e=0;e<3;e++)HC[f*3+e]=H[f*3+e]*sc}
    for(let f=1;f<n;f++)for(let k=0;k<nb;k++){const a=(f*nb+k)*4,b=((f-1)*nb+k)*4;if(Q[a]*Q[b]+Q[a+1]*Q[b+1]+Q[a+2]*Q[b+2]+Q[a+3]*Q[b+3]<0)for(let e=0;e<4;e++)Q[a+e]=-Q[a+e]}
    out[ck]={fps:c.fps,t0:c.t0||0,n,anim:[...Array(nb).keys()],Q,HIP:HC}}
  return out;
}
function clipsFor(D,isBoss){
  if(D._tc)return D._tc;
  let src;
  if(isBoss){src={};for(const k in R3BOSS.clips){const c=R3BOSS.clips[k];const nb=R3BOSS.names.length,Qa=b64(c.q,Int16Array),QS=b64(c.qs,Int16Array),na=c.anim.length,Q=new Int16Array(c.n*nb*4);
      for(let f=0;f<c.n;f++){Q.set(QS,f*nb*4);for(let j=0;j<na;j++){const k2=c.anim[j];for(let e=0;e<4;e++)Q[(f*nb+k2)*4+e]=Qa[(f*na+j)*4+e]}}
      src[k]={fps:c.fps,t0:c.t0||0,n:c.n,Q,HIP:b64(c.hip,Float32Array)}}}
  else src=retarget(D);
  const nb=D.names.length;
  for(const k in src){const c=src[k],o=0;c.yaw0=quatYaw(c.Q[o]/32767,c.Q[o+1]/32767,c.Q[o+2]/32767,c.Q[o+3]/32767);c.dur=(c.n-1)/c.fps;c.nb=nb;const H=c.HIP,L=(c.n-1)*3;c.spd=Math.max(Math.abs(H[L]-H[0]),Math.abs(H[L+2]-H[2]))/Math.max(c.dur,0.01)*0.01}
  D._tc=src;return src;
}

/* ---- poses ----
   body: whole-body yaw (deg); pel / sh: hip and shoulder turn (deg, + opens toward the player's left); pitch: trunk lean forward;
   roll: trunk tilt; dp: crouch depth; hand: right-hand target; rd: bat (or throwing-hand) direction; pole: right elbow direction;
   L: left-hand target; gw: 1 locks the left hand onto the bat handle below the right hand;
   fl / fr: left / right foot offsets from the natural stance, in the yaw frame (stay planted while the body turns);
   hs: hip shift (weight transfer). */
const V=(x,y,z)=>new T.Vector3(x,y,z).normalize();
const K=(t,o)=>Object.assign({t},o);
/* Batting (right-handed hitter). The hitter faces the plate (+z), the pitcher is on his left (+x), the catcher on his right (-x).
   Phases from hitting instruction: stance with the hands by the back shoulder and the bat angled up and back; load (hands back,
   weight back, small leg lift); stride lands; hips fire first and the knob leads, the bat flattens behind; contact out in front
   with the bat square to the pitch, back heel up; extension through the ball; follow-through over the front shoulder. */
const STANCE={pel:-6,sh:-16,pitch:0.2,roll:-4,dp:0.85,hand:[-14,140,12],rd:[-0.32,0.86,-0.4],pole:[-0.6,-0.65,-0.3],L:[0,0,0],gw:1,fl:[5,0,1],fr:[-5,0,-1],hs:[-2,0,0]};
/* batting stance styles: tweaks on the classic stance (the load and swing are shared) */
const STANCES={
  classic:{n:'Classic',d:'Balanced, hands by the back shoulder'},
  open:{n:'Open',d:'Front foot pulled back, chest toward the pitcher',set:{pel:6,sh:-4,fl:[3,0,-14],fr:[-5,0,-1]}},
  crouch:{n:'Crouched',d:'Low and compact, small strike zone look',set:{dp:1.5,pitch:0.34,hand:[-12,130,14]}},
  high:{n:'High hands',d:'Hands up high, bat wagging over the head',set:{hand:[-12,158,6],rd:[-0.2,0.95,-0.25]}},
  wide:{n:'Wide',d:'Feet spread, no stride, all hips',set:{fl:[18,0,1],fr:[-16,0,-1],dp:1.25}}};
const STANCE0=JSON.parse(JSON.stringify(STANCE));
function applyStance(id){const S=STANCES[id]||STANCES.classic;Object.assign(STANCE,JSON.parse(JSON.stringify(STANCE0)),S.set?JSON.parse(JSON.stringify(S.set)):{});const k0=SWINGS.ld.keys[0];for(const k in STANCE)k0[k]=Array.isArray(STANCE[k])?STANCE[k].slice():STANCE[k]}
const SWINGS={
  ld:{dur:0.55,cf:1,keys:[ // the load, timed off the pitcher's release
    K(0,   STANCE),
    K(0.5, {pel:-16,sh:-30,pitch:0.22,roll:-6,dp:0.95,hand:[-22,140,6], rd:[-0.22,0.9,-0.38],pole:[-0.6,-0.6,-0.4],L:[0,0,0],gw:1,fl:[4,11,0],fr:[-5,0,-1],hs:[-7,0,0]}),  // hands back, front leg lifts, weight back
    K(1,   {pel:-14,sh:-30,pitch:0.22,roll:-6,dp:1.0,hand:[-22,138,6], rd:[-0.22,0.9,-0.38],pole:[-0.6,-0.6,-0.4],L:[0,0,0],gw:1,fl:[24,0,3],fr:[-5,0,-1],hs:[-3,0,0]})]}, // stride lands soft, hands stay back
  sw:{dur:0.6,cf:0.32,keys:[ // the swing from the loaded position
    K(0,   {pel:-14,sh:-30,pitch:0.22,roll:-6,dp:1.0,hand:[-22,138,6], rd:[-0.22,0.9,-0.38],pole:[-0.6,-0.6,-0.4],L:[0,0,0],gw:1,fl:[24,0,3],fr:[-5,0,-1],hs:[-3,0,0]}),
    K(0.17,{pel:22, sh:-12,pitch:0.24,roll:-8,dp:1.08,hand:[-14,120,20],rd:[-0.78,0.5,-0.36],pole:[-0.5,-0.85,-0.1],L:[0,0,0],gw:1,fl:[24,0,3],fr:[-4,3,0],hs:[4,0,0]}),   // hips fire, knob leads, bat lays flat behind
    K(0.32,{pel:58, sh:28, pitch:0.24,roll:-6,dp:1.05,hand:[4,108,32],  rd:[0.18,-0.14,0.97],pole:[-0.35,-0.9,0.25],L:[0,0,0],gw:1,fl:[24,0,3],fr:[-1,7,2],hs:[9,0,2]}),    // contact out in front, bat square
    K(0.46,{pel:76, sh:70, pitch:0.2, roll:-3,dp:0.95,hand:[24,114,38], rd:[0.88,0.12,0.45],pole:[-0.2,-0.9,0.45],L:[0,0,0],gw:1,fl:[24,0,3],fr:[1,9,3],hs:[11,0,2]}),    // extension
    K(0.68,{pel:86, sh:108,pitch:0.14,roll:0, dp:0.8, hand:[24,140,6],  rd:[0.3,0.55,-0.78],pole:[0.15,-0.8,0.5],L:[0,0,0],gw:1,fl:[24,0,3],fr:[3,10,5],hs:[11,2,0]}),     // over the front shoulder
    K(1,   {pel:88, sh:124,pitch:0.1, roll:0, dp:0.7, hand:[12,150,-14],rd:[-0.42,-0.3,-0.86],pole:[0.3,-0.7,0.4],L:[0,0,0],gw:1,fl:[24,0,3],fr:[4,10,6],hs:[10,3,0]})]},   // bat wraps behind, balanced finish
  /* pitching from the stretch (right-hander). Body yaw -90 puts the glove side toward the plate. Phases: set, leg lift,
     drive and stride with the hands separating, arm cocked, foot plant, hips then shoulders rotate, release out in front,
     deceleration across the body, the back leg swings through. */
  pt:{dur:1.45,cf:0.66,keys:[
    K(0,   {body:-88,pel:0,  sh:0,  pitch:0.05,roll:0, dp:0.6, hand:[-2,128,24], rd:[0,0.3,0.95], pole:[-0.6,-0.7,-0.2],L:[6,128,26], gw:0,fl:[-12,0,26], fr:[12,0,-2],hs:[0,0,0]}),   // set, side-on, hands together at the chest
    K(0.3, {body:-92,pel:-14,sh:-14,pitch:0.02,roll:0, dp:0.55,hand:[-4,124,20], rd:[0,0.3,0.95], pole:[-0.6,-0.7,-0.2],L:[4,124,22], gw:0,fl:[-14,46,10],fr:[12,0,-2],hs:[0,0,-2]}),  // leg lift, balanced over the back leg
    K(0.5, {body:-90,pel:-18,sh:-26,pitch:0.08,roll:-6,dp:1.05,hand:[-46,126,-14],rd:[-0.6,0.5,-0.6],pole:[-0.5,-0.85,-0.1],L:[40,128,10],gw:0,fl:[-16,14,56],fr:[12,0,-2],hs:[0,0,16]}), // drive, hands break, glove toward the plate
    K(0.6, {body:-86,pel:10, sh:-34,pitch:0.12,roll:-10,dp:1.3,hand:[-54,158,-16],rd:[-0.1,0.95,-0.25],pole:[-0.6,-0.4,-0.7],L:[46,134,18],gw:0,fl:[-16,0,92],fr:[12,0,-2],hs:[0,0,34]}), // front foot plants, arm cocked up and back
    K(0.66,{body:-60,pel:45, sh:30, pitch:0.36,roll:-14,dp:1.4,hand:[-6,170,44], rd:[0.25,0.9,0.35],pole:[-0.8,-0.2,-0.3],L:[30,118,8], gw:0,fl:[-16,0,92],fr:[10,6,6],hs:[0,0,48]}),  // release out in front of the head
    K(0.78,{body:-30,pel:62, sh:62, pitch:0.62,roll:-4,dp:1.5, hand:[32,96,40],  rd:[0.4,-0.8,0.45],pole:[-0.2,-0.9,0.4],L:[26,110,-6],gw:0,fl:[-16,0,92],fr:[4,26,40],hs:[0,0,58]}), // arm decelerates across the body, back leg comes through
    K(1,   {body:-14,pel:66, sh:70, pitch:0.4, roll:0, dp:1.1, hand:[24,104,30], rd:[0.3,-0.8,0.5], pole:[-0.3,-0.9,0.3],L:[20,112,12],gw:0,fl:[-16,0,92],fr:[30,0,84],hs:[2,0,72]})]}, // squared up in fielding position
  /* fielder's throw: side-on, arm back, stride at the target, release, follow through */
  th:{dur:0.75,cf:0.6,keys:[
    K(0,   {body:0,  pel:0,  sh:0,  pitch:0.2, roll:0, dp:0.8, hand:[-10,112,30],rd:[0,0.4,0.9], pole:[-0.6,-0.7,-0.2],L:[8,112,32], gw:0,fl:[0,0,0], fr:[0,0,0],hs:[0,0,0]}),
    K(0.35,{body:-80,pel:-10,sh:-25,pitch:0.1, roll:-8,dp:1.0, hand:[-50,150,-10],rd:[-0.2,0.9,-0.3],pole:[-0.6,-0.4,-0.6],L:[40,130,16],gw:0,fl:[-12,0,24],fr:[12,0,-6],hs:[0,0,6]}),
    K(0.6, {body:-50,pel:40, sh:30, pitch:0.35,roll:-10,dp:1.1,hand:[-4,166,40], rd:[0.2,0.9,0.35],pole:[-0.8,-0.2,-0.3],L:[28,116,6], gw:0,fl:[-12,0,50],fr:[12,4,-6],hs:[0,0,22]}),
    K(1,   {body:-20,pel:60, sh:60, pitch:0.45,roll:0, dp:1.0, hand:[28,100,36],rd:[0.4,-0.8,0.45],pole:[-0.2,-0.9,0.4],L:[24,110,0], gw:0,fl:[-12,0,50],fr:[10,10,30],hs:[0,0,30]})]},
  /* bunt: square around to face the pitcher, bat flat out over the plate, top hand slid up the barrel */
  bn:{dur:0.4,cf:1,keys:[
    K(0,{body:0, pel:-6,sh:-16,pitch:0.2,roll:-4,dp:0.85,hand:[-14,140,12],rd:[-0.32,0.86,-0.4],pole:[-0.6,-0.65,-0.3],L:[0,0,0],gw:1,fl:[5,0,1],fr:[-5,0,-1],hs:[-2,0,0]}),
    K(1,{body:70,pel:8,sh:10,pitch:0.32,roll:0,dp:1.6,hand:[-8,124,40],rd:[-0.98,0.12,0.12],pole:[-0.6,-0.7,0.2],L:[0,0,0],gw:1,fl:[8,0,2],fr:[-2,0,8],hs:[0,0,0]})]},
  /* catcher: squat, glove out as a target */
  cr:{dur:1,cf:1,keys:[K(0,{body:0,pel:0,sh:0,pitch:0.42,roll:0,dp:3.4,hand:[-30,96,24],rd:[0,-0.3,0.95],pole:[-0.7,-0.6,0],L:[16,112,52],gw:0,fl:[16,0,2],fr:[-16,0,2],hs:[0,0,4]}),K(1,{body:0,pel:0,sh:0,pitch:0.42,roll:0,dp:3.4,hand:[-30,96,24],rd:[0,-0.3,0.95],pole:[-0.7,-0.6,0],L:[16,112,52],gw:0,fl:[16,0,2],fr:[-16,0,2],hs:[0,0,4]})]},
  /* fielder's ready crouch, glove open */
  rf:{dur:1,cf:1,keys:[K(0,{body:0,pel:0,sh:0,pitch:0.45,roll:0,dp:1.9,hand:[-22,102,30],rd:[0,-0.2,0.98],pole:[-0.6,-0.7,-0.1],L:[18,100,34],gw:0,fl:[10,0,0],fr:[-10,0,0],hs:[0,0,0]}),K(1,{body:0,pel:0,sh:0,pitch:0.45,roll:0,dp:1.9,hand:[-22,102,30],rd:[0,-0.2,0.98],pole:[-0.6,-0.7,-0.1],L:[18,100,34],gw:0,fl:[10,0,0],fr:[-10,0,0],hs:[0,0,0]})]}
};
const NUM=['body','pel','sh','pitch','roll','gw','dp'],VEC=['hand','rd','pole','L','fl','fr','hs'];
function fillKey(k){if(k.body==null)k.body=0;for(const n of NUM)if(k[n]==null)k[n]=0;for(const n of VEC)if(!k[n])k[n]=[0,0,0];return k}
for(const s in SWINGS)SWINGS[s].keys.forEach(fillKey);fillKey(STANCE);
function hermite(K,u,get){
  let i=0;while(i<K.length-2&&u>K[i+1].t)i++;const a=K[i],b=K[i+1],h=b.t-a.t,s=clamp((u-a.t)/h,0,1);
  const pa=get(a),pb=get(b),ma=i>0?(pb-get(K[i-1]))/(b.t-K[i-1].t):0,mb=i+2<K.length?(get(K[i+2])-pa)/(K[i+2].t-a.t):0;
  const s2=s*s,s3=s2*s;return(2*s3-3*s2+1)*pa+(s3-2*s2+s)*h*ma+(-2*s3+3*s2)*pb+(s3-s2)*h*mb}
function sampleSwing(S,u){const K=S.keys,o={};
  for(const n of NUM)o[n]=hermite(K,u,k=>k[n]);
  for(const n of VEC)o[n]=[0,1,2].map(j=>hermite(K,u,k=>k[n][j]));return o}
function mixP(a,b,w){const o={};for(const n of NUM)o[n]=a[n]+(b[n]-a[n])*w;for(const n of VEC)o[n]=[0,1,2].map(j=>a[n][j]+(b[n][j]-a[n][j])*w);return o}
const READY={body:0,pel:0,sh:0,pitch:0.12,roll:0,dp:0.7,hand:[-24,100,20],rd:[0,-0.5,0.85],pole:[-0.6,-0.7,-0.2],L:[24,100,20],gw:0,fl:[0,0,0],fr:[0,0,0],hs:[0,0,0]};

function makeBat(){
  const g=new T.Group(),wood=new T.MeshStandardMaterial({color:0xC8955A,roughness:.55,metalness:.05}),tape=new T.MeshStandardMaterial({color:0x1d1d1d,roughness:.9});
  g.userData.wood=wood;
  // knob, handle, taper, barrel (along +y, the top hand sits at 0)
  const knob=new T.Mesh(new T.CylinderGeometry(2.2,2.2,1.4,12),tape);knob.position.y=-13;g.add(knob);
  const handle=new T.Mesh(new T.CylinderGeometry(1.35,1.25,24,10),tape);handle.position.y=-1;g.add(handle);
  const taper=new T.Mesh(new T.CylinderGeometry(3.1,1.35,26,14),wood);taper.position.y=24;g.add(taper);
  const barrel=new T.Mesh(new T.CylinderGeometry(3.3,3.1,34,16),wood);barrel.position.y=54;g.add(barrel);
  const cap=new T.Mesh(new T.SphereGeometry(3.3,14,8,0,Math.PI*2,0,Math.PI/2),wood);cap.position.y=71;g.add(cap);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});
  return g;
}
function makeGlove(){
  const m=new T.MeshStandardMaterial({color:0x7A4A25,roughness:.8});const g=new T.Group();
  const palm=new T.Mesh(new T.SphereGeometry(9,14,10),m);palm.scale.set(1,1.25,0.55);g.add(palm);
  const web=new T.Mesh(new T.SphereGeometry(5,10,8),m);web.position.set(0,10,0);web.scale.set(1.2,1,0.4);g.add(web);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g}

class Player{
  constructor(D,isBoss,scene,o){
    o=o||{};this.D=D;const nb=this.nb=D.names.length;
    const lt=b64(D.lt,Float32Array),inv=b64(D.inv,Float32Array);
    const bones=this.bones=[];for(let k=0;k<nb;k++){const b=new T.Bone();b.name=D.names[k];b.position.set(lt[k*3],lt[k*3+1],lt[k*3+2]);bones.push(b);if(D.parent[k]>=0)bones[D.parent[k]].add(b)}
    const root=this.root=new T.Group();root.matrixAutoUpdate=false;root.add(bones[0]);scene.add(root);
    const invs=[];for(let k=0;k<nb;k++){const m=new T.Matrix4();m.fromArray(inv,k*16);m.transpose();invs.push(m)}
    if(!D._geo){const M=D.mesh,n=M.n,pq=b64(M.p,Uint16Array),pos=new Float32Array(n*3);for(let i=0;i<n*3;i++){const a=i%3;pos[i]=M.lo[a]+pq[i]/65535*(M.hi[a]-M.lo[a])}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
      g.setAttribute('normal',new T.BufferAttribute(b64(M.nr,Int8Array),3,true));
      const uq=b64(M.uv,Uint16Array),uv=new Float32Array(n*2);for(let i=0;i<n*2;i++)uv[i]=uq[i]/65535;g.setAttribute('uv',new T.BufferAttribute(uv,2));
      const si=b64(M.si,Uint8Array),si16=new Uint16Array(si.length);si16.set(si);g.setAttribute('skinIndex',new T.BufferAttribute(si16,4));
      g.setAttribute('skinWeight',new T.BufferAttribute(b64(M.sw,Uint8Array),4,true));
      g.setIndex(new T.BufferAttribute(M.i32?b64(M.idx,Uint32Array):b64(M.idx,Uint16Array),1));g.computeBoundingSphere();g.boundingSphere.radius=1e6;D._geo=g}
    if(!D._map){const im=new Image(),t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;im.onload=()=>{t.needsUpdate=true};im.src=D.tex.d;D._map=t}
    const mo={map:o.variant?variantTexture(D,o.variant):D._map,roughness:.75,metalness:0};if(D.alpha){mo.alphaTest=.5;mo.side=T.DoubleSide}
    this.mat=new T.MeshStandardMaterial(mo);
    const mesh=this.mesh=new T.SkinnedMesh(D._geo,this.mat);mesh.frustumCulled=false;mesh.castShadow=true;
    mesh.bind(new T.Skeleton(bones,invs),new T.Matrix4());scene.add(mesh);
    this.clips=clipsFor(D,isBoss);
    this.idx=Object.fromEntries(D.names.map((s,i)=>[s,i]));
    this.qa=new Float32Array(nb*4);this.qb=new Float32Array(nb*4);this.qc=new Float32Array(nb*4);this.ha=[0,0,0];this.hb=[0,0,0];this.hc=[0,0,0];this.ph=0;this.phR=0;this.phF=0;this.runW=0;
    this.L=[];this.W=[];for(let k=0;k<nb;k++){this.L.push(new T.Quaternion());this.W.push(new T.Quaternion())}
    this.spine=['Spine','Spine1','Spine2'].map(s=>this.idx[s]).filter(v=>v!=null);
    this.PP=[];for(let k=0;k<nb;k++)this.PP.push(new T.Vector3());this._t=new T.Quaternion();this._v=new T.Vector3();
    const LG=(u,l,f,sx)=>{const I=this.idx;if(I[u]==null||I[l]==null||I[f]==null)return null;return[I[u],I[l],I[f],sx,bones[I[l]].position.length(),bones[I[f]].position.length()]};
    const lL=LG('LeftUpLeg','LeftLeg','LeftFoot',1),lR=LG('RightUpLeg','RightLeg','RightFoot',-1);this.legs=lL&&lR?[lL,lR]:null;this.depth=0.7;
    const AR=(u,l,f)=>{const I=this.idx;if(I[u]==null||I[l]==null||I[f]==null)return null;return[I[u],I[l],I[f],bones[I[l]].position.length(),bones[I[f]].position.length()]};
    this.armR=AR('RightArm','RightForeArm','RightHand');this.armL=AR('LeftArm','LeftForeArm','LeftHand');
    this.armBones=['RightShoulder','RightArm','RightForeArm','RightHand','LeftShoulder','LeftArm','LeftForeArm','LeftHand'].map(n=>this.idx[n]).filter(v=>v!=null);
    this.sz=Math.max(0.7,Math.min(1.35,bones[0].position.y/96));this.qx=new Float32Array(nb*4);this.bodyYaw=0;this.lastP=null;
    const hand=bones[this.idx.RightHand],mid=bones[this.idx.RightHandMiddle1];
    this.aH=mid?mid.position.clone().normalize():new T.Vector3(0,1,0);
    this.handB=hand;this.midOff=mid?mid.position.clone().multiplyScalar(0.55):new T.Vector3();
    if(o.bat&&hand){this.bat=makeBat();this.bat.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),this.aH.clone());this.bat.position.copy(this.midOff);hand.add(this.bat)}
    const lh=bones[this.idx.LeftHand],lm=bones[this.idx.LeftHandMiddle1];
    if(o.glove&&lh){this.glove=makeGlove();const d=lm?lm.position.clone().normalize():new T.Vector3(0,1,0);this.glove.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d);if(lm)this.glove.position.copy(lm.position).multiplyScalar(0.9);lh.add(this.glove)}
    this.lite=!!o.lite;this.pose=o.pose||null;this.poseT=Math.random();
    this.swing=null;this.post=null;this.wLoco=0;this.tReady=Math.random()*3;
    this.pos=new T.Vector3();this.yaw=0;this.off=null;this.foot0=null;
  }
  dispose(scene){scene.remove(this.root);scene.remove(this.mesh);this.mat.dispose()}
  sample(name,t,q,h,loop){
    const c=this.clips[name];if(!c)return false;
    let f=t*c.fps;if(loop){f=f%(c.n-1);if(f<0)f+=c.n-1}f=clamp(f,0,c.n-1);
    const i0=Math.floor(f),i1=Math.min(c.n-1,i0+1),a=f-i0,nb=this.nb;
    for(let k=0;k<nb;k++){let l=0;for(let e=0;e<4;e++){const v=(c.Q[(i0*nb+k)*4+e]*(1-a)+c.Q[(i1*nb+k)*4+e]*a)/32767;q[k*4+e]=v;l+=v*v}l=Math.sqrt(l)||1;for(let e=0;e<4;e++)q[k*4+e]/=l}
    h[0]=0;h[2]=0;h[1]=c.HIP[i0*3+1]*(1-a)+c.HIP[i1*3+1]*a;
    const hy=Math.sin(-c.yaw0/2),hw=Math.cos(-c.yaw0/2),x=q[0],y=q[1],z=q[2],w=q[3];
    q[0]=hw*x+hy*z;q[1]=hw*y+hy*w;q[2]=hw*z-hy*x;q[3]=hw*w-hy*y;
    return true;
  }
  blend(qa,ha,qb,hb,w){if(w<=0)return;if(w>=1){qa.set(qb);ha[1]=hb[1];return}const nb=this.nb;
    for(let k=0;k<nb;k++){let d=0;for(let e=0;e<4;e++)d+=qa[k*4+e]*qb[k*4+e];const s=d<0?-1:1;let l=0;
      for(let e=0;e<4;e++){qa[k*4+e]=qa[k*4+e]*(1-w)+qb[k*4+e]*s*w;l+=qa[k*4+e]*qa[k*4+e]}l=Math.sqrt(l)||1;for(let e=0;e<4;e++)qa[k*4+e]/=l}
    ha[1]=ha[1]*(1-w)+hb[1]*w}
  /* type: key set name; offset: seconds already elapsed; off: {hand:[x,y,z], rd:[x,y,z]} bell-shaped correction around contact */
  startSwing(type,offset,off,speed){this.swing={type,t:offset||0,off:off||null,spd:speed||1};this.post=null}
  fk(q,h){const nb=this.nb,D=this.D,W=this.W,PP=this.PP,B=this.bones;
    for(let k=0;k<nb;k++){this.L[k].set(q[k*4],q[k*4+1],q[k*4+2],q[k*4+3]);const p=D.parent[k];
      if(p>=0){W[k].copy(W[p]).multiply(this.L[k]);PP[k].copy(B[k].position).applyQuaternion(W[p]).add(PP[p])}else{W[k].copy(this.L[k]);PP[k].set(h[0],h[1],h[2])}}}
  setLocal(q,k,Wnew,Wparent){const t=this._t.copy(Wparent).invert().multiply(Wnew).normalize();q[k*4]=t.x;q[k*4+1]=t.y;q[k*4+2]=t.z;q[k*4+3]=t.w}
  athletic(q,h,depth,P,wT){
    if(!this.legs)return;
    const W=this.W,PP=this.PP,D=this.D,s=this.sz;this.fk(q,h);
    if(!this.foot0)this.foot0=this.legs.map(l=>PP[l[2]].clone());
    const foot=[],footW=[],hint=[],by=-(this.bodyYaw||0),cb=Math.cos(by),sb=Math.sin(by);
    const rotY=(x,y,z)=>new T.Vector3(x*cb+z*sb,y,-x*sb+z*cb);
    this.legs.forEach((l,j)=>{const [u,lo,f,sx]=l;const clip=PP[f].clone();
      const o=P?(j===0?P.fl:P.fr):null,f0=this.foot0[j];
      if(P&&wT>0){const tg=rotY(f0.x+o[0]*s,f0.y+o[1]*s,f0.z+o[2]*s);clip.lerp(tg,wT)}
      foot.push(clip);footW.push(W[f].clone());hint.push(PP[lo].clone().sub(PP[u]))});
    h[1]-=13*depth*s;
    if(P&&wT>0){const hs=rotY(P.hs[0]*s,P.hs[1]*s,P.hs[2]*s);h[0]+=hs.x*wT;h[1]+=hs.y*wT;h[2]+=hs.z*wT}
    const d2r=Math.PI/180,pel=(P?P.pel:0)*wT*d2r,shY=(P?P.sh:0)*wT*d2r,pit=0.2*Math.min(depth,1.4)+(P?P.pitch:0)*wT,rol=(P?P.roll:0)*wT*d2r;
    const Y=new T.Vector3(0,1,0),X=new T.Vector3(1,0,0),Z=new T.Vector3(0,0,1);
    const W0=new T.Quaternion().setFromAxisAngle(Y,pel).multiply(W[0]);q[0]=W0.x;q[1]=W0.y;q[2]=W0.z;q[3]=W0.w;
    const sp=this.spine;let prev=W0;
    for(let i=0;i<sp.length;i++){const k=sp[i],f=(i+1)/sp.length;
      const R=new T.Quaternion().setFromAxisAngle(Y,pel+(shY-pel)*f).multiply(new T.Quaternion().setFromAxisAngle(X,pit*f/(1+0*i))).multiply(new T.Quaternion().setFromAxisAngle(Z,rol*f));
      const Wd=R.multiply(W[k]);this.setLocal(q,k,Wd,prev);prev=Wd}
    this.fk(q,h);
    const v=new T.Vector3(),dHT=new T.Vector3(),n=new T.Vector3(),Kp=new T.Vector3(),rq=new T.Quaternion();
    this.legs.forEach((l,j)=>{const [u,lo,f,sx,a,b]=l,hip=PP[u],Tg=foot[j];
      dHT.copy(Tg).sub(hip);let d=dHT.length();d=clamp(d,Math.abs(a-b)+0.5,a+b-0.3);dHT.normalize();
      const cosA=clamp((a*a+d*d-b*b)/(2*a*d),-1,1),sinA=Math.sqrt(1-cosA*cosA);
      // knees point the way the hips face, a little outward
      const fwd=new T.Vector3(Math.sin(pel*0.6),0,Math.cos(pel*0.6));
      n.copy(fwd).multiplyScalar(14).add(new T.Vector3(sx*4,0,0)).add(hint[j].clone().multiplyScalar(0.2));n.sub(v.copy(dHT).multiplyScalar(n.dot(dHT)));if(n.lengthSq()<1e-6)n.set(0,0,1);n.normalize();
      Kp.copy(hip).add(v.copy(dHT).multiplyScalar(a*cosA)).add(n.multiplyScalar(a*sinA));
      const cur=v.copy(PP[lo]).sub(hip).normalize(),des=Kp.clone().sub(hip).normalize();rq.setFromUnitVectors(cur,des);
      const Wu=rq.clone().multiply(W[u]);this.setLocal(q,u,Wu,W[D.parent[u]]);
      const Wl=Wu.clone().multiply(this.L[lo]);const c2=this.bones[f].position.clone().normalize().applyQuaternion(Wl);
      const d2=Tg.clone().sub(Kp).normalize();rq.setFromUnitVectors(c2,d2);const Wl2=rq.clone().multiply(Wl);this.setLocal(q,lo,Wl2,Wu);
      this.setLocal(q,f,footW[j],Wl2)});
  }
  ik2(q,u,l,f,a,b,Tg,pole){
    const W=this.W,PP=this.PP,D=this.D,v=new T.Vector3(),dHT=Tg.clone().sub(PP[u]);let d=dHT.length();d=clamp(d,Math.abs(a-b)+0.5,a+b-0.2);dHT.normalize();
    const cosA=clamp((a*a+d*d-b*b)/(2*a*d),-1,1),sinA=Math.sqrt(1-cosA*cosA);
    const n=pole.clone();n.sub(v.copy(dHT).multiplyScalar(n.dot(dHT)));if(n.lengthSq()<1e-6)n.set(0,-1,0);n.normalize();
    const Kp=PP[u].clone().add(v.copy(dHT).multiplyScalar(a*cosA)).add(n.multiplyScalar(a*sinA));
    const rq=new T.Quaternion().setFromUnitVectors(PP[l].clone().sub(PP[u]).normalize(),Kp.clone().sub(PP[u]).normalize());
    const Wu=rq.multiply(W[u].clone());this.setLocal(q,u,Wu,W[D.parent[u]]);
    const Wl=Wu.clone().multiply(this.L[l]),c2=this.bones[f].position.clone().normalize().applyQuaternion(Wl),d2=Tg.clone().sub(Kp).normalize();
    const Wl2=new T.Quaternion().setFromUnitVectors(c2,d2).multiply(Wl);this.setLocal(q,l,Wl2,Wu);return Wl2}
  arms(q,h,P,w){
    if(w<=0.01||!this.armR||!this.armL)return;
    const qa=this.qx;qa.set(q);this.fk(qa,h);
    const s=this.sz,hy=this.PP[0].y,tg=a=>new T.Vector3(a[0]*s,hy+(a[1]-96)*s,a[2]*s);
    const [ru,rl,rf,ra,rb]=this.armR,rd=V(...P.rd);
    const Wl=this.ik2(qa,ru,rl,rf,ra,rb,tg(P.hand),V(...P.pole));
    const Wh=Wl.clone().multiply(this.L[rf]),cur=this.aH.clone().applyQuaternion(Wh);
    this.setLocal(qa,rf,new T.Quaternion().setFromUnitVectors(cur,rd).multiply(Wh),Wl);
    this.fk(qa,h);let Lt=tg(P.L);
    // bat grip: bottom hand just below the top hand on the handle
    if(P.gw>0.01){const g=this.PP[rf].clone().add(rd.clone().multiplyScalar(-9*s)).add(new T.Vector3(0,0,0));Lt.lerp(g,clamp(P.gw,0,1))}
    const [lu,ll,lf,la,lb]=this.armL;const WlL=this.ik2(qa,lu,ll,lf,la,lb,Lt,new T.Vector3(0.6,-0.6,-0.25));
    if(P.gw>0.5){// bottom hand wraps the handle the same way
      const WhL=WlL.clone().multiply(this.L[lf]),cL=this.aH.clone().set(-this.aH.x,this.aH.y,this.aH.z).applyQuaternion(WhL);this.setLocal(qa,lf,new T.Quaternion().setFromUnitVectors(cL,rd).multiply(WhL),WlL)}
    for(const k of this.armBones){let d=0;for(let e=0;e<4;e++)d+=q[k*4+e]*qa[k*4+e];const sg=d<0?-1:1;let l=0;
      for(let e=0;e<4;e++){q[k*4+e]=q[k*4+e]*(1-w)+qa[k*4+e]*sg*w;l+=q[k*4+e]*q[k*4+e]}l=Math.sqrt(l)||1;for(let e=0;e<4;e++)q[k*4+e]/=l}
  }
  /* world position of the right hand (where the ball sits for a pitcher) */
  handWorld(){this.root.updateMatrixWorld(true);return this.handB?this.handB.localToWorld(this.midOff.clone()):this.pos.clone().setY(1.5)}
  gloveWorld(){this.root.updateMatrixWorld(true);return this.glove?this.glove.getWorldPosition(new T.Vector3()):this.pos.clone().setY(1)}
  /* a point on the bat, cm from the top hand (sweet spot ~ 54) */
  batPoint(cm){this.root.updateMatrixWorld(true);return this.bat?this.bat.localToWorld(new T.Vector3(0,cm,0)):this.pos.clone()}
  /* vx, vz: velocity in the player's own frame (vz forward) */
  update(dt,vx,vz){
    const q=this.qa,h=this.ha,qb=this.qb,hb=this.hb,qc=this.qc,hc=this.hc;
    vx=vx||0;vz=vz||0;const side=-vx,fwd=vz,sp=Math.hypot(vx,vz),wF=sp>0.05?Math.abs(fwd)/(Math.abs(side)+Math.abs(fwd)):0;
    this.tReady+=dt;this.sample('ready',this.tReady,q,h,true);
    const moving=sp>0.15;this.wLoco+=((moving?1:0)-this.wLoco)*Math.min(1,dt*(moving?14:9));
    const want=sp>3.4?1:0;this.runW+=(want-this.runW)*Math.min(1,dt*(want?5:8));
    if(this.wLoco>0.01&&this.clips.walkR&&this.clips.strafeR){
      const r=side>=0,Wk=r?'walkR':'walkL',Sk=r?'strafeR':'strafeL',Wc=this.clips[Wk],Sc=this.clips[Sk];
      const fast=clamp((sp-3.1)/1.1,0,1),sW=Math.max(0.3,(Wc.spd||1.5)*Wc.dur*PSCALE),sS=Math.max(0.3,(Sc.spd||3.9)*Sc.dur*PSCALE);
      this.ph=(this.ph+dt*sp/(sW*(1-fast)+sS*fast))%1;
      this.sample(Wk,this.ph*Wc.dur,qb,hb,true);this.sample(Sk,this.ph*Sc.dur,qc,hc,true);this.blend(qb,hb,qc,hc,fast);
      const F=this.clips.walkF;
      if(F&&wF>0.05){const sF=Math.max(0.3,(F.spd||1.5)*F.dur*PSCALE);this.phF=((this.phF+dt*(fwd>=0?1:-1)*sp/sF)%1+1)%1;
        this.sample('walkF',this.phF*F.dur,qc,hc,true);this.blend(qb,hb,qc,hc,clamp(wF*1.4-0.2,0,1))}
      if(this.runW>0.01&&this.clips.run){const R=this.clips.run;this.phR=(this.phR+dt*sp/Math.max(0.3,(R.spd||3.8)*R.dur*PSCALE))%1;this.sample('run',this.phR*R.dur,qc,hc,true);this.blend(qb,hb,qc,hc,this.runW)}
      this.blend(q,h,qb,hb,this.wLoco)}
    // pose: a swing in progress, a held pose, or none (clip only), eased back after a swing
    let P=null,wT=0,wA=0;const hold=this.pose?(this.pose==='stance'?STANCE:sampleSwing(SWINGS[this.pose],(this.poseU!=null?this.poseU:0))):null;
    if(this.swing){const s=this.swing,S=SWINGS[s.type];s.t+=dt*s.spd;let u=s.t/S.dur;
      if(u>=1&&!s.hold){this.post={P:this.lastP||READY,t:0};this.swing=null}
      else{u=Math.min(u,1);let Pk=sampleSwing(S,u);
        if(s.off){const bell=Math.exp(-Math.pow((u-S.cf)/0.16,2));for(let j=0;j<3;j++){Pk.hand[j]+=s.off.hand[j]*bell;Pk.rd[j]+=(s.off.rd?s.off.rd[j]:0)*bell}}
        P=Pk;this.lastP=Pk;wT=1;wA=1}}
    if(!P){if(this.post){this.post.t+=dt;const a=clamp(this.post.t/0.45,0,1),e=a*a*(3-2*a),to=hold||READY;P=mixP(this.post.P,to,e);wT=hold?1:1-e;wA=hold?1:1-e;if(a>=1)this.post=null}
      else if(hold){P=hold;wT=1-this.wLoco;wA=1-this.wLoco}}
    this.bodyYaw=(P?(P.body||0)*wT:0)*Math.PI/180;
    const dT=P?P.dp*wT+0.4*(1-wT):this.wLoco>0.5?0.15:0.45;
    this.depth+=(dT-this.depth)*Math.min(1,dt*(this.swing?22:9));
    if(!this.lite||P)this.athletic(q,h,this.depth,P,wT);else h[1]-=13*this.depth*this.sz;
    if(P)this.arms(q,h,P,wA);
    const B=this.bones;for(let k=0;k<this.nb;k++)B[k].quaternion.set(q[k*4],q[k*4+1],q[k*4+2],q[k*4+3]);B[0].position.set(h[0],h[1],h[2]);
    const m=this.root.matrix;m.makeRotationY(this.yaw+this.bodyYaw);if(this.tilt)m.multiply(new T.Matrix4().makeRotationZ(this.tilt));if(this.pitchT)m.multiply(new T.Matrix4().makeRotationX(this.pitchT));m.scale(new T.Vector3(.01*PSCALE,.01*PSCALE,.01*PSCALE));m.setPosition(this.pos.x,this.pos.y+(this.lift||0),this.pos.z);this.root.matrixWorldNeedsUpdate=true;
  }
}
/* team colours: hue-shift the clothing on a character's texture (skin is left alone) */
function variantTexture(D,v){D._vmaps=D._vmaps||{};const key=v.h+'_'+v.t;if(D._vmaps[key])return D._vmaps[key];
  const cv=document.createElement('canvas');cv.width=cv.height=1024;{const g0=cv.getContext('2d');g0.fillStyle='#8a8f96';g0.fillRect(0,0,1024,1024)}
  const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;D._vmaps[key]=t;
  const im=new Image();im.onload=()=>{const S=1024;const g=cv.getContext('2d');g.clearRect(0,0,S,S);g.drawImage(im,0,0,S,S);const id=g.getImageData(0,0,S,S),d=id.data;
    const ch=Math.cos(v.h*Math.PI/180),sh=Math.sin(v.h*Math.PI/180);
    const m=[0.213+ch*0.787-sh*0.213,0.715-ch*0.715-sh*0.715,0.072-ch*0.072+sh*0.928,0.213-ch*0.213+sh*0.143,0.715+ch*0.285+sh*0.140,0.072-ch*0.072-sh*0.283,0.213-ch*0.213-sh*0.787,0.715-ch*0.715+sh*0.715,0.072+ch*0.928+sh*0.072];
    for(let i=0;i<d.length;i+=4){const r=d[i],gg=d[i+1],b=d[i+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),val=mx/255,sat=mx?(mx-mn)/mx:0;
      if(d[i+3]<10)continue;
      let hue=0;if(mx!==mn){if(mx===r)hue=((gg-b)/(mx-mn)+6)%6;else if(mx===gg)hue=(b-r)/(mx-mn)+2;else hue=(r-gg)/(mx-mn)+4;hue*=60}
      const skin=hue>=4&&hue<=48&&sat>=0.16&&sat<=0.72&&val>=0.28&&r>gg&&gg>=b;
      if(skin||sat<0.12)continue;
      d[i]=clamp(m[0]*r+m[1]*gg+m[2]*b,0,255);d[i+1]=clamp(m[3]*r+m[4]*gg+m[5]*b,0,255);d[i+2]=clamp(m[6]*r+m[7]*gg+m[8]*b,0,255)}
    g.putImageData(id,0,0);t.needsUpdate=true};
  im.src=D.tex.d;return t}
