import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReferenceItem {
  id: string;
  name: string;
}

interface ReferenceItemListProps {
  items: ReferenceItem[];
  tableName: string;
  displayName: string;
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (item: ReferenceItem) => void;
  onAdd: () => void;
}

/**
 * Список елементів довідника з можливістю пошуку, редагування та видалення
 */
export const ReferenceItemList = ({ 
  items, 
  tableName, 
  displayName, 
  isLoading, 
  onRefresh, 
  onEdit, 
  onAdd 
}: ReferenceItemListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteItem, setDeleteItem] = useState<ReferenceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteItem) return;

    setIsDeleting(true);
    try {
      // Перевірка використання елемента в coffee_types
      if (tableName === 'brands') {
        const { data, error } = await supabase
          .from('coffee_types')
          .select('id')
          .eq('brand_id', deleteItem.id)
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
          toast({
            title: "Неможливо видалити",
            description: "Цей бренд використовується в каталозі кави",
            variant: "destructive",
          });
          setDeleteItem(null);
          setIsDeleting(false);
          return;
        }
      }

      // Аналогічні перевірки для інших таблиць
      if (tableName === 'coffee_varieties') {
        const { data, error } = await supabase
          .from('coffee_types')
          .select('id')
          .eq('variety_id', deleteItem.id)
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
          toast({
            title: "Неможливо видалити",
            description: "Цей сорт використовується в каталозі кави",
            variant: "destructive",
          });
          setDeleteItem(null);
          setIsDeleting(false);
          return;
        }
      }

      if (tableName === 'processing_methods') {
        const { data, error } = await supabase
          .from('coffee_types')
          .select('id')
          .eq('processing_method_id', deleteItem.id)
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
          toast({
            title: "Неможливо видалити",
            description: "Цей метод обробки використовується в каталозі кави",
            variant: "destructive",
          });
          setDeleteItem(null);
          setIsDeleting(false);
          return;
        }
      }

      if (tableName === 'flavors') {
        const { data, error } = await supabase
          .from('coffee_flavors')
          .select('id')
          .eq('flavor_id', deleteItem.id)
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
          toast({
            title: "Неможливо видалити",
            description: "Цей смак використовується в каталозі кави",
            variant: "destructive",
          });
          setDeleteItem(null);
          setIsDeleting(false);
          return;
        }
      }

      // Видалення елемента
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', deleteItem.id);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: "Елемент видалено",
      });

      onRefresh();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити елемент",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteItem(null);
    }
  };

  return (
    <Card className="shadow-coffee">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {displayName}
            <Badge variant="secondary">{items.length}</Badge>
          </CardTitle>
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Додати
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Завантаження...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {searchTerm ? 'Нічого не знайдено' : 'Немає елементів'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{item.name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteItem(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Підтвердження видалення</AlertDialogTitle>
              <AlertDialogDescription>
                Ви впевнені, що хочете видалити "{deleteItem?.name}"? 
                Цю дію неможливо скасувати.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Скасувати</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Видалення...' : 'Видалити'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};