-- Update the check constraint to include auth_login event type
ALTER TABLE public.engagement_events
DROP CONSTRAINT IF EXISTS engagement_events_event_type_check;

ALTER TABLE public.engagement_events
ADD CONSTRAINT engagement_events_event_type_check 
CHECK (event_type IN (
  'visit_partner_page',
  'view_coupon',
  'copy_coupon_code',
  'download_coupon',
  'add_to_wallet',
  'coupon_claimed',
  'sentiment_submitted',
  'comment_submitted',
  'auth_login'
));