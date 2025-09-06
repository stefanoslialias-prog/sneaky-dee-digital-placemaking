
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DatabaseBackup, Users, FileText, LayoutGrid, Settings, Wifi, ArrowLeft, Gift, Eye } from 'lucide-react';
import SentimentOverview from '@/components/dashboard/SentimentOverview';
import LocationMap from '@/components/dashboard/LocationMap';
import ResponseTable from '@/components/dashboard/ResponseTable';
import QuestionDesigner from '@/components/dashboard/QuestionDesigner';
import LiveTraffic from '@/components/dashboard/LiveTraffic';
import CouponManager from '@/components/dashboard/CouponManager';
import VisitorTracking from '@/components/dashboard/VisitorTracking';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';

interface Partner {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [liveStatus, setLiveStatus] = useState({
    newResponses: 0,
    newTraffic: 0
  });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Redirect directly to the survey page
  };

  // Fetch partners for filter
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase
          .from('partners')
          .select('id, name, slug, active')
          .eq('active', true)
          .order('name');
        
        if (error) throw error;
        setPartners(data || []);
      } catch (error) {
        console.error('Error fetching partners:', error);
      }
    };
    
    fetchPartners();
  }, []);
  
  // Subscribe to real-time events
  useEffect(() => {
    // Clear any previous channels to avoid duplicates
    const cleanup = async () => {
      await supabase.removeAllChannels();
    };
    
    cleanup();
    
    // Subscribe to new responses
    const responseChannel = supabase
      .channel('responses-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'survey_responses' }, 
        (payload) => {
          console.log('New response received in AdminDashboard:', payload);
          setLiveStatus(prev => ({...prev, newResponses: prev.newResponses + 1}));
        }
      )
      .subscribe();
      
    // Subscribe to traffic updates
    const trafficChannel = supabase
      .channel('traffic-channel')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'location_traffic' },
        (payload) => {
          setLiveStatus(prev => ({...prev, newTraffic: prev.newTraffic + 1}));
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(responseChannel);
      supabase.removeChannel(trafficChannel);
    };
  }, []);
  
  // Reset counters when switching tabs
  useEffect(() => {
    if (activeTab === 'responses') {
      setLiveStatus(prev => ({...prev, newResponses: 0}));
    } else if (activeTab === 'traffic') {
      setLiveStatus(prev => ({...prev, newTraffic: 0}));
    }
  }, [activeTab]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-2 px-6 flex justify-between items-center border-b bg-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/44ecadf7-cd63-4fc4-82e4-41c3fc93b390.png"
              alt="KinesisIQ"
              className="h-8"
            />
            <Badge variant="outline" className="bg-green-50 text-green-700 animate-pulse">
              <Wifi className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
          <img 
            src="/lovable-uploads/68284ad5-d0ad-4d79-9dcb-65d03682dbcd.png" 
            alt="Digital Placemaking" 
            className="h-7" 
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Partner:</span>
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-1 mr-2">
              <ArrowLeft size={12} className="mr-1" />
              Back to Survey
            </Button>
          </Link>
          <span className="text-sm text-gray-600">
            Welcome, {user?.name || 'Admin'}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col p-4 md:p-8 bg-toronto-gray">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-playfair">Community Pulse Dashboard</h1>
          <p className="text-gray-600">Real-time control center for community sentiment and WiFi hotspots</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white rounded-lg p-2 mb-6">
            <TabsList className="grid grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <DatabaseBackup size={16} /> Overview
              </TabsTrigger>
              <TabsTrigger value="visitors" className="flex items-center gap-2">
                <Eye size={16} /> Visitors
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <Users size={16} /> Locations
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <Settings size={16} /> Questions
              </TabsTrigger>
              <TabsTrigger value="coupons" className="flex items-center gap-2">
                <Gift size={16} /> Coupons
              </TabsTrigger>
              <TabsTrigger value="responses" className="flex items-center gap-2">
                <FileText size={16} /> 
                Raw Data
                {liveStatus.newResponses > 0 && (
                  <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center bg-blue-500 text-white">
                    {liveStatus.newResponses}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 flex flex-col">
            <TabsContent value="overview" className="flex-1 flex flex-col">
              <SentimentOverview selectedPartner={selectedPartner === 'all' ? undefined : selectedPartner} />
            </TabsContent>

            <TabsContent value="visitors" className="flex-1">
              <VisitorTracking selectedPartner={selectedPartner === 'all' ? undefined : selectedPartner} />
            </TabsContent>
            
            <TabsContent value="locations" className="flex-1">
              <LocationMap selectedPartner={selectedPartner === 'all' ? undefined : selectedPartner} />
            </TabsContent>
            
            <TabsContent value="questions" className="flex-1">
              <QuestionDesigner selectedPartner={selectedPartner === 'all' ? undefined : selectedPartner} />
            </TabsContent>

            <TabsContent value="coupons" className="flex-1">
              <CouponManager selectedPartner={selectedPartner === 'all' ? undefined : selectedPartner} />
            </TabsContent>
            
            <TabsContent value="responses" className="flex-1">
              <ResponseTable selectedPartner={selectedPartner === 'all' ? undefined : selectedPartner} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      
      <footer className="py-3 px-6 text-center text-sm text-gray-500 border-t">
        <p>&copy; {new Date().getFullYear()} City of Toronto Community Pulse Dashboard | Real-time control center</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
