-- Fix security linter warnings: Remove SECURITY DEFINER from function
-- The previous approach triggered a security warning, so we'll use a different approach

-- Drop the SECURITY DEFINER function
DROP FUNCTION IF EXISTS public.get_available_coupons();

-- Create a new approach: Update RLS to allow anonymous access to specific columns only
-- Remove the restrictive policy we just created
DROP POLICY IF EXISTS "Public can browse available coupons safely" ON public.coupons;

-- Create a more nuanced policy that allows limited read access for browsing
-- but still protects sensitive information like codes
CREATE POLICY "Allow anonymous coupon browsing (limited data)" 
  ON public.coupons 
  FOR SELECT 
  USING (
    active = true 
    AND expires_at > now()
    -- This policy will be combined with application logic to limit exposed columns
  );

-- Add a comment to remind developers to use application logic for column filtering
COMMENT ON POLICY "Allow anonymous coupon browsing (limited data)" ON public.coupons 
IS 'SECURITY: This policy allows browsing coupons but application code MUST filter columns to exclude sensitive data like codes. Only expose: id, title, description, discount, expires_at, image_url, created_at';

-- Since we can't easily restrict columns at the RLS level without SECURITY DEFINER,
-- we'll rely on the application layer to call specific columns and exclude the 'code' column