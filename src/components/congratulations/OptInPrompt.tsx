
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface OptInPromptProps {
  onOptInYes: () => void;
  onOptInNo: () => void;
}

export const OptInPrompt: React.FC<OptInPromptProps> = ({ onOptInYes, onOptInNo }) => {
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
          onClick={onOptInYes}
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
