const BASE_URL = process.env.PBL_BASE_URL || 'http://127.0.0.1:3000';
const FRONTEND_URL = process.env.PBL_FRONTEND_URL || BASE_URL;
const AUTH_TOKEN = process.env.PBL_E2E_BEARER_TOKEN || '';
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS || '8000', 10);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 8000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readPayload(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(method, path, { body, token = AUTH_TOKEN, expected = [200] } = {}) {
  if (!Array.isArray(expected)) expected = [expected];

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchWithTimeout(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
  const payload = await readPayload(response);

  if (!expected.includes(response.status)) {
    const rendered = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(`${method} ${path} returned ${response.status}, expected ${expected.join('/')} :: ${(rendered || '').slice(0, 500)}`);
  }

  return { response, payload };
}

async function assertHtml(path) {
  const response = await fetchWithTimeout(`${FRONTEND_URL}${path}`, { redirect: 'manual' });
  const text = await response.text();
  assert(response.status === 200, `Static route ${path} returned ${response.status}`);
  assert(text.includes('<div id="root"></div>') || text.includes('/assets/'), `Static route ${path} did not look like the React app shell`);
}

async function assertArrayEndpoint(path) {
  const { payload } = await request('GET', path);
  assert(Array.isArray(payload), `${path} did not return an array`);
}

async function main() {
  const health = await request('GET', '/api/health');
  assert(health.payload?.ok === true, 'Health endpoint did not return ok=true');

  const ready = await request('GET', '/api/ready');
  assert(ready.payload?.ok === true, 'Ready endpoint did not return ok=true');

  await Promise.all([
    assertHtml('/'),
    assertHtml('/search'),
    assertHtml('/auth/login'),
    assertHtml('/auth/register'),
    assertHtml('/client'),
    assertHtml('/professional/onboarding'),
    assertHtml('/admin'),
    assertHtml('/account'),
  ]);

  await Promise.all([
    assertArrayEndpoint('/api/professionals'),
    assertArrayEndpoint('/api/professionals?sort=recommended'),
    assertArrayEndpoint('/api/professionals?category=Hair%20Stylist'),
  ]);

  await request('GET', '/api/auth/me', { token: '', expected: [401] });
  await request('GET', '/api/favorites', { token: '', expected: [401, 409] });
  await request('GET', '/api/notifications/unread-count', { token: '', expected: [401, 409] });

  if (AUTH_TOKEN) {
    const me = await request('GET', '/api/auth/me', { expected: [200, 409] });
    assert(me.payload, 'Authenticated auth/me response was empty');
    await request('GET', '/api/notifications/unread-count', { expected: [200, 409] });
    await request('GET', '/api/favorites', { expected: [200, 409] });
    console.log('Authenticated Clerk-backed smoke checks completed.');
  } else {
    console.log('Skipped authenticated smoke checks because PBL_E2E_BEARER_TOKEN is not set.');
  }

  console.log(`E2E smoke checks passed against ${BASE_URL}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown E2E failure';
  console.error(`E2E smoke checks failed: ${message}`);
  process.exitCode = 1;
});
