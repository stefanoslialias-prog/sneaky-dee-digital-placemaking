-- Remove the view that's causing the security warning
DROP VIEW IF EXISTS public.available_coupons;

-- The application will need to handle column filtering at the application layer
-- since we can't use SECURITY DEFINER functions or views safely according to the linter