import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_EVENT = 'flexa-local-storage-change';

function subscribe(onStoreChange: () => void) {
  window.addEventListener(STORAGE_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(STORAGE_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

export function useLocalStorageBoolean(key: string, defaultValue = false) {
  const getSnapshot = useCallback(
    () => localStorage.getItem(key) === 'true',
    [key],
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);

  const setValue = useCallback(
    (next: boolean) => {
      localStorage.setItem(key, String(next));
      window.dispatchEvent(new Event(STORAGE_EVENT));
    },
    [key],
  );

  return [value, setValue] as const;
}
