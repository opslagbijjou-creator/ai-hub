const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();

const isLocalhost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE = rawApiBase || (isLocalhost ? 'http://localhost:3001' : '');

export const apiUrl = (path) => {
  if (!path) return API_BASE;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};
