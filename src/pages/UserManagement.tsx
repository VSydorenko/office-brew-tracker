import { useEffect, useState } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Coffee, ShieldCheck, ShieldAlert, Search } from 'lucide-react';
import { useProfiles, useCurrentProfile, useApproveProfile, useRejectProfile, useUpdateUserRole } from '@/hooks/use-profiles';

/**
 * Сторінка керування користувачами (лише для адміністраторів).
 * Дозволяє переглядати профілі, змінювати статус (approve/reject/block) та роль (user/admin).
 */
const UserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // React Query хуки
  const { data: currentProfile } = useCurrentProfile();
  const { data: profiles = [], isLoading: loading, refetch } = useProfiles();
  
  const approveMutation = useApproveProfile();
  const rejectMutation = useRejectProfile();
  const updateRoleMutation = useUpdateUserRole();

  const isAdmin = currentProfile?.role === 'admin';

  useEffect(() => {
    document.title = 'Управління користувачами | Облік кави';
    const desc = 'Панель адміністратора: підтвердження користувачів та керування ролями.';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', desc);
    const canonical: HTMLLinkElement = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', `${window.location.origin}/user-management`);
    if (!canonical.parentNode) document.head.appendChild(canonical);
  }, []);

  // Фільтрування профілів за пошуком
  const filteredProfiles = profiles.filter(profile => 
    !search.trim() || profile.name?.toLowerCase().includes(search.toLowerCase())
  );

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    // Фільтрування відбувається в реальному часі
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'blocked') => {
    setUpdatingId(id);
    try {
      if (status === 'approved') {
        await approveMutation.mutateAsync(id);
      } else if (status === 'rejected') {
        await rejectMutation.mutateAsync(id);
      } else {
        // Для blocked використовуємо approve mutation з rejected статусом
        await rejectMutation.mutateAsync(id);
      }
      toast({ title: 'Оновлено', description: 'Статус користувача змінено' });
    } catch (error: any) {
      toast({ title: 'Помилка', description: error.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const updateRole = async (id: string, role: 'admin' | 'user') => {
    setUpdatingId(id);
    try {
      await updateRoleMutation.mutateAsync({ userId: id, role });
      toast({ title: 'Оновлено', description: 'Роль користувача змінено' });
    } catch (error: any) {
      toast({ title: 'Помилка', description: error.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      approved: 'bg-green-500/15 text-green-600',
      pending: 'bg-amber-500/15 text-amber-600',
      rejected: 'bg-red-500/15 text-red-600',
      blocked: 'bg-red-500/15 text-red-600',
    };
    const cls = map[s] || 'bg-muted text-muted-foreground';
    return <Badge className={cls}>{s}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-brew">
        <div className="flex items-center gap-2 text-primary">
          <Coffee className="h-8 w-8 animate-pulse" />
          <span className="text-xl">Завантаження...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" /> Доступ заборонено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Лише адміністратори можуть переглядати цю сторінку.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Керування користувачами</h1>
          <p className="text-sm text-muted-foreground">Підтвердження реєстрацій та ролі</p>
        </div>
      </header>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSearch} className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук за іменем..."
                className="pl-9"
                aria-label="Пошук користувачів"
              />
            </div>
            <Button type="submit" className="bg-gradient-coffee">Шукати</Button>
          </form>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ім'я</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>
                      <Select value={p.role} onValueChange={(v) => updateRole(p.id, v as any)}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Роль" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">user</SelectItem>
                          <SelectItem value="admin">admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" disabled={updatingId===p.id} onClick={() => updateStatus(p.id, 'approved')}>
                        <ShieldCheck className="h-4 w-4 mr-1"/> Підтвердити
                      </Button>
                      <Button size="sm" variant="ghost" disabled={updatingId===p.id} onClick={() => updateStatus(p.id, 'rejected')}>Відхилити</Button>
                      {p.status !== 'blocked' ? (
                        <Button size="sm" variant="destructive" disabled={updatingId===p.id} onClick={() => updateStatus(p.id, 'blocked')}>Заблокувати</Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled={updatingId===p.id} onClick={() => updateStatus(p.id, 'approved')}>Розблокувати</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Список користувачів офісу</TableCaption>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
