/* ═══════════════════════════════════════════════════════════
   TempleDiary — submit-location.js
   Standalone GPS + reverse-geocode helper for the submit modal.

   What this file does:
     - Adds a "📍 Detect my location" button next to the
       Latitude / Longitude fields in the submit form
     - On click: asks browser for GPS coordinates
     - Fills sf-lat and sf-lng automatically
     - Calls Nominatim (OpenStreetMap, free, no API key)
       to reverse-geocode coordinates into:
         district, state, location/address
     - Fills sf-district, sf-location fields automatically
     - Shows a small live status message while working

   How to add to your site:
     Add ONE script tag in index.html AFTER main.js:
       <script src="assets/js/public/submit-location.js"></script>

   Dependencies: none. Vanilla JS, no libraries needed.
   Cloudflare Pages: just drop this file in your repo root.
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────── */
  const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
  const NOMINATIM_USERAGENT = 'TempleDiary/1.0 (templediary.in)'; // required by Nominatim ToS

  /* ── Button HTML injected next to lat/lng fields ─────────── */
  const BTN_ID     = 'td-detect-location-btn';
  const STATUS_ID  = 'td-location-status';
  const MANUAL_HELPER_ID = 'td-manual-location-help';
  let promptMode = 'gps';

  const BUTTON_HTML = `
    <div id="td-location-row" style="
      grid-column: 1 / -1;
      display: grid;
      align-items: start;
      gap: 10px;
      padding: 12px;
      background: #fffaf0;
      border: 1px solid #ead7a8;
      border-radius: 10px;
      margin-bottom: 4px;
    ">
      <div style="font-size: 0.88rem; color: #5b4631; line-height: 1.45;">
        <strong style="color:#7b1c1c;">Are you inside the temple or at the temple premises?</strong><br>
        If yes, click <strong>Detect my location</strong> and allow location permission. Latitude, longitude and address will be filled automatically.
        If you are submitting from home, skip this button and paste the Google Maps link or address in the Location / Address box.
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <button
          type="button"
          id="${BTN_ID}"
          style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 9px 15px;
            background: #7b1c1c;
            border: 1px solid #7b1c1c;
            border-radius: 999px;
            font-size: 0.84rem;
            font-family: inherit;
            font-weight: 800;
            color: #fff;
            cursor: pointer;
            transition: background 0.2s;
            white-space: nowrap;
          "
        >
          📍 Detect my location
        </button>
        <span
          id="${STATUS_ID}"
          style="
            font-size: 0.78rem;
            color: #888;
            font-family: inherit;
          "
          aria-live="polite"
        ></span>
      </div>
    </div>
  `;

  const MANUAL_HELPER_HTML = `
    <div id="${MANUAL_HELPER_ID}" style="
      grid-column: 1 / -1;
      display: none;
      margin-bottom: 4px;
    ">
      <details style="
        padding: 12px;
        background: #fffaf0;
        border: 1px solid #ead7a8;
        border-radius: 10px;
        color: #5b4631;
      ">
        <summary style="
          cursor: pointer;
          font-weight: 800;
          color: #7b1c1c;
        ">Need latitude and longitude? How to get it from Google Maps</summary>
        <ol style="margin: 10px 0 0; padding-left: 20px; line-height: 1.55; font-size: 0.9rem;">
          <li>Open Google Maps and search the temple name.</li>
          <li>Tap or long-press the exact temple location to drop a pin.</li>
          <li>Google Maps will show two numbers at the top or in the place details, like <strong>10.12345, 76.12345</strong>.</li>
          <li>Copy the first number into <strong>Latitude</strong>.</li>
          <li>Copy the second number into <strong>Longitude</strong>.</li>
          <li>If this feels difficult, leave Latitude and Longitude blank and paste the Google Maps link or best address in the Location / Address box.</li>
        </ol>
      </details>
    </div>
  `;

  /* ── Wait for the submit modal to appear in the DOM ─────── */
  // main.js creates the modal lazily on first open.
  // We use a MutationObserver to detect when it's added.
  function watchForModal() {
    // If modal already exists (page reload with modal open)
    const existing = document.getElementById('sf-lat');
    if (existing) { injectButton(); return; }

    const observer = new MutationObserver(() => {
      if (document.getElementById('sf-lat')) {
        observer.disconnect();
        injectButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ── Inject the button into the form ────────────────────── */
  function injectButton() {
    // Don't inject twice
    if (document.getElementById(BTN_ID) && document.getElementById(MANUAL_HELPER_ID)) {
      applyPromptMode();
      return;
    }

    // Find the lat field row — insert our button row just before it
    const latInput = document.getElementById('sf-lat');
    if (!latInput) return;

    // Walk up to the sf-row div that contains lat + lng
    const latRow = latInput.closest('.sf-row');
    if (!latRow) return;

    // Insert helper and GPS rows before the lat/lng row
    if (!document.getElementById(MANUAL_HELPER_ID)) {
      latRow.insertAdjacentHTML('beforebegin', MANUAL_HELPER_HTML);
    }
    if (!document.getElementById(BTN_ID)) {
      latRow.insertAdjacentHTML('beforebegin', BUTTON_HTML);
    }

    // Bind click
    document.getElementById(BTN_ID)?.addEventListener('click', handleDetectClick);
    applyPromptMode();
  }

  function applyPromptMode() {
    const gpsRow = document.getElementById('td-location-row');
    const manualHelper = document.getElementById(MANUAL_HELPER_ID);

    if (gpsRow) {
      gpsRow.style.display = promptMode === 'manual' ? 'none' : 'grid';
    }
    if (manualHelper) {
      manualHelper.style.display = promptMode === 'manual' ? 'block' : 'none';
    }
  }

  /* ── Main handler ────────────────────────────────────────── */
  async function handleDetectClick() {
    const btn       = document.getElementById(BTN_ID);
    const statusEl  = document.getElementById(STATUS_ID);

    if (!navigator.geolocation) {
      setStatus(statusEl, '⚠️ GPS not supported in this browser.', 'error');
      return;
    }

    if (!btn) {
      return;
    }

    btn.disabled = true;
    setStatus(statusEl, '⏳ Getting your location…', 'info');

    try {
      const position = await getPosition();
      const { latitude: lat, longitude: lng } = position.coords;

      // Fill lat/lng immediately
      setField('sf-lat', lat.toFixed(6));
      setField('sf-lng', lng.toFixed(6));
      setStatus(statusEl, '📡 Got coordinates. Looking up address…', 'info');

      // Reverse geocode
      const place = await reverseGeocode(lat, lng);
      fillAddressFields(place);

      setStatus(statusEl, '✅ Location filled! Please verify and correct if needed.', 'success');

    } catch (err) {
      handleError(err, statusEl);
    } finally {
      btn.disabled = false;
    }
  }

  /* ── Geolocation wrapper (Promise-based) ─────────────────── */
  function getPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  }

  /* ── Nominatim reverse geocode ───────────────────────────── */
  async function reverseGeocode(lat, lng) {
    const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        // Nominatim requires a User-Agent identifying your app
        'User-Agent': NOMINATIM_USERAGENT,
      },
    });

    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

    const data = await res.json();
    return data;
  }

  /* ── Fill form fields from Nominatim response ────────────── */
  function fillAddressFields(place) {
    if (!place || !place.address) return;

    const addr = place.address;

    // District: Nominatim uses different keys for Indian districts
    const district =
      addr.county          ||   // most common for Indian districts
      addr.state_district  ||
      addr.district        ||
      addr.city_district   ||
      '';

    // State
    const state = addr.state || '';

    // Location: build a readable string
    const locationParts = [
      addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || '',
      district,
      state,
    ].filter(Boolean);
    const location = locationParts.join(', ');

    // Fill fields — only fill if field is currently empty
    // (don't overwrite if user already typed something)
    setFieldIfEmpty('sf-district', district);
    setFieldIfEmpty('sf-location', location);

    // Also try to fill state selector if your form has one
    // setFieldIfEmpty('sf-state', state);
  }

  /* ── Field helpers ───────────────────────────────────────── */
  function setField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function setFieldIfEmpty(id, value) {
    const el = document.getElementById(id);
    if (el && !el.value.trim() && value) el.value = value;
  }

  /* ── Status message ──────────────────────────────────────── */
  function setStatus(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.style.color = type === 'error'   ? '#c0392b'
                   : type === 'success' ? '#27ae60'
                   :                      '#888';

    // Auto-clear success message after 6 seconds
    if (type === 'success') {
      setTimeout(() => { if (el) el.textContent = ''; }, 6000);
    }
  }

  /* ── Error handling ──────────────────────────────────────── */
  function handleError(err, statusEl) {
    // GeolocationPositionError codes
    if (err.code === 1) {
      const isIOS     = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isAndroid = /android/i.test(navigator.userAgent);

      let guide = '';
      if (isIOS) {
        guide = ' To enable: Settings → Safari → Location → Allow.';
      } else if (isAndroid) {
        guide = ' To enable: Settings → Apps → Browser → Permissions → Location → Allow.';
      } else {
        guide = ' To enable: click the lock icon in your browser address bar → Site settings → Location → Allow.';
      }

      setStatus(statusEl,
        '🚫 Location permission denied.' + guide,
        'error'
      );
    } else if (err.code === 2) {
      setStatus(statusEl, '⚠️ Location unavailable. Try moving to an open area.', 'error');
    } else if (err.code === 3) {
      setStatus(statusEl, '⏱️ Location timed out. Try again.', 'error');
    } else {
      // Network or Nominatim error
      console.warn('TempleDiary submit-location:', err);
      setStatus(statusEl,
        '⚠️ Could not look up address. Coordinates filled — please enter district manually.',
        'error'
      );
    }
  }

  /* ── Boot ────────────────────────────────────────────────── */

  // Expose so main.js can trigger GPS programmatically
  // (used by the "I'm at the Temple Now" button flow)
  window.tdDetectLocation = function () {
    promptMode = 'gps';
    injectButton();
    applyPromptMode();
    handleDetectClick();
  };

  window.tdSetLocationPromptMode = function (mode) {
    promptMode = mode === 'manual' ? 'manual' : 'gps';
    applyPromptMode();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForModal);
  } else {
    watchForModal();
  }

})();
