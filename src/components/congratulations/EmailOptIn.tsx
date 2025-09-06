import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeEmail } from '@/utils/xssProtection';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { CheckCircle } from 'lucide-react';

interface EmailOptInProps {
  onComplete: (email?: string) => void;
  onSkip: () => void;
}

export const EmailOptIn: React.FC<EmailOptInProps> = ({ onComplete, onSkip }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const { trackSessionEvent } = useSessionTracking();

  const handleSubmit = async () => {
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

      // Record opt-in with email
      const emailData = {
        device_id: deviceId,
        email_address: sanitizedEmail,
        subject: 'Your Exclusive Deals',
        email_content: 'Thank you for opting in! We will send you exclusive deals soon.',
        status: 'pending' as const,
        retries: 0
      };

      const { error } = await supabase
        .from('user_emails')
        .insert(emailData);

      if (error) {
        console.error("Error recording email opt-in:", error);
        toast.error("There was an issue saving your email. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Track email submission
      trackSessionEvent('opt_in_email_submitted', undefined, undefined, { email: sanitizedEmail });
      
      toast.success("Thank you! We'll send you exclusive deals soon.");
      setEmailSubmitted(true);
      
      // Auto-complete after showing success for a few seconds
      setTimeout(() => {
        onComplete(sanitizedEmail);
      }, 3000);
      
    } catch (err) {
      console.error("Unexpected error during email opt-in:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipNow = () => {
    if (emailSubmitted) {
      onComplete(email);
    } else {
      onSkip();
    }
  };

  if (emailSubmitted) {
    return (
      <Card className="p-4 border-2 border-green-200 bg-green-50">
        <CardContent className="space-y-4 p-0">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <Label className="text-lg font-semibold text-green-800">
              Perfect! You're all set!
            </Label>
            <p className="text-sm text-green-700 mt-2">
              We've saved your email: <strong>{email}</strong>
            </p>
            <p className="text-xs text-green-600 mt-1">
              You'll receive exclusive deals soon!
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={handleSkipNow}
              className="bg-green-600 hover:bg-green-700"
            >
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-2 border-primary/20">
      <CardContent className="space-y-4 p-0">
        <div className="text-center">
          <Label className="text-lg font-semibold">
            Great! Enter your email to receive exclusive offers:
          </Label>
        </div>
        
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-center"
            disabled={isSubmitting}
          />
          
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !email.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Saving...' : 'Subscribe'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleSkipNow}
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};