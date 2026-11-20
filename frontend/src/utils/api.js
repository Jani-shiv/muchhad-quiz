const API_BASE = import.meta.env.VITE_API_URL || '';

export function getHostToken() {
  return localStorage.getItem('qb_host_token') || '';
}

export function setHostToken(token) {
  if (token) localStorage.setItem('qb_host_token', token);
  else localStorage.removeItem('qb_host_token');
}

export async function apiFetch(path, options = {}) {
  const token = getHostToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
