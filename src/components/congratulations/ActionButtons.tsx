
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download } from 'lucide-react';
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

  const handleDownloadCoupon = () => {
    // Create a simple text file with coupon details
    const couponText = `
${coupon.title}
${coupon.description}

Coupon Code: ${coupon.code}
Discount: ${coupon.discount || 'Special Offer'}
Expires: ${coupon.expiresIn}

Present this coupon at checkout to redeem your discount.
    `.trim();

    const blob = new Blob([couponText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coupon.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_coupon.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Coupon downloaded to your device!');
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

      <div className="flex gap-2">
        <Button 
          onClick={handleDownloadCoupon}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Coupon
        </Button>
        
        <div className="flex-1">
          <WalletButtons 
            couponId={coupon.id}
            deviceId={localStorage.getItem('deviceId') || undefined}
            onSuccess={() => {
              toast.success('Coupon added to your wallet!');
            }}
          />
        </div>
      </div>
    </div>
  );
};
