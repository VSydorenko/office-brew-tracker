import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const referenceItemSchema = z.object({
  name: z.string().min(1, 'Назва обов\'язкова').max(100, 'Назва занадто довга'),
  description: z.string().optional(),
});

type ReferenceItemFormData = z.infer<typeof referenceItemSchema>;

interface ReferenceItemFormProps {
  tableName: string;
  itemId?: string;
  onSuccess: () => void;
}

/**
 * Форма для створення та редагування елементів довідкових таблиць
 */
export const ReferenceItemForm = ({ tableName, itemId, onSuccess }: ReferenceItemFormProps) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!itemId);
  const { toast } = useToast();

  const form = useForm<ReferenceItemFormData>({
    resolver: zodResolver(referenceItemSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  const fetchItem = async () => {
    if (!itemId) return;

    try {
      setInitialLoading(true);
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;

      if (data) {
        form.reset({
          name: (data as any).name || '',
          description: (data as any).description || '',
        });
      }
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити дані для редагування",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: ReferenceItemFormData) => {
    try {
      setLoading(true);

      if (itemId) {
        // Оновлення існуючого елемента
        const { error } = await (supabase as any)
          .from(tableName)
          .update({
            name: data.name,
            description: data.description || null,
          })
          .eq('id', itemId);

        if (error) throw error;

        toast({
          title: "Успіх",
          description: "Елемент успішно оновлено",
        });
      } else {
        // Створення нового елемента
        const { error } = await (supabase as any)
          .from(tableName)
          .insert({
            name: data.name,
            description: data.description || null,
          });

        if (error) throw error;

        toast({
          title: "Успіх",
          description: "Елемент успішно створено",
        });

        form.reset();
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти елемент",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Назва *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Введіть назву..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Опис</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Введіть опис (необов'язково)..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {itemId ? 'Оновити' : 'Створити'}
          </Button>
        </div>
      </form>
    </Form>
  );
};