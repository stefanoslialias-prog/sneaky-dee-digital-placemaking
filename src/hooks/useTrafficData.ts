
import { useState } from 'react';

export interface TrafficData {
  day: string;
  footTraffic: number;
}

export const useTrafficData = () => {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  
  // Generate more interesting demo traffic data
  const generateTrafficData = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const baseTraffic = 1200;
    
    return days.map((day, index) => {
      // Create some patterns - higher on weekends, dip mid-week
      let multiplier = 1;
      if (index === 5 || index === 6) multiplier = 1.5; // Weekend boost
      if (index === 2) multiplier = 0.8; // Mid-week dip
      if (index === 4) multiplier = 1.2; // Friday boost
      
      // Add some randomness
      const randomFactor = 0.9 + Math.random() * 0.3;
      
      return {
        day,
        footTraffic: Math.round(baseTraffic * multiplier * randomFactor)
      };
    });
  };

  const initializeTrafficData = () => {
    const demoTraffic = generateTrafficData();
    setTrafficData(demoTraffic);
    return demoTraffic;
  };
  
  return {
    trafficData,
    setTrafficData,
    initializeTrafficData
  };
};
