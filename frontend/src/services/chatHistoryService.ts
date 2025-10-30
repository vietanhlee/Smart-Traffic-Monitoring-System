/**
 * Chat History Sync Service
 * Đồng bộ lịch sử chat giữa localStorage và server database
 */

import { authConfig, apiConfig } from "../config";

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

/**
 * Fetch chat history from server
 */
export const fetchChatHistory = async (
  limit: number = 100,
  offset: number = 0
): Promise<Message[]> => {
  try {
    const token = localStorage.getItem(authConfig.TOKEN_KEY);
    if (!token) {
      console.warn("No token found, cannot fetch chat history");
      return [];
    }

    const response = await fetch(
      `${apiConfig.API_HTTP_BASE}/chat/messages?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ServerMessage[] = await response.json();

    // Convert to frontend format
    return data.map((msg) => ({
      id: msg.id,
      text: msg.text,
      user: msg.user,
      time: msg.time,
      image: msg.image || undefined,
    }));
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
  images?: string[]
): Promise<boolean> => {
  try {
    const token = localStorage.getItem(authConfig.TOKEN_KEY);
    if (!token) {
      console.warn("No token found, cannot save message");
      return false;
    }

    const response = await fetch(`${apiConfig.API_HTTP_BASE}/chat/messages`, {
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

    const response = await fetch(`${apiConfig.API_HTTP_BASE}/chat/messages`, {
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

    const response = await fetch(
      `${apiConfig.API_HTTP_BASE}/chat/messages/count`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

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
  messages: Message[]
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
