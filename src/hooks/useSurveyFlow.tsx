import { useState } from 'react';
import { Coupon } from '@/components/CouponPicker';
import { Sentiment } from '@/services/mockData';
import { toast } from 'sonner';
import mockDatabase from '@/services/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useSessionTracking } from '@/hooks/useSessionTracking';

export type AppStep = 
  | 'welcome'
  | 'partnerPicker'
  | 'promotionOptIn'
  | 'couponPicker'
  | 'sentiment'
  | 'comment'
  | 'congratulations'
  | 'thankYou';

interface Partner {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  active: boolean;
}

export const useSurveyFlow = () => {
  const [step, setStep] = useState<AppStep>('welcome');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);
  const [showEmailOptIn, setShowEmailOptIn] = useState(false);
  const { startNewSession, trackSessionEvent } = useSessionTracking();

  const handleStartSurvey = (email?: string) => {
    // Store email if provided, otherwise clear any stored email
    if (email) {
      localStorage.setItem('userEmail', email);
    } else {
      localStorage.removeItem('userEmail');
    }
    // Skip partner picker and go directly to coupon picker
    startNewSession(undefined);
    setStep('couponPicker');
  };

  const handlePartnerSelected = (partner: Partner) => {
    setSelectedPartner(partner);
    // Start new session and track visit
    startNewSession(partner.id);
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
    // Track coupon selection
    trackSessionEvent('coupon_selected', coupon.id);
    setStep('sentiment');
  };
  
  const handleSentimentComplete = (selectedSentiment: Sentiment, responseId?: string) => {
    setSentiment(selectedSentiment);
    setLastResponseId(responseId || null);
    
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
    
    // Skip congratulations step if no coupon was selected
    if (!selectedCoupon || selectedCoupon.id === 'no-coupon') {
      setStep('thankYou');
    } else {
      setStep('congratulations');
    }
  };

  const handleDone = () => {
    setStep('welcome');
    setSelectedCoupon(null);
    setSentiment(null);
  };

  const handleOptInYes = () => {
    console.log('User opted in for more deals');
    setStep('thankYou');
  };

  const handleOptInNo = () => {
    console.log('User declined additional offers');
    setStep('thankYou');
  };

  const handleEmailOptInComplete = (email?: string) => {
    console.log('Email opt-in completed:', email ? 'with email' : 'skipped');
    setShowEmailOptIn(false);
    setStep('thankYou');
  };

  const handleEmailOptInSkip = () => {
    console.log('Email opt-in skipped');
    setShowEmailOptIn(false);
    setStep('thankYou');
  };

  const handleThankYouDone = async () => {
    // Before redirecting, trigger the email sending function only if a real email was provided
    const storedEmail = localStorage.getItem('userEmail');
    
    if (storedEmail) {
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
    } else {
      console.log("No email provided, skipping email sending");
    }
    
    // Reset the flow
    setStep('welcome');
  };

  return {
    step,
    setStep,
    selectedCoupon,
    selectedPartner,
    sentiment,
    lastResponseId,
    showEmailOptIn,
    handleStartSurvey,
    handlePartnerSelected,
    handleSkipRegistration,
    handleRegister,
    handleSocialSignIn,
    handleCouponSelected,
    handleSentimentComplete,
    handleCommentComplete,
    handleDone,
    handleOptInYes,
    handleOptInNo,
    handleEmailOptInComplete,
    handleEmailOptInSkip,
    handleThankYouDone
  };
};

export default useSurveyFlow;
