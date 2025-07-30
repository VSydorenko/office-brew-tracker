import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
 * Компонент для вибору кави з можливістю додавання нової
 */
export const CoffeeCombobox = ({
  coffeeTypes,
  value,
  onValueChange,
  onCreateNew,
  placeholder = "Оберіть або введіть назву кави...",
  disabled = false
}: CoffeeComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [creating, setCreating] = useState(false);

  const selectedCoffee = coffeeTypes.find(coffee => coffee.id === value);
  
  const filteredCoffees = coffeeTypes.filter(coffee =>
    coffee.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (coffee.brand && coffee.brand.toLowerCase().includes(searchValue.toLowerCase()))
  );

  const getCoffeeDisplayName = (coffee: CoffeeType) => {
    return coffee.brand ? `${coffee.name} (${coffee.brand})` : coffee.name;
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCoffee ? getCoffeeDisplayName(selectedCoffee) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Пошук або введіть назву нової кави..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {searchValue ? (
                shouldShowCreateOption ? (
                  <div className="py-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Кава не знайдена
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Кава не знайдена
                  </p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Почніть вводити назву кави...
                </p>
              )}
            </CommandEmpty>
            
            {filteredCoffees.length > 0 && (
              <CommandGroup heading="Існуючі типи кави">
                {filteredCoffees.map((coffee) => (
                  <CommandItem
                    key={coffee.id}
                    value={coffee.id}
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
                      {coffee.package_size && (
                        <span className="text-xs text-muted-foreground">
                          {coffee.package_size}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
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
        </Command>
      </PopoverContent>
    </Popover>
  );
};