-- Fix the security definer view issue by recreating as a regular view
DROP VIEW IF EXISTS public.coupons_public;

CREATE VIEW public.coupons_public WITH (security_invoker = true) AS
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