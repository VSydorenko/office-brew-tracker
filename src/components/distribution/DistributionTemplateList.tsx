import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DistributionTemplateForm } from './DistributionTemplateForm';

interface TemplateUser {
  user_id: string;
  percentage: number;
  profiles: {
    name: string;
    email: string;
  };
}

interface DistributionTemplate {
  id: string;
  name: string;
  effective_from: string;
  is_active: boolean;
  created_at: string;
  distribution_template_users: TemplateUser[];
}

interface DistributionTemplateListProps {
  refreshTrigger?: number;
}

/**
 * Список шаблонів розподілу кави з можливістю перегляду, редагування та видалення
 */
export const DistributionTemplateList = ({ refreshTrigger }: DistributionTemplateListProps) => {
  const [templates, setTemplates] = useState<DistributionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, [refreshTrigger]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('distribution_templates')
        .select(`
          *,
          distribution_template_users (
            user_id,
            percentage,
            profiles (
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
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

  const handleDelete = async (templateId: string) => {
    try {
      setDeletingId(templateId);
      
      const { error } = await supabase
        .from('distribution_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: "Шаблон розподілу видалено",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Помилка видалення шаблону:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити шаблон розподілу",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActiveStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('distribution_templates')
        .update({ is_active: !currentStatus })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Успіх",
        description: `Шаблон ${!currentStatus ? 'активовано' : 'деактивовано'}`,
      });

      fetchTemplates();
    } catch (error) {
      console.error('Помилка оновлення статусу шаблону:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося змінити статус шаблону",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Поки що немає шаблонів розподілу</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {templates.map(template => (
        <Card key={template.id} className="shadow-coffee">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {template.name}
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? 'Активний' : 'Неактивний'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Діє з: {new Date(template.effective_from).toLocaleDateString('uk-UA')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActiveStatus(template.id, template.is_active)}
                >
                  {template.is_active ? 'Деактивувати' : 'Активувати'}
                </Button>
                <DistributionTemplateForm 
                  templateId={template.id} 
                  onSuccess={fetchTemplates}
                >
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DistributionTemplateForm>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === template.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Видалити шаблон?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ця дія незворотна. Шаблон "{template.name}" та всі пов'язані з ним дані будуть видалені.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Скасувати</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(template.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Видалити
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Розподіл користувачів:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {template.distribution_template_users.map(user => (
                  <div key={user.user_id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{user.profiles.name}</span>
                    <Badge variant="outline">{user.percentage}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};