-- Update the engagement_events check constraint to include new event types
ALTER TABLE public.engagement_events 
DROP CONSTRAINT engagement_events_event_type_check;

-- Add the updated constraint with new event types
ALTER TABLE public.engagement_events 
ADD CONSTRAINT engagement_events_event_type_check 
CHECK (event_type = ANY (ARRAY[
  'visit_partner_page'::text, 
  'coupon_selected'::text, 
  'coupon_claimed'::text,  -- New event type
  'sentiment_submitted'::text, 
  'comment_submitted'::text, 
  'email_opt_in'::text, 
  'email_opt_out'::text, 
  'pass_added'::text,
  'add_to_wallet'::text,  -- New event type (replaces pass_added)
  'copy_coupon_code'::text, 
  'copy_code'::text, 
  'download_coupon'::text
]));