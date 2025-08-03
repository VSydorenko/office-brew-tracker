import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Edit, Trash2 } from 'lucide-react';

/**
 * Mobile-first картка з swipe actions та touch-оптимізованими елементами
 */
interface SwipeableCardProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  status?: string;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onEdit,
  onDelete,
  onClick,
  status,
  className = '',
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwipeVisible, setIsSwipeVisible] = useState(false);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      setIsSwipeVisible(true);
      // Автоматично приховати через 3 секунди
      setTimeout(() => setIsSwipeVisible(false), 3000);
    }
  };

  return (
    <div className="relative">
      <Card 
        className={`
          shadow-coffee hover:shadow-coffee-hover transition-all duration-300 
          border-accent/20 touch-manipulation
          ${isSwipeVisible ? 'transform translate-x-[-80px]' : ''}
          ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
          ${className}
        `}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onClick}
      >
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {children}
            </div>
            
            {/* Mobile indicator */}
            <div className="flex items-center gap-2 ml-3 md:hidden">
              {status && (
                <Badge 
                  variant={status === 'active' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {status}
                </Badge>
              )}
              {onClick && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              {status && (
                <Badge 
                  variant={status === 'active' ? 'default' : 'secondary'}
                >
                  {status}
                </Badge>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile swipe actions */}
      {(onEdit || onDelete) && (
        <div 
          className={`
            absolute top-0 right-0 h-full w-20 flex md:hidden
            ${isSwipeVisible ? 'translate-x-0' : 'translate-x-full'}
            transition-transform duration-300
          `}
        >
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 h-full rounded-none rounded-l-lg border-l-0 bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              <Edit className="h-5 w-5 text-blue-600" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="flex-1 h-full rounded-none rounded-r-lg border-l-0"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};