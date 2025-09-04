-- Remove the conflicting "System email operations" policy that's blocking all access
DROP POLICY IF EXISTS "System email operations" ON public.user_emails;

-- Test the insertion to make sure it works now