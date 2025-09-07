-- Додаємо колонки для номера карти та імені власника в таблицю profiles
ALTER TABLE public.profiles 
ADD COLUMN card_number TEXT,
ADD COLUMN card_holder_name TEXT;