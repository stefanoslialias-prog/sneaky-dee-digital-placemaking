import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowRight, MessageSquare } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: string;
}

interface MultipleChoiceOption {
  value: string;
  label: string;
}

// Define mock options for multiple choice questions 
// In a real app, these would come from the database
const mockMultipleChoiceOptions: MultipleChoiceOption[] = [
  { value: "option1", label: "First time visitor" },
  { value: "option2", label: "Weekly visitor" },
  { value: "option3", label: "Monthly visitor" },
  { value: "option4", label: "Daily visitor" },
];

interface QuestionsStepProps {
  onComplete: () => void;
  couponId?: string;
}

const QuestionsStep: React.FC<QuestionsStepProps> = ({ onComplete, couponId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('survey_questions')
        .select('id, text, type')
        .eq('active', true)
        .order('RANDOM()')
        .limit(3); // Limit to 3 random questions for a good user experience

      if (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to load questions');
        return;
      }

      setQuestions(data || []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      toast.error('Something went wrong loading the questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    // Validate that we have an answer for the current question
    if (!answers[currentQuestion.id]) {
      toast.error('Please provide an answer before continuing');
      return;
    }

    // If this is the last question, submit all answers
    if (currentQuestionIndex === questions.length - 1) {
      await submitAnswers();
      return;
    }

    // Otherwise, move to the next question
    setCurrentQuestionIndex(prev => prev + 1);
  };

  const submitAnswers = async () => {
    setSubmitting(true);
    try {
      const sessionId = `${Math.floor(Math.random() * 6) + 1}-${Date.now()}`;
      const locationId = localStorage.getItem('currentHotspotId');

      // Prepare all answers for submission
      const responseData = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer: answer,
        comment: null,
        session_id: sessionId,
        location_id: locationId || null,
        coupon_id: couponId || null
      }));

      // Insert all responses into Supabase
      const { error } = await supabase
        .from('survey_responses')
        .insert(responseData);

      if (error) {
        console.error('Error saving responses:', error);
        toast.error('Failed to save your answers');
        return;
      }

      toast.success('Thank you for your answers!');
      onComplete();
    } catch (error) {
      console.error('Survey submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
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

  if (questions.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-playfair">No Questions Available</CardTitle>
            <CardDescription>
              Please continue to the next step.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={onComplete}>Continue</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">Quick Questions</CardTitle>
          <CardDescription>
            {`Question ${currentQuestionIndex + 1} of ${questions.length}`}
          </CardDescription>
          <div className="text-sm text-toronto-blue mt-2">
            Your answers help improve our community services!
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg font-medium mb-4">{currentQuestion.text}</div>

          {currentQuestion.type === 'text' && (
            <div className="space-y-2">
              <Input
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
              />
            </div>
          )}

          {currentQuestion.type === 'multiple_choice' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={handleAnswerChange}
              className="space-y-2"
            >
              {mockMultipleChoiceOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          <Button 
            onClick={handleNext} 
            className="w-full mt-4"
            disabled={submitting || !answers[currentQuestion.id]}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isLastQuestion ? (
              <>
                Submit Answers
                <MessageSquare className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionsStep;
