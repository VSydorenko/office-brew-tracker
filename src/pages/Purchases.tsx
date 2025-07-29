import { useState } from 'react';
import { PurchaseFormDialog } from '@/components/purchases/PurchaseFormDialog';
import { PurchaseList } from '@/components/purchases/PurchaseList';

const Purchases = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePurchaseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Покупки кави</h1>
          <PurchaseFormDialog onSuccess={handlePurchaseAdded} />
        </div>
        
        <PurchaseList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default Purchases;