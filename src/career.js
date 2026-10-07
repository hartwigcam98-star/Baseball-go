/* ================= career: high school → college or the draft → the minors → the Bigs ================= */
const KEY_V='baseball-go-v1';
let save=null;
function load(){try{const s=localStorage.getItem(KEY_V);return s?JSON.parse(s):null}catch(e){return null}}
function store(){try{localStorage.setItem(KEY_V,JSON.stringify(save))}catch(e){}}
save=load();
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
const STANDALONE=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;

const POSITIONS=[['C','Catcher','Every pitch goes through you'],['1B','First base','A big target and a big bat'],['2B','Second base','Quick feet, turns two'],['SS','Shortstop','The captain of the infield'],['3B','Third base','The hot corner'],['LF','Left field','Room to roam, room to rake'],['CF','Center field','Fastest glove on the field'],['RF','Right field','Cannon arm, middle of the order']];
const STAGES=[['hs','High school'],['college','College'],['minors','Minors'],['mlb','The Bigs']];
const LVL_ORDER=['rookie','a','aa','aaa','mlb'];
const LVL_SHORT={hs:'HS',college:'NCAA',rookie:'Rookie',a:'A',aa:'AA',aaa:'AAA',mlb:'The Bigs'};
const PROGRAMS=[
  {id:'gulf',name:'Gulf Coast State',short:'GCS',need:54,xp:1.5,str:6,blurb:'A national power. Tougher pitching every weekend, the best player development (50% more training points) and scouts at every game.'},
  {id:'prairie',name:'Prairie A&M',short:'PAM',need:47,xp:1.25,str:2,blurb:'A solid conference program. You’ll play right away against good competition (25% more training points).'},
  {id:'lakes',name:'Lakes Community College',short:'LCC',need:0,xp:1.1,str:-3,blurb:'Junior college: you start every day and you’re draft-eligible again after one season.'}
];
const ORGS=[['Harbor City','Gulls',200],['Mesa','Scorpions',20],['River City','Barons',240],['Capital','Comets',0],['Bay Area','Fog',190],['Lone Star','Rangers'.replace('Rangers','Wranglers'),30],['Twin Lakes','Loons',150],['Steel Valley','Ironmen',45],['Peach State','Hammers',10],['Rocky Ridge','Elk',100],['Sunshine','Herons',170],['North Woods','Lumberjacks',120]];
const AFFIL={rookie:'Rookie',a:'Single-A',aa:'Double-A',aaa:'Triple-A',mlb:''};
const HS_TEAMS=[['Lincoln','LIN'],['Westfield','WES'],['Eastview','EAS'],['St. Pius','STP'],['Ridgeway','RID'],['Central','CEN'],['Oak Grove','OAK'],['Millbrook','MIL'],['Northside','NOR'],['Valley','VAL'],['Riverside','RIV'],['Pine Hill','PIN']];
const COLLEGES=[['Gulf Coast State','GCS'],['Prairie A&M','PAM'],['Lakes CC','LCC'],['Bayou Tech','BYT'],['Summit U','SUM'],['Coastal Carolina Tech','CCT'],['Desert State','DES'],['Northern Plains','NPL'],['Old Dominion Valley','ODV'],['Cascade','CAS'],['Granite State','GRS'],['Magnolia','MAG']];
const MINOR_TEAMS={rookie:[['Desert Dogs','DD'],['Sand Gnats','SG'],['Cactus Wrens','CW'],['Dust Devils','DV'],['Gila Monsters','GM'],['Roadrunners','RR']],
  a:[['River Bandits','RB'],['Mudcats','MC'],['Lugnuts','LG'],['Grasshoppers','GH'],['Fireflies','FF'],['Crawdads','CR']],
  aa:[['Sea Wolves','SW'],['Biscuits','BI'],['Hot Rods','HR'],['Trash Pandas','TP'],['Yard Goats','YG'],['Flying Squirrels','FS']],
  aaa:[['Bats','BA'],['Chihuahuas','CH'],['Knights','KN'],['Bisons','BS'],['Aces','AC'],['Storm Chasers','SC']]};
const GAMES={hs:12,college:16,rookie:20,a:22,aa:22,aaa:22,mlb:30};
const MONEY={hs:0,college:0,rookie:3000,a:12000,aa:15000,aaa:35000,mlb:760000};
function money(n){return n>=1e6?'$'+(n/1e6).toFixed(n>=1e7?0:1)+'M':n>=1e3?'$'+Math.round(n/1e3)+'k':'$'+Math.round(n)}
function trainCost(v){return Math.max(3,Math.ceil(v*v/260))}
function stageOf(lv){return lv==='hs'?'hs':lv==='college'?'college':lv==='mlb'?'mlb':'minors'}
function myOVR(){return ovrBat(save.st)}
function rate(L){const ab=L.ab||0,h=L.h||0,tb=h+(L.d||0)+2*(L.t||0)+3*(L.hr||0),pa=L.pa||0;
  const avg=ab?h/ab:0,obp=pa?(h+(L.bb||0))/pa:0,slg=ab?tb/ab:0;return{avg,obp,slg,ops:obp+slg}}
function f3(x){return x>=1?x.toFixed(3):x.toFixed(3).replace(/^0/,'')}
function addLine(a,b){for(const k in b)a[k]=(a[k]||0)+b[k];return a}

/* ================= title ================= */
function renderTitle(){
  const has=!!save&&!save.retired;$('btnContinue').hidden=!has;$('btnNewConfirm').hidden=true;$('btnNew').hidden=false;
  $('careerChip').textContent=save?(RBYID[save.char].name+' · '+(save.retired?'Retired':levelName())+' · Age '+save.age):'No save yet';
  $('btnNew').className=has?'':'go';renderSaveCard();show('title')}
