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
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      // Enrich metadata with auth context if user is logged in
      const enrichedMetadata = {
        ...metadata,
        ...(user && {
          auth_provider: user.app_metadata?.provider || 'email',
          auth_email: user.email,
          user_id: user.id
        })
      };

      const { error } = await supabase
        .from('engagement_events')
        .insert({
          event_type: eventType,
          session_id: sessionId,
          partner_id: partnerId,
          coupon_id: couponId,
          question_id: questionId,
          metadata: enrichedMetadata
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