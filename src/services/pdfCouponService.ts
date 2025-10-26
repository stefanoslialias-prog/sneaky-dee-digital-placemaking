import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

export interface CouponClaim {
  id: string;
  coupon_id: string;
  redemption_code: string;
  share_token: string;
  expires_at: string;
  user_email?: string;
  user_name?: string;
  redeemed: boolean;
}

// Validation schemas
const couponClaimSchema = z.object({
  coupon_id: z.string().uuid(),
  device_id: z.string().min(1).max(255),
  user_email: z.string().email().optional(),
  user_name: z.string().max(100).optional(),
  referred_by_token: z.string().optional(),
});

/**
 * Claim a coupon and get a unique redemption code + share link
 */
export const claimCoupon = async (params: {
  couponId: string;
  deviceId: string;
  userEmail?: string;
  userName?: string;
  referralToken?: string;
}): Promise<{ success: boolean; message: string; claim?: CouponClaim }> => {
  try {
    // Validate inputs
    const validated = couponClaimSchema.parse({
      coupon_id: params.couponId,
      device_id: params.deviceId,
      user_email: params.userEmail,
      user_name: params.userName,
      referred_by_token: params.referralToken,
    });

    const { data, error } = await supabase.rpc('claim_coupon_with_share', {
      p_coupon_id: validated.coupon_id,
      p_device_id: validated.device_id,
      p_user_email: validated.user_email,
      p_user_name: validated.user_name,
      p_referred_by_token: validated.referred_by_token,
    });

    if (error) {
      console.error('Error claiming coupon:', error);
      return { success: false, message: 'Failed to claim coupon' };
    }

    if (!data || typeof data !== 'object' || !('success' in data) || !data.success) {
      return { 
        success: false, 
        message: (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') 
          ? data.message 
          : 'Failed to claim coupon' 
      };
    }

    const result = data as {
      success: boolean;
      claim_id: string;
      redemption_code: string;
      share_token: string;
      expires_at: string;
    };

    return {
      success: true,
      message: 'Coupon claimed successfully',
      claim: {
        id: result.claim_id,
        coupon_id: params.couponId,
        redemption_code: result.redemption_code,
        share_token: result.share_token,
        expires_at: result.expires_at,
        user_email: params.userEmail,
        user_name: params.userName,
        redeemed: false,
      },
    };
  } catch (error) {
    console.error('Error in claimCoupon:', error);
    return { success: false, message: 'Invalid input data' };
  }
};

/**
 * Upload a PDF for a coupon
 */
export const uploadCouponPDF = async (
  couponId: string,
  file: File
): Promise<{ success: boolean; message: string; url?: string }> => {
  try {
    if (!file.type.includes('pdf')) {
      return { success: false, message: 'Only PDF files are allowed' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, message: 'File size must be less than 10MB' };
    }

    const fileName = `${couponId}-${Date.now()}.pdf`;
    const { data, error } = await supabase.storage
      .from('coupon-pdfs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, message: 'Failed to upload PDF' };
    }

    const { data: urlData } = supabase.storage
      .from('coupon-pdfs')
      .getPublicUrl(data.path);

    // Update coupon with PDF URL
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', couponId);

    if (updateError) {
      console.error('Error updating coupon:', updateError);
      return { success: false, message: 'Failed to update coupon with PDF' };
    }

    return {
      success: true,
      message: 'PDF uploaded successfully',
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error in uploadCouponPDF:', error);
    return { success: false, message: 'Failed to upload PDF' };
  }
};

/**
 * Generate a shareable link for a coupon
 */
export const generateShareLink = (shareToken: string): string => {
  return `${window.location.origin}/share/${shareToken}`;
};

/**
 * Get coupon details from share token
 */
export const getCouponByShareToken = async (shareToken: string) => {
  try {
    const { data, error } = await supabase
      .from('coupon_claims')
      .select(`
        *,
        coupons (*)
      `)
      .eq('share_token', shareToken)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching coupon by share token:', error);
    return null;
  }
};

/**
 * Redeem a coupon via QR code (partner staff only)
 */
export const redeemCouponQR = async (
  redemptionCode: string,
  staffUserId: string
): Promise<{ success: boolean; message: string; claim?: any }> => {
  try {
    const { data, error } = await supabase.rpc('redeem_coupon_qr', {
      p_redemption_code: redemptionCode,
      p_staff_user_id: staffUserId,
    });

    if (error) {
      console.error('Error redeeming coupon:', error);
      return { success: false, message: 'Failed to redeem coupon' };
    }

    const result = data as {
      success: boolean;
      message: string;
      claim?: any;
    };

    return {
      success: result.success,
      message: result.message,
      claim: result.claim,
    };
  } catch (error) {
    console.error('Error in redeemCouponQR:', error);
    return { success: false, message: 'Failed to redeem coupon' };
  }
};
