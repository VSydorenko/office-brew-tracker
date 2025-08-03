import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Простий компонент картки без swipe функціоналу
 */
interface SimpleCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const SimpleCard: React.FC<SimpleCardProps> = ({
  children,
  onClick,
  className = '',
}) => {
  return (
    <Card 
      className={`
        shadow-coffee hover:shadow-coffee-hover transition-all duration-300 
        border-accent/20 touch-manipulation
        ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-6">
        {children}
      </CardContent>
    </Card>
  );
};