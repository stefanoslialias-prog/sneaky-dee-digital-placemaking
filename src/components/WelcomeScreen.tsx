import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Wifi, Apple } from "lucide-react";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeEmail } from "@/utils/xssProtection";
interface WelcomeScreenProps {
  onStartSurvey: (email?: string) => void;
}
const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartSurvey
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const {
    trackSessionEvent
  } = useSessionTracking();
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast.error("Failed to sign in with Google");
        console.error("Google sign-in error:", error);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong with Google sign-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast.error("Failed to sign in with Apple");
        console.error("Apple sign-in error:", error);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong with Apple sign-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartWithEmail = async () => {
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsSubmitting(true);
    try {
      // Generate a secure device ID
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        deviceId = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('deviceId', deviceId);
      }

      // Record email for future offers
      const emailData = {
        device_id: deviceId,
        email_address: sanitizedEmail,
        subject: 'Your Exclusive Deals',
        email_content: 'Thank you for joining! We will send you exclusive deals.',
        status: 'pending' as const,
        retries: 0
      };
      const {
        error
      } = await supabase.from('user_emails').insert(emailData);
      if (error) {
        console.error("Error saving email:", error);
        toast.error("There was an issue saving your email. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Track email submission
      trackSessionEvent('email_collected', undefined, undefined, {
        email: sanitizedEmail
      });
      toast.success("Great! Let's find you some deals.");
      onStartSurvey(sanitizedEmail);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="text-center max-w-lg animate-fade-in">
      {/* Shop Local Banner */}
      <div className="mt-10 mb-6">
        <img src="/lovable-uploads/sneaky-dees-logo.jpg" alt="Sneaky Dee's" className="mx-auto h-36 w-auto" onError={e => {
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
      <p className="text-gray-600 mb-6">Exclusive Offers</p>

      {/* Sign-in Options */}
      <div className="mb-6 space-y-3">
        {!showEmailInput ? (
          <>
            {/* Apple Sign-in */}
            <Button 
              onClick={handleAppleSignIn} 
              disabled={isSubmitting}
              size="lg" 
              className="w-full bg-black hover:bg-gray-900 text-white transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-3"
            >
              <Apple size={20} />
              Continue with Apple
            </Button>

            {/* Google Sign-in */}
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={isSubmitting}
              size="lg" 
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email Option */}
            <Button 
              onClick={() => setShowEmailInput(true)} 
              disabled={isSubmitting}
              size="lg" 
              className="w-full bg-toronto-blue hover:bg-toronto-lightblue transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Email for exclusive offers
            </Button>
          </>
        ) : (
          // Email input form
          <>
            <Input 
              type="email" 
              placeholder="your.email@gmail.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="text-center border-2 border-toronto-blue/20 focus:border-toronto-blue" 
              disabled={isSubmitting} 
              autoFocus 
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={handleStartWithEmail} 
                disabled={isSubmitting || !email.trim()} 
                size="lg" 
                className="flex-1 bg-toronto-blue hover:bg-toronto-lightblue transition-all transform hover:scale-105 active:scale-95 shadow-md"
              >
                {isSubmitting ? 'Saving...' : 'Get Offers'}
              </Button>
              
              <Button 
                onClick={() => setShowEmailInput(false)} 
                variant="outline" 
                disabled={isSubmitting} 
                className="text-toronto-blue border-toronto-blue hover:bg-toronto-blue hover:text-white"
              >
                Back
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Trust Messaging */}
      <div className="text-sm text-gray-500 mb-4">
        🔒 <span className="font-semibold">Private & Secure</span> — We'll only send you great deals.
      </div>


      {/* Terms & Conditions */}
      <div className="text-xs text-gray-400">
        By continuing, you agree to our{" "}
        <a href="/documents/wifi-terms-of-service.pdf" target="_blank" rel="noopener noreferrer" className="text-toronto-blue hover:underline">
          WiFi Terms of Service
        </a>{" "}
        and{" "}
        <a href="/documents/privacy-policy.pdf" target="_blank" rel="noopener noreferrer" className="text-toronto-blue hover:underline">
          Privacy Policy
        </a>.
      </div>
    </div>;
};
export default WelcomeScreen;