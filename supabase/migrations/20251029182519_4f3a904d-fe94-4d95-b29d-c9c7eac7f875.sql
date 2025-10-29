-- Create location_traffic table for WiFi AP data (vendor-agnostic)
CREATE TABLE IF NOT EXISTS public.location_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.wifi_locations(id) ON DELETE CASCADE,
  device_count INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_location_traffic_location_timestamp 
  ON public.location_traffic(location_id, timestamp DESC);

-- Enable RLS
ALTER TABLE public.location_traffic ENABLE ROW LEVEL SECURITY;

-- Allow public read access for dashboard
CREATE POLICY "Traffic data is viewable by everyone"
  ON public.location_traffic
  FOR SELECT
  USING (true);

-- Service role can insert traffic data (via edge function)
CREATE POLICY "Service role can insert traffic data"
  ON public.location_traffic
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Create API keys table for router authentication
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location_id UUID REFERENCES public.wifi_locations(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for API keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys using the existing has_role function
CREATE POLICY "Admins can manage API keys"
  ON public.api_keys
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can validate and update API keys
CREATE POLICY "Service role can manage API keys"
  ON public.api_keys
  FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_traffic;