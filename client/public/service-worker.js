self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("nexora-v1").then((cache) =>
      cache.addAll([
        "/",
        "/index.html",
        "/manifest.json",
        "/logo.png"
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== "nexora-v1")
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  if (url.origin === self.location.origin && !url.pathname.startsWith("/api")) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((response) => {
          const copy = response.clone();
          caches.open("nexora-v1").then((cache) => cache.put(request, copy));
          return response;
        })
      )
    );
  }
});
