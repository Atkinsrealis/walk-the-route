const CACHE_NAME = "heathrow-perimeter-walk-v27";
const MAPBOX_CACHE_NAME = "heathrow-mapbox-v1";

const APP_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/heathrow-perimeter-route.geojson",
  "/route-surface-summary.json",
  "/assets/heathrow-logo-white.svg",
  "/Icons/icon-192.png",
  "/Icons/icon-512.png",
  "/Icons/icon-512-maskable.png"
];

const MAPBOX_ASSETS = [
  "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js",
  "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(APP_ASSETS);
      }),
      caches.open(MAPBOX_CACHE_NAME).then((cache) => {
        return cache.addAll(MAPBOX_ASSETS).catch(() => {
          // Mapbox CDN may not be available during install - that's okay
        });
      })
    ])
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
    Handle Mapbox CDN library files (JS/CSS) with network-first strategy.
    This ensures offline users still have the library code if previously loaded.
  */
  if (requestUrl.origin === "https://api.mapbox.com") {
    const isLibraryAsset = request.url.includes("mapbox-gl.js") || 
                          request.url.includes("mapbox-gl.css");
    
    if (isLibraryAsset) {
      event.respondWith(
        fetch(request)
          .then((networkResponse) => {
            return caches.open(MAPBOX_CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => caches.match(request))
      );
      return;
    }
    
    // For map tiles and other Mapbox API calls, let them go to network
    // (tiles can't be meaningfully cached without massive storage)
    return;
  }

  /*
    Only handle requests from our own site.
    Let other external resources go straight to the network.
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