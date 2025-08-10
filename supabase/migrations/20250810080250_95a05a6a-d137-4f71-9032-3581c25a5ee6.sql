
-- 1) Додаємо колонку для зовнішніх URL аватарів (Google та ін.)
alter table public.profiles
  add column if not exists avatar_url text;

-- 1.1) Одноразово заповнюємо avatar_url з метаданих користувача у auth.users
update public.profiles p
set avatar_url = coalesce(
  u.raw_user_meta_data->>'avatar_url',
  u.user_metadata->>'avatar_url',
  u.raw_user_meta_data->>'picture',
  u.user_metadata->>'picture'
)
from auth.users u
where p.id = u.id
  and (p.avatar_url is null or p.avatar_url = '');

-- 1.2) Опційно: індекс для швидкого пошуку по name (щоб підтримати LIKE/ILIKE)
create extension if not exists pg_trgm;
create index if not exists profiles_name_trgm_idx
  on public.profiles using gin (name gin_trgm_ops);

-- 2) Оновлюємо RPC, щоб повертати avatar_url разом з avatar_path
create or replace function public.get_profiles_for_picker(
  search   text default null,
  limit_n  integer default 30,
  offset_n integer default 0
)
returns table (
  id uuid,
  name text,
  avatar_path text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar_path, p.avatar_url
  from public.profiles p
  where (search is null or p.name ilike '%' || search || '%')
  order by p.name asc
  limit limit_n offset offset_n
$$;