function levelName(){return save.level==='hs'?'High school':save.level==='college'?save.college.name:(save.org?save.org.city+' '+AFFIL[save.level]+(save.level==='mlb'?save.org.name:' '+save.team.name).replace(/^ /,''):LEVELS[save.level].name)}
$('btnContinue').onclick=()=>renderHub();
$('btnNew').onclick=()=>{if(save&&!save.retired){$('btnNew').hidden=true;$('btnNewConfirm').hidden=false}else openSelect('career')};
$('btnNewConfirm').onclick=()=>openSelect('career');
$('btnPractice').onclick=()=>openSelect('practice');
$('btnQuick').onclick=()=>openSelect('quick');
function renderSaveCard(){
  $('installHint').textContent=STANDALONE?'Baseball Go is installed on this device, so your career is kept here. A backup code is still handy if you change phones.'
    :IOS?'Safari can delete website data if you go a week without opening the game. Add it to your Home Screen (Share, then Add to Home Screen) and play from that icon. Copy a backup code first and restore it there.'
    :'Install Baseball Go (browser menu, then Install app or Add to Home screen) so your career is kept and the game works offline. Copy a backup code first, then restore it in the installed app.';
  $('btnBackup').disabled=!save;$('saveMsg').textContent='';$('saveCode').hidden=true;$('btnRestoreGo').hidden=true;$('btnRestoreGo').dataset.arm=''}
function saveCode(){return'BG1:'+btoa(unescape(encodeURIComponent(JSON.stringify(save))))}
$('btnBackup').onclick=async()=>{if(!save)return;const code=saveCode(),ta=$('saveCode');ta.hidden=false;ta.value=code;$('btnRestoreGo').hidden=true;
  let ok=false;try{await navigator.clipboard.writeText(code);ok=true}catch(e){}if(!ok){ta.focus();ta.select()}
  $('saveMsg').textContent=ok?'Copied. Paste it somewhere safe, like Notes or a message to yourself.':'Copy the code above and keep it somewhere safe, like Notes.'};
$('btnRestore').onclick=()=>{const ta=$('saveCode');ta.hidden=false;ta.value='';ta.focus();$('btnRestoreGo').hidden=false;$('btnRestoreGo').dataset.arm='';$('btnRestoreGo').textContent='Restore this career';$('saveMsg').textContent='Paste your backup code above.'};
$('btnRestoreGo').onclick=()=>{const raw=$('saveCode').value.trim().replace(/\s+/g,'');let obj=null;
  try{if(!/^BG1:/.test(raw))throw 0;obj=JSON.parse(decodeURIComponent(escape(atob(raw.slice(4)))))}catch(e){obj=null}
  if(!obj||!obj.char||!obj.st||!RBYID[obj.char]){$('saveMsg').textContent='That code doesn’t look right. Copy the whole code, starting with BG1.';return}
  const b=$('btnRestoreGo');if(save&&b.dataset.arm!=='1'){b.dataset.arm='1';b.textContent='Tap again to replace your current career';return}
  save=obj;store();renderTitle();$('saveMsg').textContent='Restored: '+RBYID[save.char].name+', '+levelName()+'.'};

/* ================= player select ================= */
let selMode='career',selId=null;
const START_FLOOR=30,START_EXTRA=60;// every career starts from the same total, shaped like the character
function careerStart(c){const keys=['contact','power','eye','speed','field','arm'],full=keys.map(k=>c.shape[k]),mn=Math.min(...full),w=full.map(v=>Math.pow(v-mn+1,1.4)),sw=w.reduce((a,b)=>a+b,0);
  const st={};keys.forEach((k,i)=>st[k]=START_FLOOR+Math.round(START_EXTRA*w[i]/sw));
  for(const k of['velo','control','stuff'])st[k]=START_FLOOR+Math.round(c.shape[k]*1.5);return st}
function openSelect(mode){
  selMode=mode;selId=mode!=='career'&&save?save.char:null;
  $('selEyebrow').textContent=mode==='career'?'New career':mode==='practice'?'Batting practice':'Quick game';
  $('selIntro').textContent=mode==='career'?'Every career starts as a 16-year-old high school sophomore with the same total ratings, shaped like the player you pick. Play, train and grow into the ratings shown here, and past them.':'Pick who you want to hit as.';
  $('roster').innerHTML=ROSTER.map(r=>'<button class="pc" data-id="'+r.id+'" aria-pressed="'+(r.id===selId)+'"><strong>'+esc(r.name)+'</strong><small>'+esc(r.nick)+'</small><div class="mini">'+BAT.map(([k,l])=>'<span>'+l+'</span><div class="bar"><i style="width:'+prime(r,k)+'%"></i></div>').join('')+'</div></button>').join('');
  $('roster').querySelectorAll('.pc').forEach(b=>b.onclick=()=>{selId=b.dataset.id;$('roster').querySelectorAll('.pc').forEach(x=>x.setAttribute('aria-pressed',x===b));updSel()});
  $('qmRow').hidden=mode==='career';$('qmLevelWrap').hidden=mode==='career';updSel();show('select')}
function updSel(){$('selGo').disabled=!selId;$('selGo').textContent=selId?(selMode==='career'?'Next: position':selMode==='practice'?'Take batting practice':'Play as '+RBYID[selId].name):'Pick a player'}
$('selBack').onclick=()=>renderTitle();
$('selGo').onclick=()=>{if(!selId)return;if(selMode==='career'){openCreate();return}
  const lv=$('qmLevel').value,c=RBYID[selId],st={};for(const k of['contact','power','eye','speed','field','arm'])st[k]=lv==='hs'?prime(c,k)-20:lv==='college'?prime(c,k)-8:prime(c,k)+4;
  if(selMode==='practice')startPractice(selId,st,lv);else quickGame(selId,st,lv)};
let posId=null;
function openCreate(){posId=null;$('twoWay').checked=false;
  $('positions').innerHTML=POSITIONS.map(([id,n,d])=>'<button class="pc" data-id="'+id+'" aria-pressed="false"><strong>'+id+' · '+n+'</strong><small>'+d+'</small></button>').join('');
  $('positions').querySelectorAll('.pc').forEach(b=>b.onclick=()=>{posId=b.dataset.id;$('positions').querySelectorAll('.pc').forEach(x=>x.setAttribute('aria-pressed',x===b));$('createGo').disabled=false;$('createGo').textContent='Start career'});
  $('createGo').disabled=true;$('createGo').textContent='Pick a position';show('create')}
