-- Fix survey_responses RLS policies to allow anonymous users
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow anon inserts to survey_responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow anonymous inserts to survey_responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Anyone can insert anonymous responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Authenticated users can insert responses" ON public.survey_responses;

-- Create a single permissive policy for both anonymous and authenticated users
CREATE POLICY "Allow all users to insert survey responses" 
ON public.survey_responses 
FOR INSERT 
WITH CHECK (true);

-- Fix engagement_events check constraint to include all used event types
-- First, drop the existing constraint
ALTER TABLE public.engagement_events DROP CONSTRAINT IF EXISTS engagement_events_event_type_check;

-- Add a new constraint that includes all event types used in the code
ALTER TABLE public.engagement_events 
ADD CONSTRAINT engagement_events_event_type_check 
CHECK (event_type IN (
  'visit_partner_page',
  'coupon_selected', 
  'sentiment_submitted',
  'comment_submitted',
  'email_opt_in',
  'email_opt_out',
  'pass_added',
  'copy_coupon_code',
  'download_coupon'
));