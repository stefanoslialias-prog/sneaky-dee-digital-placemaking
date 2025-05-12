
import React from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Wifi } from 'lucide-react';

interface WelcomeScreenProps {
  onStartSurvey: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartSurvey }) => {
  return (
    <div className="text-center max-w-lg animate-fade-in">
      <div className="mb-8">
        <div className="mx-auto w-24 h-24 rounded-full bg-toronto-blue flex items-center justify-center mb-4">
          <Wifi size={48} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4 font-playfair">Scan to get your coupon instantly</h1>
        <p className="text-gray-600 mb-6">
          Connect to free WiFi and unlock exclusive local offers.
        </p>
        <Button 
          onClick={onStartSurvey} 
          size="lg" 
          className="bg-toronto-blue hover:bg-toronto-lightblue transition-all transform hover:scale-105 active:scale-95 shadow-md"
        >
          <Gift size={18} className="mr-1" />
          Claim My Reward
        </Button>
        
        <div className="mt-10">
          <img 
            src="/lovable-uploads/a5c50d31-a577-40dd-b769-0f586cc4f47e.png" 
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
  );
};

export default WelcomeScreen;
