
import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { compressImage, uploadAvatar, removeAvatar, getAvatarUrl } from '@/utils/avatar';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploaderProps {
  userId: string;
  currentAvatarPath?: string | null;
  currentAvatarUrl?: string | null;
  fallbackText: string;
  onAvatarUpdate: (newAvatarPath: string | null) => void;
}

/**
 * Компонент для завантаження та редагування аватара користувача
 * - Якщо існує шлях у storage (avatar_path), використовується він
 * - Інакше використовується зовнішній URL (avatar_url), наприклад з Google
 */
export function AvatarUploader({ 
  userId, 
  currentAvatarPath, 
  currentAvatarUrl,
  fallbackText, 
  onAvatarUpdate 
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Валідація файлу
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Будь ласка, оберіть файл зображення"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        variant: "destructive",
        title: "Помилка", 
        description: "Розмір файлу не повинен перевищувати 5 МБ"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Стискаємо зображення
      const compressedFile = await compressImage(file);
      
      // Видаляємо старий аватар (якщо є)
      if (currentAvatarPath) {
        try {
          await removeAvatar(currentAvatarPath);
        } catch (error) {
          // Не критично, продовжуємо
          console.warn('Failed to remove old avatar:', error);
        }
      }
      
      // Завантажуємо новий
      const newAvatarPath = await uploadAvatar(compressedFile, userId);
      
      onAvatarUpdate(newAvatarPath);
      
      toast({
        title: "Успішно",
        description: "Аватар оновлено"
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        variant: "destructive",
        title: "Помилка",
        description: error instanceof Error ? error.message : "Помилка завантаження аватара"
      });
    } finally {
      setIsUploading(false);
      // Очищаємо input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentAvatarPath) return;
    
    setIsUploading(true);
    
    try {
      await removeAvatar(currentAvatarPath);
      onAvatarUpdate(null);
      
      toast({
        title: "Успішно",
        description: "Аватар видалено"
      });
    } catch (error) {
      console.error('Avatar remove error:', error);
      toast({
        variant: "destructive",
        title: "Помилка",
        description: error instanceof Error ? error.message : "Помилка видалення аватара"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Пріоритет: локальне посилання зі storage -> зовнішній URL -> фолбек
  const avatarUrl = getAvatarUrl(currentAvatarPath || undefined) || currentAvatarUrl || null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <Avatar className="w-24 h-24">
          <AvatarImage 
            src={avatarUrl || undefined} 
            alt="Аватар користувача"
            className="object-cover"
            loading="lazy"
            onError={(e) => {
              console.warn('Помилка завантаження аватара', e);
              e.currentTarget.style.display = 'none';
            }}
          />
          <AvatarFallback className="text-lg">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        {/* Overlay з кнопкою камери */}
        <div 
          className="absolute inset-0 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-6 h-6 text-foreground" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? 'Завантажується...' : 'Змінити аватар'}
        </Button>
        
        {currentAvatarPath && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isUploading}
            onClick={handleRemoveAvatar}
          >
            Видалити
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
