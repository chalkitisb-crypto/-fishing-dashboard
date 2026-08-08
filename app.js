/* Fishing Dashboard v21.1.0 */
(function () {
  "use strict";

  /* Premium circular SVG icons matching locked design */
  var ICO = {
    sun: '<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="6" fill="#ffd24a"/><g stroke="#ffd24a" stroke-width="2" stroke-linecap="round"><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.5 6.5l2.8 2.8M22.7 22.7l2.8 2.8M6.5 25.5l2.8-2.8M22.7 9.3l2.8-2.8"/></g></svg>',
    partly: '<svg viewBox="0 0 32 32" fill="none"><circle cx="11" cy="12" r="5" fill="#ffd24a"/><path d="M10 22h14a5 5 0 0 0 0-10 6.5 6.5 0 0 0-12.2 2.2A4.5 4.5 0 0 0 10 22z" fill="#c5d4e8"/></svg>',
    cloud: '<svg viewBox="0 0 32 32" fill="none"><path d="M9 23h15a5.5 5.5 0 0 0 0-11 7 7 0 0 0-13.5 2.5A5 5 0 0 0 9 23z" fill="#9eb6d4"/></svg>',
    rain: '<svg viewBox="0 0 32 32" fill="none"><path d="M9 18h15a5.5 5.5 0 0 0 0-11 7 7 0 0 0-13.5 2.5A5 5 0 0 0 9 18z" fill="#8aa4bc"/><g stroke="#5ad0ff" stroke-width="1.6" stroke-linecap="round"><path d="M12 21v4M16 20v5M20 21v4"/></g></svg>',
    storm: '<svg viewBox="0 0 32 32" fill="none"><path d="M9 17h15a5.5 5.5 0 0 0 0-11 7 7 0 0 0-13.5 2.5A5 5 0 0 0 9 17z" fill="#6a7f9a"/><path d="M17 18l-3 5h3l-2 5 6-7h-3l2-3z" fill="#ffd24a"/></svg>'
  };

  var weatherHours = [
    { t: "08:00", ico: "sun", lab: "Αίθριος", temp: 22 },
    { t: "09:00", ico: "partly", lab: "Αραιή", temp: 23 },
    { t: "10:00", ico: "sun", lab: "Ήπιος", temp: 24 },
    { t: "11:00", ico: "cloud", lab: "Συννεφιά", temp: 25 },
    { t: "12:00", ico: "rain", lab: "Βροχή", temp: 26 },
    { t: "13:00", ico: "storm", lab: "Καταιγίδα", temp: 25 },
    { t: "14:00", ico: "partly", lab: "Αραιή", temp: 24 }
  ];

  var windHours = [
    { t: "08:00", deg: -35, dir: "ΝΑ", bf: 2, cls: "g" },
    { t: "09:00", deg: -35, dir: "ΝΑ", bf: 2, cls: "g" },
    { t: "10:00", deg: -90, dir: "Α", bf: 3, cls: "g" },
    { t: "11:00", deg: -90, dir: "Α", bf: 3, cls: "g" },
    { t: "12:00", deg: -90, dir: "Α", bf: 3, cls: "o" },
    { t: "13:00", deg: -45, dir: "ΑΝΑ", bf: 4, cls: "o" },
    { t: "14:00", deg: 0, dir: "Β", bf: 4, cls: "r" }
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

  var pressurePts = [1019, 1019, 1019, 1019, 1019, 1019, 1019];
  var tidePts = [0.15, 0.35, 0.75, 1.0, 0.7, 0.35, 0.2];

  function $(id) { return document.getElementById(id); }

  function renderWeather() {
    var root = $("weather-hours");
    if (!root) return;
    root.innerHTML = weatherHours.map(function (h) {
      return '<article class="wh-cell"><div class="wh-ico">' + (ICO[h.ico] || ICO.sun) +
        '</div><time>' + h.t + '</time><span class="lab">' + h.lab +
        '</span><strong>' + h.temp + '°C</strong></article>';
    }).join("");
  }

  function renderWind() {
    var root = $("wind-hours");
    if (!root) return;
    root.innerHTML = windHours.map(function (h) {
      return '<article class="w-cell"><time>' + h.t + '</time>' +
        '<svg class="arr ' + h.cls + '" style="--deg:' + h.deg + 'deg" viewBox="0 0 24 24"><path d="M12 2 L22 20 L12 16 L2 20 Z"/></svg>' +
        '<div class="dir">' + h.dir + '</div><strong>' + h.bf + '</strong></article>';
    }).join("");
  }

  function renderCurrents() {
    var root = $("current-hours");
    if (!root) return;
    root.innerHTML = currentHours.map(function (h) {
      return '<article class="w-cell"><time>' + h.t + '</time>' +
        '<svg class="arr ' + h.cls + '" style="--deg:' + h.deg + 'deg" viewBox="0 0 24 24"><path d="M12 2 L22 20 L12 16 L2 20 Z"/></svg>' +
        '<div class="dir">' + h.dir + '</div><strong>' + h.kn + ' kn</strong></article>';
    }).join("");
  }

  function drawPressure() {
    var line = $("pressure-line"), core = $("pressure-line-core"), area = $("pressure-area");
    if (!line || !area) return;
    var w = 320, h = 88, pad = 12;
    var min = Math.min.apply(null, pressurePts) - 3;
    var max = Math.max.apply(null, pressurePts) + 3;
    if (max === min) { min -= 2; max += 2; }
    var xs = pressurePts.map(function (_, i) { return pad + (i * (w - pad * 2)) / (pressurePts.length - 1); });
    var ys = pressurePts.map(function (v) { return pad + (1 - (v - min) / (max - min)) * (h - pad * 2); });
    var pts = xs.map(function (x, i) { return x.toFixed(1) + "," + ys[i].toFixed(1); }).join(" ");
    line.setAttribute("points", pts);
    if (core) core.setAttribute("points", pts);
    area.setAttribute("d", "M" + xs[0] + "," + h + " " + xs.map(function (x, i) {
      return "L" + x + "," + ys[i];
    }).join(" ") + " L" + xs[xs.length - 1] + "," + h + " Z");
  }

  function drawTide() {
    var line = $("tide-line"), area = $("tide-area");
    if (!line || !area) return;
    var w = 280, h = 78, pad = 8;
    var xs = tidePts.map(function (_, i) { return pad + (i * (w - pad * 2)) / (tidePts.length - 1); });
    var ys = tidePts.map(function (v) { return pad + (1 - Math.min(1, Math.max(0, v))) * (h - pad * 2); });
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
    var menu = $("btn-menu");
    var menuPanel = $("menu-panel");
    var menuClose = $("menu-close");
    function closeMenu() {
      if (menuPanel) menuPanel.classList.remove("open");
      if (menu) { menu.classList.remove("active"); menu.setAttribute("aria-expanded", "false"); }
    }
    if (menu && menuPanel) {
      menu.addEventListener("click", function () {
        var open = menuPanel.classList.toggle("open");
        menu.classList.toggle("active", open);
        menu.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    if (menuClose) menuClose.addEventListener("click", closeMenu);
    if (menuPanel) {
      menuPanel.addEventListener("click", function (e) {
        if (e.target === menuPanel) closeMenu();
      });
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
    document.querySelectorAll(".menu-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nav = btn.getAttribute("data-go");
        document.querySelectorAll(".nav-item").forEach(function (b) {
          b.classList.toggle("active", b.dataset.nav === nav);
        });
        closeMenu();
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
