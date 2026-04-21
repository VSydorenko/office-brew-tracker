import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Coffee, Package, MoreVertical, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCoffeePurchaseStatsMap, useDeleteCoffeeType } from '@/hooks/use-coffee-types';
import { format, parseISO } from 'date-fns';

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

interface CoffeeCardProps {
  coffee: CoffeeType;
  onCoffeeUpdated?: () => void;
}

/**
 * Картка кави в каталозі. Редагування виконується на сторінці /coffee-catalog/:id
 * через inline-компоненти (InlineTextEdit/SelectEdit/MultiSelectEdit).
 */
export const CoffeeCard = ({ coffee, onCoffeeUpdated }: CoffeeCardProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const statsMap = useCoffeePurchaseStatsMap();
  const stat = statsMap.get(coffee.id);
  const deleteCoffee = useDeleteCoffeeType();

  const handleDelete = async () => {
    try {
      await deleteCoffee.mutateAsync(coffee.id);
      setDeleteDialogOpen(false);
      onCoffeeUpdated?.();
    } catch {
      // Тост помилки вже показано в useSupabaseMutation
    }
  };

  const handleCardClick = () => navigate(`/coffee-catalog/${coffee.id}`);
  const handleEditClick = () => navigate(`/coffee-catalog/${coffee.id}`);

  return (
    <Card 
      className="shadow-coffee hover:shadow-coffee-hover transition-all duration-300 border-accent/20 cursor-pointer hover:scale-[1.02]" 
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-coffee-dark" />
            <CardTitle className="text-lg text-primary">{coffee.name}</CardTitle>
          </div>
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-coffee-dark hover:text-primary" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                <DropdownMenuItem onClick={handleEditClick} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" /> Редагувати
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="cursor-pointer text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Видалити
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {coffee.brands && (
            <Badge variant="secondary" className="w-fit bg-coffee-light/20 text-coffee-dark">{coffee.brands.name}</Badge>
          )}
          {coffee.coffee_varieties && (
            <Badge variant="outline" className="w-fit">{coffee.coffee_varieties.name}</Badge>
          )}
          {coffee.origins && (
            <Badge variant="outline" className="w-fit">{coffee.origins.name}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {coffee.package_size && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{coffee.package_size}</span>
          </div>
        )}
        
        {coffee.processing_methods && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Обробка:</span> {coffee.processing_methods.name}
          </div>
        )}

        {coffee.coffee_flavors && coffee.coffee_flavors.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Смаки:</span> {coffee.coffee_flavors.map(cf => cf.flavors.name).join(', ')}
          </div>
        )}
        
        {coffee.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{coffee.description}</p>
        )}

        <div className="pt-2 flex items-center gap-1.5">
          <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
          {stat ? (
            <span className="text-xs text-primary font-medium">
              {format(parseISO(stat.lastPurchaseDate), 'dd.MM.yyyy')} — ₴{stat.lastPrice}/уп.
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Ще не купувалась</span>
          )}
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити каву?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія незворотна. Кава "{coffee.name}" буде повністю видалена з каталогу.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleteCoffee.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCoffee.isPending ? 'Видалення...' : 'Видалити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
