import { useEffect, useRef, useState, useCallback } from "react";
import { endpoints } from "../config";

interface WebSocketHookOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

interface WebSocketHook {
  data: any;
  isConnected: boolean;
  error: string | null;
  reconnectCount: number;
  connect: () => void;
  disconnect: () => void;
  send: (payload: any) => boolean;
}

export const useWebSocket = (
  url: string | null,
  options: WebSocketHookOptions = {}
): WebSocketHook => {
  const {
    reconnectInterval = 2000, // Giảm thời gian chờ retry xuống 2s
    maxReconnectAttempts = 10, // Tăng số lần retry lên 10
    onOpen,
    onClose,
    onError,
  } = options;

  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const intentionalCloseRef = useRef(false);

  const connect = useCallback(() => {
    if (!url || !mountedRef.current) return;

    try {
      // Prevent duplicate connections
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setError(null);
        setReconnectCount(0);
        onOpen?.();
      };

      wsRef.current.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          // Check if the data is binary
          if (event.data instanceof ArrayBuffer) {
            const binaryData = new Uint8Array(event.data);
            setData(binaryData);
          } else {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      wsRef.current.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        onClose?.();

        // Auto-reconnect if not exceeding max attempts
        if (
          !intentionalCloseRef.current &&
          reconnectCount < maxReconnectAttempts
        ) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCount), 10000); // Exponential backoff with max 10s

          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          console.log(
            `WebSocket đã đóng. Thử kết nối lại sau ${delay}ms (lần ${
              reconnectCount + 1
            }/${maxReconnectAttempts})`
          );
          setError(
            `Mất kết nối. Thử kết nối lại sau ${Math.round(delay / 1000)}s...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setReconnectCount((prev) => prev + 1);
              setError(
                `Đang kết nối lại (lần ${
                  reconnectCount + 1
                }/${maxReconnectAttempts})...`
              );
              try {
                connect();
              } catch (error) {
                const err = error as Error;
                console.error("Lỗi khi thử kết nối lại:", err);
                setError(`Không thể kết nối lại: ${err.message}`);
              }
            }
          }, delay);
        } else if (reconnectCount >= maxReconnectAttempts) {
          setError(
            "Không thể kết nối với server sau nhiều lần thử. Vui lòng tải lại trang."
          );
        }
        intentionalCloseRef.current = false;
      };

      wsRef.current.onerror = (error) => {
        if (!mountedRef.current) return;
        console.error("WebSocket error:", error);
        console.error("WebSocket URL:", url);
        setError("Lỗi kết nối WebSocket. Đang thử kết nối lại...");
        onError?.(error);
      };
    } catch (err) {
      setError("Failed to create WebSocket connection");
      console.error("WebSocket connection error:", err);
    }
  }, [
    url,
    reconnectCount,
    maxReconnectAttempts,
    reconnectInterval,
    onOpen,
    onClose,
    onError,
  ]);

  const cleanupWebSocket = (ws: WebSocket) => {
    try {
      ws.onopen = null as WebSocket["onopen"];
      ws.onmessage = null as WebSocket["onmessage"];
      ws.onclose = null as WebSocket["onclose"];
      ws.onerror = null as WebSocket["onerror"];

      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    } catch (error) {
      console.error("Error cleaning up WebSocket:", error);
    }
  };

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      intentionalCloseRef.current = true;
      cleanupWebSocket(wsRef.current);
      wsRef.current = null;
    }

    setIsConnected(false);
    setData(null);
    setReconnectCount(0);
  }, []);

  const send = useCallback((payload: unknown) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      const message =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      socket.send(message);
      return true;
    } catch (err) {
      console.error("Failed to send over WebSocket:", err);
      return false;
    }
  }, []);

  const hasInitialized = useRef(false);

  // Khởi tạo WebSocket một lần duy nhất khi component mount
  useEffect(() => {
    // Chỉ chạy một lần khi component mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    mountedRef.current = true;

    if (url) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      hasInitialized.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.onopen = null as WebSocket["onopen"];
        wsRef.current.onmessage = null as WebSocket["onmessage"];
        wsRef.current.onclose = null as WebSocket["onclose"];
        wsRef.current.onerror = null as WebSocket["onerror"];
        wsRef.current = null;
      }

      disconnect();
      setIsConnected(false);
      setError(null);
      setReconnectCount(0);
    };
  }, [url, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    reconnectCount,
    connect,
    disconnect,
    send,
  };
};

// Hook specifically for traffic info WebSocket
export const useTrafficInfo = (roadName: string | null) => {
  const wsUrl = roadName ? endpoints.infoWs(roadName) : null;

  return useWebSocket(wsUrl, {
    reconnectInterval: 5000,
    maxReconnectAttempts: 3,
  });
};

// Hook specifically for frame WebSocket
export const useFrameStream = (roadName: string | null) => {
  const wsUrl = roadName ? endpoints.framesWs(roadName) : null;

  return useWebSocket(wsUrl, {
    reconnectInterval: 2000,
    maxReconnectAttempts: 5,
  });
};

// Hook for multiple traffic info streams
export const useMultipleTrafficInfo = (roadNames: string[]) => {
  interface VehicleData {
    count_car: number;
    count_motor: number;
    speed_car: number;
    speed_motor: number;
  }

  interface TrafficData {
    [key: string]: VehicleData;
  }

  const [trafficData, setTrafficData] = useState<TrafficData>({});
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const socketsRef = useRef<Record<string, WebSocket>>({});
  const lastMessageRef = useRef<Record<string, string>>({});

  const cleanupWebSocket = (ws: WebSocket) => {
    try {
      ws.onopen = null as WebSocket["onopen"];
      ws.onmessage = null as WebSocket["onmessage"];
      ws.onclose = null as WebSocket["onclose"];
      ws.onerror = null as WebSocket["onerror"];

      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    } catch (error) {
      console.error("Error cleaning up WebSocket:", error);
    }
  };

  useEffect(() => {
    const currentSockets = socketsRef.current;
    const target = new Set(roadNames);

    // Close sockets for removed roads
    Object.keys(currentSockets).forEach((road) => {
      if (!target.has(road)) {
        const ws = currentSockets[road];
        cleanupWebSocket(ws);
        delete currentSockets[road];
        setConnections((prev) => ({ ...prev, [road]: false }));
      }
    });

    // Open sockets for new roads
    roadNames.forEach((road) => {
      if (currentSockets[road]) return;
      const wsUrl = endpoints.infoWs(road);
      const ws = new WebSocket(wsUrl);
      currentSockets[road] = ws;

      ws.onopen = () => setConnections((prev) => ({ ...prev, [road]: true }));
      ws.onmessage = (event) => {
        try {
          // Avoid redundant updates
          if (lastMessageRef.current[road] === event.data) return;
          lastMessageRef.current[road] = event.data;
          const parsed = JSON.parse(event.data);
          
          // Transform the data to match VehicleData interface
          const vehicleData: VehicleData = {
            count_car: parsed.count_car || 0,
            count_motor: parsed.count_motor || 0,
            speed_car: parsed.speed_car || 0,
            speed_motor: parsed.speed_motor || 0,
          };
          
          setTrafficData((prev) => {
            const prevForRoad = prev[road];
            // Cheap stringify compare to guard nested equality
            const prevStr = prevForRoad ? JSON.stringify(prevForRoad) : "";
            const nextStr = JSON.stringify(vehicleData);
            if (prevStr === nextStr) return prev;
            return { ...prev, [road]: vehicleData };
          });
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };
      const markClosed = () =>
        setConnections((prev) => ({ ...prev, [road]: false }));
      ws.onclose = markClosed;
      ws.onerror = markClosed;
    });

    return () => {
      // On unmount, close all
      Object.values(currentSockets).forEach(cleanupWebSocket);
      socketsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(roadNames)]);

  const isAnyConnected = Object.values(connections).some(Boolean);
  const areAllConnected =
    roadNames.length > 0 && roadNames.every((r) => connections[r]);

  return { trafficData, connections, isAnyConnected, areAllConnected };
};

// Hook for multiple frame streams
export const useMultipleFrameStreams = (roadNames: string[]) => {
  const [frameData, setFrameData] = useState<Record<string, { frame: string }>>(
    {}
  );
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const socketsRef = useRef<Record<string, WebSocket>>({});
  const lastFrameRef = useRef<Record<string, string>>({});

  const cleanupWebSocket = (ws: WebSocket) => {
    try {
      ws.onopen = null as WebSocket["onopen"];
      ws.onmessage = null as WebSocket["onmessage"];
      ws.onclose = null as WebSocket["onclose"];
      ws.onerror = null as WebSocket["onerror"];

      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    } catch (error) {
      console.error("Error cleaning up WebSocket:", error);
    }
  };

  useEffect(() => {
    const currentSockets = socketsRef.current;
    const target = new Set(roadNames);

    // Close sockets for removed roads
    Object.keys(currentSockets).forEach((road) => {
      if (!target.has(road)) {
        const ws = currentSockets[road];
        cleanupWebSocket(ws);
        delete currentSockets[road];
        setConnections((prev) => ({ ...prev, [road]: false }));
      }
    });

    // Open sockets for new roads
    roadNames.forEach((road) => {
      if (currentSockets[road]) return;
      const wsUrl = endpoints.framesWs(road);
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer"; // Set to handle binary data
      currentSockets[road] = ws;

      ws.onopen = () => setConnections((prev) => ({ ...prev, [road]: true }));
      ws.onmessage = (event) => {
        try {
          // Convert the received binary data to a blob URL
          const blob = new Blob([event.data], { type: "image/jpeg" });
          const imageUrl = URL.createObjectURL(blob);

          if (lastFrameRef.current[road] === imageUrl) {
            URL.revokeObjectURL(imageUrl); // Clean up unused blob URL
            return;
          }

          // Clean up the previous blob URL to prevent memory leaks
          if (lastFrameRef.current[road]) {
            URL.revokeObjectURL(lastFrameRef.current[road]);
          }

          lastFrameRef.current[road] = imageUrl;
          setFrameData((prev) => {
            const prevForRoad = prev[road]?.frame;
            if (prevForRoad === imageUrl) {
              URL.revokeObjectURL(imageUrl);
              return prev;
            }
            // Clean up previous blob URL if it exists
            if (prevForRoad) {
              URL.revokeObjectURL(prevForRoad);
            }
            return { ...prev, [road]: { frame: imageUrl } };
          });
        } catch (error) {
          console.error("Error processing frame:", error);
        }
      };
      const markClosed = () =>
        setConnections((prev) => ({ ...prev, [road]: false }));
      ws.onclose = markClosed;
      ws.onerror = markClosed;
    });

    return () => {
      // On unmount, close all
      Object.values(currentSockets).forEach(cleanupWebSocket);
      socketsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(roadNames)]);

  const isAnyConnected = Object.values(connections).some(Boolean);
  const areAllConnected =
    roadNames.length > 0 && roadNames.every((r) => connections[r]);

  return { frameData, connections, isAnyConnected, areAllConnected };
};
