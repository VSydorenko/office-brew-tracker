import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Coffee, Trash2, Edit, Loader2, Calculator } from 'lucide-react';
import { UserAvatarPicker } from './UserAvatarPicker';
import { CoffeeCombobox } from './CoffeeCombobox';
import { PurchaseDistributionStep } from './PurchaseDistributionStep';

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

interface PurchaseDistribution {
  user_id: string;
  percentage: number;
  calculated_amount: number;
  adjusted_amount?: number;
  profile?: Profile;
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
    total_amount: '',
    notes: '',
    buyer_id: '',
    driver_id: '',
  });
  const [distributions, setDistributions] = useState<PurchaseDistribution[]>([]);
  const [distributionValidation, setDistributionValidation] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('purchase');
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [priceCache, setPriceCache] = useState<Record<string, number>>({});
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
          ),
          purchase_distributions(
            user_id,
            percentage,
            calculated_amount,
            adjusted_amount,
            profiles(
              id,
              name,
              email
            )
          )
        `)
        .eq('id', purchaseId)
        .single();

      if (error) throw error;

      setFormData({
        date: data.date,
        total_amount: data.total_amount.toString(),
        notes: data.notes || '',
        buyer_id: data.buyer_id,
        driver_id: data.driver_id || '',
      });
      setPurchaseItems(data.purchase_items || []);
      
      // Завантажити існуючі розподіли
      if (data.purchase_distributions && data.purchase_distributions.length > 0) {
        const existingDistributions = data.purchase_distributions.map((dist: any) => ({
          user_id: dist.user_id,
          percentage: dist.percentage,
          calculated_amount: dist.calculated_amount,
          adjusted_amount: dist.adjusted_amount,
          profile: dist.profiles
        }));
        setDistributions(existingDistributions);
      }
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
          total_amount: '',
          notes: '',
          buyer_id: user?.id || '',
          driver_id: user?.id || '',
        });
        setPurchaseItems([]);
        setDistributions([]);
        setSelectedTemplate('');
        setDistributionValidation(null);
        setCurrentTab('purchase');
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

  // Отримання останньої ціни кави з кешу
  const getLatestCoffeePrice = (coffeeId: string): number | null => {
    return priceCache[coffeeId] || null;
  };

  // Попереднє завантаження цін для всіх типів кави
  useEffect(() => {
    const preloadPrices = async () => {
      if (coffeeTypes.length === 0) return;
      
      const pricesPromises = coffeeTypes.map(async (coffee) => {
        if (!priceCache[coffee.id]) {
          const price = await fetchLatestPrice(coffee.id);
          return { coffeeId: coffee.id, price };
        }
        return null;
      });
      
      const results = await Promise.all(pricesPromises);
      const newPrices: Record<string, number> = {};
      
      results.forEach(result => {
        if (result && result.price) {
          newPrices[result.coffeeId] = result.price;
        }
      });
      
      if (Object.keys(newPrices).length > 0) {
        setPriceCache(prev => ({ ...prev, ...newPrices }));
      }
    };
    
    preloadPrices();
  }, [coffeeTypes]);

  const fetchLatestPrice = async (coffeeId: string): Promise<number | null> => {
    if (priceCache[coffeeId]) {
      return priceCache[coffeeId];
    }

    try {
      const { data, error } = await supabase
        .rpc('get_latest_coffee_price', { coffee_id: coffeeId });

      if (error) throw error;
      
      const price = data ? parseFloat(data.toString()) : null;
      if (price) {
        setPriceCache(prev => ({ ...prev, [coffeeId]: price }));
        return price;
      }
    } catch (error) {
      console.error('Error fetching latest price:', error);
    }
    
    return null;
  };

  const updatePurchaseItem = async (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Автозаповнення ціни при виборі кави
    if (field === 'coffee_type_id' && value) {
      const lastPrice = await fetchLatestPrice(value);
      if (lastPrice && !updatedItems[index].unit_price) {
        updatedItems[index].unit_price = lastPrice;
        updatedItems[index].total_price = lastPrice;
      }
    }
    
    // Автоматично розрахувати загальну ціну для позиції (завжди quantity = 1)
    if (field === 'unit_price') {
      updatedItems[index].quantity = 1;
      updatedItems[index].total_price = value || 0;
    }
    
    setPurchaseItems(updatedItems);
    
    // Оновити загальну суму покупки
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.unit_price || 0), 0);
    setFormData(prev => ({ ...prev, total_amount: totalAmount.toString() }));
  };

  const removePurchaseItem = (index: number) => {
    const updatedItems = purchaseItems.filter((_, i) => i !== index);
    setPurchaseItems(updatedItems);
    
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.unit_price || 0), 0);
    setFormData(prev => ({ ...prev, total_amount: totalAmount.toString() }));
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

    const totalAmountNumber = parseFloat(formData.total_amount) || 0;
    if (totalAmountNumber <= 0) {
      toast({
        title: "Помилка",
        description: "Загальна сума повинна бути більше 0",
        variant: "destructive",
      });
      return;
    }

    // Валідація розподілу, якщо є дані
    if (distributionValidation && distributions.length > 0) {
      if (!distributionValidation.isValidPercentage) {
        toast({
          title: "Помилка валідації",
          description: `Сума відсотків повинна дорівнювати 100%. Поточна сума: ${distributionValidation.totalPercentage}%`,
          variant: "destructive",
        });
        setCurrentTab('distribution');
        return;
      }

      if (!distributionValidation.isValidAmount) {
        toast({
          title: "Попередження",
          description: `Сума розподілу (${distributionValidation.totalCalculatedAmount.toFixed(2)} ₴) не збігається з загальною сумою (${totalAmountNumber.toFixed(2)} ₴). Продовжити?`,
          variant: "destructive",
        });
        // Можна додати підтвердження, але поки що продовжуємо
      }
    }

    try {
      setLoading(true);

      if (isEditMode) {
        // Режим редагування
        const { error: purchaseError } = await supabase
          .from('purchases')
          .update({
            date: formData.date,
            total_amount: totalAmountNumber,
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

        // Оновити розподіл покупки, якщо є
        if (distributions && distributions.length > 0) {
          // Спочатку видаляємо існуючі розподіли
          const { error: deleteDistError } = await supabase
            .from('purchase_distributions')
            .delete()
            .eq('purchase_id', purchaseId);

          if (deleteDistError) throw deleteDistError;

          // Додаємо нові розподіли
          const distributionsToInsert = distributions.map(dist => ({
            purchase_id: purchaseId,
            user_id: dist.user_id,
            percentage: dist.percentage,
            calculated_amount: dist.calculated_amount,
            adjusted_amount: dist.adjusted_amount || null,
          }));

          const { error: distributionsError } = await supabase
            .from('purchase_distributions')
            .insert(distributionsToInsert);

          if (distributionsError) throw distributionsError;
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
            total_amount: totalAmountNumber,
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

        // Створити розподіл покупки, якщо є
        console.log('Distributions to save:', distributions);
        if (distributions && distributions.length > 0) {
          const distributionsToInsert = distributions.map(dist => ({
            purchase_id: purchase.id,
            user_id: dist.user_id,
            percentage: dist.percentage,
            calculated_amount: dist.calculated_amount,
            adjusted_amount: dist.adjusted_amount || null,
          }));

          console.log('Inserting distributions:', distributionsToInsert);
          const { error: distributionsError } = await supabase
            .from('purchase_distributions')
            .insert(distributionsToInsert);

          if (distributionsError) {
            console.error('Distribution error:', distributionsError);
            throw distributionsError;
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary">
            {isEditMode ? 'Редагувати покупку' : 'Нова покупка кави'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="purchase" className="flex items-center gap-2 h-10">
              <Coffee className="h-4 w-4" />
              <span className="hidden sm:inline">Покупка</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2 h-10">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Розподіл</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Загальна сума (₴) *</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                    placeholder="0.00"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 <div className="space-y-3">
                   <UserAvatarPicker
                     selectedUserId={formData.buyer_id}
                     onUserSelect={(userId) => setFormData(prev => ({ ...prev, buyer_id: userId }))}
                     label="Покупець *"
                     compact
                     hideSearchByDefault
                   />
                 </div>

                 <div className="space-y-3">
                   <UserAvatarPicker
                     selectedUserId={formData.driver_id}
                     onUserSelect={(userId) => setFormData(prev => ({ ...prev, driver_id: userId }))}
                     label="Водій (опціонально)"
                     compact
                     hideSearchByDefault
                   />
                 </div>
              </div>

              {/* Позиції покупки */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-medium">Позиції покупки</Label>
                   <Button
                     type="button"
                     size="sm"
                     onClick={addPurchaseItem}
                     className="bg-green-600 hover:bg-green-700 text-white"
                   >
                     <Plus className="h-4 w-4 mr-1" />
                     Додати позицію
                   </Button>
                </div>

                <div className="space-y-2">
                  {purchaseItems.map((item, index) => (
                    <div key={index} className="border border-border rounded-lg p-3">
                      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
                        <div className="flex-1 space-y-2">
                          <Label className="text-sm">Назва кави</Label>
                           <CoffeeCombobox
                             coffeeTypes={coffeeTypes}
                             value={item.coffee_type_id}
                             onValueChange={(value) => updatePurchaseItem(index, 'coffee_type_id', value)}
                             onCreateNew={createNewCoffeeType}
                             placeholder="Оберіть або введіть назву кави..."
                             showLastPrice={true}
                             onGetLastPrice={getLatestCoffeePrice}
                           />
                        </div>

                        <div className="w-full md:w-32 space-y-2">
                          <Label className="text-sm">Ціна (₴)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price || ''}
                            onChange={(e) => updatePurchaseItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="text-sm"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePurchaseItem(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6">
              <PurchaseDistributionStep
                totalAmount={parseFloat(formData.total_amount) || 0}
                purchaseDate={formData.date}
                initialDistributions={distributions.length > 0 ? distributions : undefined}
                initialSelectedTemplate={selectedTemplate || undefined}
                onDistributionChange={(dists, validation) => {
                  setDistributions(dists);
                  setDistributionValidation(validation);
                  // Зберігаємо обраний шаблон для відновлення стану
                  if (validation?.selectedTemplate) {
                    setSelectedTemplate(validation.selectedTemplate);
                  }
                }}
              />
            </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-6">
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
            onClick={handleSubmit}
            className="bg-gradient-coffee"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditMode ? 'Оновити покупку' : 'Створити покупку'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};