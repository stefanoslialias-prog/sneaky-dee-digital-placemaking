
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { addToWallet, isWalletSupported, type WalletPassData } from '@/services/walletService';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface WalletButtonsProps {
  couponId: string;
  userId?: string;
  deviceId?: string;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void;
}

export const WalletButtons: React.FC<WalletButtonsProps> = ({ 
  couponId, 
  userId, 
  deviceId,
  userEmail,
  userName,
  onSuccess 
}) => {
  const [isAdding, setIsAdding] = useState<'apple' | 'google' | null>(null);
  const walletSupport = isWalletSupported();
  const { trackSessionEvent } = useSessionTracking();

  const handleAddToWallet = async () => {
    // Determine which platform to use based on device, default to apple if neither detected
    const platform = walletSupport.apple ? 'apple' : 'google';
    
    setIsAdding(platform);
    
    try {
      const walletData: WalletPassData = {
        couponId,
        userId,
        deviceId,
        userEmail,
        userName,
        platform
      };

      console.log('Adding to wallet with data:', walletData);

      const result = await addToWallet(walletData);
      
      if (result.success) {
        toast.success(result.message);
        onSuccess?.();
        
        // Track wallet add event
        trackSessionEvent('pass_added', couponId);
        
        // If we have a pass URL, try to open it
        if (result.passUrl && platform === 'apple') {
          // For Apple Wallet, we can try to open the pass URL
          setTimeout(() => {
            window.open(result.passUrl, '_blank');
          }, 1000);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to add to wallet');
      console.error('Wallet error:', error);
    } finally {
      setIsAdding(null);
    }
  };

  // Always show the wallet button - let users try to add it regardless of device detection
  const walletName = walletSupport.apple ? 'Apple Wallet' : 'Google Pay';

  return null;
};
