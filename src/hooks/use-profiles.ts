/**
 * React Query хуки для роботи з профілями користувачів
 */
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useSupabaseMutation, useRealtimeInvalidation } from './use-supabase-query';
import { queryKeys } from '@/lib/query-client';

/**
 * Тип профілю користувача
 */
export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  avatar_path?: string;
  card_number?: string;
  card_holder_name?: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}

/**
 * Тип для створення/оновлення профілю
 */
export interface UpdateProfileData {
  name?: string;
  avatar_url?: string;
  avatar_path?: string;
  card_number?: string;
  card_holder_name?: string;
  role?: 'user' | 'admin';
  status?: 'pending' | 'approved' | 'rejected';
}

/**
 * Хук для отримання всіх профілів (тільки для адмінів)
 */
export function useProfiles() {
  const query = useSupabaseQuery(
    queryKeys.profiles.all,
    async () => {
      return supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    },
    {
      staleTime: 2 * 60 * 1000, // 2 хвилини
    }
  );

  // Realtime оновлення для профілів
  useRealtimeInvalidation('profiles', [[...queryKeys.profiles.all]]);

  return query;
}

/**
 * Хук для отримання профілю поточного користувача
 */
export function useCurrentProfile() {
  return useSupabaseQuery(
    queryKeys.profiles.detail('current'),
    async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Користувач не авторизований');

      return supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    },
    {
      staleTime: 1 * 60 * 1000, // 1 хвилина
    }
  );
}

/**
 * Хук для отримання профілю за ID
 */
export function useProfile(id: string) {
  return useSupabaseQuery(
    queryKeys.profiles.detail(id),
    async () => {
      return supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
    },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 хвилин
    }
  );
}

/**
 * Хук для отримання профілів для селектора (з пагінацією)
 */
export function useProfilesPicker(search?: string, limit = 50, offset = 0) {
  return useSupabaseQuery(
    queryKeys.profiles.picker(search),
    async () => {
      return supabase.rpc('get_profiles_for_picker', {
        search: search || null,
        limit_n: limit,
        offset_n: offset,
      });
    },
    {
      staleTime: 5 * 60 * 1000, // 5 хвилин
    }
  );
}

/**
 * Хук для оновлення профілю
 */
export function useUpdateProfile() {
  return useSupabaseMutation(
    async ({ id, data }: { id: string; data: UpdateProfileData }) => {
      return supabase
        .from('profiles')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    },
    {
      invalidateQueries: [
        [...queryKeys.profiles.all],
        [...queryKeys.profiles.detail('current')],
      ],
      successMessage: 'Профіль оновлено успішно',
    }
  );
}

/**
 * Хук для затвердження профілю (тільки для адмінів)
 */
export function useApproveProfile() {
  return useSupabaseMutation(
    async (profileId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Користувач не авторизований');

      return supabase
        .from('profiles')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .select()
        .single();
    },
    {
      invalidateQueries: [
        [...queryKeys.profiles.all],
      ],
      successMessage: 'Профіль затверджено успішно',
    }
  );
}

/**
 * Хук для відхилення профілю (тільки для адмінів)
 */
export function useRejectProfile() {
  return useSupabaseMutation(
    async (profileId: string) => {
      return supabase
        .from('profiles')
        .update({ status: 'rejected' })
        .eq('id', profileId)
        .select()
        .single();
    },
    {
      invalidateQueries: [
        [...queryKeys.profiles.all],
      ],
      successMessage: 'Профіль відхилено',
    }
  );
}

/**
 * Хук для зміни ролі користувача (тільки для адмінів)
 */
export function useUpdateUserRole() {
  return useSupabaseMutation(
    async ({ userId, role }: { userId: string; role: 'user' | 'admin' }) => {
      return supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
    },
    {
      invalidateQueries: [
        [...queryKeys.profiles.all],
      ],
      successMessage: 'Роль користувача оновлено успішно',
    }
  );
}