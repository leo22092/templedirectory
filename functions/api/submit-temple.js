import {
  cleanState,
  cleanText,
  isTruthy,
  jsonResponse as sharedJsonResponse,
  parseCoordinate,
  parseInteger,
  parseJson,
  parseTags,
} from '../_shared/api.js';

const DEFAULT_TO_EMAIL = 'mymail2837@gmail.com';
const FROM_EMAIL = 'TempleDiary <submissions@templediary.in>';
const FORM_SUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/';
const REQUEST_TYPES = {
  'temple-submission': 'submission',
  'temple-correction': 'correction',
  'temple-deletion': 'deletion',
};
const DEFAULT_REQUEST_LABELS = {
  submission: 'COMMUNITY SUBMITTED',
  correction: 'COMMUNITY CORRECTED',
  deletion: 'DELETION REQUEST',
};

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ env }) {
  return jsonResponse({
    ok: true,
    route: '/api/submit-temple',
    d1Binding: env.DB ? 'DB' : null,
    kvBinding: env.TEMPLE_SUBMISSIONS ? 'TEMPLE_SUBMISSIONS' : (env.KV ? 'KV' : null),
    canStore: Boolean(env.DB || env.TEMPLE_SUBMISSIONS || env.KV),
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const payload = await readPayload(request);
    const validationError = validatePayload(payload);

    if (validationError) {
      return jsonResponse({ ok: false, error: validationError }, 400);
    }

    const savedSubmission = await saveSubmission(payload, request, env);

    if (env.RESEND_API_KEY) {
      await sendWithResend(payload, env);
      return jsonResponse({ ok: true, id: savedSubmission.id, stored: savedSubmission.stored, storage: savedSubmission.provider, provider: 'resend' });
    }

    if (env.FORM_SUBMIT_EMAIL) {
      await sendWithFormSubmit(payload, env.FORM_SUBMIT_EMAIL);
      return jsonResponse({ ok: true, id: savedSubmission.id, stored: savedSubmission.stored, storage: savedSubmission.provider, provider: 'formsubmit-worker' });
    }

    return jsonResponse({ ok: true, id: savedSubmission.id, stored: savedSubmission.stored, provider: savedSubmission.provider });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || 'Submission failed.' }, 500);
  }
}

async function readPayload(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  const formData = await request.formData();
  const payload = {};
  formData.forEach((value, key) => {
    if (!key.startsWith('_')) payload[key] = String(value || '');
  });
  return payload;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') return 'Invalid submission.';

  const kind = String(payload.kind || '');
  const temple = String(payload.Temple || payload.temple || '').trim();
  const submittedBy = String(payload['Submitted By'] || payload.name || '').trim();
  const message = String(payload.Message || payload.message || '').trim();
  const requestType = REQUEST_TYPES[kind];

  if (requestType && !temple && !message) return 'Temple name or message is required.';
  if (!submittedBy) return 'Submitter name is required.';
  if (!requestType && !message) return 'Message is required.';

  return '';
}

async function saveSubmission(payload, request, env) {
  if (env.DB && isTempleRequest(payload)) {
    return saveTempleRequestToD1(payload, request, env);
  }

  const submissionsStore = env.TEMPLE_SUBMISSIONS || env.KV;

  if (!submissionsStore) {
    return { id: crypto.randomUUID(), stored: false, provider: 'none' };
  }

  const now = new Date();
  const id = crypto.randomUUID();
  const kind = String(payload.kind || 'submission').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const key = `${kind}/${now.toISOString().slice(0, 10)}/${now.getTime()}-${id}`;
  const record = {
    id,
    receivedAt: now.toISOString(),
    source: payload.source || 'website',
    userAgent: request.headers.get('user-agent') || '',
    payload,
  };

  await submissionsStore.put(key, JSON.stringify(record), {
    metadata: {
      id,
      kind,
      receivedAt: record.receivedAt,
      source: record.source,
    },
  });

  return { id, key, stored: true, provider: 'kv' };
}

function isTempleRequest(payload) {
  const kind = String(payload.kind || '').trim();
  const temple = String(payload.Temple || payload.temple || '').trim();
  return Boolean(REQUEST_TYPES[kind] && temple);
}

