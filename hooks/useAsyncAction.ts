import { useCallback, useRef } from 'react';

/**
 * Prevents duplicate async calls from rapid button taps.
 * While the action is executing, subsequent calls are silently dropped.
 */
export function useAsyncAction() {
  const isExecuting = useRef(false);

  const execute = useCallback(async (action: () => Promise<void>) => {
    if (isExecuting.current) return;
    isExecuting.current = true;
    try {
      await action();
    } finally {
      isExecuting.current = false;
    }
  }, []);

  return { execute };
}
