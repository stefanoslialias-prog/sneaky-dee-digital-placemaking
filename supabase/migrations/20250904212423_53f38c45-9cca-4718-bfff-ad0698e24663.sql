-- CRITICAL SECURITY FIX: Properly secure user_emails table
-- The issue is that emails are linked by device_id for anonymous users, not user_id

-- Drop the current insufficient policies
DROP POLICY IF EXISTS "Users can view only their own emails" ON public.user_emails;
DROP POLICY IF EXISTS "Users can insert their own emails" ON public.user_emails;

-- Create comprehensive RLS policies that handle both authenticated and anonymous users
-- For SELECT: Only allow if user owns the record OR it's their device
CREATE POLICY "Secure email access policy" 
  ON public.user_emails 
  FOR SELECT 
  USING (
    -- Allow if user_id matches authenticated user
    (user_id IS NOT NULL AND user_id = auth.uid()) 
    OR 
    -- For anonymous users, restrict to server-side access only (no client access to device_id records)
    (user_id IS NULL AND false)
  );

-- For INSERT: Only allow authenticated users to insert their own emails
CREATE POLICY "Secure email insert policy" 
  ON public.user_emails 
  FOR INSERT 
  WITH CHECK (
    user_id IS NOT NULL AND user_id = auth.uid()
  );

-- Create a separate policy for system/server operations (Edge Functions)
-- This should only be used by server-side code, not client-side
CREATE POLICY "System email operations" 
  ON public.user_emails 
  FOR ALL
  USING (false) -- Deny all client access
  WITH CHECK (false); -- Deny all client access

-- Add a comment to document this security measure
COMMENT ON TABLE public.user_emails IS 'SECURITY: Email records with device_id (anonymous users) should only be accessible via server-side Edge Functions, never directly from client-side code. All client access requires user_id authentication.';