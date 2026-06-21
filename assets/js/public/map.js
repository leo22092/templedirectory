/* ════════════════════════════════════════
   TEMPLE MAP — map.js
   Loaded by map.html AFTER all data files.
   map.html must NOT have an inline map init block.
════════════════════════════════════════ */

/* ── 1. READ URL PARAMS FIRST ─────────────────────────── */
const params           = new URLSearchParams(window.location.search);
const selectedState    = params.get('state') || 'kerala';
const selectedTempleId = Number(params.get('id')) || 0;

/* ── 2. STATE CONFIG ──────────────────────────────────── */
const STATE_CONFIG = window.TD_STATES?.registry || {};

const activeConfig = STATE_CONFIG[selectedState] || STATE_CONFIG.kerala;
let activeTemples = [];

renderStateLinks();

/* ── 5. INIT MAP ──────────────────────────────────────── */
const view = activeConfig.view;
const map = L.map('map').setView(view.center, view.zoom);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
).addTo(map);

function renderStateLinks() {
  const container = document.getElementById('map-state-links');
  if (!container) return;

  container.innerHTML = Object.entries(STATE_CONFIG).map(([key, cfg]) => {
    const activeStyle = key === selectedState ? 'background: #7B1C1C; color: #fff;' : 'background: #FEF3DC; color: #7B1C1C;';
    return `<a href="?state=${escapeAttr(key)}" style="padding: 10px; ${activeStyle} text-decoration: none; border-radius: 5px; font-weight: bold; border: 1px solid #7B1C1C;">${cfg.icon || '🛕'} ${escapeHtml(cfg.label || key)}</a>`;
  }).join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

/* ── 6. POPULATE DROPDOWNS FROM ACTIVE DATA ──────────── */
function populateDropdowns() {
  const districtSel = document.getElementById('district-filter');
  const deitySel    = document.getElementById('deity-filter');
  if (!districtSel || !deitySel) return;

  const districts = [...new Set(activeTemples.map(t => t.district).filter(Boolean))].sort();
  districtSel.innerHTML = '<option value="">All Districts</option>';
  districts.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    districtSel.appendChild(o);
  });

  const deities = [...new Set(activeTemples.map(t => t.deity).filter(Boolean))].sort();
  deitySel.innerHTML = '<option value="">All Deities</option>';
  deities.forEach(d => {
    const o = document.createElement('option');
    o.value = d; o.textContent = d;
    deitySel.appendChild(o);
  });
}

/* ── 7. MARKERS ───────────────────────────────────────── */
let markers = [];

function updateMapRobotsMeta(districtVal, deityVal, famousVal, searchVal) {
  const hasFilters = districtVal || deityVal || famousVal || searchVal;
  let robotsMeta = document.querySelector('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    document.head.appendChild(robotsMeta);
  }
  robotsMeta.content = hasFilters ? 'noindex, follow' : 'index, follow';
}

function renderMarkers() {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const districtVal = (document.getElementById('district-filter')?.value || '').trim();
  const deityVal    = (document.getElementById('deity-filter')?.value    || '').trim();
  const famousVal   =  document.getElementById('famous-filter')?.value   || '';
  const searchVal   = (document.getElementById('search-filter')?.value   || '').toLowerCase().trim();

  updateMapRobotsMeta(districtVal, deityVal, famousVal, searchVal);

  const filtered = activeTemples.filter(t => {
    const mDist   = !districtVal || t.district === districtVal;
    const mDeity  = !deityVal    || t.deity    === deityVal;
    const mFamous = !famousVal   || t.famous   === true;
    const mSearch = !searchVal   ||
      (t.name     || '').toLowerCase().includes(searchVal) ||
      (t.location || '').toLowerCase().includes(searchVal) ||
      (t.deity    || '').toLowerCase().includes(searchVal);
    return mDist && mDeity && mFamous && mSearch;
  });

  const mappable = filtered.filter(t => t.lat && t.lng);
  const countEl = document.getElementById('visible-count');
  if (countEl) countEl.textContent = mappable.length;

  mappable.forEach(t => {
    const marker = L.marker([t.lat, t.lng]).addTo(map);
    marker.bindPopup(`
      <div style="min-width:210px;font-family:sans-serif;line-height:1.5">
        <div style="font-weight:700;font-size:1rem;color:#7B1C1C;margin-bottom:6px">${t.name}</div>
        <div style="font-size:0.85rem;margin-bottom:3px"><strong>Deity:</strong> ${t.deity || '—'}</div>
        <div style="font-size:0.85rem;margin-bottom:3px"><strong>District:</strong> ${t.district || '—'}</div>
        <div style="font-size:0.85rem;margin-bottom:3px"><strong>Location:</strong> ${t.location || '—'}</div>
        ${t.timing ? `<div style="font-size:0.85rem;margin-bottom:3px"><strong>Timings:</strong> ${t.timing}</div>` : ''}
        ${t.phone  ? `<div style="font-size:0.85rem;margin-bottom:6px"><strong>Phone:</strong> <a href="tel:${t.phone}">${t.phone}</a></div>` : ''}
        <a style="display:inline-block;margin-top:4px;padding:6px 14px;background:#7B1C1C;color:#fff;border-radius:999px;font-size:0.8rem;font-weight:700;text-decoration:none"
           target="_blank" href="https://www.google.com/maps?q=${t.lat},${t.lng}">
          🗺️ Google Maps
        </a>
      </div>
    `);
    markers.push(marker);

    if (t.id === selectedTempleId) {
      map.setView([t.lat, t.lng], 13);
      setTimeout(() => marker.openPopup(), 400);
    }
  });

  if (markers.length > 0 && !selectedTempleId) {
    try {
      map.fitBounds(L.featureGroup(markers).getBounds(), { padding: [40, 40] });
    } catch(e) { /* single point */ }
  }
}

