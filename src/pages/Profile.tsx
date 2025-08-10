
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/ui/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { AvatarUploader } from '@/components/ui/avatar-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_path?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_path, avatar_url, created_at, updated_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: "Не вдалося завантажити профіль"
        });
        return;
      }

      // Додаємо email з auth сесії
      const profileWithEmail = {
        ...data!,
        email: user.email || ''
      };
      
      setProfile(profileWithEmail as Profile);
      setName(profileWithEmail.name);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive", 
        title: "Помилка",
        description: "Несподівана помилка при завантаженні профілю"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: "Не вдалося оновити профіль"
        });
        return;
      }

      setProfile({ ...profile, name });
      toast({
        title: "Успішно",
        description: "Профіль оновлено"
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Помилка", 
        description: "Несподівана помилка при оновленні профілю"
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Оновлює шлях до аватара в профілі.
   * - Якщо передано новий шлях (avatar_path), очищаємо avatar_url, щоб використовувати локальний storage.
   * - Якщо видаляємо аватар (null), залишаємо avatar_url недоторканим, щоб повернутися до Google-аватара.
   * @param newAvatarPath - Новий шлях у storage або null для видалення
   */
  const handleAvatarUpdate = async (newAvatarPath: string | null) => {
    if (!user || !profile) return;
    
    try {
      const updatePayload = newAvatarPath !== null
        ? { avatar_path: newAvatarPath, avatar_url: null }
        : { avatar_path: null };

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating avatar:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: "Не вдалося оновити аватар"
        });
        return;
      }

      setProfile({
        ...profile,
        ...(newAvatarPath !== null
          ? { avatar_path: newAvatarPath, avatar_url: null }
          : { avatar_path: null })
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Несподівана помилка при оновленні аватара"
      });
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Профіль не знайдено</h1>
          <p className="text-muted-foreground">Не вдалося завантажити дані профілю</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Мій профіль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
              <AvatarUploader
                userId={user.id}
                currentAvatarPath={profile.avatar_path}
                currentAvatarUrl={profile.avatar_url}
                fallbackText={getInitials(profile.name)}
                onAvatarUpdate={handleAvatarUpdate}
              />
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ім'я</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введіть ваше ім'я"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email неможливо змінити
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving || name === profile.name}
                >
                  {saving ? 'Збереження...' : 'Зберегти'}
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Інформація про акаунт</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Зареєстрований</p>
                  <p>{format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: uk })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Оновлений</p>
                  <p>{format(new Date(profile.updated_at), 'dd MMMM yyyy', { locale: uk })}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
