
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import {
  Coffee,
  ShoppingCart,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  UserCheck,
  Wallet,
  PercentCircle,
  ActivitySquare,
} from 'lucide-react';
import { PurchaseFormDialog } from '@/components/purchases/PurchaseFormDialog';
import { CoffeeForm } from '@/components/coffee/CoffeeForm';
import { DistributionTemplateForm } from '@/components/distribution/DistributionTemplateForm';

import { KpiCard } from '@/components/dashboard/KpiCard';
import { PeriodSelector } from '@/components/dashboard/PeriodSelector';
import { SpendingChart, SpendingPoint } from '@/components/dashboard/SpendingChart';
import { TopCoffeesBar, TopCoffeeItem } from '@/components/dashboard/TopCoffeesBar';
import { TopDriversChart, DriversStackPoint } from '@/components/dashboard/TopDriversChart';
import { StatusDonut, StatusItem } from '@/components/dashboard/StatusDonut';
import { RecentPurchasesList, EnrichedPurchase } from '@/components/dashboard/RecentPurchasesList';

/**
 * Допоміжна функція: отримати дати початку і кінця періоду в місяцях від сьогодні.
 */
function getDateRangeForMonths(months: number) {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - months + 1);
  start.setDate(1);
  // Кінець поточного місяця
  const endDate = new Date(end.getFullYear(), end.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(endDate) };
}

interface Kpis {
  purchases_count: number;
  total_spent: number;
  average_check: number;
  unpaid_total: number;
  my_unpaid_total: number;
  active_users: number;
}

