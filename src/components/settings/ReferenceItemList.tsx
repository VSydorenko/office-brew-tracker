import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ReferenceItemForm } from './ReferenceItemForm';
import { MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import { useReferenceTable, type ReferenceTableName } from '@/hooks/use-reference-tables';

interface ReferenceItem {
  id: string;
  name: string;
}

interface ReferenceItemListProps {
  tableName: ReferenceTableName;
}

/**
 * Список елементів довідкової таблиці з можливістю редагування та видалення.
 * Дані завантажуються через React Query, оновлення інвалідовуються автоматично.
 */
export const ReferenceItemList = ({ tableName }: ReferenceItemListProps) => {
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const { items, isLoading, deleteItem, isDeleting } = useReferenceTable(tableName);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        Елементи відсутні
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                <Badge variant="outline" className="text-xs">
                  ID: {item.id.slice(0, 8)}...
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border border-border">
                <DropdownMenuItem onClick={() => setEditingItem(item)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Редагувати
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Видалити
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Видалити елемент?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ця дія незворотна. Елемент "{item.name}" буде видалений назавжди.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteItem(item.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Видалити
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати елемент</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ReferenceItemForm
              tableName={tableName}
              item={editingItem}
              onSuccess={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
