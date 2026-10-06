/* ================= the ballpark =================
   World metres. Home plate at the origin, the pitcher toward -z, first base on +x.
   Bases are 90 ft (27.43 m) apart; the rubber is 60 ft 6 in (18.44 m) from the plate. */
const BASE=27.432,RUBBER=18.44,SQ2=Math.SQRT1_2;
const BASES=[new T.Vector3(0,0,0),new T.Vector3(BASE*SQ2,0,-BASE*SQ2),new T.Vector3(0,0,-BASE*2*SQ2),new T.Vector3(-BASE*SQ2,0,-BASE*SQ2)];
/* parks by level: fence distance down the lines and to centre (m), wall height, crowd and stands */
const PARKS={
  hs:     {name:'High school field',line:92, cf:110,wall:2.2,chain:true, crowd:0.06,tiers:1,stands:'bleach',sky:0x9CC8EA,grass:'#4E8A3A'},
  college:{name:'College ballpark',  line:100,cf:120,wall:2.6,chain:false,crowd:0.35,tiers:2,stands:'small', sky:0x98C4E8,grass:'#4C8C3B'},
  minors: {name:'Minor league park', line:100,cf:122,wall:3.0,chain:false,crowd:0.45,tiers:2,stands:'small', sky:0x95C0E6,grass:'#4A8B3A'},
  majors: {name:'Big league stadium',line:101,cf:123,wall:3.2,chain:false,crowd:0.9, tiers:3,stands:'bowl',  sky:0x8DBDE6,grass:'#468A38'}
};
let PARK=PARKS.majors;
/* phi: spray angle from straight-away centre, + toward right field */
function fenceDist(phi){const a=Math.min(1,Math.abs(phi)/(Math.PI/4));return PARK.line+(PARK.cf-PARK.line)*(1-Math.pow(a,1.7))}
function dirOf(phi){return new T.Vector3(Math.sin(phi),0,-Math.cos(phi))}
function sprayOf(x,z){return Math.atan2(x,-z)}
function isFair(x,z){return -z>=Math.abs(x)-0.05}
function cvTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t}
function shade(hex,k){const c=new T.Color(hex);c.multiplyScalar(k);return c}
/* many boxes of one material as a single instanced draw call */
function boxBatch(mat){const L=[];return{add(cx,cy,cz,sx,sy,sz,ry){L.push([cx,cy,cz,sx,sy,sz,ry||0])},build(G,shadow){if(!L.length)return;const m=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,L.length),M=new T.Matrix4(),q=new T.Quaternion(),Y=new T.Vector3(0,1,0);
  L.forEach((b,i)=>{q.setFromAxisAngle(Y,b[6]);M.compose(new T.Vector3(b[0],b[1],b[2]),q,new T.Vector3(b[3],b[4],b[5]));m.setMatrixAt(i,M)});m.receiveShadow=!!shadow;m.castShadow=false;G.add(m)}}}
