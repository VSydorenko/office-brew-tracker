-- Створюємо RPC функцію для отримання шаблону з останньої покупки користувача
CREATE OR REPLACE FUNCTION public.get_last_purchase_template_by_buyer(buyer_user_id uuid)
 RETURNS TABLE(template_id uuid, template_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH last_purchase AS (
    SELECT p.id
    FROM public.purchases p
    WHERE p.buyer_id = buyer_user_id
    ORDER BY p.date DESC, p.created_at DESC
    LIMIT 1
  ),
  template_from_distributions AS (
    SELECT DISTINCT dt.id as template_id, dt.name as template_name
    FROM public.purchase_distributions pd
    JOIN public.distribution_templates dt ON dt.id = (
      SELECT dtu.template_id 
      FROM public.distribution_template_users dtu
      WHERE dtu.user_id = pd.user_id 
        AND EXISTS (
          SELECT 1 FROM public.distribution_templates dt2 
          WHERE dt2.id = dtu.template_id 
            AND dt2.effective_from <= (SELECT date FROM public.purchases WHERE id = pd.purchase_id)
            AND dt2.is_active = true
        )
      ORDER BY (
        SELECT dt3.effective_from 
        FROM public.distribution_templates dt3 
        WHERE dt3.id = dtu.template_id
      ) DESC
      LIMIT 1
    )
    WHERE pd.purchase_id = (SELECT id FROM last_purchase)
    LIMIT 1
  )
  SELECT tfd.template_id, tfd.template_name 
  FROM template_from_distributions tfd;
$function$