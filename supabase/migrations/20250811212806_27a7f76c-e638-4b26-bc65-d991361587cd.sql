-- Відновлюємо тригер безпеки для таблиці profiles
CREATE TRIGGER profiles_guard_non_admin_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_non_admin();

-- Перевіряємо чи тригер створений
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' AND trigger_schema = 'public';