import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, optimizeGoogleAvatarUrl } from '@/utils/avatar';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { CardNumberDisplay } from '@/components/ui/card-number-display';

interface PaymentRecordProps {
  debt: any;
  onMarkAsPaid: (distributionId: string) => void;
  showBuyerInfo?: boolean;
  showDateInfo?: boolean;
}

/**
 * Компонент для відображення окремого запису оплати/боргу
 */
export const PaymentRecord = ({ debt, onMarkAsPaid, showBuyerInfo = false, showDateInfo = true }: PaymentRecordProps) => {
  const amount = debt.adjusted_amount || debt.calculated_amount;
  const isOverdue = !debt.is_paid && new Date(debt.purchases.date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const getAdjustmentInfo = () => {
    if (debt.adjustment_type === 'charge') {
      return { text: 'Доплата', icon: TrendingUp, variant: 'destructive' as const };
    }
    if (debt.adjustment_type === 'refund') {
      return { text: 'Повернення', icon: TrendingDown, variant: 'secondary' as const };
    }
    if (debt.adjustment_type === 'reallocation') {
      return { text: 'Перерозподіл', icon: Clock, variant: 'outline' as const };
    }
    return null;
  };

  const adjustmentInfo = getAdjustmentInfo();

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

  const buyerName = debt.purchases?.profiles?.name || 'Невідомо';
  
  return (
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-md gap-3 ${
      debt.is_paid ? 'bg-green-50 dark:bg-green-950' : 
      isOverdue ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' :
      'bg-muted/50'
    }`}>
      <div className="flex items-start gap-3 flex-1">
        {showBuyerInfo && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage 
              src={getAvatarUrl(debt.purchases?.profiles?.avatar_path) || optimizeGoogleAvatarUrl(debt.purchases?.profiles?.avatar_url, 32) || undefined} 
              alt={buyerName}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <AvatarFallback className="text-xs">
              {getInitials(buyerName)}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {showBuyerInfo && (
              <span className="font-medium text-sm">
                {buyerName}
              </span>
            )}
            
            {showDateInfo && (
              <span className="font-medium text-sm">
                {new Date(debt.purchases.date).toLocaleDateString('uk-UA')}
              </span>
            )}
            
            {isOverdue && !debt.is_paid && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Прострочено
              </Badge>
            )}
            
            {debt.version && debt.version > 1 && (
              <Badge variant="secondary" className="text-xs">
                v{debt.version}
              </Badge>
            )}
            
            {adjustmentInfo && (
              <Badge variant={adjustmentInfo.variant} className="text-xs">
                <adjustmentInfo.icon className="h-3 w-3 mr-1" />
                {adjustmentInfo.text}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-semibold text-lg text-foreground">₴{amount.toFixed(2)}</span>
            
            {debt.is_paid && debt.paid_at && (
              <span className="text-green-600 text-xs">
                Оплачено {new Date(debt.paid_at).toLocaleDateString('uk-UA')}
              </span>
            )}
          </div>
          
          {debt.notes && (
            <p className="text-xs text-muted-foreground mb-2">
              {debt.notes}
            </p>
          )}
          
          {/* Показуємо номер карти покупця для переказу в секції "Я винен" */}
          {showBuyerInfo && !debt.is_paid && debt.purchases?.profiles?.card_number && (
            <div className="mt-2 p-2 bg-background rounded border">
              <p className="text-xs text-muted-foreground mb-1">Карта для переказу:</p>
              <CardNumberDisplay 
                cardNumber={debt.purchases.profiles.card_number}
                cardHolderName={debt.purchases.profiles.card_holder_name}
                className="text-xs"
                defaultMasked={true}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:flex-shrink-0">
        {debt.is_paid ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Оплачено
          </Badge>
        ) : (
          <Button 
            onClick={() => onMarkAsPaid(debt.id)}
            variant={isOverdue ? "destructive" : "default"}
            size="sm"
            className="text-xs w-full sm:w-auto"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {showBuyerInfo ? 'Оплачено' : 'Отримано'}
          </Button>
        )}
      </div>
    </div>
  );
};