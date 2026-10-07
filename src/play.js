/* ================= ball physics and how a play turns out =================
   Pure functions on plain numbers (no three.js), so the same code decides live at-bats and simulated ones.
   x: + toward first base, y: up, z: - toward centre field. Units: metres, seconds. */
const BX={g:9.81,k:0.5*1.2*0.00421/0.145,cd:0.36,dt:1/120};
const MPH=0.44704;
const B1=[19.397,-19.397],B2=[0,-38.795],B3=[-19.397,-19.397],BH=[0,0];
const BASEXZ=[BH,B1,B2,B3];
function fdist(phi,P){const a=Math.min(1,Math.abs(phi)/(Math.PI/4));return P.line+(P.cf-P.line)*(1-Math.pow(a,1.7))}
/* batted-ball flight: drag, backspin lift (topspin for grounders), bounces and roll; stops at the wall, over it, or at rest */
function simBall(ev,la,spray,P,opt){
  opt=opt||{};const d2r=Math.PI/180,v=ev*MPH,L=la*d2r;
  let x=opt.x0||0,y=opt.y0||0.9,z=opt.z0||-0.4,vx=v*Math.cos(L)*Math.sin(spray),vy=v*Math.sin(L),vz=-v*Math.cos(L)*Math.cos(spray);
  const cl=la>=4?0.175*Math.exp(-Math.pow((la-28)/20,2)):la>=-4?0.02:-0.06,dt=BX.dt;
  const pts=[0,x,y,z];let t=0,landT=null,land=null,hr=false,wall=null,bounces=0,rolling=false,apex=y,stop=false,foulAt=null,fairAt=null;
  for(let i=0;i<12/dt;i++){
    const sp=Math.hypot(vx,vy,vz);
    if(!rolling){const vh=Math.hypot(vx,vz)||1e-6,kd=BX.k*BX.cd*sp,kl=BX.k*(bounces?0:cl)*sp;
      // lift acts perpendicular to the flight path in the vertical plane
      const nx=-vy*vx/vh,ny=vh,nz=-vy*vz/vh,nn=Math.hypot(nx,ny,nz)||1;
      vx+=(-kd*vx+kl*sp*nx/nn)*dt;vy+=(-BX.g-kd*vy+kl*sp*ny/nn)*dt;vz+=(-kd*vz+kl*sp*nz/nn)*dt;
      x+=vx*dt;y+=vy*dt;z+=vz*dt;
      if(y<=0.037){y=0.037;if(landT==null){landT=t+dt;land=[x,z]}
        bounces++;const imp=-vy;vy=imp*(bounces===1?0.42:0.38);const fr=bounces===1?0.72:0.8;vx*=fr;vz*=fr;if(vy<1.2){rolling=true;vy=0}}}
    else{const vh=Math.hypot(vx,vz);if(vh<0.25){stop=true}else{const dec=Math.min(vh,(3.2+vh*0.08)*dt);vx-=vx/vh*dec;vz-=vz/vh*dec}x+=vx*dt;z+=vz*dt}
    t+=dt;if(y>apex)apex=y;
    // fair or foul is settled as the ball passes the bases (or where it lands beyond them)
    const r=Math.hypot(x,z);
    if(fairAt==null&&foulAt==null){const fair=-z>=Math.abs(x)-0.05;
      if(landT!=null&&Math.hypot(land[0],land[1])>27.5){if(-land[1]>=Math.abs(land[0])-0.05)fairAt=t;else foulAt=t}
      else if(landT!=null&&r>27.5){if(fair)fairAt=t;else foulAt=t}
      else if(landT!=null&&stop){if(fair)fairAt=t;else foulAt=t}
      else if(landT==null&&z>1.5){foulAt=t}}
    // the wall
    const phi=Math.atan2(x,-z);
    if(Math.abs(phi)<=Math.PI/4+0.02){const fd=fdist(phi,P);
      if(r>=fd-0.15&&!wall){if(y>P.wall&&landT==null){hr=true;wall={t,x,z,y};pts.push(t,x,y,z);break}
        wall={t,x,z,y};const ux=x/r,uz=z/r,vr=vx*ux+vz*uz;vx-=1.35*vr*ux;vz-=1.35*vr*uz;vx*=0.65;vz*=0.65;x=ux*(fd-0.3);z=uz*(fd-0.3)}}
    else if(r>130){stop=true}
    if(i%2===1)pts.push(t,x,y,z);
    if(stop)break;
    if(foulAt!=null&&landT!=null&&t>foulAt+0.6)break}
  return{pts,landT,land,hr,wall,apex,stop,foul:foulAt!=null&&!hr&&fairAt==null,dist:land?Math.hypot(land[0],land[1]):null,T:t,ev,la,spray}}
