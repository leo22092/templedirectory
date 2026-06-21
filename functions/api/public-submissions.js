import {
  cleanState,
  cleanText,
  isTruthy,
  jsonResponse,
  parseCoordinate,
  parseJson,
  parseTags,
} from '../_shared/api.js';

const PUBLIC_LIMIT = 50;

export async function onRequestOptions() {
  return jsonResponse({ ok: true }, 200, {
    methods: 'GET, OPTIONS',
    headers: 'Content-Type',
  });
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      return jsonResponse({ ok: true, source: 'd1', count: 0, submissions: [] });
    }

    const url = new URL(request.url);
    const state = cleanState(url.searchParams.get('state') || 'kerala');
    const limit = Math.min(
      Math.max(Number.parseInt(url.searchParams.get('limit') || String(PUBLIC_LIMIT), 10), 1),
      PUBLIC_LIMIT
    );

    const result = await env.DB.prepare(`
      SELECT
        id,
        state,
        admin_label,
        submitted_by,
        payload_json,
        created_at,
        updated_at
      FROM temple_requests
      WHERE request_type = 'submission'
        AND status = 'pending'
        AND state = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(state, limit).all();

    const submissions = (result.results || [])
      .map(rowToPublicSubmission)
      .filter(Boolean);

    return jsonResponse({
      ok: true,
      source: 'd1',
      state,
      count: submissions.length,
      submissions,
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err.message || 'Failed to load public submissions.',
    }, 500);
  }
}

function rowToPublicSubmission(row) {
  const payload = parseJson(row.payload_json, {});
  const name = cleanText(payload.Temple || payload.temple || payload.name);
  if (!name) return null;

  return {
    id: `pending-${row.id}`,
    requestId: row.id,
    state: cleanState(row.state || payload.State || payload.state),
    name,
    deity: cleanText(payload.Deity || payload.deity),
    district: cleanText(payload.District || payload.district),
    location: cleanText(payload.Location || payload.location),
    lat: parseCoordinate(payload.Latitude || payload.lat),
    lng: parseCoordinate(payload.Longitude || payload.lng),
    timing: cleanText(payload.Timing || payload.timing),
    phone: cleanText(payload.Phone || payload.phone),
    description: cleanText(payload.Description || payload.description || payload.Message || payload.message),
    famous: isTruthy(payload.Famous || payload.famous),
    tags: parseTags(payload.Tags || payload.tags),
    dressCode: cleanText(payload['Dress Code'] || payload.dressCode),
    photography: cleanText(payload.Photography || payload.photography),
    nearestBus: cleanText(payload['Nearest Bus'] || payload.nearestBus),
    nearestRail: cleanText(payload['Nearest Rail'] || payload.nearestRail),
    status: 'unverified',
    adminLabel: cleanText(row.admin_label) || 'Community submitted',
    submittedBy: cleanText(row.submitted_by || payload['Submitted By'] || payload.name),
    submittedAt: cleanText(payload.receivedAt || row.created_at || row.updated_at),
    isPendingSubmission: true,
  };
}
