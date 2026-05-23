const DEFAULT_TO_EMAIL = 'mymail2837@gmail.com';
const FROM_EMAIL = 'TempleDiary <submissions@templediary.in>';
const FORM_SUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/';

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

  if (kind === 'temple-submission' && !temple && !message) return 'Temple name or message is required.';
  if (!submittedBy) return 'Submitter name is required.';
  if (kind !== 'temple-submission' && !message) return 'Message is required.';

  return '';
}

async function saveSubmission(payload, request, env) {
  if (env.DB && isTempleSubmission(payload)) {
    return saveTempleToD1(payload, request, env);
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

function isTempleSubmission(payload) {
  const kind = String(payload.kind || '').trim();
  const temple = String(payload.Temple || payload.temple || '').trim();
  return kind === 'temple-submission' && Boolean(temple);
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
      status,
      verification_count,
      submitted_by,
      submitted_at,
      raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unverified', 0, ?, ?, ?)
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

function cleanText(value) {
  return String(value || '').trim();
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
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
