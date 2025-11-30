import React from 'react';
import { MarketFlowData } from '../types';
import { Briefcase, Info } from 'lucide-react';

interface Props {
  data: MarketFlowData | null;
}

const MarketFlowWidget: React.FC<Props> = ({ data }) => {
  if (!data) return null;

  // Find max value for bar scaling
  const maxVal = Math.max(...data.flows.map(f => Math.max(f.buyAmount, f.sellAmount)));

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-2">
          <Briefcase className="text-cyan-600 dark:text-cyan-400" size={16} />
          <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wide">FII / DII Flow</h3>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center gap-1">
           <Info size={12}/> in ₹ Cr
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-sm">
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {data.flows.map((flow, index) => {
              const isNetPositive = flow.netAmount >= 0;
              const netPercent = Math.min(Math.abs(flow.netAmount) / (maxVal * 0.2) * 100, 100); 

              return (
                <tr key={index} className="hover:bg-slate-100/50 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="p-3 pl-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{flow.participant}</span>
                        <span className="text-slate-500 text-[10px] uppercase tracking-wide">{flow.segment}</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                       <div 
                         className={`h-full ${isNetPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                         style={{ width: `${Math.max(netPercent, 5)}%`, opacity: 0.9 }}
                       ></div>
                    </div>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <div className={`font-mono font-bold text-sm ${isNetPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isNetPositive ? '+' : ''}{flow.netAmount.toLocaleString()}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketFlowWidget;