import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface TemplateUser {
  user_id: string;
  percentage: number;
  profile?: Profile;
}

interface DistributionTemplateFormProps {
  onSuccess?: () => void;
  children?: React.ReactNode;
}

/**
 * Форма для створення та редагування шаблонів розподілу кави
 */
export const DistributionTemplateForm = ({ onSuccess, children }: DistributionTemplateFormProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [templateUsers, setTemplateUsers] = useState<TemplateUser[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchProfiles();
      // Ініціалізуємо з одним користувачем
      setTemplateUsers([{ user_id: '', percentage: 0 }]);
    }
  }, [open]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Помилка завантаження профілів:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити список користувачів",
        variant: "destructive",
      });
    }
  };

  const addTemplateUser = () => {
    setTemplateUsers([...templateUsers, { user_id: '', percentage: 0 }]);
  };

  const removeTemplateUser = (index: number) => {
    setTemplateUsers(templateUsers.filter((_, i) => i !== index));
  };

  const updateTemplateUser = (index: number, field: keyof TemplateUser, value: string | number) => {
    const updated = [...templateUsers];
    updated[index] = { ...updated[index], [field]: value };
    setTemplateUsers(updated);
  };

  const getTotalPercentage = () => {
    return templateUsers.reduce((sum, user) => sum + (user.percentage || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalPercentage = getTotalPercentage();
    if (totalPercentage !== 100) {
      toast({
        title: "Помилка валідації",
        description: `Сума відсотків повинна дорівнювати 100%. Поточна сума: ${totalPercentage}%`,
        variant: "destructive",
      });
      return;
    }

    const validUsers = templateUsers.filter(user => user.user_id && user.percentage > 0);
    if (validUsers.length === 0) {
      toast({
        title: "Помилка валідації",
        description: "Додайте хоча б одного користувача з відсотком більше 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Створюємо шаблон
      const { data: template, error: templateError } = await supabase
        .from('distribution_templates')
        .insert({
          name: templateName,
          effective_from: effectiveFrom,
          is_active: true
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Додаємо користувачів до шаблону
      const templateUsersData = validUsers.map(user => ({
        template_id: template.id,
        user_id: user.user_id,
        percentage: user.percentage
      }));

      const { error: usersError } = await supabase
        .from('distribution_template_users')
        .insert(templateUsersData);

      if (usersError) throw usersError;

      toast({
        title: "Успіх",
        description: "Шаблон розподілу створено успішно",
      });

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Помилка створення шаблону:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити шаблон розподілу",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setEffectiveFrom('');
    setTemplateUsers([{ user_id: '', percentage: 0 }]);
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
          <DialogTitle>Створити шаблон розподілу</DialogTitle>
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
                <span className={`text-sm ${getTotalPercentage() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  Всього: {getTotalPercentage()}%
                </span>
                <Button type="button" variant="outline" size="sm" onClick={addTemplateUser}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {templateUsers.map((templateUser, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <select
                      value={templateUser.user_id}
                      onChange={(e) => updateTemplateUser(index, 'user_id', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      required
                    >
                      <option value="">Оберіть користувача</option>
                      {profiles.map(profile => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={templateUser.percentage}
                      onChange={(e) => updateTemplateUser(index, 'percentage', parseFloat(e.target.value) || 0)}
                      placeholder="%"
                      required
                    />
                  </div>
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
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button 
              type="submit" 
              disabled={loading || getTotalPercentage() !== 100}
              className="bg-gradient-coffee shadow-brew"
            >
              {loading ? 'Збереження...' : 'Створити шаблон'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};