import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBar, ChartPie, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SentimentChart from './charts/SentimentChart';

interface PartnerOverviewProps {
  selectedPartner?: string;
}

interface PartnerData {
  partner_id: string;
  name: string;
  slug: string;
  total_responses: number;
  happy_count: number;
  neutral_count: number;
  concerned_count: number;
  respondent_sessions: number;
  visits: number;
  copy_clicks: number;
  download_clicks: number;
  wallet_adds: number;
}

interface EngagementData {
  visits: number;
  copy_clicks: number;
  download_clicks: number;
  wallet_adds: number;
  congrats_views: number;
  opt_in_prompt_shown: number;
  opt_in_yes: number;
  opt_in_no: number;
  opt_in_email_submitted: number;
}

const PartnerOverview: React.FC<PartnerOverviewProps> = ({ selectedPartner }) => {
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementData>({
    visits: 0,
    copy_clicks: 0,
    download_clicks: 0,
    wallet_adds: 0,
    congrats_views: 0,
    opt_in_prompt_shown: 0,
    opt_in_yes: 0,
    opt_in_no: 0,
    opt_in_email_submitted: 0
  });
  const [topCoupons, setTopCoupons] = useState<Array<{ title: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchEngagementData = async () => {
    try {
      let allEvents = [];
      
      if (selectedPartner) {
        // Query 1: Events where partner_id matches
        const { data: directEvents, error: directError } = await supabase
          .from('engagement_events')
          .select('event_type, partner_id, coupon_id')
          .eq('partner_id', selectedPartner);
        
        if (directError) throw directError;
        
        // Query 2: Events where partner_id is null but coupon belongs to partner
        const { data: couponEvents, error: couponError } = await supabase
          .from('engagement_events')
          .select(`
            event_type, 
            partner_id,
            coupon_id,
            coupons!inner(partner_id)
          `)
          .is('partner_id', null)
          .eq('coupons.partner_id', selectedPartner);
        
        if (couponError) throw couponError;
        
        // Merge both datasets
        allEvents = [...(directEvents || []), ...(couponEvents || [])];
      } else {
        // For "All Partners", get all events
        const { data, error } = await supabase
          .from('engagement_events')
          .select('event_type, partner_id, coupon_id');
        
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

      // Count coupon claims to get top coupons
      const couponClaims = allEvents
        .filter(event => event.event_type === 'coupon_claimed' && event.coupon_id)
        .reduce((acc, event) => {
          acc[event.coupon_id] = (acc[event.coupon_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      // Get coupon titles and create top coupons list
      if (Object.keys(couponClaims).length > 0) {
        const { data: coupons } = await supabase
          .from('coupons')
          .select('id, title')
          .in('id', Object.keys(couponClaims));

        const topCouponsWithTitles = Object.entries(couponClaims)
          .map(([couponId, count]) => {
            const coupon = coupons?.find(c => c.id === couponId);
            return {
              title: coupon?.title || 'Unknown Coupon',
              count: Number(count)
            };
          })
          .sort((a, b) => b.count - a.count);

        setTopCoupons(topCouponsWithTitles);
      } else {
        setTopCoupons([]);
      }
      
    } catch (error) {
      console.error('Error fetching engagement data:', error);
    }
  };

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      
      if (selectedPartner) {
        // Fetch specific partner data using secure function
        const { data: allPartners, error } = await supabase.rpc('get_partner_analytics');
        
        if (error) {
          throw error;
        }
        
        const data = allPartners?.find(p => p.partner_id === selectedPartner) || null;
        
        if (error && error.code !== 'PGRST116') { // Not found is ok
          throw error;
        }
        
        setPartnerData(data || null);
      } else {
        // Aggregate all partners data for "All Partners" view using secure function
        const { data, error } = await supabase.rpc('get_partner_analytics');
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Aggregate the data
          const aggregated = data.reduce((acc, partner) => ({
            partner_id: 'all',
            name: 'All Partners',
            slug: 'all',
            total_responses: acc.total_responses + (partner.total_responses || 0),
            happy_count: acc.happy_count + (partner.happy_count || 0),
            neutral_count: acc.neutral_count + (partner.neutral_count || 0),
            concerned_count: acc.concerned_count + (partner.concerned_count || 0),
            respondent_sessions: acc.respondent_sessions + (partner.respondent_sessions || 0),
            visits: 0, // Will be populated from engagement data
            copy_clicks: 0, // Will be populated from engagement data
            download_clicks: 0, // Will be populated from engagement data
            wallet_adds: 0, // Will be populated from engagement data
          }), {
            partner_id: 'all',
            name: 'All Partners',
            slug: 'all',
            total_responses: 0,
            happy_count: 0,
            neutral_count: 0,
            concerned_count: 0,
            respondent_sessions: 0,
            visits: 0,
            copy_clicks: 0,
            download_clicks: 0,
            wallet_adds: 0,
          });
          
          setPartnerData(aggregated);
        } else {
          setPartnerData(null);
        }
      }
      
      // Fetch engagement data
      await fetchEngagementData();
      
    } catch (error) {
      console.error('Error fetching partner data:', error);
      toast.error('Failed to load partner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerData();
    
    // Set up real-time subscription for engagement events
    const channel = supabase
      .channel('engagement_events_overview')
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

  if (!partnerData) {
    return (
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>
            {selectedPartner 
              ? "No data found for the selected partner. Make sure questions and coupons are assigned to this partner."
              : "Please select a partner to view their overview data."
            }
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate percentages for chart
  const totalSentiment = partnerData.happy_count + partnerData.neutral_count + partnerData.concerned_count;
  const happyPercentage = totalSentiment > 0 ? ((partnerData.happy_count / totalSentiment) * 100).toFixed(1) : "0";
  
  // Format data for sentiment chart - convert to the expected format
  const sentimentChartData = {
    happy_count: partnerData.happy_count,
    neutral_count: partnerData.neutral_count,
    concerned_count: partnerData.concerned_count,
    total_count: partnerData.happy_count + partnerData.neutral_count + partnerData.concerned_count
  };

  // Calculate conversion rate (responses / visits)
  const conversionRate = partnerData.visits > 0 ? ((partnerData.total_responses / partnerData.visits) * 100).toFixed(1) : "0";

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-5">
      {/* Summary cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{partnerData.total_responses}</div>
          <p className="text-xs text-muted-foreground">
            From {partnerData.respondent_sessions} unique sessions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Happiness Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{happyPercentage}%</div>
          <p className="text-xs text-muted-foreground">
            {partnerData.happy_count} happy responses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Page Visits</CardTitle>
          <ChartBar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{engagementData.visits}</div>
          <p className="text-xs text-muted-foreground">
            {partnerData && engagementData.visits > 0 ? ((partnerData.total_responses / engagementData.visits) * 100).toFixed(1) : "0"}% conversion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement</CardTitle>
          <ChartPie className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{engagementData.copy_clicks + engagementData.download_clicks}</div>
          <p className="text-xs text-muted-foreground">
            Copy/download actions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Coupons</CardTitle>
          <ChartBar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {topCoupons.length > 0 ? (
              topCoupons.slice(0, 2).map((coupon, index) => (
                <div key={coupon.title} className="flex justify-between items-center text-xs">
                  <span className="truncate flex-1 mr-1">{coupon.title}</span>
                  <span className="font-bold">{coupon.count}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No coupons claimed</span>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Sentiment chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartPie className="h-5 w-5" /> Sentiment Distribution
          </CardTitle>
          <CardDescription>
            How people are feeling about {partnerData.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <SentimentChart sentimentData={sentimentChartData} chartLoaded={true} />
        </CardContent>
      </Card>
      
      {/* Engagement funnel */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBar className="h-5 w-5" /> Engagement Funnel
          </CardTitle>
          <CardDescription>
            User journey through the experience
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Page Visits</span>
              <span className="text-sm font-bold">{engagementData.visits}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Survey Responses</span>
              <span className="text-sm font-bold">{partnerData.total_responses}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${engagementData.visits > 0 ? (partnerData.total_responses / engagementData.visits) * 100 : 0}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Copy Code Clicks</span>
              <span className="text-sm font-bold">{engagementData.copy_clicks}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${engagementData.visits > 0 ? (engagementData.copy_clicks / engagementData.visits) * 100 : 0}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Download/Wallet</span>
              <span className="text-sm font-bold">{engagementData.download_clicks + engagementData.wallet_adds}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ width: `${engagementData.visits > 0 ? ((engagementData.download_clicks + engagementData.wallet_adds) / engagementData.visits) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerOverview;