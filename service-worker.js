const CACHE_NAME = "beast-player-v15";

// Core files (App Shell)
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./lucide.min.js",
  "./jsmediatags.min.js"
];

// INSTALL – Cache all core files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ACTIVATE – Delete old caches
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

// FETCH – Powerful offline handling
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  // 1️⃣ Handle navigation (App open / refresh)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", clone));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 2️⃣ Cache First Strategy (for assets)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone); // Auto-cache new assets
        });
        return response;
      }).catch(() => {
        // Optional: return index.html if totally offline
        return caches.match("./index.html");
      });
    })
  );
});
