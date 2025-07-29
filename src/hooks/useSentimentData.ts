
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
      
      // If user is admin, fetch the data using the sentiment summary function
      if (userData?.role === 'admin') {
        const { data: summaryData, error: summaryError } = await supabase
          .rpc('get_sentiment_summary');
            
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
        } else if (summaryData && summaryData.length > 0) {
          // Get the most recent data
          const latestData = summaryData[0];
          setSentimentData({
            happy_count: latestData.happy_count || 0,
            neutral_count: latestData.neutral_count || 0,
            concerned_count: latestData.concerned_count || 0,
            total_count: latestData.total_count || 0
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
