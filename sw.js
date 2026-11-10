// Production Tracker: lets the app open with no internet.
// Change VERSION whenever you upload a new index.html so the iPad picks it up.
const VERSION = "pt-1.18";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Try the internet first (so updates arrive), fall back to the saved copy when offline.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    // always ask GitHub for the newest copy (no 10-minute stale copy); saved copy only when offline
    fetch(new Request(e.request.url, {cache: "no-cache", credentials: "same-origin"})).then(r => {
      if (!r.ok) return r;
      const copy = r.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("index.html")))
  );
});
