/* Fishing Dashboard v29.0.0 — final locked visuals */
(function () {
  "use strict";

  var weatherHours = [
    { t: "08:00", ico: "ico_wx_sun.png", lab: "Αίθριος", temp: 22 },
    { t: "09:00", ico: "ico_wx_partly.png", lab: "Αραιή", temp: 23 },
    { t: "10:00", ico: "ico_wx_haze.png", lab: "Ήπιος", temp: 24 },
    { t: "11:00", ico: "ico_wx_cloud.png", lab: "Συννεφιά", temp: 25 },
    { t: "12:00", ico: "ico_wx_rain.png", lab: "Βροχή", temp: 26 },
    { t: "13:00", ico: "ico_wx_storm.png", lab: "Καταιγίδα", temp: 25 },
    { t: "14:00", ico: "ico_wx_partly.png", lab: "Αραιή", temp: 24 }
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

  var pressurePts = [1017, 1018, 1018, 1019, 1020, 1021, 1019];
  var pressureTimes = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00"];
  var tidePts = [0.15, 0.4, 0.9, 1.15, 0.7, 0.3, 0.18];

  /* Stars ↔ label mapping (locked) */
  var STAR_LABEL = { 5: "Ιδανική", 4: "Πολύ καλή", 3: "Καλή", 2: "Μέτρια", 1: "Κακή" };
  function starsText(n) {
    n = Math.max(1, Math.min(5, n|0));
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  }

  function $(id) { return document.getElementById(id); }

  function renderWeather() {
    var root = $("weather-hours");
    if (!root) return;
    root.innerHTML = weatherHours.map(function (h) {
      return '<article class="wh-cell"><img class="wh-ico" src="' + h.ico + '" alt=""/>' +
        '<time>' + h.t + '</time><span class="lab">' + h.lab +
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
    var line = $("pressure-line"), core = $("pressure-line-core"), area = $("pressure-area"), dots = $("pressure-dots");
    if (!line || !area) return;
    var w = 320, h = 100, padX = 18, padTop = 18, padBot = 22;
    var min = Math.min.apply(null, pressurePts) - 2;
    var max = Math.max.apply(null, pressurePts) + 2;
    if (max - min < 4) { var mid = (max + min) / 2; min = mid - 3; max = mid + 3; }
    var xs = pressurePts.map(function (_, i) { return padX + (i * (w - padX * 2)) / (pressurePts.length - 1); });
    var ys = pressurePts.map(function (v) { return padTop + (1 - (v - min) / (max - min)) * (h - padTop - padBot); });
    var pts = xs.map(function (x, i) { return x.toFixed(1) + "," + ys[i].toFixed(1); }).join(" ");
    line.setAttribute("points", pts);
    if (core) core.setAttribute("points", pts);
    /* Strong yellow shadow fill under line */
    area.setAttribute("d", "M" + xs[0] + "," + (h - 2) + " " + xs.map(function (x, i) {
      return "L" + x + "," + ys[i];
    }).join(" ") + " L" + xs[xs.length - 1] + "," + (h - 2) + " Z");
    if (dots) {
      var html = "";
      for (var i = 0; i < xs.length; i++) {
        html += '<circle cx="' + xs[i].toFixed(1) + '" cy="' + ys[i].toFixed(1) +
          '" r="4.5" fill="#f0c14a" stroke="#1a1200" stroke-width="1.2"/>' +
          '<circle cx="' + xs[i].toFixed(1) + '" cy="' + ys[i].toFixed(1) +
          '" r="8" fill="#f0c14a" opacity="0.28"/>' +
          '<text x="' + xs[i].toFixed(1) + '" y="' + (ys[i] - 10).toFixed(1) +
          '" text-anchor="middle" fill="#f0c14a" font-size="9" font-weight="700">' +
          pressurePts[i] + '</text>';
        if (pressureTimes[i]) {
          html += '<text x="' + xs[i].toFixed(1) + '" y="' + (h - 5) +
            '" text-anchor="middle" fill="#8aa4bc" font-size="8">' + pressureTimes[i] + '</text>';
        }
      }
      dots.innerHTML = html;
    }
  }

  function drawTide() {
    var line = $("tide-line"), area = $("tide-area"), dots = $("tide-dots");
    if (!line || !area) return;
    var w = 280, h = 90, padX = 14, padTop = 12, padBot = 10;
    var xs = tidePts.map(function (_, i) { return padX + (i * (w - padX * 2)) / (tidePts.length - 1); });
    var ys = tidePts.map(function (v) { return padTop + (1 - Math.min(1.2, Math.max(0, v)) / 1.2) * (h - padTop - padBot); });
    var d = "M" + xs[0] + "," + ys[0];
    for (var i = 1; i < xs.length; i++) {
      var cx = (xs[i - 1] + xs[i]) / 2;
      d += " C" + cx + "," + ys[i - 1] + " " + cx + "," + ys[i] + " " + xs[i] + "," + ys[i];
    }
    line.setAttribute("d", d);
    area.setAttribute("d", d + " L" + xs[xs.length - 1] + "," + h + " L" + xs[0] + "," + h + " Z");
    if (dots) {
      var peak = 0;
      for (var j = 1; j < tidePts.length; j++) if (tidePts[j] > tidePts[peak]) peak = j;
      var marks = [0, peak, tidePts.length - 1];
      var html = "";
      marks.forEach(function (idx) {
        html += '<circle cx="' + xs[idx].toFixed(1) + '" cy="' + ys[idx].toFixed(1) +
          '" r="5" fill="#e8f4ff" stroke="#35c8ff" stroke-width="2"/>' +
          '<circle cx="' + xs[idx].toFixed(1) + '" cy="' + ys[idx].toFixed(1) +
          '" r="9" fill="#35c8ff" opacity="0.3"/>';
      });
      dots.innerHTML = html;
    }
  }

  function syncTechLabels() {
    document.querySelectorAll(".tech").forEach(function (btn) {
      var n = parseInt(btn.getAttribute("data-stars") || "3", 10);
      var ts = btn.querySelector(".ts");
      var tl = btn.querySelector(".tl");
      if (ts) ts.textContent = starsText(n);
      if (tl) tl.textContent = STAR_LABEL[n] || STAR_LABEL[3];
    });
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

    /* Alerts — tappable like buttons */
    document.querySelectorAll(".alert-list li").forEach(function (li) {
      function activate() {
        li.classList.add("pressed");
        setTimeout(function () { li.classList.remove("pressed"); }, 150);
        var title = (li.querySelector("b") || {}).textContent || "Alert";
        /* placeholder: future detail sheet */
        try { console.log("[alert]", title); } catch (e) {}
      }
      li.addEventListener("click", activate);
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
      });
    });

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
    syncTechLabels();
    bindUI();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(function () {});
  }
})();
