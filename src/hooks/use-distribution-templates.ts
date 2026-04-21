/**
 * React Query хуки для роботи з шаблонами розподілу
 */
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useSupabaseMutation, useRealtimeInvalidation } from './use-supabase-query';
import { queryKeys } from '@/lib/query-client';

/**
 * Користувач у шаблоні розподілу
 */
export interface DistributionTemplateUser {
  user_id: string;
  shares: number;
  percentage?: number;
  profiles?: {
    id?: string;
    name: string;
    email?: string;
  };
}

/**
 * Шаблон розподілу з користувачами
 */
export interface DistributionTemplateWithUsers {
  id: string;
  name: string;
  effective_from: string;
  is_active: boolean;
  total_shares?: number;
  created_at: string;
  updated_at: string;
  distribution_template_users: DistributionTemplateUser[];
}

/**
 * Дані для створення/оновлення шаблону розподілу
 */
export interface UpsertDistributionTemplateData {
  /** ID шаблону. Якщо передано — режим оновлення. */
  id?: string;
  name: string;
  effective_from: string;
  total_shares: number;
  users: Array<{ user_id: string; shares: number }>;
}

/**
 * Хук для отримання списку всіх шаблонів розподілу
 */
export function useDistributionTemplates() {
  const query = useSupabaseQuery(
    queryKeys.distributionTemplates.all,
    async () => {
      return supabase
        .from('distribution_templates')
        .select(`
          *,
          distribution_template_users (
            user_id,
            shares,
            percentage,
            profiles (
              id,
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // Realtime інвалідація
  useRealtimeInvalidation('distribution_templates', [[...queryKeys.distributionTemplates.all]]);
  useRealtimeInvalidation('distribution_template_users', [[...queryKeys.distributionTemplates.all]]);

  return query;
}

/**
 * Хук для отримання активних шаблонів розподілу для конкретної дати покупки
 */
export function useActiveDistributionTemplates(purchaseDate?: string) {
  return useSupabaseQuery(
    queryKeys.distributionTemplates.active(purchaseDate),
    async () => {
      if (!purchaseDate) {
        return { data: [], error: null };
      }
      return supabase
        .from('distribution_templates')
        .select(`
          *,
          distribution_template_users (
            user_id,
            shares,
            profiles (
              id,
              name,
              email
            )
          )
        `)
        .eq('is_active', true)
        .lte('effective_from', purchaseDate)
        .order('effective_from', { ascending: false });
    },
    {
      enabled: !!purchaseDate,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Хук для отримання деталей конкретного шаблону розподілу
 */
export function useDistributionTemplate(id?: string) {
  return useSupabaseQuery(
    queryKeys.distributionTemplates.detail(id || ''),
    async () => {
      if (!id) return { data: null, error: null };
      return supabase
        .from('distribution_templates')
        .select(`
          *,
          distribution_template_users (
            user_id,
            shares,
            profiles (
              id,
              name,
              email
            )
          )
        `)
        .eq('id', id)
        .single();
    },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Хук для створення або оновлення шаблону розподілу.
 * Якщо передано `id` — оновлення, інакше — створення.
 */
export function useUpsertDistributionTemplate() {
  return useSupabaseMutation(
    async (data: UpsertDistributionTemplateData) => {
      let templateId = data.id;

      if (templateId) {
        // Оновлюємо шаблон
        const { error: updateError } = await supabase
          .from('distribution_templates')
          .update({
            name: data.name,
            effective_from: data.effective_from,
            total_shares: data.total_shares,
          })
          .eq('id', templateId);

        if (updateError) {
          return { data: null, error: updateError };
        }

        // Видаляємо старих користувачів
        const { error: deleteError } = await supabase
          .from('distribution_template_users')
          .delete()
          .eq('template_id', templateId);

        if (deleteError) {
          return { data: null, error: deleteError };
        }
      } else {
        // Створюємо шаблон
        const { data: created, error: createError } = await supabase
          .from('distribution_templates')
          .insert({
            name: data.name,
            effective_from: data.effective_from,
            is_active: true,
            total_shares: data.total_shares,
          })
          .select()
          .single();

        if (createError || !created) {
          return { data: null, error: createError };
        }

        templateId = created.id;
      }

      // Додаємо користувачів
      if (data.users.length > 0) {
        const usersToInsert = data.users.map((user) => ({
          template_id: templateId!,
          user_id: user.user_id,
          shares: user.shares,
        }));

        const { error: usersError } = await supabase
          .from('distribution_template_users')
          .insert(usersToInsert);

        if (usersError) {
          return { data: null, error: usersError };
        }
      }

      return { data: { id: templateId! }, error: null };
    },
    {
      invalidateQueries: [[...queryKeys.distributionTemplates.all]],
      successMessage: 'Шаблон розподілу збережено',
    }
  );
}

/**
 * Хук для видалення шаблону розподілу
 */
export function useDeleteDistributionTemplate() {
  return useSupabaseMutation(
    async (templateId: string) => {
      // Спочатку видаляємо користувачів шаблону
      await supabase
        .from('distribution_template_users')
        .delete()
        .eq('template_id', templateId);

      return supabase
        .from('distribution_templates')
        .delete()
        .eq('id', templateId);
    },
    {
      invalidateQueries: [[...queryKeys.distributionTemplates.all]],
      successMessage: 'Шаблон розподілу видалено',
    }
  );
}

/**
 * Хук для перемикання активності шаблону розподілу
 */
export function useToggleDistributionTemplate() {
  return useSupabaseMutation(
    async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return supabase
        .from('distribution_templates')
        .update({ is_active: isActive })
        .eq('id', id);
    },
    {
      invalidateQueries: [[...queryKeys.distributionTemplates.all]],
      successMessage: 'Статус шаблону оновлено',
    }
  );
}
