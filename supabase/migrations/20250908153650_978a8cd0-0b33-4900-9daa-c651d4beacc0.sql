-- Grant necessary permissions on coupons table to authenticated users
-- This allows RLS policies to be evaluated properly
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;

-- Update the coupons_public view to only show coupons from active partners
DROP VIEW IF EXISTS public.coupons_public;

CREATE VIEW public.coupons_public AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.discount,
  c.expires_at,
  c.active,
  c.created_at,
  c.partner_id,
  c.image_url
FROM public.coupons c
LEFT JOIN public.partners p ON c.partner_id = p.id
WHERE c.active = true 
  AND c.expires_at > now()
  AND (p.id IS NULL OR p.active = true);