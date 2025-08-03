import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import {
  Coffee,
  ShoppingCart,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  UserCheck
} from 'lucide-react';
import heroImage from '@/assets/hero-coffee.jpg';

interface DashboardStats {
  totalPurchases: number;
  totalSpent: number;
  totalCoffeeTypes: number;
  activeUsers: number;
  recentPurchases: Array<{
    id: string;
    date: string;
    total_amount: number;
    buyer_name: string;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch purchases count and total spent
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          id,
          date,
          total_amount,
          profiles!buyer_id(name)
        `)
        .order('date', { ascending: false })
        .limit(5);

      if (purchasesError) throw purchasesError;

      // Fetch coffee types count
      const { count: coffeeTypesCount, error: coffeeTypesError } = await supabase
        .from('coffee_types')
        .select('*', { count: 'exact' });

      if (coffeeTypesError) throw coffeeTypesError;

      // Fetch active users count
      const { count: activeUsersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (usersError) throw usersError;

      // Calculate totals
      const totalPurchases = purchases?.length || 0;
      const totalSpent = purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

      const recentPurchases = purchases?.map(p => ({
        id: p.id,
        date: p.date,
        total_amount: Number(p.total_amount),
        buyer_name: (p.profiles as any)?.name || 'Невідомо'
      })) || [];

      setStats({
        totalPurchases,
        totalSpent,
        totalCoffeeTypes: coffeeTypesCount || 0,
        activeUsers: activeUsersCount || 0,
        recentPurchases
      });
    } catch (error: any) {
      toast({
        title: "Помилка завантаження",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-brew p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-6 md:h-8 bg-muted rounded w-1/2 md:w-1/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 md:h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-40 md:h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-brew">
      {/* Mobile-optimized Hero Section */}
      <div 
        className="relative h-48 md:h-64 lg:h-80 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-primary/60"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">Система обліку кави</h1>
            <p className="text-base md:text-xl text-white/90 hidden sm:block">
              Відстежуйте покупки, розподіл та аналітику споживання кави в офісі
            </p>
            <p className="text-sm text-white/90 sm:hidden">
              Відстежуйте покупки та споживання кави
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Mobile-first Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="shadow-brew transition-coffee hover:shadow-coffee">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Всього покупок</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold text-primary">{stats?.totalPurchases || 0}</div>
              <p className="text-xs text-muted-foreground">
                За весь час
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-brew transition-coffee hover:shadow-coffee">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Загальна сума</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold text-primary">
                ₴{stats?.totalSpent?.toFixed(0) || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Витрачено на каву
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-brew transition-coffee hover:shadow-coffee">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Типів кави</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold text-primary">{stats?.totalCoffeeTypes || 0}</div>
              <p className="text-xs text-muted-foreground">
                В каталозі
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-brew transition-coffee hover:shadow-coffee">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">Активних користувачів</CardTitle>
              <UserCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-lg md:text-2xl font-bold text-primary">{stats?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Зареєстровано
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-optimized Quick Actions */}
        <Card className="shadow-coffee">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Швидкі дії
            </CardTitle>
            <CardDescription className="text-sm">
              Основні операції для роботи з системою
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Button asChild className="h-16 md:h-20 bg-gradient-coffee shadow-brew text-xs md:text-sm">
                <Link to="/purchases" className="flex flex-col items-center gap-1 md:gap-2">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                  <span>Нова покупка</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16 md:h-20 border-primary hover:bg-primary/10 text-xs md:text-sm">
                <Link to="/coffee-catalog" className="flex flex-col items-center gap-1 md:gap-2">
                  <Coffee className="h-5 w-5 md:h-6 md:w-6" />
                  <span>Каталог кави</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16 md:h-20 border-primary hover:bg-primary/10 text-xs md:text-sm">
                <Link to="/consumption" className="flex flex-col items-center gap-1 md:gap-2">
                  <Users className="h-5 w-5 md:h-6 md:w-6" />
                  <span>Розподіл</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-16 md:h-20 border-primary hover:bg-primary/10 text-xs md:text-sm">
                <Link to="/settings" className="flex flex-col items-center gap-1 md:gap-2">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                  <span>Аналітика</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-optimized Recent Purchases */}
        <Card className="shadow-coffee">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Останні покупки
            </CardTitle>
            <CardDescription className="text-sm">
              Нещодавні покупки кави в офісі
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {stats.recentPurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-3 md:p-4 border border-border rounded-lg bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">{purchase.buyer_name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {new Date(purchase.date).toLocaleDateString('uk-UA')}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-primary text-sm md:text-base">
                        ₴{purchase.total_amount.toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-2 md:pt-4">
                  <Button asChild variant="outline" className="w-full h-10 md:h-auto">
                    <Link to="/purchases">Переглянути всі покупки</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 md:py-8">
                <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm md:text-base">Покупок ще немає</p>
                <Button asChild className="mt-4 h-10 md:h-auto">
                  <Link to="/purchases">Додати першу покупку</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;