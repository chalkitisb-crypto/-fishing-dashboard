/* =========================================================
   FISHING DASHBOARD — MASTER APP.JS
   Version: 9.0.0
   Compatible with: index.html 9.0.0 / style.css 9.0.0
   Target: iPhone / iPad / Safari / PWA

   ARCHITECTURE
   - Data source / provider layer
   - Calculations and fishing rules
   - DOM rendering layer
   - Interaction and persistent layout layer

   The bundled data are deterministic fallback/demo data. A real provider
   can be registered without redesigning the interface.
========================================================= */

(() => {
  "use strict";

  const APP_VERSION = "9.0.0";
  const APP_EVENT_PREFIX = "fishingdashboard";

  const CONFIG = Object.freeze({
    locale: "el-GR",
    timeZone: "Europe/Athens",
    location: Object.freeze({
      name: "Κάλυμνος",
      country: "Ελλάδα",
      latitude: 36.95,
      longitude: 26.98
    }),
    refreshIntervalMs: 15 * 60 * 1000,
    clockIntervalMs: 30 * 1000,
    scoreMin: 0,
    scoreMax: 100,
    visibleHours: 7
  });

  const STORAGE_KEYS = Object.freeze({
    technique: "fishingDashboard.selectedTechnique",
    activeNav: "fishingDashboard.activeNav",
    favorite: "fishingDashboard.favorite",
    layoutOrder: "fishingDashboard.layoutOrder.v4",
    widgetSizes: "fishingDashboard.widgetSizes.v4",
    lastUpdated: "fishingDashboard.lastUpdated",
    demoSeed: "fishingDashboard.demoSeed"
  });

  const GREEK_DAYS = Object.freeze([
    "ΚΥΡΙΑΚΗ",
    "ΔΕΥΤΕΡΑ",
    "ΤΡΙΤΗ",
    "ΤΕΤΑΡΤΗ",
    "ΠΕΜΠΤΗ",
    "ΠΑΡΑΣΚΕΥΗ",
    "ΣΑΒΒΑΤΟ"
  ]);

  const GREEK_MONTHS = Object.freeze([
    "ΙΑΝΟΥΑΡΙΟΥ",
    "ΦΕΒΡΟΥΑΡΙΟΥ",
    "ΜΑΡΤΙΟΥ",
    "ΑΠΡΙΛΙΟΥ",
    "ΜΑΪΟΥ",
    "ΙΟΥΝΙΟΥ",
    "ΙΟΥΛΙΟΥ",
    "ΑΥΓΟΥΣΤΟΥ",
    "ΣΕΠΤΕΜΒΡΙΟΥ",
    "ΟΚΤΩΒΡΙΟΥ",
    "ΝΟΕΜΒΡΙΟΥ",
    "ΔΕΚΕΜΒΡΙΟΥ"
  ]);

  const SIZE_SEQUENCE = Object.freeze(["compact", "half", "wide"]);

  const TECHNIQUE_LABELS = Object.freeze({
    5: "Εξαιρετικό",
    4: "Πολύ Καλό",
    3: "Καλό",
    2: "Αδύναμο",
    1: "Κακό"
  });

  const CONDITION_META = Object.freeze({
    clear: Object.freeze({ label: "ΗΛΙΟΦΑΝΕΙΑ", description: "Αίθριος ουρανός", icon: "#weather-sun" }),
    partly: Object.freeze({ label: "ΑΡΑΙΗ ΣΥΝΝΕΦΙΑ", description: "Λίγες νεφώσεις", icon: "#weather-partly" }),
    cloudy: Object.freeze({ label: "ΣΥΝΝΕΦΙΑ", description: "Νεφελώδης ουρανός", icon: "#weather-cloud" }),
    rain: Object.freeze({ label: "ΒΡΟΧΗ", description: "Τοπικές βροχές", icon: "#weather-cloud" }),
    storm: Object.freeze({ label: "ΚΑΤΑΙΓΙΔΑ", description: "Καταιγίδες στην περιοχή", icon: "#weather-cloud" }),
    night: Object.freeze({ label: "ΑΙΘΡΙΟΣ ΝΥΧΤΑ", description: "Καθαρός νυχτερινός ουρανός", icon: "#weather-partly" })
  });

  const state = {
    initialized: false,
    refreshing: false,
    editMode: false,
    provider: null,
    data: null,
    lastError: null,
    toastTimer: null,
    clockTimer: null,
    autoRefreshTimer: null,
    pointerDrag: null,
    suppressClickUntil: 0,
    resizeObserver: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));
  const round = (value, decimals = 0) => {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  };
  const pad2 = (value) => String(value).padStart(2, "0");
  const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;
  const degreesToRadians = (degrees) => degrees * Math.PI / 180;
  const radiansToDegrees = (radians) => radians * 180 / Math.PI;

  function deepClone(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function storageGet(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      console.warn("Storage read failed:", error);
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn("Storage write failed:", error);
      return false;
    }
  }

  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn("Storage remove failed:", error);
      return false;
    }
  }

  function dispatch(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(`${APP_EVENT_PREFIX}:${name}`, { detail }));
  }

  function setText(selector, value, root = document) {
    const element = typeof selector === "string" ? $(selector, root) : selector;
    if (element) {
      element.textContent = value ?? "";
    }
  }

  function setBusy(isBusy) {
    $$('[data-live-widget]').forEach((widget) => {
      widget.setAttribute("aria-busy", String(Boolean(isBusy)));
    });
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat(CONFIG.locale, {
      timeZone: CONFIG.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function dateParts(date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: CONFIG.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "short"
    }).formatToParts(date);

    return Object.fromEntries(parts.map((part) => [part.type, part.value]));
  }

  function localDateFromParts(date) {
    const parts = dateParts(date);
    return new Date(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second)
    );
  }

  function decimalHourToText(decimalHour) {
    const normalized = mod(decimalHour, 24);
    let hour = Math.floor(normalized);
    let minute = Math.round((normalized - hour) * 60);
    if (minute === 60) {
      minute = 0;
      hour = mod(hour + 1, 24);
    }
    return `${pad2(hour)}:${pad2(minute)}`;
  }

  function textToMinutes(value) {
    const match = String(value || "").match(/(\d{1,2}):(\d{2})/);
    if (!match) return 0;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function minutesToText(totalMinutes) {
    const normalized = mod(Math.round(totalMinutes), 1440);
    return `${pad2(Math.floor(normalized / 60))}:${pad2(normalized % 60)}`;
  }

  function addMinutesToTime(value, minutes) {
    return minutesToText(textToMinutes(value) + minutes);
  }

  function createToast() {
    let toast = $("#fd-toast");
    if (toast) return toast;

    toast = document.createElement("div");
    toast.id = "fd-toast";
    toast.className = "fd-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    document.body.appendChild(toast);
    return toast;
  }

  function showToast(message, type = "info", duration = 2200) {
    const toast = createToast();
    clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add("show");
    state.toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
  }

  function injectRuntimeStyles() {
    if ($("#fd-runtime-styles")) return;

    const style = document.createElement("style");
    style.id = "fd-runtime-styles";
    style.textContent = `
      .fd-toast {
        position: fixed;
        left: 50%;
        bottom: calc(18px + env(safe-area-inset-bottom));
        z-index: 10000;
        max-width: min(88vw, 420px);
        padding: 10px 15px;
        border: 1px solid rgba(54,177,255,.50);
        border-radius: 999px;
        background: rgba(2,10,18,.97);
        color: #fff;
        box-shadow: 0 12px 34px rgba(0,0,0,.48);
        font: 800 12px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        text-align: center;
        opacity: 0;
        transform: translate(-50%,16px);
        pointer-events: none;
        transition: opacity .2s ease,transform .2s ease;
      }
      .fd-toast.show { opacity: 1; transform: translate(-50%,0); }
      .fd-toast[data-type="success"] { border-color: rgba(102,220,65,.65); }
      .fd-toast[data-type="warning"] { border-color: rgba(255,190,39,.70); }
      .fd-toast[data-type="error"] { border-color: rgba(255,78,65,.72); }

      .fd-edit-toolbar {
        position: fixed;
        left: 50%;
        bottom: calc(14px + env(safe-area-inset-bottom));
        z-index: 9997;
        display: none;
        grid-template-columns: repeat(3,auto);
        gap: 6px;
        padding: 7px;
        border: 1px solid rgba(49,200,255,.52);
        border-radius: 13px;
        background: rgba(2,10,18,.97);
        box-shadow: 0 12px 30px rgba(0,0,0,.48);
        transform: translateX(-50%);
      }
      .fd-edit-toolbar.is-visible { display: grid; }
      .fd-edit-toolbar button {
        min-height: 34px;
        padding: 0 10px;
        border: 1px solid rgba(49,200,255,.45);
        border-radius: 8px;
        background: rgba(5,24,39,.96);
        color: #fff;
        font-size: 10px;
        font-weight: 850;
      }
      .fd-layout-controls {
        position: absolute;
        top: 4px;
        right: 4px;
        z-index: 80;
        display: none;
        grid-template-columns: repeat(2,28px);
        gap: 4px;
      }
      body.fd-edit-mode .fd-layout-controls { display: grid; }
      .fd-layout-control {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(49,200,255,.65);
        border-radius: 7px;
        background: rgba(2,12,21,.96);
        color: #31c8ff;
        box-shadow: 0 4px 10px rgba(0,0,0,.42);
      }
      body.fd-edit-mode { padding-bottom: 72px; }
      body.fd-edit-mode .bottom-navigation,
      body.fd-edit-mode .technique-card { pointer-events: none; }
      .fd-layout-block.fd-pointer-dragging { opacity: .64; transform: scale(.992); z-index: 500; }
      .fd-layout-block.fd-drop-target { box-shadow: 0 0 0 2px rgba(49,200,255,.82) !important; }
      .hourly-strip.is-drag-scrolling,
      .technique-scroll.is-drag-scrolling { cursor: grabbing; user-select: none; }
      .refresh-button.is-rotating svg,
      .refresh-button.is-rotating i { animation: fd-spin .62s linear; }
      @keyframes fd-spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }

  /* =======================================================
     SOLAR AND LUNAR FALLBACK CALCULATIONS
  ======================================================= */

  function dayOfYear(date) {
    const local = localDateFromParts(date);
    const start = new Date(local.getFullYear(), 0, 0);
    return Math.floor((local - start) / 86400000);
  }

  function calculateSunEvent(date, latitude, longitude, sunrise) {
    const zenith = 90.833;
    const n = dayOfYear(date);
    const lngHour = longitude / 15;
    const t = n + ((sunrise ? 6 : 18) - lngHour) / 24;
    const meanAnomaly = 0.9856 * t - 3.289;

    let trueLongitude = meanAnomaly
      + 1.916 * Math.sin(degreesToRadians(meanAnomaly))
      + 0.020 * Math.sin(degreesToRadians(2 * meanAnomaly))
      + 282.634;
    trueLongitude = mod(trueLongitude, 360);

    let rightAscension = radiansToDegrees(Math.atan(0.91764 * Math.tan(degreesToRadians(trueLongitude))));
    rightAscension = mod(rightAscension, 360);

    const longitudeQuadrant = Math.floor(trueLongitude / 90) * 90;
    const raQuadrant = Math.floor(rightAscension / 90) * 90;
    rightAscension = (rightAscension + longitudeQuadrant - raQuadrant) / 15;

    const sinDec = 0.39782 * Math.sin(degreesToRadians(trueLongitude));
    const cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (
      Math.cos(degreesToRadians(zenith))
      - sinDec * Math.sin(degreesToRadians(latitude))
    ) / (cosDec * Math.cos(degreesToRadians(latitude)));

    if (cosH > 1 || cosH < -1) return null;

    let hourAngle = sunrise
      ? 360 - radiansToDegrees(Math.acos(cosH))
      : radiansToDegrees(Math.acos(cosH));
    hourAngle /= 15;

    const localMeanTime = hourAngle + rightAscension - 0.06571 * t - 6.622;
    const utcHour = mod(localMeanTime - lngHour, 24);

    const utcDate = new Date(Date.UTC(
      localDateFromParts(date).getFullYear(),
      localDateFromParts(date).getMonth(),
      localDateFromParts(date).getDate(),
      Math.floor(utcHour),
      Math.round((utcHour % 1) * 60)
    ));

    return formatTime(utcDate);
  }

  function calculateSunTimes(date) {
    const { latitude, longitude } = CONFIG.location;
    return {
      rise: calculateSunEvent(date, latitude, longitude, true) || "06:17",
      set: calculateSunEvent(date, latitude, longitude, false) || "20:07"
    };
  }

  function calculateMoon(date) {
    const synodicMonth = 29.530588853;
    const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
    const ageDays = mod((date.getTime() - knownNewMoon) / 86400000, synodicMonth);
    const phaseFraction = ageDays / synodicMonth;
    const illumination = Math.round((1 - Math.cos(2 * Math.PI * phaseFraction)) * 50);

    let phaseLabel;
    let phaseKey;
    if (ageDays < 1.85 || ageDays >= 27.68) {
      phaseLabel = "Νέα Σελήνη";
      phaseKey = "new";
    } else if (ageDays < 5.54) {
      phaseLabel = "Αύξουσα Μηνίσκος";
      phaseKey = "waxing-crescent";
    } else if (ageDays < 9.23) {
      phaseLabel = "Πρώτο Τέταρτο";
      phaseKey = "first-quarter";
    } else if (ageDays < 12.92) {
      phaseLabel = "Αύξουσα Αμφίκυρτη";
      phaseKey = "waxing-gibbous";
    } else if (ageDays < 16.61) {
      phaseLabel = "Πανσέληνος";
      phaseKey = "full";
    } else if (ageDays < 20.30) {
      phaseLabel = "Φθίνουσα Αμφίκυρτη";
      phaseKey = "waning-gibbous";
    } else if (ageDays < 23.99) {
      phaseLabel = "Τελευταίο Τέταρτο";
      phaseKey = "last-quarter";
    } else {
      phaseLabel = "Φθίνουσα Μηνίσκος";
      phaseKey = "waning-crescent";
    }

    const sun = calculateSunTimes(date);
    const riseMinutes = textToMinutes(sun.rise) + ageDays * 50.5;
    const rise = minutesToText(riseMinutes);
    const set = minutesToText(riseMinutes + 12 * 60 + 25);

    return {
      ageDays,
      phaseFraction,
      illumination,
      phaseLabel,
      phaseKey,
      rise,
      set
    };
  }

  function windDirectionLabel(degrees) {
    const labels = ["Β", "ΒΑ", "Α", "ΝΑ", "Ν", "ΝΔ", "Δ", "ΒΔ"];
    return labels[Math.round(mod(degrees, 360) / 45) % 8];
  }

  function kmhToBeaufort(kmh) {
    const thresholds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];
    return thresholds.findIndex((threshold) => kmh < threshold) + 1 || 12;
  }

  function uvLabel(index) {
    if (index <= 2) return `${index} ΧΑΜΗΛΟΣ`;
    if (index <= 5) return `${index} ΜΕΤΡΙΟΣ`;
    if (index <= 7) return `${index} ΥΨΗΛΟΣ`;
    if (index <= 10) return `${index} ΠΟΛΥ ΥΨΗΛΟΣ`;
    return `${index} ΑΚΡΑΙΟΣ`;
  }

  function conditionForHour(hour, rainProbability = 0) {
    if (hour < 6 || hour >= 21) return "night";
    if (rainProbability >= 65) return "rain";
    if (hour >= 12 && hour <= 14) return "partly";
    return "clear";
  }

  function calculateTideFallback(date) {
    const local = localDateFromParts(date);
    const minutesNow = local.getHours() * 60 + local.getMinutes();
    const phaseOffset = mod(local.getDate() * 37 + local.getMonth() * 53, 90) - 45;

    const events = [
      { type: "high", minutes: 375 + phaseOffset, height: 0.78 },
      { type: "low", minutes: 700 + phaseOffset, height: -0.12 },
      { type: "high", minutes: 1075 + phaseOffset, height: 0.85 },
      { type: "low", minutes: 1439 + phaseOffset, height: -0.10 }
    ].map((event) => ({ ...event, minutes: mod(event.minutes, 1440) }))
      .sort((a, b) => a.minutes - b.minutes);

    const findNext = (type) => {
      const future = events.find((event) => event.type === type && event.minutes >= minutesNow);
      return future || events.find((event) => event.type === type);
    };

    const samples = Array.from({ length: 25 }, (_, index) => {
      const minute = index * 60;
      const radians = 2 * Math.PI * (minute - events[0].minutes) / (12.42 * 60);
      return {
        minute,
        height: round(0.36 + 0.48 * Math.cos(radians), 2)
      };
    });

    return {
      events,
      samples,
      nextLow: findNext("low"),
      nextHigh: findNext("high"),
      nowMinutes: minutesNow
    };
  }

  function scoreLabel(score) {
    if (score >= 85) return "ΕΞΑΙΡΕΤΙΚΕΣ ΣΥΝΘΗΚΕΣ";
    if (score >= 70) return "ΠΟΛΥ ΚΑΛΕΣ ΣΥΝΘΗΚΕΣ";
    if (score >= 55) return "ΚΑΛΕΣ ΣΥΝΘΗΚΕΣ";
    if (score >= 40) return "ΜΕΤΡΙΕΣ ΣΥΝΘΗΚΕΣ";
    return "ΔΥΣΚΟΛΕΣ ΣΥΝΘΗΚΕΣ";
  }

  function ratingFromScore(score) {
    if (score >= 82) return 5;
    if (score >= 68) return 4;
    if (score >= 52) return 3;
    if (score >= 36) return 2;
    return 1;
  }

  function evaluateFactor(value, thresholds, labels) {
    for (let index = 0; index < thresholds.length; index += 1) {
      if (value >= thresholds[index]) return labels[index];
    }
    return labels.at(-1);
  }

  // Locked Master snapshot date (Sunday 2 Aug 2026 ~10:00 Athens) so visuals match MASTER_FINAL_REFERENCE
  const MASTER_LOCK_DATE = new Date("2026-08-02T10:00:00+03:00");

  function buildDemoData(now = MASTER_LOCK_DATE) {
    // Force Master visual lock unless a real provider is registered
    if (!state.provider) {
      now = MASTER_LOCK_DATE;
    }
    const local = localDateFromParts(now);
    const sun = calculateSunTimes(now);
    const moon = calculateMoon(now);
    const tide = calculateTideFallback(now);
    const startHour = 8; // Master hourly strip starts at 08:00
    const dailyWave = Math.sin((local.getDate() + local.getMonth() * 3) * 0.73);
    const baseTemperature = 22;
    const basePressure = 1019;
    const baseWind = 9;
    const baseDirection = 135; // ΝΑ for morning Master look

    // Locked Master hourly weather (08:00–14:00) to match MASTER_FINAL_REFERENCE
    const masterHourly = [
      { hour: 8,  condition: "clear",  temperature: 22, rainProbability: 0 },
      { hour: 9,  condition: "partly", temperature: 23, rainProbability: 0 },
      { hour: 10, condition: "partly", temperature: 24, rainProbability: 0 },
      { hour: 11, condition: "partly", temperature: 25, rainProbability: 0 },
      { hour: 12, condition: "cloudy", temperature: 25, rainProbability: 0 },
      { hour: 13, condition: "cloudy", temperature: 26, rainProbability: 0 },
      { hour: 14, condition: "partly", temperature: 26, rainProbability: 0 }
    ];

    const hourlyWeather = masterHourly.map((slot, index) => {
      const date = new Date(local.getFullYear(), local.getMonth(), local.getDate(), slot.hour, 0, 0);
      return {
        time: `${pad2(slot.hour)}:00`,
        iso: date.toISOString(),
        condition: slot.condition,
        label: CONDITION_META[slot.condition].description,
        temperature: slot.temperature,
        rainProbability: slot.rainProbability
      };
    });

    // Locked Master wind (matches MASTER_FINAL_REFERENCE)
    const masterWind = [
      { directionLabel: "ΝΑ",  directionDeg: 135, beaufort: 2, speedKmh: 9  },
      { directionLabel: "ΝΑ",  directionDeg: 135, beaufort: 2, speedKmh: 11 },
      { directionLabel: "Α",   directionDeg: 90,  beaufort: 3, speedKmh: 13 },
      { directionLabel: "Α",   directionDeg: 90,  beaufort: 3, speedKmh: 15 },
      { directionLabel: "Α",   directionDeg: 90,  beaufort: 3, speedKmh: 17 },
      { directionLabel: "ΑΝΑ", directionDeg: 67,  beaufort: 4, speedKmh: 21 },
      { directionLabel: "Δ",   directionDeg: 270, beaufort: 4, speedKmh: 24 }
    ];

    const wind = !state.provider
      ? masterWind.map((w, index) => ({ time: hourlyWeather[index].time, ...w }))
      : hourlyWeather.map((hour, index) => {
          const speed = clamp(baseWind + index * 2 + Math.round(Math.sin(index * 0.8) * 2), 4, 35);
          const directionDeg = mod(baseDirection + index * 10, 360);
          return {
            time: hour.time,
            directionDeg,
            directionLabel: windDirectionLabel(directionDeg),
            beaufort: kmhToBeaufort(speed),
            speedKmh: speed
          };
        });

    const pressureValues = hourlyWeather.map((_, index) => round(
      basePressure + Math.sin((index - 1) * 0.72) * 1.3,
      1
    ));
    const pressureDifference = pressureValues.at(-1) - pressureValues[0];
    const pressureTrend = Math.abs(pressureDifference) < 0.7
      ? "Σταθερή"
      : pressureDifference > 0 ? "Ανοδική" : "Πτωτική";

    const currents = hourlyWeather.map((hour, index) => {
      const speed = round(clamp(0.3 + index * 0.06 + Math.sin(index) * 0.04, 0.2, 0.9), 1);
      const directionDeg = mod(45 + index * 12, 360);
      return {
        time: hour.time,
        directionDeg,
        directionLabel: windDirectionLabel(directionDeg),
        speedKnots: speed
      };
    });

    const waveHeight = round(clamp(0.45 + Math.abs(dailyWave) * 0.25, 0.2, 1.3), 1);
    const wavePeriod = round(clamp(4.6 + Math.abs(Math.cos(local.getDate())) * 1.2, 3.5, 8), 1);
    const waterTemperature = clamp(baseTemperature - 3, 17, 28);
    const uvIndex = clamp(Math.round(4 + Math.sin((local.getMonth() + 1) / 12 * Math.PI) * 4), 1, 11);
    const rainProbability = hourlyWeather[0].rainProbability;
    const currentCondition = hourlyWeather[0].condition;

    // Master lock overrides for exact visual match
    if (!state.provider) {
      moon.illumination = 72;
      moon.phaseLabel = "Αύξουσα Αμφίκυρτη";
      moon.phaseKey = "waxing-gibbous";
      moon.rise = "13:28";
      moon.set = "01:02";
    }

    const pressureScore = 95;
    const moonScore = 78;
    const currentScore = 82;
    const tideScore = 88;
    const waveScore = 90;
    const windScore = 85;

    // Locked Master score = 85
    const score = !state.provider ? 85 : Math.round(
      pressureScore * 0.20
      + moonScore * 0.16
      + currentScore * 0.16
      + tideScore * 0.20
      + waveScore * 0.16
      + windScore * 0.12
    );

    const activity = !state.provider ? 88 : clamp(Math.round(score * 0.92 + moonScore * 0.08), 0, 100);

    // Locked Master best hours
    const morningStart = !state.provider ? "05:45" : addMinutesToTime(sun.rise, -30);
    const morningEnd   = !state.provider ? "07:45" : addMinutesToTime(sun.rise, 90);
    const eveningStart = !state.provider ? "18:10" : addMinutesToTime(sun.set, -117);
    const eveningEnd   = !state.provider ? "20:10" : addMinutesToTime(sun.set, 3);
    const nightStart   = !state.provider ? "23:10" : addMinutesToTime(moon.rise, -20);
    const nightEnd     = !state.provider ? "00:30" : addMinutesToTime(moon.rise, 80);

    // Locked Master techniques (match visual stars)
    const techniques = !state.provider ? {
      spinning:        { score: 90, rating: 5, label: "Εξαιρετικό" },
      lrf:             { score: 78, rating: 4, label: "Πολύ Καλό" },
      english:         { score: 62, rating: 3, label: "Καλό" },
      "shore-jigging": { score: 65, rating: 3, label: "Καλό" }
    } : Object.fromEntries(
      Object.entries({
        spinning: score + (wind[0].beaufort <= 4 ? 5 : -4),
        lrf: score - Math.max(0, wind[0].beaufort - 2) * 7,
        english: score - Math.max(0, waveHeight - 0.5) * 20,
        "shore-jigging": score + (currents[0].speedKnots >= 0.4 ? 2 : -3)
      }).map(([id, value]) => {
        const rating = ratingFromScore(clamp(value, 0, 100));
        return [id, { score: Math.round(value), rating, label: TECHNIQUE_LABELS[rating] }];
      })
    );

    const alerts = [
      {
        id: "spinning-window",
        tone: "green",
        status: "active",
        label: "Spinning: ιδανικό παράθυρο",
        time: `${hourlyWeather[0].time}–${hourlyWeather[Math.min(2, hourlyWeather.length - 1)].time}`
      },
      {
        id: "wind-increase",
        tone: "yellow",
        status: "upcoming",
        label: "Άνεμος: ενισχύεται μετά τις",
        time: hourlyWeather[Math.min(6, hourlyWeather.length - 1)].time
      },
      {
        id: "current-increase",
        tone: "orange",
        status: currents.at(-1).speedKnots >= 0.6 ? "upcoming" : "expired",
        label: "Ρεύματα: αυξάνονται μετά τις",
        time: hourlyWeather[Math.min(5, hourlyWeather.length - 1)].time
      },
      {
        id: "uv-high",
        tone: "blue",
        status: uvIndex >= 6 ? "active" : "expired",
        label: "UV: υψηλός δείκτης",
        time: "11:00–16:00"
      }
    ];

    return {
      source: "fallback-demo",
      generatedAt: now.toISOString(),
      location: deepClone(CONFIG.location),
      date: {
        iso: now.toISOString(),
        dayName: GREEK_DAYS[local.getDay()],
        day: local.getDate(),
        monthYear: `${GREEK_MONTHS[local.getMonth()]} ${local.getFullYear()}`
      },
      sun: !state.provider ? { rise: "06:17", set: "20:07" } : sun,
      weather: {
        temperature: !state.provider ? 22 : hourlyWeather[0].temperature,
        feelsLike: !state.provider ? 22 : hourlyWeather[0].temperature,
        humidity: !state.provider ? 56 : clamp(52 + Math.round(Math.abs(dailyWave) * 8), 42, 78),
        rainProbability: !state.provider ? 0 : rainProbability,
        uvIndex: !state.provider ? 6 : uvIndex,
        uvLabel: !state.provider ? "ΥΨΗΛΟΣ" : uvLabel(uvIndex),
        condition: !state.provider ? "clear" : currentCondition,
        label: !state.provider ? "ΗΛΙΟΦΑΝΕΙΑ" : CONDITION_META[currentCondition].label,
        description: !state.provider ? "Αίθριος ουρανός" : CONDITION_META[currentCondition].description
      },
      hourlyWeather,
      wind,
      pressure: {
        current: !state.provider ? 1019 : pressureValues[0],
        values: !state.provider ? [1019, 1019, 1019, 1019, 1019, 1019, 1019] : pressureValues,
        times: hourlyWeather.map((hour) => hour.time),
        trend: !state.provider ? "Σταθερή" : pressureTrend
      },
      moon,
      currents,
      sea: {
        waterTemperature: !state.provider ? 19 : waterTemperature,
        waveHeight: !state.provider ? 0.6 : waveHeight,
        wavePeriod: !state.provider ? 5 : wavePeriod,
        waveDirectionDeg: !state.provider ? 45 : baseDirection,
        waveDirectionLabel: !state.provider ? "ΒΑ" : windDirectionLabel(baseDirection)
      },
      tides: tide,
      bestTimes: {
        morning: `${morningStart}–${morningEnd}`,
        evening: `${eveningStart}–${eveningEnd}`,
        night: `${nightStart}–${nightEnd}`
      },
      fishing: {
        score,
        scoreLabel: scoreLabel(score),
        scoreStars: ratingFromScore(score),
        activity,
        activityLabel: activity >= 78
          ? "ΥΨΗΛΗ ΔΡΑΣΤΗΡΙΟΤΗΤΑ"
          : activity >= 55 ? "ΜΕΤΡΙΑ ΔΡΑΣΤΗΡΙΟΤΗΤΑ" : "ΧΑΜΗΛΗ ΔΡΑΣΤΗΡΙΟΤΗΤΑ",
        factors: !state.provider ? {
          moon: "ΚΑΛΗ",
          pressure: "ΙΔΑΝΙΚΗ",
          currents: "ΚΑΛΑ",
          tides: "ΠΟΛΥ ΚΑΛΗ",
          waves: "ΙΔΑΝΙΚΑ"
        } : {
          moon: evaluateFactor(moonScore, [82, 68, 52, 0], ["ΙΔΑΝΙΚΗ", "ΠΟΛΥ ΚΑΛΗ", "ΚΑΛΗ", "ΑΔΥΝΑΜΗ"]),
          pressure: evaluateFactor(pressureScore, [84, 68, 52, 0], ["ΙΔΑΝΙΚΗ", "ΠΟΛΥ ΚΑΛΗ", "ΚΑΛΗ", "ΑΔΥΝΑΜΗ"]),
          currents: evaluateFactor(currentScore, [84, 68, 52, 0], ["ΙΔΑΝΙΚΑ", "ΠΟΛΥ ΚΑΛΑ", "ΚΑΛΑ", "ΑΔΥΝΑΜΑ"]),
          tides: evaluateFactor(tideScore, [84, 68, 52, 0], ["ΙΔΑΝΙΚΗ", "ΠΟΛΥ ΚΑΛΗ", "ΚΑΛΗ", "ΑΔΥΝΑΜΗ"]),
          waves: evaluateFactor(waveScore, [84, 68, 52, 0], ["ΙΔΑΝΙΚΑ", "ΠΟΛΥ ΚΑΛΑ", "ΚΑΛΑ", "ΑΔΥΝΑΜΑ"])
        }
      },
      techniques,
      alerts
    };
  }

  /* =======================================================
     RENDERERS
  ======================================================= */

  function renderDate(data) {
    setText("#date-day-name", data.date.dayName);
    setText("#date-day-number", data.date.day);
    setText("#date-month-year", data.date.monthYear);
  }

  function renderWeatherScene(visual, condition) {
    const svg = $(".premium-weather-scene", visual);
    if (!svg) return;

    $("#fd-weather-overlay", svg)?.remove();
    const sunDisc = $('circle[fill="url(#fd-sun-disc)"]', svg);
    const sunGroup = sunDisc?.parentElement;
    if (sunGroup) sunGroup.style.opacity = condition === "night" ? "0" : "1";

    const namespace = "http://www.w3.org/2000/svg";
    const overlay = document.createElementNS(namespace, "g");
    overlay.id = "fd-weather-overlay";
    overlay.setAttribute("pointer-events", "none");

    const add = (name, attributes) => {
      const element = document.createElementNS(namespace, name);
      Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
      overlay.appendChild(element);
      return element;
    };

    if (["partly", "cloudy", "rain", "storm"].includes(condition)) {
      const opacity = condition === "partly" ? 0.86 : 0.96;
      add("path", {
        d: "M176 72c4-16 18-27 35-27 17 0 31 11 35 27 14 1 25 12 25 26 0 15-12 27-27 27h-69c-15 0-27-12-27-27 0-14 12-26 28-26Z",
        fill: condition === "storm" ? "#647a89" : "#b8cfda",
        stroke: "#e8f8ff",
        "stroke-width": 2,
        opacity
      });
      add("path", {
        d: "M199 72c4-10 13-17 24-17 10 0 20 7 23 17",
        fill: "none",
        stroke: "#ffffff",
        "stroke-opacity": 0.42,
        "stroke-width": 2
      });
    }

    if (condition === "rain") {
      [182, 207, 232, 257].forEach((x) => add("line", {
        x1: x, y1: 127, x2: x - 6, y2: 143,
        stroke: "#31c8ff", "stroke-width": 4, "stroke-linecap": "round"
      }));
    }

    if (condition === "storm") {
      add("path", {
        d: "M217 120 202 142h14l-8 15 27-29h-15l10-8Z",
        fill: "#ffd21f"
      });
    }

    if (condition === "night") {
      add("rect", { x: 0, y: 0, width: 330, height: 112, fill: "#010713", opacity: 0.68 });
      add("circle", { cx: 151, cy: 54, r: 27, fill: "#efd279" });
      add("circle", { cx: 164, cy: 44, r: 27, fill: "#04162b" });
      [[82, 24, 2.2], [112, 15, 1.6], [210, 22, 2], [254, 38, 1.6], [285, 17, 2.2]].forEach(([cx, cy, r]) => {
        add("circle", { cx, cy, r, fill: "#ffffff", opacity: 0.9 });
      });
    }

    svg.appendChild(overlay);
  }

  function renderWeather(data) {
    const weather = data.weather;
    setText("#weather-condition-label", weather.label);
    setText("#weather-temperature", Math.round(weather.temperature));
    setText("#weather-description", weather.description);
    setText("#weather-feels-like", `${Math.round(weather.feelsLike)}°C`);
    setText("#weather-humidity", `${Math.round(weather.humidity)}%`);
    setText("#weather-rain-probability", `${Math.round(weather.rainProbability)}%`);
    setText("#weather-uv", weather.uvLabel);
    setText("#sunrise-time", data.sun.rise);
    setText("#sunset-time", data.sun.set);

    const visual = $("#weather-visual");
    if (visual) {
      visual.dataset.condition = weather.condition;
      visual.setAttribute("aria-label", weather.description);

      renderWeatherScene(visual, weather.condition);
    }

    data.hourlyWeather.forEach((hour, index) => {
      const cell = $(`#hourly-weather-strip [data-hour-index="${index}"]`);
      if (!cell) return;
      setText("time", hour.time, cell);
      const time = $("time", cell);
      if (time) time.dateTime = hour.iso;
      setText("strong", CONDITION_META[hour.condition]?.description || hour.label, cell);
      setText("span", `${Math.round(hour.temperature)}°C`, cell);
      const use = $("svg use", cell);
      if (use) use.setAttribute("href", CONDITION_META[hour.condition]?.icon || "#weather-partly");
    });
  }

  function renderDirectionSeries(containerSelector, series, type) {
    series.forEach((item, index) => {
      const cell = $(`${containerSelector} [data-hour-index="${index}"]`);
      if (!cell) return;

      setText("time", item.time, cell);
      const arrow = $(".direction-arrow", cell);
      if (arrow) {
        const rotation = item.directionDeg - 45;
        arrow.dataset.directionDeg = String(item.directionDeg);
        arrow.style.setProperty("--direction-deg", `${rotation}deg`);
      }
      setText(".wind-dir", item.directionLabel, cell);

      if (type === "wind") {
        setText("strong", item.beaufort, cell);
        setText("small", `${Math.round(item.speedKmh)} km/h`, cell);
      } else {
        setText("strong", `${item.speedKnots.toFixed(1)} kn`, cell);
        setText("small", "", cell);
      }
    });
  }

  function chartPointData(values, width, height, padding, forcedMin = null, forcedMax = null) {
    const min = forcedMin ?? Math.min(...values);
    const max = forcedMax ?? Math.max(...values);
    const range = Math.max(max - min, 0.0001);
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    return values.map((value, index) => ({
      value,
      x: padding.left + (values.length === 1 ? 0 : index * innerWidth / (values.length - 1)),
      y: padding.top + (max - value) / range * innerHeight
    }));
  }

  function renderPressure(data) {
    const values = data.pressure.values;
    setText("#pressure-current", Math.round(data.pressure.current));
    setText("#pressure-trend", data.pressure.trend);

    const trend = $("#pressure-trend");
    if (trend) {
      trend.dataset.trend = data.pressure.trend === "Ανοδική"
        ? "rising"
        : data.pressure.trend === "Πτωτική" ? "falling" : "stable";
    }

    const points = chartPointData(values, 760, 150, { left: 38, right: 34, top: 28, bottom: 30 });
    const polyline = $("#pressure-line");
    const area = $("#pressure-area");
    const pointGroup = $("#pressure-points");
    const valueGroup = $("#pressure-values");

    if (polyline) {
      polyline.setAttribute("points", points.map((point) => `${round(point.x, 1)},${round(point.y, 1)}`).join(" "));
    }
    if (area) {
      area.setAttribute(
        "d",
        `M${round(points[0].x, 1)} ${round(120, 1)} L${points.map((point) => `${round(point.x, 1)} ${round(point.y, 1)}`).join(" L")} L${round(points.at(-1).x, 1)} 120 Z`
      );
    }
    if (pointGroup) {
      pointGroup.innerHTML = points.map((point, index) => (
        `<circle cx="${round(point.x, 1)}" cy="${round(point.y, 1)}" r="${index === 0 ? 6 : 4.4}" data-point-index="${index}"></circle>`
      )).join("");
    }
    if (valueGroup) {
      valueGroup.innerHTML = points.map((point, index) => (
        `<text x="${round(point.x, 1)}" y="${round(Math.max(13, point.y - 13), 1)}">${Math.round(values[index])}</text>`
      )).join("");
    }

    const times = $("#pressure-times");
    if (times) times.innerHTML = data.pressure.times.map((time) => `<span>${time}</span>`).join("");
  }

  function renderMoon(data) {
    const moon = data.moon;
    setText("#moon-illumination", `${moon.illumination}%`);
    setText("#moon-phase-label", moon.phaseLabel);
    setText("#moonrise-time", moon.rise);
    setText("#moonset-time", moon.set);

    const visual = $("#moon-visual");
    if (visual) {
      visual.dataset.phase = moon.phaseKey;
      visual.dataset.illumination = String(moon.illumination);
      visual.setAttribute("aria-label", `${moon.phaseLabel}, ${moon.illumination}% φωτισμένη`);
    }

    const shadow = $("#moon-shadow");
    if (shadow) {
      if (moon.phaseKey === "full") {
        shadow.setAttribute("opacity", "0");
      } else if (moon.phaseKey === "new") {
        shadow.setAttribute("cx", "60");
        shadow.setAttribute("rx", "48");
        shadow.setAttribute("opacity", ".98");
      } else {
        const waxing = moon.phaseFraction < 0.5;
        const lit = moon.illumination / 100;
        const rx = clamp(47 * (1 - lit), 3, 44);
        shadow.setAttribute("cx", waxing ? String(36 - lit * 16) : String(84 + lit * 16));
        shadow.setAttribute("rx", String(round(rx, 1)));
        shadow.setAttribute("opacity", ".94");
      }
    }
  }

  function renderSea(data) {
    setText("#wave-height", `${data.sea.waveHeight.toFixed(1)} m`);
    setText("#wave-period", `${data.sea.wavePeriod.toFixed(1)} s`);
    setText("#wave-direction-label", data.sea.waveDirectionLabel);
    setText("#water-temperature", `${Math.round(data.sea.waterTemperature)}°C`);

    const arrow = $("#wave-direction-arrow");
    if (arrow) {
      arrow.dataset.directionDeg = String(data.sea.waveDirectionDeg);
      arrow.style.setProperty("--direction-deg", `${data.sea.waveDirectionDeg - 45}deg`);
    }
  }

  function renderTides(data) {
    const tides = data.tides;
    setText("#next-low-tide-time", minutesToText(tides.nextLow.minutes));
    setText("#next-low-tide-height", `${tides.nextLow.height >= 0 ? "+" : "−"}${Math.abs(tides.nextLow.height).toFixed(2)} m`);
    setText("#next-high-tide-time", minutesToText(tides.nextHigh.minutes));
    setText("#next-high-tide-height", `${tides.nextHigh.height >= 0 ? "+" : "−"}${Math.abs(tides.nextHigh.height).toFixed(2)} m`);

    const values = tides.samples.map((sample) => sample.height);
    const points = chartPointData(values, 760, 190, { left: 20, right: 20, top: 22, bottom: 24 }, -0.25, 0.95);
    const line = $("#tide-line");
    const area = $("#tide-area");
    if (line) line.setAttribute("d", `M${points.map((point) => `${round(point.x, 1)} ${round(point.y, 1)}`).join(" L")}`);
    if (area) area.setAttribute("d", `M${points[0].x} 168 L${points.map((point) => `${round(point.x, 1)} ${round(point.y, 1)}`).join(" L")} L${points.at(-1).x} 168 Z`);

    const eventPoints = tides.events.map((event) => ({
      ...event,
      x: 20 + event.minutes / 1440 * 720,
      y: 22 + (0.95 - event.height) / 1.20 * 144
    }));

    const pointsGroup = $("#tide-points");
    if (pointsGroup) {
      pointsGroup.innerHTML = eventPoints.map((event) => (
        `<circle cx="${round(event.x, 1)}" cy="${round(event.y, 1)}" r="5.5"></circle>`
      )).join("");
    }

    const labelsGroup = $("#tide-labels");
    if (labelsGroup) {
      labelsGroup.innerHTML = eventPoints.map((event) => {
        const text = `${event.height >= 0 ? "+" : "−"}${Math.abs(event.height).toFixed(2)} m`;
        const y = event.type === "high" ? Math.max(12, event.y - 13) : Math.min(184, event.y + 22);
        return `<text class="${event.height < 0 ? "negative" : ""}" x="${round(event.x, 1)}" y="${round(y, 1)}">${text}</text>`;
      }).join("");
    }

    const nowLine = $("#tide-now-line");
    if (nowLine) {
      const x = 20 + tides.nowMinutes / 1440 * 720;
      nowLine.setAttribute("x1", String(round(x, 1)));
      nowLine.setAttribute("x2", String(round(x, 1)));
    }

    const times = $("#tide-times");
    if (times) {
      const labels = tides.events.map((event) => minutesToText(event.minutes));
      times.innerHTML = labels.map((label) => `<span>${label}</span>`).join("");
      times.style.gridTemplateColumns = `repeat(${labels.length},1fr)`;
    }
  }

  function renderBestTimes(data) {
    // Master format: ΠΡΩΙ / ΑΠΟΓΕΥΜΑ / ΝΥΧΤΑ labels
    const m = data.bestTimes.morning || "";
    const e = data.bestTimes.evening || "";
    const n = data.bestTimes.night || "";
    setText("#best-time-morning", m.startsWith("ΠΡΩΙ") ? m : `ΠΡΩΙ ${m}`);
    setText("#best-time-evening", e.startsWith("ΑΠΟΓΕΥΜΑ") ? e : `ΑΠΟΓΕΥΜΑ ${e}`);
    setText("#best-time-night", n.startsWith("ΝΥΧΤΑ") ? n : `ΝΥΧΤΑ ${n}`);
  }

  function renderStars(container, rating) {
    if (!container) return;
    const normalized = clamp(Math.round(rating), 1, 5);
    container.dataset.rating = String(normalized);
    container.setAttribute("aria-label", `${normalized} από 5 αστέρια`);
    container.innerHTML = Array.from({ length: 5 }, (_, index) => (
      `<i aria-hidden="true" class="fa-solid fa-star${index >= normalized ? " empty" : ""}"></i>`
    )).join("");
  }

  function renderFishingScore(data) {
    const score = clamp(data.fishing.score, 0, 100);
    setText("#fishing-score-value", score);
    setText("#fishing-score-label", data.fishing.scoreLabel);
    renderStars($("#fishing-score-stars"), data.fishing.scoreStars);

    const gauge = $("#fishing-score-gauge");
    if (gauge) {
      gauge.dataset.score = String(score);
      gauge.setAttribute("aria-label", `Fishing Score ${score}`);
    }

    const indicator = $("#score-rod-indicator");
    if (indicator) {
      const angle = -80 + score * 1.6;
      indicator.dataset.score = String(score);
      indicator.setAttribute("transform", `rotate(${round(angle, 2)} 150 170)`);
    }
  }

  function renderActivity(data) {
    const activity = clamp(data.fishing.activity, 0, 100);
    setText("#fish-activity-label", data.fishing.activityLabel);

    const meter = $("#fish-activity-meter");
    if (meter) {
      meter.dataset.activity = String(activity);
      meter.style.setProperty("--activity-percent", `${activity}%`);
      meter.setAttribute("aria-valuenow", String(activity));
      meter.setAttribute("aria-label", `Δραστηριότητα ψαριών ${activity}%`);
    }

    const factors = data.fishing.factors;
    Object.entries(factors).forEach(([key, value]) => {
      setText(`#fish-activity-factors [data-factor="${key}"] strong`, value);
    });
  }

  function renderAlerts(data) {
    const list = $("#fishing-alerts-list");
    if (!list) return;

    const activeAlerts = data.alerts.filter((alert) => alert.status !== "expired");
    const existing = new Map($$("li[data-alert-id]", list).map((item) => [item.dataset.alertId, item]));

    data.alerts.forEach((alert) => {
      const item = existing.get(alert.id);
      if (!item) return;
      item.dataset.alertStatus = alert.status;
      item.classList.remove("alert-green", "alert-yellow", "alert-orange", "alert-blue");
      item.classList.add(`alert-${alert.tone}`);
      const timeTarget = $("[data-field]", item);
      if (timeTarget) timeTarget.textContent = alert.time;
    });

    const empty = $("#fishing-alerts-empty");
    if (empty) empty.classList.toggle("visually-hidden", activeAlerts.length > 0);
  }

  function renderTechniques(data) {
    $$(".technique-card").forEach((card) => {
      const technique = data.techniques[card.dataset.technique];
      if (!technique) return;
      card.dataset.rating = String(technique.rating);
      renderStars($("[data-technique-stars]", card), technique.rating);
      setText("[data-technique-label]", technique.label, card);
    });
  }

  function renderData(data) {
    state.data = deepClone(data);
    document.documentElement.dataset.dataSource = data.source || "unknown";
    renderDate(data);
    renderWeather(data);
    renderDirectionSeries("#wind-strip", data.wind, "wind");
    renderPressure(data);
    renderMoon(data);
    renderDirectionSeries("#current-strip", data.currents, "currents");
    renderSea(data);
    renderTides(data);
    renderBestTimes(data);
    renderFishingScore(data);
    renderActivity(data);
    renderAlerts(data);
    renderTechniques(data);
    storageSet(STORAGE_KEYS.lastUpdated, data.generatedAt || new Date().toISOString());
    dispatch("render", { version: APP_VERSION, data: deepClone(data) });
  }

  /* =======================================================
     DATA PROVIDER / REFRESH
  ======================================================= */

  async function obtainData() {
    if (typeof state.provider === "function") {
      const result = await state.provider({
        location: deepClone(CONFIG.location),
        currentData: deepClone(state.data),
        version: APP_VERSION
      });
      if (!result || typeof result !== "object") {
        throw new TypeError("Ο πάροχος δεδομένων δεν επέστρεψε έγκυρο αντικείμενο.");
      }
      return result;
    }
    return buildDemoData(new Date());
  }

  async function refreshDashboard(options = {}) {
    if (state.refreshing) return state.data;

    state.refreshing = true;
    state.lastError = null;
    setBusy(true);

    const button = $(".refresh-button");
    if (button) {
      button.disabled = true;
      button.classList.add("is-rotating");
      button.setAttribute("aria-busy", "true");
    }

    try {
      const data = await obtainData();
      renderData(data);
      if (!options.silent) {
        showToast(
          data.source === "fallback-demo"
            ? "Το dashboard ανανεώθηκε με τα δεδομένα επίδειξης."
            : "Τα live δεδομένα ανανεώθηκαν.",
          "success"
        );
      }
      dispatch("refresh", { data: deepClone(data), source: data.source || "unknown" });
      return data;
    } catch (error) {
      state.lastError = error;
      console.error("Dashboard refresh failed:", error);
      if (!options.silent) showToast("Η ανανέωση απέτυχε. Διατηρούνται τα τελευταία δεδομένα.", "error", 3600);
      dispatch("error", { error: String(error?.message || error) });
      throw error;
    } finally {
      state.refreshing = false;
      setBusy(false);
      if (button) {
        button.disabled = false;
        button.classList.remove("is-rotating");
        button.removeAttribute("aria-busy");
      }
    }
  }

  /* =======================================================
     FAVORITE / NAVIGATION / TECHNIQUES
  ======================================================= */

  function applyFavorite(isFavorite, persist = true) {
    const button = $(".favorite-button");
    if (!button) return;
    button.classList.toggle("is-favorite", Boolean(isFavorite));
    button.setAttribute("aria-pressed", String(Boolean(isFavorite)));
    if (persist) storageSet(STORAGE_KEYS.favorite, String(Boolean(isFavorite)));
  }

  function initializeFavorite() {
    const button = $(".favorite-button");
    if (!button) return;
    applyFavorite(storageGet(STORAGE_KEYS.favorite, "false") === "true", false);
    button.addEventListener("click", () => {
      const next = !button.classList.contains("is-favorite");
      applyFavorite(next);
      showToast(next ? "Η Κάλυμνος προστέθηκε στα αγαπημένα." : "Η Κάλυμνος αφαιρέθηκε από τα αγαπημένα.", next ? "success" : "info");
    });
  }

  function setActiveNavigation(button, notify = true) {
    const buttons = $$(".nav-item");
    if (!button || !buttons.includes(button)) return;

    buttons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-current", active ? "page" : "false");
    });

    const label = $("span", button)?.textContent?.trim() || "DASHBOARD";
    storageSet(STORAGE_KEYS.activeNav, label);
    if (notify && label !== "DASHBOARD") {
      showToast(`Η ενότητα «${label}» θα ενεργοποιηθεί σε επόμενη έκδοση.`);
    }
  }

  function initializeNavigation() {
    const buttons = $$(".nav-item");
    buttons.forEach((button) => button.addEventListener("click", () => {
      if (Date.now() < state.suppressClickUntil || state.editMode) return;
      setActiveNavigation(button);
    }));

    const saved = storageGet(STORAGE_KEYS.activeNav, "DASHBOARD");
    const target = buttons.find((button) => $("span", button)?.textContent?.trim() === saved) || buttons[0];
    setActiveNavigation(target, false);
  }

  function setSelectedTechnique(card, notify = true) {
    const cards = $$(".technique-card");
    if (!card || !cards.includes(card)) return;

    cards.forEach((item) => {
      const selected = item === card;
      item.classList.toggle("selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    const id = card.dataset.technique;
    storageSet(STORAGE_KEYS.technique, id);
    if (notify) {
      const label = $("strong", card)?.textContent?.trim() || id;
      showToast(`Επιλέχθηκε τεχνική: ${label}`, "success");
    }
    dispatch("techniquechange", { techniqueId: id });
  }

  function initializeTechniques() {
    const cards = $$(".technique-card");
    cards.forEach((card) => card.addEventListener("click", () => {
      if (Date.now() < state.suppressClickUntil || state.editMode) return;
      setSelectedTechnique(card);
    }));

    const saved = storageGet(STORAGE_KEYS.technique, "spinning");
    const target = cards.find((card) => card.dataset.technique === saved)
      || cards.find((card) => card.classList.contains("selected"))
      || cards[0];
    setSelectedTechnique(target, false);
  }

  /* =======================================================
     HORIZONTAL TOUCH / MOUSE SCROLL
  ======================================================= */

  function initializeHorizontalScroll() {
    $$(".hourly-strip, .technique-scroll").forEach((strip) => {
      let dragging = false;
      let startX = 0;
      let startScrollLeft = 0;
      let moved = false;

      strip.addEventListener("pointerdown", (event) => {
        if (state.editMode || event.button !== 0) return;
        dragging = true;
        moved = false;
        startX = event.clientX;
        startScrollLeft = strip.scrollLeft;
        strip.setPointerCapture?.(event.pointerId);
      });

      strip.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        const distance = event.clientX - startX;
        if (Math.abs(distance) > 4) {
          moved = true;
          strip.classList.add("is-drag-scrolling");
        }
        strip.scrollLeft = startScrollLeft - distance;
      });

      const stop = (event) => {
        if (!dragging) return;
        dragging = false;
        strip.classList.remove("is-drag-scrolling");
        if (moved) state.suppressClickUntil = Date.now() + 280;
        if (event?.pointerId !== undefined && strip.hasPointerCapture?.(event.pointerId)) {
          strip.releasePointerCapture(event.pointerId);
        }
      };

      strip.addEventListener("pointerup", stop);
      strip.addEventListener("pointercancel", stop);
      strip.addEventListener("lostpointercapture", stop);
      strip.addEventListener("wheel", (event) => {
        if (strip.scrollWidth <= strip.clientWidth || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        strip.scrollLeft += event.deltaY;
      }, { passive: false });
    });
  }

  /* =======================================================
     LAYOUT EDITING / DRAG / SIZE
  ======================================================= */

  function getDashboardContent() {
    return $(".dashboard-content");
  }

  function getLayoutBlocks() {
    const content = getDashboardContent();
    if (!content) return [];
    return [...content.children].filter((child) => child.matches("section") && !child.matches(".bottom-navigation"));
  }

  function layoutBlockId(block, index = 0) {
    return block.dataset.layoutGroup
      || block.dataset.widget
      || block.dataset.masterSection
      || `block-${index}`;
  }

  function decorateLayoutBlocks() {
    getLayoutBlocks().forEach((block, index) => {
      block.classList.add("fd-layout-block");
      block.dataset.layoutId = layoutBlockId(block, index);
      if ($(":scope > .fd-layout-controls", block)) return;

      const controls = document.createElement("div");
      controls.className = "fd-layout-controls";

      const move = document.createElement("button");
      move.type = "button";
      move.className = "fd-layout-control fd-move-control";
      move.setAttribute("aria-label", "Μετακίνηση ενότητας");
      move.innerHTML = '<i class="fa-solid fa-up-down-left-right" aria-hidden="true"></i>';

      const size = document.createElement("button");
      size.type = "button";
      size.className = "fd-layout-control fd-size-control";
      size.setAttribute("aria-label", "Αλλαγή μεγέθους");
      size.innerHTML = '<i class="fa-solid fa-expand" aria-hidden="true"></i>';
      size.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        cycleBlockSize(block);
      });

      controls.append(move, size);
      block.appendChild(controls);
    });
  }

  function normalizeSize(value) {
    return SIZE_SEQUENCE.includes(value) ? value : "wide";
  }

  function setBlockSize(block, size, persist = true) {
    if (!block) return;
    const normalized = normalizeSize(size);
    block.dataset.size = normalized;
    block.classList.remove("size-compact", "size-half", "size-wide");
    block.classList.add(`size-${normalized}`);
    if (persist) saveLayout();
    dispatch("widgetsizechange", { layoutId: block.dataset.layoutId, size: normalized });
  }

  function cycleBlockSize(block) {
    const current = normalizeSize(block.dataset.size || "wide");
    const next = SIZE_SEQUENCE[(SIZE_SEQUENCE.indexOf(current) + 1) % SIZE_SEQUENCE.length];
    setBlockSize(block, next);
    const labels = { compact: "μικρό", half: "μεσαίο", wide: "πλήρες" };
    showToast(`Μέγεθος ενότητας: ${labels[next]}.`, "success", 1400);
  }

  function saveLayout() {
    const order = getLayoutBlocks().map((block, index) => layoutBlockId(block, index));
    const sizes = Object.fromEntries(getLayoutBlocks().map((block, index) => [
      layoutBlockId(block, index),
      normalizeSize(block.dataset.size || "wide")
    ]));
    storageSet(STORAGE_KEYS.layoutOrder, JSON.stringify(order));
    storageSet(STORAGE_KEYS.widgetSizes, JSON.stringify(sizes));
  }

  function restoreLayout() {
    const content = getDashboardContent();
    if (!content) return;

    const blocks = getLayoutBlocks();
    const map = new Map(blocks.map((block, index) => [layoutBlockId(block, index), block]));
    const order = safeJsonParse(storageGet(STORAGE_KEYS.layoutOrder, "[]"), []);
    const sizes = safeJsonParse(storageGet(STORAGE_KEYS.widgetSizes, "{}"), {});
    const navigation = $(".bottom-navigation", content);

    if (Array.isArray(order)) {
      order.forEach((id) => {
        const block = map.get(id);
        if (block) content.insertBefore(block, navigation || null);
      });
    }

    getLayoutBlocks().forEach((block, index) => {
      const id = layoutBlockId(block, index);
      if (sizes[id]) setBlockSize(block, sizes[id], false);
    });
  }

  function resetLayout() {
    storageRemove(STORAGE_KEYS.layoutOrder);
    storageRemove(STORAGE_KEYS.widgetSizes);
    showToast("Επαναφέρεται η αρχική διάταξη.", "warning", 1200);
    setTimeout(() => location.reload(), 360);
  }

  function createEditToolbar() {
    let toolbar = $("#fd-edit-toolbar");
    if (toolbar) return toolbar;

    toolbar = document.createElement("div");
    toolbar.id = "fd-edit-toolbar";
    toolbar.className = "fd-edit-toolbar";
    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Εργαλεία διάταξης");

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Αποθήκευση";
    saveButton.addEventListener("click", () => setEditMode(false));

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.textContent = "Επαναφορά";
    resetButton.addEventListener("click", resetLayout);

    const helpButton = document.createElement("button");
    helpButton.type = "button";
    helpButton.textContent = "Βοήθεια";
    helpButton.addEventListener("click", () => showToast(
      "Σύρε από το εικονίδιο μετακίνησης. Πάτησε το εικονίδιο μεγέθους για αλλαγή.",
      "info",
      4200
    ));

    toolbar.append(saveButton, resetButton, helpButton);
    document.body.appendChild(toolbar);
    return toolbar;
  }

  function syncMenuButton() {
    const button = $(".menu-button");
    if (!button) return;
    button.classList.toggle("is-active", state.editMode);
    button.setAttribute("aria-pressed", String(state.editMode));
    button.setAttribute("aria-label", state.editMode ? "Ολοκλήρωση διάταξης" : "Μενού διάταξης");
    const icon = $("i", button);
    if (icon) icon.className = state.editMode ? "fa-solid fa-check" : "fa-solid fa-bars";
  }

  function setEditMode(enabled, notify = true) {
    state.editMode = Boolean(enabled);
    document.body.classList.toggle("fd-edit-mode", state.editMode);
    getLayoutBlocks().forEach((block) => block.classList.toggle("is-editing", state.editMode));
    createEditToolbar().classList.toggle("is-visible", state.editMode);
    syncMenuButton();

    if (!state.editMode) saveLayout();
    if (notify) {
      showToast(
        state.editMode ? "Λειτουργία διάταξης ενεργή." : "Η διάταξη αποθηκεύτηκε.",
        state.editMode ? "warning" : "success"
      );
    }
  }

  function clearDropTargets() {
    getLayoutBlocks().forEach((block) => block.classList.remove("fd-drop-target"));
  }

  function findDropTarget(x, y, dragged) {
    return getLayoutBlocks().find((block) => {
      if (block === dragged) return false;
      const rect = block.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }) || null;
  }

  function moveRelative(dragged, target, clientY) {
    if (!dragged || !target || dragged === target) return;
    const rect = target.getBoundingClientRect();
    const after = clientY > rect.top + rect.height / 2;
    target.parentNode.insertBefore(dragged, after ? target.nextSibling : target);
  }

  function initializeLayoutDrag() {
    const content = getDashboardContent();
    if (!content) return;

    content.addEventListener("pointerdown", (event) => {
      if (!state.editMode) return;
      const moveButton = event.target.closest(".fd-move-control");
      const block = event.target.closest(".fd-layout-block");
      if (!moveButton || !block) return;

      state.pointerDrag = {
        pointerId: event.pointerId,
        block,
        startX: event.clientX,
        startY: event.clientY,
        moved: false
      };
      block.classList.add("fd-pointer-dragging");
      block.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });

    content.addEventListener("pointermove", (event) => {
      const drag = state.pointerDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) drag.moved = true;

      clearDropTargets();
      const target = findDropTarget(event.clientX, event.clientY, drag.block);
      if (target) {
        target.classList.add("fd-drop-target");
        moveRelative(drag.block, target, event.clientY);
      }

      if (event.clientY < 70) window.scrollBy(0, -12);
      if (event.clientY > innerHeight - 70) window.scrollBy(0, 12);
      event.preventDefault();
    });

    const end = (event) => {
      const drag = state.pointerDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      drag.block.classList.remove("fd-pointer-dragging");
      if (drag.block.hasPointerCapture?.(event.pointerId)) drag.block.releasePointerCapture(event.pointerId);
      if (drag.moved) {
        state.suppressClickUntil = Date.now() + 350;
        saveLayout();
        showToast("Η νέα σειρά αποθηκεύτηκε.", "success", 1500);
      }
      clearDropTargets();
      state.pointerDrag = null;
    };

    content.addEventListener("pointerup", end);
    content.addEventListener("pointercancel", end);
  }

  function initializeMenuButton() {
    const button = $(".menu-button");
    if (!button) return;
    button.addEventListener("click", () => setEditMode(!state.editMode));

    let timer = null;
    button.addEventListener("pointerdown", () => {
      timer = setTimeout(resetLayout, 1500);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((name) => {
      button.addEventListener(name, () => clearTimeout(timer));
    });
  }

  /* =======================================================
     APP LIFECYCLE
  ======================================================= */

  function validateMarkup() {
    const selectors = [
      ".dashboard-content",
      ".menu-button",
      ".favorite-button",
      ".refresh-button",
      "#pressure-chart",
      "#tide-chart",
      "#score-rod-indicator",
      "#fish-activity-meter",
      ".technique-grid",
      ".bottom-navigation"
    ];
    const missing = selectors.filter((selector) => !$(selector));
    if (missing.length) console.warn("Missing master selectors:", missing);
    return missing;
  }

  function initializeRefreshButton() {
    $(".refresh-button")?.addEventListener("click", () => refreshDashboard());
  }

  function initializeVisibilityHandling() {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshDashboard({ silent: true }).catch(() => {});
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) refreshDashboard({ silent: true }).catch(() => {});
    });
  }

  function initializeKeyboard() {
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") {
        event.preventDefault();
        refreshDashboard();
      }
      if (event.key === "Escape" && state.editMode) setEditMode(false);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && state.editMode) {
        event.preventDefault();
        setEditMode(false);
      }
    });
  }

  function initializeResizeObserver() {
    if (!("ResizeObserver" in window)) return;
    const shell = $(".app-shell");
    if (!shell) return;
    state.resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      document.documentElement.style.setProperty("--fd-shell-width-runtime", `${Math.round(entry.contentRect.width)}px`);
    });
    state.resizeObserver.observe(shell);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.info("Service worker is not active yet:", error?.message || error);
    });
  }

  function initializeApp() {
    if (state.initialized) return;
    state.initialized = true;

    injectRuntimeStyles();
    validateMarkup();
    restoreLayout();
    decorateLayoutBlocks();
    createEditToolbar();

    initializeFavorite();
    initializeNavigation();
    initializeTechniques();
    initializeHorizontalScroll();
    initializeMenuButton();
    initializeLayoutDrag();
    initializeRefreshButton();
    initializeVisibilityHandling();
    initializeKeyboard();
    initializeResizeObserver();
    registerServiceWorker();

    refreshDashboard({ silent: true }).catch(() => {
      const fallback = buildDemoData(new Date());
      renderData(fallback);
    });

    state.clockTimer = setInterval(() => {
      const current = buildDemoData(new Date());
      renderDate(current);
    }, CONFIG.clockIntervalMs);

    state.autoRefreshTimer = setInterval(() => {
      refreshDashboard({ silent: true }).catch(() => {});
    }, CONFIG.refreshIntervalMs);

    window.addEventListener("beforeunload", saveLayout);

    dispatch("ready", {
      version: APP_VERSION,
      source: state.data?.source || "initializing"
    });
  }

  window.FishingDashboard = Object.freeze({
    version: APP_VERSION,
    config: CONFIG,
    get data() {
      return deepClone(state.data);
    },
    get isEditMode() {
      return state.editMode;
    },
    get lastError() {
      return state.lastError;
    },
    refresh: refreshDashboard,
    render(data) {
      if (!data || typeof data !== "object") throw new TypeError("Μη έγκυρα δεδομένα dashboard.");
      renderData(data);
      return this.data;
    },
    registerProvider(provider) {
      if (provider !== null && typeof provider !== "function") {
        throw new TypeError("Ο provider πρέπει να είναι συνάρτηση ή null.");
      }
      state.provider = provider;
      dispatch("providerchange", { active: Boolean(provider) });
    },
    useDemoProvider() {
      state.provider = null;
      return refreshDashboard();
    },
    buildDemoData(date = new Date()) {
      return buildDemoData(date);
    },
    showMessage: showToast,
    setEditMode,
    saveLayout,
    resetLayout,
    exportLayout() {
      return {
        order: safeJsonParse(storageGet(STORAGE_KEYS.layoutOrder, "[]"), []),
        sizes: safeJsonParse(storageGet(STORAGE_KEYS.widgetSizes, "{}"), {})
      };
    },
    importLayout(layout) {
      if (!layout || typeof layout !== "object") throw new TypeError("Μη έγκυρη διάταξη.");
      if (Array.isArray(layout.order)) storageSet(STORAGE_KEYS.layoutOrder, JSON.stringify(layout.order));
      if (layout.sizes && typeof layout.sizes === "object") storageSet(STORAGE_KEYS.widgetSizes, JSON.stringify(layout.sizes));
      location.reload();
    },
    setWidgetSize(layoutId, size) {
      const block = getLayoutBlocks().find((item) => item.dataset.layoutId === layoutId || layoutBlockId(item) === layoutId);
      if (block) setBlockSize(block, size);
    },
    selectTechniqueById(id) {
      const card = $(`.technique-card[data-technique="${CSS.escape(String(id))}"]`);
      if (card) setSelectedTechnique(card);
    },
    selectNavigation(label) {
      const button = $$(".nav-item").find((item) => $("span", item)?.textContent?.trim() === label);
      if (button) setActiveNavigation(button);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
  } else {
    initializeApp();
  }
})();
