import { useEffect, useRef, useState, useCallback } from 'react';

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

  const connect = useCallback(() => {
    if (!url || !mountedRef.current) return;

    try {
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
        if (reconnectCount < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setReconnectCount(prev => prev + 1);
              connect();
            }
          }, reconnectInterval);
        }
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
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setData(null);
    setReconnectCount(0);
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
  }, [url, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    reconnectCount,
    connect,
    disconnect,
  };
};

// Hook specifically for traffic info WebSocket
export const useTrafficInfo = (roadName: string | null) => {
  const wsUrl = roadName ? `ws://localhost:8000/ws/info/${encodeURIComponent(roadName)}` : null;
  
  return useWebSocket(wsUrl, {
    reconnectInterval: 5000,
    maxReconnectAttempts: 3,
  });
};

// Hook specifically for frame WebSocket
export const useFrameStream = (roadName: string | null) => {
  const wsUrl = roadName ? `ws://localhost:8000/ws/frames/${encodeURIComponent(roadName)}` : null;
  
  return useWebSocket(wsUrl, {
    reconnectInterval: 2000,
    maxReconnectAttempts: 5,
  });
};

// Hook for multiple traffic info streams
export const useMultipleTrafficInfo = (roadNames: string[]) => {
  const [trafficData, setTrafficData] = useState<Record<string, any>>({});
  const [connections, setConnections] = useState<Record<string, boolean>>({});

  const updateTrafficData = useCallback((roadName: string, data: any) => {
    setTrafficData(prev => ({
      ...prev,
      [roadName]: data
    }));
  }, []);

  const updateConnection = useCallback((roadName: string, isConnected: boolean) => {
    setConnections(prev => ({
      ...prev,
      [roadName]: isConnected
    }));
  }, []);

  // Create WebSocket connections for each road
  const hooks = roadNames.map(roadName => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const hook = useTrafficInfo(roadName);
    
    useEffect(() => {
      if (hook.data) {
        updateTrafficData(roadName, hook.data);
      }
    }, [hook.data, roadName, updateTrafficData]);

    useEffect(() => {
      updateConnection(roadName, hook.isConnected);
    }, [hook.isConnected, roadName, updateConnection]);

    return hook;
  });

  return {
    trafficData,
    connections,
    hooks,
    isAnyConnected: Object.values(connections).some(Boolean),
    areAllConnected: Object.values(connections).every(Boolean),
  };
};