import { useState, useMemo, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Pencil, X } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface InlineComboboxEditProps {
  /** ID обраного запису */
  value?: string;
  /** Список доступних записів */
  options: Array<{ id: string; name: string }>;
  /** Збереження нового значення */
  onSave: (value: string | undefined) => Promise<void>;
  /** Створення нового запису, повертає ID */
  onCreateNew?: (name: string) => Promise<string>;
  /** Плейсхолдер для поля */
  placeholder?: string;
  /** Текст коли значення порожнє */
  emptyText?: string;
  /** Текст для кнопки створення */
  createText?: string;
  /** Плейсхолдер для пошуку */
  searchPlaceholder?: string;
  /** Додаткові класи */
  className?: string;
  /** Варіант Badge */
  badgeVariant?: "default" | "secondary" | "outline";
}

/**
 * Компонент для інлайн редагування з вибором зі списку або створенням нового запису
 */
export const InlineComboboxEdit = ({
  value,
  options,
  onSave,
  onCreateNew,
  placeholder = "Оберіть значення...",
  emptyText = "Не вказано",
  createText = "Створити",
  searchPlaceholder = "Пошук або введіть нову назву...",
  className,
  badgeVariant = "secondary",
}: InlineComboboxEditProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');

  const selectedOption = options.find(opt => opt.id === value);

  // Дебаунс для пошуку
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Фільтрація списку
  const filteredOptions = useMemo(() => {
    if (!debouncedSearchValue.trim()) return options;
    
    const lowerSearch = debouncedSearchValue.toLowerCase().trim();
    return options.filter(option =>
      option.name.toLowerCase().includes(lowerSearch)
    );
  }, [options, debouncedSearchValue]);

  // Чи показувати опцію створення нового запису
  const shouldShowCreateOption = searchValue.trim() && 
    !filteredOptions.some(option => 
      option.name.toLowerCase() === searchValue.trim().toLowerCase()
    ) && 
    onCreateNew;

  const handleSelect = async (optionId: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onSave(optionId === value ? undefined : optionId);
      setOpen(false);
      setSearchValue('');
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onSave(undefined);
      setOpen(false);
      setSearchValue('');
    } catch (error) {
      console.error('Failed to clear:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!searchValue.trim() || !onCreateNew || isLoading) return;
    
    setIsLoading(true);
    try {
      const newId = await onCreateNew(searchValue.trim());
      await onSave(newId);
      setOpen(false);
      setSearchValue('');
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Badge
        variant={badgeVariant}
        className={cn(
          "cursor-pointer hover:opacity-80 transition-opacity group",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <span>{selectedOption ? selectedOption.name : emptyText}</span>
        <Pencil className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Badge>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder={searchPlaceholder}
          value={searchValue}
          onValueChange={setSearchValue}
          disabled={isLoading}
        />
        <CommandList>
          <CommandEmpty>
            {searchValue ? (
              shouldShowCreateOption ? (
                <div className="py-2">
                  <p className="text-sm text-muted-foreground">
                    Запис не знайдено
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Запис не знайдено
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Почніть вводити назву...
              </p>
            )}
          </CommandEmpty>

          {/* Опція очищення значення */}
          {value && (
            <CommandGroup heading="Дії">
              <CommandItem
                onSelect={handleClear}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Очистити значення
              </CommandItem>
            </CommandGroup>
          )}
          
          {/* Існуючі записи */}
          {filteredOptions.length > 0 && (
            <CommandGroup heading="Існуючі записи">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => handleSelect(option.id)}
                  disabled={isLoading}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Опція створення нового */}
          {shouldShowCreateOption && (
            <CommandGroup heading={createText}>
              <CommandItem
                onSelect={handleCreateNew}
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                {createText} "{searchValue.trim()}"
                {isLoading && <span className="ml-2 text-xs">(створюється...)</span>}
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};