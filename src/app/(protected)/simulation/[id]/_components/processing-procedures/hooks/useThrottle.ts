import { useCallback, useRef } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const lastArgs = useRef<any[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: any[]) => {
      lastArgs.current = args;
      const now = Date.now();
      
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      } else {
        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Set new timeout to ensure last call is executed
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...lastArgs.current);
        }, delay - (now - lastRun.current));
      }
    }) as T,
    [callback, delay]
  );
}