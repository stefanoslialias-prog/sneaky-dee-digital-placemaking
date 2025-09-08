-- Fix security definer functions that don't need elevated privileges
-- Remove SECURITY DEFINER from functions that can rely on RLS instead

-- Update get_sentiment_summary to not use SECURITY DEFINER
-- This function should rely on RLS policies instead
CREATE OR REPLACE FUNCTION public.get_sentiment_summary()
 RETURNS TABLE(survey_date numeric, happy_count bigint, neutral_count bigint, concerned_count bigint, total_count bigint)
 LANGUAGE sql
 STABLE
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

-- Update get_partner_analytics to not use SECURITY DEFINER
-- This function should check admin role within the function logic instead
CREATE OR REPLACE FUNCTION public.get_partner_analytics()
 RETURNS TABLE(partner_id uuid, name text, slug text, total_responses bigint, happy_count bigint, neutral_count bigint, concerned_count bigint, respondent_sessions bigint, visits bigint, copy_clicks bigint, download_clicks bigint, wallet_adds bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
    -- Only allow admins to access this data
    SELECT 
        po.partner_id,
        po.name,
        po.slug,
        po.total_responses,
        po.happy_count,
        po.neutral_count,
        po.concerned_count,
        po.respondent_sessions,
        po.visits,
        po.copy_clicks,
        po.download_clicks,
        po.wallet_adds
    FROM public.partner_overview po
    WHERE has_role(auth.uid(), 'admin');
$function$;

-- Update get_random_question_for_ip to not use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_random_question_for_ip(p_ip_address text)
 RETURNS TABLE(id uuid, text text, type text, category text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sq.id,
    sq.text,
    sq.type,
    sq.category
  FROM 
    public.survey_questions sq
  WHERE 
    sq.active = true
    -- Exclude questions the IP has answered in the last 24 hours
    AND NOT EXISTS (
      SELECT 1 
      FROM public.user_interactions ui 
      WHERE 
        ui.question_id = sq.id 
        AND ui.ip_address = p_ip_address
        AND ui.interaction_timestamp > NOW() - INTERVAL '24 hours'
    )
  ORDER BY RANDOM()
  LIMIT 1;
END;
$function$;