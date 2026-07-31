console.log("🎣 Fishing Dashboard v0.1 loaded");


// Έλεγχος αν υποστηρίζεται PWA
if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
        .register("service-worker.js")
        .then(() => {
            console.log("✅ Service Worker ενεργός");
        })
        .catch((error) => {
            console.log("❌ Service Worker error:", error);
        });

    });

}


// Fishing Score βάση δεδομένων
const fishingData = {

    location: "Κάλυμνος",

    score: 87,

    techniques: [
        "LRF",
        "Spinning",
        "Shore Jigging",
        "Εγγλέζικο"
    ],

    alerts: [
        "Χαμηλός άνεμος",
        "Σταθερή πίεση",
        "Καλή δραστηριότητα"
    ]

};


console.log(fishingData);
