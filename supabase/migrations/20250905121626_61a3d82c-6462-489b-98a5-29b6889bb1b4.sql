-- Додаємо поле shares до distribution_template_users
ALTER TABLE public.distribution_template_users 
ADD COLUMN shares integer;

-- Додаємо поле total_shares до distribution_templates
ALTER TABLE public.distribution_templates 
ADD COLUMN total_shares integer;

-- Мігруємо існуючі дані: конвертуємо відсотки в частки
-- Для спрощення, беремо відсоток як частку (24% = 24 частки)
UPDATE public.distribution_template_users 
SET shares = ROUND(percentage)::integer 
WHERE shares IS NULL;

-- Розраховуємо та встановлюємо total_shares для кожного шаблону
UPDATE public.distribution_templates 
SET total_shares = (
    SELECT SUM(shares) 
    FROM public.distribution_template_users 
    WHERE template_id = distribution_templates.id
)
WHERE total_shares IS NULL;

-- Додаємо поле shares до purchase_distributions для розподілу покупок
ALTER TABLE public.purchase_distributions 
ADD COLUMN shares integer;

-- Мігруємо існуючі дані в purchase_distributions
UPDATE public.purchase_distributions 
SET shares = ROUND(percentage)::integer 
WHERE shares IS NULL;

-- Створюємо функцію для автоматичного розрахунку відсотків на основі часток
CREATE OR REPLACE FUNCTION public.calculate_percentage_from_shares()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    template_total_shares integer;
BEGIN
    -- Отримуємо загальну кількість часток для шаблону
    SELECT COALESCE(SUM(shares), 0) INTO template_total_shares
    FROM public.distribution_template_users 
    WHERE template_id = NEW.template_id;
    
    -- Розраховуємо відсоток на основі часток
    IF template_total_shares > 0 THEN
        NEW.percentage = (NEW.shares::numeric / template_total_shares::numeric) * 100;
    ELSE
        NEW.percentage = 0;
    END IF;
    
    -- Оновлюємо total_shares в шаблоні
    UPDATE public.distribution_templates 
    SET total_shares = template_total_shares
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$;

-- Створюємо тригер для автоматичного розрахунку відсотків
CREATE TRIGGER calculate_percentage_from_shares_trigger
    BEFORE INSERT OR UPDATE ON public.distribution_template_users
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_percentage_from_shares();

-- Оновлюємо валідаційну функцію для роботи з частками
CREATE OR REPLACE FUNCTION public.validate_template_shares()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Перевіряємо що частки більше 0
    IF NEW.shares IS NOT NULL AND NEW.shares <= 0 THEN
        RAISE EXCEPTION 'Кількість часток має бути більше 0';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Створюємо тригер для валідації часток
CREATE TRIGGER validate_template_shares_trigger
    BEFORE INSERT OR UPDATE ON public.distribution_template_users
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_template_shares();