/**
 * Settings Configuration for Smart Transportation System Frontend
 *
 * This file centralizes all configuration settings for the application.
 * Values can be overridden via Vite environment variables (.env files).
 *
 * Environment variables in Vite must be prefixed with VITE_
 * Example: VITE_API_HTTP_BASE=http://production-api.com
 */

// ============================================
// UTILITY FUNCTIONS
// ============================================

const trimTrailingSlash = (url: string): string => url.replace(/\/$/, "");

const getEnv = (key: string, defaultValue: string): string => {
  return (import.meta.env?.[key] as string) ?? defaultValue;
};

const getBoolEnv = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env?.[key] as string;
  if (value === undefined) return defaultValue;
  return value === "true" || value === "1";
};

const getNumberEnv = (key: string, defaultValue: number): number => {
  const value = import.meta.env?.[key] as string;
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// ============================================
// ENVIRONMENT DETECTION
// ============================================

export const ENVIRONMENT = getEnv("VITE_ENVIRONMENT", "development");
export const IS_DEVELOPMENT = ENVIRONMENT === "development";
export const IS_PRODUCTION = ENVIRONMENT === "production";
export const IS_STAGING = ENVIRONMENT === "staging";

// ============================================
// API CONFIGURATION
// ============================================

export const API = {
  // Base URLs
  HTTP_BASE: trimTrailingSlash(
    getEnv("VITE_API_HTTP_BASE", "http://localhost:8000")
  ),
  WS_BASE: trimTrailingSlash(getEnv("VITE_API_WS_BASE", "ws://localhost:8000")),

  // API Versions
  V1_PREFIX: getEnv("VITE_API_V1_PREFIX", "/api/v1"),
  V2_PREFIX: getEnv("VITE_API_V2_PREFIX", "/api/v2"),

  // Timeout & Retry
  TIMEOUT: getNumberEnv("VITE_API_TIMEOUT", 30000), // 30 seconds
  RETRY_ATTEMPTS: getNumberEnv("VITE_API_RETRY_ATTEMPTS", 3),
  RETRY_DELAY: getNumberEnv("VITE_API_RETRY_DELAY", 1000), // 1 second
} as const;

// ============================================
// WEBSOCKET CONFIGURATION
// ============================================

export const WEBSOCKET = {
  // Paths
  CHAT_PATH: getEnv("VITE_WS_CHAT_PATH", "/ws/chat"),
  FRAMES_PATH: getEnv("VITE_WS_FRAMES_PATH", "/ws/frames"),
  INFO_PATH: getEnv("VITE_WS_INFO_PATH", "/ws/info"),

  // Connection settings
  RECONNECT_INTERVAL: getNumberEnv("VITE_WS_RECONNECT_INTERVAL", 3000), // 3 seconds
  MAX_RECONNECT_ATTEMPTS: getNumberEnv("VITE_WS_MAX_RECONNECT_ATTEMPTS", 5),
  HEARTBEAT_INTERVAL: getNumberEnv("VITE_WS_HEARTBEAT_INTERVAL", 30000), // 30 seconds

  // Message settings
  MAX_MESSAGE_SIZE: getNumberEnv("VITE_WS_MAX_MESSAGE_SIZE", 1048576), // 1MB
} as const;

// ============================================
// AUTHENTICATION CONFIGURATION
// ============================================

export const AUTH = {
  // Storage keys
  ACCESS_TOKEN_KEY: getEnv("VITE_AUTH_TOKEN_KEY", "access_token"),
  REFRESH_TOKEN_KEY: getEnv("VITE_AUTH_REFRESH_TOKEN_KEY", "refresh_token"),
  USER_INFO_KEY: getEnv("VITE_AUTH_USER_KEY", "user_info"),

  // Token settings
  TOKEN_EXPIRE_DAYS: getNumberEnv("VITE_AUTH_TOKEN_EXPIRE_DAYS", 7),
  AUTO_REFRESH: getBoolEnv("VITE_AUTH_AUTO_REFRESH", true),

  // Session settings
  REMEMBER_ME_DAYS: getNumberEnv("VITE_AUTH_REMEMBER_ME_DAYS", 30),
} as const;

// ============================================
// UI CONFIGURATION
// ============================================

export const UI = {
  // App info
  APP_NAME: getEnv("VITE_APP_NAME", "Smart Transportation System"),
  APP_VERSION: getEnv("VITE_APP_VERSION", "1.0.0"),
  APP_DESCRIPTION: getEnv(
    "VITE_APP_DESCRIPTION",
    "Real-time Traffic Monitoring & AI Assistant"
  ),

  // Theme
  DEFAULT_THEME: getEnv("VITE_DEFAULT_THEME", "light") as "light" | "dark",
  ENABLE_THEME_TOGGLE: getBoolEnv("VITE_ENABLE_THEME_TOGGLE", true),

  // Animation
  ENABLE_ANIMATIONS: getBoolEnv("VITE_ENABLE_ANIMATIONS", true),
  ANIMATION_DURATION: getNumberEnv("VITE_ANIMATION_DURATION", 300), // ms

  // Layout
  SIDEBAR_WIDTH: getNumberEnv("VITE_SIDEBAR_WIDTH", 256), // px
  HEADER_HEIGHT: getNumberEnv("VITE_HEADER_HEIGHT", 64), // px

  // Pagination
  DEFAULT_PAGE_SIZE: getNumberEnv("VITE_DEFAULT_PAGE_SIZE", 10),
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// ============================================
// CHAT CONFIGURATION
// ============================================

export const CHAT = {
  // Storage
  DRAFT_KEY: getEnv("VITE_CHAT_DRAFT_KEY", "chat_draft"),
  HISTORY_KEY: getEnv("VITE_CHAT_HISTORY_KEY", "chat_history"),

  // Limits
  MAX_MESSAGE_LENGTH: getNumberEnv("VITE_CHAT_MAX_MESSAGE_LENGTH", 2000),
  MAX_HISTORY_SIZE: getNumberEnv("VITE_CHAT_MAX_HISTORY_SIZE", 100),

  // Features
  ENABLE_IMAGE_UPLOAD: getBoolEnv("VITE_CHAT_ENABLE_IMAGE_UPLOAD", true),
  ENABLE_FILE_UPLOAD: getBoolEnv("VITE_CHAT_ENABLE_FILE_UPLOAD", false),
  ENABLE_MARKDOWN: getBoolEnv("VITE_CHAT_ENABLE_MARKDOWN", true),

  // Typing indicator
  TYPING_TIMEOUT: getNumberEnv("VITE_CHAT_TYPING_TIMEOUT", 3000), // 3 seconds
} as const;

// ============================================
// TRAFFIC MONITORING CONFIGURATION
// ============================================

export const TRAFFIC = {
  // Refresh intervals
  VIDEO_REFRESH_INTERVAL: getNumberEnv("VITE_TRAFFIC_VIDEO_REFRESH", 100), // ms
  INFO_REFRESH_INTERVAL: getNumberEnv("VITE_TRAFFIC_INFO_REFRESH", 1000), // ms

  // Display settings
  SHOW_DETECTION_BOXES: getBoolEnv("VITE_TRAFFIC_SHOW_BOXES", true),
  SHOW_SPEED_INFO: getBoolEnv("VITE_TRAFFIC_SHOW_SPEED", true),
  SHOW_COUNT_INFO: getBoolEnv("VITE_TRAFFIC_SHOW_COUNT", true),

  // Performance
  MAX_FPS: getNumberEnv("VITE_TRAFFIC_MAX_FPS", 30),
  VIDEO_QUALITY: getEnv("VITE_TRAFFIC_VIDEO_QUALITY", "medium") as
    | "low"
    | "medium"
    | "high",
} as const;

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================

export const FILE_UPLOAD = {
  // Size limits (in bytes)
  MAX_FILE_SIZE: getNumberEnv("VITE_MAX_FILE_SIZE", 50 * 1024 * 1024), // 50MB
  MAX_IMAGE_SIZE: getNumberEnv("VITE_MAX_IMAGE_SIZE", 10 * 1024 * 1024), // 10MB

  // Allowed types
  ALLOWED_IMAGE_TYPES: getEnv(
    "VITE_ALLOWED_IMAGE_TYPES",
    "image/jpeg,image/png,image/webp,image/gif"
  ).split(","),

  ALLOWED_VIDEO_TYPES: getEnv(
    "VITE_ALLOWED_VIDEO_TYPES",
    "video/mp4,video/avi,video/mov"
  ).split(","),

  // Upload settings
  CHUNK_SIZE: getNumberEnv("VITE_UPLOAD_CHUNK_SIZE", 1024 * 1024), // 1MB chunks
} as const;

// ============================================
// NOTIFICATION CONFIGURATION
// ============================================

export const NOTIFICATION = {
  // Display settings
  POSITION: getEnv("VITE_NOTIFICATION_POSITION", "top-right") as
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right",

  // Duration (ms)
  SUCCESS_DURATION: getNumberEnv("VITE_NOTIFICATION_SUCCESS_DURATION", 3000),
  ERROR_DURATION: getNumberEnv("VITE_NOTIFICATION_ERROR_DURATION", 5000),
  INFO_DURATION: getNumberEnv("VITE_NOTIFICATION_INFO_DURATION", 3000),
  WARNING_DURATION: getNumberEnv("VITE_NOTIFICATION_WARNING_DURATION", 4000),

  // Features
  ENABLE_SOUND: getBoolEnv("VITE_NOTIFICATION_ENABLE_SOUND", false),
  MAX_NOTIFICATIONS: getNumberEnv("VITE_NOTIFICATION_MAX_COUNT", 5),
} as const;

// ============================================
// LOGGING CONFIGURATION
// ============================================

export const LOGGING = {
  // Log levels
  LEVEL: getEnv("VITE_LOG_LEVEL", IS_DEVELOPMENT ? "debug" : "error") as
    | "debug"
    | "info"
    | "warn"
    | "error",

  // Features
  ENABLE_CONSOLE_LOGS: getBoolEnv("VITE_ENABLE_CONSOLE_LOGS", IS_DEVELOPMENT),
  ENABLE_ERROR_REPORTING: getBoolEnv(
    "VITE_ENABLE_ERROR_REPORTING",
    IS_PRODUCTION
  ),

  // Performance
  LOG_API_CALLS: getBoolEnv("VITE_LOG_API_CALLS", IS_DEVELOPMENT),
  LOG_WEBSOCKET_MESSAGES: getBoolEnv(
    "VITE_LOG_WEBSOCKET_MESSAGES",
    IS_DEVELOPMENT
  ),
} as const;

// ============================================
// CACHE CONFIGURATION
// ============================================

export const CACHE = {
  // Enable/disable
  ENABLE_API_CACHE: getBoolEnv("VITE_ENABLE_API_CACHE", true),

  // TTL (time to live) in milliseconds
  DEFAULT_TTL: getNumberEnv("VITE_CACHE_DEFAULT_TTL", 5 * 60 * 1000), // 5 minutes
  USER_INFO_TTL: getNumberEnv("VITE_CACHE_USER_INFO_TTL", 30 * 60 * 1000), // 30 minutes
  ROAD_INFO_TTL: getNumberEnv("VITE_CACHE_ROAD_INFO_TTL", 10 * 60 * 1000), // 10 minutes

  // Size limits
  MAX_CACHE_SIZE: getNumberEnv("VITE_CACHE_MAX_SIZE", 100), // number of entries
} as const;

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURES = {
  // Experimental features
  ENABLE_ANALYTICS: getBoolEnv("VITE_FEATURE_ANALYTICS", false),
  ENABLE_PWA: getBoolEnv("VITE_FEATURE_PWA", false),
  ENABLE_OFFLINE_MODE: getBoolEnv("VITE_FEATURE_OFFLINE_MODE", false),

  // User features
  ENABLE_PROFILE_EDIT: getBoolEnv("VITE_FEATURE_PROFILE_EDIT", true),
  ENABLE_PASSWORD_CHANGE: getBoolEnv("VITE_FEATURE_PASSWORD_CHANGE", true),
  ENABLE_THEME_CUSTOMIZATION: getBoolEnv(
    "VITE_FEATURE_THEME_CUSTOMIZATION",
    true
  ),

  // Admin features
  ENABLE_ADMIN_PANEL: getBoolEnv("VITE_FEATURE_ADMIN_PANEL", true),
  ENABLE_SYSTEM_METRICS: getBoolEnv("VITE_FEATURE_SYSTEM_METRICS", true),
} as const;

// ============================================
// EXPORT COMBINED SETTINGS
// ============================================

export const settings = {
  ENVIRONMENT,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  IS_STAGING,
  API,
  WEBSOCKET,
  AUTH,
  UI,
  CHAT,
  TRAFFIC,
  FILE_UPLOAD,
  NOTIFICATION,
  LOGGING,
  CACHE,
  FEATURES,
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get full API URL by combining base URL and path
 */
export const getApiUrl = (path: string = ""): string => {
  const base = `${API.HTTP_BASE}${API.V1_PREFIX}`;
  if (!path) return base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

/**
 * Get full WebSocket URL by combining base URL and path
 */
export const getWsUrl = (path: string = ""): string => {
  const base = `${API.WS_BASE}${API.V1_PREFIX}`;
  if (!path) return base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

/**
 * Get road frames WebSocket URL
 */
export const getFramesWsUrl = (roadName: string): string => {
  return getWsUrl(`${WEBSOCKET.FRAMES_PATH}/${encodeURIComponent(roadName)}`);
};

/**
 * Get road info WebSocket URL
 */
export const getInfoWsUrl = (roadName: string): string => {
  return getWsUrl(`${WEBSOCKET.INFO_PATH}/${encodeURIComponent(roadName)}`);
};

/**
 * Get chat WebSocket URL
 */
export const getChatWsUrl = (): string => {
  return getWsUrl(WEBSOCKET.CHAT_PATH);
};

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Check if file type is allowed
 */
export const isFileTypeAllowed = (
  file: File,
  type: "image" | "video"
): boolean => {
  const allowedTypes =
    type === "image"
      ? FILE_UPLOAD.ALLOWED_IMAGE_TYPES
      : FILE_UPLOAD.ALLOWED_VIDEO_TYPES;
  return allowedTypes.includes(file.type);
};

/**
 * Check if file size is within limit
 */
export const isFileSizeAllowed = (
  file: File,
  type: "image" | "file"
): boolean => {
  const maxSize =
    type === "image" ? FILE_UPLOAD.MAX_IMAGE_SIZE : FILE_UPLOAD.MAX_FILE_SIZE;
  return file.size <= maxSize;
};

/**
 * Print all settings (for debugging)
 */
export const printSettings = (): void => {
  if (!LOGGING.ENABLE_CONSOLE_LOGS) return;

  console.group("📋 Application Settings");
  console.log("Environment:", ENVIRONMENT);
  console.log("API Base:", API.HTTP_BASE);
  console.log("WebSocket Base:", API.WS_BASE);
  console.log("Features:", FEATURES);
  console.groupEnd();
};

// ============================================
// TYPE EXPORTS
// ============================================

export type Environment = typeof ENVIRONMENT;
export type Theme = typeof UI.DEFAULT_THEME;
export type LogLevel = typeof LOGGING.LEVEL;
export type NotificationPosition = typeof NOTIFICATION.POSITION;
export type VideoQuality = typeof TRAFFIC.VIDEO_QUALITY;

// ============================================
// DEFAULT EXPORT
// ============================================

export default settings;
