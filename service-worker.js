const CACHE_NAME = "fishing-dashboard-v0.1";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];


// Εγκατάσταση Service Worker

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })

    );

});



// Άνοιγμα εφαρμογής

self.addEventListener("fetch", event => {

    event.respondWith(

        caches.match(event.request)
        .then(response => {

            return response || fetch(event.request);

        })

    );

});



// Καθαρισμός παλιών εκδόσεων

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
        .then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }

                })

            );

        })

    );

});
