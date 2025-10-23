
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  type?: string;
  options?: string[] | unknown;
}

export const useSentimentQuestion = (partnerId?: string) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      console.log("Fetching all active questions");
      
      // Get all active questions, optionally filtered by partner
      let query = supabase
        .from('survey_questions')
        .select('id, text, type, options')
        .eq('active', true)
        .order('order', { ascending: true });

      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }

      const { data: allQuestions, error } = await query;
        
      if (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to load survey questions');
        setQuestions([]);
        return;
      }

      if (!allQuestions || allQuestions.length === 0) {
        console.log("No active questions found, using default question");
        // Set a default question when none are available
        setQuestions([{
          id: 'default-question',
          text: 'How would you rate your overall experience today?'
        }]);
        return;
      }

      console.log(`Found ${allQuestions.length} active questions`);
      setQuestions(allQuestions);
      
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      toast.error('Failed to load survey questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useSentimentQuestion hook initialized, fetching questions");
    fetchQuestions();
    
    // Set up real-time subscription to survey_questions table
    const channel = supabase
      .channel('survey_questions_changes')
      .on('postgres_changes', 
        { 
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public', 
          table: 'survey_questions'
        }, 
        (payload) => {
          // When questions change, refresh the questions
          if (payload.eventType === 'INSERT') {
            toast('New survey question available!', {
              action: {
                label: 'Refresh',
                onClick: () => fetchQuestions()
              }
            });
          } else {
            // Refresh questions for any other change
            fetchQuestions();
          }
        }
      )
      .subscribe();
    
    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId]); // Re-fetch when partnerId changes

  return {
    questions,
    loading,
    fetchQuestions
  };
};
