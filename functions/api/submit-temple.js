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
    kvBinding: env.TEMPLE_SUBMISSIONS ? 'TEMPLE_SUBMISSIONS' : (env.KV ? 'KV' : null),
    canStore: Boolean(env.TEMPLE_SUBMISSIONS || env.KV),
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
      return jsonResponse({ ok: true, id: savedSubmission.id, stored: true, provider: 'resend' });
    }

    if (env.FORM_SUBMIT_EMAIL) {
      await sendWithFormSubmit(payload, env.FORM_SUBMIT_EMAIL);
      return jsonResponse({ ok: true, id: savedSubmission.id, stored: true, provider: 'formsubmit-worker' });
    }

    return jsonResponse({ ok: true, id: savedSubmission.id, stored: true, provider: 'kv' });
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
  const submissionsStore = env.TEMPLE_SUBMISSIONS || env.KV;

  if (!submissionsStore) {
    throw new Error('KV binding is not configured. Add TEMPLE_SUBMISSIONS or KV.');
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

  return { id, key };
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
