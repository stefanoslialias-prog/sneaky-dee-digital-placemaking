
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
      // Generate a unique device ID if not already stored
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = `device-${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('deviceId', deviceId);
      }

      console.log("User opted in for more deals with device ID:", deviceId);

      // Record this opt-in in the user_emails table
      // This is a placeholder until we actually collect the email in the next step
      const { data, error } = await supabase
        .from('user_emails')
        .insert({
          device_id: deviceId,
          email_address: 'pending-collection@example.com', // Will be updated in the PromotionOptIn component
          subject: 'Your Exclusive Deals',
          email_content: 'Thank you for opting in! We will send you exclusive deals soon.',
          status: 'pending'
        });

      if (error) {
        console.error("Error recording opt-in:", error);
        toast.error("There was an issue with your opt-in. Please try again.");
      } else {
        console.log("Successfully created pending email record:", data);
      }

      // Continue to the email collection form
      onOptInYes();
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again later.");
      // Still continue to next step even if there's an error
      onOptInYes();
    }
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
          onClick={onOptInNo}
        >
          No
        </Button>
      </div>
    </div>
  );
};
