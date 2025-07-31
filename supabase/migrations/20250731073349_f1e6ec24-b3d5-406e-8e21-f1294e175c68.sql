-- Створення таблиці шаблонів розподілу
CREATE TABLE public.distribution_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  effective_from DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Створення таблиці користувачів в шаблонах розподілу
CREATE TABLE public.distribution_template_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.distribution_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, user_id)
);

-- Створення таблиці розподілу покупок
CREATE TABLE public.purchase_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  calculated_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  adjusted_amount NUMERIC(10,2),
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(purchase_id, user_id)
);

-- Включення Row Level Security
ALTER TABLE public.distribution_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_template_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_distributions ENABLE ROW LEVEL SECURITY;

-- RLS політики для distribution_templates
CREATE POLICY "Authenticated users can view distribution templates" 
ON public.distribution_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage distribution templates" 
ON public.distribution_templates 
FOR ALL 
USING (true);

-- RLS політики для distribution_template_users
CREATE POLICY "Authenticated users can view distribution template users" 
ON public.distribution_template_users 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage distribution template users" 
ON public.distribution_template_users 
FOR ALL 
USING (true);

-- RLS політики для purchase_distributions
CREATE POLICY "Authenticated users can view purchase distributions" 
ON public.purchase_distributions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage purchase distributions" 
ON public.purchase_distributions 
FOR ALL 
USING (true);

-- Тригер для оновлення updated_at
CREATE TRIGGER update_distribution_templates_updated_at
BEFORE UPDATE ON public.distribution_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_distributions_updated_at
BEFORE UPDATE ON public.purchase_distributions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Функція для перевірки що сума відсотків в шаблоні = 100%
CREATE OR REPLACE FUNCTION public.validate_template_percentages()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COALESCE(SUM(percentage), 0) FROM public.distribution_template_users WHERE template_id = NEW.template_id) > 100 THEN
    RAISE EXCEPTION 'Сума відсотків в шаблоні не може перевищувати 100%%';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер для валідації відсотків
CREATE TRIGGER validate_template_percentages_trigger
AFTER INSERT OR UPDATE ON public.distribution_template_users
FOR EACH ROW
EXECUTE FUNCTION public.validate_template_percentages();