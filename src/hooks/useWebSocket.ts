import { useEffect, useRef, useState, useCallback } from 'react';
import { endpoints } from '../config';

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
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
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
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
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
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        onClose?.();

        // Auto-reconnect if not exceeding max attempts
        if (!intentionalCloseRef.current && reconnectCount < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setReconnectCount(prev => prev + 1);
              connect();
            }
          }, reconnectInterval);
        }
        // Reset the flag after handling close
        intentionalCloseRef.current = false;
      };

      wsRef.current.onerror = (error) => {
        if (!mountedRef.current) return;
        setError('WebSocket connection error');
        onError?.(error);
      };

    } catch (err) {
      setError('Failed to create WebSocket connection');
      console.error('WebSocket connection error:', err);
    }
  }, [url, reconnectCount, maxReconnectAttempts, reconnectInterval, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      intentionalCloseRef.current = true;
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setData(null);
    setReconnectCount(0);
  }, []);

  const send = useCallback((payload: any) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    try {
      const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
      socket.send(message);
      return true;
    } catch (err) {
      console.error('Failed to send over WebSocket:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    if (url) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
    // We intentionally only depend on url to avoid reconnect loops when state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

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
  const [trafficData, setTrafficData] = useState<Record<string, any>>({});
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const socketsRef = useRef<Record<string, WebSocket>>({});
  const lastMessageRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const currentSockets = socketsRef.current;
    const target = new Set(roadNames);

    // Close sockets for removed roads
    Object.keys(currentSockets).forEach((road) => {
      if (!target.has(road)) {
        try {
          const ws = currentSockets[road];
          ws.onopen = null as any;
          ws.onmessage = null as any;
          ws.onclose = null as any;
          ws.onerror = null as any;
          ws.close();
        } catch {}
        delete currentSockets[road];
        setConnections(prev => ({ ...prev, [road]: false }));
      }
    });

    // Open sockets for new roads
    roadNames.forEach((road) => {
      if (currentSockets[road]) return;
      const wsUrl = endpoints.infoWs(road);
      const ws = new WebSocket(wsUrl);
      currentSockets[road] = ws;

      ws.onopen = () => setConnections(prev => ({ ...prev, [road]: true }));
      ws.onmessage = (event) => {
        try {
          // Avoid redundant updates
          if (lastMessageRef.current[road] === event.data) return;
          lastMessageRef.current[road] = event.data;
          const parsed = JSON.parse(event.data);
          setTrafficData(prev => {
            const prevForRoad = prev[road];
            // Cheap stringify compare to guard nested equality
            const prevStr = prevForRoad ? JSON.stringify(prevForRoad) : '';
            const nextStr = JSON.stringify(parsed);
            if (prevStr === nextStr) return prev; 
            return { ...prev, [road]: parsed };
          });
        } catch {}
      };
      const markClosed = () => setConnections(prev => ({ ...prev, [road]: false }));
      ws.onclose = markClosed;
      ws.onerror = markClosed;
    });

    return () => {
      // On unmount, close all
      Object.values(currentSockets).forEach((ws) => {
        try {
          ws.onopen = null as any;
          ws.onmessage = null as any;
          ws.onclose = null as any;
          ws.onerror = null as any;
          ws.close();
        } catch {}
      });
      socketsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(roadNames)]);

  const isAnyConnected = Object.values(connections).some(Boolean);
  const areAllConnected = roadNames.length > 0 && roadNames.every(r => connections[r]);

  return { trafficData, connections, isAnyConnected, areAllConnected };
};

// Hook for multiple frame streams
export const useMultipleFrameStreams = (roadNames: string[]) => {
  const [frameData, setFrameData] = useState<Record<string, { frame: string }>>({});
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const socketsRef = useRef<Record<string, WebSocket>>({});
  const lastFrameRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const currentSockets = socketsRef.current;
    const target = new Set(roadNames);

    // Close sockets for removed roads
    Object.keys(currentSockets).forEach((road) => {
      if (!target.has(road)) {
        try {
          const ws = currentSockets[road];
          ws.onopen = null as any;
          ws.onmessage = null as any;
          ws.onclose = null as any;
          ws.onerror = null as any;
          ws.close();
        } catch {}
        delete currentSockets[road];
        setConnections(prev => ({ ...prev, [road]: false }));
      }
    });

    // Open sockets for new roads
    roadNames.forEach((road) => {
      if (currentSockets[road]) return;
      const wsUrl = endpoints.framesWs(road);
      const ws = new WebSocket(wsUrl);
      currentSockets[road] = ws;

      ws.onopen = () => setConnections(prev => ({ ...prev, [road]: true }));
      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const frame = parsed?.frame;
          if (frame) {
            if (lastFrameRef.current[road] === frame) return;
            lastFrameRef.current[road] = frame;
            setFrameData(prev => {
              const prevForRoad = prev[road]?.frame;
              if (prevForRoad === frame) return prev;
              return { ...prev, [road]: { frame } };
            });
          }
        } catch {}
      };
      const markClosed = () => setConnections(prev => ({ ...prev, [road]: false }));
      ws.onclose = markClosed;
      ws.onerror = markClosed;
    });

    return () => {
      // On unmount, close all
      Object.values(currentSockets).forEach((ws) => {
        try {
          ws.onopen = null as any;
          ws.onmessage = null as any;
          ws.onclose = null as any;
          ws.onerror = null as any;
          ws.close();
        } catch {}
      });
      socketsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(roadNames)]);

  const isAnyConnected = Object.values(connections).some(Boolean);
  const areAllConnected = roadNames.length > 0 && roadNames.every(r => connections[r]);

  return { frameData, connections, isAnyConnected, areAllConnected };
};