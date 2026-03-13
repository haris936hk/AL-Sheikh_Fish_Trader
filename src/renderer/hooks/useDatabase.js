import { useState, useEffect } from 'react';

/**
 * @deprecated This hook relies on raw SQL IPC which has been removed for security.
 * Use the domain-specific APIs in `window.api` (e.g. `window.api.settings`) or the Zustand store.
 */
export function useDatabase(_initialQuery = null, _initialParams = []) {
  throw new Error(
    'useDatabase is deprecated and removed for security. Please use domain-specific APIs.'
  );
}

/**
 * Hook to get app version
 */
export function useAppVersion() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    window.api.app
      .getVersion()
      .then((v) => {
        setVersion(v);
        return v;
      })
      .catch((err) => console.error('Failed to get version:', err));
  }, []);

  return version;
}

/**
 * Hook to get platform
 */
export function usePlatform() {
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    window.api.app
      .getPlatform()
      .then((p) => {
        setPlatform(p);
        return p;
      })
      .catch((err) => console.error('Failed to get platform:', err));
  }, []);

  return platform;
}
