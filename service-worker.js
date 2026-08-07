const CACHE_NAME = "fishing-dashboard-v18.2.0";
const ASSETS = [
  "./","./index.html","./style.css","./app.js","./manifest.json",
  "./fish_left.png","./fish_right.png","./sun_scene.png","./moon_sphere.png",
  "./score_gauge.jpg","./activity_tsipoura.jpg","./activity_clean.jpg",
  "./wx_08.jpg","./wx_09.jpg","./wx_10.jpg","./wx_11.jpg","./wx_12.jpg","./wx_13.jpg","./wx_14.jpg",
  "./tech_card_spinning.png","./tech_card_lrf.png","./tech_card_english.png","./tech_card_shore_jig.png"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request).then((r) => {
    const copy = r.clone();
    caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
    return r;
  }).catch(() => cached)));
});
