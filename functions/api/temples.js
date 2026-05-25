const PUBLIC_STATUSES = new Set(['verified', 'unverified']);
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

    const authError = requireAdmin(request, env);
    if (authError) return authError;

    const payload = await request.json();
    const id = parseInteger(payload.id);
    const status = cleanText(payload.status).toLowerCase();
    const adminLabel = cleanText(payload.adminLabel || payload.admin_label);
    const decidedBy = cleanText(payload.decidedBy || 'admin');

    if (!id) return jsonResponse({ ok: false, error: 'Temple id is required.' }, 400);
    if (!ADMIN_STATUSES.has(status)) return jsonResponse({ ok: false, error: 'Unsupported temple status.' }, 400);

    await env.DB.prepare(`
      UPDATE temples
      SET status = ?,
          admin_label = ?,
          approved_at = CASE WHEN ? = 'verified' THEN CURRENT_TIMESTAMP ELSE approved_at END,
          approved_by = CASE WHEN ? = 'verified' THEN ? ELSE approved_by END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, adminLabel, status, status, decidedBy, id).run();

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
    `).bind(id).first();

    return jsonResponse({ ok: true, temple: row ? rowToTemple(row) : null });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Failed to update temple.' }, 500);
  }
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

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function cleanState(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function cleanText(value) {
  return String(value || '').trim();
}

function parseInteger(value) {
  const text = cleanText(value);
  if (!text) return null;
  const number = Number.parseInt(text, 10);
  return Number.isInteger(number) ? number : null;
}

function requireAdmin(request, env) {
  if (!env.ADMIN_API_TOKEN) return null;
  const token = request.headers.get('x-admin-token') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token === env.ADMIN_API_TOKEN) return null;
  return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-token, Authorization',
      'Cache-Control': 'no-store',
    },
  });
}
