// Caches the app, TF.js library and model so it works offline after the first visit.
const CACHE = "crop-detector-v1";
const TFJS = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js";
const FILES = [
  "./", "index.html", "manifest.json", "icon.svg",
  "model/model.json",
  "model/group1-shard1of3.bin",
  "model/group1-shard2of3.bin",
  "model/group1-shard3of3.bin"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(FILES);
    try { await c.add(new Request(TFJS, { mode: "cors" })); } catch (err) { /* retried on first fetch */ }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res && (res.ok || res.type === "opaque")) {
        const c = await caches.open(CACHE); c.put(e.request, res.clone());
      }
      return res;
    } catch (err) {
      return caches.match("index.html");
    }
  })());
});
