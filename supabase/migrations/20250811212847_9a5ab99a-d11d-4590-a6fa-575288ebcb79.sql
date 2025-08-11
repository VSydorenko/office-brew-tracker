-- Видаляємо дублікат тригера
DROP TRIGGER IF EXISTS trg_profiles_guard_non_admin ON public.profiles;

-- Перевіряємо що лишився тільки один тригер
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' AND trigger_schema = 'public';