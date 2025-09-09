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
  authEmail?: string | null;
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
  const [partnerMap, setPartnerMap] = useState<Record<string, string>>({});
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

  // Fetch partner data to map IDs to names
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        console.log('Fetching partners...');
        const { data, error } = await supabase
          .from('partners')
          .select('id, name');
          
        if (error) throw error;
        
        console.log('Partners data received:', data);
        const map: Record<string, string> = {};
        if (data) {
          data.forEach(partner => {
            map[partner.id] = partner.name;
            console.log(`Mapping partner ${partner.id} -> ${partner.name}`);
          });
        }
        
        console.log('Final partner map:', map);
        setPartnerMap(map);
      } catch (error) {
        console.error('Error fetching partners:', error);
      }
    };
    
    fetchPartners();
  }, []);
  
  // Fetch initial data
  useEffect(() => {
    fetchResponses();
    
    // Set up logging to debug any issues
    console.log('Setting up ResponseTable with locationMap:', locationMap);
  }, [page, locationMap, couponMap, partnerMap, selectedPartner]);
  
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
      
      // Get engagement data for each session (coupons and emails)
      const sessionIds = data?.map(item => item.session_id).filter(Boolean) || [];
      let sessionCoupons: Record<string, string> = {};
      let sessionEmails: Record<string, string> = {};
      
      if (sessionIds.length > 0) {
        const { data: engagementData } = await supabase
          .from('engagement_events')
          .select('session_id, coupon_id, event_type, metadata')
          .in('session_id', sessionIds)
          .in('event_type', ['coupon_selected', 'coupon_claimed', 'email_collected', 'opt_in_email_submitted', 'email_skipped', 'email_opt_in_skipped']);
          
        if (engagementData) {
          engagementData.forEach(event => {
            // Prioritize coupon_selected over coupon_claimed
            if ((event.event_type === 'coupon_selected' || event.event_type === 'coupon_claimed') && event.coupon_id && event.session_id) {
              // Only set if not already set, or if this is a coupon_selected event
              if (!sessionCoupons[event.session_id] || event.event_type === 'coupon_selected') {
                sessionCoupons[event.session_id] = couponMap[event.coupon_id] || 'Unknown Coupon';
              }
            }
            if ((event.event_type === 'email_collected' || event.event_type === 'opt_in_email_submitted') && event.session_id && event.metadata) {
              const metadata = event.metadata as any;
              sessionEmails[event.session_id] = metadata.email || metadata.email_address || 'Unknown';
            }
            if ((event.event_type === 'email_skipped' || event.event_type === 'email_opt_in_skipped') && event.session_id) {
              sessionEmails[event.session_id] = 'no email provided';
            }
          });
        }
      }

      // Time-based fallback for missing emails from user_emails table
      const responsesWithoutEmails = data?.filter(item => 
        item.session_id && !sessionEmails[item.session_id]
      ) || [];
      
      if (responsesWithoutEmails.length > 0) {
        console.log(`Found ${responsesWithoutEmails.length} responses without emails, attempting time-based fallback`);
        
        // Get time range for the current page (±30 minutes buffer)
        const timestamps = data?.map(item => new Date(item.created_at)) || [];
        const minTime = new Date(Math.min(...timestamps.map(t => t.getTime())) - 30 * 60 * 1000);
        const maxTime = new Date(Math.max(...timestamps.map(t => t.getTime())) + 30 * 60 * 1000);
        
        const { data: userEmailsData } = await supabase
          .from('user_emails')
          .select('email_address, sent_at')
          .gte('sent_at', minTime.toISOString())
          .lte('sent_at', maxTime.toISOString());
          
        if (userEmailsData && userEmailsData.length > 0) {
          console.log(`Found ${userEmailsData.length} user_emails in time range for fallback`);
          
          responsesWithoutEmails.forEach(response => {
            const responseTime = new Date(response.created_at);
            
            // Find the nearest email within ±30 minutes
            let nearestEmail = null;
            let smallestTimeDiff = Infinity;
            
            userEmailsData.forEach(emailRecord => {
              const emailTime = new Date(emailRecord.sent_at);
              const timeDiff = Math.abs(emailTime.getTime() - responseTime.getTime());
              
              // Only consider emails within 30 minutes (1800000 ms)
              if (timeDiff <= 30 * 60 * 1000 && timeDiff < smallestTimeDiff) {
                smallestTimeDiff = timeDiff;
                nearestEmail = emailRecord.email_address;
              }
            });
            
            if (nearestEmail && response.session_id) {
              sessionEmails[response.session_id] = nearestEmail;
              console.log(`Matched response ${response.id} with email ${nearestEmail} (time diff: ${Math.round(smallestTimeDiff / 1000)}s)`);
            }
          });
        }
      }

      // Transform to the expected format
      const formattedResponses = data?.map(item => {
        console.log('Processing item:', item);
        console.log('Partner ID:', item.partner_id);
        console.log('Partner map:', partnerMap);
        console.log('Partner name from map:', partnerMap[item.partner_id]);
        
        // Determine location - prioritize partner name, then wifi location, then fallback
        let location = 'General Survey';
        if (item.partner_id && partnerMap[item.partner_id]) {
          location = partnerMap[item.partner_id];
          console.log('Using partner name:', location);
        } else if (item.location_id && locationMap[item.location_id]) {
          location = locationMap[item.location_id];
          console.log('Using wifi location name:', location);
        } else if (item.location_id) {
          location = item.location_id;
          console.log('Using raw location_id:', location);
        } else {
          console.log('Using fallback location:', location);
        }

        return {
          id: item.id,
          timestamp: item.created_at,
          location: location,
          sentiment: item.answer,
          comment: item.comment,
          coupon: item.session_id ? sessionCoupons[item.session_id] || null : null,
          authEmail: item.session_id ? sessionEmails[item.session_id] || null : null
        };
      }) || [];
      
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
          let authEmail = null;
          if (newItem.session_id) {
            const { data: engagementData } = await supabase
              .from('engagement_events')
              .select('coupon_id, event_type, metadata')
              .eq('session_id', newItem.session_id)
              .in('event_type', ['coupon_selected', 'coupon_claimed', 'email_collected', 'opt_in_email_submitted', 'email_skipped', 'email_opt_in_skipped']);
              
            if (engagementData) {
              engagementData.forEach(event => {
                if ((event.event_type === 'coupon_selected' || event.event_type === 'coupon_claimed') && event.coupon_id) {
                  if (!couponTitle || event.event_type === 'coupon_selected') {
                    couponTitle = couponMap[event.coupon_id] || 'Unknown Coupon';
                  }
                }
                if ((event.event_type === 'email_collected' || event.event_type === 'opt_in_email_submitted') && event.metadata) {
                  const metadata = event.metadata as any;
                  authEmail = metadata.email || metadata.email_address || null;
                }
                if (event.event_type === 'email_skipped' || event.event_type === 'email_opt_in_skipped') {
                  authEmail = 'no email provided';
                }
              });
            }
            
            // Time-based fallback for missing email in real-time
            if (!authEmail) {
              console.log('No email found in engagement_events for new response, checking user_emails fallback');
              const responseTime = new Date(newItem.created_at);
              const bufferTime = 30 * 60 * 1000; // 30 minutes in ms
              
              const { data: userEmailsData } = await supabase
                .from('user_emails')
                .select('email_address, sent_at')
                .gte('sent_at', new Date(responseTime.getTime() - bufferTime).toISOString())
                .lte('sent_at', new Date(responseTime.getTime() + bufferTime).toISOString());
                
              if (userEmailsData && userEmailsData.length > 0) {
                let nearestEmail = null;
                let smallestTimeDiff = Infinity;
                
                userEmailsData.forEach(emailRecord => {
                  const emailTime = new Date(emailRecord.sent_at);
                  const timeDiff = Math.abs(emailTime.getTime() - responseTime.getTime());
                  
                  if (timeDiff <= bufferTime && timeDiff < smallestTimeDiff) {
                    smallestTimeDiff = timeDiff;
                    nearestEmail = emailRecord.email_address;
                  }
                });
                
                if (nearestEmail) {
                  authEmail = nearestEmail;
                  console.log(`Real-time fallback: matched email ${nearestEmail} (time diff: ${Math.round(smallestTimeDiff / 1000)}s)`);
                }
              }
            }
          }

          // Format the data
          let location = 'General Survey';
          if (newItem.partner_id && partnerMap[newItem.partner_id]) {
            location = partnerMap[newItem.partner_id];
          } else if (newItem.location_id && locationMap[newItem.location_id]) {
            location = locationMap[newItem.location_id];
          } else if (newItem.location_id) {
            location = newItem.location_id;
          }

          const formattedResponse: SurveyResponse = {
            id: newItem.id,
            timestamp: newItem.created_at,
            location: location,
            sentiment: newItem.answer,
            comment: newItem.comment,
            coupon: couponTitle,
            authEmail: authEmail
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
  }, [locationMap, couponMap, partnerMap, pageSize]);
  
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
      
      // Get engagement data for export (coupons and emails)
      const sessionIds = data.map(item => item.session_id).filter(Boolean);
      let sessionCoupons: Record<string, string> = {};
      let sessionEmails: Record<string, string> = {};
      
      if (sessionIds.length > 0) {
        const { data: engagementData } = await supabase
          .from('engagement_events')
          .select('session_id, coupon_id, event_type, metadata')
          .in('session_id', sessionIds)
          .in('event_type', ['coupon_selected', 'coupon_claimed', 'email_collected', 'opt_in_email_submitted', 'email_skipped', 'email_opt_in_skipped']);
          
        if (engagementData) {
          engagementData.forEach(event => {
            if ((event.event_type === 'coupon_selected' || event.event_type === 'coupon_claimed') && event.coupon_id && event.session_id) {
              if (!sessionCoupons[event.session_id] || event.event_type === 'coupon_selected') {
                sessionCoupons[event.session_id] = couponMap[event.coupon_id] || 'Unknown Coupon';
              }
            }
            if ((event.event_type === 'email_collected' || event.event_type === 'opt_in_email_submitted') && event.session_id && event.metadata) {
              const metadata = event.metadata as any;
              sessionEmails[event.session_id] = metadata.email || metadata.email_address || 'Unknown';
            }
          });
        }
      }

      // Time-based fallback for CSV export
      const responsesWithoutEmails = data.filter(item => 
        item.session_id && !sessionEmails[item.session_id]
      );
      
      if (responsesWithoutEmails.length > 0) {
        console.log(`CSV Export: Found ${responsesWithoutEmails.length} responses without emails, attempting time-based fallback`);
        
        // Get time range for all data (±30 minutes buffer)
        const timestamps = data.map(item => new Date(item.created_at));
        const minTime = new Date(Math.min(...timestamps.map(t => t.getTime())) - 30 * 60 * 1000);
        const maxTime = new Date(Math.max(...timestamps.map(t => t.getTime())) + 30 * 60 * 1000);
        
        const { data: userEmailsData } = await supabase
          .from('user_emails')
          .select('email_address, sent_at')
          .gte('sent_at', minTime.toISOString())
          .lte('sent_at', maxTime.toISOString());
          
        if (userEmailsData && userEmailsData.length > 0) {
          console.log(`CSV Export: Found ${userEmailsData.length} user_emails in time range for fallback`);
          
          responsesWithoutEmails.forEach(response => {
            const responseTime = new Date(response.created_at);
            
            // Find the nearest email within ±30 minutes
            let nearestEmail = null;
            let smallestTimeDiff = Infinity;
            
            userEmailsData.forEach(emailRecord => {
              const emailTime = new Date(emailRecord.sent_at);
              const timeDiff = Math.abs(emailTime.getTime() - responseTime.getTime());
              
              // Only consider emails within 30 minutes (1800000 ms)
              if (timeDiff <= 30 * 60 * 1000 && timeDiff < smallestTimeDiff) {
                smallestTimeDiff = timeDiff;
                nearestEmail = emailRecord.email_address;
              }
            });
            
            if (nearestEmail && response.session_id) {
              sessionEmails[response.session_id] = nearestEmail;
              console.log(`CSV Export: Matched response ${response.id} with email ${nearestEmail} (time diff: ${Math.round(smallestTimeDiff / 1000)}s)`);
            }
          });
        }
      }

      // Transform to the expected format
      const exportData = data.map(item => {
        // Determine location - prioritize partner name, then wifi location, then fallback
        let location = 'General Survey';
        if (item.partner_id && partnerMap[item.partner_id]) {
          location = partnerMap[item.partner_id];
        } else if (item.location_id && locationMap[item.location_id]) {
          location = locationMap[item.location_id];
        } else if (item.location_id) {
          location = item.location_id;
        }

        return {
          timestamp: new Date(item.created_at).toLocaleString(),
          location: location,
          sentiment: item.answer,
          comment: item.comment || '',
          coupon: item.session_id ? sessionCoupons[item.session_id] || '' : '',
          authEmail: item.session_id ? sessionEmails[item.session_id] || '' : ''
        };
      });
      
      // Create CSV content
      const headers = ['Timestamp', 'Location', 'Sentiment', 'Comment', 'Coupon', 'Auth Email'];
      const csvRows = [headers];
      
      // Add data rows
      for (const row of exportData) {
        csvRows.push([
          row.timestamp,
          row.location,
          row.sentiment,
          row.comment,
          row.coupon,
          row.authEmail || ''
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
                <TableHead>Auth Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(null).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    {[1, 2, 3, 4, 5, 6].map((cellIndex) => (
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
                    <TableCell>
                      {response.authEmail || <span className="text-gray-400 italic">No email</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
              
              {!loading && responses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
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
