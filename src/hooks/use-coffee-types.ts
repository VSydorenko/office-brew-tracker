/**
 * React Query хуки для роботи з типами кави
 */
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useSupabaseMutation, useRealtimeInvalidation } from './use-supabase-query';
import { queryKeys } from '@/lib/query-client';

/**
 * Тип для кави з повною інформацією
 */
export interface CoffeeTypeWithDetails {
  id: string;
  name: string;
  description?: string;
  package_size?: string;
  brand?: string;
  brand_id?: string;
  variety_id?: string;
  origin_id?: string;
  processing_method_id?: string;
  created_at: string;
  updated_at: string;
  brands?: { id: string; name: string } | null;
  coffee_varieties?: { id: string; name: string } | null;
  origins?: { id: string; name: string } | null;
  processing_methods?: { id: string; name: string } | null;
  coffee_flavors?: Array<{
    flavor_id: string;
    flavors: { id: string; name: string };
  }>;
}

/**
 * Тип для створення нового типу кави
 */
export interface CreateCoffeeTypeData {
  name: string;
  description?: string;
  package_size?: string;
  brand?: string;
  brand_id?: string;
  variety_id?: string;
  origin_id?: string;
  processing_method_id?: string;
  flavor_ids?: string[];
}

/**
 * Хук для отримання всіх типів кави
 */
export function useCoffeeTypes(searchQuery?: string) {
  const query = useSupabaseQuery(
    queryKeys.coffeeTypes.all,
    async () => {
      let query = supabase
        .from('coffee_types')
        .select(`
          id,
          name,
          description,
          package_size,
          brand,
          brand_id,
          variety_id,
          origin_id,
          processing_method_id,
          created_at,
          updated_at,
          brands(id, name),
          coffee_varieties(id, name),
          origins(id, name),
          processing_methods(id, name),
          coffee_flavors(
            flavor_id,
            flavors(id, name)
          )
        `)
        .order('name');

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      return query;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 хвилин - типи кави змінюються рідко
    }
  );

  // Realtime оновлення для типів кави
  useRealtimeInvalidation('coffee_types', [[...queryKeys.coffeeTypes.all]]);
  useRealtimeInvalidation('coffee_flavors', [[...queryKeys.coffeeTypes.all]]);

  return query;
}

/**
 * Хук для отримання деталей конкретного типу кави
 */
export function useCoffeeType(id: string) {
  return useSupabaseQuery(
    queryKeys.coffeeTypes.detail(id),
    async () => {
      return supabase
        .from('coffee_types')
        .select(`
          id,
          name,
          description,
          package_size,
          brand,
          brand_id,
          variety_id,
          origin_id,
          processing_method_id,
          created_at,
          updated_at,
          brands(id, name),
          coffee_varieties(id, name),
          origins(id, name),
          processing_methods(id, name),
          coffee_flavors(
            flavor_id,
            flavors(id, name)
          )
        `)
        .eq('id', id)
        .single();
    },
    {
      enabled: !!id,
      staleTime: 15 * 60 * 1000, // 15 хвилин
    }
  );
}

/**
 * Хук для створення нового типу кави
 */
export function useCreateCoffeeType() {
  return useSupabaseMutation(
    async (data: CreateCoffeeTypeData) => {
      // Створюємо тип кави
      const coffeeResult = await supabase
        .from('coffee_types')
        .insert({
          name: data.name,
          description: data.description,
          package_size: data.package_size,
          brand: data.brand,
          brand_id: data.brand_id,
          variety_id: data.variety_id,
          origin_id: data.origin_id,
          processing_method_id: data.processing_method_id,
        })
        .select()
        .single();

      if (coffeeResult.error) {
        return { data: null, error: coffeeResult.error };
      }

      // Додаємо смаки, якщо є
      if (data.flavor_ids && data.flavor_ids.length > 0) {
        const flavorInserts = data.flavor_ids.map(flavorId => ({
          coffee_type_id: coffeeResult.data.id,
          flavor_id: flavorId,
        }));

        const flavorsResult = await supabase
          .from('coffee_flavors')
          .insert(flavorInserts);

        if (flavorsResult.error) {
          // Видаляємо створений тип кави у випадку помилки зі смаками
          await supabase.from('coffee_types').delete().eq('id', coffeeResult.data.id);
          return { data: null, error: flavorsResult.error };
        }
      }

      return { data: coffeeResult.data, error: null };
    },
    {
      invalidateQueries: [[...queryKeys.coffeeTypes.all]],
      successMessage: 'Тип кави створено успішно',
    }
  );
}

