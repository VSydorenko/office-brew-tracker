/**
 * Фабрики queryOptions для профілів користувачів.
 */
import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-client';
import { unwrap } from './unwrap';

/** Усі профілі (для адміністраторів) */
export const profilesQuery = () =>
  queryOptions({
    queryKey: queryKeys.profiles.all,
    queryFn: async () =>
      unwrap(await supabase.from('profiles').select('*').order('created_at', { ascending: false })),
    staleTime: 2 * 60 * 1000,
  });

/** Профіль поточного користувача */
export const currentProfileQuery = () =>
  queryOptions({
    queryKey: queryKeys.profiles.detail('current'),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Користувач не авторизований');
      return unwrap(await supabase.from('profiles').select('*').eq('id', user.id).single());
    },
    staleTime: 60 * 1000,
  });

/**
 * Профіль за ідентифікатором.
 * @param id Ідентифікатор профілю
 */
export const profileQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.profiles.detail(id),
    queryFn: async () => unwrap(await supabase.from('profiles').select('*').eq('id', id).single()),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Профілі для селектора користувачів.
 * @param search Рядок пошуку
 * @param limit Кількість записів
 * @param offset Зсув
 */
export const profilesPickerQuery = (search?: string, limit = 50, offset = 0) =>
  queryOptions({
    queryKey: queryKeys.profiles.picker(search),
    queryFn: async () =>
      unwrap(
        await supabase.rpc('get_profiles_for_picker', {
          search: (search ?? null) as unknown as string,
          limit_n: limit,
          offset_n: offset,
        }),
      ),
    staleTime: 5 * 60 * 1000,
  });
