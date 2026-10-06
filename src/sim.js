/* ================= games: the innings around your at-bats =================
   Every other plate appearance is simulated with the same ball physics and defence as your live ones:
   strikeouts and walks come from the matchup, balls in play get an exit velocity, launch angle and spray. */
const SIMB={};
/* a batted ball for a simulated matchup. bat: {contact,power,eye,speed}, pit: {ovr,control,stuff} */
function simPAOutcome(bat,pit,lv){
  const c=bat.contact,pw=bat.power,e=bat.eye,po=pit.ovr;
  const k=clamp(0.215-(c-po)*0.0042-(e-po)*0.0012,0.05,0.42),bb=clamp(0.083+(e-pit.control)*0.0022,0.025,0.19),hbp=0.009,r=Math.random();
  if(r<k)return{kind:'K'};if(r<k+bb)return{kind:'BB'};if(r<k+bb+hbp)return{kind:'HBP'};
  const ev=clamp(87.5+(pw-po)*0.2+(c-po)*0.07+gauss()*13.5,30,120),la=11+gauss()*26+(pw-50)*0.05,spray=(-4+gauss()*24)*Math.PI/180;
  return{kind:'play',ev,la,spray}}
/* one simulated plate appearance against the defence; returns a result in the same shape as a live one */
function simPA(bat,pit,sit,opt){opt=opt||{};
  const o=simPAOutcome(bat,pit);
  if(o.kind!=='play'){if(o.kind==='K')return{code:'K',out:1,runs:0,rbi:0,bases:sit.bases.slice(),desc:'strikes out'};
    const b=sit.bases,nb=[bat.speed,null,null],mv=[];let runs=0;
    if(b[0]!=null){nb[1]=b[0];mv.push({from:1,to:2});if(b[1]!=null){nb[2]=b[1];mv.push({from:2,to:3});if(b[2]!=null){runs=1;mv.push({from:3,to:4})}}else nb[2]=b[2]}else{nb[1]=b[1];nb[2]=b[2]}
    return{code:o.kind,out:0,runs,rbi:runs,bases:nb,runnerMoves:mv,desc:o.kind==='BB'?'walks':'is hit by a pitch'}}
  for(let tries=0;tries<6;tries++){
    const B=simBall(o.ev,o.la,o.spray,PARK,{x0:0,y0:0.85,z0:-0.3});
    const R=resolvePlay(B,{outs:sit.outs,bases:sit.bases,spd:bat.speed,err:opt.err||0.02,arm:opt.arm||30});
    if(R.code==='FOUL'){o.spray=(-4+gauss()*20)*Math.PI/180;o.la=11+gauss()*24;continue}
    R.ev=o.ev;R.la=o.la;R.dist=B.dist;R.out=R.out||0;return R}
  return{code:'GO',out:1,runs:0,rbi:0,bases:sit.bases.slice(),desc:'grounds out',runnerMoves:[]}}

