/**
 * React Query хуки для роботи з профілями користувачів
 */
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/ui/auth-provider';
import { profilesQuery, currentProfileQuery, profileQuery, profilesPickerQuery } from '@/queries/profiles';
import { useSupabaseMutation, useRealtimeInvalidation } from './use-supabase-query';
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
  const { user, loading } = useAuth();
  const query = useQuery({ ...profilesQuery(), enabled: !!user && !loading });
  // Realtime оновлення для профілів
  useRealtimeInvalidation('profiles', [[...queryKeys.profiles.all]]);
  return query;
}

/**
 * Хук для отримання профілю поточного користувача
 */
export function useCurrentProfile() {
  const { user, loading } = useAuth();
  return useQuery({ ...currentProfileQuery(), enabled: !!user && !loading });
}

/**
 * Хук для отримання профілю за ID
 */
export function useProfile(id: string) {
  const { user, loading } = useAuth();
  return useQuery({ ...profileQuery(id), enabled: !!id && !!user && !loading });
}

/**
 * Хук для отримання профілів для селектора (з пагінацією)
 */
export function useProfilesPicker(search?: string, limit = 50, offset = 0) {
  const { user, loading } = useAuth();
  return useQuery({ ...profilesPickerQuery(search, limit, offset), enabled: !!user && !loading });
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