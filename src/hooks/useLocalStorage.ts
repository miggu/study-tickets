import { useCallback } from "react";

export function useLocalStorage() {
  const readStorage = useCallback(<T>(key: string): T | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : null;
    } catch {
      return null;
    }
  }, []);

  const writeStorage = useCallback((key: string, value: unknown) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage writes that fail (quota, private mode, etc).
    }
  }, []);

  return [readStorage, writeStorage] as const;
}
