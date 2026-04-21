import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  useLockPurchase,
  useUnlockPurchase,
  useRedistributePurchase,
  useCreateAdditionalPayments,
} from '@/hooks/use-purchases';

interface PurchaseDistributionActionsProps {
  purchaseId: string;
  currentStatus: string;
  totalAmount: number;
  onStatusUpdate: () => void;
}

/**
 * Компонент для дій з розподілом покупки.
 * Використовує React Query мутації замість прямих Supabase викликів.
 */
export const PurchaseDistributionActions = ({
  purchaseId,
  currentStatus,
  totalAmount,
  onStatusUpdate,
}: PurchaseDistributionActionsProps) => {
  const [showAmountChangeDialog, setShowAmountChangeDialog] = useState(false);
  const [originalAmount, setOriginalAmount] = useState<number>(0);
  const { toast } = useToast();

  const lockMutation = useLockPurchase();
  const unlockMutation = useUnlockPurchase();
  const redistributeMutation = useRedistributePurchase();
  const additionalPaymentsMutation = useCreateAdditionalPayments();

  const isLoading =
    lockMutation.isPending ||
    unlockMutation.isPending ||
    redistributeMutation.isPending ||
    additionalPaymentsMutation.isPending;

  // Завантажуємо оригінальну суму покупки коли з'являється статус amount_changed
  useEffect(() => {
    if (currentStatus !== 'amount_changed') return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('original_total_amount')
        .eq('id', purchaseId)
        .single();

      if (!cancelled && !error && data) {
        setOriginalAmount(data.original_total_amount || 0);
        setShowAmountChangeDialog(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentStatus, purchaseId]);

  /**
   * Зафіксувати розподіл (перевести в статус 'active')
   */
  const handleLockDistribution = () => {
    lockMutation.mutate(purchaseId, {
      onSuccess: () => onStatusUpdate(),
    });
  };

  /**
   * Розблокувати розподіл для змін
   */
  const handleUnlockDistribution = () => {
    unlockMutation.mutate(purchaseId, {
      onSuccess: () => onStatusUpdate(),
    });
  };

  /**
   * Зберегти нову суму без перерозподілу
   */
  const handleSaveAmount = async () => {
    const { error } = await supabase
      .from('purchases')
      .update({
        total_amount: totalAmount,
        distribution_status: 'active',
        original_total_amount: null,
      })
      .eq('id', purchaseId);

    if (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити суму',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Сума оновлена',
      description: 'Загальна сума покупки змінена',
    });
    setShowAmountChangeDialog(false);
    onStatusUpdate();
  };

  /**
   * Перерозподілити суми за існуючими відсотками
   */
  const handleRedistribute = () => {
    redistributeMutation.mutate(
      { purchaseId, newTotalAmount: totalAmount },
      {
        onSuccess: () => {
          setShowAmountChangeDialog(false);
          onStatusUpdate();
        },
      }
    );
  };

  /**
   * Створити окремі записи доплати/повернення для всіх користувачів
   */
  const handleCreateAdditionalPayments = () => {
    additionalPaymentsMutation.mutate(
      { purchaseId, oldAmount: originalAmount, newAmount: totalAmount },
      {
        onSuccess: () => {
          setShowAmountChangeDialog(false);
          onStatusUpdate();
        },
      }
    );
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {currentStatus === 'draft' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" size="sm" disabled={isLoading}>
              <Lock className="h-4 w-4 mr-2" />
              Зафіксувати розподіл
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Зафіксувати розподіл?</AlertDialogTitle>
              <AlertDialogDescription>
                Після фіксації розподілу покупка перейде в статус "До оплати" і користувачі зможуть
                відмічати свої оплати. Змінити розподіл буде можливо тільки після розблокування.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Скасувати</AlertDialogCancel>
              <AlertDialogAction onClick={handleLockDistribution} disabled={isLoading}>
                Зафіксувати
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {(currentStatus === 'active' || currentStatus === 'locked') && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <Unlock className="h-4 w-4 mr-2" />
              Розблокувати для змін
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Розблокувати розподіл?</AlertDialogTitle>
              <AlertDialogDescription>
                {currentStatus === 'locked'
                  ? 'Увага! Розблокування заблокованого розподілу може призвести до неузгодженості оплат. Переконайтеся, що це необхідно.'
                  : 'Розблокування дозволить змінювати розподіл, але може вплинути на поточні оплати.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Скасувати</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnlockDistribution} disabled={isLoading}>
                Розблокувати
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {currentStatus === 'amount_changed' && (
        <Dialog open={showAmountChangeDialog} onOpenChange={setShowAmountChangeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Зміна суми покупки</DialogTitle>
              <DialogDescription>
                Сума покупки була змінена. Оберіть дію для оновлення розподілу:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-2">Інформація про зміну:</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Попередня сума: <strong>₴{originalAmount.toFixed(2)}</strong>
                  </div>
                  <div>
                    Нова сума: <strong>₴{totalAmount.toFixed(2)}</strong>
                  </div>
                  <div>
                    Різниця:{' '}
                    <strong className={totalAmount > originalAmount ? 'text-red-600' : 'text-green-600'}>
                      {totalAmount > originalAmount ? '+' : ''}₴{(totalAmount - originalAmount).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2 text-green-700">Зберегти нову суму</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Просто оновити загальну суму покупки без зміни розподілу
                  </p>
                  <Button onClick={handleSaveAmount} className="w-full" variant="outline" disabled={isLoading}>
                    Зберегти суму
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2 text-blue-700">Перерозподілити</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Автоматично перерахувати розподіл за існуючими відсотками
                  </p>
                  <Button onClick={handleRedistribute} className="w-full" disabled={isLoading}>
                    Перерозподілити
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2 text-orange-700">Створити доплату/повернення</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Створити окремі записи доплати або повернення для кожного користувача
                  </p>
                  <Button
                    onClick={handleCreateAdditionalPayments}
                    className="w-full"
                    variant="secondary"
                    disabled={isLoading}
                  >
                    Створити доплату/повернення
                  </Button>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
