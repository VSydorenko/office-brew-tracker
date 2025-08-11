-- Оновлюємо тригер безпеки, щоб дозволити системні оновлення
CREATE OR REPLACE FUNCTION public.profiles_guard_non_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Дозволяємо оновлення, якщо auth.uid() = NULL (системні операції)
  -- або якщо користувач є адміністратором
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  
  -- Перевіряємо чи користувач намагається змінити службові поля
  IF (OLD.status IS DISTINCT FROM NEW.status)
     OR (OLD.role IS DISTINCT FROM NEW.role)
     OR (OLD.approved_by IS DISTINCT FROM NEW.approved_by)
     OR (OLD.approved_at IS DISTINCT FROM NEW.approved_at) THEN
    RAISE EXCEPTION 'Недостатньо прав для зміни службових полів профілю';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Тепер призначаємо Володимира адміністратором
UPDATE public.profiles 
SET 
  status = 'approved',
  role = 'admin',
  approved_by = id,
  approved_at = now(),
  updated_at = now()
WHERE name = 'Володимир';