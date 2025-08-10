-- 1) Додаємо стовпець avatar_url до public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2) Бекфіл з auth.users.raw_user_meta_data->>'picture'
UPDATE public.profiles p
SET avatar_url = au.raw_user_meta_data ->> 'picture'
FROM auth.users au
WHERE au.id = p.id
  AND p.avatar_url IS NULL
  AND (au.raw_user_meta_data ->> 'picture') IS NOT NULL
  AND (au.raw_user_meta_data ->> 'picture') <> '';

-- 3) Оновлюємо функцію handle_new_user, щоб одразу зберігати avatar_url
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'picture', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4) Оновлюємо RPC, щоб повертала також avatar_url
CREATE OR REPLACE FUNCTION public.get_profiles_for_picker(
  search text DEFAULT NULL,
  limit_n integer DEFAULT 50,
  offset_n integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  name text,
  avatar_path text,
  avatar_url text
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, p.avatar_path, p.avatar_url
  FROM public.profiles p
  WHERE (search IS NULL OR search = '' OR lower(p.name) LIKE lower(search) || '%')
  ORDER BY p.name
  LIMIT limit_n
  OFFSET offset_n;
$function$;