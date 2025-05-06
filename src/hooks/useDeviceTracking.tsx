
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useDeviceTracking() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, this would come from the WiFi sniffer
    // For demo purposes, we'll use a random ID or get from local storage
    const storedDeviceId = localStorage.getItem('deviceId');
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      const newDeviceId = `browser-${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('deviceId', newDeviceId);
      setDeviceId(newDeviceId);
      
      // Record device in database
      recordDeviceInDatabase(newDeviceId);
    }
  }, []);

  const recordDeviceInDatabase = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .insert({
          mac_address: deviceId,
          opt_in: false
        });
        
      if (error) {
        console.error('Error recording device:', error);
      }
    } catch (err) {
      console.error('Failed to record device:', err);
    }
  };

  return { deviceId };
}
