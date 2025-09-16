-- Оновлюємо RPC функцію для сортування по updated_at
CREATE OR REPLACE FUNCTION public.get_last_purchase_template_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.template_id
  FROM public.purchases p
  WHERE p.template_id IS NOT NULL
  ORDER BY p.date DESC, p.updated_at DESC
  LIMIT 1;
$function$;

-- Оновлюємо також версію з параметром користувача
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
  ORDER BY p.date DESC, p.updated_at DESC
  LIMIT 1;
$function$;