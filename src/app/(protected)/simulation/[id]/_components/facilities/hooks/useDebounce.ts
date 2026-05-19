import { useCallback, useRef } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [T, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<any[]>([]);
  const isPendingRef = useRef(false);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      isPendingRef.current = false;
    }
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;
      isPendingRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...lastArgsRef.current);
        isPendingRef.current = false;
        timeoutRef.current = null;
      }, delay);
    },
    [callback, delay]
  ) as T;

  return [debouncedCallback, cancel];
}