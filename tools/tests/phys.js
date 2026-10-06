const fs=require('fs');eval(fs.readFileSync(__dirname+'/../../src/play.js','utf8').replace(/^const /gm,'var ').replace(/^function /gm,'function '));
global.PARK={line:100,cf:122,wall:3};var P=PARK;
for(const [ev,la] of [[103,28],[95,28],[110,27],[100,20],[105,35],[90,15],[100,5],[85,-5],[100,50],[80,25]]){const B=simBall(ev,la,0,P);console.log(ev,la,'land',B.dist&&B.dist.toFixed(1),'ft',B.dist&&(B.dist*3.28).toFixed(0),'hang',B.landT&&B.landT.toFixed(2),'hr',B.hr,'apex',B.apex.toFixed(1),B.wall?('wall y '+B.wall.y.toFixed(1)):'')}
