
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
}

export const useSentimentQuestion = () => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRandomQuestion = async () => {
    setLoading(true);
    try {
      // Get user's IP address (or a placeholder for testing)
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown-ip-' + Math.random().toString(36).substring(7));
      
      console.log("Fetching question for IP:", ipAddress);
      
      // Get all active questions first
      const { data: allQuestions, error } = await supabase
        .from('survey_questions')
        .select('id, text')
        .eq('active', true);
        
      if (error) {
        console.error('Error fetching questions:', error);
        toast.error('Failed to load survey question');
        setQuestion(null);
        return;
      }

      if (!allQuestions || allQuestions.length === 0) {
        console.log("No active questions found");
        setQuestion(null);
        return;
      }

      // Randomly select 1 question
      const randomIndex = Math.floor(Math.random() * allQuestions.length);
      const selectedQuestion = allQuestions[randomIndex];
      
      console.log("Selected question:", selectedQuestion);
      setQuestion(selectedQuestion);
      
    } catch (error) {
      console.error('Failed to fetch question:', error);
      toast.error('Failed to load survey question');
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useSentimentQuestion hook initialized, fetching question");
    fetchRandomQuestion();
    
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
          // When questions change, refresh the question
          if (payload.eventType === 'INSERT') {
            toast('New survey question available!', {
              action: {
                label: 'Refresh',
                onClick: () => fetchRandomQuestion()
              }
            });
          } else {
            // Refresh question for any other change
            fetchRandomQuestion();
          }
        }
      )
      .subscribe();
    
    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    question,
    loading,
    fetchRandomQuestion
  };
};
