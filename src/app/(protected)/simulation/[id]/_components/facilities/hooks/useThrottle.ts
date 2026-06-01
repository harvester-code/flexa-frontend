import { useCallback, useRef } from 'react';

export function useThrottle<Args extends unknown[], R>(
  callback: (...args: Args) => R,
  delay: number
): (...args: Args) => void {
  const lastRun = useRef(0);
  const lastArgs = useRef<Args>([] as unknown as Args);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Args) => {
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
  );
}
