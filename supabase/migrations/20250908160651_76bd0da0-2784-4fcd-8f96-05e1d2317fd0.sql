-- Drop the existing coupons_public view
DROP VIEW IF EXISTS public.coupons_public;

-- Create a new coupons_public view as security definer (default)
-- This allows anonymous users to see coupons without RLS restrictions
CREATE VIEW public.coupons_public AS
SELECT 
  id,
  title,
  description,
  discount,
  image_url,
  expires_at,
  active,
  created_at,
  partner_id
FROM public.coupons 
WHERE active = true 
  AND expires_at > now();

-- Grant SELECT permissions to anonymous and authenticated users
GRANT SELECT ON public.coupons_public TO anon;
GRANT SELECT ON public.coupons_public TO authenticated;