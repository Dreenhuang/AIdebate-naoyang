import { useEffect, useRef, useCallback, useState } from 'react';
import { useDebateStore } from '../stores/debateStore';
import { offlineManager } from '../utils/offlineManager'; // 🔥 V2.2 新增

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:9528';
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 10000;
const BACKOFF_MULTIPLIER = 1.5;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket() {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectCount = useRef(0);
  const currentDelay = useRef(INITIAL_RECONNECT_DELAY);
  const isConnecting = useRef(false);
  const shouldReconnect = useRef(true);
  const initialized = useRef(false);
  const isManualDisconnect = useRef(false);

  const [reconnectState, setReconnectState] = useState({
    isReconnecting: false,
    attemptCount: 0,
    nextRetryIn: 0,
    isMaxAttemptsReached: false,
    lastError: null,
    logs: [],
  });

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[WebSocket][${timestamp}] [${type.toUpperCase()}] ${message}`);
    setReconnectState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-19), { timestamp, message, type }].slice(-20),
    }));
  }, []);

  const storeActions = useRef({
    setWsConnected: null,
    setWsReconnecting: null,
    addMessage: null,
    setDebateStatus: null,
    setPhase: null,
    setRound: null,
    setTotalPhases: null,
    setTotalRounds: null,
    addCommitment: null,
    addConsensus: null,
    addBacktrackResult: null,
    setFiles: null,  // 🔥 新增：文件列表更新
    // 🔥 V2.2 新增：流式输出
    startStream: null,
    appendStreamChunk: null,
    endStream: null,
    cancelStream: null,
    setStreamMeta: null, // 🔥 V2.2 新增
  });

  const {
    setWsConnected,
    setWsReconnecting,
    addMessage,
    setDebateStatus,
    setPhase,
    setRound,
    setTotalPhases,
    setTotalRounds,
    addCommitment,
    addConsensus,
    addBacktrackResult,
    setFiles,  // 🔥 新增
    // 🔥 V2.2 新增：流式输出
    startStream,
    appendStreamChunk,
    endStream,
    cancelStream,
    setStreamMeta, // 🔥 V2.2 新增
  } = useDebateStore();

  useEffect(() => {
    storeActions.current = {
      setWsConnected,
      setWsReconnecting,
      addMessage,
      setDebateStatus,
      setPhase,
      setRound,
      setTotalPhases,
      setTotalRounds,
      addCommitment,
      addConsensus,
      addBacktrackResult,
      setFiles,  // 🔥 新增
      // 🔥 V2.2 新增：流式输出
      startStream,
      appendStreamChunk,
      endStream,
      cancelStream,
      setStreamMeta, // 🔥 V2.2 新增
    };
  }, [setWsConnected, setWsReconnecting, addMessage, setDebateStatus, setPhase, setRound, setTotalPhases, setTotalRounds, addCommitment, addConsensus, addBacktrackResult, setFiles, startStream, appendStreamChunk, endStream, cancelStream, setStreamMeta]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const resetReconnectState = useCallback(() => {
    reconnectCount.current = 0;
    currentDelay.current = INITIAL_RECONNECT_DELAY;
    setReconnectState(prev => ({
      ...prev,
      isReconnecting: false,
      attemptCount: 0,
      nextRetryIn: 0,
      isMaxAttemptsReached: false,
    }));
  }, []);

  const connect = useCallback(() => {
    if (isConnecting.current) {
      addLog('Connection attempt blocked - already connecting', 'warn');
      return;
    }

    isConnecting.current = true;
    shouldReconnect.current = true;

    addLog(`Attempting to connect to ${WS_URL}`, 'info');

    try {
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.onmessage = null;
        ws.current.onopen = null;
        ws.current.close();
        ws.current = null;
      }

      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        isConnecting.current = false;
        storeActions.current.setWsConnected?.(true);
        storeActions.current.setWsReconnecting?.(false);
        reconnectCount.current = 0;
        currentDelay.current = INITIAL_RECONNECT_DELAY;
        addLog('WebSocket connection established', 'success');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          switch (type) {
            case 'debate:started':
              storeActions.current.setDebateStatus?.('running');
              if (payload?.phases) {
                storeActions.current.setTotalPhases?.(payload.phases);
              }
              if (payload?.totalRounds) {
                storeActions.current.setTotalRounds?.(payload.totalRounds);
              }
              break;
            case 'debate:stopped':
              storeActions.current.setDebateStatus?.('idle');
              break;
            case 'debate:phase':
              storeActions.current.setPhase?.(payload.phase || 0);
              if (payload?.totalPhases) {
                storeActions.current.setTotalPhases?.(payload.totalPhases);
              }
              break;
            case 'debate:round':
              storeActions.current.setRound?.(payload.round || 0);
              if (payload?.totalRounds) {
                storeActions.current.setTotalRounds?.(payload.totalRounds);
              }
              break;
            case 'debate:probe':
              // 阶段探查事件 - 可以在这里记录探查内容，但不需要特殊处理
              console.log('[WebSocket] 📋 Probe event:', payload);
              break;
            case 'debate:message':
              storeActions.current.addMessage?.(payload);
              break;
            case 'debate:commitment':
              storeActions.current.addCommitment?.(payload);
              break;
            case 'debate:consensus':
              storeActions.current.addConsensus?.(payload);
              break;
            case 'debate:backtrack':
              storeActions.current.addBacktrackResult?.(payload);
              break;
            case 'debate:complete':
              storeActions.current.setDebateStatus?.('completed');
              break;
            case 'debate:files-generated':
              // 🔥 新增：接收文件生成事件，更新文件列表
              if (payload?.files && Array.isArray(payload.files)) {
                console.log('[WebSocket] Received files:', payload.files.length, 'files');
                storeActions.current.setFiles?.(payload.files);
              }
              break;
            // 🔥 新增 V2.1：API 调用状态更新（解决卡死问题）
            case 'debate:status':
              console.log(`[WebSocket] 📊 API Status: ${payload.status} - ${payload.message}`);
              break;
            // 🔥 V2.2 新增：流式输出事件
            case 'debate:stream:start':
              console.log('[WebSocket] 🌊 Stream started');
              console.log('[WebSocket] Stream metadata:', payload);
              // 更新流式元数据到 store
              storeActions.current.setStreamMeta?.(payload || {});
              storeActions.current.startStream?.();
              break;
            case 'debate:stream:chunk':
              // 高频调用，不打印日志
              if (payload?.content) {
                storeActions.current.appendStreamChunk?.(payload.content);
              }
              break;
            case 'debate:stream:end':
              console.log('[WebSocket] ✅ Stream ended');
              storeActions.current.endStream?.();
              break;
            case 'debate:stream:cancelled':
              console.log('[WebSocket] 🛑 Stream cancelled');
              storeActions.current.cancelStream?.();
              break;
            case 'debate:stream:error':
              console.error('[WebSocket] ❌ Stream error:', payload.error);
              storeActions.current.cancelStream?.();
              break;
            case 'debate:cancelled':
              console.log('[WebSocket] 🛑 Request cancelled');
              storeActions.current.cancelStream?.();
              break;
            case 'system:connected':
              addLog('Server acknowledged connection', 'success');
              break;
            case 'debate:error':
              addLog(`Server error: ${payload.message || payload}`, 'error');
              // 🔥 新增：详细错误信息输出到控制台
              if (payload.suggestions) {
                console.error('[WebSocket] 💡 错误建议:', ...payload.suggestions);
              }
              break;
          }
        } catch (error) {
          addLog(`Message parse error: ${error.message}`, 'error');
        }
      };

      ws.current.onclose = (event) => {
        isConnecting.current = false;
        storeActions.current.setWsConnected?.(false);
        addLog(`Connection closed (code: ${event.code})`, 'warn');

        if (isManualDisconnect.current) {
          addLog('Manual disconnect - not reconnecting', 'info');
          return;
        }

        if (shouldReconnect.current) {
          if (reconnectCount.current >= MAX_RECONNECT_ATTEMPTS) {
            addLog(`Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached`, 'error');
            storeActions.current.setWsReconnecting?.(false);
            setReconnectState(prev => ({
              ...prev,
              isReconnecting: false,
              isMaxAttemptsReached: true,
            }));
            return;
          }

          storeActions.current.setWsReconnecting?.(true);
          reconnectCount.current++;

          const delay = currentDelay.current;
          addLog(`Scheduling reconnect #${reconnectCount.current} in ${delay}ms (backoff: ${currentDelay.current}ms)`, 'info');

          setReconnectState(prev => ({
            ...prev,
            isReconnecting: true,
            attemptCount: reconnectCount.current,
            nextRetryIn: Math.ceil(delay / 1000),
          }));

          let countdown = Math.ceil(delay / 1000);
          const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
              setReconnectState(prev => ({
                ...prev,
                nextRetryIn: countdown,
              }));
            }
          }, 1000);

          reconnectTimer.current = setTimeout(() => {
            clearInterval(countdownInterval);
            addLog(`Executing reconnect attempt #${reconnectCount.current}`, 'info');
            currentDelay.current = Math.min(
              currentDelay.current * BACKOFF_MULTIPLIER,
              MAX_RECONNECT_DELAY
            );
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        isConnecting.current = false;
        addLog(`WebSocket error occurred`, 'error');
        setReconnectState(prev => ({
          ...prev,
          lastError: 'Connection error',
        }));
      };
    } catch (error) {
      isConnecting.current = false;
      addLog(`Connection exception: ${error.message}`, 'error');

      if (shouldReconnect.current && reconnectCount.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectCount.current++;
        const delay = currentDelay.current;
        addLog(`Scheduling reconnect after exception #${reconnectCount.current} in ${delay}ms`, 'info');

        reconnectTimer.current = setTimeout(() => {
          currentDelay.current = Math.min(
            currentDelay.current * BACKOFF_MULTIPLIER,
            MAX_RECONNECT_DELAY
          );
          connect();
        }, delay);
      }
    }
  }, [addLog]);

  const manualReconnect = useCallback(() => {
    addLog('Manual reconnect triggered', 'info');
    resetReconnectState();
    reconnectCount.current = 0;
    currentDelay.current = INITIAL_RECONNECT_DELAY;
    connect();
  }, [connect, resetReconnectState, addLog]);

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    shouldReconnect.current = false;
    clearReconnectTimer();
    resetReconnectState();

    if (ws.current) {
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.close();
      ws.current = null;
    }

    storeActions.current.setWsConnected?.(false);
    addLog('Disconnected manually', 'info');
  }, [clearReconnectTimer, resetReconnectState, addLog]);

  const send = useCallback((type, payload) => {
    // 🔥 V2.2 新增：离线检测与缓存
    if (!offlineManager.isOnline || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      const cached = offlineManager.enqueue({ type, payload });
      if (cached) {
        addLog(`Operation cached (offline): ${type}`, 'warn');
        return false; // 表示已缓存
      }
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
      return true;
    }
    addLog('Send failed - connection not open', 'warn');
    return false;
  }, [addLog]);

  // 🔥 V2.2 新增：取消当前请求
  const cancelRequest = useCallback(() => {
    addLog('Sending cancel request', 'info');
    return send('debate:cancel', {});
  }, [send, addLog]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      addLog('Initializing WebSocket connection', 'info');
      connect();
    }

    return () => {
      shouldReconnect.current = false;
      clearReconnectTimer();
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.close();
        ws.current = null;
      }
      isConnecting.current = false;
      isManualDisconnect.current = false;
    };
  }, []);

  return {
    send,
    cancelRequest,  // 🔥 V2.2 新增
    disconnect,
    manualReconnect,
    reconnectState,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
  };
}
