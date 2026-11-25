const C = 'money-v5';
const LOCAL_ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'shop.js',
  'xlsx-worker.js',
  'manifest.json',
  'icon-192.png'
];
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(C).then(async c => {
      await c.addAll(LOCAL_ASSETS);
      try {
        await c.add(XLSX_URL);
      } catch {}
    })
  );
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
  const isSameOrigin = url.origin === location.origin;
  const isAppAsset = isSameOrigin || url.href === XLSX_URL;
  if (!isAppAsset) return;

  e.respondWith(
    caches.match(e.request, { ignoreSearch: isSameOrigin }).then(cached => {
      const netFetch = fetch(e.request).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const clone = res.clone();
          caches.open(C).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);

      return cached || netFetch;
    })
  );
});
Creating files for the financial application interface
