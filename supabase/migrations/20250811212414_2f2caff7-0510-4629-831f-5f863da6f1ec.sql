-- Призначення Володимира першим адміном
UPDATE public.profiles 
SET 
  status = 'approved',
  role = 'admin',
  approved_by = id,  -- Самопідтвердження
  approved_at = now(),
  updated_at = now()
WHERE name = 'Володимир';