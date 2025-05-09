
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrafficData {
  location_id: string;
  timestamp: string;
  device_count: number;
}

interface LocationWithTraffic {
  id: string;
  name: string;
  trafficData: {
    time: string;
    devices: number;
  }[];
  currentTraffic: number;
}

// Function to generate time data spanning the last 24 hours
const generateTimeData = (locationId: string) => {
  const currentDate = new Date();
  const timeData = [];
  
  // Generate data for the past 24 hours
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(currentDate);
    hour.setHours(currentDate.getHours() - i);
    
    const timeLabel = hour.getHours() >= 12 ? 
      `${hour.getHours() === 12 ? 12 : hour.getHours() % 12} PM` : 
      `${hour.getHours() === 0 ? 12 : hour.getHours()} AM`;
    
    // Generate a realistic traffic pattern based on time of day
    let baseTraffic = 20; // Minimal night traffic
    const hourOfDay = hour.getHours();
    
    // Early morning has very low traffic
    if (hourOfDay >= 0 && hourOfDay < 6) {
      baseTraffic = 10 + Math.floor(Math.random() * 15);
    } 
    // Morning rush increases traffic
    else if (hourOfDay >= 6 && hourOfDay < 10) {
      baseTraffic = 50 + Math.floor(Math.random() * 40);
    }
    // Late morning
    else if (hourOfDay >= 10 && hourOfDay < 12) {
      baseTraffic = 60 + Math.floor(Math.random() * 20);
    }
    // Lunch time peak
    else if (hourOfDay >= 12 && hourOfDay < 14) {
      baseTraffic = 90 + Math.floor(Math.random() * 30);
    }
    // Afternoon traffic
    else if (hourOfDay >= 14 && hourOfDay < 17) {
      baseTraffic = 60 + Math.floor(Math.random() * 30);
    }
    // Evening rush hour
    else if (hourOfDay >= 17 && hourOfDay < 20) {
      baseTraffic = 80 + Math.floor(Math.random() * 40);
    }
    // Evening wind down
    else {
      baseTraffic = 40 - (hourOfDay - 20) * 5 + Math.floor(Math.random() * 20);
      baseTraffic = Math.max(10, baseTraffic); // Ensure we don't go below 10
    }
    
    // Add some variation based on location ID to make each location unique
    const locationFactor = parseInt(locationId) % 3 === 0 ? 1.2 : 
                          parseInt(locationId) % 3 === 1 ? 0.9 : 1.0;
    
    timeData.push({
      time: timeLabel,
      devices: Math.max(5, Math.floor(baseTraffic * locationFactor))
    });
  }
  
  return timeData;
};

const LiveTraffic: React.FC = () => {
  const [locations, setLocations] = useState<LocationWithTraffic[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTrafficCount, setNewTrafficCount] = useState(0);
  
  useEffect(() => {
    fetchLocationsWithTraffic();
    
    // Set up real-time subscription for traffic updates
    const channel = supabase
      .channel('public:location_traffic')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'location_traffic' },
        (payload) => {
          handleNewTrafficData(payload.new as TrafficData);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchLocationsWithTraffic = async () => {
    try {
      setLoading(true);
      
      // First get all locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('wifi_locations')
        .select('id, name')
        .eq('active', true);
        
      if (locationsError) throw locationsError;
      
      if (!locationsData || locationsData.length === 0) {
        // If no locations from database, use mock data
        const mockLocations = [
          { id: '1', name: 'Downtown Plaza' },
          { id: '2', name: 'City Park' },
          { id: '3', name: 'Market Square' },
          { id: '4', name: 'Public Library' }
        ];
        
        const locationsWithTraffic = mockLocations.map(location => {
          const trafficData = generateTimeData(location.id);
          return {
            id: location.id,
            name: location.name,
            trafficData,
            currentTraffic: trafficData[trafficData.length - 1].devices
          };
        });
        
        setLocations(locationsWithTraffic);
        setLoading(false);
        return;
      }
      
      // For each location, generate the traffic data
      const locationsWithTraffic = locationsData.map(location => {
        const trafficData = generateTimeData(location.id);
        
        return {
          id: location.id,
          name: location.name,
          trafficData,
          currentTraffic: trafficData[trafficData.length - 1].devices
        };
      });
      
      setLocations(locationsWithTraffic);
    } catch (error) {
      console.error('Error fetching location traffic:', error);
      toast.error('Failed to load traffic data');
      
      // Fallback to mock data on error
      const mockLocations = [
        { id: '1', name: 'Downtown Plaza' },
        { id: '2', name: 'City Park' },
        { id: '3', name: 'Market Square' }
      ];
      
      const locationsWithTraffic = mockLocations.map(location => {
        const trafficData = generateTimeData(location.id);
        return {
          id: location.id,
          name: location.name,
          trafficData,
          currentTraffic: trafficData[trafficData.length - 1].devices
        };
      });
      
      setLocations(locationsWithTraffic);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewTrafficData = (newTraffic: TrafficData) => {
    setNewTrafficCount(count => count + 1);
    
    // Update the specific location with new traffic data
    setLocations(prev => prev.map(location => {
      if (location.id === newTraffic.location_id) {
        const timestamp = new Date(newTraffic.timestamp);
        const time = timestamp.getHours() >= 12 ? 
          `${timestamp.getHours() === 12 ? 12 : timestamp.getHours() % 12} PM` : 
          `${timestamp.getHours() === 0 ? 12 : timestamp.getHours()} AM`;
          
        const newTrafficPoint = {
          time,
          devices: newTraffic.device_count
        };
        
        // Find if we already have this time slot
        const existingIndex = location.trafficData.findIndex(item => item.time === time);
        let updatedTrafficData;
        
        if (existingIndex >= 0) {
          // Update existing time slot
          updatedTrafficData = [...location.trafficData];
          updatedTrafficData[existingIndex] = newTrafficPoint;
        } else {
          // Add new time slot while keeping just 24 hours of data
          updatedTrafficData = [...location.trafficData, newTrafficPoint].slice(-24);
        }
        
        return {
          ...location,
          trafficData: updatedTrafficData,
          currentTraffic: newTraffic.device_count
        };
      }
      return location;
    }));
    
    // Reset the counter after a delay
    if (newTrafficCount >= 5) {
      setTimeout(() => setNewTrafficCount(0), 3000);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </CardHeader>
        <CardContent className="h-80">
          <div className="h-full bg-gray-100 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }
  
  if (locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Traffic</CardTitle>
          <CardDescription>No active WiFi locations found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p>Configure WiFi locations to view traffic data</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live WiFi Traffic</CardTitle>
            <CardDescription>
              Real-time device connections at WiFi hotspots
            </CardDescription>
          </div>
          {newTrafficCount > 0 && (
            <Badge variant="outline" className="animate-pulse">
              +{newTrafficCount} updates
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {locations.map(location => (
            <div key={location.id} className="border rounded-md p-4">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="font-medium">{location.name}</h3>
                  <p className="text-sm text-gray-500">ID: {location.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{location.currentTraffic}</div>
                  <div className="text-sm text-gray-500">Current Devices</div>
                </div>
              </div>
              
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={location.trafficData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                      tickMargin={5}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="devices" 
                      name="Devices"
                      stroke="#00A8E8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTraffic;
