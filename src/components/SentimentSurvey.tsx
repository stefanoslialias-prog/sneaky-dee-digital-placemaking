
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Sentiment = 'happy' | 'neutral' | 'concerned';

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

  const handleSentimentSelect = (sentiment: Sentiment) => {
    setSelectedSentiment(sentiment);
    if (sentiment === 'happy') {
      // Skip the comment step for happy users
      handleSubmit(sentiment);
    } else {
      setStep(2);
    }
  };

  const handleSubmit = (sentiment: Sentiment = selectedSentiment as Sentiment) => {
    onComplete(sentiment, comment);
    toast.success('Thanks for sharing how you feel!');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
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
            ></textarea>
          </div>
        )}
      </CardContent>
      {step === 2 && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button onClick={() => handleSubmit()}>
            Submit
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SentimentSurvey;
