import { useState, useEffect } from 'react';

/**
 * Хук для відстеження статусу з'єднання з інтернетом
 */
export function useOnlineStatus() {
  // На сервері та до гідратації вважаємо, що зʼєднання є
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}