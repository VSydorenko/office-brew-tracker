-- Створюємо функцію для автоматичного розрахунку відсотків при оновленні purchase_distributions
CREATE OR REPLACE FUNCTION public.calculate_purchase_distribution_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    purchase_total_shares integer;
BEGIN
    -- Отримуємо загальну кількість часток для покупки
    SELECT COALESCE(SUM(shares), 0) INTO purchase_total_shares
    FROM public.purchase_distributions 
    WHERE purchase_id = NEW.purchase_id;
    
    -- Розраховуємо відсоток на основі часток
    IF purchase_total_shares > 0 THEN
        NEW.percentage = (NEW.shares::numeric / purchase_total_shares::numeric) * 100;
    ELSE
        NEW.percentage = 0;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Створюємо тригер для автоматичного розрахунку відсотків в purchase_distributions
CREATE TRIGGER calculate_purchase_distribution_percentage_trigger
    BEFORE INSERT OR UPDATE ON public.purchase_distributions
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_purchase_distribution_percentage();

-- Оновлюємо існуючі записи purchase_distributions зі значеннями shares за замовчуванням
UPDATE public.purchase_distributions 
SET shares = ROUND(percentage)::integer 
WHERE shares IS NULL;