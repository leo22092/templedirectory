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

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return jsonResponse({ ok: false, error: 'D1 binding DB is not configured.' }, 500);
    }

    const authError = requireAdmin(request, env);
    if (authError) return authError;

    const payload = await request.json();
    const id = cleanText(payload.id);
    const action = cleanText(payload.action).toLowerCase();
    const decidedBy = cleanText(payload.decidedBy || 'admin');
    const adminLabel = cleanText(payload.adminLabel);

    if (!id) return jsonResponse({ ok: false, error: 'Request id is required.' }, 400);
    if (!['approve', 'reject', 'needs_review'].includes(action)) {
      return jsonResponse({ ok: false, error: 'Unsupported action.' }, 400);
    }

    const requestRow = await env.DB.prepare('SELECT * FROM temple_requests WHERE id = ? LIMIT 1').bind(id).first();
    if (!requestRow) return jsonResponse({ ok: false, error: 'Request not found.' }, 404);

    if (action === 'reject') {
      await archiveRequest(env, id, 'rejected', decidedBy, adminLabel || requestRow.admin_label);
      return jsonResponse({ ok: true, id, status: 'rejected' });
    }

    if (action === 'needs_review') {
      await env.DB.prepare(`
        UPDATE temple_requests
        SET status = 'needs_review',
            admin_label = COALESCE(NULLIF(?, ''), admin_label),
            decided_by = ?,
            decided_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(adminLabel, decidedBy, id).run();
      return jsonResponse({ ok: true, id, status: 'needs_review' });
    }

    const requestData = rowToRequest(requestRow);
    const label = adminLabel || requestData.adminLabel || defaultApprovedLabel(requestData.requestType);

    if (requestData.requestType === 'submission') {
      await approveSubmission(env, requestData, label, decidedBy);
    } else if (requestData.requestType === 'correction') {
      await approveCorrection(env, requestData, label, decidedBy);
    } else if (requestData.requestType === 'deletion') {
      await approveDeletion(env, requestData, label, decidedBy);
    } else {
      return jsonResponse({ ok: false, error: 'Unknown request type.' }, 400);
    }

    await archiveRequest(env, id, 'approved', decidedBy, label);
    return jsonResponse({ ok: true, id, status: 'approved' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Failed to update request.' }, 500);
  }
}

async function approveSubmission(env, requestData, label, decidedBy) {
  const payload = requestData.payload || {};
  const tags = parseTags(payload.Tags || payload.tags);

  await env.DB.prepare(`
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unverified', ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    requestData.state || cleanState(payload.State),
    requestData.sourceJsonId,
    cleanText(payload.Temple || payload.temple),
    cleanText(payload.Deity || payload.deity),
    cleanText(payload.District || payload.district),
    cleanText(payload.Location || payload.location),
    parseCoordinate(payload.Latitude || payload.lat),
    parseCoordinate(payload.Longitude || payload.lng),
    cleanText(payload.Timing || payload.timing),
    cleanText(payload.Phone || payload.phone),
    cleanText(payload.Description || payload.description || payload.Message || payload.message),
    isTruthy(payload.Famous || payload.famous) ? 1 : 0,
    JSON.stringify(tags),
    label,
    requestData.submittedBy || cleanText(payload['Submitted By'] || payload.name),
    payload.receivedAt || requestData.createdAt || new Date().toISOString(),
    decidedBy,
    cleanText(payload.SourceUrl || payload.sourceUrl || payload['Source URL']),
    JSON.stringify(payload)
  ).run();
}

async function approveCorrection(env, requestData, label, decidedBy) {
  const payload = requestData.payload || {};
  const target = await findTargetTemple(env, requestData, payload);
  if (!target) throw new Error('No matching D1 temple found for this correction.');

  const updates = {};
  copyText(updates, 'name', payload.Temple || payload.temple);
  copyText(updates, 'deity', payload.Deity || payload.deity);
  copyText(updates, 'district', payload.District || payload.district);
  copyText(updates, 'location', payload.Location || payload.location);
  copyNumber(updates, 'lat', payload.Latitude || payload.lat);
  copyNumber(updates, 'lng', payload.Longitude || payload.lng);
  copyText(updates, 'timing', payload.Timing || payload.timing);
  copyText(updates, 'phone', payload.Phone || payload.phone);
  copyText(updates, 'description', payload.Description || payload.description);
  copyText(updates, 'source_url', payload.SourceUrl || payload.sourceUrl || payload['Source URL']);

  if (payload.Famous !== undefined || payload.famous !== undefined) {
    updates.famous = isTruthy(payload.Famous || payload.famous) ? 1 : 0;
  }

  if (payload.Tags || payload.tags) {
    updates.tags = JSON.stringify(parseTags(payload.Tags || payload.tags));
  }

  const raw = parseJson(target.raw_json, {});
  mergeRawCorrection(raw, payload);
  updates.admin_label = label;
  updates.approved_at = new Date().toISOString();
  updates.approved_by = decidedBy;
  updates.raw_json = JSON.stringify(raw);
  updates.updated_at = new Date().toISOString();

  const entries = Object.entries(updates);
  if (!entries.length) throw new Error('Correction has no mergeable fields.');

  const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
  await env.DB.prepare(`UPDATE temples SET ${setClause} WHERE id = ?`)
    .bind(...entries.map(([, value]) => value), target.id)
    .run();
}

