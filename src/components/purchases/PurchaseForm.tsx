import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Coffee, Trash2 } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface CoffeeType {
  id: string;
  name: string;
  brand?: string;
  package_size?: string;
}

interface PurchaseItem {
  coffee_type_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PurchaseFormProps {
  onSuccess?: () => void;
}

export const PurchaseForm = ({ onSuccess }: PurchaseFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [coffeeTypes, setCoffeeTypes] = useState<CoffeeType[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    buyer_id: '',
    driver_id: '',
    total_amount: 0,
    notes: '',
  });

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchProfiles();
      fetchCoffeeTypes();
    }
  }, [open]);

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
        .select('id, name, brand, package_size')
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

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, {
      coffee_type_id: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    }]);
  };

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Автоматично розрахувати загальну ціну для позиції
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setPurchaseItems(updatedItems);
    
    // Оновити загальну суму покупки
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    setFormData({ ...formData, total_amount: totalAmount });
  };

  const removePurchaseItem = (index: number) => {
    const updatedItems = purchaseItems.filter((_, i) => i !== index);
    setPurchaseItems(updatedItems);
    
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
    setFormData({ ...formData, total_amount: totalAmount });
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
        description: "Сума покупки повинна бути більше 0",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Створити покупку
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
            unit_price: item.unit_price > 0 ? item.unit_price : null,
            total_price: item.total_price > 0 ? item.total_price : null,
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

      // Очистити форму
      setFormData({
        date: new Date().toISOString().split('T')[0],
        buyer_id: '',
        driver_id: '',
        total_amount: 0,
        notes: '',
      });
      setPurchaseItems([]);
      setOpen(false);
      onSuccess?.();

    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити покупку",
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
          Додати покупку
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Нова покупка кави</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основна інформація */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Дата покупки *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Загальна сума, ₴ *</Label>
              <Input
                id="total_amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.total_amount || ''}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyer">Покупець *</Label>
              <Select value={formData.buyer_id} onValueChange={(value) => setFormData({ ...formData, buyer_id: value })}>
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
              <Label htmlFor="driver">Водій (опційно)</Label>
              <Select value={formData.driver_id} onValueChange={(value) => setFormData({ ...formData, driver_id: value === 'none' ? '' : value })}>
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
          </div>

          {/* Позиції покупки */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Позиції кави (опційно)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPurchaseItem}
                disabled={coffeeTypes.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Додати позицію
              </Button>
            </div>

            {purchaseItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Додайте позиції кави для детального обліку цін та кількості
              </p>
            )}

            {purchaseItems.map((item, index) => (
              <Card key={index} className="border-accent/20">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Позиція #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePurchaseItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                <div className="flex items-center gap-2">
                                  <Coffee className="h-4 w-4" />
                                  <span>{coffee.name}</span>
                                  {coffee.brand && <span className="text-muted-foreground">({coffee.brand})</span>}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Кількість упаковок</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Ціна за упаковку, ₴</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price || ''}
                          onChange={(e) => updatePurchaseItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Загальна ціна позиції, ₴</Label>
                        <Input
                          type="number"
                          value={item.total_price.toFixed(2)}
                          readOnly
                          className="bg-muted/50"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Нотатки */}
          <div className="space-y-2">
            <Label htmlFor="notes">Нотатки</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Додаткова інформація про покупку..."
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
              {loading ? 'Збереження...' : 'Створити покупку'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};