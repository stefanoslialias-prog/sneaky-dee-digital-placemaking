-- Fix Security Definer View issues by restricting access to analytics views
-- These views contain business intelligence data that should only be accessible to admins

-- Revoke all permissions from public roles on analytics views
REVOKE ALL ON public.partner_engagement_summary FROM anon, authenticated;
REVOKE ALL ON public.partner_sentiment_summary FROM anon, authenticated; 
REVOKE ALL ON public.partner_overview FROM anon, authenticated;
REVOKE ALL ON public.location_analytics FROM anon, authenticated;

-- Grant SELECT access only to postgres role (for admin access via dashboard)
GRANT SELECT ON public.partner_engagement_summary TO postgres;
GRANT SELECT ON public.partner_sentiment_summary TO postgres;
GRANT SELECT ON public.partner_overview TO postgres;
GRANT SELECT ON public.location_analytics TO postgres;

-- Create a security definer function for admin access to analytics
-- This allows the dashboard to access analytics data when user is admin
CREATE OR REPLACE FUNCTION public.get_partner_analytics()
RETURNS TABLE (
    partner_id uuid,
    name text,
    slug text,
    total_responses bigint,
    happy_count bigint,
    neutral_count bigint,
    concerned_count bigint,
    respondent_sessions bigint,
    visits bigint,
    copy_clicks bigint,
    download_clicks bigint,
    wallet_adds bigint
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Only allow admins to access this data
    SELECT 
        po.partner_id,
        po.name,
        po.slug,
        po.total_responses,
        po.happy_count,
        po.neutral_count,
        po.concerned_count,
        po.respondent_sessions,
        po.visits,
        po.copy_clicks,
        po.download_clicks,
        po.wallet_adds
    FROM public.partner_overview po
    WHERE has_role(auth.uid(), 'admin');
$$;

-- Grant execute permission to authenticated users (function will check admin role)
GRANT EXECUTE ON FUNCTION public.get_partner_analytics() TO authenticated;

-- Note: The coupons_public view is intentionally left accessible as it only exposes safe data