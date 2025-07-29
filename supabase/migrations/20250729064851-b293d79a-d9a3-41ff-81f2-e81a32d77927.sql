-- Створити таблицю для походження кави
CREATE TABLE public.origins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включити Row Level Security
ALTER TABLE public.origins ENABLE ROW LEVEL SECURITY;

-- Створити політики доступу для authenticated користувачів
CREATE POLICY "Authenticated users can view origins" 
ON public.origins 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage origins" 
ON public.origins 
FOR ALL 
USING (true);

-- Додати нову колонку origin_id до таблиці coffee_types
ALTER TABLE public.coffee_types 
ADD COLUMN origin_id UUID REFERENCES public.origins(id);