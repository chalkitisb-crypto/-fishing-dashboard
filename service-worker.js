/* Fishing Dashboard SW v34 */
var CACHE = "fd-v34";
var ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data.js",
  "./manifest.json",
  "./score_clean.png",
  "./activity_body.jpg",
  "./zone_map.png",
  "./sun_scene.png",
  "./moon_sphere.png",
  "./fish_left.png",
  "./fish_right.png",
  "./ico_wx_sun.png",
  "./ico_wx_partly.png",
  "./ico_wx_haze.png",
  "./ico_wx_cloud.png",
  "./ico_wx_rain.png",
  "./ico_wx_storm.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = e.request.url;
  // network-first for API
  if (url.indexOf("open-meteo.com") >= 0 || url.indexOf("marine-api") >= 0) {
    e.respondWith(
      fetch(e.request).then(function (r) {
        return r;
      }).catch(function () {
        return caches.match(e.request);
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request).then(function (r) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return r;
      }).catch(function () {
        return cached || new Response("Offline", { status: 503 });
      });
    })
  );
});
