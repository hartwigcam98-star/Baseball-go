import asyncio,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/claude-0/t/p'
CH=sys.argv[2] if len(sys.argv)>2 else 'ch08'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('c:'+m.text) if m.type=='error' else None)
    await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
    await pg.goto('http://localhost:8765/index.html')
    await pg.click('#btnPractice');await pg.click(f'.pc[data-id="{CH}"]');await pg.click('#selGo')
    for i in range(100):
      ok=await pg.evaluate("()=>!!(window.__BG&&__BG.A&&__BG.G)")
      if ok:break
      await pg.wait_for_timeout(200)
    await pg.wait_for_timeout(1500)
    await pg.screenshot(path=OUT+'_0ready.png')
    # wait for wind-up
    for i in range(60):
      st=await pg.evaluate("()=>__BG.A.state")
      if st=='wind':break
      await pg.wait_for_timeout(50)
    await pg.wait_for_timeout(500);await pg.screenshot(path=OUT+'_1wind.png')
    for i in range(60):
      st=await pg.evaluate("()=>__BG.A.state")
      if st=='pitch':break
      await pg.wait_for_timeout(30)
    await pg.wait_for_timeout(120);await pg.screenshot(path=OUT+'_2pitch.png')
    await pg.wait_for_timeout(1500);await pg.screenshot(path=OUT+'_3after.png')
    print('errors',errs[:5])
    await b.close()
asyncio.run(main())
