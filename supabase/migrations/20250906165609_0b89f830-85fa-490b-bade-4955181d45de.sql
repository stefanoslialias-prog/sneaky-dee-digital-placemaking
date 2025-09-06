-- Fix RLS policies for coupons table to allow admins to delete coupons
-- First, check current policies and add admin delete capability

-- Add admin delete policy for coupons
CREATE POLICY "Admins can delete coupons" 
ON public.coupons
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Also add admin update policy for coupons 
CREATE POLICY "Admins can update coupons" 
ON public.coupons
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);