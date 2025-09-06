import { supabase } from '@/integrations/supabase/client';

export const useEngagementTracking = () => {
  const trackEvent = async (
    eventType: string,
    sessionId: string,
    partnerId?: string,
    couponId?: string,
    questionId?: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      const { error } = await supabase
        .from('engagement_events')
        .insert({
          event_type: eventType,
          session_id: sessionId,
          partner_id: partnerId,
          coupon_id: couponId,
          question_id: questionId,
          metadata
        });

      if (error) {
        console.error('Error tracking engagement event:', error);
      }
    } catch (error) {
      console.error('Error tracking engagement event:', error);
    }
  };

  return { trackEvent };
};