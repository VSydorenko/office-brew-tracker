/**
 * Інлайн редагування випадаючих списків
 */
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineSelectEditProps {
  value?: string;
  options: Array<{ id: string; name: string }>;
  onSave: (value: string | undefined) => Promise<void>;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
}

export const InlineSelectEdit = ({ 
  value, 
  options,
  onSave, 
  placeholder = "Вибрати...",
  emptyText = "Не вказано",
  className,
  badgeVariant = "secondary"
}: InlineSelectEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedOption = options.find(opt => opt.id === value);

  const handleValueChange = async (newValue: string) => {
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(newValue || undefined);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <Select 
        value={value || ""} 
        onValueChange={handleValueChange}
        disabled={isLoading}
        onOpenChange={(open) => {
          if (!open && !isLoading) {
            setIsEditing(false);
          }
        }}
        defaultOpen
      >
        <SelectTrigger className={cn("w-[200px]", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">
            <span className="text-muted-foreground italic">{emptyText}</span>
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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