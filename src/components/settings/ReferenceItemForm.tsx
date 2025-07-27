import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReferenceItem {
  id: string;
  name: string;
}

interface ReferenceItemFormProps {
  tableName: string;
  item?: ReferenceItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Форма для створення/редагування елементів довідників
 */
export const ReferenceItemForm = ({ tableName, item, isOpen, onClose, onSuccess }: ReferenceItemFormProps) => {
  const [name, setName] = useState(item?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Помилка",
        description: "Назва не може бути порожньою",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (item) {
        // Редагування
        const { error } = await supabase
          .from(tableName as any)
          .update({ name: name.trim() })
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: "Успішно",
          description: "Елемент оновлено",
        });
      } else {
        // Створення
        const { error } = await supabase
          .from(tableName as any)
          .insert([{ name: name.trim() }]);

        if (error) throw error;

        toast({
          title: "Успішно", 
          description: "Елемент створено",
        });
      }

      onSuccess();
      onClose();
      setName('');
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти елемент",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setName(item?.name || '');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {item ? 'Редагувати елемент' : 'Додати новий елемент'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введіть назву"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Скасувати
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Збереження...' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};