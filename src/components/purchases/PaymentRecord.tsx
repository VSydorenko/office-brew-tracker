import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

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

  return (
    <div className={`flex justify-between items-center p-3 rounded-md ${
      debt.is_paid ? 'bg-green-50 dark:bg-green-950' : 
      isOverdue ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' :
      'bg-muted/50'
    }`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {showBuyerInfo && debt.purchases?.profiles?.name && (
            <span className="font-medium text-sm">
              {debt.purchases.profiles.name}
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
          <span>Частка: {debt.percentage}%</span>
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