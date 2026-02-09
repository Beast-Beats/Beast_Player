const CACHE_NAME = "beast-player-v6"; // bump version

const APP_SHELL = [
  "/Beast_Player/",
  "/Beast_Player/index.html",
  "/Beast_Player/manifest.json",

  // icons
  "/Beast_Player/icon-192.png",
  "/Beast_Player/icon-512.png",

  // local scripts
  "/Beast_Player/lucide.min.js",

  // styles (add if you have them)

];


// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});


// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});


// FETCH
self.addEventListener("fetch", event => {

  // SPA navigation → always index.html
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("/Beast_Player/index.html")
    );
    return;
  }

  // cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).then(res => {
          // save new files dynamically
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resClone);
          });
          return res;
        }).catch(() => cached)
      );
    })
  );
});
