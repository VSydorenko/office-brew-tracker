-- Розширення схеми для управління розподілом покупок

-- Додаємо поля до таблиці purchases
ALTER TABLE public.purchases 
ADD COLUMN distribution_status text DEFAULT 'draft' CHECK (distribution_status IN ('draft', 'active', 'locked', 'amount_changed')),
ADD COLUMN locked_at timestamp with time zone,
ADD COLUMN locked_by uuid,
ADD COLUMN original_total_amount numeric;

-- Додаємо поле версії до purchase_distributions
ALTER TABLE public.purchase_distributions
ADD COLUMN version integer DEFAULT 1,
ADD COLUMN previous_amount numeric,
ADD COLUMN adjustment_type text CHECK (adjustment_type IN ('charge', 'refund', 'reallocation'));

-- Створюємо таблицю історії змін сум покупок
CREATE TABLE public.purchase_amount_changes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id uuid NOT NULL,
  old_amount numeric NOT NULL,
  new_amount numeric NOT NULL,
  change_reason text,
  changed_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Включаємо RLS для нової таблиці
ALTER TABLE public.purchase_amount_changes ENABLE ROW LEVEL SECURITY;

-- Політики для purchase_amount_changes
CREATE POLICY "Authenticated users can view purchase amount changes" 
ON public.purchase_amount_changes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create purchase amount changes" 
ON public.purchase_amount_changes 
FOR INSERT 
WITH CHECK (true);

-- Функція для автоматичного оновлення статусу покупки
CREATE OR REPLACE FUNCTION public.update_purchase_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Тригер для автоматичного оновлення статусу
CREATE TRIGGER trigger_update_purchase_status
  AFTER UPDATE OF is_paid ON public.purchase_distributions
  FOR EACH ROW
  WHEN (OLD.is_paid IS DISTINCT FROM NEW.is_paid)
  EXECUTE FUNCTION public.update_purchase_status();

-- Функція для валідації змін заблокованих покупок
CREATE OR REPLACE FUNCTION public.validate_locked_purchase_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Тригер для валідації змін
CREATE TRIGGER trigger_validate_locked_purchase_changes
  BEFORE UPDATE ON public.purchase_distributions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_locked_purchase_changes();

-- Функція для логування змін суми покупки
CREATE OR REPLACE FUNCTION public.log_purchase_amount_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Тригер для логування змін суми
CREATE TRIGGER trigger_log_purchase_amount_change
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.log_purchase_amount_change();