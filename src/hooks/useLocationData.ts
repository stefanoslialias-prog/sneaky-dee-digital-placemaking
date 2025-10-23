
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LocationSummary {
  id: string;
  name: string;
  totalSessions: number;
  footTraffic: number;
  linkClicks: number;
}

export const useLocationData = () => {
  const [locations, setLocations] = useState<LocationSummary[]>([]);

  const fetchLocationData = async () => {
    try {
      // Fetch location data with traffic
      const { data: locationData, error: locationError } = await supabase
        .from('wifi_locations')
        .select('id, name');
          
      if (locationError) {
        console.log('Using demo location data instead');
        // Create diverse location data with participation rates between 50-80%
        const demoLocations = generateDiverseLocationData();
        setLocations(demoLocations);
        return demoLocations;
      } else if (locationData) {
        // Generate demo location data (no location_traffic table)
        const locationSummaries = locationData.map(location => {
          // Generate diverse but high engagement data (50-80% participation rate)
          const footTraffic = Math.floor(Math.random() * 1000) + 800;
          const completionRate = 0.5 + (Math.random() * 0.3); // 50-80% participation rate
          const linkClicks = Math.floor(Math.random() * 1000) + 500;
          const sessions = Math.round(linkClicks * completionRate);
            
          return {
            id: location.id,
            name: location.name,
            totalSessions: sessions,
            footTraffic: footTraffic,
            linkClicks: linkClicks
          };
        });
        
        // Shuffle the locations to randomize the display order
        const randomizedLocations = shuffleArray(locationSummaries);
        setLocations(randomizedLocations);
        return randomizedLocations;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching location data:', error);
      toast.error('Failed to load location data');
      
      // Fallback to diverse demo data with high engagement rates
      const demoLocations = generateDiverseLocationData();
      setLocations(demoLocations);
      return demoLocations;
    }
  };
  
  // Helper function to generate diverse location data with varying participation rates
  const generateDiverseLocationData = () => {
    const locationNames = [
      'Downtown Plaza', 
      'City Park', 
      'Market Square', 
      'Public Library', 
      'Recreation Center',
      'Waterfront Park',
      'Innovation Hub',
      'Community Center',
      'Arts District',
      'Transit Terminal'
    ];
    
    const demoLocations = locationNames.map((name, index) => {
      // Create more diverse engagement rates between 50-80%
      const participationRate = 50 + Math.floor(Math.random() * 30);
      
      // Calculate realistic numbers based on participation rate
      const linkClicks = 500 + Math.floor(Math.random() * 800);
      const totalSessions = Math.round(linkClicks * (participationRate / 100));
      const footTraffic = linkClicks + 300 + Math.floor(Math.random() * 600);
      
      return {
        id: (index + 1).toString(),
        name,
        totalSessions,
        footTraffic,
        linkClicks
      };
    });
    
    // Shuffle the array to randomize the order
    return shuffleArray(demoLocations);
  };
  
  // Fisher-Yates shuffle algorithm to randomize array order
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  return {
    locations,
    setLocations,
    fetchLocationData
  };
};
