import { useState, useMemo, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCoffeePurchaseStatsMap } from '@/hooks/use-coffee-types';
import { format, parseISO } from 'date-fns';

interface CoffeeType {
  id: string;
  name: string;
  package_size?: string;
  brand?: string;
}

interface CoffeeComboboxProps {
  /** Список типів кави */
  coffeeTypes: CoffeeType[];
  /** Обрана кава */
  value: string;
  /** Колбек при зміні значення */
  onValueChange: (value: string) => void;
  /** Колбек для створення нової кави */
  onCreateNew?: (name: string) => Promise<string>;
  /** Плейсхолдер */
  placeholder?: string;
  /** Чи компонент відключений */
  disabled?: boolean;
}

/**
 * Компонент для вибору кави з можливістю додавання нової.
 * Автоматично показує останню ціну та дату покупки через useCoffeePurchaseStatsMap.
 */
export const CoffeeCombobox = ({
  coffeeTypes,
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Оберіть або введіть назву кави...",
  disabled = false,
}: CoffeeComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('');

  const statsMap = useCoffeePurchaseStatsMap();
  const selectedCoffee = coffeeTypes.find(coffee => coffee.id === value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchValue]);
  
  const filteredCoffees = useMemo(() => {
    if (!debouncedSearchValue.trim()) return coffeeTypes;
    const lowerSearch = debouncedSearchValue.toLowerCase().trim();
    return coffeeTypes.filter(coffee =>
      coffee.name.toLowerCase().includes(lowerSearch) ||
      (coffee.brand && coffee.brand.toLowerCase().includes(lowerSearch)) ||
      (coffee.package_size && coffee.package_size.toLowerCase().includes(lowerSearch))
    );
  }, [coffeeTypes, debouncedSearchValue]);

  const getCoffeeDisplayName = (coffee: CoffeeType) => {
    return coffee.brand ? `${coffee.name} (${coffee.brand})` : coffee.name;
  };

  /** Форматує інфо про останню покупку */
  const getStatsLabel = (coffeeId: string) => {
    const stat = statsMap.get(coffeeId);
    if (!stat) return 'Ще не купувалась';
    const dateStr = format(parseISO(stat.lastPurchaseDate), 'dd.MM.yyyy');
    return `₴${stat.lastPrice}/уп. — ${dateStr}`;
  };

  const handleSelect = (coffeeId: string) => {
    onValueChange(coffeeId === value ? '' : coffeeId);
    setOpen(false);
    setSearchValue('');
  };

  const handleCreateNew = async () => {
    if (!searchValue.trim() || !onCreateNew || creating) return;
    try {
      setCreating(true);
      const newCoffeeId = await onCreateNew(searchValue.trim());
      onValueChange(newCoffeeId);
      setOpen(false);
      setSearchValue('');
    } catch (error) {
      console.error('Error creating new coffee:', error);
    } finally {
      setCreating(false);
    }
  };

  const shouldShowCreateOption = searchValue.trim() && 
    !filteredCoffees.some(coffee => 
      coffee.name.toLowerCase() === searchValue.toLowerCase()
    ) && 
    onCreateNew;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {selectedCoffee ? getCoffeeDisplayName(selectedCoffee) : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Пошук або введіть назву нової кави..."
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>
            {searchValue ? (
              <p className="text-sm text-muted-foreground">Кава не знайдена</p>
            ) : (
              <p className="text-sm text-muted-foreground">Почніть вводити назву кави...</p>
            )}
          </CommandEmpty>
          
          {filteredCoffees.length > 0 && (
            <CommandGroup heading="Існуючі типи кави">
              {filteredCoffees.map((coffee) => {
                const hasStat = statsMap.has(coffee.id);
                return (
                  <CommandItem
                    key={coffee.id}
                    value={getCoffeeDisplayName(coffee)}
                    onSelect={() => handleSelect(coffee.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === coffee.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{getCoffeeDisplayName(coffee)}</span>
                      <span className={cn(
                        "text-xs",
                        hasStat ? "text-primary font-medium" : "text-muted-foreground"
                      )}>
                        {getStatsLabel(coffee.id)}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {shouldShowCreateOption && (
            <CommandGroup heading="Створити нову">
              <CommandItem
                onSelect={handleCreateNew}
                disabled={creating}
              >
                <Plus className="mr-2 h-4 w-4" />
                Створити "{searchValue}"
                {creating && <span className="ml-2 text-xs">(створюється...)</span>}
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};
