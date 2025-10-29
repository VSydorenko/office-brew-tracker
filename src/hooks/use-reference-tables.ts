/**
 * React Query хуки для роботи з довідковими таблицями
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Типи для довідників
interface ReferenceItem {
  id: string;
  name: string;
}

// Brands
export const useBrands = () => {
  return useQuery({
    queryKey: ['brands'],
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
export const useVarieties = () => {
  return useQuery({
    queryKey: ['coffee_varieties'],
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
export const useOrigins = () => {
  return useQuery({
    queryKey: ['origins'],
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
export const useProcessingMethods = () => {
  return useQuery({
    queryKey: ['processing_methods'],
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
export const useFlavors = () => {
  return useQuery({
    queryKey: ['flavors'],
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