$('createBack').onclick=()=>openSelect('career');
$('createGo').onclick=()=>{if(!posId)return;const c=RBYID[selId];
  save={v:1,char:selId,pos:posId,twoWay:$('twoWay').checked,st:careerStart(c),xp:0,level:'hs',season:1,year:1,age:16,money:0,earnings:0,
    team:makeTeam('Lincoln','LIN','hs',pick(HUES)),school:'Lincoln',history:[],awards:[],career:emptyLine(),byLevel:{},seasonLine:emptyLine(),games:[],gi:0,
    college:null,collegeSeasons:0,draft:null,org:null,mlbSeasons:0,retired:false,recent:[],titles:0,
    milestones:{}};
  newSeason();store();renderHub()};

/* ================= seasons ================= */
function teamsFor(lv){if(lv==='hs')return HS_TEAMS.filter(t=>t[0]!==save.school).map(([n,s])=>makeTeam(n,s,'hs',pick(HUES)));
  if(lv==='college')return COLLEGES.filter(t=>t[0]!==save.college.name).map(([n,s])=>makeTeam(n,s,'college',pick(HUES),PROGRAMS.find(p=>p.id===save.college.id).str*0.5));
  if(lv==='mlb')return ORGS.filter(o=>o[0]!==save.org.city).map(([c,n,h])=>makeTeam(c+' '+n,abbr(c),'mlb',h));
  return MINOR_TEAMS[lv].map(([n,s])=>makeTeam(n,s,lv,pick(HUES)))}
function abbr(c){return c.split(' ').map(w=>w[0]).join('').slice(0,3).toUpperCase().padEnd(3,c[1].toUpperCase())}
function myTeamFor(lv){if(lv==='hs')return makeTeam(save.school,save.school.slice(0,3).toUpperCase(),'hs',save.team?save.team.hue:0,2);
  if(lv==='college'){const p=PROGRAMS.find(x=>x.id===save.college.id);return makeTeam(p.name,p.short,'college',save.college.hue,p.str)}
  const o=save.org;if(lv==='mlb')return makeTeam(o.city+' '+o.name,abbr(o.city),'mlb',o.hue,2);
  return makeTeam(o.name+' '+AFFIL[lv],abbr(o.city),lv,o.hue,1)}
function newSeason(){
  const lv=save.level;save.team=myTeamFor(lv);save.opps=teamsFor(lv);save.seasonLine=emptyLine();save.gi=0;save.recent=[];save.post=null;save.wl=[0,0];
  const n=GAMES[lv];save.games=[];for(let i=0;i<n;i++)save.games.push({o:i%save.opps.length,home:i%2===0,res:null});
  save.games.sort(()=>Math.random()-0.5);save.lvlStart=save.level;save.allStar=false}
function promote(to,midSeason){const from=save.level;save.level=to;
  const done=save.games.slice(0,save.gi).filter(g=>g.res);save.byLevel[from]=addLine(save.byLevel[from]||emptyLine(),{});
  save.team=myTeamFor(to);save.opps=teamsFor(to);
  const left=Math.max(4,GAMES[to]-(midSeason?Math.round(save.gi*GAMES[to]/GAMES[from]):0));
  save.games=done.map(g=>Object.assign(g,{old:true}));for(let i=0;i<left;i++)save.games.push({o:i%save.opps.length,home:i%2===0,res:null});save.gi=done.length}

