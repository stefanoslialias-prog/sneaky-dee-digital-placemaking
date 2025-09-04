-- Update RLS policies for user_emails to allow anonymous opt-ins
-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Secure email insert policy" ON public.user_emails;
DROP POLICY IF EXISTS "Secure email access policy" ON public.user_emails;

-- Create new policies that allow anonymous opt-ins via device_id
CREATE POLICY "Allow anonymous opt-ins via device_id" 
ON public.user_emails 
FOR INSERT 
WITH CHECK (
  -- Allow insertions with either authenticated user_id OR anonymous device_id
  (user_id IS NOT NULL AND user_id = auth.uid()) OR 
  (user_id IS NULL AND device_id IS NOT NULL)
);

CREATE POLICY "Users can view their own emails" 
ON public.user_emails 
FOR SELECT 
USING (
  -- Authenticated users can see their emails
  (user_id IS NOT NULL AND user_id = auth.uid()) OR
  -- No one can read anonymous device-based opt-ins for privacy
  false
);

CREATE POLICY "Allow system updates for email processing" 
ON public.user_emails 
FOR UPDATE 
USING (true)  -- Allow Edge Functions to update email status
WITH CHECK (true);