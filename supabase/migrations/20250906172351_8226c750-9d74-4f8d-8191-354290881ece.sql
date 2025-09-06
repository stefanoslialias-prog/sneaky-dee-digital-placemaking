
-- Update claim_coupon to return coupon details even if already claimed,
-- preventing duplicate records while allowing the UI to display the code.

CREATE OR REPLACE FUNCTION public.claim_coupon(
  p_coupon_id uuid,
  p_device_id text DEFAULT NULL::text,
  p_email text DEFAULT NULL::text,
  p_name text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon_record public.coupons%ROWTYPE;
  v_user_id UUID;
  v_claimed_id UUID;
  v_already_claimed boolean := false;
BEGIN
  -- Get current user ID if authenticated
  v_user_id := auth.uid();

  -- Check if the coupon exists and is active and not expired
  SELECT * INTO v_coupon_record
  FROM public.coupons
  WHERE id = p_coupon_id AND active = true AND expires_at > now();

  IF v_coupon_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Coupon not found or expired'
    );
  END IF;

  -- Check if user has already claimed this coupon
  IF v_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_coupons
    WHERE coupon_id = p_coupon_id AND user_id = v_user_id
  ) THEN
    v_already_claimed := true;
  ELSIF p_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_coupons
    WHERE coupon_id = p_coupon_id AND email = p_email
  ) THEN
    v_already_claimed := true;
  END IF;

  -- Record the coupon claim only if not already claimed
  IF NOT v_already_claimed THEN
    INSERT INTO public.user_coupons (user_id, coupon_id, device_id, email, name)
    VALUES (v_user_id, p_coupon_id, p_device_id, p_email, p_name)
    RETURNING id INTO v_claimed_id;
  END IF;

  -- Always return the coupon details so the UI can display the code
  RETURN json_build_object(
    'success', true,
    'message', CASE 
                WHEN v_already_claimed 
                  THEN 'You have already claimed this coupon' 
                ELSE 'Coupon claimed successfully' 
               END,
    'already_claimed', v_already_claimed,
    'coupon', json_build_object(
      'id', v_coupon_record.id,
      'title', v_coupon_record.title,
      'description', v_coupon_record.description,
      'code', v_coupon_record.code,
      'discount', v_coupon_record.discount,
      'expires_at', v_coupon_record.expires_at,
      'image_url', v_coupon_record.image_url
    ),
    'claimed_id', v_claimed_id
  );
END;
$function$;
