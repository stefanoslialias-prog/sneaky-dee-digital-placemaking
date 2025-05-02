
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, MessageSquare } from 'lucide-react';

interface CommentStepProps {
  onComplete: (comment: string | undefined) => void;
}

const CommentStep: React.FC<CommentStepProps> = ({ onComplete }) => {
  const [comment, setComment] = useState<string>('');

  const handleSubmit = () => {
    onComplete(comment.trim() || undefined);
  };

  const handleSkip = () => {
    onComplete(undefined);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">Share Your Thoughts (Optional)</CardTitle>
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
            onClick={handleSkip}
            className="w-full md:w-auto"
          >
            Skip
          </Button>
          <Button 
            onClick={handleSubmit}
            className="w-full md:w-auto flex items-center gap-2"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CommentStep;
