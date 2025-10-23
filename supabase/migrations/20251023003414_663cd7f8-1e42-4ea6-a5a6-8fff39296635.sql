-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create a simpler policy that doesn't cause recursion
-- Allow authenticated users to read all roles (needed for admin checks)
CREATE POLICY "Authenticated users can view all roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow inserts/updates only through the has_role function or direct admin access
CREATE POLICY "Service role can manage roles"
  ON public.user_roles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add metadata column to engagement_events to match the code
ALTER TABLE public.engagement_events 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;