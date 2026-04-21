import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Users, MoreVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DistributionTemplateForm } from './DistributionTemplateForm';
import {
  useDistributionTemplates,
  useDeleteDistributionTemplate,
  useToggleDistributionTemplate,
} from '@/hooks/use-distribution-templates';

/**
 * Список шаблонів розподілу кави з можливістю перегляду, редагування та видалення.
 * Дані оновлюються автоматично через React Query + Realtime.
 */
export const DistributionTemplateList = () => {
  const { data: templates = [], isLoading } = useDistributionTemplates();
  const deleteTemplate = useDeleteDistributionTemplate();
  const toggleTemplate = useToggleDistributionTemplate();

  const handleDelete = (templateId: string) => {
    deleteTemplate.mutate(templateId);
  };

  const handleToggle = (templateId: string, currentStatus: boolean) => {
    toggleTemplate.mutate({ id: templateId, isActive: !currentStatus });
  };

  if (isLoading) {
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
      {templates.map((template: any) => (
        <Card key={template.id} className="shadow-coffee">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {template.name}
                  <Badge variant={template.is_active ? 'default' : 'secondary'}>
                    {template.is_active ? 'Активний' : 'Неактивний'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Діє з: {new Date(template.effective_from).toLocaleDateString('uk-UA')}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border">
                  <DropdownMenuItem
                    onClick={() => handleToggle(template.id, template.is_active)}
                  >
                    {template.is_active ? 'Деактивувати' : 'Активувати'}
                  </DropdownMenuItem>
                  <DistributionTemplateForm templateId={template.id}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="h-4 w-4 mr-2" />
                      Редагувати
                    </DropdownMenuItem>
                  </DistributionTemplateForm>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                        disabled={deleteTemplate.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Видалити
                      </DropdownMenuItem>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Розподіл користувачів:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {template.distribution_template_users?.map((user: any) => (
                  <div key={user.user_id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{user.profiles?.name}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline">{user.shares} ч.</Badge>
                    </div>
                  </div>
                ))}
              </div>
              {template.total_shares != null && (
                <div className="text-xs text-muted-foreground mt-2">
                  Всього часток: {template.total_shares}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
