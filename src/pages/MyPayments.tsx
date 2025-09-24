import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, TrendingUp, TrendingDown, User, ShoppingCart, Bell, BellOff, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/ui/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { PaymentRecord } from '@/components/purchases/PaymentRecord';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/use-supabase-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-client';

// Користувацький хук для отримання даних по платежах
const useMyPaymentsData = () => {
  const { user } = useAuth();
  
  // Запит для "Мені винні"
  const owedToMeQuery = useSupabaseQuery(
    queryKeys.distributions.myPayments,
    async () => {
      if (!user) return { data: [], error: null };
      
      return await supabase
        .from('purchase_distributions')
        .select(`
          *,
          purchases!inner(
            id,
            date,
            total_amount,
            buyer_id
          ),
          profiles!purchase_distributions_user_id_fkey(name, avatar_path, avatar_url, card_number, card_holder_name)
        `)
        .eq('purchases.buyer_id', user.id)
        .neq('user_id', user.id)
        .eq('is_paid', false)
        .order('created_at', { ascending: false });
    },
    { requireAuth: true }
  );

  // Запит для "Я винен"
  const iOweQuery = useSupabaseQuery(
    ['distributions', 'i-owe'],
    async () => {
      if (!user) return { data: [], error: null };
      
      return await supabase
        .from('purchase_distributions')
        .select(`
          *,
          purchases!inner(
            id,
            date,
            total_amount,
            buyer_id,
            profiles!purchases_buyer_id_fkey(name, avatar_path, avatar_url, card_number, card_holder_name)
          )
        `)
        .eq('user_id', user.id)
        .neq('purchases.buyer_id', user.id)
        .eq('is_paid', false)
        .order('created_at', { ascending: false });
    },
    { requireAuth: true }
  );

  // Всі мої розподіли
  const allDistributionsQuery = useSupabaseQuery(
    ['distributions', 'all-mine'],
    async () => {
      if (!user) return { data: [], error: null };
      
      return await supabase
        .from('purchase_distributions')
        .select(`
          *,
          purchases!inner(
            id,
            date,
            total_amount,
            buyer_id,
            profiles!purchases_buyer_id_fkey(name, avatar_path, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    },
    { requireAuth: true }
  );

  return {
    owedToMe: owedToMeQuery.data || [],
    iOwe: iOweQuery.data || [],
    allDistributions: allDistributionsQuery.data || [],
    loading: owedToMeQuery.isLoading || iOweQuery.isLoading || allDistributionsQuery.isLoading,
    refetch: () => {
      owedToMeQuery.refetch();
      iOweQuery.refetch();
      allDistributionsQuery.refetch();
    }
  };
};

const MyPayments = () => {
  const [viewMode, setViewMode] = useState('user');
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupported, isEnabled, enableNotifications, disableNotifications } = useNotifications();

  const { owedToMe, iOwe, allDistributions, loading, refetch } = useMyPaymentsData();

  const markAsPaidMutation = useSupabaseMutation(
    async (distributionId: string) => {
      return await supabase
        .from('purchase_distributions')
        .update({ 
          is_paid: true, 
          paid_at: new Date().toISOString() 
        })
        .eq('id', distributionId);
    },
    {
      onSuccess: () => {
        toast({
          title: "Успіх",
          description: "Позначено як оплачено",
        });
        refetch();
      },
      onError: (error) => {
        toast({
          title: "Помилка",
          description: "Не вдалося оновити статус оплати",
          variant: "destructive",
        });
      }
    }
  );

  const markAsPaid = (distributionId: string) => {
    markAsPaidMutation.mutate(distributionId);
  };

  // Фільтрація даних
  const getFilteredData = () => {
    if (showAll) {
      const myOwedToMe = allDistributions.filter(dist => 
        dist.purchases.buyer_id === user?.id && dist.user_id !== user?.id
      );
      const myIOwe = allDistributions.filter(dist => 
        dist.purchases.buyer_id !== user?.id
      );
      return { owedToMe: myOwedToMe, iOwe: myIOwe };
    }
    return { owedToMe, iOwe };
  };

  const { owedToMe: filteredOwedToMe, iOwe: filteredIOwe } = getFilteredData();

  // Групування по користувачах для "Мені винні"
  const groupOwedByUser = () => {
    const grouped = filteredOwedToMe.reduce((acc: any, debt: any) => {
      const userId = debt.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          userName: debt.profiles.name,
          totalAmount: 0,
          debts: []
        };
      }
      acc[userId].totalAmount += (debt.adjusted_amount || debt.calculated_amount);
      acc[userId].debts.push(debt);
      return acc;
    }, {});
    return Object.values(grouped);
  };

  // Групування по покупках для "Мені винні"
  const groupOwedByPurchase = () => {
    const grouped = filteredOwedToMe.reduce((acc: any, debt: any) => {
      const purchaseId = debt.purchase_id;
      if (!acc[purchaseId]) {
        acc[purchaseId] = {
          purchaseDate: debt.purchases.date,
          totalAmount: debt.purchases.total_amount,
          debts: []
        };
      }
      acc[purchaseId].debts.push(debt);
      return acc;
    }, {});
    return Object.values(grouped);
  };

  // Групування по користувачах для "Я винен"
  const groupIOweByUser = () => {
    const grouped = filteredIOwe.reduce((acc: any, debt: any) => {
      const buyerId = debt.purchases.buyer_id;
      if (!acc[buyerId]) {
        acc[buyerId] = {
          buyerName: debt.purchases.profiles.name,
          totalAmount: 0,
          debts: []
        };
      }
      acc[buyerId].totalAmount += (debt.adjusted_amount || debt.calculated_amount);
      acc[buyerId].debts.push(debt);
      return acc;
    }, {});
    return Object.values(grouped);
  };

  // Групування по покупках для "Я винен"
  const groupIOweByPurchase = () => {
    const grouped = filteredIOwe.reduce((acc: any, debt: any) => {
      const purchaseId = debt.purchase_id;
      if (!acc[purchaseId]) {
        acc[purchaseId] = {
          purchaseDate: debt.purchases.date,
          buyerName: debt.purchases.profiles.name,
          totalAmount: debt.purchases.total_amount,
          debts: []
        };
      }
      acc[purchaseId].debts.push(debt);
      return acc;
    }, {});
    return Object.values(grouped);
  };

  // Розрахунок підсумків
  const totalOwedToMe = filteredOwedToMe.reduce((sum, item: any) => 
    sum + (item.adjusted_amount || item.calculated_amount), 0);
  const totalIOwe = filteredIOwe.reduce((sum, item: any) => 
    sum + (item.adjusted_amount || item.calculated_amount), 0);

  const totalAllOwedToMe = allDistributions
    .filter(dist => dist.purchases.buyer_id === user?.id && dist.user_id !== user?.id)
    .reduce((sum, item: any) => sum + (item.adjusted_amount || item.calculated_amount), 0);
  const totalAllIOwe = allDistributions
    .filter(dist => dist.purchases.buyer_id !== user?.id)
    .reduce((sum, item: any) => sum + (item.adjusted_amount || item.calculated_amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-brew p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-primary mb-6">Мої розрахунки</h1>
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Мої розрахунки</h1>
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Оновити
          </Button>
        </div>

        {/* Налаштування сповіщень */}
        {isSupported && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isEnabled ? (
                    <Bell className="h-5 w-5 text-blue-600" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="notifications" className="text-base font-medium">
                      Браузерні сповіщення
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Отримувати сповіщення про нові борги та зміни статусу
                    </p>
                  </div>
                </div>
                <Switch
                  id="notifications"
                  checked={isEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      enableNotifications();
                    } else {
                      disableNotifications();
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Перемикач відображення */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all"
              checked={showAll}
              onCheckedChange={setShowAll}
            />
            <Label htmlFor="show-all" className="text-sm">
              Показати всю історію (включаючи оплачені)
            </Label>
          </div>
        </div>
        
        {/* Підсумкові плашки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {showAll ? 'Всього мені винні' : 'Мені винні'}
                  </p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">
                    {(showAll ? totalAllOwedToMe : totalOwedToMe).toFixed(2)} ₴
                  </p>
                  {showAll && (
                    <p className="text-xs text-green-600">
                      Неоплачено: {totalOwedToMe.toFixed(2)} ₴
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {showAll ? 'Всього я винен' : 'Я винен'}
                  </p>
                  <p className="text-xl font-bold text-red-900 dark:text-red-100">
                    {(showAll ? totalAllIOwe : totalIOwe).toFixed(2)} ₴
                  </p>
                  {showAll && (
                    <p className="text-xs text-red-600">
                      Неоплачено: {totalIOwe.toFixed(2)} ₴
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Перемикач режимів відображення */}
        {(filteredOwedToMe.length > 0 || filteredIOwe.length > 0) && (
          <div className="flex justify-center">
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(value) => value && setViewMode(value)}
              className="bg-background p-1 rounded-lg border"
            >
              <ToggleGroupItem value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                По користувачах
              </ToggleGroupItem>
              <ToggleGroupItem value="purchase" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                По покупках
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {/* Секція "Мені винні" */}
        {filteredOwedToMe.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-green-700 dark:text-green-300 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              {showAll ? 'Всі надходження' : 'Мені винні'} ({filteredOwedToMe.length})
            </h2>
            
            {viewMode === 'user' ? (
              <div className="space-y-4">
                {groupOwedByUser().map((group: any, index: number) => (
                  <Card key={index} className="shadow-coffee border-l-2 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg text-green-700">
                          {group.userName}
                        </CardTitle>
                        <Badge variant="outline" className="text-green-700 border-green-500">
                          Загалом: {group.totalAmount.toFixed(2)} ₴
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {group.debts.map((debt: any) => (
                          <PaymentRecord
                            key={debt.id}
                            debt={debt}
                            onMarkAsPaid={markAsPaid}
                            showBuyerInfo={false}
                            showDateInfo={true}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {groupOwedByPurchase().map((group: any, index: number) => (
                  <Card key={index} className="shadow-coffee border-l-2 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg text-green-700">
                            Покупка від {new Date(group.purchaseDate).toLocaleDateString('uk-UA')}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Загальна сума: {group.totalAmount.toFixed(2)} ₴
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {group.debts.map((debt: any) => (
                          <PaymentRecord
                            key={debt.id}
                            debt={debt}
                            onMarkAsPaid={markAsPaid}
                            showBuyerInfo={true}
                            showDateInfo={false}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Секція "Я винен" */}
        {filteredIOwe.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 flex items-center">
              <TrendingDown className="h-5 w-5 mr-2" />
              {showAll ? 'Всі мої витрати' : 'Я винен'} ({filteredIOwe.length})
            </h2>
            
            {viewMode === 'user' ? (
              <div className="space-y-4">
                {groupIOweByUser().map((group: any, index: number) => (
                  <Card key={index} className="shadow-coffee border-l-2 border-l-red-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg text-red-700">
                          {group.buyerName}
                        </CardTitle>
                        <Badge variant="destructive">
                          Загалом: {group.totalAmount.toFixed(2)} ₴
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {group.debts.map((debt: any) => (
                          <PaymentRecord
                            key={debt.id}
                            debt={debt}
                            onMarkAsPaid={markAsPaid}
                            showBuyerInfo={false}
                            showDateInfo={true}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {groupIOweByPurchase().map((group: any, index: number) => (
                  <Card key={index} className="shadow-coffee border-l-2 border-l-red-500">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg text-red-700">
                            Покупка від {new Date(group.purchaseDate).toLocaleDateString('uk-UA')}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Покупець: {group.buyerName} • Загальна сума: {group.totalAmount.toFixed(2)} ₴
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {group.debts.map((debt: any) => (
                          <PaymentRecord
                            key={debt.id}
                            debt={debt}
                            onMarkAsPaid={markAsPaid}
                            showBuyerInfo={false}
                            showDateInfo={false}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Повідомлення коли немає боргів */}
        {filteredOwedToMe.length === 0 && filteredIOwe.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {showAll ? 'Немає записів в історії' : 'Немає неоплачених розрахунків'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyPayments;