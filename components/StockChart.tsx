import React from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Stock } from '../types';

interface Props {
  data: Stock['history'];
  color: string;
  mini?: boolean;
}

const StockChart: React.FC<Props> = ({ data, color, mini = false }) => {
  if (!data || data.length === 0) return <div className="text-xs text-slate-500">No Data</div>;

  return (
    <div className={mini ? "h-12 w-24" : "h-64 w-full"}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {!mini && <XAxis dataKey="time" hide />}
          <YAxis domain={['auto', 'auto']} hide />
          {!mini && (
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ display: 'none' }}
            />
          )}
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            strokeWidth={mini ? 2 : 3} 
            dot={false} 
            isAnimationActive={false} // Performance
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
