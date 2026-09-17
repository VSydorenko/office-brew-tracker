import { useState } from 'react';
import { DistributionTemplateForm } from '@/components/distribution/DistributionTemplateForm';
import { DistributionTemplateList } from '@/components/distribution/DistributionTemplateList';

const Consumption = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTemplateCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Розподіл споживання</h1>
          <DistributionTemplateForm onSuccess={handleTemplateCreated} />
        </div>
        
        <DistributionTemplateList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default Consumption;