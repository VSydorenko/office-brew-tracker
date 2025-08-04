import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/ui/auth-provider';
import { 
  showDebtNotification, 
  showPurchaseStatusNotification,
  showAdjustmentNotification,
  showUrgentDebtNotification,
  requestNotificationPermission,
  isNotificationSupported
} from '@/utils/notifications';

/**
 * Хук для управління системою сповіщень
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Налаштування реалтайм підписок
  useEffect(() => {
    if (!user || !isEnabled) return;

    // Підписка на нові розподіли (нові борги)
    const distributionsChannel = supabase
      .channel('purchase_distributions_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchase_distributions',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const distribution = payload.new;
          
          // Отримати дані покупки
          const { data: purchase } = await supabase
            .from('purchases')
            .select(`
              date,
              total_amount,
              profiles!purchases_buyer_id_fkey(name)
            `)
            .eq('id', distribution.purchase_id)
            .single();

          if (purchase && distribution.user_id !== purchase.buyer_id) {
            await showDebtNotification(
              distribution.calculated_amount || distribution.adjusted_amount || 0,
              purchase.profiles?.name || 'Невідомо',
              purchase.date
            );
          }
        }
      )
      .subscribe();

    // Підписка на зміни статусу покупок
    const purchasesChannel = supabase
      .channel('purchases_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'purchases'
        },
        async (payload) => {
          const oldPurchase = payload.old;
          const newPurchase = payload.new;
          
          // Перевіряємо, чи змінився статус
          if (oldPurchase.distribution_status !== newPurchase.distribution_status) {
            // Перевіряємо, чи користувач пов'язаний з цією покупкою
            const { data: distributions } = await supabase
              .from('purchase_distributions')
              .select('user_id')
              .eq('purchase_id', newPurchase.id)
              .eq('user_id', user.id);

            if (distributions && distributions.length > 0) {
              await showPurchaseStatusNotification(
                newPurchase.distribution_status,
                newPurchase.date,
                newPurchase.total_amount
              );
            }
          }
        }
      )
      .subscribe();

    // Підписка на зміни розподілів (доплати/повернення)
    const adjustmentsChannel = supabase
      .channel('adjustments_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'purchase_distributions',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          const distribution = payload.new;
          
          if (distribution.adjustment_type && 
              (distribution.adjustment_type === 'charge' || distribution.adjustment_type === 'refund')) {
            
            const { data: purchase } = await supabase
              .from('purchases')
              .select('date')
              .eq('id', distribution.purchase_id)
              .single();

            if (purchase) {
              await showAdjustmentNotification(
                distribution.adjustment_type,
                distribution.calculated_amount,
                purchase.date
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(distributionsChannel);
      supabase.removeChannel(purchasesChannel);
      supabase.removeChannel(adjustmentsChannel);
    };
  }, [user, isEnabled]);

  // Перевірка термінових боргів раз на день
  useEffect(() => {
    if (!user || !isEnabled) return;

    const checkUrgentDebts = async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: urgentDebts } = await supabase
        .from('purchase_distributions')
        .select(`
          calculated_amount,
          adjusted_amount,
          purchases!inner(date)
        `)
        .eq('user_id', user.id)
        .eq('is_paid', false)
        .lt('purchases.date', weekAgo.toISOString().split('T')[0]);

      if (urgentDebts && urgentDebts.length > 0) {
        const totalAmount = urgentDebts.reduce((sum, debt) => 
          sum + (debt.adjusted_amount || debt.calculated_amount), 0);
        
        await showUrgentDebtNotification(totalAmount, urgentDebts.length);
      }
    };

    // Перевіряємо відразу та потім раз на день
    checkUrgentDebts();
    const interval = setInterval(checkUrgentDebts, 24 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, isEnabled]);

  const enableNotifications = async (): Promise<boolean> => {
    try {
      const permission = await requestNotificationPermission();
      setPermission(permission);
      setIsEnabled(permission === 'granted');
      return permission === 'granted';
    } catch (error) {
      console.error('Помилка запиту дозволу на сповіщення:', error);
      return false;
    }
  };

  const disableNotifications = () => {
    setIsEnabled(false);
  };

  return {
    isSupported: isNotificationSupported(),
    isEnabled,
    permission,
    enableNotifications,
    disableNotifications
  };
};