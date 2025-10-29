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
    return `${apiConfig.API_HTTP_BASE}/users/profile`;
  }

  get PASSWORD_URL() {
    return `${apiConfig.API_HTTP_BASE}/users/password`;
  }
}

// ============================================
// WebSocket Configuration
// ============================================
class WebSocketConfig {
  // WebSocket Paths
  CHAT_PATH = "/ws/chat";
  FRAMES_PATH = "/ws/frames";
  INFO_PATH = "/ws/info";

  // Full WebSocket URLs
  get CHAT_WS() {
    return `${apiConfig.API_WS_BASE}${this.CHAT_PATH}`;
  }

  framesWs(roadName: string) {
    return `${apiConfig.API_WS_BASE}${this.FRAMES_PATH}/${encodeURIComponent(
      roadName
    )}`;
  }

  infoWs(roadName: string) {
    return `${apiConfig.API_WS_BASE}${this.INFO_PATH}/${encodeURIComponent(
      roadName
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
  roadNames: `${apiConfig.API_HTTP_BASE}/roads_name`,
  framesWs: (roadName: string) => wsConfig.framesWs(roadName),
  infoWs: (roadName: string) => wsConfig.infoWs(roadName),
  chatWs: wsConfig.CHAT_WS,
};
