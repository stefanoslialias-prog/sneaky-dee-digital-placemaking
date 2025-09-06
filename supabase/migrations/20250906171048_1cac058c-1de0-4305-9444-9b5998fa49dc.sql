-- Delete from all related tables first, then delete the Amazon and McDonald's coupons
-- First delete from user_wallets
DELETE FROM public.user_wallets 
WHERE coupon_id IN (
  SELECT id FROM public.coupons 
  WHERE title ILIKE '%amazon%' OR title ILIKE '%mcdonald%' 
  OR description ILIKE '%amazon%' OR description ILIKE '%mcdonald%'
);

-- Then delete from user_coupons  
DELETE FROM public.user_coupons 
WHERE coupon_id IN (
  SELECT id FROM public.coupons 
  WHERE title ILIKE '%amazon%' OR title ILIKE '%mcdonald%' 
  OR description ILIKE '%amazon%' OR description ILIKE '%mcdonald%'
);

-- Finally delete the actual coupons
DELETE FROM public.coupons 
WHERE title ILIKE '%amazon%' OR title ILIKE '%mcdonald%' 
OR description ILIKE '%amazon%' OR description ILIKE '%mcdonald%';