/* ================= hub ================= */
function renderHub(){
  if(!save){renderTitle();return}
  if(save.retired){renderRecords();return}
  if(save.pending){renderDecision();return}
  if(save.gi>=save.games.length){seasonEnd();return}
  const C=RBYID[save.char],si=STAGES.findIndex(s=>s[0]===stageOf(save.level));
  $('stepper').innerHTML=STAGES.map((s,i)=>'<div class="step '+(i<si?'done':i===si?'now':'')+'">'+s[1]+'</div>').join('');
  const r=rate(save.seasonLine);
  $('playerCard').innerHTML='<div class="row between" style="align-items:flex-start"><div style="min-width:0"><p class="eyebrow">'+esc(save.pos)+(save.twoWay?' · Two-way':'')+' · Age '+save.age+'</p><h2 style="font-size:32px">'+esc(C.name)+'</h2><p class="muted">'+esc(levelName())+' · '+(save.level==='hs'?['Sophomore','Junior','Senior'][Math.min(2,save.season-1)]+' year':save.level==='college'?['Freshman','Sophomore','Junior','Senior'][Math.min(3,save.season-1)]+' season':'Season '+save.season)+'</p></div><div class="ovr"><small>OVR</small><b class="num">'+myOVR()+'</b></div></div>'+
    '<div class="kv"><div><small>AVG / OPS</small><strong class="num">'+f3(r.avg)+' / '+f3(r.ops)+'</strong></div><div><small>HR · RBI</small><strong class="num">'+save.seasonLine.hr+' · '+save.seasonLine.rbi+'</strong></div><div><small>Team</small><strong class="num">'+save.wl[0]+'–'+save.wl[1]+'</strong></div></div>';
  const G0=save.games[save.gi],opp=save.opps[G0.o],left=save.games.length-save.gi;
  $('nextCard').innerHTML='<p class="eyebrow">Game '+(save.gi+1)+' of '+save.games.length+(save.post?' · '+esc(save.post.name):'')+'</p><h3 style="font-size:26px">'+(G0.home?'vs ':'at ')+esc(opp.name)+'</h3>'+
    '<div class="row"><span class="chip"><span class="dot" style="background:#'+new T.Color(opp.color).getHexString()+'"></span>'+esc(opp.short)+'</span><span class="chip">'+LEVELS[save.level].inn+' innings</span><span class="chip">'+PARKS[LEVELS[save.level].park].name+'</span><span class="chip">Batting '+ord(LEVELS[save.level].spot)+'</span></div>'+
    (save.recent.length?'<p class="muted" style="font-size:14px">Last games: '+save.recent.slice(-5).map(x=>'<b class="'+(x.w?'tw':'tl')+'">'+(x.w?'W':'L')+'</b> '+x.s).join(' · ')+'</p>':'')+
    '<div class="row"><button class="go" id="btnPlay" style="flex:1">Play game</button><button class="ghost" id="btnSim">Sim game</button>'+(left>1?'<button class="ghost" id="btnSim5">Sim '+Math.min(5,left)+'</button>':'')+'</div>';
  $('btnPlay').onclick=()=>playCareerGame(true);$('btnSim').onclick=()=>simGames(1);if($('btnSim5'))$('btnSim5').onclick=()=>simGames(Math.min(5,left));
  const L=save.seasonLine;
  $('statsCard').innerHTML='<h3>Season stats</h3>'+statTable([['This season',L],['Career',save.career]]);
  // training
  const pts=save.xp;
  $('trainCard').innerHTML='<div class="row between"><h3>Training</h3><span class="chip num">'+pts+' training pts</span></div>'+
    [...BAT,...GLOVE].map(([k,l,d])=>{const v=save.st[k],c=trainCost(v);return'<div class="stat"><span title="'+esc(d)+'">'+l+'</span><div class="bar"><i style="width:'+v+'%"></i></div><b class="num sv">'+v+'</b><button data-k="'+k+'" '+(v>=99||pts<c?'disabled':'')+'>+1 · '+c+'</button></div>'}).join('')+
    '<p class="muted" style="font-size:13px">Contact grows your swing zone, Power your exit velocity, Eye how soon you read the pitch. Fielding and Arm are simulated for now.</p>'+
    (save.twoWay?'<div class="note"><b>Two-way:</b> pitching arrives in a later update. Your arm is on the roster: Velocity '+save.st.velo+' · Control '+save.st.control+' · Stuff '+save.st.stuff+'.</div>':'')+
    (save.level!=='hs'&&save.level!=='college'?'<h3 style="margin-top:4px">Off-season camps</h3><p class="muted" style="font-size:13px;margin-top:-6px">Spend salary and bonus money on extra training. Bank: '+money(save.money)+'</p>'+CAMPS.map((c,i)=>'<div class="row between"><span>'+c.n+' <span class="muted">+'+c.xp+' pts</span></span><button data-camp="'+i+'" '+(save.money<c.cost?'disabled':'')+'>'+money(c.cost)+'</button></div>').join(''):'');
  $('trainCard').querySelectorAll('button[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k,c=trainCost(save.st[k]);if(save.xp>=c&&save.st[k]<99){save.xp-=c;save.st[k]++;store();renderHub()}});
  $('trainCard').querySelectorAll('button[data-camp]').forEach(b=>b.onclick=()=>{const c=CAMPS[+b.dataset.camp];if(save.money>=c.cost){save.money-=c.cost;save.xp+=c.xp;store();renderHub()}});
  $('schedCard').innerHTML='<h3>'+esc(save.team.name)+' schedule</h3><ul>'+save.games.map((g,i)=>{const o=save.opps[g.o]||{name:'?'};const cur=i===save.gi;
    const res=g.res?'<span class="res '+(g.res.w?'w':'l')+'">'+(g.res.w?'W ':'L ')+g.res.s+'</span>':cur?'<span class="res next">Next</span>':'<span class="res up">'+(g.home?'Home':'Away')+'</span>';
    return'<li class="'+(cur?'is-next':'')+'"><span class="dot" style="background:#'+new T.Color(o.color||0x888888).getHexString()+'"></span><span style="min-width:0">'+(g.old?'<small class="muted">'+(g.lvl?LVL_SHORT[g.lvl]+' ':'')+'</small>':'')+(g.home?'vs ':'at ')+esc(g.on||o.name)+(g.res&&g.res.me?' <small class="muted">'+esc(g.res.me)+'</small>':'')+'</span>'+res+'</li>'}).join('')+'</ul>';
  $('careerCard').innerHTML='<h3>Career</h3>'+(save.draft?'<p class="muted" style="font-size:14px">'+esc(save.draft.text)+'</p>':'')+
    '<div class="kv"><div><small>Hits</small><strong class="num">'+save.career.h+'</strong></div><div><small>Home runs</small><strong class="num">'+save.career.hr+'</strong></div><div><small>Earnings</small><strong class="num">'+money(save.earnings)+'</strong></div></div>'+
    (save.awards.length?'<ul class="notes">'+save.awards.slice(-8).map(a=>'<li class="n-ach">'+esc(a)+'</li>').join('')+'</ul>':'<p class="muted" style="font-size:14px">No awards yet.</p>')+
    '<div class="row"><button class="ghost" id="btnRecords">Records by season</button></div>';
  $('btnRecords').onclick=renderRecords;
  show('hub')}
$('hubMenu').onclick=()=>renderTitle();
const CAMPS=[{n:'Winter hitting camp',cost:8000,xp:25},{n:'Private hitting coach',cost:60000,xp:90},{n:'Elite performance lab',cost:600000,xp:320}];
function statTable(rows){return'<table class="ftab"><tr><th></th><th>G</th><th>AVG</th><th>OBP</th><th>SLG</th><th>HR</th><th>RBI</th></tr>'+rows.map(([n,L])=>{const r=rate(L);return'<tr><td>'+n+'</td><td>'+(L.g||0)+'</td><td>'+f3(r.avg)+'</td><td>'+f3(r.obp)+'</td><td>'+f3(r.slg)+'</td><td>'+(L.hr||0)+'</td><td>'+(L.rbi||0)+'</td></tr>'}).join('')+'</table>'+
  '<p class="muted num" style="font-size:13px">'+rows.map(([n,L])=>n+': '+(L.pa||0)+' PA, '+(L.h||0)+' H, '+(L.d||0)+' 2B, '+(L.t||0)+' 3B, '+(L.bb||0)+' BB, '+(L.k||0)+' K, '+(L.r||0)+' R').join('<br>')+'</p>'}

/* ================= playing and simulating games ================= */
function gameCfg(){const g=save.games[save.gi],opp=save.opps[g.o],lv=save.level;
  const pitChar=pick(ROSTER.filter(r=>r.id!==save.char)).id;
  return{lv,home:g.home,opp:{team:opp},my:{team:save.team},me:{name:RBYID[save.char].name,id:save.char,st:save.st},pitChar,
    oppPitcher:Object.assign(makePitcher(lv,opp.pit,pitChar),{})}}
async function playCareerGame(live){
  const cfg=gameCfg();
  if(live){await enterPark(cfg);cfg.live=liveAB(cfg)}
  PARK=PARKS[LEVELS[cfg.lv].park];
  const g=await playGame(cfg);
  ABQ.quit=null;if(g.quit){renderHub();return}
  afterGame(g,live,cfg)}
function simGames(n){for(let i=0;i<n&&save.gi<save.games.length;i++){const cfg=gameCfg();PARK=PARKS[LEVELS[cfg.lv].park];simGameSync(cfg)}renderHub()}
/* the same game engine without the awaits: plain sim for "Sim game" */
function simGameSync(cfg){const g=runSync(cfg);afterGame(g,false,cfg,true)}
function runSync(cfg){// synchronous copy of playGame's loop for simulated games
  const L=LEVELS[cfg.lv],inn=L.inn,meSpot=L.spot,teams=cfg.home?[cfg.opp.team,cfg.my.team]:[cfg.my.team,cfg.opp.team],myIdx=cfg.home?1:0;
  const st=cfg.me.st,mine={contact:st.contact,power:st.power,eye:st.eye,speed:st.speed},oppP=cfg.oppPitcher,myP={ovr:cfg.my.team.pit,control:cfg.my.team.pit,stuff:cfg.my.team.pit};
  const g={score:[0,0],line:[[],[]],hits:[0,0],log:[],me:emptyLine(),spot:[0,0],myIdx,teams,oppP,innings:inn};
  const order=t=>Array.from({length:9},(_,i)=>{const q=t.off+(i<5?4-i:-(i-4)*2)+rnd(-4,4);return{contact:q,power:q+rnd(-8,8),eye:q+rnd(-6,6),speed:clamp(q+rnd(-15,15),20,95)}});
  const lineups=[order(teams[0]),order(teams[1])],opts={err:L.err,arm:L.arm};let over=false;
  for(let i=1;i<inn+7&&!over;i++)for(const half of['top','bottom']){const bat=half==='top'?0:1;if(half==='bottom'&&i>=inn&&g.score[1]>g.score[0]){over=true;break}
    let outs=0,bases=[null,null,null],runs=0,meOn=-1;
    while(outs<3){const k=g.spot[bat]%9,isMe=bat===myIdx&&k===meSpot-1,b=isMe?mine:lineups[bat][k],pit=bat===myIdx?oppP:myP;
      const res=simPA(b,pit,{outs,bases},opts);
      if(meOn>=0&&!isMe){const mv=(res.runnerMoves||[]).find(m=>m.from===meOn+1);if(mv){if(mv.to>=4){g.me.r++;meOn=-1}else meOn=mv.to-1}else if(res.bases&&res.bases[meOn]==null)meOn=-1}
      if(isMe){lineAdd(g.me,res);meOn=-1;if(res.code==='HR')g.me.r++;else{const q={'1B':0,'2B':1,'3B':2,BB:0,HBP:0,E:0,FC:0}[res.code];if(q!=null)meOn=q}}
      outs+=res.out||0;runs+=res.runs||0;g.score[bat]+=res.runs||0;if(['1B','2B','3B','HR'].includes(res.code))g.hits[bat]++;bases=outs>=3?[null,null,null]:(res.bases||bases);if(outs>=3)meOn=-1;g.spot[bat]++;
      if(half==='bottom'&&i>=inn&&g.score[1]>g.score[0]){outs=3;over=true}}
    g.line[bat].push(runs);if(over)break;if(half==='bottom'&&i>=inn&&g.score[0]!==g.score[1]){over=true;break}if(half==='top'&&i>=inn&&g.score[1]>g.score[0]){g.line[1].push('x');over=true;break}}
  g.won=g.score[myIdx]>g.score[1-myIdx];return g}
function xpFor(me,won,live){let x=4+(won?2:0)+me.h*3+me.d*2+me.t*3+me.hr*6+me.bb*2+me.rbi+me.r;return Math.round(x*(live?1:0.6)*(save.level==='college'?PROGRAMS.find(p=>p.id===save.college.id).xp:1))}
function afterGame(g,live,cfg,quiet){
  const gm=save.games[save.gi],me=g.me;me.g=1;
  const s=g.score[g.myIdx]+'–'+g.score[1-g.myIdx];
  gm.res={w:g.won,s,me:me.h+'-for-'+me.ab+(me.hr?', '+me.hr+' HR':'')+(me.rbi?', '+me.rbi+' RBI':'')};gm.lvl=save.level;
  addLine(save.seasonLine,me);addLine(save.career,me);save.byLevel[save.level]=addLine(save.byLevel[save.level]||emptyLine(),me);
  save.wl[g.won?0:1]++;save.recent.push({w:g.won,s});save.gi++;
  const xp=xpFor(me,g.won,live);save.xp+=xp;
  const pay=MONEY[save.level]/GAMES[save.level]*(save.level==='mlb'?salaryMult():1);if(pay){save.money+=pay;save.earnings+=pay}
  const notes=checkMilestones(me);
  const promo=checkPromotion();
  store();
  if(quiet){if(promo)save.flash=promo;return}
  showGameResult(g,xp,notes,promo,cfg)}
function salaryMult(){const s=save.mlbSeasons;const r=rate(save.byLevel.mlb||emptyLine());return(1+s*0.6)*(1+Math.max(0,r.ops-0.72)*4)}
function checkMilestones(me){const n=[],c=save.career,M=save.milestones;
  const hit=(k,v,t)=>{if(c[k]>=v&&!M[k+v]){M[k+v]=1;n.push(t)}};
  hit('h',1,'First career hit!');hit('hr',1,'First career home run!');hit('hr',10,'10 career home runs');hit('hr',50,'50 career home runs');hit('hr',100,'100 career home runs');hit('h',100,'100 career hits');hit('h',500,'500 career hits');hit('h',1000,'1,000 career hits');
  if(me.hr>=2)n.push(me.hr+' home runs in one game!');if(me.h>=4)n.push(me.h+' hits in one game!');return n}
/* call-ups: every few games in the minors, a hot hitter with the tools moves up */
function checkPromotion(){const lv=save.level,i=LVL_ORDER.indexOf(lv);if(i<0||lv==='mlb')return null;
  save.lvlG=(save.lvlG||0)+1;if(save.lvlG<10||save.lvlG%3)return null;const r=rate(save.seasonLine),next=LVL_ORDER[i+1];
  if(myOVR()>=LEVELS[next].bat&&r.ops>=0.85||myOVR()>=LEVELS[next].bat+6){const from=LEVELS[lv].name;save.lvlG=0;promote(next,true);
    const t=next==='mlb'?'You’re going to the Bigs! '+save.org.city+' '+save.org.name+' call you up from '+from+'.':'Promoted to '+LEVELS[next].name+'! Pack your bags for the '+save.team.name+'.';save.awards.push((next==='mlb'?'MLB debut':'Promoted to '+LEVELS[next].name)+' (age '+save.age+')');return t}
  return null}
function showGameResult(g,xp,notes,promo,cfg){
  const me=g.me;
  $('resBanner').textContent=g.won?'Win':'Loss';$('resBanner').className='banner '+(g.won?'w':'l');
  $('resScore').textContent=g.teams[0].short+' '+g.score[0]+' · '+g.teams[1].short+' '+g.score[1];
  $('resLine').innerHTML=lineScore(g);
  $('resMe').innerHTML='<p class="eyebrow">Your line</p><p class="big num">'+me.h+'-for-'+me.ab+(me.d?', '+me.d+' 2B':'')+(me.t?', '+me.t+' 3B':'')+(me.hr?', '+me.hr+' HR':'')+(me.rbi?', '+me.rbi+' RBI':'')+(me.bb?', '+me.bb+' BB':'')+(me.k?', '+me.k+' K':'')+(me.r?', '+me.r+' R':'')+'</p>'+
    '<p class="muted">+'+xp+' training points</p>'+(notes.length||promo?'<ul class="notes">'+(promo?'<li class="n-lvl">'+esc(promo)+'</li>':'')+notes.map(t=>'<li class="n-ach">'+esc(t)+'</li>').join('')+'</ul>':'');
  $('resLog').innerHTML=g.log.filter(x=>x.me).map(x=>'<li>'+esc(x.t)+'</li>').join('');
  $('resNext').onclick=()=>renderHub();show('result')}

/* ---- live at-bats inside a game ---- */
async function enterPark(cfg){
  const fl=LIGHT.filter(x=>x!==cfg.me.id&&x!==cfg.pitChar);
  await setupScene({park:LEVELS[cfg.lv].park,batterId:cfg.me.id,pitcherId:cfg.pitChar,fielderIds:[fl[0],fl[1]],runnerId:fl[2]||fl[0],homeColor:(cfg.home?cfg.my.team:cfg.opp.team).color,defHue:cfg.opp.team.hue,myHue:cfg.my.team.hue});
  sndResume();}
function liveAB(cfg){let lastLog=0;
  return(ctx)=>new Promise(res=>{
    const g=ctx.g,news=g.log.slice(lastLog);lastLog=g.log.length;
    const simMe=()=>{const st=cfg.me.st;return simPA({contact:st.contact,power:st.power,eye:st.eye,speed:st.speed},ctx.pitcher,ctx.sit,{err:LEVELS[cfg.lv].err,arm:LEVELS[cfg.lv].arm})};
    if(g.simRest){res(simMe());return}
    ABQ.quit=()=>{A=null;$('between').hidden=true;res({quit:true})};
    const go=()=>{$('between').hidden=true;
      startPA({lv:cfg.lv,st:cfg.me.st,pitcher:ctx.pitcher,sit:ctx.sit,teams:ctx.teams,ab:ctx.ab,errRate:LEVELS[cfg.lv].err,arm:LEVELS[cfg.lv].arm,
        intro:'At-bat '+ctx.ab+' · '+(ctx.sit.outs?ctx.sit.outs+' out'+(ctx.sit.outs>1?'s':''):'No outs')+(runnersText(ctx.sit.bases)?' · '+runnersText(ctx.sit.bases):''),
        onDone:r=>{lastLog=g.log.length+1;res(r)}})};
    betweenPanel(g,news,ctx,go,()=>{$('between').hidden=true;g.simRest=true;res(simMe())})});}
const ABQ={quit:null};
function runnersText(b){const on=[0,1,2].filter(k=>b&&b[k]!=null);if(!on.length)return'';if(on.length===3)return'Bases loaded';return'Runner'+(on.length>1?'s':'')+' on '+on.map(k=>['first','second','third'][k]).join(' and ')}
function betweenPanel(g,news,ctx,go,simRest){
  A=null;W3.pci.visible=false;W3.zone.visible=false;
  const p=$('between'),s=ctx.sit;p.hidden=false;
  $('btwHead').innerHTML='<p class="eyebrow">'+(s.half==='top'?'Top':'Bottom')+' of the '+ord(s.inning)+' · '+s.outs+' out'+(s.outs===1?'':'s')+'</p><h3 class="num">'+esc(g.teams[0].short)+' '+g.score[0]+' · '+esc(g.teams[1].short)+' '+g.score[1]+'</h3>';
  $('btwLog').innerHTML=news.slice(-14).map(x=>x.h?'<li class="h">'+esc(x.t)+'</li>':'<li class="'+(x.me?'me':'')+'">'+esc(x.t)+'</li>').join('')||'<li class="muted">Play ball!</li>';
  $('btwSit').textContent='Your turn: '+(runnersText(s.bases)||'bases empty')+'. '+ctx.pitcher.name+' is on the mound ('+ctx.pitcher.velo+' mph · '+ctx.pitcher.mix.map(m=>PT[m[0]].s).join(', ')+').';
  $('btwGo').onclick=go;$('btwSim').onclick=simRest}
$('quit').onclick=()=>{if(!$('between').hidden){$('pmQuit').click();return}openPause()};
function openPause(){$('pauseMenu').hidden=false;CLK.paused=true}
$('pmResume').onclick=()=>{$('pauseMenu').hidden=true;CLK.paused=false};
$('pmQuit').onclick=()=>{$('pauseMenu').hidden=true;CLK.paused=false;const prac=A&&A.practice;A=null;$('between').hidden=true;
  if(!prac&&ABQ.quit){const q=ABQ.quit;ABQ.quit=null;q()}else renderTitleOrHub()};
function renderTitleOrHub(){if(save&&!save.retired)renderHub();else renderTitle()}

/* ================= season end, playoffs, decisions ================= */
function seasonEnd(){
  const lv=save.level,L=save.seasonLine,r=rate(L),awards=[];
  // awards by level
  const pa=L.pa||0;
  if(lv==='hs'){if(r.ops>=1.0&&pa>=25)awards.push('All-State ('+save.age+')');if(save.wl[0]>=save.wl[1]+4){awards.push('Conference champions');save.titles++}}
  if(lv==='college'){if(r.ops>=0.95&&pa>=35)awards.push('All-American');if(r.ops>=1.05&&L.hr>=6)awards.push('College Player of the Year');if(save.wl[0]>=12){awards.push('National tournament bid');}}
  if(LVL_ORDER.includes(lv)&&lv!=='mlb'){if(r.ops>=0.9&&pa>=40)awards.push(LEVELS[lv].name+' All-Star')}
  if(lv==='mlb'){save.mlbSeasons++;if(r.ops>=0.85&&pa>=50)awards.push('All-Star');if(r.ops>=0.9&&pa>=70)awards.push('Silver Slugger');if(r.ops>=1.08&&L.hr>=12&&pa>=90)awards.push('MVP');if(save.mlbSeasons===1&&r.ops>=0.8&&pa>=50)awards.push('Rookie of the Year');
    if(save.wl[0]>=19){awards.push('Postseason');if(Math.random()<0.3+(save.wl[0]-19)*0.05){awards.push('Champions!');save.titles++}}}
  awards.forEach(a=>save.awards.push(a+' · '+(lv==='mlb'?'season '+save.mlbSeasons:LEVELS[lv].name+' '+save.age)));
  save.history.push({year:save.year,age:save.age,lv:save.lvlStart===lv?lv:save.lvlStart+'→'+lv,team:save.team.name,line:Object.assign({},L),wl:save.wl.slice(),awards});
  // growth over the off-season: young players fill out, older ones slow down
  const grow=save.age<20?2:save.age<24?1:save.age<28?0.5:save.age<32?0:-1;
  for(const k of['contact','power','eye','speed','field','arm']){let d=Math.round(grow+(Math.random()<0.4?1:0));if(k==='speed'&&save.age>=29)d-=2;if(k==='power'&&save.age<24)d+=1;save.st[k]=clamp(save.st[k]+d,1,99)}
  save.age++;save.year++;
  // what's next
  let next=null;
  if(lv==='hs'){if(save.season<3){save.season++;newSeason();next='Next year: you’re a '+(save.season===2?'junior':'senior')+'.'}else{save.pending={type:'hsDraft'};}}
  else if(lv==='college'){save.collegeSeasons++;const juco=save.college.id==='lakes';
    if(save.collegeSeasons>=4||(juco&&save.collegeSeasons>=1)||save.collegeSeasons>=3)save.pending={type:'colDraft'};else{save.season++;newSeason();next='Next season with '+save.college.name+'.'}}
  else{// pro
    const i=LVL_ORDER.indexOf(lv);if(lv!=='mlb'&&myOVR()>=LEVELS[LVL_ORDER[i+1]].bat-2&&r.ops>=0.78){save.level=LVL_ORDER[i+1];save.lvlG=0;next='You start next season in '+LEVELS[save.level].name+'.'}
    save.season++;save.retireAsk=save.age>=35;newSeason();if(!next)next='Back to '+LEVELS[save.level].name+' next season.'}
  store();
  const sum='<p class="muted">'+save.wl[0]+'–'+save.wl[1]+' as a team. You hit '+f3(r.avg)+' with '+L.hr+' HR, '+L.rbi+' RBI and an OPS of '+f3(r.ops)+' in '+(L.g||0)+' games.</p>';
  const old=save.history[save.history.length-1];
  $('seasonEyebrow').textContent='Season over';$('seasonTitle').textContent=(old.team)+' · age '+old.age;
  $('seasonText').innerHTML=sum.replace(save.wl[0]+'–'+save.wl[1],old.wl[0]+'–'+old.wl[1])+(awards.length?'<ul class="notes">'+awards.map(a=>'<li class="n-ach">'+esc(a)+'</li>').join('')+'</ul>':'')+'<p>'+esc(next||'Decision time.')+'</p>'+
    (save.retireAsk?'<p class="muted">You’re '+save.age+'. You can keep playing as long as you like, or hang them up.</p>':'');
  $('seasonBtns').innerHTML='<button class="go" id="snGo">'+(save.pending?'Continue':'Next season')+'</button>'+(save.retireAsk?'<button class="ghost" id="snRetire">Retire</button>':'');
  $('snGo').onclick=()=>renderHub();if($('snRetire'))$('snRetire').onclick=retire;
  show('season')}
function retire(){save.retired=true;store();renderRecords()}
function draftScore(){const r=rate(save.seasonLine.pa?save.seasonLine:save.history.length?save.history[save.history.length-1].line:emptyLine());return myOVR()+clamp((r.ops-0.8)*20,-6,8)+rnd(-2,2)}
function draftResult(){const s=draftScore(),age=save.age;let round,bonus;
  if(s>=72){round=1;bonus=rnd(2.5e6,7e6)}else if(s>=66){round=rnd(1,2)<1.5?1:2;bonus=rnd(1.1e6,2.5e6)}else if(s>=61){round=Math.round(rnd(3,5));bonus=rnd(3e5,8e5)}else if(s>=56){round=Math.round(rnd(6,10));bonus=rnd(1.25e5,2.5e5)}else if(s>=51){round=Math.round(rnd(11,20));bonus=rnd(5e4,1.25e5)}else return null;
  const o=pick(ORGS);return{round,pick:round*30-Math.round(rnd(0,29)),bonus:Math.round(bonus/1000)*1000,org:{city:o[0],name:o[1],hue:o[2]},score:s}}
function renderDecision(){
  const P=save.pending;$('decideBody').innerHTML='';
  if(P.type==='hsDraft'||P.type==='colDraft'){
    if(!P.draft){P.draft=draftResult()||'none';store()}
    const d=P.draft==='none'?null:P.draft,fromHS=P.type==='hsDraft';
    $('decideEyebrow').textContent='Draft day';$('decideTitle').textContent=d?'Round '+d.round+', pick '+d.pick:'Undrafted';
    let html=d?'<p>The <b>'+esc(d.org.city+' '+d.org.name)+'</b> take you in round '+d.round+' with a '+money(d.bonus)+' signing bonus offer.</p>':'<p class="muted">Your name wasn’t called this year.</p>';
    const offers=fromHS?PROGRAMS.filter(p=>draftScore()>=p.need-1||p.id==='lakes'):[];
    html+='<div class="list">';
    if(d)html+='<button class="pc offer" data-a="sign"><strong>Sign with '+esc(d.org.name)+'</strong><small>'+money(d.bonus)+' bonus. Start in '+(d.round<=2&&!fromHS?'Single-A':'Rookie ball')+' and work your way up.</small></button>';
    if(fromHS)offers.forEach(p=>html+='<button class="pc offer" data-a="col" data-id="'+p.id+'"><strong>'+esc(p.name)+'</strong><small>'+esc(p.blurb)+'</small></button>');
    if(!fromHS&&save.collegeSeasons<4&&save.college.id!=='lakes')html+='<button class="pc offer" data-a="return"><strong>Return for another season</strong><small>Improve your stock with '+esc(save.college.name)+' and go back into next year’s draft.</small></button>';
    if(!d&&!fromHS)html+='<button class="pc offer" data-a="fa"><strong>Sign as an undrafted free agent</strong><small>A $5k deal with a team that liked your swing. Start in Rookie ball.</small></button>';
    html+='</div>';$('decideBody').innerHTML=html;
    $('decideBody').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a;
      if(a==='sign'||a==='fa'){const dd=d||{round:0,bonus:5000,org:(o=>({city:o[0],name:o[1],hue:o[2]}))(pick(ORGS))};save.org=dd.org;save.money+=dd.bonus;save.earnings+=dd.bonus;
        save.draft={round:dd.round,text:dd.round?'Drafted in round '+dd.round+' by '+dd.org.city+' '+dd.org.name+' ('+money(dd.bonus)+' bonus).':'Signed as an undrafted free agent by '+dd.org.city+' '+dd.org.name+'.'};
        save.level=dd.round&&dd.round<=2&&!fromHS?'a':'rookie';save.season=1;save.pending=null;newSeason();store();renderHub()}
      if(a==='col'){const p=PROGRAMS.find(x=>x.id===b.dataset.id);save.college={id:p.id,name:p.name,hue:pick(HUES)};save.level='college';save.season=1;save.collegeSeasons=0;save.pending=null;newSeason();store();renderHub()}
      if(a==='return'){save.pending=null;save.season++;newSeason();store();renderHub()}});
  }
  show('decide')}
