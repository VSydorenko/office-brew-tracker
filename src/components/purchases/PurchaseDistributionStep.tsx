import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useActiveDistributionTemplates, type DistributionTemplateWithUsers } from '@/hooks/use-distribution-templates';
import { buildDistributionsFromShares } from '@/hooks/use-purchases';

interface Profile {
  id: string;
  name: string;
  email?: string;
}

interface PurchaseDistribution {
  user_id: string;
  shares: number;
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
 * Компонент для налаштування розподілу кави в рамках покупки.
 * Використовує React Query хук для отримання активних шаблонів та
 * спільну утиліту buildDistributionsFromShares для розрахунку сум.
 */
export const PurchaseDistributionStep = ({
  totalAmount,
  purchaseDate,
  onDistributionChange,
  initialDistributions,
  initialSelectedTemplate,
  isManuallyModified = false,
  onManualModificationChange,
}: PurchaseDistributionStepProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialSelectedTemplate || '');
  const [distributions, setDistributions] = useState<PurchaseDistribution[]>(initialDistributions || []);
  const [manuallyModified, setManuallyModified] = useState(isManuallyModified);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { toast } = useToast();

  const { data: templates = [], isLoading: loading } = useActiveDistributionTemplates(purchaseDate);

  /**
   * Застосовує шаблон до поточної суми, формуючи розподіли через спільну утиліту.
   */
  const applyTemplate = (template: DistributionTemplateWithUsers, amount: number = totalAmount) => {
    const templateUsers = template.distribution_template_users.map((tu) => ({
      user_id: tu.user_id,
      shares: tu.shares,
    }));
    const built = buildDistributionsFromShares(templateUsers, amount);
    const profileMap = new Map(
      template.distribution_template_users.map((tu) => [tu.user_id, tu.profiles])
    );
    const newDistributions = built.map((d) => ({
      ...d,
      profile: profileMap.get(d.user_id) as Profile | undefined,
    }));
    setDistributions(newDistributions);
  };

  // Ініціалізація після завантаження шаблонів
  useEffect(() => {
    if (loading || hasInitialized || templates.length === 0) return;

    if (initialDistributions && initialDistributions.length > 0) {
      setDistributions(initialDistributions);
      if (initialSelectedTemplate) {
        setSelectedTemplate(initialSelectedTemplate);
      }
    } else if (initialSelectedTemplate) {
      const templateFromPrev = templates.find((t) => t.id === initialSelectedTemplate);
      if (templateFromPrev) {
        setSelectedTemplate(initialSelectedTemplate);
        applyTemplate(templateFromPrev);
      } else {
        const latest = templates[0];
        setSelectedTemplate(latest.id);
        applyTemplate(latest);
      }
    } else {
      const latest = templates[0];
      setSelectedTemplate(latest.id);
      applyTemplate(latest);
    }
    setHasInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, templates, hasInitialized]);

