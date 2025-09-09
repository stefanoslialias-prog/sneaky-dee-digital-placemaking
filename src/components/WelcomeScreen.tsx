import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Wifi } from "lucide-react";
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
  const { trackSessionEvent } = useSessionTracking();

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

      const { error } = await supabase
        .from('user_emails')
        .insert(emailData);

      if (error) {
        console.error("Error saving email:", error);
        toast.error("There was an issue saving your email. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Track email submission with a temporary session that will be linked later
      const tempSessionId = `temp-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}-${Date.now()}`;
      trackSessionEvent('email_collected', undefined, undefined, { 
        email: sanitizedEmail,
        temp_session: tempSessionId 
      });
      
      // Store the email and temp session for later linking
      localStorage.setItem('tempSessionId', tempSessionId);
      localStorage.setItem('collectedEmail', sanitizedEmail);
      
      toast.success("Great! Let's find you some deals.");
      onStartSurvey(sanitizedEmail);
      
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipEmail = () => {
    onStartSurvey();
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

      {/* Email Collection Section */}
      <div className="mb-6 space-y-3">
        {!showEmailInput ? (
          // Gmail prompt button
          <Button 
            onClick={() => setShowEmailInput(true)}
            size="lg" 
            className="w-full bg-toronto-blue hover:bg-toronto-lightblue transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Email for exclusive offers
          </Button>
        ) : (
          // Email input form
          <>
            <Input
              type="email"
              placeholder="your.email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
        
        <Button 
          onClick={handleSkipEmail}
          variant="outline"
          disabled={isSubmitting}
          className="w-full text-toronto-blue border-toronto-blue hover:bg-toronto-blue hover:text-white"
        >
          Skip Email (Browse Offers)
        </Button>
      </div>

      {/* Trust Messaging */}
      <div className="text-sm text-gray-500 mb-4">
        🔒 <span className="font-semibold">Private & Secure</span> — We'll only send you great deals.
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