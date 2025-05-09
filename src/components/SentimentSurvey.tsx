
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shuffle, RefreshCw } from 'lucide-react';

export type Sentiment = 'happy' | 'neutral' | 'concerned';

const sentimentOptions: { value: Sentiment; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'neutral', emoji: '😐', label: 'Just fine' },
  { value: 'concerned', emoji: '😟', label: 'Concerned' },
];

interface SentimentSurveyProps {
  onComplete: (sentiment: Sentiment) => void;
  surveyType?: string; // Optional parameter to filter questions by type/category
}

const SentimentSurvey: React.FC<SentimentSurveyProps> = ({ onComplete, surveyType = 'default' }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState<{ id: string; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch question based on surveyType - now as a separate function for reusability
  const fetchQuestion = async (type: string) => {
    setLoading(true);
    try {
      // Build the query without chaining to avoid TypeScript recursion issues
      let query = supabase
        .from('survey_questions')
        .select('id, text, category')
        .eq('active', true);
      
      // Apply category filter if needed
      if (type !== 'default') {
        // Create a new query to avoid chaining that might cause recursion
        query = query.eq('category', type);
      }
      
      // Execute the query with explicit limit
      const { data, error } = await query.limit(100);
        
      if (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to load question');
        setLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        // Client-side randomization
        const randomIndex = Math.floor(Math.random() * data.length);
        setQuestion(data[randomIndex]);
      } else {
        // No questions found for this survey type
        setQuestion(null);
      }
    } catch (error) {
      console.error('Failed to fetch question:', error);
      toast.error('Failed to load question');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initialize survey and set up real-time subscription
  useEffect(() => {
    fetchQuestion(surveyType);
    
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
          // When questions change, we could either:
          // 1. Immediately fetch a new question (disruptive if user is answering)
          // 2. Show a notification that new questions are available
          
          // Option 2 is less disruptive - show toast with refresh option
          if (payload.eventType === 'INSERT') {
            toast('New survey questions available!', {
              action: {
                label: 'Refresh',
                onClick: () => handleRefreshQuestion()
              }
            });
          } else if (payload.eventType === 'UPDATE' && payload.new.id === question?.id) {
            // If the current question was updated, refresh it
            fetchQuestion(surveyType);
          }
        }
      )
      .subscribe();
    
    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [surveyType]);

  const handleRefreshQuestion = async () => {
    setRefreshing(true);
    await fetchQuestion(surveyType);
  };

  const handleSentimentSelect = async (sentiment: Sentiment) => {
    setIsSubmitting(true);
    try {
      if (!question) {
        toast.error('No question available');
        return;
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
      
      // Insert response into Supabase
      const { error: insertError } = await supabase
        .from('survey_responses')
        .insert(responseData);
        
      if (insertError) {
        console.error('Error saving response:', insertError);
        toast.error('Failed to save—please retry');
        return;
      }
      
      // Call the onComplete callback to move to the next step
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
              Sorry, no survey questions are currently available for this survey.
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shuffle size={16} className="text-toronto-blue animate-pulse" />
              <span className="text-sm text-toronto-blue">Your survey just got a remix—enjoy!</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefreshQuestion} 
              disabled={refreshing}
              title="Get another question"
              className="h-8 w-8"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </Button>
          </div>
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