/* ---- teams ---- */
const HUES=[0,30,60,120,180,210,240,280,320];
function teamColor(h){return new T.Color().setHSL(((h+215)%360)/360,0.55,0.4).getHex()}
/* lineup quality around a level's average */
function makeTeam(name,short,lv,hue,strength){return{name,short,hue,color:teamColor(hue),off:Math.round(LEVELS[lv].bat+(strength||0)+rnd(-5,5)),pit:Math.round(LEVELS[lv].pit+(strength||0)+rnd(-5,5))}}
/* level averages (0-99) and the pitchers you face there */
const LEVELS={
  hs:     {name:'High school',bat:36,pit:38,velo:[72,87],mix:[['FF',62],['CB',22],['CH',16]],inn:7,park:'hs',err:0.05,arm:24,spot:3},
  college:{name:'College',    bat:48,pit:50,velo:[84,93],mix:[['FF',52],['SL',20],['CB',14],['CH',14]],inn:9,park:'college',err:0.03,arm:27,spot:3},
  rookie: {name:'Rookie ball',bat:50,pit:52,velo:[87,94],mix:[['FF',50],['SL',20],['CB',14],['CH',16]],inn:9,park:'minors',err:0.03,arm:28,spot:5},
  a:      {name:'Single-A',   bat:54,pit:56,velo:[88,95],mix:[['FF',48],['SL',20],['CB',12],['CH',14],['SI',6]],inn:9,park:'minors',err:0.025,arm:29,spot:5},
  aa:     {name:'Double-A',   bat:59,pit:61,velo:[89,96],mix:[['FF',44],['SL',20],['CB',12],['CH',14],['SI',6],['CT',4]],inn:9,park:'minors',err:0.02,arm:30,spot:5},
  aaa:    {name:'Triple-A',   bat:63,pit:65,velo:[90,97],mix:[['FF',42],['SL',20],['CB',12],['CH',14],['SI',8],['CT',4]],inn:9,park:'minors',err:0.018,arm:31,spot:4},
  mlb:    {name:'The Bigs',   bat:68,pit:71,velo:[91,100],mix:[['FF',40],['SL',20],['CB',10],['CH',12],['SI',10],['CT',5],['SP',3]],inn:9,park:'majors',err:0.015,arm:32,spot:4}
};
const PITCHER_NAMES=['Cole Varga','Mason Drey','Eli Santos','Rafael Ortiz','Brady Kline','Tyler Moss','Jun Park','Luis Herrera','Owen Pike','Nate Ruiz','Cody Blaire','Ike Thorne','Sam Okafor','Drew Castillo','Kenji Mori','Wes Hollis','Ty Brennan','Marcus Vale','Hugo Pena','Reid Calder'];
function makePitcher(lv,teamPit,charId){const L=LEVELS[lv],ovr=clamp(Math.round((teamPit||L.pit)+rnd(-6,8)),20,99);
  const u=clamp((ovr-L.pit+12)/24,0,1),velo=Math.round(L.velo[0]+(L.velo[1]-L.velo[0])*(0.25+0.75*u)+rnd(-1.5,1.5));
  const mix=L.mix.filter(()=>Math.random()<0.85);if(!mix.find(m=>m[0]==='FF'||m[0]==='SI'))mix.unshift(['FF',50]);if(mix.length<2)mix.push(L.mix[1]);
  return{name:pick(PITCHER_NAMES),id:charId,ovr,velo,control:clamp(ovr+rnd(-10,10),15,99),stuff:clamp(ovr+rnd(-10,10),15,99),mix}}

/* ---- a game ---- */
/* cfg: {lv, me:{name,id,st}, my:{team}, opp:{team}, home: true if my team is home, live: play your at-bats, rival pitcher?}
   returns a promise of the box score */
