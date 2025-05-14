import React from "react";
import { Button } from "@/components/ui/button";
import { Gift, Wifi } from "lucide-react";

interface WelcomeScreenProps {
  onStartSurvey: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartSurvey }) => {
  return (
    <div className="text-center max-w-lg animate-fade-in">
      {/* Shop Local Banner */}
      <div className="mt-10 mb-6">
        <img 
          src="/lovable-uploads/a5c50d31-a577-40dd-b769-0f586cc4f47e.png" 
          alt="Shop Local Win Local" 
          className="mx-auto h-36 w-auto"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* WiFi Icon */}
      <div className="mb-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-toronto-blue flex items-center justify-center">
          <Wifi size={48} className="text-white" />
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-bold mb-4 font-playfair">
        Free WiFi + Local Rewards Await
      </h1>

      {/* Subtext */}
      <p className="text-gray-600 mb-6">
        Connect now to discover exclusive offers at nearby shops.
      </p>

      {/* CTA Button */}
      <Button
        onClick={onStartSurvey}
        size="lg"
        className="bg-toronto-blue hover:bg-toronto-lightblue transition-all transform hover:scale-105 active:scale-95 shadow-md mb-4"
      >
        <Gift size={18} className="mr-1" />
        Connect & Get Offers
      </Button>

      {/* Trust Messaging */}
      <div className="text-sm text-gray-500 mb-4">
        🔒 <span className="font-semibold">Private & Secure</span> — No personal info needed.
      </div>

      {/* Optional Timer (Optional Feature - If approved) */}
      <div className="text-xs text-red-500 mb-2">
        Offers available for the next 10 minutes while you’re connected.
      </div>

      {/* Terms & Conditions */}
      <div className="text-xs text-gray-400">
        By continuing, you agree to our WiFi Terms of Service.
      </div>
    </div>
  );
};

export default WelcomeScreen;
