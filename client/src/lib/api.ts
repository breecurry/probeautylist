import type { ApiError } from '@shared/types';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(path, {
    ...options,
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
