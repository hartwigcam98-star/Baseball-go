/* ================= progression: your profile, perks, the locker, daily challenges, story beats, unlocks, clips =================
   The profile is shared by every mode and every career: it levels up as you play, unlocks players, parks and cosmetics,
   and keeps your daily challenges and login streak. Perks belong to a career and change things you can see. */
const PROF_KEY='bg-prof';
const PROF=Object.assign({xp:0,unl:{},eq:{bat:'natural',flip:'classic',trail:'heat',song:'none'},streak:0,last:'',daily:null,stats:{hr:0,hits:0,games:0}},(()=>{try{return JSON.parse(localStorage.getItem(PROF_KEY))||{}}catch(e){return{}}})());
function storeProf(){try{localStorage.setItem(PROF_KEY,JSON.stringify(PROF))}catch(e){}}
function profLv(x){return Math.floor(Math.sqrt((x==null?PROF.xp:x)/60))+1}
function profNext(){const l=profLv();return 60*l*l}
/* ---- players and parks unlock as your profile levels up ---- */
const STARTERS=['boss','ch06','ch08','ch12','ch31','remy'];
const UNLOCK_ORDER=['ch09','ch17','ch28','granny','ch01','brute','ch23','ch24','ty','ch43','peasant','ch39','vegas','ch42'];
function charUnlockLv(id){const i=UNLOCK_ORDER.indexOf(id);return i<0?1:2+i}
function charUnlocked(id){return STARTERS.includes(id)||profLv()>=charUnlockLv(id)||(save&&save.char===id)}
const PARK_UNLOCK={hs:1,college:3,minors:6,majors:9};
/* ---- cosmetics: earned by playing, nothing for sale ---- */
const COSM={
  bat:[['natural','Natural ash',0xC8955A,'Start'],['blonde','Blonde maple',0xE8C890,'Level 2'],['black','Black',0x222222,'Hit 5 home runs'],['red','Fire red',0xC0392B,'Win a Derby with 6+'],['gold','Gold',0xF2C230,'Level 12']],
  flip:[['classic','Classic toss','Start'],['heli','Helicopter','Hit a 420 ft homer'],['moon','Moonshot','Level 8']],
  trail:[['heat','Heat (by exit velo)','Start'],['ice','Ice blue','Level 4'],['rainbow','Rainbow','Complete 10 daily challenges']],
  song:[['none','No walk-up','Start'],['organ','Ballpark organ','Level 3'],['anthem','Stadium anthem','Level 6'],['funk','Funky bass','Level 10']]};
function cosmUnlocked(kind,id){const it=COSM[kind].find(c=>c[0]===id);if(!it)return false;const cond=it[it.length-1];if(cond==='Start')return true;
  const m=cond.match(/^Level (\d+)/);if(m)return profLv()>=+m[1];return!!PROF.unl[kind+':'+id]}
function unlockCosm(kind,id){if(PROF.unl[kind+':'+id])return;PROF.unl[kind+':'+id]=1;storeProf();toast('Unlocked: '+COSM[kind].find(c=>c[0]===id)[1]+' ('+kind+')')}
function applyCosmetics(){if(!G||!G.batter||!G.batter.bat)return;const b=COSM.bat.find(c=>c[0]===PROF.eq.bat)||COSM.bat[0];G.batter.bat.userData.wood.color.setHex(b[2])}
/* ---- perks: a career's earned abilities, slots open as the career levels up ---- */
const PERKS=[
  ['clutch','Clutch','Your circle is 15% bigger with runners in scoring position',3],
  ['eye','Eagle Eye','You read the pitch type 80 ms sooner',5],
  ['twostrike','Two-Strike Hitter','Your circle is 12% bigger with two strikes',7],
  ['pull','Pull Power','+4% exit velocity when you pull the ball',9],
  ['speed','Speed Demon','A better jump on steals and faster to first',11],
  ['turbo','Turbo Charged','Your Turbo meter fills 30% faster',13]];
