
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sentiment } from '@/components/sentiment/SentimentOptions';
import { useSessionTracking } from './useSessionTracking';

interface Question {
  id: string;
  text: string;
}

export const useSentimentSubmission = (question: Question | null, onComplete: (sentiment: Sentiment, responseId?: string) => void, partnerId?: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | null>(null);
  const { sessionId } = useSessionTracking();

  const handleSentimentSubmit = async (sentiment: Sentiment) => {
    setIsSubmitting(true);
    try {
      if (!question) {
        toast.error('No question available');
        return;
      }
      
      console.log("Submitting answer for question:", question.id, "Answer:", sentiment);
      
      // Anonymous session tracking for privacy
      console.log("Recording question interaction for:", question.id);
      
      // Use the persistent session ID
      const currentSessionId = sessionId || `session-${crypto.getRandomValues(new Uint32Array(2)).join('-')}-${Date.now()}`;
      
      // Get location ID from local storage
      const locationId = localStorage.getItem('currentHotspotId');
      
      // Prepare the data to insert
      const responseData = {
        question_id: question.id,
        answer: sentiment,
        comment: null,
        session_id: currentSessionId,
        location_id: locationId || null,
        partner_id: partnerId || null
      };
      
      console.log("Inserting response:", responseData);
      
      // Use RPC function to insert response and get the ID
      const { data: responseId, error: insertError } = await supabase.rpc(
        'insert_survey_response',
        {
          p_question_id: question.id,
          p_answer: sentiment,
          p_session_id: currentSessionId,
          p_comment: null,
          p_location_id: locationId || null,
          p_partner_id: partnerId || null
        }
      );
        
      if (insertError) {
        console.error('Error saving response:', insertError);
        toast.error('Failed to save—please retry');
        return;
      }
      
      // Call onComplete to proceed to comment step
      onComplete(sentiment, responseId);
      toast.success('Thanks for sharing how you feel!');
      
    } catch (error) {
      console.error('Survey submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSelectedSentiment(null);
    }
  };

  const handleSentimentSelect = (sentiment: Sentiment) => {
    if (isSubmitting) return; // Prevent multiple clicks during submission
    
    setSelectedSentiment(sentiment);
    
    // Add a small delay to show the selection before proceeding
    setTimeout(() => {
      handleSentimentSubmit(sentiment);
    }, 500);
  };

  return {
    isSubmitting,
    selectedSentiment,
    handleSentimentSelect
  };
};
