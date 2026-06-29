const CACHE_NAME = "braille-v3";
const ARCHIVOS = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/braille-data.js",
  "/traducciones.js",
  "/manifest.json",
  "/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("fonts.googleapis.com") || event.request.url.includes("fonts.gstatic.com")) return;

  event.respondWith(
    caches.match(event.request).then((c) => {
      if (c) return c;
      return fetch(event.request)
        .then((r) => {
          if (!r || r.status !== 200 || r.type !== "basic") return r;
          const clon = r.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clon));
          return r;
        })
        .catch(() => new Response("Sin conexión", { status: 503, statusText: "Offline" }));
    })
  );
});