-- Зробити percentage nullable і прибрати CHECK constraints
ALTER TABLE public.distribution_template_users 
ALTER COLUMN percentage DROP NOT NULL;

ALTER TABLE public.purchase_distributions 
ALTER COLUMN percentage DROP NOT NULL;

-- Видалити CHECK constraints на percentage (якщо існують)
DO $$ 
BEGIN
    -- Пробуємо видалити constraint, якщо він існує
    BEGIN
        ALTER TABLE public.distribution_template_users 
        DROP CONSTRAINT IF EXISTS distribution_template_users_percentage_check;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ігноруємо помилки якщо constraint не існує
    END;
    
    BEGIN
        ALTER TABLE public.purchase_distributions 
        DROP CONSTRAINT IF EXISTS purchase_distributions_percentage_check;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- Встановити всі існуючі percentage в NULL
UPDATE public.distribution_template_users SET percentage = NULL;
UPDATE public.purchase_distributions SET percentage = NULL;

-- Прибрати тригери які розраховують percentage
DROP TRIGGER IF EXISTS calculate_percentage_trigger ON public.distribution_template_users;
DROP TRIGGER IF EXISTS calculate_purchase_distribution_percentage_trigger ON public.purchase_distributions;

-- Прибрати функції валідації відсотків
DROP FUNCTION IF EXISTS public.validate_template_percentages();

-- Оновити функцію calculate_percentage_from_shares - тепер вона тільки оновлює total_shares
CREATE OR REPLACE FUNCTION public.calculate_percentage_from_shares()
RETURNS TRIGGER AS $$
DECLARE
    template_total_shares integer;
BEGIN
    -- Отримуємо загальну кількість часток для шаблону
    SELECT COALESCE(SUM(shares), 0) INTO template_total_shares
    FROM public.distribution_template_users 
    WHERE template_id = NEW.template_id;
    
    -- Оновлюємо total_shares в шаблоні
    UPDATE public.distribution_templates 
    SET total_shares = template_total_shares
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Створити тригер тільки для оновлення total_shares
CREATE TRIGGER update_template_total_shares
BEFORE INSERT OR UPDATE OR DELETE ON public.distribution_template_users
FOR EACH ROW
EXECUTE FUNCTION public.calculate_percentage_from_shares();