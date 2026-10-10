// Bump CACHE_NAME on every release so old app shells are dropped.
const CACHE_NAME = 'fieldready-v1.1.0';
const STATIC_ASSETS = [
  '/manifest.json',
  '/assets/icon.svg',
  '/assets/demo_images/healthy.jpg',
  '/assets/demo_images/common_rust.jpg',
  '/assets/demo_images/northern_leaf_blight.jpg',
  '/assets/demo_images/gray_leaf_spot.jpg',
  '/assets/demo_images/banana_healthy.jpg',
  '/assets/demo_images/banana_black_sigatoka.jpg',
  '/assets/demo_images/banana_bacterial_wilt.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // add one by one so a single missing file does not abort the whole install
      Promise.all(STATIC_ASSETS.map((url) => cache.add(url).catch((err) => console.warn('[SW] skip', url, err))))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.url.includes('/api/')) {
    return; // API calls always go straight to the network
  }

  // App code (HTML / JS / CSS): NETWORK FIRST so new releases and translation fixes show up immediately;
  // fall back to the cache only when offline.
  const isAppShell =
    req.mode === 'navigate' || ['document', 'script', 'style'].includes(req.destination);

  if (isAppShell) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return resp;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/index.html') || caches.match('/')))
    );
    return;
  }

  // Images / icons / demo assets: cache first
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return resp;
      });
    })
  );
});
