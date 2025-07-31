-- Оновлення функції з правильним search_path
CREATE OR REPLACE FUNCTION public.validate_template_percentages()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COALESCE(SUM(percentage), 0) FROM public.distribution_template_users WHERE template_id = NEW.template_id) > 100 THEN
    RAISE EXCEPTION 'Сума відсотків в шаблоні не може перевищувати 100%%';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';