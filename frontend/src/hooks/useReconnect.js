import { useEffect, useRef, useCallback, useState } from 'react';

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 10000;
const BACKOFF_MULTIPLIER = 1.5;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useReconnect(onReconnect, onMaxAttemptsReached) {
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const currentDelay = useRef(INITIAL_RECONNECT_DELAY);
  const isManualReconnect = useRef(false);

  const [reconnectState, setReconnectState] = useState({
    isReconnecting: false,
    attemptCount: 0,
    nextRetryIn: 0,
    isMaxAttemptsReached: false,
    lastError: null,
  });

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  }, []);

  const resetReconnectState = useCallback(() => {
    reconnectAttempts.current = 0;
    currentDelay.current = INITIAL_RECONNECT_DELAY;
    isManualReconnect.current = false;
    setReconnectState({
      isReconnecting: false,
      attemptCount: 0,
      nextRetryIn: 0,
      isMaxAttemptsReached: false,
      lastError: null,
    });
  }, []);

  const manualReconnect = useCallback(() => {
    console.log('[Reconnect] Manual reconnect triggered');
    isManualReconnect.current = true;
    resetReconnectState();
    reconnectAttempts.current = 0;
    currentDelay.current = INITIAL_RECONNECT_DELAY;
    onReconnect?.();
  }, [onReconnect, resetReconnectState]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[Reconnect] Max attempts reached, stopping auto-reconnect');
      setReconnectState(prev => ({
        ...prev,
        isReconnecting: false,
        isMaxAttemptsReached: true,
      }));
      onMaxAttemptsReached?.();
      return;
    }

    reconnectAttempts.current++;
    const delay = currentDelay.current;

    console.log(`[Reconnect] Scheduling reconnect #${reconnectAttempts.current} in ${delay}ms`);

    setReconnectState(prev => ({
      ...prev,
      isReconnecting: true,
      attemptCount: reconnectAttempts.current,
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
      console.log(`[Reconnect] Executing reconnect #${reconnectAttempts.current}`);
      onReconnect?.();

      currentDelay.current = Math.min(
        currentDelay.current * BACKOFF_MULTIPLIER,
        MAX_RECONNECT_DELAY
      );
    }, delay);
  }, [onReconnect, onMaxAttemptsReached]);

  const startReconnect = useCallback(() => {
    clearReconnectTimer();
    isManualReconnect.current = false;
    scheduleReconnect();
  }, [clearReconnectTimer, scheduleReconnect]);

  const stopReconnect = useCallback(() => {
    clearReconnectTimer();
    setReconnectState(prev => ({
      ...prev,
      isReconnecting: false,
    }));
  }, [clearReconnectTimer]);

  useEffect(() => {
    return () => {
      clearReconnectTimer();
    };
  }, [clearReconnectTimer]);

  return {
    reconnectState,
    startReconnect,
    stopReconnect,
    manualReconnect,
    resetReconnectState,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
  };
}
