import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CoffeeCard } from './CoffeeCard';
import { Card, CardContent } from '@/components/ui/card';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { SearchBar } from '@/components/ui/search-bar';
import { Coffee } from 'lucide-react';

interface CoffeeType {
  id: string;
  name: string;
  description?: string;
  package_size?: string;
  created_at: string;
  brands?: { name: string } | null;
  coffee_varieties?: { name: string } | null;
  origins?: { name: string } | null;
  processing_methods?: { name: string } | null;
  coffee_flavors?: Array<{ flavors: { name: string } }>;
}

interface CoffeeListProps {
  refreshTrigger?: number;
}

export const CoffeeList = ({ refreshTrigger }: CoffeeListProps) => {
  const [coffees, setCoffees] = useState<CoffeeType[]>([]);
  const [filteredCoffees, setFilteredCoffees] = useState<CoffeeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Пошук та фільтрація
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCoffees(coffees);
      return;
    }

    const filtered = coffees.filter(coffee =>
      coffee.name.toLowerCase().includes(query.toLowerCase()) ||
      coffee.brands?.name.toLowerCase().includes(query.toLowerCase()) ||
      coffee.description?.toLowerCase().includes(query.toLowerCase()) ||
      coffee.coffee_varieties?.name.toLowerCase().includes(query.toLowerCase()) ||
      coffee.origins?.name.toLowerCase().includes(query.toLowerCase()) ||
      coffee.processing_methods?.name.toLowerCase().includes(query.toLowerCase()) ||
      coffee.coffee_flavors?.some(cf => cf.flavors.name.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredCoffees(filtered);
  }, [coffees]);

  const fetchCoffees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coffee_types')
        .select(`
          *,
          brands:brand_id(name),
          coffee_varieties:variety_id(name),
          origins:origin_id(name),
          processing_methods:processing_method_id(name),
          coffee_flavors(flavors(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const coffeeData = data || [];
      setCoffees(coffeeData);
      setFilteredCoffees(coffeeData);
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося завантажити каталог кави",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Оновлювати фільтровані результати при зміні coffees
  useEffect(() => {
    handleSearch(searchQuery);
  }, [coffees, searchQuery, handleSearch]);

  useEffect(() => {
    fetchCoffees();
  }, [refreshTrigger]);

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
      />

      {/* Coffee Grid */}
      {filteredCoffees.length === 0 ? (
        <Card className="shadow-coffee">
          <CardContent className="p-8 md:p-12 text-center">
            <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">
              {searchQuery ? 'Кава не знайдена' : 'Каталог порожній'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'Спробуйте змінити умови пошуку'
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
                    onCoffeeUpdated={fetchCoffees}
                  />
          ))}
        </div>
      )}
    </div>
  );
};