-- Спочатку тимчасово відключити всі тригери на distribution_template_users і purchase_distributions
DROP TRIGGER IF EXISTS validate_template_percentages_trigger ON public.distribution_template_users;
DROP TRIGGER IF EXISTS calculate_percentage_trigger ON public.distribution_template_users;
DROP TRIGGER IF EXISTS validate_locked_purchase_changes_trigger ON public.purchase_distributions;
DROP TRIGGER IF EXISTS calculate_purchase_distribution_percentage_trigger ON public.purchase_distributions;

-- Видалити функції валідації відсотків
DROP FUNCTION IF EXISTS public.validate_template_percentages() CASCADE;

-- Зробити percentage nullable (БЕЗ масового UPDATE)
ALTER TABLE public.distribution_template_users 
ALTER COLUMN percentage DROP NOT NULL;

ALTER TABLE public.purchase_distributions 
ALTER COLUMN percentage DROP NOT NULL;

-- Видалити CHECK constraints на percentage
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.distribution_template_users 
        DROP CONSTRAINT IF EXISTS distribution_template_users_percentage_check;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE public.purchase_distributions 
        DROP CONSTRAINT IF EXISTS purchase_distributions_percentage_check;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- Оновити функцію для роботи тільки з shares
CREATE OR REPLACE FUNCTION public.calculate_percentage_from_shares()
RETURNS TRIGGER AS $$
DECLARE
    template_total_shares integer;
BEGIN
    -- Якщо це DELETE operation, використовуємо OLD
    IF TG_OP = 'DELETE' THEN
        SELECT COALESCE(SUM(shares), 0) INTO template_total_shares
        FROM public.distribution_template_users 
        WHERE template_id = OLD.template_id;
        
        UPDATE public.distribution_templates 
        SET total_shares = template_total_shares
        WHERE id = OLD.template_id;
        
        RETURN OLD;
    END IF;
    
    -- Для INSERT та UPDATE використовуємо NEW
    SELECT COALESCE(SUM(shares), 0) INTO template_total_shares
    FROM public.distribution_template_users 
    WHERE template_id = NEW.template_id;
    
    UPDATE public.distribution_templates 
    SET total_shares = template_total_shares
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Створити тригер тільки для оновлення total_shares
CREATE TRIGGER update_template_total_shares
AFTER INSERT OR UPDATE OR DELETE ON public.distribution_template_users
FOR EACH ROW
EXECUTE FUNCTION public.calculate_percentage_from_shares();

-- Відновити тригер валідації заблокованих покупок без перевірки percentage
CREATE OR REPLACE FUNCTION public.validate_locked_purchase_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Перевіряємо, чи покупка заблокована
  IF EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE id = NEW.purchase_id AND distribution_status = 'locked'
  ) THEN
    -- Дозволяємо тільки зміни adjusted_amount та is_paid
    IF OLD.calculated_amount IS DISTINCT FROM NEW.calculated_amount OR
       OLD.user_id IS DISTINCT FROM NEW.user_id OR
       OLD.shares IS DISTINCT FROM NEW.shares THEN
      RAISE EXCEPTION 'Неможливо змінити розподіл для заблокованої покупки';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE TRIGGER validate_locked_purchase_changes_trigger
BEFORE UPDATE ON public.purchase_distributions
FOR EACH ROW
EXECUTE FUNCTION public.validate_locked_purchase_changes();