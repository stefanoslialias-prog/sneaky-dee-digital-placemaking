import { useState, useEffect } from 'react';
import { useEngagementTracking } from './useEngagementTracking';

export const useSessionTracking = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [partnerId, setPartnerId] = useState<string | undefined>();
  const { trackEvent } = useEngagementTracking();

  // Initialize session on first load
  useEffect(() => {
    let storedSessionId = localStorage.getItem('currentSessionId');
    let storedPartnerId = localStorage.getItem('currentPartnerId');
    
    if (!storedSessionId) {
      // Generate a new session ID
      storedSessionId = `session-${crypto.getRandomValues(new Uint32Array(2)).join('-')}-${Date.now()}`;
      localStorage.setItem('currentSessionId', storedSessionId);
    }
    
    setSessionId(storedSessionId);
    if (storedPartnerId) {
      setPartnerId(storedPartnerId);
    }
  }, []);

  const startNewSession = (newPartnerId?: string) => {
    const newSessionId = `session-${crypto.getRandomValues(new Uint32Array(2)).join('-')}-${Date.now()}`;
    localStorage.setItem('currentSessionId', newSessionId);
    setSessionId(newSessionId);
    setPartnerId(newPartnerId);
    
    // Persist partnerId to localStorage for future events
    if (newPartnerId) {
      localStorage.setItem('currentPartnerId', newPartnerId);
    } else {
      localStorage.removeItem('currentPartnerId');
    }
    
    // Track visit event
    trackEvent('visit_partner_page', newSessionId, newPartnerId);
  };

  const trackSessionEvent = (eventType: string, couponId?: string, questionId?: string, metadata?: Record<string, any>) => {
    if (sessionId) {
      trackEvent(eventType, sessionId, partnerId, couponId, questionId, metadata);
    }
  };

  return {
    sessionId,
    partnerId,
    startNewSession,
    trackSessionEvent
  };
};