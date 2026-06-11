type ApiError = { message: string };

let csrfToken: string | null = null;
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!response.ok) throw new Error('Could not start a secure session. Please refresh and try again.');
  const payload = await response.json() as { csrfToken: string };
  csrfToken = payload.csrfToken;
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (MUTATING_METHODS.has(method)) headers.set('X-CSRF-Token', await getCsrfToken());

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let error: ApiError = { message: 'Request failed' };
    try {
      error = await response.json();
    } catch {
      error = { message: response.statusText || 'Request failed' };
    }
    if (response.status === 403 && error.message.toLowerCase().includes('security token')) clearCsrfToken();
    throw new Error(error.message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
