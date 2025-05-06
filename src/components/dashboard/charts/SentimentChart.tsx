
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SentimentSummary } from '@/hooks/useSentimentData';

interface SentimentChartProps {
  sentimentData: SentimentSummary;
  chartLoaded: boolean;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ sentimentData, chartLoaded }) => {
  // Prepare data for the chart with vibrant colors
  const chartData = [
    { name: 'Happy', value: sentimentData.happy_count, color: '#4ECDC4' },
    { name: 'Neutral', value: sentimentData.neutral_count, color: '#00A8E8' },
    { name: 'Concerned', value: sentimentData.concerned_count, color: '#FF6B6B' }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <defs>
          <filter id="glow" height="300%" width="300%" x="-100%" y="-100%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={chartLoaded ? 60 : 0} // Animation effect
          outerRadius={chartLoaded ? 80 : 30} // Animation effect
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          filter="url(#glow)"
          animationDuration={1000}
          animationBegin={300}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          className="transition-all duration-1000"
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color} 
              className="transition-all duration-700"
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value} responses`, 'Count']}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SentimentChart;
