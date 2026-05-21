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
       <script src="submit-location.js"></script>

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

  const BUTTON_HTML = `
    <div id="td-location-row" style="
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    ">
      <button
        type="button"
        id="${BTN_ID}"
        style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: #f5f0e8;
          border: 1px solid #c8a96e;
          border-radius: 6px;
          font-size: 0.82rem;
          font-family: inherit;
          color: #7a4f1e;
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
    if (document.getElementById(BTN_ID)) return;

    // Find the lat field row — insert our button row just before it
    const latInput = document.getElementById('sf-lat');
    if (!latInput) return;

    // Walk up to the sf-row div that contains lat + lng
    const latRow = latInput.closest('.sf-row');
    if (!latRow) return;

    // Insert button row before the lat/lng row
    latRow.insertAdjacentHTML('beforebegin', BUTTON_HTML);

    // Bind click
    document.getElementById(BTN_ID).addEventListener('click', handleDetectClick);
  }

  /* ── Main handler ────────────────────────────────────────── */
  async function handleDetectClick() {
    const btn       = document.getElementById(BTN_ID);
    const statusEl  = document.getElementById(STATUS_ID);

    if (!navigator.geolocation) {
      setStatus(statusEl, '⚠️ GPS not supported in this browser.', 'error');
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
  window.tdDetectLocation = handleDetectClick;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForModal);
  } else {
    watchForModal();
  }

})();
