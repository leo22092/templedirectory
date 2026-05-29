    if (sessionStorage.getItem('kd_admin_auth') !== 'true' || !sessionStorage.getItem('td_admin_api_token')) {
      window.location.href = 'login.html';
    }

    const STATE_CONFIGS = window.TD_STATES?.registry || {};
    const DEFAULTS = {
      dressCode: 'Men: Dhoti or mundu preferred; neat formal wear acceptable in outer areas. Women: Saree or churidar with dupatta. Modest dress required.',
      photography: 'Permitted in outer areas. Not allowed near sanctum during rituals.'
    };
    const FIELD_ORDER = ['id','name','deity','district','location','lat','lng','timing','phone','description','famous','status','adminLabel','tags','dressCode','photography','nearestBus','nearestRail','famousFor','sourceUrl'];
    const app = {
      activeState: localStorage.getItem('td_admin_active_state') || 'kerala',
      configs: loadStateConfigs(),
      data: {},
      defaults: {},
      d1States: [],
      dbTemples: [],
      selectedDbTempleId: null,
      templeRequests: [],
      selected: new Set(),
      dirty: new Set()
    };

    document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
      btn.addEventListener('click', () => showSection(btn.dataset.section));
    });

    init();

    async function init() {
      await loadD1StateConfigs();
      renderStateSelect();
      await loadAllStates();
      switchState(app.activeState, false);
      showSection('overview');
    }

    async function loadD1StateConfigs() {
      try {
        const res = await fetch('/api/temple-states', {
          cache: 'no-store',
          headers: adminHeaders()
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'D1 state request failed');

        app.d1States = json.states || [];
        app.configs = mergeD1StateConfigs(app.configs, app.d1States);

        if (!app.configs[app.activeState]) {
          app.activeState = app.d1States[0]?.state || Object.keys(app.configs)[0] || 'kerala';
          localStorage.setItem('td_admin_active_state', app.activeState);
        }
      } catch (err) {
        app.d1States = [];
        notify('Using local state config; D1 state list unavailable: ' + err.message, 'bad');
      }
    }

    function mergeD1StateConfigs(configs, d1States) {
      const next = { ...configs };
      d1States.forEach(row => {
        const key = cleanStateKey(row.state);
        if (!key) return;
        next[key] = {
          label: next[key]?.label || labelFromStateKey(key),
          dataFile: next[key]?.dataFile || `data/${key}.json`,
          heroImage: next[key]?.heroImage || 'assets/images/hero-bg.jpg',
          eyebrow: next[key]?.eyebrow || 'D1 managed state',
          mapLabel: next[key]?.mapLabel || `Explore ${labelFromStateKey(key)}`,
          d1Count: row.count || 0,
          d1StatusCounts: {
            verified: row.verifiedCount || 0,
            unverified: row.unverifiedCount || 0,
            needsReview: row.needsReviewCount || 0,
            removed: row.removedCount || 0,
          },
        };
      });
      return next;
    }

    async function loadAllStates() {
      for (const key of Object.keys(app.configs)) {
        await loadState(key);
      }
    }

    async function loadState(key, forceFetch) {
      const saved = !forceFetch && localStorage.getItem(storageKey(key));
      if (saved) {
        const parsed = JSON.parse(saved);
        app.data[key] = parsed.temples || [];
        app.defaults[key] = parsed._defaults || DEFAULTS;
        return;
      }
      const cfg = app.configs[key];
      if (!cfg || !cfg.dataFile) {
        app.data[key] = [];
        app.defaults[key] = DEFAULTS;
        return;
      }
      try {
        const res = await fetch(cfg.dataFile, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        app.defaults[key] = json._defaults || DEFAULTS;
        app.data[key] = Array.isArray(json) ? json : (json.temples || []);
      } catch (err) {
        app.defaults[key] = DEFAULTS;
        app.data[key] = [];
        notify('Could not load ' + cfg.dataFile + ': ' + err.message, 'bad');
      }
    }

    function logout() {
      sessionStorage.removeItem('kd_admin_auth');
      sessionStorage.removeItem('td_admin_api_token');
      localStorage.removeItem('td_admin_api_token');
      window.location.href = 'login.html';
    }

    function showSection(name) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === name));
      document.getElementById('section-' + name).classList.add('active');
      const titles = {
        overview: ['Overview', 'D1 is the maintenance layer; JSON is the public rendering layer.'],
        temples: ['Published JSON Preview', 'Search the JSON data currently rendered to public users.'],
        db: ['Temple Maintenance', 'Add, edit, verify, and label temple records directly in D1.'],
        requests: ['Requests', 'Review community submissions, corrections, and deletion requests.'],
        editor: ['JSON Draft Editor', 'Legacy local JSON draft editing for published files.'],
        states: ['States', 'Manage state metadata used by this dashboard.'],
        import: ['JSON Import', 'Replace the selected local JSON draft from a JSON file.'],
        export: ['JSON Export', 'Generate JSON for the 48-hour GitHub publishing cycle.'],
        health: ['Health', 'Check for missing fields, duplicate ids, and invalid coordinates.']
      };
      document.getElementById('page-title').textContent = titles[name][0];
      document.getElementById('page-subtitle').textContent = titles[name][1];
      if (name === 'overview') renderOverview();
      if (name === 'temples') renderTempleTable();
      if (name === 'db') loadDbTemples();
      if (name === 'requests') loadTempleRequests();
      if (name === 'states') renderStates();
      if (name === 'export') generateExport('active');
      if (name === 'health') runHealthChecks();
    }

    function renderStateSelect() {
      const select = document.getElementById('active-state');
      select.innerHTML = Object.entries(app.configs).map(([key, cfg]) => {
        const count = Number.isFinite(Number(cfg.d1Count)) ? ` (${Number(cfg.d1Count)} D1)` : '';
        return `<option value="${esc(key)}">${esc(cfg.label || key)}${count}</option>`;
      }).join('');
      select.value = app.activeState;
    }

    function switchState(key, rerender = true) {
      app.activeState = key;
      localStorage.setItem('td_admin_active_state', key);
      document.getElementById('active-state').value = key;
      app.selected.clear();
      renderDistrictControls();
      if (rerender) {
        renderOverview();
        renderTempleTable();
        runHealthChecks();
      }
      updateDirtyIndicator();
    }

    function activeTemples() {
      return app.data[app.activeState] || [];
    }

    function activeDefaults() {
      return app.defaults[app.activeState] || DEFAULTS;
    }

    function renderOverview() {
      const rows = activeTemples();
      const districts = new Set(rows.map(t => t.district).filter(Boolean));
      const withGps = rows.filter(hasCoords).length;
      const withSource = rows.filter(t => t.sourceUrl).length;
      document.getElementById('stats').innerHTML = [
        ['Temples', rows.length],
        ['Districts', districts.size],
        ['With GPS', withGps],
        ['Famous', rows.filter(t => t.famous).length],
        ['Sources', withSource]
      ].map(([label, value]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('');
      document.getElementById('recent-body').innerHTML = rows.slice(-10).reverse().map(t => `
        <tr><td>${t.id}</td><td class="name-cell">${esc(t.name)}</td><td>${esc(t.district)}</td><td>${gpsPill(t)}</td><td>${t.sourceUrl ? '<span class="pill pill-blue">Source</span>' : '—'}</td></tr>
      `).join('') || `<tr><td colspan="5" class="muted">No records loaded.</td></tr>`;
    }

    function renderDistrictControls() {
      const districts = [...new Set(activeTemples().map(t => t.district).filter(Boolean))].sort();
      document.getElementById('district-filter').innerHTML = `<option value="">All districts</option>` + districts.map(d => `<option>${esc(d)}</option>`).join('');
      document.getElementById('district-list').innerHTML = districts.map(d => `<option value="${esc(d)}"></option>`).join('');
    }

    function renderTempleTable() {
      const q = (document.getElementById('search')?.value || '').trim().toLowerCase();
      const district = document.getElementById('district-filter')?.value || '';
      const quality = document.getElementById('quality-filter')?.value || '';
      const rows = activeTemples().filter(t => {
        const blob = [t.name, t.deity, t.district, t.location, t.description, t.famousFor, (t.tags || []).join(' ')].join(' ').toLowerCase();
        if (q && !blob.includes(q)) return false;
        if (district && t.district !== district) return false;
        if (quality === 'gps' && !hasCoords(t)) return false;
        if (quality === 'nogps' && hasCoords(t)) return false;
        if (quality === 'source' && !t.sourceUrl) return false;
        if (quality === 'famous' && !t.famous) return false;
        return true;
      });
      document.getElementById('list-count').textContent = `(${rows.length})`;
      document.getElementById('temple-body').innerHTML = rows.map(t => `
        <tr>
          <td><input type="checkbox" ${app.selected.has(t.id) ? 'checked' : ''} onchange="toggleRow(${t.id}, this.checked)" /></td>
          <td>${t.id}</td>
          <td class="name-cell">${esc(t.name)}${t.sourceUrl ? '<div class="muted">source linked</div>' : ''}</td>
          <td>${esc(t.deity)}</td>
          <td>${esc(t.district)}</td>
          <td>${gpsPill(t)}</td>
          <td>${t.famous ? '<span class="pill pill-green">Famous</span>' : '—'}</td>
          <td><div class="row-actions"><button class="btn btn-soft btn-sm" onclick="editTemple(${t.id})">Edit</button><button class="btn btn-soft btn-sm" onclick="openMap(${t.id})">Map</button></div></td>
        </tr>
      `).join('') || `<tr><td colspan="8" class="muted">No matching records.</td></tr>`;
    }

    async function loadDbTemples() {
      const body = document.getElementById('db-temple-body');
      if (body) body.innerHTML = `<tr><td colspan="8" class="muted">Loading D1 records...</td></tr>`;
      try {
        const res = await fetch(`/api/temples?state=${encodeURIComponent(app.activeState)}&include=all`, {
          cache: 'no-store',
          headers: adminHeaders()
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'D1 request failed');
        app.dbTemples = json.temples || [];
        renderDbTempleTable();
      } catch (err) {
        app.dbTemples = [];
        if (body) body.innerHTML = `<tr><td colspan="8" class="muted">Could not load D1 records: ${esc(err.message)}</td></tr>`;
      }
    }

    function renderDbTempleTable() {
      const q = (document.getElementById('db-search')?.value || '').trim().toLowerCase();
      const status = document.getElementById('db-status-filter')?.value || '';
      const rows = app.dbTemples.filter(t => {
        const blob = [t.name, t.deity, t.district, t.location, t.adminLabel, t.status].join(' ').toLowerCase();
        if (q && !blob.includes(q)) return false;
        if (status && t.status !== status) return false;
        return true;
      });
      const count = document.getElementById('db-count');
      if (count) count.textContent = `(${rows.length})`;
      document.getElementById('db-temple-body').innerHTML = rows.map(t => `
        <tr class="${t.id === app.selectedDbTempleId ? 'selected-row' : ''}">
          <td>${esc(t.id)}</td>
          <td>${esc(t.sourceJsonId || '')}</td>
          <td class="name-cell">${esc(t.name)}<div class="muted">${esc(t.deity || '')}</div></td>
          <td>${esc(t.district)}</td>
          <td>${statusPill(t.status)}</td>
          <td>${esc(t.adminLabel || '')}</td>
          <td>${gpsPill(t)}</td>
          <td><button class="btn btn-soft btn-sm" type="button" onclick="openDbTempleDetail(${t.id})">Review</button></td>
        </tr>
      `).join('') || `<tr><td colspan="8" class="muted">No D1 records found.</td></tr>`;
    }

    function openDbTempleDetail(id) {
      const temple = app.dbTemples.find(t => Number(t.id) === Number(id));
      if (!temple) return notify('D1 record not found in the loaded list.', 'bad');
      app.selectedDbTempleId = temple.id;
      fillDbTempleForm(temple);
      document.getElementById('db-detail-title').textContent = `D1 #${temple.id}: ${temple.name || 'Unnamed temple'}`;
      document.getElementById('db-detail-summary').innerHTML = dbTempleDetailSummary(temple);
      document.getElementById('db-detail-msg').textContent = '';
      document.getElementById('db-detail-panel').hidden = false;
      renderDbTempleTable();
    }

    function newDbTemple() {
      const temple = {
        id: '',
        sourceJsonId: '',
        state: app.activeState,
        name: '',
        deity: '',
        district: '',
        location: '',
        lat: '',
        lng: '',
        timing: '',
        phone: '',
        description: '',
        famous: false,
        tags: [],
        status: 'unverified',
        adminLabel: 'ADMIN ADDED',
        sourceUrl: ''
      };
      app.selectedDbTempleId = null;
      fillDbTempleForm(temple);
      document.getElementById('db-detail-title').textContent = 'Add D1 Temple';
      document.getElementById('db-detail-summary').innerHTML = '<span class="muted">This will create a new row in D1 for the active state.</span>';
      document.getElementById('db-detail-msg').textContent = '';
      document.getElementById('db-detail-panel').hidden = false;
      renderDbTempleTable();
    }

    function fillDbTempleForm(temple) {
      setValue('db-detail-id', temple.id || '');
      setValue('db-detail-name', temple.name || '');
      setValue('db-detail-deity', temple.deity || '');
      setValue('db-detail-district', temple.district || '');
      setValue('db-detail-location', temple.location || '');
      setValue('db-detail-lat', temple.lat ?? '');
      setValue('db-detail-lng', temple.lng ?? '');
      setValue('db-detail-timing', temple.timing || '');
      setValue('db-detail-phone', temple.phone || '');
      setValue('db-detail-description', temple.description || '');
      setValue('db-detail-source', temple.sourceUrl || '');
      setValue('db-detail-tags', Array.isArray(temple.tags) ? temple.tags.join(', ') : '');
      setValue('db-detail-status', temple.status || 'unverified');
      setValue('db-detail-label', temple.adminLabel || '');
      setValue('db-detail-source-json-id', temple.sourceJsonId || '');
      document.getElementById('db-detail-famous').checked = Boolean(temple.famous);
    }

    function closeDbDetail() {
      app.selectedDbTempleId = null;
      document.getElementById('db-detail-panel').hidden = true;
      renderDbTempleTable();
    }

    function dbTempleDetailSummary(t) {
      const rows = [
        ['Name', t.name],
        ['Deity', t.deity],
        ['District', t.district],
        ['Location', t.location],
        ['Coordinates', [t.lat, t.lng].filter(v => v !== null && v !== undefined && v !== '').join(', ')],
        ['Timing', t.timing],
        ['Phone', t.phone],
        ['Source', t.sourceUrl],
        ['Submitted By', t.submittedBy],
        ['Submitted At', formatDate(t.submittedAt)],
        ['Approved At', formatDate(t.approvedAt)]
      ];
      return rows
        .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
        .map(([label, value]) => `<strong>${esc(label)}:</strong> ${label === 'Source' ? linkIfUrl(value) : esc(value)}`)
        .join('<br>') || '<span class="muted">No detail fields available.</span>';
    }

    function linkIfUrl(value) {
      const text = String(value || '').trim();
      if (!/^https?:\/\//i.test(text)) return esc(text);
      return `<a href="${escAttr(text)}" target="_blank" rel="noopener">${esc(text)}</a>`;
    }

    async function saveDbTempleReview() {
      const id = Number(document.getElementById('db-detail-id')?.value || 0);
      const temple = collectDbTempleForm();
      const msg = document.getElementById('db-detail-msg');
      if (!temple.name) return notify('Temple name is required.', 'bad');
      try {
        if (msg) msg.textContent = 'Saving...';
        const res = await fetch('/api/temples', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...adminHeaders()
          },
          body: JSON.stringify({ ...temple, decidedBy: 'admin' })
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'D1 update failed');
        const next = json.temple;
        const idx = app.dbTemples.findIndex(t => Number(t.id) === Number(next?.id || id));
        if (idx !== -1 && next) app.dbTemples[idx] = next;
        else if (next) app.dbTemples.push(next);
        if (next) openDbTempleDetail(next.id);
        if (msg) msg.textContent = 'Saved.';
        notify('D1 record updated.', 'ok');
      } catch (err) {
        if (msg) msg.textContent = '';
        notify('D1 update failed: ' + err.message, 'bad');
      }
    }

    function collectDbTempleForm() {
      return {
        id: document.getElementById('db-detail-id')?.value || '',
        state: app.activeState,
        sourceJsonId: document.getElementById('db-detail-source-json-id')?.value || '',
        name: document.getElementById('db-detail-name')?.value.trim() || '',
        deity: document.getElementById('db-detail-deity')?.value.trim() || '',
        district: document.getElementById('db-detail-district')?.value.trim() || '',
        location: document.getElementById('db-detail-location')?.value.trim() || '',
        lat: document.getElementById('db-detail-lat')?.value.trim() || '',
        lng: document.getElementById('db-detail-lng')?.value.trim() || '',
        timing: document.getElementById('db-detail-timing')?.value.trim() || '',
        phone: document.getElementById('db-detail-phone')?.value.trim() || '',
        description: document.getElementById('db-detail-description')?.value.trim() || '',
        sourceUrl: document.getElementById('db-detail-source')?.value.trim() || '',
        tags: document.getElementById('db-detail-tags')?.value.trim() || '',
        status: document.getElementById('db-detail-status')?.value || 'unverified',
        adminLabel: document.getElementById('db-detail-label')?.value.trim() || '',
        famous: document.getElementById('db-detail-famous')?.checked || false
      };
    }

    function openSelectedDbMap() {
      const temple = app.dbTemples.find(t => Number(t.id) === Number(app.selectedDbTempleId));
      if (temple && hasCoords(temple)) window.open(`https://www.google.com/maps?q=${temple.lat},${temple.lng}`, '_blank', 'noopener');
      else notify('This D1 record has no coordinates.', 'bad');
    }

    async function loadTempleRequests() {
      const body = document.getElementById('request-body');
        if (body) body.innerHTML = `<tr><td colspan="9" class="muted">Loading requests...</td></tr>`;
      const type = document.getElementById('request-type-filter')?.value || 'submission';
      const status = document.getElementById('request-status-filter')?.value || 'pending';
      try {
        const params = new URLSearchParams({
          state: app.activeState,
          type,
          status,
          limit: '100'
        });
        const res = await fetch(`/api/temple-requests?${params.toString()}`, {
          cache: 'no-store',
          headers: adminHeaders()
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'Request load failed');
        app.templeRequests = json.requests || [];
        renderTempleRequests();
      } catch (err) {
        app.templeRequests = [];
        if (body) body.innerHTML = `<tr><td colspan="9" class="muted">Could not load requests: ${esc(err.message)}</td></tr>`;
      }
    }

    function renderTempleRequests() {
      const rows = app.templeRequests;
      const count = document.getElementById('request-count');
      if (count) count.textContent = `(${rows.length})`;
      document.getElementById('request-body').innerHTML = rows.map(req => {
        const payload = req.payload || {};
        const current = req.currentDb || {};
        const currentPublic = req.currentPublic || {};
        return `
          <tr>
            <td>${esc(formatDate(req.createdAt))}</td>
            <td>${statusPill(req.requestType)}</td>
            <td class="name-cell">${esc(payload.Temple || payload.temple || current.name || '')}<div class="muted">D1 ${esc(req.templeId || '')} JSON ${esc(req.sourceJsonId || '')}</div></td>
            <td>${esc(req.submittedBy || payload['Submitted By'] || '')}<div class="muted">${esc(req.submitterEmail || payload['Submitter Email'] || '')}</div></td>
            <td>${esc(req.adminLabel || '')}</td>
            <td>${compactTempleSummary(current, 'No DB match')}</td>
            <td>${compactTempleSummary(currentPublic, 'No public JSON snapshot')}</td>
            <td>${req.requestType === 'correction' ? correctionDiffSummary(req) : compactRequestSummary(payload)}</td>
            <td><div class="row-actions">${requestActionButtons(req)}</div></td>
          </tr>
        `;
      }).join('') || `<tr><td colspan="9" class="muted">No matching requests.</td></tr>`;
    }

    function requestActionButtons(req) {
      if (!['pending', 'needs_review'].includes(req.status)) return '<span class="muted">Archived</span>';
      const approveText = req.requestType === 'correction' ? 'Merge' : (req.requestType === 'deletion' ? 'Remove' : 'Approve');
      const encodedLabel = encodeURIComponent(req.adminLabel || '');
      return [
        `<button class="btn btn-green btn-sm" type="button" onclick="decideTempleRequest('${escAttr(req.id)}','approve','${encodedLabel}')">${approveText}</button>`,
        `<button class="btn btn-soft btn-sm" type="button" onclick="decideTempleRequest('${escAttr(req.id)}','needs_review','${encodedLabel}')">Needs review</button>`,
        `<button class="btn btn-red btn-sm" type="button" onclick="decideTempleRequest('${escAttr(req.id)}','reject','${encodedLabel}')">Reject</button>`
      ].join('');
    }

    async function decideTempleRequest(id, action, encodedCurrentLabel) {
      const actionText = action === 'approve' ? 'approve/merge' : action.replace('_', ' ');
      if (!confirm(`Are you sure you want to ${actionText} this request?`)) return;

      let adminLabel = decodeURIComponent(encodedCurrentLabel || '');
      if (action === 'approve' || action === 'needs_review') {
        const nextLabel = prompt('Admin label for this request:', adminLabel);
        if (nextLabel === null) return;
        adminLabel = nextLabel.trim();
      }

      try {
        const res = await fetch('/api/temple-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...adminHeaders()
          },
          body: JSON.stringify({
            id,
            action,
            adminLabel,
            decidedBy: 'admin'
          })
        });
        const json = await res.json();
        if (!res.ok || !json.ok) throw new Error(json.error || 'Request update failed');
        notify('Request updated.', 'ok');
        await loadTempleRequests();
        if (action === 'approve') await loadDbTemples();
      } catch (err) {
        notify('Request update failed: ' + err.message, 'bad');
      }
    }

    function newTemple() {
      clearForm();
      document.getElementById('editor-title').textContent = 'Add Temple';
      showSection('editor');
    }

    function clearForm() {
      ['f-id','f-name','f-deity','f-district','f-location','f-lat','f-lng','f-timing','f-phone','f-description','f-famousFor','f-dressCode','f-photography','f-nearestBus','f-nearestRail','f-sourceUrl','f-tags'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('f-famous').checked = false;
      document.getElementById('f-remove-defaults').checked = true;
    }

    function editTemple(id) {
      const t = activeTemples().find(row => row.id === id);
      if (!t) return;
      document.getElementById('editor-title').textContent = 'Edit Temple #' + id;
      setValue('f-id', t.id);
      setValue('f-name', t.name);
      setValue('f-deity', t.deity);
      setValue('f-district', t.district);
      setValue('f-location', t.location);
      setValue('f-lat', t.lat);
      setValue('f-lng', t.lng);
      setValue('f-timing', t.timing);
      setValue('f-phone', t.phone);
      setValue('f-description', t.description);
      setValue('f-famousFor', t.famousFor);
      setValue('f-dressCode', t.dressCode);
      setValue('f-photography', t.photography);
      setValue('f-nearestBus', t.nearestBus);
      setValue('f-nearestRail', t.nearestRail);
      setValue('f-sourceUrl', t.sourceUrl);
      setValue('f-tags', (t.tags || []).join(', '));
      document.getElementById('f-famous').checked = !!t.famous;
      showSection('editor');
    }

    function saveTemple() {
      const record = readFormRecord();
      const errors = validateRecord(record);
      if (errors.length) {
        notify(errors.join(' '), 'bad');
        return;
      }
      const rows = activeTemples();
      const existingId = Number(document.getElementById('f-id').value);
      if (existingId) {
        const idx = rows.findIndex(t => t.id === existingId);
        if (idx >= 0) rows[idx] = record;
      } else {
        record.id = nextId(rows);
        rows.push(record);
      }
      persistActive();
      notify('Saved locally. Export JSON to make it live.', 'ok');
      renderDistrictControls();
      renderTempleTable();
      renderOverview();
      editTemple(record.id);
    }

    function readFormRecord() {
      const defaults = activeDefaults();
      const tags = document.getElementById('f-tags').value.split(',').map(s => s.trim()).filter(Boolean);
      const omitDefaults = document.getElementById('f-remove-defaults').checked;
      const record = {
        id: Number(document.getElementById('f-id').value) || 0,
        name: val('f-name'),
        deity: val('f-deity'),
        district: val('f-district'),
        location: val('f-location'),
        lat: numericOrNull(val('f-lat')),
        lng: numericOrNull(val('f-lng')),
        timing: val('f-timing'),
        phone: val('f-phone'),
        description: val('f-description'),
        famous: document.getElementById('f-famous').checked,
        tags,
        dressCode: val('f-dressCode'),
        photography: val('f-photography'),
        nearestBus: val('f-nearestBus'),
        nearestRail: val('f-nearestRail'),
        famousFor: val('f-famousFor'),
        sourceUrl: val('f-sourceUrl')
      };
      if (omitDefaults && record.dressCode === defaults.dressCode) delete record.dressCode;
      if (omitDefaults && record.photography === defaults.photography) delete record.photography;
      return orderedRecord(record);
    }

    function validateCurrentForm() {
      const errors = validateRecord(readFormRecord());
      notify(errors.length ? errors.join(' ') : 'Form looks valid.', errors.length ? 'bad' : 'ok');
    }

    function validateRecord(t) {
      const errors = [];
      if (!t.name) errors.push('Name is required.');
      if (!t.deity) errors.push('Deity is required.');
      if (!t.district) errors.push('District is required.');
      if ((t.lat === null) !== (t.lng === null)) errors.push('Latitude and longitude must both be present or both empty.');
      if (t.lat !== null && (t.lat < -90 || t.lat > 90)) errors.push('Latitude is outside valid range.');
      if (t.lng !== null && (t.lng < -180 || t.lng > 180)) errors.push('Longitude is outside valid range.');
      if (t.sourceUrl && !/^https?:\/\//i.test(t.sourceUrl)) errors.push('Source URL must start with http:// or https://.');
      return errors;
    }

    function deleteFromForm() {
      const id = Number(document.getElementById('f-id').value);
      if (!id) return clearForm();
      if (!confirm('Delete temple #' + id + '?')) return;
      app.data[app.activeState] = activeTemples().filter(t => t.id !== id);
      app.selected.delete(id);
      persistActive();
      clearForm();
      renderTempleTable();
      renderOverview();
      notify('Deleted locally. Export JSON to make it live.', 'ok');
    }

    function duplicateSelected() {
      const rows = activeTemples();
      if (!app.selected.size) return notify('Select at least one row to duplicate.', 'bad');
      for (const id of [...app.selected]) {
        const original = rows.find(t => t.id === id);
        if (original) rows.push({ ...deepClone(original), id: nextId(rows), name: original.name + ' Copy' });
      }
      app.selected.clear();
      persistActive();
      renderTempleTable();
      notify('Duplicated selected records locally.', 'ok');
    }

    function deleteSelected() {
      if (!app.selected.size) return notify('Select rows to delete.', 'bad');
      if (!confirm('Delete ' + app.selected.size + ' selected records?')) return;
      app.data[app.activeState] = activeTemples().filter(t => !app.selected.has(t.id));
      app.selected.clear();
      persistActive();
      renderTempleTable();
      renderOverview();
      notify('Deleted selected records locally.', 'ok');
    }

    function renderStates() {
      document.getElementById('state-body').innerHTML = Object.entries(app.configs).map(([key, cfg]) => `
        <tr><td>${esc(key)}</td><td>${esc(cfg.label)}</td><td>${esc(cfg.dataFile)}</td><td>${Number.isFinite(Number(cfg.d1Count)) ? Number(cfg.d1Count) : (app.data[key] || []).length}</td><td><button class="btn btn-soft btn-sm" onclick="editStateConfig('${escAttr(key)}')">Edit</button></td></tr>
      `).join('');
    }

    function addStateConfig() {
      ['s-key','s-label','s-dataFile','s-heroImage','s-eyebrow','s-mapLabel'].forEach(id => document.getElementById(id).value = '');
    }

    function editStateConfig(key) {
      const cfg = app.configs[key];
      if (!cfg) return;
      setValue('s-key', key);
      setValue('s-label', cfg.label);
      setValue('s-dataFile', cfg.dataFile);
      setValue('s-heroImage', cfg.heroImage);
      setValue('s-eyebrow', cfg.eyebrow);
      setValue('s-mapLabel', cfg.mapLabel);
    }

    function saveStateConfig() {
      const key = val('s-key').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
      if (!key || !val('s-label') || !val('s-dataFile')) return notify('State key, label and data file are required.', 'bad');
      app.configs[key] = {
        label: val('s-label'),
        dataFile: val('s-dataFile'),
        heroImage: val('s-heroImage'),
        eyebrow: val('s-eyebrow'),
        mapLabel: val('s-mapLabel')
      };
      if (!app.data[key]) app.data[key] = [];
      if (!app.defaults[key]) app.defaults[key] = DEFAULTS;
      localStorage.setItem('td_admin_state_configs', JSON.stringify(app.configs));
      renderStateSelect();
      renderStates();
      notify('State config saved locally. You still need to update main.js/index.html for new public states.', 'ok');
    }

    function readImportFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => document.getElementById('import-text').value = reader.result;
      reader.readAsText(file);
    }

    async function loadActiveFromDisk() {
      localStorage.removeItem(storageKey(app.activeState));
      await loadState(app.activeState, true);
      app.dirty.delete(app.activeState);
      renderDistrictControls();
      renderOverview();
      renderTempleTable();
      notify('Reloaded active state from site file.', 'ok');
    }

    function parseImportText() {
      const json = JSON.parse(document.getElementById('import-text').value);
      return normalizeStateJson(json);
    }

    function previewImport() {
      try {
        const parsed = parseImportText();
        notify(`Import preview: ${parsed.temples.length} temples, ${Object.keys(parsed._defaults || {}).length} default fields.`, 'ok');
      } catch (err) {
        notify('Invalid JSON: ' + err.message, 'bad');
      }
    }

    function applyImport() {
      try {
        const parsed = parseImportText();
        app.data[app.activeState] = parsed.temples;
        app.defaults[app.activeState] = parsed._defaults || DEFAULTS;
        persistActive();
        renderDistrictControls();
        renderOverview();
        renderTempleTable();
        notify('Imported JSON into active state locally.', 'ok');
      } catch (err) {
        notify('Import failed: ' + err.message, 'bad');
      }
    }

    async function generateExport(mode) {
      try {
        const out = mode === 'all'
          ? JSON.stringify(await makeAllD1StateJson(), null, 2)
          : JSON.stringify(await makeD1StateJson(app.activeState), null, 2);
        document.getElementById('export-text').value = out + '\n';
        notify('Generated D1 JSON export.', 'ok');
      } catch (err) {
        notify('D1 JSON export failed: ' + err.message, 'bad');
      }
    }

    function makeStateJson(key) {
      return {
        _defaults: app.defaults[key] || DEFAULTS,
        temples: (app.data[key] || []).map(orderedRecord)
      };
    }

    async function makeAllD1StateJson() {
      const out = {};
      for (const key of Object.keys(app.configs)) {
        out[key] = await makeD1StateJson(key);
      }
      return out;
    }

    async function makeD1StateJson(key) {
      const temples = await fetchD1TemplesForExport(key);
      return {
        _defaults: app.defaults[key] || DEFAULTS,
        temples: temples.map(d1TempleToPublicJson)
      };
    }

    async function fetchD1TemplesForExport(key) {
      const res = await fetch(`/api/temples?state=${encodeURIComponent(key)}&include=all`, {
        cache: 'no-store',
        headers: adminHeaders()
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || `D1 export failed for ${key}`);
      return (json.temples || [])
        .filter(t => t.status !== 'removed')
        .sort((a, b) => String(a.district || '').localeCompare(String(b.district || '')) || String(a.name || '').localeCompare(String(b.name || '')));
    }

    function d1TempleToPublicJson(t) {
      return orderedRecord({
        id: t.sourceJsonId || t.id,
        name: t.name,
        deity: t.deity,
        district: t.district,
        location: t.location,
        lat: t.lat,
        lng: t.lng,
        timing: t.timing,
        phone: t.phone,
        description: t.description,
        famous: Boolean(t.famous),
        status: t.status,
        adminLabel: t.adminLabel,
        tags: Array.isArray(t.tags) ? t.tags : [],
        dressCode: t.dressCode,
        photography: t.photography,
        nearestBus: t.nearestBus,
        nearestRail: t.nearestRail,
        famousFor: t.famousFor,
        sourceUrl: t.sourceUrl
      });
    }

    async function copyExport() {
      const ta = document.getElementById('export-text');
      if (!ta.value) await generateExport('active');
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(ta.value).then(() => notify('Copied export JSON.', 'ok')).catch(() => {
          ta.select();
          document.execCommand('copy');
          notify('Copied export JSON.', 'ok');
        });
        return;
      }
      ta.select();
      document.execCommand('copy');
      notify('Copied export JSON.', 'ok');
    }

    async function downloadActiveJson() {
      try {
        const cfg = app.configs[app.activeState];
        const stateJson = await makeD1StateJson(app.activeState);
        downloadText(fileNameFromPath(cfg.dataFile || app.activeState + '.json'), JSON.stringify(stateJson, null, 2) + '\n');
      } catch (err) {
        notify('D1 JSON download failed: ' + err.message, 'bad');
      }
    }

    async function downloadAllJson() {
      try {
        const stamp = new Date().toISOString().slice(0, 10);
        downloadText('templediary-d1-export-' + stamp + '.json', JSON.stringify(await makeAllD1StateJson(), null, 2) + '\n');
      } catch (err) {
        notify('D1 all-state export failed: ' + err.message, 'bad');
      }
    }

    function downloadLocalDraftJson() {
      const cfg = app.configs[app.activeState];
      downloadText('local-draft-' + fileNameFromPath(cfg.dataFile || app.activeState + '.json'), JSON.stringify(makeStateJson(app.activeState), null, 2) + '\n');
    }

    function runHealthChecks() {
      const rows = activeTemples();
      const duplicateIds = findDuplicates(rows.map(t => t.id));
      const missingRequired = rows.filter(t => !t.name || !t.deity || !t.district);
      const badCoords = rows.filter(t => (t.lat === null) !== (t.lng === null) || (t.lat !== null && (Number(t.lat) < -90 || Number(t.lat) > 90)) || (t.lng !== null && (Number(t.lng) < -180 || Number(t.lng) > 180)));
      const missingLocation = rows.filter(t => !t.location);
      const noDescription = rows.filter(t => !t.description);
      document.getElementById('health-summary').innerHTML = [
        ['Duplicate IDs', duplicateIds.length],
        ['Missing Required', missingRequired.length],
        ['Bad Coordinates', badCoords.length],
        ['No Location', missingLocation.length],
        ['No Description', noDescription.length]
      ].map(([label, value]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('');
      const groups = [
        ['Duplicate IDs', duplicateIds.map(id => 'ID ' + id)],
        ['Missing required fields', missingRequired.map(t => `#${t.id} ${t.name || '(no name)'}`)],
        ['Bad coordinates', badCoords.map(t => `#${t.id} ${t.name}`)],
        ['Missing location', missingLocation.slice(0, 50).map(t => `#${t.id} ${t.name}`)],
        ['Missing description', noDescription.slice(0, 50).map(t => `#${t.id} ${t.name}`)]
      ];
      document.getElementById('health-list').innerHTML = groups.map(([title, items]) => `
        <div class="health-item"><div><strong>${title}</strong><div class="muted">${items.length ? esc(items.join(', ')) : 'None'}</div></div><span class="pill ${items.length ? 'pill-red' : 'pill-green'}">${items.length}</span></div>
      `).join('');
    }

    function persistActive() {
      localStorage.setItem(storageKey(app.activeState), JSON.stringify(makeStateJson(app.activeState)));
      app.dirty.add(app.activeState);
      updateDirtyIndicator();
    }

    function updateDirtyIndicator() {
      const el = document.getElementById('dirty-indicator');
      const dirty = app.dirty.has(app.activeState) || localStorage.getItem(storageKey(app.activeState));
      el.textContent = dirty ? 'Local draft' : 'Loaded from file';
      el.className = dirty ? 'pill pill-blue' : 'pill pill-green';
    }

    function resetLocalDraft() {
      if (!confirm('Discard local draft for ' + app.activeState + '?')) return;
      localStorage.removeItem(storageKey(app.activeState));
      app.dirty.delete(app.activeState);
      loadState(app.activeState, true).then(() => switchState(app.activeState));
    }

    function resetAllDrafts() {
      if (!confirm('Discard all local admin drafts?')) return;
      Object.keys(app.configs).forEach(key => localStorage.removeItem(storageKey(key)));
      localStorage.removeItem('td_admin_state_configs');
      location.reload();
    }

    function toggleRow(id, checked) {
      checked ? app.selected.add(id) : app.selected.delete(id);
    }

    function toggleAllRows(checked) {
      document.querySelectorAll('#temple-body input[type="checkbox"]').forEach(box => {
        box.checked = checked;
        const id = Number(box.closest('tr').children[1].textContent);
        toggleRow(id, checked);
      });
    }

    function openMap(id) {
      const t = activeTemples().find(row => row.id === id);
      if (t && hasCoords(t)) window.open(`https://www.google.com/maps?q=${t.lat},${t.lng}`, '_blank', 'noopener');
      else notify('This record has no coordinates.', 'bad');
    }

    function orderedRecord(record) {
      const out = {};
      FIELD_ORDER.forEach(key => {
        if (record[key] !== undefined && record[key] !== '') out[key] = record[key];
      });
      Object.keys(record).forEach(key => {
        if (!FIELD_ORDER.includes(key) && record[key] !== undefined && record[key] !== '') out[key] = record[key];
      });
      return out;
    }

    function normalizeStateJson(json) {
      const defaults = json._defaults || DEFAULTS;
      const temples = Array.isArray(json) ? json : (json.temples || []);
      if (!Array.isArray(temples)) throw new Error('Expected temples array');
      return { _defaults: defaults, temples: temples.map(orderedRecord) };
    }

    function storageKey(key) { return 'td_admin_state_data_' + key; }
    function loadJson(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || deepClone(fallback); } catch { return deepClone(fallback); } }
    function loadStateConfigs() {
      const defaults = deepClone(STATE_CONFIGS);
      const saved = loadJson('td_admin_state_configs', {});
      return { ...defaults, ...saved };
    }
    function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
    function nextId(rows) { return rows.length ? Math.max(...rows.map(t => Number(t.id) || 0)) + 1 : 1; }
    function hasCoords(t) { return t.lat !== null && t.lng !== null && t.lat !== undefined && t.lng !== undefined && t.lat !== '' && t.lng !== ''; }
    function gpsPill(t) { return hasCoords(t) ? '<span class="pill pill-green">GPS</span>' : '<span class="pill pill-red">No GPS</span>'; }
    function statusPill(status) {
      const text = String(status || '').replace(/_/g, ' ') || 'none';
      const cls = status === 'verified' || status === 'approved' || status === 'submission'
        ? 'pill-green'
        : (status === 'rejected' || status === 'removed' || status === 'deletion' ? 'pill-red' : 'pill-blue');
      return `<span class="pill ${cls}">${esc(text)}</span>`;
    }
    function adminHeaders() {
      const token = sessionStorage.getItem('td_admin_api_token') || '';
      return token ? { 'x-admin-token': token } : {};
    }
    function formatDate(value) {
      if (!value) return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
    }
    function compactTempleSummary(t, emptyLabel = 'No record') {
      if (!t || !Object.keys(t).length) return `<span class="muted">${esc(emptyLabel)}</span>`;
      return [
        `<strong>${esc(t.name || '')}</strong>`,
        esc([t.district, t.location].filter(Boolean).join(', ')),
        esc([t.lat, t.lng].filter(v => v !== null && v !== undefined && v !== '').join(', '))
      ].filter(Boolean).join('<br>');
    }
    function compactRequestSummary(payload) {
      const fields = ['Temple Exists','Location Correct','Deity','District','Location','Latitude','Longitude','Google Maps Link','Phone','Timing','Description','Dress Code','Photography','Nearest Bus','Nearest Rail','Source URL','Message'];
      const items = fields
        .map(key => [key, payload[key] || payload[key.replace(/\s+/g, '')]])
        .filter(([, value]) => value)
        .slice(0, 8)
        .map(([key, value]) => `<strong>${esc(key)}:</strong> ${esc(value)}`);
      return items.join('<br>') || '<span class="muted">No extra fields</span>';
    }
    function correctionDiffSummary(req) {
      const payload = req.payload || {};
      const currentDb = req.currentDb || {};
      const currentPublic = req.currentPublic || {};
      const fields = changedCorrectionFields(payload);
      if (!fields.length) return '<span class="muted">No changed fields submitted.</span>';
      return `<div class="diff-list">${fields.map(field => {
        const next = field.value;
        return `
          <div class="diff-item">
            <div class="diff-field">${esc(field.label)}</div>
            <div class="diff-row"><b>D1</b><span>${formatDiffValue(readComparableValue(currentDb, field.key))}</span></div>
            <div class="diff-row"><b>JSON</b><span>${formatDiffValue(readComparableValue(currentPublic, field.key))}</span></div>
            <div class="diff-row diff-new"><b>Request</b><span>${formatDiffValue(next)}</span></div>
          </div>
        `;
      }).join('')}</div>`;
    }
    function changedCorrectionFields(payload) {
      const fieldMap = [
        ['Temple', 'name'],
        ['Deity', 'deity'],
        ['District', 'district'],
        ['Location', 'location'],
        ['Latitude', 'lat'],
        ['Longitude', 'lng'],
        ['Google Maps Link', 'googleMapsCorrection'],
        ['Phone', 'phone'],
        ['Timing', 'timing'],
        ['Description', 'description'],
        ['Dress Code', 'dressCode'],
        ['Photography', 'photography'],
        ['Nearest Bus', 'nearestBus'],
        ['Nearest Rail', 'nearestRail'],
        ['Source URL', 'sourceUrl'],
        ['Message', 'lastCorrectionNote']
      ];
      return fieldMap
        .map(([label, key]) => ({ label, key, value: payload[label] || payload[key] || payload[label.replace(/\s+/g, '')] }))
        .filter(field => field.value !== undefined && field.value !== null && String(field.value).trim() !== '');
    }
    function readComparableValue(record, key) {
      if (!record || !Object.keys(record).length) return '';
      if (record[key] !== undefined && record[key] !== null) return record[key];
      if (key === 'sourceUrl') return record.source_url || '';
      if (key === 'googleMapsCorrection') return parseRawJson(record).googleMapsCorrection || '';
      if (key === 'lastCorrectionNote') return parseRawJson(record).lastCorrectionNote || '';
      return '';
    }
    function parseRawJson(record) {
      if (!record || !record.raw_json) return {};
      if (typeof record.raw_json === 'object') return record.raw_json;
      try { return JSON.parse(record.raw_json); } catch { return {}; }
    }
    function formatDiffValue(value) {
      if (Array.isArray(value)) value = value.join(', ');
      if (value === undefined || value === null || String(value).trim() === '') return '<span class="diff-empty">blank</span>';
      return esc(value);
    }
    function numericOrNull(value) { return value === '' ? null : Number(value); }
    function val(id) { return document.getElementById(id).value.trim(); }
    function setValue(id, value) { document.getElementById(id).value = value ?? ''; }
    function cleanStateKey(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, ''); }
    function labelFromStateKey(key) {
      return cleanStateKey(key)
        .split('-')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    function findDuplicates(values) { const seen = new Set(), dup = new Set(); values.forEach(v => seen.has(v) ? dup.add(v) : seen.add(v)); return [...dup]; }
    function fileNameFromPath(path) { return String(path).split('/').pop() || 'data.json'; }
    function downloadText(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
    function esc(str) { return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
    function escAttr(str) { return esc(str).replace(/`/g, '&#096;'); }
    function notify(message, type) { const el = document.getElementById('alert'); el.textContent = message; el.className = 'alert show ' + (type === 'bad' ? 'alert-bad' : 'alert-ok'); setTimeout(() => el.classList.remove('show'), 5000); }

    Object.assign(window, {
      addStateConfig,
      applyImport,
      closeDbDetail,
      copyExport,
      decideTempleRequest,
      deleteFromForm,
      deleteSelected,
      downloadActiveJson,
      downloadAllJson,
      downloadLocalDraftJson,
      duplicateSelected,
      editStateConfig,
      editTemple,
      generateExport,
      loadActiveFromDisk,
      loadDbTemples,
      loadTempleRequests,
      logout,
      newDbTemple,
      newTemple,
      openDbTempleDetail,
      openMap,
      openSelectedDbMap,
      previewImport,
      readImportFile,
      resetAllDrafts,
      resetLocalDraft,
      runHealthChecks,
      saveDbTempleReview,
      saveStateConfig,
      saveTemple,
      showSection,
      switchState,
      toggleAllRows,
      toggleRow,
      validateCurrentForm,
    });
