-- Allow admins to view all coupons in the dashboard
CREATE POLICY "Admins can view all coupons" 
ON public.coupons 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));