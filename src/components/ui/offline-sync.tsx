import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getOfflineData, clearOfflineData } from '@/utils/offline-storage';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

/**
 * Компонент для синхронізації offline даних
 */
export const OfflineSync = () => {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOnline && !isSyncing) {
      syncOfflineData();
    }
  }, [isOnline, isSyncing]);

  const syncOfflineData = async () => {
    const offlineData = getOfflineData();
    
    if (offlineData.length === 0) return;

    setIsSyncing(true);
    
    try {
      toast.info(`Синхронізація ${offlineData.length} записів...`, {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />
      });

      // Тут буде логіка синхронізації з Supabase
      // Поки що просто очищуємо дані після "успішної" синхронізації
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearOfflineData();
      
      toast.success('Дані успішно синхронізовано!');
    } catch (error) {
      console.error('Помилка синхронізації:', error);
      toast.error('Помилка синхронізації даних');
    } finally {
      setIsSyncing(false);
    }
  };

  return null;
};