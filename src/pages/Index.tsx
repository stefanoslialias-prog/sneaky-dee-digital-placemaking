
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import SentimentSurvey from '@/components/SentimentSurvey';
import DealDisplay from '@/components/DealDisplay';
import Logo from '@/components/Logo';
import { Link } from 'react-router-dom';
import mockDatabase, { Sentiment } from '@/services/mockData';
import { ArrowUpRightFromCircle, Wifi } from 'lucide-react';
import CouponPicker, { Coupon } from '@/components/CouponPicker';
import CongratulationsScreen from '@/components/CongratulationsScreen';
import CommentStep from '@/components/CommentStep';

const Index = () => {
  const [step, setStep] = useState<'welcome' | 'couponPicker' | 'sentiment' | 'comment' | 'congratulations'>('welcome');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [comment, setComment] = useState<string | undefined>(undefined);

  const handleStartSurvey = () => {
    setStep('couponPicker');
  };

  const handleCouponSelected = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    // Go to the sentiment survey step
    setStep('sentiment');
  };
  
  const handleSentimentComplete = (selectedSentiment: Sentiment, commentText?: string) => {
    setSentiment(selectedSentiment);
    
    // If a comment was provided during sentiment selection, store it
    if (commentText) {
      setComment(commentText);
      // Add to mock database
      mockDatabase.addResponse('1', selectedSentiment, commentText);
      // Skip the comment step
      setStep('congratulations');
    } else {
      // Go to the comment step for more feedback if no comment was provided
      setStep('comment');
    }
  };
  
  const handleCommentComplete = (commentText?: string) => {
    if (commentText) {
      setComment(commentText);
      
      // Add to mock database (we already have the sentiment from previous step)
      if (sentiment) {
        mockDatabase.addResponse('1', sentiment, commentText);
      }
    }
    
    // Show congratulations screen
    setStep('congratulations');
  };

  const handleGoBack = () => {
    // Go back to the sentiment survey step
    setStep('sentiment');
  };

  const handleDone = () => {
    // Reset the flow
    setStep('welcome');
    setSelectedCoupon(null);
    setSentiment(null);
    setComment(undefined);
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
          <div className="text-center max-w-lg">
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 rounded-full bg-toronto-blue flex items-center justify-center mb-4">
                <Wifi size={48} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 font-playfair">Welcome to Free WiFi</h1>
              <p className="text-gray-600 mb-6">
                Click on the button below to see exclusive offers.
              </p>
              <Button onClick={handleStartSurvey} size="lg" className="bg-toronto-blue hover:bg-toronto-lightblue">
                Start Quick Survey
              </Button>
              
              <div className="mt-10">
                <img 
                  src="/lovable-uploads/85ab9848-7cfd-4345-94a6-8bd9914ee24a.png" 
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
        
        {step === 'couponPicker' && (
          <CouponPicker onCouponSelected={handleCouponSelected} />
        )}
        
        {step === 'sentiment' && (
          <SentimentSurvey onComplete={handleSentimentComplete} />
        )}
        
        {step === 'comment' && (
          <CommentStep onComplete={handleCommentComplete} onGoBack={handleGoBack} />
        )}
        
        {step === 'congratulations' && selectedCoupon && (
          <CongratulationsScreen coupon={selectedCoupon} onDone={handleDone} />
        )}
        
        {step !== 'welcome' && step !== 'congratulations' && (
          <div className="mt-8 text-center">
            <img 
              src="/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png" 
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
