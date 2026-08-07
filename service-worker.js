const CACHE_NAME = "fishing-dashboard-v15.0.0";
const ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./manifest.json",
  "./moon_sphere.png", "./fish_left.png", "./fish_right.png", "./sun_scene.png",
  "./activity_tsipoura.jpg", "./score_gauge.jpg",
  "./icon_sun.png", "./icon_partly.png", "./icon_cloud.png",
  "./tech_card_spinning.png", "./tech_card_lrf.png", "./tech_card_english.png", "./tech_card_shore_jig.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ||
      fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
        return r;
      }).catch(() => cached)
    )
  );
});
