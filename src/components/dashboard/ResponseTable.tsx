import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SurveyResponse {
  id: string;
  timestamp: string;
  location: string;
  sentiment: string;
  comment?: string | null;
  coupon?: string | null;
}

interface ResponseTableProps {
  selectedPartner?: string;
}

const ResponseTable: React.FC<ResponseTableProps> = ({ selectedPartner }) => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newResponses, setNewResponses] = useState(0);
  const [locationMap, setLocationMap] = useState<Record<string, string>>({});
  const [couponMap, setCouponMap] = useState<Record<string, string>>({});
  const pageSize = 10;
  
  // Fetch location data to map IDs to names
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('wifi_locations')
          .select('id, name');
          
        if (error) throw error;
        
        const map: Record<string, string> = {};
        if (data) {
          data.forEach(loc => {
            map[loc.id] = loc.name;
          });
        }
        
        setLocationMap(map);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    
    fetchLocations();
  }, []);

  // Fetch coupon data to map IDs to titles
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('id, title');
          
        if (error) throw error;
        
        const map: Record<string, string> = {};
        if (data) {
          data.forEach(coupon => {
            map[coupon.id] = coupon.title;
          });
        }
        
        setCouponMap(map);
      } catch (error) {
        console.error('Error fetching coupons:', error);
      }
    };
    
    fetchCoupons();
  }, []);
  
  // Fetch initial data
  useEffect(() => {
    fetchResponses();
    
    // Set up logging to debug any issues
    console.log('Setting up ResponseTable with locationMap:', locationMap);
  }, [page, locationMap, couponMap, selectedPartner]);
  
  const fetchResponses = async () => {
    try {
      setLoading(true);
      console.log('Fetching responses, page:', page);
      
      const startIndex = (page - 1) * pageSize;
      
      // Fetch responses from Supabase
      let query = supabase
        .from('survey_responses')
        .select(`
          id, 
          created_at, 
          answer, 
          comment, 
          location_id,
          partner_id,
          session_id
        `)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + pageSize - 1);
      
      // Filter by partner if one is selected
      if (selectedPartner && selectedPartner !== 'all') {
        query = query.eq('partner_id', selectedPartner);
      }
      
      const { data, error } = await query;
      
      console.log('Fetched survey_responses data:', data);
        
      if (error) throw error;
      
      // Get coupon data for each session
      const sessionIds = data?.map(item => item.session_id).filter(Boolean) || [];
      let sessionCoupons: Record<string, string> = {};
      
      if (sessionIds.length > 0) {
        const { data: engagementData } = await supabase
          .from('engagement_events')
          .select('session_id, coupon_id')
          .in('session_id', sessionIds)
          .eq('event_type', 'coupon_claimed');
          
        if (engagementData) {
          engagementData.forEach(event => {
            if (event.coupon_id && event.session_id) {
              sessionCoupons[event.session_id] = couponMap[event.coupon_id] || 'Unknown Coupon';
            }
          });
        }
      }

      // Transform to the expected format
      const formattedResponses = data?.map(item => ({
        id: item.id,
        timestamp: item.created_at,
        location: item.location_id ? locationMap[item.location_id] || item.location_id : 'Unknown',
        sentiment: item.answer,
        comment: item.comment,
        coupon: item.session_id ? sessionCoupons[item.session_id] || null : null
      })) || [];
      
      console.log('Formatted responses:', formattedResponses);
      setResponses(formattedResponses);
      
      // Reset new response counter when fetching new data
      setNewResponses(0);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast.error('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };
  
  // Set up real-time subscription with clearer channel name
  useEffect(() => {
    // Clear previous channels
    const cleanup = async () => {
      await supabase.removeAllChannels();
    };
    
    cleanup();
    
    // Create a new channel with a specific name for this component
    const channel = supabase
      .channel('response_table_updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'survey_responses' }, 
        async (payload) => {
          console.log('New response received in ResponseTable:', payload);
          
          // Extract the data from the payload
          const newItem = payload.new;
          
          // Get coupon data for this session
          let couponTitle = null;
          if (newItem.session_id) {
            const { data: engagementData } = await supabase
              .from('engagement_events')
              .select('coupon_id')
              .eq('session_id', newItem.session_id)
              .eq('event_type', 'coupon_claimed')
              .limit(1);
              
            if (engagementData?.[0]?.coupon_id) {
              couponTitle = couponMap[engagementData[0].coupon_id] || 'Unknown Coupon';
            }
          }

          // Format the data
          const formattedResponse: SurveyResponse = {
            id: newItem.id,
            timestamp: newItem.created_at,
            location: newItem.location_id ? locationMap[newItem.location_id] || newItem.location_id : 'Unknown',
            sentiment: newItem.answer,
            comment: newItem.comment,
            coupon: couponTitle
          };
          
          console.log('Adding new response to table:', formattedResponse);
          
          // Add the new response to the top of the list
          setResponses(prevResponses => [formattedResponse, ...prevResponses.slice(0, pageSize - 1)]);
          setNewResponses(count => count + 1);
          
          // Show a toast notification
          toast('New response received', {
            description: 'Someone submitted a new survey response'
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationMap, couponMap, pageSize]);
  
  // Get total count for pagination
  const [totalResponses, setTotalResponses] = useState(0);
  
  useEffect(() => {
    const getTotal = async () => {
      try {
        let query = supabase
          .from('survey_responses')
          .select('*', { count: 'exact', head: true });
        
        // Filter by partner if one is selected
        if (selectedPartner && selectedPartner !== 'all') {
          query = query.eq('partner_id', selectedPartner);
        }
          
        const { count, error } = await query;
          
        if (error) throw error;
        
        if (count !== null) {
          setTotalResponses(count);
        }
      } catch (error) {
        console.error('Error fetching count:', error);
      }
    };
    
    getTotal();
  }, [newResponses, selectedPartner]);
  
  const totalPages = Math.ceil(totalResponses / pageSize);
  
  const exportToCsv = async () => {
    try {
      // Fetch all responses for export
      let query = supabase
        .from('survey_responses')
        .select(`
          id, 
          created_at, 
          answer, 
          comment, 
          location_id,
          partner_id,
          session_id
        `)
        .order('created_at', { ascending: false });
      
      // Filter by partner if one is selected
      if (selectedPartner && selectedPartner !== 'all') {
        query = query.eq('partner_id', selectedPartner);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      // Get coupon data for export
      const sessionIds = data.map(item => item.session_id).filter(Boolean);
      let sessionCoupons: Record<string, string> = {};
      
      if (sessionIds.length > 0) {
        const { data: engagementData } = await supabase
          .from('engagement_events')
          .select('session_id, coupon_id')
          .in('session_id', sessionIds)
          .eq('event_type', 'coupon_claimed');
          
        if (engagementData) {
          engagementData.forEach(event => {
            if (event.coupon_id && event.session_id) {
              sessionCoupons[event.session_id] = couponMap[event.coupon_id] || 'Unknown Coupon';
            }
          });
        }
      }

      // Transform to the expected format
      const exportData = data.map(item => ({
        timestamp: new Date(item.created_at).toLocaleString(),
        location: item.location_id ? locationMap[item.location_id] || item.location_id : 'Unknown',
        sentiment: item.answer,
        comment: item.comment || '',
        coupon: item.session_id ? sessionCoupons[item.session_id] || '' : ''
      }));
      
      // Create CSV content
      const headers = ['Timestamp', 'Location', 'Sentiment', 'Comment', 'Coupon'];
      const csvRows = [headers];
      
      // Add data rows
      for (const row of exportData) {
        csvRows.push([
          row.timestamp,
          row.location,
          row.sentiment,
          row.comment,
          row.coupon
        ]);
      }
      
      // Convert to CSV string
      const csvString = csvRows
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `community-pulse-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Survey data downloaded successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="flex items-center gap-2">
            Raw Survey Data
            {newResponses > 0 && (
              <Badge 
                variant="destructive" 
                className="animate-pulse cursor-pointer"
                onClick={fetchResponses}
              >
                +{newResponses} new
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            View and export anonymized survey responses
          </CardDescription>
        </div>
        <Button onClick={exportToCsv}>Export CSV</Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Coupon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(null).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    {[1, 2, 3, 4, 5].map((cellIndex) => (
                      <TableCell key={`loading-cell-${index}-${cellIndex}`}>
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                responses.map((response) => (
                  <TableRow key={response.id} className="animate-fade-in">
                    <TableCell>
                      {new Date(response.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{response.location}</TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        response.sentiment === 'happy' ? 'bg-green-100 text-green-800' : 
                        response.sentiment === 'neutral' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {response.sentiment}
                      </span>
                    </TableCell>
                    <TableCell>
                      {response.comment || <span className="text-gray-400 italic">No comment</span>}
                    </TableCell>
                    <TableCell>
                      {response.coupon || <span className="text-gray-400 italic">No coupon</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
              
              {!loading && responses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No responses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {responses.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, totalResponses)} of {totalResponses} responses
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page => Math.max(1, page - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {page} of {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page => Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResponseTable;
