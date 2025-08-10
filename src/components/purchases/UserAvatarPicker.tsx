
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { getAvatarUrl } from '@/utils/avatar';
import { useDebounce } from '@/hooks/use-debounce';

interface Profile {
  id: string;
  name: string;
  avatar_path?: string;
  avatar_url?: string;
}

interface UserAvatarPickerProps {
  selectedUserId?: string;
  onUserSelect: (userId: string) => void;
  label?: string;
  compact?: boolean;
  searchable?: boolean;
  pageSize?: number;
}

/**
 * Компонент для швидкого вибору користувача через аватари
 */
export const UserAvatarPicker = ({ 
  selectedUserId, 
  onUserSelect, 
  label = "Швидкий вибір",
  compact = false,
  searchable = true,
  pageSize = 30,
}: UserAvatarPickerProps) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['profiles-picker', debouncedSearch, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .rpc('get_profiles_for_picker' as any, {
          search: debouncedSearch && debouncedSearch.trim() !== '' ? debouncedSearch : null,
          limit_n: pageSize,
          offset_n: pageParam,
        });
      if (error) throw error;
      return (data as unknown as Profile[]) ?? [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum: number, p: Profile[]) => sum + p.length, 0);
      return lastPage.length === pageSize ? loaded : undefined;
    },
    staleTime: 60 * 1000,
  });

  const profiles = useMemo(() => (data?.pages ? (data.pages as Profile[][]).flat() : []), [data]);

  // Підтримка Realtime та авто-підвантаження
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    /**
     * Підписка на Realtime оновлення таблиці profiles
     * Інвалідовуємо кеш запиту при будь-яких змінах (INSERT/UPDATE/DELETE)
     */
    const channel = supabase
      .channel('profiles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['profiles-picker'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    /**
     * Автозавантаження наступної сторінки при наближенні до кінця списку
     */
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * Генерує ініціали з імені користувача
   * @param name - Ім'я користувача
   * @returns Два перші символи ініціалів у верхньому регістрі
   */
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
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

      {searchable && (
        <div className="mb-2">
          <Input
            placeholder="Пошук за ім'ям"
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);
            }}
            aria-label="Пошук користувачів"
          />
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">Не вдалося завантажити користувачів.</p>
      )}

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
                  src={getAvatarUrl(profile.avatar_path) || profile.avatar_url || undefined} 
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
                src={getAvatarUrl(profile.avatar_path) || profile.avatar_url || undefined} 
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

      {profiles.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">Нічого не знайдено.</p>
      )}

      {hasNextPage && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-sm underline text-primary disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Завантаження...' : 'Показати ще'}
          </button>
        </div>
      )}

      <div ref={loadMoreRef} aria-hidden="true" className="h-px" />

    </div>
  );
};