function ballAt(B,t){const p=B.pts,n=p.length/4;if(t<=0)return[p[1],p[2],p[3]];
  let lo=0,hi=n-1;if(t>=p[(n-1)*4])return[p[(n-1)*4+1],p[(n-1)*4+2],p[(n-1)*4+3]];
  while(hi-lo>1){const m=(lo+hi)>>1;if(p[m*4]<=t)lo=m;else hi=m}
  const a=(t-p[lo*4])/(p[hi*4]-p[lo*4]||1);return[p[lo*4+1]+(p[hi*4+1]-p[lo*4+1])*a,p[lo*4+2]+(p[hi*4+2]-p[lo*4+2])*a,p[lo*4+3]+(p[hi*4+3]-p[lo*4+3])*a]}
/* fielders, numbered the scorer's way: 1 P, 2 C, 3 1B, 4 2B, 5 3B, 6 SS, 7 LF, 8 CF, 9 RF */
const FPOS=[null,[0,-17.4],[0,1.0],[16.2,-23.4],[8.4,-33.2],[-16.4,-23.2],[-9.6,-33.4],[-29,-80],[0,-95],[29,-80]];
const FNAME=[null,'pitcher','catcher','first baseman','second baseman','third baseman','shortstop','left fielder','center fielder','right fielder'];
const FSHORT=[null,'P','C','1B','2B','3B','SS','LF','CF','RF'];
function fv(i){return i===1?5.4:i===2?4.6:i>=7?7.0:6.4}
function freact(i,air){return i>=7?(air?0.5:0.4):i===2?0.4:0.24}
function runDist(t,vmax,a){if(t<=0)return 0;const ta=vmax/a;return t<ta?0.5*a*t*t:0.5*vmax*ta+vmax*(t-ta)}
function runTime(d,vmax,a){const ta=vmax/a,da=0.5*vmax*ta;return d<=da?Math.sqrt(2*d/a):ta+(d-da)/vmax}
function fielderCan(i,fp,bx,bz,t,air,reach){const d=Math.hypot(bx-fp[0],bz-fp[1])-reach;return d<=runDist(t-freact(i,air),fv(i),7)}
function dist2(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1])}
/* base-runner speed from the 0-99 speed rating; time from home to first after contact is about 4.0-4.6 s */
function runV(spd){return 7.3+(spd||50)*0.016}
function toFirst(spd){return 0.32+runTime(BASE_L,runV(spd),7)}
const BASE_L=27.432;
/* how a batted ball plays out against the defence. B: from simBall. ctx: {outs, bases:[r1,r2,r3] (runner speed or null), spd: batter speed,
   err: error rate, arm: outfield arm m/s}. Returns the result plus a script for the 3D view. */
