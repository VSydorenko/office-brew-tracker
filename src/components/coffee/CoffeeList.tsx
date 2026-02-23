import { useState, useCallback, useMemo } from 'react';
import { CoffeeCard } from './CoffeeCard';
import { CoffeeFilters, CoffeeFiltersValue, emptyFilters } from './CoffeeFilters';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { SearchBar } from '@/components/ui/search-bar';
import { Coffee } from 'lucide-react';
import { useCoffeeTypes, CoffeeTypeWithDetails, useCoffeePurchaseStatsMap } from '@/hooks/use-coffee-types';

interface CoffeeType {
  id: string;
  name: string;
  description?: string;
  package_size?: string;
  created_at: string;
  brands?: { id: string; name: string } | null;
  coffee_varieties?: { id: string; name: string } | null;
  origins?: { id: string; name: string } | null;
  processing_methods?: { id: string; name: string } | null;
  coffee_flavors?: Array<{ flavors: { name: string } }>;
}

interface CoffeeListProps {
  refreshTrigger?: number;
}

export const CoffeeList = ({ refreshTrigger }: CoffeeListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CoffeeFiltersValue>(emptyFilters);

  // Використовуємо React Query хук для отримання даних
  const { data: rawCoffees, isLoading: loading, error } = useCoffeeTypes();
  const statsMap = useCoffeePurchaseStatsMap();

  // Трансформуємо дані з нового формату у старий для сумісності з CoffeeCard
  const coffees = useMemo(() => {
    if (!rawCoffees) return [];
    
    return rawCoffees.map((coffee: CoffeeTypeWithDetails): CoffeeType => ({
      id: coffee.id,
      name: coffee.name,
      description: coffee.description,
      package_size: coffee.package_size,
      created_at: coffee.created_at,
      brands: coffee.brands,
      coffee_varieties: coffee.coffee_varieties,
      origins: coffee.origins,
      processing_methods: coffee.processing_methods,
      coffee_flavors: coffee.coffee_flavors?.map(cf => ({ flavors: cf.flavors })) || [],
    }));
  }, [rawCoffees]);

  // Пошук та фільтрація
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Фільтровані та відсортовані кави
  const filteredCoffees = useMemo(() => {
    let result = coffees;

    if (searchQuery.trim()) {
      result = result.filter(coffee =>
        coffee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coffee.brands?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coffee.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coffee.coffee_varieties?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coffee.origins?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coffee.processing_methods?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coffee.coffee_flavors?.some(cf => cf.flavors.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filters.brand_id) {
      result = result.filter(coffee => coffee.brands?.id === filters.brand_id);
    }
    if (filters.variety_id) {
      result = result.filter(coffee => coffee.coffee_varieties?.id === filters.variety_id);
    }
    if (filters.origin_id) {
      result = result.filter(coffee => coffee.origins?.id === filters.origin_id);
    }
    if (filters.processing_method_id) {
      result = result.filter(coffee => coffee.processing_methods?.id === filters.processing_method_id);
    }

    // Сортування за датою останньої покупки (найновіші зверху), без покупок — в кінці
    return [...result].sort((a, b) => {
      const statA = statsMap.get(a.id);
      const statB = statsMap.get(b.id);
      if (!statA && !statB) return 0;
      if (!statA) return 1;
      if (!statB) return -1;
      return statB.lastPurchaseDate.localeCompare(statA.lastPurchaseDate);
    });
  }, [coffees, searchQuery, filters, statsMap]);

  // Фіктивна функція для сумісності з CoffeeCard
  const handleCoffeeUpdated = () => {
    // React Query автоматично оновить дані завдяки Realtime
  };

  // Обробка помилок
  if (error) {
    return (
      <div className="space-y-6">
        <SearchBar
          placeholder="Пошук кави за назвою, брендом, походженням..."
          onSearch={handleSearch}
        />
        <Card className="shadow-coffee">
          <CardContent className="p-8 md:p-12 text-center">
            <Coffee className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium text-destructive mb-2">
              Помилка завантаження
            </h3>
            <p className="text-muted-foreground">
              {error.message || "Не вдалося завантажити каталог кави"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 md:h-10 bg-muted rounded animate-pulse"></div>
        <SkeletonCard variant="grid" count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile-optimized search */}
      <SearchBar
        placeholder="Пошук кави за назвою, брендом, походженням..."
        onSearch={handleSearch}
        onFilter={() => setShowFilters(prev => !prev)}
      />

      {/* Filter panel */}
      {showFilters && (
        <CoffeeFilters filters={filters} onChange={setFilters} />
      )}

      {/* Coffee Grid */}
      {filteredCoffees.length === 0 ? (
        <Card className="shadow-coffee">
          <CardContent className="p-8 md:p-12 text-center">
            <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">
              {searchQuery || Object.values(filters).some(Boolean) ? 'Кава не знайдена' : 'Каталог порожній'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || Object.values(filters).some(Boolean)
                ? 'Спробуйте змінити умови пошуку або фільтри'
                : 'Додайте першу каву до каталогу, щоб почати облік'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredCoffees.map((coffee) => (
                  <CoffeeCard 
                    key={coffee.id} 
                    coffee={coffee} 
                    onCoffeeUpdated={handleCoffeeUpdated}
                  />
          ))}
        </div>
      )}
    </div>
  );
};