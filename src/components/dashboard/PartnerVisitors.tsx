import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye, Copy, Download, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PartnerVisitorsProps {
  selectedPartner?: string;
}

interface EngagementData {
  visits: number;
  copy_clicks: number;
  download_clicks: number;
  wallet_adds: number;
  congrats_views: number;
}

const PartnerVisitors: React.FC<PartnerVisitorsProps> = ({ selectedPartner }) => {
  const [engagementData, setEngagementData] = useState<EngagementData>({
    visits: 0,
    copy_clicks: 0,
    download_clicks: 0,
    wallet_adds: 0,
    congrats_views: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchEngagementData = async () => {
    try {
      setLoading(true);
      
      let allEvents = [];
      
      if (selectedPartner) {
        // Query events (engagement_events doesn't have partner_id column)
        const { data: events, error: eventsError } = await supabase
          .from('engagement_events')
          .select('event_type, coupon_id');
        
        if (eventsError) throw eventsError;
        allEvents = events || [];
      } else {
        // For "All Locations", get all events
        const { data, error } = await supabase
          .from('engagement_events')
          .select('event_type, coupon_id');
        
        if (error) throw error;
        allEvents = data || [];
      }
      
      // Count events by type
      const eventCounts = allEvents.reduce((acc, event) => {
        switch (event.event_type) {
          case 'visit_partner_page':
            acc.visits++;
            break;
          case 'copy_code':
            acc.copy_clicks++;
            break;
          case 'download_coupon':
            acc.download_clicks++;
            break;
          case 'add_to_wallet':
            acc.wallet_adds++;
            break;
          case 'view_congratulations':
            acc.congrats_views++;
            break;
        }
        return acc;
      }, {
        visits: 0,
        copy_clicks: 0,
        download_clicks: 0,
        wallet_adds: 0,
        congrats_views: 0
      });
      
      setEngagementData(eventCounts);
      
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      toast.error('Failed to load engagement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagementData();
    
    // Set up real-time subscription for engagement events
    const channel = supabase
      .channel('engagement_events_channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'engagement_events' }, 
        () => {
          fetchEngagementData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPartner]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalEngagement = engagementData.copy_clicks + engagementData.download_clicks + engagementData.wallet_adds;
  const conversionRate = engagementData.visits > 0 ? ((totalEngagement / engagementData.visits) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Engagement Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Page Visits</p>
                <p className="text-2xl font-bold">{engagementData.visits}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Congratulations</p>
                <p className="text-2xl font-bold">{engagementData.congrats_views}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Copy Code</p>
                <p className="text-2xl font-bold">{engagementData.copy_clicks}</p>
              </div>
              <Copy className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Downloads</p>
                <p className="text-2xl font-bold">{engagementData.download_clicks}</p>
              </div>
              <Download className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wallet Adds</p>
                <p className="text-2xl font-bold">{engagementData.wallet_adds}</p>
              </div>
              <Users className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>User Engagement Funnel</CardTitle>
          <CardDescription>
            {selectedPartner 
              ? "How users interact with the selected location's content"
              : "Overall user engagement across all locations"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Page Visits</span>
              </div>
              <span className="text-lg font-bold">{engagementData.visits}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '100%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-medium">Reached Congratulations</span>
              </div>
              <span className="text-lg font-bold">{engagementData.congrats_views}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full" 
                style={{ 
                  width: `${engagementData.visits > 0 ? (engagementData.congrats_views / engagementData.visits) * 100 : 0}%` 
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Copy className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Copied Coupon Code</span>
              </div>
              <span className="text-lg font-bold">{engagementData.copy_clicks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-purple-500 h-3 rounded-full" 
                style={{ 
                  width: `${engagementData.visits > 0 ? (engagementData.copy_clicks / engagementData.visits) * 100 : 0}%` 
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Downloaded Coupon</span>
              </div>
              <span className="text-lg font-bold">{engagementData.download_clicks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-orange-500 h-3 rounded-full" 
                style={{ 
                  width: `${engagementData.visits > 0 ? (engagementData.download_clicks / engagementData.visits) * 100 : 0}%` 
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-red-500" />
                <span className="font-medium">Added to Wallet</span>
              </div>
              <span className="text-lg font-bold">{engagementData.wallet_adds}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full" 
                style={{ 
                  width: `${engagementData.visits > 0 ? (engagementData.wallet_adds / engagementData.visits) * 100 : 0}%` 
                }}
              ></div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Overall Conversion Rate</span>
                <span className="text-xl font-bold text-green-600">{conversionRate}%</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Percentage of visitors who took at least one action (copy, download, or wallet)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerVisitors;