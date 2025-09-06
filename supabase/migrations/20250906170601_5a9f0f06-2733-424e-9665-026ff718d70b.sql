-- Add admin delete policy for user_coupons table to allow coupon deletion
CREATE POLICY "Admins can delete user coupons" 
ON public.user_coupons
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);