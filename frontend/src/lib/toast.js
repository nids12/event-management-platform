const listeners = new Set();

export function showToast(message, type = "info") {
  const payload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    type,
  };

  listeners.forEach((listener) => listener(payload));
}

export function subscribeToToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
