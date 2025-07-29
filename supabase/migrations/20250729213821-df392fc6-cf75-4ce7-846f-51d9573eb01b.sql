-- CRITICAL SECURITY FIX: Remove privilege escalation vulnerability
-- Drop the dangerous policy that allows users to insert their own roles
DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;

-- Drop conflicting policies on user_roles table
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own roles" ON public.user_roles;

-- Create secure admin-only policies for user_roles
CREATE POLICY "Only admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- CLEAN UP CONFLICTING RLS POLICIES ON SURVEY_QUESTIONS
-- Remove all the conflicting "Anyone can..." policies
DROP POLICY IF EXISTS "Anyone can delete survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Anyone can insert survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Anyone can select survey questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Anyone can update survey questions" ON public.survey_questions;

-- Remove redundant admin policies
DROP POLICY IF EXISTS "Admins can delete questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Admins can insert questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Admins can update questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Admins can view questions" ON public.survey_questions;

-- Remove old admin policies with different naming
DROP POLICY IF EXISTS "Allow admins to delete survey_questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Allow admins to insert survey_questions" ON public.survey_questions;
DROP POLICY IF EXISTS "Allow admins to update survey_questions" ON public.survey_questions;

-- Keep only the secure, consistent policies
-- The following policies should remain:
-- "Only admins can delete questions"
-- "Only admins can insert questions" 
-- "Only admins can update questions"
-- "Anyone can view active questions" (for public survey access)
-- "Allow authenticated users to select survey_questions" (for general access)

-- FIX SECURITY DEFINER FUNCTIONS: Add proper search_path
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role text)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = $1
    AND role = $2
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- Create a secure function for admin role assignment
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
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