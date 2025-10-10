/**
 * Інлайн редагування з пошуком через SearchableSelect
 */
import { useState } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineSearchableSelectEditProps {
  value?: string;
  options: Array<{ id: string; name: string }>;
  onSave: (value: string | undefined) => Promise<void>;
  onCreateNew?: (name: string) => Promise<string>;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
}

export const InlineSearchableSelectEdit = ({ 
  value, 
  options,
  onSave, 
  onCreateNew,
  placeholder = "Вибрати...",
  emptyText = "Не вказано",
  searchPlaceholder = "Пошук...",
  className,
  badgeVariant = "secondary"
}: InlineSearchableSelectEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedOption = options.find(opt => opt.id === value);

  const handleChange = async (newValue: string | undefined) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async (name: string): Promise<string> => {
    if (!onCreateNew) throw new Error('onCreateNew not provided');
    return await onCreateNew(name);
  };

  if (isEditing) {
    return (
      <SearchableSelect
        value={value}
        options={options}
        onChange={handleChange}
        onCreateNew={onCreateNew ? handleCreateNew : undefined}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        disabled={isLoading}
        className={cn("w-[200px]", className)}
      />
    );
  }

  return (
    <div 
      className={cn(
        "group inline-flex items-center gap-2 cursor-pointer",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      {selectedOption ? (
        <Badge variant={badgeVariant} className="hover:opacity-80 transition-opacity">
          {selectedOption.name}
          <Pencil className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
        </Badge>
      ) : (
        <div className="rounded px-2 py-1 hover:bg-muted/50 transition-colors text-sm text-muted-foreground italic flex items-center gap-2">
          {emptyText}
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </div>
      )}
    </div>
  );
};
