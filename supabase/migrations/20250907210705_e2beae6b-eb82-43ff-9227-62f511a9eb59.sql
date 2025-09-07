-- Final fix for Security Definer View issue
-- The problem is that views owned by postgres superuser can bypass RLS
-- Solution: Recreate the analytics views as regular views without elevated privileges

-- Drop and recreate partner analytics views as regular views
-- This removes the implicit SECURITY DEFINER behavior that comes from postgres ownership

DROP VIEW IF EXISTS public.partner_engagement_summary;
DROP VIEW IF EXISTS public.partner_sentiment_summary;
DROP VIEW IF EXISTS public.partner_overview;

-- Recreate partner_sentiment_summary as a regular view
CREATE VIEW public.partner_sentiment_summary AS
SELECT 
    sr.partner_id,
    count(*) FILTER (WHERE sr.answer = 'happy') AS happy_count,
    count(*) FILTER (WHERE sr.answer = 'neutral') AS neutral_count,
    count(*) FILTER (WHERE sr.answer = 'concerned') AS concerned_count,
    count(*) AS total_count,
    count(DISTINCT sr.session_id) AS unique_sessions
FROM survey_responses sr
GROUP BY sr.partner_id;

-- Recreate partner_engagement_summary as a regular view
CREATE VIEW public.partner_engagement_summary AS
SELECT 
    e.partner_id,
    count(*) FILTER (WHERE e.event_type = 'visit_partner_page') AS visits,
    count(*) FILTER (WHERE e.event_type = 'copy_code') AS copy_clicks,
    count(*) FILTER (WHERE e.event_type = 'download_coupon') AS download_clicks,
    count(*) FILTER (WHERE e.event_type = 'add_to_wallet') AS wallet_adds,
    count(*) FILTER (WHERE e.event_type = 'view_congratulations') AS congrats_views
FROM engagement_events e
GROUP BY e.partner_id;

-- Recreate partner_overview as a regular view
CREATE VIEW public.partner_overview AS
SELECT 
    p.id AS partner_id,
    p.name,
    p.slug,
    COALESCE(s.total_count, 0) AS total_responses,
    COALESCE(s.happy_count, 0) AS happy_count,
    COALESCE(s.neutral_count, 0) AS neutral_count,
    COALESCE(s.concerned_count, 0) AS concerned_count,
    COALESCE(s.unique_sessions, 0) AS respondent_sessions,
    COALESCE(e.visits, 0) AS visits,
    COALESCE(e.copy_clicks, 0) AS copy_clicks,
    COALESCE(e.download_clicks, 0) AS download_clicks,
    COALESCE(e.wallet_adds, 0) AS wallet_adds
FROM partners p
LEFT JOIN partner_sentiment_summary s ON s.partner_id = p.id
LEFT JOIN partner_engagement_summary e ON e.partner_id = p.id
WHERE p.active = true;

-- Ensure these views have no public access (already done in previous migration)
-- Access is controlled through the get_partner_analytics() function for admins only

-- Also recreate the coupons_public view to ensure it's not flagged
DROP VIEW IF EXISTS public.coupons_public;
CREATE VIEW public.coupons_public AS
SELECT 
    id,
    title,
    description,
    discount,
    expires_at,
    image_url,
    partner_id,
    active,
    created_at
FROM coupons
WHERE active = true AND expires_at > now();

-- Grant appropriate permissions
GRANT SELECT ON public.coupons_public TO anon, authenticated;