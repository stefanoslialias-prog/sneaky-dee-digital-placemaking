
import { useState } from 'react';
import { Coupon } from '@/components/CouponPicker';
import { Sentiment } from '@/services/mockData';
import { toast } from 'sonner';
import mockDatabase from '@/services/mockData';
import { supabase } from '@/integrations/supabase/client';

export type AppStep = 
  | 'welcome' 
  | 'promotionOptIn' 
  | 'couponPicker' 
  | 'sentiment' 
  | 'comment' 
  | 'congratulations' 
  | 'thankYou';

export const useSurveyFlow = () => {
  const [step, setStep] = useState<AppStep>('welcome');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);

  const handleStartSurvey = () => {
    setStep('couponPicker');
  };

  const handleSkipRegistration = () => {
    setStep('welcome');
  };

  // This function is no longer used directly in our flow
  // It's now handled by the PromotionOptIn component
  const handleRegister = async (email: string, name: string) => {
    // Get device ID if available (this would come from your WiFi sniffer)
    // For demo purposes, we'll generate a random device ID
    const deviceId = `demo-device-${Math.random().toString(36).substring(7)}`;
    
    // Update device opt-in status if we have a device ID
    try {
      await supabase
        .from('devices')
        .update({ opt_in: true })
        .eq('mac_address', deviceId);
    } catch (err) {
      console.error('Failed to update device opt-in status:', err);
    }
    
    // Log the registration
    console.log('User registered:', { email, name, deviceId });
    
    return { email, name };
  };

  // This function is no longer used directly in our flow
  // It's now handled by the PromotionOptIn component
  const handleSocialSignIn = (provider: 'google' | 'apple') => {
    // In a real app, this would use supabase.auth.signInWithOAuth
    // For now, just simulate the sign-in
    const userInfo = { provider };
    
    // Log the social sign-in
    console.log('User signed in with:', provider);
    
    return userInfo;
  };

  const handleCouponSelected = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setStep('sentiment');
  };
  
  const handleSentimentComplete = (selectedSentiment: Sentiment) => {
    setSentiment(selectedSentiment);
    
    // Add to mock database
    mockDatabase.addResponse('1', selectedSentiment);
    
    setStep('comment');
  };

  const handleCommentComplete = async (comment?: string) => {
    // If the user provided a comment, save it
    if (comment) {
      console.log('User comment:', comment);
    }
    
    setStep('congratulations');
  };

  const handleDone = () => {
    setStep('welcome');
    setSelectedCoupon(null);
    setSentiment(null);
  };

  const handleOptInYes = () => {
    console.log('User opted in for more offers');
    setStep('promotionOptIn');
  };

  const handleOptInNo = () => {
    // Show toast notification about coupon being transferred to e-wallet
    if (selectedCoupon) {
      toast.success(`Your ${selectedCoupon.discount} coupon for ${selectedCoupon.merchant} has been transferred to your e-wallet!`, {
        duration: 5000,
        position: 'top-center',
      });
    } else {
      toast.success('Your coupon has been transferred to your e-wallet!', {
        duration: 5000,
        position: 'top-center',
      });
    }
    
    setStep('welcome');
    setSelectedCoupon(null);
    setSentiment(null);
  };

  const handleThankYouDone = () => {
    setStep('welcome');
  };

  return {
    step,
    setStep,
    selectedCoupon,
    sentiment,
    handleStartSurvey,
    handleSkipRegistration,
    handleRegister,
    handleSocialSignIn,
    handleCouponSelected,
    handleSentimentComplete,
    handleCommentComplete,
    handleDone,
    handleOptInYes,
    handleOptInNo,
    handleThankYouDone
  };
};

export default useSurveyFlow;
