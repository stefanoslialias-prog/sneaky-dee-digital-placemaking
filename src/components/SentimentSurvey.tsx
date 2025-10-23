import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSentimentQuestion } from '@/hooks/useSentimentQuestion';
import { useSentimentSubmission } from '@/hooks/useSentimentSubmission';
import SentimentOptions, { type Sentiment } from '@/components/sentiment/SentimentOptions';
import SurveyLoadingState from '@/components/sentiment/SurveyLoadingState';
import SurveyNoQuestionState from '@/components/sentiment/SurveyNoQuestionState';
import RankedChoiceQuestion from '@/components/sentiment/RankedChoiceQuestion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface SentimentSurveyProps {
  onComplete: (sentiment: Sentiment) => void;
  partnerId?: string;
}

const SentimentSurvey: React.FC<SentimentSurveyProps> = ({ onComplete, partnerId }) => {
  const { question, loading } = useSentimentQuestion(partnerId);
  const { isSubmitting, selectedSentiment, handleSentimentSelect } = useSentimentSubmission(question, onComplete, partnerId);
  const [isSubmittingRanked, setIsSubmittingRanked] = useState(false);
  const { sessionId } = useSessionTracking();

  // Handle ranked choice submission
  const handleRankedSubmit = async (rankedOptions: string[]) => {
    if (!question) return;
    
    setIsSubmittingRanked(true);
    try {
      const currentSessionId = sessionId || `session-${crypto.getRandomValues(new Uint32Array(2)).join('-')}-${Date.now()}`;
      const locationId = localStorage.getItem('currentHotspotId');
      
      // Store ranked answer as JSON array
      const { data: responseId, error } = await supabase.rpc(
        'insert_survey_response',
        {
          p_question_id: question.id,
          p_answer: JSON.stringify(rankedOptions),
          p_session_id: currentSessionId,
          p_comment: null,
          p_location_id: locationId || null,
          p_partner_id: partnerId || null
        }
      );
      
      if (error) throw error;
      
      toast.success('Thanks for ranking your preferences!');
      onComplete('neutral' as Sentiment);
    } catch (error) {
      console.error('Error submitting ranked response:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmittingRanked(false);
    }
  };

  // Show loading state
  if (loading) {
    return <SurveyLoadingState />;
  }

  // Show no question available message
  if (!question) {
    return <SurveyNoQuestionState />;
  }

  // Show ranked choice question
  if (question.type === 'ranked_choice') {
    const options = (question.options as string[]) || [];
    if (options.length < 2) {
      return <SurveyNoQuestionState />;
    }
    
    return (
      <div className="w-full max-w-md mx-auto">
        <RankedChoiceQuestion
          question={{
            id: question.id,
            text: question.text,
            options
          }}
          onSubmit={handleRankedSubmit}
          isSubmitting={isSubmittingRanked}
        />
      </div>
    );
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
