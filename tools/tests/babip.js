const fs=require('fs');eval(fs.readFileSync(__dirname+'/../../src/play.js','utf8').replace(/^const /gm,'var '));
global.PARK={line:100,cf:122,wall:3};var P=PARK;
function gauss(){return Math.sqrt(-2*Math.log(Math.random()+1e-9))*Math.cos(6.283*Math.random())}
const evm=+process.argv[2]||88.5,cnt={},N=20000;let foul=0,bip=0,hits=0,ab=0,tb=0;
for(let i=0;i<N;i++){const ev=evm+gauss()*14,la=12+gauss()*26,sp=(-4+gauss()*24)*Math.PI/180;
  const B=simBall(Math.max(30,ev),la,sp,P);const bases=[Math.random()<0.3?50:null,Math.random()<0.2?50:null,Math.random()<0.1?50:null];
  const R=resolvePlay(B,{outs:Math.floor(Math.random()*3),bases,spd:50,err:0.015,arm:30});
  if(R.code==='FOUL'){foul++;continue}bip++;cnt[R.code]=(cnt[R.code]||0)+1;if(R.hit){hits++;tb+=R.hit}}
console.log('foul',(foul/N).toFixed(3),'BIP',bip);for(const k in cnt)console.log(k,(cnt[k]/bip*100).toFixed(1)+'%');
const hr=cnt.HR||0;console.log('BABIP(no HR)',((hits-hr)/(bip-hr)).toFixed(3),'HR/BIP',(hr/bip).toFixed(3),'SLGcon',(tb/bip).toFixed(3));
