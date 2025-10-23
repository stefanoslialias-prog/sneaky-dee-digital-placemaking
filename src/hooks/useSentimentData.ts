
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SentimentSummary {
  happy_count: number;
  neutral_count: number;
  concerned_count: number;
  total_count: number;
}

export const useSentimentData = () => {
  const [sentimentData, setSentimentData] = useState<SentimentSummary>({
    happy_count: 0,
    neutral_count: 0,
    concerned_count: 0,
    total_count: 0
  });
  const [newResponses, setNewResponses] = useState(0);

  const fetchSentimentData = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const isAuthenticated = !!session.session;
      
      if (!isAuthenticated) {
        console.log('User not authenticated, using demo data');
        // Use demo data for non-authenticated users
        setSentimentData({
          happy_count: 320,
          neutral_count: 184,
          concerned_count: 96,
          total_count: 600
        });
        return;
      }
      
      // For authenticated users, try to fetch the role first
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.session.user.id)
        .single();
        
      if (userError) {
        console.error('Error fetching user role:', userError);
        // Use demo data if we can't confirm role
        setSentimentData({
          happy_count: 320,
          neutral_count: 184,
          concerned_count: 96,
          total_count: 600
        });
        return;
      }
      
      // If user is admin, fetch the data directly from survey_responses
      if (userData?.role === 'admin') {
        const { data: responses, error: queryError } = await supabase
          .from('survey_responses')
          .select('answer');
            
        if (queryError) {
          console.log('Error fetching survey responses:', queryError);
          console.log('Using demo sentiment data instead');
          setSentimentData({
            happy_count: 320,
            neutral_count: 184,
            concerned_count: 96,
            total_count: 600
          });
        } else if (responses) {
          // Count sentiments
          const happy = responses.filter(r => r.answer === 'happy').length;
          const neutral = responses.filter(r => r.answer === 'neutral').length;
          const concerned = responses.filter(r => r.answer === 'concerned').length;
          
          setSentimentData({
            happy_count: happy,
            neutral_count: neutral,
            concerned_count: concerned,
            total_count: responses.length
          });
        }
      } else {
        // For non-admin authenticated users, use personalized demo data
        console.log('User authenticated but not admin, using demo data');
        setSentimentData({
          happy_count: 320,
          neutral_count: 184,
          concerned_count: 96,
          total_count: 600
        });
      }
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      toast.error('Failed to load sentiment data');
      
      // Set fallback data in state
      setSentimentData({
        happy_count: 320,
        neutral_count: 184,
        concerned_count: 96,
        total_count: 600
      });
    }
  };
  
  return {
    sentimentData,
    setSentimentData,
    newResponses,
    setNewResponses,
    fetchSentimentData
  };
};
