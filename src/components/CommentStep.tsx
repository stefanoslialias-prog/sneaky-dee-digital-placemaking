
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CommentStepProps {
  onComplete: (comment?: string) => void;
}

const CommentStep: React.FC<CommentStepProps> = ({ onComplete }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Get the latest survey response for this session
      const sessionId = localStorage.getItem('currentSessionId');
      
      if (comment.trim() && sessionId) {
        // Sanitize comment to prevent XSS attacks
        const sanitizedComment = comment.trim()
          .replace(/[<>]/g, '') // Remove potential HTML tags
          .substring(0, 500); // Enforce length limit
        
        // If we have a comment and a session ID, update the response
        const { error } = await supabase
          .from('survey_responses')
          .update({ comment: sanitizedComment })
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) {
          console.error('Error saving comment:', error);
          toast.error('Failed to save comment');
        }
      }
      
      // Call onComplete callback regardless if we updated or not
      onComplete(comment);
      
    } catch (error) {
      console.error('Comment submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-playfair text-center">Any final thoughts?</CardTitle>
          <CardDescription className="text-center">(Optional)</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Share additional feedback here..."
            value={comment}
            onChange={(e) => {
              // Input validation and XSS prevention
              const value = e.target.value;
              if (value.length <= 500) { // Limit comment length
                setComment(value);
              }
            }}
            className="min-h-[120px]"
            maxLength={500}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !comment.trim()}
          >
            Submit
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CommentStep;
