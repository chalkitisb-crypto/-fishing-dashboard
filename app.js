/* Fishing Dashboard v18.0 — full approved widgets */
(function () {
  "use strict";

  var weatherHours = [
    { t: "08:00", sky: "wx_08.jpg", lab: "Ηλιοφάνεια", temp: 22 },
    { t: "09:00", sky: "wx_09.jpg", lab: "Αραιή συννεφιά", temp: 23 },
    { t: "10:00", sky: "wx_10.jpg", lab: "Αραιή συννεφιά", temp: 24 },
    { t: "11:00", sky: "wx_11.jpg", lab: "Αραιή συννεφιά", temp: 25 },
    { t: "12:00", sky: "wx_12.jpg", lab: "Συννεφιά", temp: 25 },
    { t: "13:00", sky: "wx_13.jpg", lab: "Συννεφιά", temp: 26 },
    { t: "14:00", sky: "wx_14.jpg", lab: "Αραιή συννεφιά", temp: 26 }
  ];

  var windHours = [
    { t: "08:00", deg: -35, dir: "ΝΑ", bf: 2, km: 9, cls: "g" },
    { t: "09:00", deg: -35, dir: "ΝΑ", bf: 2, km: 11, cls: "g" },
    { t: "10:00", deg: -90, dir: "Α", bf: 3, km: 13, cls: "g" },
    { t: "11:00", deg: -90, dir: "Α", bf: 3, km: 15, cls: "g" },
    { t: "12:00", deg: -90, dir: "Α", bf: 3, km: 17, cls: "o" },
    { t: "13:00", deg: -45, dir: "ΑΝΑ", bf: 4, km: 21, cls: "o" },
    { t: "14:00", deg: 0, dir: "Β", bf: 4, km: 24, cls: "r" }
  ];

  var currentHours = [
    { t: "08:00", deg: -35, dir: "ΝΑ", kn: "0.3", cls: "g" },
    { t: "09:00", deg: -35, dir: "ΝΑ", kn: "0.4", cls: "g" },
    { t: "10:00", deg: -90, dir: "Α", kn: "0.4", cls: "g" },
    { t: "11:00", deg: -90, dir: "Α", kn: "0.5", cls: "g" },
    { t: "12:00", deg: -90, dir: "Α", kn: "0.6", cls: "g" },
    { t: "13:00", deg: -45, dir: "ΑΝΑ", kn: "0.6", cls: "o" },
    { t: "14:00", deg: -45, dir: "ΑΝΑ", kn: "0.7", cls: "r" }
  ];

  var pressurePts = [1016, 1018, 1015, 1020, 1017, 1022, 1019, 1018, 1021, 1019];
  var tidePts = [0.25, 0.45, 0.2, 0.75, 0.55, 0.3, 0.5];

  function $(id) { return document.getElementById(id); }

  function renderWeather() {
    var root = $("weather-hours");
    if (!root) return;
    root.innerHTML = weatherHours.map(function (h) {
      return '<article class="wh-cell"><img class="sky" src="' + h.sky + '" alt=""/><time>' + h.t +
        '</time><span class="lab">' + h.lab + '</span><strong>' + h.temp + '°C</strong></article>';
    }).join("");
  }

  function renderWind() {
    var root = $("wind-hours");
    if (!root) return;
    root.innerHTML = windHours.map(function (h) {
      return '<article class="w-cell"><time>' + h.t + '</time>' +
        '<svg class="arr ' + h.cls + '" style="--deg:' + h.deg + 'deg" viewBox="0 0 24 24"><path d="M12 2 L22 20 L12 16 L2 20 Z"/></svg>' +
        '<div class="dir">' + h.dir + '</div><strong>' + h.bf + '</strong><small>' + h.km + ' km/h</small></article>';
    }).join("");
  }

  function renderCurrents() {
    var root = $("current-hours");
    if (!root) return;
    root.innerHTML = currentHours.map(function (h) {
      return '<article class="c-cell"><time>' + h.t + '</time>' +
        '<svg class="arr ' + h.cls + '" style="--deg:' + h.deg + 'deg" viewBox="0 0 24 24"><path d="M12 2 L22 20 L12 16 L2 20 Z"/></svg>' +
        '<div class="dir">' + h.dir + '</div><strong>' + h.kn + ' kn</strong></article>';
    }).join("");
  }

  function drawPressure() {
    var line = $("pressure-line"), area = $("pressure-area");
    if (!line || !area) return;
    var w = 320, h = 90, pad = 8;
    var min = Math.min.apply(null, pressurePts) - 2;
    var max = Math.max.apply(null, pressurePts) + 2;
    var xs = pressurePts.map(function (_, i) { return pad + (i * (w - pad * 2)) / (pressurePts.length - 1); });
    var ys = pressurePts.map(function (v) { return pad + (1 - (v - min) / (max - min)) * (h - pad * 2); });
    line.setAttribute("points", xs.map(function (x, i) { return x.toFixed(1) + "," + ys[i].toFixed(1); }).join(" "));
    area.setAttribute("d", "M" + xs[0] + "," + h + " " + xs.map(function (x, i) {
      return "L" + x + "," + ys[i];
    }).join(" ") + " L" + xs[xs.length - 1] + "," + h + " Z");
  }

  function drawTide() {
    var line = $("tide-line"), area = $("tide-area");
    if (!line || !area) return;
    var w = 280, h = 72, pad = 6;
    var xs = tidePts.map(function (_, i) { return pad + (i * (w - pad * 2)) / (tidePts.length - 1); });
    var ys = tidePts.map(function (v) { return pad + (1 - v) * (h - pad * 2); });
    var d = "M" + xs[0] + "," + ys[0];
    for (var i = 1; i < xs.length; i++) {
      var cx = (xs[i - 1] + xs[i]) / 2;
      d += " C" + cx + "," + ys[i - 1] + " " + cx + "," + ys[i] + " " + xs[i] + "," + ys[i];
    }
    line.setAttribute("d", d);
    area.setAttribute("d", d + " L" + xs[xs.length - 1] + "," + h + " L" + xs[0] + "," + h + " Z");
  }

  function bindUI() {
    var refresh = $("btn-refresh");
    if (refresh) {
      refresh.addEventListener("click", function () {
        refresh.classList.add("spin");
        setTimeout(function () { refresh.classList.remove("spin"); }, 600);
      });
    }
    var fav = $("btn-fav");
    if (fav) {
      fav.addEventListener("click", function () {
        var on = fav.textContent === "★";
        fav.textContent = on ? "☆" : "★";
        fav.style.color = on ? "" : "var(--gold)";
        try { localStorage.setItem("fd-fav", on ? "0" : "1"); } catch (e) {}
      });
      try {
        if (localStorage.getItem("fd-fav") === "1") { fav.textContent = "★"; fav.style.color = "var(--gold)"; }
      } catch (e) {}
    }
    document.querySelectorAll(".tech").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tech").forEach(function (b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        try { localStorage.setItem("fd-tech", btn.dataset.tech); } catch (e) {}
      });
    });
    try {
      var saved = localStorage.getItem("fd-tech");
      if (saved) {
        document.querySelectorAll(".tech").forEach(function (b) {
          b.classList.toggle("selected", b.dataset.tech === saved);
        });
      }
    } catch (e) {}
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".nav-item").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
      });
    });
    document.querySelectorAll(".h-scroll").forEach(function (strip) {
      var startX = 0, scrollL = 0, dragging = false;
      strip.addEventListener("pointerdown", function (e) {
        dragging = true; startX = e.clientX; scrollL = strip.scrollLeft; strip.setPointerCapture(e.pointerId);
      });
      strip.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        strip.scrollLeft = scrollL - (e.clientX - startX);
      });
      strip.addEventListener("pointerup", function () { dragging = false; });
      strip.addEventListener("pointercancel", function () { dragging = false; });
    });
  }

  function init() {
    renderWeather();
    renderWind();
    renderCurrents();
    drawPressure();
    drawTide();
    bindUI();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(function () {});
  }
})();
