const C = 'money-v26';
const CORE_ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'shop.js',
  'manifest.json'
];
const OPTIONAL_ASSETS = [
  'icon-192.png',
  'xlsx-worker.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(C).then(async c => {
      await Promise.allSettled(CORE_ASSETS.map(u => c.add(u)));
      await Promise.allSettled(OPTIONAL_ASSETS.map(u => c.add(u)));
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

  if (isSameOrigin) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(C).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(err => caches.match(e.request, { ignoreSearch: true }).then(m => {
        if (m) return m;
        throw err;
      }))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const netFetch = fetch(e.request).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const clone = res.clone();
          caches.open(C).then(c => c.put(e.request, clone));
        }
        return res;
      });
      if (cached) {
        netFetch.catch(() => {});
        return cached;
      }
      return netFetch;
    })
  );
});
