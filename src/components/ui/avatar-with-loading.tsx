import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, optimizeGoogleAvatarUrl } from '@/utils/avatar';
import { Loader2 } from 'lucide-react';

interface AvatarWithLoadingProps {
  /** Шлях до локального аватара в Supabase Storage */
  avatarPath?: string | null;
  /** URL зовнішнього аватара (наприклад, з Google) */
  avatarUrl?: string | null;
  /** Ім'я користувача для alt атрибута та генерації ініціалів */
  userName: string;
  /** Розмір аватара в пікселях (за замовчуванням 40) */
  size?: number;
  /** Додатковий CSS клас */
  className?: string;
  /** Callback при кліку на аватар */
  onClick?: () => void;
}

/**
 * Компонент аватара з покращеним UX
 * - Показує індикатор завантаження під час завантаження зображення
 * - Автоматично оптимізує Google аватари
 * - Генерує ініціали як fallback
 * - Плавна поява зображення
 */
export const AvatarWithLoading: React.FC<AvatarWithLoadingProps> = ({
  avatarPath,
  avatarUrl,
  userName,
  size = 40,
  className = '',
  onClick
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  /**
   * Генерує ініціали з імені користувача
   */
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarSrc = getAvatarUrl(avatarPath) || optimizeGoogleAvatarUrl(avatarUrl, size) || undefined;
  const shouldShowLoader = imageLoading && avatarSrc && !imageError;

  return (
    <div className="relative">
      <Avatar 
        className={`w-${Math.floor(size/4)} h-${Math.floor(size/4)} ${className}`}
        onClick={onClick}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          cursor: onClick ? 'pointer' : 'default'
        }}
      >
        <AvatarImage 
          src={avatarSrc} 
          alt={userName}
          loading="lazy"
          onLoad={() => {
            setImageLoading(false);
            setImageError(false);
          }}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
          style={{
            transition: 'opacity 0.2s ease-in-out',
            opacity: imageLoading ? '0' : '1'
          }}
        />
        <AvatarFallback 
          className={`${size < 32 ? 'text-xs' : size < 48 ? 'text-sm' : 'text-base'}`}
          style={{
            fontSize: `${Math.max(10, size * 0.3)}px`
          }}
        >
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>
      
      {/* Індикатор завантаження */}
      {shouldShowLoader && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-full"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <Loader2 className="animate-spin" style={{ width: `${size * 0.3}px`, height: `${size * 0.3}px` }} />
        </div>
      )}
    </div>
  );
};