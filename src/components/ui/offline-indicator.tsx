import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Індикатор offline статусу
 */
export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Card className="fixed top-4 left-4 right-4 z-50 border-destructive/50 bg-destructive/10">
      <CardContent className="flex items-center gap-2 p-3">
        <WifiOff className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive font-medium">
          Немає з'єднання з інтернетом
        </span>
      </CardContent>
    </Card>
  );
};