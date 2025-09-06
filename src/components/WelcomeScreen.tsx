import React from "react";
import { Button } from "@/components/ui/button";
import { Gift, Wifi, User, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
interface WelcomeScreenProps {
  onStartSurvey: () => void;
}
const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartSurvey
}) => {
  const {
    user,
    logout
  } = useAuth();
  return <div className="text-center max-w-lg animate-fade-in">
      {/* Shop Local Banner */}
      <div className="mt-10 mb-6">
        <img src="/lovable-uploads/a5c50d31-a577-40dd-b769-0f586cc4f47e.png" alt="Shop Local Win Local" className="mx-auto h-36 w-auto" onError={e => {
        e.currentTarget.style.display = "none";
      }} />
      </div>

      {/* WiFi Icon */}
      <div className="mb-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-toronto-blue flex items-center justify-center">
          <Wifi size={48} className="text-white" />
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-bold mb-4 font-playfair">Local Rewards Await</h1>

      {/* Subtext */}
      <p className="text-gray-600 mb-6">Discover exclusive offers at nearby shops.</p>

      {/* CTA Button */}
      <Button onClick={onStartSurvey} size="lg" className="bg-toronto-blue hover:bg-toronto-lightblue transition-all transform hover:scale-105 active:scale-95 shadow-md mb-4">
        <Gift size={18} className="mr-1" />
        Connect & Get Offers
      </Button>

      {/* Trust Messaging */}
      <div className="text-sm text-gray-500 mb-4">
        🔒 <span className="font-semibold">Private & Secure</span> — No personal info needed.
      </div>

      {/* Authentication Options */}
      <div className="mb-4 space-y-3">
        {user ? <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mb-2">
              Welcome back, <span className="font-semibold">{user.name}</span>!
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={logout} className="text-green-700 border-green-300 hover:bg-green-100">
                Sign Out
              </Button>
            </div>
          </div> : <div className="flex gap-2 justify-center">
            <Link to="/auth">
              <Button variant="outline" size="sm" className="text-toronto-blue border-toronto-blue hover:bg-toronto-blue hover:text-white">
                <LogIn size={14} className="mr-1" />
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="sm" className="text-toronto-blue border-toronto-blue hover:bg-toronto-blue hover:text-white">
                <User size={14} className="mr-1" />
                Sign Up
              </Button>
            </Link>
          </div>}
      </div>

      {/* Optional Timer (Optional Feature - If approved) */}
      <div className="text-xs text-red-500 mb-2">
        Offers available for the next 10 minutes while you're connected.
      </div>

      {/* Terms & Conditions */}
      <div className="text-xs text-gray-400">
        By continuing, you agree to our WiFi Terms of Service and{" "}
        <span className="text-toronto-blue">Privacy Policy</span>.
      </div>
    </div>;
};
export default WelcomeScreen;