function resolvePlay(B,ctx,rand){
  rand=rand||Math.random;const P=B.pts,n=P.length/4,outs=ctx.outs,bs=ctx.bases.slice(),spd=ctx.spd;
  const R={code:null,out:0,runs:0,rbi:0,bases:[null,null,null],fielder:null,t:null,catchAt:null,throws:[],chase:[],desc:'',hit:0,err:false,air:false,batterTo:0,runnerMoves:[]};
  const air=B.landT;// time the ball first touches the ground (null for a home run)
  // 1) home run
  if(B.hr){// a leaping catch at the wall?
    const w=B.wall,i=w.x<-25?7:w.x>25?9:8;
    if(w.y<PARK_WALL()+0.55&&fielderCan(i,FPOS[i],w.x,w.z,w.t,true,0.6)&&rand()<0.45){R.code='FO';R.out=1;R.fielder=i;R.t=w.t;R.catchAt=[w.x,w.y,w.z];R.desc='robbed at the wall by the '+FNAME[i];R.robbed=true;R.air=true;return finishOut(R,ctx,B)}
    if(w.y<PARK_WALL()+1.4&&fielderCan(i,FPOS[i],w.x,w.z,w.t,true,0.9))R.robAt={i,t:w.t,x:w.x,y:w.y,z:w.z};
    R.code='HR';R.hit=4;R.runs=1+bs.filter(b=>b!=null).length;R.rbi=R.runs;R.batterTo=4;R.desc='home run';
    R.runnerMoves=bs.map((b,k)=>b!=null?{from:k+1,to:4}:null).filter(Boolean);return R}
  // 2) caught in the air? earliest catchable moment for any fielder (fly balls, liners, pop-ups, foul pops in play)
  let best=null;
  for(let k=0;k<n;k++){const t=P[k*4],x=P[k*4+1],y=P[k*4+2],z=P[k*4+3];if(air!=null&&t>air+0.001)break;if(y>2.6||t<0.12)continue;
    const fair=-z>=Math.abs(x)-0.05,inPlay=fair||(Math.abs(x)<36&&z<-1&&Math.abs(Math.abs(x)+z)<14)||(z>=-1&&Math.hypot(x,z)<16);
    if(!inPlay)continue;
    for(let i=1;i<=9;i++){const reach=y<1.9?1.0:0.8;if(fielderCan(i,FPOS[i],x,z,t,true,reach)){if(!best||t<best.t)best={t,i,x,y,z,dive:false};break}
      if(y<1.6&&fielderCan(i,FPOS[i],x,z,t,true,2.3)&&(!best||t<best.t-0.01))best={t,i,x,y,z,dive:true}}
    if(best&&!best.dive)break}
  if(best){const pr=best.dive?0.5:1-(ctx.err||0.02)*0.6;
    if(rand()<pr){const la=B.la;R.code=la>=45?'PO':la<14?'LO':'FO';if(best.i<=6&&la>=14&&la<45)R.code='PO';R.out=1;R.fielder=best.i;R.t=best.t;R.catchAt=[best.x,best.y,best.z];R.dive=best.dive;R.air=true;
      R.desc=(R.code==='LO'?'lines out to the ':R.code==='PO'?'pops out to the ':'flies out to the ')+FNAME[best.i]+(best.dive?' on a diving catch':'');
      if(!(-best.z>=Math.abs(best.x)-0.05))R.desc='fouls out to the '+FNAME[best.i];
      return finishOut(R,ctx,B)}
    if(best.dive){R.dove=best.i;R.diveAt=best}else{R.err=true;R.errBy=best.i}}
  if(B.foul){R.code='FOUL';return R}
  // 3) on the ground: can an infielder (or pitcher / catcher) get to it?
  let gi=null;
  for(let k=0;k<n;k++){const t=P[k*4],x=P[k*4+1],y=P[k*4+2],z=P[k*4+3];if(air==null||t<air-0.05||y>1.4)continue;if(Math.hypot(x,z)>48)break;
    for(const i of[1,2,3,4,5,6]){if(fielderCan(i,FPOS[i],x,z,t,false,0.85)){gi={t,i,x,z,dive:false};break}
      if(i!==1&&i!==2&&fielderCan(i,FPOS[i],x,z,t,false,1.8)){if(rand()<0.4){gi={t,i,x,z,dive:true};break}if(!R.gDiveAt)R.gDiveAt={t,i,x,z}}}
    if(gi)break}
  const toF=toFirst(spd);
  if(gi&&!R.err){const gather=gi.dive?0.85:0.42,tF=gi.t+gather;let thr=null;
    if(rand()<(ctx.err||0.02)){R.err=true;R.errBy=gi.i}
    else{
      // force play / double play at second with a runner on first
      if(bs[0]!=null&&outs<2&&gi.i>=3&&gi.i<=6&&!gi.dive){const r1=0.25+runTime(BASE_L-3,runV(bs[0]),7),t2=tF+dist2([gi.x,gi.z],B2)/31+(gi.i===4||gi.i===6&&dist2([gi.x,gi.z],B2)<6?-0.25:0);
        if(t2<r1){const t21=t2+0.75+BASE_L/32;R.fielder=gi.i;R.t=gi.t;R.catchAt=[gi.x,0.2,gi.z];
          if(t21<toF&&outs<2){R.code='DP';R.out=2;R.throws=[{from:[gi.x,1.2,gi.z],to:[B2[0],1.2,B2[1]],t0:tF,t1:t2},{from:[B2[0],1.2,B2[1]],to:[B1[0],1.2,B1[1]],t0:t2+0.75,t1:t21}];
            R.desc='grounds into a double play';R.bases=[null,bs[1]!=null?null:null,null];return advanceOnGround(R,ctx,bs,2,true)}
          R.code='FC';R.out=1;R.throws=[{from:[gi.x,1.2,gi.z],to:[B2[0],1.2,B2[1]],t0:tF,t1:t2}];R.desc='reaches on a fielder’s choice, the runner is out at second';
          return advanceOnGround(R,ctx,bs,1,false,true)}}
      // throw to first (the first baseman just takes it to the bag himself when he is close)
      let tArr;const fp=[gi.x,gi.z];
      if(gi.i===3&&dist2(fp,B1)<9){tArr=gi.t+0.25+runTime(dist2(fp,B1),6.3,8)}
      else tArr=tF+dist2(fp,B1)/(gi.i===1?27:gi.i===2?28:31);
      R.fielder=gi.i;R.t=gi.t;R.catchAt=[gi.x,0.2,gi.z];R.dive=gi.dive;
      if(!(gi.i===3&&dist2(fp,B1)<9))R.throws=[{from:[gi.x,1.2,gi.z],to:[B1[0],1.2,B1[1]],t0:tF,t1:tArr}];else R.carry={to:[B1[0],B1[1]],t1:tArr};
      if(tArr<=toF-0.02){R.code='GO';R.out=1;R.desc='grounds out to the '+FNAME[gi.i]+(gi.dive?' on a diving stop':'');return advanceOnGround(R,ctx,bs,1,false)}
      R.code='1B';R.hit=1;R.infield=true;R.desc='beats it out for an infield single';return advanceOnHit(R,ctx,bs,1,tArr)}}
  // 4) a hit (or an error): the ball reaches the outfield; when does somebody get it?
  let of=null;
  for(let k=0;k<n;k++){const t=P[k*4],x=P[k*4+1],y=P[k*4+2],z=P[k*4+3];if(air!=null&&t<air)continue;if(y>2.0)continue;
    for(const i of[7,8,9,3,4,5,6,1,2]){if(fielderCan(i,FPOS[i],x,z,t,false,0.9)){if(!of||t<of.t)of={t,i,x,z};break}}
    if(of)break}
  if(!of){const k=n-1;of={t:P[k*4]+0.8,i:P[k*4+1]<-20?7:P[k*4+1]>20?9:8,x:P[k*4+1],z:P[k*4+3]}}
  R.fielder=of.i;R.t=of.t;R.catchAt=[of.x,0.25,of.z];
  if(R.err&&R.errBy){R.code='E';R.desc='reaches on an error by the '+FNAME[R.errBy];return advanceOnHit(R,ctx,bs,1,of.t+2,true)}
  // how far can the batter go? he takes the extra base when he beats the throw by a safe margin
  const v=runV(spd),gather=0.55,arm=ctx.arm||30,tb=k=>toF+(k-1)*(runTime(BASE_L,v,7)*0.93+0.12);
  let k=1;const thrTo=b=>of.t+gather+dist2([of.x,of.z],BASEXZ[b%4])/arm+(dist2([of.x,of.z],BASEXZ[b%4])>60?0.45:0);
  if(tb(2)+0.35<thrTo(2))k=2;if(k===2&&tb(3)+0.15<thrTo(3))k=3;if(k===3&&tb(4)+0.6<thrTo(0))k=4;
  R.code=k===4?'HR':['','1B','2B','3B'][k];R.hit=k;R.batterTo=k;R.inside=k===4;
  R.desc=k===1?'singles':k===2?'doubles':k===3?'triples':'circles the bases for an inside-the-park home run';
  const dir=of.x<-25?' to left':of.x>25?' to right':Math.abs(of.x)<12&&of.z<-60?' to center':of.x<0?' to left-center':' to right-center';
  if(k<4)R.desc+=Math.hypot(of.x,of.z)<40?(of.x<-8?' through the left side':of.x>8?' through the right side':' up the middle'):dir;
  return advanceOnHit(R,ctx,bs,k,thrTo(k+1),false,of)}
