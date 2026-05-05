import { useState, useEffect, useRef, useCallback } from 'react';
import type { PieceColor } from '../types';

interface TimerState {
  whiteTime: number;
  blackTime: number;
  isRunning: boolean;
}

interface UseTimerReturn extends TimerState {
  start: (activeColor: PieceColor) => void;
  stop: () => void;
  reset: (seconds: number) => void;
  switchTurn: (activeColor: PieceColor) => void;
  isExpired: boolean;
  expiredColor: PieceColor | null;
}

export function useTimer(initialSeconds: number): UseTimerReturn {
  const [state, setState] = useState<TimerState>({
    whiteTime: initialSeconds,
    blackTime: initialSeconds,
    isRunning: false,
  });
  const [activeColor, setActiveColor] = useState<PieceColor>('w');
  const [expiredColor, setExpiredColor] = useState<PieceColor | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!state.isRunning || initialSeconds === 0) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        const field = activeColor === 'w' ? 'whiteTime' : 'blackTime';
        const next = Math.max(0, prev[field] - 1);

        if (next === 0) {
          setExpiredColor(activeColor);
          clearTimer();
          return { ...prev, [field]: 0, isRunning: false };
        }

        return { ...prev, [field]: next };
      });
    }, 1000);

    return clearTimer;
  }, [state.isRunning, activeColor, initialSeconds, clearTimer]);

  const start = useCallback((color: PieceColor) => {
    setActiveColor(color);
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const stop = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback((seconds: number) => {
    clearTimer();
    setExpiredColor(null);
    setState({ whiteTime: seconds, blackTime: seconds, isRunning: false });
  }, [clearTimer]);

  const switchTurn = useCallback((nextColor: PieceColor) => {
    setActiveColor(nextColor);
  }, []);

  return {
    ...state,
    start,
    stop,
    reset,
    switchTurn,
    isExpired: expiredColor !== null,
    expiredColor,
  };
}
