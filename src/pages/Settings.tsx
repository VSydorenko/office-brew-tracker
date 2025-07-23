import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  return (
    <div className="min-h-screen bg-gradient-brew p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-primary">Налаштування та аналітика</h1>
        
        <Card className="shadow-coffee">
          <CardHeader>
            <CardTitle>Аналітика витрат</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Дашборд аналітики в розробці...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;