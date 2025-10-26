-- Drop and recreate the function with correct search path
DROP FUNCTION IF EXISTS public.claim_coupon_with_share(uuid, text, text, text, text);

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
SET search_path = public, pg_catalog
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
  
  -- Generate unique codes using gen_random_bytes from pgcrypto
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
    'expires_at', v_expires_at,
    'message', 'Coupon claimed successfully'
  );
END;
$$;