
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import mockDatabase, { SurveyResponse } from '@/services/mockData';

const ResponseTable: React.FC = () => {
  const [responses] = useState<SurveyResponse[]>(mockDatabase.getResponses());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const startIndex = (page - 1) * pageSize;
  const paginatedResponses = responses.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(responses.length / pageSize);
  
  const exportToCsv = () => {
    // Create CSV content
    const headers = ['Timestamp', 'Location', 'Sentiment', 'Comment'];
    const csvRows = [headers];
    
    // Add data rows
    for (const response of responses) {
      csvRows.push([
        response.timestamp,
        response.location,
        response.sentiment,
        response.comment || ''
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
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Raw Survey Data</CardTitle>
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
                {paginatedResponses.map((response) => (
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
                ))}
                
                {paginatedResponses.length === 0 && (
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
          Showing {startIndex + 1}-{Math.min(startIndex + pageSize, responses.length)} of {responses.length} responses
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page => Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page => Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResponseTable;
