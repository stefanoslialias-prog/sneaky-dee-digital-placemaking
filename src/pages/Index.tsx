
import React, { useState } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import SentimentSurvey from '@/components/SentimentSurvey';
import AppLayout from '@/components/AppLayout';
import { Sentiment } from '@/services/mockData';
import CouponPicker, { Coupon } from '@/components/CouponPicker';
import CongratulationsScreen from '@/components/CongratulationsScreen';
import CommentStep from '@/components/CommentStep';
import PromotionOptIn from '@/components/PromotionOptIn';
import ThankYou from '@/components/ThankYou';
import BrandImage from '@/components/BrandImage';
import { useDeviceTracking } from '@/hooks/useDeviceTracking';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from 'sonner';
import mockDatabase from '@/services/mockData';
import { supabase } from '@/integrations/supabase/client';
import QuestionsStep from '@/components/QuestionsStep';

type AppStep = 
  | 'welcome' 
  | 'promotionOptIn' 
  | 'couponPicker' 
  | 'questions'
  | 'sentiment' 
  | 'comment' 
  | 'congratulations' 
  | 'thankYou';

const Index = () => {
  const [step, setStep] = useState<AppStep>('welcome');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const { deviceId } = useDeviceTracking();
  const { userInfo, setUserInfo } = useAuthState();

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
    // Go to the questions step before sentiment survey
    setStep('questions');
  };
  
  const handleQuestionsComplete = () => {
    // After questions, go to sentiment survey
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

  const renderCurrentStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeScreen onStartSurvey={handleStartSurvey} />;
        
      case 'promotionOptIn':
        return (
          <div className="animate-scale-in">
            <PromotionOptIn 
              onSkip={handleSkipRegistration}
              onRegister={handleRegister}
              onSocialSignIn={handleSocialSignIn}
              couponId={selectedCoupon?.id}
            />
          </div>
        );
        
      case 'couponPicker':
        return (
          <div className="animate-slide-in-right">
            <CouponPicker onCouponSelected={handleCouponSelected} />
          </div>
        );
      
      case 'questions':
        return (
          <div className="animate-fade-in">
            <QuestionsStep 
              onComplete={handleQuestionsComplete} 
              couponId={selectedCoupon?.id}
            />
          </div>
        );
        
      case 'sentiment':
        return (
          <div className="animate-fade-in">
            <SentimentSurvey onComplete={handleSentimentComplete} />
          </div>
        );
        
      case 'comment':
        return (
          <div className="animate-fade-in">
            <CommentStep 
              onComplete={handleCommentComplete} 
              onGoBack={() => setStep('sentiment')}
            />
          </div>
        );
        
      case 'congratulations':
        return selectedCoupon ? (
          <div className="animate-fade-in">
            <CongratulationsScreen 
              coupon={selectedCoupon} 
              onDone={handleDone}
              onOptInYes={handleOptInYes}
              onOptInNo={handleOptInNo}
            />
          </div>
        ) : null;
        
      case 'thankYou':
        return (
          <div className="animate-fade-in">
            <ThankYou 
              onDone={handleThankYouDone}
              userInfo={userInfo}  
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  const shouldShowBrandImage = () => {
    return step !== 'welcome' && step !== 'congratulations' && step !== 'thankYou';
  };

  return (
    <AppLayout>
      {renderCurrentStep()}
      
      {shouldShowBrandImage() && (
        <div className="mt-8">
          <BrandImage />
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
