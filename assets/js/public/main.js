/* ═══════════════════════════════════════════════════
   TempleDiary — main.js
   Multi-state architecture backed by assets/js/core/states.js.
   Data is loaded on-demand as JSON (data/<state>.json).
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STATE_REGISTRY = window.TD_STATES?.registry || {};

  /* ── JSON data cache: stateKey → merged temple array ── */
  const _dataCache = {};
  const _pendingSubmissionCache = {};

  /**
   * Fetches data/<state>.json if not already cached.
   * Merges _defaults into every temple object at load time.
   * Returns a Promise that resolves to the temple array.
   *
   * JSON format expected:
   *   { "_defaults": { "dressCode": "...", ... }, "temples": [ {...}, ... ] }
   */
  async function loadStateData(stateKey) {
    if (_dataCache[stateKey]) return _dataCache[stateKey];

    const cfg = STATE_REGISTRY[stateKey];
    if (!cfg || !cfg.dataFile) return [];

    try {
      const res = await fetch(cfg.dataFile);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Support both plain array (legacy) and { _defaults, temples } format
      const defaults = json._defaults || {};
      const raw      = Array.isArray(json) ? json : (json.temples || []);

      const publishedTemples = raw.map(t => ({ ...defaults, ...t }));
      const pendingSubmissions = await loadPendingSubmissions(stateKey);

      _dataCache[stateKey] = mergePendingSubmissions(publishedTemples, pendingSubmissions);
    } catch (err) {
      console.warn('TempleDiary: failed to load', cfg.dataFile, err);
      _dataCache[stateKey] = [];
    }

    return _dataCache[stateKey];
  }

  async function loadPendingSubmissions(stateKey) {
    if (_pendingSubmissionCache[stateKey]) return _pendingSubmissionCache[stateKey];

    try {
      const res = await fetch(`/api/public-submissions?state=${encodeURIComponent(stateKey)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      _pendingSubmissionCache[stateKey] = Array.isArray(json.submissions) ? json.submissions : [];
    } catch (err) {
      console.warn('TempleDiary: failed to load pending public submissions', stateKey, err);
      _pendingSubmissionCache[stateKey] = [];
    }

    return _pendingSubmissionCache[stateKey];
  }

  function invalidateStateData(stateKey) {
    delete _dataCache[stateKey];
    delete _pendingSubmissionCache[stateKey];
  }

  async function refreshActiveStateData(options = {}) {
    const stateKey = activeState;
    invalidateStateData(stateKey);
    const temples = await loadStateData(stateKey);
    if (stateKey !== activeState) return;

    const cfg = STATE_REGISTRY[stateKey];
    if (cfg) {
      if (statTemples) statTemples.textContent = formatTempleStat(temples.length, cfg.statTemples);
      if (statDistricts) statDistricts.textContent = formatDistrictStat(temples, cfg.statDistricts);
    }

    populateFilters(temples);
    populateChips(temples);
    if (options.resetFilters) resetDirectoryFilters();
    syncChips();
    render();
    updateHeroSuggestions();
  }

  function mergePendingSubmissions(publishedTemples, pendingSubmissions) {
    if (!pendingSubmissions.length) return publishedTemples;

    const publishedKeys = new Set(
      publishedTemples.map(t => `${lower(t.name)}|${lower(t.district)}|${lower(t.location)}`)
    );

    const uniquePending = pendingSubmissions.filter(t => {
      const key = `${lower(t.name)}|${lower(t.district)}|${lower(t.location)}`;
      return !publishedKeys.has(key);
    });

    return [...uniquePending, ...publishedTemples];
  }

  /** Convenience: get already-loaded data synchronously (empty array if not loaded yet) */
  function getStateData(stateKey) {
    return _dataCache[stateKey] || [];
  }

  /* ── Loading indicator helpers ── */
  function showGridLoader() {
    if (grid) grid.innerHTML = '<div class="td-loading" aria-live="polite" style="grid-column:1/-1;text-align:center;padding:48px 0;color:var(--muted,#888);font-size:1rem;">🕌 Loading temples…</div>';
  }

  function text(value) {
    return String(value ?? '').trim();
  }

  function lower(value) {
    return text(value).toLowerCase();
  }

  /* ── Config ── */
  const PER_PAGE = 12;
  const DEFAULT_STATE = window.TD_STATES?.defaultState || 'kerala';
  const FORM_SUBMIT_EMAIL = 'mymail2837@gmail.com';
  const WORKER_SUBMISSION_ENDPOINT = '/api/submit-temple';
  const FORM_SUBMIT_ENDPOINT = `https://formsubmit.co/${FORM_SUBMIT_EMAIL}`;
  const FORM_SUBMIT_AJAX_ENDPOINT = `https://formsubmit.co/ajax/${FORM_SUBMIT_EMAIL}`;

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
  const heroSuggest  = document.getElementById('hero-search-suggestions');
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
    renderStateTabs();
    initStateTabs();
    showGridLoader();
    loadStateData(activeState).then(() => applyState(activeState, false)); // false = don't push history on first load
    initFilterListeners();
    initHeroSearch();
    initBackToTop();
    initModal();
    initSubmitModal();
    initCorrectionModal();
    openSubmitDeepLink(params);
  }

  function openSubmitDeepLink(params) {
    const path = window.location.pathname.replace(/\/+$/, '');
    const addMode = (params.get('add') || '').toLowerCase();
    const isAddPath = path === '/add';
    const isAtTempleRequest = isAddPath || addMode === 'temple' || addMode === 'at-temple';

    if (!isAtTempleRequest) return;

    window.setTimeout(() => {
      window.openSubmitModalAtTemple();
    }, 0);
  }

  /* ══════════════════════════
     STATE SWITCHING
  ══════════════════════════ */
  function renderStateTabs() {
    const tabs = document.querySelector('.state-tabs');
    if (!tabs) return;

    tabs.innerHTML = Object.entries(STATE_REGISTRY).map(([key, cfg]) => `
      <button class="state-tab${key === activeState ? ' active' : ''}" data-state="${escapeAttr(key)}" role="tab" aria-selected="${key === activeState}" aria-label="View ${escapeAttr(cfg.label)} temples">
        <span class="state-flag">${cfg.icon || '🛕'}</span> ${escapeHtml(cfg.label)}
      </button>
    `).join('');
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

  function initStateTabs() {
    document.querySelectorAll('.state-tab[data-state]').forEach(tab => {
      tab.addEventListener('click', () => {
        const s = tab.dataset.state;
        if (s === activeState) return;
        showGridLoader();
        loadStateData(s).then(() => applyState(s, true));
      });
    });
  }

  function applyState(stateKey, pushHistory) {
    const cfg = STATE_REGISTRY[stateKey];
    if (!cfg) return;
    activeState = stateKey;

    // SEO Updates
    document.title = `${cfg.label} Temple Directory | TempleDiary`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.href = `https://www.templediary.in/?state=${stateKey}`;
    }

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
    const stateTemples = getStateData(stateKey);
    if (statTemples)   statTemples.textContent   = formatTempleStat(stateTemples.length, cfg.statTemples);
    if (statDistricts) statDistricts.textContent = formatDistrictStat(stateTemples, cfg.statDistricts);

    // Rebuild filter dropdowns
    populateFilters(stateTemples);

    // Rebuild district chips
    populateChips(stateTemples);

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

  function formatTempleStat(count, fallback) {
    if (!count) return fallback;
    if (count < 100) return String(count);
    return `${Math.floor(count / 100) * 100}+`;
  }

  function formatDistrictStat(temples, fallback) {
    const count = new Set(temples.map(t => t.district).filter(Boolean)).size;
    return count ? String(count) : fallback;
  }

  // Handle browser back/forward
  window.addEventListener('popstate', e => {
    if (e.state && e.state.state) {
      showGridLoader();
      loadStateData(e.state.state).then(() => applyState(e.state.state, false));
    }
  });

  /* ══════════════════════════
     POPULATE FILTERS DYNAMICALLY
  ══════════════════════════ */
  function populateFilters(temples) {
    const districts = [...new Set(temples.map(t => text(t.district)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const deities   = [...new Set(temples.map(t => text(t.deity)).filter(Boolean))].sort((a, b) => a.localeCompare(b));

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
    const districts = [...new Set(temples.map(t => text(t.district)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
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
        selectDistrict(state.district === d ? '' : d);
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
    if (filterDist)   filterDist.addEventListener('change', () => { selectDistrict(filterDist.value); });
    if (filterDeity)  filterDeity.addEventListener('change', () => { state.deity = filterDeity.value; state.page = 1; render(); });
    if (sortSelect)   sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; state.page = 1; render(); });
    if (clearBtn)     clearBtn.addEventListener('click', clearFilters);
  }

  function initHeroSearch() {
    const heroForm = document.querySelector('.search-form');
    if (heroForm) {
      heroForm.addEventListener('submit', e => {
        e.preventDefault();
        state.query = text(heroSearch.value);
        state.page = 1;
        if (filterSearch) filterSearch.value = state.query;
        hideHeroSuggestions();
        render();
        document.getElementById('directory').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (heroSearch) {
      heroSearch.addEventListener('input', handleHeroSearchInput);
      heroSearch.addEventListener('focus', updateHeroSuggestions);
      heroSearch.addEventListener('keydown', handleHeroSuggestionKeys);
      heroSearch.addEventListener('blur', () => window.setTimeout(hideHeroSuggestions, 140));
    }
  }

  function handleHeroSearchInput() {
    if (!heroSearch) return;

    if (!heroSearch.value.trim()) {
      state.query = '';
      state.page = 1;
      if (filterSearch) filterSearch.value = '';
      hideHeroSuggestions();
      render();
      return;
    }

    debounceHeroSuggestions();
  }

  const debounceHeroSuggestions = debounce(updateHeroSuggestions, 120);

  function updateHeroSuggestions() {
    if (!heroSearch || !heroSuggest) return;

    const q = heroSearch.value.trim().toLowerCase();
    if (q.length < 2) {
      hideHeroSuggestions();
      return;
    }

    const matches = getStateData(activeState)
      .filter(t => {
        const haystack = [t.name, t.deity, t.district, t.location].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aStarts = aName.startsWith(q) ? 0 : 1;
        const bStarts = bName.startsWith(q) ? 0 : 1;
        return aStarts - bStarts || aName.localeCompare(bName);
      })
      .slice(0, 8);

    if (!matches.length) {
      hideHeroSuggestions();
      return;
    }

    heroSuggest.innerHTML = '';
    matches.forEach((t, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'search-suggestion';
      btn.setAttribute('role', 'option');
      btn.id = `hero-search-suggestion-${index}`;
      btn.setAttribute('aria-selected', 'false');
      btn.dataset.index = String(index);
      btn.innerHTML = `
        <strong>${escHtml(t.name || '')}</strong>
        <span>${escHtml([t.deity, t.district, t.location].filter(Boolean).join(' · '))}</span>
      `;
      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('click', () => selectHeroSuggestion(t));
      heroSuggest.appendChild(btn);
    });

    heroSuggest.hidden = false;
    heroSearch.setAttribute('aria-expanded', 'true');
    heroSearch.removeAttribute('aria-activedescendant');
  }

  function selectHeroSuggestion(t) {
    if (!heroSearch) return;
    heroSearch.value = text(t.name);
    state.query = heroSearch.value;
    state.page = 1;
    if (filterSearch) filterSearch.value = state.query;
    hideHeroSuggestions();
    render();
    openModal(t);
  }

  function hideHeroSuggestions() {
    if (!heroSuggest || !heroSearch) return;
    heroSuggest.hidden = true;
    heroSuggest.innerHTML = '';
    heroSearch.setAttribute('aria-expanded', 'false');
    heroSearch.removeAttribute('aria-activedescendant');
  }

  function handleHeroSuggestionKeys(e) {
    if (!heroSuggest || heroSuggest.hidden) return;

    const items = [...heroSuggest.querySelectorAll('.search-suggestion')];
    if (!items.length) return;

    const current = items.findIndex(item => item.getAttribute('aria-selected') === 'true');
    let next = current;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      next = current < items.length - 1 ? current + 1 : 0;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      next = current > 0 ? current - 1 : items.length - 1;
    } else if (e.key === 'Enter' && current >= 0) {
      e.preventDefault();
      items[current].click();
      return;
    } else if (e.key === 'Escape') {
      hideHeroSuggestions();
      return;
    } else {
      return;
    }

    items.forEach((item, index) => item.setAttribute('aria-selected', String(index === next)));
    heroSearch.setAttribute('aria-activedescendant', items[next].id);
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
    const temples = getStateData(activeState);
    const q = lower(state.query);
    return temples
      .filter(t => {
        const matchQ = !q ||
          [t.name, t.deity, t.district, t.location, t.description, ...(Array.isArray(t.tags) ? t.tags : [])]
            .some(value => lower(value).includes(q));
        const matchD  = !state.district || text(t.district) === state.district;
        const matchDe = !state.deity    || text(t.deity)    === state.deity;
        return matchQ && matchD && matchDe;
      })
      .sort((a, b) => {
        if (state.sort === 'district') return text(a.district).localeCompare(text(b.district)) || text(a.name).localeCompare(text(b.name));
        return text(a.name).localeCompare(text(b.name));
      });
  }

  /* ══════════════════════════
     RENDER
  ══════════════════════════ */
  function updateRobotsMeta() {
    const hasFilters = state.query || state.district || state.deity || state.sort !== 'name' || state.page > 1;
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = hasFilters ? 'noindex, follow' : 'index, follow';
  }

  function render() {
    const filtered = getFiltered();
    const total    = filtered.length;
    const pages    = Math.ceil(total / PER_PAGE) || 1;
    state.page     = Math.min(state.page, pages);
    const start    = (state.page - 1) * PER_PAGE;
    const slice    = filtered.slice(start, start + PER_PAGE);

    updateRobotsMeta();

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
    div.className = `temple-card${t.isPendingSubmission ? ' temple-card-pending' : ''}`;
    div.setAttribute('role', 'listitem');
    div.style.animationDelay = `${idx * 0.04}s`;
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', [t.name, t.district].map(text).filter(Boolean).join(', ') || 'Temple listing');
    div.innerHTML = `
      ${t.famous ? `<span class="badge-famous">⭐ Famous</span>` : ''}
      ${buildStatusLabel(t)}
      <div class="card-deity">${escHtml(t.deity || 'Temple')}</div>
      <h3 class="card-name">${escHtml(t.name || 'Unnamed temple')}</h3>
      ${t.submittedBy ? `<p class="card-submitter">Submitted by ${escHtml(t.submittedBy)}</p>` : ''}
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

  function selectDistrict(district) {
    state.district = text(district);
    state.page = 1;
    if (filterDist) filterDist.value = state.district;
    syncChips();
    render();
  }

  /* ══════════════════════════
     CLEAR FILTERS
  ══════════════════════════ */
  function clearFilters() {
    resetDirectoryFilters();
    render();
  }

  function resetDirectoryFilters() {
    state.query = ''; state.district = ''; state.deity = ''; state.sort = 'name'; state.page = 1;
    if (filterSearch) filterSearch.value = '';
    if (filterDist)   filterDist.value   = '';
    if (filterDeity)  filterDeity.value  = '';
    if (sortSelect)   sortSelect.value   = 'name';
    if (heroSearch)   heroSearch.value   = '';
    if (distChips) distChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
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
    const modalBadge = modalOverlay.querySelector('#modal-badge');
    modalBadge.innerHTML = [t.famous ? '<span class="status-label status-famous">Famous Temple</span>' : '', buildStatusLabel(t)].filter(Boolean).join(' ');
    modalBadge.style.display = modalBadge.innerHTML ? '' : 'none';
    modalOverlay.querySelector('#modal-desc').textContent  = t.description || '';

    const rows = [
      ['Location',    t.location],
      ['District',    t.district],
      ['Timings',     t.timing],
      ['Phone',       t.phone ? `<a href="tel:${escHtml(t.phone)}">${escHtml(t.phone)}</a>` : null],
      ['Submitted By', t.submittedBy],
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
    submitBtn.addEventListener('click', () => openCorrectionModal(t));
    actions.appendChild(submitBtn);

    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function buildStatusLabel(t) {
    const status = String(t.status || '').trim().toLowerCase();
    const adminLabel = String(t.adminLabel || t.admin_label || '').trim();
    if (!status && !adminLabel && !t.isPendingSubmission) return '';
    const label = t.isPendingSubmission
      ? 'Community submitted · Unverified'
      : (adminLabel || status.replace(/_/g, ' '));
    const cls = status === 'verified'
      ? 'status-verified'
      : (status === 'needs_review' ? 'status-needs-review' : 'status-unverified');
    return `<span class="status-label ${cls}">${escHtml(label)}</span>`;
  }

  /* ══════════════════════════
     SUBMIT MODAL
  ══════════════════════════ */
  let submitOverlay = null;
  let submitSourceTemple = null;
  let submitKind = 'temple-submission';
  let missingGuideOverlay = null;

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
          <form class="submit-form" action="${FORM_SUBMIT_ENDPOINT}" method="POST">
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" id="sf-subject" name="_subject" value="New Temple Submission" />
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-temple">Temple name <span class="sf-req">*</span></label>
                <input type="text" id="sf-temple" name="Temple" placeholder="Temple name" required />
              </div>
              <div class="sf-group">
                <label for="sf-deity">Deity</label>
                <input type="text" id="sf-deity" name="Deity" placeholder="e.g. Lord Shiva" />
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-district">District</label>
                <input type="text" id="sf-district" name="District" placeholder="District" />
              </div>
              <div class="sf-group">
                <label for="sf-location">Location / Address / Google Maps link</label>
                <input type="text" id="sf-location" name="Location" placeholder="Town, District, or paste Google Maps link here" />
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-lat">Latitude</label>
                <input type="number" step="any" id="sf-lat" name="Latitude" placeholder="e.g. 10.7828" />
              </div>
              <div class="sf-group">
                <label for="sf-lng">Longitude</label>
                <input type="number" step="any" id="sf-lng" name="Longitude" placeholder="e.g. 79.1318" />
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-phone">Phone number</label>
                <input type="tel" id="sf-phone" name="Phone" placeholder="+91-..." />
              </div>
              <div class="sf-group">
                <label for="sf-timing">Darshan timings</label>
                <input type="text" id="sf-timing" name="Timing" placeholder="6 AM - 12 PM" />
              </div>
            </div>
            <div class="sf-group">
              <label for="sf-description">Description</label>
              <textarea id="sf-description" name="Description" rows="3" placeholder="Brief history and significance..."></textarea>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-tags">Tags (comma-separated)</label>
                <input type="text" id="sf-tags" name="Tags" placeholder="shiva, famous, heritage" />
              </div>
              <div class="sf-group" style="align-items: center; flex-direction: row; gap: 8px; margin-top: 22px;">
                <input type="checkbox" id="sf-famous" name="Famous" value="Yes" style="width: auto;"/>
                <label for="sf-famous" style="margin:0;">Famous ⭐</label>
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-dressCode">Dress Code</label>
                <input type="text" id="sf-dressCode" name="Dress Code" placeholder="Men: Dhoti..." />
              </div>
              <div class="sf-group">
                <label for="sf-photography">Photography Rules</label>
                <input type="text" id="sf-photography" name="Photography" placeholder="Restricted inside sanctum" />
              </div>
            </div>
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-nearestBus">Nearest Bus Stand</label>
                <input type="text" id="sf-nearestBus" name="Nearest Bus" placeholder="Bus Stand (2 km)" />
              </div>
              <div class="sf-group">
                <label for="sf-nearestRail">Nearest Railway</label>
                <input type="text" id="sf-nearestRail" name="Nearest Rail" placeholder="Junction (5 km)" />
              </div>
            </div>
            <hr style="margin: 15px 0; border: 0; border-top: 1px solid #E8D5A8;" />
            <div class="sf-row">
              <div class="sf-group">
                <label for="sf-name">Your name <span class="sf-req">*</span></label>
                <input type="text" id="sf-name" name="Submitted By" placeholder="Your name" required />
              </div>
              <div class="sf-group">
                <label for="sf-email">Your email (optional)</label>
                <input type="email" id="sf-email" name="Submitter Email" placeholder="you@example.com" />
              </div>
            </div>
            <div id="sf-msg" class="sf-msg" aria-live="polite" hidden></div>
            <div class="sf-actions">
              <button type="button" class="sf-cancel">Cancel</button>
              <button type="submit" class="sf-submit">Submit →</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.appendChild(submitOverlay);
    submitOverlay.querySelector('.modal-close').addEventListener('click', closeSubmitModal);
    submitOverlay.querySelector('.sf-cancel').addEventListener('click', closeSubmitModal);
    submitOverlay.addEventListener('click', e => { if (e.target === submitOverlay) closeSubmitModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSubmitModal(); });
    submitOverlay.querySelector('.submit-form').addEventListener('submit', handleSubmit);
    submitOverlay.querySelector('#sf-location').addEventListener('input', handleSubmitLocationInput);
    submitOverlay.querySelector('#sf-location').addEventListener('change', handleSubmitLocationInput);
  }

  function handleSubmitLocationInput() {
    const location = submitOverlay.querySelector('#sf-location')?.value || '';
    const coords = parseMapLinkCoordinates(location);
    if (!coords) return;
    const latInput = submitOverlay.querySelector('#sf-lat');
    const lngInput = submitOverlay.querySelector('#sf-lng');
    if (latInput && !latInput.value.trim()) latInput.value = coords.lat.toFixed(6);
    if (lngInput && !lngInput.value.trim()) lngInput.value = coords.lng.toFixed(6);
  }

  function openSubmitModal(t) {
    submitSourceTemple = t || null;
    submitKind = t ? 'temple-correction' : 'temple-submission';
    clearSubmitForm();
    submitOverlay.querySelector('.modal-name').textContent = t ? 'Suggest Correction' : 'Suggest/Add Temple';
    submitOverlay.setAttribute('aria-label', t ? 'Submit temple correction' : 'Submit missing temple');

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

  function clearSubmitForm() {
    ['sf-temple','sf-deity','sf-district','sf-location','sf-lat','sf-lng','sf-phone','sf-timing','sf-description','sf-tags','sf-dressCode','sf-photography','sf-nearestBus','sf-nearestRail','sf-name','sf-email'].forEach(id => {
      const el = submitOverlay.querySelector('#' + id);
      if (el) el.value = '';
    });
    const famous = submitOverlay.querySelector('#sf-famous');
    if (famous) famous.checked = false;
  }

  function closeSubmitModal() {
    if (submitOverlay) submitOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function initMissingTempleGuide() {
    missingGuideOverlay = document.createElement('div');
    missingGuideOverlay.className = 'modal-overlay submit-overlay';
    missingGuideOverlay.setAttribute('role', 'dialog');
    missingGuideOverlay.setAttribute('aria-modal', 'true');
    missingGuideOverlay.setAttribute('aria-label', 'Submit a missing temple');
    missingGuideOverlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-name">Your temple missing?</div>
          <button class="modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <div class="missing-guide">
            <p class="missing-guide-intro">
              We need the temple name and correct location. Choose the option that matches where you are now.
            </p>
            <div class="missing-guide-options">
              <div class="missing-guide-card">
                <strong>Yes, I am at the temple now</strong>
                <p>Tap this if you are inside or very near the temple. Your phone will ask permission to share location. Please allow it.</p>
                <div class="missing-guide-actions">
                  <button type="button" id="missing-at-temple">Allow location and continue</button>
                </div>
              </div>
              <div class="missing-guide-card">
                <strong>No, I am submitting from home</strong>
                <p>No location permission is needed. Open the form and type the address or any location details you know.</p>
                <div class="missing-guide-actions">
                  <button type="button" id="missing-from-home">Open form for manual entry</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(missingGuideOverlay);
    missingGuideOverlay.querySelector('.modal-close').addEventListener('click', closeMissingTempleGuide);
    missingGuideOverlay.addEventListener('click', e => { if (e.target === missingGuideOverlay) closeMissingTempleGuide(); });
    missingGuideOverlay.querySelector('#missing-at-temple').addEventListener('click', () => {
      closeMissingTempleGuide(false);
      window.openSubmitModalAtTemple();
    });
    missingGuideOverlay.querySelector('#missing-from-home').addEventListener('click', () => {
      closeMissingTempleGuide(false);
      openSubmitModal(null);
      setSubmitLocationMode('manual');
      showManualLocationHelp();
    });
  }

  function openMissingTempleGuide() {
    if (!missingGuideOverlay) initMissingTempleGuide();
    missingGuideOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMissingTempleGuide(restoreScroll = true) {
    if (missingGuideOverlay) missingGuideOverlay.classList.remove('open');
    if (restoreScroll) document.body.style.overflow = '';
  }

  function showManualLocationHelp() {
    setSubmitLocationMode('manual');
    const msg = submitOverlay.querySelector('#sf-msg');
    msg.textContent = [
      'Submitting from home: fill temple details manually.',
      'No location permission is needed.',
      'In the Location / Address box, type the best address you know or paste a Google Maps share link.'
    ].join(' ');
    msg.className = 'sf-msg sf-msg--success';
    msg.hidden = false;
    setTimeout(() => submitOverlay.querySelector('#sf-temple')?.focus(), 80);
  }

  function setSubmitLocationMode(mode) {
    if (typeof window.tdSetLocationPromptMode === 'function') {
      window.tdSetLocationPromptMode(mode);
    }
  }

  /* ══════════════════════════
     CORRECTION WIZARD
  ══════════════════════════ */
  let correctionOverlay = null;
  let correctionSourceTemple = null;

  function initCorrectionModal() {
    correctionOverlay = document.createElement('div');
    correctionOverlay.className = 'modal-overlay submit-overlay';
    correctionOverlay.setAttribute('role', 'dialog');
    correctionOverlay.setAttribute('aria-modal', 'true');
    correctionOverlay.setAttribute('aria-label', 'Suggest temple correction');
    correctionOverlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-name">Suggest Correction</div>
          <button class="modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body" style="max-height:70vh;overflow-y:auto;padding-right:15px;">
          <form class="submit-form" id="correction-form">
            <div class="sf-group">
              <label>Temple</label>
              <input type="text" id="cr-temple" readonly />
            </div>

            <div class="sf-group">
              <label>Does this temple exist?</label>
              <div class="sf-row" style="gap:14px;">
                <label style="display:flex;align-items:center;gap:7px;text-transform:none;letter-spacing:0;"><input type="radio" name="cr-exists" value="yes" checked style="width:auto;"> Yes</label>
                <label style="display:flex;align-items:center;gap:7px;text-transform:none;letter-spacing:0;"><input type="radio" name="cr-exists" value="no" style="width:auto;"> No</label>
              </div>
            </div>

            <div id="cr-delete-section" class="sf-group" hidden>
              <label style="display:flex;align-items:center;gap:7px;text-transform:none;letter-spacing:0;">
                <input type="checkbox" id="cr-confirm-delete" style="width:auto;" />
                I am sure this temple does not exist or should be removed
              </label>
              <textarea id="cr-delete-reason" rows="2" placeholder="Reason or evidence for removal"></textarea>
            </div>

            <div id="cr-correction-section">
              <div class="sf-group">
                <label>Is the map location correct?</label>
                <div class="sf-row" style="gap:14px;">
                  <label style="display:flex;align-items:center;gap:7px;text-transform:none;letter-spacing:0;"><input type="radio" name="cr-location-correct" value="yes" checked style="width:auto;"> Yes</label>
                  <label style="display:flex;align-items:center;gap:7px;text-transform:none;letter-spacing:0;"><input type="radio" name="cr-location-correct" value="no" style="width:auto;"> No</label>
                </div>
              </div>

              <div id="cr-location-section" class="sf-group" hidden>
                <label>Correct location</label>
                <input type="text" id="cr-location" placeholder="Correct address/location" />
                <div class="sf-row">
                  <div class="sf-group">
                    <label for="cr-lat">Latitude</label>
                    <input type="number" step="any" id="cr-lat" placeholder="Latitude" />
                  </div>
                  <div class="sf-group">
                    <label for="cr-lng">Longitude</label>
                    <input type="number" step="any" id="cr-lng" placeholder="Longitude" />
                  </div>
                </div>
                <div class="sf-row">
                  <button type="button" class="modal-submit-btn" id="cr-detect-location" style="width:auto;">Use my GPS</button>
                  <input type="url" id="cr-map-link" placeholder="Google Maps link" />
                </div>
                <textarea id="cr-location-note" rows="2" placeholder="Location note"></textarea>
              </div>

              <div class="sf-group">
                <label>Only fill details that need to be added or corrected</label>
                <div class="sf-row">
                  <input type="text" id="cr-name" placeholder="Correct temple name" />
                  <input type="text" id="cr-deity" placeholder="Correct deity" />
                </div>
                <div class="sf-row">
                  <input type="text" id="cr-district" placeholder="Correct district" />
                </div>
                <div class="sf-row">
                  <input type="text" id="cr-timing" placeholder="Correct timings" />
                  <input type="tel" id="cr-phone" placeholder="Correct phone" />
                </div>
                <textarea id="cr-description" rows="3" placeholder="Story, history, or description correction"></textarea>
                <div class="sf-row">
                  <input type="text" id="cr-dressCode" placeholder="Dress code correction" />
                  <input type="text" id="cr-photography" placeholder="Photography rule correction" />
                </div>
                <div class="sf-row">
                  <input type="text" id="cr-nearestBus" placeholder="Nearest bus correction" />
                  <input type="text" id="cr-nearestRail" placeholder="Nearest rail correction" />
                </div>
                <input type="url" id="cr-sourceUrl" placeholder="Source URL, if any" />
                <textarea id="cr-notes" rows="2" placeholder="Other notes for admin"></textarea>
              </div>
            </div>

            <hr style="margin:15px 0;border:0;border-top:1px solid #E8D5A8;" />
            <div class="sf-row">
              <div class="sf-group">
                <label for="cr-submitted-by">Your name <span class="sf-req">*</span></label>
                <input type="text" id="cr-submitted-by" required placeholder="Your name" />
              </div>
              <div class="sf-group">
                <label for="cr-email">Your email (optional)</label>
                <input type="email" id="cr-email" placeholder="you@example.com" />
              </div>
            </div>
            <div id="cr-msg" class="sf-msg" aria-live="polite" hidden></div>
            <div class="sf-actions">
              <button type="button" class="sf-cancel">Cancel</button>
              <button type="submit" class="sf-submit">Submit correction</button>
            </div>
          </form>
        </div>
      </div>`;

    document.body.appendChild(correctionOverlay);
    correctionOverlay.querySelector('.modal-close').addEventListener('click', closeCorrectionModal);
    correctionOverlay.querySelector('.sf-cancel').addEventListener('click', closeCorrectionModal);
    correctionOverlay.addEventListener('click', e => { if (e.target === correctionOverlay) closeCorrectionModal(); });
    correctionOverlay.querySelector('#correction-form').addEventListener('submit', handleCorrectionSubmit);
    correctionOverlay.querySelectorAll('input[name="cr-exists"]').forEach(input => input.addEventListener('change', updateCorrectionWizard));
    correctionOverlay.querySelectorAll('input[name="cr-location-correct"]').forEach(input => input.addEventListener('change', updateCorrectionWizard));
    correctionOverlay.querySelector('#cr-detect-location').addEventListener('click', detectCorrectionLocation);
    correctionOverlay.querySelector('#cr-map-link').addEventListener('input', handleCorrectionMapLink);
    correctionOverlay.querySelector('#cr-map-link').addEventListener('change', handleCorrectionMapLink);
  }

  function openCorrectionModal(t) {
    correctionSourceTemple = t || null;
    clearCorrectionForm();
    correctionOverlay.querySelector('#cr-temple').value = t?.name || '';
    correctionOverlay.querySelector('#cr-msg').hidden = true;
    correctionOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (modalOverlay) modalOverlay.classList.remove('open');
    updateCorrectionWizard();
  }

  function closeCorrectionModal() {
    if (correctionOverlay) correctionOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function clearCorrectionForm() {
    correctionOverlay.querySelector('#correction-form').reset();
    correctionOverlay.querySelector('input[name="cr-exists"][value="yes"]').checked = true;
    correctionOverlay.querySelector('input[name="cr-location-correct"][value="yes"]').checked = true;
    ['cr-temple','cr-delete-reason','cr-lat','cr-lng','cr-map-link','cr-location-note','cr-name','cr-deity','cr-district','cr-location','cr-timing','cr-phone','cr-description','cr-dressCode','cr-photography','cr-nearestBus','cr-nearestRail','cr-sourceUrl','cr-notes','cr-submitted-by','cr-email'].forEach(id => {
      const el = correctionOverlay.querySelector('#' + id);
      if (el) el.value = '';
    });
  }

  function updateCorrectionWizard() {
    const exists = correctionOverlay.querySelector('input[name="cr-exists"]:checked')?.value || 'yes';
    const locationCorrect = correctionOverlay.querySelector('input[name="cr-location-correct"]:checked')?.value || 'yes';
    correctionOverlay.querySelector('#cr-delete-section').hidden = exists !== 'no';
    correctionOverlay.querySelector('#cr-correction-section').hidden = exists === 'no';
    const locationSection = correctionOverlay.querySelector('#cr-location-section');
    const shouldShowLocation = exists !== 'no' && locationCorrect === 'no';
    locationSection.hidden = !shouldShowLocation;
    locationSection.querySelectorAll('input, textarea, button').forEach(el => {
      el.disabled = !shouldShowLocation;
      if (!shouldShowLocation && el.tagName !== 'BUTTON') el.value = '';
    });
  }

  async function detectCorrectionLocation() {
    const msg = correctionOverlay.querySelector('#cr-msg');
    if (!navigator.geolocation) {
      showMsg(msg, 'error', 'GPS is not supported in this browser.');
      return;
    }

    showMsg(msg, 'success', 'Getting your location...');
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      correctionOverlay.querySelector('#cr-lat').value = position.coords.latitude.toFixed(6);
      correctionOverlay.querySelector('#cr-lng').value = position.coords.longitude.toFixed(6);
      showMsg(msg, 'success', 'Location captured. Please verify before submitting.');
    } catch (err) {
      showMsg(msg, 'error', 'Could not get GPS location.');
    }
  }

  function handleCorrectionMapLink() {
    const link = correctionValue('cr-map-link');
    const coords = parseMapLinkCoordinates(link);
    if (!coords) return;
    correctionOverlay.querySelector('#cr-lat').value = coords.lat.toFixed(6);
    correctionOverlay.querySelector('#cr-lng').value = coords.lng.toFixed(6);
  }

  function parseMapLinkCoordinates(link) {
    const text = String(link || '').trim();
    if (!text) return null;

    const decoded = safeDecode(text);
    const patterns = [
      /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
      /[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
      /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    ];

    for (const pattern of patterns) {
      const match = decoded.match(pattern);
      if (!match) continue;
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (isValidCoordinatePair(lat, lng)) return { lat, lng };
    }
    return null;
  }

  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function isValidCoordinatePair(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  function looksLikeMapLink(value) {
    return /(?:google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(value || ''));
  }

  async function handleCorrectionSubmit(e) {
    e.preventDefault();

    const msg = correctionOverlay.querySelector('#cr-msg');
    const submitBtn = correctionOverlay.querySelector('.sf-submit');
    const submitter = correctionValue('cr-submitted-by');
    const email = correctionValue('cr-email');
    const temple = correctionSourceTemple?.name || correctionValue('cr-temple');
    const exists = correctionOverlay.querySelector('input[name="cr-exists"]:checked')?.value || 'yes';

    if (!submitter) {
      showMsg(msg, 'error', 'Please enter your name.');
      return;
    }

    const payload = {
      State: activeState,
      Temple: temple,
      'Submitted By': submitter,
      'Submitter Email': email,
      'Source JSON ID': correctionSourceTemple?.id || '',
      sourceJsonId: String(correctionSourceTemple?.id || ''),
      currentPublicJson: JSON.stringify(correctionSourceTemple || {}),
      source: 'correction-wizard',
    };

    if (exists === 'no') {
      if (!correctionOverlay.querySelector('#cr-confirm-delete').checked) {
        showMsg(msg, 'error', 'Please confirm before sending a deletion request.');
        return;
      }
      payload.kind = 'temple-deletion';
      payload['Request Type'] = 'deletion';
      payload['Admin Label'] = 'DELETION REQUEST';
      payload.Message = correctionValue('cr-delete-reason') || 'Community user reported that this temple does not exist.';
    } else {
      const changed = collectCorrectionFields();
      const locationCorrect = correctionOverlay.querySelector('input[name="cr-location-correct"]:checked')?.value || 'yes';
      payload.kind = 'temple-correction';
      payload['Request Type'] = 'correction';
      payload['Admin Label'] = 'COMMUNITY CORRECTED';
      payload['Temple Exists'] = 'Yes';
      payload['Location Correct'] = locationCorrect === 'yes' ? 'Yes' : 'No';
      Object.assign(payload, changed.fields);
      payload['Correction Fields'] = JSON.stringify(changed.fields);
      payload.Message = changed.notes.join('\n');

      if (!Object.keys(changed.fields).length && !changed.notes.length && locationCorrect === 'yes') {
        showMsg(msg, 'error', 'Please fill at least one correction field.');
        return;
      }
    }

    try {
      submitBtn.disabled = true;
      showMsg(msg, 'success', 'Sending...');
      const result = await tryPostWorkerSubmission(payload);
      if (!result.ok) throw result.error || new Error('Correction failed.');
      showMsg(msg, 'success', 'Thank you. Your request has been sent for review.');
      setTimeout(closeCorrectionModal, 1400);
    } catch (err) {
      const subject = `${payload['Request Type'] === 'deletion' ? 'Deletion Request' : 'Temple Correction'}: ${temple}`;
      const fallbackHref = `mailto:${FORM_SUBMIT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
      showMsg(msg, 'error', 'Could not submit automatically. Opening your email client...');
      addSubmitFallback(msg, fallbackHref);
      window.location.href = fallbackHref;
    } finally {
      submitBtn.disabled = false;
    }
  }

  function collectCorrectionFields() {
    const fields = {};
    const notes = [];
    const locationCorrect = correctionOverlay.querySelector('input[name="cr-location-correct"]:checked')?.value || 'yes';
    const mappings = [
      ['cr-name', 'Temple'],
      ['cr-deity', 'Deity'],
      ['cr-district', 'District'],
      ['cr-timing', 'Timing'],
      ['cr-phone', 'Phone'],
      ['cr-description', 'Description'],
      ['cr-dressCode', 'Dress Code'],
      ['cr-photography', 'Photography'],
      ['cr-nearestBus', 'Nearest Bus'],
      ['cr-nearestRail', 'Nearest Rail'],
      ['cr-sourceUrl', 'Source URL'],
    ];

    mappings.forEach(([id, key]) => {
      const value = correctionValue(id);
      if (value) fields[key] = value;
    });

    if (locationCorrect === 'no') {
      [
        ['cr-location', 'Location'],
        ['cr-lat', 'Latitude'],
        ['cr-lng', 'Longitude'],
      ].forEach(([id, key]) => {
        const value = correctionValue(id);
        if (value) fields[key] = value;
      });
    }

    const mapLink = locationCorrect === 'no' ? correctionValue('cr-map-link') : '';
    const locationNote = locationCorrect === 'no' ? correctionValue('cr-location-note') : '';
    const notesText = correctionValue('cr-notes');
    if (mapLink) fields['Google Maps Link'] = mapLink;
    if (locationNote) notes.push('Location note: ' + locationNote);
    if (notesText) notes.push('Admin note: ' + notesText);

    return { fields, notes };
  }

  function correctionValue(id) {
    return correctionOverlay.querySelector('#' + id)?.value.trim() || '';
  }

async function handleSubmit(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const temple = submitOverlay.querySelector('#sf-temple').value.trim();
  const submitter = submitOverlay.querySelector('#sf-name').value.trim();
  const email = submitOverlay.querySelector('#sf-email').value.trim();
  const msg = submitOverlay.querySelector('#sf-msg');
  const submitBtn = submitOverlay.querySelector('.sf-submit');

  if (!temple) {
    showMsg(msg, 'error', 'Please enter the temple name.');
    return;
  }

  if (!submitter) {
    showMsg(msg, 'error', 'Please enter your name.');
    return;
  }

  const formData = new FormData();
  const isCorrection = submitKind === 'temple-correction';
  const subject = (isCorrection ? 'Temple Correction: ' : 'New Temple Submission: ') + temple;
  const fallbackBody = buildSubmissionEmailBody(temple, submitter, email);
  const fallbackHref = `mailto:${FORM_SUBMIT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fallbackBody)}`;

  submitOverlay.querySelector('#sf-subject').value = subject;
  formData.append('_subject', subject);
  formData.append('_captcha', 'false');
  formData.append('_template', 'table');

  formData.append('State', activeState);
  formData.append('Request Type', isCorrection ? 'correction' : 'submission');
  formData.append('Admin Label', isCorrection ? 'COMMUNITY CORRECTED' : 'COMMUNITY SUBMITTED');
  formData.append('Temple', temple);
  formData.append('Deity', submitOverlay.querySelector('#sf-deity').value.trim());
  formData.append('District', submitOverlay.querySelector('#sf-district').value.trim());
  const submittedLocation = submitOverlay.querySelector('#sf-location').value.trim();
  formData.append('Location', submittedLocation);
  if (looksLikeMapLink(submittedLocation)) formData.append('Google Maps Link', submittedLocation);
  formData.append('Latitude', submitOverlay.querySelector('#sf-lat').value.trim());
  formData.append('Longitude', submitOverlay.querySelector('#sf-lng').value.trim());
  formData.append('Phone', submitOverlay.querySelector('#sf-phone').value.trim());
  formData.append('Timing', submitOverlay.querySelector('#sf-timing').value.trim());
  formData.append('Description', submitOverlay.querySelector('#sf-description').value.trim());
  formData.append('Tags', submitOverlay.querySelector('#sf-tags').value.trim());
  formData.append('Famous', submitOverlay.querySelector('#sf-famous').checked ? 'Yes' : 'No');
  formData.append('Dress Code', submitOverlay.querySelector('#sf-dressCode').value.trim());
  formData.append('Photography', submitOverlay.querySelector('#sf-photography').value.trim());
  formData.append('Nearest Bus', submitOverlay.querySelector('#sf-nearestBus').value.trim());
  formData.append('Nearest Rail', submitOverlay.querySelector('#sf-nearestRail').value.trim());
  formData.append('Submitted By', submitter);
  formData.append('Submitter Email', email);
  if (submitSourceTemple) {
    formData.append('Source JSON ID', submitSourceTemple.id || '');
    formData.append('Current Public JSON', JSON.stringify(submitSourceTemple));
  }

  const workerPayload = {};
  formData.forEach((value, key) => {
    if (!key.startsWith('_')) workerPayload[key] = String(value || '');
  });
  workerPayload.kind = submitKind;
  workerPayload.source = isCorrection ? 'correction-modal' : 'submit-modal';
  if (submitSourceTemple) {
    workerPayload.sourceJsonId = String(submitSourceTemple.id || '');
    workerPayload.currentPublicJson = JSON.stringify(submitSourceTemple);
  }

  try {
    submitBtn.disabled = true;
    form.setAttribute('aria-busy', 'true');
    showMsg(msg, 'success', 'Sending...');

    const workerResult = await tryPostWorkerSubmission(workerPayload);
    const formSubmitResult = await tryPostFormSubmitSubmission(formData);

    if (!workerResult.ok && !formSubmitResult.ok) {
      throw formSubmitResult.error || workerResult.error || new Error('Submission failed.');
    }

    if (!isCorrection && workerResult.ok) {
      await refreshActiveStateData({ resetFilters: true });
      showMsg(msg, 'success', '✅ Thank you! Your temple is now listed as Community submitted · Unverified.');
    } else {
      showMsg(msg, 'success', '✅ Thank you! Your submission has been sent.');
    }

    setTimeout(() => {
      closeSubmitModal();
    }, 1500);

  } catch (err) {
    showMsg(msg, 'error', 'FormSubmit is unavailable right now. Opening your email client...');
    addSubmitFallback(msg, fallbackHref);
    window.location.href = fallbackHref;
  } finally {
    submitBtn.disabled = false;
    form.removeAttribute('aria-busy');
  }
}

  async function tryPostWorkerSubmission(payload) {
    try {
      const response = await fetch(WORKER_SUBMISSION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Worker returned HTTP ${response.status}`);
      }

      return { ok: true };
    } catch (err) {
      console.warn('TempleDiary: worker submit failed', err);
      return { ok: false, error: err };
    }
  }

  async function tryPostFormSubmitSubmission(formData) {
    try {
      const response = await fetch(FORM_SUBMIT_AJAX_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`FormSubmit returned HTTP ${response.status}`);
      }

      return { ok: true };
    } catch (err) {
      console.warn('TempleDiary: FormSubmit failed', err);
      return { ok: false, error: err };
    }
  }

  function buildSubmissionEmailBody(temple, submitter, email) {
    const fields = [
      ['State', activeState],
      ['Temple', temple],
      ['Deity', submitOverlay.querySelector('#sf-deity').value.trim()],
      ['District', submitOverlay.querySelector('#sf-district').value.trim()],
      ['Location', submitOverlay.querySelector('#sf-location').value.trim()],
      ['Google Maps Link', looksLikeMapLink(submitOverlay.querySelector('#sf-location').value.trim()) ? submitOverlay.querySelector('#sf-location').value.trim() : ''],
      ['Latitude', submitOverlay.querySelector('#sf-lat').value.trim()],
      ['Longitude', submitOverlay.querySelector('#sf-lng').value.trim()],
      ['Phone', submitOverlay.querySelector('#sf-phone').value.trim()],
      ['Timing', submitOverlay.querySelector('#sf-timing').value.trim()],
      ['Description', submitOverlay.querySelector('#sf-description').value.trim()],
      ['Tags', submitOverlay.querySelector('#sf-tags').value.trim()],
      ['Famous', submitOverlay.querySelector('#sf-famous').checked ? 'Yes' : 'No'],
      ['Dress Code', submitOverlay.querySelector('#sf-dressCode').value.trim()],
      ['Photography', submitOverlay.querySelector('#sf-photography').value.trim()],
      ['Nearest Bus', submitOverlay.querySelector('#sf-nearestBus').value.trim()],
      ['Nearest Rail', submitOverlay.querySelector('#sf-nearestRail').value.trim()],
      ['Submitted By', submitter],
      ['Submitter Email', email],
    ];

    return fields
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n');
  }

  function addSubmitFallback(msg, fallbackHref) {
    const link = document.createElement('a');
    link.href = fallbackHref;
    link.textContent = 'Send by email';
    link.style.display = 'inline-block';
    link.style.marginTop = '8px';
    msg.appendChild(document.createElement('br'));
    msg.appendChild(link);
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
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }
  function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  /* ── Global Exports ── */
  window.openSubmitModal = openSubmitModal;
  window.openMissingTempleGuide = openMissingTempleGuide;
  window.openSubmitModalFromHome = function () {
    openSubmitModal(null);
    setSubmitLocationMode('manual');
    showManualLocationHelp();
  };

  /**
   * Opens the submit modal and immediately fires GPS detection.
   * Called by the "I'm at the Temple Now" button.
   * assets/js/public/submit-location.js handles the actual GPS + Nominatim logic
   * via the window.tdDetectLocation hook below.
   */
  window.openSubmitModalAtTemple = function () {
    openSubmitModal(null);
    setSubmitLocationMode('gps');
    if (typeof window.tdDetectLocation === 'function') {
      window.tdDetectLocation();
      return;
    }

    // assets/js/public/submit-location.js not loaded yet — click the injected button if present
    const btn = document.getElementById('td-detect-location-btn');
    if (btn) btn.click();
  };

  /* ── Kick off ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
