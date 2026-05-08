import { useEffect, useRef, useCallback } from 'react';
import { useDebateStore } from '../stores/debateStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:9528';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT = 5;

export function useWebSocket() {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectCount = useRef(0);
  
  const { 
    setWsConnected, 
    setWsReconnecting,
    addMessage,
    setDebateStatus,
    setPhase,
    setRound,
    addCommitment,
  } = useDebateStore();

  const connect = useCallback(() => {
    console.log('[WebSocket] Connecting...');
    
    try {
      ws.current = new WebSocket(WS_URL);
      
      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setWsConnected(true);
        setWsReconnecting(false);
        reconnectCount.current = 0;
      };
      
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('[WebSocket] Parse error:', error);
        }
      };
      
      ws.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setWsConnected(false);
        attemptReconnect();
      };
      
      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      attemptReconnect();
    }
  }, []);

  const attemptReconnect = useCallback(() => {
    if (reconnectCount.current >= MAX_RECONNECT) {
      console.log('[WebSocket] Max reconnect attempts reached');
      return;
    }
    
    reconnectCount.current++;
    setWsReconnecting(true);
    
    console.log(`[WebSocket] Reconnecting in ${RECONNECT_DELAY}ms (attempt ${reconnectCount.current})`);
    
    reconnectTimer.current = setTimeout(() => {
      connect();
    }, RECONNECT_DELAY);
  }, [connect]);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'debate:started':
        setDebateStatus('running');
        break;
      case 'debate:stopped':
        setDebateStatus('idle');
        break;
      case 'debate:phase':
        setPhase(data.payload);
        break;
      case 'debate:round':
        setRound(data.payload);
        break;
      case 'debate:message':
        addMessage(data.payload);
        break;
      case 'debate:commitment':
        addCommitment(data.payload);
        break;
      case 'debate:complete':
        setDebateStatus('completed');
        break;
      case 'system:connected':
        console.log('[WebSocket] System connected');
        break;
      default:
        console.log('[WebSocket] Unknown message type:', data.type);
    }
  }, [addMessage, addCommitment, setDebateStatus, setPhase, setRound]);

  const send = useCallback((type, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[WebSocket] Not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { send };
}