function renderRecords(){
  const rows=save.history.map(h=>{const r=rate(h.line);return'<tr><td>'+h.age+'</td><td>'+esc(LVL_SHORT[h.lv]||h.lv)+'</td><td>'+(h.line.g||0)+'</td><td>'+f3(r.avg)+'</td><td>'+(h.line.hr||0)+'</td><td>'+(h.line.rbi||0)+'</td><td>'+f3(r.ops)+'</td></tr>'}).join('');
  $('recBody').innerHTML='<table class="ftab rec"><tr><th>Age</th><th>Lvl</th><th>G</th><th>AVG</th><th>HR</th><th>RBI</th><th>OPS</th></tr>'+rows+'</table>'+statTable([['Career',save.career]])+
    (save.awards.length?'<h3>Awards</h3><ul class="notes">'+save.awards.map(a=>'<li class="n-ach">'+esc(a)+'</li>').join('')+'</ul>':'')+
    (save.retired?'<p class="muted">Retired at '+save.age+'. Hall of Fame score: '+hofScore()+' ('+(hofScore()>=300?'first ballot!':hofScore()>=180?'on the ballot':'a fine career')+').</p>':'');
  $('recBack').onclick=()=>save.retired?renderTitle():renderHub();show('records')}
function hofScore(){const c=save.career;return Math.round(c.h*0.12+c.hr*0.8+save.awards.filter(a=>/MVP/.test(a)).length*40+save.awards.filter(a=>/^All-Star|Silver/.test(a)).length*10+save.titles*15)}

