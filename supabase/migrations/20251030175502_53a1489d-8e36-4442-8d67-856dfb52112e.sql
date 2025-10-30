-- Create user_wallets table for storing wallet passes
CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('apple', 'google')),
  passkit_coupon_id TEXT NOT NULL,
  pass_url TEXT NOT NULL,
  passkit_status TEXT DEFAULT 'issued',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet passes
CREATE POLICY "Users can view their own wallet passes"
  ON public.user_wallets
  FOR SELECT
  USING (user_id = auth.uid() OR device_id IS NOT NULL);

-- Service role can insert wallet passes
CREATE POLICY "Service role can insert wallet passes"
  ON public.user_wallets
  FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Add updated_at trigger
CREATE TRIGGER update_user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX idx_user_wallets_device_id ON public.user_wallets(device_id);
CREATE INDEX idx_user_wallets_coupon_id ON public.user_wallets(coupon_id);