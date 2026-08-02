/* =========================================================
   FISHING DASHBOARD — APP.JS
   Έκδοση UI / Demo δεδομένων
   Συμβατό με το index.html και το style.css του project
========================================================= */

(() => {
  "use strict";

  const STORAGE_KEYS = Object.freeze({
    technique: "fishingDashboard.selectedTechnique",
    activeNav: "fishingDashboard.activeNav",
    favorite: "fishingDashboard.favorite",
    widgetOrder: "fishingDashboard.widgetOrder"
  });

  const GREEK_DAYS = [
    "ΚΥΡΙΑΚΗ",
    "ΔΕΥΤΕΡΑ",
    "ΤΡΙΤΗ",
    "ΤΕΤΑΡΤΗ",
    "ΠΕΜΠΤΗ",
    "ΠΑΡΑΣΚΕΥΗ",
    "ΣΑΒΒΑΤΟ"
  ];

  const GREEK_MONTHS = [
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
  ];

  const dashboardData = {
    location: {
      name: "Κάλυμνος",
      country: "Ελλάδα",
      latitude: 36.95,
      longitude: 26.98
    },

    weather: {
      temperature: 22,
      feelsLike: 22,
      humidity: 56,
      rainProbability: 0,
      uvIndex: 6,
      description: "Αίθριος ουρανός"
    },

    pressure: {
      current: 1019,
      trend: "Σταθερή"
    },

    moon: {
      illumination: 72,
      phase: "Waxing Gibbous",
      rise: "13:28",
      set: "01:02"
    },

    sea: {
      waterTemperature: 19,
      waveHeight: 0.4,
      wavePeriod: 4.8,
      waveDirection: "ΒΑ"
    },

    fishing: {
      score: 85,
      activity: "ΥΨΗΛΗ",
      selectedTechnique: "spinning"
    },

    lastUpdated: null
  };

  const state = {
    initialized: false,
    isRefreshing: false,
    isEditMode: false,
    draggedWidget: null
  };

  const $ = (selector, root = document) => {
    return root.querySelector(selector);
  };

  const $$ = (selector, root = document) => {
    return [...root.querySelectorAll(selector)];
  };

  /* =========================================================
     LOCAL STORAGE
  ========================================================= */

  function safeStorageGet(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      console.warn(
        "Δεν ήταν δυνατή η ανάγνωση από το localStorage.",
        error
      );

      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn(
        "Δεν ήταν δυνατή η αποθήκευση στο localStorage.",
        error
      );
    }
  }

  function safeStorageRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(
        "Δεν ήταν δυνατή η διαγραφή από το localStorage.",
        error
      );
    }
  }

  /* =========================================================
     JAVASCRIPT UTILITY STYLES
  ========================================================= */

  function injectUtilityStyles() {
    if ($("#fishing-dashboard-js-styles")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "fishing-dashboard-js-styles";

    style.textContent = `
      .is-rotating i {
        animation: fd-spin .65s linear;
      }

      @keyframes fd-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .header-action.is-favorite {
        color: #ffd33d;
      }

      .header-action:disabled {
        opacity: .65;
        cursor: wait;
      }

      .fd-toast {
        position: fixed;
        left: 50%;
        bottom: calc(20px + env(safe-area-inset-bottom));
        z-index: 9999;
        max-width: min(88vw, 420px);
        padding: 10px 15px;
        border: 1px solid rgba(54, 177, 255, .45);
        border-radius: 999px;
        background: rgba(3, 12, 22, .94);
        color: #eef8ff;
        box-shadow:
          0 12px 34px rgba(0, 0, 0, .38),
          0 0 18px rgba(28, 153, 232, .16);
        font:
          700 12px/1.35
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
        text-align: center;
        opacity: 0;
        transform: translate(-50%, 16px);
        pointer-events: none;
        transition:
          opacity .22s ease,
          transform .22s ease;
      }

      .fd-toast.show {
        opacity: 1;
        transform: translate(-50%, 0);
      }

      .fd-toast[data-type="success"] {
        border-color: rgba(96, 218, 75, .55);
      }

      .fd-toast[data-type="warning"] {
        border-color: rgba(255, 188, 45, .60);
      }

      .widget.fd-editable {
        outline: 1px dashed rgba(65, 184, 255, .75);
        outline-offset: 3px;
        cursor: grab;
        user-select: none;
      }

      .widget.fd-editable:active {
        cursor: grabbing;
      }

      .widget.fd-dragging {
        opacity: .45;
      }

      .widget.fd-drop-target {
        box-shadow: 0 0 0 2px rgba(55, 186, 255, .75);
      }

      .hourly-strip.is-drag-scrolling {
        cursor: grabbing;
        user-select: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .is-rotating i {
          animation: none;
        }

        .fd-toast {
          transition: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================================================
     TOAST MESSAGES
  ========================================================= */

  function createToast() {
    let toast = $("#fd-toast");

    if (toast) {
      return toast;
    }

    toast = document.createElement("div");
    toast.id = "fd-toast";
    toast.className = "fd-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    document.body.appendChild(toast);

    return toast;
  }

  let toastTimer = null;

  function showToast(
    message,
    type = "info",
    duration = 2200
  ) {
    const toast = createToast();

    window.clearTimeout(toastTimer);

    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add("show");

    toastTimer = window.setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  /* =========================================================
     STATUS BAR CLOCK
  ========================================================= */

  function updateClock() {
    const statusTime = $(".status-time");

    if (!statusTime) {
      return;
    }

    const now = new Date();

    statusTime.textContent = new Intl.DateTimeFormat(
      "el-GR",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }
    ).format(now);
  }

  /* =========================================================
     DATE CARD
  ========================================================= */

  function updateDateCard(date = new Date()) {
    const dayName = $(".date-card .panel-kicker span");
    const dayNumber = $(".date-card .date-number");
    const monthYear = $(".date-card .date-month");

    if (dayName) {
      dayName.textContent = GREEK_DAYS[date.getDay()];
    }

    if (dayNumber) {
      dayNumber.textContent = String(date.getDate());
    }

    if (monthYear) {
      monthYear.textContent =
        `${GREEK_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    }
  }

  /* =========================================================
     BOTTOM NAVIGATION
  ========================================================= */

  function setActiveNavigation(
    button,
    notify = true
  ) {
    const navItems = $$(".nav-item");

    if (!button || !navItems.includes(button)) {
      return;
    }

    navItems.forEach((item) => {
      const isActive = item === button;

      item.classList.toggle("active", isActive);

      item.setAttribute(
        "aria-current",
        isActive ? "page" : "false"
      );
    });

    const label =
      $("span", button)?.textContent?.trim() ||
      "DASHBOARD";

    safeStorageSet(
      STORAGE_KEYS.activeNav,
      label
    );

    if (notify && label !== "DASHBOARD") {
      showToast(
        `Η ενότητα «${label}» θα ενεργοποιηθεί σε επόμενη έκδοση.`,
        "info"
      );
    }
  }

  function initializeNavigation() {
    const navItems = $$(".nav-item");

    if (!navItems.length) {
      return;
    }

    navItems.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveNavigation(button);
      });
    });

    const savedLabel = safeStorageGet(
      STORAGE_KEYS.activeNav,
      "DASHBOARD"
    );

    const savedButton = navItems.find((button) => {
      return (
        $("span", button)?.textContent?.trim() ===
        savedLabel
      );
    });

    setActiveNavigation(
      savedButton || navItems[0],
      false
    );
  }

  /* =========================================================
     TECHNIQUE SELECTOR
  ========================================================= */

  function setSelectedTechnique(
    card,
    notify = true
  ) {
    const cards = $$(".technique-card");

    if (!card || !cards.includes(card)) {
      return;
    }

    cards.forEach((item) => {
      const selected = item === card;

      item.classList.toggle(
        "selected",
        selected
      );

      item.setAttribute(
        "aria-pressed",
        String(selected)
      );
    });

    const techniqueId =
      card.dataset.technique ||
      "spinning";

    const techniqueName =
      $("strong", card)?.textContent?.trim() ||
      techniqueId;

    dashboardData.fishing.selectedTechnique =
      techniqueId;

    safeStorageSet(
      STORAGE_KEYS.technique,
      techniqueId
    );

    if (notify) {
      showToast(
        `Επιλέχθηκε τεχνική: ${techniqueName}`,
        "success"
      );
    }
  }

  function initializeTechniqueSelector() {
    const cards = $$(".technique-card");

    if (!cards.length) {
      return;
    }

    cards.forEach((card) => {
      card.setAttribute(
        "aria-pressed",
        String(card.classList.contains("selected"))
      );

      card.addEventListener("click", () => {
        setSelectedTechnique(card);
      });
    });

    const savedTechnique = safeStorageGet(
      STORAGE_KEYS.technique,
      "spinning"
    );

    const savedCard = cards.find((card) => {
      return (
        card.dataset.technique ===
        savedTechnique
      );
    });

    const defaultCard =
      savedCard ||
      cards.find((card) =>
        card.classList.contains("selected")
      ) ||
      cards[0];

    setSelectedTechnique(
      defaultCard,
      false
    );
  }

  /* =========================================================
     FAVORITE BUTTON
  ========================================================= */

  function applyFavoriteState(
    isFavorite,
    persist = true
  ) {
    const button = $(
      '.header-action[aria-label="Αγαπημένα"]'
    );

    const icon = button
      ? $("i", button)
      : null;

    if (!button || !icon) {
      return;
    }

    button.classList.toggle(
      "is-favorite",
      isFavorite
    );

    button.setAttribute(
      "aria-pressed",
      String(isFavorite)
    );

    icon.className = isFavorite
      ? "fa-solid fa-star"
      : "fa-regular fa-star";

    if (persist) {
      safeStorageSet(
        STORAGE_KEYS.favorite,
        String(isFavorite)
      );
    }
  }

  function initializeFavoriteButton() {
    const button = $(
      '.header-action[aria-label="Αγαπημένα"]'
    );

    if (!button) {
      return;
    }

    const saved =
      safeStorageGet(
        STORAGE_KEYS.favorite,
        "false"
      ) === "true";

    applyFavoriteState(
      saved,
      false
    );

    button.addEventListener("click", () => {
      const nextState =
        !button.classList.contains(
          "is-favorite"
        );

      applyFavoriteState(nextState);

      showToast(
        nextState
          ? "Η Κάλυμνος προστέθηκε στα αγαπημένα."
          : "Η Κάλυμνος αφαιρέθηκε από τα αγαπημένα.",
        nextState
          ? "success"
          : "info"
      );
    });
  }

  /* =========================================================
     REFRESH DASHBOARD
  ========================================================= */

  function updateLastUpdatedTime() {
    dashboardData.lastUpdated =
      new Date().toISOString();
  }

  async function refreshDashboard() {
    if (state.isRefreshing) {
      return;
    }

    const button = $(
      '.header-action[aria-label="Ανανέωση"]'
    );

    state.isRefreshing = true;

    if (button) {
      button.disabled = true;
      button.classList.add("is-rotating");

      button.setAttribute(
        "aria-busy",
        "true"
      );
    }

    updateClock();
    updateDateCard();

    await new Promise((resolve) => {
      window.setTimeout(
        resolve,
        650
      );
    });

    updateLastUpdatedTime();

    if (button) {
      button.disabled = false;
      button.classList.remove("is-rotating");

      button.removeAttribute(
        "aria-busy"
      );
    }

    state.isRefreshing = false;

    showToast(
      "Τα δεδομένα του dashboard ανανεώθηκαν.",
      "success"
    );

    document.dispatchEvent(
      new CustomEvent(
        "fishingdashboard:refresh",
        {
          detail: {
            ...dashboardData
          }
        }
      )
    );
  }

  function initializeRefreshButton() {
    const button = $(
      '.header-action[aria-label="Ανανέωση"]'
    );

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      refreshDashboard
    );
  }

  /* =========================================================
     HORIZONTAL HOURLY SCROLL
  ========================================================= */

  function initializeHorizontalScroll() {
    $$(".hourly-strip").forEach((strip) => {
      let pointerDown = false;
      let startX = 0;
      let startScrollLeft = 0;

      strip.addEventListener(
        "pointerdown",
        (event) => {
          if (
            event.pointerType === "touch" ||
            event.button !== 0
          ) {
            return;
          }

          pointerDown = true;
          startX = event.clientX;
          startScrollLeft =
            strip.scrollLeft;

          strip.classList.add(
            "is-drag-scrolling"
          );

          strip.setPointerCapture?.(
            event.pointerId
          );
        }
      );

      strip.addEventListener(
        "pointermove",
        (event) => {
          if (!pointerDown) {
            return;
          }

          strip.scrollLeft =
            startScrollLeft -
            (event.clientX - startX);
        }
      );

      const stop = (event) => {
        pointerDown = false;

        strip.classList.remove(
          "is-drag-scrolling"
        );

        if (
          event?.pointerId !== undefined &&
          strip.hasPointerCapture?.(
            event.pointerId
          )
        ) {
          strip.releasePointerCapture(
            event.pointerId
          );
        }
      };

      strip.addEventListener(
        "pointerup",
        stop
      );

      strip.addEventListener(
        "pointercancel",
        stop
      );

      strip.addEventListener(
        "lostpointercapture",
        stop
      );

      strip.addEventListener(
        "wheel",
        (event) => {
          if (
            Math.abs(event.deltaY) <=
            Math.abs(event.deltaX)
          ) {
            return;
          }

          if (
            strip.scrollWidth <=
            strip.clientWidth
          ) {
            return;
          }

          event.preventDefault();

          strip.scrollLeft +=
            event.deltaY;
        },
        {
          passive: false
        }
      );
    });
  }

  /* =========================================================
     ENTRANCE ANIMATION
  ========================================================= */

  function animateDashboardEntrance() {
    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return;
    }

    const items = $$(
      ".panel, .bottom-navigation, .technique-section"
    );

    items.forEach((item, index) => {
      item.animate(
        [
          {
            opacity: 0,
            transform:
              "translateY(10px)"
          },
          {
            opacity: 1,
            transform:
              "translateY(0)"
          }
        ],
        {
          duration: 340,
          delay: Math.min(
            index * 38,
            520
          ),
          easing:
            "cubic-bezier(.2,.7,.2,1)",
          fill: "both"
        }
      );
    });
  }

  /* =========================================================
     WIDGET ORDER
  ========================================================= */

  function getMovableWidgets() {
    const content = $(".dashboard-content");

    if (!content) {
      return [];
    }

    return [...content.children].filter(
      (element) => {
        return (
          element.matches("section") &&
          !element.classList.contains(
            "technique-section"
          )
        );
      }
    );
  }

  function getWidgetId(
    element,
    index = 0
  ) {
    const ownWidget =
      element.dataset.widget;

    if (ownWidget) {
      return ownWidget;
    }

    const childIds = $$(
      "[data-widget]",
      element
    )
      .map((item) => item.dataset.widget)
      .filter(Boolean)
      .join("+");

    return (
      childIds ||
      `section-${index}`
    );
  }

  function saveWidgetOrder() {
    const order = getMovableWidgets().map(
      getWidgetId
    );

    safeStorageSet(
      STORAGE_KEYS.widgetOrder,
      JSON.stringify(order)
    );
  }

  function restoreWidgetOrder() {
    const content =
      $(".dashboard-content");

    const rawOrder =
      safeStorageGet(
        STORAGE_KEYS.widgetOrder
      );

    if (!content || !rawOrder) {
      return;
    }

    try {
      const order =
        JSON.parse(rawOrder);

      if (!Array.isArray(order)) {
        return;
      }

      const widgets =
        getMovableWidgets();

      const widgetMap = new Map(
        widgets.map(
          (widget, index) => [
            getWidgetId(widget, index),
            widget
          ]
        )
      );

      const fixedBottomNav =
        $(".bottom-navigation", content);

      const techniqueSection =
        $(".technique-section", content);

      order.forEach((id) => {
        const widget =
          widgetMap.get(id);

        if (widget) {
          content.insertBefore(
            widget,
            fixedBottomNav ||
              techniqueSection ||
              null
          );
        }
      });
    } catch (error) {
      console.warn(
        "Η αποθηκευμένη σειρά των widgets δεν ήταν έγκυρη.",
        error
      );

      safeStorageRemove(
        STORAGE_KEYS.widgetOrder
      );
    }
  }

  function clearDropTargets() {
    getMovableWidgets().forEach(
      (widget) => {
        widget.classList.remove(
          "fd-drop-target"
        );
      }
    );
  }

  function setEditMode(enabled) {
    state.isEditMode = enabled;

    getMovableWidgets().forEach(
      (widget, index) => {
        widget.draggable = enabled;

        widget.classList.toggle(
          "fd-editable",
          enabled
        );

        widget.dataset.widgetOrderId =
          getWidgetId(
            widget,
            index
          );
      }
    );

    showToast(
      enabled
        ? "Λειτουργία διάταξης: σύρε τα πλαίσια στη σειρά που θέλεις."
        : "Η νέα σειρά των πλαισίων αποθηκεύτηκε.",
      enabled
        ? "warning"
        : "success",
      enabled
        ? 3200
        : 2200
    );
  }

  function initializeWidgetReordering() {
    const content =
      $(".dashboard-content");

    if (!content) {
      return;
    }

    restoreWidgetOrder();

    content.addEventListener(
      "dragstart",
      (event) => {
        const widget =
          event.target.closest(
            ".fd-editable"
          );

        if (
          !state.isEditMode ||
          !widget
        ) {
          return;
        }

        state.draggedWidget =
          widget;

        widget.classList.add(
          "fd-dragging"
        );

        event.dataTransfer.effectAllowed =
          "move";

        event.dataTransfer.setData(
          "text/plain",
          widget.dataset.widgetOrderId ||
            "widget"
        );
      }
    );

    content.addEventListener(
      "dragover",
      (event) => {
        if (
          !state.draggedWidget
        ) {
          return;
        }

        const target =
          event.target.closest(
            ".fd-editable"
          );

        if (
          !target ||
          target ===
            state.draggedWidget
        ) {
          return;
        }

        event.preventDefault();
        clearDropTargets();

        target.classList.add(
          "fd-drop-target"
        );

        const rect =
          target.getBoundingClientRect();

        const insertAfter =
          event.clientY >
          rect.top +
            rect.height / 2;

        target.parentNode.insertBefore(
          state.draggedWidget,
          insertAfter
            ? target.nextSibling
            : target
        );
      }
    );

    content.addEventListener(
      "drop",
      (event) => {
        if (
          !state.draggedWidget
        ) {
          return;
        }

        event.preventDefault();
        saveWidgetOrder();
        clearDropTargets();
      }
    );

    content.addEventListener(
      "dragend",
      () => {
        state.draggedWidget?.classList.remove(
          "fd-dragging"
        );

        state.draggedWidget =
          null;

        clearDropTargets();
        saveWidgetOrder();
      }
    );
  }

  function resetWidgetOrder() {
    safeStorageRemove(
      STORAGE_KEYS.widgetOrder
    );

    window.location.reload();
  }

  /* =========================================================
     MENU BUTTON
  ========================================================= */

  function initializeMenuButton() {
    const button =
      $(".menu-button");

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      () => {
        setEditMode(
          !state.isEditMode
        );

        button.classList.toggle(
          "is-active",
          state.isEditMode
        );

        button.setAttribute(
          "aria-pressed",
          String(state.isEditMode)
        );

        const icon =
          $("i", button);

        if (icon) {
          icon.className =
            state.isEditMode
              ? "fa-solid fa-check"
              : "fa-solid fa-bars";
        }
      }
    );

    let longPressTimer = null;

    button.addEventListener(
      "pointerdown",
      () => {
        longPressTimer =
          window.setTimeout(
            () => {
              resetWidgetOrder();
            },
            1400
          );
      }
    );

    [
      "pointerup",
      "pointercancel",
      "pointerleave"
    ].forEach((eventName) => {
      button.addEventListener(
        eventName,
        () => {
          window.clearTimeout(
            longPressTimer
          );
        }
      );
    });
  }

  /* =========================================================
     VISIBILITY HANDLING
  ========================================================= */

  function initializeVisibilityHandling() {
    document.addEventListener(
      "visibilitychange",
      () => {
        if (!document.hidden) {
          updateClock();
          updateDateCard();
        }
      }
    );
  }

  /* =========================================================
     KEYBOARD SUPPORT
  ========================================================= */

  function initializeKeyboardSupport() {
    document.addEventListener(
      "keydown",
      (event) => {
        if (
          (event.ctrlKey ||
            event.metaKey) &&
          event.key.toLowerCase() ===
            "r"
        ) {
          event.preventDefault();
          refreshDashboard();
        }

        if (
          event.key === "Escape" &&
          state.isEditMode
        ) {
          const menuButton =
            $(".menu-button");

          setEditMode(false);

          menuButton?.classList.remove(
            "is-active"
          );

          menuButton?.setAttribute(
            "aria-pressed",
            "false"
          );

          const icon = menuButton
            ? $("i", menuButton)
            : null;

          if (icon) {
            icon.className =
              "fa-solid fa-bars";
          }
        }
      }
    );
  }

  /* =========================================================
     INITIALIZE APP
  ========================================================= */

  function initializeApp() {
    if (state.initialized) {
      return;
    }

    state.initialized = true;

    injectUtilityStyles();
    updateClock();
    updateDateCard();
    updateLastUpdatedTime();

    initializeNavigation();
    initializeTechniqueSelector();
    initializeFavoriteButton();
    initializeRefreshButton();
    initializeMenuButton();
    initializeHorizontalScroll();
    initializeWidgetReordering();
    initializeVisibilityHandling();
    initializeKeyboardSupport();
    animateDashboardEntrance();

    window.setInterval(
      updateClock,
      30000
    );

    document.dispatchEvent(
      new CustomEvent(
        "fishingdashboard:ready",
        {
          detail: {
            ...dashboardData
          }
        }
      )
    );
  }

  /* =========================================================
     PUBLIC API
  ========================================================= */

  window.FishingDashboard =
    Object.freeze({
      version: "1.0.0",

      data: dashboardData,

      refresh:
        refreshDashboard,

      refreshClock:
        updateClock,

      updateDate:
        updateDateCard,

      showMessage:
        showToast,

      setEditMode,

      resetWidgetOrder,

      selectTechniqueById(
        techniqueId
      ) {
        const escapedId =
          window.CSS?.escape
            ? CSS.escape(
                techniqueId
              )
            : techniqueId;

        const card = $(
          `.technique-card[data-technique="${escapedId}"]`
        );

        if (card) {
          setSelectedTechnique(
            card
          );
        }
      },

      selectNavigation(label) {
        const button =
          $$(".nav-item").find(
            (item) => {
              return (
                $("span", item)
                  ?.textContent
                  ?.trim() ===
                label
              );
            }
          );

        if (button) {
          setActiveNavigation(
            button
          );
        }
      }
    });

  /* =========================================================
     START
  ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initializeApp,
      {
        once: true
      }
    );
  } else {
    initializeApp();
  }
})();
