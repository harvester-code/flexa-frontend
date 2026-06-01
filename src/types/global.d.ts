export {};

declare global {
  interface Window {
    handleSimpleRuleSaved?: (payload: unknown) => void;
  }
}
