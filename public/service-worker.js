/* Capitol PWA — network-first service worker
   Həmişə ən yeni versiyanı çəkir (güncəl qalır); yalnız internet olmayanda keşdən göstərir.
   Bu, "köhnə versiya ilişmə" probleminin qarşısını alır. */
const CACHE = "capitol-v1";
const APP_SHELL = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(APP_SHELL))
      .catch(() => {})
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        if (new URL(req.url).origin === self.location.origin) {
          caches
            .open(CACHE)
            .then((c) => c.put(req, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((r) => r || caches.match("/index.html"))
      )
  );
});
