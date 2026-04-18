const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

const isLocalhost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE = rawApiBase || (isLocalhost ? 'http://localhost:3001' : '');
export const hasApiBaseConfig = Boolean(API_BASE);
export const apiConfigMessage =
  'Backend API configuratie ontbreekt. Zet VITE_API_BASE_URL naar je backend URL (bijv. Render).';

if (!hasApiBaseConfig && typeof window !== 'undefined') {
  console.error(apiConfigMessage);
}

export const apiUrl = (path) => {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};
