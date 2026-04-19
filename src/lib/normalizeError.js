const NETWORK_PATTERNS = [
  /load failed/i,
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /fetch failed/i
];

export const normalizeUiError = (errorLike, fallback = 'Er ging iets mis. Probeer het opnieuw.') => {
  const raw = String(errorLike?.message || errorLike || '').trim();
  if (!raw) return fallback;

  if (NETWORK_PATTERNS.some((pattern) => pattern.test(raw))) {
    return 'Verbinding met de server lukt nu niet. Controleer je internet en probeer opnieuw.';
  }

  return raw;
};