function buildPark(kind){
  const s=W3.scene;if(W3.park){s.remove(W3.park);W3.park.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}})}
  PARK=PARKS[kind]||PARKS.majors;PARK.kind=kind;
  const G=W3.park=new T.Group();s.add(G);
  s.background=new T.Color(PARK.sky);s.fog=new T.Fog(PARK.sky,140,420);
  /* ---- outfield grass, mowing stripes, warning track, foul ground ---- */
  const X0=-150,X1=150,Z0=-150,Z1=30,ppm=7;
  const oTex=cvTex((X1-X0)*ppm,(Z1-Z0)*ppm,(g,w,h)=>{
    const P=(x,z)=>[(x-X0)*ppm,(z-Z0)*ppm];
    g.fillStyle=PARK.grass;g.fillRect(0,0,w,h);
    // stripes: diagonal checkerboard like a groomed big-league outfield
    g.save();g.translate(...P(0,0));g.rotate(Math.PI/4);
    for(let i=-60;i<60;i++){g.fillStyle=i%2?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)';g.fillRect(i*6*ppm,-400*ppm,6*ppm,800*ppm)}
    g.restore();
    // warning track: 4.5 m of dirt inside the wall
    g.fillStyle='#A8774E';g.beginPath();
    for(let i=0;i<=120;i++){const phi=-Math.PI/4-0.35+(Math.PI/2+0.7)*i/120,d=fenceDist(clamp(phi,-Math.PI/4,Math.PI/4))+0.4,p=P(Math.sin(phi)*d,-Math.cos(phi)*d);i?g.lineTo(...p):g.moveTo(...p)}
    for(let i=120;i>=0;i--){const phi=-Math.PI/4-0.35+(Math.PI/2+0.7)*i/120,d=fenceDist(clamp(phi,-Math.PI/4,Math.PI/4))-4.5,p=P(Math.sin(phi)*d,-Math.cos(phi)*d);g.lineTo(...p)}
    g.fill();
  });
  const ground=new T.Mesh(new T.PlaneGeometry(X1-X0,Z1-Z0),new T.MeshStandardMaterial({map:oTex,roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.position.set((X0+X1)/2,0,(Z0+Z1)/2);ground.receiveShadow=true;G.add(ground);
  /* ---- the infield: dirt skin, grass square, base paths, plate area, mound, chalk ---- */
  const IX=34,IZ0=-46,IZ1=10,ip=40;
  const iTex=cvTex(IX*2*ip,(IZ1-IZ0)*ip,(g,w,h)=>{
    const P=(x,z)=>[(x+IX)*ip,(z-IZ0)*ip],dirt='#B98458',dirtD='#A97650';
    g.clearRect(0,0,w,h);
    // skin: circle of 95 ft about the rubber, inside the foul lines (plus a little foul ground)
    g.save();g.beginPath();g.moveTo(...P(0,4));g.lineTo(...P(-60,-56));g.lineTo(...P(60,-56));g.closePath();g.clip();
    g.fillStyle=dirt;g.beginPath();g.arc(...P(0,-RUBBER),29*ip,0,Math.PI*2);g.fill();g.restore();
    // infield grass square
    const c=-BASE*SQ2,f=0.84,gp=(v)=>P(v.x*f,c+(v.z-c)*f);
    g.fillStyle=PARK.grass;g.beginPath();[BASES[0],BASES[1],BASES[2],BASES[3]].forEach((b,i)=>{const p=gp(b);i?g.lineTo(...p):g.moveTo(...p)});g.closePath();g.fill();
    g.save();g.beginPath();[BASES[0],BASES[1],BASES[2],BASES[3]].forEach((b,i)=>{const p=gp(b);i?g.lineTo(...p):g.moveTo(...p)});g.closePath();g.clip();
    g.translate(...P(0,0));g.rotate(Math.PI/4);for(let i=-20;i<20;i++){g.fillStyle=i%2?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)';g.fillRect(i*3*ip,-60*ip,3*ip,120*ip)}g.restore();
    // base paths home to first and third
    g.strokeStyle=dirt;g.lineWidth=1.8*ip;g.lineCap='butt';
    for(const b of[BASES[1],BASES[3]]){g.beginPath();g.moveTo(...P(0,0));g.lineTo(...P(b.x,b.z));g.stroke()}
    // cut-outs around the bases and the plate
    g.fillStyle=dirt;for(const b of BASES.slice(1)){g.beginPath();g.arc(...P(b.x,b.z),2.9*ip,0,Math.PI*2);g.fill()}
    g.beginPath();g.arc(...P(0,-0.3),4.2*ip,0,Math.PI*2);g.fill();
    // mound
    const mg=g.createRadialGradient(...P(0,-18.0),0,...P(0,-18.0),2.75*ip);mg.addColorStop(0,'#C4906A');mg.addColorStop(1,dirtD);g.fillStyle=mg;g.beginPath();g.arc(...P(0,-18.0),2.75*ip,0,Math.PI*2);g.fill();
    // chalk: batter's boxes, catcher's box, the lines near the plate, the running lane
    g.strokeStyle='rgba(255,255,255,0.92)';g.lineWidth=0.075*ip;
    const box=(x0,z0,x1,z1)=>{const a=P(x0,z0),b=P(x1,z1);g.strokeRect(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))};
    box(-0.37-1.22,-0.9,-0.37,0.92);box(0.37,-0.9,0.37+1.22,0.92);
    g.beginPath();g.moveTo(...P(-0.55,0.92));g.lineTo(...P(-0.55,3.0));g.lineTo(...P(0.55,3.0));g.lineTo(...P(0.55,0.92));g.stroke();
    // running lane, last half of the way to first
    g.beginPath();g.moveTo(...P(BASE*SQ2*0.5,-BASE*SQ2*0.5));g.lineTo(...P(BASE*SQ2*0.5+0.65,-BASE*SQ2*0.5+0.65));g.lineTo(...P(BASE*SQ2+0.65,-BASE*SQ2+0.65));g.stroke();
    // home plate: 17 in pentagon
    const hp=[[-0.216,-0.216],[0.216,-0.216],[0.216,0],[0,0.216],[-0.216,0]];g.fillStyle='#F4F2EC';g.beginPath();hp.forEach((p,i)=>{const q=P(p[0],p[1]-0.0);i?g.lineTo(...q):g.moveTo(...q)});g.closePath();g.fill();
    // rubber
    g.fillStyle='#F4F2EC';{const a=P(-0.305,-RUBBER-0.076),b=P(0.305,-RUBBER+0.076);g.fillRect(a[0],a[1],b[0]-a[0],b[1]-a[1])}
    // on-deck circles
    g.strokeStyle='rgba(255,255,255,0.5)';g.lineWidth=0.06*ip;for(const sx of[-1,1]){g.beginPath();g.arc(...P(sx*11,4),0.8*ip,0,Math.PI*2);g.stroke()}
  });
  const inf=new T.Mesh(new T.PlaneGeometry(IX*2,IZ1-IZ0),new T.MeshStandardMaterial({map:iTex,transparent:true,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  inf.rotation.x=-Math.PI/2;inf.position.set(0,0.004,(IZ0+IZ1)/2);inf.receiveShadow=true;inf.renderOrder=1;G.add(inf);
  // mound, raised 10 in
  const mound=new T.Mesh(new T.CylinderGeometry(0.9,2.75,0.25,32,1),new T.MeshStandardMaterial({color:0xB98458,roughness:1}));mound.position.set(0,0.125,-18.0);mound.receiveShadow=true;G.add(mound);
  const rub=new T.Mesh(new T.BoxGeometry(0.61,0.03,0.15),new T.MeshStandardMaterial({color:0xF4F2EC}));rub.position.set(0,0.255,-RUBBER);G.add(rub);
  // bases
  const bm=new T.MeshStandardMaterial({color:0xF7F5EE,roughness:.6});
  for(let i=1;i<4;i++){const b=new T.Mesh(new T.BoxGeometry(0.38,0.08,0.38),bm);b.position.copy(BASES[i]).setY(0.04);b.rotation.y=Math.PI/4;b.castShadow=true;G.add(b)}
  // foul lines out to the poles
  const lm=new T.MeshBasicMaterial({color:0xF7F5EE});
  for(const sx of[-1,1]){const L=PARK.line+1,st=new T.Mesh(new T.PlaneGeometry(0.1,L),lm);st.rotation.x=-Math.PI/2;st.rotation.z=sx*Math.PI/4;st.position.set(sx*L/2*SQ2,0.012,-L/2*SQ2);G.add(st)}
  /* ---- the wall ---- */
  const wallMat=new T.MeshStandardMaterial({color:PARK.chain?0x2E3A33:0x1F4A35,roughness:.9,transparent:!!PARK.chain,opacity:PARK.chain?0.55:1});
  const capMat=new T.MeshStandardMaterial({color:0xF2C230,roughness:.7});
  const N=64,wallPts=[];
  for(let i=0;i<=N;i++){const phi=-Math.PI/4+Math.PI/2*i/N;wallPts.push(dirOf(phi).multiplyScalar(fenceDist(phi)))}
  const WB=boxBatch(wallMat),CB=boxBatch(capMat);
  for(let i=0;i<N;i++){const a=wallPts[i],b=wallPts[i+1],m=a.clone().add(b).multiplyScalar(0.5),len=a.distanceTo(b)+0.05,ry=Math.atan2(-(b.z-a.z),b.x-a.x);
    WB.add(m.x,PARK.wall/2,m.z,len,PARK.wall,0.3,ry);CB.add(m.x,PARK.wall+0.06,m.z,len,0.12,0.34,ry)}
  WB.build(G,true);CB.build(G)
  // foul poles
  for(const sx of[-1,1]){const d=PARK.line,p=new T.Mesh(new T.CylinderGeometry(0.12,0.12,PARK.wall+12,8),capMat);p.position.set(sx*d*SQ2,(PARK.wall+12)/2,-d*SQ2);G.add(p)}
  // batter's eye in centre
  const eye=new T.Mesh(new T.BoxGeometry(30,PARK.chain?6:12,1),new T.MeshStandardMaterial({color:0x1E3527,roughness:1}));eye.position.set(0,(PARK.chain?6:12)/2,-PARK.cf-3);G.add(eye);
  /* ---- stands and the crowd ---- */
  buildStands(G);
  /* ---- backstop behind the plate ---- */
  const bs=new T.Mesh(new T.BoxGeometry(24,PARK.chain?5:1.4,0.3),new T.MeshStandardMaterial({color:PARK.chain?0x39433D:0x1F4A35,roughness:.9,transparent:!!PARK.chain,opacity:PARK.chain?0.5:1}));
  bs.position.set(0,(PARK.chain?5:1.4)/2,19.5);G.add(bs);
  // dugouts
  for(const sx of[-1,1]){const d=new T.Mesh(new T.BoxGeometry(14,1.2,3),new T.MeshStandardMaterial({color:0x2A3440,roughness:.9}));const p=new T.Vector3(sx*16,0.6,-2);d.position.copy(p);d.rotation.y=-sx*Math.PI/4;G.add(d)}
  // distant scenery: trees for amateur parks, light towers for the pros
  if(PARK.chain||kind==='college'){const tm=new T.MeshStandardMaterial({color:0x2F5A2E,roughness:1}),ok=[];
    for(let i=0;i<90;i++){const phi=rnd(-1.4,1.4),d=fenceDist(clamp(phi,-0.78,0.78))+rnd(14,60),x=Math.sin(phi)*d,z=-Math.cos(phi)*d;if(z>-20&&Math.abs(x)<40)continue;ok.push([x,z,rnd(7,15)])}
    const cm=new T.InstancedMesh(new T.ConeGeometry(0.3,1,7),tm,ok.length),M=new T.Matrix4();ok.forEach((t,i)=>{M.makeScale(t[2],t[2],t[2]).setPosition(t[0],t[2]/2+1.5,t[1]);cm.setMatrixAt(i,M)});G.add(cm)}
  if(!PARK.chain){const pm=new T.MeshStandardMaterial({color:0x8A9099,roughness:.6}),lmat=new T.MeshBasicMaterial({color:0xFFF8E0});
    for(const phi of[-1.25,-0.55,0.55,1.25]){const d=fenceDist(clamp(phi,-0.78,0.78))+(Math.abs(phi)>1?24:20),x=Math.sin(phi)*d,z=-Math.cos(phi)*d,H=PARK.tiers*7+22;
      const p=new T.Mesh(new T.CylinderGeometry(0.5,0.7,H,8),pm);p.position.set(x,H/2,z);G.add(p);const bank=new T.Mesh(new T.BoxGeometry(8,3,0.6),lmat);bank.position.set(x,H+1,z);bank.lookAt(0,0,-30);G.add(bank)}}
  W3.wallH=PARK.wall;
}
/* tiered seating: around the foul ground and beyond the outfield wall, with the crowd as instanced figures */
function buildStands(G){
  if(/nocrowd/.test(location.search)){W3.crowd=null;return}
  const tiers=PARK.tiers,crowd=PARK.crowd,seatMat=new T.MeshStandardMaterial({color:0x3A4656,roughness:.9}),conc=new T.MeshStandardMaterial({color:0x8E949A,roughness:1});
  const pts=[];// the inner edge of the seating, from the left-field pole round behind the plate to the right-field pole
  const lineOff=PARK.chain?10:13;
  const L=PARK.line;
  for(let i=0;i<=16;i++){const u=i/16,d=L*(1-u)+6*u;pts.push(new T.Vector3(-d*SQ2-lineOff*SQ2,0,-d*SQ2+lineOff*SQ2))}
  for(let i=1;i<16;i++){const a=Math.PI*1.25+Math.PI*0.5*i/16;const r=18.5;pts.push(new T.Vector3(Math.cos(a)*r*1.0,0,-Math.sin(a)*r+2))}
  for(let i=0;i<=16;i++){const u=i/16,d=6*(1-u)+L*u;pts.push(new T.Vector3(d*SQ2+lineOff*SQ2,0,-d*SQ2+lineOff*SQ2))}
  const seats=[],SB=boxBatch(seatMat);
  const rows=PARK.stands==='bleach'?5:tiers*9,rowD=0.85,rowH=0.45;
  const partial=PARK.stands==='bleach';
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],m=a.clone().add(b).multiplyScalar(0.5);
    if(partial&&Math.abs(m.x)>14&&m.z<-4)continue;
    const dir=b.clone().sub(a),len=dir.length();dir.normalize();const out=new T.Vector3(dir.z,0,-dir.x);// to the outside (away from the field)
    if(out.dot(m.clone().sub(new T.Vector3(0,0,-30)))<0)out.negate();
    for(let r=0;r<rows;r++){const tierGap=Math.floor(r/9)*1.6;
      const p=m.clone().add(out.clone().multiplyScalar(r*rowD+0.6+tierGap)),y=1.1+r*rowH+tierGap*1.4;
      SB.add(p.x,y/2,p.z,len+0.05,y,rowD,Math.atan2(-dir.z,dir.x));
      const n=Math.floor(len/0.6);for(let k=0;k<n;k++){if(Math.random()>crowd)continue;const q=a.clone().lerp(b,(k+0.5)/n).add(out.clone().multiplyScalar(r*rowD+0.6+tierGap));seats.push([q.x,y,q.z,Math.atan2(-q.x,-q.z)])}}}
  // outfield bleachers beyond the wall (pro and college parks)
  if(!PARK.chain){for(let i=0;i<40;i++){const phi=-Math.PI/4+0.1+(Math.PI/2-0.2)*i/40;if(Math.abs(phi)<0.2)continue;const phi2=phi+(Math.PI/2-0.2)/40;
      const a=dirOf(phi).multiplyScalar(fenceDist(phi)+1.5),b=dirOf(phi2).multiplyScalar(fenceDist(phi2)+1.5),m=a.clone().add(b).multiplyScalar(0.5),out=m.clone().normalize(),dir=b.clone().sub(a),len=dir.length();
      for(let r=0;r<tiers*6;r++){const p=m.clone().add(out.clone().multiplyScalar(r*rowD)),y=PARK.wall+0.5+r*rowH;SB.add(p.x,y/2,p.z,len+0.1,y,rowD,Math.atan2(-dir.z,dir.x));
        const n=Math.floor(len/0.6);for(let k=0;k<n;k++){if(Math.random()>crowd*0.8)continue;const q=a.clone().lerp(b,(k+0.5)/n).add(out.clone().multiplyScalar(r*rowD));seats.push([q.x,y,q.z,Math.atan2(-q.x,-q.z)])}}}}
  SB.build(G);
  // the people: a body and a head each, shirt colours mostly in the home team's colour
  // keep the crowd affordable on a phone: at most ~6,000 figures, low-poly heads
  while(seats.length>6000)seats.splice(Math.floor(Math.random()*seats.length),1);
  const n=seats.length,body=new T.InstancedMesh(new T.BoxGeometry(0.44,0.55,0.3),new T.MeshStandardMaterial({roughness:.9}),Math.max(1,n)),head=new T.InstancedMesh(new T.IcosahedronGeometry(0.14,0),new T.MeshStandardMaterial({roughness:.8,flatShading:true}),Math.max(1,n));
  const m4=new T.Matrix4(),c=new T.Color(),home=new T.Color(W3.homeColor||0x2E5FA8),skins=[0xF1C9A5,0xD9A27A,0xA86B45,0x6E4428,0xE8B990];
  const CR=W3.crowd={n,body,head,base:[],ph:[],amp:0};
  seats.forEach((s,i)=>{CR.base.push(s);CR.ph.push(Math.random()*6.28);
    m4.makeRotationY(s[3]).setPosition(s[0],s[1]+0.28,s[2]);body.setMatrixAt(i,m4);
    const r=Math.random();c.set(r<0.45?home.getHex():r<0.6?0xF2F2F2:new T.Color().setHSL(Math.random(),0.5,0.45).getHex());body.setColorAt(i,c);
    m4.makeTranslation(s[0],s[1]+0.7,s[2]);head.setMatrixAt(i,m4);c.set(pick(skins));head.setColorAt(i,c)});
  body.count=head.count=n;G.add(body);G.add(head);
}
/* crowd motion: stands up and cheers when amp is high */
function crowdTick(dt,t){const CR=W3.crowd;if(!CR||!CR.n)return;CR.amp=Math.max(0,CR.amp-dt*0.35);if(CR.amp<0.02&&CR._still)return;CR._still=CR.amp<0.02;
  const m4=new T.Matrix4();const step=CR.n>2500?2:1;CR._f=(CR._f||0)+1;
  for(let i=CR._f%step;i<CR.n;i+=step){const s=CR.base[i],j=Math.max(0,Math.sin(t*0.012+CR.ph[i]))*0.35*CR.amp;
    m4.makeRotationY(s[3]).setPosition(s[0],s[1]+0.28+j,s[2]);CR.body.setMatrixAt(i,m4);m4.makeTranslation(s[0],s[1]+0.7+j,s[2]);CR.head.setMatrixAt(i,m4)}
  CR.body.instanceMatrix.needsUpdate=true;CR.head.instanceMatrix.needsUpdate=true}
function cheer(a){if(W3.crowd)W3.crowd.amp=Math.max(W3.crowd.amp,a)}
