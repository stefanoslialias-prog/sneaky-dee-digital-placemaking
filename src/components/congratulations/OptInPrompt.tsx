
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OptInPromptProps {
  onOptInYes: () => void;
  onOptInNo: () => void;
}

export const OptInPrompt: React.FC<OptInPromptProps> = ({ onOptInYes, onOptInNo }) => {
  const handleOptInYes = async () => {
    try {
      // Generate a secure device ID
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        // Create a more secure device ID using crypto API
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        deviceId = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('deviceId', deviceId);
      }

      // Validate device ID format
      if (!deviceId || deviceId.length < 10) {
        throw new Error('Invalid device ID generated');
      }

      console.log("User opted in for more deals with device ID:", deviceId.substring(0, 8) + '...');

      // Record opt-in with proper data validation
      const emailData = {
        device_id: deviceId,
        email_address: 'pending-collection@example.com',
        subject: 'Your Exclusive Deals',
        email_content: 'Thank you for opting in! We will send you exclusive deals soon.',
        status: 'pending' as const,
        retries: 0
      };

      const { data, error } = await supabase
        .from('user_emails')
        .insert(emailData)
        .select()
        .single();

      if (error) {
        console.error("Error recording opt-in:", error);
        toast.error("There was an issue with your opt-in. Please try again.");
        return;
      }

      console.log("Successfully created pending email record:", data?.id);
      onOptInYes();
    } catch (err) {
      console.error("Unexpected error during opt-in:", err);
      toast.error("Something went wrong. Please try again later.");
      // Still continue to next step to not block user flow
      onOptInYes();
    }
  };

  const handleOptInNo = () => {
    console.log("User declined additional offers");
    onOptInNo();
  };

  return (
    <div className="p-4 border rounded-md bg-toronto-gray/50">
      <Label className="font-medium block mb-3 text-center">
        Would you like to receive more exclusive offers?
      </Label>
      <div className="flex gap-3 justify-center">
        <Button 
          variant="default"
          size="sm"
          className="bg-toronto-blue hover:bg-toronto-lightblue"
          onClick={handleOptInYes}
        >
          Yes
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={handleOptInNo}
        >
          No
        </Button>
      </div>
    </div>
  );
};
