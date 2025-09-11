import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Coffee, Trash2, Edit, Loader2, Calculator } from 'lucide-react';
import { UserAvatarPicker } from './UserAvatarPicker';
import { CoffeeCombobox } from './CoffeeCombobox';
import { PurchaseDistributionStep } from './PurchaseDistributionStep';
import { useProfiles } from '@/hooks/use-profiles';
import { useCoffeeTypes, useCreateCoffeeType } from '@/hooks/use-coffee-types';
import { usePurchase, useCreatePurchase, useUpdatePurchase, useLatestCoffeePrice, useLastPurchaseTemplate } from '@/hooks/use-purchases';

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
  shares: number;
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isDistributionManuallyModified, setIsDistributionManuallyModified] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!purchaseId;

  // React Query хуки
  const { data: profiles = [] } = useProfiles();
  const { data: coffeeTypes = [] } = useCoffeeTypes();
  const { data: purchaseData, isLoading: isLoadingPurchase } = usePurchase(purchaseId || '');
  const { data: lastTemplate } = useLastPurchaseTemplate();
  
  const createPurchaseMutation = useCreatePurchase();
  const updatePurchaseMutation = useUpdatePurchase();
  const createCoffeeTypeMutation = useCreateCoffeeType();

  // Завантаження даних покупки для редагування
  useEffect(() => {
    if (isEditMode && purchaseData && open) {
      const purchase = purchaseData;
      setFormData({
        date: purchase.date,
        total_amount: purchase.total_amount.toString(),
        notes: purchase.notes || '',
        buyer_id: purchase.buyer_id,
        driver_id: purchase.driver_id || '',
      });
      setPurchaseItems(purchase.purchase_items || []);
      
      // Завантажити існуючі розподіли
      if (purchase.purchase_distributions && purchase.purchase_distributions.length > 0) {
        const existingDistributions = purchase.purchase_distributions.map((dist: any) => ({
          user_id: dist.user_id,
          shares: dist.shares || Math.round(dist.percentage), // Використовуємо shares або конвертуємо з відсотка
          percentage: dist.percentage,
          calculated_amount: dist.calculated_amount,
          adjusted_amount: dist.adjusted_amount,
          profile: dist.profiles
        }));
        setDistributions(existingDistributions);
      }
    }
  }, [isEditMode, purchaseData, open]);

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !isEditMode) {
      // Скинути форму для нової покупки
      setFormData({
        date: new Date().toISOString().split('T')[0],
        total_amount: '',
        notes: '',
        buyer_id: '',
        driver_id: '',
      });
      setPurchaseItems([]);
      setDistributions([]);
      setSelectedTemplate('');
      setDistributionValidation(null);
      setIsDistributionManuallyModified(false);
      setCurrentTab('purchase');
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
      const result = await createCoffeeTypeMutation.mutateAsync({ name: name.trim() });
      return result.id;
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: "Не вдалося створити новий тип кави",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePurchaseItem = async (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Автозаповнення ціни при виборі кави
    if (field === 'coffee_type_id' && value) {
      // Використовуємо React Query для отримання останньої ціни
      // Пока что оставим простую логику без дополнительного хука в цикле
      updatedItems[index].unit_price = 0;
      updatedItems[index].total_price = 0;
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
      if (!distributionValidation.isValidShares) {
        toast({
          title: "Помилка валідації",
          description: "Загальна кількість часток повинна бути більше 0",
          variant: "destructive",
        });
        setCurrentTab('distribution');
        return;
      }
    }

    try {
      const purchaseData = {
        date: formData.date,
        total_amount: totalAmountNumber,
        buyer_id: formData.buyer_id,
        driver_id: formData.driver_id || undefined,
        notes: formData.notes || undefined,
        items: purchaseItems
          .filter(item => item.coffee_type_id)
          .map(item => ({
            coffee_type_id: item.coffee_type_id,
            quantity: item.quantity,
            unit_price: item.unit_price || undefined,
            total_price: item.total_price || undefined,
          })),
        distributions: distributions.length > 0 ? distributions.map(dist => ({
          user_id: dist.user_id,
          shares: dist.shares,
          percentage: dist.percentage,
        })) : undefined,
      };

      if (isEditMode) {
        await updatePurchaseMutation.mutateAsync({ id: purchaseId!, data: purchaseData });
      } else {
        await createPurchaseMutation.mutateAsync(purchaseData);
      }

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      // Помилка вже оброблена в мутації
    }
  };

  const getCoffeeTypeName = (coffeeId: string): string => {
    const coffee = coffeeTypes.find(c => c.id === coffeeId);
    if (!coffee) return '';
    return coffee.brand ? `${coffee.name} (${coffee.brand})` : coffee.name;
  };

  const isLoading = createPurchaseMutation.isPending || updatePurchaseMutation.isPending || (isEditMode && isLoadingPurchase);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Додати покупку
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            {isEditMode ? 'Редагувати покупку' : 'Нова покупка кави'}
          </DialogTitle>
        </DialogHeader>

        {isEditMode && isLoadingPurchase ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Завантаження даних...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="purchase">Покупка</TabsTrigger>
                <TabsTrigger value="distribution" disabled={!formData.total_amount || parseFloat(formData.total_amount) <= 0}>
                  Розподіл
                  {distributions.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {distributions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="purchase" className="space-y-4">
                {/* Основна інформація про покупку */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total_amount">Загальна сума (₴) *</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.total_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Дата покупки *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Покупець та водій */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buyer">Покупець *</Label>
                    <Select value={formData.buyer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, buyer_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть покупця" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="driver">Водій</Label>
                    <Select value={formData.driver_id || "no-driver"} onValueChange={(value) => setFormData(prev => ({ ...prev, driver_id: value === "no-driver" ? "" : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть водія (опціонально)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-driver">Без водія</SelectItem>
                        {profiles.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Позиції покупки */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Позиції покупки</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addPurchaseItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Додати позицію
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {purchaseItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                          <div className="flex-1">
                            <Label className="text-sm">Тип кави</Label>
                            <Select value={item.coffee_type_id} onValueChange={(value) => updatePurchaseItem(index, 'coffee_type_id', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Оберіть тип кави" />
                              </SelectTrigger>
                              <SelectContent>
                                {coffeeTypes.map(coffee => (
                                  <SelectItem key={coffee.id} value={coffee.id}>
                                    {coffee.brand ? `${coffee.name} (${coffee.brand})` : coffee.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            <Label className="text-sm">К-сть</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="w-24">
                            <Label className="text-sm">Ціна за уп.</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={item.unit_price || ''}
                              onChange={(e) => updatePurchaseItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePurchaseItem(index)}
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {purchaseItems.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Coffee className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Додайте позиції покупки кави</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Примітки */}
                <div>
                  <Label htmlFor="notes">Примітки</Label>
                  <Textarea
                    id="notes"
                    placeholder="Додаткові примітки до покупки..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="distribution" className="space-y-4">
                <PurchaseDistributionStep
                  totalAmount={parseFloat(formData.total_amount) || 0}
                  purchaseDate={formData.date}
                  onDistributionChange={(newDistributions, validation) => {
                    setDistributions(newDistributions);
                    setDistributionValidation(validation);
                  }}
                  initialDistributions={distributions}
                  initialSelectedTemplate={
                    isEditMode 
                      ? purchaseData?.template_id 
                      : lastTemplate
                  }
                  isManuallyModified={isDistributionManuallyModified}
                  onManualModificationChange={setIsDistributionManuallyModified}
                />
              </TabsContent>
            </Tabs>

            {/* Кнопки управління */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Скасувати
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.buyer_id || !formData.total_amount}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Зберегти зміни' : 'Створити покупку'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};