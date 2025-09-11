-- Додати поле template_id до таблиці purchases
ALTER TABLE public.purchases 
ADD COLUMN template_id UUID REFERENCES public.distribution_templates(id);

-- Створити функцію для заповнення історичних даних
CREATE OR REPLACE FUNCTION public.backfill_purchase_templates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    purchase_record RECORD;
    template_record RECORD;
    purchase_users JSONB;
    template_users JSONB;
    match_found BOOLEAN;
BEGIN
    -- Проходимо по всіх покупках без template_id
    FOR purchase_record IN 
        SELECT p.id, p.date
        FROM public.purchases p
        WHERE p.template_id IS NULL
    LOOP
        -- Отримуємо розподіл покупки як JSON
        SELECT jsonb_agg(
            jsonb_build_object(
                'user_id', pd.user_id,
                'percentage', pd.percentage
            ) ORDER BY pd.user_id
        ) INTO purchase_users
        FROM public.purchase_distributions pd
        WHERE pd.purchase_id = purchase_record.id;
        
        -- Якщо немає розподілу, пропускаємо
        IF purchase_users IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Шукаємо відповідний шаблон
        FOR template_record IN
            SELECT dt.id
            FROM public.distribution_templates dt
            WHERE dt.is_active = true 
              AND dt.effective_from <= purchase_record.date
            ORDER BY dt.effective_from DESC
        LOOP
            -- Отримуємо користувачів шаблону як JSON
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', dtu.user_id,
                    'percentage', dtu.percentage
                ) ORDER BY dtu.user_id
            ) INTO template_users
            FROM public.distribution_template_users dtu
            WHERE dtu.template_id = template_record.id;
            
            -- Перевіряємо точний збіг
            IF purchase_users = template_users THEN
                -- Знайшли точний збіг, оновлюємо покупку
                UPDATE public.purchases 
                SET template_id = template_record.id
                WHERE id = purchase_record.id;
                
                match_found := true;
                EXIT; -- Виходимо з циклу шаблонів
            END IF;
        END LOOP;
        
        -- Якщо знайшли збіг, переходимо до наступної покупки
        IF match_found THEN
            match_found := false;
        END IF;
    END LOOP;
END;
$function$;

-- Видалити стару функцію
DROP FUNCTION IF EXISTS public.get_last_purchase_template_by_buyer(uuid);

-- Створити нову спрощену функцію для отримання template_id з останньої покупки
CREATE OR REPLACE FUNCTION public.get_last_purchase_template_id(buyer_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.template_id
  FROM public.purchases p
  WHERE p.buyer_id = buyer_user_id
    AND p.template_id IS NOT NULL
  ORDER BY p.date DESC, p.created_at DESC
  LIMIT 1;
$function$;