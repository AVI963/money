const C = 'money-v3';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'shop.js',
  'manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isAppAsset = url.origin === location.origin || url.href.includes('xlsx.full.min.js');
  if (!isAppAsset) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const netFetch = fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(C).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);

      return cached || netFetch;
    })
  );
});
