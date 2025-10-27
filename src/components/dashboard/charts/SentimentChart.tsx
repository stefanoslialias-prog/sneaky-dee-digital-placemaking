import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SentimentSummary } from '@/hooks/useSentimentData';

interface SentimentChartProps {
  sentimentData: SentimentSummary;
  chartLoaded: boolean;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ sentimentData, chartLoaded }) => {
  // Prepare data for the chart with custom colors
  const chartData = [
    { name: 'Happy', value: sentimentData.happy_count, color: 'hsl(var(--sentiment-happy))' },
    { name: 'Neutral', value: sentimentData.neutral_count, color: 'hsl(var(--sentiment-neutral))' },
    { name: 'Concerned', value: sentimentData.concerned_count, color: 'hsl(var(--sentiment-concerned))' }
  ].filter(item => item.value > 0); // Only show segments with data

  const totalResponses = sentimentData.happy_count + sentimentData.neutral_count + sentimentData.concerned_count;

  if (totalResponses === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-sm">No sentiment data yet</div>
        </div>
      </div>
    );
  }

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">
              {entry.value}: {chartData.find(d => d.name === entry.value)?.value || 0}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={chartLoaded ? 50 : 20}
              outerRadius={chartLoaded ? 90 : 40}
              paddingAngle={2}
              dataKey="value"
              animationDuration={800}
              animationBegin={200}
              className="transition-all duration-800"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  className="transition-all duration-500 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value} responses`, name]}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentChart;