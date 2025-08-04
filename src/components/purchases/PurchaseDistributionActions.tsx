import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Unlock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PurchaseDistributionActionsProps {
  purchaseId: string;
  currentStatus: string;
  totalAmount: number;
  onStatusUpdate: () => void;
}

/**
 * Компонент для дій з розподілом покупки
 */
export const PurchaseDistributionActions = ({ 
  purchaseId, 
  currentStatus, 
  totalAmount,
  onStatusUpdate 
}: PurchaseDistributionActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [newAmount, setNewAmount] = useState(totalAmount.toString());
  const [showAmountChangeDialog, setShowAmountChangeDialog] = useState(false);
  const [purchase, setPurchase] = useState<any>(null);
  const { toast } = useToast();

  // Оновлюємо newAmount при зміні totalAmount
  useEffect(() => {
    setNewAmount(totalAmount.toString());
  }, [totalAmount]);

  // Завантажуємо дані покупки при зміні статусу
  useEffect(() => {
    if (currentStatus === 'amount_changed') {
      fetchPurchaseData();
      setShowAmountChangeDialog(true);
    }
  }, [currentStatus, purchaseId]);

  const fetchPurchaseData = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (error) throw error;
      setPurchase(data);
    } catch (error) {
      console.error('Error fetching purchase data:', error);
    }
  };

  /**
   * Зафіксувати розподіл (перевести в статус locked)
   */
  const handleLockDistribution = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ 
          distribution_status: 'active'
        })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: "Розподіл зафіксовано",
        description: "Покупка переведена в статус 'До оплати'",
      });
      
      onStatusUpdate();
    } catch (error) {
      console.error('Error locking distribution:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося зафіксувати розподіл",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Розблокувати розподіл для змін
   */
  const handleUnlockDistribution = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ 
          distribution_status: 'draft',
          locked_at: null,
          locked_by: null 
        })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: "Розподіл розблоковано",
        description: "Тепер можна вносити зміни в розподіл",
      });
      
      onStatusUpdate();
    } catch (error) {
      console.error('Error unlocking distribution:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося розблокувати розподіл",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdditionalPayments = async (oldAmount: number, newAmount: number) => {
    try {
      // Отримати поточні розподіли
      const { data: currentDistributions, error: fetchError } = await supabase
        .from('purchase_distributions')
        .select('*')
        .eq('purchase_id', purchaseId);

      if (fetchError) throw fetchError;

      if (!currentDistributions || currentDistributions.length === 0) {
        throw new Error('Розподіли не знайдено');
      }

      const difference = newAmount - oldAmount;
      const isIncrease = difference > 0;

      // Створити додаткові записи для кожного користувача
      const additionalPayments = currentDistributions.map(dist => {
        const additionalAmount = (Math.abs(difference) * dist.percentage) / 100;
        
        return {
          purchase_id: purchaseId,
          user_id: dist.user_id,
          percentage: dist.percentage,
          calculated_amount: additionalAmount,
          adjusted_amount: null,
          is_paid: false,
          version: (dist.version || 1) + 1,
          adjustment_type: isIncrease ? 'charge' : 'refund',
          notes: isIncrease 
            ? `Доплата через збільшення суми покупки з ₴${oldAmount} до ₴${newAmount}`
            : `Повернення через зменшення суми покупки з ₴${oldAmount} до ₴${newAmount}`
        };
      });

      // Вставити додаткові платежі
      const { error: insertError } = await supabase
        .from('purchase_distributions')
        .insert(additionalPayments);

      if (insertError) throw insertError;

      toast({
        title: "Успіх",
        description: isIncrease 
          ? "Створено записи доплати для всіх користувачів"
          : "Створено записи повернення для всіх користувачів",
      });

      return true;
    } catch (error: any) {
      console.error('Error creating additional payments:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити додаткові платежі",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Змінити загальну суму покупки
   */
  const handleAmountChange = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ 
          total_amount: totalAmount,
          distribution_status: 'active',
          original_total_amount: null
        })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: "Сума оновлена",
        description: "Загальна сума покупки змінена",
      });
      
      setShowAmountChangeDialog(false);
      onStatusUpdate();
    } catch (error) {
      console.error('Error updating amount:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити суму",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedistribute = async (newTotalAmount: number) => {
    setIsLoading(true);
    try {
      // Отримуємо поточний розподіл
      const { data: distributions, error: fetchError } = await supabase
        .from('purchase_distributions')
        .select('*')
        .eq('purchase_id', purchaseId);

      if (fetchError) throw fetchError;

      if (!distributions || distributions.length === 0) {
        throw new Error('Розподіли не знайдено');
      }

      // Перераховуємо суми на основі відсотків та нової суми
      const updates = distributions.map(dist => ({
        id: dist.id,
        calculated_amount: (newTotalAmount * dist.percentage) / 100,
        version: (dist.version || 1) + 1
      }));

      // Оновлюємо всі розподіли
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('purchase_distributions')
          .update({
            calculated_amount: update.calculated_amount,
            adjusted_amount: null, // Скидаємо ручні коригування
            version: update.version,
            adjustment_type: 'reallocation'
          })
          .eq('id', update.id);

        if (updateError) throw updateError;
      }

      // Оновлюємо покупку
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({ 
          total_amount: newTotalAmount,
          distribution_status: 'active',
          original_total_amount: null
        })
        .eq('id', purchaseId);

      if (purchaseError) throw purchaseError;

      toast({
        title: "Перерозподіл завершено",
        description: "Суми перераховані відповідно до нової загальної суми",
      });
      
      setShowAmountChangeDialog(false);
      onStatusUpdate();
    } catch (error: any) {
      console.error('Error redistributing:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося виконати перерозподіл",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                  ? "Увага! Розблокування заблокованого розподілу може призвести до неузгодженості оплат. Переконайтеся, що це необхідно."
                  : "Розблокування дозволить змінювати розподіл, але може вплинути на поточні оплати."
                }
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
                  <div>Попередня сума: <strong>₴{(purchase?.original_total_amount || 0).toFixed(2)}</strong></div>
                  <div>Нова сума: <strong>₴{totalAmount.toFixed(2)}</strong></div>
                  <div>Різниця: <strong className={totalAmount > (purchase?.original_total_amount || 0) ? "text-red-600" : "text-green-600"}>
                    {totalAmount > (purchase?.original_total_amount || 0) ? '+' : ''}₴{(totalAmount - (purchase?.original_total_amount || 0)).toFixed(2)}
                  </strong></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2 text-green-700">Зберегти нову суму</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Просто оновити загальну суму покупки без зміни розподілу
                  </p>
                  <Button 
                    onClick={handleAmountChange}
                    className="w-full"
                    variant="outline"
                    disabled={isLoading}
                  >
                    Зберегти суму
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2 text-blue-700">Перерозподілити</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Автоматично перерахувати розподіл за існуючими відсотками
                  </p>
                  <Button 
                    onClick={() => handleRedistribute(totalAmount)}
                    className="w-full"
                    disabled={isLoading}
                  >
                    Перерозподілити
                  </Button>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2 text-orange-700">Створити доплату/повернення</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Створити окремі записи доплати або повернення для кожного користувача
                  </p>
                  <Button 
                    onClick={async () => {
                      const success = await handleCreateAdditionalPayments(
                        purchase?.original_total_amount || 0, 
                        totalAmount
                      );
                      if (success) {
                        await handleAmountChange();
                        onStatusUpdate();
                        setShowAmountChangeDialog(false);
                      }
                    }}
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