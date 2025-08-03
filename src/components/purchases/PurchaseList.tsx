import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PurchaseFormDialog } from './PurchaseFormDialog';
import { SwipeableCard } from '@/components/ui/swipeable-card';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { SearchBar } from '@/components/ui/search-bar';
import { Calendar, User, Car, Coffee, DollarSign, Trash2, Loader2, Edit } from 'lucide-react';

interface PurchaseItem {
  quantity: number;
  unit_price?: number;
  coffee_type: { name: string; brand?: string };
}

interface PurchaseListItem {
  id: string;
  date: string;
  total_amount: number;
  notes?: string;
  buyer_id: string;
  driver_id?: string;
  buyer: { name: string };
  driver?: { name: string };
  purchase_items: PurchaseItem[];
}

export const PurchaseList = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Пошук та фільтрація
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPurchases(purchases);
      return;
    }

    const filtered = purchases.filter(purchase => 
      purchase.buyer.name.toLowerCase().includes(query.toLowerCase()) ||
      purchase.driver?.name.toLowerCase().includes(query.toLowerCase()) ||
      purchase.notes?.toLowerCase().includes(query.toLowerCase()) ||
      purchase.purchase_items.some(item => 
        item.coffee_type.name.toLowerCase().includes(query.toLowerCase()) ||
        item.coffee_type.brand?.toLowerCase().includes(query.toLowerCase())
      ) ||
      new Date(purchase.date).toLocaleDateString('uk-UA').includes(query) ||
      purchase.total_amount.toString().includes(query)
    );
    setFilteredPurchases(filtered);
  }, [purchases]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          buyer:profiles!purchases_buyer_id_fkey(name),
          driver:profiles!purchases_driver_id_fkey(name),
          purchase_items(
            quantity,
            unit_price,
            coffee_type:coffee_types(name, brand)
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      const purchaseData = data || [];
      setPurchases(purchaseData);
      setFilteredPurchases(purchaseData);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити покупки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (purchaseId: string) => {
    try {
      setDeletingId(purchaseId);

      // Видалити всі позиції покупки
      const { error: itemsError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', purchaseId);

      if (itemsError) throw itemsError;

      // Видалити саму покупку
      const { error: purchaseError } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseId);

      if (purchaseError) throw purchaseError;

      toast({
        title: "Успіх",
        description: "Покупку успішно видалено",
      });

      // Оновити список покупок
      fetchPurchases();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити покупку",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Оновлювати фільтровані результати при зміні purchases
  useEffect(() => {
    handleSearch(searchQuery);
  }, [purchases, searchQuery, handleSearch]);

  useEffect(() => {
    fetchPurchases();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 md:h-10 bg-muted rounded animate-pulse"></div>
        <SkeletonCard variant="list" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-optimized search */}
      <SearchBar
        placeholder="Пошук покупок за покупцем, кавою, датою..."
        onSearch={handleSearch}
      />

      {/* Results */}
      <div className="space-y-4">
        {filteredPurchases.length === 0 ? (
          <Card className="shadow-coffee">
            <CardContent className="p-8 md:p-12 text-center">
              <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">
                {searchQuery ? 'Покупок не знайдено' : 'Покупок ще немає'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Спробуйте змінити умови пошуку'
                  : 'Створіть першу покупку кави для вашої команди'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPurchases.map((purchase) => (
            <SwipeableCard
              key={purchase.id}
              onEdit={() => {
                // Логіка редагування буде в PurchaseFormDialog
              }}
              onDelete={() => handleDelete(purchase.id)}
              className="shadow-coffee hover:shadow-coffee-hover"
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-coffee-dark" />
                      <span className="font-medium text-sm md:text-base">
                        {new Date(purchase.date).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-coffee-dark" />
                      <span className="text-lg md:text-xl font-bold text-primary">
                        ₴{purchase.total_amount}
                      </span>
                    </div>
                  </div>
                  
                  {/* Desktop actions */}
                  <div className="hidden sm:flex gap-2">
                    <PurchaseFormDialog
                      purchaseId={purchase.id}
                      onSuccess={fetchPurchases}
                    >
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Редагувати
                      </Button>
                    </PurchaseFormDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === purchase.id}
                        >
                          {deletingId === purchase.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Видалити
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Видалити покупку?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ця дія незворотна. Покупка та всі її позиції будуть видалені назавжди.
                            <br /><br />
                            <strong>Дата:</strong> {new Date(purchase.date).toLocaleDateString('uk-UA')}
                            <br />
                            <strong>Сума:</strong> ₴{purchase.total_amount}
                            <br />
                            <strong>Покупець:</strong> {purchase.buyer.name}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(purchase.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Видалити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Покупець: <strong className="text-foreground">{purchase.buyer.name}</strong>
                      </span>
                    </div>
                    {purchase.driver && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Водій: <strong className="text-foreground">{purchase.driver.name}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Coffee items */}
                  {purchase.purchase_items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Позиції:</h4>
                      <div className="space-y-1">
                        {purchase.purchase_items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-muted/50 rounded px-3 py-2">
                            <span className="font-medium">
                              {item.coffee_type.name} 
                              {item.coffee_type.brand && (
                                <span className="text-muted-foreground"> ({item.coffee_type.brand})</span>
                              )}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {item.quantity} уп.
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {purchase.notes && (
                    <div className="bg-muted/30 rounded p-3">
                      <p className="text-sm text-muted-foreground italic">
                        {purchase.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile edit button */}
                <div className="sm:hidden pt-2">
                  <PurchaseFormDialog
                    purchaseId={purchase.id}
                    onSuccess={fetchPurchases}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Редагувати покупку
                    </Button>
                  </PurchaseFormDialog>
                </div>
              </div>
            </SwipeableCard>
          ))
        )}
      </div>
    </div>
  );
};