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
    if (selectedSentiment) {
      mockDatabase.addResponse('1', selectedSentiment);
    }
    
    setStep('comment');
  };

  const handleCommentComplete = async (comment?: string) => {
    // If the user provided a comment, save it
    if (comment) {
      console.log('User comment:', comment);
      
      // If we have a previous survey response, update it with the comment
      try {
        const { data: recentResponses, error: fetchError } = await supabase
          .from('survey_responses')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!fetchError && recentResponses && recentResponses.length > 0) {
          const responseId = recentResponses[0].id;
          
          // Update the response with the comment
          await supabase
            .from('survey_responses')
            .update({ comment: comment })
            .eq('id', responseId);
        }
      } catch (err) {
        console.error('Failed to update survey response with comment:', err);
      }
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
    // Remove the automatic wallet deposit message - just proceed to welcome
    console.log('User opted out of promotions');
    
    setStep('welcome');
    setSelectedCoupon(null);
    setSentiment(null);
  };

  const handleThankYouDone = async () => {
    // Before redirecting, trigger the email sending function
    try {
      console.log("Triggering email sending process");
      
      // Call the edge function to process pending emails
      const { data, error } = await supabase.functions.invoke('send-promo-emails', {
        method: 'POST',
        body: { trigger: 'thank-you-page' }
      });
      
      if (error) {
        console.error("Error triggering email sending:", error);
      } else {
        console.log("Email sending triggered:", data);
        toast.success("Check your email for exclusive deals!", {
          duration: 5000
        });
      }
    } catch (err) {
      console.error("Failed to trigger email sending:", err);
    }
    
    // Reset the flow
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
