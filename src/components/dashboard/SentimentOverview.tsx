
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import mockDatabase from '@/services/mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const SentimentOverview: React.FC = () => {
  const sentimentData = mockDatabase.getSentimentSummary();
  const locations = mockDatabase.getLocations();
  
  // Calculate totals
  const totalSessions = locations.reduce((sum, loc) => sum + loc.totalSessions, 0);
  const totalFootTraffic = locations.reduce((sum, loc) => sum + loc.footTraffic, 0);
  const participationRate = Math.round((totalSessions / totalFootTraffic) * 100);
  
  // Prepare data for the chart
  const chartData = [
    { name: 'Happy', value: sentimentData.happy.count, color: '#4ECDC4' },
    { name: 'Neutral', value: sentimentData.neutral.count, color: '#00A8E8' },
    { name: 'Concerned', value: sentimentData.concerned.count, color: '#FF6B6B' }
  ];

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
      {/* Summary cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Responses</CardTitle>
          <CardDescription>All locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{sentimentData.total.toLocaleString()}</div>
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
            <span className="text-lg font-semibold">{sentimentData.happy.percentage}%</span>
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
                    {Math.round((location.totalSessions / location.footTraffic) * 100)}% participation
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
