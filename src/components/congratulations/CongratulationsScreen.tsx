
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Coupon } from '../CouponPicker';
import { CouponDisplay } from './CouponDisplay';
import { ClaimStatus } from './ClaimStatus';
import { OptInPrompt } from './OptInPrompt';
import { ActionButtons } from './ActionButtons';
import { claimCoupon } from '@/services/couponService';

interface CongratulationsScreenProps {
  coupon: Coupon;
  onOptInYes: () => void;
  onOptInNo: () => void;
  onDone?: () => void;
  userInfo?: {
    email?: string;
    name?: string;
    provider?: string;
  } | null;
}

const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({ 
  coupon, 
  onOptInYes,
  onOptInNo,
  userInfo
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
        deviceId,
        email: userInfo?.email,
        name: userInfo?.name
      });
      
      if (result.success) {
        setClaimed(true);
      } else {
        console.error('Failed to claim coupon:', result.message);
      }
    } catch (error) {
      console.error('Error claiming coupon:', error);
    } finally {
      setIsClaiming(false);
    }
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
          <CouponDisplay coupon={coupon} />
          <ClaimStatus isClaiming={isClaiming} claimed={claimed} coupon={coupon} />
          <OptInPrompt onOptInYes={onOptInYes} onOptInNo={onOptInNo} />
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <ActionButtons 
            coupon={coupon} 
            copied={copied} 
            setCopied={setCopied}
            userEmail={userInfo?.email}
            userName={userInfo?.name}
          />
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

export { CongratulationsScreen };
