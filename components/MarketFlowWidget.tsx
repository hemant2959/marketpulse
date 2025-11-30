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
    <div className="dashboard-card rounded-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2">
          <Briefcase className="text-cyan-600 dark:text-cyan-400" size={16} />
          <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wide">FII / DII Flow</h3>
        </div>
        <div className="text-[10px] text-slate-400 font-medium">₹ Crores</div>
      </div>
      
      <div className="overflow-x-auto flex-1 p-2">
        <table className="w-full text-left border-collapse text-sm">
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {data.flows.map((flow, index) => {
              const isNetPositive = flow.netAmount >= 0;
              const netPercent = Math.min(Math.abs(flow.netAmount) / (maxVal * 0.25) * 100, 100); 

              return (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{flow.participant}</span>
                        <span className="text-slate-400 text-[9px] uppercase tracking-wide font-medium">{flow.segment}</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                       <div 
                         className={`h-full rounded-full ${isNetPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                         style={{ width: `${Math.max(netPercent, 5)}%` }}
                       ></div>
                    </div>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap align-bottom">
                    <div className={`font-mono font-bold text-xs ${isNetPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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