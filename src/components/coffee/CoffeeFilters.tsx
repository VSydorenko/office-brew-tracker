import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useBrands, useVarieties, useOrigins, useProcessingMethods } from '@/hooks/use-reference-tables';

export interface CoffeeFiltersValue {
  brand_id: string;
  variety_id: string;
  origin_id: string;
  processing_method_id: string;
}

interface CoffeeFiltersProps {
  filters: CoffeeFiltersValue;
  onChange: (filters: CoffeeFiltersValue) => void;
}

const ALL_VALUE = '__all__';

export const emptyFilters: CoffeeFiltersValue = {
  brand_id: '',
  variety_id: '',
  origin_id: '',
  processing_method_id: '',
};

export const CoffeeFilters = ({ filters, onChange }: CoffeeFiltersProps) => {
  const { data: brands = [] } = useBrands();
  const { data: varieties = [] } = useVarieties();
  const { data: origins = [] } = useOrigins();
  const { data: processingMethods = [] } = useProcessingMethods();

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const handleChange = (key: keyof CoffeeFiltersValue, value: string) => {
    onChange({ ...filters, [key]: value === ALL_VALUE ? '' : value });
  };

  const handleReset = () => {
    onChange(emptyFilters);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-muted/40 rounded-lg border">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          value={filters.brand_id || ALL_VALUE}
          onValueChange={(v) => handleChange('brand_id', v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Бренд" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Всі бренди</SelectItem>
            {brands.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.variety_id || ALL_VALUE}
          onValueChange={(v) => handleChange('variety_id', v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Різновид" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Всі різновиди</SelectItem>
            {varieties.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.processing_method_id || ALL_VALUE}
          onValueChange={(v) => handleChange('processing_method_id', v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Обробка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Всі методи обробки</SelectItem>
            {processingMethods.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.origin_id || ALL_VALUE}
          onValueChange={(v) => handleChange('origin_id', v)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Походження" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Всі походження</SelectItem>
            {origins.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" />
            Скинути фільтри
          </Button>
        </div>
      )}
    </div>
  );
};
