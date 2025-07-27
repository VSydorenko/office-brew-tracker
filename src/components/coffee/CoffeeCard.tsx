import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Coffee, Package, TrendingUp, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CoffeeEditDialog } from './CoffeeEditDialog';

interface CoffeeType {
  id: string;
  name: string;
  description?: string;
  package_size?: string;
  created_at: string;
  brands?: { name: string } | null;
  coffee_varieties?: { name: string } | null;
  processing_methods?: { name: string } | null;
  coffee_flavors?: Array<{ flavors: { name: string } }>;
}

interface CoffeeCardProps {
  coffee: CoffeeType;
  onCoffeeUpdated?: () => void;
}

export const CoffeeCard = ({ coffee, onCoffeeUpdated }: CoffeeCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      // Delete coffee flavors first
      const { error: flavorsError } = await supabase
        .from('coffee_flavors')
        .delete()
        .eq('coffee_type_id', coffee.id);
      
      if (flavorsError) throw flavorsError;
      
      // Delete coffee type
      const { error: coffeeError } = await supabase
        .from('coffee_types')
        .delete()
        .eq('id', coffee.id);
      
      if (coffeeError) throw coffeeError;
      
      toast({
        title: "Успіх",
        description: "Кава видалена з каталогу",
      });
      
      setDeleteDialogOpen(false);
      onCoffeeUpdated?.();
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити каву",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSuccess = () => {
    onCoffeeUpdated?.();
  };

  return (
    <Card className="shadow-coffee hover:shadow-coffee-hover transition-all duration-300 border-accent/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-coffee-dark" />
            <CardTitle className="text-lg text-primary">{coffee.name}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/coffee-catalog/${coffee.id}`)}
              className="text-coffee-dark hover:text-primary"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-coffee-dark hover:text-primary">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
                <DropdownMenuItem 
                  onClick={() => setEditDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Редагувати
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Видалити
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {coffee.brands && (
            <Badge variant="secondary" className="w-fit bg-coffee-light/20 text-coffee-dark">
              {coffee.brands.name}
            </Badge>
          )}
          {coffee.coffee_varieties && (
            <Badge variant="outline" className="w-fit">
              {coffee.coffee_varieties.name}
            </Badge>
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
          <p className="text-sm text-muted-foreground line-clamp-2">
            {coffee.description}
          </p>
        )}

        <div className="flex justify-between items-center pt-2">
          <span className="text-xs text-muted-foreground">
            Додано: {new Date(coffee.created_at).toLocaleDateString('uk-UA')}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/coffee-catalog/${coffee.id}`)}
            className="border-coffee-light hover:bg-coffee-light/10"
          >
            Детальніше
          </Button>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <CoffeeEditDialog
        coffee={{
          id: coffee.id,
          name: coffee.name,
          description: coffee.description,
          package_size: coffee.package_size,
          brand_id: (coffee as any).brand_id,
          variety_id: (coffee as any).variety_id,
          processing_method_id: (coffee as any).processing_method_id,
        }}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
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
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? 'Видалення...' : 'Видалити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};