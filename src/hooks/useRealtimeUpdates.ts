
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeProps {
  onNewResponse: () => void;
  refreshData: () => Promise<void>;
}

export const useRealtimeUpdates = ({ onNewResponse, refreshData }: RealtimeProps) => {
  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to new responses
    const responseChannel = supabase
      .channel('public:survey_responses')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'survey_responses' }, 
        (payload) => {
          onNewResponse();
          
          // After 3 seconds, refresh the data and reset the counter
          setTimeout(() => {
            refreshData();
          }, 3000);
        }
      )
      .subscribe();
      
    // Subscribe to traffic updates
    const trafficChannel = supabase
      .channel('public:location_traffic')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'location_traffic' },
        (payload) => {
          // Update handled in refreshData
          refreshData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(responseChannel);
      supabase.removeChannel(trafficChannel);
    };
  }, [onNewResponse, refreshData]);
};
