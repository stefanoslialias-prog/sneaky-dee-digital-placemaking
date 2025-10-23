-- Add missing columns to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create wifi_locations table
CREATE TABLE IF NOT EXISTS public.wifi_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wifi_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "WiFi locations are viewable by everyone"
  ON public.wifi_locations FOR SELECT
  USING (true);

-- Add coupon_id column to engagement_events for tracking coupon interactions
ALTER TABLE public.engagement_events 
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;

-- Create get_partner_analytics function
CREATE OR REPLACE FUNCTION public.get_partner_analytics(partner_slug TEXT)
RETURNS TABLE (
  total_responses BIGINT,
  positive_sentiment BIGINT,
  neutral_sentiment BIGINT,
  negative_sentiment BIGINT,
  total_visits BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT sr.id) as total_responses,
    COUNT(DISTINCT sr.id) FILTER (WHERE sr.answer = 'happy') as positive_sentiment,
    COUNT(DISTINCT sr.id) FILTER (WHERE sr.answer = 'neutral') as neutral_sentiment,
    COUNT(DISTINCT sr.id) FILTER (WHERE sr.answer = 'concerned') as negative_sentiment,
    COUNT(DISTINCT ee.session_id) as total_visits
  FROM public.partners p
  LEFT JOIN public.survey_responses sr ON sr.partner_id = p.id
  LEFT JOIN public.engagement_events ee ON ee.event_data->>'partner_slug' = p.slug
  WHERE p.slug = partner_slug
  GROUP BY p.id;
END;
$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_engagement_events_coupon ON public.engagement_events(coupon_id);
CREATE INDEX IF NOT EXISTS idx_wifi_locations_active ON public.wifi_locations(active);