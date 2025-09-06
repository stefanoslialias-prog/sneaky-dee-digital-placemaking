
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSessionTracking } from '@/hooks/useSessionTracking';

interface CommentStepProps {
  onComplete: (comment?: string) => void;
  responseId?: string;
}

const CommentStep: React.FC<CommentStepProps> = ({ onComplete, responseId }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sessionId } = useSessionTracking();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Please enter a comment before submitting.");
      return;
    }

    if (!responseId || !sessionId) {
      toast.error("Unable to save comment. Please try again.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Sanitize the comment before storing
      const sanitizedComment = comment.trim()
        .replace(/[<>'"&]/g, '') // Remove common XSS characters
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
        .substring(0, 500); // Enforce length limit
      
      if (!sanitizedComment) {
        toast.error("Invalid comment. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Use the secure RPC function to update the comment
      const { data, error } = await supabase.rpc('update_response_comment', {
        p_response_id: responseId,
        p_comment: sanitizedComment,
        p_session_id: sessionId
      });

      if (error) {
        console.error('Error saving comment:', error);
        toast.error("Failed to save comment. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if (!data) {
        toast.error("Unable to link comment to response. Please try again.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Thank you for your feedback!");
      onComplete(sanitizedComment);
    } catch (error) {
      console.error('Error saving comment:', error);
      toast.error("Something went wrong. Please try again.");
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
