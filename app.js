/* Fishing Dashboard v37.2.0 — Stage 1 complete APIs + score SVG */
(function () {
  "use strict";

  var weatherHours = [];
  var windHours = [];
  var currentHours = [];
  var pressurePts = [];
  var pressureTimes = [];
  var tidePts = [0.15, 0.4, 0.9, 1.15, 0.7, 0.3, 0.18];

  var STAR_LABEL = { 5: "Ιδανική", 4: "Πολύ καλή", 3: "Καλή", 2: "Μέτρια", 1: "Κακή" };
  function starsText(n) {
    n = Math.max(1, Math.min(5, n | 0));
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  }

  function $(id) { return document.getElementById(id); }

  function setStatus(msg, isErr) {
    var el = $("data-status");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("err", !!isErr);
    el.classList.add("show");
  }

  function renderWeather() {
    var root = $("weather-hours");
    if (!root) return;
    if (!weatherHours.length) {
      root.innerHTML = '<article class="wh-cell"><span class="lab">Φόρτωση…</span></article>';
      return;
    }
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
      return '<article class="wh-cell wind-cell"><div class="wind-arrow ' + h.cls +
        '" style="transform:rotate(' + h.deg + 'deg)">➤</div>' +
        '<time>' + h.t + '</time><span class="lab">' + h.dir +
        '</span><strong>' + h.bf + '</strong></article>';
    }).join("");
  }

  function renderCurrents() {
    var root = $("current-hours");
    if (!root) return;
    root.innerHTML = currentHours.map(function (h) {
      return '<article class="wh-cell"><div class="wind-arrow ' + h.cls +
        '" style="transform:rotate(' + h.deg + 'deg)">➤</div>' +
        '<time>' + h.t + '</time><span class="lab">' + h.dir +
        '</span><strong>' + h.kn + ' kn</strong></article>';
    }).join("");
  }

  function drawPressure() {
    var line = $("pressure-line");
    var area = $("pressure-area");
    var dots = $("pressure-dots");
    if (!line || !area) return;
    if (!pressurePts.length) return;
    var w = 320, h = 120, padX = 12, padTop = 12, padBot = 20;
    var min = Math.min.apply(null, pressurePts) - 1;
    var max = Math.max.apply(null, pressurePts) + 1;
    var xs = pressurePts.map(function (_, i) {
      return padX + (i * (w - padX * 2)) / Math.max(1, pressurePts.length - 1);
    });
    var ys = pressurePts.map(function (v) {
      return padTop + (1 - (v - min) / (max - min)) * (h - padTop - padBot);
    });
    var pts = xs.map(function (x, i) { return x.toFixed(1) + "," + ys[i].toFixed(1); }).join(" ");
    line.setAttribute("points", pts);
    area.setAttribute("d", "M" + xs[0] + "," + (h - 2) + " " + xs.map(function (x, i) {
      return "L" + x + "," + ys[i];
    }).join(" ") + " L" + xs[xs.length - 1] + "," + (h - 2) + " Z");
    if (dots) {
      dots.innerHTML = xs.map(function (x, i) {
        return '<circle cx="' + x + '" cy="' + ys[i] + '" r="3"/>';
      }).join("");
    }
  }

  function drawTide(pts) {
    pts = pts || tidePts;
    var line = $("tide-line");
    var area = $("tide-area");
    var dot = $("tide-dot");
    if (!line || !pts || !pts.length) return;
    var w = 320, h = 110, padX = 12, padTop = 14, padBot = 16;
    var min = Math.min.apply(null, pts) - 0.05;
    var max = Math.max.apply(null, pts) + 0.05;
    if (max <= min) max = min + 0.2;
    var xs = pts.map(function (_, i) {
      return padX + (i * (w - padX * 2)) / Math.max(1, pts.length - 1);
    });
    var ys = pts.map(function (v) {
      return padTop + (1 - (v - min) / (max - min)) * (h - padTop - padBot);
    });
    var ptsStr = xs.map(function (x, i) {
      return x.toFixed(1) + "," + ys[i].toFixed(1);
    }).join(" ");
    line.setAttribute("points", ptsStr);
    if (area) {
      var d = "M" + xs[0].toFixed(1) + "," + (h - padBot) + " " +
        xs.map(function (x, i) { return "L" + x.toFixed(1) + "," + ys[i].toFixed(1); }).join(" ") +
        " L" + xs[xs.length - 1].toFixed(1) + "," + (h - padBot) + " Z";
      area.setAttribute("d", d);
    }
    var ni = Math.min(2, pts.length - 1);
    if (dot) {
      dot.setAttribute("cx", xs[ni]);
      dot.setAttribute("cy", ys[ni]);
    }
  }


  function applyHero(data) {
    if (!data) return;
    var d = data.date || {};
    var c = data.current || {};
    var sun = data.sun || {};
    if ($("hero-dow")) $("hero-dow").textContent = d.dow || "—";
    if ($("hero-day")) $("hero-day").textContent = d.day || "—";
    if ($("hero-mon")) $("hero-mon").innerHTML = d.mon || "—";
    if ($("hero-cond")) $("hero-cond").textContent = c.cond || "—";
    if ($("hero-temp")) $("hero-temp").innerHTML = (c.temp != null ? c.temp : "—") + "<span>°C</span>";
    if ($("hero-desc")) $("hero-desc").textContent = c.desc || "—";
    if ($("m-feels")) $("m-feels").textContent = (c.feels != null ? c.feels + "°C" : "—");
    if ($("m-hum")) $("m-hum").textContent = (c.humidity != null ? c.humidity + "%" : "—");
    if ($("m-rain")) $("m-rain").textContent = (c.rain != null ? c.rain + " mm" : "—");
    if ($("m-uv") && window.FDData) $("m-uv").textContent = window.FDData.uvLabel(c.uv || data.uvMax || 0);
    if ($("m-rise")) $("m-rise").textContent = sun.rise || "—";
    if ($("m-set")) $("m-set").textContent = sun.set || "—";

    var sea = data.sea || {};
    if ($("sea-wave")) $("sea-wave").textContent = sea.wave != null ? sea.wave.toFixed(1) + " m" : "—";
    if ($("sea-period")) $("sea-period").textContent = sea.period != null ? Math.round(sea.period) + " s" : "—";
    if ($("sea-dir")) $("sea-dir").textContent = sea.dirDeg != null && window.FDData ? window.FDData.degToCompass(sea.dirDeg) : "—";
    if ($("sea-temp")) $("sea-temp").textContent = sea.waterTemp != null ? Math.round(sea.waterTemp) + "°C" : "—";

    if ($("pressure-hpa") && c.pressure != null) {
      $("pressure-hpa").textContent = Math.round(c.pressure) + " hPa";
    }
    if ($("pressure-trend") && data.pressureTrend) {
      $("pressure-trend").textContent = data.pressureTrend;
    }
    if (data.moon) {
      if ($("moon-pct")) $("moon-pct").textContent = data.moon.pct + "%";
      if ($("moon-phase")) $("moon-phase").innerHTML = data.moon.phaseHtml;
      if ($("moon-rise") && data.moon.rise) $("moon-rise").textContent = data.moon.rise;
      if ($("moon-set") && data.moon.set) $("moon-set").textContent = data.moon.set;
      setMoonVisual(data.moon.pct, data.moon.phaseHtml || "");
    }


    
    applyStage2(data);

    var locEl = document.querySelector(".brand-loc");
    if (locEl && data.location) {
      locEl.textContent = "📍 " + (data.location.name || "Κάλυμνος") + ", Ελλάδα";
    }
  }



  /** Map score 0–100 → degrees. Gauge arc: left(-120) … center(0) … right(+120) */
  



  function scoreToAngle(score) {
    score = Math.max(0, Math.min(100, Number(score) || 0));
    // 0 → left (-70deg), 50 → up (0), 100 → right (+70deg) approx dial
    return -70 + (score / 100) * 140;
  }

  function setRodAngle(score) {
    var arm = $("score-rod-arm");
    if (!arm) return;
    var deg = scoreToAngle(score);
    arm.style.transform = "rotate(" + deg + "deg)";
    arm.dataset.score = String(score);
  }

  function setActivityBrows(pct) {
    pct = Math.max(0, Math.min(100, Number(pct) || 0));
    var root = $("activity-brows");
    if (!root) return;
    root.classList.remove("brow-low", "brow-mid", "brow-high");
    if (pct >= 70) root.classList.add("brow-high");
    else if (pct >= 40) root.classList.add("brow-mid");
    else root.classList.add("brow-low");
    // angle: low = frown, high = raised
    var ang = pct < 40 ? 18 : pct < 70 ? 4 : -14;
    root.style.setProperty("--brow-ang", ang + "deg");
  }



  function setMoonVisual(pct, phaseHtml) {
    pct = Math.max(0, Math.min(100, Number(pct) || 0));
    var shade = $("moon-shade");
    var disc = $("moon-disc");
    var img = disc ? disc.querySelector(".moon-img") : document.querySelector(".moon-img");
    if (!shade) return;
    var phase = (phaseHtml || "").toLowerCase();
    var waxing = phase.indexOf("αύξουσα") >= 0 || phase.indexOf("αυξουσα") >= 0;
    var waning = phase.indexOf("φθίνουσα") >= 0 || phase.indexOf("φθινουσα") >= 0;
    // Dark overlay covers (100-pct)% of disc from left (waning) or right (waxing)
    var dark = 100 - pct;
    if (pct < 5) {
      shade.style.opacity = "0.92";
      shade.style.background = "#020b18";
      shade.style.left = "0"; shade.style.right = "0";
      shade.style.clipPath = "none";
    } else if (pct > 95) {
      shade.style.opacity = "0";
    } else {
      shade.style.opacity = "1";
      // Approximate phase: linear gradient mask
      if (waning || (!waxing && pct < 50)) {
        // light on left, dark on right for waning crescent-ish
        shade.style.background =
          "linear-gradient(90deg, transparent 0%, transparent " + pct + "%, rgba(2,11,24,.92) " + pct + "%, rgba(2,11,24,.95) 100%)";
      } else {
        shade.style.background =
          "linear-gradient(90deg, rgba(2,11,24,.95) 0%, rgba(2,11,24,.92) " + dark + "%, transparent " + dark + "%, transparent 100%)";
      }
    }
    if (img) {
      img.style.filter = pct < 30 ? "brightness(0.85) contrast(1.05)" : "brightness(1)";
    }
  }

  function applyStage2(data) {
    if (!window.FDData || !FDData.computeScore) return;
    var sc = FDData.computeScore(data);
    if ($("score-num")) $("score-num").textContent = sc.score;
    setRodAngle(sc.score);
    if ($("score-lab")) $("score-lab").textContent = sc.label;
    if ($("activity-pct")) $("activity-pct").textContent = sc.activity;
    setActivityBrows(sc.activity);
    var bar = $("activity-bar-fill");
    if (bar) {
      bar.style.width = Math.max(4, Math.min(100, sc.activity)) + "%";
      var col = sc.activity >= 70 ? "#2ecc71" : sc.activity >= 45 ? "#f1c40f" : "#e74c3c";
      bar.style.background = col;
    }
    if ($("zone-place") && data.location) {
      $("zone-place").textContent = "📍 " + (data.location.name || "Κάλυμνος") + " · Νότια άκρη · 2–4μ";
    }
    var sr = $("score-reasons");
    if (sr) {
      sr.innerHTML = (sc.reasons || []).slice(0, 3).map(function (r) {
        return "<div>· " + r + "</div>";
      }).join("");
    }

    // Best hours + why
    var bl = $("best-line");
    var bw = $("best-why");
    if (bl && FDData.computeBestHours) {
      var bh = FDData.computeBestHours(data);
      bl.innerHTML =
        '<button type="button" class="best-chip" data-why="morning">ΠΡΩΙ ' + bh.morning + "</button>" +
        '<span class="sep"> · </span>' +
        '<button type="button" class="best-chip" data-why="evening">ΑΠΟΓΕΥΜΑ ' + bh.evening + "</button>" +
        '<span class="sep"> · </span>' +
        '<button type="button" class="best-chip" data-why="night">ΝΥΧΤΑ ' + bh.night + "</button>";
      bl.querySelectorAll(".best-chip").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-why");
          var map = { morning: bh.whyMorning, evening: bh.whyEvening, night: bh.whyNight };
          var title = { morning: "Πρωί", evening: "Απόγευμα", night: "Νύχτα" };
          if (!bw) return;
          if (bw.dataset.open === key) {
            bw.hidden = true;
            bw.dataset.open = "";
            return;
          }
          bw.dataset.open = key;
          bw.hidden = false;
          bw.innerHTML = "<b>Γιατί " + title[key] + "</b><ul>" +
            (map[key] || []).map(function (x) { return "<li>" + x + "</li>"; }).join("") +
            "</ul>";
        });
      });
    }

    // Techniques live stars
    if (FDData.computeTechniques) {
      var techs = FDData.computeTechniques(data, sc);
      var byId = {};
      techs.forEach(function (t) { byId[t.id] = t; });
      document.querySelectorAll(".tech").forEach(function (btn) {
        var id = btn.getAttribute("data-tech");
        // map shore_jig / shore
        if (id === "shore_jig") id = "shore";
        var t = byId[id];
        if (!t) return;
        btn.setAttribute("data-stars", String(t.stars));
        var st = btn.querySelector(".ts") || btn.querySelector(".tech-stars");
        var lab = btn.querySelector(".tl") || btn.querySelector(".tech-lab");
        if (st) st.textContent = starsText(t.stars);
        if (lab) lab.textContent = t.label;
      });
    }

    // Alerts rules
    if (FDData.computeAlerts) {
      var alerts = FDData.computeAlerts(data, sc);
      var root = $("alert-list");
      if (root) {
        root.innerHTML = alerts.map(function (a) {
          return '<li class="' + a.cls + '" role="button" tabindex="0">' +
            '<span class="a-ico">' + a.ico + "</span>" +
            "<div><b>" + a.title + "</b><span>" + a.text + "</span></div><i>›</i></li>";
        }).join("");
        root.querySelectorAll("li").forEach(function (li) {
          function activate() {
            li.classList.add("pressed");
            setTimeout(function () { li.classList.remove("pressed"); }, 150);
          }
          li.addEventListener("click", activate);
        });
      }
    }
  }

  function applyLive(data) {
    weatherHours = data.weatherHours || [];
    windHours = data.windHours || [];
    currentHours = data.currentHours || [];
    pressurePts = data.pressurePts || [];
    pressureTimes = data.pressureTimes || [];
    tidePts = data.tidePts || tidePts;
    applyHero(data);
    if ($("tide-h") && data.tideNow != null) {
      $("tide-h").textContent = data.tideNow.toFixed(2) + " m";
    }
    if ($("tide-info")) {
      var ex = (data.tideExtrema || [])[0];
      $("tide-info").textContent = ex ? (ex.type + " ~ " + ex.t) : (data.tideSource || "");
    }

    renderWeather();
    renderWind();
    renderCurrents();
    drawPressure();
  }

  function loadLive() {
    if (!window.FDData) {
      setStatus("Λείπει data layer", true);
      return Promise.resolve();
    }
    setStatus("Φόρτωση Open-Meteo…");
    return FDData.getLocation().then(function (loc) {
      return FDData.fetchDashboard(loc);
    }).then(function (data) {
      applyLive(data);
      var t = new Date(data.fetchedAt);
      var hh = String(t.getHours()).padStart(2, "0");
      var mm = String(t.getMinutes()).padStart(2, "0");
      setStatus("Live · " + (data.location && data.location.name) + " · " + hh + ":" + mm + " · Meteo+Marine");
    }).catch(function (err) {
      var cached = FDData.loadCache();
      if (cached && cached.data) {
        applyLive(cached.data);
        setStatus("Offline — τελευταία αποθηκευμένα δεδομένα", true);
      } else {
        setStatus("Αποτυχία σύνδεσης · " + (err && err.message ? err.message : "error"), true);
      }
    });
  }

  function syncTechLabels() {
    document.querySelectorAll(".tech").forEach(function (btn) {
      var n = parseInt(btn.getAttribute("data-stars") || "3", 10);
      var lab = btn.querySelector(".tech-lab");
      if (lab) lab.textContent = STAR_LABEL[n] || "";
      var st = btn.querySelector(".tech-stars");
      if (st) st.textContent = starsText(n);
    });
  }


  function showView(name) {
    var dash = $("view-dashboard");
    var views = ["map", "spots", "calendar", "settings"];
    if (dash) dash.hidden = name !== "dashboard";
    views.forEach(function (v) {
      var el = $("view-" + v);
      if (el) el.hidden = name !== v;
    });
    document.querySelectorAll(".nav-item").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-nav") === name);
    });
    if (name === "calendar") renderCalendar();
    try { localStorage.setItem("fd-view", name); } catch (e) {}
  }

  function renderCalendar() {
    var root = $("cal-grid");
    if (!root || root.dataset.ready) return;
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth();
    var first = new Date(y, m, 1).getDay();
    var days = new Date(y, m + 1, 0).getDate();
    var html = "<div class=\"cal-head\">" + (m + 1) + "/" + y + "</div><div class=\"cal-days\">";
    var labels = ["Κ","Δ","Τ","Τ","Π","Π","Σ"];
    labels.forEach(function (l) { html += "<span class=\"cdim\">" + l + "</span>"; });
    for (var i = 0; i < first; i++) html += "<span></span>";
    for (var d = 1; d <= days; d++) {
      var cls = d === now.getDate() ? " class=\"today\"" : "";
      html += "<span" + cls + ">" + d + "</span>";
    }
    html += "</div>";
    root.innerHTML = html;
    root.dataset.ready = "1";
  }

  function bindTabs() {
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showView(btn.getAttribute("data-nav") || "dashboard");
      });
    });
    document.querySelectorAll(".menu-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nav = btn.getAttribute("data-go");
        if (nav) showView(nav);
      });
    });
    try {
      var v = localStorage.getItem("fd-view");
      if (v) showView(v);
    } catch (e) {}
  }

  function bindInstall() {
    var deferred = null;
    var btn = $("btn-install");
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
      if (btn) btn.hidden = false;
    });
    if (btn) {
      btn.addEventListener("click", function () {
        if (!deferred) return;
        deferred.prompt();
        deferred.userChoice.then(function () { deferred = null; btn.hidden = true; });
      });
    }
  }

  function bindUI() {
    var refresh = $("btn-refresh");
    if (refresh) {
      refresh.addEventListener("click", function () {
        refresh.classList.add("spin");
        loadLive().finally(function () {
          setTimeout(function () { refresh.classList.remove("spin"); }, 400);
        });
      });
    }
    var fav = $("btn-fav");
    if (fav) {
      fav.addEventListener("click", function () {
        fav.classList.toggle("on");
        fav.textContent = fav.classList.contains("on") ? "★" : "☆";
      });
    }
    var menu = $("btn-menu");
    var menuPanel = $("menu-panel");
    var menuClose = $("menu-close");
    function closeMenu() {
      if (menuPanel) menuPanel.classList.remove("open");
    }
    if (menu && menuPanel) {
      menu.addEventListener("click", function () { menuPanel.classList.toggle("open"); });
    }
    if (menuClose) menuClose.addEventListener("click", closeMenu);
    if (menuPanel) {
      menuPanel.addEventListener("click", function (e) {
        if (e.target === menuPanel) closeMenu();
      });
    }

    document.querySelectorAll(".alert-list li").forEach(function (li) {
      function activate() {
        li.classList.add("pressed");
        setTimeout(function () { li.classList.remove("pressed"); }, 150);
        try { console.log("alert", li.innerText); } catch (e) {}
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
    syncTechLabels();
    bindUI();
    bindTabs();
    bindInstall();
    renderWeather();
    renderWind();
    renderCurrents();
    /* try cache first for instant paint */
    if (window.FDData) {
      var cached = FDData.loadCache();
      if (cached && cached.data) applyLive(cached.data);
    }
    loadLive();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js?v=34").catch(function () {});
  }
})();
