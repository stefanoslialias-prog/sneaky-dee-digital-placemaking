
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { addToWallet, isWalletSupported, type WalletPassData } from '@/services/walletService';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';

interface WalletButtonsProps {
  couponId: string;
  userId?: string;
  deviceId?: string;
  onSuccess?: () => void;
}

export const WalletButtons: React.FC<WalletButtonsProps> = ({ 
  couponId, 
  userId, 
  deviceId,
  onSuccess 
}) => {
  const [isAdding, setIsAdding] = useState<'apple' | 'google' | null>(null);
  const walletSupport = isWalletSupported();

  const handleAddToWallet = async () => {
    // Determine which platform to use based on device
    const platform = walletSupport.apple ? 'apple' : 'google';
    
    setIsAdding(platform);
    
    try {
      const walletData: WalletPassData = {
        couponId,
        userId,
        deviceId,
        platform
      };

      const result = await addToWallet(walletData);
      
      if (result.success) {
        toast.success(result.message);
        onSuccess?.();
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

  if (!walletSupport.apple && !walletSupport.google) {
    return null;
  }

  const walletName = walletSupport.apple ? 'Apple Wallet' : 'Google Pay';

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleAddToWallet}
      disabled={isAdding !== null}
      className="w-full flex items-center gap-2"
    >
      <Wallet className="h-4 w-4" />
      {isAdding ? 'Adding...' : `Add to ${walletName}`}
    </Button>
  );
};