function PARK_WALL(){return(typeof PARK!=='undefined'&&PARK&&PARK.wall)||3}
/* runners after an out in the air: tag up from third on a deep enough fly */
function finishOut(R,ctx,B){const bs=ctx.bases.slice(),outs=ctx.outs+1;R.bases=bs.slice();
  if(outs<3&&R.code==='FO'&&bs[2]!=null){const d=Math.hypot(R.catchAt[0],R.catchAt[2]),tThrow=0.7+d/30,tRun=runTime(BASE_L,runV(bs[2]),7)+0.15;
    if(d>55&&tRun+0.2<tThrow){R.runs++;R.rbi++;R.bases[2]=null;R.sf=true;R.code='SF';R.desc=R.desc.replace('flies out','hits a sacrifice fly');R.runnerMoves.push({from:3,to:4})}}
  if(outs<3&&R.code!=='LO'&&R.code!=='PO'&&bs[1]!=null&&R.bases[2]==null){const d=Math.hypot(R.catchAt[0],R.catchAt[2]);if(d>75&&R.catchAt[0]>0){R.bases[2]=bs[1];R.bases[1]=null;R.runnerMoves.push({from:2,to:3})}}
  return R}
function advanceOnGround(R,ctx,bs,outsAdded,dp,fc){const outs=ctx.outs+outsAdded,nb=[null,null,null];
  if(outs>=3){R.bases=[null,null,null];return R}
  // forced runners move up; a runner on third scores on a grounder with fewer than two outs about half the time
  const r1=bs[0],r2=bs[1],r3=bs[2];
  if(dp){if(r3!=null&&ctx.outs===0){R.runs++;R.runnerMoves.push({from:3,to:4})}if(r2!=null){nb[2]=r2;R.runnerMoves.push({from:2,to:3})}R.bases=nb;return R}
  if(fc){nb[0]=ctx.spd==null?50:ctx.spd;if(r2!=null){if(r3!=null){R.runs++;R.rbi++;R.runnerMoves.push({from:3,to:4})}nb[2]=r2;R.runnerMoves.push({from:2,to:3})}else if(r3!=null)nb[2]=r3;R.bases=nb;return R}
  if(r1!=null&&r2!=null&&r3!=null){R.runs++;R.rbi++;nb[2]=r2;nb[1]=r1;R.runnerMoves.push({from:3,to:4},{from:2,to:3},{from:1,to:2})}
  else if(r1!=null&&r2!=null){nb[2]=r2;nb[1]=r1;R.runnerMoves.push({from:2,to:3},{from:1,to:2})}
  else if(r1!=null){nb[1]=r1;if(r3!=null){if(Math.random()<0.5){R.runs++;R.rbi++;R.runnerMoves.push({from:3,to:4})}else nb[2]=r3}R.runnerMoves.push({from:1,to:2})}
  else{if(r2!=null){nb[2]=r2;R.runnerMoves.push({from:2,to:3})}if(r3!=null){if(r2==null&&Math.random()<0.55){R.runs++;R.rbi++;R.runnerMoves.push({from:3,to:4})}else if(r2!=null){R.runs++;R.rbi++;R.runnerMoves.push({from:3,to:4})}else nb[2]=r3}}
  R.bases=nb;return R}
