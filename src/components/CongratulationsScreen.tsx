
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Copy, Download, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Coupon } from './CouponPicker';
import Confetti from 'react-confetti';

interface CongratulationsScreenProps {
  coupon: Coupon;
  onDone: () => void;
}

const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({ coupon, onDone }) => {
  const [copied, setCopied] = useState(false);
  const [confettiActive, setConfettiActive] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // Stop the confetti after 5 seconds
    const timer = setTimeout(() => {
      setConfettiActive(false);
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

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
      {confettiActive && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.15}
        />
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
              🎉 Your {getDiscountPercentage()} coupon has been sent to your e-wallet!
            </p>
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
          
          <Button 
            variant="default" 
            className="w-full bg-toronto-blue hover:bg-toronto-lightblue"
            onClick={onDone}
          >
            Done
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CongratulationsScreen;
