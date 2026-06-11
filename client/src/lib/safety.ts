import type { CSSProperties } from 'react';

export function safeInternalPath(value: string | null | undefined, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    return fallback;
  }
}

export function safeImageUrl(value: string | null | undefined) {
  if (!value) return undefined;

  try {
    if (value.startsWith('/')) return value.startsWith('//') ? undefined : value;
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function safeBackgroundImageStyle(value: string | null | undefined): CSSProperties | undefined {
  const imageUrl = safeImageUrl(value);
  if (!imageUrl) return undefined;

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  };
}
