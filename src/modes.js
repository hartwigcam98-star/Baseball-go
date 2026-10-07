/* ================= quick modes: Home Run Derby and Home Run Pinball =================
   Both run on batting practice: a coach throws meatballs and every swing counts.
   Derby: 10 outs, any swing that isn't a homer is an out, every fifth pitch is a golden ball worth two.
   Pinball: 20 swings, hits score points and glowing rings above the wall pay big when a drive flies through them. */
const MODES={derby:{n:'Home Run Derby',outs:10},pinball:{n:'Home Run Pinball',swings:20}};
const BEST_KEY='bg-best';
function bests(){try{return JSON.parse(localStorage.getItem(BEST_KEY))||{}}catch(e){return{}}}
function today(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
let MD=null;// the running mode
async function startMode(mode,id,st,lv){ACTIVE_PERKS=[];
  const pid=id==='granny'?'ch39':'granny';
  await setupScene({park:LEVELS[lv].park,batterId:id,pitcherId:pid,homeColor:0x2E5FA8,defHue:200,myHue:0});sndResume();
  MD={mode,lv,id,st,score:0,outs:0,swings:0,pitchN:0,dist:0,targets:[]};
  if(mode==='pinball')makeTargets();
  const pi={name:RBYID[pid].name,velo:Math.round(LEVELS[lv].velo[0]+3),control:95,stuff:30,ovr:50,mix:[['FF',1]]};
  A=null;startPA({lv,st,pitcher:pi,practice:true,mode,intro:mode==='derby'?'Home Run Derby: 10 outs. Anything but a homer is an out.':'Pinball: 20 swings. Drive it through the rings!',teams:['',''],onDone:()=>{}});
  ABQ.quit=null;$('ab').classList.add('mode');renderMode()}
/* meatballs: belt high over the plate, a little wander; every fifth one in the derby is golden */
function modePitch(){MD.pitchN++;const gold=MD.mode==='derby'&&MD.pitchN%5===0;
  return{type:'FF',tx:gauss()*0.07,ty:0.78+gauss()*0.07,mph:A.cfg.pitcher.velo+gauss(),ax:-1,ay:3,gold}}
function makeTargets(){const vals=[[-0.55,500,18],[-0.25,200,12],[0,300,20],[0.3,200,11],[0.58,500,16]];
  for(const [phi,pts,h] of vals){const d=fenceDist(phi)+6,p=dirOf(phi).multiplyScalar(d);p.y=PARK.wall+h;
    const col=pts>=500?0xFF4D9A:pts>=300?0xF2C230:0x4CD3FF,g=new T.Group();
    const ring=new T.Mesh(new T.TorusGeometry(4.2,0.35,10,40),new T.MeshBasicMaterial({color:col}));g.add(ring);
    const lab=cvTex(256,128,(c,w,h)=>{c.fillStyle='rgba(0,0,0,0)';c.clearRect(0,0,w,h);c.font='bold 80px sans-serif';c.textAlign='center';c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=8;c.strokeText(pts,w/2,90);c.fillText(pts,w/2,90)});
    const sp=new T.Sprite(new T.SpriteMaterial({map:lab,transparent:true,depthWrite:false}));sp.scale.set(7,3.5,1);sp.position.y=5.6;g.add(sp);
    g.position.copy(p);g.lookAt(0,p.y,0);W3.scene.add(g);MD.targets.push({g,ring,p,pts,r:4.2,col})}}
function clearTargets(){if(!MD)return;for(const t of MD.targets){W3.scene.remove(t.g)}MD.targets=[]}
/* called after every swing in a mode: kind is 'play', 'foul' or 'whiff'; R is the play result for balls in play */
function modeSwing(kind,R){if(!MD||!A||A.cfg.mode!==MD.mode)return;MD.swings++;let pts=0,msg='';
  const gold=A.pitch&&A.pitch.gold;
  if(MD.mode==='derby'){if(kind==='play'&&R.code==='HR'){pts=gold?2:1;MD.dist+=Math.round(distFt());msg=gold?'Golden homer! +2':'+1 homer'}else{MD.outs++;msg='Out '+MD.outs+' of 10'}}
  else{if(kind==='play'){pts={'1B':10,'2B':25,'3B':50,HR:100}[R.code]||0;
      // rings: did the flight pass through any of them?
      const P=A.B.pts;for(const t of MD.targets){if(t.hit)continue;for(let k=0;k<P.length;k+=4){const dx=P[k+1]-t.p.x,dy=P[k+2]-t.p.y,dz=P[k+3]-t.p.z;if(dx*dx+dy*dy+dz*dz<t.r*t.r){t.hitNow=true;break}}
        if(t.hitNow){t.hitNow=false;pts+=t.pts;fireworks(t.p.x,t.p.y,t.p.z,2,[[1,1,1]]);t.ring.material.color.setHex(0xffffff);setTimeout(()=>t.ring.material.color.setHex(t.col),600);msg='Ring! +'+t.pts}}
      if(!msg)msg=pts?'+'+pts:'No points'}
    else msg='No points';msg+=' · swing '+MD.swings+' of 20'}
  MD.score+=pts;if(pts)showCall(msg,false,'w');say(msg);renderMode();
  const over=MD.mode==='derby'?MD.outs>=10:MD.swings>=20;if(over){A.state='over';setTimeout(endMode,1600)}}
function renderMode(){if(!MD)return;const B=bests()[MD.mode]||0;
  $('bug').innerHTML='<div class="bl"><span class="eyebrow">'+MODES[MD.mode].n+'</span><span class="tm">Score <b class="num">'+MD.score+'</b></span></div><div class="bm"><span class="num">'+(MD.mode==='derby'?MD.outs+'/10 outs':MD.swings+'/20')+'</span><span class="muted" style="font-size:12px">Best '+B+'</span></div>'}
function endMode(){if(!MD||!A)return;const b=bests(),m=MD.mode,best=b[m]||0,dk=m+'_'+today(),day=b[dk]||0,isBest=MD.score>best;
  if(isBest)b[m]=MD.score;if(MD.score>day)b[dk]=MD.score;try{localStorage.setItem(BEST_KEY,JSON.stringify(b))}catch(e){}
  A.state='over';emit({t:'mode',m,score:MD.score});gainProf(Math.round(MD.score*(m==='derby'?4:0.05)));
  const p=$('modeEnd');p.hidden=false;$('meTitle').textContent=MODES[m].n;
  $('meBody').innerHTML='<p class="score-line num">'+MD.score+'</p><p class="muted">'+(m==='derby'?'home runs'+(MD.dist?' · '+MD.dist.toLocaleString()+' total feet':''):'points')+'</p>'+(isBest?'<p class="banner w">New personal best!</p>':'<p class="muted">Best: '+best+' · Today: '+Math.max(day,MD.score)+'</p>');
  $('meAgain').onclick=()=>{p.hidden=true;clearTargets();const s=MD;MD=null;startMode(s.mode,s.id,s.st,s.lv)};
  $('meQuit').onclick=()=>{p.hidden=true;clearTargets();MD=null;A=null;renderTitle()}}
