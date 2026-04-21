import { ReferenceTableManager } from '@/components/settings/ReferenceTableManager';
import { Coffee, Award, Palette, Settings2, MapPin } from 'lucide-react';

const Settings = () => {
  const referenceConfigs = [
    {
      tableName: 'brands',
      displayName: 'Бренди',
      icon: <Award className="h-5 w-5" />
    },
    {
      tableName: 'coffee_varieties',
      displayName: 'Різновиди кави',
      icon: <Coffee className="h-5 w-5" />
    },
    {
      tableName: 'origins',
      displayName: 'Походження кави',
      icon: <MapPin className="h-5 w-5" />
    },
    {
      tableName: 'processing_methods',
      displayName: 'Методи обробки',
      icon: <Settings2 className="h-5 w-5" />
    },
    {
      tableName: 'flavors',
      displayName: 'Смаки',
      icon: <Palette className="h-5 w-5" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-primary">Довідники</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {referenceConfigs.map((config) => (
            <ReferenceTableManager key={config.tableName} config={config} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
