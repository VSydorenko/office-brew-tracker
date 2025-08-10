import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl } from '@/utils/avatar';

interface Profile {
  id: string;
  name: string;
  avatar_path?: string;
}

interface UserAvatarPickerProps {
  selectedUserId?: string;
  onUserSelect: (userId: string) => void;
  label?: string;
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
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_path')
        .order('name');

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-full bg-muted animate-pulse`}
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
        {!compact ? (
          profiles.map((profile) => (
            <div key={profile.id} className="flex flex-col items-center space-y-1">
              <Avatar
                className={`w-12 h-12 border-2 cursor-pointer transition-all ${
                  selectedUserId === profile.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onUserSelect(profile.id)}
              >
                <AvatarImage 
                  src={getAvatarUrl(profile.avatar_path) || undefined} 
                  alt={profile.name}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback при помилці завантаження
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <AvatarFallback className="text-sm">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-center max-w-[60px] truncate">
                {profile.name.split(' ')[0]}
              </span>
            </div>
          ))
        ) : (
          profiles.map((profile) => (
            <Avatar
              key={profile.id}
              className={`w-10 h-10 border-2 cursor-pointer transition-all ${
                selectedUserId === profile.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onUserSelect(profile.id)}
            >
              <AvatarImage 
                src={getAvatarUrl(profile.avatar_path) || undefined} 
                alt={profile.name}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback className="text-xs">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
          ))
        )}
      </div>
    </div>
  );
};