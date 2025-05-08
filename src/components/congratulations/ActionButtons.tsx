
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Coupon } from '../CouponPicker';

interface ActionButtonsProps {
  coupon: Coupon;
  copied: boolean;
  setCopied: (copied: boolean) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ coupon, copied, setCopied }) => {
  const copyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const downloadCoupon = () => {
    // Create a simple text representation of the coupon
    const couponText = 
`Toronto Public WiFi Coupon
-----------------------
${coupon.title}
${coupon.description}
Code: ${coupon.code}
Expires in: ${coupon.expiresIn}
-----------------------
Thank you for your feedback!`;

    const blob = new Blob([couponText], { type: 'text/plain' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `toronto-coupon-${coupon.code}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    
    toast.success('Coupon downloaded!');
  };

  return (
    <div className="flex w-full gap-2">
      <Button 
        variant="outline" 
        className="flex-1 flex items-center justify-center"
        onClick={copyCode}
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
        <span className="ml-1">{copied ? 'Copied' : 'Copy Code'}</span>
      </Button>
      
      <Button 
        variant="outline"
        className="flex-1 flex items-center justify-center"
        onClick={downloadCoupon}
      >
        <Download size={18} />
        <span className="ml-1">Download</span>
      </Button>
    </div>
  );
};
