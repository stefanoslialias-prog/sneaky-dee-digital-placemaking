
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface CommentStepProps {
  onComplete: (comment: string | undefined) => void;
  onGoBack?: () => void;
}

const CommentStep: React.FC<CommentStepProps> = ({ onComplete, onGoBack }) => {
  const [comment, setComment] = useState<string>('');

  const handleSubmit = () => {
    onComplete(comment.trim() || undefined);
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      // Fallback if no onGoBack provided
      onComplete(undefined);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">Tell us how you feel today!</CardTitle>
          <CardDescription>
            Got anything else to tell us? This step is 100% optional.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Textarea
              placeholder="Leave your feedback here..."
              className="h-32 resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="w-full md:w-auto flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Button 
            onClick={handleSubmit}
            className="w-full md:w-auto"
          >
            Skip
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CommentStep;
