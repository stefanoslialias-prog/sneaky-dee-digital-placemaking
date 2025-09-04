
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sentiment } from '@/components/sentiment/SentimentOptions';

interface Question {
  id: string;
  text: string;
}

export const useSentimentSubmission = (question: Question | null, onComplete: (sentiment: Sentiment) => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | null>(null);

  const handleSentimentSubmit = async (sentiment: Sentiment) => {
    setIsSubmitting(true);
    try {
      if (!question) {
        toast.error('No question available');
        return;
      }
      
      console.log("Submitting answer for question:", question.id, "Answer:", sentiment);
      
      // Use anonymous session tracking instead of IP collection for privacy
      const ipAddress = 'anonymous-session-' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
        
      // Record the interaction in the database
      const { data: interactionData, error: interactionError } = await supabase.rpc(
        'record_question_interaction',
        { 
          p_ip_address: ipAddress,
          p_question_id: question.id
        }
      );
      
      if (interactionError) {
        console.error('Error recording interaction:', interactionError);
        // Continue even if recording fails
      } else {
        console.log("Recorded interaction:", interactionData);
      }
      
      // Generate a cryptographically secure session ID
      const sessionId = `session-${crypto.getRandomValues(new Uint32Array(2)).join('-')}-${Date.now()}`;
      
      // Get location ID from local storage
      const locationId = localStorage.getItem('currentHotspotId');
      
      // Prepare the data to insert
      const responseData = {
        question_id: question.id,
        answer: sentiment,
        comment: null,
        session_id: sessionId,
        location_id: locationId || null
      };
      
      console.log("Inserting response:", responseData);
      
      // Insert response into Supabase
      const { error: insertError } = await supabase
        .from('survey_responses')
        .insert(responseData);
        
      if (insertError) {
        console.error('Error saving response:', insertError);
        toast.error('Failed to save—please retry');
        return;
      }
      
      // Call onComplete to proceed to comment step
      onComplete(sentiment);
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
