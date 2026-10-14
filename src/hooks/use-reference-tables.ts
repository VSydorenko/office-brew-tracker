/**
 * React Query хуки для роботи з довідковими таблицями
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { brandsQuery, varietiesQuery, originsQuery, processingMethodsQuery, flavorsQuery, type ReferenceItem } from '@/queries/reference';


// Brands
export const useBrands = () => useQuery(brandsQuery());

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
      queryClient.invalidateQueries({ queryKey: ['brands'] });
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
export const useVarieties = () => useQuery(varietiesQuery());

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
      queryClient.invalidateQueries({ queryKey: ['coffee_varieties'] });
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
export const useOrigins = () => useQuery(originsQuery());

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
      queryClient.invalidateQueries({ queryKey: ['origins'] });
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
export const useProcessingMethods = () => useQuery(processingMethodsQuery());

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
      queryClient.invalidateQueries({ queryKey: ['processing_methods'] });
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
export const useFlavors = () => useQuery(flavorsQuery());

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
      queryClient.invalidateQueries({ queryKey: ['flavors'] });
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
