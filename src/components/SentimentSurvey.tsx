
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export type Sentiment = 'happy' | 'neutral' | 'concerned';

const sentimentOptions: { value: Sentiment; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'neutral', emoji: '😐', label: 'Just fine' },
  { value: 'concerned', emoji: '😟', label: 'Concerned' },
];

interface SurveyQuestion {
  id: string;
  text: string;
  type: string;
}

interface SentimentSurveyProps {
  onComplete: (sentiment: Sentiment) => void;
}

const SentimentSurvey: React.FC<SentimentSurveyProps> = ({ onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [question, setQuestion] = useState<SurveyQuestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const fetchRandomQuestion = async () => {
    setLoading(true);
    try {
      // Fetch a random active question from the database
      const { data, error } = await supabase
        .from('survey_questions')
        .select('id, text, type')
        .eq('active', true)
        .order('RANDOM()')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching question:', error);
        toast.error('Failed to load survey question');
        return;
      }

      setQuestion(data);
    } catch (err) {
      console.error('Failed to fetch question:', err);
      toast.error('Something went wrong loading the survey');
    } finally {
      setLoading(false);
    }
  };

  const handleSentimentSelect = async (sentiment: Sentiment) => {
    if (!question) return;
    
    setIsSubmitting(true);
    try {
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

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-toronto-blue" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-playfair">No Questions Available</CardTitle>
            <CardDescription>
              Please check back later for new surveys.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Only render sentiment options for sentiment-type questions
  if (question.type === 'sentiment') {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-playfair">Quick Poll</CardTitle>
            <CardDescription>
              {question.text || "How are you feeling about this area today?"}
            </CardDescription>
            <div className="text-sm text-toronto-blue mt-2">
              Your survey just got a remix—enjoy!
            </div>
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
  }

  // For future question types
  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">Quick Poll</CardTitle>
          <CardDescription>
            {question.text}
          </CardDescription>
          <div className="text-sm text-toronto-blue mt-2">
            Your survey just got a remix—enjoy!
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="mb-4">This question type is not yet supported.</p>
            <Button onClick={() => fetchRandomQuestion()}>
              Try Another Question
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentSurvey;