function advanceOnHit(R,ctx,bs,k,tBall,err,of){const nb=[null,null,null],spd=ctx.spd==null?50:ctx.spd,two=ctx.outs===2;
  // each runner goes as far as the hit and the ball allow: forced bases at least, an extra one on a ball to the outfield
  const runners=[];for(let b=3;b>=1;b--)if(bs[b-1]!=null)runners.push({b,s:bs[b-1]});
  let limit=4;// the furthest base the next runner may take (one short of the runner ahead, unless that one scored)
  for(const r of runners){let to;
    if(R.infield||err)to=needForce(r.b,bs)?r.b+1:r.b;
    else{to=r.b+k;
      if(of&&to<4){const extra=to+1,tRun=(two?0:0.35)+runTime(BASE_L*(extra-r.b),runV(r.s),7)+0.25*(extra-r.b-1),tThr=of.t+0.55+dist2([of.x,of.z],BASEXZ[extra%4])/(ctx.arm||30);
        if(tRun+0.2<tThr)to=extra}}
    to=Math.min(to,limit);
    if(to>=4){R.runs++;if(!err)R.rbi++;R.runnerMoves.push({from:r.b,to:4})}else{nb[to-1]=r.s;if(to!==r.b)R.runnerMoves.push({from:r.b,to});limit=to-1}}
  if(k<4)nb[k-1]=spd;else{R.runs++;R.rbi++}
  R.bases=nb;return R}
function needForce(b,bs){for(let x=1;x<b;x++)if(bs[x-1]==null)return false;return true}
