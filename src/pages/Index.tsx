
import React, { useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useDeviceTracking } from '@/hooks/useDeviceTracking';
import { useAuthState } from '@/hooks/useAuthState';
import useSurveyFlow from '@/hooks/useSurveyFlow';
import SurveyStepRenderer from '@/components/SurveyStepRenderer';
import { seedSampleCoupons, seedSampleQuestions } from '@/services/seedData';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { deviceId } = useDeviceTracking();
  const { userInfo, setUserInfo } = useAuthState();
  
  const {
    step,
    setStep,
    selectedCoupon,
    selectedPartner,
    lastResponseId,
    showEmailOptIn,
    handleStartSurvey,
    handlePartnerSelected,
    handleSkipRegistration,
    handleCouponSelected,
    handleSentimentComplete,
    handleCommentComplete,
    handleOptInYes,
    handleOptInNo,
    handleEmailOptInComplete,
    handleEmailOptInSkip,
    handleThankYouDone
  } = useSurveyFlow();

  // Only seed data for admin users - anonymous users don't need this
  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if user is admin before seeding
          const { data: isAdminData } = await supabase.rpc('has_role', {
            user_id: user.id,
            required_role: 'admin'
          });
          
          if (isAdminData) {
            await seedSampleCoupons();
            await seedSampleQuestions();
          }
        }
      } catch (error) {
        console.log('No admin user logged in, skipping data seeding');
      }
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
        selectedPartner={selectedPartner}
        userInfo={userInfo}
        lastResponseId={lastResponseId}
        showEmailOptIn={showEmailOptIn}
        onStartSurvey={handleStartSurvey}
        onPartnerSelected={handlePartnerSelected}
        onSkipRegistration={handleSkipRegistration}
        onRegister={handleRegister}
        onSocialSignIn={handleSocialSignIn}
        onCouponSelected={handleCouponSelected}
        onSentimentComplete={handleSentimentComplete}
        onCommentComplete={handleCommentComplete}
        onOptInYes={handleOptInYes}
        onOptInNo={handleOptInNo}
        onEmailOptInComplete={handleEmailOptInComplete}
        onEmailOptInSkip={handleEmailOptInSkip}
        onThankYouDone={handleThankYouDone}
      />
    </AppLayout>
  );
};

export default Index;
