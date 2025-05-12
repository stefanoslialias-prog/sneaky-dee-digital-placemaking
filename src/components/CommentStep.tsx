
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentStepProps {
  onComplete: (comment: string | undefined) => void;
}

const CommentStep: React.FC<CommentStepProps> = ({ onComplete }) => {
  const [comment, setComment] = useState<string>('');
  const [hasStartedTyping, setHasStartedTyping] = useState<boolean>(false);

  const handleSubmit = () => {
    onComplete(comment.trim() || undefined);
  };

  const handleSkip = () => {
    onComplete(undefined);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newComment = e.target.value;
    setComment(newComment);
    
    // Set hasStartedTyping to true if the user has typed something
    if (!hasStartedTyping && newComment.length > 0) {
      setHasStartedTyping(true);
    } else if (hasStartedTyping && newComment.length === 0) {
      setHasStartedTyping(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-playfair">Any final thoughts? (Optional)</CardTitle>
          <CardDescription>
            Share anything else you'd like us to know
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Textarea
              placeholder="Leave your feedback here..."
              className="h-32 resize-none"
              value={comment}
              onChange={handleCommentChange}
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
            className="w-full md:w-auto"
          >
            {hasStartedTyping ? 'Submit Feedback' : 'Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CommentStep;
