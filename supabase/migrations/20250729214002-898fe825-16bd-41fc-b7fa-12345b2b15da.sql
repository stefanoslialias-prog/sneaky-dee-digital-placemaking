-- Fix the materialized view issue - it's actually a view, not materialized view
DROP VIEW IF EXISTS public.sentiment_summary;

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

-- Remove the typo table
DROP TABLE IF EXISTS public."user_tab;es";