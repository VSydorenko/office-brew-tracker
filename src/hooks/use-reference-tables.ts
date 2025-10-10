/**
 * React Query хуки для роботи з довідниковими таблицями
 */
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useSupabaseMutation } from './use-supabase-query';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Хук для отримання списку брендів
 */
export function useBrands() {
  return useSupabaseQuery(
    ['brands'],
    async () => {
      return supabase
        .from('brands')
        .select('id, name')
        .order('name');
    },
    {
      staleTime: 15 * 60 * 1000, // 15 хвилин - бренди змінюються рідко
    }
  );
}

/**
 * Хук для створення нового бренду
 */
export function useCreateBrand() {
  const queryClient = useQueryClient();
  
  return useSupabaseMutation(
    async (name: string) => {
      return supabase
        .from('brands')
        .insert({ name })
        .select('id, name')
        .single();
    },
    {
      invalidateQueries: [['brands']],
      successMessage: 'Бренд успішно створено',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['brands'] });
      }
    }
  );
}

/**
 * Хук для отримання списку різновидів кави
 */
export function useVarieties() {
  return useSupabaseQuery(
    ['varieties'],
    async () => {
      return supabase
        .from('coffee_varieties')
        .select('id, name')
        .order('name');
    },
    {
      staleTime: 15 * 60 * 1000,
    }
  );
}

/**
 * Хук для створення нового різновиду кави
 */
export function useCreateVariety() {
  const queryClient = useQueryClient();
  
  return useSupabaseMutation(
    async (name: string) => {
      return supabase
        .from('coffee_varieties')
        .insert({ name })
        .select('id, name')
        .single();
    },
    {
      invalidateQueries: [['varieties']],
      successMessage: 'Різновид успішно створено',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['varieties'] });
      }
    }
  );
}

/**
 * Хук для отримання списку походжень кави
 */
export function useOrigins() {
  return useSupabaseQuery(
    ['origins'],
    async () => {
      return supabase
        .from('origins')
        .select('id, name')
        .order('name');
    },
    {
      staleTime: 15 * 60 * 1000,
    }
  );
}

/**
 * Хук для створення нового походження кави
 */
export function useCreateOrigin() {
  const queryClient = useQueryClient();
  
  return useSupabaseMutation(
    async (name: string) => {
      return supabase
        .from('origins')
        .insert({ name })
        .select('id, name')
        .single();
    },
    {
      invalidateQueries: [['origins']],
      successMessage: 'Походження успішно створено',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['origins'] });
      }
    }
  );
}

/**
 * Хук для отримання списку методів обробки
 */
export function useProcessingMethods() {
  return useSupabaseQuery(
    ['processing_methods'],
    async () => {
      return supabase
        .from('processing_methods')
        .select('id, name')
        .order('name');
    },
    {
      staleTime: 15 * 60 * 1000,
    }
  );
}

/**
 * Хук для створення нового методу обробки
 */
export function useCreateProcessingMethod() {
  const queryClient = useQueryClient();
  
  return useSupabaseMutation(
    async (name: string) => {
      return supabase
        .from('processing_methods')
        .insert({ name })
        .select('id, name')
        .single();
    },
    {
      invalidateQueries: [['processing_methods']],
      successMessage: 'Метод обробки успішно створено',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['processing_methods'] });
      }
    }
  );
}

/**
 * Хук для отримання списку смаків
 */
export function useFlavors() {
  return useSupabaseQuery(
    ['flavors'],
    async () => {
      return supabase
        .from('flavors')
        .select('id, name')
        .order('name');
    },
    {
      staleTime: 15 * 60 * 1000,
    }
  );
}

/**
 * Хук для створення нового смаку
 */
export function useCreateFlavor() {
  const queryClient = useQueryClient();
  
  return useSupabaseMutation(
    async (name: string) => {
      return supabase
        .from('flavors')
        .insert({ name })
        .select('id, name')
        .single();
    },
    {
      invalidateQueries: [['flavors']],
      successMessage: 'Смак успішно створено',
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['flavors'] });
      }
    }
  );
}