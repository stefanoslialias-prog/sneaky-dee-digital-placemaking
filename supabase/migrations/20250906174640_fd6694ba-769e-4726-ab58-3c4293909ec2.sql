-- Create partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create policies for partners
CREATE POLICY "Anyone can view active partners" 
ON public.partners 
FOR SELECT 
USING (active = true);

CREATE POLICY "Only admins can manage partners" 
ON public.partners 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Add partner_id to coupons table
ALTER TABLE public.coupons 
ADD COLUMN partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- Add partner_id to survey_questions table
ALTER TABLE public.survey_questions 
ADD COLUMN partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- Add partner_id to survey_responses table
ALTER TABLE public.survey_responses 
ADD COLUMN partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- Update coupons RLS policies to include partner filtering
DROP POLICY IF EXISTS "Allow anonymous coupon browsing (limited data)" ON public.coupons;
CREATE POLICY "Allow anonymous coupon browsing (limited data)" 
ON public.coupons 
FOR SELECT 
USING ((active = true) AND (expires_at > now()));

-- Update survey_questions RLS policies to include partner filtering
DROP POLICY IF EXISTS "Anyone can view active questions" ON public.survey_questions;
CREATE POLICY "Anyone can view active questions" 
ON public.survey_questions 
FOR SELECT 
USING ((active = true) OR has_role(auth.uid(), 'admin'));

-- Insert initial partner data
INSERT INTO public.partners (name, slug, description, active) VALUES 
('Kingsway Fish and Chips', 'kingsway-fish-chips', 'Traditional fish and chips restaurant', true),
('Test 2', 'test-2', 'Test partner for development', true),
('Test 3', 'test-3', 'Another test partner for development', true);

-- Create trigger for updating partner timestamps
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();