// Centralized API base URLs. Override via Vite env variables in .env files.
// Vite env examples:
// VITE_API_HTTP_BASE=http://160.19.205.198:8000
// VITE_API_WS_BASE=ws://localhost:8000

const trimTrailingSlash = (url: string) => url.replace(/\/$/, "");

export const API_HTTP_BASE: string = trimTrailingSlash(
  (import.meta as any).env?.VITE_API_HTTP_BASE ?? "http://localhost:8000/"
);

export const API_WS_BASE: string = trimTrailingSlash(
  (import.meta as any).env?.VITE_API_WS_BASE ?? "ws://localhost:8000/"
);

export const endpoints = {
  roadNames: `${API_HTTP_BASE}/roads_name`,
  framesWs: (roadName: string) =>
    `${API_WS_BASE}/ws/frames/${encodeURIComponent(roadName)}`,
  infoWs: (roadName: string) =>
    `${API_WS_BASE}/ws/info/${encodeURIComponent(roadName)}`,
  chatWs: `${API_WS_BASE}/ws/chat`,
};
