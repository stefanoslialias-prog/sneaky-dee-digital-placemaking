
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SentimentSummary } from '@/hooks/useSentimentData';
import { LocationSummary } from '@/hooks/useLocationData';

interface SummaryCardsProps {
  sentimentData: SentimentSummary;
  locations: LocationSummary[];
  newResponses: number;
  chartLoaded: boolean;
  participationRate: string;
  happyPercentage: string;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ 
  sentimentData, 
  locations, 
  newResponses, 
  chartLoaded,
  participationRate,
  happyPercentage
}) => {
  return (
    <>
      <Card className="transform transition-all duration-500 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Total Responses
            {newResponses > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                +{newResponses} new
              </Badge>
            )}
          </CardTitle>
          <CardDescription>All locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${chartLoaded ? 'animate-fade-in' : ''}`}>
            {sentimentData.total_count.toLocaleString()}
          </div>
        </CardContent>
      </Card>
      
      <Card className="transform transition-all duration-500 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Participation Rate</CardTitle>
          <CardDescription>Survey completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${chartLoaded ? 'animate-fade-in' : ''}`}>{participationRate}%</div>
        </CardContent>
      </Card>
      
      <Card className="transform transition-all duration-500 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Active Hotspots</CardTitle>
          <CardDescription>WiFi locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${chartLoaded ? 'animate-fade-in' : ''}`}>{locations.length}</div>
        </CardContent>
      </Card>

      <Card className="md:col-span-1 transform transition-all duration-500 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Community Pulse</CardTitle>
          <CardDescription>Current sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-2 ${chartLoaded ? 'animate-fade-in' : ''}`}>
            <div className={`w-4 h-4 rounded-full bg-toronto-teal`}></div>
            <span className="text-lg font-semibold">{happyPercentage}%</span>
            <span className="text-sm text-gray-500">Positive</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SummaryCards;