function emptyLine(){return{pa:0,ab:0,h:0,d:0,t:0,hr:0,rbi:0,r:0,bb:0,k:0,sb:0}}
function lineAdd(L,res){L.pa++;const c=res.code;if(c!=='BB'&&c!=='HBP'&&c!=='SF')L.ab++;if(['1B','2B','3B','HR'].includes(c))L.h++;if(c==='2B')L.d++;if(c==='3B')L.t++;if(c==='HR')L.hr++;if(c==='BB'||c==='HBP')L.bb++;if(c==='K')L.k++;L.rbi+=res.rbi||0}
async function playGame(cfg){
  const L=LEVELS[cfg.lv],inn=cfg.innings||L.inn,meSpot=cfg.spot||L.spot;
  const teams=cfg.home?[cfg.opp.team,cfg.my.team]:[cfg.my.team,cfg.opp.team];// [away, home]
  const myIdx=cfg.home?1:0;
  const st=cfg.me.st,mine={contact:st.contact,power:st.power,eye:st.eye,speed:st.speed};
  const oppP=cfg.oppPitcher||makePitcher(cfg.lv,cfg.opp.team.pit,null);
  const myP={ovr:cfg.my.team.pit,control:cfg.my.team.pit,stuff:cfg.my.team.pit};
  const g={score:[0,0],line:[[],[]],hits:[0,0],log:[],me:emptyLine(),spot:[0,0],inning:1,half:'top',over:false,myIdx,teams,oppP,lv:cfg.lv,innings:inn};
  // the order: nine hitters; yours is at meSpot (1-based); teammates and opponents vary around the team's level
  const order=t=>{const base=t.off;return Array.from({length:9},(_,i)=>{const q=base+(i<5?4-i:-(i-4)*2)+rnd(-4,4);return{contact:q,power:q+rnd(-8,8),eye:q+rnd(-6,6),speed:clamp(q+rnd(-15,15),20,95)}})};
  const lineups=[order(teams[0]),order(teams[1])];
  const opts={err:L.err,arm:L.arm};
  let liveCount=0;
  for(let i=1;;i++){
    for(const half of['top','bottom']){
      const bat=half==='top'?0:1,pitT=teams[1-bat];g.inning=i;g.half=half;
      if(half==='bottom'&&i>=inn&&g.score[1]>g.score[0]){g.over=true;break}
      let outs=0,bases=[null,null,null],runs=0,meOn=-1;
      g.log.push({h:true,t:(half==='top'?'Top ':'Bottom ')+ord(i)});
      while(outs<3){
        const k=g.spot[bat]%9,isMe=bat===myIdx&&k===meSpot-1,b=isMe?mine:lineups[bat][k],pit=bat===myIdx?{ovr:oppP.ovr,control:oppP.control,stuff:oppP.stuff}:myP;
        let res;
        const sit={inning:i,half,outs,bases:bases.slice(),score:g.score.slice()};
        if(isMe&&cfg.live){liveCount++;res=await cfg.live({sit,g,ab:liveCount,pitcher:oppP,teams:teams.map(t=>t.short)})}
        else res=simPA(b,pit,sit,opts);
        if(res.quit){g.quit=true;return g}
        // where did you go if you were on base?
        if(meOn>=0&&!isMe){const mv=(res.runnerMoves||[]).find(m=>m.from===meOn+1);if(mv){if(mv.to>=4){g.me.r++;meOn=-1}else meOn=mv.to-1}else if(res.bases&&res.bases[meOn]==null)meOn=-1}
        if(isMe){lineAdd(g.me,res);meOn=-1;if(res.code==='HR')g.me.r++;else{const q={'1B':0,'2B':1,'3B':2,BB:0,HBP:0,E:0,FC:0}[res.code];if(q!=null)meOn=q}}
        outs+=res.out||0;runs+=res.runs||0;g.score[bat]+=res.runs||0;if(['1B','2B','3B','HR'].includes(res.code))g.hits[bat]++;
        bases=outs>=3?[null,null,null]:(res.bases||bases);if(outs>=3)meOn=-1;
        const who=teams[bat].short+' #'+(k+1);
        g.log.push({me:isMe,t:(isMe?'You ':who+' ')+(res.desc||res.code)+(res.runs?' ('+(res.runs===1?'1 run scores':res.runs+' runs score')+')':''),s:g.score.slice(),outs:Math.min(outs,3),code:res.code});
        g.spot[bat]++;
        // walk-off
        if(half==='bottom'&&i>=inn&&g.score[1]>g.score[0]){outs=3;g.over=true}
        if(cfg.onPA)cfg.onPA(g);
      }
      g.line[bat].push(runs);
      if(g.over)break;
      if(half==='bottom'&&i>=inn&&g.score[0]!==g.score[1]){g.over=true;break}
      if(half==='top'&&i>=inn&&g.score[1]>g.score[0]){g.line[1].push('x');g.over=true;break}
    }
    if(g.over||i>=inn+6)break;
  }
  g.won=g.score[myIdx]>g.score[1-myIdx];return g}
/* box line score as HTML */
function lineScore(g){const n=Math.max(g.line[0].length,g.line[1].length,g.innings);
  const head='<tr><th></th>'+Array.from({length:n},(_,i)=>'<th>'+(i+1)+'</th>').join('')+'<th>R</th><th>H</th></tr>';
  const row=i=>'<tr class="'+(i===g.myIdx?'me':'')+'"><td>'+esc(g.teams[i].short)+'</td>'+Array.from({length:n},(_,k)=>'<td>'+(g.line[i][k]!=null?g.line[i][k]:'')+'</td>').join('')+'<td><b>'+g.score[i]+'</b></td><td>'+g.hits[i]+'</td></tr>';
  return'<div class="lsw"><table class="ls">'+head+row(0)+row(1)+'</table></div>'}