/**
 * Хук для оновлення типу кави
 */
export function useUpdateCoffeeType() {
  return useSupabaseMutation(
    async ({ id, data }: { id: string; data: Partial<CreateCoffeeTypeData> }) => {
      // Оновлюємо основні дані
      const coffeeResult = await supabase
        .from('coffee_types')
        .update({
          name: data.name,
          description: data.description,
          package_size: data.package_size,
          brand: data.brand,
          brand_id: data.brand_id,
          variety_id: data.variety_id,
          origin_id: data.origin_id,
          processing_method_id: data.processing_method_id,
        })
        .eq('id', id)
        .select()
        .single();

      if (coffeeResult.error) {
        return { data: null, error: coffeeResult.error };
      }

      // Оновлюємо смаки, якщо передані
      if (data.flavor_ids !== undefined) {
        // Видаляємо старі смаки
        await supabase
          .from('coffee_flavors')
          .delete()
          .eq('coffee_type_id', id);

        // Додаємо нові смаки
        if (data.flavor_ids.length > 0) {
          const flavorInserts = data.flavor_ids.map(flavorId => ({
            coffee_type_id: id,
            flavor_id: flavorId,
          }));

          const flavorsResult = await supabase
            .from('coffee_flavors')
            .insert(flavorInserts);

          if (flavorsResult.error) {
            return { data: null, error: flavorsResult.error };
          }
        }
      }

      return { data: coffeeResult.data, error: null };
    },
    {
      invalidateQueries: [[...queryKeys.coffeeTypes.all]],
      successMessage: 'Тип кави оновлено успішно',
    }
  );
}

/**
 * Хук для оновлення окремого поля типу кави
 */
export function useUpdateCoffeeField() {
  return useSupabaseMutation(
    async ({ id, field, value }: { id: string; field: string; value: any }) => {
      return supabase
        .from('coffee_types')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);
    },
    {
      invalidateQueries: [[...queryKeys.coffeeTypes.all]],
      successMessage: 'Поле оновлено успішно',
    }
  );
}

/**
 * Хук для оновлення смакових якостей кави
 */
export function useUpdateCoffeeFlavors() {
  return useSupabaseMutation(
    async ({ coffeeId, flavorIds }: { coffeeId: string; flavorIds: string[] }) => {
      // 1. Видалити всі існуючі зв'язки
      const deleteResult = await supabase
        .from('coffee_flavors')
        .delete()
        .eq('coffee_type_id', coffeeId);
      
      if (deleteResult.error) {
        return { data: null, error: deleteResult.error };
      }

      // 2. Якщо є нові смаки, додати їх
      if (flavorIds.length > 0) {
        const insertResult = await supabase
          .from('coffee_flavors')
          .insert(
            flavorIds.map(flavorId => ({
              coffee_type_id: coffeeId,
              flavor_id: flavorId
            }))
          );
        
        if (insertResult.error) {
          return { data: null, error: insertResult.error };
        }
      }

      return { data: { coffeeId, flavorIds }, error: null };
    },
    {
      invalidateQueries: [[...queryKeys.coffeeTypes.all]],
      successMessage: 'Смакові якості оновлено',
    }
  );
}

/**
 * Хук для видалення типу кави
 */
export function useDeleteCoffeeType() {
  return useSupabaseMutation(
    async (id: string) => {
      // Спочатку видаляємо зв'язки зі смаками
      await supabase
        .from('coffee_flavors')
        .delete()
        .eq('coffee_type_id', id);

      // Потім видаляємо сам тип кави
      return supabase
        .from('coffee_types')
        .delete()
        .eq('id', id);
    },
    {
      invalidateQueries: [[...queryKeys.coffeeTypes.all]],
      successMessage: 'Тип кави видалено успішно',
    }
  );
}