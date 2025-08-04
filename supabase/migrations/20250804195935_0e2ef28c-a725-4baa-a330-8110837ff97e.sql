-- Виправлення попереджень безпеки: додавання SECURITY DEFINER та SET search_path

-- Оновлюємо функцію для автоматичного оновлення статусу покупки
CREATE OR REPLACE FUNCTION public.update_purchase_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_paid numeric;
  purchase_total numeric;
BEGIN
  -- Отримуємо загальну суму покупки та суму оплачених розподілів
  SELECT p.total_amount INTO purchase_total
  FROM public.purchases p 
  WHERE p.id = NEW.purchase_id;
  
  SELECT COALESCE(SUM(COALESCE(pd.adjusted_amount, pd.calculated_amount)), 0) INTO total_paid
  FROM public.purchase_distributions pd
  WHERE pd.purchase_id = NEW.purchase_id AND pd.is_paid = true;
  
  -- Якщо всі розподіли оплачені, переводимо покупку в статус locked
  IF total_paid >= purchase_total THEN
    UPDATE public.purchases 
    SET distribution_status = 'locked',
        locked_at = now(),
        locked_by = NEW.user_id
    WHERE id = NEW.purchase_id AND distribution_status != 'locked';
  ELSIF total_paid > 0 THEN
    -- Якщо є часткові оплати, переводимо в active
    UPDATE public.purchases 
    SET distribution_status = 'active'
    WHERE id = NEW.purchase_id AND distribution_status = 'draft';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Оновлюємо функцію для валідації змін заблокованих покупок
CREATE OR REPLACE FUNCTION public.validate_locked_purchase_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Перевіряємо, чи покупка заблокована
  IF EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE id = NEW.purchase_id AND distribution_status = 'locked'
  ) THEN
    -- Дозволяємо тільки зміни adjusted_amount та is_paid
    IF OLD.percentage IS DISTINCT FROM NEW.percentage OR
       OLD.calculated_amount IS DISTINCT FROM NEW.calculated_amount OR
       OLD.user_id IS DISTINCT FROM NEW.user_id THEN
      RAISE EXCEPTION 'Неможливо змінити розподіл для заблокованої покупки';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Оновлюємо функцію для логування змін суми покупки
CREATE OR REPLACE FUNCTION public.log_purchase_amount_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Логуємо зміну суми, якщо вона відбулася
  IF OLD.total_amount IS DISTINCT FROM NEW.total_amount THEN
    INSERT INTO public.purchase_amount_changes (
      purchase_id, old_amount, new_amount, change_reason, changed_by
    ) VALUES (
      NEW.id, OLD.total_amount, NEW.total_amount, 
      'Manual amount adjustment', auth.uid()
    );
    
    -- Якщо покупка була заблокована, переводимо в amount_changed
    IF OLD.distribution_status = 'locked' THEN
      NEW.distribution_status = 'amount_changed';
      NEW.original_total_amount = OLD.total_amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;