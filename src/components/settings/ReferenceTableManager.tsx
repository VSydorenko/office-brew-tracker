import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReferenceItemList } from './ReferenceItemList';
import { ReferenceItemForm } from './ReferenceItemForm';

interface ReferenceItem {
  id: string;
  name: string;
}

interface ReferenceTableConfig {
  tableName: string;
  displayName: string;
  icon?: React.ReactNode;
}

interface ReferenceTableManagerProps {
  config: ReferenceTableConfig;
}

/**
 * Універсальний менеджер для управління довідниками
 */
export const ReferenceTableManager = ({ config }: ReferenceTableManagerProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceItem | undefined>();

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: [config.tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(config.tableName as any)
        .select('id, name')
        .order('name');

      if (error) throw error;
      return (data as unknown || []) as ReferenceItem[];
    },
  });

  const handleAdd = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (item: ReferenceItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(undefined);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  return (
    <>
      <ReferenceItemList
        items={items}
        tableName={config.tableName}
        displayName={config.displayName}
        isLoading={isLoading}
        onRefresh={refetch}
        onEdit={handleEdit}
        onAdd={handleAdd}
      />
      
      <ReferenceItemForm
        tableName={config.tableName}
        item={editingItem}
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};