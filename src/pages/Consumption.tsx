import { DistributionTemplateForm } from '@/components/distribution/DistributionTemplateForm';
import { DistributionTemplateList } from '@/components/distribution/DistributionTemplateList';

/**
 * Сторінка управління шаблонами розподілу споживання.
 * Інвалідація даних відбувається автоматично через React Query/Realtime.
 */
const Consumption = () => {
  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary">Розподіл споживання</h1>
          <DistributionTemplateForm />
        </div>
        
        <DistributionTemplateList />
      </div>
    </div>
  );
};

export default Consumption;
