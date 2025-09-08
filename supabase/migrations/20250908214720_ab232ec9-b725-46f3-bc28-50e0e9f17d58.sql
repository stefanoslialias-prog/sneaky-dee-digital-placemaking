-- Update the check constraint to include all existing and new event types
ALTER TABLE public.engagement_events
DROP CONSTRAINT IF EXISTS engagement_events_event_type_check;

ALTER TABLE public.engagement_events
ADD CONSTRAINT engagement_events_event_type_check 
CHECK (event_type IN (
  'visit_partner_page',
  'view_coupon',
  'copy_coupon_code',
  'copy_code',
  'download_coupon',
  'add_to_wallet',
  'coupon_claimed',
  'coupon_selected',
  'sentiment_submitted',
  'comment_submitted',
  'auth_login'
));