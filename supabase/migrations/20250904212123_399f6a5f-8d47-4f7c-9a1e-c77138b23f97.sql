-- Phase 1: Fix Customer Data Exposure (CRITICAL)
-- Update user_coupons RLS policy to only allow users to see their own data
DROP POLICY IF EXISTS "Users can view their own claimed coupons" ON public.user_coupons;
DROP POLICY IF EXISTS "Users can claim coupons" ON public.user_coupons;

-- Create secure RLS policies for user_coupons
CREATE POLICY "Users can view only their own coupons" 
  ON public.user_coupons 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can claim their own coupons" 
  ON public.user_coupons 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Update user_emails RLS policy to only allow users to see their own data
DROP POLICY IF EXISTS "Users can view their own emails" ON public.user_emails;
DROP POLICY IF EXISTS "Users can insert their own emails" ON public.user_emails;

-- Create secure RLS policies for user_emails
CREATE POLICY "Users can view only their own emails" 
  ON public.user_emails 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own emails" 
  ON public.user_emails 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Phase 4: Database Security Hardening
-- Fix search_path configuration in security definer functions
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = $1
    AND role = $2
  );
$$ LANGUAGE sql 
SECURITY DEFINER 
STABLE 
SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

CREATE OR REPLACE FUNCTION public.record_question_interaction(p_ip_address text, p_question_id uuid)
RETURNS uuid AS $$
DECLARE
  v_interaction_id UUID;
BEGIN
  -- Insert the new interaction
  INSERT INTO public.user_interactions (ip_address, question_id)
  VALUES (p_ip_address, p_question_id)
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_random_question_for_ip(p_ip_address text)
RETURNS TABLE(id uuid, text text, type text, category text) AS $$
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.claim_coupon(p_coupon_id uuid, p_device_id text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_name text DEFAULT NULL::text)
RETURNS json AS $$
DECLARE
  v_coupon_record public.coupons%ROWTYPE;
  v_user_id UUID;
  v_result JSON;
  v_claimed_id UUID;
BEGIN
  -- Get current user ID if authenticated
  v_user_id := auth.uid();
  
  -- Check if the coupon exists and is active
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
    RETURN json_build_object(
      'success', false,
      'message', 'You have already claimed this coupon'
    );
  END IF;
  
  -- If checking by email for guest users
  IF p_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_coupons
    WHERE coupon_id = p_coupon_id AND email = p_email
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'This email has already claimed this coupon'
    );
  END IF;
  
  -- Record the coupon claim
  INSERT INTO public.user_coupons (user_id, coupon_id, device_id, email, name)
  VALUES (v_user_id, p_coupon_id, p_device_id, p_email, p_name)
  RETURNING id INTO v_claimed_id;
  
  -- Return success response
  RETURN json_build_object(
    'success', true,
    'message', 'Coupon claimed successfully',
    'coupon', json_build_object(
      'id', v_coupon_record.id,
      'title', v_coupon_record.title,
      'description', v_coupon_record.description,
      'code', v_coupon_record.code,
      'discount', v_coupon_record.discount,
      'expires_at', v_coupon_record.expires_at
    ),
    'claimed_id', v_claimed_id
  );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;