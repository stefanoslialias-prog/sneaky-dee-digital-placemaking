import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VisitorData {
  id: string;
  mac_address: string;
  first_seen_at: string;
  last_seen_at: string;
  opt_in: boolean;
  user_id?: string;
}

interface LocationData {
  id: string;
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
  device_count?: number;
}

const VisitorTracking: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorData[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    activeVisitors: 0,
    optedInVisitors: 0,
    activeLocations: 0
  });

  const fetchVisitorData = async () => {
    try {
      // Fetch devices (visitors)
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(50);

      if (devicesError) {
        console.error('Error fetching devices:', devicesError);
        // Don't throw error, just log it and continue with empty data
        setVisitors([]);
      } else {
        setVisitors(devicesData || []);
      }

      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('wifi_locations')
        .select('*')
        .order('name');

      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
        setLocations([]);
      } else {
        setLocations(locationsData || []);
      }

      // Calculate stats
      const totalVisitors = devicesData?.length || 0;
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const activeVisitors = devicesData?.filter(device => 
        new Date(device.last_seen_at) > oneHourAgo
      ).length || 0;
      
      const optedInVisitors = devicesData?.filter(device => device.opt_in).length || 0;
      const activeLocations = locationsData?.filter(location => location.active).length || 0;

      setStats({
        totalVisitors,
        activeVisitors,
        optedInVisitors,
        activeLocations
      });

    } catch (error) {
      console.error('Error fetching visitor data:', error);
      toast.error('Failed to load visitor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitorData();

    // Set up real-time subscription for new devices
    const deviceChannel = supabase
      .channel('devices_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'devices' }, 
        () => {
          fetchVisitorData();
        }
      )
      .subscribe();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchVisitorData, 30000);

    return () => {
      supabase.removeChannel(deviceChannel);
      clearInterval(interval);
    };
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const isActive = (lastSeenAt: string) => {
    const now = new Date();
    const lastSeen = new Date(lastSeenAt);
    const diffMs = now.getTime() - lastSeen.getTime();
    return diffMs < 60 * 60 * 1000; // Active if seen within last hour
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-toronto-blue"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold">{stats.totalVisitors}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Now</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeVisitors}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Opted In</p>
                <p className="text-2xl font-bold text-purple-600">{stats.optedInVisitors}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Locations</p>
                <p className="text-2xl font-bold">{stats.activeLocations}</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Visitors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visitors</CardTitle>
          <CardDescription>
            Latest visitors detected through WiFi gateway connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visitors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No visitors detected yet. Make sure your WiFi gateway is connected.
              </div>
            ) : (
              visitors.map((visitor) => (
                <div key={visitor.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      isActive(visitor.last_seen_at) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div>
                      <p className="font-medium">{visitor.mac_address}</p>
                      <p className="text-sm text-gray-600">
                        First seen: {formatTime(visitor.first_seen_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={visitor.opt_in ? "default" : "secondary"}>
                      {visitor.opt_in ? "Opted In" : "Anonymous"}
                    </Badge>
                    <div className="text-right text-sm text-gray-600">
                      <p>{getTimeAgo(visitor.last_seen_at)}</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last seen</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* WiFi Locations */}
      <Card>
        <CardHeader>
          <CardTitle>WiFi Locations</CardTitle>
          <CardDescription>
            Configured hotspot locations for visitor tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {locations.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                No WiFi locations configured yet.
              </div>
            ) : (
              locations.map((location) => (
                <div key={location.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{location.name}</h3>
                    <Badge variant={location.active ? "default" : "secondary"}>
                      {location.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {location.description && (
                    <p className="text-sm text-gray-600 mb-2">{location.description}</p>
                  )}
                  {location.latitude && location.longitude && (
                    <p className="text-xs text-gray-500">
                      Coordinates: {location.latitude}, {location.longitude}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorTracking;
