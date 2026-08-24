const CACHE_NAME = 'mobile-tally-shell-v9';
const BASE_PATH = new URL(self.registration.scope).pathname;
const APP_SHELL = new URL(BASE_PATH, self.location.origin).toString();
const SHELL = [
  APP_SHELL,
  new URL('manifest.webmanifest', self.registration.scope).toString(),
  new URL('mobile-tally-icon.svg', self.registration.scope).toString(),
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((match) => match || caches.match(APP_SHELL))));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '', self.registration.scope).toString();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => 'focus' in client);
    return existing ? existing.focus().then(() => existing.navigate(target)) : self.clients.openWindow(target);
  }));
});