function careerLv(){return save?profLv(save.xpTotal||0):1}
function perkSlots(){const l=careerLv();return l>=15?3:l>=8?2:l>=3?1:0}
let ACTIVE_PERKS=[];
function hasPerk(id){return ACTIVE_PERKS.includes(id)}
function perkCircle(){if(!A||A.pitching||!ACTIVE_PERKS.length)return 1;let k=1;const s=A.cfg.sit;if(hasPerk('clutch')&&s&&s.bases&&(s.bases[1]!=null||s.bases[2]!=null))k*=1.15;if(hasPerk('twostrike')&&A.count&&A.count[1]===2)k*=1.12;return k}
function perksCard(){const slots=perkSlots(),eq=save.perks||[],l=careerLv();
  return'<div class="row between"><h3>Perks</h3><span class="chip num">Career level '+l+' · '+eq.length+'/'+slots+' slots</span></div>'+
    PERKS.map(([id,n,d,lv])=>{const unl=l>=lv,on=eq.includes(id);return'<div class="lk-item'+(on?' done':'')+'"><div style="flex:1;min-width:0"><strong>'+n+'</strong><p class="muted" style="font-size:13px">'+d+'</p></div>'+(unl?'<button data-perk="'+id+'" '+(!on&&eq.length>=slots?'disabled':'')+'>'+(on?'Equipped':'Equip')+'</button>':'<span class="muted" style="font-size:12px">Career lv '+lv+'</span>')+'</div>'}).join('')+
    (slots?'':'<p class="muted" style="font-size:13px">Your first perk slot opens at career level 3. Every game earns career XP.</p>')}
function wirePerks(el){el.querySelectorAll('button[data-perk]').forEach(b=>b.onclick=()=>{const id=b.dataset.perk;save.perks=save.perks||[];const i=save.perks.indexOf(id);if(i>=0)save.perks.splice(i,1);else if(save.perks.length<perkSlots())save.perks.push(id);store();renderHub()})}

/* ---- daily challenges and the login streak ---- */
const CHALLENGES=[
  ['oppo2b','Hit an opposite-field double',e=>e.t==='hit'&&e.code==='2B'&&e.oppo,60],
  ['hr400','Hit a home run of 400+ feet',e=>e.t==='hit'&&e.code==='HR'&&e.ft>=400,80],
  ['fullbb','Draw a walk in a full count',e=>e.t==='pa'&&e.code==='BB'&&e.full,50],
  ['multi','Get 2+ hits in a career game',e=>e.t==='game'&&e.h>=2,70],
  ['derby6','Hit 6+ in a Home Run Derby',e=>e.t==='mode'&&e.m==='derby'&&e.score>=6,70],
  ['pin800','Score 800+ in Home Run Pinball',e=>e.t==='mode'&&e.m==='pinball'&&e.score>=800,70],
  ['steal','Steal a base',e=>e.t==='sb',50],
  ['perfect3','Get three Perfect / Square swings',e=>e.t==='perfect'&&e.n>=3,60],
  ['k5','Strike out 5 in a start',e=>e.t==='game'&&e.pk>=5,80],
  ['triple','Hit a triple',e=>e.t==='hit'&&e.code==='3B',90],
  ['rbi3','Drive in 3+ runs in a game',e=>e.t==='game'&&e.rbi>=3,70],
  ['win','Win a career game',e=>e.t==='game'&&e.won,40]];
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function seeded(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return((h>>>0)%10000)/10000}}
function dailyToday(){const k=dayKey();if(!PROF.daily||PROF.daily.date!==k){const r=seeded(k),pool=CHALLENGES.slice(),list=[];while(list.length<3){const i=Math.floor(r()*pool.length);list.push(pool.splice(i,1)[0][0])}
    PROF.daily={date:k,list,done:[]};
    // login streak: consecutive days played
    const y=new Date();y.setDate(y.getDate()-1);PROF.streak=PROF.last===dayKey(y)?(PROF.streak||0)+1:PROF.last===k?PROF.streak:1;PROF.last=k;storeProf()}
  return PROF.daily}
