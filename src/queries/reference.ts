/**
 * Фабрики queryOptions для довідкових таблиць (бренди, різновиди, походження, методи обробки, смаки).
 * Ключі збережено сумісними з наявними інвалідаціями.
 */
import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { unwrap } from './unwrap';

/** Елемент довідника */
export interface ReferenceItem {
  id: string;
  name: string;
}

type ReferenceTableName = 'brands' | 'coffee_varieties' | 'origins' | 'processing_methods' | 'flavors';

/** Ключі кешу довідників */
export const referenceKeys = {
  brands: ['brands'] as const,
  varieties: ['coffee_varieties'] as const,
  origins: ['origins'] as const,
  processingMethods: ['processing_methods'] as const,
  flavors: ['flavors'] as const,
};

/**
 * Створює queryOptions для довідника, відсортованого за назвою.
 * @param table Назва таблиці
 * @param key Ключ кешу
 */
const referenceQuery = (table: ReferenceTableName, key: readonly string[]) =>
  queryOptions({
    queryKey: key,
    queryFn: async (): Promise<ReferenceItem[]> =>
      unwrap(await supabase.from(table).select('id, name').order('name')),
    staleTime: 10 * 60 * 1000,
  });

/** Бренди */
export const brandsQuery = () => referenceQuery('brands', referenceKeys.brands);
/** Різновиди */
export const varietiesQuery = () => referenceQuery('coffee_varieties', referenceKeys.varieties);
/** Походження */
export const originsQuery = () => referenceQuery('origins', referenceKeys.origins);
/** Методи обробки */
export const processingMethodsQuery = () =>
  referenceQuery('processing_methods', referenceKeys.processingMethods);
/** Смаки */
export const flavorsQuery = () => referenceQuery('flavors', referenceKeys.flavors);
