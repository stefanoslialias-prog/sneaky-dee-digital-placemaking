-- Create RPC function to safely insert survey responses and return ID
CREATE OR REPLACE FUNCTION public.insert_survey_response(
  p_question_id uuid,
  p_answer text,
  p_comment text DEFAULT NULL,
  p_session_id text,
  p_location_id text DEFAULT NULL,
  p_partner_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_response_id uuid;
BEGIN
  -- Insert the survey response
  INSERT INTO public.survey_responses (
    question_id,
    answer,
    comment,
    session_id,
    location_id,
    partner_id
  ) VALUES (
    p_question_id,
    p_answer,
    p_comment,
    p_session_id,
    p_location_id,
    p_partner_id
  ) RETURNING id INTO v_response_id;
  
  RETURN v_response_id;
END;
$$;