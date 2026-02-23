
CREATE OR REPLACE FUNCTION public.get_coffee_purchase_stats()
RETURNS TABLE(coffee_type_id uuid, last_price numeric, last_purchase_date date)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (pi.coffee_type_id)
    pi.coffee_type_id,
    pi.unit_price as last_price,
    p.date as last_purchase_date
  FROM purchase_items pi
  JOIN purchases p ON pi.purchase_id = p.id
  WHERE pi.unit_price IS NOT NULL
  ORDER BY pi.coffee_type_id, p.date DESC, p.created_at DESC;
$$;
