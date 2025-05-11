
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
  const [questions, setQuestions] = useState<{ id: string; text: string; order: number }[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get the current question based on index
  const currentQuestion = questions.length > 0 ? questions[currentQuestionIndex] : null;

  // Fetch questions based on surveyType
  const fetchQuestions = async (type: string) => {
    setLoading(true);
    try {
      // Build the base query
      let query = supabase
        .from('survey_questions')
        .select('id, text, order, category')
        .eq('active', true);
      
      // Apply category filter if needed
      if (type !== 'default') {
        query = query.eq('category', type);
      }
      
      // Execute the query with order by
      const { data, error } = await query
        .order('order', { ascending: true })
        .limit(10);
        
      if (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to load questions');
        setLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        setQuestions(data);
        setCurrentQuestionIndex(0); // Reset to first question
      } else {
        // No questions found for this survey type
        setQuestions([]);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Initialize survey and set up real-time subscription
  useEffect(() => {
    fetchQuestions(surveyType);
    
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
          // 1. Immediately fetch new questions (disruptive if user is answering)
          // 2. Show a notification that new questions are available
          
          // Option 2 is less disruptive - show toast with refresh option
          if (payload.eventType === 'INSERT') {
            toast('New survey questions available!', {
              action: {
                label: 'Refresh',
                onClick: () => handleRefreshQuestions()
              }
            });
          } else if (payload.eventType === 'UPDATE' && 
                    currentQuestion && 
                    payload.new.id === currentQuestion.id) {
            // If the current question was updated, refresh questions
            fetchQuestions(surveyType);
          } else if (payload.eventType === 'DELETE') {
            // If any question was deleted, refresh to ensure we don't show deleted questions
            fetchQuestions(surveyType);
          }
        }
      )
      .subscribe();
    
    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [surveyType]);

  const handleRefreshQuestions = async () => {
    setRefreshing(true);
    await fetchQuestions(surveyType);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // If at the end, cycle back to the first question
      // or show a message that all questions are completed
      toast.info('You have gone through all available questions!');
      setCurrentQuestionIndex(0);
    }
  };

  const handleSentimentSelect = async (sentiment: Sentiment) => {
    setIsSubmitting(true);
    try {
      if (!currentQuestion) {
        toast.error('No question available');
        return;
      }
      
      // Generate a session ID
      const sessionId = `${Math.floor(Math.random() * 6) + 1}-${Date.now()}`;
      
      // Get location ID from local storage
      const locationId = localStorage.getItem('currentHotspotId');
      
      // Prepare the data to insert
      const responseData = {
        question_id: currentQuestion.id,
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
      
      // Check if there are more questions
      if (currentQuestionIndex < questions.length - 1) {
        // If there are more questions, move to the next one
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        toast.success('Thanks for sharing! Here\'s another question.');
      } else {
        // If this was the last question, call onComplete
        onComplete(sentiment);
        toast.success('Thanks for sharing how you feel!');
      }
      
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
            <CardTitle className="text-2xl font-playfair">Loading Questions...</CardTitle>
            <CardDescription>
              Please wait while we prepare your survey questions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show no questions available message
  if (questions.length === 0 || !currentQuestion) {
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
              <span className="text-sm text-toronto-blue">Question {currentQuestionIndex + 1} of {questions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNextQuestion}
                title="Skip to next question" 
                className="h-8 w-8"
              >
                <RefreshCw size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefreshQuestions} 
                disabled={refreshing}
                title="Refresh all questions"
                className="h-8 w-8"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
          <CardTitle className="text-2xl font-playfair">Quick Poll</CardTitle>
          <CardDescription>
            {currentQuestion.text}
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
