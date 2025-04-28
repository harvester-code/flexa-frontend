import { useEffect, useRef } from 'react';

export const useThrottle = (callback: () => void, delay: number) => {
  const lastCall = useRef<number>(0);

  useEffect(() => {
    const handler = () => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback();
      }
    };

    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, [callback, delay]);
};
