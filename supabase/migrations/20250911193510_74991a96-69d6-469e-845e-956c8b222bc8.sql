-- Clear all raw user data while preserving configuration
-- This will remove survey responses, engagement tracking, user interactions, etc.
-- but keep partners, survey questions, coupons, admin users, and other configuration data

-- Clear survey responses and related data
TRUNCATE TABLE public.survey_responses CASCADE;

-- Clear engagement tracking events
TRUNCATE TABLE public.engagement_events CASCADE;

-- Clear user interactions with questions
TRUNCATE TABLE public.user_interactions CASCADE;

-- Clear email submissions
TRUNCATE TABLE public.user_emails CASCADE;

-- Clear coupon claims
TRUNCATE TABLE public.user_coupons CASCADE;

-- Clear wallet entries
TRUNCATE TABLE public.user_wallets CASCADE;

-- Clear location traffic data
TRUNCATE TABLE public.location_traffic CASCADE;

-- Clear device tracking data
TRUNCATE TABLE public.devices CASCADE;

-- Note: The following tables are preserved as they contain configuration:
-- - partners (business partners)
-- - survey_questions (survey configuration)
-- - coupons (coupon templates)
-- - wifi_locations (location configuration)
-- - user_roles (admin permissions)
-- - admin_users (admin user list)
-- - profiles (user profiles)
-- - users (user accounts)

-- The summary views (partner_overview, partner_sentiment_summary, partner_engagement_summary)
-- will automatically reflect the cleared data since they are computed from the truncated tables