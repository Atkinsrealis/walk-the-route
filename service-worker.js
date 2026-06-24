const CACHE_NAME = "heathrow-perimeter-walk-v9";

const APP_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/heathrow-perimeter-route.geojson",
  "/route-surface-summary.json",
  "/heathrow-logo-white.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  /*
    IMPORTANT:
    Only handle requests from our own site.
    Let Mapbox and all external resources go straight to the network.
  */
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  /*
    For page navigation, try network first.
    If offline, fall back to cached index.html.
    This avoids Safari repeatedly serving a stale/broken page.
  */
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  /*
    For local app files, use cache first.
    If not cached, fetch and cache.
  */
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});