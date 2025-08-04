import { Badge } from "@/components/ui/badge";
import { Lock, Clock, CheckCircle, AlertTriangle } from "lucide-react";

/**
 * Тип статусу розподілу покупки
 */
type DistributionStatus = 'draft' | 'active' | 'locked' | 'amount_changed';

interface PurchaseStatusBadgeProps {
  status: DistributionStatus;
  className?: string;
}

/**
 * Компонент для відображення статусу розподілу покупки
 */
export const PurchaseStatusBadge = ({ status, className }: PurchaseStatusBadgeProps) => {
  const getStatusConfig = (status: DistributionStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Чернетка',
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-muted text-muted-foreground'
        };
      case 'active':
        return {
          label: 'До оплати',
          variant: 'default' as const,
          icon: AlertTriangle,
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
        };
      case 'locked':
        return {
          label: 'Оплачено',
          variant: 'secondary' as const,
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        };
      case 'amount_changed':
        return {
          label: 'Потребує перерозподілу',
          variant: 'destructive' as const,
          icon: Lock,
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
        };
      default:
        return {
          label: 'Невідомий',
          variant: 'secondary' as const,
          icon: AlertTriangle,
          className: 'bg-muted text-muted-foreground'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} flex items-center gap-1`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};