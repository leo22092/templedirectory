const REQUEST_TYPES = new Set(['submission', 'correction', 'deletion']);
const REQUEST_STATUSES = new Set(['pending', 'approved', 'rejected', 'needs_review']);

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      return jsonResponse({ ok: false, error: 'D1 binding DB is not configured.' }, 500);
    }

    const authError = requireAdmin(request, env);
    if (authError) return authError;

    const url = new URL(request.url);
    const type = cleanEnum(url.searchParams.get('type'), REQUEST_TYPES);
    const status = cleanEnum(url.searchParams.get('status') || 'pending', REQUEST_STATUSES);
    const state = cleanState(url.searchParams.get('state'));
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') || '100', 10), 1), 200);
    const params = [];
    const where = [];

    if (type) {
      where.push('request_type = ?');
      params.push(type);
    }

    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    if (state) {
      where.push('state = ?');
      params.push(state);
    }

    const query = `
      SELECT
        id,
        request_type,
        status,
        state,
        temple_id,
        source_json_id,
        admin_label,
        submitted_by,
        submitter_email,
        payload_json,
        current_db_json,
        current_public_json,
        decided_by,
        decided_at,
        archived_at,
        created_at,
        updated_at
      FROM temple_requests
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const result = await env.DB.prepare(query).bind(...params, limit).all();
    const requests = (result.results || []).map(rowToRequest);

    return jsonResponse({
      ok: true,
      source: 'd1',
      count: requests.length,
      requests,
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Failed to load temple requests.' }, 500);
  }
}

function rowToRequest(row) {
  return {
    id: row.id,
    requestType: row.request_type,
    status: row.status,
    state: row.state || '',
    templeId: row.temple_id,
    sourceJsonId: row.source_json_id,
    adminLabel: row.admin_label || '',
    submittedBy: row.submitted_by || '',
    submitterEmail: row.submitter_email || '',
    payload: parseJson(row.payload_json, {}),
    currentDb: parseJson(row.current_db_json, null),
    currentPublic: parseJson(row.current_public_json, null),
    decidedBy: row.decided_by || '',
    decidedAt: row.decided_at || '',
    archivedAt: row.archived_at || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
}

function requireAdmin(request, env) {
  if (!env.ADMIN_API_TOKEN) return null;

  const url = new URL(request.url);
  const token = request.headers.get('x-admin-token') || url.searchParams.get('token') || '';

  if (token === env.ADMIN_API_TOKEN) return null;

  return jsonResponse({ ok: false, error: 'Admin token required.' }, 401);
}

function cleanEnum(value, allowed) {
  const text = String(value || '').trim().toLowerCase();
  return allowed.has(text) ? text : '';
}

function cleanState(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
      'Cache-Control': 'no-store',
    },
  });
}
