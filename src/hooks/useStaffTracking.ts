import { useEffect } from 'react';
import { useDeviceTracking } from './useDeviceTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useStaffTracking(userEmail: string | undefined) {
  const { deviceId } = useDeviceTracking();

  useEffect(() => {
    const linkStaffToDevice = async () => {
      if (!deviceId || !userEmail) return;

      try {
        // Check if this email is already linked to this device
        const { data: existing } = await supabase
          .from('user_emails')
          .select('id')
          .eq('device_id', deviceId)
          .eq('email_address', userEmail)
          .maybeSingle();

        if (existing) {
          console.log('Staff email already linked to device');
          return;
        }

        // Link staff email to device for tracking
        const { error } = await supabase
          .from('user_emails')
          .insert({
            device_id: deviceId,
            email_address: userEmail,
            subject: 'Staff Member',
            email_content: 'Automatic staff tracking entry',
            status: 'sent'
          });

        if (error) {
          console.error('Error linking staff email to device:', error);
          return;
        }

        console.log('Staff member email linked to device for tracking');
      } catch (error) {
        console.error('Error in staff tracking:', error);
      }
    };

    linkStaffToDevice();
  }, [deviceId, userEmail]);
}
