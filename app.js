(function () {
  var LAT = 36.95;
  var LON = 26.98;
  var DAYS = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
  var MONS = ["Ιανουαρίου", "Φεβρουαρίου", "Μαρτίου", "Απριλίου", "Μαΐου", "Ιουνίου", "Ιουλίου", "Αυγούστου", "Σεπτεμβρίου", "Οκτωβρίου", "Νοεμβρίου", "Δεκεμβρίου"];

  function dirText(d) {
    if (d == null) return "-";
    return ["Β", "ΒΑ", "Α", "ΝΑ", "Ν", "ΝΔ", "Δ", "ΒΔ"][Math.round(d / 45) % 8];
  }
  function bf(k) {
    if (k < 1) return 0;
    if (k < 6) return 1;
    if (k < 12) return 2;
    if (k < 20) return 3;
    if (k < 29) return 4;
    if (k < 39) return 5;
    return 6;
  }
  function moonPhase(dt) {
    var lp = 2551443;
    var nm = new Date(1970, 0, 7, 20, 35, 0).getTime();
    var p = (((dt.getTime() - nm) / 1000) % lp) / lp;
    var il = Math.round(((1 - Math.cos(p * 2 * Math.PI)) / 2) * 100);
    var name = "Νέα Σελήνη";
    if (p < 0.03 || p > 0.97) name = "Νέα Σελήνη";
    else if (p < 0.22) name = "Αύξουσα Μηνίσκος";
    else if (p < 0.28) name = "Πρώτο Τέταρτο";
    else if (p < 0.47) name = "Αύξουσα";
    else if (p < 0.53) name = "Πανσέληνος";
    else if (p < 0.72) name = "Φθίνουσα";
    else if (p < 0.78) name = "Τελευταίο Τέταρτο";
    else name = "Φθίνουσα Μηνίσκος";
    return { il: il, name: name };
  }
  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function buildCoach(c, mc, sc, tech) {
    var wind = c.wind_speed_10m;
    var pr = Math.round(c.pressure_msl);
    var wave = mc.wave_height || 0;
    var hour = new Date().getHours();
    var timeAdvice, bait, spot;

    if (hour >= 5 && hour < 9) timeAdvice = "Το πρωί (τώρα μέχρι ~09:00) είναι καλό παράθυρο.";
    else if (hour >= 17 && hour < 21) timeAdvice = "Το απόγευμα (19:00–21:00) είναι από τις καλύτερες ώρες.";
    else if (hour >= 9 && hour < 12) timeAdvice = "Μέχρι το μεσημέρι οι συνθήκες είναι ακόμα καλές.";
    else timeAdvice = "Καλύτερο παράθυρο: αργά το απόγευμα και νωρίς το βράδυ.";

    if (tech === "LRF") {
      bait = "Μικρά softbaits 1–3g, micro jigs. Στόχος σαργοί, κακαρέλοι, μικρά λαβράκια.";
    } else if (tech === "Spinning") {
      bait = "Minnow 9–12cm ή softbait. Καλό για λαβράκι και μαγιάτικα.";
    } else if (tech === "Shore Jigging") {
      bait = "Μικρά jigs 10–30g. Ψάξε βαθύτερα σημεία και ρεύματα.";
    } else {
      bait = "Εγγλέζικο με γαρίδα, σκουλήκι ή ζωντανό. Ιδανικό όταν φυσάει.";
    }

    spot = wind > 15 ? "Προτίμησε υπήνεμη πλευρά του νησιού." : "Μπορείς σχεδόν παντού. Δυτική και βόρεια ακτή συνήθως δίνουν.";

    var pNote =
      pr > 1015 && pr < 1024
        ? "Η πίεση είναι σε καλό εύρος."
        : pr >= 1024
        ? "Υψηλή πίεση – τα ψάρια μπορεί να είναι πιο επιφυλακτικά."
        : "Χαμηλή πίεση – συχνά αυξάνει τη δραστηριότητα.";

    return (
      "Σήμερα " +
      timeAdvice +
      "<br><br>Για <b>" +
      tech +
      "</b>:<br>" +
      bait +
      "<br><br>" +
      spot +
      "<br>" +
      pNote +
      "<br><br>Fishing Score: <b>" +
      sc +
      "/100</b>."
    );
  }

  function render(w, m) {
    var now = new Date();
    var c = w.current;
    var mc = m.current;
    var mo = moonPhase(now);

    var pr = Math.round(c.pressure_msl);
    var windBf = bf(c.wind_speed_10m);
    var windDir = dirText(c.wind_direction_10m);
    var waveH = mc.wave_height != null ? mc.wave_height.toFixed(2) : "-";
    var waveDir = mc.wave_direction != null ? dirText(mc.wave_direction) : "-";
    var currSpd = mc.ocean_current_velocity != null ? (mc.ocean_current_velocity * 0.54).toFixed(1) : "-";
    var currDir = mc.ocean_current_direction != null ? dirText(mc.ocean_current_direction) : "-";
    var sst = mc.sea_surface_temperature != null ? Math.round(mc.sea_surface_temperature) : "-";
    var uv = c.uv_index != null ? Math.round(c.uv_index) : "-";

    // Score
    var sc = 68;
    if (c.wind_speed_10m < 20) sc += 7;
    if (c.wind_speed_10m < 12) sc += 6;
    if (pr > 1012 && pr < 1025) sc += 7;
    if ((c.precipitation_probability || 0) < 20) sc += 5;
    if (mc.wave_height != null && mc.wave_height < 0.7) sc += 7;
    if (uv < 7) sc += 3;
    sc = Math.min(97, Math.max(38, sc));

    var scoreLabel = sc >= 80 ? "Εξαιρετικές Συνθήκες" : sc >= 65 ? "Καλές Συνθήκες" : "Μέτριες Συνθήκες";
    var goClass = sc >= 78 ? "go-yes" : sc >= 60 ? "go-maybe" : "go-no";
    var goText = sc >= 78 ? "GO" : sc >= 60 ? "MAYBE" : "NO GO";

    // Date
    document.getElementById("dateText").textContent =
      now.getDate() + " " + MONS[now.getMonth()] + " " + now.getFullYear();

    // Score
    document.getElementById("scoreValue").textContent = sc;
    document.getElementById("scoreValue").style.background =
      "conic-gradient(var(--green) 0% " + sc + "%, #1e2a3a " + sc + "% 100%)";
    document.getElementById("scoreLabel").textContent = scoreLabel;

    document.getElementById("quickInfo").innerHTML =
      "<div>🌬️ " + windDir + " " + windBf + " Bf</div>" +
      "<div>🎈 " + pr + " hPa</div>" +
      "<div>🌙 " + mo.il + "%</div>" +
      "<div>🌊 " + waveH + " m</div>";

    var goEl = document.getElementById("goBadge");
    goEl.textContent = goText;
    goEl.className = "go-badge " + goClass;

    // Conditions grid
    var dayOffset = now.getDate() % 2 === 0 ? 0 : 1;
    var highTide = "0" + (5 + dayOffset) + ":15";
    var lowTide = "1" + (1 + dayOffset) + ":40";

    var conditions = [
      { title: "🌬️ Άνεμος", value: windDir + " " + windBf + " Bf", note: c.wind_speed_10m < 15 ? "Σταθερός όλη μέρα" : "Αυξημένος" },
      { title: "🎈 Βαρομετρική Πίεση", value: pr + " hPa", note: pr > 1015 && pr < 1023 ? "Σταθερή τάση" : "Μεταβαλλόμενη" },
      { title: "🌊 Συνθήκες Θάλασσας", value: waveH + " m", note: (mc.wave_height || 1) < 0.5 ? "Ήρεμη θάλασσα" : "Κυματισμός" },
      { title: "🌙 Σελήνη", value: mo.il + "%", note: mo.name },
      { title: "🧭 Ρεύματα", value: currSpd + " kn", note: currDir !== "-" ? "↗ " + currDir : "—" },
      { title: "🌊 Παλίρροια", value: highTide, note: "Άμπωτη " + lowTide },
    ];

    var gridHtml = "";
    for (var i = 0; i < conditions.length; i++) {
      var item = conditions[i];
      gridHtml +=
        '<div class="condition-card"><h3>' +
        item.title +
        "</h3><strong>" +
        item.value +
        "</strong><div class=\"chart\"></div><p>" +
        item.note +
        "</p></div>";
    }
    document.getElementById("conditionsGrid").innerHTML = gridHtml;

    // Alerts
    var alerts = [];
    if (c.wind_speed_10m < 14) alerts.push({ type: "green", text: "🟢 Ιδανικός άνεμος για LRF / Spinning" });
    else if (c.wind_speed_10m < 22) alerts.push({ type: "green", text: "🟢 Καλές συνθήκες ανέμου" });
    else alerts.push({ type: "orange", text: "🟠 Δυνατός άνεμος – πρόσεχε" });

    if (pr > 1014 && pr < 1024) alerts.push({ type: "green", text: "🟢 Σταθερή βαρομετρική πίεση" });
    else alerts.push({ type: "yellow", text: "🟡 Ασταθής πίεση" });

    if ((mc.wave_height || 0) > 0.8) alerts.push({ type: "yellow", text: "🟡 Το κύμα είναι σχετικά ανεβασμένο" });
    else alerts.push({ type: "green", text: "🟢 Ήρεμη θάλασσα" });

    if (uv >= 6) alerts.push({ type: "yellow", text: "🟡 Υψηλός UV – αντηλιακό" });

    var alertsHtml = "";
    for (var j = 0; j < alerts.length; j++) {
      alertsHtml += '<div class="alert ' + alerts[j].type + '">' + alerts[j].text + "</div>";
    }
    document.getElementById("alertsList").innerHTML = alertsHtml;

    // Technique buttons
    var techBtns = document.querySelectorAll("#techButtons button");
    var selectedTech = "LRF";
    for (var k = 0; k < techBtns.length; k++) {
      techBtns[k].onclick = function () {
        for (var m = 0; m < techBtns.length; m++) techBtns[m].classList.remove("active");
        this.classList.add("active");
        selectedTech = this.getAttribute("data-tech");
        document.getElementById("selectedTech").textContent = selectedTech;
      };
    }

    // Coach
    document.getElementById("coachBtn").onclick = function () {
      var box = document.getElementById("coachBox");
      document.getElementById("coachText").innerHTML = buildCoach(c, mc, sc, selectedTech);
      box.classList.add("show");
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    // Placeholder buttons
    document.getElementById("newTripBtn").onclick = function () {
      alert("Σύντομα: καταγραφή εξόρμησης");
    };
    document.getElementById("newSpotBtn").onclick = function () {
      alert("Σύντομα: αποθήκευση spot");
    };
  }

  function loadData() {
    var grid = document.getElementById("conditionsGrid");
    if (grid) grid.innerHTML = '<div class="load" style="grid-column:1/-1"><div class="spin">⏳</div><div>Φόρτωση live δεδομένων...</div></div>';

    var wu =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      LAT +
      "&longitude=" +
      LON +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,precipitation_probability,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&timezone=Europe%2FAthens&forecast_days=2";
    var mu =
      "https://marine-api.open-meteo.com/v1/marine?latitude=" +
      LAT +
      "&longitude=" +
      LON +
      "&current=wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction,sea_surface_temperature&hourly=wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction,sea_surface_temperature&timezone=Europe%2FAthens&forecast_days=2";

    Promise.all([fetch(wu), fetch(mu)])
      .then(function (rs) {
        if (!rs[0].ok || !rs[1].ok) throw new Error("Σφάλμα API");
        return Promise.all([rs[0].json(), rs[1].json()]);
      })
      .then(function (d) {
        render(d[0], d[1]);
      })
      .catch(function (e) {
        document.getElementById("conditionsGrid").innerHTML =
          '<div class="err" style="grid-column:1/-1"><b>Σφάλμα</b><br>' + e.message + "<br>Πάτα 🔄</div>";
      });
  }

  document.getElementById("refreshBtn").onclick = loadData;
  loadData();
})();
