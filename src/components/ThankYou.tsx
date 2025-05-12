
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Gift, Mail, ArrowRight, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ThankYouProps {
  onDone: () => void;
  userInfo?: {
    email?: string;
    name?: string;
    provider?: string;
  } | null;
}

const ThankYou: React.FC<ThankYouProps> = ({ onDone, userInfo }) => {
  // Display toast notification when component mounts
  useEffect(() => {
    toast.success('Your coupon has been deposited into your e-wallet!', {
      duration: 5000,
      position: 'top-center',
    });
  }, []);
  
  const handleShareCoupon = () => {
    // Share functionality would go here
    // For now, just show a toast
    toast.info('Sharing feature coming soon!');
  };

  const handleSeeMoreDeals = () => {
    // Navigate to more deals
    onDone();
  };
  
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <CardTitle className="text-2xl font-playfair mb-2">Thank You!</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center">
          {userInfo?.name ? (
            <p className="text-gray-600 mb-4">
              Thanks {userInfo.name}! Your registration is complete. You'll now receive exclusive offers and updates.
            </p>
          ) : userInfo?.provider ? (
            <p className="text-gray-600 mb-4">
              Thanks for signing in with {userInfo.provider.charAt(0).toUpperCase() + userInfo.provider.slice(1)}! 
              You'll now receive exclusive offers and updates.
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              Your registration is complete. You'll now receive exclusive offers and updates.
            </p>
          )}
          
          <div className="flex flex-col gap-4 mt-6">
            {userInfo?.email && (
              <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3 text-left">
                <Mail className="text-blue-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Email Confirmation Sent</p>
                  <p className="text-sm text-gray-600">We've sent a confirmation to {userInfo.email}</p>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3 text-left">
              <Gift className="text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium">Offers Coming Soon</p>
                <p className="text-sm text-gray-600">Keep an eye out for exclusive offers straight to your inbox!</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-toronto-gray/50 rounded-md mt-6">
            <p className="text-sm text-gray-500">
              We value your privacy. You can unsubscribe from our communications at any time.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <Button 
              className="bg-toronto-blue hover:bg-toronto-lightblue transition-all w-full"
              onClick={onDone}
            >
              Use Coupon Now
              <ArrowRight size={16} className="ml-1" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSeeMoreDeals}
            >
              See More Deals
            </Button>
            <Button 
              variant="secondary" 
              className="w-full mt-2"
              onClick={handleShareCoupon}
            >
              <Share2 size={16} className="mr-1" />
              Share with a Friend
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            onClick={onDone} 
            variant="ghost"
            className="text-gray-500"
          >
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ThankYou;
