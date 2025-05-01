
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
        setLocations([]);
        return;
      }
      
      // For each location, get the traffic data
      const locationsWithTraffic = await Promise.all(
        locationsData.map(async (location) => {
          const { data: trafficData, error: trafficError } = await supabase
            .from('location_traffic')
            .select('timestamp, device_count')
            .eq('location_id', location.id)
            .order('timestamp', { ascending: false })
            .limit(24);
            
          if (trafficError) throw trafficError;
          
          const formattedTraffic = trafficData?.map(record => ({
            time: new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            devices: record.device_count
          })) || [];
          
          return {
            id: location.id,
            name: location.name,
            trafficData: formattedTraffic.reverse(),
            currentTraffic: formattedTraffic.length > 0 ? formattedTraffic[formattedTraffic.length - 1].devices : 0
          };
        })
      );
      
      setLocations(locationsWithTraffic);
    } catch (error) {
      console.error('Error fetching location traffic:', error);
      toast.error('Failed to load traffic data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewTrafficData = (newTraffic: TrafficData) => {
    setNewTrafficCount(count => count + 1);
    
    // Update the specific location with new traffic data
    setLocations(prev => prev.map(location => {
      if (location.id === newTraffic.location_id) {
        const newTrafficPoint = {
          time: new Date(newTraffic.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          devices: newTraffic.device_count
        };
        
        const updatedTrafficData = [...location.trafficData, newTrafficPoint].slice(-24);
        
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
