import { useState, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

interface UserAvatarPickerProps {
  /** Обраний користувач ID */
  selectedUserId?: string;
  /** Колбек при виборі користувача */
  onUserSelect: (userId: string) => void;
  /** Лейбл для компонента */
  label?: string;
  /** Чи потрібна компактна версія */
  compact?: boolean;
}

/**
 * Компонент для швидкого вибору користувача через аватари
 */
export const UserAvatarPicker = ({ 
  selectedUserId, 
  onUserSelect, 
  label = "Швидкий вибір",
  compact = false 
}: UserAvatarPickerProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfilesWithAvatars();
  }, []);

  const fetchProfilesWithAvatars = async () => {
    try {
      // Поки що отримуємо тільки профілі без аватарів
      // В майбутньому можна додати avatar_url до таблиці profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name');

      if (profilesError) throw profilesError;

      // Поки використовуємо профілі без аватарів
      setProfiles(profilesData || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-muted animate-pulse`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onUserSelect(profile.id)}
            className={`
              ${compact ? 'h-8 w-8' : 'h-10 w-10'} 
              rounded-full ring-2 transition-all hover:scale-105
              ${selectedUserId === profile.id 
                ? 'ring-primary ring-offset-2 ring-offset-background' 
                : 'ring-transparent hover:ring-muted-foreground/30'
              }
            `}
            title={profile.name}
          >
            <Avatar className={compact ? 'h-8 w-8' : 'h-10 w-10'}>
              <AvatarImage 
                src={profile.avatar_url} 
                alt={profile.name}
              />
              <AvatarFallback className="text-xs font-medium">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          </button>
        ))}
      </div>
    </div>
  );
};