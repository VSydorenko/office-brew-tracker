import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Skeleton loader для мобільних карток списків
 * Відображає placeholder під час завантаження даних
 */
interface SkeletonCardProps {
  variant?: 'list' | 'grid' | 'compact';
  count?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  variant = 'list', 
  count = 3 
}) => {
  const getSkeletonClasses = () => {
    switch (variant) {
      case 'grid':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6';
      case 'compact':
        return 'space-y-2';
      default:
        return 'space-y-4';
    }
  };

  const getCardClasses = () => {
    switch (variant) {
      case 'compact':
        return 'p-3 md:p-4';
      default:
        return 'p-4 md:p-6';
    }
  };

  return (
    <div className={getSkeletonClasses()}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="shadow-coffee animate-pulse">
          <CardContent className={getCardClasses()}>
            <div className="space-y-3">
              <div className="h-5 md:h-6 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              {variant !== 'compact' && (
                <>
                  <div className="flex gap-2 mt-4">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-8 bg-muted rounded w-20"></div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};