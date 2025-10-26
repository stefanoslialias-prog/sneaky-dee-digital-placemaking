
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { Coupon } from '../CouponPicker';
import { CouponDisplay } from './CouponDisplay';
import { ClaimStatus } from './ClaimStatus';
import { OptInPrompt } from './OptInPrompt';
import { EmailOptIn } from './EmailOptIn';
import { ActionButtons } from './ActionButtons';
import { claimCoupon } from '@/services/couponService';
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface CongratulationsScreenProps {
  coupon: Coupon;
  onOptInYes: () => void;
  onOptInNo: () => void;
  onDone?: () => void;
  showEmailOptIn?: boolean;
  onEmailOptInComplete?: (email?: string) => void;
  onEmailOptInSkip?: () => void;
  userInfo?: {
    email?: string;
    name?: string;
    provider?: string;
  } | null;
}

const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({ 
  coupon: initialCoupon, 
  onOptInYes,
  onOptInNo,
  showEmailOptIn,
  onEmailOptInComplete,
  onEmailOptInSkip,
  userInfo
}) => {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [coupon, setCoupon] = useState(initialCoupon);
  const [showSecondaryEmailOptIn, setShowSecondaryEmailOptIn] = useState(false);
  const { trackSessionEvent } = useSessionTracking();

  // Track when opt-in prompt is shown
  useEffect(() => {
    trackSessionEvent('opt_in_prompt_shown');
  }, [trackSessionEvent]);

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    // Track congratulations view
    trackSessionEvent('view_congratulations', initialCoupon.id);

  // Automatically claim the coupon when component mounts (if it's a real coupon)
    const claimSelectedCoupon = async () => {
      if (!claimed && !isClaiming && initialCoupon.id !== 'no-coupon') {
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
      
      if (result.success && result.coupon) {
        setClaimed(true);
        // Update the coupon with the actual claimed coupon data that includes the real code
        setCoupon(result.coupon);
        // Track coupon claimed event for dashboard
        trackSessionEvent('coupon_claimed', result.coupon.id);
        console.log('✅ Coupon claimed successfully!');
        console.log('📝 Coupon code:', result.coupon.code);
        console.log('🔗 Share token:', result.coupon.share_token);
        console.log('📦 Full coupon object:', result.coupon);
      } else {
        console.error('❌ Failed to claim coupon:', result.message);
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
          
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <ActionButtons 
            coupon={coupon} 
            copied={copied} 
            setCopied={setCopied}
            userEmail={userInfo?.email}
            userName={userInfo?.name}
          />
          
          {!userInfo?.email && !showSecondaryEmailOptIn && (
            <Button 
              variant="secondary" 
              className="w-full" 
              onClick={() => setShowSecondaryEmailOptIn(true)}
            >
              📧 Want to hear about more offers?
            </Button>
          )}
          
          {showSecondaryEmailOptIn && (
            <EmailOptIn 
              onComplete={(email) => {
                setShowSecondaryEmailOptIn(false);
                onEmailOptInComplete?.(email);
              }}
              onSkip={() => {
                setShowSecondaryEmailOptIn(false);
                onEmailOptInSkip?.();
              }}
            />
          )}
          
          <Button 
            variant="outline" 
            className="w-full mt-4" 
            onClick={() => window.open('https://sneaky-dees.com/', '_blank')}
          >
            <Home className="w-4 h-4 mr-2" />
            Visit Our Website
          </Button>
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