async function approveDeletion(env, requestData, label, decidedBy) {
  const target = await findTargetTemple(env, requestData, requestData.payload || {});
  if (!target) throw new Error('No matching D1 temple found for this deletion request.');

  await env.DB.prepare(`
    UPDATE temples
    SET status = 'removed',
        admin_label = ?,
        approved_at = CURRENT_TIMESTAMP,
        approved_by = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(label, decidedBy, target.id).run();
}

async function findTargetTemple(env, requestData, payload) {
  if (requestData.templeId) {
    return env.DB.prepare('SELECT * FROM temples WHERE id = ? LIMIT 1').bind(requestData.templeId).first();
  }

  if (requestData.sourceJsonId) {
    return env.DB.prepare('SELECT * FROM temples WHERE state = ? AND source_json_id = ? LIMIT 1')
      .bind(requestData.state, requestData.sourceJsonId)
      .first();
  }

  const name = cleanText(payload.Temple || payload.temple);
  if (!name) return null;

  return env.DB.prepare('SELECT * FROM temples WHERE state = ? AND name = ? COLLATE NOCASE LIMIT 1')
    .bind(requestData.state || cleanState(payload.State), name)
    .first();
}

async function archiveRequest(env, id, status, decidedBy, adminLabel) {
  await env.DB.prepare(`
    UPDATE temple_requests
    SET status = ?,
        admin_label = COALESCE(NULLIF(?, ''), admin_label),
        decided_by = ?,
        decided_at = CURRENT_TIMESTAMP,
        archived_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(status, adminLabel || '', decidedBy, id).run();
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

function defaultApprovedLabel(type) {
  if (type === 'submission') return 'COMMUNITY SUBMITTED';
  if (type === 'correction') return 'COMMUNITY CORRECTED';
  if (type === 'deletion') return 'REMOVED';
  return 'ADMIN REVIEWED';
}

function cleanText(value) {
  return String(value || '').trim();
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

function parseCoordinate(value) {
  const text = cleanText(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function parseTags(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  return cleanText(value)
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean);
}

function isTruthy(value) {
  const text = cleanText(value).toLowerCase();
  return ['1', 'true', 'yes', 'y', 'on'].includes(text);
}

function copyText(target, key, value) {
  const text = cleanText(value);
  if (text) target[key] = text;
}

function copyNumber(target, key, value) {
  const number = parseCoordinate(value);
  if (number !== null) target[key] = number;
}

function mergeRawCorrection(raw, payload) {
  const mappings = [
    ['Temple', 'name'],
    ['Deity', 'deity'],
    ['District', 'district'],
    ['Location', 'location'],
    ['Latitude', 'lat'],
    ['Longitude', 'lng'],
    ['Timing', 'timing'],
    ['Phone', 'phone'],
    ['Description', 'description'],
    ['Dress Code', 'dressCode'],
    ['Photography', 'photography'],
    ['Nearest Bus', 'nearestBus'],
    ['Nearest Rail', 'nearestRail'],
    ['Source URL', 'sourceUrl'],
  ];

  mappings.forEach(([payloadKey, rawKey]) => {
    const value = payload[payloadKey];
    if (value === undefined || value === null || value === '') return;
    if (rawKey === 'lat' || rawKey === 'lng') {
      const number = parseCoordinate(value);
      if (number !== null) raw[rawKey] = number;
      return;
    }
    raw[rawKey] = cleanText(value);
  });

  if (payload.Tags || payload.tags) raw.tags = parseTags(payload.Tags || payload.tags);
  if (payload['Google Maps Link']) raw.googleMapsCorrection = cleanText(payload['Google Maps Link']);
  if (payload.Message || payload.message) raw.lastCorrectionNote = cleanText(payload.Message || payload.message);
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
