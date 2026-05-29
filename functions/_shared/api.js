export function jsonResponse(body, status = 200, options = {}) {
  const methods = options.methods || 'GET, POST, OPTIONS';
  const headers = options.headers || 'Content-Type, x-admin-token, Authorization';

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': headers,
      ...(options.noStore === false ? {} : { 'Cache-Control': 'no-store' }),
    },
  });
}

export function requireAdmin(request, env, options = {}) {
  if (!env.ADMIN_API_TOKEN) {
    return jsonResponse(
      { ok: false, error: options.missingTokenMessage || 'Admin API token is not configured.' },
      503,
      options.responseOptions
    );
  }

  const tokens = [];
  if (options.header !== false) tokens.push(request.headers.get('x-admin-token'));
  if (options.bearer) tokens.push(request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''));
  if (options.queryToken) {
    const url = new URL(request.url);
    tokens.push(url.searchParams.get('token'));
  }

  if (tokens.some(token => token === env.ADMIN_API_TOKEN)) return null;
  return jsonResponse({ ok: false, error: options.message || 'Unauthorized.' }, 401, options.responseOptions);
}

export function cleanText(value) {
  return String(value || '').trim();
}

export function cleanEnum(value, allowed) {
  const text = cleanText(value).toLowerCase();
  return allowed.has(text) ? text : '';
}

export function cleanState(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

export function readFirst(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '') ?? '';
}

export function parseInteger(value) {
  const text = cleanText(value);
  if (!text) return null;
  const number = Number.parseInt(text, 10);
  return Number.isInteger(number) ? number : null;
}

export function parseCoordinate(value) {
  const text = cleanText(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function parseTags(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  return cleanText(value)
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function isTruthy(value) {
  return ['1', 'true', 'yes', 'y', 'on'].includes(cleanText(value).toLowerCase()) || value === true;
}
