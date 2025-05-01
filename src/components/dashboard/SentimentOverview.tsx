
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface SentimentSummary {
  happy_count: number;
  neutral_count: number;
  concerned_count: number;
  total_count: number;
}

interface LocationSummary {
  id: string;
  name: string;
  totalSessions: number;
  footTraffic: number;
}

const SentimentOverview: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<SentimentSummary>({
    happy_count: 0,
    neutral_count: 0,
    concerned_count: 0,
    total_count: 0
  });
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newResponses, setNewResponses] = useState(0);
  
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch sentiment summary
        const { data: summaryData, error: summaryError } = await supabase
          .from('sentiment_summary')
          .select('*')
          .order('survey_date', { ascending: false })
          .limit(1)
          .single();
          
        if (summaryError) throw summaryError;
        
        if (summaryData) {
          setSentimentData({
            happy_count: summaryData.happy_count || 0,
            neutral_count: summaryData.neutral_count || 0,
            concerned_count: summaryData.concerned_count || 0,
            total_count: summaryData.total_count || 0
          });
        }
        
        // Fetch location data with traffic
        const { data: locationData, error: locationError } = await supabase
          .from('wifi_locations')
          .select('id, name');
          
        if (locationError) throw locationError;
        
        // Fetch traffic data for each location
        if (locationData) {
          const locationSummaries = await Promise.all(
            locationData.map(async (location) => {
              // Get latest traffic for this location
              const { data: trafficData } = await supabase
                .from('location_traffic')
                .select('device_count')
                .eq('location_id', location.id)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();
                
              // Get response count for this location
              const { count: responseCount } = await supabase
                .from('survey_responses')
                .select('*', { count: 'exact', head: true })
                .eq('location_id', location.id);
                
              return {
                id: location.id,
                name: location.name,
                totalSessions: responseCount || 0,
                footTraffic: trafficData?.device_count || 0
              };
            })
          );
          
          setLocations(locationSummaries);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to new responses
    const responseChannel = supabase
      .channel('public:survey_responses')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'survey_responses' }, 
        (payload) => {
          setNewResponses(count => count + 1);
          
          // After 3 seconds, refresh the data and reset the counter
          setTimeout(() => {
            setNewResponses(0);
            refreshData();
          }, 3000);
        }
      )
      .subscribe();
      
    // Subscribe to traffic updates
    const trafficChannel = supabase
      .channel('public:location_traffic')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'location_traffic' },
        (payload) => {
          // Update the specific location's traffic data
          const locationId = payload.new.location_id;
          setLocations(prev => 
            prev.map(loc => 
              loc.id === locationId 
                ? { ...loc, footTraffic: payload.new.device_count } 
                : loc
            )
          );
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(responseChannel);
      supabase.removeChannel(trafficChannel);
    };
  }, []);
  
  const refreshData = async () => {
    try {
      // Refresh sentiment data
      const { data: summaryData, error: summaryError } = await supabase
        .from('sentiment_summary')
        .select('*')
        .order('survey_date', { ascending: false })
        .limit(1)
        .single();
        
      if (summaryError) throw summaryError;
      
      if (summaryData) {
        setSentimentData({
          happy_count: summaryData.happy_count || 0,
          neutral_count: summaryData.neutral_count || 0,
          concerned_count: summaryData.concerned_count || 0,
          total_count: summaryData.total_count || 0
        });
      }
      
      // Refresh response counts for locations
      const updatedLocations = await Promise.all(
        locations.map(async (location) => {
          const { count: responseCount } = await supabase
            .from('survey_responses')
            .select('*', { count: 'exact', head: true })
            .eq('location_id', location.id);
            
          return {
            ...location,
            totalSessions: responseCount || 0
          };
        })
      );
      
      setLocations(updatedLocations);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };
  
  // Calculate totals from actual data
  const totalSessions = locations.reduce((sum, loc) => sum + loc.totalSessions, 0);
  const totalFootTraffic = locations.reduce((sum, loc) => sum + loc.footTraffic, 0);
  const participationRate = totalFootTraffic > 0 
    ? Math.round((totalSessions / totalFootTraffic) * 100) 
    : 0;
    
  // Calculate percentages for chart
  const happyPercentage = sentimentData.total_count > 0 
    ? Math.round((sentimentData.happy_count / sentimentData.total_count) * 100) 
    : 0;
  
  // Prepare data for the chart
  const chartData = [
    { name: 'Happy', value: sentimentData.happy_count, color: '#4ECDC4' },
    { name: 'Neutral', value: sentimentData.neutral_count, color: '#00A8E8' },
    { name: 'Concerned', value: sentimentData.concerned_count, color: '#FF6B6B' }
  ];

  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
      {/* Summary cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Total Responses
            {newResponses > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                +{newResponses} new
              </Badge>
            )}
          </CardTitle>
          <CardDescription>All locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{sentimentData.total_count.toLocaleString()}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Participation Rate</CardTitle>
          <CardDescription>Survey completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{participationRate}%</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Active Hotspots</CardTitle>
          <CardDescription>WiFi locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{locations.length}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Community Pulse</CardTitle>
          <CardDescription>Current sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full bg-toronto-teal`}></div>
            <span className="text-lg font-semibold">{happyPercentage}%</span>
            <span className="text-sm text-gray-500">Positive</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Sentiment chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>
            How people are feeling across all locations
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} responses`, 'Count']}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Location performance */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Location Insights</CardTitle>
          <CardDescription>
            Hotspots with highest engagement rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locations.slice(0, 3).map((location) => (
              <div key={location.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{location.name}</div>
                  <div className="text-sm text-gray-500">
                    {location.footTraffic > 0 ? Math.round((location.totalSessions / location.footTraffic) * 100) : 0}% participation
                  </div>
                </div>
                <div className="text-lg font-semibold">
                  {location.totalSessions.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentOverview;