async function saveTempleRequestToD1(payload, request, env) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const requestType = REQUEST_TYPES[String(payload.kind || '').trim()] || 'submission';
  const state = cleanState(payload.State || payload.state || 'unknown');
  const templeId = parseInteger(payload.templeId || payload.temple_id || payload['D1 Temple ID']);
  const sourceJsonId = parseInteger(payload.sourceJsonId || payload.source_json_id || payload['Source JSON ID']);
  const currentDb = await findCurrentTemple(env, state, templeId, sourceJsonId, payload.Temple || payload.temple);
  const recordPayload = {
    ...payload,
    userAgent: request.headers.get('user-agent') || '',
    receivedAt: now,
  };

  await env.DB.prepare(`
    INSERT INTO temple_requests (
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
      created_at,
      updated_at
    )
    VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    requestType,
    state,
    templeId,
    sourceJsonId,
    cleanText(payload['Admin Label'] || payload.adminLabel || DEFAULT_REQUEST_LABELS[requestType]),
    cleanText(payload['Submitted By'] || payload.name),
    cleanText(payload['Submitter Email'] || payload.email),
    JSON.stringify(recordPayload),
    currentDb ? JSON.stringify(currentDb) : null,
    cleanText(payload.currentPublicJson || payload['Current Public JSON']) || null,
    now,
    now
  ).run();

  return {
    id,
    stored: true,
    provider: 'd1-request',
    requestType,
  };
}

async function findCurrentTemple(env, state, templeId, sourceJsonId, templeName) {
  let query = '';
  let bindValues = [];

  if (templeId !== null) {
    query = 'SELECT * FROM temples WHERE id = ? LIMIT 1';
    bindValues = [templeId];
  } else if (sourceJsonId !== null) {
    query = 'SELECT * FROM temples WHERE state = ? AND source_json_id = ? LIMIT 1';
    bindValues = [state, sourceJsonId];
  } else {
    const name = cleanText(templeName);
    if (!name) return null;
    query = 'SELECT * FROM temples WHERE state = ? AND name = ? COLLATE NOCASE LIMIT 1';
    bindValues = [state, name];
  }

  const row = await env.DB.prepare(query).bind(...bindValues).first();
  return row ? rowToTempleSnapshot(row) : null;
}

function rowToTempleSnapshot(row) {
  return {
    id: row.id,
    sourceJsonId: row.source_json_id,
    state: row.state,
    name: row.name || '',
    deity: row.deity || '',
    district: row.district || '',
    location: row.location || '',
    lat: row.lat,
    lng: row.lng,
    timing: row.timing || '',
    phone: row.phone || '',
    description: row.description || '',
    famous: Boolean(row.famous),
    tags: parseJson(row.tags, []),
    adminLabel: row.admin_label || '',
    status: row.status || '',
    submittedBy: row.submitted_by || '',
    submittedAt: row.submitted_at || '',
    approvedAt: row.approved_at || '',
    approvedBy: row.approved_by || '',
    sourceUrl: row.source_url || '',
  };
}

async function saveTempleToD1(payload, request, env) {
  const now = new Date().toISOString();
  const state = cleanText(payload.State || payload.state || 'unknown').toLowerCase() || 'unknown';
  const name = cleanText(payload.Temple || payload.temple);
  const tags = parseTags(payload.Tags || payload.tags);

  const result = await env.DB.prepare(`
    INSERT INTO temples (
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
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unverified', ?, ?, ?)
  `).bind(
    state,
    name,
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
    cleanText(payload['Admin Label'] || payload.adminLabel || DEFAULT_REQUEST_LABELS.submission),
    cleanText(payload['Submitted By'] || payload.name),
    now,
    JSON.stringify({
      ...payload,
      userAgent: request.headers.get('user-agent') || '',
      receivedAt: now,
    })
  ).run();

  return {
    id: result.meta?.last_row_id || result.meta?.lastRowId || null,
    stored: true,
    provider: 'd1',
  };
}

async function sendWithResend(payload, env) {
  const to = env.SUBMISSION_TO_EMAIL || env.FORM_SUBMIT_EMAIL || DEFAULT_TO_EMAIL;
  const subject = makeSubject(payload);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'TempleDiary/1.0',
    },
    body: JSON.stringify({
      from: env.SUBMISSION_FROM_EMAIL || FROM_EMAIL,
      to: [to],
      subject,
      text: makeEmailText(payload),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend returned HTTP ${response.status}`);
  }
}

async function sendWithFormSubmit(payload, toEmail) {
  const formData = new FormData();
  formData.append('_subject', makeSubject(payload));
  formData.append('_captcha', 'false');
  formData.append('_template', 'table');

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'kind' || key === 'source') return;
    formData.append(key, String(value || ''));
  });

  const response = await fetch(FORM_SUBMIT_ENDPOINT + encodeURIComponent(toEmail), {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`FormSubmit returned HTTP ${response.status}`);
  }
}

function makeSubject(payload) {
  const temple = String(payload.Temple || payload.temple || '').trim();
  const subject = String(payload.Subject || payload.subject || '').trim();

  if (temple) return `New Temple Submission: ${temple}`;
  if (subject) return `[TempleDiary] ${subject}`;
  return '[TempleDiary] Website submission';
}

function makeEmailText(payload) {
  return Object.entries(payload)
    .filter(([key, value]) => value && key !== 'kind' && key !== 'source')
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

function jsonResponse(body, status = 200) {
  return sharedJsonResponse(body, status, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type',
    noStore: false,
  });
}
