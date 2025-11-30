import React, { useMemo, useState, useEffect } from 'react';
import { Stock, StockFlow } from '../types';
import { generateStockSpecificFlow } from '../services/stockService';
import StockChart from './StockChart';
import { X, TrendingUp, TrendingDown, BarChart2, Layers } from 'lucide-react';

interface Props {
  stock: Stock | null;
  onClose: () => void;
}

const StockDetailModal: React.FC<Props> = ({ stock, onClose }) => {
  const [animateFlow, setAnimateFlow] = useState(false);

  // Reset animation when stock changes
  useEffect(() => {
    setAnimateFlow(false);
    const timer = setTimeout(() => {
      setAnimateFlow(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [stock?.symbol]);

  // Generate flow data on the fly when modal opens for a specific stock
  const flowData: StockFlow = useMemo(() => {
    if (!stock) return { fii: { buy: 0, sell: 0, net: 0 }, dii: { buy: 0, sell: 0, net: 0 } };
    return generateStockSpecificFlow(stock);
  }, [stock]);
  
  if (!stock) return null;

  const isUp = stock.percentChange >= 0;
  const colorClass = isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const chartColor = isUp ? '#34d399' : '#fb7185';

  // Calculate scaling for flow bars
  // Find the maximum absolute value to normalize the bars (relative scale)
  // Use a minimum baseline (e.g., 5 Cr) to prevent tiny noise from looking like massive bars
  const maxFlowValue = Math.max(
    Math.abs(flowData.fii.net),
    Math.abs(flowData.dii.net),
    5
  );

  const getBarWidth = (value: number) => {
    if (!animateFlow) return '0%';
    // Scale up to 48% (leaving 2% gap/padding)
    const percentage = (Math.abs(value) / maxFlowValue) * 48;
    // Ensure very small non-zero values are at least visible (e.g., 1% width)
    return `${Math.max(percentage, 1)}%`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] ring-1 ring-black/5 dark:ring-white/10 transition-colors duration-300" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header with visual background */}
        <div className="relative p-6 border-b border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 transition-colors">
          <div className={`absolute inset-0 opacity-10 ${isUp ? 'bg-emerald-600' : 'bg-rose-600'}`}></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stock.symbol}</h2>
                <span className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide border border-slate-200 dark:border-slate-700">{stock.sector}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{stock.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-slate-100 dark:bg-slate-800/50 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors backdrop-blur-md border border-transparent dark:border-slate-700/50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white dark:bg-slate-900 transition-colors">
          
          {/* Main Price Stats */}
          <div className="flex items-end justify-between">
             <div>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wide">Current Price</span>
                <div className="text-4xl font-mono font-bold text-slate-900 dark:text-white mt-1 tracking-tight">₹{stock.price.toLocaleString()}</div>
             </div>
             <div className="text-right">
                <div className={`text-2xl font-mono font-bold flex items-center justify-end gap-2 ${colorClass}`}>
                  {isUp ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  {isUp ? '+' : ''}{stock.percentChange.toFixed(2)}%
                </div>
                <div className={`text-sm font-mono opacity-80 ${colorClass}`}>
                  {isUp ? '+' : ''}{stock.change.toFixed(2)}
                </div>
             </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex justify-between items-center transition-colors">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">High</span>
                <span className="text-slate-800 dark:text-white font-mono font-medium">₹{stock.high.toFixed(2)}</span>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex justify-between items-center transition-colors">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Low</span>
                <span className="text-slate-800 dark:text-white font-mono font-medium">₹{stock.low.toFixed(2)}</span>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex justify-between items-center transition-colors">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Vol</span>
                <span className="text-slate-800 dark:text-white font-mono font-medium">{(stock.volume/1000).toFixed(1)}K</span>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex justify-between items-center transition-colors">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">RSI</span>
                <span className={`font-mono font-bold text-sm ${stock.rsi > 70 ? 'text-rose-500' : stock.rsi < 30 ? 'text-emerald-500' : 'text-blue-500 dark:text-blue-400'}`}>
                  {stock.rsi.toFixed(0)}
                </span>
             </div>
          </div>

          {/* Chart Section */}
          <div className="bg-gradient-to-b from-slate-100/50 to-transparent dark:from-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 transition-colors">
             <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-slate-400 dark:text-slate-500"/>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Intraday Trend</h3>
             </div>
             <div className="h-48 w-full">
                <StockChart data={stock.history} color={chartColor} />
             </div>
          </div>

          {/* Institutional Flow Section */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-5"></div>
             <div className="relative z-10 p-4">
                <div className="flex items-center gap-2 mb-4">
                   <Layers size={16} className="text-indigo-500 dark:text-indigo-400" />
                   <h3 className="text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">Institutional Net Flow</h3>
                </div>
                
                <div className="space-y-5">
                   {/* FII Row */}
                   <div>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-slate-500 dark:text-slate-400">FII</span>
                         <span className={`text-sm font-mono font-bold ${flowData.fii.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {flowData.fii.net > 0 ? '+' : ''}{flowData.fii.net} Cr
                         </span>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex relative shadow-inner">
                         {/* Center Line */}
                         <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-700 z-10"></div>
                         
                         <div 
                           className={`absolute h-full rounded-full transition-all duration-1000 ease-out ${flowData.fii.net >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 left-1/2 rounded-l-none' : 'bg-gradient-to-l from-rose-500 to-rose-400 right-1/2 rounded-r-none'}`}
                           style={{ width: getBarWidth(flowData.fii.net) }}
                         ></div>
                      </div>
                   </div>

                   {/* DII Row */}
                   <div>
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-slate-500 dark:text-slate-400">DII</span>
                         <span className={`text-sm font-mono font-bold ${flowData.dii.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {flowData.dii.net > 0 ? '+' : ''}{flowData.dii.net} Cr
                         </span>
                      </div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex relative shadow-inner">
                         {/* Center Line */}
                         <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-700 z-10"></div>

                         <div 
                           className={`absolute h-full rounded-full transition-all duration-1000 ease-out ${flowData.dii.net >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 left-1/2 rounded-l-none' : 'bg-gradient-to-l from-rose-500 to-rose-400 right-1/2 rounded-r-none'}`}
                           style={{ width: getBarWidth(flowData.dii.net) }}
                         ></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailModal;