-- Create or update engagement_events view for better data aggregation
CREATE OR REPLACE VIEW partner_engagement_summary AS
SELECT 
  e.partner_id,
  COUNT(*) FILTER (WHERE e.event_type = 'visit_partner_page') as visits,
  COUNT(*) FILTER (WHERE e.event_type = 'copy_code') as copy_clicks,
  COUNT(*) FILTER (WHERE e.event_type = 'download_coupon') as download_clicks,
  COUNT(*) FILTER (WHERE e.event_type = 'add_to_wallet') as wallet_adds,
  COUNT(*) FILTER (WHERE e.event_type = 'view_congratulations') as congrats_views
FROM engagement_events e
GROUP BY e.partner_id;

-- Enable realtime for engagement_events table
ALTER TABLE engagement_events REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE engagement_events;