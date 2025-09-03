-- Функція для отримання останньої ціни кави
CREATE OR REPLACE FUNCTION get_latest_coffee_price(coffee_id uuid)
RETURNS numeric AS $$
  SELECT pi.unit_price
  FROM purchase_items pi
  JOIN purchases p ON pi.purchase_id = p.id
  WHERE pi.coffee_type_id = coffee_id
    AND pi.unit_price IS NOT NULL
  ORDER BY p.date DESC, p.created_at DESC
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;