import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Car, Coffee, DollarSign } from 'lucide-react';

interface Purchase {
  id: string;
  date: string;
  total_amount: number;
  notes?: string;
  buyer: { name: string };
  driver?: { name: string };
  purchase_items: {
    quantity: number;
    unit_price?: number;
    coffee_type: { name: string; brand?: string };
  }[];
}

export const PurchaseList = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
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