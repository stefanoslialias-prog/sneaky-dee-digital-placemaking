-- Fix RLS policies to allow anonymous users for public flow
-- These changes ensure the public survey flow works for logged-out users

-- Allow anonymous inserts for survey responses (public survey flow)
CREATE POLICY "Allow anonymous inserts to survey_responses" 
ON public.survey_responses 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous inserts for engagement events (tracking)
CREATE POLICY "Allow anonymous inserts to engagement_events" 
ON public.engagement_events 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous inserts for user_emails (email collection)
CREATE POLICY "Allow anonymous inserts to user_emails" 
ON public.user_emails 
FOR INSERT 
WITH CHECK (true);

-- Allow anonymous access to read active survey questions
CREATE POLICY "Anonymous users can view active questions" 
ON public.survey_questions 
FOR SELECT 
USING (active = true);

-- Allow anonymous access to coupons_public view for coupon selection
GRANT SELECT ON public.coupons_public TO anon;