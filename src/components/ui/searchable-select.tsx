/**
 * Компонент SearchableSelect - виглядає як Select, працює як Popover + Command
 * Підтримує пошук та створення нових елементів
 */
import * as React from "react";
import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SearchableSelectProps {
  value?: string;
  options: Array<{ id: string; name: string }>;
  onChange: (value: string | undefined) => void;
  onCreateNew?: (name: string) => Promise<string>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect = ({
  value,
  options,
  onChange,
  onCreateNew,
  placeholder = "Вибрати...",
  searchPlaceholder = "Пошук...",
  emptyText = "Не знайдено",
  className,
  disabled = false,
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  const shouldShowCreate = onCreateNew && search.trim() !== "" && 
    !filteredOptions.some(opt => opt.name.toLowerCase() === search.toLowerCase());

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? undefined : selectedValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange(undefined);
    setOpen(false);
    setSearch("");
  };

  const handleCreate = async () => {
    if (!onCreateNew || !search.trim()) return;
    
    setIsCreating(true);
    try {
      const newId = await onCreateNew(search.trim());
      onChange(newId);
      setOpen(false);
      setSearch("");
    } catch (error) {
      console.error("Failed to create:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
            className
          )}
        >
          <span className={cn("line-clamp-1", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        side="bottom"
      >
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            
            {/* Опція для очищення */}
            {value && (
              <CommandGroup>
                <CommandItem onSelect={handleClear} className="text-muted-foreground italic">
                  <X className="mr-2 h-4 w-4" />
                  Очистити
                </CommandItem>
              </CommandGroup>
            )}

            {/* Список опцій */}
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => handleSelect(option.id)}
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
            {shouldShowCreate && (
              <CommandGroup>
                <CommandItem 
                  onSelect={handleCreate}
                  disabled={isCreating}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreating ? "Створення..." : `Створити "${search}"`}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
