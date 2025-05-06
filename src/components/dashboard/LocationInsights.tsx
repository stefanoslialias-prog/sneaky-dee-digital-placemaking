
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LocationSummary } from '@/hooks/useLocationData';

interface LocationInsightsProps {
  locations: LocationSummary[];
  chartLoaded: boolean;
}

const LocationInsights: React.FC<LocationInsightsProps> = ({ locations, chartLoaded }) => {
  return (
    <Card className="md:col-span-4">
      <CardHeader>
        <CardTitle>Location Insights</CardTitle>
        <CardDescription>
          Hotspots with engagement rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location, index) => {
            // Calculate participation rate for this location based on link clicks
            const participationRate = location.linkClicks > 0 
              ? (location.totalSessions / location.linkClicks * 100)
              : 0;
            
            // Format the participation rate to show 3 digits total with decimal before 3rd digit
            const formattedRate = participationRate.toFixed(1);
            
            // Determine progress bar color based on participation rate (high engagement colors)
            const progressBarColor = participationRate >= 80 
              ? 'bg-green-500' 
              : participationRate >= 70
              ? 'bg-toronto-teal'
              : 'bg-toronto-blue';
            
            return (
              <div 
                key={location.id} 
                className={`p-4 border rounded-lg transform transition-all duration-500 
                  ${index === 0 ? 'bg-gradient-to-br from-blue-50 to-green-50 border-green-200' : ''}
                  ${chartLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lg">{location.name}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                        participationRate >= 80 ? 'bg-green-400' : 
                        participationRate >= 70 ? 'bg-teal-400' : 'bg-blue-400'
                      }`}></span>
                      {formattedRate}% participation rate
                    </div>
                  </div>
                  <div className="text-2xl font-semibold">
                    {location.totalSessions.toLocaleString()}
                    <div className="text-xs text-gray-500 text-right">responses</div>
                  </div>
                </div>
                <div className="mt-2">
                  <Progress 
                    value={Math.min(100, participationRate)}
                    className="h-2"
                    indicatorClassName={`${progressBarColor}`}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {location.linkClicks.toLocaleString()} total link clicks
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationInsights;
