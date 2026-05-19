import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(0);
  const lastArgs = useRef<any[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      lastArgs.current = args;
      const now = Date.now();

      if (lastRun.current === 0 || now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...lastArgs.current);
        }, delay - (now - lastRun.current));
      }
    },
    [callback, delay]
  ) as T;
}