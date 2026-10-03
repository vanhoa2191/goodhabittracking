const CACHE_PREFIX = 'kidhabit-public-';
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const PUBLIC_CACHE_URLS = [
  '/offline.html',
  '/offline.js',
  '/favicon.svg',
  '/logo.svg',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/icon-maskable-512.png',
  '/pwa/apple-touch-icon.png',
];

function isSensitiveRequest(request, url) {
  return request.method !== 'GET'
    || url.origin !== self.location.origin
    || url.pathname.startsWith('/api/')
    || url.pathname.startsWith('/admin')
    || url.pathname.startsWith('/invite/')
    || url.pathname.startsWith('/auth')
    || url.pathname.startsWith('/pricing')
    || url.pathname.startsWith('/privacy')
    || url.pathname.startsWith('/terms');
}

function isCacheablePublicRequest(request, url) {
  if (PUBLIC_CACHE_URLS.includes(url.pathname)) return true;
  if (!url.pathname.startsWith('/_next/static/')) return false;
  return request.destination === 'style'
    || request.destination === 'script'
    || request.destination === 'font';
}

// The host may answer /offline.html with a redirect to /offline. A response that came through a redirect cannot
// answer a page navigation, so the offline page is kept as a plain copy of what the redirect led to.
async function cachePublicUrl(cache, path) {
  const response = await fetch(path, { cache: 'reload' });
  if (!response.ok) throw new Error(`Could not cache ${path}: ${response.status}`);
  const stored = response.redirected
    ? new Response(await response.blob(), { status: 200, headers: response.headers })
    : response;
  await cache.put(path, stored);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.all(PUBLIC_CACHE_URLS.map((path) => cachePublicUrl(cache, path)))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_PUBLIC_CACHE') {
    event.waitUntil(caches.delete(CACHE_NAME));
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (isSensitiveRequest(request, url)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
    return;
  }
  if (!isCacheablePublicRequest(request, url)) return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
      }
      return response;
    })),
  );
});
