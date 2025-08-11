-- Тимчасово відключаємо тригер для створення першого адміна
DROP TRIGGER IF EXISTS profiles_guard_non_admin_trigger ON public.profiles;

-- Призначення Володимира першим адміном
UPDATE public.profiles 
SET 
  status = 'approved',
  role = 'admin',
  approved_by = id,  -- Самопідтвердження
  approved_at = now(),
  updated_at = now()
WHERE name = 'Володимир';

-- Відновлюємо тригер безпеки
CREATE TRIGGER profiles_guard_non_admin_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_non_admin();