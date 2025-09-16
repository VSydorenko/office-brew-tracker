/**
 * React Query хуки для роботи з покупками
 */
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useSupabaseMutation, useRealtimeInvalidation } from './use-supabase-query';
import { queryKeys } from '@/lib/query-client';

/**
 * Утилітарна функція для побудови розподілів з часток
 * Забезпечує коректне округлення відсотків та сум
 */
function buildDistributionsFromShares(
  templateUsers: Array<{ user_id: string; shares: number }>,
  totalAmount: number
): Array<{ user_id: string; shares: number; calculated_amount: number }> {
  if (templateUsers.length === 0 || totalAmount <= 0) {
    return [];
  }

  const totalShares = templateUsers.reduce((sum, user) => sum + user.shares, 0);
  if (totalShares <= 0) {
    return [];
  }

  // Розраховуємо суми з округленням до копійок
  const distributions = templateUsers.map(user => ({
    user_id: user.user_id,
    shares: user.shares,
    calculated_amount: 0, // Поки що 0, розрахуємо далі
  }));

  // Розраховуємо суми з точним розподілом за частками
  let totalCalculated = 0;
  for (let i = 0; i < distributions.length - 1; i++) {
    const amount = Math.round((totalAmount * distributions[i].shares) / totalShares * 100) / 100;
    distributions[i].calculated_amount = amount;
    totalCalculated += amount;
  }
  
  // Останньому користувачу присвоюємо залишок для точності
  distributions[distributions.length - 1].calculated_amount = 
    Math.round((totalAmount - totalCalculated) * 100) / 100;

  return distributions;
}

/**
 * Тип покупки
 */
