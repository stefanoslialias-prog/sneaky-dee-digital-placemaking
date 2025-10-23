-- Create partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners are viewable by everyone"
  ON public.partners FOR SELECT
  USING (true);

-- Create survey_questions table with options column
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'sentiment',
  "order" INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN DEFAULT true,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Survey questions are viewable by everyone"
  ON public.survey_questions FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage questions"
  ON public.survey_questions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  answer TEXT,
  comment TEXT,
  session_id TEXT,
  location_id TEXT,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Survey responses are viewable by everyone"
  ON public.survey_responses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert survey responses"
  ON public.survey_responses FOR INSERT
  WITH CHECK (true);

-- Create function to insert survey response
CREATE OR REPLACE FUNCTION public.insert_survey_response(
  p_question_id UUID,
  p_answer TEXT,
  p_session_id TEXT,
  p_comment TEXT DEFAULT NULL,
  p_location_id TEXT DEFAULT NULL,
  p_partner_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response_id UUID;
BEGIN
  INSERT INTO public.survey_responses (
    question_id,
    answer,
    comment,
    session_id,
    location_id,
    partner_id
  ) VALUES (
    p_question_id,
    p_answer,
    p_comment,
    p_session_id,
    p_location_id,
    p_partner_id
  ) RETURNING id INTO v_response_id;
  
  RETURN v_response_id;
END;
$$;

-- Create engagement_events table
CREATE TABLE public.engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert engagement events"
  ON public.engagement_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Engagement events are viewable by everyone"
  ON public.engagement_events FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_survey_questions_partner ON public.survey_questions(partner_id);
CREATE INDEX idx_survey_questions_order ON public.survey_questions("order");
CREATE INDEX idx_survey_responses_question ON public.survey_responses(question_id);
CREATE INDEX idx_survey_responses_session ON public.survey_responses(session_id);
CREATE INDEX idx_engagement_events_session ON public.engagement_events(session_id);