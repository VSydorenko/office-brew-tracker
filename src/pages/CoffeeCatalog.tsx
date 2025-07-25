import { useState } from 'react';
import { CoffeeForm } from '@/components/coffee/CoffeeForm';
import { CoffeeList } from '@/components/coffee/CoffeeList';

const CoffeeCatalog = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCoffeeAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Каталог кави</h1>
          <CoffeeForm onSuccess={handleCoffeeAdded} />
        </div>
        
        <CoffeeList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default CoffeeCatalog;