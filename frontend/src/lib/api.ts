export const apiBase =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3000';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('refreshToken');
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export type JwtPayload = { sub: string; email: string; role: string };

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) {
      return null;
    }
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) {
    return false;
  }
  const res = await fetch(`${apiBase}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    return false;
  }
  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retryOn401 = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${apiBase}${path}`, { ...options, headers });
  if (res.status === 401 && retryOn401 && getRefreshToken()) {
    const ok = await refreshAccessToken();
    if (ok) {
      return apiFetch<T>(path, options, false);
    }
  }
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      const j = JSON.parse(text) as { message?: string | string[] };
      if (j.message) {
        message = Array.isArray(j.message) ? j.message.join(', ') : j.message;
      }
    } catch {
      /* raw text */
    }
    throw new Error(message || `HTTP ${res.status}`);
  }
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
