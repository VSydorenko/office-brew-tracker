import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ReferenceItemList } from './ReferenceItemList';
import { ReferenceItemForm } from './ReferenceItemForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ReferenceTableName } from '@/hooks/use-reference-tables';

interface ReferenceConfig {
  tableName: ReferenceTableName;
  displayName: string;
  icon: React.ReactNode;
}

interface ReferenceTableManagerProps {
  config: ReferenceConfig;
}

/**
 * Менеджер для управління довідковими таблицями.
 * Дані оновлюються автоматично через React Query після мутацій.
 */
export const ReferenceTableManager = ({ config }: ReferenceTableManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <Card className="shadow-coffee">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {config.icon}
            {config.displayName}
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Додати
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Додати {config.displayName.toLowerCase()}</DialogTitle>
              </DialogHeader>
              <ReferenceItemForm
                tableName={config.tableName}
                onSuccess={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <ReferenceItemList tableName={config.tableName} />
      </CardContent>
    </Card>
  );
};
