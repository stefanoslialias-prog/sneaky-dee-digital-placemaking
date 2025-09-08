-- Update the user_coupons table RLS policy to allow anonymous coupon claims
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can claim their own coupons" ON public.user_coupons;

-- Create a new policy that allows both authenticated users and anonymous claims
CREATE POLICY "Allow coupon claims for authenticated and anonymous users" 
ON public.user_coupons 
FOR INSERT 
WITH CHECK (
  -- Allow if user_id matches the authenticated user (for logged in users)
  (user_id = auth.uid()) 
  OR 
  -- Allow if user_id is null (for anonymous users)
  (user_id IS NULL)
);

-- Also update the SELECT policy to allow viewing coupons claimed anonymously by device/email
DROP POLICY IF EXISTS "Users can view only their own coupons" ON public.user_coupons;

CREATE POLICY "Users can view their own coupons or anonymous claims" 
ON public.user_coupons 
FOR SELECT 
USING (
  -- Authenticated users can see their own coupons
  (user_id = auth.uid()) 
  OR
  -- Anonymous users can see coupons they claimed (this would require additional context like device_id)
  -- For now, we'll keep this simple and only allow authenticated users to view
  -- since anonymous users get the coupon details immediately after claiming
  (user_id = auth.uid())
);