import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePurchases, useDeletePurchase, useCanDeletePurchase } from '@/hooks/use-purchases';
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
  coffee_types: { id: string; name: string; brand?: string };
}

interface PurchaseDistribution {
  id: string;
  user_id: string;
  shares?: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  // React Query хуки
  const { data: purchases, isLoading, error, refetch } = usePurchases();
  const deletePurchaseMutation = useDeletePurchase();

  // Фільтрування покупок
  const filteredPurchases = useMemo(() => {
    if (!purchases || !searchQuery.trim()) return purchases;
    
    return purchases.filter(purchase => 
      purchase.buyer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.driver?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.purchase_items?.some(item => 
        item.coffee_types?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.coffee_types?.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      new Date(purchase.date).toLocaleDateString('uk-UA').includes(searchQuery) ||
      purchase.total_amount.toString().includes(searchQuery)
    );
  }, [purchases, searchQuery]);

  // Пошук та фільтрація
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleDelete = async (purchaseId: string) => {
    try {
      await deletePurchaseMutation.mutateAsync(purchaseId);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити покупку",
        variant: "destructive",
      });
    }
  };

  const handlePurchaseUpdated = () => {
    refetch();
  };

  if (error) {
    return (
      <Card className="shadow-coffee">
        <CardContent className="p-8 md:p-12 text-center">
          <Coffee className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-destructive mb-2">
            Помилка завантаження
          </h3>
          <p className="text-muted-foreground mb-4">
            Не вдалося завантажити покупки
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Спробувати знову
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
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
        {filteredPurchases?.length === 0 ? (
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
          filteredPurchases?.map((purchase) => (
            <PurchaseCard 
              key={purchase.id} 
              purchase={purchase} 
              onDelete={handleDelete}
              onUpdate={handlePurchaseUpdated}
              isDeleting={deletePurchaseMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface PurchaseCardProps {
  purchase: PurchaseListItem;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  isDeleting: boolean;
}

const PurchaseCard = ({ purchase, onDelete, onUpdate, isDeleting }: PurchaseCardProps) => {
  const { data: canDeleteData } = useCanDeletePurchase(purchase.id);
  const canDelete = canDeleteData?.canDelete ?? false;

  return (
    <SimpleCard
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
                onSuccess={onUpdate}
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
                      isDeleting || 
                      purchase.distribution_status === 'locked' ||
                      !canDelete
                    }
                  >
                    {isDeleting ? (
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
                        : !canDelete
                        ? canDeleteData?.reason || "Неможливо видалити покупку з оплаченими розподілами."
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
                    {canDelete && purchase.distribution_status !== 'locked' && (
                      <AlertDialogAction
                        onClick={() => onDelete(purchase.id)}
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
            onStatusUpdate={onUpdate}
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
          {purchase.purchase_items?.length > 0 && (
            <div>
              <h4 className="text-sm lg:text-base font-medium mb-2 lg:mb-3 text-muted-foreground">Позиції:</h4>
              <div className="space-y-1 lg:space-y-2">
                {purchase.purchase_items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm lg:text-base bg-muted/50 rounded px-3 py-2 lg:px-4 lg:py-3">
                    <span className="font-medium">
                      {item.coffee_types.name}
                      {item.coffee_types.brand && (
                        <span className="text-muted-foreground"> ({item.coffee_types.brand})</span>
                      )}
                      {item.unit_price && (
                        <span className="text-primary"> - ₴{item.unit_price}/уп.</span>
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
          {purchase.purchase_distributions && purchase.purchase_distributions.length > 0 && 
           purchase.distribution_status !== 'locked' && (
            <PurchaseDistributionPayments
              purchaseId={purchase.id}
              distributions={purchase.purchase_distributions}
              currentStatus={purchase.distribution_status || 'draft'}
              buyerId={purchase.buyer_id}
              onPaymentUpdate={onUpdate}
            />
          )}

          {/* Notes */}
          {purchase.notes && (
            <div className="p-3 lg:p-4 bg-muted/30 rounded-lg">
              <p className="text-sm lg:text-base text-muted-foreground">
                <strong>Примітки:</strong> {purchase.notes}
              </p>
            </div>
          )}

          {/* Locked status */}
          {purchase.distribution_status === 'locked' && purchase.locked_at && (
            <div className="p-3 lg:p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm lg:text-base text-green-800">
                <strong>Покупка заблокована:</strong> {new Date(purchase.locked_at).toLocaleDateString('uk-UA')}
              </p>
            </div>
          )}
        </div>
      </div>
    </SimpleCard>
  );
};