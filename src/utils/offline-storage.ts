/**
 * Утиліти для роботи з offline даними
 */

interface OfflineData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

const OFFLINE_KEY = 'brew_tracker_offline_data';

/**
 * Зберігає дані для offline синхронізації
 */
export const saveOfflineData = (type: string, data: any): void => {
  try {
    const existingData = getOfflineData();
    const newItem: OfflineData = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now()
    };
    
    const updatedData = [...existingData, newItem];
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(updatedData));
  } catch (error) {
    console.error('Помилка збереження offline даних:', error);
  }
};

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

/**
 * Видаляє конкретний offline запис
 */
export const removeOfflineData = (id: string): void => {
  try {
    const existingData = getOfflineData();
    const filteredData = existingData.filter(item => item.id !== id);
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(filteredData));
  } catch (error) {
    console.error('Помилка видалення offline даних:', error);
  }
};