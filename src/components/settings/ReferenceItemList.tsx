import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface ReferenceItem {
  id: string;
  name: string;
  description?: string;
}

interface ReferenceItemListProps {
  tableName: string;
  refreshTrigger?: number;
  onItemUpdated: () => void;
}

/**
 * Список елементів довідкової таблиці з можливістю редагування та видалення
 */
export const ReferenceItemList = ({ tableName, refreshTrigger, onItemUpdated }: ReferenceItemListProps) => {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ReferenceItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [refreshTrigger, tableName]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('*')
        .order('name');

      if (error) throw error;
      setItems((data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description
      })));
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: `Не вдалося завантажити дані з таблиці ${tableName}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      setDeletingId(itemId);
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: "Елемент успішно видалено",
      });

      onItemUpdated();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити елемент",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = () => {
    setEditingItem(null);
    onItemUpdated();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
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
              {item.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              )}
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
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
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
                        onClick={() => handleDelete(item.id)}
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
              itemId={editingItem.id}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};