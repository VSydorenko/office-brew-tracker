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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PurchaseFormDialog } from './PurchaseFormDialog';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';
import { PurchaseDistributionActions } from './PurchaseDistributionActions';
import { PurchaseDistributionPayments } from './PurchaseDistributionPayments';
import { SimpleCard } from '@/components/ui/simple-card';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { SearchBar } from '@/components/ui/search-bar';
import { Calendar, User, Car, Coffee, DollarSign, Trash2, Loader2, Edit, MoreVertical } from 'lucide-react';

interface PurchaseItem {
  quantity: number;
  unit_price?: number;
  coffee_type: { name: string; brand?: string };
}

interface PurchaseDistribution {
  id: string;
  user_id: string;
  percentage: number;
  calculated_amount: number;
  adjusted_amount?: number;
  is_paid: boolean;
  paid_at?: string;
  version?: number;
  adjustment_type?: string;
  profiles: { name: string; email: string; avatar_path?: string; avatar_url?: string };
}

interface PurchaseListItem {
  id: string;
  date: string;
  total_amount: number;
  notes?: string;
  buyer_id: string;
  driver_id?: string;
  distribution_status?: string;
  locked_at?: string;
  locked_by?: string;
  original_total_amount?: number;
  buyer: { name: string };
  driver?: { name: string };
  purchase_items: PurchaseItem[];
  purchase_distributions?: PurchaseDistribution[];
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
          ),
          purchase_distributions(
            id,
            user_id,
            percentage,
            calculated_amount,
            adjusted_amount,
            is_paid,
            paid_at,
            version,
            adjustment_type,
            profiles(name, email, avatar_path, avatar_url)
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

      // Перевірити, чи є оплачені розподіли
      const { data: paidDistributions, error: checkError } = await supabase
        .from('purchase_distributions')
        .select('id')
        .eq('purchase_id', purchaseId)
        .eq('is_paid', true);

      if (checkError) throw checkError;

      if (paidDistributions && paidDistributions.length > 0) {
        toast({
          title: "Помилка",
          description: "Неможливо видалити покупку з оплаченими розподілами. Спочатку скасуйте оплати.",
          variant: "destructive",
        });
        return;
      }

      // Видалити розподіли покупки
      const { error: distributionsError } = await supabase
        .from('purchase_distributions')
        .delete()
        .eq('purchase_id', purchaseId);

      if (distributionsError) throw distributionsError;

      // Видалити всі позиції покупки
      const { error: itemsError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', purchaseId);

      if (itemsError) throw itemsError;

      // Видалити записи змін суми
      const { error: changesError } = await supabase
        .from('purchase_amount_changes')
        .delete()
        .eq('purchase_id', purchaseId);

      if (changesError) throw changesError;

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
      <div className="space-y-4 lg:space-y-6 xl:space-y-8">
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
            <SimpleCard
              key={purchase.id}
              className="shadow-coffee hover:shadow-coffee-hover"
            >
              <div className="space-y-4 lg:space-y-6">
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 lg:gap-4">
                  <div className="space-y-1 lg:space-y-2">
                    <div className="flex items-center gap-2 flex-wrap lg:gap-3">
                      <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-coffee-dark" />
                      <span className="font-medium text-sm md:text-base lg:text-lg">
                        {new Date(purchase.date).toLocaleDateString('uk-UA')}
                      </span>
                      <PurchaseStatusBadge status={purchase.distribution_status as any || 'draft'} />
                    </div>
                    <div className="flex items-center gap-2 lg:gap-3">
                      <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-coffee-dark" />
                      <span className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-primary">
                        ₴{purchase.total_amount}
                      </span>
                      {purchase.original_total_amount && purchase.original_total_amount !== purchase.total_amount && (
                        <Badge variant="outline" className="text-xs lg:text-sm">
                          Було: ₴{purchase.original_total_amount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 lg:h-10 lg:w-10 p-0">
                        <MoreVertical className="h-4 w-4 lg:h-5 lg:w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border border-border lg:min-w-[200px]">
                      <PurchaseFormDialog
                        purchaseId={purchase.id}
                        onSuccess={fetchPurchases}
                      >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="lg:text-base lg:py-3">
                          <Edit className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                          Редагувати
                        </DropdownMenuItem>
                      </PurchaseFormDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive lg:text-base lg:py-3"
                            disabled={
                              deletingId === purchase.id || 
                              purchase.distribution_status === 'locked' ||
                              (purchase.purchase_distributions && purchase.purchase_distributions.some(dist => dist.is_paid))
                            }
                          >
                            {deletingId === purchase.id ? (
                              <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                            )}
                            Видалити
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Видалити покупку?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {purchase.distribution_status === 'locked' 
                                ? "Неможливо видалити заблоковану покупку. Спочатку розблокуйте розподіл."
                                : (purchase.purchase_distributions && purchase.purchase_distributions.some(dist => dist.is_paid))
                                ? "Неможливо видалити покупку з оплаченими розподілами. Спочатку скасуйте оплати."
                                : "Ця дія незворотна. Покупка та всі її позиції будуть видалені назавжди."
                              }
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
                            {purchase.distribution_status !== 'locked' && 
                             !(purchase.purchase_distributions && purchase.purchase_distributions.some(dist => dist.is_paid)) && (
                              <AlertDialogAction
                                onClick={() => handleDelete(purchase.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Видалити
                              </AlertDialogAction>
                            )}
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Distribution Actions */}
                <div className="mb-4">
                  <PurchaseDistributionActions
                    purchaseId={purchase.id}
                    currentStatus={purchase.distribution_status || 'draft'}
                    totalAmount={purchase.total_amount}
                    onStatusUpdate={fetchPurchases}
                  />
                </div>

                {/* Details */}
                <div className="space-y-3 lg:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <User className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                      <span className="text-sm lg:text-base">
                        Покупець: <strong className="text-foreground">{purchase.buyer.name}</strong>
                      </span>
                    </div>
                    {purchase.driver && (
                      <div className="flex items-center gap-2 lg:gap-3">
                        <Car className="h-4 w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                        <span className="text-sm lg:text-base">
                          Водій: <strong className="text-foreground">{purchase.driver.name}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Coffee items */}
                  {purchase.purchase_items.length > 0 && (
                    <div>
                      <h4 className="text-sm lg:text-base font-medium mb-2 lg:mb-3 text-muted-foreground">Позиції:</h4>
                      <div className="space-y-1 lg:space-y-2">
                        {purchase.purchase_items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm lg:text-base bg-muted/50 rounded px-3 py-2 lg:px-4 lg:py-3">
                            <span className="font-medium">
                              {item.coffee_type.name} 
                              {item.coffee_type.brand && (
                                <span className="text-muted-foreground"> ({item.coffee_type.brand})</span>
                              )}
                            </span>
                            <Badge variant="secondary" className="text-xs lg:text-sm">
                              {item.quantity} уп.
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Purchase Distribution Payments */}
                  {purchase.purchase_distributions && purchase.purchase_distributions.length > 0 && (
                    <PurchaseDistributionPayments
                      purchaseId={purchase.id}
                      distributions={purchase.purchase_distributions}
                      currentStatus={purchase.distribution_status || 'draft'}
                      buyerId={purchase.buyer_id}
                      onPaymentUpdate={fetchPurchases}
                    />
                  )}

                  {/* Notes */}
                  {purchase.notes && (
                    <div className="bg-muted/30 rounded p-3 lg:p-4">
                      <p className="text-sm lg:text-base text-muted-foreground italic">
                        {purchase.notes}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </SimpleCard>
          ))
        )}
      </div>
    </div>
  );
};