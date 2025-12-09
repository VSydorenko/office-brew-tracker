import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Coffee, Trash2, Edit, Loader2, Calculator } from 'lucide-react';
import { UserAvatarPicker } from './UserAvatarPicker';
import { CoffeeCombobox } from './CoffeeCombobox';
import { PurchaseDistributionStep } from './PurchaseDistributionStep';
import { useProfiles, useCurrentProfile } from '@/hooks/use-profiles';
import { useCoffeeTypes, useCreateCoffeeType } from '@/hooks/use-coffee-types';
import { usePurchase, useCreatePurchase, useUpdatePurchase, useLatestCoffeePrice, useLastPurchaseTemplate } from '@/hooks/use-purchases';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/ui/auth-provider';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();

  // React Query хуки
  const { user } = useAuth();
  const { data: currentProfile } = useCurrentProfile();
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
      
      // Встановлюємо збережений template_id
      if (purchase.template_id) {
        setSelectedTemplate(purchase.template_id);
      }
      
      // Завантажити існуючі розподіли
      if (purchase.purchase_distributions && purchase.purchase_distributions.length > 0) {
        const existingDistributions = purchase.purchase_distributions.map((dist: any) => ({
          user_id: dist.user_id,
          shares: dist.shares || 1, // Використовуємо shares або значення за замовчуванням
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
      // Скинути форму для нової покупки і встановити поточного користувача як покупця та водія
      setFormData({
        date: new Date().toISOString().split('T')[0],
        total_amount: '',
        notes: '',
        buyer_id: currentProfile?.id || '',
        driver_id: currentProfile?.id || '',
      });
      setPurchaseItems([]);
      setDistributions([]);
      // Для нової покупки встановлюємо останній використаний шаблон
      setSelectedTemplate(lastTemplate || '');
      setDistributionValidation(null);
      setIsDistributionManuallyModified(false);
      setCurrentTab('purchase');
    }
  };

  const addPurchaseItem = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Додаємо валідацію перед додаванням нової позиції
    if (purchaseItems.length === 0 || purchaseItems[purchaseItems.length - 1].coffee_type_id) {
      setPurchaseItems([...purchaseItems, {
        coffee_type_id: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      }]);
    }
  };

  // Функція для створення нового типу кави
  const createNewCoffeeType = async (name: string): Promise<string> => {
    try {
      const result = await createCoffeeTypeMutation.mutateAsync({ name: name.trim() });
      toast({
        title: "Успіх",
        description: `Створено новий тип кави: ${name}`,
      });
      return result.id;
    } catch (error: any) {
      console.error('Error creating coffee type:', error);
      toast({
        title: "Помилка",
        description: error?.message || "Не вдалося створити новий тип кави",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Створюємо кеш для цін кави
  const [priceCache, setPriceCache] = useState<Record<string, number>>({});
  
  const getLastPrice = (coffeeId: string): number | null => {
    return priceCache[coffeeId] || null;
  };

  // Завантажуємо ціни всіх кав при відкритті діалогу
  useEffect(() => {
    if (!open || !coffeeTypes?.length) return;
    
    let cancelled = false;
    const loadPrices = async () => {
      try {
        const results = await Promise.all(
          coffeeTypes.map(async (coffee) => {
            const { data } = await supabase.rpc('get_latest_coffee_price', { 
              coffee_id: coffee.id 
            });
            return [coffee.id, data] as const;
          })
        );
        
        if (cancelled) return;
        
        const newPriceCache: Record<string, number> = {};
        results.forEach(([coffeeId, price]) => {
          if (typeof price === 'number' && price > 0) {
            newPriceCache[coffeeId] = price;
          }
        });
        
        setPriceCache(newPriceCache);
      } catch (error) {
        console.error('Помилка завантаження останніх цін:', error);
      }
    };
    
    loadPrices();
    return () => { cancelled = true; };
  }, [open, coffeeTypes]);

  const updatePurchaseItem = async (index: number, field: keyof PurchaseItem, value: any) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Автозаповнення ціни при виборі кави
    if (field === 'coffee_type_id' && value) {
      // Отримуємо останню ціну для цієї кави
      try {
        const { data: priceData } = await supabase.rpc('get_latest_coffee_price', { 
          coffee_id: value 
        });
        
        if (priceData && priceData > 0) {
          updatedItems[index].unit_price = priceData;
          updatedItems[index].total_price = priceData;
          // Зберігаємо в кеш для швидкого доступу
          setPriceCache(prev => ({ ...prev, [value]: priceData }));
        } else {
          updatedItems[index].unit_price = 0;
          updatedItems[index].total_price = 0;
        }
      } catch (error) {
        console.error('Error fetching latest price:', error);
        updatedItems[index].unit_price = 0;
        updatedItems[index].total_price = 0;
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
    
    // Оновлюємо поле тільки якщо сума > 0 або поле порожнє
    setFormData(prev => {
      const shouldUpdate = totalAmount > 0 || prev.total_amount === '';
      return shouldUpdate 
        ? { ...prev, total_amount: totalAmount > 0 ? totalAmount.toString() : '' }
        : prev;
    });
  };

  const removePurchaseItem = (index: number) => {
    const updatedItems = purchaseItems.filter((_, i) => i !== index);
    setPurchaseItems(updatedItems);
    
    // Якщо не залишилось позицій, очищаємо поле замість встановлення "0"
    if (updatedItems.length === 0) {
      setFormData(prev => ({ ...prev, total_amount: '' }));
    } else {
      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.unit_price || 0), 0);
      setFormData(prev => ({ ...prev, total_amount: totalAmount.toString() }));
    }
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
        template_id: selectedTemplate || undefined,
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
          shares: dist.shares
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

  /**
   * Рендеринг вмісту форми
   */
  const renderFormContent = () => (
    <>
      {isEditMode && isLoadingPurchase ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Завантаження даних...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="purchase" className="text-sm md:text-base">
                Покупка
              </TabsTrigger>
              <TabsTrigger 
                value="distribution" 
                disabled={purchaseItems.length === 0 || !purchaseItems.some(item => item.coffee_type_id && (item.unit_price || 0) > 0)}
                className="text-sm md:text-base"
              >
                Розподіл
                {distributions.length > 0 && (
                  <Badge variant="secondary" className="ml-1 md:ml-2 text-xs">
                    {distributions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="purchase" className="space-y-3 md:space-y-4">
              {/* Основна інформація про покупку */}
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div>
                  <Label htmlFor="total_amount" className="text-sm">Сума (₴) *</Label>
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
                  <Label htmlFor="date" className="text-sm">Дата *</Label>
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
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div>
                  <Label htmlFor="buyer" className="text-sm">Покупець *</Label>
                  <UserAvatarPicker
                    selectedUserId={formData.buyer_id}
                    onUserSelect={(userId) => setFormData(prev => ({ ...prev, buyer_id: userId }))}
                    compact={isMobile}
                    searchable={true}
                    hideSearchByDefault={true}
                  />
                </div>
                <div>
                  <Label htmlFor="driver" className="text-sm">Водій</Label>
                  <UserAvatarPicker
                    selectedUserId={formData.driver_id}
                    onUserSelect={(userId) => setFormData(prev => ({ ...prev, driver_id: userId }))}
                    compact={isMobile}
                    searchable={true}
                    hideSearchByDefault={true}
                  />
                </div>
              </div>

              {/* Позиції покупки */}
              <Card>
                <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h3 className="text-base md:text-lg font-medium">Позиції покупки</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addPurchaseItem}>
                      <Plus className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Додати</span>
                      <span className="sm:hidden">+</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {purchaseItems.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2 md:space-y-0 md:flex md:gap-2 md:items-start">
                        {/* Мобільний: заголовок з кнопкою видалення */}
                        <div className="flex justify-between items-center md:hidden">
                          <Label className="text-xs text-muted-foreground">Позиція #{index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePurchaseItem(index)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        
                        {/* Тип кави - повна ширина на мобільних */}
                        <div className="flex-1">
                          <Label className="text-sm hidden md:block">Тип кави</Label>
                          <CoffeeCombobox
                            coffeeTypes={coffeeTypes}
                            value={item.coffee_type_id}
                            onValueChange={(value) => updatePurchaseItem(index, 'coffee_type_id', value)}
                            onCreateNew={createNewCoffeeType}
                            placeholder="Оберіть тип кави"
                            showLastPrice={true}
                            onGetLastPrice={getLastPrice}
                          />
                        </div>
                        
                        {/* К-сть та Ціна - в одному рядку */}
                        <div className="flex gap-2">
                          <div className="flex-1 md:w-24 md:flex-none">
                            <Label className="text-sm">К-сть</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            />
                          </div>
                          <div className="flex-1 md:w-24 md:flex-none">
                            <Label className="text-sm">Ціна</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={item.unit_price || ''}
                              onChange={(e) => updatePurchaseItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            />
                          </div>
                        </div>
                        
                        {/* Кнопка видалення для десктопу */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePurchaseItem(index)}
                          className="hidden md:flex mt-6"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {purchaseItems.length === 0 && (
                      <div className="text-center py-6 md:py-8 text-muted-foreground">
                        <Coffee className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
                        <p className="text-sm md:text-base">Додайте позиції покупки кави</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Примітки */}
              <div>
                <Label htmlFor="notes" className="text-sm">Примітки</Label>
                <Textarea
                  id="notes"
                  placeholder="Додаткові примітки..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-3 md:space-y-4">
              <PurchaseDistributionStep
                totalAmount={parseFloat(formData.total_amount) || 0}
                purchaseDate={formData.date}
                onDistributionChange={(dists, validation) => {
                  setDistributions(dists);
                  setDistributionValidation(validation);
                  if (validation?.selectedTemplate) {
                    setSelectedTemplate(validation.selectedTemplate);
                  }
                }}
                initialDistributions={distributions}
                initialSelectedTemplate={selectedTemplate}
                isManuallyModified={isDistributionManuallyModified}
                onManualModificationChange={setIsDistributionManuallyModified}
              />
            </TabsContent>
          </Tabs>

          {/* Кнопки управління */}
          <div className="flex justify-end gap-2 md:gap-3 pt-3 md:pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Скасувати
            </Button>
            <Button 
              type="submit" 
              size={isMobile ? "sm" : "default"}
              disabled={isLoading || !formData.buyer_id || !formData.total_amount}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Зберегти' : 'Створити'}
            </Button>
          </div>
        </form>
      )}
    </>
  );

  // На мобільних використовуємо Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          {children || (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Додати покупку
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh] overflow-y-auto px-4 pb-6">
          <DrawerHeader className="px-0">
            <DrawerTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              {isEditMode ? 'Редагувати покупку' : 'Нова покупка'}
            </DrawerTitle>
          </DrawerHeader>
          {renderFormContent()}
        </DrawerContent>
      </Drawer>
    );
  }

  // На десктопі використовуємо Dialog
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
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  );
};