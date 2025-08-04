/**
 * Утиліти для роботи з браузерними сповіщеннями
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  silent?: boolean;
  requireInteraction?: boolean;
}

/**
 * Перевіряє підтримку сповіщень у браузері
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Запитує дозвіл на сповіщення
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    throw new Error('Браузер не підтримує сповіщення');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * Показує браузерне сповіщення
 */
export const showNotification = async (options: NotificationOptions): Promise<void> => {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Дозвіл на сповіщення не надано');
    return;
  }

  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/icon-192x192.png',
    badge: options.badge || '/icon-192x192.png',
    tag: options.tag,
    data: options.data,
    silent: options.silent || false,
    requireInteraction: options.requireInteraction || false,
  });

  // Автоматично закрити через 5 секунд якщо не requireInteraction
  if (!options.requireInteraction) {
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  // Обробка натискання на сповіщення
  notification.onclick = () => {
    window.focus();
    notification.close();
    
    // Якщо є дані, можна виконати специфічні дії
    if (options.data?.url) {
      window.location.href = options.data.url;
    }
  };
};

/**
 * Показує сповіщення про новий борг
 */
export const showDebtNotification = async (
  amount: number, 
  buyerName: string, 
  purchaseDate: string
): Promise<void> => {
  await showNotification({
    title: '💰 Новий борг',
    body: `${buyerName} додав покупку на ${amount.toFixed(2)} ₴ від ${new Date(purchaseDate).toLocaleDateString('uk-UA')}`,
    tag: 'new-debt',
    data: { 
      type: 'debt',
      url: '/my-payments'
    },
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Переглянути' },
      { action: 'dismiss', title: 'Закрити' }
    ]
  });
};

/**
 * Показує сповіщення про зміну статусу покупки
 */
export const showPurchaseStatusNotification = async (
  status: string,
  purchaseDate: string,
  totalAmount: number
): Promise<void> => {
  const statusMessages = {
    'active': '✅ Покупка готова до оплати',
    'locked': '🔒 Покупка повністю оплачена',
    'amount_changed': '⚠️ Сума покупки змінена'
  };

  const message = statusMessages[status as keyof typeof statusMessages] || '📝 Статус покупки змінено';

  await showNotification({
    title: message,
    body: `Покупка від ${new Date(purchaseDate).toLocaleDateString('uk-UA')} на ${totalAmount.toFixed(2)} ₴`,
    tag: `purchase-status-${status}`,
    data: { 
      type: 'purchase-status',
      url: '/purchases'
    }
  });
};

/**
 * Показує сповіщення про доплату або повернення
 */
export const showAdjustmentNotification = async (
  type: 'charge' | 'refund',
  amount: number,
  purchaseDate: string
): Promise<void> => {
  const isCharge = type === 'charge';
  
  await showNotification({
    title: isCharge ? '💳 Доплата' : '💸 Повернення',
    body: `${isCharge ? 'Потрібно доплатити' : 'Вам повернуть'} ${amount.toFixed(2)} ₴ за покупку від ${new Date(purchaseDate).toLocaleDateString('uk-UA')}`,
    tag: `adjustment-${type}`,
    data: { 
      type: 'adjustment',
      url: '/my-payments'
    },
    requireInteraction: isCharge // Доплати потребують уваги
  });
};

/**
 * Показує сповіщення про термінові борги (більше тижня)
 */
export const showUrgentDebtNotification = async (
  totalAmount: number,
  debtCount: number
): Promise<void> => {
  await showNotification({
    title: '🚨 Термінові борги',
    body: `У вас є ${debtCount} неоплачених боргів на загальну суму ${totalAmount.toFixed(2)} ₴`,
    tag: 'urgent-debts',
    data: { 
      type: 'urgent-debt',
      url: '/my-payments'
    },
    requireInteraction: true
  });
};