const CACHE_NAME = "beast-player-v11";

const BASE = self.location.pathname.replace("service-worker.js", "");

const APP_SHELL = [
  BASE,
  BASE + "index.html",
  BASE + "Beast_Convertor.html",
  BASE + "manifest.json",
  BASE + "icon-192.png",
  BASE + "icon-512.png",
  BASE + "lucide.min.js",
  BASE + "jsmediatags.min.js",
  BASE + "browser-id3-writer.min.js"
];


// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});


// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});


// FETCH
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  // Handle page navigation (important for PWA)
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || caches.match(BASE + "index.html");
      })
    );
    return;
  }

  // Cache-first strategy for other assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
