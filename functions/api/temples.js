import {
  cleanState,
  cleanText,
  isTruthy,
  jsonResponse,
  parseCoordinate,
  parseInteger,
  parseJson,
  parseTags,
  readFirst,
  requireAdmin,
} from '../_shared/api.js';

const PUBLIC_STATUSES = new Set(['verified', 'unverified', 'needs_review']);
const ADMIN_STATUSES = new Set(['verified', 'unverified', 'needs_review', 'removed']);

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      return jsonResponse({ ok: false, error: 'D1 binding DB is not configured.' }, 500);
    }

    const url = new URL(request.url);
    const state = cleanState(url.searchParams.get('state') || 'kerala');
    const include = String(url.searchParams.get('include') || 'public').toLowerCase();
<<<<<<< Updated upstream

    if (include === 'all') {
      const authError = requireAdmin(request, env, {
        bearer: true,
        queryToken: true,
        message: 'Admin token required.',
        responseOptions: { methods: 'GET, OPTIONS', headers: 'Content-Type, x-admin-token, Authorization' },
      });
=======
    if (include === 'all') {
      const authError = requireAdmin(request, env, { bearer: true, queryToken: true });
>>>>>>> Stashed changes
      if (authError) return authError;
    }

    const statuses = include === 'all'
      ? ['verified', 'unverified', 'needs_review', 'removed']
      : [...PUBLIC_STATUSES];

    const placeholders = statuses.map(() => '?').join(', ');
    const query = `
      SELECT
        id,
        source_json_id,
        state,
        name,
        deity,
        district,
        location,
        lat,
        lng,
        timing,
        phone,
        description,
        famous,
        tags,
        admin_label,
        status,
        submitted_by,
        submitted_at,
        approved_at,
        source_url,
        raw_json
      FROM temples
      WHERE state = ? AND status IN (${placeholders})
      ORDER BY name COLLATE NOCASE ASC
    `;

    const result = await env.DB.prepare(query).bind(state, ...statuses).all();
    const temples = (result.results || []).map(rowToTemple);

    return jsonResponse({
      ok: true,
      source: 'd1',
      state,
      count: temples.length,
      _defaults: {},
      temples,
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Failed to load temples.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return jsonResponse({ ok: false, error: 'D1 binding DB is not configured.' }, 500);
    }

    const authError = requireAdmin(request, env, { bearer: true });
    if (authError) return authError;

    const payload = await request.json();
    const temple = normalizeTemplePayload(payload);
    const id = parseInteger(temple.id);
    const decidedBy = cleanText(payload.decidedBy || 'admin');

    if (!temple.name) return jsonResponse({ ok: false, error: 'Temple name is required.' }, 400);
    if (!temple.state) return jsonResponse({ ok: false, error: 'State is required.' }, 400);
    if (!ADMIN_STATUSES.has(temple.status)) return jsonResponse({ ok: false, error: 'Unsupported temple status.' }, 400);

    const rawJson = JSON.stringify({
      name: temple.name,
      deity: temple.deity,
      district: temple.district,
      location: temple.location,
      lat: temple.lat,
      lng: temple.lng,
      timing: temple.timing,
      phone: temple.phone,
      description: temple.description,
      famous: Boolean(temple.famous),
      tags: temple.tags,
      sourceUrl: temple.sourceUrl,
    });

    let templeId = id;
    if (templeId) {
      await env.DB.prepare(`
        UPDATE temples
        SET state = ?,
            source_json_id = ?,
            name = ?,
            deity = ?,
            district = ?,
            location = ?,
            lat = ?,
            lng = ?,
            timing = ?,
            phone = ?,
            description = ?,
            famous = ?,
            tags = ?,
            admin_label = ?,
            status = ?,
            approved_at = CASE WHEN ? = 'verified' THEN CURRENT_TIMESTAMP ELSE approved_at END,
            approved_by = CASE WHEN ? = 'verified' THEN ? ELSE approved_by END,
            source_url = ?,
            raw_json = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        temple.state,
        temple.sourceJsonId,
        temple.name,
        temple.deity,
        temple.district,
        temple.location,
        temple.lat,
        temple.lng,
        temple.timing,
        temple.phone,
        temple.description,
        temple.famous ? 1 : 0,
        JSON.stringify(temple.tags),
        temple.adminLabel,
        temple.status,
        temple.status,
        temple.status,
        decidedBy,
        temple.sourceUrl,
        rawJson,
        templeId
      ).run();
    } else {
      const result = await env.DB.prepare(`
        INSERT INTO temples (
          state,
          source_json_id,
          name,
          deity,
          district,
          location,
          lat,
          lng,
          timing,
          phone,
          description,
          famous,
          tags,
          admin_label,
          status,
          submitted_by,
          submitted_at,
          approved_at,
          approved_by,
          source_url,
          raw_json,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CASE WHEN ? = 'verified' THEN CURRENT_TIMESTAMP ELSE NULL END, CASE WHEN ? = 'verified' THEN ? ELSE NULL END, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        temple.state,
        temple.sourceJsonId,
        temple.name,
        temple.deity,
        temple.district,
        temple.location,
        temple.lat,
        temple.lng,
        temple.timing,
        temple.phone,
        temple.description,
        temple.famous ? 1 : 0,
        JSON.stringify(temple.tags),
        temple.adminLabel,
        temple.status,
        cleanText(payload.submittedBy || payload.submitted_by || 'admin'),
        temple.status,
        temple.status,
        decidedBy,
        temple.sourceUrl,
        rawJson
      ).run();
      templeId = result.meta?.last_row_id || result.meta?.lastRowId;
    }

    const row = await env.DB.prepare(`
      SELECT
        id,
        source_json_id,
        state,
        name,
        deity,
        district,
        location,
        lat,
        lng,
        timing,
        phone,
        description,
        famous,
        tags,
        admin_label,
        status,
        submitted_by,
        submitted_at,
        approved_at,
        source_url,
        raw_json
      FROM temples
      WHERE id = ?
      LIMIT 1
    `).bind(templeId).first();

    return jsonResponse({ ok: true, temple: row ? rowToTemple(row) : null });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Failed to update temple.' }, 500);
  }
}

function normalizeTemplePayload(payload) {
  const tags = parseTags(payload.tags || payload.Tags);
  return {
    id: payload.id,
    state: cleanState(payload.state || payload.State),
    sourceJsonId: parseInteger(payload.sourceJsonId || payload.source_json_id || payload['Source JSON ID']),
    name: cleanText(payload.name || payload.Temple || payload.temple),
    deity: cleanText(payload.deity || payload.Deity),
    district: cleanText(payload.district || payload.District),
    location: cleanText(payload.location || payload.Location),
    lat: parseCoordinate(readFirst(payload.lat, payload.Latitude)),
    lng: parseCoordinate(readFirst(payload.lng, payload.Longitude)),
    timing: cleanText(payload.timing || payload.Timing),
    phone: cleanText(payload.phone || payload.Phone),
    description: cleanText(payload.description || payload.Description),
    famous: isTruthy(readFirst(payload.famous, payload.Famous)),
    tags,
    adminLabel: cleanText(payload.adminLabel || payload.admin_label || payload['Admin Label']),
    status: cleanText(payload.status || 'unverified').toLowerCase(),
    sourceUrl: cleanText(payload.sourceUrl || payload.source_url || payload['Source URL']),
  };
}

function rowToTemple(row) {
  const raw = parseJson(row.raw_json, {});
  const tags = parseJson(row.tags, []);

  return {
    ...raw,
    id: row.id,
    sourceJsonId: row.source_json_id,
    state: row.state,
    name: row.name || raw.name || '',
    deity: row.deity || raw.deity || '',
    district: row.district || raw.district || '',
    location: row.location || raw.location || '',
    lat: row.lat,
    lng: row.lng,
    timing: row.timing || raw.timing || '',
    phone: row.phone || raw.phone || '',
    description: row.description || raw.description || '',
    famous: Boolean(row.famous),
    tags: Array.isArray(tags) ? tags : [],
    adminLabel: row.admin_label || '',
    status: row.status,
    submittedBy: row.submitted_by || '',
    submittedAt: row.submitted_at || '',
    approvedAt: row.approved_at || '',
    sourceUrl: row.source_url || raw.sourceUrl || '',
  };
}
