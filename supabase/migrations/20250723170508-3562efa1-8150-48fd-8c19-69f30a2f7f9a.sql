-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coffee types catalog
CREATE TABLE public.coffee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  package_size TEXT, -- e.g., "1kg", "500g"
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create purchases table
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  driver_id UUID REFERENCES public.profiles(id), -- who drove to buy coffee
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create purchase items (specific coffee packages in purchase)
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  coffee_type_id UUID NOT NULL REFERENCES public.coffee_types(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2), -- optional price per package
  total_price DECIMAL(10,2), -- calculated or manual
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create consumption rules (how coffee consumption is distributed)
CREATE TABLE public.consumption_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  effective_from DATE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Q1 2024 Distribution"
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create consumption rule users (percentage distribution)
CREATE TABLE public.consumption_rule_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.consumption_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(rule_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_rule_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can view coffee types" ON public.coffee_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage coffee types" ON public.coffee_types
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view purchases" ON public.purchases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create purchases" ON public.purchases
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchases" ON public.purchases
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view purchase items" ON public.purchase_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage purchase items" ON public.purchase_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view consumption rules" ON public.consumption_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage consumption rules" ON public.consumption_rules
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view consumption rule users" ON public.consumption_rule_users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage consumption rule users" ON public.consumption_rule_users
  FOR ALL TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_purchases_date ON public.purchases(date);
CREATE INDEX idx_purchases_buyer ON public.purchases(buyer_id);
CREATE INDEX idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_coffee_type ON public.purchase_items(coffee_type_id);
CREATE INDEX idx_consumption_rules_effective ON public.consumption_rules(effective_from);
CREATE INDEX idx_consumption_rule_users_rule ON public.consumption_rule_users(rule_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coffee_types_updated_at
  BEFORE UPDATE ON public.coffee_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consumption_rules_updated_at
  BEFORE UPDATE ON public.consumption_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();