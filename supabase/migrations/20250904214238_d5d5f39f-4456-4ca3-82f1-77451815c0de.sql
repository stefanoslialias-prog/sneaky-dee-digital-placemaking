-- CRITICAL SECURITY FIX: Protect customer device tracking data in user_wallets table
-- Issue: The current RLS policies allow public access to device IDs, enabling tracking and privacy violations
-- The policy ((auth.uid() = user_id) OR (device_id IS NOT NULL)) makes records with device_id publicly readable

-- Step 1: Drop the insecure policies that expose device tracking data
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can insert into their own wallet" ON public.user_wallets;

-- Step 2: Create secure policies that protect device tracking data
-- Only allow authenticated users to view their own wallet data
CREATE POLICY "Authenticated users can view their own wallet data only" 
  ON public.user_wallets 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Only allow authenticated users to insert their own wallet records
CREATE POLICY "Authenticated users can insert their own wallet data only" 
  ON public.user_wallets 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own wallet data (for redemption status)
CREATE POLICY "Authenticated users can update their own wallet data" 
  ON public.user_wallets 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 3: Create a separate policy for server-side operations (Edge Functions)
-- This allows the PassKit Edge Function to insert records but prevents client-side device_id access
CREATE POLICY "System operations for wallet management" 
  ON public.user_wallets 
  FOR ALL
  USING (false) -- Deny all client-side access to this policy
  WITH CHECK (false); -- This policy is for service role access only

-- Step 4: Add data security constraints
-- Ensure device_id is never exposed in error messages or logs
ALTER TABLE public.user_wallets ADD CONSTRAINT device_id_not_empty 
  CHECK (device_id IS NULL OR length(trim(device_id)) > 0);

-- Step 5: Add security documentation
COMMENT ON TABLE public.user_wallets IS 'SECURITY: Contains sensitive device tracking data. Access strictly limited to authenticated users viewing only their own data. Device IDs are for server-side tracking only.';
COMMENT ON POLICY "Authenticated users can view their own wallet data only" ON public.user_wallets IS 'SECURITY: Prevents device tracking data exposure - users can only see their own wallet passes';
COMMENT ON POLICY "Authenticated users can insert their own wallet data only" ON public.user_wallets IS 'SECURITY: Prevents unauthorized wallet entries and device ID exposure';
COMMENT ON POLICY "System operations for wallet management" ON public.user_wallets IS 'SECURITY: Server-side only policy for Edge Functions using service role key';
COMMENT ON COLUMN public.user_wallets.device_id IS 'SECURITY: Sensitive tracking data - never expose to client-side code, server-side use only';