let PERFECTS=0;
/* every notable thing that happens comes through here */
function emit(e){const D=dailyToday();
  if(e.t==='perfect'){PERFECTS++;e.n=PERFECTS}
  if(e.t==='hit'){PROF.stats.hits++;if(e.code==='HR'){PROF.stats.hr++;if(PROF.stats.hr>=5)unlockCosm('bat','black');if(e.ft>=420)unlockCosm('flip','heli')}}
  if(e.t==='mode'&&e.m==='derby'&&e.score>=6)unlockCosm('bat','red');
  for(const id of D.list){if(D.done.includes(id))continue;const c=CHALLENGES.find(x=>x[0]===id);if(c&&c[2](e)){D.done.push(id);PROF.dailyDone=(PROF.dailyDone||0)+1;gainProf(c[3]);if(save&&!save.retired){save.xp+=Math.round(c[3]/2);store()}toast('Daily challenge done: '+c[1]+' (+'+c[3]+' XP)');if(PROF.dailyDone>=10)unlockCosm('trail','rainbow')}}
  storeProf()}
function gainProf(n){const before=profLv();PROF.xp+=n;storeProf();const after=profLv();if(after>before){toast('Level '+after+'!'+levelUnlockText(after))}}
function levelUnlockText(l){const c=ROSTER.find(r=>charUnlockLv(r.id)===l&&!STARTERS.includes(r.id)),p=Object.entries(PARK_UNLOCK).find(([k,v])=>v===l),cs=Object.entries(COSM).map(([k,v])=>v.find(x=>x[x.length-1]==='Level '+l)).filter(Boolean);
  return(c?' Unlocked '+c.name+'.':'')+(p?' New park for quick modes.':'')+cs.map(x=>' Unlocked '+x[1]+'.').join('')}
let toastT=null;function toast(t){const e=$('toast');e.textContent=t;e.className='on';clearTimeout(toastT);toastT=setTimeout(()=>e.className='',3200)}
function todayCard(){const D=dailyToday(),l=profLv(),pct=Math.round((PROF.xp-60*(l-1)*(l-1))/(profNext()-60*(l-1)*(l-1))*100);
  return'<div class="row between"><h3>Today</h3><span class="chip">🔥 '+(PROF.streak||1)+'-day streak</span></div>'+
    '<div class="row between" style="font-size:14px"><span>Level <b class="num">'+l+'</b></span><span class="muted num">'+PROF.xp+' / '+profNext()+' XP</span></div><div class="bar xpbar"><i style="width:'+clamp(pct,0,100)+'%"></i></div>'+
    '<ul class="notes">'+D.list.map(id=>{const c=CHALLENGES.find(x=>x[0]===id),d=D.done.includes(id);return'<li class="'+(d?'n-daily':'')+'">'+(d?'✓ ':'')+esc(c[1])+' <span class="muted">+'+c[3]+' XP</span></li>'}).join('')+'</ul>'}
/* ---- the locker: equip what you've earned ---- */
function openLocker(){const p=$('locker');p.hidden=false;const sec=(kind,title)=>'<h3 style="margin-top:6px">'+title+'</h3><div class="lk-grid">'+COSM[kind].map(c=>{const u=cosmUnlocked(kind,c[0]),on=PROF.eq[kind]===c[0];
    return'<button class="lk-p'+(u?'':' locked')+'" data-k="'+kind+'" data-v="'+c[0]+'" aria-pressed="'+on+'" '+(u?'':'disabled')+'>'+(kind==='bat'?'<span class="sw" style="background:#'+new T.Color(c[2]).getHexString()+'"></span>':'')+'<strong>'+esc(c[1])+'</strong><small>'+(u?(on?'Equipped':'Tap to equip'):esc(c[c.length-1]))+'</small></button>'}).join('')+'</div>';
  $('lockBody').innerHTML='<p class="muted">Level '+profLv()+'. Everything here is earned by playing.</p>'+sec('bat','Bat')+sec('flip','Bat flip')+sec('trail','Home run trail')+sec('song','Walk-up music')+
    '<h3 style="margin-top:6px">Players</h3><p class="muted" style="font-size:13px">'+ROSTER.filter(r=>!charUnlocked(r.id)).map(r=>esc(r.name)+' (level '+charUnlockLv(r.id)+')').join(' · ')||'Everyone is unlocked.'+'</p>';
  $('lockBody').querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{PROF.eq[b.dataset.k]=b.dataset.v;storeProf();if(b.dataset.k==='song')walkUp();openLocker()});
  $('lockDone').onclick=()=>{p.hidden=true}}
