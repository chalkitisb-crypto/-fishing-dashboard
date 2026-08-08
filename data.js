/* Fishing Dashboard — Stage 1 data layer
   Primary: Open-Meteo | Secondary (later): Poseidon HCMR
*/
(function (global) {
  "use strict";

  var DEFAULT = { lat: 36.95, lon: 26.98, name: "Κάλυμνος" };
  var CACHE_KEY = "fd-last-data-v1";

  var WMO = {
    0: { lab: "Αίθριος", cond: "ΗΛΙΟΦΑΝΕΙΑ", ico: "ico_wx_sun.png" },
    1: { lab: "Σχεδόν αίθριος", cond: "ΗΛΙΟΦΑΝΕΙΑ", ico: "ico_wx_sun.png" },
    2: { lab: "Αραιή", cond: "ΑΡΑΙΗ ΣΥΝΝΕΦΙΑ", ico: "ico_wx_partly.png" },
    3: { lab: "Συννεφιά", cond: "ΣΥΝΝΕΦΙΑ", ico: "ico_wx_cloud.png" },
    45: { lab: "Ομίχλη", cond: "ΟΜΙΧΛΗ", ico: "ico_wx_haze.png" },
    48: { lab: "Ομίχλη", cond: "ΟΜΙΧΛΗ", ico: "ico_wx_haze.png" },
    51: { lab: "Ψιχάλα", cond: "ΨΙΧΑΛΑ", ico: "ico_wx_rain.png" },
    61: { lab: "Βροχή", cond: "ΒΡΟΧΗ", ico: "ico_wx_rain.png" },
    63: { lab: "Βροχή", cond: "ΒΡΟΧΗ", ico: "ico_wx_rain.png" },
    65: { lab: "Ισχυρή βροχή", cond: "ΒΡΟΧΗ", ico: "ico_wx_rain.png" },
    80: { lab: "Μπόρα", cond: "ΜΠΟΡΑ", ico: "ico_wx_rain.png" },
    95: { lab: "Καταιγίδα", cond: "ΚΑΤΑΙΓΙΔΑ", ico: "ico_wx_storm.png" },
    96: { lab: "Καταιγίδα", cond: "ΚΑΤΑΙΓΙΔΑ", ico: "ico_wx_storm.png" },
    99: { lab: "Καταιγίδα", cond: "ΚΑΤΑΙΓΙΔΑ", ico: "ico_wx_storm.png" }
  };

  var DOW = ["ΚΥΡΙΑΚΗ","ΔΕΥΤΕΡΑ","ΤΡΙΤΗ","ΤΕΤΑΡΤΗ","ΠΕΜΠΤΗ","ΠΑΡΑΣΚΕΥΗ","ΣΑΒΒΑΤΟ"];
  var MON = ["ΙΑΝΟΥΑΡΙΟΥ","ΦΕΒΡΟΥΑΡΙΟΥ","ΜΑΡΤΙΟΥ","ΑΠΡΙΛΙΟΥ","ΜΑΪΟΥ","ΙΟΥΝΙΟΥ","ΙΟΥΛΙΟΥ","ΑΥΓΟΥΣΤΟΥ","ΣΕΠΤΕΜΒΡΙΟΥ","ΟΚΤΩΒΡΙΟΥ","ΝΟΕΜΒΡΙΟΥ","ΔΕΚΕΜΒΡΙΟΥ"];

  function wmo(code) {
    return WMO[code] || WMO[Math.floor(code / 10) * 10] || { lab: "—", cond: "—", ico: "ico_wx_partly.png" };
  }

  function degToCompass(deg) {
    var dirs = ["Β","ΒΒΑ","ΒΑ","ΑΒΑ","Α","ΑΝΑ","ΝΑ","ΝΝΑ","Ν","ΝΝΔ","ΝΔ","ΔΝΔ","Δ","ΔΒΔ","ΒΔ","ΒΒΔ"];
    return dirs[Math.round(((deg % 360) / 22.5)) % 16];
  }

  function kmhToBf(kmh) {
    if (kmh < 1) return 0;
    if (kmh < 6) return 1;
    if (kmh < 12) return 2;
    if (kmh < 20) return 3;
    if (kmh < 29) return 4;
    if (kmh < 39) return 5;
    if (kmh < 50) return 6;
    if (kmh < 62) return 7;
    if (kmh < 75) return 8;
    if (kmh < 89) return 9;
    if (kmh < 103) return 10;
    if (kmh < 118) return 11;
    return 12;
  }

  function bfClass(bf) {
    if (bf <= 2) return "g";
    if (bf <= 3) return "g";
    if (bf <= 4) return "o";
    return "r";
  }

  function uvLabel(u) {
    if (u < 3) return Math.round(u) + " ΧΑΜΗΛΟΣ";
    if (u < 6) return Math.round(u) + " ΜΕΤΡΙΟΣ";
    if (u < 8) return Math.round(u) + " ΥΨΗΛΟΣ";
    if (u < 11) return Math.round(u) + " ΠΟΛΥ ΥΨΗΛΟΣ";
    return Math.round(u) + " ΑΚΡΑΙΟΣ";
  }

  function hhmm(iso) {
    if (!iso) return "—";
    var p = iso.split("T")[1] || iso;
    return p.slice(0, 5);
  }

  function saveCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: data })); } catch (e) {}
  }

  function loadCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.data) return null;
      return o;
    } catch (e) { return null; }
  }

  function buildUrls(lat, lon) {
    var base = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,uv_index" +
      "&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,precipitation_probability" +
      "&daily=sunrise,sunset,uv_index_max&timezone=Europe%2FAthens&forecast_days=2";
    var marine = "https://marine-api.open-meteo.com/v1/marine?latitude=" + lat + "&longitude=" + lon +
      "&hourly=wave_height,wave_period,wave_direction,sea_surface_temperature&timezone=Europe%2FAthens&forecast_days=1";
    return { forecast: base, marine: marine };
  }

  function normalize(forecast, marine, loc) {
    var c = forecast.current || {};
    var h = forecast.hourly || {};
    var d = forecast.daily || {};
    var now = new Date();
    var meta = wmo(c.weather_code);

    var weatherHours = [];
    var windHours = [];
    var pressurePts = [];
    var pressureTimes = [];
    var i, t, code, spd, dir, bf;

    var startIdx = 0;
    if (h.time) {
      for (i = 0; i < h.time.length; i++) {
        if (new Date(h.time[i]).getTime() >= now.getTime() - 30 * 60 * 1000) { startIdx = i; break; }
      }
    }

    for (i = startIdx; i < Math.min(startIdx + 12, (h.time || []).length); i++) {
      t = hhmm(h.time[i]);
      code = h.weather_code[i];
      var wm = wmo(code);
      weatherHours.push({
        t: t,
        ico: wm.ico,
        lab: wm.lab,
        temp: Math.round(h.temperature_2m[i])
      });
      spd = h.wind_speed_10m[i];
      dir = h.wind_direction_10m[i];
      bf = kmhToBf(spd);
      windHours.push({
        t: t,
        deg: dir,
        dir: degToCompass(dir),
        bf: bf,
        cls: bfClass(bf)
      });
      pressurePts.push(h.pressure_msl[i]);
      pressureTimes.push(t);
    }

    var mh = (marine && marine.hourly) || {};
    var mi = 0;
    if (mh.time) {
      for (i = 0; i < mh.time.length; i++) {
        if (new Date(mh.time[i]).getTime() >= now.getTime() - 30 * 60 * 1000) { mi = i; break; }
      }
    }

    var sea = {
      wave: mh.wave_height ? mh.wave_height[mi] : null,
      period: mh.wave_period ? mh.wave_period[mi] : null,
      dirDeg: mh.wave_direction ? mh.wave_direction[mi] : null,
      waterTemp: mh.sea_surface_temperature ? mh.sea_surface_temperature[mi] : null
    };

    // currents: Stage1 placeholder from wind proxy until Poseidon
    var currentHours = windHours.map(function (w) {
      return {
        t: w.t,
        deg: w.deg,
        dir: w.dir,
        kn: (Math.max(0.1, w.bf * 0.15)).toFixed(1),
        cls: w.cls,
        proxy: true
      };
    });

    return {
      source: "open-meteo",
      poseidon: null,
      location: loc,
      fetchedAt: now.toISOString(),
      date: {
        dow: DOW[now.getDay()],
        day: String(now.getDate()),
        mon: MON[now.getMonth()] + "<br/>" + now.getFullYear()
      },
      current: {
        temp: Math.round(c.temperature_2m),
        feels: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        rain: c.precipitation,
        weatherCode: c.weather_code,
        cond: meta.cond,
        desc: meta.lab,
        windKmh: c.wind_speed_10m,
        windDir: c.wind_direction_10m,
        windGust: c.wind_gusts_10m,
        pressure: c.pressure_msl,
        uv: c.uv_index
      },
      sun: {
        rise: hhmm((d.sunrise || [])[0]),
        set: hhmm((d.sunset || [])[0])
      },
      uvMax: (d.uv_index_max || [])[0],
      weatherHours: weatherHours,
      windHours: windHours,
      currentHours: currentHours,
      pressurePts: pressurePts,
      pressureTimes: pressureTimes,
      sea: sea
    };
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function getLocation() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) {
        resolve(DEFAULT);
        return;
      }
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; resolve(DEFAULT); }
      }, 4000);
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            name: "Η τοποθεσία μου"
          });
        },
        function () {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(DEFAULT);
        },
        { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 }
      );
    });
  }

  function fetchDashboard(loc) {
    loc = loc || DEFAULT;
    var urls = buildUrls(loc.lat, loc.lon);
    return Promise.all([
      fetchJson(urls.forecast),
      fetchJson(urls.marine).catch(function () { return null; })
    ]).then(function (pair) {
      var data = normalize(pair[0], pair[1], loc);
      saveCache(data);
      return data;
    });
  }

  /** Public API */
  global.FDData = {
    DEFAULT: DEFAULT,
    getLocation: getLocation,
    fetchDashboard: fetchDashboard,
    loadCache: loadCache,
    degToCompass: degToCompass,
    kmhToBf: kmhToBf,
    uvLabel: uvLabel,
    /* Poseidon hook — Stage 1 stub */
    fetchPoseidon: function () {
      return Promise.resolve(null);
    }
  };
})(window);
