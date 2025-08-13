-- Оновлення RLS політик для прибирання попереджень про публічний доступ
-- Замінюємо "true" на перевірку аутентифікованого та затвердженого користувача

-- Brands table
DROP POLICY IF EXISTS "Authenticated users can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can view brands" ON public.brands;

CREATE POLICY "Approved users can manage brands" 
ON public.brands 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Coffee flavors table
DROP POLICY IF EXISTS "Authenticated users can manage coffee flavors" ON public.coffee_flavors;
DROP POLICY IF EXISTS "Authenticated users can view coffee flavors" ON public.coffee_flavors;

CREATE POLICY "Approved users can manage coffee flavors" 
ON public.coffee_flavors 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Coffee types table
DROP POLICY IF EXISTS "Authenticated users can manage coffee types" ON public.coffee_types;
DROP POLICY IF EXISTS "Authenticated users can view coffee types" ON public.coffee_types;

CREATE POLICY "Approved users can manage coffee types" 
ON public.coffee_types 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Coffee varieties table
DROP POLICY IF EXISTS "Authenticated users can manage coffee varieties" ON public.coffee_varieties;
DROP POLICY IF EXISTS "Authenticated users can view coffee varieties" ON public.coffee_varieties;

CREATE POLICY "Approved users can manage coffee varieties" 
ON public.coffee_varieties 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Consumption rule users table
DROP POLICY IF EXISTS "Authenticated users can manage consumption rule users" ON public.consumption_rule_users;
DROP POLICY IF EXISTS "Authenticated users can view consumption rule users" ON public.consumption_rule_users;

CREATE POLICY "Approved users can manage consumption rule users" 
ON public.consumption_rule_users 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Consumption rules table
DROP POLICY IF EXISTS "Authenticated users can manage consumption rules" ON public.consumption_rules;
DROP POLICY IF EXISTS "Authenticated users can view consumption rules" ON public.consumption_rules;

CREATE POLICY "Approved users can manage consumption rules" 
ON public.consumption_rules 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Distribution template users table
DROP POLICY IF EXISTS "Authenticated users can manage distribution template users" ON public.distribution_template_users;
DROP POLICY IF EXISTS "Authenticated users can view distribution template users" ON public.distribution_template_users;

CREATE POLICY "Approved users can manage distribution template users" 
ON public.distribution_template_users 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Distribution templates table
DROP POLICY IF EXISTS "Authenticated users can manage distribution templates" ON public.distribution_templates;
DROP POLICY IF EXISTS "Authenticated users can view distribution templates" ON public.distribution_templates;

CREATE POLICY "Approved users can manage distribution templates" 
ON public.distribution_templates 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Flavors table
DROP POLICY IF EXISTS "Authenticated users can manage flavors" ON public.flavors;
DROP POLICY IF EXISTS "Authenticated users can view flavors" ON public.flavors;

CREATE POLICY "Approved users can manage flavors" 
ON public.flavors 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Origins table
DROP POLICY IF EXISTS "Authenticated users can manage origins" ON public.origins;
DROP POLICY IF EXISTS "Authenticated users can view origins" ON public.origins;

CREATE POLICY "Approved users can manage origins" 
ON public.origins 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Processing methods table
DROP POLICY IF EXISTS "Authenticated users can manage processing methods" ON public.processing_methods;
DROP POLICY IF EXISTS "Authenticated users can view processing methods" ON public.processing_methods;

CREATE POLICY "Approved users can manage processing methods" 
ON public.processing_methods 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Purchase distributions table
DROP POLICY IF EXISTS "Authenticated users can manage purchase distributions" ON public.purchase_distributions;
DROP POLICY IF EXISTS "Authenticated users can view purchase distributions" ON public.purchase_distributions;

CREATE POLICY "Approved users can manage purchase distributions" 
ON public.purchase_distributions 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Purchase items table
DROP POLICY IF EXISTS "Authenticated users can manage purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Authenticated users can view purchase items" ON public.purchase_items;

CREATE POLICY "Approved users can manage purchase items" 
ON public.purchase_items 
FOR ALL 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Purchases table (окремо обробляємо SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Authenticated users can create purchases" ON public.purchases;
DROP POLICY IF EXISTS "Authenticated users can delete purchases" ON public.purchases;
DROP POLICY IF EXISTS "Authenticated users can update purchases" ON public.purchases;
DROP POLICY IF EXISTS "Authenticated users can view purchases" ON public.purchases;

CREATE POLICY "Approved users can view purchases" 
ON public.purchases 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

CREATE POLICY "Approved users can create purchases" 
ON public.purchases 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

CREATE POLICY "Approved users can update purchases" 
ON public.purchases 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()))
WITH CHECK (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

CREATE POLICY "Approved users can delete purchases" 
ON public.purchases 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

-- Purchase amount changes table (залишаємо true для системи)
-- Ця таблиця використовується системою для логування змін
DROP POLICY IF EXISTS "Authenticated users can create purchase amount changes" ON public.purchase_amount_changes;
DROP POLICY IF EXISTS "Authenticated users can view purchase amount changes" ON public.purchase_amount_changes;

CREATE POLICY "Approved users can view purchase amount changes" 
ON public.purchase_amount_changes 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_approved(auth.uid()));

CREATE POLICY "System can create purchase amount changes" 
ON public.purchase_amount_changes 
FOR INSERT 
WITH CHECK (true);  -- Залишаємо true для системних операцій