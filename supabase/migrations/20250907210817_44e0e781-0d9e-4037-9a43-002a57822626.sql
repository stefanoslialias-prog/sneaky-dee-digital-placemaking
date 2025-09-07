-- Final approach: Change ownership of views to remove security definer behavior
-- Views owned by postgres superuser are treated as security definer

-- The issue is that views owned by postgres can bypass RLS policies
-- We need to either change ownership or find another approach

-- Since we can't easily change ownership in Supabase (managed service),
-- let's take a different approach: remove these views from the API exposure entirely

-- Option 1: Move views to a private schema (but this might break existing code)
-- Option 2: Use functions instead of views for controlled access (already implemented)
-- Option 3: Keep views but ensure they're not accessible via PostgREST

-- For now, let's remove API access to the problematic views completely
-- and rely on the secure function we created

-- Remove views from PostgREST API by revoking all access
REVOKE ALL ON public.partner_engagement_summary FROM anon, authenticated, postgres;
REVOKE ALL ON public.partner_sentiment_summary FROM anon, authenticated, postgres;
REVOKE ALL ON public.partner_overview FROM anon, authenticated, postgres;

-- The location_analytics materialized view should also be restricted
REVOKE ALL ON public.location_analytics FROM anon, authenticated, postgres;

-- Note: Admin dashboard should use the get_partner_analytics() function instead
-- This function provides controlled access with proper admin authentication

-- Keep coupons_public view accessible as it only exposes safe data
-- and is needed for the public coupon browsing functionality
GRANT SELECT ON public.coupons_public TO anon, authenticated;