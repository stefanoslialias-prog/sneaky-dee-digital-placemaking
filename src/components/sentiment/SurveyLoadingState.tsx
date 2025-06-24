
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SurveyLoadingState: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">Loading Question...</CardTitle>
          <CardDescription>
            Please wait while we prepare your survey question.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default SurveyLoadingState;
