import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
    await pg.goto('http://localhost:8765/index.html?nocrowd')
    await pg.click('#btnQuick');await pg.click('.pc[data-id="ch12"]');await pg.select_option('#qmLevel','hs');await pg.click('#selGo')
    await pg.evaluate("""()=>{window.__res=[];const tick=()=>{requestAnimationFrame(tick);const A=__BG.A;if(!A)return;
      if(A.state==='pitch'&&!A.swing&&!A._auto){A._auto=1;const p=A.pitch;const t=p.Tf;const x=p.R.x+p.v0.x*t+0.5*p.a.x*t*t,y=p.R.y+p.v0.y*t+0.5*p.a.y*t*t;
        if(Math.abs(x)<0.3&&y>0.4&&y<1.1){A.pci.x=x+(Math.random()-0.5)*0.1;A.pci.y=y+(Math.random()-0.5)*0.1;A._when=A.tCon-192+(Math.random()-0.5)*60}}
      if(A._when&&!A.swing&&window.__GT()>=A._when){__BG.swingAt(A._when)}
      if(A.state==='done'&&!A._logged){A._logged=1;window.__res.push(A.res&&A.res.code)}};tick()}""")
    shots=0
    for k in range(900):
      if not await pg.is_hidden('#between'):
        n=await pg.evaluate("()=>__res.length")
        if shots<2: await pg.screenshot(path=f'/tmp/claude-0/t/btw_{shots}.png');shots+=1
        if n>=2: await pg.click('#btwSim')
        else: await pg.click('#btwGo')
      if not await pg.is_hidden('#result'):break
      await pg.wait_for_timeout(300)
    print(await pg.evaluate("()=>__res"))
    await pg.screenshot(path='/tmp/claude-0/t/res.png',full_page=True)
    print('errors',errs[:5])
    await b.close()
asyncio.run(main())