/* ================= batting practice and quick games ================= */
async function startPractice(id,st,lv){
  const pitchers=['granny','ch39','ch28'];const pid=pitchers.find(p=>p!==id)||'ch28';
  await setupScene({park:LEVELS[lv].park,batterId:id,pitcherId:pid,homeColor:0x2E5FA8,defHue:200,myHue:0});sndResume();
  const L=LEVELS[lv],pi={name:RBYID[pid].name,velo:Math.round((L.velo[0]+L.velo[1])/2),control:70,stuff:55,ovr:50,mix:L.mix};
  A=null;startPA({lv,st,pitcher:pi,practice:true,intro:'Tap when the ring closes on your yellow circle.',teams:['',''],onDone:()=>{}});
  ABQ.quit=null}
async function quickGame(id,st,lv){
  const t1=makeTeam('Home Nine','HOM',lv,pick(HUES)),t2=makeTeam('Visitors','VIS',lv,pick(HUES));
  const pitChar=pick(ROSTER.filter(r=>r.id!==id)).id;
  const cfg={lv,home:true,opp:{team:t2},my:{team:t1},me:{name:RBYID[id].name,id,st},pitChar,oppPitcher:makePitcher(lv,t2.pit,pitChar)};
  await enterPark(cfg);cfg.live=liveAB(cfg);PARK=PARKS[LEVELS[lv].park];
  const g=await playGame(cfg);ABQ.quit=null;if(g.quit){renderTitle();return}
  const me=g.me;$('resBanner').textContent=g.won?'Win':'Loss';$('resBanner').className='banner '+(g.won?'w':'l');$('resScore').textContent=g.teams[0].short+' '+g.score[0]+' · '+g.teams[1].short+' '+g.score[1];
  $('resLine').innerHTML=lineScore(g);$('resMe').innerHTML='<p class="eyebrow">Your line</p><p class="big num">'+me.h+'-for-'+me.ab+(me.hr?', '+me.hr+' HR':'')+(me.rbi?', '+me.rbi+' RBI':'')+'</p>';
  $('resLog').innerHTML=g.log.filter(x=>x.me).map(x=>'<li>'+esc(x.t)+'</li>').join('');$('resNext').onclick=()=>renderTitle();show('result')}
