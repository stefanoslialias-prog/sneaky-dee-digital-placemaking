
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Coupon } from '@/components/CouponPicker';

export interface ClaimCouponParams {
  couponId: string;
  email?: string;
  name?: string;
  deviceId?: string;
}

export interface ClaimCouponResult {
  success: boolean;
  message: string;
  coupon?: Coupon;
  claimedId?: string;
}

/**
 * Fetch all available coupons from Supabase
 */
export const fetchCoupons = async (): Promise<Coupon[]> => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load available offers');
      return [];
    }

    // Transform Supabase data into our Coupon type
    return data.map(coupon => ({
      id: coupon.id,
      title: coupon.title,
      description: coupon.description,
      code: coupon.code,
      discount: coupon.discount,
      expiresIn: formatExpiryDate(coupon.expires_at),
      image: coupon.image_url || undefined
    }));
  } catch (error) {
    console.error('Unexpected error fetching coupons:', error);
    toast.error('Failed to load available offers');
    return [];
  }
};

/**
 * Claim a coupon for a user
 */
export const claimCoupon = async (params: ClaimCouponParams): Promise<ClaimCouponResult> => {
  try {
    // Call our database function to claim the coupon
    const { data, error } = await supabase.rpc(
      'claim_coupon',
      {
        p_coupon_id: params.couponId,
        p_device_id: params.deviceId || null,
        p_email: params.email || null,
        p_name: params.name || null
      }
    );

    if (error) {
      console.error('Error claiming coupon:', error);
      return {
        success: false,
        message: error.message || 'Failed to claim coupon'
      };
    }

    return data as ClaimCouponResult;
  } catch (error: any) {
    console.error('Unexpected error claiming coupon:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Get all coupons claimed by the current user
 */
export const getUserCoupons = async (): Promise<Coupon[]> => {
  try {
    // First check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_coupons')
      .select(`
        id,
        claimed_at,
        redeemed_at,
        coupons (
          id,
          title,
          description,
          code,
          discount,
          expires_at,
          image_url
        )
      `)
      .eq('user_id', session.user.id)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error fetching user coupons:', error);
      return [];
    }

    // Transform to our Coupon type
    return data.map(item => ({
      id: item.coupons.id,
      title: item.coupons.title,
      description: item.coupons.description,
      code: item.coupons.code,
      discount: item.coupons.discount,
      expiresIn: formatExpiryDate(item.coupons.expires_at),
      image: item.coupons.image_url || undefined,
      claimedAt: new Date(item.claimed_at),
      redeemedAt: item.redeemed_at ? new Date(item.redeemed_at) : undefined
    }));
  } catch (error) {
    console.error('Error fetching user coupons:', error);
    return [];
  }
};

/**
 * Format expiry date to human-readable string
 */
const formatExpiryDate = (expiresAt: string): string => {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'Expired';
  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  return `${Math.floor(diffDays / 30)} months`;
};
