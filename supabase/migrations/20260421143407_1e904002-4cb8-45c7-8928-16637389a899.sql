
-- Каскадне видалення покупки за один виклик
CREATE OR REPLACE FUNCTION public.delete_purchase_cascade(p_purchase_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.purchase_distributions WHERE purchase_id = p_purchase_id;
  DELETE FROM public.purchase_items WHERE purchase_id = p_purchase_id;
  DELETE FROM public.purchase_amount_changes WHERE purchase_id = p_purchase_id;
  DELETE FROM public.purchases WHERE id = p_purchase_id;
END;
$$;

-- Пакетна перевірка: які з переданих id не можна видалити (мають оплачені розподіли)
CREATE OR REPLACE FUNCTION public.get_undeletable_purchase_ids(p_ids uuid[])
RETURNS TABLE(purchase_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT pd.purchase_id
  FROM public.purchase_distributions pd
  WHERE pd.purchase_id = ANY(p_ids)
    AND pd.is_paid = true;
$$;
