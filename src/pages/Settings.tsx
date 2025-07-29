import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <h1 className="text-3xl font-bold text-primary">Налаштування та аналітика</h1>
        
        <Tabs defaultValue="references" className="space-y-6">
          <TabsList>
            <TabsTrigger value="references">Довідники</TabsTrigger>
            <TabsTrigger value="analytics">Аналітика</TabsTrigger>
          </TabsList>

          <TabsContent value="references" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {referenceConfigs.map((config) => (
                <ReferenceTableManager key={config.tableName} config={config} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="shadow-coffee">
              <CardHeader>
                <CardTitle>Аналітика витрат</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Дашборд аналітики в розробці...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;