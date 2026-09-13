const CACHE_NAME = "rezell-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./account.html",
  "./checkout.html",
  "./login.html",
  "./product.html",
  "./wishlist.html",
  "./style.css",
  "./products.js",
  "./script.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/pwa-192.png",
  "./icons/pwa-512.png",
  "./photos/cube.jpg.jpeg",
  "./photos/tape.jpg.jpeg",
  "./photos/phone stand.jpg.jpeg",
  "./photos/HeadphonesCarryingCase.jpg.jpeg",
  "./photos/silicon phone holder.jpg.jpeg",
  "./photos/mobile charging wall holder.jpg.jpeg",
  "./photos/bookmark.svg",
  "./photos/coaster.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (new URL(event.request.url).origin === self.location.origin) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});