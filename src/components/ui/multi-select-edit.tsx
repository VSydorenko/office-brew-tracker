/**
 * Компонент для inline-редагування множинного вибору з пошуком та створенням нових значень
 */
import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Plus, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectEditProps {
  value: string[];
  options: Array<{ id: string; name: string }>;
  onSave: (value: string[]) => Promise<void>;
  onCreateNew?: (name: string) => Promise<string>;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  emptySearchText?: string;
  className?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
}

/**
 * Компонент MultiSelectEdit для редагування списку значень
 * Показує Badge'і у закритому стані, Popover з чекбоксами при редагуванні
 */
export const MultiSelectEdit = ({
  value,
  options,
  onSave,
  onCreateNew,
  placeholder = "Виберіть значення",
  emptyText = "Не вказано",
  searchPlaceholder = "Пошук...",
  emptySearchText = "Нічого не знайдено",
  className,
  disabled = false,
  maxDisplayItems = 5,
}: MultiSelectEditProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(value);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Синхронізувати локальний стан з prop value
  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(value);
    }
  }, [value, isOpen]);

  // Обрані елементи для показу
  const selectedItems = useMemo(() => {
    return options.filter(opt => selectedIds.includes(opt.id));
  }, [options, selectedIds]);

  // Фільтровані опції за пошуком
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(opt => opt.name.toLowerCase().includes(searchLower));
  }, [options, search]);

  // Чи показувати кнопку створення нового
  const shouldShowCreate = useMemo(() => {
    if (!onCreateNew || !search.trim()) return false;
    const searchLower = search.toLowerCase().trim();
    return !options.some(opt => opt.name.toLowerCase() === searchLower);
  }, [options, search, onCreateNew]);

  // Перемикання вибору елемента
  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Очистити всі вибори
  const handleClearAll = () => {
    setSelectedIds([]);
  };

  // Створити новий елемент
  const handleCreate = async () => {
    if (!onCreateNew || !search.trim()) return;
    
    setIsLoading(true);
    try {
      const newId = await onCreateNew(search.trim());
      setSelectedIds(prev => [...prev, newId]);
      setSearch("");
    } catch (error) {
      console.error("Failed to create:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Зберегти зміни
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(selectedIds);
      setIsOpen(false);
      setSearch("");
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Скасувати зміни
  const handleCancel = () => {
    setSelectedIds(value);
    setIsOpen(false);
    setSearch("");
  };

  // Підсвітити збіги у пошуку
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => (
          <span
            key={i}
            className={cn(
              part.toLowerCase() === query.toLowerCase() && "font-semibold text-primary"
            )}
          >
            {part}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Показ обраних значень у закритому стані */}
      <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
        {selectedItems.length === 0 ? (
          <span className="text-muted-foreground text-sm">{emptyText}</span>
        ) : (
          <>
            {selectedItems.slice(0, maxDisplayItems).map(item => (
              <Badge key={item.id} variant="outline">
                {item.name}
              </Badge>
            ))}
            {selectedItems.length > maxDisplayItems && (
              <Badge variant="secondary">
                ще {selectedItems.length - maxDisplayItems}
              </Badge>
            )}
          </>
        )}
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-8 px-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder={searchPlaceholder}
                value={search}
                onValueChange={setSearch}
                className="border-none focus:ring-0"
              />
              <CommandList>
                {/* Кнопка очистити все */}
                {selectedIds.length > 0 && (
                  <CommandItem 
                    onSelect={handleClearAll}
                    className="text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Очистити все
                  </CommandItem>
                )}
                
                {/* Список з чекбоксами */}
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(option => (
            <CommandItem 
              key={option.id} 
              onSelect={() => handleToggle(option.id)}
              className="cursor-pointer"
            >
              <Checkbox 
                checked={selectedIds.includes(option.id)}
                className="mr-2 pointer-events-none"
              />
              {highlightMatch(option.name, search)}
            </CommandItem>
                  ))
                ) : (
                  !shouldShowCreate && (
                    <CommandEmpty>{emptySearchText}</CommandEmpty>
                  )
                )}
                
                {/* Створити новий */}
                {shouldShowCreate && (
                  <CommandItem 
                    onSelect={handleCreate}
                    className="text-primary cursor-pointer"
                    disabled={isLoading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Створити "{search}"
                  </CommandItem>
                )}
              </CommandList>
            </Command>
            
            {/* Footer з кнопками */}
            <div className="flex gap-2 p-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Скасувати
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Збереження...
                  </>
                ) : (
                  "Зберегти"
                )}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
