const CACHE_NAME = "beast-player-v5";

const APP_SHELL = [
  "/Beast_Player/",
  "/Beast_Player/index.html",
  "/Beast_Player/manifest.json",
  "/Beast_Player/icon-192.png",
  "/Beast_Player/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  // APP NAVIGATION → ALWAYS SERVE INDEX.HTML
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("/Beast_Player/index.html")
    );
    return;
  }

  // STATIC FILES
  event.respondWith(
    caches.match(event.request).then(res => {
      return res || fetch(event.request).catch(() => null);
    })
  );
});