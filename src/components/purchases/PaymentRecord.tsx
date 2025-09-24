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
    <div className={`flex justify-between items-center p-3 rounded-md ${
      debt.is_paid ? 'bg-green-50 dark:bg-green-950' : 
      isOverdue ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' :
      'bg-muted/50'
    }`}>
      <div className="flex items-center gap-3 flex-1">
        {showBuyerInfo && (
          <Avatar className="w-8 h-8">
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
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Частки: {debt.shares || 'н/д'}</span>
          <span className="font-medium text-foreground">₴{amount.toFixed(2)}</span>
          
          {debt.is_paid && debt.paid_at && (
            <span className="text-green-600 text-xs">
              Оплачено {new Date(debt.paid_at).toLocaleDateString('uk-UA')}
            </span>
          )}
        </div>
        
        {debt.notes && (
          <p className="text-xs text-muted-foreground mt-1">
            {debt.notes}
          </p>
        )}
        
        {/* Показуємо номер карти для неоплачених боргів */}
        {!debt.is_paid && (
          <>
            {/* Карта покупця для секції "Я винен" */}
            {showBuyerInfo && debt.purchases?.profiles?.card_number && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Карта для переказу:</p>
                <CardNumberDisplay 
                  cardNumber={debt.purchases.profiles.card_number}
                  cardHolderName={debt.purchases.profiles.card_holder_name}
                  className="text-xs"
                  defaultMasked={true}
                />
              </div>
            )}
            
            {/* Карта боржника для секції "Мені винні" */}
            {!showBuyerInfo && debt.profiles?.card_number && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Карта для переказу:</p>
                <CardNumberDisplay 
                  cardNumber={debt.profiles.card_number}
                  cardHolderName={debt.profiles.card_holder_name}
                  className="text-xs"
                  defaultMasked={true}
                />
              </div>
            )}
          </>
        )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
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
            className="text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {showBuyerInfo ? 'Отримано' : 'Сплачено'}
          </Button>
        )}
      </div>
    </div>
  );
};