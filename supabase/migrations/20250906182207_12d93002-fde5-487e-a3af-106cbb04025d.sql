-- Fix duplicate Kingsway Fish and Chips by deactivating one
UPDATE public.partners 
SET active = false 
WHERE name = 'Kingsway Fish and Chips' 
AND id != (
  SELECT id FROM public.partners 
  WHERE name = 'Kingsway Fish and Chips' 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Add unique constraint on slug to prevent future duplicates
ALTER TABLE public.partners 
ADD CONSTRAINT partners_slug_unique UNIQUE (slug);