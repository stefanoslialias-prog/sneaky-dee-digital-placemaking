
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SentimentSummary } from '@/hooks/useSentimentData';

interface SentimentChartProps {
  sentimentData: SentimentSummary;
  chartLoaded: boolean;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ sentimentData, chartLoaded }) => {
  // Prepare data for the chart with improved colors
  const chartData = [
    { name: 'Happy', value: sentimentData.happy_count, color: 'hsl(142, 76%, 36%)' },
    { name: 'Neutral', value: sentimentData.neutral_count, color: 'hsl(221, 83%, 53%)' },
    { name: 'Concerned', value: sentimentData.concerned_count, color: 'hsl(0, 84%, 60%)' }
  ].filter(item => item.value > 0);

  const totalCount = sentimentData.happy_count + sentimentData.neutral_count + sentimentData.concerned_count;

  // Show empty state if no data
  if (totalCount === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm">No sentiment data available</div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / totalCount) * 100).toFixed(1);
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <div className="font-medium">{data.name}</div>
          <div className="text-sm text-muted-foreground">
            {data.value} responses ({percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => (
    <div className="flex justify-center gap-6 mt-4">
      {chartData.map((entry, index) => {
        const percentage = ((entry.value / totalCount) * 100).toFixed(1);
        return (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <div className="text-sm">
              <span className="font-medium">{entry.name}</span>
              <span className="text-muted-foreground ml-1">
                {percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={chartLoaded ? 45 : 0}
            outerRadius={chartLoaded ? 75 : 30}
            paddingAngle={2}
            dataKey="value"
            animationDuration={800}
            animationBegin={200}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="hover:opacity-80 transition-opacity duration-200"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
};

export default SentimentChart;
