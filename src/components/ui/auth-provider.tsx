import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Тип статусу профілю користувача
 */
type ProfileStatus = 'pending' | 'approved' | 'rejected' | 'blocked' | null;

/**
 * Інтерфейс контексту авторизації з розширеною інформацією про профіль
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileStatus: ProfileStatus;
  profileLoading: boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profileStatus: null,
  profileLoading: true,
  isApproved: false,
});

/**
 * Хук для отримання даних авторизації та статусу профілю
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Провайдер авторизації з підтримкою статусу профілю
 * Завантажує сесію та статус профілю одразу для оптимізації UX
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  /**
   * Завантажує статус профілю з бази даних
   */
  const fetchProfileStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        setProfileStatus(data.status as ProfileStatus);
      } else {
        setProfileStatus(null);
      }
    } catch {
      setProfileStatus(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Налаштування слухача змін стану авторизації
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Завантажуємо статус профілю через setTimeout для уникнення deadlock
        if (session?.user) {
          setProfileLoading(true);
          setTimeout(() => {
            fetchProfileStatus(session.user.id);
          }, 0);
        } else {
          setProfileStatus(null);
          setProfileLoading(false);
        }
      }
    );

    // Отримання початкової сесії
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchProfileStatus(session.user.id);
      } else {
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    profileStatus,
    profileLoading,
    isApproved: profileStatus === 'approved',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
