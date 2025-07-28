import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PurchaseEditDialog } from './PurchaseEditDialog';
import { Calendar, User, Car, Coffee, DollarSign, Trash2, Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

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
      setPurchases(data || []);
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

  useEffect(() => {
    fetchPurchases();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-coffee animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.length === 0 ? (
        <Card className="shadow-coffee">
          <CardContent className="p-12 text-center">
            <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">Покупок ще немає</h3>
            <p className="text-muted-foreground">Створіть першу покупку кави для вашої команди</p>
          </CardContent>
        </Card>
      ) : (
        purchases.map((purchase) => (
          <Card key={purchase.id} className="shadow-coffee hover:shadow-coffee-hover transition-all">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-coffee-dark" />
                    <span className="font-medium">{new Date(purchase.date).toLocaleDateString('uk-UA')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-coffee-dark" />
                    <span className="text-xl font-bold text-primary">₴{purchase.total_amount}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <PurchaseEditDialog 
                    purchaseId={purchase.id}
                    onSuccess={fetchPurchases}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={deletingId === purchase.id}>
                        {deletingId === purchase.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Покупець: <strong>{purchase.buyer.name}</strong></span>
                </div>
                {purchase.driver && (
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Водій: <strong>{purchase.driver.name}</strong></span>
                  </div>
                )}
              </div>

              {purchase.purchase_items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Позиції:</h4>
                  <div className="space-y-1">
                    {purchase.purchase_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{item.coffee_type.name} {item.coffee_type.brand && `(${item.coffee_type.brand})`}</span>
                        <Badge variant="secondary">{item.quantity} уп.</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {purchase.notes && (
                <p className="text-sm text-muted-foreground italic">{purchase.notes}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};