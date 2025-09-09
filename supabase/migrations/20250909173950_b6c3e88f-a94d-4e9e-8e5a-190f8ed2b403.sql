-- Clear all existing data from tables while preserving structure
-- Delete in order to respect foreign key constraints

-- Clear engagement tracking data
DELETE FROM public.engagement_events;

-- Clear survey data
DELETE FROM public.survey_responses;
DELETE FROM public.user_interactions;

-- Clear coupon and wallet data
DELETE FROM public.user_wallets;
DELETE FROM public.user_coupons;
DELETE FROM public.coupons;

-- Clear email data
DELETE FROM public.user_emails;

-- Clear device data
DELETE FROM public.devices;

-- Clear location data
DELETE FROM public.location_traffic;

-- Clear user data (but preserve admin users for access)
DELETE FROM public.profiles;
DELETE FROM public.users;

-- Clear partner data
DELETE FROM public.partners;

-- Clear survey questions
DELETE FROM public.survey_questions;

-- Clear wifi locations
DELETE FROM public.wifi_locations;

-- Reset sequences if any (to start IDs from 1 again)
-- Note: UUIDs don't use sequences, so this mainly affects any serial columns