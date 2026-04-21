/**
 * React Query хуки для роботи з довідковими таблицями
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-client';

// Типи для довідників
interface ReferenceItem {
  id: string;
  name: string;
}

/**
 * Назви таблиць-довідників, з якими працює застосунок
 */
export type ReferenceTableName =
  | 'brands'
  | 'flavors'
  | 'coffee_varieties'
  | 'origins'
  | 'processing_methods';

/**
 * Зіставлення назви таблиці з її query-key
 */
const REFERENCE_TABLE_KEYS: Record<ReferenceTableName, readonly string[]> = {
  brands: queryKeys.reference.brands,
  flavors: queryKeys.reference.flavors,
  coffee_varieties: queryKeys.reference.varieties,
  origins: queryKeys.reference.origins,
  processing_methods: queryKeys.reference.processingMethods,
};

/**
 * Узагальнений хук для роботи з будь-якою довідковою таблицею.
 * Повертає список елементів і методи створення/оновлення/видалення з
 * автоматичною інвалідацією кешу.
 */
export function useReferenceTable(tableName: ReferenceTableName) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = REFERENCE_TABLE_KEYS[tableName];

  const listQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('id, name')
        .order('name');

      if (error) throw error;
      return (data || []) as ReferenceItem[];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [...queryKey] });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert({ name })
        .select('id, name')
        .single();
      if (error) throw error;
      return data as ReferenceItem;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Успіх', description: 'Елемент створено' });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося створити елемент',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from(tableName)
        .update({ name })
        .eq('id', id)
        .select('id, name')
        .single();
      if (error) throw error;
      return data as ReferenceItem;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Успіх', description: 'Елемент оновлено' });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося оновити елемент',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Успіх', description: 'Елемент видалено' });
    },
    onError: (error: any) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося видалити елемент',
        variant: 'destructive',
      });
    },
  });

  return {
    items: listQuery.data || [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Brands
export const useBrands = () => {
  return useQuery({
    queryKey: queryKeys.reference.brands,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data as ReferenceItem[];
    },
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('brands')
        .insert({ name })
        .select('id, name')
        .single();

      if (error) throw error;
      return data as ReferenceItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reference.brands });
      toast({
        title: "Успіх",
        description: `Бренд "${data.name}" створено`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити бренд",
        variant: "destructive",
      });
    },
  });
};

// Varieties
export const useVarieties = () => {
  return useQuery({
    queryKey: queryKeys.reference.varieties,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coffee_varieties')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data as ReferenceItem[];
    },
  });
};

export const useCreateVariety = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('coffee_varieties')
        .insert({ name })
        .select('id, name')
        .single();

      if (error) throw error;
      return data as ReferenceItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reference.varieties });
      toast({
        title: "Успіх",
        description: `Різновид "${data.name}" створено`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити різновид",
        variant: "destructive",
      });
    },
  });
};

// Origins
export const useOrigins = () => {
  return useQuery({
    queryKey: queryKeys.reference.origins,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('origins')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data as ReferenceItem[];
    },
  });
};

export const useCreateOrigin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('origins')
        .insert({ name })
        .select('id, name')
        .single();

      if (error) throw error;
      return data as ReferenceItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reference.origins });
      toast({
        title: "Успіх",
        description: `Походження "${data.name}" створено`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити походження",
        variant: "destructive",
      });
    },
  });
};

// Processing Methods
export const useProcessingMethods = () => {
  return useQuery({
    queryKey: queryKeys.reference.processingMethods,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processing_methods')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data as ReferenceItem[];
    },
  });
};

export const useCreateProcessingMethod = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('processing_methods')
        .insert({ name })
        .select('id, name')
        .single();

      if (error) throw error;
      return data as ReferenceItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reference.processingMethods });
      toast({
        title: "Успіх",
        description: `Метод обробки "${data.name}" створено`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити метод обробки",
        variant: "destructive",
      });
    },
  });
};

// Flavors
export const useFlavors = () => {
  return useQuery({
    queryKey: queryKeys.reference.flavors,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flavors')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data as ReferenceItem[];
    },
  });
};

export const useCreateFlavor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('flavors')
        .insert({ name })
        .select('id, name')
        .single();

      if (error) throw error;
      return data as ReferenceItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reference.flavors });
      toast({
        title: "Успіх",
        description: `Смак "${data.name}" створено`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити смак",
        variant: "destructive",
      });
    },
  });
};
