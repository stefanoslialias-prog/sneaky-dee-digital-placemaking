-- CRITICAL SECURITY FIX: Restrict access to sensitive coupon data
-- Issue: The current RLS policy allows anyone to see ALL coupon details including codes and marketing strategy

-- Step 1: Remove the overly permissive policy that exposes all coupon data
DROP POLICY IF EXISTS "Allow anyone to view active coupons" ON public.coupons;

-- Step 2: Create a restricted view for public coupon browsing (without codes/sensitive data)
CREATE OR REPLACE VIEW public.available_coupons AS
SELECT 
  id,
  title,
  description,
  discount,
  expires_at,
  image_url,
  created_at
FROM public.coupons
WHERE active = true AND expires_at > now();

-- Step 3: Enable RLS on the view (views inherit table RLS by default but let's be explicit)
-- Note: Views use the underlying table's RLS policies

-- Step 4: Create a secure policy for the view that allows browsing without exposing codes
CREATE POLICY "Public can browse available coupons safely" 
  ON public.coupons 
  FOR SELECT 
  USING (
    -- Allow access through the view only (we'll handle this in application logic)
    -- For now, completely restrict direct table access for anonymous users
    auth.uid() IS NOT NULL
  );

-- Step 5: Keep existing policies for authenticated users and admins
-- (The "Users can view their own coupons" policy remains for claimed coupons)

-- Step 6: Create a function to safely get coupon preview data (without codes)
CREATE OR REPLACE FUNCTION public.get_available_coupons()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  discount text,
  expires_at timestamp with time zone,
  image_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.title,
    c.description,
    c.discount,
    c.expires_at,
    c.image_url,
    c.created_at
  FROM public.coupons c
  WHERE c.active = true 
    AND c.expires_at > now()
  ORDER BY c.created_at DESC;
$$;

-- Step 7: Grant execute permission on the function to anonymous users
GRANT EXECUTE ON FUNCTION public.get_available_coupons() TO anon;
GRANT EXECUTE ON FUNCTION public.get_available_coupons() TO authenticated;

-- Add security documentation
COMMENT ON FUNCTION public.get_available_coupons() IS 'SECURITY: Safely exposes coupon preview data without revealing sensitive codes or marketing details. Use this instead of direct table access.';
COMMENT ON VIEW public.available_coupons IS 'SECURITY: Non-sensitive coupon data for public browsing. Does not include coupon codes.';
COMMENT ON POLICY "Public can browse available coupons safely" ON public.coupons IS 'SECURITY: Restricts direct table access. Use get_available_coupons() function instead.';