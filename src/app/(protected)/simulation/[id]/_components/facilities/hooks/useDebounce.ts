import { useCallback, useRef } from 'react';

export function useDebounce<Args extends unknown[], R>(
  callback: (...args: Args) => R,
  delay: number
): [(...args: Args) => void, () => void] {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Args>([] as unknown as Args);
  const isPendingRef = useRef(false);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      isPendingRef.current = false;
    }
  }, []);

  const debouncedCallback = useCallback(
    (...args: Args) => {
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
  );

  return [debouncedCallback, cancel];
}