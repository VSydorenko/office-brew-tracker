import React, { useState } from 'react';
import { Copy, CreditCard, Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CardNumberDisplayProps {
  cardNumber: string;
  cardHolderName?: string;
  className?: string;
  showName?: boolean;
  defaultMasked?: boolean;
}

/**
 * Компонент для відображення номера карти з можливістю копіювання
 * @param cardNumber - номер карти (16 цифр)
 * @param cardHolderName - ім'я власника карти
 * @param className - додаткові CSS класи
 * @param showName - чи показувати ім'я власника
 * @param defaultMasked - чи маскувати номер за замовчуванням
 */
export const CardNumberDisplay: React.FC<CardNumberDisplayProps> = ({
  cardNumber,
  cardHolderName,
  className,
  showName = false,
  defaultMasked = true
}) => {
  const { toast } = useToast();
  const [isMasked, setIsMasked] = useState(defaultMasked);

  if (!cardNumber) {
    return null;
  }

  // Форматуємо номер карти (4 групи по 4 цифри)
  const formatCardNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Маскуємо номер карти (показуємо тільки останні 4 цифри)
  const maskCardNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length < 4) return number;
    const lastFour = cleaned.slice(-4);
    const masked = '**** **** **** ' + lastFour;
    return masked;
  };

  const displayNumber = isMasked ? maskCardNumber(cardNumber) : formatCardNumber(cardNumber);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(cardNumber.replace(/\D/g, ''));
      toast({
        title: "Скопійовано!",
        description: "Номер карти скопійовано в буфер обміну",
      });
    } catch (error) {
      toast({
        title: "Помилка копіювання",
        description: "Не вдалося скопіювати номер карти",
        variant: "destructive",
      });
    }
  };

  const toggleMask = () => {
    setIsMasked(!isMasked);
  };

  return (
    <div className={cn("flex items-center gap-2 p-2 bg-muted/50 rounded-lg border", className)}>
      <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm">{displayNumber}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMask}
            className="h-6 w-6 p-0"
            title={isMasked ? "Показати повний номер" : "Приховати номер"}
          >
            {isMasked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
        </div>
        
        {showName && cardHolderName && (
          <div className="text-xs text-muted-foreground mt-1">
            {cardHolderName}
          </div>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className="h-8 w-8 p-0 flex-shrink-0"
        title="Копіювати номер карти"
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
};