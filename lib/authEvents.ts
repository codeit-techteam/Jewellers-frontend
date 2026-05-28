type AuthResetListener = () => void;

const listeners = new Set<AuthResetListener>();

/** Subscribe to logout / session reset (e.g. reset navigation guards). */
export function onAuthReset(listener: AuthResetListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitAuthReset(): void {
  for (const listener of listeners) {
    listener();
  }
}
