-- Fix 1: Restrict user_emails table access (PUBLIC_DATA_EXPOSURE)
DROP POLICY IF EXISTS "User emails are viewable by everyone" ON public.user_emails;

CREATE POLICY "Admins can view emails"
ON public.user_emails
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Service role can manage emails"
ON public.user_emails
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- Fix 2: Restrict survey_responses table access (PUBLIC_DATA_EXPOSURE)
DROP POLICY IF EXISTS "Survey responses are viewable by everyone" ON public.survey_responses;

CREATE POLICY "Admins can view responses"
ON public.survey_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Fix 3: Restrict engagement_events table access (PUBLIC_DATA_EXPOSURE)
DROP POLICY IF EXISTS "Engagement events are viewable by everyone" ON public.engagement_events;

CREATE POLICY "Admins can view events"
ON public.engagement_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Fix 4: Update comment function to require session validation (DEFINER_OR_RPC_BYPASS)
CREATE OR REPLACE FUNCTION public.update_response_comment(
  p_response_id uuid,
  p_comment text,
  p_session_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate comment length
  IF length(p_comment) > 500 THEN
    RAISE EXCEPTION 'Comment must be 500 characters or less';
  END IF;

  -- Update only if session matches
  UPDATE public.survey_responses
  SET comment = p_comment
  WHERE id = p_response_id AND session_id = p_session_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unauthorized or response not found';
  END IF;
END;
$$;

-- Fix 5: Add server-side input validation constraints (INPUT_VALIDATION)

-- Survey responses validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comment_length'
  ) THEN
    ALTER TABLE public.survey_responses 
    ADD CONSTRAINT comment_length CHECK (length(comment) <= 500);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'answer_length'
  ) THEN
    ALTER TABLE public.survey_responses 
    ADD CONSTRAINT answer_length CHECK (length(answer) <= 100);
  END IF;
END $$;

-- User emails validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_address_format'
  ) THEN
    ALTER TABLE public.user_emails 
    ADD CONSTRAINT email_address_format CHECK (email_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_address_length'
  ) THEN
    ALTER TABLE public.user_emails 
    ADD CONSTRAINT email_address_length CHECK (length(email_address) <= 255);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'email_content_length'
  ) THEN
    ALTER TABLE public.user_emails 
    ADD CONSTRAINT email_content_length CHECK (length(email_content) <= 10000);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subject_length'
  ) THEN
    ALTER TABLE public.user_emails 
    ADD CONSTRAINT subject_length CHECK (length(subject) <= 200);
  END IF;
END $$;

-- Engagement events validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'session_id_length'
  ) THEN
    ALTER TABLE public.engagement_events 
    ADD CONSTRAINT session_id_length CHECK (length(session_id) <= 200);
  END IF;
END $$;