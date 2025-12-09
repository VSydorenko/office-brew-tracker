import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/ui/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, LogOut } from 'lucide-react';

/**
 * Сторінка очікування підтвердження облікового запису.
 * Використовує централізований стан з AuthContext для оптимізації.
 */
const WaitingApproval = () => {
  const { user, profileStatus, loading, profileLoading, isApproved } = useAuth();

  useEffect(() => {
    document.title = 'Очікування підтвердження | Облік кави';
    const desc = 'Ваш акаунт очікує підтвердження адміністратором.';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', desc);
    const canonical: HTMLLinkElement = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', `${window.location.origin}/waiting-approval`);
    if (!canonical.parentNode) document.head.appendChild(canonical);
  }, []);

  // Редірект на auth якщо не залогінений
  if (!loading && !profileLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Негайний редірект для підтверджених користувачів
  if (!loading && !profileLoading && isApproved) {
    return <Navigate to="/" replace />;
  }

  const signOut = async () => { 
    await supabase.auth.signOut(); 
  };

  const titleMap: Record<string, string> = {
    pending: 'Ваш акаунт очікує підтвердження',
    rejected: 'Доступ відхилено',
    blocked: 'Акаунт заблоковано',
    approved: 'Акаунт підтверджено',
  };

  const descMap: Record<string, string> = {
    pending: 'Адміністратор перевірить вашу реєстрацію найближчим часом.',
    rejected: 'Зверніться до адміністратора, якщо вважаєте це помилкою.',
    blocked: 'Зверніться до адміністратора для розблокування.',
    approved: 'Ви вже маєте доступ. Перейдіть на головну сторінку.',
  };

  const current = profileStatus ?? 'pending';

  // Показуємо спінер під час завантаження
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-brew">
        <div className="flex items-center gap-2 text-primary">
          <Coffee className="h-8 w-8 animate-pulse" />
          <span className="text-xl">Завантаження...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-brew p-4">
      <Card className="w-full max-w-lg shadow-coffee">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Coffee className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">{titleMap[current]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">{descMap[current]}</p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={signOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" /> Вийти
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaitingApproval;
