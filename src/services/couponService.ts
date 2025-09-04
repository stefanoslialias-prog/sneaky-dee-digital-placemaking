
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Coupon } from '@/components/CouponPicker';
import { sanitizeTextInput, sanitizeEmail } from '@/utils/xssProtection';

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
 * Fetch available coupons from Supabase - returns up to 3 random coupons
 */
export const fetchCoupons = async (): Promise<Coupon[]> => {
  try {
    console.log('Fetching coupons from database...');
    
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

    console.log('Raw coupon data from database:', data);

    if (!data || data.length === 0) {
      console.log('No coupons found in database');
      return [];
    }

    // Transform and validate Supabase data
    const transformedCoupons = data
      .filter(coupon => coupon.id && coupon.title && coupon.description) // Basic validation
      .map(coupon => ({
        id: coupon.id,
        title: sanitizeTextInput(coupon.title),
        description: sanitizeTextInput(coupon.description),
        code: sanitizeTextInput(coupon.code),
        discount: coupon.discount ? sanitizeTextInput(coupon.discount) : '',
        expiresIn: formatExpiryDate(coupon.expires_at),
        image: coupon.image_url || undefined
      }));

    console.log('Transformed coupons:', transformedCoupons);

    // If we have multiple coupons, randomly select up to 3
    // If we have fewer than 3, return all available
    let selectedCoupons;
    if (transformedCoupons.length <= 3) {
      selectedCoupons = transformedCoupons;
    } else {
      // Shuffle array and take first 3
      const shuffled = [...transformedCoupons].sort(() => Math.random() - 0.5);
      selectedCoupons = shuffled.slice(0, 3);
    }
    
    console.log('Selected coupons for display:', selectedCoupons);
    return selectedCoupons;
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

    // Sanitize inputs using enhanced XSS protection
    const sanitizedParams = {
      couponId: params.couponId,
      email: params.email ? sanitizeEmail(params.email) : undefined,
      name: params.name ? sanitizeTextInput(params.name, 100) : undefined,
      deviceId: params.deviceId ? sanitizeTextInput(params.deviceId, 50) : undefined
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
        title: sanitizeTextInput(result.coupon.title || ''),
        description: sanitizeTextInput(result.coupon.description || ''),
        code: sanitizeTextInput(result.coupon.code || ''),
        discount: result.coupon.discount ? sanitizeTextInput(result.coupon.discount) : '',
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

    // Transform and validate data with enhanced XSS protection
    return data
      .filter(item => item.coupons && item.coupons.id) // Ensure coupon data exists
      .map(item => ({
        id: item.coupons.id,
        title: sanitizeTextInput(item.coupons.title),
        description: sanitizeTextInput(item.coupons.description),
        code: sanitizeTextInput(item.coupons.code),
        discount: item.coupons.discount ? sanitizeTextInput(item.coupons.discount) : '',
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
