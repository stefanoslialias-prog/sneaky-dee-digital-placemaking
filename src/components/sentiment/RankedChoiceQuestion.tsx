import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

interface RankedChoiceQuestionProps {
  question: {
    id: string;
    text: string;
    options: string[];
  };
  onSubmit: (rankedOptions: string[]) => void;
  isSubmitting: boolean;
}

const RankedChoiceQuestion: React.FC<RankedChoiceQuestionProps> = ({
  question,
  onSubmit,
  isSubmitting
}) => {
  const [rankedOptions, setRankedOptions] = useState<string[]>(question.options);

  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === rankedOptions.length - 1) return;

    const newRanked = [...rankedOptions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRanked[index], newRanked[targetIndex]] = [newRanked[targetIndex], newRanked[index]];
    setRankedOptions(newRanked);
  };

  const handleSubmit = () => {
    onSubmit(rankedOptions);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-playfair">Rank Your Preferences</CardTitle>
        <CardDescription>{question.text}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-6">
          {rankedOptions.map((option, index) => (
            <div
              key={option}
              className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm"
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => moveOption(index, 'up')}
                  disabled={index === 0 || isSubmitting}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => moveOption(index, 'down')}
                  disabled={index === rankedOptions.length - 1 || isSubmitting}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 flex-1">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">#{index + 1}</span>
                    <span>{option}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rankings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RankedChoiceQuestion;