export interface Purchase {
  id: string;
  date: string;
  total_amount: number;
  buyer_id: string;
  driver_id?: string;
  notes?: string;
  distribution_status: 'draft' | 'active' | 'locked' | 'amount_changed';
  original_total_amount?: number;
  locked_at?: string;
  locked_by?: string;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Тип позиції покупки
 */
export interface PurchaseItem {
  id: string;
  purchase_id: string;
  coffee_type_id: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  created_at: string;
}

/**
 * Покупка з деталями
 */
export interface PurchaseWithDetails extends Purchase {
  buyer?: { id: string; name: string };
  driver?: { id: string; name: string };
  purchase_items?: (PurchaseItem & {
    coffee_types?: { id: string; name: string };
  })[];
  purchase_distributions?: Array<{
    id: string;
    user_id: string;
    shares?: number;
    calculated_amount: number;
    adjusted_amount?: number;
    is_paid: boolean;
    profiles?: { id: string; name: string };
  }>;
}

/**
 * Дані для створення покупки
 */
export interface CreatePurchaseData {
  date: string;
  total_amount: number;
  buyer_id: string;
  driver_id?: string;
  notes?: string;
  template_id?: string;
  items: Array<{
    coffee_type_id: string;
    quantity: number;
    unit_price?: number;
    total_price?: number;
  }>;
  distributions?: Array<{
    /** @description Користувач-учасник розподілу */
    user_id: string;
    /** @description Кількість часток (використовується для розрахунку) */
    shares: number;
  }>;
}

/**
 * Хук для отримання всіх покупок
 */
export function usePurchases() {
  const query = useSupabaseQuery(
    queryKeys.purchases.all,
    async () => {
      return supabase
        .from('purchases')
        .select(`
          *,
          buyer:profiles!purchases_buyer_id_fkey(id, name),
          driver:profiles!purchases_driver_id_fkey(id, name),
          purchase_items(
            *,
            coffee_types(id, name, brand)
          ),
          purchase_distributions(
            id,
            user_id,
            shares,
            calculated_amount,
            adjusted_amount,
            is_paid,
            paid_at,
            version,
            adjustment_type,
            profiles(id, name, email, avatar_path, avatar_url)
          )
        `)
        .order('date', { ascending: false });
    },
    {
      staleTime: 2 * 60 * 1000, // 2 хвилини
    }
  );

  // Realtime оновлення для покупок
  useRealtimeInvalidation('purchases', [[...queryKeys.purchases.all]]);
  useRealtimeInvalidation('purchase_items', [[...queryKeys.purchases.all]]);
  useRealtimeInvalidation('purchase_distributions', [[...queryKeys.purchases.all]]);

  return query;
}

/**
 * Хук для отримання деталей покупки
 */
export function usePurchase(id: string) {
  return useSupabaseQuery(
    queryKeys.purchases.detail(id),
    async () => {
      return supabase
        .from('purchases')
        .select(`
          *,
          buyer:buyer_id(id, name),
          driver:driver_id(id, name),
          purchase_items(
            *,
            coffee_types(id, name)
          ),
          purchase_distributions(
            id,
            user_id,
            shares,
            calculated_amount,
            adjusted_amount,
            is_paid,
            notes,
            profiles:user_id(id, name)
          )
        `)
        .eq('id', id)
        .single();
    },
    {
      enabled: !!id,
      staleTime: 1 * 60 * 1000, // 1 хвилина
    }
  );
}

/**
 * Хук для отримання останніх покупок
 */
export function useRecentPurchases(limit = 5) {
  return useSupabaseQuery(
    queryKeys.purchases.recent(limit),
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
 * Хук для створення покупки
 */
export function useCreatePurchase() {
  return useSupabaseMutation(
    async (data: CreatePurchaseData) => {
      // Створюємо покупку
      const purchaseResult = await supabase
        .from('purchases')
        .insert({
          date: data.date,
          total_amount: data.total_amount,
          buyer_id: data.buyer_id,
          driver_id: data.driver_id,
          notes: data.notes,
          template_id: data.template_id,
        })
        .select()
        .single();

      if (purchaseResult.error) {
        return { data: null, error: purchaseResult.error };
      }

      const purchaseId = purchaseResult.data.id;

      // Додаємо позиції покупки
      if (data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
          ...item,
          purchase_id: purchaseId,
        }));

        const itemsResult = await supabase
          .from('purchase_items')
          .insert(itemsToInsert);

        if (itemsResult.error) {
          // Видаляємо покупку у випадку помилки
          await supabase.from('purchases').delete().eq('id', purchaseId);
          return { data: null, error: itemsResult.error };
        }
      }

      // Розраховуємо розподіли за шаблоном
      if (data.template_id) {
        let sourceDistributions: Array<{ user_id: string; shares: number }> = [];

        if (data.distributions && Array.isArray(data.distributions) && data.distributions.length > 0) {
          sourceDistributions = data.distributions.filter(dist => 
            dist.user_id && typeof dist.shares === 'number' && dist.shares > 0
          ) as Array<{ user_id: string; shares: number }>;
        }

        // Якщо з інтерфейсу нічого не прийшло — тягнемо користувачів з шаблону
        if (sourceDistributions.length === 0) {
          const templateResult = await supabase
            .from('distribution_templates')
            .select(`
              *,
              distribution_template_users (
                user_id,
                shares
              )
            `)
            .eq('id', data.template_id)
            .single();

          if (templateResult.data?.distribution_template_users?.length) {
            sourceDistributions = templateResult.data.distribution_template_users as Array<{ user_id: string; shares: number }>;
          }
        }

        if (sourceDistributions.length > 0) {
          const normalizedDistributions = buildDistributionsFromShares(
            sourceDistributions,
            data.total_amount || 0
          );

          const distributionsToInsert = normalizedDistributions.map(dist => ({
            purchase_id: purchaseId,
            user_id: dist.user_id,
            shares: dist.shares,
            calculated_amount: dist.calculated_amount,
          }));

          const distributionsResult = await supabase
            .from('purchase_distributions')
            .insert(distributionsToInsert);

          if (distributionsResult.error) {
            return { data: null, error: distributionsResult.error };
          }
        }
      }

      return { data: purchaseResult.data, error: null };
    },
    {
      invalidateQueries: [
        [...queryKeys.purchases.all],
        [...queryKeys.dashboard.kpis()],
        [...queryKeys.dashboard.recentPurchases(5)],
      ],
      successMessage: 'Покупку створено успішно',
    }
  );
}

