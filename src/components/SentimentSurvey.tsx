
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSentimentQuestion } from '@/hooks/useSentimentQuestion';
import { useSentimentSubmission } from '@/hooks/useSentimentSubmission';
import SentimentOptions, { type Sentiment } from '@/components/sentiment/SentimentOptions';
import SurveyLoadingState from '@/components/sentiment/SurveyLoadingState';
import SurveyNoQuestionState from '@/components/sentiment/SurveyNoQuestionState';

interface SentimentSurveyProps {
  onComplete: (sentiment: Sentiment) => void;
}

const SentimentSurvey: React.FC<SentimentSurveyProps> = ({ onComplete }) => {
  const { question, loading } = useSentimentQuestion();
  const { isSubmitting, selectedSentiment, handleSentimentSelect } = useSentimentSubmission(question, onComplete);

  // Show loading state
  if (loading) {
    return <SurveyLoadingState />;
  }

  // Show no question available message
  if (!question) {
    return <SurveyNoQuestionState />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">Quick Poll</CardTitle>
          <CardDescription>
            {question.text}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SentimentOptions
            onSentimentSelect={handleSentimentSelect}
            isSubmitting={isSubmitting}
            selectedSentiment={selectedSentiment}
          />
          {isSubmitting && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">Saving your response...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentSurvey;
export type { Sentiment };
