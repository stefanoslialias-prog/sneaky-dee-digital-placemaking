-- Add new fields to partners table before renaming
ALTER TABLE public.partners 
ADD COLUMN client_name text,
ADD COLUMN parent_location_id uuid REFERENCES public.partners(id);

-- Add index for parent lookup
CREATE INDEX idx_partners_parent_location ON public.partners(parent_location_id);

-- Rename partners table to locations
ALTER TABLE public.partners RENAME TO locations;

-- Rename the index
ALTER INDEX idx_partners_parent_location RENAME TO idx_locations_parent_location;

-- Update the analytics function
DROP FUNCTION IF EXISTS public.get_partner_analytics(text);

CREATE OR REPLACE FUNCTION public.get_location_analytics(location_slug text)
RETURNS TABLE(total_responses bigint, positive_sentiment bigint, neutral_sentiment bigint, negative_sentiment bigint, total_visits bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT sr.id) as total_responses,
    COUNT(DISTINCT sr.id) FILTER (WHERE sr.answer = 'happy') as positive_sentiment,
    COUNT(DISTINCT sr.id) FILTER (WHERE sr.answer = 'neutral') as neutral_sentiment,
    COUNT(DISTINCT sr.id) FILTER (WHERE sr.answer = 'concerned') as negative_sentiment,
    COUNT(DISTINCT ee.session_id) as total_visits
  FROM public.locations l
  LEFT JOIN public.survey_responses sr ON sr.partner_id = l.id
  LEFT JOIN public.engagement_events ee ON ee.event_data->>'partner_slug' = l.slug
  WHERE l.slug = location_slug
  GROUP BY l.id;
END;
$function$;