
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useDeviceTracking } from '@/hooks/useDeviceTracking';
import { useAuthState } from '@/hooks/useAuthState';
import useSurveyFlow from '@/hooks/useSurveyFlow';
import SurveyStepRenderer from '@/components/SurveyStepRenderer';

const Index = () => {
  const { deviceId } = useDeviceTracking();
  const { userInfo, setUserInfo } = useAuthState();
  const [surveyType, setSurveyType] = useState('default'); // Survey type state
  
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
      {/* Survey type selector - only shown on welcome screen */}
      {step === 'welcome' && (
        <div className="mb-4">
          <select
            className="p-2 border rounded"
            value={surveyType}
            onChange={(e) => setSurveyType(e.target.value)}
          >
            <option value="default">General Survey</option>
            <option value="wifi">WiFi Experience</option>
            <option value="community">Community Feedback</option>
            <option value="events">Events Feedback</option>
          </select>
        </div>
      )}
      
      <SurveyStepRenderer
        step={step}
        selectedCoupon={selectedCoupon}
        userInfo={userInfo}
        surveyType={surveyType} // Pass the survey type
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
