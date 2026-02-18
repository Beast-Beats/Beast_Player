const CACHE_NAME = "beast-player-v14";

// Core app files to cache
const APP_SHELL = [
  "index.html",
  "Beast_Convertor.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "lucide.min.js",
  "jsmediatags.min.js",
  "browser-id3-writer.min.js"
];

// Install event – cache all app shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate event – clean old caches
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

// Fetch event – serve cached files
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // Navigation fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request)
        .then(res => res || caches.match("index.html"))
    );
    return;
  }

  // Serve cached files first, then network
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
