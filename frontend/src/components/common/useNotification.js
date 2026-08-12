// frontend/src/components/common/useNotification.js
import { useState, useCallback } from 'react';

export function useNotification() {
  const [notif, setNotif] = useState(null);

  const notify = useCallback((type, message) => {
    setNotif({ type, message });
  }, []);

  const clear = useCallback(() => setNotif(null), []);

  return { notif, notify, clear };
}
