const CACHE_PREFIX = 'mobile-tally-shell-';
const CACHE_NAME = 'mobile-tally-shell-v26';
const BUILD_ASSET_PATHS = ["assets/html2canvas.esm-QH1iLAAe.js","assets/index-CKdMGYWY.css","assets/index-DXjlOHpf.js","assets/index.es-D5YMiYMM.js","assets/pdf-C1gUo6dv.js","assets/pdf.worker.min-CHFwMXne.mjs","assets/purify.es-CAi2OJFm.js","assets/xlsx-BGhuli8m.js"];
const BASE_PATH = new URL(self.registration.scope).pathname;
const APP_SHELL = new URL(BASE_PATH, self.location.origin).toString();
const SHELL = [
  APP_SHELL,
  new URL('manifest.webmanifest', self.registration.scope).toString(),
  new URL('mobile-tally-icon.svg', self.registration.scope).toString(),
  ...BUILD_ASSET_PATHS.map((asset) => new URL(asset, self.registration.scope).toString()),
];

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)),
    self.skipWaiting(),
  ]));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(APP_SHELL)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then(async (response) => {
    if (response.ok && response.status === 200 && new URL(event.request.url).origin === self.location.origin) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    return response;
  })));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '', self.registration.scope).toString();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => 'focus' in client);
    return existing ? existing.focus().then(() => existing.navigate(target)) : self.clients.openWindow(target);
  }));
});
