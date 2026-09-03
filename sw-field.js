/* McKimm Field — Service Worker
   Offline-first caching for the single-file app. */
const CACHE = "mckimm-field-v7";
const APP_SHELL = [
  "./",
  "./McKimm-Field.html",
  "./manifest-field.json",
  "./icon-192.png",
  "./icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL).catch(err => {
      // Best-effort: cache what we can, ignore CDN failures
      console.warn("Some cache adds failed:", err);
    }))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Network-first for HTML so updates flow through
  // Network-first for HTML and the app's own JS (it changes during active development);
  // cache-first stays for CDN libs, icons, manifest.
  if (req.destination === "document" || req.url.endsWith(".html") || (req.url.endsWith(".js") || req.url.endsWith(".json")) && req.url.startsWith(self.location.origin)) {
    e.respondWith(
      // no-store: bypass the browser's own HTTP cache too, not just this
      // service worker's Cache Storage \u2014 otherwise a "network-first"
      // fetch can still resolve from a stale disk-cached response.
      fetch(req, { cache: "no-store" }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
