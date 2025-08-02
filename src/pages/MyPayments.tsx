import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/ui/auth-provider';
import { useToast } from '@/hooks/use-toast';

const MyPayments = () => {
  const [owedToMe, setOwedToMe] = useState([]);
  const [iOwe, setIOwe] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMyPayments();
    }
  }, [user]);

  const fetchMyPayments = async () => {
    try {
      // Запит для "Мені винні" - покупки де я покупець, а інші мають доплатити
      const { data: owedToMeData, error: owedToMeError } = await supabase
        .from('purchase_distributions')
        .select(`
          *,
          purchases!inner(
            id,
            date,
            total_amount,
            buyer_id
          ),
          profiles!purchase_distributions_user_id_fkey(name)
        `)
        .eq('purchases.buyer_id', user?.id)
        .neq('user_id', user?.id)
        .eq('is_paid', false)
        .order('created_at', { ascending: false });

      if (owedToMeError) throw owedToMeError;

      // Запит для "Я винен" - покупки де я в розподілі, але не покупець
      const { data: iOweData, error: iOweError } = await supabase
        .from('purchase_distributions')
        .select(`
          *,
          purchases!inner(
            id,
            date,
            total_amount,
            buyer_id,
            profiles!purchases_buyer_id_fkey(name)
          )
        `)
        .eq('user_id', user?.id)
        .neq('purchases.buyer_id', user?.id)
        .eq('is_paid', false)
        .order('created_at', { ascending: false });

      if (iOweError) throw iOweError;

      setOwedToMe(owedToMeData || []);
      setIOwe(iOweData || []);
    } catch (error) {
      console.error('Помилка завантаження розрахунків:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити розрахунки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (distributionId: string) => {
    try {
      const { error } = await supabase
        .from('purchase_distributions')
        .update({ 
          is_paid: true, 
          paid_at: new Date().toISOString() 
        })
        .eq('id', distributionId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: "Позначено як оплачено",
      });

      fetchMyPayments();
    } catch (error) {
      console.error('Помилка оновлення статусу:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити статус оплати",
        variant: "destructive",
      });
    }
  };

  // Розрахунок підсумків
  const totalOwedToMe = owedToMe.reduce((sum, item: any) => 
    sum + (item.adjusted_amount || item.calculated_amount), 0);
  const totalIOwe = iOwe.reduce((sum, item: any) => 
    sum + (item.adjusted_amount || item.calculated_amount), 0);

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
        <h1 className="text-3xl font-bold text-primary">Мої розрахунки</h1>
        
        {/* Підсумкові плашки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Мені винні</p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-100">
                    {totalOwedToMe.toFixed(2)} ₴
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Я винен</p>
                  <p className="text-xl font-bold text-red-900 dark:text-red-100">
                    {totalIOwe.toFixed(2)} ₴
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Секція "Мені винні" */}
        {owedToMe.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-green-700 dark:text-green-300 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Мені винні ({owedToMe.length})
            </h2>
            <div className="space-y-3">
              {owedToMe.map((debt: any) => (
                <Card key={debt.id} className="shadow-coffee border-l-2 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {debt.profiles.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Покупка від {new Date(debt.purchases.date).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-500">
                        До отримання
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Частка: {debt.percentage}%
                        </p>
                        <p className="text-lg font-semibold text-green-700">
                          {(debt.adjusted_amount || debt.calculated_amount).toFixed(2)} ₴
                        </p>
                      </div>
                      <Button 
                        onClick={() => markAsPaid(debt.id)}
                        variant="outline"
                        className="border-green-500 text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Отримано
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Секція "Я винен" */}
        {iOwe.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 flex items-center">
              <TrendingDown className="h-5 w-5 mr-2" />
              Я винен ({iOwe.length})
            </h2>
            <div className="space-y-3">
              {iOwe.map((debt: any) => (
                <Card key={debt.id} className="shadow-coffee border-l-2 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {debt.purchases.profiles.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Покупка від {new Date(debt.purchases.date).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        До сплати
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Моя частка: {debt.percentage}%
                        </p>
                        <p className="text-lg font-semibold text-red-700">
                          {(debt.adjusted_amount || debt.calculated_amount).toFixed(2)} ₴
                        </p>
                      </div>
                      <Button 
                        onClick={() => markAsPaid(debt.id)}
                        variant="destructive"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Сплачено
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Повідомлення коли немає боргів */}
        {owedToMe.length === 0 && iOwe.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Немає неоплачених розрахунків</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyPayments;