
import React from 'react';
import { Button } from '@/components/ui/button';

export type Sentiment = 'happy' | 'neutral' | 'concerned';

const sentimentOptions: { value: Sentiment; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'neutral', emoji: '😐', label: 'Just fine' },
  { value: 'concerned', emoji: '😟', label: 'Concerned' },
];

interface SentimentOptionsProps {
  onSentimentSelect: (sentiment: Sentiment) => void;
  isSubmitting: boolean;
  selectedSentiment: Sentiment | null;
}

const SentimentOptions: React.FC<SentimentOptionsProps> = ({
  onSentimentSelect,
  isSubmitting,
  selectedSentiment
}) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {sentimentOptions.map((option) => (
        <Button
          key={option.value}
          variant="outline"
          onClick={() => onSentimentSelect(option.value)}
          disabled={isSubmitting}
          className={`h-24 flex flex-col items-center justify-center gap-2 border-2 transition-all ${
            selectedSentiment === option.value 
              ? 'bg-toronto-blue text-white border-toronto-blue' 
              : 'hover:bg-toronto-gray'
          } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="text-3xl">{option.emoji}</span>
          <span>{option.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default SentimentOptions;
