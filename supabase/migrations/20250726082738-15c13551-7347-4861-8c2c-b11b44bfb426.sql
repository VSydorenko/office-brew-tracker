-- Create lookup tables for coffee catalog
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.flavors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.processing_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.coffee_varieties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on lookup tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_varieties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lookup tables (read-only for authenticated users)
CREATE POLICY "Authenticated users can view brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage brands" ON public.brands FOR ALL USING (true);

CREATE POLICY "Authenticated users can view flavors" ON public.flavors FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage flavors" ON public.flavors FOR ALL USING (true);

CREATE POLICY "Authenticated users can view processing methods" ON public.processing_methods FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage processing methods" ON public.processing_methods FOR ALL USING (true);

CREATE POLICY "Authenticated users can view coffee varieties" ON public.coffee_varieties FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage coffee varieties" ON public.coffee_varieties FOR ALL USING (true);

-- Insert initial data for lookup tables
INSERT INTO public.brands (name) VALUES
  ('Lavazza'),
  ('3ChampsRoastery'),
  ('Jacobs'),
  ('Nescafe'),
  ('Tchibo'),
  ('Starbucks'),
  ('Coffee House'),
  ('Kimbo'),
  ('Paulig'),
  ('Coffee Life');

INSERT INTO public.flavors (name) VALUES
  ('яблуко'),
  ('лічі'),
  ('виноград'),
  ('шоколад'),
  ('горіхи'),
  ('карамель'),
  ('цитруси'),
  ('ваніль'),
  ('мед'),
  ('ягоди'),
  ('квіткові нотки'),
  ('спеції'),
  ('тютюн'),
  ('земляні тони');

INSERT INTO public.processing_methods (name) VALUES
  ('мокра обробка'),
  ('суха обробка'),
  ('медова обробка'),
  ('анаеробна ферментація'),
  ('карбонік мацерація'),
  ('натуральна'),
  ('вошена');

INSERT INTO public.coffee_varieties (name) VALUES
  ('Арабіка'),
  ('Робуста'),
  ('Лібериця'),
  ('Ексцельса'),
  ('Арабіка SL28'),
  ('Арабіка Бурбон'),
  ('Арабіка Типіка'),
  ('Арабіка Катурра'),
  ('Арабіка Гейша');

-- Add new columns to coffee_types
ALTER TABLE public.coffee_types 
ADD COLUMN brand_id UUID REFERENCES public.brands(id),
ADD COLUMN processing_method_id UUID REFERENCES public.processing_methods(id),
ADD COLUMN variety_id UUID REFERENCES public.coffee_varieties(id);

-- Create junction table for coffee flavors (many-to-many)
CREATE TABLE public.coffee_flavors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coffee_type_id UUID NOT NULL REFERENCES public.coffee_types(id) ON DELETE CASCADE,
  flavor_id UUID NOT NULL REFERENCES public.flavors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coffee_type_id, flavor_id)
);

-- Enable RLS on coffee_flavors
ALTER TABLE public.coffee_flavors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for coffee_flavors
CREATE POLICY "Authenticated users can view coffee flavors" ON public.coffee_flavors FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage coffee flavors" ON public.coffee_flavors FOR ALL USING (true);