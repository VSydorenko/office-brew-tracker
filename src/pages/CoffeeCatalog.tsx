import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const CoffeeCatalog = () => {
  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Каталог кави</h1>
          <Button className="bg-gradient-coffee shadow-brew">
            <Plus className="h-4 w-4 mr-2" />
            Додати каву
          </Button>
        </div>
        
        <Card className="shadow-coffee">
          <CardHeader>
            <CardTitle>Довідник упаковок кави</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Каталог кави в розробці...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoffeeCatalog;