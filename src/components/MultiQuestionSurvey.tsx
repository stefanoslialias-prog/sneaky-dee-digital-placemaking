import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sentiment } from '@/components/sentiment/SentimentOptions';
import { useSentimentQuestion } from '@/hooks/useSentimentQuestion';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import SentimentOptions from './sentiment/SentimentOptions';
import RankedChoiceQuestion from './sentiment/RankedChoiceQuestion';
import SurveyLoadingState from './sentiment/SurveyLoadingState';
import SurveyNoQuestionState from './sentiment/SurveyNoQuestionState';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MultiQuestionSurveyProps {
  onComplete: (sentiment: Sentiment) => void;
  partnerId?: string;
}

const MultiQuestionSurvey = ({ onComplete, partnerId }: MultiQuestionSurveyProps) => {
  const { questions, loading } = useSentimentQuestion(partnerId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { sessionId } = useSessionTracking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<Sentiment | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    try {
      const locationId = localStorage.getItem('currentHotspotId');
      
      // Submit to database using RPC function
      const { error } = await supabase.rpc(
        'insert_survey_response',
        {
          p_question_id: currentQuestion.id,
          p_answer: answer,
          p_session_id: sessionId,
          p_comment: null,
          p_location_id: locationId || null,
          p_partner_id: partnerId || null
        }
      );
        
      if (error) {
        console.error('Error saving response:', error);
        toast.error('Failed to save—please retry');
        return;
      }
      
      // Move to next question or complete
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setTextAnswer('');
        setSelectedOption('');
        setSelectedSentiment(null);
      } else {
        toast.success('Thanks for completing the survey!');
        onComplete(answer as Sentiment);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      toast.error('Failed to save your response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRankedSubmit = async (rankedOptions: string[]) => {
    if (!currentQuestion) return;

    setIsSubmitting(true);
    try {
      const locationId = localStorage.getItem('currentHotspotId');
      
      // Submit ranked choice as JSON array
      const { error } = await supabase.rpc(
        'insert_survey_response',
        {
          p_question_id: currentQuestion.id,
          p_answer: JSON.stringify(rankedOptions),
          p_session_id: sessionId,
          p_comment: null,
          p_location_id: locationId || null,
          p_partner_id: partnerId || null
        }
      );
        
      if (error) {
        console.error('Error saving response:', error);
        toast.error('Failed to save—please retry');
        return;
      }
      
      // Move to next question or complete
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        toast.success('Thanks for completing the survey!');
        onComplete('neutral' as Sentiment); // Default sentiment for ranked choice
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      toast.error('Failed to save your response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSentimentSelect = (sentiment: Sentiment) => {
    if (isSubmitting) return;
    setSelectedSentiment(sentiment);
    setTimeout(() => {
      handleAnswer(sentiment);
    }, 500);
  };

  if (loading) {
    return <SurveyLoadingState />;
  }

  if (!questions || questions.length === 0) {
    return <SurveyNoQuestionState />;
  }

  if (!currentQuestion) {
    return <SurveyNoQuestionState />;
  }

  // Render different question types
  const renderQuestion = () => {
    if (currentQuestion.type === 'ranked_choice' && Array.isArray(currentQuestion.options)) {
      return (
        <RankedChoiceQuestion
          question={{
            id: currentQuestion.id,
            text: currentQuestion.text,
            options: currentQuestion.options as string[]
          }}
          onSubmit={handleRankedSubmit}
          isSubmitting={isSubmitting}
        />
      );
    }

    if (currentQuestion.type === 'multiple_choice' && Array.isArray(currentQuestion.options)) {
      return (
        <div className="space-y-4">
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
            {(currentQuestion.options as string[]).map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
          <Button 
            onClick={() => handleAnswer(selectedOption)}
            disabled={!selectedOption || isSubmitting}
          >
            {currentIndex < questions.length - 1 ? 'Next' : 'Submit'}
          </Button>
        </div>
      );
    }

    if (currentQuestion.type === 'text') {
      return (
        <div className="space-y-4">
          <Textarea
            placeholder="Type your answer here..."
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={() => handleAnswer(textAnswer)}
            disabled={!textAnswer.trim() || isSubmitting}
          >
            {currentIndex < questions.length - 1 ? 'Next' : 'Submit'}
          </Button>
        </div>
      );
    }

    // Default sentiment question
    return (
      <SentimentOptions
        onSentimentSelect={handleSentimentSelect}
        isSubmitting={isSubmitting}
        selectedSentiment={selectedSentiment}
      />
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Survey Question {currentIndex + 1} of {questions.length}</CardTitle>
        <CardDescription>{currentQuestion.text}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderQuestion()}
      </CardContent>
    </Card>
  );
};

export default MultiQuestionSurvey;
