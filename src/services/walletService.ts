
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
    console.log('Adding coupon to wallet via PassKit:', walletData);

    // Call the PassKit Edge Function
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
    const { data, error } = await supabase
      .from('user_wallets')
      .select(`
        *,
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
