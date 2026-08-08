/* Fishing Dashboard v38.1.0 — Stage 1 complete APIs + score SVG */
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
    var labels = $("pressure-labels");
    var grid = $("pressure-grid");
    if (!line || !pressurePts || pressurePts.length < 2) return;
    var pts = pressurePts;
    var times = pressureTimes || [];
    var w = 320, h = 150;
    var padL = 36, padR = 12, padT = 18, padB = 28;
    var min = Math.min.apply(null, pts) - 1;
    var max = Math.max.apply(null, pts) + 1;
    if (max <= min) max = min + 2;
    function X(i) { return padL + (i * (w - padL - padR)) / Math.max(1, pts.length - 1); }
    function Y(v) { return padT + (1 - (v - min) / (max - min)) * (h - padT - padB); }
    var pairs = pts.map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); });
    line.setAttribute("points", pairs.join(" "));
    if (area) {
      area.setAttribute("d",
        "M" + X(0).toFixed(1) + "," + (h - padB) + " " +
        pairs.map(function (p) { return "L" + p; }).join(" ") +
        " L" + X(pts.length - 1).toFixed(1) + "," + (h - padB) + " Z");
    }
    if (dots) {
      dots.innerHTML = pts.map(function (v, i) {
        return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) +
          '" r="4" fill="#f5c542" stroke="#1a1000" stroke-width="1"/>' +
          '<text x="' + X(i).toFixed(1) + '" y="' + (Y(v) - 8).toFixed(1) +
          '" text-anchor="middle" fill="#f5c542" font-size="9" font-weight="700">' +
          Math.round(v) + "</text>";
      }).join("");
    }
    if (grid) {
      var ticks = [];
      var step = Math.max(1, Math.round((max - min) / 4));
      for (var v = Math.ceil(min); v <= max; v += step) {
        var y = Y(v);
        ticks.push('<line x1="' + padL + '" y1="' + y + '" x2="' + (w - padR) +
          '" y2="' + y + '" stroke="rgba(53,200,255,.12)" stroke-dasharray="3 4"/>');
        ticks.push('<text x="' + (padL - 4) + '" y="' + (y + 3) +
          '" text-anchor="end" fill="rgba(53,200,255,.55)" font-size="8">' + v + "</text>");
      }
      // time labels
      for (var i = 0; i < pts.length; i++) {
        var t = times[i] || "";
        if (t) ticks.push('<text x="' + X(i).toFixed(1) + '" y="' + (h - 8) +
          '" text-anchor="middle" fill="rgba(53,200,255,.5)" font-size="8">' + t + "</text>");
      }
      grid.innerHTML = ticks.join("");
    }
  }


  function drawTide(pts) {
    pts = pts || tidePts;
    var line = $("tide-line");
    var area = $("tide-area");
    var dots = $("tide-dots");
    if (!line || !pts || !pts.length) return;
    var w = 320, h = 130;
    var padL = 10, padR = 10, padT = 16, padB = 16;
    var min = Math.min.apply(null, pts) - 0.05;
    var max = Math.max.apply(null, pts) + 0.05;
    if (max <= min) max = min + 0.2;
    function X(i) { return padL + (i * (w - padL - padR)) / Math.max(1, pts.length - 1); }
    function Y(v) { return padT + (1 - (v - min) / (max - min)) * (h - padT - padB); }
    var pairs = pts.map(function (v, i) { return X(i).toFixed(1) + "," + Y(v).toFixed(1); });
    line.setAttribute("points", pairs.join(" "));
    if (area) {
      area.setAttribute("d",
        "M" + X(0).toFixed(1) + "," + (h - padB) + " " +
        pairs.map(function (p) { return "L" + p; }).join(" ") +
        " L" + X(pts.length - 1).toFixed(1) + "," + (h - padB) + " Z");
    }
    if (dots) {
      // mark peaks roughly
      dots.innerHTML = pts.map(function (v, i) {
        var isExt = i > 0 && i < pts.length - 1 && (
          (v >= pts[i - 1] && v >= pts[i + 1]) || (v <= pts[i - 1] && v <= pts[i + 1])
        );
        if (!isExt && i !== 0 && i !== pts.length - 1) return "";
        return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) +
          '" r="4.5" fill="#fff" stroke="#35c8ff" stroke-width="2"/>';
      }).join("");
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
    var lit = $("moon-lit");
    var img = $("moon-img") || document.querySelector(".moon-img");
    if (!shade) return;
    var phase = (phaseHtml || "").toLowerCase();
    var waxing = phase.indexOf("αύξ") >= 0 || phase.indexOf("αυξ") >= 0;
    var waning = phase.indexOf("φθίν") >= 0 || phase.indexOf("φθιν") >= 0;
    if (!waxing && !waning) {
      // infer from pct path: after full = waning typically when labeled φθίνουσα
      waning = true;
    }
    // Illumination: use radial/linear combo so lit side glows, dark side absorbs
    var illum = pct / 100;
    var darkPct = 100 - pct;
    if (pct <= 3) {
      // new moon
      shade.style.opacity = "0.95";
      shade.style.background = "radial-gradient(circle at 50% 50%, rgba(2,11,24,.75) 0%, rgba(2,11,24,.98) 70%)";
      shade.style.boxShadow = "none";
      if (img) img.style.filter = "brightness(0.25) saturate(0.6)";
    } else if (pct >= 97) {
      shade.style.opacity = "0";
      shade.style.background = "transparent";
      if (img) img.style.filter = "brightness(1.15) saturate(1.05) drop-shadow(0 0 8px rgba(255,240,200,.35))";
    } else if (waning) {
      // light on LEFT, dark on RIGHT grows as pct drops
      shade.style.opacity = "1";
      shade.style.background =
        "linear-gradient(90deg, transparent 0%, transparent " + (pct * 0.85) + "%, rgba(2,11,24,.55) " + pct + "%, rgba(2,11,24,.97) " + Math.min(100, pct + 18) + "%)";
      shade.style.boxShadow = "inset -6px 0 12px rgba(2,11,24,.35)";
      if (img) img.style.filter = "brightness(" + (0.55 + illum * 0.55).toFixed(2) + ") contrast(1.08)";
    } else {
      // waxing: light on RIGHT
      shade.style.opacity = "1";
      shade.style.background =
        "linear-gradient(90deg, rgba(2,11,24,.97) 0%, rgba(2,11,24,.55) " + darkPct + "%, transparent " + Math.min(100, darkPct + 15) + "%, transparent 100%)";
      shade.style.boxShadow = "inset 6px 0 12px rgba(2,11,24,.35)";
      if (img) img.style.filter = "brightness(" + (0.55 + illum * 0.55).toFixed(2) + ") contrast(1.08)";
    }
    if (lit) {
      lit.style.opacity = String(0.15 + illum * 0.35);
      lit.style.background = waxing && !waning
        ? "radial-gradient(circle at 70% 40%, rgba(255,245,210,.45), transparent 55%)"
        : "radial-gradient(circle at 30% 40%, rgba(255,245,210,.45), transparent 55%)";
    }
  }



  function scoreToAngle(score) {
    score = Math.max(0, Math.min(100, Number(score) || 0));
    return -70 + (score / 100) * 140;
  }
  function setRodAngle(score) {
    var arm = $("score-rod-arm");
    if (!arm) return;
    arm.style.transform = "rotate(" + scoreToAngle(score) + "deg)";
  }
  function scoreStars(score) {
    var n = score >= 90 ? 5 : score >= 75 ? 4 : score >= 55 ? 3 : score >= 35 ? 2 : 1;
    var s = "";
    for (var i = 0; i < 5; i++) s += i < n ? "★" : "☆";
    return s;
  }
  function scoreLabel(score) {
    if (score >= 90) return "Ιδανική";
    if (score >= 75) return "Πολύ καλή";
    if (score >= 55) return "Καλή";
    if (score >= 35) return "Μέτρια";
    return "Κακή";
  }


  var ALERT_ICONS = {
    wind: "ico_alert_rod.png",
    technique: "ico_alert_hook.png",
    fish: "ico_alert_fish.png",
    warn: "ico_alert_warn.png",
    hours: "ico_alert_bell.png",
    score: "ico_alert_chart.png",
    default: "ico_alert_bell.png"
  };
  function alertIcon(a) {
    var t = ((a.type || a.title || "") + "").toLowerCase();
    if (t.indexOf("άνεμ") >= 0 || t.indexOf("ανεμ") >= 0 || t.indexOf("wind") >= 0) return ALERT_ICONS.wind;
    if (t.indexOf("τεχν") >= 0 || t.indexOf("spin") >= 0) return ALERT_ICONS.technique;
    if (t.indexOf("ψαρ") >= 0 || t.indexOf("fish") >= 0) return ALERT_ICONS.fish;
    if (t.indexOf("προσοχ") >= 0 || t.indexOf("warn") >= 0) return ALERT_ICONS.warn;
    if (t.indexOf("ώρ") >= 0 || t.indexOf("ωρ") >= 0) return ALERT_ICONS.hours;
    if (t.indexOf("score") >= 0) return ALERT_ICONS.score;
    return ALERT_ICONS.default;
  }

  function applyStage2(data) {
    if (!window.FDData || !FDData.computeScore) return;
    var sc = FDData.computeScore(data);
    if ($("score-num")) $("score-num").textContent = sc.score;
    setRodAngle(sc.score);
    if ($("score-stars")) $("score-stars").textContent = scoreStars(sc.score);
    if ($("score-lab")) $("score-lab").textContent = scoreLabel(sc.score);
    if ($("score-reasons") && sc.reasons) {
      $("score-reasons").innerHTML = sc.reasons.map(function (r) {
        return "<div>· " + r + "</div>";
      }).join("");
    }
    if ($("activity-pct")) $("activity-pct").textContent = sc.activity + "%";
    var bar = $("activity-bar-fill");
    if (bar) {
      bar.style.width = Math.max(8, Math.min(100, sc.activity)) + "%";
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
          var ico = alertIcon(a);
          return '<li class="alert-item" tabindex="0"><img class="alert-ico" src="' + ico +
            '" alt=""/><div class="alert-text"><strong>' + (a.title || "") +
            '</strong><span>' + (a.text || a.detail || "") + '</span></div><span class="alert-chev">›</span></li>';
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
    var exs = data.tideExtrema || [];
    var low = null, high = null;
    exs.forEach(function (e) {
      if (e.type === "Low" && !low) low = e;
      if (e.type === "High" && !high) high = e;
    });
    if ($("tide-low")) $("tide-low").textContent = low ? low.t : "—";
    if ($("tide-high")) $("tide-high").textContent = high ? high.t : "—";

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
