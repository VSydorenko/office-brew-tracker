import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Coffee, Receipt, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

/**
 * Bottom navigation component для мобільних пристроїв
 * Показує основні розділи додатку з touch-friendly кнопками
 */
const BottomNavigation = () => {
  const location = useLocation();
  const { isVisible } = useBottomNavigation();

  const navigationItems = [
    { name: 'Покупки', href: '/purchases', icon: ShoppingCart },
    { name: 'Каталог', href: '/coffee-catalog', icon: Coffee },
    { name: 'Розрахунки', href: '/my-payments', icon: Receipt },
    { name: 'Профіль', href: '/profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  if (!isVisible) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border shadow-lg md:hidden">
      <div className="grid grid-cols-5 h-16">
        {/* Navigation items */}
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-brew ${
                isActive(item.href)
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive(item.href) ? 'text-primary' : ''}`} />
              <span className="leading-none">{item.name}</span>
            </Link>
          );
        })}

        {/* Floating Action Button для швидкого додавання покупки */}
        <div className="flex items-center justify-center">
          <Button
            asChild
            size="sm"
            className="h-12 w-12 rounded-full bg-gradient-coffee shadow-coffee hover:shadow-warmth transition-all duration-300"
          >
            <Link to="/purchases?action=new">
              <Plus className="h-6 w-6" />
              <span className="sr-only">Нова покупка</span>
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;