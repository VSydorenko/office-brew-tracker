/**
 * Універсальний компонент для редагування Select-полів з підтримкою пошуку та створення нових значень
 * 
 * Ключові особливості:
 * - Завжди виглядає як стандартний Select (SelectTrigger)
 * - Один клік для відкриття пошуку (autoOpen)
 * - Підтримка створення нових значень
 * - Відображення placeholder/empty state
 * - Responsive дизайн
 */
import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface SelectEditProps {
  /** Поточне обране значення (ID) */
  value?: string;
  
  /** Список доступних опцій */
  options: Array<{ id: string; name: string }>;
  
  /** Callback при збереженні нового значення */
  onSave: (value: string | undefined) => Promise<void>;
  
  /** Callback для створення нового елемента (опціонально) */
  onCreateNew?: (name: string) => Promise<string>;
  
  /** Текст placeholder для кнопки */
  placeholder?: string;
  
  /** Текст для відображення коли значення не вибрано */
  emptyText?: string;
  
  /** Placeholder для поля пошуку */
  searchPlaceholder?: string;
  
  /** Текст коли нічого не знайдено */
  emptySearchText?: string;
  
  /** Додаткові CSS класи */
  className?: string;
  
  /** Вимкнути компонент */
  disabled?: boolean;
}

export const SelectEdit = ({
  value,
  options,
  onSave,
  onCreateNew,
  placeholder = "Вибрати...",
  emptyText = "Не вказано",
  searchPlaceholder = "Пошук...",
  emptySearchText = "Не знайдено",
  className,
  disabled = false,
}: SelectEditProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const selectedOption = options.find(opt => opt.id === value);

  const handleChange = async (newValue: string | undefined) => {
    // Якщо значення не змінилось (і це не очищення), просто закрити
    if (newValue === value && newValue !== undefined) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(newValue);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save:', error);
      // Залишаємо відкритим для повторної спроби
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async (name: string): Promise<string> => {
    if (!onCreateNew) throw new Error('onCreateNew not provided');
    return await onCreateNew(name);
  };

  if (isOpen) {
    return (
      <div className={cn("w-full md:w-[200px]", className)}>
        <SearchableSelect
          value={value}
          options={options}
          onChange={handleChange}
          onCreateNew={onCreateNew ? handleCreateNew : undefined}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptySearchText}
          disabled={isLoading}
          autoOpen={true}
          className="w-full"
        />
      </div>
    );
  }

  // Завжди відображаємо як Select-кнопку
  return (
    <Button
      variant="outline"
      role="combobox"
      onClick={() => !disabled && setIsOpen(true)}
      disabled={disabled}
      className={cn(
        "h-10 justify-between font-normal w-full md:w-[200px]",
        !selectedOption && "text-muted-foreground italic",
        className
      )}
    >
      <span className="truncate">
        {selectedOption ? selectedOption.name : emptyText}
      </span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );
};
