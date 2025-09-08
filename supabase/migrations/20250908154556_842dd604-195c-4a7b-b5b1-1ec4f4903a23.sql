-- Add DELETE policy for admins on user_wallets table
CREATE POLICY "Admins can delete user wallets" 
ON public.user_wallets 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Update foreign key constraints to cascade deletes
-- First, drop existing foreign key constraints
ALTER TABLE public.user_coupons DROP CONSTRAINT IF EXISTS user_coupons_coupon_id_fkey;
ALTER TABLE public.engagement_events DROP CONSTRAINT IF EXISTS engagement_events_coupon_id_fkey;
ALTER TABLE public.user_wallets DROP CONSTRAINT IF EXISTS user_wallets_coupon_id_fkey;

-- Add them back with CASCADE DELETE
ALTER TABLE public.user_coupons 
ADD CONSTRAINT user_coupons_coupon_id_fkey 
FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;

ALTER TABLE public.engagement_events 
ADD CONSTRAINT engagement_events_coupon_id_fkey 
FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;

ALTER TABLE public.user_wallets 
ADD CONSTRAINT user_wallets_coupon_id_fkey 
FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;