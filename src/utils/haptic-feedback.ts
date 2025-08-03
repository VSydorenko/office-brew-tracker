/**
 * Симуляція haptic feedback для мобільних пристроїв
 */
export const hapticFeedback = {
  // Легка вібрація для кнопок
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  
  // Середня вібрація для успішних дій
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },
  
  // Сильна вібрація для помилок
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },
  
  // Вібрація для swipe actions
  swipe: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  }
};