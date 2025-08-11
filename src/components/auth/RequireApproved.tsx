import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/ui/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { Coffee } from 'lucide-react';

/**
 * Компонент-захисник маршрутів, який пропускає лише підтверджених (approved) користувачів.
 * - Якщо користувач неавторизований → редірект на /auth
 * - Якщо статус не approved → редірект на /waiting-approval
 * - Інакше відображає вкладені маршрути через <Outlet />
 */
const RequireApproved = () => {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'blocked' | null>(null);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .maybeSingle();
      if (isMounted) {
        if (!error) setStatus((data?.status as any) ?? null);
        setChecking(false);
      }
    };
    fetchStatus();
    return () => { isMounted = false; };
  }, [user]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-brew">
        <div className="flex items-center gap-2 text-primary">
          <Coffee className="h-8 w-8 animate-pulse" />
          <span className="text-xl">Завантаження...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (status && status !== 'approved') {
    return <Navigate to="/waiting-approval" replace />;
  }

  return <Outlet />;
};

export default RequireApproved;
