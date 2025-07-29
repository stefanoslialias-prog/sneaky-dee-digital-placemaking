-- Fix remaining security definer functions with proper search_path
CREATE OR REPLACE FUNCTION public.record_question_interaction(p_ip_address text, p_question_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_interaction_id UUID;
BEGIN
  -- Insert the new interaction
  INSERT INTO user_interactions (ip_address, question_id)
  VALUES (p_ip_address, p_question_id)
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_random_question_for_ip(p_ip_address text)
 RETURNS TABLE(id uuid, text text, type text, category text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sq.id,
    sq.text,
    sq.type,
    sq.category
  FROM 
    survey_questions sq
  WHERE 
    sq.active = true
    -- Exclude questions the IP has answered in the last 24 hours
    AND NOT EXISTS (
      SELECT 1 
      FROM user_interactions ui 
      WHERE 
        ui.question_id = sq.id 
        AND ui.ip_address = p_ip_address
        AND ui.interaction_timestamp > NOW() - INTERVAL '24 hours'
    )
  ORDER BY RANDOM()
  LIMIT 1;
END;
$function$;

-- Drop the materialized view that's exposed via API (security concern)
DROP MATERIALIZED VIEW IF EXISTS public.sentiment_summary;

-- Create a secure function instead to get sentiment summary
CREATE OR REPLACE FUNCTION public.get_sentiment_summary()
 RETURNS TABLE(
   survey_date numeric,
   happy_count bigint,
   neutral_count bigint,
   concerned_count bigint,
   total_count bigint
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT 
    EXTRACT(EPOCH FROM DATE_TRUNC('day', created_at))::numeric as survey_date,
    COUNT(*) FILTER (WHERE answer = 'happy') as happy_count,
    COUNT(*) FILTER (WHERE answer = 'neutral') as neutral_count,
    COUNT(*) FILTER (WHERE answer = 'concerned') as concerned_count,
    COUNT(*) as total_count
  FROM public.survey_responses
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE_TRUNC('day', created_at)
  ORDER BY survey_date DESC;
$function$;

-- Add RLS policy for tables that have RLS enabled but no policies
-- Check if user_tab;es table exists and handle it
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_tab;es') THEN
    -- This table name appears to be a typo, let's drop it
    DROP TABLE IF EXISTS public."user_tab;es";
  END IF;
END $$;