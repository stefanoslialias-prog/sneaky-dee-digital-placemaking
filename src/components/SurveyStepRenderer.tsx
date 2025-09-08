
import React from 'react';
import { AppStep } from '@/hooks/useSurveyFlow';
import WelcomeScreen from '@/components/WelcomeScreen';
import SentimentSurvey from '@/components/SentimentSurvey';
import { Coupon } from '@/components/CouponPicker';
import CouponPicker from '@/components/CouponPicker';
import { CongratulationsScreen } from '@/components/congratulations';
import CommentStep from '@/components/CommentStep';
import PromotionOptIn from '@/components/PromotionOptIn';
import ThankYou from '@/components/ThankYou';
import { Sentiment } from '@/services/mockData';
import BrandImage from '@/components/BrandImage';
import PartnerPicker from '@/components/PartnerPicker';

interface Partner {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  active: boolean;
}

interface SurveyStepRendererProps {
  step: AppStep;
  selectedCoupon: Coupon | null;
  selectedPartner: Partner | null;
  userInfo: any;
  lastResponseId?: string | null;
  showEmailOptIn?: boolean;
  onStartSurvey: (email?: string) => void;
  onPartnerSelected: (partner: Partner) => void;
  onSkipRegistration: () => void;
  onRegister: (email: string, name: string) => void;
  onSocialSignIn: (provider: 'google' | 'apple') => void;
  onCouponSelected: (coupon: Coupon) => void;
  onSentimentComplete: (sentiment: Sentiment, responseId?: string) => void;
  onCommentComplete: (comment?: string) => void;
  onOptInYes: () => void;
  onOptInNo: () => void;
  onEmailOptInComplete?: (email?: string) => void;
  onEmailOptInSkip?: () => void;
  onThankYouDone: () => void;
}

const SurveyStepRenderer: React.FC<SurveyStepRendererProps> = ({
  step,
  selectedCoupon,
  selectedPartner,
  userInfo,
  lastResponseId,
  showEmailOptIn,
  onStartSurvey,
  onPartnerSelected,
  onSkipRegistration,
  onRegister,
  onSocialSignIn,
  onCouponSelected,
  onSentimentComplete,
  onCommentComplete,
  onOptInYes,
  onOptInNo,
  onEmailOptInComplete,
  onEmailOptInSkip,
  onThankYouDone,
}) => {

  const renderCurrentStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeScreen onStartSurvey={onStartSurvey} />;
        
      case 'partnerPicker':
        return (
          <div className="animate-fade-in">
            <PartnerPicker onPartnerSelected={onPartnerSelected} />
          </div>
        );
        
      case 'promotionOptIn':
        return (
          <div className="animate-scale-in">
            <PromotionOptIn 
              onSkip={onSkipRegistration}
              onRegister={onRegister}
              onSocialSignIn={onSocialSignIn}
              couponId={selectedCoupon?.id}
            />
          </div>
        );
        
      case 'couponPicker':
        return (
          <div className="animate-slide-in-right">
            <CouponPicker 
              onCouponSelected={onCouponSelected} 
              partnerId={selectedPartner?.id}
            />
          </div>
        );
        
      case 'sentiment':
        return (
          <div className="animate-fade-in">
            <SentimentSurvey 
              onComplete={onSentimentComplete}
              partnerId={selectedPartner?.id}
            />
          </div>
        );
        
      case 'comment':
        return (
          <div className="animate-fade-in">
            <CommentStep 
              onComplete={onCommentComplete}
              responseId={lastResponseId || undefined}
            />
          </div>
        );
        
      case 'congratulations':
        return selectedCoupon ? (
          <div className="animate-fade-in">
            <CongratulationsScreen 
              coupon={selectedCoupon} 
              onOptInYes={onOptInYes}
              onOptInNo={onOptInNo}
              showEmailOptIn={showEmailOptIn}
              onEmailOptInComplete={onEmailOptInComplete}
              onEmailOptInSkip={onEmailOptInSkip}
              userInfo={userInfo}
            />
          </div>
        ) : null;
        
      case 'thankYou':
        return (
          <div className="animate-fade-in">
            <ThankYou 
              onDone={onThankYouDone}
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
    <>
      {renderCurrentStep()}
      
      {shouldShowBrandImage() && (
        <div className="mt-8">
          <BrandImage />
        </div>
      )}
    </>
  );
};

export default SurveyStepRenderer;
