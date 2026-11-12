/* Offline-Betrieb: online immer die aktuelle Version laden und merken, offline aus dem Speicher bedienen. */
const CACHE = 'loetfrei-v1';
const FILES = ['./', 'index.html', 'css/style.css', 'js/sim.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const fromCache = () => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
  const fromNet = fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  });
  /* Bei sehr langsamem Netz nach 3 s auf den Speicher ausweichen */
  const slow = new Promise(res => setTimeout(res, 3000)).then(fromCache);
  e.respondWith(Promise.race([fromNet.catch(() => undefined), slow]).then(r => r || fromCache()).then(r => r || fromNet));
});
