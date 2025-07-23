import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/ui/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Coffee,
  BarChart3,
  ShoppingCart,
  Settings,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Navigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Вихід виконано",
        description: "Ви успішно вийшли з системи",
      });
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const navigation = [
    { name: 'Дашборд', href: '/', icon: BarChart3 },
    { name: 'Покупки', href: '/purchases', icon: ShoppingCart },
    { name: 'Каталог кави', href: '/coffee-catalog', icon: Coffee },
    { name: 'Розподіл', href: '/consumption', icon: Users },
    { name: 'Налаштування', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="bg-card border-b border-border shadow-brew">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Coffee className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold text-primary">Облік кави</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-brew ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground shadow-brew'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Вийти
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1 bg-card border-t border-border">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-base font-medium transition-brew ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
            <div className="px-4 py-2 border-t border-border">
              <div className="text-sm text-muted-foreground mb-2">
                {user.email}
              </div>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Вийти
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;