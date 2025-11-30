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

  useEffect(() => {
    setAnimateFlow(false);
    const timer = setTimeout(() => {
      setAnimateFlow(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [stock?.symbol]);

  const flowData: StockFlow = useMemo(() => {
    if (!stock) return { fii: { buy: 0, sell: 0, net: 0 }, dii: { buy: 0, sell: 0, net: 0 } };
    return generateStockSpecificFlow(stock);
  }, [stock]);
  
  if (!stock) return null;

  const isUp = stock.percentChange >= 0;
  const colorClass = isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  const chartColor = isUp ? '#10b981' : '#f43f5e';

  const maxFlowValue = Math.max(Math.abs(flowData.fii.net), Math.abs(flowData.dii.net), 5);

  const getBarWidth = (value: number) => {
    if (!animateFlow) return '0%';
    const percentage = (Math.abs(value) / maxFlowValue) * 48;
    return `${Math.max(percentage, 1)}%`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{stock.symbol}</h2>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">{stock.sector}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{stock.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950/50">
          
          {/* Price Header */}
          <div className="flex items-end justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">LTP</span>
                <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white mt-1">₹{stock.price.toLocaleString()}</div>
             </div>
             <div className="text-right">
                <div className={`text-xl font-mono font-bold flex items-center justify-end gap-1 ${colorClass}`}>
                  {isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  {isUp ? '+' : ''}{stock.percentChange.toFixed(2)}%
                </div>
                <div className={`text-sm font-mono opacity-80 ${colorClass}`}>
                  {isUp ? '+' : ''}{stock.change.toFixed(2)}
                </div>
             </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">High</span>
                <span className="text-slate-900 dark:text-white font-mono font-medium">₹{stock.high.toFixed(2)}</span>
             </div>
             <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Low</span>
                <span className="text-slate-900 dark:text-white font-mono font-medium">₹{stock.low.toFixed(2)}</span>
             </div>
             <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Volume</span>
                <span className="text-slate-900 dark:text-white font-mono font-medium">{(stock.volume/1000).toFixed(1)}K</span>
             </div>
             <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">RSI</span>
                <span className={`font-mono font-bold ${stock.rsi > 70 ? 'text-rose-500' : stock.rsi < 30 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                  {stock.rsi.toFixed(0)}
                </span>
             </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-slate-400"/>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Price Action</h3>
             </div>
             <div className="h-40 w-full">
                <StockChart data={stock.history} color={chartColor} />
             </div>
          </div>

          {/* Institutional Flow Section */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
               <Layers size={16} className="text-indigo-500" />
               <h3 className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">Smart Money Flow</h3>
            </div>
            
            <div className="space-y-4">
               {/* FII Row */}
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-slate-500">FII Net</span>
                     <span className={`text-sm font-mono font-bold ${flowData.fii.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {flowData.fii.net > 0 ? '+' : ''}{flowData.fii.net} Cr
                     </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
                     <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-600 z-10"></div>
                     <div 
                       className={`absolute h-full rounded-full transition-all duration-1000 ease-out ${flowData.fii.net >= 0 ? 'bg-emerald-500 left-1/2 rounded-l-none' : 'bg-rose-500 right-1/2 rounded-r-none'}`}
                       style={{ width: getBarWidth(flowData.fii.net) }}
                     ></div>
                  </div>
               </div>

               {/* DII Row */}
               <div>
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-slate-500">DII Net</span>
                     <span className={`text-sm font-mono font-bold ${flowData.dii.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {flowData.dii.net > 0 ? '+' : ''}{flowData.dii.net} Cr
                     </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
                     <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-600 z-10"></div>
                     <div 
                       className={`absolute h-full rounded-full transition-all duration-1000 ease-out ${flowData.dii.net >= 0 ? 'bg-emerald-500 left-1/2 rounded-l-none' : 'bg-rose-500 right-1/2 rounded-r-none'}`}
                       style={{ width: getBarWidth(flowData.dii.net) }}
                     ></div>
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