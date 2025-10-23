-- Create coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  discount TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons are viewable by everyone"
  ON public.coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage coupons"
  ON public.coupons FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create coupons_public view for backward compatibility
CREATE OR REPLACE VIEW public.coupons_public AS
SELECT id, title, description, discount, expires_at, partner_id, code, created_at
FROM public.coupons
WHERE active = true;

-- Create user_emails table
CREATE TABLE public.user_emails (
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

CREATE POLICY "Anyone can insert user emails"
  ON public.user_emails FOR INSERT
  WITH CHECK (true);

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

-- Create indexes
CREATE INDEX idx_coupons_partner ON public.coupons(partner_id);
CREATE INDEX idx_coupons_active ON public.coupons(active);
CREATE INDEX idx_user_emails_device ON public.user_emails(device_id);
CREATE INDEX idx_user_emails_status ON public.user_emails(status);