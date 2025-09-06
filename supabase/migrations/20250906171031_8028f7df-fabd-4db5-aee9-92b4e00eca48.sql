-- Delete user_coupons first, then delete the Amazon and McDonald's coupons
DELETE FROM public.user_coupons 
WHERE coupon_id IN (
  SELECT id FROM public.coupons 
  WHERE title ILIKE '%amazon%' OR title ILIKE '%mcdonald%' 
  OR description ILIKE '%amazon%' OR description ILIKE '%mcdonald%'
);

-- Now delete the actual coupons
DELETE FROM public.coupons 
WHERE title ILIKE '%amazon%' OR title ILIKE '%mcdonald%' 
OR description ILIKE '%amazon%' OR description ILIKE '%mcdonald%';