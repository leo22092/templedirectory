const PUBLIC_STATUSES = new Set(['verified']);

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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  });
}
