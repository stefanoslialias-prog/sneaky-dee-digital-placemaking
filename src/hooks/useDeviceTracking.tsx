
import { useState, useEffect } from 'react';

export function useDeviceTracking() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const initializeDeviceId = async () => {
      try {
        // Check for existing device ID
        const storedDeviceId = localStorage.getItem('deviceId');
        
        if (storedDeviceId && storedDeviceId.length >= 10) {
          // Validate existing device ID format
          if (/^[a-f0-9-]+$/i.test(storedDeviceId)) {
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
        
        // Device tracking via localStorage only
        console.log('Device tracked:', newDeviceId.substring(0, 8) + '...');
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

  return { deviceId };
}
