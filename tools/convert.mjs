import fs from 'fs';
globalThis.self=globalThis;globalThis.window=globalThis;
const THREE=await import('three');
const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
const bossSrc=fs.readFileSync('../build/boss.js','utf8');const B=JSON.parse(bossSrc.slice('const R3BOSS='.length,-1));
const b64=(s,T)=>{const b=Buffer.from(s,'base64');return new T(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength))};
const tob64=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength).toString('base64');
const nbB=B.names.length,iB=b64(B.inv,Float32Array);
const RB=[];for(let k=0;k<nbB;k++){const m=new THREE.Matrix4().fromArray(iB,k*16).transpose().invert();const p=new THREE.Vector3(),q=new THREE.Quaternion();m.decompose(p,q,new THREE.Vector3());RB.push({q,p});}
const hipsB=RB[B.names.indexOf('Hips')].p.y;
const jobs=JSON.parse(process.argv[2]);const out={};
for(const [key,file,maxT] of jobs){
  const buf=fs.readFileSync(file);const obj=new FBXLoader().parse(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
  const clip=obj.animations[0];const bones={};obj.traverse(o=>{if(o.isBone)bones[o.name.replace(/^mixamorig:?/,'')]=o});
  obj.updateMatrixWorld(true);
  const rest={};for(const n in bones){rest[n]=bones[n].getWorldQuaternion(new THREE.Quaternion());}
  const hipRestY=bones.Hips.getWorldPosition(new THREE.Vector3()).y;const sc=hipsB/hipRestY;
  const mixer=new THREE.AnimationMixer(obj);const act=mixer.clipAction(clip);act.play();
  const dur=Math.min(clip.duration,maxT||1e9),fps=30,n=Math.max(2,Math.round(dur*fps));
  const Q=new Int16Array(n*nbB*4),H=new Float32Array(n*3);
  const WB=[];for(let k=0;k<nbB;k++)WB.push(new THREE.Quaternion());const tmp=new THREE.Quaternion();
  for(let f=0;f<n;f++){mixer.setTime(f/fps);obj.updateMatrixWorld(true);
    for(let k=0;k<nbB;k++){const name=B.names[k],src=bones[name],p=B.parent[k];
      if(src){const w=src.getWorldQuaternion(new THREE.Quaternion());WB[k].copy(w).multiply(rest[name].clone().invert()).multiply(RB[k].q);}
      else if(p>=0){WB[k].copy(WB[p]).multiply(RB[p].q.clone().invert()).multiply(RB[k].q);}else WB[k].copy(RB[k].q);
      if(p>=0)tmp.copy(WB[p]).invert().multiply(WB[k]);else tmp.copy(WB[k]);
      const o=(f*nbB+k)*4;Q[o]=Math.round(tmp.x*32767);Q[o+1]=Math.round(tmp.y*32767);Q[o+2]=Math.round(tmp.z*32767);Q[o+3]=Math.round(tmp.w*32767);}
    const hp=bones.Hips.getWorldPosition(new THREE.Vector3());H[f*3]=hp.x*sc;H[f*3+1]=hp.y*sc;H[f*3+2]=hp.z*sc;}
  for(let f=1;f<n;f++)for(let k=0;k<nbB;k++){const a=(f*nbB+k)*4,b=((f-1)*nbB+k)*4;if(Q[a]*Q[b]+Q[a+1]*Q[b+1]+Q[a+2]*Q[b+2]+Q[a+3]*Q[b+3]<0)for(let e=0;e<4;e++)Q[a+e]=-Q[a+e];}
  out[key]={fps,t0:0,n,anim:[...Array(nbB).keys()],q:tob64(Q),qs:tob64(Q.slice(0,nbB*4)),hip:tob64(H)};
  console.error(key,'frames',n,'hipY',(H[1]).toFixed(1),'boss hipsY',hipsB.toFixed(1),'dx',(H[(n-1)*3]-H[0]).toFixed(1),'dz',(H[(n-1)*3+2]-H[2]).toFixed(1),'missing',B.names.filter(nm=>!bones[nm]).join(','));
}
fs.writeFileSync('../build/mclips.json',JSON.stringify(out));
