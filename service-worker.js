const CACHE_NAME = "beast-player-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
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
  // App launch / navigation
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html")
    );
    return;
  }

  // Other assets
  event.respondWith(
    caches.match(event.request).then(
      res => res || fetch(event.request)
    )
  );
});