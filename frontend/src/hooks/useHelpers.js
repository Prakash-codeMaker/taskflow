import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '@/services/socketService';

// ─── useDebounce ──────────────────────────────────────────────────────────────
export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// ─── useSocket ────────────────────────────────────────────────────────────────
export const useSocket = (event, handler) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const cleanup = socketService.on(event, (...args) => handlerRef.current(...args));
    return cleanup;
  }, [event]);
};

// ─── useClickOutside ──────────────────────────────────────────────────────────
export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// ─── useLocalStorage ──────────────────────────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });
  const setValue = useCallback((value) => {
    try {
      const val = value instanceof Function ? value(storedValue) : value;
      setStoredValue(val);
      localStorage.setItem(key, JSON.stringify(val));
    } catch { /* ignore */ }
  }, [key, storedValue]);
  return [storedValue, setValue];
};

// ─── useKeyboard ──────────────────────────────────────────────────────────────
export const useKeyboard = (key, handler, options = {}) => {
  useEffect(() => {
    const listener = (e) => {
      if (
        e.key === key &&
        (!options.ctrl  || e.ctrlKey || e.metaKey) &&
        (!options.shift || e.shiftKey)
      ) {
        e.preventDefault();
        handler(e);
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [key, handler]);
};
