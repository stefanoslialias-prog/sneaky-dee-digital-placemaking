-- Drop and recreate the view without security definer concerns
DROP VIEW IF EXISTS public.coupons_public;

-- Create a simple view that inherits RLS from the underlying table
CREATE VIEW public.coupons_public 
WITH (security_invoker=true) AS
SELECT id, title, description, discount, expires_at, partner_id, code, created_at
FROM public.coupons
WHERE active = true;