const CACHE_NAME = "beast-player-v16";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./lucide.min.js",
  "./jsmediatags.min.js"
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
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Handle share_target POST — user shared audio files to Beast Player
  if (event.request.method === "POST" && url.pathname.endsWith("index.html")) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const files = formData.getAll("audio");
        const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        const client = allClients[0];
        if (client && files.length) {
          const fileData = await Promise.all(
            files.filter(f => f instanceof File).map(async f => ({
              name: f.name,
              type: f.type,
              buffer: await f.arrayBuffer()
            }))
          );
          client.postMessage({ type: "SHARED_AUDIO_FILES", files: fileData });
        }
      } catch(e) {}
      return Response.redirect("./index.html", 303);
    })());
    return;
  }

  if (event.request.method !== "GET") return;

  // Navigation: network-first
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put("./index.html", clone));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});

// Keepalive ping from the app while audio plays
self.addEventListener("message", event => {
  if (event.data && event.data.type === "KEEPALIVE") {
    if (event.ports[0]) event.ports[0].postMessage({ alive: true });
  }
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
