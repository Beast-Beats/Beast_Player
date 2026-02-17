const CACHE_NAME = "beast-player-v10";

const BASE = self.location.pathname.replace("service-worker.js", "");

const APP_SHELL = [
  BASE,
  BASE + "index.html",
  BASE + "manifest.json",
  BASE + "Beast_Convertor.html",
  BASE + "icon-192.png",
  BASE + "icon-512.png",
  BASE + "lucide.min.js",
  BASE + "jsmediatags.min.js",
  BASE + "browser-id3-writer.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  // ðŸ”¥ IMPORTANT: Handle page reload / app launch offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(BASE + "index.html")
    );
    return;
  }

  // Cache First Strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
