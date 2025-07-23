import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Consumption = () => {
  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Розподіл споживання</h1>
          <Button className="bg-gradient-coffee shadow-brew">
            <Plus className="h-4 w-4 mr-2" />
            Створити правило
          </Button>
        </div>
        
        <Card className="shadow-coffee">
          <CardHeader>
            <CardTitle>Правила розподілу</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Система розподілу в розробці...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Consumption;