import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, Trash2, Loader2 } from 'lucide-react';

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

interface Purchase {
  id: string;
  date: string;
  total_amount: number;
  notes?: string;
  buyer_id: string;
  driver_id?: string;
  purchase_items: PurchaseItem[];
}

interface PurchaseEditDialogProps {
  purchaseId: string;
  onSuccess?: () => void;
}

/**
 * Діалог для редагування існуючої покупки кави
 * @param purchaseId - ID покупки для редагування
 * @param onSuccess - функція зворотного виклику після успішного оновлення
 */
export const PurchaseEditDialog = ({ purchaseId, onSuccess }: PurchaseEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    total_amount: 0,
    notes: '',
    buyer_id: '',
    driver_id: '',
  });
  const { toast } = useToast();

  // Завантаження даних покупки
  const fetchPurchaseData = async () => {
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

  // Ініціалізація даних форми
  useEffect(() => {
    if (open) {
      fetchPurchaseData();
    }
  }, [open, purchaseId]);

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
        description: "Не вдалося завантажити профілі",
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
        description: "Не вдалося завантажити типи кави",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchProfiles();
      fetchCoffeeTypes();
    }
  };

  const addPurchaseItem = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        coffee_type_id: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]);
  };

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Автоматично розрахувати загальну ціну позиції
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const unitPrice = field === 'unit_price' ? value : (updatedItems[index].unit_price || 0);
      updatedItems[index].total_price = quantity * unitPrice;
    }

    setPurchaseItems(updatedItems);

    // Автоматично оновити загальну суму покупки
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    setFormData(prev => ({ ...prev, total_amount: totalAmount }));
  };

  const removePurchaseItem = (index: number) => {
    const updatedItems = purchaseItems.filter((_, i) => i !== index);
    setPurchaseItems(updatedItems);

    // Оновити загальну суму
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
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

      // Оновити основну покупку
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

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити покупку",
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Редагувати
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редагувати покупку</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Дата покупки</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Загальна сума (₴)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer_id">Покупець</Label>
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

            <div className="space-y-2">
              <Label htmlFor="driver_id">Водій (опціонально)</Label>
              <Select value={formData.driver_id} onValueChange={(value) => setFormData(prev => ({ ...prev, driver_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть водія" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без водія</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Позиції покупки</Label>
              <Button type="button" onClick={addPurchaseItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Додати позицію
              </Button>
            </div>

            <div className="space-y-3">
              {purchaseItems.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="space-y-2">
                      <Label>Тип кави</Label>
                      <Select
                        value={item.coffee_type_id}
                        onValueChange={(value) => updatePurchaseItem(index, 'coffee_type_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Оберіть каву" />
                        </SelectTrigger>
                        <SelectContent>
                          {coffeeTypes.map((coffee) => (
                            <SelectItem key={coffee.id} value={coffee.id}>
                              {getCoffeeTypeName(coffee.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Кількість</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ціна за одиницю (₴)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price || ''}
                        onChange={(e) => updatePurchaseItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Загальна ціна</Label>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-sm">
                          ₴{(item.total_price || 0).toFixed(2)}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removePurchaseItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Оновити покупку
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};