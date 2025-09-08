-- Видаляємо конфліктуючу політику SELECT для профілів
-- Залишаємо тільки політику для підтверджених користувачів, щоб вони бачили всі номери карток
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;