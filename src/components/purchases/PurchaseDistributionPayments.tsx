import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, CreditCard, Clock, Loader2 } from 'lucide-react';

interface PurchaseDistribution {
  id: string;
  user_id: string;
  percentage: number;
  calculated_amount: number;
  adjusted_amount?: number;
  is_paid: boolean;
  paid_at?: string;
  version?: number;
  adjustment_type?: string;
  profiles: { name: string; email: string };
}

interface PurchaseDistributionPaymentsProps {
  purchaseId: string;
  distributions: PurchaseDistribution[];
  currentStatus: string;
  onPaymentUpdate: () => void;
}

/**
 * Компонент для управління оплатами в розподілі покупки
 */
export const PurchaseDistributionPayments = ({
  purchaseId,
  distributions,
  currentStatus,
  onPaymentUpdate
}: PurchaseDistributionPaymentsProps) => {
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    distributionId: string;
    action: 'mark_paid' | 'mark_unpaid';
    userName: string;
    amount: number;
  } | null>(null);
  const { toast } = useToast();

  const handlePaymentChange = async (distributionId: string, isPaid: boolean) => {
    try {
      setLoadingPayment(distributionId);
      
      const updateData: any = {
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('purchase_distributions')
        .update(updateData)
        .eq('id', distributionId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: isPaid 
          ? "Оплату відмічено як виконану"
          : "Оплату відмічено як невиконану",
      });

      onPaymentUpdate();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити статус оплати",
        variant: "destructive",
      });
    } finally {
      setLoadingPayment(null);
      setConfirmDialog(null);
    }
  };

  const openConfirmDialog = (
    distributionId: string,
    action: 'mark_paid' | 'mark_unpaid',
    userName: string,
    amount: number
  ) => {
    setConfirmDialog({
      open: true,
      distributionId,
      action,
      userName,
      amount,
    });
  };

  const getTotalPaidAmount = () => {
    return distributions
      .filter(dist => dist.is_paid)
      .reduce((sum, dist) => sum + (dist.adjusted_amount || dist.calculated_amount), 0);
  };

  const getTotalAmount = () => {
    return distributions.reduce((sum, dist) => sum + (dist.adjusted_amount || dist.calculated_amount), 0);
  };

  const isLocked = currentStatus === 'locked';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">
          Управління оплатами
        </h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Оплачено: ₴{getTotalPaidAmount().toFixed(2)} / ₴{getTotalAmount().toFixed(2)}
          </Badge>
          {getTotalPaidAmount() >= getTotalAmount() && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Повністю оплачено
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {distributions.map((dist) => {
          const finalAmount = dist.adjusted_amount || dist.calculated_amount;
          const isCurrentlyLoading = loadingPayment === dist.id;
          
          return (
            <div key={dist.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {dist.profiles?.name || 'Невідомо'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {dist.percentage}%
                </Badge>
                {dist.version && dist.version > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    v{dist.version}
                  </Badge>
                )}
                {dist.adjustment_type && (
                  <Badge 
                    variant={dist.adjustment_type === 'charge' ? 'destructive' : 
                            dist.adjustment_type === 'refund' ? 'secondary' : 'outline'} 
                    className="text-xs"
                  >
                    {dist.adjustment_type === 'charge' ? 'Доплата' : 
                     dist.adjustment_type === 'refund' ? 'Повернення' : 'Перерозподіл'}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  ₴{finalAmount.toFixed(2)}
                </span>
                
                {dist.is_paid ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Оплачено
                    </Badge>
                    {!isLocked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfirmDialog(dist.id, 'mark_unpaid', dist.profiles?.name || 'Невідомо', finalAmount)}
                        disabled={isCurrentlyLoading}
                      >
                        {isCurrentlyLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Не оплачено
                    </Badge>
                    {!isLocked && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openConfirmDialog(dist.id, 'mark_paid', dist.profiles?.name || 'Невідомо', finalAmount)}
                        disabled={isCurrentlyLoading}
                      >
                        {isCurrentlyLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CreditCard className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Діалог підтвердження */}
      {confirmDialog && (
        <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmDialog.action === 'mark_paid' ? 'Підтвердити оплату' : 'Скасувати оплату'}
              </DialogTitle>
              <DialogDescription>
                {confirmDialog.action === 'mark_paid' ? (
                  <>
                    Ви впевнені, що хочете відмітити оплату як виконану?
                    <br /><br />
                    <strong>Користувач:</strong> {confirmDialog.userName}
                    <br />
                    <strong>Сума:</strong> ₴{confirmDialog.amount.toFixed(2)}
                  </>
                ) : (
                  <>
                    Ви впевнені, що хочете скасувати оплату?
                    <br /><br />
                    <strong>Користувач:</strong> {confirmDialog.userName}
                    <br />
                    <strong>Сума:</strong> ₴{confirmDialog.amount.toFixed(2)}
                    <br /><br />
                    <em className="text-muted-foreground">
                      Увага: це може змінити статус покупки, якщо вона була повністю оплачена.
                    </em>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                Скасувати
              </Button>
              <Button
                onClick={() => {
                  if (confirmDialog) {
                    handlePaymentChange(
                      confirmDialog.distributionId,
                      confirmDialog.action === 'mark_paid'
                    );
                  }
                }}
                variant={confirmDialog.action === 'mark_paid' ? 'default' : 'destructive'}
              >
                {confirmDialog.action === 'mark_paid' ? 'Підтвердити оплату' : 'Скасувати оплату'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};