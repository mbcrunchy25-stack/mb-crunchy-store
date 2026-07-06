/* MB Crunchy — Service Worker
   Caches the app shell (HTML/CSS/JS) so the storefront still opens offline.
   Product data itself still needs network to sync live from the Sheet;
   offline visitors will see the last-cached product list. */

const CACHE_NAME = "mb-crunchy-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/products-data.js",
  "./js/api.js",
  "./js/app.js",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // never cache POSTs (orders etc.)

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.ok && req.url.startsWith(self.location.origin)) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
