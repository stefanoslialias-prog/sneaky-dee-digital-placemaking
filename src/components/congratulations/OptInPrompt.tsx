
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface OptInPromptProps {
  onOptInYes: () => void;
  onOptInNo: () => void;
}

export const OptInPrompt: React.FC<OptInPromptProps> = ({ onOptInYes, onOptInNo }) => {
  const { trackSessionEvent } = useSessionTracking();

  const handleOptInYes = () => {
    console.log("User opted in for more deals");
    trackSessionEvent('opt_in_yes');
    onOptInYes();
  };

  const handleOptInNo = () => {
    console.log("User declined additional offers");
    trackSessionEvent('opt_in_no');
    onOptInNo();
  };

  return (
    <Card className="p-4 border-2 border-primary/20">
      <CardContent className="space-y-4 p-0">
        <Label className="font-medium block text-center text-lg">
          Would you like to receive more exclusive offers?
        </Label>
        <div className="flex justify-center">
          <Button 
            onClick={handleOptInYes}
            className="bg-primary hover:bg-primary/90"
          >
            Yes, I'm interested!
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
