const CACHE = 'ward40-voter-v8';
const NETWORK_FIRST = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/voters.js',
  './js/app.js',
  './data/voters.json'
];
const CACHE_FIRST = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './eci-voter-guide.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([...NETWORK_FIRST, ...CACHE_FIRST]))
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
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Audio: network first, cache fallback
  if (url.pathname.includes('/audio/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // HTML/JS/CSS/data: network first, cache fallback (ensures updates reach users)
  if (NETWORK_FIRST.some(p => url.pathname.endsWith(p.replace('./', '')) || url.pathname === p || url.pathname.endsWith('/'))) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
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
