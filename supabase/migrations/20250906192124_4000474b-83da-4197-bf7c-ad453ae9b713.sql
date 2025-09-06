
-- Allow admins to view all collected emails in the dashboard
CREATE POLICY "Admins can view all user_emails"
  ON public.user_emails
  FOR SELECT
  USING (is_admin());