  // Автоматичний перерахунок при зміні totalAmount (тільки якщо не змінено вручну)
  useEffect(() => {
    if (distributions.length === 0 || totalAmount <= 0 || manuallyModified) return;

    const templateUsers = distributions.map((d) => ({
      user_id: d.user_id,
      shares: d.shares,
    }));
    const built = buildDistributionsFromShares(templateUsers, totalAmount);
    const profileMap = new Map(distributions.map((d) => [d.user_id, d.profile]));
    setDistributions(
      built.map((d) => ({
        ...d,
        profile: profileMap.get(d.user_id),
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalAmount]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      applyTemplate(template);
      setManuallyModified(false);
      onManualModificationChange?.(false);
    }
  };

  const updateDistribution = (index: number, field: keyof PurchaseDistribution, value: number) => {
    const updated = [...distributions];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'shares') {
      const templateUsers = updated.map((d) => ({ user_id: d.user_id, shares: d.shares }));
      const built = buildDistributionsFromShares(templateUsers, totalAmount);
      const profileMap = new Map(updated.map((d) => [d.user_id, d.profile]));
      const result = built.map((d) => ({
        ...d,
        profile: profileMap.get(d.user_id),
      }));
      setDistributions(result);
    } else {
      setDistributions(updated);
    }

    setManuallyModified(true);
    onManualModificationChange?.(true);
  };

  const recalculateFromTemplate = () => {
    const template = templates.find((t) => t.id === selectedTemplate);
    if (template) {
      applyTemplate(template);
      setManuallyModified(false);
      onManualModificationChange?.(false);
      toast({
        title: 'Успіх',
        description: 'Розподіл перераховано за шаблоном',
      });
    }
  };

  const removeUserFromDistribution = (userId: string) => {
    const remaining = distributions.filter((d) => d.user_id !== userId);

    if (remaining.length === 0) {
      setDistributions([]);
      setManuallyModified(true);
      onManualModificationChange?.(true);
      return;
    }

    const templateUsers = remaining.map((d) => ({ user_id: d.user_id, shares: d.shares }));
    const built = buildDistributionsFromShares(templateUsers, totalAmount);
    const profileMap = new Map(remaining.map((d) => [d.user_id, d.profile]));
    setDistributions(
      built.map((d) => ({
        ...d,
        profile: profileMap.get(d.user_id),
      }))
    );
    setManuallyModified(true);
    onManualModificationChange?.(true);

    toast({
      title: 'Користувача видалено',
      description: 'Розподіл автоматично перераховано для решти користувачів',
    });
  };

  const totalShares = useMemo(
    () => distributions.reduce((sum, dist) => sum + dist.shares, 0),
    [distributions]
  );

  const totalCalculatedAmount = useMemo(
    () => distributions.reduce((sum, dist) => sum + dist.calculated_amount, 0),
    [distributions]
  );

  // Експортуємо валідаційні дані через onDistributionChange
  useEffect(() => {
    const validationData = {
      totalShares,
      totalCalculatedAmount,
      isValidShares: totalShares > 0,
      isValidAmount: Math.abs(totalCalculatedAmount - totalAmount) <= 0.01,
      selectedTemplate,
      distributions,
    };
    onDistributionChange?.(distributions, validationData);
  }, [distributions, totalAmount, selectedTemplate, totalShares, totalCalculatedAmount, onDistributionChange]);

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
            <Badge variant="outline">{totalShares} часток</Badge>
            <Badge variant="outline">{totalCalculatedAmount.toFixed(2)} ₴</Badge>
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
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} (з {new Date(template.effective_from).toLocaleDateString('uk-UA')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
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
          <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground">
            <span>Користувач</span>
            <span>Частки</span>
            <span>Підсумок</span>
            <span>Дії</span>
          </div>

          {distributions.map((distribution, index) => (
            <div key={distribution.user_id} className="grid grid-cols-4 gap-2 items-center">
              <span className="text-sm font-medium">{distribution.profile?.name}</span>
              <Input
                type="number"
                min="1"
                step="1"
                value={distribution.shares}
                onChange={(e) => updateDistribution(index, 'shares', parseInt(e.target.value) || 1)}
                className="h-8"
              />
              <span className="text-sm font-medium">{distribution.calculated_amount.toFixed(2)} ₴</span>
              <Button
                type="button"
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

        {totalShares <= 0 && (
          <div className="p-3 border border-destructive rounded-md bg-destructive/10">
            <p className="text-sm text-destructive">
              Увага: Загальна кількість часток повинна бути більше 0. Поточна кількість: {totalShares}
            </p>
          </div>
        )}

        {Math.abs(totalCalculatedAmount - totalAmount) > 0.01 && (
          <div className="p-3 border border-yellow-500 rounded-md bg-yellow-50">
            <p className="text-sm text-yellow-800">
              Сума розподілу ({totalCalculatedAmount.toFixed(2)} ₴) не збігається з загальною сумою покупки ({totalAmount.toFixed(2)} ₴)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
