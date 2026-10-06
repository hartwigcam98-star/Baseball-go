/* Baseball Go service worker: the game works offline once it has been played online.
   The page itself is network-first so updates arrive straight away; player characters are cached the first time they load. */
const CACHE='baseball-go-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./manifest.webmanifest','./icons/icon-192.png','./icons/apple-touch-icon.png'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(r.mode==='navigate'||u.pathname.endsWith('/baseball-go/')||u.pathname.endsWith('/index.html')){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put('./',cp));return res}).catch(()=>caches.match('./',{ignoreSearch:true})));return}
  if(u.pathname.includes('/chars/')&&u.pathname.endsWith('.js')||u.host.includes('fonts.g')){
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})));return}
  if(u.origin===location.origin)e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r)));
});
