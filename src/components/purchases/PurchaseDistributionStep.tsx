import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface TemplateUser {
  user_id: string;
  shares: number;
  percentage: number;
  profiles: Profile;
}

interface DistributionTemplate {
  id: string;
  name: string;
  effective_from: string;
  is_active: boolean;
  total_shares?: number;
  distribution_template_users: TemplateUser[];
}

interface PurchaseDistribution {
  user_id: string;
  shares: number;
  percentage: number;
  calculated_amount: number;
  adjusted_amount?: number;
  profile?: Profile;
}

interface PurchaseDistributionStepProps {
  totalAmount: number;
  purchaseDate: string;
  onDistributionChange?: (distributions: PurchaseDistribution[], validationData?: any) => void;
  initialDistributions?: PurchaseDistribution[];
  initialSelectedTemplate?: string;
  isManuallyModified?: boolean;
  onManualModificationChange?: (isModified: boolean) => void;
}

/**
 * Компонент для налаштування розподілу кави в рамках покупки
 */
export const PurchaseDistributionStep = ({ 
  totalAmount, 
  purchaseDate, 
  onDistributionChange,
  initialDistributions,
  initialSelectedTemplate,
  isManuallyModified = false,
  onManualModificationChange
}: PurchaseDistributionStepProps) => {
  const [templates, setTemplates] = useState<DistributionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [distributions, setDistributions] = useState<PurchaseDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [manuallyModified, setManuallyModified] = useState(isManuallyModified);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveTemplates();
  }, [purchaseDate]);

  // Автоматичний перерахунок при зміні totalAmount
  useEffect(() => {
    if (distributions.length > 0 && totalAmount > 0) {
      const totalShares = distributions.reduce((sum, dist) => sum + dist.shares, 0);
      const updatedDistributions = distributions.map(dist => ({
        ...dist,
        percentage: totalShares > 0 ? (dist.shares / totalShares) * 100 : 0,
        calculated_amount: totalShares > 0 ? (totalAmount * dist.shares) / totalShares : 0
      }));
      setDistributions(updatedDistributions);
    }
  }, [totalAmount]);

  const fetchActiveTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('distribution_templates')
        .select(`
          *,
          distribution_template_users (
            user_id,
            shares,
            percentage,
            profiles (
              id,
              name,
              email
            )
          )
        `)
        .eq('is_active', true)
        .lte('effective_from', purchaseDate)
        .order('effective_from', { ascending: false });

      if (error) throw error;

      const templatesData = data || [];
      setTemplates(templatesData);

      // Ініціалізуємо початкові дані якщо передані
      if (initialDistributions && initialDistributions.length > 0) {
        setDistributions(initialDistributions);
        if (initialSelectedTemplate) {
          setSelectedTemplate(initialSelectedTemplate);
        }
      } else if (templatesData.length > 0) {
        // Автоматично обираємо найактуальніший шаблон тільки якщо немає початкових даних
        const latestTemplate = templatesData[0];
        setSelectedTemplate(latestTemplate.id);
        applyTemplate(latestTemplate);
      }
    } catch (error) {
      console.error('Помилка завантаження шаблонів:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити шаблони розподілу",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: DistributionTemplate) => {
    const totalShares = template.total_shares || template.distribution_template_users.reduce((sum, user) => sum + user.shares, 0);
    const newDistributions = template.distribution_template_users.map(templateUser => ({
      user_id: templateUser.user_id,
      shares: templateUser.shares,
      percentage: totalShares > 0 ? (templateUser.shares / totalShares) * 100 : 0,
      calculated_amount: totalShares > 0 ? (totalAmount * templateUser.shares) / totalShares : 0,
      profile: templateUser.profiles
    }));
    setDistributions(newDistributions);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      applyTemplate(template);
    }
  };

  const updateDistribution = (index: number, field: keyof PurchaseDistribution, value: number) => {
    const updated = [...distributions];
    updated[index] = { ...updated[index], [field]: value };
    
    // Якщо змінюються частки, перераховуємо відсоток і суму
    if (field === 'shares') {
      const totalShares = updated.reduce((sum, dist) => sum + dist.shares, 0);
      updated[index].percentage = totalShares > 0 ? (value / totalShares) * 100 : 0;
      updated[index].calculated_amount = totalShares > 0 ? (totalAmount * value) / totalShares : 0;
      updated[index].adjusted_amount = undefined; // Скидаємо коригування
      
      // Перераховуємо відсотки для всіх користувачів
      updated.forEach((dist, i) => {
        dist.percentage = totalShares > 0 ? (dist.shares / totalShares) * 100 : 0;
        if (i !== index) {
          dist.calculated_amount = totalShares > 0 ? (totalAmount * dist.shares) / totalShares : 0;
        }
      });
    }
    
    // Позначаємо як змінено вручну
    setManuallyModified(true);
    onManualModificationChange?.(true);
    
    setDistributions(updated);
  };

  const recalculateFromTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      applyTemplate(template);
      setManuallyModified(false);
      onManualModificationChange?.(false);
      toast({
        title: "Успіх",
        description: "Розподіл перераховано за шаблоном",
      });
    }
  };

  const redistributeEqually = () => {
    if (distributions.length === 0) return;
    
    const equalShares = 1; // Кожному по 1 частці
    const updatedDistributions = distributions.map(dist => ({
      ...dist,
      shares: equalShares,
      percentage: (1 / distributions.length) * 100,
      calculated_amount: totalAmount / distributions.length,
      adjusted_amount: undefined
    }));
    
    setDistributions(updatedDistributions);
    setManuallyModified(true);
    onManualModificationChange?.(true);
    toast({
      title: "Розподіл оновлено",
      description: "Встановлено рівномірний розподіл між усіма користувачами",
    });
  };

  const getTotalShares = () => {
    return distributions.reduce((sum, dist) => sum + dist.shares, 0);
  };

  const getTotalPercentage = () => {
    return distributions.reduce((sum, dist) => sum + dist.percentage, 0);
  };

  const getTotalCalculatedAmount = () => {
    return distributions.reduce((sum, dist) => 
      sum + (dist.adjusted_amount ?? dist.calculated_amount), 0
    );
  };

  const removeUserFromDistribution = (userId: string) => {
    const updatedDistributions = distributions.filter(dist => dist.user_id !== userId);
    
    if (updatedDistributions.length === 0) {
      setDistributions([]);
      setManuallyModified(true);
      onManualModificationChange?.(true);
      return;
    }

    // Перераховуємо відсотки та суми для решти користувачів
    const totalShares = updatedDistributions.reduce((sum, dist) => sum + dist.shares, 0);
    const recalculatedDistributions = updatedDistributions.map(dist => ({
      ...dist,
      percentage: totalShares > 0 ? (dist.shares / totalShares) * 100 : 0,
      calculated_amount: totalShares > 0 ? (totalAmount * dist.shares) / totalShares : 0
    }));
    
    setDistributions(recalculatedDistributions);
    setManuallyModified(true);
    onManualModificationChange?.(true);
    
    toast({
      title: "Користувача видалено",
      description: "Розподіл автоматично перераховано для решти користувачів",
    });
  };

  // Експортуємо функції валідації через props
  useEffect(() => {
    const totalShares = getTotalShares();
    const validationData = {
      totalShares: totalShares,
      totalPercentage: getTotalPercentage(),
      totalCalculatedAmount: getTotalCalculatedAmount(),
      isValidShares: totalShares > 0,
      isValidAmount: Math.abs(getTotalCalculatedAmount() - totalAmount) <= 0.01,
      selectedTemplate: selectedTemplate,
      distributions
    };
    
    onDistributionChange?.(distributions, validationData);
  }, [distributions, totalAmount, selectedTemplate, onDistributionChange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Розподіл покупки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Завантаження шаблонів...</div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Розподіл покупки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Немає активних шаблонів розподілу для цієї дати.
            <br />
            Створіть шаблон розподілу в розділі "Розподіл споживання".
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Розподіл покупки
          </CardTitle>
          <div className="flex items-center gap-2">
            {manuallyModified && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Змінено вручну
              </Badge>
            )}
            <Badge variant="outline">
              {getTotalShares()} часток
            </Badge>
            <Badge variant={Math.abs(getTotalPercentage() - 100) < 0.01 ? "default" : "secondary"}>
              {getTotalPercentage().toFixed(1)}%
            </Badge>
            <Badge variant="outline">
              {getTotalCalculatedAmount().toFixed(2)} ₴
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor="template">Шаблон розподілу</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть шаблон" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} (з {new Date(template.effective_from).toLocaleDateString('uk-UA')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={redistributeEqually}
            disabled={distributions.length === 0}
            title="Рівномірний розподіл між усіма користувачами"
          >
            Рівномірно
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={recalculateFromTemplate}
            disabled={!selectedTemplate}
            title="Перерахувати за шаблоном"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-2 text-sm font-medium text-muted-foreground">
            <span>Користувач</span>
            <span>Частки</span>
            <span>%</span>
            <span>Розраховано</span>
            <span>Скориговано</span>
            <span>Підсумок</span>
            <span>Дії</span>
          </div>
          
          {distributions.map((distribution, index) => (
            <div key={distribution.user_id} className="grid grid-cols-7 gap-2 items-center">
              <span className="text-sm font-medium">
                {distribution.profile?.name}
              </span>
              <Input
                type="number"
                min="1"
                step="1"
                value={distribution.shares}
                onChange={(e) => updateDistribution(index, 'shares', parseInt(e.target.value) || 1)}
                className="h-8"
              />
              <span className="text-sm text-muted-foreground">
                {distribution.percentage.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                {distribution.calculated_amount.toFixed(2)} ₴
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={distribution.adjusted_amount ?? ''}
                onChange={(e) => updateDistribution(index, 'adjusted_amount', parseFloat(e.target.value) || 0)}
                placeholder="Авто"
                className="h-8"
              />
              <span className="text-sm font-medium">
                {(distribution.adjusted_amount ?? distribution.calculated_amount).toFixed(2)} ₴
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeUserFromDistribution(distribution.user_id)}
                className="h-8 w-8 p-0"
                title="Видалити користувача з розподілу"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {getTotalShares() <= 0 && (
          <div className="p-3 border border-destructive rounded-md bg-destructive/10">
            <p className="text-sm text-destructive">
              Увага: Загальна кількість часток повинна бути більше 0. 
              Поточна кількість: {getTotalShares()}
            </p>
          </div>
        )}

        {Math.abs(getTotalCalculatedAmount() - totalAmount) > 0.01 && (
          <div className="p-3 border border-yellow-500 rounded-md bg-yellow-50">
            <p className="text-sm text-yellow-800">
              Сума розподілу ({getTotalCalculatedAmount().toFixed(2)} ₴) 
              не збігається з загальною сумою покупки ({totalAmount.toFixed(2)} ₴)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};