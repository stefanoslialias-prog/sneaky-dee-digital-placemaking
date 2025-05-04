
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import mockDatabase from '@/services/mockData';

const LocationMap: React.FC = () => {
  const locations = mockDatabase.getLocations();
  const [selectedLocation, setSelectedLocation] = useState(locations[0].id);
  
  // Get data for the selected location
  const location = locations.find(l => l.id === selectedLocation) || locations[0];
  const locationResponses = mockDatabase.getResponsesByLocation(selectedLocation);
  
  // Calculate sentiment percentages for this location
  const totalResponses = locationResponses.length;
  const happyCount = locationResponses.filter(r => r.sentiment === 'happy').length;
  const neutralCount = locationResponses.filter(r => r.sentiment === 'neutral').length;
  const concernedCount = locationResponses.filter(r => r.sentiment === 'concerned').length;
  
  // Calculate actual participation rate based on the location data
  const participationRate = location.footTraffic > 0 
    ? ((location.totalSessions / location.footTraffic) * 100).toFixed(1) 
    : '0.0';

  // Fixed percentages for sentiment distribution visualization
  const happyPercent = '74.6';
  const neutralPercent = '63.5';
  const concernedPercent = '44.2';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>
            Select a WiFi hotspot location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {locations.map((loc) => (
              <li key={loc.id}>
                <button
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 ${
                    selectedLocation === loc.id ? 'bg-toronto-blue text-white hover:bg-toronto-blue' : ''
                  }`}
                >
                  {loc.name}
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>{location.name}</CardTitle>
          <CardDescription>
            Location details and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total Sessions</div>
              <div className="text-2xl font-bold">{location.totalSessions.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Foot Traffic</div>
              <div className="text-2xl font-bold">{location.footTraffic.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Participation Rate</div>
              <div className="text-2xl font-bold">{participationRate}%</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total Responses</div>
              <div className="text-2xl font-bold">{totalResponses.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Sentiment Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Happy</span>
                  <span className="text-sm font-medium">{happyPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-toronto-teal h-2 rounded-full" 
                    style={{ width: `${happyPercent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Neutral</span>
                  <span className="text-sm font-medium">{neutralPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-toronto-lightblue h-2 rounded-full" 
                    style={{ width: `${neutralPercent}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Concerned</span>
                  <span className="text-sm font-medium">{concernedPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-toronto-red h-2 rounded-full" 
                    style={{ width: `${concernedPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Recent Comments</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {locationResponses
                .filter(r => r.comment)
                .slice(0, 5)
                .map(r => (
                  <div key={r.id} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        r.sentiment === 'happy' ? 'bg-toronto-teal' : 
                        r.sentiment === 'neutral' ? 'bg-toronto-lightblue' : 'bg-toronto-red'
                      }`}></div>
                      <span className="text-sm text-gray-500">
                        {new Date(r.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{r.comment}</p>
                  </div>
                ))}
              
              {locationResponses.filter(r => r.comment).length === 0 && (
                <p className="text-gray-500 text-sm italic">No comments for this location</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationMap;
