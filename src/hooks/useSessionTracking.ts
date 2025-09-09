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
    
    // Check if there's a collected email from the welcome screen
    const collectedEmail = localStorage.getItem('collectedEmail');
    console.log('startNewSession: Looking for collectedEmail in localStorage:', collectedEmail);
    if (collectedEmail) {
      console.log('startNewSession: Found email, tracking event with session:', newSessionId);
      // Track the email with the proper session ID
      trackEvent('email_collected', newSessionId, newPartnerId, undefined, undefined, { 
        email: collectedEmail 
      });
      // Clean up temp storage
      localStorage.removeItem('collectedEmail');
      localStorage.removeItem('tempSessionId');
      console.log('startNewSession: Email tracking complete, cleaned up localStorage');
    } else {
      console.log('startNewSession: No collectedEmail found in localStorage');
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