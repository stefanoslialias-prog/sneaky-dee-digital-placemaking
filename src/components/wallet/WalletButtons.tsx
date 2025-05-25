
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { addToWallet, isWalletSupported, type WalletPassData } from '@/services/walletService';
import { toast } from 'sonner';
import { Smartphone, Wallet } from 'lucide-react';

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

  const handleAddToWallet = async (platform: 'apple' | 'google') => {
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

  return (
    <div className="flex flex-col gap-2 mt-4">
      <p className="text-sm text-gray-600 text-center mb-2">
        Add to your mobile wallet:
      </p>
      
      <div className="flex gap-2 justify-center">
        {walletSupport.apple && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddToWallet('apple')}
            disabled={isAdding === 'apple'}
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            {isAdding === 'apple' ? 'Adding...' : 'Apple Wallet'}
          </Button>
        )}
        
        {walletSupport.google && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddToWallet('google')}
            disabled={isAdding === 'google'}
            className="flex items-center gap-2"
          >
            <Smartphone className="h-4 w-4" />
            {isAdding === 'google' ? 'Adding...' : 'Google Pay'}
          </Button>
        )}
      </div>
    </div>
  );
};
