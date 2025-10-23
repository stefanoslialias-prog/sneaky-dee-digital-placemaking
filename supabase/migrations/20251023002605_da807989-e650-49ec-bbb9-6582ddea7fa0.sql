-- Create coupons_public view for backward compatibility
CREATE OR REPLACE VIEW public.coupons_public AS
SELECT id, title, description, discount, expires_at, partner_id, code, created_at
FROM public.coupons
WHERE active = true;

-- Create user_emails table
CREATE TABLE IF NOT EXISTS public.user_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  email_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  retries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert user emails" ON public.user_emails;
CREATE POLICY "Anyone can insert user emails"
  ON public.user_emails FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "User emails are viewable by everyone" ON public.user_emails;
CREATE POLICY "User emails are viewable by everyone"
  ON public.user_emails FOR SELECT
  USING (true);

-- Create update_response_comment function
CREATE OR REPLACE FUNCTION public.update_response_comment(
  p_response_id UUID,
  p_comment TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.survey_responses
  SET comment = p_comment
  WHERE id = p_response_id;
END;
$$;

-- Create claim_coupon function
CREATE OR REPLACE FUNCTION public.claim_coupon(
  p_coupon_id UUID,
  p_device_id TEXT,
  p_session_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.engagement_events (
    session_id,
    event_type,
    event_data
  ) VALUES (
    p_session_id,
    'coupon_claimed',
    jsonb_build_object(
      'coupon_id', p_coupon_id,
      'device_id', p_device_id
    )
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_emails_device ON public.user_emails(device_id);
CREATE INDEX IF NOT EXISTS idx_user_emails_status ON public.user_emails(status);