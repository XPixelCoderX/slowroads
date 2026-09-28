/*
 * A progressive enhancement layer for the original Slow Roads build.
 * It keeps the existing renderer and simulation intact while adding a compact
 * journey HUD, route sharing, photo mode, quick access to native menus, and
 * optional touch controls.
 */
(() => {
  "use strict";

  const touchMode =
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    ("ontouchstart" in window && navigator.maxTouchPoints > 0);
  if (touchMode) document.body.classList.add("sr-touch-device");

  const BEST_KEY = "sr-best-drive-meters";
  const readStorage = (key, fallback = "") => {
    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch (_) {
      return fallback;
    }
  };
  const writeStorage = (key, value) => {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (_) {
      // The game still runs when storage is disabled or full.
    }
  };

  const icons = {
    world: '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.1 2.3 3.2 5.3 3.2 9s-1.1 6.7-3.2 9c-2.1-2.3-3.2-5.3-3.2-9S9.9 5.3 12 3Z"/>',
    weather: '<circle cx="8" cy="8" r="3.4"/><path d="M8 1.7v1.5M8 12.8v1.5M1.7 8h1.5M12.8 8h1.5M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M15.7 16.8h-9a3.1 3.1 0 0 1-.3-6.2 4.9 4.9 0 0 1 9.4 1.4h.1a2.4 2.4 0 1 1-.2 4.8Z"/>',
    vehicle: '<path d="m4 13 1.4-4.6A2 2 0 0 1 7.3 7h9.4a2 2 0 0 1 1.9 1.4L20 13"/><path d="M3 13h18v5H3zM6 18v2m12-2v2M6.5 15.5h.01M17.5 15.5h.01"/>',
    settings: '<path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z"/><path d="m19.4 13.5 1.1.8-1.3 2.3-1.3-.5a7.8 7.8 0 0 1-1.4.8l-.2 1.4h-2.7l-.3-1.4a7.8 7.8 0 0 1-1.4-.8l-1.3.5-1.3-2.3 1.1-.8a7.2 7.2 0 0 1 0-1.6l-1.1-.8 1.3-2.3 1.3.5a7.8 7.8 0 0 1 1.4-.8l.3-1.4h2.7l.2 1.4a7.8 7.8 0 0 1 1.4.8l1.3-.5 1.3 2.3-1.1.8a7.2 7.2 0 0 1 0 1.6Z" transform="translate(-1.6 -1.4)"/>',
    sound: '<path d="M4 10v4h3l4 3V7l-4 3H4Z"/><path d="M15 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11"/>',
    share: '<path d="M15 8.5 8.8 11.7m6.2 3-6.2-3.1"/><circle cx="17" cy="7" r="2.5"/><circle cx="7" cy="12" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    photo: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="12" cy="12" r="3.3"/><path d="M8 4.5 9.2 2h5.6L16 4.5"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/>',
  };

  const svg = (name) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
  const action = (id, label, icon, title, iconOnly = false) =>
    `<button class="sr-action-button${iconOnly ? " sr-icon-only" : ""}" id="${id}" type="button" aria-label="${title}" title="${title}">${svg(icon)}${label ? `<span class="sr-action-label">${label}</span>` : ""}</button>`;

  function createInterface() {
    if (document.getElementById("sr-interface")) return;
    const layer = document.createElement("div");
    layer.id = "sr-interface";
    layer.innerHTML = `
      <div class="sr-brand-widget" id="sr-brand-widget" aria-label="Slow Roads">
        <div class="sr-monogram" aria-hidden="true">sr</div>
        <div class="sr-brand-copy">
          <span class="sr-brand-name">Slow Roads</span>
          <span class="sr-brand-subtitle">a little room to roam</span>
        </div>
      </div>
      <section class="sr-journey-card" id="sr-journey-card" aria-label="Journey details">
        <div class="sr-kicker"><span class="sr-status-dot"></span>&nbsp; open road</div>
        <div class="sr-journey-row"><span>Journey time</span><strong id="sr-session-time">00:00</strong></div>
        <div class="sr-journey-row"><span>Personal best</span><strong id="sr-best-distance">—</strong></div>
        <button class="sr-route-button" id="sr-copy-route" type="button" title="Copy a link to this generated road">
          <span>Road seed</span><strong id="sr-route-seed">—</strong>
        </button>
      </section>
      <nav class="sr-actionbar" id="sr-actionbar" aria-label="Quick game controls">
        ${action("sr-open-world", "World", "world", "Open world and road settings")}
        ${action("sr-open-weather", "Weather", "weather", "Open season and weather settings")}
        ${action("sr-open-vehicle", "Vehicle", "vehicle", "Choose a vehicle")}
        ${action("sr-open-settings", "Options", "settings", "Open driving and graphics options")}
        <span class="sr-action-divider" aria-hidden="true"></span>
        ${action("sr-audio", "", "sound", "Toggle game sound", true)}
        ${action("sr-share", "", "share", "Copy a link to this road", true)}
        ${action("sr-photo", "", "photo", "Toggle photo mode", true)}
        ${action("sr-pause", "", "pause", "Pause or resume the drive", true)}
        ${action("sr-more", "", "settings", "Open the quick menu", true)}
      </nav>
      <div class="sr-quick-menu" id="sr-quick-menu" role="menu" hidden>
        <div class="sr-quick-menu-label">Drive your way</div>
        <button type="button" role="menuitem" data-menu-asset="globe.0021026f.svg" data-menu-label="World">World &amp; road <span>seed</span></button>
        <button type="button" role="menuitem" data-menu-asset="panorama.568dc952.svg" data-menu-label="Season and weather">Season &amp; weather <span>sky</span></button>
        <button type="button" role="menuitem" data-menu-asset="v_config_1.45a9fb9a.svg" data-menu-label="Vehicle">Choose vehicle <span>garage</span></button>
        <button type="button" role="menuitem" data-menu-asset="config.fa1e0797.svg" data-menu-label="Options">Driving options <span>graphics</span></button>
        <button type="button" role="menuitem" id="sr-quick-audio">Toggle sound <span>sound</span></button>
        <button type="button" role="menuitem" id="sr-quick-auto">Toggle autodrive <span>F</span></button>
      </div>
      <div class="sr-photo-exit" id="sr-photo-exit">
        <span class="sr-photo-caption">clean frame · take your time</span>
        <button class="sr-photo-exit-button" id="sr-show-ui" type="button">Show interface</button>
      </div>
      <div class="sr-toast" id="sr-toast" role="status" aria-live="polite"></div>
      <div id="sr-touch-controls" aria-label="Touch driving controls">
        <div class="sr-touch-steering">
          <button class="sr-touch-button" type="button" data-drive-key="KeyA" aria-label="Steer left">‹</button>
          <button class="sr-touch-button" type="button" data-drive-key="KeyD" aria-label="Steer right">›</button>
        </div>
        <div class="sr-touch-driving">
          <button class="sr-touch-button sr-touch-button--brake" type="button" data-drive-key="KeyS" aria-label="Brake">BRAKE</button>
          <button class="sr-touch-button sr-touch-button--drive" type="button" data-drive-key="KeyW" aria-label="Hold to accelerate">HOLD<br>TO DRIVE</button>
        </div>
      </div>`;
    document.body.appendChild(layer);
    bindInterface();
  }

  function ensureHomeTools() {
    const home = document.getElementById("home");
    if (!home || document.getElementById("sr-home-tools")) return;

    const ribbon = document.createElement("div");
    ribbon.id = "sr-home-tools";
    ribbon.innerHTML = `
      <span class="sr-home-tag"><i class="sr-live-dot" aria-hidden="true"></i> PROCEDURAL WORLDS</span>
      <span class="sr-home-tag">NO TIMER · NO FINISH LINE</span>
      <button class="sr-home-tag" id="sr-copy-home-seed" type="button" title="Copy a shareable link to this road">
        ROAD CODE&nbsp; <strong class="sr-home-seed-value" id="sr-home-seed">—</strong>
      </button>`;
    const loader = document.getElementById("splash-loader");
    const subtitle = document.getElementById("splash-subheader");
    if (loader && loader.parentNode === home) home.insertBefore(ribbon, loader);
    else if (subtitle && subtitle.parentNode === home) subtitle.insertAdjacentElement("afterend", ribbon);
    else home.appendChild(ribbon);

    const copy = document.getElementById("sr-copy-home-seed");
    copy?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      shareCurrentRoad();
    });
  }

  let toastTimer = 0;
  function showToast(message, emphasis = "") {
    const toast = document.getElementById("sr-toast");
    if (!toast || !document.body.classList.contains("sr-driving")) {
      const seed = document.getElementById("sr-home-seed");
      if (seed) {
        const original = currentSeed();
        seed.textContent = "COPIED";
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
          if (seed.isConnected) seed.textContent = original;
        }, 1800);
      }
      return;
    }
    toast.innerHTML = emphasis
      ? `${message} <strong>${escapeHTML(emphasis)}</strong>`
      : escapeHTML(message);
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character]));
  }

  function currentSeed() {
    return readStorage("seed", "slow-roads").trim() || "slow-roads";
  }

  async function shareCurrentRoad() {
    const seed = currentSeed();
    // The bundled game's query parser reads the seed literally (it does not
    // URL-decode it), so only build a link for seeds safe to place in a query.
    const canShareAsLink = /^[A-Za-z0-9._~-]+$/.test(seed);
    const value = canShareAsLink
      ? `${window.location.origin}${window.location.pathname}?seed=${seed}`
      : seed;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = value;
        temporary.setAttribute("readonly", "");
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";
        document.body.appendChild(temporary);
        temporary.select();
        document.execCommand("copy");
        temporary.remove();
      }
      showToast(canShareAsLink ? "Road link copied · seed" : "Road seed copied", seed);
    } catch (_) {
      showToast("Your road seed is", seed);
    }
  }

  function isCompactInterface() {
    return document.body.classList.contains("sr-touch-device") ||
      Boolean(window.matchMedia && window.matchMedia("(max-width: 700px)").matches);
  }

  function openNativeMenu(assetFragment, label) {
    const candidates = Array.from(document.querySelectorAll("#menu-bar img.menu-icon"));
    const icon = candidates.find((image) =>
      (image.getAttribute("src") || image.src).includes(assetFragment)
    );
    const item = icon?.closest(".menu-item");
    if (!item) {
      showToast(`${label} settings are available in the game menu`);
      return;
    }

    if (openMenuItem && openMenuItem !== item) {
      openMenuItem.dispatchEvent(new MouseEvent("mouseout", {
        bubbles: true,
        relatedTarget: item,
        view: window,
      }));
    }
    openMenuItem = item;
    if (isCompactInterface()) {
      const menuBar = document.getElementById("menu-bar");
      if (menuBar) {
        menuBar.style.display = "flex";
        menuBar.classList.add("sr-mobile-menu-open");
        document.body.classList.add("sr-native-menu-open");
        window.clearTimeout(nativeMenuTimer);
        nativeMenuTimer = window.setTimeout(() => closeNativeMenu(document.body), 15000);
      }
    }
    const bounds = item.getBoundingClientRect();
    item.dispatchEvent(new MouseEvent("mouseover", {
      bubbles: true,
      cancelable: true,
      view: window,
      relatedTarget: null,
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    }));
    showToast(`${label} controls opened in the game menu`);
  }

  let openMenuItem = null;
  let nativeMenuTimer = 0;
  function closeNativeMenu(relatedTarget = document.body) {
    if (openMenuItem) {
      openMenuItem.dispatchEvent(new MouseEvent("mouseout", {
        bubbles: true,
        relatedTarget,
        view: window,
      }));
      openMenuItem = null;
    }
    if (isCompactInterface()) {
      const menuBar = document.getElementById("menu-bar");
      window.clearTimeout(nativeMenuTimer);
      menuBar?.classList.remove("sr-mobile-menu-open");
      menuBar?.style.removeProperty("display");
      document.body.classList.remove("sr-native-menu-open");
    }
  }

  function toggleAudio() {
    const icon = Array.from(document.querySelectorAll("#menu-bar-right img.menu-icon"))
      .find((image) => /vol_(high|off)/.test(image.getAttribute("src") || image.src));
    if (!icon) {
      showToast("Sound controls are available in the game menu");
      return;
    }
    icon.dispatchEvent(new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0,
    }));
    showToast("Sound toggled");
  }

  function sendGameKey(code, type = "keydown") {
    const game = document.getElementById("game-main");
    if (!game) return;
    const keys = {
      KeyA: ["a", "A"],
      KeyD: ["d", "D"],
      KeyW: ["w", "W"],
      KeyS: ["s", "S"],
      Space: [" ", " "],
      KeyP: ["p", "P"],
      KeyF: ["f", "F"],
    };
    const [key, keyCode] = keys[code] || ["", ""];
    try {
      game.focus({ preventScroll: true });
    } catch (_) {
      game.focus();
    }
    game.dispatchEvent(new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      code,
      key,
      keyCode: keyCode ? keyCode.charCodeAt(0) : 0,
      which: keyCode ? keyCode.charCodeAt(0) : 0,
    }));
  }

  function bindInterface() {
    document.getElementById("sr-copy-route")?.addEventListener("click", shareCurrentRoad);
    document.getElementById("sr-share")?.addEventListener("click", shareCurrentRoad);

    document.getElementById("sr-open-world")?.addEventListener("click", () =>
      openNativeMenu("globe.0021026f.svg", "World")
    );
    document.getElementById("sr-open-weather")?.addEventListener("click", () =>
      openNativeMenu("panorama.568dc952.svg", "Season and weather")
    );
    document.getElementById("sr-open-vehicle")?.addEventListener("click", () =>
      openNativeMenu("v_config_1.45a9fb9a.svg", "Vehicle")
    );
    document.getElementById("sr-open-settings")?.addEventListener("click", () =>
      openNativeMenu("config.fa1e0797.svg", "Options")
    );

    document.getElementById("sr-audio")?.addEventListener("click", toggleAudio);
    document.getElementById("sr-quick-audio")?.addEventListener("click", () => {
      toggleAudio();
      document.getElementById("sr-quick-menu")?.setAttribute("hidden", "");
      document.getElementById("sr-more")?.setAttribute("aria-expanded", "false");
    });

    document.querySelectorAll("[data-menu-asset]").forEach((button) => {
      button.addEventListener("click", () => {
        openNativeMenu(button.getAttribute("data-menu-asset"), button.getAttribute("data-menu-label") || "Game");
        document.getElementById("sr-quick-menu")?.setAttribute("hidden", "");
        document.getElementById("sr-more")?.setAttribute("aria-expanded", "false");
      });
    });

    const quickMenu = document.getElementById("sr-quick-menu");
    document.getElementById("sr-more")?.addEventListener("click", () => {
      if (!quickMenu) return;
      const willOpen = quickMenu.hasAttribute("hidden");
      quickMenu.toggleAttribute("hidden", !willOpen);
      document.getElementById("sr-more")?.setAttribute("aria-expanded", String(willOpen));
    });
    document.getElementById("sr-quick-auto")?.addEventListener("click", () => {
      sendGameKey("KeyF");
      quickMenu?.setAttribute("hidden", "");
      document.getElementById("sr-more")?.setAttribute("aria-expanded", "false");
      showToast("Autodrive toggled");
    });
    document.addEventListener("pointerdown", (event) => {
      const nativeMenuBar = document.getElementById("menu-bar");
      if (openMenuItem && !nativeMenuBar?.contains(event.target)) {
        closeNativeMenu(event.target);
      }
      if (quickMenu && !quickMenu.contains(event.target) && event.target?.id !== "sr-more") {
        quickMenu.setAttribute("hidden", "");
        document.getElementById("sr-more")?.setAttribute("aria-expanded", "false");
      }
    });

    const togglePhoto = () => {
      const enabled = document.body.classList.toggle("sr-photo-mode");
      const photoButton = document.getElementById("sr-photo");
      photoButton?.setAttribute("aria-pressed", String(enabled));
      if (enabled) showToast("Photo mode · interface hidden");
    };
    document.getElementById("sr-photo")?.addEventListener("click", togglePhoto);
    document.getElementById("sr-show-ui")?.addEventListener("click", () => {
      document.body.classList.remove("sr-photo-mode");
      document.getElementById("sr-photo")?.setAttribute("aria-pressed", "false");
    });

    document.getElementById("sr-pause")?.addEventListener("click", () => {
      const paused = document.getElementById("game-paused");
      if (paused && getComputedStyle(paused).display !== "none") {
        paused.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
      } else {
        sendGameKey("KeyP");
      }
    });

    document.querySelectorAll("[data-drive-key]").forEach((button) => {
      let heldPointer = null;
      const code = button.getAttribute("data-drive-key");
      const release = () => {
        if (heldPointer === null) return;
        heldPointer = null;
        button.classList.remove("is-held");
        sendGameKey(code, "keyup");
      };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        if (heldPointer !== null) return;
        heldPointer = event.pointerId;
        button.classList.add("is-held");
        try {
          button.setPointerCapture(event.pointerId);
        } catch (_) {
          // Pointer capture is not available in a few older mobile browsers.
        }
        sendGameKey(code, "keydown");
      });
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
      button.addEventListener("contextmenu", (event) => event.preventDefault());
    });

    window.addEventListener("blur", () => {
      document.querySelectorAll("[data-drive-key].is-held").forEach((button) => {
        button.classList.remove("is-held");
        sendGameKey(button.getAttribute("data-drive-key"), "keyup");
      });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        document.querySelectorAll("[data-drive-key].is-held").forEach((button) => {
          button.classList.remove("is-held");
          sendGameKey(button.getAttribute("data-drive-key"), "keyup");
        });
      }
    });
  }

  let wasDriving = false;
  let sessionStartedAt = 0;
  let sessionStartMeters = 0;
  let bestMeters = Math.max(0, Number(readStorage(BEST_KEY, "0")) || 0);
  let sessionMaxMeters = 0;

  function readTotalMeters() {
    const value = document.getElementById("ui-dist-val");
    if (!value) return 0;
    const amount = Number.parseFloat((value.textContent || "0").replace(/,/g, "")) || 0;
    const unit = document.querySelector("#ui-dist .ui-stat-unit")?.textContent?.toLowerCase() || "km";
    return amount * (unit.includes("mile") ? 1609.344 : 1000);
  }

  function distanceLabel(meters) {
    if (!meters || meters < 1) return "—";
    const unitText = document.querySelector("#ui-dist .ui-stat-unit")?.textContent?.toLowerCase() || "km";
    const miles = unitText.includes("mile");
    const amount = meters / (miles ? 1609.344 : 1000);
    return `${amount.toFixed(amount >= 10 ? 1 : 2)} ${miles ? "mi" : "km"}`;
  }

  function formatDuration(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const minutes = String(Math.floor(totalSeconds / 60) % 60).padStart(2, "0");
    const hours = Math.floor(totalSeconds / 3600);
    return hours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
  }

  function syncState() {
    ensureHomeTools();
    createInterface();

    const splash = document.getElementById("splash-container");
    const gameUI = document.getElementById("game-ui");
    const driving = Boolean(gameUI && !splash);
    document.body.classList.toggle("sr-driving", driving);

    if (driving && !wasDriving) {
      sessionStartedAt = Date.now();
      sessionStartMeters = readTotalMeters();
      sessionMaxMeters = 0;
    } else if (!driving && wasDriving) {
      finishSession();
    }
    wasDriving = driving;

    const seed = currentSeed();
    const seedTargets = [
      document.getElementById("sr-route-seed"),
      document.getElementById("sr-home-seed"),
    ];
    seedTargets.forEach((target) => {
      if (target && target.textContent !== seed) target.textContent = seed;
    });

    const best = document.getElementById("sr-best-distance");
    if (best) best.textContent = distanceLabel(bestMeters);

    const paused = document.getElementById("game-paused");
    const isPaused = Boolean(paused && getComputedStyle(paused).display !== "none");
    document.getElementById("sr-pause")?.setAttribute("aria-pressed", String(isPaused));
    document.getElementById("sr-pause")?.setAttribute("aria-label", isPaused ? "Resume the drive" : "Pause the drive");
    document.getElementById("sr-pause")?.setAttribute("title", isPaused ? "Resume the drive" : "Pause the drive");

    const audioImage = Array.from(document.querySelectorAll("#menu-bar-right img.menu-icon"))
      .find((image) => /vol_(high|off)/.test(image.getAttribute("src") || image.src));
    const audioOff = Boolean(audioImage && (audioImage.getAttribute("src") || audioImage.src).includes("vol_off"));
    document.getElementById("sr-audio")?.setAttribute("aria-pressed", String(audioOff));
  }

  function finishSession() {
    const meters = Math.max(sessionMaxMeters, readTotalMeters() - sessionStartMeters);
    if (meters > bestMeters) {
      bestMeters = meters;
      writeStorage(BEST_KEY, bestMeters);
    }
  }

  function updateSession() {
    if (!wasDriving) return;
    const current = Math.max(0, readTotalMeters() - sessionStartMeters);
    sessionMaxMeters = Math.max(sessionMaxMeters, current);
    if (sessionMaxMeters > bestMeters) {
      bestMeters = sessionMaxMeters;
      writeStorage(BEST_KEY, bestMeters);
    }
    const elapsed = document.getElementById("sr-session-time");
    if (elapsed) elapsed.textContent = formatDuration(Date.now() - sessionStartedAt);
    const best = document.getElementById("sr-best-distance");
    if (best) best.textContent = distanceLabel(bestMeters);
  }

  let queuedSync = false;
  function scheduleSync() {
    if (queuedSync) return;
    queuedSync = true;
    window.requestAnimationFrame(() => {
      queuedSync = false;
      syncState();
    });
  }

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.body, { childList: true, subtree: true });
  syncState();
  window.setInterval(() => {
    syncState();
    updateSession();
  }, 750);
})();
