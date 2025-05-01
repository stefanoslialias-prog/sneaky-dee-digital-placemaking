
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SurveyResponse {
  id: string;
  timestamp: string;
  location: string;
  sentiment: string;
  comment?: string | null;
}

const ResponseTable: React.FC = () => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [newResponses, setNewResponses] = useState(0);
  const pageSize = 10;
  
  // Fetch initial data
  useEffect(() => {
    fetchResponses();
  }, [page]);
  
  const fetchResponses = async () => {
    try {
      setLoading(true);
      
      const startIndex = (page - 1) * pageSize;
      
      // Fetch responses from Supabase
      const { data, error } = await supabase
        .from('survey_responses')
        .select(`
          id, 
          created_at, 
          answer, 
          comment, 
          location_id,
          wifi_locations(name)
        `)
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + pageSize - 1);
        
      if (error) throw error;
      
      // Transform to the expected format
      const formattedResponses = data?.map(item => ({
        id: item.id,
        timestamp: item.created_at,
        location: item.wifi_locations?.name || item.location_id || 'Unknown',
        sentiment: item.answer,
        comment: item.comment
      })) || [];
      
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
  
  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('public:survey_responses')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'survey_responses' }, 
        (payload) => {
          setNewResponses(count => count + 1);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Get total count for pagination
  const [totalResponses, setTotalResponses] = useState(0);
  
  useEffect(() => {
    const getTotal = async () => {
      try {
        const { count, error } = await supabase
          .from('survey_responses')
          .select('*', { count: 'exact', head: true });
          
        if (error) throw error;
        
        if (count !== null) {
          setTotalResponses(count);
        }
      } catch (error) {
        console.error('Error fetching count:', error);
      }
    };
    
    getTotal();
  }, [newResponses]);
  
  const totalPages = Math.ceil(totalResponses / pageSize);
  
  const exportToCsv = async () => {
    try {
      // Fetch all responses for export
      const { data, error } = await supabase
        .from('survey_responses')
        .select(`
          id, 
          created_at, 
          answer, 
          comment, 
          location_id,
          wifi_locations(name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      // Transform to the expected format
      const exportData = data.map(item => ({
        timestamp: new Date(item.created_at).toLocaleString(),
        location: item.wifi_locations?.name || item.location_id || 'Unknown',
        sentiment: item.answer,
        comment: item.comment || ''
      }));
      
      // Create CSV content
      const headers = ['Timestamp', 'Location', 'Sentiment', 'Comment'];
      const csvRows = [headers];
      
      // Add data rows
      for (const row of exportData) {
        csvRows.push([
          row.timestamp,
          row.location,
          row.sentiment,
          row.comment
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
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="h-12 px-4 text-left font-medium">Time</th>
                  <th className="h-12 px-4 text-left font-medium">Location</th>
                  <th className="h-12 px-4 text-left font-medium">Sentiment</th>
                  <th className="h-12 px-4 text-left font-medium">Comment</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(null).map((_, index) => (
                    <tr key={`loading-${index}`} className="border-b">
                      {[1, 2, 3, 4].map((cellIndex) => (
                        <td key={`loading-cell-${index}-${cellIndex}`} className="p-4">
                          <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  responses.map((response) => (
                    <tr key={response.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        {new Date(response.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4">{response.location}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          response.sentiment === 'happy' ? 'bg-green-100 text-green-800' : 
                          response.sentiment === 'neutral' ? 'bg-blue-100 text-blue-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {response.sentiment}
                        </span>
                      </td>
                      <td className="p-4">
                        {response.comment || <span className="text-gray-400 italic">No comment</span>}
                      </td>
                    </tr>
                  ))
                )}
                
                {!loading && responses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">
                      No responses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
