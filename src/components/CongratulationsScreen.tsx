
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Copy, Download, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Coupon } from './CouponPicker';
import { Label } from '@/components/ui/label';
import { claimCoupon } from '@/services/couponService';

interface CongratulationsScreenProps {
  coupon: Coupon;
  onOptInYes: () => void;
  onOptInNo: () => void;
  onDone?: () => void; // Made optional with the '?' operator
}

const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({ 
  coupon, 
  onOptInYes,
  onOptInNo
}) => {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    // Automatically claim the coupon when component mounts
    const claimSelectedCoupon = async () => {
      if (!claimed && !isClaiming) {
        await handleClaimCoupon();
      }
    };
    
    claimSelectedCoupon();

    return () => clearTimeout(timer);
  }, []);

  const handleClaimCoupon = async () => {
    try {
      setIsClaiming(true);
      
      // Get device ID if available (this would come from your WiFi sniffer)
      // For demo purposes, we'll generate a random device ID
      const deviceId = `demo-device-${Math.random().toString(36).substring(7)}`;
      
      const result = await claimCoupon({
        couponId: coupon.id,
        deviceId
      });
      
      if (result.success) {
        toast.success('Coupon claimed successfully!');
        setClaimed(true);
      } else {
        console.error('Failed to claim coupon:', result.message);
        toast.error(result.message || 'Failed to claim coupon');
      }
    } catch (error) {
      console.error('Error claiming coupon:', error);
      toast.error('Failed to claim coupon. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

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

  // Extract percentage from the title if it exists
  const getDiscountPercentage = () => {
    if (coupon.discount) {
      return coupon.discount;
    }
    if (coupon.title.includes('%')) {
      const match = coupon.title.match(/(\d+)%/);
      return match ? match[0] : '';
    }
    return '';
  };

  return (
    <div className="w-full max-w-md mx-auto relative">
      {showConfetti && (
        <div className="confetti-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className={`confetti confetti-${i % 5}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][i % 6]
              }}
            />
          ))}
        </div>
      )}
      
      <Card className="w-full">
        <CardHeader>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-playfair">Congratulations! 🎉</h2>
            <p className="text-gray-600">Thanks for completing our survey</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-toronto-gray shadow-inner border border-toronto-blue/20">
            <div className="flex flex-col items-center mb-3">
              <div className="w-20 h-20 rounded-full bg-toronto-blue/10 flex items-center justify-center mb-4">
                <img 
                  src={coupon.image || '/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png'}
                  alt="Shop Local Win Local" 
                  className="h-16 w-16 object-contain rounded-full"
                  onError={(e) => {
                    // Fallback to logo
                    e.currentTarget.src = '/lovable-uploads/68284ad5-d0ad-4d79-9dcb-65d03682dbcd.png';
                  }}
                />
              </div>
              
              <h3 className="font-bold text-xl text-toronto-blue">{coupon.title}</h3>
              <p className="text-gray-600 text-center mt-2">{coupon.description}</p>
            </div>
            
            <div className="mt-6">
              <div className="p-3 bg-white border-2 border-dashed border-toronto-blue rounded-md text-center">
                <p className="text-sm text-gray-500">Your code:</p>
                <p className="font-mono font-bold text-xl">{coupon.code}</p>
                <p className="text-sm text-gray-500 mt-2">Expires in {coupon.expiresIn}</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-green-50 text-green-700 rounded-md text-center">
            <p className="font-medium">
              {isClaiming ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing your coupon...
                </span>
              ) : claimed ? (
                <>🎉 Your {getDiscountPercentage()} coupon has been sent to your e-wallet!</>
              ) : (
                <>Your {getDiscountPercentage()} coupon is ready to use</>
              )}
            </p>
          </div>
          
          {/* Yes/No Options with direct actions */}
          <div className="p-4 border rounded-md bg-toronto-gray/50">
            <Label className="font-medium block mb-3 text-center">
              Would you like to receive more exclusive offers?
            </Label>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="default"
                size="sm"
                className="bg-toronto-blue hover:bg-toronto-lightblue"
                onClick={onOptInYes}
              >
                Yes
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={onOptInNo}
              >
                No
              </Button>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
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
        </CardFooter>
      </Card>

      <style>
        {`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(360deg);
            opacity: 0;
          }
        }
        `}
      </style>
    </div>
  );
};

export default CongratulationsScreen;
