/**
 * Configuration file - tương tự backend/app/core/config.py
 * Tập trung tất cả các URL và cấu hình của Frontend
 */

// ============================================
// API Configuration
// ============================================
class ApiConfig {
  // Base URLs - có thể override qua environment variables
  BASE_URL_HTTP = import.meta.env.VITE_API_HTTP_BASE || "http://localhost:8000";
  BASE_URL_WS = import.meta.env.VITE_API_WS_BASE || "ws://localhost:8000";

  // API Prefixes
  API_V1_PREFIX = "/api/v1";
  API_V2_PREFIX = "/api/v2";

  // Full API URLs
  get API_HTTP_BASE() {
    return `${this.BASE_URL_HTTP}${this.API_V1_PREFIX}`;
  }

  get API_WS_BASE() {
    return `${this.BASE_URL_WS}${this.API_V1_PREFIX}`;
  }
}

// ============================================
// Auth Configuration
// ============================================
class AuthConfig {
  // LocalStorage keys
  TOKEN_KEY = "access_token";
  REFRESH_TOKEN_KEY = "refresh_token";
  USER_INFO_KEY = "user_info";

  // API Endpoints
  get LOGIN_URL() {
    return `${apiConfig.API_HTTP_BASE}/auth/login`;
  }

  get REGISTER_URL() {
    return `${apiConfig.API_HTTP_BASE}/auth/register`;
  }

  get ME_URL() {
    return `${apiConfig.API_HTTP_BASE}/auth/me`;
  }
}

// ============================================
// User Configuration
// ============================================
class UserConfig {
  get PROFILE_URL() {
    return `${apiConfig.API_HTTP_BASE}/user/profile`;
  }

  get PASSWORD_URL() {
    return `${apiConfig.API_HTTP_BASE}/user/password`;
  }
}

// ============================================
// WebSocket Configuration
// ============================================
class WebSocketConfig {
  // WebSocket Paths
  CHAT_PATH = "/chatbot/ws/chat";
  FRAMES_PATH = "/road/ws/frames";
  INFO_PATH = "/road/ws/info";
  CHART_PATH = "/road/ws/chart";
  ADMIN_RESOURCES_PATH = "/admin/ws/resources";
  WEBRTC_FRAMES_OFFER_PATH = "/road/webrtc/offer";

  // Full WebSocket URLs
  get CHAT_WS() {
    return `${apiConfig.API_WS_BASE}${this.CHAT_PATH}`;
  }

  framesWs(roadName: string) {
    return `${apiConfig.API_WS_BASE}${this.FRAMES_PATH}/${encodeURIComponent(
      roadName,
    )}`;
  }

  infoWs(roadName: string) {
    return `${apiConfig.API_WS_BASE}${this.INFO_PATH}/${encodeURIComponent(
      roadName,
    )}`;
  }

  chartWs(roadName: string) {
    return `${apiConfig.API_WS_BASE}${this.CHART_PATH}/${encodeURIComponent(
      roadName,
    )}`;
  }

  framesWebRtcOffer(roadName: string) {
    return `${apiConfig.API_HTTP_BASE}/road/webrtc/offer/${encodeURIComponent(
      roadName,
    )}`;
  }
}

// ============================================
// App Configuration
// ============================================
class AppConfig {
  APP_NAME = "Smart Transportation System";
  APP_VERSION = "1.0.0";
  DEFAULT_THEME = "light";
}

// ============================================
// Export instances (tương tự backend)
// ============================================
export const apiConfig = new ApiConfig();
export const authConfig = new AuthConfig();
export const userConfig = new UserConfig();
export const wsConfig = new WebSocketConfig();
export const appConfig = new AppConfig();

// ============================================
// Backward compatibility với code cũ
// ============================================
export const API_HTTP_BASE = apiConfig.API_HTTP_BASE;
export const API_WS_BASE = apiConfig.API_WS_BASE;

export const endpoints = {
  // Road Monitoring
  roadNames: `${apiConfig.API_HTTP_BASE}/road/roads_name`,
  roadHistory: (roadName: string, count = 60, startTime?: string) => {
    const params = new URLSearchParams({ count: String(count) });
    if (startTime) {
      params.set("start_time", startTime);
    }
    return `${apiConfig.API_HTTP_BASE}/road/history/${encodeURIComponent(roadName)}?${params.toString()}`;
  },
  framesWs: (roadName: string) => wsConfig.framesWs(roadName),
  framesWebRtcOffer: (roadName: string) => wsConfig.framesWebRtcOffer(roadName),
  infoWs: (roadName: string) => wsConfig.infoWs(roadName),
  chartWs: (roadName: string) => wsConfig.chartWs(roadName),
  adminResourcesWs: () =>
    `${apiConfig.API_WS_BASE}${wsConfig.ADMIN_RESOURCES_PATH}`,
  chatWs: wsConfig.CHAT_WS,
  getRoadInfo: (roadName: string) =>
    `${apiConfig.API_HTTP_BASE}/road/info/${encodeURIComponent(roadName)}`,
  getFrameNoAuth: (roadName: string) =>
    `${apiConfig.API_HTTP_BASE}/road/frames_no_auth/${encodeURIComponent(roadName)}`,

  // Chatbot
  chatbot: `${apiConfig.API_HTTP_BASE}/chatbot/chat`,
  chatbotNoAuth: `${apiConfig.API_HTTP_BASE}/chatbot/chat_no_auth`,

  // Chat History
  chatHistoryMessages: `${apiConfig.API_HTTP_BASE}/chat-history/messages`,
  chatHistoryMessage: (messageId: number | string) =>
    `${apiConfig.API_HTTP_BASE}/chat-history/messages/${messageId}`,
  chatHistoryCount: `${apiConfig.API_HTTP_BASE}/chat-history/messages/count`,

  // Admin
  adminResources: `${apiConfig.API_HTTP_BASE}/admin/resources`,
  adminTrafficStatus: `${apiConfig.API_HTTP_BASE}/admin/traffic/status`,
  adminStopRoadProcess: (roadName: string) =>
    `${apiConfig.API_HTTP_BASE}/admin/traffic/roads/${encodeURIComponent(roadName)}/stop`,
  adminStartRoadProcess: (roadName: string) =>
    `${apiConfig.API_HTTP_BASE}/admin/traffic/roads/${encodeURIComponent(roadName)}/start`,
};
