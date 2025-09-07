-- Fix remaining search_path issues in functions
-- Update existing functions to have proper search_path set

-- Fix assign_admin_role function 
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow if the current user is an admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Insert the admin role for the target user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$function$;

-- Fix record_question_interaction function
CREATE OR REPLACE FUNCTION public.record_question_interaction(p_ip_address text, p_question_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_interaction_id UUID;
BEGIN
  -- Insert the new interaction
  INSERT INTO public.user_interactions (ip_address, question_id)
  VALUES (p_ip_address, p_question_id)
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$function$;

-- Fix get_random_question_for_ip function
CREATE OR REPLACE FUNCTION public.get_random_question_for_ip(p_ip_address text)
 RETURNS TABLE(id uuid, text text, type text, category text)
 LANGUAGE plpgsql
 SECURITY DEFINER
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