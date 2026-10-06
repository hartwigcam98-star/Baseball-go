# pose inspector: python3 tools/tests/tpose.py <who:batter|pitcher> <swing> <u,u,..> "<cam views ; separated: x,y,z,lx,ly,lz>" out [char]
import asyncio,sys
from playwright.async_api import async_playwright
from PIL import Image
WHO,SW=sys.argv[1],sys.argv[2];US=[float(x) for x in sys.argv[3].split(',')];VIEWS=sys.argv[4].split(';');OUT=sys.argv[5];CH=sys.argv[6] if len(sys.argv)>6 else 'ch08'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':300,'height':420})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
    await pg.goto('http://localhost:8765/index.html?nocrowd')
    await pg.click('#btnPractice');await pg.click(f'.pc[data-id="{CH}"]');await pg.click('#selGo')
    for i in range(100):
      if await pg.evaluate("()=>!!(window.__BG&&__BG.A&&__BG.G)"):break
      await pg.wait_for_timeout(200)
    await pg.wait_for_timeout(800)
    await pg.evaluate("()=>{document.querySelectorAll('.hud').forEach(h=>h.style.display='none');__BG.W3.pci.visible=false;__BG.W3.zone.visible=false;window.__FREEZE=1}")
    tiles=[]
    for v in VIEWS:
      cam=[float(x) for x in v.split(',')]
      for u in US:
        await pg.evaluate(f"""()=>{{window.__CAM={cam};const G=__BG.G,P=G.{WHO},S=__BG.SWINGS['{SW}'];
          window.__POSEFN=()=>{{P.pose=null;P.post=null;P.swing={{type:'{SW}',t:{u}*S.dur,off:null,spd:0,hold:true}};}};
          for(let i=0;i<30;i++){{window.__POSEFN();P.update(0.05,0,0)}} }}""")
        await pg.wait_for_timeout(250)
        f=f'{OUT}_{len(tiles)}.png';await pg.screenshot(path=f);tiles.append(f)
    print('errors',errs[:3])
    await b.close()
  ims=[Image.open(t) for t in tiles];w,h=ims[0].size;cols=len(US);rows=len(VIEWS)
  o=Image.new('RGB',(w*cols,h*rows))
  for i,im in enumerate(ims):o.paste(im,((i%cols)*w,(i//cols)*h))
  o.save(OUT+'.png')
asyncio.run(main())