/* ── 8. DATA LOADING ──────────────────────────────────── */
async function loadActiveTemples() {
  try {
    const sources = activeConfig.dataFiles || [activeConfig.dataFile];
    const loaded = await Promise.all(sources.map(loadTempleJsonSource));
    activeTemples = mergeTempleSources(loaded);
  } catch (err) {
    console.warn('BharatDevasthanam map: failed to load state data', selectedState, err);
    activeTemples = [];
  }
}

async function loadTempleJsonSource(dataFile) {
  try {
    const res = await fetch(dataFile, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const defaults = json._defaults || {};
    const raw = Array.isArray(json) ? json : (json.temples || []);

    return raw.map(t => ({ ...defaults, ...t }));
  } catch (err) {
    console.warn('BharatDevasthanam map: failed to load', dataFile, err);
    return [];
  }
}

function mergeTempleSources(sources) {
  const merged = [];
  const byKey = new Map();

  sources.flat().forEach(temple => {
    const key = temple.id
      ? `id:${temple.id}`
      : `name:${normalizeTempleName(temple.name)}:${String(temple.district || '').toLowerCase()}`;

    if (!byKey.has(key)) {
      byKey.set(key, temple);
      merged.push(temple);
      return;
    }

    Object.assign(byKey.get(key), mergeTempleRecord(byKey.get(key), temple));
  });

  return merged;
}

function mergeTempleRecord(current, incoming) {
  const merged = { ...current };

  Object.entries(incoming).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      merged[key] = value;
    }
  });

  return merged;
}

function normalizeTempleName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\b(sree|sri|shri)\b/g, '')
    .replace(/\btemple\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

/* ── 9. EVENT LISTENERS ───────────────────────────────── */
document.getElementById('district-filter')?.addEventListener('change', renderMarkers);
document.getElementById('deity-filter')?.addEventListener('change',    renderMarkers);
document.getElementById('famous-filter')?.addEventListener('change',   renderMarkers);
document.getElementById('search-filter')?.addEventListener('input',    renderMarkers);

document.getElementById('clear-map-filters')?.addEventListener('click', () => {
  ['district-filter','deity-filter','famous-filter','search-filter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  renderMarkers();
});

/* ── 10. PAGE TITLE & HEADING ─────────────────────────── */
const stateLabel = activeConfig.label || 'India';
document.title = `${stateLabel} Temple Map — TempleDiary`;

let canonical = document.querySelector('link[rel="canonical"]');
if (canonical) {
  canonical.href = `https://www.templediary.in/map.html?state=${selectedState}`;
}

const pageHeading = document.getElementById('map-page-title');
if (pageHeading) pageHeading.textContent = `${stateLabel} Temple Map`;

/* ── 11. KICK OFF ─────────────────────────────────────── */
loadActiveTemples().then(() => {
  const pageSub = document.getElementById('map-page-sub');
  if (pageSub) pageSub.textContent = `${activeTemples.length} temples loaded`;
  populateDropdowns();
  renderMarkers();
});
