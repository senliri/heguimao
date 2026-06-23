import { useState, useEffect, useCallback } from "react";

/**
 * Reactive localStorage wrapper that notifies subscribers when a key changes.
 * Solves the problem that localStorage.setItem() doesn't trigger React state updates
 * in the same tab (storage event only fires in OTHER tabs).
 */
export function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  const updateValue = useCallback((val: T) => {
    setValue(val);
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event('local-storage-change'));
  }, [key]);

  useEffect(() => {
    const handler = () => {
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          setValue(JSON.parse(stored));
        }
      } catch {}
    };
    window.addEventListener('local-storage-change', handler);
    return () => window.removeEventListener('local-storage-change', handler);
  }, [key]);

  return [value, updateValue] as const;
}
