import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':390,'height':844})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.route('**/fonts.googleapis.com/**',lambda r:r.abort())
    await pg.goto('http://localhost:8765/index.html?nocrowd')
    await pg.evaluate("localStorage.clear()");await pg.reload()
    await pg.click('#btnNew');await pg.click('.pc[data-id="ch06"]');await pg.click('#selGo')
    await pg.click('#positions .pc[data-id="SS"]');await pg.check('#twoWay');await pg.click('#createGo')
    log=[]
    for step in range(400):
      vis=await pg.evaluate("()=>['hub','season','decide','records','result'].find(id=>!document.getElementById(id).hidden)")
      if vis=='hub':
        # spend points
        await pg.evaluate("()=>{for(let i=0;i<30;i++){const b=[...document.querySelectorAll('#trainCard button[data-k]:not([disabled])')];if(!b.length)break;b[i%b.length].click()}}")
        if await pg.query_selector('#btnSim5'): await pg.click('#btnSim5')
        else: await pg.click('#btnSim')
      elif vis=='season':
        t=await pg.inner_text('#seasonText');log.append(('season',await pg.inner_text('#seasonTitle'),t[:160].replace('\n',' ')));await pg.click('#snGo')
      elif vis=='decide':
        t=await pg.inner_text('#decideBody');log.append(('decide',await pg.inner_text('#decideTitle'),t[:200].replace('\n',' ')))
        btn=await pg.query_selector('[data-a="col"][data-id="gulf"]') or await pg.query_selector('[data-a="col"]') if 'High' in str(log) and len([l for l in log if l[0]=='decide'])==1 else None
        btn=btn or await pg.query_selector('[data-a="sign"]') or await pg.query_selector('[data-a="fa"]') or await pg.query_selector('[data-a="col"]')
        await btn.click()
      else: log.append(('other',vis));break
      if len([l for l in log if l[0]=='season'])>=12:break
    for l in log:print(l)
    print(await pg.evaluate("()=>{const s=__BG.save;return {lv:s.level,age:s.age,st:s.st,career:s.career,awards:s.awards,money:s.money}}"))
    print('errors',errs[:5])
    await b.close()
asyncio.run(main())
