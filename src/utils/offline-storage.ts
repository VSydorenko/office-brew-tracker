/**
 * Утиліти для роботи з offline даними.
 * Наразі використовується лише для читання/очищення черги (writers видалено як dead code).
 */

interface OfflineData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

const OFFLINE_KEY = 'brew_tracker_offline_data';

/**
 * Отримує збережені offline дані
 */
export const getOfflineData = (): OfflineData[] => {
  try {
    const data = localStorage.getItem(OFFLINE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Помилка читання offline даних:', error);
    return [];
  }
};

/**
 * Очищає збережені offline дані
 */
export const clearOfflineData = (): void => {
  try {
    localStorage.removeItem(OFFLINE_KEY);
  } catch (error) {
    console.error('Помилка очищення offline даних:', error);
  }
};
