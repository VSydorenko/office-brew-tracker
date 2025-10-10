import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Coffee, Package, TrendingUp, ShoppingCart, Calendar, Trash2 } from 'lucide-react';
import { InlineTextEdit } from '@/components/coffee/InlineTextEdit';
import { InlineTextareaEdit } from '@/components/coffee/InlineTextareaEdit';
import { InlineComboboxEdit } from '@/components/coffee/InlineComboboxEdit';
import { useCoffeeType, useDeleteCoffeeType, useUpdateCoffeeField } from '@/hooks/use-coffee-types';
import { useSupabaseQuery, useRealtimeInvalidation } from '@/hooks/use-supabase-query';
import { 
  useBrands, 
  useCreateBrand, 
  useVarieties, 
  useCreateVariety, 
  useOrigins, 
  useCreateOrigin, 
  useProcessingMethods, 
  useCreateProcessingMethod 
} from '@/hooks/use-reference-tables';
import { supabase } from '@/integrations/supabase/client';

interface CoffeeType {
  id: string;
  name: string;
  description?: string;
  package_size?: string;
  created_at: string;
  updated_at: string;
  brands?: { name: string } | null;
  coffee_varieties?: { name: string } | null;
  origins?: { name: string } | null;
  processing_methods?: { name: string } | null;
  coffee_flavors?: Array<{ flavors: { name: string } }>;
}

interface PurchaseItem {
  id: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  purchase: {
    id: string;
    date: string;
  };
}

const CoffeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // React Query хуки
  const { data: coffee, isLoading: coffeeLoading } = useCoffeeType(id!);
  const deleteMutation = useDeleteCoffeeType();
  const updateFieldMutation = useUpdateCoffeeField();

  // Довідники з хуків
  const { data: brands = [] } = useBrands();
  const { data: varieties = [] } = useVarieties();
  const { data: origins = [] } = useOrigins();
  const { data: processingMethods = [] } = useProcessingMethods();

  // Мутації для створення нових записів
  const createBrand = useCreateBrand();
  const createVariety = useCreateVariety();
  const createOrigin = useCreateOrigin();
  const createProcessingMethod = useCreateProcessingMethod();

  // Простий запит з JOIN для історії покупок
  const { data: purchases = [], isLoading: purchasesLoading } = useSupabaseQuery(
    ['purchases', 'by-coffee', id],
    async () => {
      if (!id) return { data: [], error: null };
      
      return await supabase
        .from('purchase_items')
        .select(`
          id,
          quantity,
          unit_price,
          total_price,
          purchases!inner (
            id,
            date
          )
        `)
        .eq('coffee_type_id', id)
        .order('created_at', { ascending: false });
    },
    {
      enabled: !!id,
      select: (rows) => {
        const list = rows ?? [];
        return list.map((item: any) => ({
          id: item.id,
          quantity: Number(item.quantity) || 0,
          unit_price: item.unit_price != null ? Number(item.unit_price) : undefined,
          total_price: item.total_price != null ? Number(item.total_price) : undefined,
          purchase: {
            id: item.purchases.id,
            date: item.purchases.date
          }
        }));
      }
    }
  );


  // Realtime invalidation
  useRealtimeInvalidation('purchases', [['purchases', 'by-coffee', id]]);
  useRealtimeInvalidation('purchase_items', [['purchases', 'by-coffee', id]]);

  const loading = coffeeLoading || purchasesLoading;

  // Calculate statistics - MUST be before conditional returns
  const { totalPurchases, totalQuantity, totalSpent, avgPrice, priceHistory, purchasesWithPrices, purchasesWithTotalPrice } = useMemo(() => {
    if (!purchases || purchases.length === 0) {
      return { 
        totalPurchases: 0, 
        totalQuantity: 0, 
        totalSpent: 0, 
        avgPrice: 0, 
        priceHistory: [], 
        purchasesWithPrices: 0,
        purchasesWithTotalPrice: 0
      };
    }

    const totalPurchases = purchases.length;
    const totalQuantity = purchases.reduce((sum, item) => sum + item.quantity, 0);
    
    // Рахуємо тільки записи з вказаною загальною ціною
    const itemsWithTotalPrice = purchases.filter(p => p.total_price && p.total_price > 0);
    const totalSpent = itemsWithTotalPrice.reduce((sum, item) => sum + item.total_price!, 0);
    const purchasesWithTotalPrice = itemsWithTotalPrice.length;
    
    // Рахуємо середню ціну тільки з записів з вказаною ціною за одиницю
    const itemsWithUnitPrice = purchases.filter(p => p.unit_price && p.unit_price > 0);
    const avgPrice = itemsWithUnitPrice.length > 0 
      ? itemsWithUnitPrice.reduce((sum, item) => sum + item.unit_price!, 0) / itemsWithUnitPrice.length
      : 0;
    const purchasesWithPrices = itemsWithUnitPrice.length;

    // Price history for chart - тільки записи з цінами
    const priceHistory = itemsWithUnitPrice
      .map(p => ({
        date: p.purchase.date,
        price: p.unit_price!,
        quantity: p.quantity
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { 
      totalPurchases, 
      totalQuantity, 
      totalSpent, 
      avgPrice, 
      priceHistory, 
      purchasesWithPrices,
      purchasesWithTotalPrice
    };
  }, [purchases]);

  useEffect(() => {
    if (!id) {
      navigate('/coffee-catalog');
      return;
    }
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!coffee || !id) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Успіх",
        description: "Кава видалена з каталогу",
      });
      navigate('/coffee-catalog');
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити каву",
        variant: "destructive",
      });
    }
  };

  const handleFieldUpdate = async (field: string, value: any) => {
    if (!id) return;
    
    try {
      await updateFieldMutation.mutateAsync({ id, field, value });
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити поле",
        variant: "destructive",
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-brew p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-coffee animate-pulse">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!coffee) {
    return (
      <div className="min-h-screen bg-gradient-brew p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-coffee">
            <CardContent className="p-8 text-center">
              <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-medium text-primary mb-2">Кава не знайдена</h2>
              <p className="text-muted-foreground mb-4">Запитувана кава не існує або була видалена</p>
              <Button onClick={() => navigate('/coffee-catalog')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Повернутися до каталогу
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/coffee-catalog')}
            className="text-coffee-dark hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад до каталогу
          </Button>
          
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={deleteMutation.isPending}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? 'Видалення...' : 'Видалити'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Видалити каву?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ця дія незворотна. Кава "{coffee?.name}" буде повністю видалена з каталогу.
                    {purchases.length > 0 && (
                      <span className="block mt-2 text-destructive font-medium">
                        Увага: Для цієї кави є {purchases.length} закупок. Після видалення кави історія закупок буде недоступна.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Видалити
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Coffee Info */}
        <Card className="shadow-coffee">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Coffee className="h-6 w-6 text-coffee-dark" />
                  <InlineTextEdit
                    value={coffee.name}
                    onSave={(value) => handleFieldUpdate('name', value)}
                    className="text-2xl text-primary font-semibold"
                    placeholder="Назва кави"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <InlineComboboxEdit
                    value={coffee.brand_id}
                    options={brands}
                    onSave={(value) => handleFieldUpdate('brand_id', value)}
                    onCreateNew={async (name) => {
                      const result = await createBrand.mutateAsync(name);
                      return result.id;
                    }}
                    placeholder="Оберіть бренд..."
                    emptyText="Без бренду"
                    createText="Створити бренд"
                    searchPlaceholder="Пошук бренду або введіть новий..."
                    badgeVariant="secondary"
                    className="bg-coffee-light/20 text-coffee-dark"
                  />
                  <InlineComboboxEdit
                    value={coffee.variety_id}
                    options={varieties}
                    onSave={(value) => handleFieldUpdate('variety_id', value)}
                    onCreateNew={async (name) => {
                      const result = await createVariety.mutateAsync(name);
                      return result.id;
                    }}
                    placeholder="Оберіть різновид..."
                    emptyText="Без різновиду"
                    createText="Створити різновид"
                    searchPlaceholder="Пошук різновиду або введіть новий..."
                    badgeVariant="outline"
                  />
                  <InlineComboboxEdit
                    value={coffee.origin_id}
                    options={origins}
                    onSave={(value) => handleFieldUpdate('origin_id', value)}
                    onCreateNew={async (name) => {
                      const result = await createOrigin.mutateAsync(name);
                      return result.id;
                    }}
                    placeholder="Оберіть походження..."
                    emptyText="Без походження"
                    createText="Створити походження"
                    searchPlaceholder="Пошук походження або введіть нове..."
                    badgeVariant="outline"
                  />
                  <InlineComboboxEdit
                    value={coffee.processing_method_id}
                    options={processingMethods}
                    onSave={(value) => handleFieldUpdate('processing_method_id', value)}
                    onCreateNew={async (name) => {
                      const result = await createProcessingMethod.mutateAsync(name);
                      return result.id;
                    }}
                    placeholder="Оберіть обробку..."
                    emptyText="Без обробки"
                    createText="Створити метод обробки"
                    searchPlaceholder="Пошук обробки або введіть нову..."
                    badgeVariant="outline"
                  />
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Додано: {new Date(coffee.created_at).toLocaleDateString('uk-UA')}</p>
                {coffee.updated_at !== coffee.created_at && (
                  <p>Оновлено: {new Date(coffee.updated_at).toLocaleDateString('uk-UA')}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-coffee-dark" />
                <span className="font-medium">Розмір упаковки:</span>
                <InlineTextEdit
                  value={coffee.package_size || ''}
                  onSave={(value) => handleFieldUpdate('package_size', value || null)}
                  placeholder="Не вказано"
                  required={false}
                />
              </div>
            </div>
            
            {coffee.coffee_flavors && coffee.coffee_flavors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Смакові якості:</h4>
                <div className="flex flex-wrap gap-2">
                  {coffee.coffee_flavors.map((cf, index) => (
                    <Badge key={index} variant="outline" className="text-coffee-dark">
                      {cf.flavors.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-2">Опис:</h4>
              <InlineTextareaEdit
                value={coffee.description}
                onSave={(value) => handleFieldUpdate('description', value)}
                placeholder="Додати опис кави..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-coffee">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-coffee-dark" />
                <div>
                  <p className="text-sm text-muted-foreground">Закупок</p>
                  <p className="text-xl font-bold text-primary">{totalPurchases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-coffee">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-coffee-dark" />
                <div>
                  <p className="text-sm text-muted-foreground">Упаковок</p>
                  <p className="text-xl font-bold text-primary">{totalQuantity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-coffee">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-coffee-dark" />
                <div>
                  <p className="text-sm text-muted-foreground">Сер. ціна</p>
                  <p className="text-xl font-bold text-primary">
                    {avgPrice > 0 ? `₴${avgPrice.toFixed(0)}` : '—'}
                  </p>
                  {purchasesWithPrices > 0 && purchasesWithPrices < totalPurchases && (
                    <p className="text-xs text-muted-foreground">
                      з {purchasesWithPrices} з цінами
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-coffee">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-coffee-dark" />
                <div>
                  <p className="text-sm text-muted-foreground">Витрачено</p>
                  <p className="text-xl font-bold text-primary">
                    {totalSpent > 0 ? `₴${totalSpent.toFixed(0)}` : '—'}
                  </p>
                  {purchasesWithTotalPrice > 0 && purchasesWithTotalPrice < totalPurchases && (
                    <p className="text-xs text-muted-foreground">
                      з {purchasesWithTotalPrice} закупок
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price History */}
        {priceHistory.length > 0 && (
          <Card className="shadow-coffee">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-coffee-dark" />
                Динаміка цін
              </CardTitle>
              {purchasesWithPrices < totalPurchases && (
                <p className="text-sm text-muted-foreground">
                  Показано {purchasesWithPrices} з {totalPurchases} закупок (тільки з вказаними цінами)
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priceHistory.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(item.date).toLocaleDateString('uk-UA')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {item.quantity} уп.
                      </span>
                      <span className="font-medium">₴{item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase History */}
        <Card className="shadow-coffee">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-coffee-dark" />
              Історія закупок
            </CardTitle>
            {(purchasesWithPrices > 0 && purchasesWithPrices < totalPurchases) && (
              <p className="text-sm text-muted-foreground">
                {purchasesWithPrices} з {totalPurchases} закупок мають вказані ціни
              </p>
            )}
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ще немає закупок цієї кави</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(item.purchase.date).toLocaleDateString('uk-UA')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.quantity} уп.</p>
                      {item.unit_price ? (
                        <p className="text-sm text-muted-foreground">₴{item.unit_price} за уп.</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Ціна не вказана</p>
                      )}
                      {item.total_price ? (
                        <p className="text-sm font-medium">Всього: ₴{item.total_price}</p>
                      ) : !item.unit_price && (
                        <p className="text-sm text-muted-foreground">Сума не вказана</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default CoffeeDetail;