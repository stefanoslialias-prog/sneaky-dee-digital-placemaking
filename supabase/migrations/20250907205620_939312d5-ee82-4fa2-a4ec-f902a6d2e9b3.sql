-- Fix security issue: Remove public access to device MAC addresses
-- Current policy allows viewing devices with user_id = NULL, exposing unlinked devices publicly

-- Drop the existing policy that allows public access to NULL user_id devices
DROP POLICY IF EXISTS "Users can view their own devices" ON public.devices;

-- Create a more secure policy that only allows users to view their own devices
CREATE POLICY "Users can view only their own devices"
  ON public.devices
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to insert devices (for device registration)
CREATE POLICY "Authenticated users can create devices"
  ON public.devices
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own devices (for linking devices to user accounts)
CREATE POLICY "Users can update their own devices"
  ON public.devices
  FOR UPDATE
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid());

-- Allow system operations for device management by admins
CREATE POLICY "Admins can manage all devices"
  ON public.devices
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Note: Anonymous device creation will need to be handled differently
-- Devices with user_id = NULL are no longer publicly readable for security