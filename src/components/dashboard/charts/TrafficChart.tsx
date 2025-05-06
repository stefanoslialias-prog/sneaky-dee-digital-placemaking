
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { TrafficData } from '@/hooks/useTrafficData';

interface TrafficChartProps {
  trafficData: TrafficData[];
  chartLoaded: boolean;
}

const TrafficChart: React.FC<TrafficChartProps> = ({ trafficData, chartLoaded }) => {
  // Custom gradient for the bar chart
  const getBarFill = (value: number) => {
    const maxValue = Math.max(...trafficData.map(item => item.footTraffic));
    const intensity = value / maxValue;
    
    // Weekend days have a different gradient
    if (value > 1600) {
      return "url(#weekendGradient)";
    }
    
    return "url(#weekdayGradient)";
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={trafficData}>
        <defs>
          <linearGradient id="weekdayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ECDC4" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#00A8E8" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="weekendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#FFB570" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip 
          formatter={(value) => [`${value} devices`, 'Foot Traffic']}
          contentStyle={{ borderRadius: '8px' }}
        />
        <Bar 
          dataKey="footTraffic" 
          fill="url(#weekdayGradient)" 
          radius={[4, 4, 0, 0]}
          animationBegin={0}
          animationDuration={1200}
          animationEasing="ease-out"
          fillOpacity={chartLoaded ? 1 : 0}
          stroke="#4ECDC4"
          strokeWidth={1}
        >
          {trafficData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={getBarFill(entry.footTraffic)} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TrafficChart;
