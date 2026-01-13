import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { useRealtimeStore } from '../stores/realtime-store';

type WSEventType =
  | 'escalation:new'
  | 'escalation:updated'
  | 'conversation:new'
  | 'conversation:updated'
  | 'message:new'
  | 'sentiment:update';

interface WSMessage {
  type: WSEventType | 'connected';
  payload: any;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const { token, isAuthenticated } = useAuthStore();
  const { setWsConnected, addEscalation, updateEscalation, setLiveConversation } = useRealtimeStore();

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [token, isAuthenticated, setWsConnected]);

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket authenticated:', message.payload.clientId);
        break;
      case 'escalation:new':
        addEscalation(message.payload);
        break;
      case 'escalation:updated':
        updateEscalation(message.payload.id, message.payload);
        break;
      case 'conversation:new':
      case 'conversation:updated':
        setLiveConversation(message.payload);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [addEscalation, updateEscalation, setLiveConversation]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return wsRef.current;
}
