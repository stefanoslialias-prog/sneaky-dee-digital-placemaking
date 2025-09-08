-- Fix engagement_events check constraint to include all used event types
-- First, drop the existing constraint
ALTER TABLE public.engagement_events DROP CONSTRAINT IF EXISTS engagement_events_event_type_check;

-- Add a new constraint that includes existing and new event types
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
  'copy_code',
  'download_coupon'
));