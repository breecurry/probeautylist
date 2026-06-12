type ApiError = { message: string };

type AuthTokenProvider = () => Promise<string | null>;

let authTokenProvider: AuthTokenProvider | null = null;

export function setApiAuthTokenProvider(provider: AuthTokenProvider | null) {
  authTokenProvider = provider;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const token = await authTokenProvider?.();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

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
