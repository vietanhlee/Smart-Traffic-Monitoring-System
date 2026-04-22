/**
 * Chat Storage Utilities
 * Helper functions để quản lý lịch sử chat trong localStorage
 */

import { authConfig } from "../config";

interface Message {
  id: string;
  text: string;
  user: boolean;
  time: string;
  typing?: boolean;
  image?: string[];
}

/**
 * Get chat history key for current user
 */
export const getChatHistoryKey = (): string => {
  const token = localStorage.getItem(authConfig.TOKEN_KEY);
  const key = token
    ? `chat_history_${token.substring(0, 10)}`
    : "chat_history_guest";

  // Debug logging - bạn có thể bỏ trong production

  return key;
};

/**
 * Get draft key for current user
 */
export const getChatDraftKey = (): string => {
  const token = localStorage.getItem(authConfig.TOKEN_KEY);
  return token ? `chat_draft_${token.substring(0, 10)}` : "chat_draft_guest";
};

/**
 * Load chat history from localStorage
 */
export const loadChatHistory = (): Message[] => {
  try {
    const key = getChatHistoryKey();

    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // "[chatStorage] Successfully loaded", parsed.length, "messages"
        return parsed;
      }
    }
    // "[chatStorage] No saved messages found, returning welcome message"
  } catch (error) {
    console.error("Error loading chat history:", error);
  }

  // Return default welcome message
  return [
    {
      id: "1",
      text: "Xin chào! Tôi là trợ lý AI của hệ thống giao thông thông minh. Bạn có thể hỏi tôi về tình trạng giao thông hiện tại, thống kê xe cộ, hoặc bất kỳ thông tin nào về các tuyến đường đang được giám sát. Tôi có thể giúp gì cho bạn?",
      user: false,
      time: new Date().toLocaleTimeString("vi-VN"),
    },
  ];
};

/**
 * Save chat history to localStorage
 */
export const saveChatHistory = (messages: Message[]): void => {
  try {
    const key = getChatHistoryKey();
    // "[chatStorage] Saving", messages.length, "messages to key:", key
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

/**
 * Clear chat history from localStorage
 */
export const clearChatHistory = (): void => {
  try {
    const key = getChatHistoryKey();
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing chat history:", error);
  }
};

/**
 * Load draft from localStorage
 */
export const loadChatDraft = (): string => {
  try {
    const key = getChatDraftKey();
    return localStorage.getItem(key) || "";
  } catch (error) {
    console.error("Error loading draft:", error);
    return "";
  }
};

/**
 * Save draft to localStorage
 */
export const saveChatDraft = (draft: string): void => {
  try {
    const key = getChatDraftKey();
    localStorage.setItem(key, draft);
  } catch (error) {
    console.error("Error saving draft:", error);
  }
};

/**
 * Clear draft from localStorage
 */
export const clearChatDraft = (): void => {
  try {
    const key = getChatDraftKey();
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing draft:", error);
  }
};

/**
 * Clear all chat data (history and draft) for current user
 * Useful when user logs out
 */
export const clearAllChatData = (): void => {
  clearChatHistory();
  clearChatDraft();
};

/**
 * Clear all chat data for all users
 * Useful for cleanup/maintenance
 */
export const clearAllUsersData = (): void => {
  try {
    const keys = Object.keys(localStorage);
    let count = 0;
    keys.forEach((key) => {
      if (key.startsWith("chat_history_") || key.startsWith("chat_draft_")) {
        localStorage.removeItem(key);
        count++;
      }
    });
  } catch (error) {
    console.error("Error clearing all users data:", error);
  }
};

/**
 * Debug: List all chat storage keys
 * Use in DevTools console: window.debugChatStorage()
 */
export const debugChatStorage = (): void => {
  const keys = Object.keys(localStorage);
  const chatKeys = keys.filter(
    (k) => k.startsWith("chat_history_") || k.startsWith("chat_draft_"),
  );

  chatKeys.forEach((key) => {
    const value = localStorage.getItem(key);
    if (key.startsWith("chat_history_")) {
      try {
        JSON.parse(value || "[]");
      } catch {}
    }
  });

  // const currentMessages = loadChatHistory();
  // currentMessages.forEach((msg, i) => {
  //   `[${i}] ${msg.user ? "User" : "Bot"}: ${msg.text.substring(0, 50)}...`);
  // });
};

// Expose to window for easy debugging
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).debugChatStorage = debugChatStorage;
}
