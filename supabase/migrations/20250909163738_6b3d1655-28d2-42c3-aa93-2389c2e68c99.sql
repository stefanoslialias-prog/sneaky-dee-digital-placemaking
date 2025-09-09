-- Clear all existing raw data while preserving table structures
DELETE FROM public.engagement_events;
DELETE FROM public.user_interactions;
DELETE FROM public.survey_responses;
DELETE FROM public.user_emails;
DELETE FROM public.user_coupons;
DELETE FROM public.user_wallets;
DELETE FROM public.devices;
DELETE FROM public.location_traffic;

-- Reset any sequences if needed (though we use UUIDs mostly)
-- This ensures a clean slate for all user-generated data