
import { supabase } from '@/integrations/supabase/client';

export interface WalletPassData {
  couponId: string;
  userId?: string;
  deviceId?: string;
  platform: 'apple' | 'google';
  userEmail?: string;
  userName?: string;
}

/**
 * Add coupon to mobile wallet using PassKit integration
 */
export const addToWallet = async (walletData: WalletPassData): Promise<{ success: boolean; message: string; passUrl?: string }> => {
  try {
    // SECURITY NOTE: Device ID is handled securely - it's sent to the Edge Function 
    // but never stored in client-accessible records due to RLS policies
    console.log('Adding coupon to wallet via PassKit (device ID protected):', { 
      ...walletData, 
      deviceId: walletData.deviceId ? '[PROTECTED]' : undefined 
    });

    // Call the PassKit Edge Function (uses service role key to insert records)
    const { data, error } = await supabase.functions.invoke('passkit-wallet', {
      body: walletData
    });

    if (error) {
      console.error('PassKit Edge Function error:', error);
      return {
        success: false,
        message: 'Failed to create wallet pass'
      };
    }

    console.log('PassKit response:', data);

    if (data.success) {
      return {
        success: true,
        message: data.message,
        passUrl: data.passUrl
      };
    } else {
      return {
        success: false,
        message: data.message || 'Failed to create wallet pass'
      };
    }

  } catch (error) {
    console.error('Error calling PassKit service:', error);
    return {
      success: false,
      message: 'Failed to add coupon to wallet'
    };
  }
};

/**
 * Check if device supports wallet functionality
 */
export const isWalletSupported = (): { apple: boolean; google: boolean } => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  return {
    apple: isIOS,
    google: isAndroid
  };
};

/**
 * Get wallet passes for a user
 */
export const getUserWalletPasses = async (userId: string) => {
  try {
    // SECURITY: This query now only works for authenticated users viewing their own data
    // The RLS policies ensure device_id is never exposed to client-side code
    const { data, error } = await supabase
      .from('user_wallets')
      .select(`
        id,
        claimed_at,
        redeemed_at,
        platform,
        pass_url,
        passkit_status,
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
      .eq('user_id', userId)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error fetching wallet passes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching wallet passes:', error);
    return [];
  }
};
