/**
 * Кастомні хуки для роботи з Supabase через React Query
 */
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions, UseQueryResult } from '@tanstack/react-query';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/ui/auth-provider';
import { toast } from '@/hooks/use-toast';

/**
 * Типи для Supabase запитів
 */
export interface SupabaseQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: readonly unknown[];
  requireAuth?: boolean;
}

export interface SupabaseMutationOptions<TData, TVariables> 
  extends Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'> {
  invalidateQueries?: unknown[][];
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

/**
 * Хук для запитів з автентифікацією
 */
export function useAuthenticatedQuery<T>(
  options: SupabaseQueryOptions<T> & {
    queryFn: () => Promise<T>;
  }
) {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth = true, ...queryOptions } = options;

  return useQuery({
    ...queryOptions,
    queryFn: options.queryFn,
    enabled: requireAuth ? !!user && !authLoading && (queryOptions.enabled !== false) : (queryOptions.enabled !== false),
    staleTime: queryOptions.staleTime ?? 5 * 60 * 1000, // 5 хвилин за замовчуванням
  });
}

/**
 * Базовий хук для Supabase запитів
 */
export function useSupabaseQuery<
  TResponse extends { data: any; error: any },
  TResult = NonNullable<TResponse['data']>,
>(
  queryKey: readonly unknown[],
  queryFn: () => PromiseLike<TResponse>,
  options?: Omit<SupabaseQueryOptions<any>, 'queryKey' | 'select'> & {
    /** Отримує сирі рядки (data), а не обгортку { data, error } */
    select?: (data: TResponse['data']) => TResult;
  }
): UseQueryResult<TResult, Error> {
  const { user, loading: authLoading } = useAuth();
  const { requireAuth = true, select, ...queryOptions } = options || {};

  return useQuery<TResponse['data'], Error, TResult>({
    ...(queryOptions as object),
    queryKey,
    queryFn: async () => {
      const result = await queryFn();
      if (result.error) {
        throw new Error(result.error.message || 'Помилка завантаження даних');
      }
      return result.data;
    },
    ...(select ? { select } : {}),
    enabled: requireAuth ? !!user && !authLoading && (queryOptions.enabled !== false) : (queryOptions.enabled !== false),
    staleTime: queryOptions.staleTime ?? 5 * 60 * 1000,
  } as never) as UseQueryResult<TResult, Error>;
}

/**
 * Хук для Supabase мутацій
 */
export function useSupabaseMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: any }>,
  options?: SupabaseMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();
  const {
    invalidateQueries = [],
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Операція виконана успішно',
    onSuccess,
    onError,
    ...mutationOptions
  } = options || {};

  return useMutation({
    mutationFn: async (variables: TVariables): Promise<TData> => {
      const result = await mutationFn(variables);
      if (result.error) {
        throw new Error(result.error.message || 'Помилка виконання операції');
      }
      return result.data as TData;
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      // Інвалідація запитів
      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Показати тост успіху
      if (showSuccessToast) {
        toast({
          title: 'Успіх',
          description: successMessage,
        });
      }

      // Викликати користувацький onSuccess
      (onSuccess as any)?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      // Показати тост помилки
      if (showErrorToast) {
        toast({
          title: 'Помилка',
          description: error.message || 'Щось пішло не так',
          variant: 'destructive',
        });
      }

      // Викликати користувацький onError
      (onError as any)?.(error, variables, onMutateResult, context);
    },
    ...mutationOptions,
  });
}

/**
 * Хук для роботи з Realtime підписками та інвалідацією кешу
 */
export function useRealtimeInvalidation(
  tableName: string,
  queryKeysToInvalidate: unknown[][],
  options?: {
    events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
    schema?: string;
  }
) {
  const queryClient = useQueryClient();
  const { events = ['INSERT', 'UPDATE', 'DELETE'], schema = 'public' } = options || {};

  // Використовуємо useEffect для підписки на зміни
  React.useEffect(() => {
    const channel = supabase
      .channel(`${tableName}-realtime`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema, 
          table: tableName,
          filter: events.length < 3 ? events.join(',') : undefined 
        },
        (payload) => {
          console.log(`Realtime update for ${tableName}:`, payload);
          
          // Інвалідуємо всі вказані запити
          queryKeysToInvalidate.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, queryClient, JSON.stringify(queryKeysToInvalidate)]);
}