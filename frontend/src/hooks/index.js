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
  useEffect(() => { handlerRef.current = handler; }, [handler]);

  useEffect(() => {
    const unsubscribe = socketService.on(event, (...args) => handlerRef.current(...args));
    return unsubscribe;
  }, [event]);
};

// ─── useLocalStorage ──────────────────────────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) { console.error(err); }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// ─── useClickOutside ─────────────────────────────────────────────────────────
export const useClickOutside = (handler) => {
  const ref = useRef(null);
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
  }, [handler]);
  return ref;
};

// ─── useKeyPress ──────────────────────────────────────────────────────────────
export const useKeyPress = (key, handler, deps = []) => {
  useEffect(() => {
    const listener = (e) => { if (e.key === key) handler(e); };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, deps);
};

// ─── useKeyboard (alias with modifier support) ────────────────────────────────
export const useKeyboard = (key, handler, options = {}) => {
  useEffect(() => {
    const listener = (e) => {
      const ctrlMatch  = !options.ctrl  || e.ctrlKey || e.metaKey;
      const shiftMatch = !options.shift || e.shiftKey;
      if (e.key.toLowerCase() === key.toLowerCase() && ctrlMatch && shiftMatch) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [key, handler]);
};
