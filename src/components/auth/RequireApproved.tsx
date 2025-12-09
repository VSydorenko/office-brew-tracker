import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/ui/auth-provider';
import { Coffee } from 'lucide-react';

/**
 * Компонент-захисник маршрутів, який пропускає лише підтверджених (approved) користувачів.
 * Використовує централізований стан з AuthContext для оптимізації.
 * - Якщо завантаження → спінер
 * - Якщо користувач неавторизований → редірект на /auth
 * - Якщо статус не approved → редірект на /waiting-approval
 * - Інакше відображає вкладені маршрути через <Outlet />
 */
const RequireApproved = () => {
  const { user, loading, profileStatus, profileLoading, isApproved } = useAuth();
  const location = useLocation();

  // Один загальний стан завантаження
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

  // Редірект на сторінку авторизації для незалогінених
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Редірект на сторінку очікування для непідтверджених
  if (!isApproved) {
    return <Navigate to="/waiting-approval" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireApproved;
