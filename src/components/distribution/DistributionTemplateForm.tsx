import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfiles } from '@/hooks/use-profiles';
import {
  useDistributionTemplate,
  useUpsertDistributionTemplate,
} from '@/hooks/use-distribution-templates';

interface TemplateUser {
  user_id: string;
  shares: number;
}

interface DistributionTemplateFormProps {
  onSuccess?: () => void;
  children?: React.ReactNode;
  templateId?: string;
}

/**
 * Форма для створення та редагування шаблонів розподілу кави.
 * Використовує React Query хуки для роботи з даними.
 */
export const DistributionTemplateForm = ({ onSuccess, children, templateId }: DistributionTemplateFormProps) => {
  const [open, setOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [templateUsers, setTemplateUsers] = useState<TemplateUser[]>([]);
  const { toast } = useToast();

  const isEditMode = !!templateId;
  const { data: profiles = [] } = useProfiles();
  const { data: templateData } = useDistributionTemplate(open && isEditMode ? templateId : undefined);
  const upsertTemplate = useUpsertDistributionTemplate();

  useEffect(() => {
    if (open) {
      if (isEditMode && templateData) {
        setTemplateName((templateData as any).name);
        setEffectiveFrom((templateData as any).effective_from);
        setTemplateUsers(
          ((templateData as any).distribution_template_users || []).map((u: any) => ({
            user_id: u.user_id,
            shares: u.shares,
          }))
        );
      } else if (!isEditMode) {
        setTemplateUsers([{ user_id: '', shares: 1 }]);
      }
    }
  }, [open, isEditMode, templateData]);

  const addTemplateUser = () => {
    setTemplateUsers([...templateUsers, { user_id: '', shares: 1 }]);
  };

  const addEqualDistribution = () => {
    if (profiles.length === 0) return;
    const equalUsers = profiles.map((profile: any) => ({
      user_id: profile.id,
      shares: 1,
    }));
    setTemplateUsers(equalUsers);
    toast({
      title: 'Розподіл створено',
      description: `Додано ${profiles.length} користувачів з рівномірним розподілом`,
    });
  };

  const removeTemplateUser = (index: number) => {
    setTemplateUsers(templateUsers.filter((_, i) => i !== index));
  };

  const updateTemplateUser = (index: number, field: keyof TemplateUser, value: string | number) => {
    const updated = [...templateUsers];
    updated[index] = { ...updated[index], [field]: value } as TemplateUser;
    setTemplateUsers(updated);
  };

  const getTotalShares = () => templateUsers.reduce((sum, user) => sum + (user.shares || 0), 0);

  const resetForm = () => {
    setTemplateName('');
    setEffectiveFrom('');
    setTemplateUsers([{ user_id: '', shares: 1 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalShares = getTotalShares();
    if (totalShares <= 0) {
      toast({
        title: 'Помилка валідації',
        description: 'Загальна кількість часток повинна бути більше 0',
        variant: 'destructive',
      });
      return;
    }

    const validUsers = templateUsers.filter((user) => user.user_id && user.shares > 0);
    if (validUsers.length === 0) {
      toast({
        title: 'Помилка валідації',
        description: 'Додайте хоча б одного користувача з частками більше 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      await upsertTemplate.mutateAsync({
        id: templateId,
        name: templateName,
        effective_from: effectiveFrom,
        total_shares: totalShares,
        users: validUsers,
      });

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch {
      // Тост помилки вже показано в useSupabaseMutation
    }
  };

  const defaultTrigger = (
    <Button className="bg-gradient-coffee shadow-brew">
      <Plus className="h-4 w-4 mr-2" />
      Створити шаблон
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Редагувати' : 'Створити'} шаблон розподілу</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="templateName">Назва шаблону</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Наприклад: Розподіл Q1 2024"
                required
              />
            </div>
            <div>
              <Label htmlFor="effectiveFrom">Дата початку дії</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Розподіл користувачів</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary">
                  Всього часток: {getTotalShares()}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEqualDistribution}
                  title="Додати всіх користувачів з рівномірним розподілом"
                >
                  Рівномірно
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addTemplateUser}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-9 gap-3 text-sm font-medium text-muted-foreground mb-2">
                <span className="col-span-6">Користувач</span>
                <span className="col-span-2">Частки</span>
                <span className="col-span-1"></span>
              </div>
              {templateUsers.map((templateUser, index) => (
                <div key={index} className="grid grid-cols-9 gap-3 items-center">
                  <div className="col-span-6">
                    <select
                      value={templateUser.user_id}
                      onChange={(e) => updateTemplateUser(index, 'user_id', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    >
                      <option value="">Оберіть користувача</option>
                      {profiles.map((profile: any) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={templateUser.shares || ''}
                      onChange={(e) => updateTemplateUser(index, 'shares', parseInt(e.target.value) || 1)}
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    {templateUsers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTemplateUser(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={upsertTemplate.isPending || getTotalShares() <= 0}
              className="bg-gradient-coffee shadow-brew"
            >
              {upsertTemplate.isPending ? 'Збереження...' : isEditMode ? 'Оновити шаблон' : 'Створити шаблон'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
