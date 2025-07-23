import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Purchases = () => {
  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Покупки кави</h1>
          <Button className="bg-gradient-coffee shadow-brew">
            <Plus className="h-4 w-4 mr-2" />
            Додати покупку
          </Button>
        </div>
        
        <Card className="shadow-coffee">
          <CardHeader>
            <CardTitle>Список покупок</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Функціонал покупок в розробці...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Purchases;