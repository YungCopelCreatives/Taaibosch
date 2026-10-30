/** Small fetch wrapper for the dashboard API. */

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}) {
    super(message);
  }
}

type Listener = (status: number) => void;
const listeners = new Set<Listener>();
/** AdminApp listens for 401 (signed out) and 428 (profile not set up). */
export const onAuthProblem = (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); };

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; raw?: Blob | File; query?: Record<string, string | number | undefined> } = {}): Promise<T> {
  const qs = opts.query
    ? '?' + Object.entries(opts.query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all').map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
    : '';
  const res = await fetch(`/api/admin/${path}${qs === '?' ? '' : qs}`, {
    method: opts.method ?? (opts.body !== undefined || opts.raw ? 'POST' : 'GET'),
    credentials: 'same-origin',
    headers: {
      'x-requested-with': 'taaibosch-admin',
      ...(opts.raw ? { 'Content-Type': opts.raw.type } : opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.raw ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if ((res.status === 401 && path !== 'login') || res.status === 428) listeners.forEach(l => l(res.status));
    throw new ApiError(res.status, data.error || 'Something went wrong.', data.fields);
  }
  return data as T;
}

export const rand = (n: number) =>
  `R${(Number(n) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const shortDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
