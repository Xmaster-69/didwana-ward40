const CACHE = 'ward40-voter-v10';
const CORE_FILES = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/voters-en.js',
  './js/voters.js',
  './js/app.js',
  './data/voters.json'
];
const STATIC_FILES = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([...CORE_FILES, ...STATIC_FILES]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  // Notify all clients to reload
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({type: 'SW_UPDATED'}));
  });
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle same-origin GET requests
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // HTML pages: network only (never cache HTML — always fresh)
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname === '') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Core files (JS/CSS/data): stale-while-revalidate
  if (CORE_FILES.some(p => url.pathname.endsWith(p.replace('./', '')))) {
    e.respondWith(
      caches.open(CACHE).then(cache => {
        return cache.match(e.request).then(cached => {
          const fetched = fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fetched;
        });
      })
    );
    return;
  }

  // Static assets: cache first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
