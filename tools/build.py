"""Assemble the single-file game: python3 tools/build.py  ->  index.html"""
import json,os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));S=os.path.join(R,'src')
rd=lambda *p:open(os.path.join(S,*p),encoding='utf-8').read()
mc=json.loads(rd('assets','mclips.json'))
game=rd('game.js')
for k,f in [('FX','fx.js'),('PLAY','play.js'),('RIG','rig.js'),('PARK','park.js'),('AUDIO','audio.js'),('FEEL','feel.js'),('MODES','modes.js'),('PITCH','pitch.js'),('SIM','sim.js'),('CAREER','career.js')]:
    assert '/*@'+k+'*/' in game,k
    game=game.replace('/*@'+k+'*/',rd(f))
out=rd('head.html')+rd('body.html')
out+='<script>'+rd('vendor','three.js')+'</script>\n'
out+='<script>'+rd('assets','boss.js')+'\nwindow.MCLIPS='+json.dumps(mc,separators=(',',':'))+';</script>\n'
out+='<script>'+game+'</script>\n</body>\n</html>\n'
open(os.path.join(R,'index.html'),'w',encoding='utf-8').write(out)
print('index.html',round(len(out)/1e6,2),'MB')
