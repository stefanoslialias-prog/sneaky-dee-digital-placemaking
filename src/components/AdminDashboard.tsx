
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { DatabaseBackup, Users, FileText, LayoutGrid, Settings } from 'lucide-react';
import SentimentOverview from '@/components/dashboard/SentimentOverview';
import LocationMap from '@/components/dashboard/LocationMap';
import ResponseTable from '@/components/dashboard/ResponseTable';
import QuestionDesigner from '@/components/dashboard/QuestionDesigner';
import LiveTraffic from '@/components/dashboard/LiveTraffic';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-2 px-6 flex justify-between items-center border-b bg-white">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user?.name}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col p-4 md:p-8 bg-toronto-gray">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-playfair">Community Pulse Dashboard</h1>
          <p className="text-gray-600">Monitor community sentiment and WiFi hotspot activity</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="bg-white rounded-lg p-2 mb-6">
            <TabsList className="grid grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <DatabaseBackup size={16} /> Overview
              </TabsTrigger>
              <TabsTrigger value="traffic" className="flex items-center gap-2">
                <LayoutGrid size={16} /> Live Traffic
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <Users size={16} /> Locations
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <Settings size={16} /> Questions
              </TabsTrigger>
              <TabsTrigger value="responses" className="flex items-center gap-2">
                <FileText size={16} /> Raw Data
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 flex flex-col">
            <TabsContent value="overview" className="flex-1 flex flex-col">
              <SentimentOverview />
            </TabsContent>

            <TabsContent value="traffic" className="flex-1">
              <LiveTraffic />
            </TabsContent>
            
            <TabsContent value="locations" className="flex-1">
              <LocationMap />
            </TabsContent>
            
            <TabsContent value="questions" className="flex-1">
              <QuestionDesigner />
            </TabsContent>
            
            <TabsContent value="responses" className="flex-1">
              <ResponseTable />
            </TabsContent>
          </div>
        </Tabs>
      </main>
      
      <footer className="py-3 px-6 text-center text-sm text-gray-500 border-t">
        <p>&copy; {new Date().getFullYear()} City of Toronto Community Pulse Dashboard</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
