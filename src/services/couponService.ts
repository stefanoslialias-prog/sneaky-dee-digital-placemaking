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
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate UUID format
 */
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Sanitize text input
 */
const sanitizeText = (text: string): string => {
  return text.trim().replace(/[<>]/g, '');
};

/**
 * Fetch all available coupons from Supabase
 */
export const fetchCoupons = async (): Promise<Coupon[]> => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .gt('expires_at', new Date().toISOString()) // Only fetch non-expired coupons
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load available offers');
      return [];
    }

    if (!data) {
      return [];
    }

    // Transform and validate Supabase data
    return data
      .filter(coupon => coupon.id && coupon.title && coupon.description) // Basic validation
      .map(coupon => ({
        id: coupon.id,
        title: sanitizeText(coupon.title),
        description: sanitizeText(coupon.description),
        code: sanitizeText(coupon.code),
        discount: coupon.discount ? sanitizeText(coupon.discount) : '',
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
 * Claim a coupon for a user with proper validation
 */
export const claimCoupon = async (params: ClaimCouponParams): Promise<ClaimCouponResult> => {
  try {
    // Input validation
    if (!params.couponId || !isValidUUID(params.couponId)) {
      return {
        success: false,
        message: 'Invalid coupon ID'
      };
    }

    if (params.email && !isValidEmail(params.email)) {
      return {
        success: false,
        message: 'Invalid email format'
      };
    }

    if (params.name && (params.name.length < 1 || params.name.length > 100)) {
      return {
        success: false,
        message: 'Name must be between 1 and 100 characters'
      };
    }

    if (params.deviceId && params.deviceId.length < 10) {
      return {
        success: false,
        message: 'Invalid device ID'
      };
    }

    // Sanitize inputs
    const sanitizedParams = {
      couponId: params.couponId,
      email: params.email ? sanitizeText(params.email.toLowerCase()) : undefined,
      name: params.name ? sanitizeText(params.name) : undefined,
      deviceId: params.deviceId ? sanitizeText(params.deviceId) : undefined
    };

    // Call database function with validated inputs
    const { data, error } = await supabase.rpc(
      'claim_coupon',
      {
        p_coupon_id: sanitizedParams.couponId,
        p_device_id: sanitizedParams.deviceId || null,
        p_email: sanitizedParams.email || null,
        p_name: sanitizedParams.name || null
      }
    );

    if (error) {
      console.error('Error claiming coupon:', error);
      return {
        success: false,
        message: 'Failed to claim coupon. Please try again.'
      };
    }

    // Validate and safely convert response data
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {
        success: false,
        message: 'Invalid response from server'
      };
    }

    // Type-safe conversion of JSON response
    const result = data as Record<string, any>;
    
    // Validate required fields exist
    if (typeof result.success !== 'boolean' || typeof result.message !== 'string') {
      return {
        success: false,
        message: 'Invalid response format from server'
      };
    }

    return {
      success: result.success,
      message: result.message,
      coupon: result.coupon ? {
        id: result.coupon.id,
        title: sanitizeText(result.coupon.title || ''),
        description: sanitizeText(result.coupon.description || ''),
        code: sanitizeText(result.coupon.code || ''),
        discount: result.coupon.discount ? sanitizeText(result.coupon.discount) : '',
        expiresIn: formatExpiryDate(result.coupon.expires_at),
        image: result.coupon.image_url || undefined
      } : undefined,
      claimedId: result.claimed_id || undefined
    };
  } catch (error: any) {
    console.error('Unexpected error claiming coupon:', error);
    return {
      success: false,
      message: 'An unexpected error occurred'
    };
  }
};

/**
 * Get all coupons claimed by the current authenticated user
 */
export const getUserCoupons = async (): Promise<Coupon[]> => {
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return [];
    }

    if (!session?.user?.id) {
      console.log('No authenticated user');
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

    if (!data) {
      return [];
    }

    // Transform and validate data
    return data
      .filter(item => item.coupons && item.coupons.id) // Ensure coupon data exists
      .map(item => ({
        id: item.coupons.id,
        title: sanitizeText(item.coupons.title),
        description: sanitizeText(item.coupons.description),
        code: sanitizeText(item.coupons.code),
        discount: item.coupons.discount ? sanitizeText(item.coupons.discount) : '',
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
 * Format expiry date to human-readable string with validation
 */
const formatExpiryDate = (expiresAt: string): string => {
  try {
    const expiry = new Date(expiresAt);
    
    // Validate date
    if (isNaN(expiry.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return '1 day';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    return `${Math.floor(diffDays / 30)} months`;
  } catch (error) {
    console.error('Error formatting expiry date:', error);
    return 'Unknown';
  }
};
