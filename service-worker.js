const CACHE_NAME = "beast-player-v16-ultra";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./lucide.min.js",
  "./jsmediatags.min.js"
];

// Temporary store for files shared to the app before the page is ready
let pendingSharedFiles = [];

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

  // ── Handle share_target POST ──
  // User shared audio files → Beast Player from share sheet
  if (event.request.method === "POST" && url.pathname.endsWith("index.html")) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const files = formData.getAll("audio");

        if (files.length) {
          // Read files into ArrayBuffers and store temporarily in SW memory
          const fileData = await Promise.all(
            files.filter(f => f instanceof File).map(async f => ({
              name: f.name,
              type: f.type || "audio/mpeg",
              buffer: await f.arrayBuffer()
            }))
          );
          pendingSharedFiles = fileData;

          // Also try to send directly to any open clients right now
          const allClients = await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true
          });
          allClients.forEach(client => {
            client.postMessage({ type: "SHARED_AUDIO_FILES", files: fileData });
          });
        }
      } catch(e) {}

      // Redirect to app — page will then call GET_SHARED_FILES to pick up files
      return Response.redirect("./index.html", 303);
    })());
    return;
  }

  if (event.request.method !== "GET") return;

  // Navigation: network-first so updates reach user
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

// ── Messages from the app page ──
self.addEventListener("message", event => {
  const type = event.data?.type;

  // Page asking "do you have any pending shared files for me?"
  if (type === "GET_SHARED_FILES") {
    const files = pendingSharedFiles;
    pendingSharedFiles = []; // clear after delivery
    if (event.ports[0]) {
      event.ports[0].postMessage({ files });
    }
    return;
  }

  // Keepalive ping — respond to keep the SW process alive
  if (type === "KEEPALIVE") {
    if (event.ports[0]) event.ports[0].postMessage({ alive: true });
    return;
  }

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
