
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Coupon } from '../CouponPicker';
import { WalletButtons } from '../wallet/WalletButtons';
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface ActionButtonsProps {
  coupon: Coupon;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  userEmail?: string;
  userName?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  coupon, 
  copied, 
  setCopied,
  userEmail,
  userName
}) => {
  const { trackSessionEvent } = useSessionTracking();
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast.success('Coupon code copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
      
      // Track copy event
      trackSessionEvent('copy_code', coupon.id);
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
    
    // Track download event
    trackSessionEvent('download_coupon', coupon.id);
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

      <Button 
        onClick={handleDownloadCoupon}
        className="w-full bg-toronto-blue hover:bg-toronto-lightblue"
        size="lg"
      >
        <Download className="mr-2 h-4 w-4" />
        Download Coupon
      </Button>
    </div>
  );
};
