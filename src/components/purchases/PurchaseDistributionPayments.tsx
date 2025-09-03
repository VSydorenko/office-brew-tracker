import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
import { getAvatarUrl, optimizeGoogleAvatarUrl } from '@/utils/avatar';
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
  profiles: { name: string; email: string; avatar_path?: string; avatar_url?: string };
}

interface PurchaseDistributionPaymentsProps {
  purchaseId: string;
  distributions: PurchaseDistribution[];
  currentStatus: string;
  buyerId: string;
  onPaymentUpdate: () => void;
}

/**
 * Компонент для управління оплатами в розподілі покупки
 */
export const PurchaseDistributionPayments = ({
  purchaseId,
  distributions,
  currentStatus,
  buyerId,
  onPaymentUpdate
}: PurchaseDistributionPaymentsProps) => {
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    distributionId: string;
    action: 'mark_paid' | 'mark_unpaid';
    userName: string;
    amount: number;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Автоматично відмічати покупця як оплаченого
  useEffect(() => {
    const autoPayBuyer = async () => {
      if (!currentUserId || !buyerId || currentUserId !== buyerId) return;
      
      const buyerDistribution = distributions.find(dist => 
        dist.user_id === buyerId && !dist.is_paid
      );
      
      if (buyerDistribution) {
        await handlePaymentChange(buyerDistribution.id, true);
      }
    };
    
    if (currentUserId && buyerId && distributions.length > 0) {
      autoPayBuyer();
    }
  }, [currentUserId, buyerId, distributions]);

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
  
  // Логіка видимості кнопок:
  // - Якщо поточний користувач є покупцем → показувати всі кнопки оплати
  // - Якщо поточний користувач не є покупцем → показувати тільки свої борги
  const canManagePayment = (distributionUserId: string) => {
    if (currentUserId === buyerId) return true; // Покупець може керувати всіма оплатами
    return currentUserId === distributionUserId; // Інші можуть керувати тільки своїми оплатами
  };

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
          const userName = dist.profiles?.name || 'Невідомо';
          
          /**
           * Генерує ініціали з імені користувача
           */
          const getInitials = (name: string): string => {
            return name
              .split(' ')
              .map(word => word.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2);
          };
          
          return (
            <div key={dist.id} className="flex justify-between items-center p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage 
                    src={getAvatarUrl(dist.profiles?.avatar_path) || optimizeGoogleAvatarUrl(dist.profiles?.avatar_url, 32) || undefined} 
                    alt={userName}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {userName}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
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
                </div>
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
                    {!isLocked && canManagePayment(dist.user_id) && (
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
                    {!isLocked && canManagePayment(dist.user_id) && (
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