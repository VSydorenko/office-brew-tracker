import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CoffeeCard } from './CoffeeCard';
import { Card, CardContent } from '@/components/ui/card';
import { Coffee, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

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
      setCoffees(data || []);
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

  useEffect(() => {
    fetchCoffees();
  }, [refreshTrigger]);

  const filteredCoffees = coffees.filter(coffee =>
    coffee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coffee.brands?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coffee.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coffee.coffee_varieties?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coffee.origins?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coffee.processing_methods?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coffee.coffee_flavors?.some(cf => cf.flavors.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="shadow-coffee animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Пошук кави за назвою, брендом або описом..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Coffee Grid */}
      {filteredCoffees.length === 0 ? (
        <Card className="shadow-coffee">
          <CardContent className="p-12 text-center">
            <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">
              {searchTerm ? 'Кава не знайдена' : 'Каталог порожній'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Спробуйте змінити умови пошуку'
                : 'Додайте першу каву до каталогу, щоб почати облік'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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