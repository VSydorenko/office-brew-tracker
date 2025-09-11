import { PurchaseFormDialog } from '@/components/purchases/PurchaseFormDialog';
import { PurchaseList } from '@/components/purchases/PurchaseList';

const Purchases = () => {
  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Покупки кави</h1>
          <PurchaseFormDialog />
        </div>
        
        <PurchaseList />
      </div>
    </div>
  );
};

export default Purchases;