import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Coffee, Trash2, Edit, Loader2 } from 'lucide-react';
import { UserAvatarPicker } from './UserAvatarPicker';
import { CoffeeCombobox } from './CoffeeCombobox';

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface CoffeeType {
  id: string;
  name: string;
  package_size?: string;
  brand?: string;
}

interface PurchaseItem {
  id?: string;
  coffee_type_id: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  coffee_type?: CoffeeType;
}

interface PurchaseFormDialogProps {
  onSuccess?: () => void;
  purchaseId?: string; // Якщо передано, то режим редагування
  children?: React.ReactNode; // Для кастомного тригера
}

/**
 * Універсальний діалог для створення та редагування покупок кави
 * @param onSuccess - функція зворотного виклику після успішної операції
 * @param purchaseId - ID покупки для редагування (опціонально)
 * @param children - кастомний тригер для діалогу
 */
export const PurchaseFormDialog = ({ onSuccess, purchaseId, children }: PurchaseFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    total_amount: 0,
    notes: '',
    buyer_id: '',
    driver_id: '',
  });
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const { toast } = useToast();

  const isEditMode = !!purchaseId;

  // Завантаження даних покупки для редагування
  const fetchPurchaseData = async () => {
    if (!purchaseId) return;
    
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          purchase_items(
            id,
            coffee_type_id,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', purchaseId)
        .single();

      if (error) throw error;

      setFormData({
        date: data.date,
        total_amount: data.total_amount,
        notes: data.notes || '',
        buyer_id: data.buyer_id,
        driver_id: data.driver_id || '',
      });
      setPurchaseItems(data.purchase_items || []);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити дані покупки",
        variant: "destructive",
      });
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити список користувачів",
        variant: "destructive",
      });
    }
  };

  const fetchCoffeeTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('coffee_types')
        .select(`
          id, 
          name, 
          package_size,
          brand
        `)
        .order('name');

      if (error) throw error;
      setCoffeeTypes(data || []);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити каталог кави",
        variant: "destructive",
      });
    }
  };

  // Отримання поточного користувача
  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  };

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      const user = await getCurrentUser();
      fetchProfiles();
      fetchCoffeeTypes();
      
      if (isEditMode) {
        fetchPurchaseData();
      } else {
        // Скинути форму для нової покупки з автопідстановкою поточного користувача
        setFormData({
          date: new Date().toISOString().split('T')[0],
          total_amount: 0,
          notes: '',
          buyer_id: user?.id || '',
          driver_id: user?.id || '',
        });
        setPurchaseItems([]);
      }
    }
  };

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, {
      coffee_type_id: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    }]);
  };

  // Функція для створення нового типу кави
  const createNewCoffeeType = async (name: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('coffee_types')
        .insert([{ name: name.trim() }])
        .select()
        .single();

      if (error) throw error;

      // Оновити список типів кави
      await fetchCoffeeTypes();
      
      toast({
        title: "Успіх",
        description: `Новий тип кави "${name}" створено`,
      });

      return data.id;
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: "Не вдалося створити новий тип кави",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Автоматично розрахувати загальну ціну для позиції (завжди quantity = 1)
    if (field === 'unit_price') {
      updatedItems[index].quantity = 1;
      updatedItems[index].total_price = value || 0;
    }
    
    setPurchaseItems(updatedItems);
    
    // Оновити загальну суму покупки
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.unit_price || 0), 0);
    setFormData(prev => ({ ...prev, total_amount: totalAmount }));
  };

  const removePurchaseItem = (index: number) => {
    const updatedItems = purchaseItems.filter((_, i) => i !== index);
    setPurchaseItems(updatedItems);
    
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.unit_price || 0), 0);
    setFormData(prev => ({ ...prev, total_amount: totalAmount }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.buyer_id) {
      toast({
        title: "Помилка",
        description: "Оберіть покупця",
        variant: "destructive",
      });
      return;
    }

    if (formData.total_amount <= 0) {
      toast({
        title: "Помилка",
        description: "Загальна сума повинна бути більше 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (isEditMode) {
        // Режим редагування
        const { error: purchaseError } = await supabase
          .from('purchases')
          .update({
            date: formData.date,
            total_amount: formData.total_amount,
            notes: formData.notes || null,
            buyer_id: formData.buyer_id,
            driver_id: formData.driver_id || null,
          })
          .eq('id', purchaseId);

        if (purchaseError) throw purchaseError;

        // Видалити всі існуючі позиції покупки
        const { error: deleteError } = await supabase
          .from('purchase_items')
          .delete()
          .eq('purchase_id', purchaseId);

        if (deleteError) throw deleteError;

        // Додати нові позиції покупки
        if (purchaseItems.length > 0) {
          const itemsToInsert = purchaseItems
            .filter(item => item.coffee_type_id)
            .map(item => ({
              purchase_id: purchaseId,
              coffee_type_id: item.coffee_type_id,
              quantity: item.quantity,
              unit_price: item.unit_price || null,
              total_price: item.total_price || null,
            }));

          if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase
              .from('purchase_items')
              .insert(itemsToInsert);

            if (itemsError) throw itemsError;
          }
        }

        toast({
          title: "Успіх",
          description: "Покупку успішно оновлено",
        });
      } else {
        // Режим створення
        const { data: purchase, error: purchaseError } = await supabase
          .from('purchases')
          .insert([{
            date: formData.date,
            buyer_id: formData.buyer_id,
            driver_id: formData.driver_id || null,
            total_amount: formData.total_amount,
            notes: formData.notes || null,
          }])
          .select()
          .single();

        if (purchaseError) throw purchaseError;

        // Створити позиції покупки, якщо є
        if (purchaseItems.length > 0) {
          const itemsToInsert = purchaseItems
            .filter(item => item.coffee_type_id && item.quantity > 0)
            .map(item => ({
              purchase_id: purchase.id,
              coffee_type_id: item.coffee_type_id,
              quantity: item.quantity,
              unit_price: item.unit_price && item.unit_price > 0 ? item.unit_price : null,
              total_price: item.total_price && item.total_price > 0 ? item.total_price : null,
            }));

          if (itemsToInsert.length > 0) {
            const { error: itemsError } = await supabase
              .from('purchase_items')
              .insert(itemsToInsert);

            if (itemsError) throw itemsError;
          }
        }

        toast({
          title: "Успіх",
          description: "Покупка успішно додана",
        });
      }

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || `Не вдалося ${isEditMode ? 'оновити' : 'створити'} покупку`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCoffeeTypeName = (coffeeTypeId: string) => {
    const coffee = coffeeTypes.find(c => c.id === coffeeTypeId);
    if (!coffee) return '';
    return coffee.brand ? `${coffee.name} (${coffee.brand})` : coffee.name;
  };

  const defaultTrigger = (
    <Button className="bg-gradient-coffee shadow-brew">
      <Plus className="h-4 w-4 mr-2" />
      Додати покупку
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-primary">
            {isEditMode ? 'Редагувати покупку' : 'Нова покупка кави'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            {/* Основна інформація - спочатку сума, потім дата */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_amount">Загальна сума (₴) *</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                  required
                  autoFocus={!isEditMode}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm text-muted-foreground">Дата покупки</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buyer_id">Покупець *</Label>
                  <Select value={formData.buyer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, buyer_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть покупця" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <UserAvatarPicker
                  selectedUserId={formData.buyer_id}
                  onUserSelect={(userId) => setFormData(prev => ({ ...prev, buyer_id: userId }))}
                  label="Швидкий вибір покупця"
                  compact
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="driver_id">Водій (опціонально)</Label>
                  <Select value={formData.driver_id} onValueChange={(value) => setFormData(prev => ({ ...prev, driver_id: value === 'none' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть водія" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без водія</SelectItem>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <UserAvatarPicker
                  selectedUserId={formData.driver_id}
                  onUserSelect={(userId) => setFormData(prev => ({ ...prev, driver_id: userId }))}
                  label="Швидкий вибір водія"
                  compact
                />
              </div>
            </div>

            {/* Позиції покупки */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Позиції покупки</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPurchaseItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Додати позицію
                </Button>
              </div>

              <div className="space-y-3">
                {purchaseItems.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Назва кави</Label>
                        <CoffeeCombobox
                          coffeeTypes={coffeeTypes}
                          value={item.coffee_type_id}
                          onValueChange={(value) => updatePurchaseItem(index, 'coffee_type_id', value)}
                          onCreateNew={createNewCoffeeType}
                          placeholder="Оберіть або введіть назву кави..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Ціна за упаковку (₴)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price || ''}
                          onChange={(e) => updatePurchaseItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex justify-end items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removePurchaseItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Нотатки */}
            <div className="space-y-2">
              <Label htmlFor="notes">Нотатки (опціонально)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Додаткова інформація про покупку..."
                rows={3}
              />
            </div>
          </form>
        </div>

        {/* Sticky footer з кнопками */}
        <div className="border-t bg-background p-4 mt-auto">
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              onClick={handleSubmit}
              className="bg-gradient-coffee"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? 'Оновити покупку' : 'Створити покупку'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};