const Dashboard = () => {
  const [months, setMonths] = useState<number>(6);
  const [loading, setLoading] = useState<boolean>(true);

  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [spending, setSpending] = useState<SpendingPoint[]>([]);
  const [topCoffees, setTopCoffees] = useState<TopCoffeeItem[]>([]);
  const [statusData, setStatusData] = useState<StatusItem[]>([]);
  const [recent, setRecent] = useState<EnrichedPurchase[]>([]);
  const [driversData, setDriversData] = useState<DriversStackPoint[]>([]);
  const [driverKeys, setDriverKeys] = useState<string[]>([]);

  const { toast } = useToast();
  const navigate = useNavigate();

  const { start, end } = useMemo(() => getDateRangeForMonths(months), [months]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  /**
   * Завантаження всіх даних дашборда паралельно через RPC.
   */
  const fetchAll = async () => {
    setLoading(true);
    try {
      // KPIs
      const kpisReq = supabase.rpc('get_dashboard_kpis', {
        start_date: start,
        end_date: end,
      });

      // Timeseries
      const spendingReq = supabase.rpc('get_spending_timeseries', {
        start_date: start,
        end_date: end,
      });

      // Top coffees by qty (5)
      const topCoffeesReq = supabase.rpc('get_top_coffees_by_qty', {
        start_date: start,
        end_date: end,
        limit_n: 5,
      });

      // Top drivers monthly (5)
      const topDriversReq = supabase.rpc('get_top_drivers_with_monthly', {
        start_date: start,
        end_date: end,
        limit_n: 5,
      });

      // Status breakdown
      const statusReq = supabase.rpc('get_status_breakdown', {
        start_date: start,
        end_date: end,
      });

      // Recent purchases enriched (5)
      const recentReq = supabase.rpc('get_recent_purchases_enriched', {
        limit_n: 5,
      });

      const [
        kpisRes,
        spendingRes,
        topCoffeesRes,
        topDriversRes,
        statusRes,
        recentRes,
      ] = await Promise.all([
        kpisReq,
        spendingReq,
        topCoffeesReq,
        topDriversReq,
        statusReq,
        recentReq,
      ]);

      if (kpisRes.error) throw kpisRes.error;
      if (spendingRes.error) throw spendingRes.error;
      if (topCoffeesRes.error) throw topCoffeesRes.error;
      if (topDriversRes.error) throw topDriversRes.error;
      if (statusRes.error) throw statusRes.error;
      if (recentRes.error) throw recentRes.error;

      const kpisRow = (kpisRes.data || [])[0] || null;
      if (kpisRow) {
        setKpis({
          purchases_count: Number(kpisRow.purchases_count || 0),
          total_spent: Number(kpisRow.total_spent || 0),
          average_check: Number(kpisRow.average_check || 0),
          unpaid_total: Number(kpisRow.unpaid_total || 0),
          my_unpaid_total: Number(kpisRow.my_unpaid_total || 0),
          active_users: Number(kpisRow.active_users || 0),
        });
      } else {
        setKpis(null);
      }

      const spendingData: SpendingPoint[] = (spendingRes.data || []).map((r: any) => ({
        month: new Date(r.month_start).toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' }),
        total_spent: Number(r.total_spent || 0),
      }));
      setSpending(spendingData);

      const topCoffeesData: TopCoffeeItem[] = (topCoffeesRes.data || []).map((r: any) => ({
        coffee_name: r.coffee_name,
        total_qty: Number(r.total_qty || 0),
      }));
      setTopCoffees(topCoffeesData);

      const rawDrivers = (topDriversRes.data || []) as Array<{
        driver_id: string;
        driver_name: string;
        month_start: string | null;
        trips: number | null;
        total_trips: number;
      }>;

      // Отримуємо унікальні місяці як ISO-дати та імена водіїв
      const monthsIsoSet = new Set<string>();
      const driverNamesSet = new Set<string>();
      rawDrivers.forEach((row) => {
        if (row.driver_name) driverNamesSet.add(row.driver_name);
        if (row.month_start) monthsIsoSet.add(row.month_start);
      });
      const monthsIso = Array.from(monthsIsoSet).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
      const driverNames = Array.from(driverNamesSet);

      // Ініціалізуємо рядки з нулями
      const stack: DriversStackPoint[] = monthsIso.map((iso) => {
        const label = new Date(iso).toLocaleDateString('uk-UA', {
          month: 'short',
          year: 'numeric',
        });
        const base: DriversStackPoint = { month: label };
        driverNames.forEach((n) => (base[n] = 0));
        return base;
      });

      rawDrivers.forEach((row) => {
        if (!row.month_start || !row.driver_name) return;
        const idx = monthsIso.indexOf(row.month_start);
        if (idx >= 0) {
          stack[idx][row.driver_name] = Number(row.trips || 0);
        }
      });

      setDriversData(stack);
      setDriverKeys(driverNames);

      const statusItems: StatusItem[] = (statusRes.data || []).map((r: any) => ({
        status: r.status || 'draft',
        cnt: Number(r.cnt || 0),
      }));
      setStatusData(statusItems);

      const recentData: EnrichedPurchase[] = (recentRes.data || []).map((r: any) => ({
        id: r.id,
        date: r.date,
        total_amount: Number(r.total_amount || 0),
        distribution_status: r.distribution_status,
        buyer_name: r.buyer_name,
        participants_count: Number(r.participants_count || 0),
        paid_count: Number(r.paid_count || 0),
        unpaid_count: Number(r.unpaid_count || 0),
        amount_paid: Number(r.amount_paid || 0),
        amount_unpaid: Number(r.amount_unpaid || 0),
      }));
      setRecent(recentData);
    } catch (error: any) {
      console.error('Dashboard fetch error', error);
      toast({
        title: 'Помилка завантаження',
        description: error?.message || 'Не вдалося завантажити дані дашборда',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency0 = (n?: number) =>
    `₴${Number(n || 0).toLocaleString('uk-UA', { maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-brew p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-6 md:h-8 bg-muted rounded w-1/2 md:w-1/3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 md:h-28 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="h-72 bg-muted rounded"></div>
              <div className="h-72 bg-muted rounded"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="h-72 bg-muted rounded"></div>
              <div className="h-72 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-brew">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Дашборд</h1>
            <p className="text-sm text-muted-foreground">
              Огляд ключових метрик, боргів, ТОПів та активності
            </p>
          </div>
          <PeriodSelector value={months} onChange={setMonths} />
        </div>

        {/* KPI картки (клікабельні) */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6">
          <KpiCard
            title="Всього покупок"
            value={kpis?.purchases_count ?? 0}
            subtitle="За обраний період"
            icon={<ShoppingCart className="h-4 w-4 text-primary" />}
            onClick={() => navigate('/purchases')}
          />
          <KpiCard
            title="Загальна сума"
            value={formatCurrency0(kpis?.total_spent)}
            subtitle="Сума витрат"
            icon={<DollarSign className="h-4 w-4 text-primary" />}
            onClick={() => navigate('/purchases')}
          />
          <KpiCard
            title="Середній чек"
            value={formatCurrency0(kpis?.average_check)}
            subtitle="Середня сума покупки"
            icon={<PercentCircle className="h-4 w-4 text-primary" />}
            onClick={() => navigate('/purchases')}
          />
          <KpiCard
            title="Борги (всього)"
            value={formatCurrency0(kpis?.unpaid_total)}
            subtitle="Несплачені розподіли"
            icon={<Wallet className="h-4 w-4 text-primary" />}
            onClick={() => navigate('/my-payments')}
          />
          <KpiCard
            title="Мої борги"
            value={formatCurrency0(kpis?.my_unpaid_total)}
            subtitle="Особисті несплати"
            icon={<ActivitySquare className="h-4 w-4 text-primary" />}
            onClick={() => navigate('/my-payments')}
          />
          <KpiCard
            title="Активні користувачі"
            value={kpis?.active_users ?? 0}
            subtitle="Унікальні учасники"
            icon={<UserCheck className="h-4 w-4 text-primary" />}
            onClick={() => navigate('/settings')}
          />
        </div>

        {/* Швидкі дії */}
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <PurchaseFormDialog onSuccess={fetchAll}>
                <Button className="h-16 md:h-20 bg-gradient-coffee shadow-brew text-xs md:text-sm w-full">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                  <span>Нова покупка</span>
                </Button>
              </PurchaseFormDialog>
              <CoffeeForm onSuccess={fetchAll}>
                <Button variant="outline" className="h-16 md:h-20 border-primary hover:bg-primary/10 text-xs md:text-sm w-full">
                  <Coffee className="h-5 w-5 md:h-6 md:w-6" />
                  <span>Додати каву</span>
                </Button>
              </CoffeeForm>
              <DistributionTemplateForm onSuccess={fetchAll}>
                <Button variant="outline" className="h-16 md:h-20 border-primary hover:bg-primary/10 text-xs md:text-sm w-full">
                  <Users className="h-5 w-5 md:h-6 md:w-6" />
                  <span>Новий шаблон</span>
                </Button>
              </DistributionTemplateForm>
            </div>
          </CardContent>
        </Card>

        {/* Графіки: витрати та статуси */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="shadow-coffee">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Динаміка витрат
              </CardTitle>
              <CardDescription className="text-sm">
                Суми покупок по місяцях
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <SpendingChart data={spending} />
            </CardContent>
          </Card>

          <Card className="shadow-coffee">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Package className="h-5 w-5 text-primary" />
                Розподіл статусів
              </CardTitle>
              <CardDescription className="text-sm">
                Частка покупок за статусами
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <StatusDonut data={statusData} />
            </CardContent>
          </Card>
        </div>

        {/* ТОРи: Кава і Водії */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card className="shadow-coffee">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Coffee className="h-5 w-5 text-primary" />
                ТОП-5 кави за кількістю
              </CardTitle>
              <CardDescription className="text-sm">
                Найчастіше купувані позиції
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <TopCoffeesBar data={topCoffees} />
            </CardContent>
          </Card>

          <Card className="shadow-coffee">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Users className="h-5 w-5 text-primary" />
                Хто частіше їздить (помісячно)
              </CardTitle>
              <CardDescription className="text-sm">
                Стек поїздок топ-водіїв за період
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <TopDriversChart data={driversData} driverKeys={driverKeys} />
            </CardContent>
          </Card>
        </div>

        {/* Останні покупки (збагачені) */}
        <RecentPurchasesList data={recent} />
      </div>
    </div>
  );
};

export default Dashboard;
