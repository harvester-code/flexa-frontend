import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/** Returns true only after client hydration (false during SSR). */
export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
