
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
        return sentimentData;
      }
      
      // Try to fetch data from sentiment_summary view using RLS-secured approach
      const { data: summaryData, error: summaryError } = await supabase
        .from('sentiment_summary')
        .select('*')
        .order('survey_date', { ascending: false })
        .limit(1)
        .single();
          
      if (summaryError) {
        console.log('Error fetching sentiment summary:', summaryError);
        console.log('Using demo sentiment data instead');
        // Use demo data if we can't get real data
        setSentimentData({
          happy_count: 320,
          neutral_count: 184,
          concerned_count: 96,
          total_count: 600
        });
      } else if (summaryData) {
        setSentimentData({
          happy_count: summaryData.happy_count || 0,
          neutral_count: summaryData.neutral_count || 0,
          concerned_count: summaryData.concerned_count || 0,
          total_count: summaryData.total_count || 0
        });
      }
      
      return sentimentData;
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      toast.error('Failed to load sentiment data');
      
      // Return fallback data
      return {
        happy_count: 320,
        neutral_count: 184,
        concerned_count: 96,
        total_count: 600
      };
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
