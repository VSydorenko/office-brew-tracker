-- Створюємо функцію для ініціалізації першого адміна без перевірки тригера
CREATE OR REPLACE FUNCTION public.initialize_first_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Оновлюємо профіль Володимира напряму, оминаючи тригер
  UPDATE public.profiles 
  SET 
    status = 'approved',
    role = 'admin',
    approved_by = id,
    approved_at = now(),
    updated_at = now()
  WHERE name = 'Володимир';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Користувача з ім''ям "Володимир" не знайдено';
  ELSE
    RAISE NOTICE 'Користувача Володимир успішно призначено адміністратором';
  END IF;
END;
$$;

-- Виконуємо функцію
SELECT public.initialize_first_admin();

-- Видаляємо тимчасову функцію
DROP FUNCTION public.initialize_first_admin();