
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SurveyNoQuestionState: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">No Question Available</CardTitle>
          <CardDescription>
            Sorry, no survey question is currently available.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default SurveyNoQuestionState;
