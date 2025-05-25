
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WalletPassData {
  couponId: string;
  userId?: string;
  deviceId?: string;
  platform: 'apple' | 'google';
}

/**
 * Generate Apple Wallet pass data
 */
const generateApplePassData = (coupon: any) => {
  return {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.yourcompany.coupon",
    serialNumber: coupon.id,
    teamIdentifier: "YOUR_TEAM_ID",
    organizationName: "Your Business",
    description: coupon.title,
    logoText: "Shop Local Win Local",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(60, 90, 190)",
    coupon: {
      primaryFields: [
        {
          key: "title",
          label: "Offer",
          value: coupon.title
        }
      ],
      secondaryFields: [
        {
          key: "code",
          label: "Code",
          value: coupon.code
        },
        {
          key: "discount",
          label: "Discount",
          value: coupon.discount
        }
      ],
      auxiliaryFields: [
        {
          key: "expires",
          label: "Expires",
          value: coupon.expires_at
        }
      ]
    },
    barcode: {
      message: coupon.code,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1"
    }
  };
};

/**
 * Generate Google Pay pass data
 */
const generateGooglePassData = (coupon: any) => {
  return {
    iss: "YOUR_SERVICE_ACCOUNT_EMAIL",
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: {
      genericObjects: [
        {
          id: `${coupon.id}`,
          classId: "YOUR_CLASS_ID",
          genericType: "GENERIC_TYPE_UNSPECIFIED",
          hexBackgroundColor: "#3C5ABE",
          logo: {
            sourceUri: {
              uri: "https://your-domain.com/logo.png"
            }
          },
          cardTitle: {
            defaultValue: {
              language: "en",
              value: coupon.title
            }
          },
          subheader: {
            defaultValue: {
              language: "en",
              value: "Coupon Code"
            }
          },
          header: {
            defaultValue: {
              language: "en",
              value: coupon.code
            }
          },
          textModulesData: [
            {
              id: "discount",
              header: "Discount",
              body: coupon.discount
            },
            {
              id: "expires",
              header: "Expires",
              body: coupon.expires_at
            }
          ],
          barcode: {
            type: "QR_CODE",
            value: coupon.code
          }
        }
      ]
    }
  };
};

/**
 * Add coupon to mobile wallet
 */
export const addToWallet = async (walletData: WalletPassData): Promise<{ success: boolean; message: string; passUrl?: string }> => {
  try {
    // Get the coupon details
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', walletData.couponId)
      .single();

    if (couponError || !coupon) {
      return {
        success: false,
        message: 'Coupon not found'
      };
    }

    // Generate platform-specific pass data
    let passPayload;
    if (walletData.platform === 'apple') {
      passPayload = generateApplePassData(coupon);
    } else {
      passPayload = generateGooglePassData(coupon);
    }

    // Save to user_wallets table
    const { error: insertError } = await supabase
      .from('user_wallets')
      .insert({
        user_id: walletData.userId,
        coupon_id: walletData.couponId,
        device_id: walletData.deviceId,
        platform: walletData.platform
      });

    if (insertError) {
      console.error('Error saving wallet entry:', insertError);
      return {
        success: false,
        message: 'Failed to save wallet entry'
      };
    }

    // Update coupon with wallet data
    await supabase
      .from('coupons')
      .update({
        pass_type: walletData.platform,
        pass_payload: passPayload,
        wallet_compatible: true
      })
      .eq('id', walletData.couponId);

    // For demo purposes, we'll return a success message
    // In production, you'd generate actual wallet passes using Apple/Google APIs
    return {
      success: true,
      message: `Coupon added to ${walletData.platform === 'apple' ? 'Apple Wallet' : 'Google Pay'}!`,
      passUrl: `wallet://${walletData.platform}/pass/${walletData.couponId}`
    };

  } catch (error) {
    console.error('Error adding to wallet:', error);
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
