-- Add DELETE policy for admins on engagement_events table
CREATE POLICY "Admins can delete engagement events" 
ON public.engagement_events 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));