/* ---- walk-up music: a few bars synthesised when you step in ---- */
const SONGS={organ:[[523,0.18],[659,0.18],[784,0.18],[1046,0.36],[784,0.18],[1046,0.5]],anthem:[[392,0.3],[392,0.3],[523,0.3],[659,0.6],[587,0.3],[523,0.6]],funk:[[110,0.15],[0,0.1],[110,0.15],[147,0.2],[165,0.2],[110,0.3],[196,0.3]]};
function walkUp(){const s=SONGS[PROF.eq.song];if(!s||!sndReady())return;let t=0;const c=SND.ctx;
  for(const [f,d] of s){if(f){const o=c.createOscillator(),g=c.createGain();o.type=PROF.eq.song==='funk'?'sawtooth':PROF.eq.song==='organ'?'square':'triangle';o.frequency.value=f;
      g.gain.setValueAtTime(0.0001,c.currentTime+t);g.gain.linearRampToValueAtTime(0.12,c.currentTime+t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+t+d);o.connect(g);g.connect(SND.master);o.start(c.currentTime+t);o.stop(c.currentTime+t+d+0.05)}t+=d}}
/* ---- story beats: big career moments get their own screen ---- */
function storyBeat(eyebrow,title,text,btns){return new Promise(res=>{const p=$('story');p.hidden=false;$('stEye').textContent=eyebrow;$('stTitle').textContent=title;$('stText').innerHTML=text;
  $('stBtns').innerHTML=(btns||[['ok','Let’s go']]).map(([v,l],i)=>'<button class="'+(i?'ghost':'go')+'" data-v="'+v+'">'+esc(l)+'</button>').join('');
  $('stBtns').querySelectorAll('button').forEach(b=>b.onclick=()=>{p.hidden=true;res(b.dataset.v)});sndCrowd(0.5)})}
const NICKS=['The Hammer','Big Train','Mr. Clutch','The Kid','Sweet Swing','Thunder','The Professor','Moonshot'];
/* ---- share a home run: the replay is recorded from the canvas ---- */
const CLIP={rec:null,chunks:[],blob:null};
function clipStart(){if(!window.MediaRecorder||!W3.r)return;try{const st=W3.r.domElement.captureStream(30),types=['video/mp4','video/webm;codecs=vp9','video/webm'],type=types.find(t=>MediaRecorder.isTypeSupported(t));
    CLIP.chunks=[];CLIP.rec=new MediaRecorder(st,type?{mimeType:type,videoBitsPerSecond:2500000}:undefined);CLIP.rec.ondataavailable=e=>{if(e.data&&e.data.size)CLIP.chunks.push(e.data)};
    CLIP.rec.onstop=()=>{CLIP.blob=new Blob(CLIP.chunks,{type:CLIP.rec.mimeType||'video/webm'});$('clipBtn').hidden=false};CLIP.rec.start()}catch(e){CLIP.rec=null}}
function clipStop(){if(CLIP.rec&&CLIP.rec.state!=='inactive')try{CLIP.rec.stop()}catch(e){}}
async function clipShare(){const b=CLIP.blob;if(!b)return;const ext=b.type.includes('mp4')?'mp4':'webm',f=new File([b],'baseball-go-homer.'+ext,{type:b.type});
  try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'Baseball Go home run'});return}}catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=f.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
