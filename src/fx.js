/* ================= feel: game clock (hit-stop), contact bursts, ball trail, camera kick, haptics ================= */
const CLK={rt:performance.now(),ts:1,hsUntil:0,slow:1,slowT:1};
let GT=performance.now();
function clockTick(){const r=performance.now(),d=Math.min(100,r-CLK.rt);CLK.rt=r;
  CLK.slow+=(CLK.slowT-CLK.slow)*Math.min(1,d/120);CLK.ts=CLK.paused?0:r<CLK.hsUntil?0.05:CLK.slow;GT+=d*CLK.ts}
function hitStop(ms){if(!ms)return;CLK.hsUntil=Math.max(CLK.hsUntil,performance.now()+ms)}
const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const HAP={el:null};
function haptic(ms){try{if(navigator.vibrate){navigator.vibrate(ms);return}}catch(e){}}
function hapticTap(){if(navigator.vibrate){try{navigator.vibrate(10)}catch(e){}return}
  if(!IOS)return;try{if(!HAP.el){const l=document.createElement('label'),i=document.createElement('input');i.type='checkbox';i.setAttribute('switch','');l.appendChild(i);l.style.cssText='position:fixed;left:-99px;top:0;opacity:0;pointer-events:none';document.body.appendChild(l);HAP.el=l}HAP.el.click()}catch(e){}}
const FX={trail:null,tp:[],bursts:[],shake:0,shakeAmp:0};
function fxInit(s){
  const tm=new T.InstancedMesh(new T.SphereGeometry(0.035,8,6),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9,blending:T.AdditiveBlending,depthWrite:false}),16);
  tm.frustumCulled=false;tm.count=0;s.add(tm);FX.trail=tm;tm.setColorAt(0,new T.Color());
  for(let i=0;i<3;i++){const m=new T.Mesh(new T.RingGeometry(0.3,0.38,32),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));m.visible=false;s.add(m);FX.bursts.push({m,t:9})}}
function ringBurst(pos,col,size){const b=FX.bursts.find(b=>b.t>=1)||FX.bursts[0];b.t=0;b.size=size||1;b.m.material.color.setHex(col);b.m.position.copy(pos);b.m.visible=true}
function kick(amp){FX.shakeAmp=Math.max(FX.shake>0?FX.shakeAmp:0,amp);FX.shake=0.2}
/* the moment of contact: a burst at the ball, a tiny freeze and a camera kick for the barrels */
function onContact(pos,ev,barrel){const big=ev>=98;ringBurst(pos,barrel?0xB8FF40:big?0xFFB347:0xFFFFFF,barrel?1.6:big?1.3:0.9);
  if(barrel||big){kick(barrel?0.06:0.04);hitStop(barrel?70:45)}haptic(barrel?30:big?20:12);FX.tp=[]}
function fxTick(dt){
  for(const b of FX.bursts){if(b.t>=1){b.m.visible=false;continue}b.t+=dt/0.25;const e=Math.min(1,b.t);b.m.lookAt(W3.cam.position);b.m.scale.setScalar((0.3+e*1.2)*b.size);b.m.material.opacity=0.9*(1-e)}
  const tr=FX.trail,live=A&&(A.state==='pitch'||A.state==='play');
  if(W3.ball.visible&&live){const p=W3.ball.position,last=FX.tp[FX.tp.length-1];if(!last||last.distanceToSquared(p)>0.01){FX.tp.push(p.clone());if(FX.tp.length>16)FX.tp.shift()}}else FX.tp=[];
  const n=FX.tp.length,mx=new T.Matrix4(),c=new T.Color(),base=A&&A.state==='play'?new T.Color(0xFFD23F):new T.Color(0xFFFFFF);
  for(let i=0;i<n;i++){const f=(i+1)/n,s=0.3+0.7*f;mx.makeScale(s,s,s).setPosition(FX.tp[i]);tr.setMatrixAt(i,mx);c.copy(base).multiplyScalar(f*f*0.55);tr.setColorAt(i,c)}
  tr.count=n;tr.instanceMatrix.needsUpdate=true;if(tr.instanceColor)tr.instanceColor.needsUpdate=true;
  if(FX.shake>0)FX.shake-=dt}
function shakeOffset(){if(FX.shake<=0)return null;const a=FX.shakeAmp*(FX.shake/0.2);return new T.Vector3((Math.random()-0.5)*a,(Math.random()-0.5)*a,(Math.random()-0.5)*a)}
