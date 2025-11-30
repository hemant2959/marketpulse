import React from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer, XAxis, Tooltip, Brush, CartesianGrid } from 'recharts';
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
        <LineChart 
          data={data}
          margin={mini ? { top: 0, right: 0, bottom: 0, left: 0 } : { top: 5, right: 10, bottom: 5, left: 0 }}
        >
          {!mini && (
             <CartesianGrid 
               strokeDasharray="3 3" 
               vertical={false} 
               stroke="#94a3b8" 
               opacity={0.15} 
             />
          )}
          
          {/* XAxis must exist for Brush to work, even if hidden */}
          <XAxis dataKey="time" hide={true} />
          
          <YAxis domain={['auto', 'auto']} hide />
          
          {!mini && (
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '8px', 
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '10px' }}
              cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
          )}
          
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            strokeWidth={mini ? 2 : 3} 
            dot={false} 
            isAnimationActive={false} // Performance
            activeDot={{ r: 6, strokeWidth: 0, fill: color }}
          />

          {/* Zoom and Pan Control (Only on Detail View) */}
          {!mini && (
            <Brush 
              dataKey="time" 
              height={24} 
              stroke="#64748b" 
              fill="rgba(100, 116, 139, 0.1)"
              tickFormatter={() => ''}
              alwaysShowText={false}
              travellerWidth={10}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;