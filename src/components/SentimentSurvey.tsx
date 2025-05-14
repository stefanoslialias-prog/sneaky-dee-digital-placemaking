
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type Sentiment = 'happy' | 'neutral' | 'concerned';

const sentimentOptions: { value: Sentiment; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'neutral', emoji: '😐', label: 'Just fine' },
  { value: 'concerned', emoji: '😟', label: 'Concerned' },
];

interface SentimentSurveyProps {
  onComplete: (sentiment: Sentiment) => void;
}

const SentimentSurvey: React.FC<SentimentSurveyProps> = ({ onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState<{ id: string; text: string; } | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch a random question from the survey_questions table
  const fetchRandomQuestion = async () => {
    setLoading(true);
    try {
      // Get user's IP address (or a placeholder for testing)
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown-ip-' + Math.random().toString(36).substring(7));
      
      console.log("Fetching question for IP:", ipAddress);
      
      // Call the database function to get a random question
      const { data, error } = await supabase.rpc(
        'get_random_question_for_ip',
        { p_ip_address: ipAddress }
      );
        
      if (error) {
        console.error('Error fetching random question:', error);
        toast.error('Failed to load survey question');
        
        // Fallback - get any active question
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('survey_questions')
          .select('id, text')
          .eq('active', true)
          .limit(1);
          
        if (fallbackError || !fallbackData || fallbackData.length === 0) {
          console.error('Error fetching fallback question:', fallbackError);
          setQuestion(null);
        } else {
          console.log("Loaded fallback question:", fallbackData[0]);
          setQuestion(fallbackData[0]);
        }
      } else if (data && data.length > 0) {
        // Set the random question
        console.log("Loaded question via function:", data[0]);
        setQuestion(data[0]);
      } else {
        console.log("No questions returned from function, fetching fallback");
        // Fallback - get any active question
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('survey_questions')
          .select('id, text')
          .eq('active', true)
          .limit(1);
          
        if (fallbackError || !fallbackData || fallbackData.length === 0) {
          console.error('Error fetching fallback question:', fallbackError);
          setQuestion(null);
        } else {
          console.log("Loaded fallback question:", fallbackData[0]);
          setQuestion(fallbackData[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Failed to load survey question');
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize survey and set up real-time subscription
  useEffect(() => {
    console.log("SentimentSurvey component mounted, fetching questions");
    fetchRandomQuestion();
    
    // Set up real-time subscription to survey_questions table
    const channel = supabase
      .channel('survey_questions_changes')
      .on('postgres_changes', 
        { 
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public', 
          table: 'survey_questions'
        }, 
        (payload) => {
          // When questions change, show a notification that new questions are available
          if (payload.eventType === 'INSERT') {
            toast('New survey questions available!', {
              action: {
                label: 'Refresh',
                onClick: () => fetchRandomQuestion()
              }
            });
          } else if (payload.eventType === 'UPDATE' && 
                    question && 
                    payload.new.id === question.id) {
            // If the current question was updated, refresh
            fetchRandomQuestion();
          } else if (payload.eventType === 'DELETE' && 
                    question && 
                    payload.old.id === question.id) {
            // If the current question was deleted, get a new one
            fetchRandomQuestion();
          }
        }
      )
      .subscribe();
    
    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSentimentSelect = async (sentiment: Sentiment) => {
    setIsSubmitting(true);
    try {
      if (!question) {
        toast.error('No question available');
        return;
      }
      
      console.log("Submitting answer for question:", question.id, "Answer:", sentiment);
      
      // Get user's IP address (or a placeholder for testing)
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown-ip-' + Math.random().toString(36).substring(7));
        
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
      
      // Generate a session ID
      const sessionId = `${Math.floor(Math.random() * 6) + 1}-${Date.now()}`;
      
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
    }
  };

  // Show loading state
  if (loading) {
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
  }

  // Show no questions available message
  if (!question) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-playfair">No Questions Available</CardTitle>
            <CardDescription>
              Sorry, no survey questions are currently available.
            </CardDescription>
          </CardHeader>
        </Card>
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
          <div className="grid grid-cols-3 gap-4">
            {sentimentOptions.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                onClick={() => handleSentimentSelect(option.value)}
                disabled={isSubmitting}
                className={`h-24 flex flex-col items-center justify-center gap-2 border-2 hover:bg-toronto-gray`}
              >
                <span className="text-3xl">{option.emoji}</span>
                <span>{option.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentSurvey;
