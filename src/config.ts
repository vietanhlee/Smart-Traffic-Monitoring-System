// Centralized API base URLs. Override via Vite env variables in .env files.
// Vite env examples:
// VITE_API_HTTP_BASE=http://localhost:8000
// VITE_API_WS_BASE=ws://localhost:8000

const trimTrailingSlash = (url: string) => url.replace(/\/$/, "");

export const API_HTTP_BASE: string = trimTrailingSlash(
  (import.meta as any).env?.VITE_API_HTTP_BASE ?? (
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`.replace(/^ws(s)?:/, 'http$1:')
      : "http://localhost:8000"
  )
);

// Prefer explicit env; otherwise derive from current origin with proper ws/wss
const derivedWsBase = (() => {
  if (typeof window === 'undefined') return "ws://localhost:8000";
  const isSecure = window.location.protocol === 'https:';
  const wsProtocol = isSecure ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}`;
})();

export const API_WS_BASE: string = trimTrailingSlash(
  (import.meta as any).env?.VITE_API_WS_BASE ?? derivedWsBase
);

export const endpoints = {
  roadNames: `${API_HTTP_BASE}/road_name`,
  framesWs: (roadName: string) => `${API_WS_BASE}/ws/frames/${encodeURIComponent(roadName)}`,
  infoWs: (roadName: string) => `${API_WS_BASE}/ws/info/${encodeURIComponent(roadName)}`,
};


