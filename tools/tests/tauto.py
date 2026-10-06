# auto-hitter: practice mode, perfect swings; screenshots of the ball in play; reports results
import asyncio,sys
from playwright.async_api import async_playwright
OUT=sys.argv[1];N=int(sys.argv[2]) if len(sys.argv)>2 else 3;Q=sys.argv[3] if len(sys.argv)>3 else '?nocrowd'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
    await pg.goto('http://localhost:8765/index.html'+Q)
    await pg.click('#btnPractice');await pg.click('.pc[data-id="ch08"]');await pg.click('#selGo')
    for i in range(100):
      if await pg.evaluate("()=>!!(window.__BG&&__BG.A&&__BG.G)"):break
      await pg.wait_for_timeout(200)
    await pg.evaluate("""()=>{window.__res=[];const tick=()=>{requestAnimationFrame(tick);const A=__BG.A;if(!A)return;
      if(A.state==='pitch'&&!A.swing&&!A._auto){A._auto=1;const p=A.pitch;const t=p.Tf;const x=p.R.x+p.v0.x*t+0.5*p.a.x*t*t,y=p.R.y+p.v0.y*t+0.5*p.a.y*t*t;A.pci.x=x+0.01;A.pci.y=y-0.03;
        const when=A.tCon-0.192*1000-15;const f=()=>{if(performance.now&&__BG.A===A){}};A._when=when}
      if(A._when&&!A.swing&&window.__GT()>=A._when){__BG.swingAt(A._when)}
      if(A.state==='done'&&!A._logged){A._logged=1;window.__res.push([A.res&&A.res.code,A.contact&&Math.round(A.contact.ev),A.contact&&Math.round(A.contact.la),A.contact&&A.contact.kind])}};tick()}""")
    shots=0
    for k in range(400):
      st=await pg.evaluate("()=>__BG.A&&__BG.A.state")
      if st=='play' and shots<N*3:
        await pg.wait_for_timeout(300);await pg.screenshot(path=f'{OUT}_{shots}.png');shots+=1
        await pg.wait_for_timeout(1200)
      else: await pg.wait_for_timeout(200)
      r=await pg.evaluate("()=>window.__res.length")
      if r>=N:break
    print(await pg.evaluate("()=>window.__res"))
    print('errors',errs[:5])
    await b.close()
asyncio.run(main())
