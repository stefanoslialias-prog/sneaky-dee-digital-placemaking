
import React, { useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useDeviceTracking } from '@/hooks/useDeviceTracking';
import { useAuthState } from '@/hooks/useAuthState';
import useSurveyFlow from '@/hooks/useSurveyFlow';
import SurveyStepRenderer from '@/components/SurveyStepRenderer';
import { seedSampleCoupons, seedSampleQuestions } from '@/services/seedData';

const Index = () => {
  const { deviceId } = useDeviceTracking();
  const { userInfo, setUserInfo } = useAuthState();
  
  const {
    step,
    setStep,
    selectedCoupon,
    handleStartSurvey,
    handleSkipRegistration,
    handleCouponSelected,
    handleSentimentComplete,
    handleCommentComplete,
    handleOptInYes,
    handleOptInNo,
    handleThankYouDone
  } = useSurveyFlow();

  // Seed sample data on app load
  useEffect(() => {
    const initializeData = async () => {
      await seedSampleCoupons();
      await seedSampleQuestions();
    };
    
    initializeData();
  }, []);

  const handleRegister = async (email: string, name: string) => {
    // Store user info for future promotions
    setUserInfo({ email, name });
    
    // Proceed to thank you page
    setStep('thankYou');
  };

  const handleSocialSignIn = (provider: 'google' | 'apple') => {
    setUserInfo({ provider });
    
    // Log the social sign-in
    console.log('User signed in with:', provider);
    
    // Proceed to thank you page
    setStep('thankYou');
  };

  return (
    <AppLayout>
      <SurveyStepRenderer
        step={step}
        selectedCoupon={selectedCoupon}
        userInfo={userInfo}
        onStartSurvey={handleStartSurvey}
        onSkipRegistration={handleSkipRegistration}
        onRegister={handleRegister}
        onSocialSignIn={handleSocialSignIn}
        onCouponSelected={handleCouponSelected}
        onSentimentComplete={handleSentimentComplete}
        onCommentComplete={handleCommentComplete}
        onOptInYes={handleOptInYes}
        onOptInNo={handleOptInNo}
        onThankYouDone={handleThankYouDone}
      />
    </AppLayout>
  );
};

export default Index;