/**
 * Хук для оновлення покупки
 */
export function useUpdatePurchase() {
  return useSupabaseMutation(
    async ({ id, data }: { id: string; data: Partial<CreatePurchaseData> }) => {
      // Отримуємо поточні дані покупки
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('distribution_status, template_id')
        .eq('id', id)
        .single();

      if (!existingPurchase) {
        return { data: null, error: { message: 'Покупку не знайдено' } };
      }

      const isLocked = existingPurchase.distribution_status === 'locked';
      const templateChanged = existingPurchase.template_id !== data.template_id;

      // Оновлюємо основні дані покупки
      const purchaseResult = await supabase
        .from('purchases')
        .update({
          date: data.date,
          total_amount: data.total_amount,
          buyer_id: data.buyer_id,
          driver_id: data.driver_id,
          notes: data.notes,
          template_id: data.template_id,
        })
        .eq('id', id)
        .select()
        .single();

      if (purchaseResult.error) {
        return { data: null, error: purchaseResult.error };
      }

      // Оновлюємо позиції, якщо передані
      if (data.items) {
        // Видаляємо старі позиції
        await supabase
          .from('purchase_items')
          .delete()
          .eq('purchase_id', id);

        // Додаємо нові позиції
        if (data.items.length > 0) {
          const itemsToInsert = data.items.map(item => ({
            ...item,
            purchase_id: id,
          }));

          const itemsResult = await supabase
            .from('purchase_items')
            .insert(itemsToInsert);

          if (itemsResult.error) {
            return { data: null, error: itemsResult.error };
          }
        }
      }

      // Обробляємо розподіли, якщо покупка не заблокована
      if (!isLocked) {
        let distributionsToUse = data.distributions;
        
        // Якщо шаблон змінився, але розподіли не передані, завантажуємо їх з нового шаблону
        if (templateChanged && (!distributionsToUse || distributionsToUse.length === 0) && data.template_id) {
          const templateResult = await supabase
            .from('distribution_templates')
            .select(`
              *,
              distribution_template_users (
                user_id,
                shares
              )
            `)
            .eq('id', data.template_id)
            .single();

          if (templateResult.data && templateResult.data.distribution_template_users.length > 0) {
            // Використовуємо утилітарну функцію для коректного розрахунку
            distributionsToUse = buildDistributionsFromShares(
              templateResult.data.distribution_template_users,
              data.total_amount || 0
            );
          }
        }

        // Оновлюємо розподіли, якщо є що оновлювати
        if (distributionsToUse || templateChanged) {
          // Видаляємо старі розподіли
          await supabase
            .from('purchase_distributions')
            .delete()
            .eq('purchase_id', id);

          // Додаємо нові розподіли, якщо є
          if (distributionsToUse && distributionsToUse.length > 0 && data.total_amount) {
            // Перевіряємо чи distributionsToUse має коректний формат
            const validDistributions = distributionsToUse.filter(dist => 
              dist.user_id && typeof dist.shares === 'number' && dist.shares > 0
            ) as Array<{ user_id: string; shares: number }>;

            if (validDistributions.length > 0) {
              const normalizedDistributions = buildDistributionsFromShares(
                validDistributions,
                data.total_amount
              );

              const distributionsToInsert = normalizedDistributions.map(dist => ({
                purchase_id: id,
                user_id: dist.user_id,
                shares: dist.shares,
                calculated_amount: dist.calculated_amount,
              }));

              const distributionsResult = await supabase
                .from('purchase_distributions')
                .insert(distributionsToInsert);

              if (distributionsResult.error) {
                return { data: null, error: distributionsResult.error };
              }
            }
          }
        }
      }

      return { data: purchaseResult.data, error: null };
    },
    {
      invalidateQueries: [
        [...queryKeys.purchases.all],
        [...queryKeys.dashboard.kpis()],
      ],
      successMessage: 'Покупку оновлено успішно',
    }
  );
}

