
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type Sentiment = 'happy' | 'neutral' | 'concerned';

const sentimentOptions: { value: Sentiment; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'neutral', emoji: '😐', label: 'Just fine' },
  { value: 'concerned', emoji: '😟', label: 'Concerned' },
];

interface SentimentSurveyProps {
  onComplete: (sentiment: Sentiment, comment?: string) => void;
}

const SentimentSurvey: React.FC<SentimentSurveyProps> = ({ onComplete }) => {
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | null>(null);
  const [comment, setComment] = useState('');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSentimentSelect = async (sentiment: Sentiment) => {
    setSelectedSentiment(sentiment);
    if (sentiment === 'happy') {
      // Skip the comment step for happy users
      await handleSubmit(sentiment);
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async (sentiment: Sentiment = selectedSentiment as Sentiment) => {
    setIsSubmitting(true);
    try {
      // Get the first active question from the database
      const { data: question, error: questionError } = await supabase
        .from('survey_questions')
        .select('id')
        .eq('active', true)
        .order('order')
        .limit(1)
        .single();
        
      if (questionError) {
        // Fallback to mock data behavior if there's an error
        console.error('Error fetching question:', questionError);
        toast.error('Failed to save—please retry');
        return;
      }
      
      // Generate a simple session ID (in a real app, this would be more sophisticated)
      const sessionId = `${Math.floor(Math.random() * 6) + 1}-${Date.now()}`;
      
      // Insert response into Supabase
      const { error: insertError } = await supabase
        .from('survey_responses')
        .insert({
          question_id: question.id,
          answer: sentiment,
          comment: comment || null,
          session_id: sessionId,
          location_id: localStorage.getItem('currentHotspotId') || null
        });
        
      if (insertError) {
        console.error('Error saving response:', insertError);
        toast.error('Failed to save—please retry');
        return;
      }
      
      // Call the onComplete callback to move to the next step
      onComplete(sentiment, comment);
      toast.success('Thanks for sharing how you feel!');
      
    } catch (error) {
      console.error('Survey submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Shop Local Win Local image - centered above the card */}
      <div className="flex justify-center mb-6">
        <img 
          src="/lovable-uploads/bd068280-e55a-4131-8a50-96bb2b06a92a.png" 
          alt="Shop Local Win Local" 
          className="h-24 object-contain" 
        />
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">Tell us how you feel today!</CardTitle>
          <CardDescription>
            Help us improve your Toronto experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="grid grid-cols-3 gap-4">
              {sentimentOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  onClick={() => handleSentimentSelect(option.value)}
                  disabled={isSubmitting}
                  className={`h-24 flex flex-col items-center justify-center gap-2 border-2 hover:bg-toronto-gray ${
                    selectedSentiment === option.value ? 'border-toronto-blue' : ''
                  }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center">Would you like to tell us more?</p>
              <textarea
                className="w-full h-24 p-2 border rounded-md"
                placeholder="Optional: Share your thoughts..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
              ></textarea>
            </div>
          )}
        </CardContent>
        {step === 2 && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
              Back
            </Button>
            <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default SentimentSurvey;
