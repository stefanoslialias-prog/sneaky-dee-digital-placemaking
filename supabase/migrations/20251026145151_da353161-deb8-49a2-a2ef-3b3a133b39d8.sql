-- Create storage bucket for coupon PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coupon-pdfs',
  'coupon-pdfs',
  true,
  10485760,
  ARRAY['application/pdf']
);

-- Storage policies for coupon PDFs
CREATE POLICY "Anyone can view coupon PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'coupon-pdfs');

CREATE POLICY "Authenticated users can upload coupon PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coupon-pdfs' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update coupon PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'coupon-pdfs' AND auth.role() = 'authenticated');

-- Add PDF support to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS pdf_url text,
ADD COLUMN IF NOT EXISTS share_enabled boolean DEFAULT true;

-- Create partner staff table FIRST
CREATE TABLE IF NOT EXISTS public.partner_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, partner_id)
);

-- Enable RLS on partner_staff
ALTER TABLE public.partner_staff ENABLE ROW LEVEL SECURITY;

-- RLS policies for partner_staff
CREATE POLICY "Staff can view their own record"
ON public.partner_staff FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage staff"
ON public.partner_staff FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create coupon claims table (tracks individual user downloads)
CREATE TABLE IF NOT EXISTS public.coupon_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  user_email text,
  user_name text,
  device_id text NOT NULL,
  redemption_code text UNIQUE NOT NULL,
  claimed_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  redeemed boolean DEFAULT false,
  redeemed_at timestamp with time zone,
  redeemed_by uuid,
  share_token text UNIQUE,
  referred_by uuid REFERENCES public.coupon_claims(id),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on coupon_claims
ALTER TABLE public.coupon_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupon_claims
CREATE POLICY "Anyone can view active claims"
ON public.coupon_claims FOR SELECT
USING (redeemed = false);

CREATE POLICY "Anyone can create claims"
ON public.coupon_claims FOR INSERT
WITH CHECK (true);

CREATE POLICY "Staff can update redemptions"
ON public.coupon_claims FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partner_staff
    WHERE user_id = auth.uid()
    AND active = true
  )
);

-- Function to claim a coupon with share tracking
CREATE OR REPLACE FUNCTION public.claim_coupon_with_share(
  p_coupon_id uuid,
  p_device_id text,
  p_user_email text DEFAULT NULL,
  p_user_name text DEFAULT NULL,
  p_referred_by_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim_id uuid;
  v_redemption_code text;
  v_share_token text;
  v_expires_at timestamp with time zone;
  v_referred_by_id uuid;
  v_coupon record;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon FROM public.coupons WHERE id = p_coupon_id AND active = true;
  
  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Coupon not found or inactive');
  END IF;
  
  -- Generate unique codes
  v_redemption_code := encode(gen_random_bytes(8), 'hex');
  v_share_token := encode(gen_random_bytes(16), 'hex');
  v_expires_at := v_coupon.expires_at;
  
  -- Find referring claim if token provided
  IF p_referred_by_token IS NOT NULL THEN
    SELECT id INTO v_referred_by_id 
    FROM public.coupon_claims 
    WHERE share_token = p_referred_by_token;
  END IF;
  
  -- Create claim
  INSERT INTO public.coupon_claims (
    coupon_id,
    device_id,
    user_email,
    user_name,
    redemption_code,
    share_token,
    expires_at,
    referred_by
  ) VALUES (
    p_coupon_id,
    p_device_id,
    p_user_email,
    p_user_name,
    v_redemption_code,
    v_share_token,
    v_expires_at,
    v_referred_by_id
  )
  RETURNING id INTO v_claim_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'claim_id', v_claim_id,
    'redemption_code', v_redemption_code,
    'share_token', v_share_token,
    'expires_at', v_expires_at
  );
END;
$$;

-- Function to redeem coupon via QR code
CREATE OR REPLACE FUNCTION public.redeem_coupon_qr(
  p_redemption_code text,
  p_staff_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim record;
  v_staff_partner_id uuid;
BEGIN
  -- Verify staff member
  SELECT partner_id INTO v_staff_partner_id
  FROM public.partner_staff
  WHERE user_id = p_staff_user_id AND active = true;
  
  IF v_staff_partner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized staff member');
  END IF;
  
  -- Find and validate claim
  SELECT cc.*, c.partner_id
  INTO v_claim
  FROM public.coupon_claims cc
  JOIN public.coupons c ON cc.coupon_id = c.id
  WHERE cc.redemption_code = p_redemption_code;
  
  IF v_claim IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid redemption code');
  END IF;
  
  IF v_claim.redeemed THEN
    RETURN jsonb_build_object('success', false, 'message', 'Coupon already redeemed');
  END IF;
  
  IF v_claim.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Coupon expired');
  END IF;
  
  -- Check if staff can redeem for this partner (NULL partner_id = universal)
  IF v_claim.partner_id IS NOT NULL AND v_claim.partner_id != v_staff_partner_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Coupon not valid at this location');
  END IF;
  
  -- Mark as redeemed
  UPDATE public.coupon_claims
  SET 
    redeemed = true,
    redeemed_at = now(),
    redeemed_by = p_staff_user_id
  WHERE id = v_claim.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Coupon redeemed successfully',
    'claim', jsonb_build_object(
      'user_email', v_claim.user_email,
      'user_name', v_claim.user_name,
      'claimed_at', v_claim.claimed_at
    )
  );
END;
$$;