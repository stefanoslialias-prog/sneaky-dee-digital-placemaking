
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Coupon } from '../CouponPicker';
import { WalletButtons } from '../wallet/WalletButtons';

interface ActionButtonsProps {
  coupon: Coupon;
  copied: boolean;
  setCopied: (copied: boolean) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  coupon, 
  copied, 
  setCopied 
}) => {
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success('Coupon code copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <div className="w-full space-y-3">
      <Button 
        onClick={handleCopyCode} 
        className="w-full bg-toronto-blue hover:bg-toronto-lightblue"
        size="lg"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy Code
          </>
        )}
      </Button>

      <WalletButtons 
        couponId={coupon.id}
        deviceId={localStorage.getItem('deviceId') || undefined}
        onSuccess={() => {
          toast.success('Coupon added to your wallet!');
        }}
      />
    </div>
  );
};
