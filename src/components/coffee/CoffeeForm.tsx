import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface CoffeeFormProps {
  onSuccess?: () => void;
}

export const CoffeeForm = ({ onSuccess }: CoffeeFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    package_size: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Помилка",
        description: "Назва кави є обов'язковою",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('coffee_types')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: "Кава додана до каталогу",
      });

      setFormData({ name: '', brand: '', description: '', package_size: '' });
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося додати каву",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-coffee shadow-brew">
          <Plus className="h-4 w-4 mr-2" />
          Додати каву
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-primary">Додати новий тип кави</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Назва кави *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Наприклад: Арабіка Гватемала"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">Бренд</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Наприклад: Lavazza"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="package_size">Розмір упаковки</Label>
            <Input
              id="package_size"
              value={formData.package_size}
              onChange={(e) => setFormData({ ...formData, package_size: e.target.value })}
              placeholder="Наприклад: 1 кг"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Опис</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Додатковий опис кави..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-coffee"
            >
              {loading ? 'Збереження...' : 'Додати каву'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};