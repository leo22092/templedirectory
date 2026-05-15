/* ═══════════════════════════════════════════════════
   BharatDevasthanam — main.js
   Multi-state architecture: Kerala, Tamil Nadu (+ more)
   Adding a new state: create a data file, add script tag
   in index.html, register in STATE_REGISTRY below.
   Each state is fully independent.
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     STATE REGISTRY
     To add a new state:
       1. Create its data file (e.g. karnataka-data.js)
       2. Add a <script> tag in index.html
       3. Add an entry here
       4. Add a tab button in the state switcher HTML
  ───────────────────────────────────────────────── */
  const STATE_REGISTRY = {
    'kerala': {
      label:        'Kerala',
      eyebrow:      "God's Own Country",
      heroSub:      'Find any temple in Kerala — search by name, district, deity or location.<br>Timings, contact numbers, travel info and more.',
      statTemples:  '1,200+',
      statDistricts:'14',
      mapLabel:     'Explore Kerala',
      heroImage:    'sources/kerala_hero.jpeg',
      getData:      () => (typeof TEMPLES_KERALA !== 'undefined' ? TEMPLES_KERALA : []),
      bodyClass:    'state-kerala',
    },
    'tamil-nadu': {
      label:        'Tamil Nadu',
      eyebrow:      'Land of Dravidian Glory',
      heroSub:      'Find any temple in Tamil Nadu — Chola gopurams, Pancha Bhuta Stalas, Divya Desams and more.<br>Timings, contact numbers, travel info and more.',
      statTemples:  '400+',
      statDistricts:'38',
      mapLabel:     'Explore Tamil Nadu',
      heroImage:    './sources/tamilnadu_hero.jpeg',
      getData:      () => (typeof TEMPLES_TN !== 'undefined' ? TEMPLES_TN : []),
      bodyClass:    'state-tamil-nadu',
    },
    'karnataka': {
      label:        'Karnataka',
      eyebrow:      'Land of the Gods',
      heroSub:      'Find any temple in Karnataka — from Hampi to Udupi, discover ancient shrines and living traditions.<br>Timings, contact numbers, travel info and more.',
      statTemples:  '500+',
      statDistricts:'31',
      mapLabel:     'Explore Karnataka',
      heroImage:    'sources/karnataka_hero.jpeg',
      getData:      () => (typeof TEMPLES_KA !== 'undefined' ? TEMPLES_KA : []),
      bodyClass:    'state-karnataka',
    },
  };

  /* ── Config ── */
  const PER_PAGE = 12;
  const DEFAULT_STATE = 'kerala';

  /* ── Active state ── */
  let activeState = DEFAULT_STATE;

  /* ── App state ── */
  let state = {
    query:    '',
    district: '',
    deity:    '',
    sort:     'name',
    page:     1,
  };

  /* ── DOM refs ── */
  const grid         = document.getElementById('temple-grid');
  const noResults    = document.getElementById('no-results');
  const countEl      = document.getElementById('results-count');
  const pagination   = document.getElementById('pagination');
  const filterSearch = document.getElementById('filter-search');
  const filterDist   = document.getElementById('filter-district');
  const filterDeity  = document.getElementById('filter-deity');
  const sortSelect   = document.getElementById('sort-select');
  const clearBtn     = document.getElementById('clear-filters');
  const heroSearch   = document.getElementById('hero-search');
  const yearEl       = document.getElementById('year');
  const navToggle    = document.getElementById('nav-toggle');
  const navMenu      = document.getElementById('nav-menu');
  const distChips    = document.getElementById('district-chips');
  const heroEyebrow  = document.getElementById('hero-eyebrow');
  const heroStateName= document.getElementById('hero-state-name');
  const heroSubEl    = document.getElementById('hero-sub');
  const statTemples  = document.getElementById('stat-temples');
  const statDistricts= document.getElementById('stat-districts');

  /* ══════════════════════════
     INIT
  ══════════════════════════ */
  function init() {
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Read ?state= or ?q= from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('state') && STATE_REGISTRY[params.get('state')]) {
      activeState = params.get('state');
    }
    if (params.get('q')) {
      state.query = params.get('q');
      if (filterSearch) filterSearch.value = state.query;
      if (heroSearch)   heroSearch.value   = state.query;
    }

    initCookieBanner();
    initHamburger();
    initStateTabs();
    applyState(activeState, false); // false = don't push history on first load
    initFilterListeners();
    initHeroSearch();
    initBackToTop();
    initModal();
    initSubmitModal();
  }

  /* ══════════════════════════
     STATE SWITCHING
  ══════════════════════════ */
  function initStateTabs() {
    document.querySelectorAll('.state-tab[data-state]').forEach(tab => {
      tab.addEventListener('click', () => {
        const s = tab.dataset.state;
        if (s === activeState) return;
        applyState(s, true);
      });
    });
  }

  function applyState(stateKey, pushHistory) {
    const cfg = STATE_REGISTRY[stateKey];
    if (!cfg) return;
    activeState = stateKey;

    // Update tab UI
    document.querySelectorAll('.state-tab[data-state]').forEach(t => {
      const isActive = t.dataset.state === stateKey;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });

    // Update body class for state-specific theming
    Object.values(STATE_REGISTRY).forEach(c => document.body.classList.remove(c.bodyClass));
    document.body.classList.add(cfg.bodyClass);

    // Update hero
    const heroSection = document.getElementById('hero-section');
    if (heroSection && cfg.heroImage) {
      heroSection.style.background = `linear-gradient(160deg, rgba(74,13,26,0.92) 0%, rgba(28,16,8,0.88) 55%, rgba(45,90,39,0.85) 100%), url('${cfg.heroImage}') center center / cover no-repeat`;
    }
    if (heroEyebrow)   heroEyebrow.textContent  = cfg.eyebrow;
    if (heroStateName) heroStateName.textContent = cfg.label;
    if (heroSubEl)     heroSubEl.innerHTML       = cfg.heroSub;
    if (statTemples)   statTemples.textContent   = cfg.statTemples;
    if (statDistricts) statDistricts.textContent = cfg.statDistricts;

    // Rebuild filter dropdowns
    populateFilters(cfg.getData());

    // Rebuild district chips
    populateChips(cfg.getData());

    // Update map section
    const mapLabel  = document.getElementById('map-section-label');
    const mapBtn    = document.getElementById('map-section-btn');
    const mapBg     = document.getElementById('map-section-bg');
    if (mapLabel) mapLabel.textContent = cfg.mapLabel || ('Explore ' + cfg.label);
    if (mapBtn)   mapBtn.href = `map.html?state=${stateKey}`;
    if (mapBg && cfg.heroImage) {
      mapBg.style.background = `linear-gradient(120deg,rgba(28,10,2,0.82) 0%,rgba(28,10,2,0.65) 50%,rgba(45,90,39,0.60) 100%), url('${cfg.heroImage}') center center / cover no-repeat`;
    }

    // Reset filter state
    state = { query: state.query, district: '', deity: '', sort: 'name', page: 1 };
    if (filterDist)  filterDist.value  = '';
    if (filterDeity) filterDeity.value = '';

    render();

    // Update URL
    if (pushHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set('state', stateKey);
      window.history.pushState({ state: stateKey }, '', url.toString());
    }
  }

  // Handle browser back/forward
  window.addEventListener('popstate', e => {
    if (e.state && e.state.state) {
      applyState(e.state.state, false);
    }
  });

  /* ══════════════════════════
     POPULATE FILTERS DYNAMICALLY
  ══════════════════════════ */
  function populateFilters(temples) {
    const districts = [...new Set(temples.map(t => t.district))].sort();
    const deities   = [...new Set(temples.map(t => t.deity))].sort();

    if (filterDist) {
      filterDist.innerHTML = '<option value="">All districts</option>';
      districts.forEach(d => {
        const o = document.createElement('option');
        o.value = d; o.textContent = d;
        filterDist.appendChild(o);
      });
    }

    if (filterDeity) {
      filterDeity.innerHTML = '<option value="">All deities</option>';
      deities.forEach(d => {
        const o = document.createElement('option');
        o.value = d; o.textContent = d;
        filterDeity.appendChild(o);
      });
    }
  }

  /* ══════════════════════════
     POPULATE DISTRICT CHIPS
  ══════════════════════════ */
  function populateChips(temples) {
    if (!distChips) return;
    const districts = [...new Set(temples.map(t => t.district))].sort();
    distChips.innerHTML = '';
    districts.forEach(d => {
      const li  = document.createElement('li');
      const a   = document.createElement('a');
      a.href = '#';
      a.className = 'chip';
      a.dataset.district = d;
      a.textContent = d;
      a.addEventListener('click', e => {
        e.preventDefault();
        if (state.district === d) {
          state.district = '';
          a.classList.remove('active');
          if (filterDist) filterDist.value = '';
        } else {
          distChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          a.classList.add('active');
          state.district = d;
          if (filterDist) filterDist.value = d;
        }
        state.page = 1;
        render();
        document.getElementById('directory').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      li.appendChild(a);
      distChips.appendChild(li);
    });
  }

  /* ══════════════════════════
     FILTER LISTENERS
  ══════════════════════════ */
  function initFilterListeners() {
    if (filterSearch) filterSearch.addEventListener('input', debounce(() => { state.query = filterSearch.value; state.page = 1; render(); }, 280));
    if (filterDist)   filterDist.addEventListener('change', () => { state.district = filterDist.value; state.page = 1; render(); syncChips(); });
    if (filterDeity)  filterDeity.addEventListener('change', () => { state.deity = filterDeity.value; state.page = 1; render(); });
    if (sortSelect)   sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; state.page = 1; render(); });
    if (clearBtn)     clearBtn.addEventListener('click', clearFilters);
  }

  function initHeroSearch() {
    const heroForm = document.querySelector('.search-form');
    if (heroForm) {
      heroForm.addEventListener('submit', e => {
        e.preventDefault();
        state.query = heroSearch.value;
        state.page = 1;
        if (filterSearch) filterSearch.value = state.query;
        render();
        document.getElementById('directory').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  /* ══════════════════════════
     HAMBURGER
  ══════════════════════════ */
  function initHamburger() {
    if (navToggle) {
      navToggle.addEventListener('click', () => {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', String(!expanded));
        navMenu.classList.toggle('open', !expanded);
      });
    }
  }

  /* ══════════════════════════
     FILTER & SORT
  ══════════════════════════ */
  function getFiltered() {
    const cfg = STATE_REGISTRY[activeState];
    const temples = cfg ? cfg.getData() : [];
    const q = state.query.toLowerCase().trim();
    return temples
      .filter(t => {
        const matchQ = !q ||
          t.name.toLowerCase().includes(q) ||
          t.deity.toLowerCase().includes(q) ||
          t.district.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q));
        const matchD  = !state.district || t.district === state.district;
        const matchDe = !state.deity    || t.deity    === state.deity;
        return matchQ && matchD && matchDe;
      })
      .sort((a, b) => {
        if (state.sort === 'district') return a.district.localeCompare(b.district) || a.name.localeCompare(b.name);
        return a.name.localeCompare(b.name);
      });
  }

  /* ══════════════════════════
     RENDER
  ══════════════════════════ */
  function render() {
    const filtered = getFiltered();
    const total    = filtered.length;
    const pages    = Math.ceil(total / PER_PAGE) || 1;
    state.page     = Math.min(state.page, pages);
    const start    = (state.page - 1) * PER_PAGE;
    const slice    = filtered.slice(start, start + PER_PAGE);

    if (countEl) countEl.textContent = total.toLocaleString();
    if (!grid) return;
    grid.innerHTML = '';

    if (total === 0) {
      noResults && noResults.removeAttribute('hidden');
    } else {
      noResults && noResults.setAttribute('hidden', '');
      slice.forEach((t, i) => grid.appendChild(buildCard(t, i)));
    }
    buildPagination(pages);
  }

  /* ══════════════════════════
     CARD BUILDER
  ══════════════════════════ */
  function buildCard(t, idx) {
    const div = document.createElement('article');
    div.className = 'temple-card';
    div.setAttribute('role', 'listitem');
    div.style.animationDelay = `${idx * 0.04}s`;
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `${t.name}, ${t.district}`);
    div.innerHTML = `
      ${t.famous ? `<span class="badge-famous">⭐ Famous</span>` : ''}
      <div class="card-deity">${escHtml(t.deity)}</div>
      <h3 class="card-name">${escHtml(t.name)}</h3>
      <p class="card-desc">${escHtml(t.description || '')}</p>
      <div class="card-meta">
        <div class="card-meta-row">${iconLocation()}<span>${escHtml(t.location)}</span></div>
        ${t.timing ? `<div class="card-meta-row">${iconClock()}<span>${escHtml(t.timing)}</span></div>` : ''}
        ${t.phone  ? `<div class="card-meta-row">${iconPhone()}<span><a href="tel:${escHtml(t.phone)}">${escHtml(t.phone)}</a></span></div>` : ''}
      </div>
    `;
    div.addEventListener('click', () => openModal(t));
    div.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(t); });
    return div;
  }

  /* ══════════════════════════
     SYNC CHIPS
  ══════════════════════════ */
  function syncChips() {
    if (!distChips) return;
    distChips.querySelectorAll('.chip').forEach(c => {
      c.classList.toggle('active', c.dataset.district === state.district);
    });
  }

  /* ══════════════════════════
     CLEAR FILTERS
  ══════════════════════════ */
  function clearFilters() {
    state.query = ''; state.district = ''; state.deity = ''; state.sort = 'name'; state.page = 1;
    if (filterSearch) filterSearch.value = '';
    if (filterDist)   filterDist.value   = '';
    if (filterDeity)  filterDeity.value  = '';
    if (sortSelect)   sortSelect.value   = 'name';
    if (heroSearch)   heroSearch.value   = '';
    if (distChips) distChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    render();
  }

  /* ══════════════════════════
     PAGINATION
  ══════════════════════════ */
  function buildPagination(pages) {
    if (!pagination) return;
    pagination.innerHTML = '';
    if (pages <= 1) return;

    const makeBtn = (label, page, disabled, active, ariaLabel) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.setAttribute('aria-label', ariaLabel || label);
      if (disabled) { b.disabled = true; b.setAttribute('aria-disabled', 'true'); }
      if (active)   b.classList.add('active');
      b.addEventListener('click', () => {
        state.page = page;
        render();
        document.getElementById('directory').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return b;
    };

    pagination.appendChild(makeBtn('←', state.page - 1, state.page === 1, false, 'Previous page'));

    const delta = 2;
    let last = 0;
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= state.page - delta && i <= state.page + delta)) {
        if (last && i - last > 1) {
          const gap = document.createElement('span');
          gap.textContent = '…'; gap.className = 'page-gap';
          pagination.appendChild(gap);
        }
        pagination.appendChild(makeBtn(String(i), i, false, i === state.page, `Page ${i}`));
        last = i;
      }
    }

    pagination.appendChild(makeBtn('→', state.page + 1, state.page === pages, false, 'Next page'));
  }

  /* ══════════════════════════
     MODAL
  ══════════════════════════ */
  let modalOverlay = null;

  function initModal() {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.setAttribute('role', 'dialog');
    modalOverlay.setAttribute('aria-modal', 'true');
    modalOverlay.setAttribute('aria-label', 'Temple detail');
    modalOverlay.innerHTML = `<div class="modal"><div class="modal-header"><div id="modal-deity" class="modal-deity"></div><div id="modal-name" class="modal-name"></div><button class="modal-close" aria-label="Close">✕</button></div><div class="modal-body"><p id="modal-badge" class="modal-badge"></p><p id="modal-desc" class="modal-desc"></p><div class="modal-info" id="modal-info"></div><div class="modal-actions" id="modal-actions"></div></div></div>`;
    document.body.appendChild(modalOverlay);
    modalOverlay.querySelector('.modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  function openModal(t) {
    modalOverlay.querySelector('#modal-deity').textContent = t.deity;
    modalOverlay.querySelector('#modal-name').textContent  = t.name;
    modalOverlay.querySelector('#modal-badge').textContent = t.famous ? '⭐ Famous Temple' : '';
    modalOverlay.querySelector('#modal-badge').style.display = t.famous ? '' : 'none';
    modalOverlay.querySelector('#modal-desc').textContent  = t.description || '';

    const rows = [
      ['Location',    t.location],
      ['District',    t.district],
      ['Timings',     t.timing],
      ['Phone',       t.phone ? `<a href="tel:${escHtml(t.phone)}">${escHtml(t.phone)}</a>` : null],
      ['Dress Code',  t.dressCode],
      ['Photography', t.photography],
      ['Nearest Bus', t.nearestBus],
      ['Nearest Rail',t.nearestRail],
    ];
    const info = modalOverlay.querySelector('#modal-info');
    info.innerHTML = rows
      .filter(([, v]) => v)
      .map(([l, v]) => `<div class="modal-info-row"><span class="modal-info-label">${l}</span><span class="modal-info-value">${l === 'Phone' ? v : escHtml(v)}</span></div>`)
      .join('');

    const actions = modalOverlay.querySelector('#modal-actions');
    actions.innerHTML = '';
    if (t.lat && t.lng) {
      const mapBtn = document.createElement('a');
      mapBtn.className = 'modal-map-btn';
      mapBtn.href = `https://www.google.com/maps?q=${t.lat},${t.lng}`;
      mapBtn.target = '_blank'; mapBtn.rel = 'noopener noreferrer';
      mapBtn.innerHTML = `${iconLocation()} View on Map`;
      actions.appendChild(mapBtn);
    }
    const submitBtn = document.createElement('button');
    submitBtn.className = 'modal-submit-btn';
    submitBtn.textContent = '✏️ Suggest a correction';
    submitBtn.addEventListener('click', () => openSubmitModal(t));
    actions.appendChild(submitBtn);

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ══════════════════════════
     SUBMIT MODAL
  ══════════════════════════ */
  let submitOverlay = null;

  function initSubmitModal() {
    submitOverlay = document.createElement('div');
    submitOverlay.className = 'modal-overlay submit-overlay';
    submitOverlay.setAttribute('role', 'dialog');
    submitOverlay.setAttribute('aria-modal', 'true');
    submitOverlay.setAttribute('aria-label', 'Submit temple correction');
    submitOverlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-name">Suggest/Add Temple</div>
          <button class="modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto; padding-right: 15px;">
          <div class="submit-form">
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-temple">Temple name <span class="sf-req">*</span></label>
                <input type="text" id="sf-temple" placeholder="Temple name" />
              </div>
              <div class="sf-group">
                <label for="sf-deity">Deity</label>
                <input type="text" id="sf-deity" placeholder="e.g. Lord Shiva" />
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-district">District</label>
                <input type="text" id="sf-district" placeholder="District" />
              </div>
              <div class="sf-group">
                <label for="sf-location">Location / Address</label>
                <input type="text" id="sf-location" placeholder="Town, District" />
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-lat">Latitude</label>
                <input type="number" step="any" id="sf-lat" placeholder="e.g. 10.7828" />
              </div>
              <div class="sf-group">
                <label for="sf-lng">Longitude</label>
                <input type="number" step="any" id="sf-lng" placeholder="e.g. 79.1318" />
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-phone">Phone number</label>
                <input type="tel" id="sf-phone" placeholder="+91-..." />
              </div>
              <div class="sf-group">
                <label for="sf-timing">Darshan timings</label>
                <input type="text" id="sf-timing" placeholder="6 AM - 12 PM" />
              </div>
            </div>
            <div class="sf-group">
              <label for="sf-description">Description</label>
              <textarea id="sf-description" rows="3" placeholder="Brief history and significance..."></textarea>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-tags">Tags (comma-separated)</label>
                <input type="text" id="sf-tags" placeholder="shiva, famous, heritage" />
              </div>
              <div class="sf-group" style="align-items: center; flex-direction: row; gap: 8px; margin-top: 22px;">
                <input type="checkbox" id="sf-famous" style="width: auto;"/>
                <label for="sf-famous" style="margin:0;">Famous ⭐</label>
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-dressCode">Dress Code</label>
                <input type="text" id="sf-dressCode" placeholder="Men: Dhoti..." />
              </div>
              <div class="sf-group">
                <label for="sf-photography">Photography Rules</label>
                <input type="text" id="sf-photography" placeholder="Restricted inside sanctum" />
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-nearestBus">Nearest Bus Stand</label>
                <input type="text" id="sf-nearestBus" placeholder="Bus Stand (2 km)" />
              </div>
              <div class="sf-group">
                <label for="sf-nearestRail">Nearest Railway</label>
                <input type="text" id="sf-nearestRail" placeholder="Junction (5 km)" />
              </div>
            </div>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #E8D5A8;" />
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-name">Your name <span class="sf-req">*</span></label>
                <input type="text" id="sf-name" placeholder="Your name" />
              </div>
              <div class="sf-group">
                <label for="sf-email">Your email (optional)</label>
                <input type="email" id="sf-email" placeholder="you@example.com" />
              </div>
            </div>
            <div id="sf-msg" class="sf-msg" aria-live="polite" hidden></div>
            <div class="sf-actions">
              <button class="sf-cancel">Cancel</button>
              <button class="sf-submit">Submit →</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(submitOverlay);
    submitOverlay.querySelector('.modal-close').addEventListener('click', closeSubmitModal);
    submitOverlay.querySelector('.sf-cancel').addEventListener('click', closeSubmitModal);
    submitOverlay.addEventListener('click', e => { if (e.target === submitOverlay) closeSubmitModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSubmitModal(); });
    submitOverlay.querySelector('.sf-submit').addEventListener('click', handleSubmit);
  }

  function openSubmitModal(t) {
    if (t) {
      submitOverlay.querySelector('#sf-temple').value      = t.name     || '';
      submitOverlay.querySelector('#sf-district').value    = t.district || '';
      submitOverlay.querySelector('#sf-deity').value       = t.deity    || '';
      submitOverlay.querySelector('#sf-location').value    = t.location || '';
      submitOverlay.querySelector('#sf-phone').value       = t.phone    || '';
      submitOverlay.querySelector('#sf-timing').value      = t.timing   || '';
      submitOverlay.querySelector('#sf-lat').value         = t.lat      || '';
      submitOverlay.querySelector('#sf-lng').value         = t.lng      || '';
      submitOverlay.querySelector('#sf-description').value = t.description || '';
      submitOverlay.querySelector('#sf-tags').value        = (t.tags || []).join(', ');
      submitOverlay.querySelector('#sf-famous').checked    = t.famous   || false;
      submitOverlay.querySelector('#sf-dressCode').value   = t.dressCode || '';
      submitOverlay.querySelector('#sf-photography').value = t.photography || '';
      submitOverlay.querySelector('#sf-nearestBus').value  = t.nearestBus || '';
      submitOverlay.querySelector('#sf-nearestRail').value = t.nearestRail || '';
    }
    const msg = submitOverlay.querySelector('#sf-msg');
    msg.hidden = true; msg.textContent = '';
    submitOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (modalOverlay) modalOverlay.classList.remove('open');
  }

  function closeSubmitModal() {
    if (submitOverlay) submitOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function handleSubmit() {
    const temple = submitOverlay.querySelector('#sf-temple').value.trim();
    const submitter   = submitOverlay.querySelector('#sf-name').value.trim();
    const email  = submitOverlay.querySelector('#sf-email').value.trim();
    const msg    = submitOverlay.querySelector('#sf-msg');

    if (!temple) { showMsg(msg, 'error', 'Please enter the temple name.'); return; }
    if (!submitter)   { showMsg(msg, 'error', 'Please enter your name.'); return; }

    const tagsVal = submitOverlay.querySelector('#sf-tags').value;
    const tagsArr = tagsVal ? tagsVal.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const latVal = submitOverlay.querySelector('#sf-lat').value;
    const lngVal = submitOverlay.querySelector('#sf-lng').value;
    const desc = submitOverlay.querySelector('#sf-description').value.trim().replace(/"/g, '\\"');

    const objStr = `  {
    id: "NEW",
    name: "${temple}",
    deity: "${submitOverlay.querySelector('#sf-deity').value.trim()}",
    district: "${submitOverlay.querySelector('#sf-district').value.trim()}",
    location: "${submitOverlay.querySelector('#sf-location').value.trim()}",
    lat: ${latVal ? latVal : 'null'}, lng: ${lngVal ? lngVal : 'null'},
    timing: "${submitOverlay.querySelector('#sf-timing').value.trim()}",
    phone: "${submitOverlay.querySelector('#sf-phone').value.trim()}",
    description: "${desc}",
    famous: ${submitOverlay.querySelector('#sf-famous').checked},
    tags: ${JSON.stringify(tagsArr)},
    dressCode: "${submitOverlay.querySelector('#sf-dressCode').value.trim()}",
    photography: "${submitOverlay.querySelector('#sf-photography').value.trim()}",
    nearestBus: "${submitOverlay.querySelector('#sf-nearestBus').value.trim()}",
    nearestRail: "${submitOverlay.querySelector('#sf-nearestRail').value.trim()}"
  }`;

    const body = `Submitted by: ${submitter} (${email})\\nState: ${activeState}\\n\\nHere is the temple data object ready to be added to site:\\n\\n${objStr}`;
    const mailto = `mailto:submit@templediary.in?subject=${encodeURIComponent('Temple Submission: ' + temple)}&body=${encodeURIComponent(body)}`;

    showMsg(msg, 'success', '✅ Thank you! Opening your email client to send the submission…');
    setTimeout(() => { window.location.href = mailto; }, 1200);
  }

  function showMsg(el, type, text) {
    el.textContent = text;
    el.className   = 'sf-msg sf-msg--' + type;
    el.hidden      = false;
  }

  /* ══════════════════════════
     COOKIE BANNER
  ══════════════════════════ */
  function initCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    if (localStorage.getItem('bd_cookie_choice')) banner.classList.add('hidden');
  }

  window.acceptCookies = function () {
    localStorage.setItem('bd_cookie_choice', 'accepted');
    hideBanner();
  };
  window.declineCookies = function () {
    localStorage.setItem('bd_cookie_choice', 'essential');
    hideBanner();
  };
  function hideBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.classList.add('hidden');
  }

  /* ══════════════════════════
     BACK TO TOP
  ══════════════════════════ */
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => { btn.classList.toggle('visible', window.scrollY > 400); }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ══════════════════════════
     ICON HELPERS
  ══════════════════════════ */
  function iconLocation() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
  }
  function iconClock() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  }
  function iconPhone() {
    return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.4 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.28-1.28a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
  }

  /* ══════════════════════════
     UTILS
  ══════════════════════════ */
  function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /* ── Global Exports ── */
  window.openSubmitModal = openSubmitModal;

  /* ── Kick off ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
