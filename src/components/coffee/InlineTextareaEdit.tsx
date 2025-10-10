/**
 * Інлайн редагування багаторядкових текстових полів
 */
import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineTextareaEditProps {
  value?: string;
  onSave: (value: string | undefined) => Promise<void>;
  className?: string;
  placeholder?: string;
}

export const InlineTextareaEdit = ({ 
  value, 
  onSave, 
  className,
  placeholder = "Додати опис..."
}: InlineTextareaEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedValue = editValue.trim();
    const finalValue = trimmedValue || undefined;

    if (finalValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(finalValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value || '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn("min-h-[100px]", className)}
          placeholder={placeholder}
          disabled={isLoading}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
          >
            <Check className="h-4 w-4 mr-1" />
            Зберегти
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Скасувати
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group relative cursor-pointer rounded p-2 -m-2 hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-muted-foreground whitespace-pre-wrap">
          {value || <span className="italic">{placeholder}</span>}
        </p>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0 mt-1" />
      </div>
    </div>
  );
};