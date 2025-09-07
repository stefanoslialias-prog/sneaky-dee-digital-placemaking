-- Fix critical security issue: Remove public access to coupon codes and prevent unauthorized coupon creation

-- Drop the dangerous public insert policy that allows anyone to create coupons
DROP POLICY IF EXISTS "Allow inserts" ON public.coupons;

-- Drop the public select policy that exposes coupon codes
DROP POLICY IF EXISTS "Allow anonymous coupon browsing (limited data)" ON public.coupons;

-- Create admin-only insert policy for coupons
CREATE POLICY "Admins can create coupons"
  ON public.coupons
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create a secure public view that only exposes safe columns (no coupon codes)
CREATE OR REPLACE VIEW public.coupons_public AS
SELECT 
  id,
  title,
  description,
  discount,
  expires_at,
  image_url,
  partner_id,
  active,
  created_at
FROM public.coupons
WHERE active = true AND expires_at > now();

-- Grant public select access only to the safe view
GRANT SELECT ON public.coupons_public TO anon, authenticated;

-- Revoke direct access to the coupons table for non-admins
REVOKE SELECT ON public.coupons FROM anon, authenticated;

-- Ensure admins can still access the full coupons table
GRANT SELECT ON public.coupons TO postgres;

-- Note: The claim_coupon() function will still work as it uses SECURITY DEFINER
-- and returns the coupon code only after successful claiming