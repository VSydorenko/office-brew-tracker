-- Add DELETE policy for purchases table
CREATE POLICY "Authenticated users can delete purchases" 
ON public.purchases 
FOR DELETE 
USING (true);

-- Ensure purchase_items are deleted when purchase is deleted
-- Add foreign key constraint with CASCADE if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'purchase_items' 
        AND constraint_name = 'purchase_items_purchase_id_fkey'
    ) THEN
        ALTER TABLE public.purchase_items 
        ADD CONSTRAINT purchase_items_purchase_id_fkey 
        FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;
    END IF;
END $$;