/**
 * Хук для видалення покупки
 */
export function useDeletePurchase() {
  return useSupabaseMutation(
    async (id: string) => {
      // Видаляємо розподіли
      await supabase
        .from('purchase_distributions')
        .delete()
        .eq('purchase_id', id);

      // Видаляємо позиції
      await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', id);

      // Видаляємо записи змін суми
      await supabase
        .from('purchase_amount_changes')
        .delete()
        .eq('purchase_id', id);

      // Видаляємо покупку
      return supabase
        .from('purchases')
        .delete()
        .eq('id', id);
    },
    {
      invalidateQueries: [
        [...queryKeys.purchases.all],
        [...queryKeys.dashboard.kpis()],
      ],
      successMessage: 'Покупку видалено успішно',
    }
  );
}

/**
 * Хук для пошуку покупок
 */
export function useSearchPurchases(searchQuery?: string) {
  const purchasesQuery = usePurchases();
  
  const filteredData = purchasesQuery.data && searchQuery?.trim() ? 
    purchasesQuery.data.filter(purchase => 
      purchase.buyer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.driver?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.purchase_items?.some(item => 
        item.coffee_types?.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      new Date(purchase.date).toLocaleDateString('uk-UA').includes(searchQuery) ||
      purchase.total_amount.toString().includes(searchQuery)
    ) : purchasesQuery.data;

  return {
    ...purchasesQuery,
    data: filteredData
  };
}

/**
 * Хук для отримання останньої ціни кави
 */
export function useLatestCoffeePrice(coffeeId?: string) {
  return useSupabaseQuery(
    queryKeys.purchases.latestPrice(coffeeId || ''),
    async () => {
      if (!coffeeId) return { data: null, error: null };
      
      return supabase.rpc('get_latest_coffee_price', { 
        coffee_id: coffeeId 
      });
    },
    {
      enabled: !!coffeeId,
      staleTime: 5 * 60 * 1000, // 5 хвилин
    }
  );
}

/**
 * Хук для створення нового типу кави
 */
export function useCreateCoffeeType() {
  return useSupabaseMutation(
    async (name: string) => {
      return supabase
        .from('coffee_types')
        .insert([{ name: name.trim() }])
        .select()
        .single();
    },
    {
      invalidateQueries: [
        // Інвалідуємо кеш типів кави після створення
        ['coffee_types'],
      ],
      successMessage: `Новий тип кави створено`,
    }
  );
}

/**
 * Хук для перевірки можливості видалення покупки
 */
export function useCanDeletePurchase(purchaseId?: string) {
  return useSupabaseQuery(
    queryKeys.purchases.canDelete(purchaseId || ''),
    async () => {
      if (!purchaseId) return { data: { canDelete: false }, error: null };
      
      const { data: paidDistributions, error } = await supabase
        .from('purchase_distributions')
        .select('id')
        .eq('purchase_id', purchaseId)
        .eq('is_paid', true);

      if (error) return { data: null, error };

      const canDelete = !paidDistributions || paidDistributions.length === 0;
      return { 
        data: { 
          canDelete, 
          reason: canDelete ? null : 'Неможливо видалити покупку з оплаченими розподілами'
        }, 
        error: null 
      };
    },
    {
      enabled: !!purchaseId,
      staleTime: 30 * 1000, // 30 секунд
    }
  );
}

/**
 * Хук для отримання template_id з останньої покупки користувача
 */
export function useLastPurchaseTemplate() {
  return useSupabaseQuery(
    queryKeys.purchases.lastTemplate(),
    async () => {
      return supabase.rpc('get_last_purchase_template_id');
    },
    {
      staleTime: 1 * 60 * 1000, // 1 хвилина
    }
  );
}