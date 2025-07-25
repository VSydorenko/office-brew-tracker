import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Coffee, Package, TrendingUp, ShoppingCart, Calendar } from 'lucide-react';

interface CoffeeType {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  package_size?: string;
  created_at: string;
  updated_at: string;
}

interface PurchaseItem {
  id: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  purchase: {
    id: string;
    date: string;
    buyer: {
      name: string;
    };
  };
}

const CoffeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coffee, setCoffee] = useState<CoffeeType | null>(null);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/coffee-catalog');
      return;
    }
    fetchCoffeeData();
  }, [id]);

  const fetchCoffeeData = async () => {
    try {
      setLoading(true);
      
      // Fetch coffee details
      const { data: coffeeData, error: coffeeError } = await supabase
        .from('coffee_types')
        .select('*')
        .eq('id', id)
        .single();

      if (coffeeError) throw coffeeError;
      setCoffee(coffeeData);

      // Fetch purchase history for this coffee type
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchase_items')
        .select(`
          *,
          purchase:purchases (
            id,
            date,
            buyer:profiles!purchases_buyer_id_fkey (
              name
            )
          )
        `)
        .eq('coffee_type_id', id)
        .order('created_at', { ascending: false });

      if (purchaseError) throw purchaseError;
      setPurchases(purchaseData || []);

    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося завантажити дані про каву",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  // Calculate statistics
  const totalPurchases = purchases.length;
  const totalQuantity = purchases.reduce((sum, item) => sum + item.quantity, 0);
  const totalSpent = purchases.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const avgPrice = purchases.filter(p => p.unit_price).length > 0 
    ? purchases.filter(p => p.unit_price).reduce((sum, item) => sum + (item.unit_price || 0), 0) / purchases.filter(p => p.unit_price).length
    : 0;

  // Price history for chart
  const priceHistory = purchases
    .filter(p => p.unit_price)
    .map(p => ({
      date: p.purchase.date,
      price: p.unit_price!,
      quantity: p.quantity
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/coffee-catalog')}
            className="text-coffee-dark hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад до каталогу
          </Button>
        </div>

        {/* Coffee Info */}
        <Card className="shadow-coffee">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Coffee className="h-6 w-6 text-coffee-dark" />
                  <CardTitle className="text-2xl text-primary">{coffee.name}</CardTitle>
                </div>
                {coffee.brand && (
                  <Badge variant="secondary" className="bg-coffee-light/20 text-coffee-dark">
                    {coffee.brand}
                  </Badge>
                )}
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
              {coffee.package_size && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-coffee-dark" />
                  <span className="font-medium">Розмір упаковки:</span>
                  <span>{coffee.package_size}</span>
                </div>
              )}
            </div>
            
            {coffee.description && (
              <div>
                <h4 className="font-medium mb-2">Опис:</h4>
                <p className="text-muted-foreground">{coffee.description}</p>
              </div>
            )}
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
                  <p className="text-xl font-bold text-primary">₴{totalSpent.toFixed(0)}</p>
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
                      <p className="text-sm text-muted-foreground">
                        Покупець: {item.purchase.buyer.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.quantity} уп.</p>
                      {item.unit_price && (
                        <p className="text-sm text-muted-foreground">₴{item.unit_price} за уп.</p>
                      )}
                      {item.total_price && (
                        <p className="text-sm font-medium">Всього: ₴{item.total_price}</p>
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