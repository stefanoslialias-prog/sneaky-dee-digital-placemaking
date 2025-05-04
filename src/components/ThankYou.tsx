
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface ThankYouProps {
  onDone: () => void;
}

const ThankYou: React.FC<ThankYouProps> = ({ onDone }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <CardTitle className="text-2xl font-playfair mb-2">Thank You!</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Your registration is complete. You'll now receive exclusive offers and updates.
          </p>
          
          <div className="p-4 bg-toronto-gray/50 rounded-md mt-4">
            <p className="text-sm text-gray-500">
              We value your privacy. You can unsubscribe from our communications at any time.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            onClick={onDone} 
            className="bg-toronto-blue hover:bg-toronto-lightblue transition-all"
          >
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ThankYou;
