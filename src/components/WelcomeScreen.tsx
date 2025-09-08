import React from "react";
import { Button } from "@/components/ui/button";
import { Gift, Wifi, User, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { toast } from "sonner";
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
  const { trackSessionEvent } = useSessionTracking();

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast.error('Failed to sign in with Google');
        console.error('Google sign-in error:', error);
      } else {
        // Track the auth login event
        trackSessionEvent('auth_login', undefined, undefined, {
          provider: 'google',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      toast.error('Failed to sign in with Google');
      console.error('Google sign-in error:', error);
    }
  };
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
          </div> : <div className="space-y-2">
            <Button 
              onClick={handleGoogleSignIn}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50"
            >
              <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Continue with Google
            </Button>
            <div className="flex gap-2 justify-center">
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
            </div>
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