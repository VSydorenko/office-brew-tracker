import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/ui/auth-provider';
import { useToast } from '@/hooks/use-toast';

const MyPayments = () => {
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMyDistributions();
    }
  }, [user]);

  const fetchMyDistributions = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_distributions')
        .select(`
          *,
          purchases!inner(
            id,
            date,
            total_amount,
            profiles!purchases_buyer_id_fkey(name)
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDistributions(data || []);
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

      fetchMyDistributions();
    } catch (error) {
      console.error('Помилка оновлення статусу:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити статус оплати",
        variant: "destructive",
      });
    }
  };

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
        
        {distributions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Поки що немає розрахунків</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {distributions.map((dist: any) => (
              <Card key={dist.id} className="shadow-coffee">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Покупка від {new Date(dist.purchases.date).toLocaleDateString('uk-UA')}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Покупець: {dist.purchases.profiles.name}
                      </p>
                    </div>
                    <Badge variant={dist.is_paid ? "default" : "destructive"}>
                      {dist.is_paid ? 'Оплачено' : 'До оплати'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Ваша частка: {dist.percentage}%
                      </p>
                      <p className="text-lg font-semibold">
                        {(dist.adjusted_amount || dist.calculated_amount).toFixed(2)} ₴
                      </p>
                    </div>
                    {!dist.is_paid && (
                      <Button onClick={() => markAsPaid(dist.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Позначити як оплачено
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPayments;