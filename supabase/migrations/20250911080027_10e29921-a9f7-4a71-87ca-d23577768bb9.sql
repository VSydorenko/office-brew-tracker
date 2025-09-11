-- Оновити функцію get_last_purchase_template_id для пошуку шаблону в останній покупці (незалежно від покупця)
CREATE OR REPLACE FUNCTION public.get_last_purchase_template_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.template_id
  FROM public.purchases p
  WHERE p.template_id IS NOT NULL
  ORDER BY p.date DESC, p.created_at DESC
  LIMIT 1;
$function$;