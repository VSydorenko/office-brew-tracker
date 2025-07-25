import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coffee, Package, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CoffeeType {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  package_size?: string;
  created_at: string;
}

interface CoffeeCardProps {
  coffee: CoffeeType;
}

export const CoffeeCard = ({ coffee }: CoffeeCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-coffee hover:shadow-coffee-hover transition-all duration-300 border-accent/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-coffee-dark" />
            <CardTitle className="text-lg text-primary">{coffee.name}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/coffee-catalog/${coffee.id}`)}
            className="text-coffee-dark hover:text-primary"
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
        {coffee.brand && (
          <Badge variant="secondary" className="w-fit bg-coffee-light/20 text-coffee-dark">
            {coffee.brand}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {coffee.package_size && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{coffee.package_size}</span>
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
    </Card>
  );
};