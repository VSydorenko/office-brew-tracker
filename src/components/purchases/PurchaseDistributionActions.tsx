import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [amountDialogOpen, setAmountDialogOpen] = useState(false);
  const { toast } = useToast();

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

  /**
   * Змінити загальну суму покупки
   */
  const handleAmountChange = async () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Помилка",
        description: "Введіть коректну суму",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ total_amount: amount })
        .eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: "Сума оновлена",
        description: "Загальна сума покупки змінена",
      });
      
      setAmountDialogOpen(false);
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

  /**
   * Перерозподілити після зміни суми
   */
  const handleRedistribute = async () => {
    setIsLoading(true);
    try {
      // Отримуємо поточний розподіл
      const { data: distributions, error: fetchError } = await supabase
        .from('purchase_distributions')
        .select('*')
        .eq('purchase_id', purchaseId);

      if (fetchError) throw fetchError;

      // Перераховуємо суми на основі відсотків
      const updates = distributions?.map(dist => ({
        id: dist.id,
        calculated_amount: (parseFloat(newAmount) * dist.percentage / 100).toFixed(2),
        version: (dist.version || 1) + 1
      }));

      if (updates && updates.length > 0) {
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('purchase_distributions')
            .update({
              calculated_amount: parseFloat(update.calculated_amount),
              version: update.version,
              adjustment_type: 'reallocation'
            })
            .eq('id', update.id);

          if (updateError) throw updateError;
        }
      }

      // Оновлюємо статус покупки
      const { error: statusError } = await supabase
        .from('purchases')
        .update({ 
          total_amount: parseFloat(newAmount),
          distribution_status: 'active'
        })
        .eq('id', purchaseId);

      if (statusError) throw statusError;

      toast({
        title: "Перерозподіл завершено",
        description: "Суми перераховані відповідно до нової загальної суми",
      });
      
      setAmountDialogOpen(false);
      onStatusUpdate();
    } catch (error) {
      console.error('Error redistributing:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося виконати перерозподіл",
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
        <div className="flex gap-2">
          <Dialog open={amountDialogOpen} onOpenChange={setAmountDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Перерозподілити
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Перерозподіл після зміни суми</DialogTitle>
                <DialogDescription>
                  Загальна сума покупки була змінена. Оберіть спосіб обробки зміни.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Нова загальна сума</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleAmountChange}
                  disabled={isLoading}
                >
                  Зберегти без перерозподілу
                </Button>
                <Button 
                  onClick={handleRedistribute}
                  disabled={isLoading}
                >
                  Перерозподілити пропорційно
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};