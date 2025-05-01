import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import WifiDetector from '@/components/WifiDetector';
import SentimentSurvey from '@/components/SentimentSurvey';
import DealDisplay from '@/components/DealDisplay';
import Logo from '@/components/Logo';
import { Link } from 'react-router-dom';
import mockDatabase, { Sentiment } from '@/services/mockData';
import { ArrowUpRightFromCircle, Wifi } from 'lucide-react';

const Index = () => {
  const [step, setStep] = useState<'welcome' | 'connecting' | 'survey' | 'deal'>('welcome');

  const handleStartSurvey = () => {
    setStep('connecting');
  };

  const handleWifiDetected = () => {
    // Wait 1 second to show the connected state before moving to the survey
    setTimeout(() => {
      setStep('survey');
    }, 1000);
  };

  const handleSurveyComplete = (sentiment: Sentiment, comment?: string) => {
    // Add to mock database
    mockDatabase.addResponse('1', sentiment, comment);
    
    // Show deals
    setStep('deal');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-4 px-6 flex justify-between items-center border-b">
        <div className="flex items-center gap-4">
          <Logo />
          <img 
            src="/lovable-uploads/digital-placemaking-logo.png" 
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
              <h1 className="text-4xl font-bold mb-4 font-playfair">Toronto Public WiFi</h1>
              <p className="text-gray-600 mb-6">
                Welcome! Connect to free WiFi and help us improve your community experience.
              </p>
              <Button onClick={handleStartSurvey} size="lg" className="bg-toronto-blue hover:bg-toronto-lightblue">
                Start Quick Survey
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 mt-8">
              <p>No personal data is collected. By continuing, you agree to our WiFi Terms of Service.</p>
            </div>
          </div>
        )}
        
        {step === 'connecting' && (
          <WifiDetector onWifiDetected={handleWifiDetected} />
        )}
        
        {step === 'survey' && (
          <SentimentSurvey onComplete={handleSurveyComplete} />
        )}
        
        {step === 'deal' && (
          <DealDisplay />
        )}
      </main>
      
      <footer className="py-3 px-6 text-center text-sm text-gray-500 border-t">
        <p>&copy; {new Date().getFullYear()} City of Toronto Community Pulse Project</p>
      </footer>
    </div>
  );
};

export default Index;
