/**
 * React Query хуки для Dashboard даних
 */
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useRealtimeInvalidation } from './use-supabase-query';
import { queryKeys } from '@/lib/query-client';
import type { DriversStackPoint } from '@/components/dashboard/TopDriversChart';

/**
 * Тип KPI данних Dashboard
 */
export interface DashboardKPIs {
  purchases_count: number;
  total_spent: number;
  average_check: number;
  unpaid_total: number;
  my_unpaid_total: number;
  active_users: number;
}

/**
 * Тип даних витрат за часом
 */
export interface SpendingTimeseries {
  month_start: string;
  purchases_count: number;
  total_spent: number;
}

/**
 * Тип даних топ кави
 */
export interface TopCoffeeItem {
  coffee_type_id: string;
  coffee_name: string;
  total_qty: number;
}

/**
 * Тип даних топ водіїв
 */
export interface TopDriverItem {
  driver_id: string;
  driver_name: string;
  month_start: string;
  trips: number;
  total_trips: number;
}

/**
 * Тип даних статусів покупок
 */
export interface StatusBreakdownItem {
  status: string;
  cnt: number;
}

/**
 * Тип даних останніх покупок
 */
export interface RecentPurchaseItem {
  id: string;
  date: string;
  total_amount: number;
  distribution_status: string;
  buyer_name: string;
  participants_count: number;
  paid_count: number;
  unpaid_count: number;
  amount_paid: number;
  amount_unpaid: number;
}

/**
 * Хук для отримання KPI Dashboard
 */
export function useDashboardKPIs(startDate?: string, endDate?: string) {
  const query = useSupabaseQuery(
    queryKeys.dashboard.kpis(startDate, endDate),
    async () => {
      return supabase.rpc('get_dashboard_kpis', {
        start_date: startDate || null,
        end_date: endDate || null,
      });
    },
    {
      staleTime: 2 * 60 * 1000, // 2 хвилини
    }
  );

  // Realtime оновлення для покупок та розподілів
  useRealtimeInvalidation('purchases', [[...queryKeys.dashboard.kpis(startDate, endDate)]]);
  useRealtimeInvalidation('purchase_distributions', [[...queryKeys.dashboard.kpis(startDate, endDate)]]);

  return query;
}

/**
 * Хук для отримання даних витрат за часом
 */
export function useSpendingTimeseries(startDate?: string, endDate?: string) {
  return useSupabaseQuery(
    queryKeys.dashboard.spending(startDate, endDate),
    async () => {
      return supabase.rpc('get_spending_timeseries', {
        start_date: startDate || null,
        end_date: endDate || null,
      });
    },
    {
      select: (data) => {
        // data - вже масив, не потрібно .data
        return (data || []).map((r: any) => ({
          month: new Date(r.month_start).toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' }),
          total_spent: Number(r.total_spent || 0),
        }));
      },
      staleTime: 5 * 60 * 1000, // 5 хвилин - змінюється рідше
    }
  );
}

/**
 * Хук для отримання топ кави за кількістю
 */
export function useTopCoffees(startDate?: string, endDate?: string, limit = 5) {
  return useSupabaseQuery(
    queryKeys.dashboard.topCoffees(startDate, endDate),
    async () => {
      return supabase.rpc('get_top_coffees_by_qty', {
        start_date: startDate || null,
        end_date: endDate || null,
        limit_n: limit,
      });
    },
    {
      staleTime: 5 * 60 * 1000, // 5 хвилин
    }
  );
}

/**
 * Хук для отримання топ водіїв з помісячними даними
 */
export function useTopDrivers(startDate?: string, endDate?: string, limit = 5) {
  return useSupabaseQuery(
    queryKeys.dashboard.topDrivers(startDate, endDate),
    async () => {
      return supabase.rpc('get_top_drivers_with_monthly', {
        start_date: startDate || null,
        end_date: endDate || null,
        limit_n: limit,
      });
    },
    {
      select: (data) => {
        // Трансформуємо сирі дані в стек-структуру для графіку
        const rawDrivers = data || [];
        
        // Отримуємо унікальні місяці та імена водіїв
        const monthsIsoSet = new Set<string>();
        const driverNamesSet = new Set<string>();
        rawDrivers.forEach((row: any) => {
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

        // Заповнюємо реальними даними
        rawDrivers.forEach((row: any) => {
          if (!row.month_start || !row.driver_name) return;
          const idx = monthsIso.indexOf(row.month_start);
          if (idx >= 0) {
            stack[idx][row.driver_name] = Number(row.trips || 0);
          }
        });

        return stack;
      },
      staleTime: 5 * 60 * 1000, // 5 хвилин
    }
  );
}

/**
 * Хук для отримання останніх покупок
 */
export function useRecentPurchasesDashboard(limit = 5) {
  return useSupabaseQuery(
    queryKeys.dashboard.recentPurchases(limit),
    async () => {
      return supabase.rpc('get_recent_purchases_enriched', {
        limit_n: limit,
      });
    },
    {
      staleTime: 1 * 60 * 1000, // 1 хвилина
    }
  );
}

/**
 * Хук для отримання розбивки статусів покупок
 */
export function useStatusBreakdown(startDate?: string, endDate?: string) {
  return useSupabaseQuery(
    queryKeys.dashboard.statusBreakdown(startDate, endDate),
    async () => {
      return supabase.rpc('get_status_breakdown', {
        start_date: startDate || null,
        end_date: endDate || null,
      });
    },
    {
      staleTime: 3 * 60 * 1000, // 3 хвилини
    }
  );
}