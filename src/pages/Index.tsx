import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import SentimentSurvey from '@/components/SentimentSurvey';
import DealDisplay from '@/components/DealDisplay';
import Logo from '@/components/Logo';
import { Link } from 'react-router-dom';
import mockDatabase, { Sentiment } from '@/services/mockData';
import { ArrowUpRightFromCircle, Gift, Wifi } from 'lucide-react';
import CouponPicker, { Coupon } from '@/components/CouponPicker';
import CongratulationsScreen from '@/components/CongratulationsScreen';
import CommentStep from '@/components/CommentStep';
import PromotionOptIn from '@/components/PromotionOptIn';
import ThankYou from '@/components/ThankYou';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [step, setStep] = useState<'welcome' | 'promotionOptIn' | 'couponPicker' | 'sentiment' | 'comment' | 'congratulations' | 'thankYou'>('welcome');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [userInfo, setUserInfo] = useState<{email?: string, name?: string, provider?: string} | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Generate a unique device ID for tracking
  useEffect(() => {
    // In a real implementation, this would come from the WiFi sniffer
    // For demo purposes, we'll use a random ID or get from local storage
    const storedDeviceId = localStorage.getItem('deviceId');
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      const newDeviceId = `browser-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('deviceId', newDeviceId);
      setDeviceId(newDeviceId);
      
      // Record device in database
      recordDeviceInDatabase(newDeviceId);
    }
    
    // Check for existing user session
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Set user info directly from session data since we don't have a profiles table
      setUserInfo({
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      });
    }
  };

  const recordDeviceInDatabase = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .insert({
          mac_address: deviceId,
          opt_in: false
        });
        
      if (error) {
        console.error('Error recording device:', error);
      }
    } catch (err) {
      console.error('Failed to record device:', err);
    }
  };

  const handleStartSurvey = () => {
    // Changed to go directly to coupon picker
    setStep('couponPicker');
  };

  const handleSkipRegistration = () => {
    // When "Maybe later" is clicked, go back to the survey start
    setStep('welcome');
  };

  const handleRegister = async (email: string, name: string) => {
    // Store user info for future promotions
    setUserInfo({ email, name });
    
    // Update device opt-in status if we have a device ID
    if (deviceId) {
      try {
        await supabase
          .from('devices')
          .update({ opt_in: true })
          .eq('mac_address', deviceId);
      } catch (err) {
        console.error('Failed to update device opt-in status:', err);
      }
    }
    
    // Log the registration
    console.log('User registered:', { email, name, deviceId });
    
    // Proceed to thank you page
    setStep('thankYou');
  };

  const handleSocialSignIn = (provider: 'google' | 'apple') => {
    // In a real app, this would use supabase.auth.signInWithOAuth
    // For now, just simulate the sign-in
    setUserInfo({ provider });
    
    // Log the social sign-in
    console.log('User signed in with:', provider);
    toast.success(`Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
    
    // Proceed to thank you page
    setStep('thankYou');
  };

  const handleCouponSelected = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    // Go to the sentiment survey step
    setStep('sentiment');
  };
  
  const handleSentimentComplete = (selectedSentiment: Sentiment) => {
    setSentiment(selectedSentiment);
    
    // Add to mock database
    mockDatabase.addResponse('1', selectedSentiment);
    
    // Go to comment step after sentiment survey
    setStep('comment');
  };

  const handleCommentComplete = async (comment?: string) => {
    // If the user provided a comment, save it
    if (comment) {
      console.log('User comment:', comment);
      
      // In a real implementation, we would save this to Supabase
      // For now we'll just use the mock database
    }
    
    // Go to congratulations screen
    setStep('congratulations');
  };

  const handleDone = () => {
    // Reset the flow
    setStep('welcome');
    setSelectedCoupon(null);
    setSentiment(null);
  };

  const handleOptInYes = () => {
    console.log('User opted in for more offers');
    // Go to the promotion opt-in step
    setStep('promotionOptIn');
  };

  const handleOptInNo = () => {
    // Reset the flow and go back to welcome screen
    setStep('welcome');
    setSelectedCoupon(null);
    setSentiment(null);
    setUserInfo(null);
  };

  const handleThankYouDone = () => {
    // Return to welcome screen after thank you
    setStep('welcome');
    setUserInfo(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 px-6 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <Logo />
          <img 
            src="/lovable-uploads/68284ad5-d0ad-4d79-9dcb-65d03682dbcd.png" 
            alt="Digital Placemaking" 
            className="h-8 ml-auto" 
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <Link to="/admin">
          <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
            Admin
            <ArrowUpRightFromCircle size={12} />
          </Button>
        </Link>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-toronto-gray">
        {step === 'welcome' && (
          <div className="text-center max-w-lg animate-fade-in">
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 rounded-full bg-toronto-blue flex items-center justify-center mb-4">
                <Wifi size={48} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 font-playfair">Welcome to Free WiFi</h1>
              <p className="text-gray-600 mb-6">
                Click on the button below to see exclusive offers.
              </p>
              <Button 
                onClick={handleStartSurvey} 
                size="lg" 
                className="bg-toronto-blue hover:bg-toronto-lightblue transition-all transform hover:scale-105 active:scale-95 shadow-md"
              >
                <Gift size={18} className="mr-1" />
                Claim My Reward
              </Button>
              
              <div className="mt-10">
                <img 
                  src="/lovable-uploads/a5c50d31-a577-40dd-b769-0f586cc4f47e.png" 
                  alt="Shop Local Win Local" 
                  className="mx-auto h-48 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mt-8">
              <p>No personal data is collected. By continuing, you agree to our WiFi Terms of Service.</p>
            </div>
          </div>
        )}

        {step === 'promotionOptIn' && (
          <div className="animate-scale-in">
            <PromotionOptIn 
              onSkip={handleSkipRegistration}
              onRegister={handleRegister}
              onSocialSignIn={handleSocialSignIn}
              couponId={selectedCoupon?.id}
            />
          </div>
        )}
        
        {step === 'couponPicker' && (
          <div className="animate-slide-in-right">
            <CouponPicker onCouponSelected={handleCouponSelected} />
          </div>
        )}
        
        {step === 'sentiment' && (
          <div className="animate-fade-in">
            <SentimentSurvey onComplete={handleSentimentComplete} />
          </div>
        )}
        
        {step === 'comment' && (
          <div className="animate-fade-in">
            <CommentStep 
              onComplete={handleCommentComplete} 
              onGoBack={() => setStep('sentiment')}
            />
          </div>
        )}
        
        {step === 'congratulations' && selectedCoupon && (
          <div className="animate-fade-in">
            <CongratulationsScreen 
              coupon={selectedCoupon} 
              onDone={handleDone}
              onOptInYes={handleOptInYes}
              onOptInNo={handleOptInNo}
            />
          </div>
        )}
        
        {step === 'thankYou' && (
          <div className="animate-fade-in">
            <ThankYou 
              onDone={handleThankYouDone}
              userInfo={userInfo}  
            />
          </div>
        )}
        
        {step !== 'welcome' && step !== 'congratulations' && step !== 'thankYou' && (
          <div className="mt-8 text-center">
            <img 
              src="/lovable-uploads/a5c50d31-a577-40dd-b769-0f586cc4f47e.png" 
              alt="Shop Local Win Local" 
              className="mx-auto h-24 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </main>
      
      <footer className="py-3 px-6 text-center text-sm text-gray-500 border-t">
        <p>&copy; {new Date().getFullYear()} City of Toronto Community Pulse Project</p>
      </footer>
    </div>
  );
};

export default Index;
