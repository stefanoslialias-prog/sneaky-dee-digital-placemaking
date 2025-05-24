
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useDeviceTracking() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const initializeDeviceId = async () => {
      try {
        // Check for existing device ID
        const storedDeviceId = localStorage.getItem('deviceId');
        
        if (storedDeviceId && storedDeviceId.length >= 10) {
          // Validate existing device ID format
          if (/^[a-f0-9]+$/i.test(storedDeviceId)) {
            setDeviceId(storedDeviceId);
            return;
          } else {
            // Remove invalid device ID
            localStorage.removeItem('deviceId');
          }
        }
        
        // Generate new secure device ID using crypto API
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        const newDeviceId = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        
        localStorage.setItem('deviceId', newDeviceId);
        setDeviceId(newDeviceId);
        
        // Record device in database with error handling
        await recordDeviceInDatabase(newDeviceId);
      } catch (error) {
        console.error('Error initializing device ID:', error);
        // Fallback to timestamp-based ID if crypto fails
        const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
        localStorage.setItem('deviceId', fallbackId);
        setDeviceId(fallbackId);
      }
    };

    initializeDeviceId();
  }, []);

  const recordDeviceInDatabase = async (deviceId: string) => {
    try {
      // Validate device ID before inserting
      if (!deviceId || deviceId.length < 10) {
        throw new Error('Invalid device ID');
      }

      const { error } = await supabase
        .from('devices')
        .insert({
          mac_address: deviceId,
          opt_in: false
        });
        
      if (error) {
        console.error('Error recording device:', error);
      } else {
        console.log('Device recorded successfully:', deviceId.substring(0, 8) + '...');
      }
    } catch (err) {
      console.error('Failed to record device:', err);
    }
  };

  return { deviceId };
}
