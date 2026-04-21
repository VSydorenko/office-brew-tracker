import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useReferenceTable, type ReferenceTableName } from '@/hooks/use-reference-tables';

const referenceItemSchema = z.object({
  name: z.string().min(1, 'Назва обовʼязкова').max(100, 'Назва занадто довга'),
});

type ReferenceItemFormData = z.infer<typeof referenceItemSchema>;

interface ReferenceItemFormProps {
  tableName: ReferenceTableName;
  item?: { id: string; name: string };
  onSuccess: () => void;
}

/**
 * Форма для створення та редагування елементів довідкових таблиць.
 * Використовує спільний хук useReferenceTable для CRUD-операцій.
 */
export const ReferenceItemForm = ({ tableName, item, onSuccess }: ReferenceItemFormProps) => {
  const { createItem, updateItem, isCreating, isUpdating } = useReferenceTable(tableName);
  const loading = isCreating || isUpdating;

  const form = useForm<ReferenceItemFormData>({
    resolver: zodResolver(referenceItemSchema),
    defaultValues: {
      name: item?.name ?? '',
    },
  });

  const onSubmit = async (data: ReferenceItemFormData) => {
    try {
      if (item) {
        await updateItem({ id: item.id, name: data.name });
      } else {
        await createItem(data.name);
        form.reset();
      }
      onSuccess();
    } catch {
      // Помилка вже показана через toast усередині хука
    }
  };

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
                <Input placeholder="Введіть назву..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {item ? 'Оновити' : 'Створити'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
