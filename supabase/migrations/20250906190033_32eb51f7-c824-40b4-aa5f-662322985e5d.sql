-- Create function to securely update survey response comments
CREATE OR REPLACE FUNCTION public.update_response_comment(
  p_response_id uuid,
  p_comment text,
  p_session_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update the survey response with the comment
  UPDATE public.survey_responses 
  SET comment = p_comment
  WHERE id = p_response_id 
    AND session_id = p_session_id;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;