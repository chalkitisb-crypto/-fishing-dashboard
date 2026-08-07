/* Fishing Dashboard NEW v12 — demo data + interactions */
(function () {
  "use strict";

  const weatherHours = [
    { t: "08:00", ico: "☀️", lab: "Ηλιοφάνεια", temp: 22 },
    { t: "09:00", ico: "🌤️", lab: "Αραιή συννεφιά", temp: 23 },
    { t: "10:00", ico: "🌤️", lab: "Αραιή συννεφιά", temp: 24 },
    { t: "11:00", ico: "⛅", lab: "Αραιή συννεφιά", temp: 25 },
    { t: "12:00", ico: "☁️", lab: "Συννεφιά", temp: 25 },
    { t: "13:00", ico: "☁️", lab: "Συννεφιά", temp: 26 },
    { t: "14:00", ico: "🌤️", lab: "Αραιή συννεφιά", temp: 26 }
  ];

  const windHours = [
    { t: "08:00", deg: -35, dir: "ΝΑ", bf: 2, km: 9, cls: "g" },
    { t: "09:00", deg: -35, dir: "ΝΑ", bf: 2, km: 11, cls: "g" },
    { t: "10:00", deg: -90, dir: "Α", bf: 3, km: 13, cls: "g" },
    { t: "11:00", deg: -90, dir: "Α", bf: 3, km: 15, cls: "g" },
    { t: "12:00", deg: -90, dir: "Α", bf: 3, km: 17, cls: "o" },
    { t: "13:00", deg: -45, dir: "ΑΝΑ", bf: 4, km: 21, cls: "o" },
    { t: "14:00", deg: 0, dir: "Δ", bf: 4, km: 24, cls: "r" }
  ];

  const currentHours = [
    { t: "08:00", deg: -35, dir: "ΝΑ", kn: "0.3", cls: "g" },
    { t: "09:00", deg: -35, dir: "ΝΑ", kn: "0.4", cls: "g" },
    { t: "10:00", deg: -90, dir: "Α", kn: "0.4", cls: "g" },
    { t: "11:00", deg: -90, dir: "Α", kn: "0.5", cls: "g" },
    { t: "12:00", deg: -90, dir: "Α", kn: "0.6", cls: "g" },
    { t: "13:00", deg: -45, dir: "ΑΝΑ", kn: "0.6", cls: "o" },
    { t: "14:00", deg: -45, dir: "ΑΝΑ", kn: "0.7", cls: "r" }
  ];

  /* Pressure series (fluctuating) */
  const pressurePts = [1017, 1019, 1016, 1021, 1018, 1022, 1019];
  const tidePts = [0.2, 0.55, 0.15, 0.7, 0.25, 0.6, 0.35];

  function el(id) { return document.getElementById(id); }

  function renderWeather() {
    const root = el("weather-hours");
    if (!root) return;
    root.innerHTML = weatherHours.map(h => `
      <article class="wh-cell">
        <time>${h.t}</time>
        <div class="ico">${h.ico}</div>
        <span class="lab">${h.lab}</span>
        <strong>${h.temp}°C</strong>
      </article>
    `).join("");
  }

  function renderWind() {
    const root = el("wind-hours");
    if (!root) return;
    root.innerHTML = windHours.map(h => `
      <article class="w-cell">
        <time>${h.t}</time>
        <div class="tri ${h.cls}" style="--deg:${h.deg}deg"></div>
        <div class="dir">${h.dir}</div>
        <strong>${h.bf}</strong>
        <small>${h.km} km/h</small>
      </article>
    `).join("");
  }

  function renderCurrents() {
    const root = el("current-hours");
    if (!root) return;
    root.innerHTML = currentHours.map(h => `
      <article class="c-cell">
        <time>${h.t}</time>
        <div class="tri ${h.cls}" style="--deg:${h.deg}deg"></div>
        <div class="dir">${h.dir}</div>
        <strong>${h.kn} kn</strong>
      </article>
    `).join("");
  }

  function drawPressure() {
    const line = el("pressure-line");
    const area = el("pressure-area");
    if (!line || !area) return;
    const w = 320, h = 90, pad = 8;
    const min = Math.min(...pressurePts) - 2;
    const max = Math.max(...pressurePts) + 2;
    const xs = pressurePts.map((_, i) => pad + (i * (w - pad * 2)) / (pressurePts.length - 1));
    const ys = pressurePts.map(v => pad + (1 - (v - min) / (max - min)) * (h - pad * 2));
    const pts = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
    line.setAttribute("points", pts);
    const areaD = `M${xs[0]},${h} ` + xs.map((x, i) => `L${x},${ys[i]}`).join(" ") + ` L${xs[xs.length - 1]},${h} Z`;
    area.setAttribute("d", areaD);
  }

  function drawTide() {
    const line = el("tide-line");
    const area = el("tide-area");
    if (!line || !area) return;
    const w = 280, h = 80, pad = 6;
    const min = 0, max = 1;
    const xs = tidePts.map((_, i) => pad + (i * (w - pad * 2)) / (tidePts.length - 1));
    const ys = tidePts.map(v => pad + (1 - (v - min) / (max - min)) * (h - pad * 2));
    // smooth-ish path
    let d = `M${xs[0]},${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const cx = (xs[i - 1] + xs[i]) / 2;
      d += ` Q${xs[i - 1]},${ys[i - 1]} ${cx},${(ys[i - 1] + ys[i]) / 2}`;
    }
    d += ` T${xs[xs.length - 1]},${ys[ys.length - 1]}`;
    line.setAttribute("d", d);
    area.setAttribute("d", d + ` L${xs[xs.length - 1]},${h} L${xs[0]},${h} Z`);
  }

  function bindUI() {
    const refresh = el("btn-refresh");
    if (refresh) {
      refresh.addEventListener("click", () => {
        refresh.classList.add("spin");
        setTimeout(() => refresh.classList.remove("spin"), 600);
      });
    }

    const fav = el("btn-fav");
    if (fav) {
      fav.addEventListener("click", () => {
        const on = fav.textContent === "★";
        fav.textContent = on ? "☆" : "★";
        fav.style.color = on ? "" : "var(--gold)";
        try { localStorage.setItem("fd-fav", on ? "0" : "1"); } catch (e) {}
      });
      try {
        if (localStorage.getItem("fd-fav") === "1") {
          fav.textContent = "★";
          fav.style.color = "var(--gold)";
        }
      } catch (e) {}
    }

    document.querySelectorAll(".tech").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tech").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        try { localStorage.setItem("fd-tech", btn.dataset.tech); } catch (e) {}
      });
    });
    try {
      const saved = localStorage.getItem("fd-tech");
      if (saved) {
        document.querySelectorAll(".tech").forEach(b => {
          b.classList.toggle("selected", b.dataset.tech === saved);
        });
      }
    } catch (e) {}

    document.querySelectorAll(".nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        try { localStorage.setItem("fd-nav", btn.dataset.nav); } catch (e) {}
      });
    });
  }

  function enableHScroll(sel) {
    document.querySelectorAll(sel).forEach(strip => {
      let startX = 0, scrollL = 0, dragging = false;
      strip.addEventListener("pointerdown", e => {
        dragging = true;
        startX = e.clientX;
        scrollL = strip.scrollLeft;
        strip.setPointerCapture(e.pointerId);
      });
      strip.addEventListener("pointermove", e => {
        if (!dragging) return;
        strip.scrollLeft = scrollL - (e.clientX - startX);
      });
      strip.addEventListener("pointerup", () => { dragging = false; });
      strip.addEventListener("pointercancel", () => { dragging = false; });
    });
  }

  function init() {
    renderWeather();
    renderWind();
    renderCurrents();
    drawPressure();
    drawTide();
    bindUI();
    enableHScroll(".h-scroll");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

;if("serviceWorker" in navigator){navigator.serviceWorker.register("./service-worker.js").catch(function(){})}
