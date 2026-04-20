/**
 * Chat History Sync Service
 * Đồng bộ lịch sử chat giữa localStorage và server database
 */

import { authConfig } from "../config";

export interface Message {
  id: string;
  text: string;
  user: boolean;
  time: string;
  typing?: boolean;
  image?: string[];
}

interface ServerMessage {
  id: string;
  text: string;
  user: boolean;
  time: string;
  image: string[] | null;
  created_at: string;
}

interface ChatHistoryPageResponse {
  items: ServerMessage[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Fetch chat history from server
 */
import { endpoints } from "../config";

export const fetchChatHistory = async (
  page: number = 1,
  pageSize: number = 20,
): Promise<Message[]> => {
  try {
    const token = localStorage.getItem(authConfig.TOKEN_KEY);
    console.log(
      `fetchChatHistory called page=${page} pageSize=${pageSize} token=${token ? "present" : "missing"}`,
    );
    if (!token) {
      console.warn("No token found, cannot fetch chat history");
      return [];
    }

    const url = `${endpoints.chatHistoryMessages}?page=${page}&page_size=${pageSize}`;
    console.log("fetchChatHistory URL:", url);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ChatHistoryPageResponse = await response.json();
    console.log(
      `fetchChatHistory response items=${data.items?.length ?? 0} total_items=${data.total_items}`,
    );

    // Backend returns items in descending order (newest -> oldest).
    // Reverse to render chat chronologically (oldest -> newest) without relying on Date parsing.
    const orderedItems = [...(data.items || [])].reverse();

    // Convert to frontend format
    return orderedItems.map((msg) => {
      let displayTime = msg.time;
      try {
        if (msg.created_at) {
          // Parse date từ server (giả định là GMT+0)
          const date = new Date(msg.created_at);
          if (!isNaN(date.getTime())) {
            // Tự động tính toán và cộng thêm offset theo múi giờ máy tính của người dùng
            // getTimezoneOffset() trả về phút (VD: VN là -420), nên ta trừ đi để cộng thêm vào
            const localDate = new Date(
              date.getTime() - date.getTimezoneOffset() * 60000,
            );

            displayTime = localDate.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            });
          }
        }
      } catch (err) {
        console.error("Error adjusting message time:", err);
      }

      return {
        id: msg.id,
        text: msg.text,
        user: msg.user,
        time: displayTime,
        image: msg.image || undefined,
      };
    });
  } catch (error) {
    console.error("Error fetching chat history from server:", error);
    return [];
  }
};

/**
 * Save a single message to server
 */
export const saveMessageToServer = async (
  message: string,
  isUser: boolean,
  images?: string[],
): Promise<boolean> => {
  try {
    const token = localStorage.getItem(authConfig.TOKEN_KEY);
    if (!token) {
      console.warn("No token found, cannot save message");
      return false;
    }

    const response = await fetch(endpoints.chatHistoryMessages, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        is_user: isUser,
        images: images || null,
        extra_data: {
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Error saving message to server:", error);
    return false;
  }
};

/**
 * Clear all chat history on server
 */
export const clearServerChatHistory = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem(authConfig.TOKEN_KEY);
    if (!token) {
      return false;
    }

    const response = await fetch(endpoints.chatHistoryMessages, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Error clearing server chat history:", error);
    return false;
  }
};

/**
 * Get message count from server
 */
export const getServerMessageCount = async (): Promise<number> => {
  try {
    const token = localStorage.getItem(authConfig.TOKEN_KEY);
    if (!token) {
      return 0;
    }

    const response = await fetch(endpoints.chatHistoryCount, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error("Error getting message count:", error);
    return 0;
  }
};

/**
 * Sync localStorage to server (upload local history)
 */
export const syncLocalToServer = async (
  messages: Message[],
): Promise<number> => {
  let syncedCount = 0;

  for (const msg of messages) {
    // Skip welcome messages or typing indicators
    if (msg.id === "1" || msg.typing) continue;

    const success = await saveMessageToServer(msg.text, msg.user, msg.image);

    if (success) {
      syncedCount++;
    } else {
      console.warn(`Failed to sync message ${msg.id}`);
    }
  }

  return syncedCount;
};
